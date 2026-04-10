import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { markOrderInvoicesStaleWorkflow } from "../workflows/mark-order-invoices-stale"

export default async function orderInvoiceStale({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event?.data?.id
  if (!orderId) {
    return
  }

  const logger = (container.resolve("logger") || console) as {
    info?: (message: string) => void
    warn?: (message: string) => void
    error?: (message: string) => void
  }

  try {
    await markOrderInvoicesStaleWorkflow(container).run({
      input: {
        order_id: orderId,
      },
    })
    logger.info?.(`[Invoice] Marked latest invoice stale for order_id=${orderId}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error?.(`[Invoice] Failed to stale invoice for order_id=${orderId}. ${message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["order.updated", "order.canceled"],
}
