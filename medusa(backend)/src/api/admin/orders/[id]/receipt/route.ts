import PDFDocument from "pdfkit"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { INVOICE_GENERATOR_MODULE } from "../../../../../modules/invoice-generator"
import type InvoiceGeneratorService from "../../../../../modules/invoice-generator/service"

type Address = {
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
}

type OrderLineItem = {
  title?: string | null
  quantity?: number | null
  raw_quantity?: number | null
  unit_price?: number | null
  total?: number | null
  detail?: {
    quantity?: number | null
    unit_price?: number | null
  } | null
  tax_lines?: Array<{
    total?: number | null
  }> | null
}

export type OrderReceiptRecord = {
  id: string
  display_id?: number | null
  status?: string | null
  payment_status?: string | null
  refund_id?: string | null
  request_id?: string | null
  created_at?: string | Date | null
  email?: string | null
  currency_code?: string | null
  subtotal?: number | null
  tax_total?: number | null
  discount_total?: number | null
  total?: number | null
  summary?: {
    subtotal?: number | null
    tax_total?: number | null
    discount_total?: number | null
    total?: number | null
  } | null
  billing_address?: Address | null
  shipping_address?: Address | null
  items?: OrderLineItem[]
  payment_collections?: unknown[]
}

const PAID_ORDER_PAYMENT_STATUSES = new Set(["paid", "captured"])

const WEBSITE_NAME = process.env.EMAIL_WEBSITE_NAME || "Global IT Success"
const WEBSITE_LOGO_URL = process.env.EMAIL_LOGO_URL || ""
const WEBSITE_SECONDARY_LOGO_URL = process.env.INVOICE_SECONDARY_LOGO_URL || ""

const firstNonEmptyString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return ""
}

const formatMoney = (amount: number | null | undefined, currencyCode: string): string => {
  const value = typeof amount === "number" ? amount : 0
  const code = currencyCode.toUpperCase()

  try {
    const formatted = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
    return `${code} ${formatted}`
  } catch {
    return `${code} ${value.toFixed(2)}`
  }
}

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) {
    return ""
  }

  try {
    const date = new Date(value)
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date)
  } catch {
    return String(value)
  }
}

const formatAddress = (address?: Address | null): string => {
  if (!address) {
    return "N/A"
  }

  const name = firstNonEmptyString(address.first_name, address.last_name)
  const lines = [
    name,
    firstNonEmptyString(address.address_1),
    firstNonEmptyString(address.address_2),
    firstNonEmptyString(address.city, address.province),
    firstNonEmptyString(address.postal_code),
    firstNonEmptyString(address.country_code)?.toUpperCase(),
    firstNonEmptyString(address.phone),
  ].filter(Boolean)

  return lines.length ? lines.join(", ") : "N/A"
}

const getCustomerName = (order: OrderReceiptRecord): string => {
  const first = firstNonEmptyString(
    order.billing_address?.first_name,
    order.shipping_address?.first_name,
    "Customer"
  )
  const last = firstNonEmptyString(order.billing_address?.last_name, order.shipping_address?.last_name)
  return [first, last].filter(Boolean).join(" ").trim()
}

const fetchImageBuffer = async (url: string): Promise<Buffer | null> => {
  if (!url.trim()) {
    return null
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      return null
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase()
    if (!contentType.includes("png") && !contentType.includes("jpeg") && !contentType.includes("jpg")) {
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

const getLogoBuffer = async (sourceValue: string): Promise<Buffer | null> => {
  const source = sourceValue.trim()
  if (!source) {
    return null
  }

  const dataUriMatch = source.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/)
  if (dataUriMatch?.[1]) {
    try {
      return Buffer.from(dataUriMatch[1], "base64")
    } catch {
      return null
    }
  }

  if (source.startsWith("http://") || source.startsWith("https://")) {
    return await fetchImageBuffer(source)
  }

  // Fallback for raw base64 without data URI prefix.
  try {
    return Buffer.from(source, "base64")
  } catch {
    return null
  }
}

const getValueFromRecord = (value: unknown, keys: string[]): string => {
  if (!value || typeof value !== "object") {
    return ""
  }

  const record = value as Record<string, unknown>
  return firstNonEmptyString(...keys.map((key) => record[key]))
}

const getPaymentDetails = (order: OrderReceiptRecord): {
  transactionId: string
  paymentMode: string
  bankRef: string
  refundId: string
  requestId: string
} => {
  const transactionKeys = [
    "transaction_id",
    "payment_transaction_id",
    "easebuzz_txnid",
    "easebuzz_id",
    "easepayid",
    "txnid",
    "mihpayid",
  ]
  const paymentModeKeys = [
    "payment_mode",
    "mode",
    "paymentMode",
    "easebuzz_payment_mode",
    "pg_type",
    "PG_TYPE",
    "card_type",
    "bankcode",
  ]
  const bankRefKeys = [
    "bank_ref",
    "bank_ref_num",
    "bank_ref_no",
    "bank_ref_number",
    "utr",
    "rrn",
  ]
  const refundIdKeys = [
    "refund_id",
    "refund_request_id",
    "merchant_refund_id",
    "easebuzz_refund_id",
    "refundid",
  ]
  const requestIdKeys = [
    "request_id",
    "refund_request_id",
    "merchant_refund_id",
    "refund_reference",
  ]

  const collections = Array.isArray(order.payment_collections)
    ? order.payment_collections
    : []

  const findInCollections = (keys: string[]): string => {
    for (const collection of collections) {
      const direct = getValueFromRecord(collection, keys)
      if (direct) return direct

      const collectionData = getValueFromRecord(
        collection && typeof collection === "object"
          ? (collection as Record<string, unknown>).data
          : undefined,
        keys
      )
      if (collectionData) return collectionData

      const nestedGroups: Array<unknown> = []
      if (collection && typeof collection === "object") {
        const c = collection as Record<string, unknown>
        if (Array.isArray(c.payment_sessions)) nestedGroups.push(...c.payment_sessions)
        if (Array.isArray(c.payments)) nestedGroups.push(...c.payments)
      }

      for (const nested of nestedGroups) {
        const nestedDirect = getValueFromRecord(nested, keys)
        if (nestedDirect) return nestedDirect

        const nestedData = getValueFromRecord(
          nested && typeof nested === "object"
            ? (nested as Record<string, unknown>).data
            : undefined,
          keys
        )
        if (nestedData) return nestedData

        const nestedMeta = getValueFromRecord(
          nested && typeof nested === "object"
            ? (nested as Record<string, unknown>).metadata
            : undefined,
          keys
        )
        if (nestedMeta) return nestedMeta

        const captures =
          nested &&
          typeof nested === "object" &&
          Array.isArray((nested as Record<string, unknown>).captures)
            ? ((nested as Record<string, unknown>).captures as unknown[])
            : []

        for (const capture of captures) {
          const captureValue = getValueFromRecord(capture, keys)
          if (captureValue) return captureValue
          const captureData = getValueFromRecord(
            capture && typeof capture === "object"
              ? (capture as Record<string, unknown>).data
              : undefined,
            keys
          )
          if (captureData) return captureData
        }
      }
    }

    return ""
  }

  return {
    transactionId: firstNonEmptyString(
      getValueFromRecord(order, transactionKeys),
      findInCollections(transactionKeys)
    ),
    paymentMode: firstNonEmptyString(
      getValueFromRecord(order, paymentModeKeys),
      findInCollections(paymentModeKeys)
    ),
    bankRef: firstNonEmptyString(
      getValueFromRecord(order, bankRefKeys),
      findInCollections(bankRefKeys)
    ),
    refundId: firstNonEmptyString(
      order.refund_id,
      getValueFromRecord(order, refundIdKeys),
      findInCollections(refundIdKeys)
    ),
    requestId: firstNonEmptyString(
      order.request_id,
      getValueFromRecord(order, requestIdKeys),
      findInCollections(requestIdKeys)
    ),
  }
}

const toNumericValue = (value: unknown, depth = 0): number | null => {
  if (depth > 3) {
    return null
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }

  if (value && typeof value === "object") {
    const candidate = value as Record<string, unknown>
    const commonKeys = ["value", "amount", "raw", "number", "numeric", "qty"]
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

const pickNumericValue = (record: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const path = key.split(".")
    let current: unknown = record
    for (const part of path) {
      if (!current || typeof current !== "object") {
        current = undefined
        break
      }
      current = (current as Record<string, unknown>)[part]
    }
    const parsed = toNumericValue(current)
    if (parsed !== null) {
      return parsed
    }
  }
  return null
}

const getPaymentAmountFallback = (order: OrderReceiptRecord): number | null => {
  const collections = Array.isArray(order.payment_collections)
    ? order.payment_collections
    : []

  const readAmount = (value: unknown): number | null => {
    if (!value || typeof value !== "object") {
      return null
    }
    const record = value as Record<string, unknown>
    return (
      toNumericValue(record.amount) ??
      toNumericValue(record.net_amount_debit) ??
      toNumericValue(record.total) ??
      null
    )
  }

  for (const collection of collections) {
    const direct = readAmount(collection)
    if (direct !== null) return direct

    if (collection && typeof collection === "object") {
      const c = collection as Record<string, unknown>
      const dataAmount = readAmount(c.data)
      if (dataAmount !== null) return dataAmount

      const sessions = Array.isArray(c.payment_sessions) ? c.payment_sessions : []
      const payments = Array.isArray(c.payments) ? c.payments : []
      for (const entry of [...sessions, ...payments]) {
        const entryAmount = readAmount(entry)
        if (entryAmount !== null) return entryAmount
        const entryDataAmount = readAmount(
          entry && typeof entry === "object"
            ? (entry as Record<string, unknown>).data
            : undefined
        )
        if (entryDataAmount !== null) return entryDataAmount
      }
    }
  }

  return null
}

const getEffectiveAmount = (
  orderAmount: number | null | undefined,
  summaryAmount: number | null | undefined
): number | null => {
  if (typeof summaryAmount === "number") {
    return summaryAmount
  }
  if (typeof orderAmount === "number") {
    return orderAmount
  }
  return null
}

const getOrderTotals = (order: OrderReceiptRecord): {
  subtotal: number | null
  tax_total: number | null
  discount_total: number | null
  total: number | null
} => {
  const items = Array.isArray(order.items) ? order.items : []

  const computedTotal = items.reduce((sum, item) => {
    const itemObj = (item || {}) as Record<string, unknown>
    const qty =
      pickNumericValue(itemObj, ["quantity", "raw_quantity", "detail.quantity"]) ??
      // Fall back to quantity 1 when a unit price exists but quantity isn't returned.
      (pickNumericValue(itemObj, ["unit_price", "detail.unit_price"]) !== null ? 1 : 0)
    const unit = pickNumericValue(itemObj, ["unit_price", "detail.unit_price"]) ?? 0
    return sum + unit * qty
  }, 0)

  const discountTotal =
    getEffectiveAmount(order.discount_total, order.summary?.discount_total) ?? 0

  const asPositiveOrZero = (value: number | null | undefined): number => {
    return typeof value === "number" && value > 0 ? value : 0
  }

  const summaryOrOrderTotal = asPositiveOrZero(
    getEffectiveAmount(order.total, order.summary?.total)
  )
  const paymentFallback = asPositiveOrZero(getPaymentAmountFallback(order))
  const total =
    computedTotal > 0 ? computedTotal : summaryOrOrderTotal > 0 ? summaryOrOrderTotal : paymentFallback

  const gstRate = Number(process.env.ORDER_EMAIL_GST_RATE || 18)
  const taxTotal =
    total > 0 && gstRate > 0
      ? Number(((total * gstRate) / (100 + gstRate)).toFixed(2))
      : 0
  const subtotal = Number((total - taxTotal).toFixed(2))

  return {
    subtotal,
    tax_total: taxTotal,
    discount_total: discountTotal,
    total,
  }
}

export const isPaidOrderForDocuments = (order: OrderReceiptRecord): boolean => {
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
    if (!collection || typeof collection !== "object") {
      continue
    }

    const payments = Array.isArray((collection as Record<string, unknown>).payments)
      ? ((collection as Record<string, unknown>).payments as unknown[])
      : []

    for (const payment of payments) {
      if (!payment || typeof payment !== "object") {
        continue
      }

      const captures = Array.isArray((payment as Record<string, unknown>).captures)
        ? ((payment as Record<string, unknown>).captures as unknown[])
        : []

      for (const capture of captures) {
        const captureId =
          capture && typeof capture === "object"
            ? String((capture as Record<string, unknown>).id || "").trim()
            : ""
        if (captureId) {
          return true
        }
      }
    }
  }

  return false
}

export const generateReceiptBuffer = async (
  order: OrderReceiptRecord,
  options?: {
    includeRawJson?: boolean
    receiptLabel?: string
    companyLogoUrl?: string
    secondaryLogoUrl?: string
  }
): Promise<Buffer> => {
  const includeRawJson = options?.includeRawJson === true
  const receiptLabel = firstNonEmptyString(
    options?.receiptLabel,
    `Payment Receipt`,
  )
  const [logoBuffer, secondaryLogoBuffer] = await Promise.all([
    getLogoBuffer(firstNonEmptyString(options?.companyLogoUrl, WEBSITE_LOGO_URL)),
    getLogoBuffer(firstNonEmptyString(options?.secondaryLogoUrl, WEBSITE_SECONDARY_LOGO_URL)),
  ])

  return await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 })
    const chunks: Buffer[] = []

    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const currencyCode = firstNonEmptyString(order.currency_code, "INR")
    const payment = getPaymentDetails(order)
    const totals = getOrderTotals(order)
    const orderNumber = order.display_id ? `#${order.display_id}` : order.id
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const left = doc.page.margins.left
    const gstRate = Number(process.env.ORDER_EMAIL_GST_RATE || 18)
    const right = left + pageWidth
    const items = Array.isArray(order.items) ? order.items : []

    let y = doc.y
    const logoWidth = 90
    const logoHeight = 42
    const logoGap = 12
    const logoRowHeight = 50

    if (logoBuffer || secondaryLogoBuffer) {
      let currentLogoX = left

      try {
        if (logoBuffer) {
          doc.image(logoBuffer, currentLogoX, y, {
            fit: [logoWidth, logoHeight],
          })
          currentLogoX += logoWidth
        }

        if (logoBuffer && secondaryLogoBuffer) {
          const separatorX = currentLogoX + logoGap / 2
          doc.moveTo(separatorX, y).lineTo(separatorX, y + logoHeight).stroke("#d1d5db")
          currentLogoX = separatorX + logoGap / 2 + 1
        }

        if (secondaryLogoBuffer) {
          doc.image(secondaryLogoBuffer, currentLogoX, y, {
            fit: [logoWidth, logoHeight],
          })
        }
      } catch {
        // Ignore logo rendering issues and continue with receipt content.
      }

      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(16)
      const renderedLogoCount = (logoBuffer ? 1 : 0) + (secondaryLogoBuffer ? 1 : 0)
      const logoTextOffset = logoWidth * renderedLogoCount + (renderedLogoCount > 1 ? 24 : 16)
      doc.text(receiptLabel, left + logoTextOffset, y + 12, {
        width: pageWidth - logoTextOffset,
        align: "right",
      })
      y += logoRowHeight
    } else {
      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(14)
      doc.text(receiptLabel, left, y, { width: pageWidth })
      y += 32
    }
    doc.moveTo(left, y).lineTo(right, y).stroke("#d1d5db")
    y += 14

    const drawMetaRow = (label: string, value: string) => {
      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10)
      doc.text(`${label}:`, left, y, { width: 140 })
      doc.fillColor("#374151").font("Helvetica").text(value || "-", left + 140, y, { width: pageWidth - 140 })
      y += 16
    }

    // drawMetaRow("Order ID", order.id)
    drawMetaRow("Order Number", orderNumber)
    drawMetaRow("Order Time", formatDate(order.created_at) || "N/A")
    drawMetaRow("Customer Name", getCustomerName(order))
    drawMetaRow("Customer Email", firstNonEmptyString(order.email, "N/A"))
    // drawMetaRow("Order Status", firstNonEmptyString(order.status, "Pending"))
    drawMetaRow("Transaction ID", firstNonEmptyString(payment.transactionId, "N/A"))
    if (payment.refundId) {
      drawMetaRow("Refund ID", payment.refundId)
    }
    if (payment.requestId) {
      drawMetaRow("Request ID", payment.requestId)
    }
    y += 6

    const tableX = left
    const tableW = pageWidth
    const gutter = 8
    const col = {
      item: 250,
      qty: 48,
      unit: 96,
      total: tableW - 250 - 48 - 96 - gutter * 2,
    }
    const tableRightPad = 14
    const xItem = tableX + 8
    const xQty = tableX + col.item
    const xUnit = xQty + col.qty + gutter
    const xTotal = xUnit + col.unit + gutter

    const ensureSpace = (needed: number) => {
      if (y + needed <= doc.page.height - doc.page.margins.bottom) {
        return
      }
      doc.addPage()
      y = doc.page.margins.top
    }

    ensureSpace(180)

    doc
      .rect(tableX, y, tableW, 24)
      .fillAndStroke("#e5e7eb", "#d1d5db")
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9.5)
    doc.text("Item", xItem, y + 7, { width: col.item - 12 })
    doc.text("Qty", xQty, y + 7, { width: col.qty, align: "right" })
    doc.text("Unit Price", xUnit, y + 7, { width: col.unit - 4, align: "right" })
    doc.text("Line Total", xTotal, y + 7, { width: col.total - tableRightPad, align: "right" })
    y += 24

    doc.font("Helvetica").fontSize(9.5).fillColor("#0f172a")
    if (!items.length) {
      doc.rect(tableX, y, tableW, 24).stroke("#e2e8f0")
      doc.text("No items", tableX + 8, y + 7)
      y += 24
    } else {
      for (const item of items) {
        ensureSpace(30)
        const qty = toNumericValue(item.quantity) ?? toNumericValue(item.raw_quantity) ?? 1
        const unit = toNumericValue(item.unit_price) ?? toNumericValue(item.detail?.unit_price) ?? 0
        const line = unit * qty
        const title = firstNonEmptyString(item.title, "Item")
        const rowH = 24
        doc.rect(tableX, y, tableW, rowH).stroke("#e2e8f0")
        doc.text(title, xItem, y + 7, { width: col.item - 12, ellipsis: true })
        doc.text(String(qty), xQty, y + 7, {
          width: col.qty,
          align: "right",
          lineBreak: false,
        })
        doc.text(formatMoney(unit, currencyCode), xUnit, y + 7, {
          width: col.unit - 4,
          align: "right",
          lineBreak: false,
        })
        doc.text(formatMoney(line, currencyCode), xTotal, y + 7, {
          width: col.total - tableRightPad,
          align: "right",
          lineBreak: false,
        })
        y += rowH
      }
    }

    y += 18
    ensureSpace(130)
    const totalsX = right - 290
    const totalsW = 280
    const totalsPad = 8
    const labelW = 136
    const valueW = totalsW - labelW - totalsPad
    const row = (label: string, value: string, bold = false) => {
      doc.fillColor("#1e293b").font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10)
      doc.text(label, totalsX, y, { width: labelW })
      doc.text(value, totalsX + labelW + totalsPad, y, {
        width: valueW,
        align: "right",
        lineBreak: false,
      })
      y += bold ? 20 : 16
    }

    row("Subtotal (Excl GST)", formatMoney(totals.subtotal, currencyCode))
    row(`GST Included (${gstRate}%)`, formatMoney(totals.tax_total, currencyCode))
    doc.moveTo(totalsX, y + 2).lineTo(totalsX + totalsW, y + 2).stroke("#cbd5e1")
    y += 8
    row("Grand Total", formatMoney(totals.total, currencyCode), true)

    doc.fillColor("#64748b").font("Helvetica").fontSize(9)
    doc.text(
      "This is a computer-generated receipt and does not require a signature.",
      left,
      Math.max(y + 18, doc.page.height - doc.page.margins.bottom - 24),
      { width: pageWidth, align: "left" }
    )

    if (includeRawJson) {
      // Append raw JSON for key mapping/debugging.
      doc.addPage()
      doc.font("Helvetica-Bold").fontSize(14).text("Raw JSON (Debug)")
      doc.moveDown(0.5)
      doc.font("Helvetica").fontSize(9).fillColor("#666666").text(
        "Use this section to inspect exact keys returned by the order/payment objects."
      )
      doc.fillColor("#000000")
      doc.moveDown(0.6)

      const rawDebugPayload = {
        extracted_payment_details: payment,
        order: {
          ...order,
          subtotal: totals.subtotal,
          tax_total: totals.tax_total,
          discount_total: totals.discount_total,
          total: totals.total,
        },
      }

      const rawJson = JSON.stringify(rawDebugPayload, null, 2)

      doc.font("Courier").fontSize(8).text(rawJson, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: "left",
      })
    }

    doc.end()
  })
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
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

  const order = (orders as OrderReceiptRecord[] | undefined)?.[0]
  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }

  if (!isPaidOrderForDocuments(order)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Receipt can only be generated after payment is completed."
    )
  }

  const includeRawJson = String((req.query as Record<string, unknown> | undefined)?.include_raw_json || "")
    .toLowerCase() === "true"
  const requestedLabel = firstNonEmptyString(
    (req.query as Record<string, unknown> | undefined)?.receipt_label
  )
  const invoiceService: InvoiceGeneratorService = req.scope.resolve(INVOICE_GENERATOR_MODULE)
  const configs = (await invoiceService.listInvoiceConfigs({})) as Array<{
    company_logo?: string | null
    secondary_logo?: string | null
  }>
  const invoiceConfig = configs?.[0]

  const pdfBuffer = await generateReceiptBuffer(order, {
    includeRawJson,
    receiptLabel: requestedLabel || undefined,
    companyLogoUrl: firstNonEmptyString(invoiceConfig?.company_logo, WEBSITE_LOGO_URL),
    secondaryLogoUrl: firstNonEmptyString(
      invoiceConfig?.secondary_logo,
      WEBSITE_SECONDARY_LOGO_URL
    ),
  })
  const filename = `order-receipt-${order.display_id || order.id}.pdf`

  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
  res.status(200).send(pdfBuffer)
}
