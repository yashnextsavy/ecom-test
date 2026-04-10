import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type PaymentRecoveryRow = {
  id: string
  status?: string
  cart_id?: string
  payment_session_id?: string
  txnid?: string
  attempt_count?: number
  max_attempts?: number
  next_retry_at?: string | Date | null
  last_attempt_at?: string | Date | null
  last_error?: string | null
  order_id?: string | null
  payload?: Record<string, unknown> | null
  updated_at?: string | Date | null
  created_at?: string | Date | null
}

const toDateMs = (value?: string | Date | null): number => {
  if (value instanceof Date) {
    return value.getTime()
  }
  if (typeof value === "string" && value.trim()) {
    return new Date(value).getTime()
  }
  return 0
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const url = new URL(req.url)
  const status = (url.searchParams.get("status") || "").trim()
  const cartId = (url.searchParams.get("cart_id") || "").trim()
  const txnid = (url.searchParams.get("txnid") || "").trim()
  const paymentSessionId = (url.searchParams.get("payment_session_id") || "").trim()
  const limitRaw = Number(url.searchParams.get("limit") || "50")
  const limit = Number.isFinite(limitRaw)
    ? Math.min(200, Math.max(1, Math.floor(limitRaw)))
    : 50

  const filters: Record<string, unknown> = {}
  if (status) filters.status = status
  if (cartId) filters.cart_id = cartId
  if (txnid) filters.txnid = txnid
  if (paymentSessionId) filters.payment_session_id = paymentSessionId

  const query = req.scope.resolve("query")
  const { data } = await query.graph({
    entity: "payment_recovery_entry",
    fields: ["*"],
    filters,
  })

  const rows = ((data as PaymentRecoveryRow[] | undefined) || [])
    .sort((a, b) => toDateMs(b.updated_at || b.created_at) - toDateMs(a.updated_at || a.created_at))
    .slice(0, limit)

  res.status(200).json({
    payment_recovery_entries: rows,
    count: rows.length,
  })
}

