import crypto from "crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { PAYMENT_RECOVERY_MODULE } from "../../../modules/payment-recovery"

type PaymentSessionRecord = {
  id: string
  amount: number
  currency_code: string
  data?: Record<string, unknown> | null
}

type PaymentRecoveryRow = {
  id: string
  status?: string
  order_id?: string | null
  cart_id?: string | null
}

type RecoveryState =
  | "pending"
  | "retrying"
  | "awaiting_gateway"
  | "gateway_failed"
  | "completed"
  | "failed"
  | "pending_review"
  | "refunded"

const SUCCESSFUL_CALLBACK_STATUSES = new Set([
  "success",
  "successful",
  "captured",
  "authorized",
])

const FAILURE_CALLBACK_STATUSES = new Set([
  "failed",
  "failure",
  "dropped",
  "cancelled",
  "canceled",
  "aborted",
  "declined",
  "rejected",
  "timeout",
  "timed_out",
  "user_cancelled",
  "user_canceled",
])

const PENDING_CALLBACK_STATUSES = new Set([
  "pending",
  "processing",
  "in_progress",
  "created",
  "initiated",
  "submitted",
])

const REFUND_CALLBACK_STATUSES = new Set([
  "refund",
  "refunded",
  "refund_initiated",
  "partial_refund",
  "partially_refunded",
])

const CALLBACK_LOCKS = new Map<string, number>()
const CALLBACK_LOCK_TTL_MS = Number(process.env.EASEBUZZ_CALLBACK_LOCK_TTL_MS || 120_000)

const firstNonEmptyString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return ""
}

const toStringRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== "object") {
    return {}
  }

  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v === undefined || v === null) {
      continue
    }
    out[k] = typeof v === "string" ? v : String(v)
  }
  return out
}

const normalizeStatus = (value: unknown): string => {
  if (typeof value !== "string") {
    return ""
  }
  return value.trim().toLowerCase()
}

const deriveRecoveryState = (gatewayStatus: string): RecoveryState => {
  if (SUCCESSFUL_CALLBACK_STATUSES.has(gatewayStatus)) {
    return "pending"
  }

  if (FAILURE_CALLBACK_STATUSES.has(gatewayStatus)) {
    return "gateway_failed"
  }

  if (REFUND_CALLBACK_STATUSES.has(gatewayStatus)) {
    return "refunded"
  }

  if (PENDING_CALLBACK_STATUSES.has(gatewayStatus) || gatewayStatus === "") {
    return "awaiting_gateway"
  }

  return "pending_review"
}

const escapeForScript = (value: string): string => {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
}

const buildHtmlRedirect = (redirectTo: string, payload: Record<string, string>): string => {
  const safeRedirect = JSON.stringify(redirectTo)
  const safePayload = JSON.stringify(payload)

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting...</title>
</head>
<body>
  <script>
    try {
      sessionStorage.setItem("easebuzz_callback_payload", \`${escapeForScript(safePayload)}\`);
    } catch (_e) {}
    // Clear checkout locks so a failure/success return in a new tab doesn't block retries.
    try { localStorage.removeItem("checkout_payment_lock_v1"); } catch (_e) {}
    try { sessionStorage.removeItem("checkout_in_progress"); } catch (_e) {}
    window.location.replace(${safeRedirect});
  </script>
  <noscript>
    <p>Payment processed. <a href=${safeRedirect}>Continue</a></p>
  </noscript>
</body>
</html>`
}

const resolveFrontendOrigin = (): string => {
  const explicit = firstNonEmptyString(
    process.env.EASEBUZZ_FRONTEND_BASE_URL,
    process.env.FRONTEND_BASE_URL,
    process.env.NEXT_PUBLIC_BASE_URL
  )

  if (explicit) {
    try {
      return new URL(explicit).origin
    } catch {
      // ignore invalid explicit origin
    }
  }

  const backendUrl = firstNonEmptyString(
    process.env.MEDUSA_BACKEND_URL,
    process.env.BACKEND_URL
  )
  const backendOrigin = (() => {
    try {
      return backendUrl ? new URL(backendUrl).origin : ""
    } catch {
      return ""
    }
  })()

  const corsCandidates = String(process.env.STORE_CORS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  for (const candidate of corsCandidates) {
    try {
      const origin = new URL(candidate).origin
      // Prefer a store CORS origin that isn't the backend itself.
      if (!backendOrigin || origin !== backendOrigin) {
        return origin
      }
    } catch {
      // ignore invalid cors origin
    }
  }

  return "http://localhost:3001"
}

const buildRedirectUrl = (input: {
  payload: Record<string, string>
  gatewayStatus: string
  cartId: string
  txnid: string
  orderId: string
  reason: string
  completeStatus: string
}): string => {
  const redirectUrl = new URL(
    SUCCESSFUL_CALLBACK_STATUSES.has(input.gatewayStatus)
      ? "/checkout/payment/success"
      : "/payment-failure",
    resolveFrontendOrigin()
  )

  redirectUrl.searchParams.set("gateway", "easebuzz")
  redirectUrl.searchParams.set("status", input.gatewayStatus || "unknown")
  redirectUrl.searchParams.set("complete_status", input.completeStatus || "skipped")

  if (input.cartId) {
    redirectUrl.searchParams.set("cart_id", input.cartId)
  }
  if (input.txnid) {
    redirectUrl.searchParams.set("txnid", input.txnid)
  }
  if (input.orderId) {
    redirectUrl.searchParams.set("order_id", input.orderId)
  }
  if (input.reason) {
    redirectUrl.searchParams.set("reason", input.reason)
  }

  const payloadJson = JSON.stringify(input.payload)
  redirectUrl.searchParams.set("eb_payload", payloadJson)

  return redirectUrl.toString()
}

const sanitizeIdempotencyToken = (value: string): string => {
  let out = ""
  for (const ch of value.toLowerCase()) {
    if ((ch >= "a" && ch <= "z") || (ch >= "0" && ch <= "9") || ch === "_" || ch === "-") {
      out += ch
    } else {
      out += "_"
    }
  }
  out = out.replace(/^_+|_+$/g, "").replace(/_+/g, "_")
  return out.slice(0, 64)
}

const buildCompletionIdempotencyKey = (cartId: string, attemptId: string, provided?: string): string => {
  const explicit = sanitizeIdempotencyToken(provided || "")
  if (explicit) {
    return explicit.slice(0, 128)
  }

  const safeCart = sanitizeIdempotencyToken(cartId) || "cart"
  const safeAttempt = sanitizeIdempotencyToken(attemptId) || "attempt"
  return `complete_${safeCart}_${safeAttempt}`.slice(0, 128)
}

const resolveCreateMethod = (service: any) => {
  if (typeof service.createPaymentRecoveryEntries === "function") {
    return service.createPaymentRecoveryEntries.bind(service)
  }
  if (typeof service.createPaymentRecoveryEntry === "function") {
    return service.createPaymentRecoveryEntry.bind(service)
  }
  if (typeof service.create === "function") {
    return service.create.bind(service)
  }
  return null
}

const resolveUpdateMethod = (service: any) => {
  if (typeof service.updatePaymentRecoveryEntries === "function") {
    return service.updatePaymentRecoveryEntries.bind(service)
  }
  if (typeof service.updatePaymentRecoveryEntry === "function") {
    return service.updatePaymentRecoveryEntry.bind(service)
  }
  if (typeof service.update === "function") {
    return service.update.bind(service)
  }
  return null
}

const acquireCallbackLock = (key: string): boolean => {
  const now = Date.now()
  const current = CALLBACK_LOCKS.get(key)
  if (current && now - current < CALLBACK_LOCK_TTL_MS) {
    return false
  }
  CALLBACK_LOCKS.set(key, now)
  return true
}

const releaseCallbackLock = (key: string): void => {
  CALLBACK_LOCKS.delete(key)
}

const extractPayload = (req: MedusaRequest): Record<string, string> => {
  const anyReq = req as MedusaRequest & {
    body?: unknown
    query?: Record<string, unknown>
    rawBody?: unknown
  }

  const bodyRecord = toStringRecord(anyReq.body)
  const bodyWithFallback: Record<string, string> = { ...bodyRecord }

  if (Object.keys(bodyWithFallback).length === 0 && typeof anyReq.rawBody === "string") {
    try {
      const parsed = new URLSearchParams(anyReq.rawBody)
      for (const [k, v] of parsed.entries()) {
        bodyWithFallback[k] = v
      }
    } catch {
      // ignore raw body parse failures
    }
  }

  const queryRecord = toStringRecord(anyReq.query)
  return {
    ...queryRecord,
    ...bodyWithFallback,
  }
}

const computeExpectedResponseHash = (payload: Record<string, string>): string => {
  const key = firstNonEmptyString(process.env.EASEBUZZ_KEY)
  const salt = firstNonEmptyString(process.env.EASEBUZZ_SALT)
  const status = firstNonEmptyString(
    payload.status,
    payload.tx_status,
    payload.payment_status,
    payload.result
  )

  const reverseHashFields = [
    salt,
    status,
    "",
    "",
    "",
    "",
    "",
    firstNonEmptyString(payload.udf5, payload.cart_id, payload.cartId),
    firstNonEmptyString(payload.udf4),
    firstNonEmptyString(payload.udf3),
    firstNonEmptyString(payload.udf2),
    firstNonEmptyString(payload.udf1, payload.payment_session_id, payload.session_id),
    firstNonEmptyString(payload.email),
    firstNonEmptyString(payload.firstname),
    firstNonEmptyString(payload.productinfo),
    firstNonEmptyString(payload.amount),
    firstNonEmptyString(payload.txnid, payload.easebuzz_txnid),
    key,
  ]

  return crypto.createHash("sha512").update(reverseHashFields.join("|")).digest("hex")
}

const verifyEasebuzzHash = (payload: Record<string, string>): boolean => {
  const key = firstNonEmptyString(process.env.EASEBUZZ_KEY)
  const salt = firstNonEmptyString(process.env.EASEBUZZ_SALT)
  const receivedHash = firstNonEmptyString(payload.hash).toLowerCase()
  if (!key || !salt || !receivedHash) {
    return false
  }
  const expected = computeExpectedResponseHash(payload).toLowerCase()
  return expected === receivedHash
}

const attemptCompleteCart = async (
  cartId: string,
  idempotencyKey: string
): Promise<{ status: number; data: any }> => {
  const backendBaseUrl = (
    process.env.MEDUSA_BACKEND_URL || process.env.BACKEND_URL || "http://127.0.0.1:9000"
  ).replace(/\/$/, "")
  const publishableKey = firstNonEmptyString(process.env.MEDUSA_PUBLISHABLE_API_KEY)

  if (!publishableKey) {
    return {
      status: 500,
      data: { message: "MEDUSA_PUBLISHABLE_API_KEY is missing for cart completion." },
    }
  }

  const response = await fetch(`${backendBaseUrl}/store/carts/${cartId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": publishableKey,
      "Idempotency-Key": idempotencyKey,
    },
    cache: "no-store",
  })

  const data = await response.json().catch(() => null)
  return {
    status: response.status,
    data,
  }
}

const resolveCartOrderId = async (query: any, cartId: string): Promise<string> => {
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "order_id", "order.id"],
    filters: {
      id: cartId,
    },
  })

  const cart = (carts as Array<{ order_id?: string | null; order?: { id?: string | null } }> | undefined)?.[0]
  return String(cart?.order?.id || cart?.order_id || "")
}

const respond = (
  req: MedusaRequest,
  res: MedusaResponse,
  params: {
    payload: Record<string, string>
    gatewayStatus: string
    cartId: string
    txnid: string
    orderId: string
    reason: string
    completeStatus: string
    httpStatus?: number
    jsonBody?: Record<string, unknown>
  }
) => {
  const acceptHeader = firstNonEmptyString((req.headers?.accept as string) || "")
  const acceptLower = acceptHeader.toLowerCase()
  const shouldHtml =
    acceptLower === "" ||
    acceptLower.includes("text/html") ||
    acceptLower.includes("*/*")

  if (shouldHtml) {
    const redirectTo = buildRedirectUrl(params)
    res.status(params.httpStatus || 200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(buildHtmlRedirect(redirectTo, params.payload))
    return
  }

  res.status(params.httpStatus || 200).json(
    params.jsonBody || {
      status: "ok",
      gateway_status: params.gatewayStatus,
      cart_id: params.cartId || null,
      txnid: params.txnid || null,
      order_id: params.orderId || null,
      complete_status: params.completeStatus || "skipped",
      reason: params.reason || null,
    }
  )
}

const processCallback = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const payload = extractPayload(req)
  const gatewayStatus = normalizeStatus(
    firstNonEmptyString(payload.status, payload.tx_status, payload.payment_status, payload.result)
  )
  const sessionId = firstNonEmptyString(payload.udf1, payload.payment_session_id, payload.session_id)
  const txnid = firstNonEmptyString(payload.txnid, payload.easebuzz_txnid, payload.easepayid)

  const query = req.scope.resolve("query")
  const recoveryService = req.scope.resolve(PAYMENT_RECOVERY_MODULE)
  const createMethod = resolveCreateMethod(recoveryService)
  const updateMethod = resolveUpdateMethod(recoveryService)

  if (!createMethod || !updateMethod) {
    respond(req, res, {
      payload,
      gatewayStatus,
      cartId: "",
      txnid,
      orderId: "",
      reason: "recovery_service_unavailable",
      completeStatus: "failed",
      httpStatus: 500,
      jsonBody: { message: "Payment recovery service is not available." },
    })
    return
  }

  if (!verifyEasebuzzHash(payload)) {
    console.error("[Easebuzz Callback] Invalid hash", { txnid, sessionId, gatewayStatus })
    respond(req, res, {
      payload,
      gatewayStatus,
      cartId: firstNonEmptyString(payload.udf5, payload.cart_id, payload.cartId),
      txnid,
      orderId: "",
      reason: "invalid_hash",
      completeStatus: "skipped",
      httpStatus: 400,
      jsonBody: { message: "Invalid payment response hash." },
    })
    return
  }

  if (!sessionId) {
    respond(req, res, {
      payload,
      gatewayStatus,
      cartId: firstNonEmptyString(payload.udf5, payload.cart_id, payload.cartId),
      txnid,
      orderId: "",
      reason: "missing_payment_session",
      completeStatus: "failed",
      httpStatus: 400,
      jsonBody: { message: "payment_session_id (or udf1) is required." },
    })
    return
  }

  const callbackKey = firstNonEmptyString(txnid, sessionId)
  if (!acquireCallbackLock(callbackKey)) {
    respond(req, res, {
      payload,
      gatewayStatus,
      cartId: firstNonEmptyString(payload.udf5, payload.cart_id, payload.cartId),
      txnid,
      orderId: "",
      reason: "already_processing",
      completeStatus: "in_progress",
      jsonBody: {
        status: "already_processing",
        txnid: txnid || null,
        payment_session_id: sessionId,
      },
    })
    return
  }

  try {
    const { data: sessionRows } = await query.graph({
      entity: "payment_session",
      fields: ["id", "amount", "currency_code", "data"],
      filters: {
        id: sessionId,
      },
    })

    const paymentSession = (sessionRows as PaymentSessionRecord[] | undefined)?.[0]
    if (!paymentSession) {
      respond(req, res, {
        payload,
        gatewayStatus,
        cartId: firstNonEmptyString(payload.udf5, payload.cart_id, payload.cartId),
        txnid,
        orderId: "",
        reason: "payment_session_not_found",
        completeStatus: "failed",
        httpStatus: 404,
        jsonBody: { message: `Payment session ${sessionId} not found.` },
      })
      return
    }

    const resolvedCartId = firstNonEmptyString(
      payload.udf5,
      payload.cart_id,
      payload.cartId,
      paymentSession.data?.udf5,
      paymentSession.data?.cart_id,
      paymentSession.data?.cartId
    )

    const paymentModuleService = req.scope.resolve(Modules.PAYMENT) as {
      updatePaymentSession: (input: {
        id: string
        amount: number
        currency_code: string
        data: Record<string, unknown>
      }) => Promise<unknown>
    }

    await paymentModuleService.updatePaymentSession({
      id: paymentSession.id,
      amount: paymentSession.amount,
      currency_code: paymentSession.currency_code,
      data: {
        ...(paymentSession.data || {}),
        ...payload,
      },
    })

    const { data: existingBySessionRows } = await query.graph({
      entity: "payment_recovery_entry",
      fields: ["id", "status", "order_id", "cart_id"],
      filters: {
        payment_session_id: sessionId,
      },
    })
    const existingBySession = (existingBySessionRows as PaymentRecoveryRow[] | undefined)?.[0]

    let existingByTxn: PaymentRecoveryRow | undefined
    if (txnid) {
      const { data: existingByTxnRows } = await query.graph({
        entity: "payment_recovery_entry",
        fields: ["id", "status", "order_id", "cart_id"],
        filters: {
          txnid,
        },
      })
      existingByTxn = (existingByTxnRows as PaymentRecoveryRow[] | undefined)?.[0]
    }

    const existingEntry = existingBySession || existingByTxn
    const existingStatus = normalizeStatus(existingEntry?.status)
    if (existingEntry?.id && (existingStatus === "completed" || existingStatus === "gateway_failed")) {
      const existingOrderId = firstNonEmptyString(existingEntry.order_id)
      respond(req, res, {
        payload,
        gatewayStatus,
        cartId: resolvedCartId || firstNonEmptyString(existingEntry.cart_id),
        txnid,
        orderId: existingOrderId,
        reason: "already_processed",
        completeStatus: existingOrderId ? "completed" : "skipped",
        jsonBody: {
          status: "already_processed",
          txnid: txnid || null,
          payment_session_id: sessionId,
          order_id: existingOrderId || null,
        },
      })
      return
    }

    const derivedState = deriveRecoveryState(gatewayStatus)
    const shouldCompleteCart = SUCCESSFUL_CALLBACK_STATUSES.has(gatewayStatus)
    const completionIdempotencyKey = buildCompletionIdempotencyKey(
      resolvedCartId,
      firstNonEmptyString(sessionId, txnid),
      firstNonEmptyString(payload.udf2, payload.idempotency_key, payload.completion_idempotency_key)
    )

    let completeStatus = "skipped"
    let completionReason = ""
    let completionResultData: any = null
    let orderId = resolvedCartId ? await resolveCartOrderId(query, resolvedCartId) : ""

    if (shouldCompleteCart && resolvedCartId && !orderId) {
      const completion = await attemptCompleteCart(resolvedCartId, completionIdempotencyKey)
      completionResultData = completion.data

      if (completion.status === 200 || completion.status === 201 || completion.status === 202) {
        completeStatus = "completed_or_pending"
      } else if (completion.status === 409) {
        completeStatus = "already_completed_or_in_progress"
      } else {
        completeStatus = "failed"
        completionReason = String(
          completion.data?.message || completion.data?.error?.message || completion.data?.error || ""
        )
      }

      orderId = await resolveCartOrderId(query, resolvedCartId)
    } else if (shouldCompleteCart && !resolvedCartId) {
      completeStatus = "missing_cart_id"
      completionReason = "missing_cart_id"
    } else if (!shouldCompleteCart) {
      completeStatus = "skipped_not_success"
      completionReason = "gateway_status_not_success"
    }

    const recoveryPayload = {
      provider_id: "pp_easebuzz_default",
      payment_session_id: sessionId,
      cart_id: resolvedCartId || "",
      txnid: txnid || null,
      status:
        orderId !== ""
          ? "completed"
          : shouldCompleteCart
          ? "retrying"
          : (derivedState as RecoveryState),
      next_retry_at: new Date(),
      last_error:
        completionReason || (shouldCompleteCart && orderId === "" ? "Order not yet attached to cart." : null),
      order_id: orderId || null,
      payload: {
        ...payload,
        gateway_status: gatewayStatus || "unknown",
        completion_idempotency_key: completionIdempotencyKey,
        completion_status: completeStatus,
        completion_result: completionResultData,
      },
    }

    if (existingBySession?.id) {
      await updateMethod({
        id: existingBySession.id,
        ...recoveryPayload,
      })
    } else {
      await createMethod({
        ...recoveryPayload,
        attempt_count: 0,
        max_attempts: shouldCompleteCart ? 120 : 0,
      })
    }

    console.log("[Easebuzz Callback]", {
      txnid,
      session_id: sessionId,
      status: gatewayStatus,
      cart_id: resolvedCartId,
      order_id: orderId || null,
      complete_status: completeStatus,
      time: Date.now(),
    })

    respond(req, res, {
      payload,
      gatewayStatus,
      cartId: resolvedCartId,
      txnid,
      orderId,
      reason: completionReason,
      completeStatus: completeStatus || "skipped",
    })
  } finally {
    releaseCallbackLock(callbackKey)
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  await processCallback(req, res)
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  await processCallback(req, res)
}
