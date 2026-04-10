import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  generateReceiptBuffer,
  isPaidOrderForDocuments,
  type OrderReceiptRecord,
} from "../../../../admin/orders/[id]/receipt/route"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "customer_id",
      "status",
      "payment_status",
      "created_at",
      "email",
      "currency_code",
      "subtotal",
      "tax_total",
      "discount_total",
      "total",
      "summary.subtotal",
      "summary.tax_total",
      "summary.discount_total",
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
      "items.quantity",
      "items.raw_quantity",
      "items.unit_price",
      "items.total",
      "items.detail.quantity",
      "items.detail.unit_price",
      "items.tax_lines.total",
      "payment_collections.id",
      "payment_collections.data",
      "payment_collections.payment_sessions.id",
      "payment_collections.payment_sessions.data",
      "payment_collections.payments.id",
      "payment_collections.payments.data",
      "payment_collections.payments.metadata",
      "payment_collections.payments.captures.id",
      "payment_collections.payments.captures.data",
    ],
    filters: { id },
  })

  const order = (orders as (OrderReceiptRecord & { customer_id?: string | null })[] | undefined)?.[0]
  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }

  if (!isPaidOrderForDocuments(order)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Receipt can only be generated after payment is completed."
    )
  }

  // TEMPORARY: customer auth is not enabled yet in storefront.
  // Re-enable this guard once customer JWT flow is implemented.
  // const customerId = (req as any)?.auth_context?.actor_id as string | undefined
  // if (!customerId || !order.customer_id || customerId !== order.customer_id) {
  //   throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized to access this receipt")
  // }

  const includeRawJson = String((req.query as Record<string, unknown> | undefined)?.include_raw_json || "")
    .toLowerCase() === "true"
  const pdfBuffer = await generateReceiptBuffer(order, { includeRawJson })
  const filename = `order-receipt-${order.display_id || order.id}.pdf`

  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
  res.status(200).send(pdfBuffer)
}
