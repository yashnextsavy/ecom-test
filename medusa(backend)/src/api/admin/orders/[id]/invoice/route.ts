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
      "payment_status",
      "payment_collections.payments.captures.id",
    ],
    filters: { id },
  })

  const order = (orders as Array<{
    id: string
    payment_status?: string | null
    payment_collections?: Array<{
      payments?: Array<{
        captures?: Array<{ id?: string | null }> | null
      }> | null
    }> | null
  }> | undefined)?.[0]

  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }

  if (!isOrderPaid(order)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invoice can only be generated after payment is completed."
    )
  }

  const forceRegenerateRaw = String(
    (req.query as Record<string, unknown> | undefined)?.force_regenerate || ""
  ).toLowerCase()
  const forceRegenerate =
    forceRegenerateRaw.length > 0 ? forceRegenerateRaw === "true" : true

  const { result } = await generateOrderInvoiceWorkflow(req.scope).run({
    input: {
      order_id: id,
      force_regenerate: forceRegenerate,
    },
  })

  const invoice = result as WorkflowInvoice | undefined
  if (!invoice?.invoice_json) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Invoice could not be generated")
  }

  const pdfBuffer = await generateInvoicePdfBuffer(invoice.invoice_json)
  const invoiceNumber = String(invoice.invoice_json.invoice_number || "").trim() || (
    typeof invoice.display_id === "string" || typeof invoice.display_id === "number"
      ? String(invoice.display_id)
      : String(invoice.order_id)
  )
  const safeInvoiceNumber = invoiceNumber.replace(/[^A-Za-z0-9_-]/g, "")
  const downloadDateTime = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15)
  const filename = `Invoice-${safeInvoiceNumber}-${downloadDateTime}.pdf`

  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
  res.status(200).send(pdfBuffer)
}
