import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { INVOICE_GENERATOR_MODULE } from "../../modules/invoice-generator"
import type InvoiceGeneratorService from "../../modules/invoice-generator/service"
import { InvoiceStatus } from "../../modules/invoice-generator/models/invoice"
import {
  buildInvoiceSnapshot,
  getDefaultInvoiceConfig,
  type InvoiceConfigRecord,
  type InvoiceSnapshot,
} from "../../lib/invoice"

type InvoiceRecord = {
  id: string
  display_id?: number | null
  order_id: string
  status: InvoiceStatus
  currency_code?: string | null
  invoice_json: InvoiceSnapshot
  created_at?: string | Date | null
}

export type UpsertOrderInvoiceStepInput = {
  order: Record<string, unknown>
  force_regenerate?: boolean
}

const toTimestamp = (value: unknown): number => {
  const date = value ? new Date(value as string | number | Date) : new Date(0)
  const ts = date.getTime()
  return Number.isFinite(ts) ? ts : 0
}

export const upsertOrderInvoiceStep = createStep(
  "upsert-order-invoice-step",
  async (input: UpsertOrderInvoiceStepInput, { container }) => {
    const invoiceService: InvoiceGeneratorService = container.resolve(INVOICE_GENERATOR_MODULE)
    const shouldRegenerate = input.force_regenerate === true
    const order = input.order as unknown as { id: string }

    const existing = ((await invoiceService.listInvoices({
      order_id: order.id,
      status: InvoiceStatus.LATEST,
    })) || []) as unknown as InvoiceRecord[]

    const latestInvoice = [...existing].sort(
      (a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at)
    )[0]

    if (latestInvoice && !shouldRegenerate) {
      return new StepResponse(latestInvoice)
    }

    if (existing.length) {
      for (const invoice of existing) {
        await invoiceService.updateInvoices({
          id: invoice.id,
          status: InvoiceStatus.STALE,
        })
      }
    }

    const configs = ((await invoiceService.listInvoiceConfigs({})) || []) as unknown as InvoiceConfigRecord[]
    let config = configs[0]
    if (!config) {
      config = (await invoiceService.createInvoiceConfigs({
        ...getDefaultInvoiceConfig(),
      } as any)) as unknown as InvoiceConfigRecord
    }

    const nextNumber = latestInvoice?.display_id
      ? `INV-${latestInvoice.display_id + 1}`
      : undefined

    const snapshot = buildInvoiceSnapshot(input.order as any, config, nextNumber)
    const created = (await invoiceService.createInvoices({
      order_id: order.id,
      status: InvoiceStatus.LATEST,
      currency_code: snapshot.currency_code,
      invoice_json: snapshot,
    } as any)) as unknown as InvoiceRecord

    return new StepResponse(created)
  }
)
