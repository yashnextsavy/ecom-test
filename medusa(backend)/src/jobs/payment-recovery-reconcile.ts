import { MedusaContainer } from "@medusajs/framework/types"
import crypto from "crypto"
import { PAYMENT_RECOVERY_MODULE } from "../modules/payment-recovery"

type RecoveryEntry = {
  id: string
  cart_id: string
  payment_session_id: string
  txnid?: string | null
  status: string
  attempt_count: number
  max_attempts: number
  next_retry_at?: string | Date | null
  created_at?: string | Date | null
  last_attempt_at?: string | Date | null
  last_error?: string | null
  order_id?: string | null
}

type PaymentSessionRow = {
  id: string
  provider_id?: string | null
  status?: string | null
  data?: Record<string, unknown> | null
}

const PENDING_STATUSES = new Set(["pending", "retrying"])
const SUCCESSFUL_COMPLETE_STATUSES = new Set([200, 201, 202, 409])
const SUCCESSFUL_SESSION_STATUSES = new Set(["captured", "authorized"])
const SUCCESSFUL_GATEWAY_STATUSES = new Set(["success", "successful", "captured", "authorized"])
const FAILURE_GATEWAY_STATUSES = new Set([
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
const RECOVERY_INITIAL_DELAY_MS = Number(process.env.PAYMENT_RECOVERY_INITIAL_DELAY_MS || 120_000)

const getErrorText = (data: any): string => {
  return String(
    data?.message || data?.error?.message || data?.error || data?.type || ""
  ).toLowerCase()
}

const firstString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return ""
}

const isRecoverableResponse = (status: number, data: any): boolean => {
  if (SUCCESSFUL_COMPLETE_STATUSES.has(status)) {
    return true
  }

  const errorText = getErrorText(data)

  if (status >= 500) {
    if (
      errorText.includes("unknown") ||
      errorText.includes("timeout") ||
      errorText.includes("temporarily")
    ) {
      return true
    }
  }

  if (status === 403 && errorText.includes("otp")) {
    return true
  }

  return (
    errorText.includes("idempotency") ||
    errorText.includes("conflict") ||
    errorText.includes("in progress") ||
    errorText.includes("already")
  )
}

const toDate = (value?: string | Date | null): Date => {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === "string" && value.trim()) {
    return new Date(value)
  }

  return new Date(0)
}

const toSafeSegment = (value: string): string => {
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

const normalizeStatus = (value: unknown): string => {
  if (typeof value !== "string") {
    return ""
  }
  return value.trim().toLowerCase()
}

const nextRetryAt = (attemptCount: number): Date => {
  const delay = Math.min(15 * 60 * 1000, Math.floor(8000 * Math.pow(1.7, attemptCount)))
  return new Date(Date.now() + delay)
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

const getFirstString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return ""
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

const getEasebuzzRetrieveEndpoint = () => {
  const env = String(process.env.EASEBUZZ_ENV || "test")
    .trim()
    .toLowerCase()
  return env === "production"
    ? "https://dashboard.easebuzz.in/transaction/v2.1/retrieve"
    : "https://testdashboard.easebuzz.in/transaction/v2.1/retrieve"
}

const buildEasebuzzRetrieveHash = (key: string, txnid: string, salt: string) => {
  return crypto.createHash("sha512").update(`${key}|${txnid}|${salt}`).digest("hex")
}

const verifyGatewayTransaction = async (txnid: string) => {
  const key = process.env.EASEBUZZ_KEY
  const salt = process.env.EASEBUZZ_SALT

  if (!key || !salt || !txnid) {
    return {
      ok: false,
      status: "unknown",
      reason: "missing_config_or_txnid",
      details: null as any,
    }
  }

  const endpoint = getEasebuzzRetrieveEndpoint()
  const hash = buildEasebuzzRetrieveHash(key, txnid, salt)
  const body = new URLSearchParams({
    key,
    txnid,
    hash,
  })

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  })

  const data = await response.json().catch(() => null)
  const msgItem = Array.isArray(data?.msg) ? data.msg[0] : null
  const gatewayStatus = normalizeStatus(
    firstString(msgItem?.status, msgItem?.unmappedstatus, data?.status)
  )

  if (SUCCESSFUL_GATEWAY_STATUSES.has(gatewayStatus)) {
    return {
      ok: true,
      status: "success",
      reason: "gateway_success",
      details: data,
    }
  }

  if (FAILURE_GATEWAY_STATUSES.has(gatewayStatus)) {
    return {
      ok: true,
      status: "failure",
      reason: "gateway_failure",
      details: data,
    }
  }

  return {
    ok: true,
    status: "unknown",
    reason: gatewayStatus || "gateway_status_unknown",
    details: data,
  }
}

const attemptCompleteCart = async (
  backendBaseUrl: string,
  publishableKey: string,
  entry: RecoveryEntry
) => {
  const idempotencyKey = `recovery_${toSafeSegment(entry.cart_id)}_${toSafeSegment(
    entry.payment_session_id || entry.txnid || entry.id
  )}`

  const res = await fetch(`${backendBaseUrl}/store/carts/${entry.cart_id}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": publishableKey,
      "Idempotency-Key": idempotencyKey,
    },
    cache: "no-store",
  })

  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

const seedRecoveryEntriesFromCapturedSessions = async (
  query: any,
  createMethod: any,
  updateMethod: any
) => {
  const { data: sessions } = await query.graph({
    entity: "payment_session",
    fields: ["id", "provider_id", "status", "data"],
    filters: {
      provider_id: "pp_easebuzz_default",
      status: ["captured", "authorized"],
    },
  })

  const recentSessions = ((sessions as PaymentSessionRow[] | undefined) || []).slice(0, 200)

  for (const session of recentSessions) {
    const providerId = String(session.provider_id || "").trim()
    const status = String(session.status || "").trim().toLowerCase()
    if (providerId !== "pp_easebuzz_default" || !SUCCESSFUL_SESSION_STATUSES.has(status)) {
      continue
    }

    const data = session.data && typeof session.data === "object" ? session.data : {}
    const cartId = getFirstString(
      (data as any).udf5,
      (data as any).cart_id,
      (data as any).cartId
    )

    if (!cartId) {
      continue
    }

    const orderId = await resolveCartOrderId(query, cartId)
    if (orderId) {
      continue
    }

    const { data: existingRows } = await query.graph({
      entity: "payment_recovery_entry",
      fields: ["id", "status", "attempt_count", "next_retry_at"],
      filters: {
        payment_session_id: session.id,
      },
    })
    const existing = (
      existingRows as
        | Array<{
            id: string
            status?: string
            attempt_count?: number
            next_retry_at?: string | Date | null
          }>
        | undefined
    )?.[0]

    const payload = {
      provider_id: "pp_easebuzz_default",
      payment_session_id: session.id,
      cart_id: cartId,
      txnid: getFirstString((data as any).txnid, (data as any).easebuzz_txnid) || null,
      status: "pending" as const,
      next_retry_at: new Date(Date.now() + RECOVERY_INITIAL_DELAY_MS),
      last_error: null,
      payload: {
        ...(data as Record<string, unknown>),
        payment_session_id: session.id,
        cart_id: cartId,
        gateway_status: status,
      },
    }

    if (existing?.id) {
      const existingStatus = normalizeStatus(existing.status)

      // Keep active retry state untouched to avoid clashing with live callback completion
      // and to preserve exponential backoff.
      if (PENDING_STATUSES.has(existingStatus)) {
        continue
      }

      if (existingStatus === "completed") {
        continue
      }

      // Revive only terminal non-completed states.
      await updateMethod({
        id: existing.id,
        ...payload,
        attempt_count: existing.attempt_count || 0,
      })
      continue
    }

    await createMethod({
      ...payload,
      attempt_count: 0,
      max_attempts: 120,
    })
  }
}

export default async function paymentRecoveryReconcileJob(container: MedusaContainer) {
  const publishableKey = process.env.MEDUSA_PUBLISHABLE_API_KEY
  if (!publishableKey) {
    console.error("[payment-recovery] MEDUSA_PUBLISHABLE_API_KEY is missing")
    return
  }

  const backendBaseUrl = (
    process.env.MEDUSA_BACKEND_URL || process.env.BACKEND_URL || "http://127.0.0.1:9000"
  ).replace(/\/$/, "")

  const query = container.resolve("query") as any
  const recoveryService = container.resolve(PAYMENT_RECOVERY_MODULE)
  const createMethod = resolveCreateMethod(recoveryService)
  const updateMethod = resolveUpdateMethod(recoveryService)

  if (!createMethod || !updateMethod) {
    console.error("[payment-recovery] create/update methods are missing on recovery service")
    return
  }

  await seedRecoveryEntriesFromCapturedSessions(query, createMethod, updateMethod)

  const { data: rows } = await query.graph({
    entity: "payment_recovery_entry",
    fields: ["*"],
    filters: {
      status: ["pending", "retrying"],
    },
  })

  const entries = ((rows as RecoveryEntry[] | undefined) || [])
    .filter((row) => PENDING_STATUSES.has(String(row.status || "").toLowerCase()))
    .sort((a, b) => toDate(a.next_retry_at).getTime() - toDate(b.next_retry_at).getTime())
    .slice(0, 50)

  for (const entry of entries) {
    const now = Date.now()
    const createdAtMs = toDate(entry.created_at).getTime()
    const isFreshNeverAttempted =
      (entry.attempt_count || 0) === 0 &&
      !entry.last_attempt_at &&
      createdAtMs > 0 &&
      now - createdAtMs < RECOVERY_INITIAL_DELAY_MS

    if (isFreshNeverAttempted) {
      continue
    }

    if (toDate(entry.next_retry_at).getTime() > now) {
      continue
    }

    if ((entry.attempt_count || 0) >= (entry.max_attempts || 60)) {
      await updateMethod({
        id: entry.id,
        status: "failed",
        last_error: "Maximum retries reached before cart completion",
      })
      continue
    }

    const existingOrderId = await resolveCartOrderId(query, entry.cart_id)
    if (existingOrderId) {
      await updateMethod({
        id: entry.id,
        status: "completed",
        order_id: existingOrderId,
        last_error: null,
        next_retry_at: new Date(),
      })
      continue
    }

    const gatewayCheck = await verifyGatewayTransaction(entry.txnid || "")
    if (gatewayCheck.ok && gatewayCheck.status === "failure") {
      await updateMethod({
        id: entry.id,
        status: "gateway_failed",
        attempt_count: (entry.attempt_count || 0) + 1,
        last_attempt_at: new Date(),
        last_error: "Gateway verification reported failed transaction",
        next_retry_at: new Date(),
        payload: {
          ...(entry as any).payload,
          gateway_retrieve: gatewayCheck.details,
        },
      })
      continue
    }

    const result = await attemptCompleteCart(backendBaseUrl, publishableKey, entry)
    const refreshedOrderId = await resolveCartOrderId(query, entry.cart_id)

    if (refreshedOrderId) {
      await updateMethod({
        id: entry.id,
        status: "completed",
        order_id: refreshedOrderId,
        attempt_count: (entry.attempt_count || 0) + 1,
        last_attempt_at: new Date(),
        last_error: null,
        next_retry_at: new Date(),
      })
      continue
    }

    const recoverable = isRecoverableResponse(result.status, result.data)
    const verifiedSuccess = gatewayCheck.ok && gatewayCheck.status === "success"
    const shouldRetry = recoverable || verifiedSuccess
    await updateMethod({
      id: entry.id,
      status: shouldRetry ? "retrying" : "failed",
      attempt_count: (entry.attempt_count || 0) + 1,
      last_attempt_at: new Date(),
      last_error:
        result.data?.message ||
        result.data?.error?.message ||
        result.data?.error ||
        `cart complete failed with status ${result.status}`,
      next_retry_at: shouldRetry ? nextRetryAt((entry.attempt_count || 0) + 1) : new Date(),
      payload: {
        ...(entry as any).payload,
        gateway_retrieve: gatewayCheck.details,
      },
    })
  }
}

export const config = {
  name: "payment-recovery-reconcile",
  schedule: "*/1 * * * *",
}
