import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { INVOICE_GENERATOR_MODULE } from "../../modules/invoice-generator"
import type InvoiceGeneratorService from "../../modules/invoice-generator/service"
import { InvoiceStatus } from "../../modules/invoice-generator/models/invoice"

type InvoiceRecord = {
  id: string
  status: InvoiceStatus
}

export type MarkOrderInvoicesStaleStepInput = {
  order_id: string
}

export const markOrderInvoicesStaleStep = createStep(
  "mark-order-invoices-stale-step",
  async (input: MarkOrderInvoicesStaleStepInput, { container }) => {
    const invoiceService: InvoiceGeneratorService = container.resolve(INVOICE_GENERATOR_MODULE)
    const invoices = ((await invoiceService.listInvoices({
      order_id: input.order_id,
      status: InvoiceStatus.LATEST,
    })) || []) as InvoiceRecord[]

    const changedIds: string[] = []
    for (const invoice of invoices) {
      await invoiceService.updateInvoices({
        id: invoice.id,
        status: InvoiceStatus.STALE,
      })
      changedIds.push(invoice.id)
    }

    return new StepResponse({ stale_ids: changedIds }, { stale_ids: changedIds })
  },
  async (compensationData, { container }) => {
    const ids = compensationData?.stale_ids
    if (!Array.isArray(ids) || !ids.length) {
      return
    }

    const invoiceService: InvoiceGeneratorService = container.resolve(INVOICE_GENERATOR_MODULE)
    for (const id of ids as string[]) {
      await invoiceService.updateInvoices({
        id,
        status: InvoiceStatus.LATEST,
      })
    }
  }
)
