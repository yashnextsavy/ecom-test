"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type EasebuzzPayload = Record<string, string>

function readCallbackPayload(): EasebuzzPayload {
  try {
    const raw = sessionStorage.getItem("easebuzz_callback_payload")
    if (raw == null || raw === "") return {}
    return JSON.parse(raw) as EasebuzzPayload
  } catch {
    return {}
  }
}

function readPayloadFromQuery(search: string): EasebuzzPayload {
  try {
    const urlParams = new URLSearchParams(search)
    const rawPayload = urlParams.get("eb_payload")
    if (rawPayload == null || rawPayload === "") return {}
    return JSON.parse(rawPayload) as EasebuzzPayload
  } catch {
    return {}
  }
}

function clearCheckoutClientState() {
  try {
    localStorage.removeItem("cart_id")
    localStorage.removeItem("checkout_pending_payment")
    localStorage.removeItem("checkout_payment_lock_v1")
    sessionStorage.removeItem("checkout_in_progress")
    sessionStorage.removeItem("easebuzz_callback_payload")
  } catch {
    // ignore storage issues
  }

  document.cookie = "cart_id=; Max-Age=0; path=/"

  try {
    const rawCheckoutData = localStorage.getItem("checkout_data")
    if (!rawCheckoutData) return
    const parsed = JSON.parse(rawCheckoutData) as Record<string, any>
    const { payment: _payment, ...rest } = parsed
    localStorage.setItem("checkout_data", JSON.stringify({ ...rest, cartId: null }))
  } catch {
    // ignore parse/storage issues
  }
}

function buildClientCompletionKey(cartId: string, payload: EasebuzzPayload) {
  const callbackKey = (payload.udf2 || "").trim()
  if (callbackKey) {
    return callbackKey
  }

  const seed =
    payload.udf1 ||
    payload.txnid ||
    payload.udf6 ||
    payload.udf7 ||
    "attempt"
  return `complete_${cartId}_${seed}`
}

async function retryCompleteCart(cartId: string, payload: EasebuzzPayload): Promise<string> {
  try {
    const res = await fetch("/api/checkout/complete-cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cart_id: cartId,
        idempotency_key: buildClientCompletionKey(cartId, payload),
      }),
      cache: "no-store",
    })
    const data = await res.json().catch(() => null)
    return data?.order?.id || ""
  } catch {
    return ""
  }
}

async function resolveOrderIdFromCart(cartId: string): Promise<string> {
  try {
    const cartRes = await fetch(`/api/cart/get?cart_id=${encodeURIComponent(cartId)}`, {
      method: "GET",
      cache: "no-store",
    })
    const cartData = await cartRes.json().catch(() => null)
    const discoveredOrderId = cartData?.cart?.order_id || cartData?.cart?.order?.id || ""
    if (!discoveredOrderId) return ""

    const orderRes = await fetch(
      `/api/cart/get?order_id=${encodeURIComponent(discoveredOrderId)}`,
      { method: "GET", cache: "no-store" }
    )
    const orderData = await orderRes.json().catch(() => null)
    return orderData?.order?.id || discoveredOrderId
  } catch {
    return ""
  }
}

export default function CheckoutPaymentSuccessPage() {
  const router = useRouter()
  const [query, setQuery] = useState<Record<string, string>>({})
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const [showFallback, setShowFallback] = useState(false)
  const [retryingStatus, setRetryingStatus] = useState(false)

  useEffect(() => {
    const currentSearch = window.location.search
    const urlParams = new URLSearchParams(currentSearch)
    const queryData = Object.fromEntries(urlParams.entries())
    const queryPayload = readPayloadFromQuery(currentSearch)
    const storagePayload = readCallbackPayload()
    const resolvedPayload =
      Object.keys(queryPayload).length > 0 ? queryPayload : storagePayload

    setQuery(queryData)

    if (Object.keys(queryPayload).length > 0) {
      try {
        sessionStorage.setItem(
          "easebuzz_callback_payload",
          JSON.stringify(queryPayload)
        )
      } catch {
        // ignore storage issues
      }
    }

    const orderId = queryData.order_id || resolvedPayload.order_id || ""
    const txnid = queryData.txnid || resolvedPayload.txnid || ""
    const cartId = queryData.cart_id || resolvedPayload.udf5 || ""

    if (orderId === "") {
      let isCancelled = false
      const fallbackTimer = setTimeout(() => {
        setShowFallback(true)
      }, 6000)

      const completeStatus = queryData.complete_status || ""
      const shouldPollOrder =
        cartId !== "" &&
        (completeStatus === "complete_pending" ||
          completeStatus === "completed_without_order" ||
          completeStatus === "completed" ||
          completeStatus === "")

      let pollTimer: ReturnType<typeof setInterval> | null = null
      let attempts = 0
      const maxAttempts = 20
      let completionRetryAttempts = 0
      const maxCompletionRetryAttempts = 1
      const completionRetryStartAfterAttempts = 12

      if (shouldPollOrder) {
        const runPoll = async () => {
          attempts += 1
          let resolvedOrderId = await resolveOrderIdFromCart(cartId)

          // Auto-recover pending completions by retrying server-side completion
          // with the same idempotency key at a controlled cadence.
          if (
            resolvedOrderId === "" &&
            completionRetryAttempts < maxCompletionRetryAttempts &&
            attempts >= completionRetryStartAfterAttempts &&
            attempts % 6 === 0
          ) {
            completionRetryAttempts += 1
            const completedOrderId = await retryCompleteCart(cartId, resolvedPayload)
            if (completedOrderId) {
              resolvedOrderId = completedOrderId
            } else {
              resolvedOrderId = await resolveOrderIdFromCart(cartId)
            }
          }

          if (isCancelled || resolvedOrderId === "") {
            if (attempts >= maxAttempts && pollTimer) {
              clearInterval(pollTimer)
            }
            return
          }

          clearCheckoutClientState()
          const target = new URL("/thank-you", window.location.origin)
          target.searchParams.set("order_id", resolvedOrderId)
          if (txnid !== "") {
            target.searchParams.set("txnid", txnid)
          }
          router.replace(target.toString())
        }

        void runPoll()
        pollTimer = setInterval(() => {
          void runPoll()
        }, 2000)
      }

      return () => {
        isCancelled = true
        clearTimeout(fallbackTimer)
        if (pollTimer) clearInterval(pollTimer)
      }
    }

    setShowFallback(false)
    setRedirectCountdown(3)

    const countdownInterval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev === null) return prev
        return prev > 1 ? prev - 1 : 1
      })
    }, 1000)

    const redirectTimer = setTimeout(() => {
      clearCheckoutClientState()
      const target = new URL("/thank-you", window.location.origin)
      target.searchParams.set("order_id", orderId)
      if (txnid !== "") {
        target.searchParams.set("txnid", txnid)
      }
      router.replace(target.toString())
    }, 3000)

    return () => {
      clearTimeout(redirectTimer)
      clearInterval(countdownInterval)
    }
  }, [router])

  const fallbackMessage = useMemo(() => {
    const completeStatus = query.complete_status || ""
    const reason = query.reason || ""

    if (completeStatus === "completed_without_order" || completeStatus === "complete_pending") {
      return "Payment is received and order confirmation is still processing."
    }

    if (reason !== "") {
      return `Payment callback received but order confirmation is pending (${reason}).`
    }

    return "Payment callback received but order confirmation is taking longer than expected."
  }, [query])

  const handleRetryStatus = async () => {
    if (retryingStatus) return

    setRetryingStatus(true)
    try {
      const currentSearch = window.location.search
      const queryPayload = readPayloadFromQuery(currentSearch)
      const storagePayload = readCallbackPayload()
      const resolvedPayload =
        Object.keys(queryPayload).length > 0 ? queryPayload : storagePayload
      const queryData = Object.fromEntries(new URLSearchParams(currentSearch).entries())
      const cartId = queryData.cart_id || resolvedPayload.udf5 || ""
      const txnid = queryData.txnid || resolvedPayload.txnid || ""

      if (!cartId) {
        window.location.reload()
        return
      }

      let resolvedOrderId = await resolveOrderIdFromCart(cartId)
      if (!resolvedOrderId) {
        resolvedOrderId = await retryCompleteCart(cartId, resolvedPayload)
      }
      if (!resolvedOrderId) {
        resolvedOrderId = await resolveOrderIdFromCart(cartId)
      }

      if (resolvedOrderId) {
        clearCheckoutClientState()
        const target = new URL("/thank-you", window.location.origin)
        target.searchParams.set("order_id", resolvedOrderId)
        if (txnid !== "") {
          target.searchParams.set("txnid", txnid)
        }
        router.replace(target.toString())
        return
      }

      window.location.reload()
    } finally {
      setRetryingStatus(false)
    }
  }

  if (showFallback) {
    return (
      <div className="container-custom mx-auto min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful</h1>
          <p className="text-sm text-gray-600 mb-2">We received your payment. Order confirmation is taking longer than usual.</p>
          <p className="text-sm text-gray-600 mb-6">{fallbackMessage}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              className="px-4 py-2 rounded-md bg-[#23408B] text-white"
              onClick={handleRetryStatus}
              disabled={retryingStatus}
            >
              {retryingStatus ? "Checking..." : "Check status"}
            </button>
            <button
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700"
              onClick={() => router.replace("/")}
            >
              Continue browsing
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom mx-auto h-[70vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-[#23408B] rounded-full animate-spin"></div>
      {redirectCountdown !== null && (
        <p className="text-sm text-gray-500">Redirecting in {redirectCountdown}s...</p>
      )}
    </div>
  )
}
