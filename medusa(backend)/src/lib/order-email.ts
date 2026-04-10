import { sendEmail } from "./email"
import {
  generateReceiptBuffer,
  type OrderReceiptRecord,
} from "../api/admin/orders/[id]/receipt/route"
import type nodemailer from "nodemailer"
import {
  getEmailTemplateConfig,
  type EmailTemplateConfigRecord,
} from "./email-template-config"

type OrderAddress = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  city?: string | null
  province?: string | null
  country_code?: string | null
}

type OrderItem = {
  title?: string | null
  product_id?: string | null
  product_title?: string | null
  product_handle?: string | null
  product_subtitle?: string | null
  product_description?: string | null
  product_metadata?: Record<string, unknown> | null
  quantity?: number | string | null
  unit_price?: number | string | null
  subtotal?: number | string | null
  total?: number | string | null
  thumbnail?: string | null
  category_title?: string | null
  category_slug?: string | null
  category_image_url?: string | null
  categories?: Array<{
    id?: string | null
    title?: string | null
    slug?: string | null
    handle?: string | null
    img_url?: string | null
  }>
}

type OrderEmailInput = {
  id: string
  display_id?: string | number | null
  status?: string | null
  refund_id?: string | null
  request_id?: string | null
  created_at?: string | Date | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  currency_code?: string | null
  subtotal?: number | string | null
  tax_total?: number | string | null
  total?: number | string | null
  discount_total?: number | string | null
  summary?: {
    subtotal?: number | string | null
    tax_total?: number | string | null
    total?: number | string | null
    discount_total?: number | string | null
  } | null
  items?: OrderItem[] | null
  payment_collections?: unknown[] | null
  cart_complete_response?: {
    type?: string
    order?: Record<string, unknown>
  } | null
  billing_address?: OrderAddress | null
  shipping_address?: OrderAddress | null
}

type EmailInvoiceAttachment = {
  filename: string
  content: Buffer
  contentType: string
}

type ScopeLike = {
  resolve: (name: string) => unknown
}

const getAdminRecipient = (config: EmailTemplateConfigRecord) => {
  return (
    config.contact_admin_email ||
    config.order_admin_email ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    ""
  )
}

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const toNumericValue = (value: unknown, depth = 0): number | null => {
  if (depth > 3) {
    return null
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "bigint") {
    const asNumber = Number(value)
    return Number.isFinite(asNumber) ? asNumber : null
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }

  if (value && typeof value === "object") {
    const candidate = value as Record<string, unknown>
    const commonKeys = [
      "value",
      "amount",
      "raw",
      "number",
      "numeric",
      "qty",
    ]

    for (const key of commonKeys) {
      if (key in candidate) {
        const parsed = toNumericValue(candidate[key], depth + 1)
        if (parsed !== null) {
          return parsed
        }
      }
    }
  }

  return null
}

const formatAmount = (
  amount: number | string | null | undefined,
  currencyCode: string | null | undefined
) => {
  const parsedAmount = toNumericValue(amount)
  if (parsedAmount === null) {
    return "-"
  }

  const currency = (currencyCode || "INR").toUpperCase()

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parsedAmount)
  } catch {
    return `${parsedAmount} ${currency}`
  }
}

const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) {
    return ""
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

const normalizeOrderInput = (order: OrderEmailInput): OrderEmailInput => {
  const summary = order.summary || {}

  const resolveAmount = (key: "subtotal" | "tax_total" | "total" | "discount_total") => {
    const direct = toNumericValue(order[key])
    if (direct !== null) {
      return direct
    }

    const fromSummary = toNumericValue(summary[key])
    if (fromSummary !== null) {
      return fromSummary
    }

    return order[key] ?? summary[key] ?? null
  }

  const firstName =
    order.first_name ||
    order.billing_address?.first_name ||
    order.shipping_address?.first_name ||
    null
  const lastName =
    order.last_name ||
    order.billing_address?.last_name ||
    order.shipping_address?.last_name ||
    null

  return {
    ...order,
    first_name: firstName,
    last_name: lastName,
    subtotal: resolveAmount("subtotal"),
    tax_total: resolveAmount("tax_total"),
    total: resolveAmount("total"),
    discount_total: resolveAmount("discount_total"),
  }
}

const getLineItemTotal = (item: OrderItem): number | null => {
  const quantity = toNumericValue(item.quantity) ?? 0
  const unitPrice = toNumericValue(item.unit_price)
  if (unitPrice !== null) {
    return unitPrice * quantity
  }

  const subtotal = toNumericValue(item.subtotal)
  if (subtotal !== null) {
    return subtotal
  }

  const total = toNumericValue(item.total)
  return total
}

const getEmailTotals = (
  order: OrderEmailInput,
  gstRate: number
): {
  total: number
  subtotalExclGst: number
  gstIncluded: number
} => {
  const items = Array.isArray(order.items) ? order.items : []
  const lineTotal = items.reduce((sum, item) => {
    const amount = getLineItemTotal(item)
    return sum + (amount ?? 0)
  }, 0)

  const summaryTotal = toNumericValue(order.summary?.total)
  const rawTotal = toNumericValue(order.total)
  const total = lineTotal > 0 ? lineTotal : summaryTotal ?? rawTotal ?? 0

  if (total <= 0 || gstRate <= 0) {
    return {
      total,
      subtotalExclGst: total,
      gstIncluded: 0,
    }
  }

  const gstIncluded = Number(((total * gstRate) / (100 + gstRate)).toFixed(2))
  const subtotalExclGst = Number((total - gstIncluded).toFixed(2))

  return {
    total,
    subtotalExclGst,
    gstIncluded,
  }
}

const createCidImage = (
  value: string,
  cid: string,
  fallbackFileName: string
): {
  src: string
  attachment?: {
    filename: string
    content: string
    encoding: "base64"
    contentType: string
    cid: string
  }
} => {
  const trimmed = value.trim()

  if (!trimmed) {
    return { src: "" }
  }

  const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)

  if (!match) {
    return { src: trimmed }
  }

  return {
    src: `cid:${cid}`,
    attachment: {
      filename: fallbackFileName,
      content: match[2],
      encoding: "base64",
      contentType: match[1],
      cid,
    },
  }
}

const buildSocialIcon = (href: string, iconSrc: string, alt: string) => {
  if (!iconSrc) {
    return ""
  }

  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;margin-right:12px;text-decoration:none;">
      <img src="${escapeHtml(iconSrc)}" alt="${escapeHtml(alt)}" width="42" height="42" style="display:block;border:0;width:42px;height:42px;" />
    </a>
  `
}

const getCustomerName = (order: OrderEmailInput) => {
  const firstName =
    order.first_name ||
    order.billing_address?.first_name ||
    order.shipping_address?.first_name ||
    ""
  const lastName =
    order.last_name ||
    order.billing_address?.last_name ||
    order.shipping_address?.last_name ||
    ""
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Customer"
}

const getOrderNumber = (order: OrderEmailInput) => {
  return String(order.display_id ?? order.id)
}

const toSafeFileToken = (value: string) => {
  return value.replace(/[^A-Za-z0-9_-]/g, "")
}

const getAddressText = (address: OrderAddress | null | undefined) => {
  if (!address) {
    return "-"
  }

  const name = [address.first_name, address.last_name].filter(Boolean).join(" ").trim()
  const location = [address.city, address.province, address.country_code?.toUpperCase()].filter(Boolean).join(", ")
  return [name, address.phone || "", location].filter(Boolean).join(" | ") || "-"
}

const buildAdminRows = (rows: Array<{ label: string; value: string }>) => {
  return rows
    .map(
      (row) => `
        <tr>
          <td style="padding:12px 14px;border:1px solid #dfe3ea;background:#f7f9fc;font-weight:600;width:220px;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:12px 14px;border:1px solid #dfe3ea;background:#ffffff;">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `
    )
    .join("")
}

const buildAdminItemsTable = (order: OrderEmailInput) => {
  const items = Array.isArray(order.items) ? order.items : []

  const rows = items
    .map((item) => {
      const quantity = toNumericValue(item.quantity) ?? 0
      const unitPrice = formatAmount(item.unit_price, order.currency_code)
      const lineTotal = getLineItemTotal(item)

      return `
        <tr>
          <td style="padding:12px;border:1px solid #dfe3ea;">${escapeHtml(item.title || "Item")}</td>
          <td style="padding:12px;border:1px solid #dfe3ea;text-align:center;">${quantity}</td>
          <td style="padding:12px;border:1px solid #dfe3ea;text-align:right;">${escapeHtml(unitPrice)}</td>
          <td style="padding:12px;border:1px solid #dfe3ea;text-align:right;">${escapeHtml(formatAmount(lineTotal, order.currency_code))}</td>
        </tr>
      `
    })
    .join("")

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-top:18px;">
      <tr>
        <th style="padding:12px;border:1px solid #dfe3ea;background:#f7f9fc;text-align:left;">Item</th>
        <th style="padding:12px;border:1px solid #dfe3ea;background:#f7f9fc;text-align:center;">Qty</th>
        <th style="padding:12px;border:1px solid #dfe3ea;background:#f7f9fc;text-align:right;">Price</th>
        <th style="padding:12px;border:1px solid #dfe3ea;background:#f7f9fc;text-align:right;">Total</th>
      </tr>
      ${rows || `
        <tr>
          <td colspan="4" style="padding:12px;border:1px solid #dfe3ea;">No items found</td>
        </tr>
      `}
    </table>
  `
}

const buildCustomerOrderTemplate = (
  order: OrderEmailInput,
  settings: EmailTemplateConfigRecord,
  gstRate: number,
  assets: {
    logoSrc: string
    facebookIconSrc: string
    linkedinIconSrc: string
    instagramIconSrc: string
  }
) => {
  const items = Array.isArray(order.items) ? order.items : []
  const totals = getEmailTotals(order, gstRate)
  const savedAmount = toNumericValue(order.discount_total) ?? 0
  const orderPlacedAt = formatDateTime(order.created_at)

  const itemCards = items
    .map((item) => {
      const quantity = toNumericValue(item.quantity) ?? 0
      const lineTotal = getLineItemTotal(item)

      return `
        <tr>
          <td style="padding:0 0 18px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="vertical-align:middle;">
             
                  <div style="font-size:18px;line-height:1.5;color:#2d4a9d;margin-bottom:6px;">${escapeHtml(item.product_title || item.title || "Item")}</div>
                  <div style="font-size:14px;line-height:1.5;color:#5f7199;margin-bottom:8px;">Qty: ${quantity}</div>
                   </td>
                  <td style="vertical-align:middle;text-align:right;">
                  <div style="font-size:18px;font-weight:700;line-height:1.4;color:#2d4a9d;">${escapeHtml(formatAmount(lineTotal, order.currency_code))}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
    })
    .join("")

  return `
    <div style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#2d4a9d;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:780px;margin:0 auto;background:#ffffff;">
        <tr>
          <td style="padding:32px 20px 24px 20px;">
            ${assets.logoSrc
      ? `<img src="${escapeHtml(assets.logoSrc)}" alt="${escapeHtml(settings.website_name)}" style="display:block;max-width:210px;max-height:82px;height:auto;margin-bottom:40px;" />`
      : ""
    }

            <p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">Dear ${escapeHtml(getCustomerName(order))},</p>

            <p style="margin:0 0 18px 0;font-size:17px;line-height:1.6;color:#2d4a9d;font-weight:700;">Your order has been successfully placed.</p>

            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">
              Your discounted exam voucher will be delivered to your registered email shortly. This voucher allows you to book your certification exam at a reduced cost.
            </p>

            <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">
              Please note that vouchers come with a validity period, so make sure to use it before expiry.
            </p>

            <div style="background:#e8edf8;border:1px solid #bfd0ee;border-radius:16px;padding:18px 16px 16px 16px;margin-bottom:24px;">
              <div style="font-size:18px;font-weight:700;line-height:1.4;color:#2d4a9d;margin-bottom:12px;">Order Summary</div>
              <div style="border-top:1px dashed #9eb0d7;margin-bottom:24px;"></div>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px;">
                ${itemCards}
              </table>

              <div style="border-top:1px dashed #9eb0d7;margin:6px 0 20px 0;"></div>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:16px;line-height:1.6;color:#2d4a9d;">
                <tr>
                  <td style="padding:0 0 10px 0;">Order Number</td>
                  <td style="padding:0 0 10px 0;text-align:right;font-weight:700;">#${escapeHtml(getOrderNumber(order))}</td>
                </tr>
                ${orderPlacedAt
      ? `
                <tr>
                  <td style="padding:0 0 10px 0;">Placed On</td>
                  <td style="padding:0 0 10px 0;text-align:right;font-weight:700;">${escapeHtml(orderPlacedAt)}</td>
                </tr>
                `
      : ""
    }
                ${order.status
      ? `
                <tr>
                  <td style="padding:0 0 10px 0;">Order Status</td>
                  <td style="padding:0 0 10px 0;text-align:right;font-weight:700;text-transform:capitalize;">${escapeHtml(order.status)}</td>
                </tr>
                `
      : ""
    }
                <tr>
                  <td style="padding:0 0 10px 0;">Subtotal (Excl GST)</td>
                  <td style="padding:0 0 10px 0;text-align:right;font-weight:700;">${escapeHtml(formatAmount(totals.subtotalExclGst, order.currency_code))}</td>
                </tr>
                <tr>
                  <td style="padding:0 0 14px 0;">GST Included (${gstRate}%)</td>
                  <td style="padding:0 0 14px 0;text-align:right;font-weight:700;">${escapeHtml(formatAmount(totals.gstIncluded, order.currency_code))}</td>
                </tr>
              </table>

              <div style="border-top:1px dashed #9eb0d7;margin:0 0 18px 0;"></div>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-size:18px;line-height:1.5;color:#2d4a9d;font-weight:700;">Grand Total</td>
                  <td style="font-size:18px;line-height:1.5;color:#2d4a9d;font-weight:700;text-align:right;">${escapeHtml(formatAmount(totals.total, order.currency_code))}</td>
                </tr>
              </table>
            </div>

            <p style="margin:0 0 22px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">If you need any assistance, feel free to contact our support team.</p>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
              <tr>
                <td style="padding:0 0 12px 0;">
                  <a href="${escapeHtml(settings.whatsapp_url)}" style="font-size:18px;line-height:1.5;font-weight:700;color:#2d4a9d;text-decoration:none;border-bottom:2px solid #2d4a9d;display:inline-block;padding-bottom:2px;">
                    CONNECT VIA WHATSAPP &nbsp;&rsaquo;
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <a href="${escapeHtml(settings.call_url)}" style="font-size:18px;line-height:1.5;font-weight:700;color:#2d4a9d;text-decoration:none;border-bottom:2px solid #2d4a9d;display:inline-block;padding-bottom:2px;">
                    CALL OUR EXPERTS &nbsp;&rsaquo;
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">Best regards,</p>
            <p style="margin:0 0 24px 0;font-size:17px;line-height:1.6;color:#2d4a9d;font-weight:700;">Team ${escapeHtml(settings.website_name)}</p>

            <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;color:#2d4a9d;">
              For any queries, connect with us at
              <a href="mailto:${escapeHtml(settings.support_email)}" style="color:#2d4a9d;font-weight:700;text-decoration:none;"> ${escapeHtml(settings.support_email)}</a>
            </p>
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#2d4a9d;">${escapeHtml(settings.copyright_text)}</p>

            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#2d4a9d;">
              <a href="${escapeHtml(settings.contact_url)}" style="color:#2d4a9d;text-decoration:none;">Contact</a>
              &nbsp; | &nbsp;
              <a href="${escapeHtml(settings.about_url)}" style="color:#2d4a9d;text-decoration:none;">About</a>
              &nbsp; | &nbsp;
              <a href="${escapeHtml(settings.terms_url)}" style="color:#2d4a9d;text-decoration:none;">Terms of use</a>
              &nbsp; | &nbsp;
              <a href="${escapeHtml(settings.privacy_url)}" style="color:#2d4a9d;text-decoration:none;">Privacy policy</a>
            </p>

            <p style="margin:0 0 14px 0;font-size:16px;line-height:1.7;color:#2d4a9d;">Follow us on</p>
            <div>
              ${buildSocialIcon(settings.facebook_url, assets.facebookIconSrc, "Facebook")}
              ${buildSocialIcon(settings.linkedin_url, assets.linkedinIconSrc, "LinkedIn")}
              ${buildSocialIcon(settings.instagram_url, assets.instagramIconSrc, "Instagram")}
            </div>
          </td>
        </tr>
      </table>
    </div>
  `
}

const buildAdminOrderTemplate = (
  order: OrderEmailInput,
  gstRate: number
) => {
  const totals = getEmailTotals(order, gstRate)
  return `
    <div style="margin:0;padding:24px;background:#f3f5f9;font-family:Arial,Helvetica,sans-serif;color:#1a2233;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:860px;margin:0 auto;background:#ffffff;border:1px solid #dfe3ea;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;border-bottom:1px solid #e7ebf2;background:#fbfcfe;">
            <div style="font-size:24px;font-weight:700;margin-bottom:8px;">New Order Placed</div>
            <div style="font-size:15px;line-height:1.6;color:#51607a;">A new order has been placed successfully on the website.</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
              ${buildAdminRows([
    { label: "Order Number", value: getOrderNumber(order) },
    { label: "Customer Name", value: getCustomerName(order) },
    { label: "Customer Email", value: order.email || "-" },
    { label: "Phone", value: order.billing_address?.phone || order.shipping_address?.phone || "-" },
    { label: "Subtotal (Excl GST)", value: formatAmount(totals.subtotalExclGst, order.currency_code) },
    { label: `GST Included (${gstRate}%)`, value: formatAmount(totals.gstIncluded, order.currency_code) },
    { label: "Grand Total", value: formatAmount(totals.total, order.currency_code) },
  ])}
            </table>
            ${buildAdminItemsTable(order)}
          </td>
        </tr>
      </table>
    </div>
  `
}

const buildCustomerStatusTemplate = (
  order: OrderEmailInput,
  settings: EmailTemplateConfigRecord,
  gstRate: number,
  assets: {
    logoSrc: string
    facebookIconSrc: string
    linkedinIconSrc: string
    instagramIconSrc: string
  },
  copy: {
    heading: string
    body: string[]
    showOrderSummary?: boolean
  }
) => {
  const totals = getEmailTotals(order, gstRate)
  const showOrderSummary = copy.showOrderSummary !== false

  return `
    <div style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#2d4a9d;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:780px;margin:0 auto;background:#ffffff;">
        <tr>
          <td style="padding:32px 20px 24px 20px;">
            ${assets.logoSrc
      ? `<img src="${escapeHtml(assets.logoSrc)}" alt="${escapeHtml(settings.website_name)}" style="display:block;max-width:210px;max-height:82px;height:auto;margin-bottom:40px;" />`
      : ""
    }

            <p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">Dear ${escapeHtml(getCustomerName(order))},</p>

            <p style="margin:0 0 18px 0;font-size:17px;line-height:1.6;color:#2d4a9d;font-weight:700;">${escapeHtml(copy.heading)}</p>

            ${copy.body
      .map(
        (paragraph) => `
                  <p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">
                    ${escapeHtml(paragraph)}
                  </p>
                `
      )
      .join("")}

            <div style="background:#e8edf8;border:1px solid #bfd0ee;border-radius:16px;padding:18px 16px 16px 16px;margin:12px 0 24px 0;">
              <div style="font-size:18px;font-weight:700;line-height:1.4;color:#2d4a9d;margin-bottom:12px;">${showOrderSummary ? "Order Summary" : "Order Details"}</div>
              <div style="border-top:1px dashed #9eb0d7;margin-bottom:20px;"></div>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:16px;line-height:1.6;color:#2d4a9d;">
                <tr>
                  <td style="padding:0 0 10px 0;">Order Number</td>
                  <td style="padding:0 0 10px 0;text-align:right;font-weight:700;">#${escapeHtml(getOrderNumber(order))}</td>
                </tr>
                ${showOrderSummary ? `
                <tr>
                  <td style="padding:0 0 10px 0;">Subtotal (Excl GST)</td>
                  <td style="padding:0 0 10px 0;text-align:right;font-weight:700;">${escapeHtml(formatAmount(totals.subtotalExclGst, order.currency_code))}</td>
                </tr>
                <tr>
                  <td style="padding:0 0 10px 0;">GST Included (${gstRate}%)</td>
                  <td style="padding:0 0 10px 0;text-align:right;font-weight:700;">${escapeHtml(formatAmount(totals.gstIncluded, order.currency_code))}</td>
                </tr>
                <tr>
                  <td style="padding:0 0 16px 0;">Grand Total</td>
                  <td style="padding:0 0 16px 0;text-align:right;font-weight:700;">${escapeHtml(formatAmount(totals.total, order.currency_code))}</td>
                </tr>
                ` : ""}
              </table>
            </div>

            <p style="margin:0 0 22px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">If you need any assistance, feel free to contact our support team.</p>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
              <tr>
                <td style="padding:0 0 12px 0;">
                  <a href="${escapeHtml(settings.whatsapp_url)}" style="font-size:18px;line-height:1.5;font-weight:700;color:#2d4a9d;text-decoration:none;border-bottom:2px solid #2d4a9d;display:inline-block;padding-bottom:2px;">
                    CONNECT VIA WHATSAPP &nbsp;&rsaquo;
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <a href="${escapeHtml(settings.call_url)}" style="font-size:18px;line-height:1.5;font-weight:700;color:#2d4a9d;text-decoration:none;border-bottom:2px solid #2d4a9d;display:inline-block;padding-bottom:2px;">
                    CALL OUR EXPERTS &nbsp;&rsaquo;
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#2d4a9d;">Best regards,</p>
            <p style="margin:0 0 24px 0;font-size:17px;line-height:1.6;color:#2d4a9d;font-weight:700;">Team ${escapeHtml(settings.website_name)}</p>

            <p style="margin:0 0 10px 0;font-size:15px;line-height:1.6;color:#2d4a9d;">
              For any queries, connect with us at
              <a href="mailto:${escapeHtml(settings.support_email)}" style="color:#2d4a9d;font-weight:700;text-decoration:none;"> ${escapeHtml(settings.support_email)}</a>
            </p>
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#2d4a9d;">${escapeHtml(settings.copyright_text)}</p>

            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#2d4a9d;">
              <a href="${escapeHtml(settings.contact_url)}" style="color:#2d4a9d;text-decoration:none;">Contact</a>
              &nbsp; | &nbsp;
              <a href="${escapeHtml(settings.about_url)}" style="color:#2d4a9d;text-decoration:none;">About</a>
              &nbsp; | &nbsp;
              <a href="${escapeHtml(settings.terms_url)}" style="color:#2d4a9d;text-decoration:none;">Terms of use</a>
              &nbsp; | &nbsp;
              <a href="${escapeHtml(settings.privacy_url)}" style="color:#2d4a9d;text-decoration:none;">Privacy policy</a>
            </p>

            <p style="margin:0 0 14px 0;font-size:16px;line-height:1.7;color:#2d4a9d;">Follow us on</p>
            <div>
              ${buildSocialIcon(settings.facebook_url, assets.facebookIconSrc, "Facebook")}
              ${buildSocialIcon(settings.linkedin_url, assets.linkedinIconSrc, "LinkedIn")}
              ${buildSocialIcon(settings.instagram_url, assets.instagramIconSrc, "Instagram")}
            </div>
          </td>
        </tr>
      </table>
    </div>
  `
}

const buildAdminStatusTemplate = (
  order: OrderEmailInput,
  gstRate: number,
  copy: {
    title: string
    intro: string
  }
) => {
  const totals = getEmailTotals(order, gstRate)
  return `
    <div style="margin:0;padding:24px;background:#f3f5f9;font-family:Arial,Helvetica,sans-serif;color:#1a2233;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:860px;margin:0 auto;background:#ffffff;border:1px solid #dfe3ea;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;border-bottom:1px solid #e7ebf2;background:#fbfcfe;">
            <div style="font-size:24px;font-weight:700;margin-bottom:8px;">${escapeHtml(copy.title)}</div>
            <div style="font-size:15px;line-height:1.6;color:#51607a;">${escapeHtml(copy.intro)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
              ${buildAdminRows([
    { label: "Order Number", value: getOrderNumber(order) },
    { label: "Customer Name", value: getCustomerName(order) },
    { label: "Customer Email", value: order.email || "-" },
    { label: "Phone", value: order.billing_address?.phone || order.shipping_address?.phone || "-" },
    { label: "Subtotal (Excl GST)", value: formatAmount(totals.subtotalExclGst, order.currency_code) },
    { label: `GST Included (${gstRate}%)`, value: formatAmount(totals.gstIncluded, order.currency_code) },
    { label: "Grand Total", value: formatAmount(totals.total, order.currency_code) },
  ])}
            </table>
            ${buildAdminItemsTable(order)}
          </td>
        </tr>
      </table>
    </div>
  `
}

export const sendOrderPlacedEmails = async (
  order: OrderEmailInput,
  options?: {
    invoiceAttachment?: EmailInvoiceAttachment
    includeCustomerPaymentAttachments?: boolean
    includeReceiptAttachment?: boolean
    scope?: ScopeLike
  }
) => {
  const settings = await getEmailTemplateConfig(options?.scope)
  const gstRate = settings.order_email_gst_rate
  const normalizedOrder = normalizeOrderInput(order)
  const totals = getEmailTotals(normalizedOrder, gstRate)
  const customerEmail = normalizedOrder.email || ""
  const adminRecipient = getAdminRecipient(settings)
  const logoImage = createCidImage(settings.logo_url, "order-logo", "order-logo")
  const facebookImage = createCidImage(settings.social_facebook_icon, "order-facebook", "facebook-icon")
  const linkedinImage = createCidImage(settings.social_linkedin_icon, "order-linkedin", "linkedin-icon")
  const instagramImage = createCidImage(settings.social_instagram_icon, "order-instagram", "instagram-icon")
  const customerAttachments: NonNullable<nodemailer.SendMailOptions["attachments"]> = [
    logoImage.attachment,
    facebookImage.attachment,
    linkedinImage.attachment,
    instagramImage.attachment,
  ].filter(Boolean) as NonNullable<nodemailer.SendMailOptions["attachments"]>

  const includeCustomerPaymentAttachments =
    options?.includeCustomerPaymentAttachments !== false
  const includeReceiptAttachment = options?.includeReceiptAttachment !== false

  if (customerEmail && includeCustomerPaymentAttachments) {
    if (includeReceiptAttachment) {
      try {
        const receiptBuffer = await generateReceiptBuffer(
          normalizedOrder as unknown as OrderReceiptRecord,
          { receiptLabel: "Payment Receipt" }
        )
        customerAttachments.push({
          filename: `order-receipt-${getOrderNumber(normalizedOrder)}.pdf`,
          content: receiptBuffer,
          contentType: "application/pdf",
        })
      } catch (error) {
        console.error("Failed to generate order receipt attachment", error)
      }
    }

    if (options?.invoiceAttachment) {
      customerAttachments.push({
        filename:
          options.invoiceAttachment.filename ||
          `Invoice-${toSafeFileToken(getOrderNumber(normalizedOrder))}.pdf`,
        content: options.invoiceAttachment.content,
        contentType: options.invoiceAttachment.contentType,
      })
    }
  }

  const items = Array.isArray(normalizedOrder.items) ? normalizedOrder.items : []
  const itemsText = items
    .map((item) => `- ${item.product_title || item.title || ""} x ${item.quantity ?? 0}`)
    .join("\n")

  const customerText = [
    `Hi ${getCustomerName(normalizedOrder)},`,
    "",
    "Your order has been successfully placed.",
    "Your discounted exam voucher will be delivered to your registered email shortly.",
    "",
    "Order items:",
    itemsText || "(no items)",
    "",
    `Subtotal (Excl GST): ${formatAmount(totals.subtotalExclGst, normalizedOrder.currency_code)}`,
    `GST Included (${gstRate}%): ${formatAmount(totals.gstIncluded, normalizedOrder.currency_code)}`,
    `Total: ${formatAmount(totals.total, normalizedOrder.currency_code)}`,
  ].join("\n")

  const adminText = [
    `New order placed: #${getOrderNumber(normalizedOrder)}`,
    `Customer: ${getCustomerName(normalizedOrder)}`,
    `Email: ${normalizedOrder.email || "-"}`,
    `Phone: ${normalizedOrder.billing_address?.phone || normalizedOrder.shipping_address?.phone || "-"}`,
    `Subtotal (Excl GST): ${formatAmount(totals.subtotalExclGst, normalizedOrder.currency_code)}`,
    `GST Included (${gstRate}%): ${formatAmount(totals.gstIncluded, normalizedOrder.currency_code)}`,
    `Discount: ${formatAmount(normalizedOrder.discount_total, normalizedOrder.currency_code)}`,
    `Total: ${formatAmount(totals.total, normalizedOrder.currency_code)}`,
    "",
    "Items:",
    itemsText || "(no items)",
  ].join("\n")

  const tasks: Promise<unknown>[] = []

  if (customerEmail) {
    tasks.push(
      sendEmail({
        to: customerEmail,
        subject: `Order #${getOrderNumber(normalizedOrder)} confirmed`,
        text: customerText,
        html: buildCustomerOrderTemplate(
          normalizedOrder,
          settings,
          gstRate,
          {
            logoSrc: logoImage.src,
            facebookIconSrc: facebookImage.src,
            linkedinIconSrc: linkedinImage.src,
            instagramIconSrc: instagramImage.src,
          }
        ),
        attachments: customerAttachments,
      })
    )
  }

  if (adminRecipient) {
    tasks.push(
      sendEmail({
        to: adminRecipient,
        subject: `New order placed #${getOrderNumber(normalizedOrder)}`,
        text: adminText,
        html: buildAdminOrderTemplate(normalizedOrder, gstRate),
      })
    )
  }

  await Promise.all(tasks)
}

export const sendOrderCanceledEmails = async (
  order: OrderEmailInput,
  options?: {
    scope?: ScopeLike
  }
) => {
  const settings = await getEmailTemplateConfig(options?.scope)
  const gstRate = settings.order_email_gst_rate
  const customerEmail = order.email || ""
  const adminRecipient = getAdminRecipient(settings)
  const logoImage = createCidImage(settings.logo_url, "order-cancel-logo", "order-cancel-logo")
  const facebookImage = createCidImage(settings.social_facebook_icon, "order-cancel-facebook", "facebook-icon")
  const linkedinImage = createCidImage(settings.social_linkedin_icon, "order-cancel-linkedin", "linkedin-icon")
  const instagramImage = createCidImage(settings.social_instagram_icon, "order-cancel-instagram", "instagram-icon")
  const customerAttachments = [
    logoImage.attachment,
    facebookImage.attachment,
    linkedinImage.attachment,
    instagramImage.attachment,
  ].filter(Boolean)

  const customerText = [
    `Hi ${getCustomerName(order)},`,
    "",
    `Your order #${getOrderNumber(order)} has been canceled.`,
    "If you need any assistance, please contact our support team.",
  ].join("\n")

  const adminText = [
    `Order canceled: #${getOrderNumber(order)}`,
    `Customer: ${getCustomerName(order)}`,
    `Email: ${order.email || "-"}`,
    `Phone: ${order.billing_address?.phone || order.shipping_address?.phone || "-"}`,
    `Total: ${formatAmount(order.total, order.currency_code)}`,
  ].join("\n")

  const tasks: Promise<unknown>[] = []

  if (customerEmail) {
    tasks.push(
      sendEmail({
        to: customerEmail,
        subject: `Order #${getOrderNumber(order)} canceled`,
        text: customerText,
        html: buildCustomerStatusTemplate(
          order,
          settings,
          gstRate,
          {
            logoSrc: logoImage.src,
            facebookIconSrc: facebookImage.src,
            linkedinIconSrc: linkedinImage.src,
            instagramIconSrc: instagramImage.src,
          },
          {
            heading: "Your order has been canceled.",
            body: [
              "We wanted to let you know that your order has been canceled successfully.",
              "If a refund is applicable, it will be processed based on your payment method and bank timelines.",
            ],
            showOrderSummary: false,
          }
        ),
        attachments: customerAttachments,
      })
    )
  }

  if (adminRecipient) {
    tasks.push(
      sendEmail({
        to: adminRecipient,
        subject: `Order canceled #${getOrderNumber(order)}`,
        text: adminText,
        html: buildAdminStatusTemplate(order, gstRate, {
          title: "Order Canceled",
          intro: "An order has been canceled on the website.",
        }),
      })
    )
  }

  await Promise.all(tasks)
}

export const sendOrderRefundEmails = async (
  order: OrderEmailInput,
  options?: {
    scope?: ScopeLike
  }
) => {
  const settings = await getEmailTemplateConfig(options?.scope)
  const gstRate = settings.order_email_gst_rate
  const normalizedOrder = normalizeOrderInput(order)
  const customerEmail = normalizedOrder.email || ""
  const adminRecipient = getAdminRecipient(settings)
  const logoImage = createCidImage(settings.logo_url, "order-refund-logo", "order-refund-logo")
  const facebookImage = createCidImage(settings.social_facebook_icon, "order-refund-facebook", "facebook-icon")
  const linkedinImage = createCidImage(settings.social_linkedin_icon, "order-refund-linkedin", "linkedin-icon")
  const instagramImage = createCidImage(settings.social_instagram_icon, "order-refund-instagram", "instagram-icon")
  const customerAttachments: NonNullable<nodemailer.SendMailOptions["attachments"]> = [
    logoImage.attachment,
    facebookImage.attachment,
    linkedinImage.attachment,
    instagramImage.attachment,
  ].filter(Boolean) as NonNullable<nodemailer.SendMailOptions["attachments"]>

  if (customerEmail) {
    try {
      const receiptBuffer = await generateReceiptBuffer(
        normalizedOrder as unknown as OrderReceiptRecord,
        { receiptLabel: "Payment Refund Receipt" }
      )
      customerAttachments.push({
        filename: `refund-receipt-${getOrderNumber(normalizedOrder)}.pdf`,
        content: receiptBuffer,
        contentType: "application/pdf",
      })
    } catch (error) {
      console.error("Failed to generate refund receipt attachment", error)
    }
  }

  const customerText = [
    `Hi ${getCustomerName(normalizedOrder)},`,
    "",
    `Your refund for order #${getOrderNumber(normalizedOrder)} has been initiated.`,
    "The refunded amount should reflect in your original payment method based on your payment provider and bank timelines.",
    "",
    `Refund amount: ${formatAmount(normalizedOrder.total, normalizedOrder.currency_code)}`,
  ].join("\n")

  const adminText = [
    `Refund processed: #${getOrderNumber(normalizedOrder)}`,
    `Customer: ${getCustomerName(normalizedOrder)}`,
    `Email: ${normalizedOrder.email || "-"}`,
    `Phone: ${normalizedOrder.billing_address?.phone || normalizedOrder.shipping_address?.phone || "-"}`,
    `Refund amount: ${formatAmount(normalizedOrder.total, normalizedOrder.currency_code)}`,
  ].join("\n")

  const tasks: Promise<unknown>[] = []

  if (customerEmail) {
    tasks.push(
      sendEmail({
        to: customerEmail,
        subject: `Refund update for order #${getOrderNumber(normalizedOrder)}`,
        text: customerText,
        html: buildCustomerStatusTemplate(
          normalizedOrder,
          settings,
          gstRate,
          {
            logoSrc: logoImage.src,
            facebookIconSrc: facebookImage.src,
            linkedinIconSrc: linkedinImage.src,
            instagramIconSrc: instagramImage.src,
          },
          {
            heading: "Your refund has been initiated.",
            body: [
              "We have started the refund process for your order.",
              "The refunded amount will be credited back to your original payment method based on your bank and payment provider timelines.",
            ],
          }
        ),
        attachments: customerAttachments,
      })
    )
  }

  if (adminRecipient) {
    tasks.push(
      sendEmail({
        to: adminRecipient,
        subject: `Refund processed for order #${getOrderNumber(normalizedOrder)}`,
        text: adminText,
        html: buildAdminStatusTemplate(normalizedOrder, gstRate, {
          title: "Order Refund",
          intro: "A refund has been initiated for an order on the website.",
        }),
      })
    )
  }

  await Promise.all(tasks)
}
