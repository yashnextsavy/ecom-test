import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { generateOrderInvoiceWorkflow } from "../workflows/generate-order-invoice"

export default async function orderInvoiceGenerated({
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
    await generateOrderInvoiceWorkflow(container).run({
      input: {
        order_id: orderId,
        force_regenerate: false,
      },
    })
    logger.info?.(`[Invoice] Invoice prepared for order_id=${orderId}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error?.(`[Invoice] Failed to prepare invoice for order_id=${orderId}. ${message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.created"],
}
