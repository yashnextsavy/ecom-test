import { EMAIL_TEMPLATE_CONFIG_MODULE } from "../modules/email-template-config"
import type EmailTemplateConfigService from "../modules/email-template-config/service"

export type EmailTemplateConfigRecord = {
  website_name: string
  logo_url: string
  support_email: string
  contact_admin_email: string
  order_admin_email: string
  order_support_email: string
  contact_url: string
  whatsapp_url: string
  call_url: string
  about_url: string
  terms_url: string
  privacy_url: string
  facebook_url: string
  x_url: string
  linkedin_url: string
  instagram_url: string
  social_facebook_icon: string
  social_x_icon: string
  social_linkedin_icon: string
  social_instagram_icon: string
  copyright_text: string
  checkout_otp_email_subject: string
  order_email_gst_rate: number
}

type ScopeLike = {
  resolve: (name: string) => unknown
}

const DEFAULT_COPYRIGHT_TEXT =
  "© 2025 - 2026 D Succeed Learners. All Rights Reserved."

const toStringValue = (value: unknown): string => {
  return typeof value === "string" ? value.trim() : ""
}

const toNumberValue = (value: unknown, fallback: number): number => {
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

export const getDefaultEmailTemplateConfig = (): EmailTemplateConfigRecord => {
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || ""
  const supportEmail =
    process.env.CONTACT_SUPPORT_EMAIL ||
    process.env.ORDER_SUPPORT_EMAIL ||
    process.env.CONTACT_ADMIN_EMAIL ||
    smtpFrom

  return {
    website_name: process.env.EMAIL_WEBSITE_NAME || "Global IT Success",
    logo_url: process.env.EMAIL_LOGO_URL || "",
    support_email: supportEmail,
    contact_admin_email: process.env.CONTACT_ADMIN_EMAIL || smtpFrom,
    order_admin_email: process.env.ORDER_ADMIN_EMAIL || process.env.CONTACT_ADMIN_EMAIL || smtpFrom,
    order_support_email: process.env.ORDER_SUPPORT_EMAIL || supportEmail,
    contact_url: process.env.CONTACT_PAGE_URL || process.env.CONTACT_WHATSAPP_URL || "#",
    whatsapp_url: process.env.CONTACT_WHATSAPP_URL || "#",
    call_url: process.env.CONTACT_CALL_URL || "#",
    about_url: process.env.CONTACT_ABOUT_URL || "#",
    terms_url: process.env.CONTACT_TERMS_URL || "#",
    privacy_url: process.env.CONTACT_PRIVACY_URL || "#",
    facebook_url: process.env.CONTACT_FACEBOOK_URL || "#",
    x_url: process.env.CONTACT_X_URL || "#",
    linkedin_url: process.env.CONTACT_LINKEDIN_URL || "#",
    instagram_url: process.env.CONTACT_INSTAGRAM_URL || "#",
    social_facebook_icon: process.env.EMAIL_SOCIAL_FACEBOOK_ICON || "",
    social_x_icon: process.env.EMAIL_SOCIAL_X_ICON || "",
    social_linkedin_icon: process.env.EMAIL_SOCIAL_LINKEDIN_ICON || "",
    social_instagram_icon: process.env.EMAIL_SOCIAL_INSTAGRAM_ICON || "",
    copyright_text: process.env.CONTACT_COPYRIGHT_TEXT || DEFAULT_COPYRIGHT_TEXT,
    checkout_otp_email_subject:
      process.env.CHECKOUT_OTP_EMAIL_SUBJECT ||
      `${process.env.EMAIL_WEBSITE_NAME || "Global IT Success"} checkout verification code`,
    order_email_gst_rate: toNumberValue(process.env.ORDER_EMAIL_GST_RATE, 18),
  }
}

const mergeConfig = (
  defaults: EmailTemplateConfigRecord,
  source: Record<string, unknown>
): EmailTemplateConfigRecord => {
  return {
    website_name: toStringValue(source.website_name) || defaults.website_name,
    logo_url: toStringValue(source.logo_url) || defaults.logo_url,
    support_email: toStringValue(source.support_email) || defaults.support_email,
    contact_admin_email:
      toStringValue(source.contact_admin_email) || defaults.contact_admin_email,
    order_admin_email: toStringValue(source.order_admin_email) || defaults.order_admin_email,
    order_support_email:
      toStringValue(source.order_support_email) || defaults.order_support_email,
    contact_url: toStringValue(source.contact_url) || defaults.contact_url,
    whatsapp_url: toStringValue(source.whatsapp_url) || defaults.whatsapp_url,
    call_url: toStringValue(source.call_url) || defaults.call_url,
    about_url: toStringValue(source.about_url) || defaults.about_url,
    terms_url: toStringValue(source.terms_url) || defaults.terms_url,
    privacy_url: toStringValue(source.privacy_url) || defaults.privacy_url,
    facebook_url: toStringValue(source.facebook_url) || defaults.facebook_url,
    x_url: toStringValue(source.x_url) || defaults.x_url,
    linkedin_url: toStringValue(source.linkedin_url) || defaults.linkedin_url,
    instagram_url: toStringValue(source.instagram_url) || defaults.instagram_url,
    social_facebook_icon:
      toStringValue(source.social_facebook_icon) || defaults.social_facebook_icon,
    social_x_icon: toStringValue(source.social_x_icon) || defaults.social_x_icon,
    social_linkedin_icon:
      toStringValue(source.social_linkedin_icon) || defaults.social_linkedin_icon,
    social_instagram_icon:
      toStringValue(source.social_instagram_icon) || defaults.social_instagram_icon,
    copyright_text: toStringValue(source.copyright_text) || defaults.copyright_text,
    checkout_otp_email_subject:
      toStringValue(source.checkout_otp_email_subject) || defaults.checkout_otp_email_subject,
    order_email_gst_rate: toNumberValue(
      source.order_email_gst_rate,
      defaults.order_email_gst_rate
    ),
  }
}

export const getEmailTemplateConfig = async (
  scope?: ScopeLike
): Promise<EmailTemplateConfigRecord> => {
  const defaults = getDefaultEmailTemplateConfig()

  if (!scope || typeof scope.resolve !== "function") {
    return defaults
  }

  try {
    const service = scope.resolve(
      EMAIL_TEMPLATE_CONFIG_MODULE
    ) as EmailTemplateConfigService

    const existing = ((await service.listEmailTemplateConfigs({})) as unknown[]) || []
    if (!existing.length) {
      return defaults
    }

    const record = existing[0] as Record<string, unknown>
    return mergeConfig(defaults, record)
  } catch {
    return defaults
  }
}
