import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { INVOICE_GENERATOR_MODULE } from "../../../modules/invoice-generator"
import type InvoiceGeneratorService from "../../../modules/invoice-generator/service"
import { getDefaultInvoiceConfig } from "../../../lib/invoice"

type UpsertInvoiceConfigInput = {
  company_name?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  company_logo?: string
  secondary_logo?: string
  gstin?: string
  notes?: string
  copyright_text?: string
}

const INVOICE_CONFIG_KEYS: Array<keyof UpsertInvoiceConfigInput> = [
  "company_name",
  "company_address",
  "company_phone",
  "company_email",
  "company_logo",
  "secondary_logo",
  "gstin",
  "notes",
  "copyright_text",
]

const sanitizeInput = (raw: unknown): Partial<UpsertInvoiceConfigInput> => {
  if (!raw || typeof raw !== "object") {
    return {}
  }

  const body = raw as Record<string, unknown>
  const read = (key: keyof UpsertInvoiceConfigInput): string | undefined => {
    const value = body[key]
    if (typeof value !== "string") {
      return undefined
    }
    return value.trim()
  }

  return INVOICE_CONFIG_KEYS.reduce((acc, key) => {
    const value = read(key)
    if (value !== undefined) {
      acc[key] = value
    }
    return acc
  }, {} as Partial<UpsertInvoiceConfigInput>)
}

const normalizeConfig = (
  source: Partial<UpsertInvoiceConfigInput> | Record<string, unknown> | undefined
): Partial<UpsertInvoiceConfigInput> => {
  if (!source || typeof source !== "object") {
    return {}
  }

  const valueMap = source as Record<string, unknown>

  return INVOICE_CONFIG_KEYS.reduce((acc, key) => {
    const value = valueMap[key]
    if (typeof value === "string") {
      acc[key] = value.trim()
    }
    return acc
  }, {} as Partial<UpsertInvoiceConfigInput>)
}

const getOrCreateInvoiceConfig = async (service: InvoiceGeneratorService) => {
  const existing = (await service.listInvoiceConfigs({})) as any[]
  if (existing?.length) {
    return existing[0]
  }
  return await service.createInvoiceConfigs(getDefaultInvoiceConfig() as any)
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const service: InvoiceGeneratorService = req.scope.resolve(INVOICE_GENERATOR_MODULE)
  const config = await getOrCreateInvoiceConfig(service)
  res.status(200).json({ invoice_config: config })
}

async function upsertConfig(
  req: MedusaRequest<UpsertInvoiceConfigInput>,
  res: MedusaResponse
): Promise<void> {
  try {
    const service: InvoiceGeneratorService = req.scope.resolve(INVOICE_GENERATOR_MODULE)
    const current = await getOrCreateInvoiceConfig(service)
    const payload = sanitizeInput(
      (req as MedusaRequest<UpsertInvoiceConfigInput>).validatedBody ??
        (req as MedusaRequest & { body?: unknown }).body
    )

    const defaults = normalizeConfig(getDefaultInvoiceConfig() as Record<string, unknown>)
    const currentNormalized = normalizeConfig(current as Record<string, unknown>)

    const merged = INVOICE_CONFIG_KEYS.reduce((acc, key) => {
      const value = payload[key] ?? currentNormalized[key] ?? defaults[key] ?? ""
      acc[key] = value
      return acc
    }, {} as Record<keyof UpsertInvoiceConfigInput, string>)

    const updated = await service.updateInvoiceConfigs({
      id: current.id,
      ...merged,
    } as any)

    res.status(200).json({ invoice_config: updated })
  } catch (error) {
    const logger = (req.scope.resolve("logger") || console) as {
      error?: (...args: unknown[]) => void
    }
    const message = error instanceof Error ? error.message : "Failed to update invoice config"
    logger.error?.(`[InvoiceConfig] Upsert failed. ${message}`)
    throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
  }
}

export async function POST(
  req: MedusaRequest<UpsertInvoiceConfigInput>,
  res: MedusaResponse
): Promise<void> {
  return upsertConfig(req, res)
}

export async function PATCH(
  req: MedusaRequest<UpsertInvoiceConfigInput>,
  res: MedusaResponse
): Promise<void> {
  return upsertConfig(req, res)
}
