import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderCanceledEmails } from "../lib/order-email"

const loadOrder = async (container: SubscriberArgs["container"], id: string) => {
  const query = container.resolve("query")

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
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
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.phone",
      "shipping_address.city",
      "shipping_address.province",
      "shipping_address.country_code",
      "billing_address.email",
      "billing_address.first_name",
      "billing_address.last_name",
      "billing_address.phone",
      "billing_address.city",
      "billing_address.province",
      "billing_address.country_code",
    ],
    filters: {
      id,
    },
  })

  return orders?.[0]
}

export default async function orderCanceledEmail({ event, container }: SubscriberArgs<{ id: string }>) {
  const orderId = event?.data?.id
  if (!orderId) return

  const order = await loadOrder(container, orderId)
  if (!order) return
  await sendOrderCanceledEmails(
    {
      id: order.id,
      display_id: order.display_id,
      email: order.email || (order as any).billing_address?.email,
      currency_code: order.currency_code,
      subtotal: (order as any).subtotal,
      tax_total: (order as any).tax_total,
      discount_total: (order as any).discount_total,
      total: order.total,
      items: (order as any).items,
      billing_address: order.billing_address,
      shipping_address: (order as any).shipping_address,
    },
    { scope: container }
  )
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
