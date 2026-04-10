import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { generateOrderInvoiceWorkflow } from "../../../../../workflows/generate-order-invoice"
import { generateInvoicePdfBuffer, type InvoiceSnapshot } from "../../../../../lib/invoice"

type WorkflowInvoice = {
  id: string
  order_id: string
  display_id?: string | number | null
  invoice_json?: InvoiceSnapshot
}

const PAID_ORDER_PAYMENT_STATUSES = new Set(["paid", "captured"])

const isOrderPaid = (order: {
  payment_status?: string | null
  payment_collections?: Array<{
    payments?: Array<{
      captures?: Array<{ id?: string | null }> | null
    }> | null
  }> | null
}): boolean => {
  const normalizedPaymentStatus = String(order.payment_status || "")
    .trim()
    .toLowerCase()

  if (PAID_ORDER_PAYMENT_STATUSES.has(normalizedPaymentStatus)) {
    return true
  }

  const collections = Array.isArray(order.payment_collections)
    ? order.payment_collections
    : []
  for (const collection of collections) {
    const payments = Array.isArray(collection?.payments) ? collection.payments : []
    for (const payment of payments) {
      const captures = Array.isArray(payment?.captures) ? payment.captures : []
      if (captures.some((capture) => Boolean(String(capture?.id || "").trim()))) {
        return true
      }
    }
  }

  return false
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "customer_id",
      "payment_status",
      "payment_collections.payments.captures.id",
    ],
    filters: { id },
  })

  const order = (orders as Array<{
    id: string
    display_id?: string | number | null
    customer_id?: string | null
    payment_status?: string | null
    payment_collections?: Array<{
      payments?: Array<{
        captures?: Array<{ id?: string | null }> | null
      }> | null
    }> | null
  }>)[0]
  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }

  if (!isOrderPaid(order)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invoice can only be generated after payment is completed."
    )
  }

  // TEMPORARY: customer auth is not enabled yet in storefront.
  // Re-enable this guard once customer JWT flow is implemented.
  // const customerId = (req as any)?.auth_context?.actor_id as string | undefined
  // if (!customerId || !order.customer_id || customerId !== order.customer_id) {
  //   throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized to access this invoice")
  // }

  const { result } = await generateOrderInvoiceWorkflow(req.scope).run({
    input: {
      order_id: id,
      force_regenerate: false,
    },
  })

  const invoice = result as WorkflowInvoice | undefined
  if (!invoice?.invoice_json) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Invoice could not be generated")
  }

  const pdfBuffer = await generateInvoicePdfBuffer(invoice.invoice_json)
  const invoiceDisplay =
    typeof invoice.display_id === "string" || typeof invoice.display_id === "number"
      ? invoice.display_id
      : order.display_id || order.id
  const filename = `tax-invoice-${invoiceDisplay}.pdf`

  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
  res.status(200).send(pdfBuffer)
}
