import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { EMAIL_TEMPLATE_CONFIG_MODULE } from "../../../modules/email-template-config"
import type EmailTemplateConfigService from "../../../modules/email-template-config/service"
import {
  getDefaultEmailTemplateConfig,
  type EmailTemplateConfigRecord,
} from "../../../lib/email-template-config"

export const UpsertEmailTemplateConfigSchema = z
  .object({
    website_name: z.string().optional(),
    logo_url: z.string().optional(),
    support_email: z.string().optional(),
    contact_admin_email: z.string().optional(),
    order_admin_email: z.string().optional(),
    order_support_email: z.string().optional(),
    contact_url: z.string().optional(),
    whatsapp_url: z.string().optional(),
    call_url: z.string().optional(),
    about_url: z.string().optional(),
    terms_url: z.string().optional(),
    privacy_url: z.string().optional(),
    facebook_url: z.string().optional(),
    x_url: z.string().optional(),
    linkedin_url: z.string().optional(),
    instagram_url: z.string().optional(),
    social_facebook_icon: z.string().optional(),
    social_x_icon: z.string().optional(),
    social_linkedin_icon: z.string().optional(),
    social_instagram_icon: z.string().optional(),
    copyright_text: z.string().optional(),
    checkout_otp_email_subject: z.string().optional(),
    order_email_gst_rate: z.union([z.number(), z.string()]).optional(),
  })
  .strict()

type UpsertEmailTemplateConfigInput = z.infer<typeof UpsertEmailTemplateConfigSchema>

type PersistedEmailTemplateConfig = {
  id: string
} & Partial<EmailTemplateConfigRecord>

const EMAIL_TEMPLATE_CONFIG_KEYS: Array<keyof EmailTemplateConfigRecord> = [
  "website_name",
  "logo_url",
  "support_email",
  "contact_admin_email",
  "order_admin_email",
  "order_support_email",
  "contact_url",
  "whatsapp_url",
  "call_url",
  "about_url",
  "terms_url",
  "privacy_url",
  "facebook_url",
  "x_url",
  "linkedin_url",
  "instagram_url",
  "social_facebook_icon",
  "social_x_icon",
  "social_linkedin_icon",
  "social_instagram_icon",
  "copyright_text",
  "checkout_otp_email_subject",
  "order_email_gst_rate",
]

const parseRate = (
  value: unknown,
  fallback: number
): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

const sanitizeInput = (
  raw: unknown
): Partial<EmailTemplateConfigRecord> => {
  if (!raw || typeof raw !== "object") {
    return {}
  }

  const body = raw as Record<string, unknown>
  const input: Partial<EmailTemplateConfigRecord> = {}

  for (const key of EMAIL_TEMPLATE_CONFIG_KEYS) {
    if (!(key in body)) {
      continue
    }

    if (key === "order_email_gst_rate") {
      input.order_email_gst_rate = parseRate(body[key], 18)
      continue
    }

    if (typeof body[key] === "string") {
      input[key] = body[key].trim() as never
    }
  }

  return input
}

const normalizeConfig = (
  source: Partial<EmailTemplateConfigRecord> | Record<string, unknown> | undefined
): Partial<EmailTemplateConfigRecord> => {
  if (!source || typeof source !== "object") {
    return {}
  }

  const valueMap = source as Record<string, unknown>
  const normalized: Partial<EmailTemplateConfigRecord> = {}

  for (const key of EMAIL_TEMPLATE_CONFIG_KEYS) {
    if (!(key in valueMap)) {
      continue
    }

    if (key === "order_email_gst_rate") {
      normalized.order_email_gst_rate = parseRate(valueMap[key], 18)
      continue
    }

    if (typeof valueMap[key] === "string") {
      normalized[key] = valueMap[key].trim() as never
    }
  }

  return normalized
}

const getOrCreateEmailTemplateConfig = async (
  service: EmailTemplateConfigService
): Promise<PersistedEmailTemplateConfig> => {
  const existing = (await service.listEmailTemplateConfigs({})) as PersistedEmailTemplateConfig[]

  if (existing?.length) {
    return existing[0]
  }

  return (await service.createEmailTemplateConfigs(
    getDefaultEmailTemplateConfig() as PersistedEmailTemplateConfig
  )) as PersistedEmailTemplateConfig
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const service: EmailTemplateConfigService = req.scope.resolve(
    EMAIL_TEMPLATE_CONFIG_MODULE
  )
  const config = await getOrCreateEmailTemplateConfig(service)
  res.status(200).json({ email_template_config: config })
}

async function upsertConfig(
  req: MedusaRequest<UpsertEmailTemplateConfigInput>,
  res: MedusaResponse
): Promise<void> {
  try {
    const service: EmailTemplateConfigService = req.scope.resolve(
      EMAIL_TEMPLATE_CONFIG_MODULE
    )
    const current = await getOrCreateEmailTemplateConfig(service)
    const payload = sanitizeInput(
      req.validatedBody ?? (req as MedusaRequest & { body?: unknown }).body
    )

    const defaults = normalizeConfig(getDefaultEmailTemplateConfig())
    const currentNormalized = normalizeConfig(current as Record<string, unknown>)

    const merged = EMAIL_TEMPLATE_CONFIG_KEYS.reduce(
      (acc, key) => {
        if (key === "order_email_gst_rate") {
          acc.order_email_gst_rate = parseRate(
            payload.order_email_gst_rate ?? currentNormalized.order_email_gst_rate,
            defaults.order_email_gst_rate ?? 18
          )
          return acc
        }

        const value =
          (payload[key] as string | undefined) ??
          (currentNormalized[key] as string | undefined) ??
          (defaults[key] as string | undefined) ??
          ""

        acc[key] = value as never
        return acc
      },
      {} as Record<keyof EmailTemplateConfigRecord, string | number>
    )

    const updated = await service.updateEmailTemplateConfigs({
      id: current.id,
      ...merged,
    } as PersistedEmailTemplateConfig)

    res.status(200).json({ email_template_config: updated })
  } catch (error) {
    const logger = (req.scope.resolve("logger") || console) as {
      error?: (...args: unknown[]) => void
    }
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update email template config"

    logger.error?.(`[EmailTemplateConfig] Upsert failed. ${message}`)
    throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
  }
}

export async function POST(
  req: MedusaRequest<UpsertEmailTemplateConfigInput>,
  res: MedusaResponse
): Promise<void> {
  return upsertConfig(req, res)
}

export async function PATCH(
  req: MedusaRequest<UpsertEmailTemplateConfigInput>,
  res: MedusaResponse
): Promise<void> {
  return upsertConfig(req, res)
}
