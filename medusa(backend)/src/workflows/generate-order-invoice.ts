import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { upsertOrderInvoiceStep } from "./steps/upsert-order-invoice"

export type GenerateOrderInvoiceInput = {
  order_id: string
  force_regenerate?: boolean
}

export const generateOrderInvoiceWorkflow = createWorkflow(
  "generate-order-invoice-workflow",
  (input: GenerateOrderInvoiceInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "created_at",
        "email",
        "currency_code",
        "subtotal",
        "tax_total",
        "total",
        "summary.subtotal",
        "summary.tax_total",
        "summary.total",
        "billing_address.first_name",
        "billing_address.last_name",
        "billing_address.address_1",
        "billing_address.address_2",
        "billing_address.city",
        "billing_address.province",
        "billing_address.postal_code",
        "billing_address.country_code",
        "billing_address.phone",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.address_1",
        "shipping_address.address_2",
        "shipping_address.city",
        "shipping_address.province",
        "shipping_address.postal_code",
        "shipping_address.country_code",
        "shipping_address.phone",
        "items.title",
        "items.product_id",
        "items.metadata",
        "items.product.attributes",
        "items.product.metadata",
        "items.variant.metadata",
        "items.variant.product.attributes",
        "items.variant.product.metadata",
        "items.quantity",
        "items.raw_quantity",
        "items.unit_price",
        "items.total",
        "items.detail.quantity",
        "items.detail.unit_price",
        "payment_collections.id",
        "payment_collections.data",
        "payment_collections.payment_sessions.id",
        "payment_collections.payment_sessions.data",
        "payment_collections.payments.id",
        "payment_collections.payments.data",
      ],
      filters: {
        id: input.order_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    })

    const order = transform({ orders }, ({ orders }) => orders[0])

    const invoice = upsertOrderInvoiceStep({
      order,
      force_regenerate: input.force_regenerate,
    })

    return new WorkflowResponse(invoice)
  }
)
