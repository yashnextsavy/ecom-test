import { createHash } from "crypto"

function toRecordFromEntries(entries: Iterable<[string, string]>) {
  const payload: Record<string, string> = {}
  for (const [key, value] of entries) {
    payload[key] = value
  }
  return payload
}

function requiredEnv(name: "MEDUSA_API_BASE_URL" | "MEDUSA_PUBLISHABLE_API_KEY") {
  const value = process.env[name]
  if (value == null || value === "") {
    throw new Error(`Missing required env: ${name}`)
  }
  return value
}

const BASE_URL = requiredEnv("MEDUSA_API_BASE_URL")
const PUBLISHABLE_KEY = requiredEnv("MEDUSA_PUBLISHABLE_API_KEY")
const EASEBUZZ_PROVIDER_ID = "pp_easebuzz_default"
const FRONTEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.trim()
const COMPLETION_LOCK_TTL_MS = 90_000
const completionLocks = new Map<string, { token: string; expiresAt: number }>()

function createCompletionLockKey(cartId: string, idempotencyKey: string) {
  return `complete:${cartId}:${idempotencyKey}`
}

function acquireCompletionLock(lockKey: string) {
  const now = Date.now()
  const existing = completionLocks.get(lockKey)

  if (existing && existing.expiresAt > now) {
    return null
  }

  const token = crypto.randomUUID()
  completionLocks.set(lockKey, { token, expiresAt: now + COMPLETION_LOCK_TTL_MS })
  return token
}

function releaseCompletionLock(lockKey: string, token: string) {
  const existing = completionLocks.get(lockKey)
  if (existing?.token === token) {
    completionLocks.delete(lockKey)
  }
}

function getRedirectOrigin(req: Request) {
  if (FRONTEND_BASE_URL) {
    try {
      return new URL(FRONTEND_BASE_URL).origin
    } catch {
      // fall back to request origin below
    }
  }
  return new URL(req.url).origin
}

function htmlRedirect(redirectTo: string, payload: Record<string, string>) {
  const safeRedirect = JSON.stringify(redirectTo)
  const safePayload = JSON.stringify(payload)

  return `<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body>
  <script>
    try { sessionStorage.setItem("easebuzz_callback_payload", ${safePayload}); } catch (_e) {}
    try { localStorage.removeItem("checkout_payment_lock_v1"); } catch (_e) {}
    window.location.replace(${safeRedirect});
  </script>
</body>
</html>`
}

function isSuccessStatus(status: string) {
  const normalized = status.toLowerCase()
  return (
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "captured" ||
    normalized === "authorized"
  )
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractOrder(data: any) {
  return data?.order || data?.data?.order || null
}

function readIdempotencyKey(res: Response) {
  return (
    res.headers.get("idempotency-key") ||
    res.headers.get("Idempotency-Key") ||
    ""
  )
}

function normalizeUnderscores(value: string) {
  let result = ""
  let prevUnderscore = false

  for (const ch of value) {
    const safe = /[a-z0-9_-]/.test(ch) ? ch : "_"
    if (safe === "_") {
      if (prevUnderscore) {
        continue
      }
      prevUnderscore = true
      result += "_"
      continue
    }

    prevUnderscore = false
    result += safe
  }

  while (result.startsWith("_")) {
    result = result.slice(1)
  }
  while (result.endsWith("_")) {
    result = result.slice(0, -1)
  }

  return result
}

function sanitizeIdempotencySegment(value: string) {
  const normalized = normalizeUnderscores(value.trim().toLowerCase())
  return normalized.slice(0, 64)
}

function sanitizeIdempotencyKey(value: string) {
  const normalized = normalizeUnderscores(value.trim().toLowerCase())
  return normalized.slice(0, 128)
}

function buildPayloadFingerprint(payload: Record<string, string>) {
  const canonical = Object.entries(payload)
    .filter(([key, value]) => key.trim() !== "" && String(value).trim() !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  if (canonical === "") {
    return "no_payload"
  }

  return createHash("sha256").update(canonical).digest("hex").slice(0, 32)
}

function buildCompletionIdempotencyKey(payload: Record<string, string>, req: Request) {
  const reqUrl = new URL(req.url)
  const cartId = payload.udf5 || reqUrl.searchParams.get("cart_id") || ""
  const callbackProvidedKey =
    payload.udf2 || reqUrl.searchParams.get("idempotency_key") || ""
  const paymentSessionId =
    payload.udf1 || reqUrl.searchParams.get("payment_session_id") || ""
  const txnid = payload.txnid || reqUrl.searchParams.get("txnid") || ""
  const udfAttemptHint = payload.udf6 || payload.udf7 || ""

  const explicitKey = sanitizeIdempotencyKey(callbackProvidedKey)
  if (explicitKey) {
    return explicitKey
  }

  const safeCartId = sanitizeIdempotencySegment(cartId) || "cart"
  const stableAttemptId =
    sanitizeIdempotencySegment(paymentSessionId) ||
    sanitizeIdempotencySegment(txnid) ||
    sanitizeIdempotencySegment(udfAttemptHint) ||
    sanitizeIdempotencySegment(buildPayloadFingerprint(payload)) ||
    "attempt"

  return `complete_${safeCartId}_${stableAttemptId}`
}

function getCompletionErrorText(data: any) {
  return String(
    data?.message || data?.error?.message || data?.error || data?.type || ""
  ).toLowerCase()
}

function isRecoverableCompleteResponse(status: number, data: any) {
  if (status === 409 || status === 202) {
    return true
  }

  const errorText = getCompletionErrorText(data)

  if (status >= 500) {
    if (
      errorText.includes("unknown_error") ||
      errorText.includes("unknown error") ||
      errorText.includes("timeout") ||
      errorText.includes("temporarily")
    ) {
      return true
    }
  }

  return (
    errorText.includes("idempotency") ||
    errorText.includes("invalid_state_error") ||
    errorText.includes("conflicted with another request") ||
    errorText.includes("checkout_in_progress") ||
    errorText.includes("in progress") ||
    errorText.includes("already")
  )
}

async function fetchCartOrder(cartId: string) {
  const cartRes = await fetch(`${BASE_URL}/store/carts/${cartId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_KEY,
    },
    cache: "no-store",
  })
  const cartData = await cartRes.json().catch(() => null)
  const cart = cartData?.cart

  if (cart?.order?.id) {
    return cart.order
  }

  if (cart?.order_id) {
    const orderRes = await fetch(`${BASE_URL}/store/orders/${cart.order_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      cache: "no-store",
    })
    const orderData = await orderRes.json().catch(() => null)
    return orderData?.order || orderData?.data?.order || null
  }

  return null
}

async function waitForOrder(cartId: string, tries: number, delayMs: number) {
  for (let i = 0; i < tries; i++) {
    const order = await fetchCartOrder(cartId)
    if (order?.id) {
      return order
    }
    await wait(delayMs)
  }
  return null
}

async function syncPaymentSessionWithMedusa(payload: Record<string, string>, req: Request) {
  const reqUrl = new URL(req.url)
  const cartId = payload.udf5 || reqUrl.searchParams.get("cart_id") || ""
  const paymentSessionId = payload.udf1 || reqUrl.searchParams.get("payment_session_id") || ""
  const providerId = EASEBUZZ_PROVIDER_ID

  if (cartId === "") {
    return { ok: false, reason: "missing_cart_id" }
  }

  const fields = [
    "+payment_collection.id",
    "+payment_collection.payment_sessions.id",
    "+payment_collection.payment_sessions.provider_id",
  ].join(",")

  const cartRes = await fetch(
    `${BASE_URL}/store/carts/${cartId}?fields=${encodeURIComponent(fields)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      cache: "no-store",
    }
  )

  const cartData = await cartRes.json().catch(() => null)
  const paymentCollection = cartData?.cart?.payment_collection
  const sessions = paymentCollection?.payment_sessions || []

  const matchedSession =
    sessions.find((s: any) => s?.id === paymentSessionId) ||
    sessions.find((s: any) => s?.provider_id === providerId) ||
    sessions[0]

  const resolvedPaymentSessionId = paymentSessionId || matchedSession?.id

  if (resolvedPaymentSessionId == null || resolvedPaymentSessionId === "") {
    return { ok: false, reason: "missing_payment_session" }
  }

  const updateRes = await fetch(`${BASE_URL}/store/easebuzz/payment-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_KEY,
    },
    body: JSON.stringify({
      payment_session_id: resolvedPaymentSessionId,
      data: {
        ...payload,
        payment_session_id: resolvedPaymentSessionId,
      },
    }),
    cache: "no-store",
  })

  const updateData = await updateRes.json().catch(() => null)
  return {
    ok: updateRes.ok,
    status: updateRes.status,
    reason: updateRes.ok ? "updated" : "update_failed",
    details: updateData,
  }
}

async function completeCartInMedusa(payload: Record<string, string>, req: Request) {
  const reqUrl = new URL(req.url)
  const cartId = payload.udf5 || reqUrl.searchParams.get("cart_id") || ""

  if (cartId === "") {
    return { ok: false, status: 400, reason: "missing_cart_id" }
  }

  let idempotencyKey = buildCompletionIdempotencyKey(payload, req)
  let lastData: any = null
  const lockKey = createCompletionLockKey(cartId, idempotencyKey)
  const lockToken = acquireCompletionLock(lockKey)

  if (lockToken == null) {
    const orderFromLockOwner = await waitForOrder(cartId, 6, 1500)
    if (orderFromLockOwner?.id) {
      return { ok: true, status: 200, reason: "completed", order: orderFromLockOwner }
    }
    return {
      ok: true,
      status: 202,
      reason: "complete_pending",
      details: { message: "Completion already in progress for this payment attempt." },
    }
  }

  try {
    const existingOrder = await fetchCartOrder(cartId)
    if (existingOrder?.id) {
      return { ok: true, status: 200, reason: "completed", order: existingOrder }
    }

    const res = await fetch(`${BASE_URL}/store/carts/${cartId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
        "Idempotency-Key": idempotencyKey,
      },
      cache: "no-store",
    })

    const data = await res.json().catch(() => null)
    lastData = data

    const returnedKey = readIdempotencyKey(res)
    const nextKey = returnedKey.trim()
    if (nextKey.length > 0) {
      idempotencyKey = nextKey
    }

    console.log("[Easebuzz success callback] complete-cart:", {
      cartId,
      attempt: 1,
      status: res.status,
      idempotencyKey,
      data,
    })

    const order = extractOrder(data)
    if (order?.id) {
      return { ok: true, status: res.status, reason: "completed", order, details: data }
    }

    if (res.ok) {
      const orderFromCart = await waitForOrder(cartId, 12, 1500)
      if (orderFromCart?.id) {
        return { ok: true, status: 200, reason: "completed", order: orderFromCart }
      }
      return { ok: true, status: res.status, reason: "completed_without_order", details: data }
    }

    if (isRecoverableCompleteResponse(res.status, data) === false) {
      return {
        ok: false,
        status: res.status,
        reason: "complete_failed",
        details: data,
      }
    }

    const eventualOrder = await waitForOrder(cartId, 40, 1500)
    if (eventualOrder?.id) {
      return { ok: true, status: 200, reason: "completed", order: eventualOrder }
    }

    return {
      ok: true,
      status: 202,
      reason: "complete_pending",
      details: lastData,
    }
  } finally {
    releaseCompletionLock(lockKey, lockToken)
  }
}

function buildRedirectUrl(
  req: Request,
  payload: Record<string, string>,
  options?: {
    completeStatus?: string
    orderId?: string
    reason?: string
    syncStatus?: string
  }
) {
  const reqUrl = new URL(req.url)
  const cartId = payload.udf5 || reqUrl.searchParams.get("cart_id") || ""
  const txnid = payload.txnid || reqUrl.searchParams.get("txnid") || ""
  const redirectUrl = new URL("/checkout/payment/success", getRedirectOrigin(req))
  const payloadJson = JSON.stringify(payload)
  const completeStatus = options?.completeStatus || "skipped"
  redirectUrl.searchParams.set("gateway", "easebuzz")
  redirectUrl.searchParams.set("status", payload.status || "success")
  redirectUrl.searchParams.set("complete_status", completeStatus)
  if (cartId) redirectUrl.searchParams.set("cart_id", cartId)
  if (txnid) redirectUrl.searchParams.set("txnid", txnid)
  if (options?.orderId) redirectUrl.searchParams.set("order_id", options.orderId)
  if (options?.reason) redirectUrl.searchParams.set("reason", options.reason)
  if (options?.syncStatus) redirectUrl.searchParams.set("sync_status", options.syncStatus)
  return redirectUrl.toString()
}

export async function POST(req: Request) {
  const formData = await req.formData()
  const entries = Array.from(formData.entries()).map(([k, v]) => [k, String(v)]) as Array<
    [string, string]
  >
  const payload = toRecordFromEntries(entries)
  console.log("[Easebuzz success callback] body:", payload)
  console.log("[Easebuzz success callback] query:", Object.fromEntries(new URL(req.url).searchParams.entries()))

  const statusRaw =
    payload.status ||
    payload.tx_status ||
    payload.payment_status ||
    payload.result ||
    "unknown"
  const status = statusRaw.toLowerCase()
  let syncStatus = "skipped"
  let completeStatus = "skipped"
  let orderId = ""
  let reason = ""

  try {
    const syncResult = await syncPaymentSessionWithMedusa(payload, req)
    console.log("[Easebuzz success callback] medusa-sync:", syncResult)
    syncStatus = syncResult.ok ? "updated" : (syncResult.reason || "update_failed")

    if (syncResult.ok === false) {
      reason = syncResult.reason || "payment_session_update_failed"
    }

    if (syncResult.ok && isSuccessStatus(status)) {
      const completionResult = await completeCartInMedusa(payload, req)
      console.log("[Easebuzz success callback] complete-result:", completionResult)

      completeStatus = completionResult.ok
        ? (completionResult.reason || "completed")
        : (completionResult.reason || "complete_failed")

      if (completionResult.order?.id) {
        orderId = completionResult.order.id
      }

      if (completionResult.ok === false && reason === "") {
        reason = completionResult.reason || "complete_failed"
      }
    } else if (isSuccessStatus(status) === false) {
      completeStatus = "skipped_not_success"
      reason = reason || "gateway_status_not_success"
    }
  } catch (error) {
    console.error("[Easebuzz success callback] medusa-sync-error:", error)
    syncStatus = "exception"
    completeStatus = "exception"
    reason = "callback_exception"
  }

  return new Response(
    htmlRedirect(
      buildRedirectUrl(req, payload, {
        completeStatus,
        orderId,
        reason,
        syncStatus,
      }),
      payload
    ),
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  )
}

export async function GET(req: Request) {
  const reqUrl = new URL(req.url)
  const payload = toRecordFromEntries(reqUrl.searchParams.entries())
  return new Response(htmlRedirect(buildRedirectUrl(req, payload), payload), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
