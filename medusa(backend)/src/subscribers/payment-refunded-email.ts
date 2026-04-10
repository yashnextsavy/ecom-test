import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderRefundEmails } from "../lib/order-email"

const toNumericValue = (value: unknown, depth = 0): number | null => {
  if (depth > 3) {
    return null
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "bigint") {
    const asNumber = Number(value)
    return Number.isFinite(asNumber) ? asNumber : null
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }

  if (value && typeof value === "object") {
    const candidate = value as Record<string, unknown>
    const commonKeys = ["value", "amount", "raw", "number", "numeric"]

    for (const key of commonKeys) {
      if (key in candidate) {
        const parsed = toNumericValue(candidate[key], depth + 1)
        if (parsed !== null) {
          return parsed
        }
      }
    }
  }

  return null
}

const loadPayment = async (container: SubscriberArgs["container"], id: string) => {
  const query = container.resolve("query")

  const { data: payments } = await query.graph({
    entity: "payment",
    fields: [
      "id",
      "amount",
      "currency_code",
      "data",
      "payment_collection_id",
      "refunds.id",
      "refunds.amount",
      "refunds.created_at",
    ],
    filters: {
      id,
    },
  })

  return payments?.[0]
}

const loadOrderIdByPaymentCollectionId = async (
  container: SubscriberArgs["container"],
  paymentCollectionId: string
) => {
  const query = container.resolve("query")

  const { data } = await query.graph({
    entity: "order_payment_collection",
    fields: ["order.id"],
    filters: {
      payment_collection_id: paymentCollectionId,
    },
  })

  return data?.[0]?.order?.id as string | undefined
}

const loadOrder = async (container: SubscriberArgs["container"], id: string) => {
  const query = container.resolve("query")

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "status",
      "created_at",
      "email",
      "currency_code",
      "summary.subtotal",
      "summary.tax_total",
      "summary.total",
      "summary.discount_total",
      "subtotal",
      "tax_total",
      "discount_total",
      "total",
      "items.title",
      "items.quantity",
      "items.unit_price",
      "items.total",
      "items.subtotal",
      "items.thumbnail",
      "billing_address.first_name",
      "billing_address.last_name",
      "billing_address.phone",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.phone",
    ],
    filters: {
      id,
    },
  })

  return orders?.[0]
}

const getLatestRefundAmount = (payment: Record<string, any>): number | null => {
  const refunds = Array.isArray(payment?.refunds) ? payment.refunds : []
  if (!refunds.length) {
    return null
  }

  const sorted = [...refunds].sort((a: any, b: any) => {
    const aTs = new Date(a?.created_at || 0).getTime()
    const bTs = new Date(b?.created_at || 0).getTime()
    return bTs - aTs
  })

  return toNumericValue(sorted[0]?.amount)
}

const getLatestRefundId = (payment: Record<string, any>): string => {
  const refunds = Array.isArray(payment?.refunds) ? payment.refunds : []
  if (!refunds.length) {
    return ""
  }

  const sorted = [...refunds].sort((a: any, b: any) => {
    const aTs = new Date(a?.created_at || 0).getTime()
    const bTs = new Date(b?.created_at || 0).getTime()
    return bTs - aTs
  })

  return typeof sorted[0]?.id === "string" ? sorted[0].id : ""
}

const getRequestIdFromPaymentData = (payment: Record<string, any>): string => {
  const data = payment?.data && typeof payment.data === "object" ? payment.data : {}
  const refundResponse =
    data.refund_response && typeof data.refund_response === "object"
      ? data.refund_response
      : {}
  const refundResponseData =
    refundResponse.data && typeof refundResponse.data === "object"
      ? refundResponse.data
      : {}

  const candidates = [
    data.request_id,
    data.refund_request_id,
    data.merchant_refund_id,
    refundResponse.request_id,
    refundResponse.refund_request_id,
    refundResponse.merchant_refund_id,
    refundResponseData.request_id,
    refundResponseData.refund_request_id,
    refundResponseData.merchant_refund_id,
  ]

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

export default async function paymentRefundedEmail({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const paymentId = event?.data?.id
  if (!paymentId) return

  const logger = (container.resolve("logger") || console) as {
    info?: (message: string) => void
    warn?: (message: string) => void
    error?: (message: string) => void
  }

  try {
    const payment = await loadPayment(container, paymentId)
    if (!payment?.payment_collection_id) {
      logger.warn?.(
        `[RefundEmail] Could not resolve payment collection for payment_id=${paymentId}`
      )
      return
    }

    const orderId = await loadOrderIdByPaymentCollectionId(
      container,
      payment.payment_collection_id
    )
    if (!orderId) {
      logger.warn?.(
        `[RefundEmail] Could not resolve order for payment_id=${paymentId} payment_collection_id=${payment.payment_collection_id}`
      )
      return
    }

    const order = await loadOrder(container, orderId)
    if (!order) {
      logger.warn?.(`[RefundEmail] Order not found for order_id=${orderId}`)
      return
    }

    const refundAmount = getLatestRefundAmount(payment as Record<string, any>)
    const refundId = getLatestRefundId(payment as Record<string, any>)
    const requestId = getRequestIdFromPaymentData(payment as Record<string, any>)
    await sendOrderRefundEmails(
      {
        id: order.id,
        display_id: order.display_id,
        status: (order as any).status,
        refund_id: refundId || null,
        request_id: requestId || null,
        created_at: (order as any).created_at,
        email: order.email,
        currency_code: order.currency_code,
        subtotal: (order as any).subtotal,
        tax_total: (order as any).tax_total,
        discount_total: (order as any).discount_total,
        total: refundAmount ?? (order as any).total,
        summary: (order as any).summary,
        items: (order as any).items,
        billing_address: order.billing_address,
        shipping_address: (order as any).shipping_address,
      },
      { scope: container }
    )

    logger.info?.(
      `[RefundEmail] Refund emails sent for payment_id=${paymentId}, order_id=${orderId}`
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error?.(
      `[RefundEmail] Failed to send refund emails for payment_id=${paymentId}. ${message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "payment.refunded",
}
