import PDFDocument from "pdfkit"

type Address = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
}

type OrderLineItem = {
  title?: string | null
  product_id?: string | null
  hsn_code?: string | null
  hsn?: string | null
  sac_code?: string | null
  sac?: string | null
  metadata?: Record<string, unknown> | null
  product?: {
    hsn_code?: string | null
    hsn?: string | null
    sac_code?: string | null
    sac?: string | null
    attributes?: unknown
    metadata?: Record<string, unknown> | null
  } | null
  variant?: {
    hsn_code?: string | null
    hsn?: string | null
    sac_code?: string | null
    sac?: string | null
    metadata?: Record<string, unknown> | null
    product?: {
      hsn_code?: string | null
      hsn?: string | null
      sac_code?: string | null
      sac?: string | null
      attributes?: unknown
      metadata?: Record<string, unknown> | null
    } | null
  } | null
  quantity?: number | null
  raw_quantity?: number | null
  unit_price?: number | null
  total?: number | null
  detail?: {
    quantity?: number | null
    unit_price?: number | null
  } | null
}

export type InvoiceOrderRecord = {
  id: string
  display_id?: string | number | null
  created_at?: string | Date | null
  email?: string | null
  currency_code?: string | null
  subtotal?: number | null
  tax_total?: number | null
  total?: number | null
  summary?: {
    subtotal?: number | null
    tax_total?: number | null
    total?: number | null
  } | null
  billing_address?: Address | null
  shipping_address?: Address | null
  items?: OrderLineItem[] | null
  payment_collections?: unknown[] | null
}

export type InvoiceConfigRecord = {
  id?: string
  company_name?: string | null
  company_address?: string | null
  company_phone?: string | null
  company_email?: string | null
  company_logo?: string | null
  secondary_logo?: string | null
  gstin?: string | null
  state?: string | null
  sac_code?: string | null
  reverse_charge?: string | null
  signature_name?: string | null
  notes?: string | null
  copyright_text?: string | null
}

type InvoiceLine = {
  no: number
  title: string
  qty: number
  unit_price: number
  amount: number
  sac_code: string
  tax_rate: number
}

export type InvoiceSnapshot = {
  invoice_number: string
  invoice_date: string
  order_id: string
  order_number: string
  transaction_id: string
  payment_id: string
  payment_mode: string
  shipping_method: string
  customer_name: string
  customer_email: string
  customer_phone: string
  billing_address: string[]
  place_of_supply: string
  currency_code: string
  lines: InvoiceLine[]
  subtotal: number
  tax_total: number
  total: number
  seller: {
    company_name: string
    company_address: string
    company_phone: string
    company_email: string
    company_logo: string
    secondary_logo: string
    gstin: string
    state: string
  }
  metadata: {
    sac_code: string
    reverse_charge: string
    signature_name: string
    notes: string
    copyright_text: string
    gst_rate: number
  }
}

const WEBSITE_NAME = process.env.EMAIL_WEBSITE_NAME || "Global IT Success"
const WEBSITE_LOGO_URL = process.env.EMAIL_LOGO_URL || ""
const GST_RATE = Number(process.env.ORDER_EMAIL_GST_RATE || 18)

const firstNonEmptyString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return ""
}

const ensureInvoicePrefix = (value: string): string => {
  const normalized = firstNonEmptyString(value).trim()
  if (!normalized) {
    return "INV-NA"
  }

  if (/^INV-?GIS\//i.test(normalized)) {
    return normalized.replace(/^INV-?/i, "")
  }

  if (/^GIS\//i.test(normalized)) {
    return normalized
  }

  if (/^INV/i.test(normalized)) {
    return normalized
  }

  return `INV-${normalized.replace(/^#/, "")}`
}

const buildWebInvoiceNumber = (
  order: InvoiceOrderRecord,
  fallbackInvoiceNumber?: string
): string => {
  const createdDate = new Date(order.created_at || new Date())
  const createdAtMs = createdDate.getTime()
  const safeDate = Number.isFinite(createdAtMs) ? createdDate : new Date()

  const createdYear = safeDate.getFullYear()
  const createdMonth = safeDate.getMonth()
  const fyStartYear = createdMonth >= 3 ? createdYear : createdYear - 1
  const fyEndYearShort = String((fyStartYear + 1) % 100).padStart(2, "0")

  const rawOrderNumber = firstNonEmptyString(
    order.display_id != null ? String(order.display_id) : "",
    order.id
  )
  const normalizedOrderNumber = rawOrderNumber.replace(/[^0-9A-Za-z]/g, "").trim()
  const numericOrderNumber = normalizedOrderNumber.replace(/[^0-9]/g, "")

  if (!normalizedOrderNumber && !firstNonEmptyString(fallbackInvoiceNumber)) {
    return ensureInvoicePrefix(firstNonEmptyString(fallbackInvoiceNumber, "INV-NA"))
  }

  const orderSegment = (numericOrderNumber || normalizedOrderNumber || "0")
    .slice(-6)
    .padStart(6, "0")

  return `GIS/${fyStartYear}-${fyEndYearShort}/${orderSegment}`
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
    for (const key of ["value", "amount", "raw", "number", "numeric"]) {
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

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) {
    return ""
  }
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return String(value)
  }
}

const formatMoney = (amount: number | null | undefined, currencyCode: string): string => {
  const value = typeof amount === "number" ? amount : 0
  const code = firstNonEmptyString(currencyCode, "INR").toUpperCase()
  return `${code} ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`
}

const getCustomerName = (order: InvoiceOrderRecord): string => {
  const first = firstNonEmptyString(
    order.billing_address?.first_name,
    order.shipping_address?.first_name,
    "Customer"
  )
  const last = firstNonEmptyString(order.billing_address?.last_name, order.shipping_address?.last_name)
  return [first, last].filter(Boolean).join(" ").trim()
}

const getCustomerPhone = (order: InvoiceOrderRecord): string => {
  return firstNonEmptyString(order.billing_address?.phone, order.shipping_address?.phone, "N/A")
}

const formatCustomerAddress = (address?: Address | null): string[] => {
  if (!address) {
    return []
  }
  const line1 = firstNonEmptyString(address.address_1)
  const line2 = firstNonEmptyString(address.address_2)
  const cityLine = [address.city, address.province, address.postal_code]
    .map((v) => firstNonEmptyString(v))
    .filter(Boolean)
    .join(", ")
  const country = firstNonEmptyString(address.country_code).toUpperCase()
  return [line1, line2, cityLine, country].filter(Boolean)
}

const readTransactionValue = (value: unknown): string => {
  const keys = ["transaction_id", "easebuzz_txnid", "txnid", "easebuzz_id", "easepayid"]
  if (!value || typeof value !== "object") {
    return ""
  }
  const record = value as Record<string, unknown>
  for (const key of keys) {
    const matched = firstNonEmptyString(record[key])
    if (matched) {
      return matched
    }
  }
  return ""
}

const readPaymentValueByKeys = (value: unknown, keys: string[]): string => {
  if (!value || typeof value !== "object") {
    return ""
  }

  const record = value as Record<string, unknown>
  for (const key of keys) {
    const matched = firstNonEmptyString(record[key])
    if (matched) {
      return matched
    }
  }
  return ""
}

const findPaymentValueInCollections = (order: InvoiceOrderRecord, keys: string[]): string => {
  const collections = Array.isArray(order.payment_collections) ? order.payment_collections : []
  for (const collection of collections) {
    const fromCollection = readPaymentValueByKeys(collection, keys)
    if (fromCollection) {
      return fromCollection
    }

    if (collection && typeof collection === "object") {
      const collectionRecord = collection as Record<string, unknown>
      const fromCollectionData = readPaymentValueByKeys(collectionRecord.data, keys)
      if (fromCollectionData) {
        return fromCollectionData
      }

      const entries: unknown[] = []
      if (Array.isArray(collectionRecord.payment_sessions)) {
        entries.push(...collectionRecord.payment_sessions)
      }
      if (Array.isArray(collectionRecord.payments)) {
        entries.push(...collectionRecord.payments)
      }

      for (const entry of entries) {
        const fromEntry = readPaymentValueByKeys(entry, keys)
        if (fromEntry) {
          return fromEntry
        }

        const entryRecord =
          entry && typeof entry === "object"
            ? (entry as Record<string, unknown>)
            : undefined

        const fromEntryData = readPaymentValueByKeys(entryRecord?.data, keys)
        if (fromEntryData) {
          return fromEntryData
        }

        const fromEntryMetadata = readPaymentValueByKeys(entryRecord?.metadata, keys)
        if (fromEntryMetadata) {
          return fromEntryMetadata
        }
      }
    }
  }

  return ""
}

const getTransactionId = (order: InvoiceOrderRecord): string => {
  const direct = readTransactionValue(order)
  if (direct) {
    return direct
  }

  const collections = Array.isArray(order.payment_collections) ? order.payment_collections : []
  for (const collection of collections) {
    const fromCollection = readTransactionValue(collection)
    if (fromCollection) {
      return fromCollection
    }

    if (collection && typeof collection === "object") {
      const collectionRecord = collection as Record<string, unknown>
      const fromCollectionData = readTransactionValue(collectionRecord.data)
      if (fromCollectionData) {
        return fromCollectionData
      }

      const entries: unknown[] = []
      if (Array.isArray(collectionRecord.payment_sessions)) {
        entries.push(...collectionRecord.payment_sessions)
      }
      if (Array.isArray(collectionRecord.payments)) {
        entries.push(...collectionRecord.payments)
      }

      for (const entry of entries) {
        const fromEntry = readTransactionValue(entry)
        if (fromEntry) {
          return fromEntry
        }
        const fromEntryData = readTransactionValue(
          entry && typeof entry === "object"
            ? (entry as Record<string, unknown>).data
            : undefined
        )
        if (fromEntryData) {
          return fromEntryData
        }
      }
    }
  }

  return ""
}

const getPaymentId = (order: InvoiceOrderRecord): string => {
  const keys = [
    "payment_id",
    "paymentId",
    "easepayid",
    "mihpayid",
    "payment_reference",
    "payment_ref",
    "transaction_id",
    "easebuzz_txnid",
    "txnid",
  ]
  return firstNonEmptyString(
    readPaymentValueByKeys(order, keys),
    findPaymentValueInCollections(order, keys),
    getTransactionId(order),
    "N/A"
  )
}

const getPaymentMode = (order: InvoiceOrderRecord): string => {
  const keys = [
    "payment_mode",
    "mode",
    "paymentMode",
    "easebuzz_payment_mode",
    "pg_type",
    "PG_TYPE",
    "card_type",
    "bankcode",
  ]
  return firstNonEmptyString(
    readPaymentValueByKeys(order, keys),
    findPaymentValueInCollections(order, keys),
    "N/A"
  )
}

const getMetadataValueByKeys = (
  value: unknown,
  keys: string[]
): string => {
  if (!value || typeof value !== "object") {
    return ""
  }

  const metadata = value as Record<string, unknown>
  for (const key of keys) {
    const found = firstNonEmptyString(metadata[key])
    if (found) {
      return found
    }
  }
  return ""
}

const getAttributeValueByName = (attributes: unknown, names: string[]): string => {
  if (!Array.isArray(attributes)) {
    return ""
  }

  for (const entry of attributes) {
    if (!entry || typeof entry !== "object") {
      continue
    }

    const item = entry as Record<string, unknown>
    const rawName = firstNonEmptyString(item.name, item.label, item.key, item.title)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()

    if (!rawName) {
      continue
    }

    const matched = names.some((name) => rawName === name || rawName.includes(name))
    if (!matched) {
      continue
    }

    const fromValue = firstNonEmptyString(item.value)
    if (fromValue) {
      return fromValue
    }

    const values = item.values
    if (Array.isArray(values)) {
      for (const value of values) {
        const text = firstNonEmptyString(value)
        if (text) {
          return text
        }
      }
    }
  }

  return ""
}

const getItemSacCode = (item: OrderLineItem, fallbackSacCode: string): string => {
  const attributeNameKeys = ["hs code", "hscode", "hsn code", "hsn", "sac code", "sac"]

  const fromProductAttributes = getAttributeValueByName(
    item.product?.attributes,
    attributeNameKeys
  )
  if (fromProductAttributes) {
    return fromProductAttributes
  }

  const fromVariantProductAttributes = getAttributeValueByName(
    item.variant?.product?.attributes,
    attributeNameKeys
  )
  if (fromVariantProductAttributes) {
    return fromVariantProductAttributes
  }

  const direct = firstNonEmptyString(item.hsn_code, item.hsn, item.sac_code, item.sac)
  if (direct) {
    return direct
  }

  const fromProductDirect = firstNonEmptyString(
    item.product?.hsn_code,
    item.product?.hsn,
    item.product?.sac_code,
    item.product?.sac
  )
  if (fromProductDirect) {
    return fromProductDirect
  }

  const fromVariantDirect = firstNonEmptyString(
    item.variant?.hsn_code,
    item.variant?.hsn,
    item.variant?.sac_code,
    item.variant?.sac
  )
  if (fromVariantDirect) {
    return fromVariantDirect
  }

  const fromVariantProductDirect = firstNonEmptyString(
    item.variant?.product?.hsn_code,
    item.variant?.product?.hsn,
    item.variant?.product?.sac_code,
    item.variant?.product?.sac
  )
  if (fromVariantProductDirect) {
    return fromVariantProductDirect
  }

  const keys = [
    "hsn_code",
    "hsn",
    "sac_code",
    "sac",
    "hsnCode",
    "sacCode",
  ]

  const fromItemMetadata = getMetadataValueByKeys(item.metadata, keys)
  if (fromItemMetadata) {
    return fromItemMetadata
  }

  const fromProductMetadata = getMetadataValueByKeys(item.product?.metadata, keys)
  if (fromProductMetadata) {
    return fromProductMetadata
  }

  const fromVariantMetadata = getMetadataValueByKeys(item.variant?.metadata, keys)
  if (fromVariantMetadata) {
    return fromVariantMetadata
  }

  const fromVariantProductMetadata = getMetadataValueByKeys(
    item.variant?.product?.metadata,
    keys
  )
  if (fromVariantProductMetadata) {
    return fromVariantProductMetadata
  }

  return firstNonEmptyString(fallbackSacCode, "-")
}

const getOrderTotals = (order: InvoiceOrderRecord): {
  subtotal: number
  taxTotal: number
  total: number
} => {
  const items = Array.isArray(order.items) ? order.items : []
  const computedSubtotal = items.reduce((sum, item) => {
    const qty = toNumericValue(item?.quantity) ?? toNumericValue(item?.raw_quantity) ?? 1
    const unit = toNumericValue(item?.unit_price) ?? toNumericValue(item?.detail?.unit_price) ?? 0
    return sum + unit * qty
  }, 0)

  const summarySubtotal = toNumericValue(order.summary?.subtotal)
  const summaryTax = toNumericValue(order.summary?.tax_total)
  const summaryTotal = toNumericValue(order.summary?.total)
  const rawSubtotal = toNumericValue(order.subtotal)
  const rawTax = toNumericValue(order.tax_total)
  const rawTotal = toNumericValue(order.total)

  // Keep summary aligned with shown lines: when line items exist, use their computed total.
  const hasLineAmounts = items.length > 0 && computedSubtotal > 0
  let total = hasLineAmounts ? computedSubtotal : summaryTotal ?? rawTotal ?? computedSubtotal
  if (total <= 0) {
    total = summarySubtotal ?? rawSubtotal ?? 0
  }

  // Show subtotal as tax-exclusive amount derived from total.
  let subtotal = summarySubtotal ?? rawSubtotal ?? 0
  let taxTotal = summaryTax ?? rawTax ?? 0
  if (total > 0 && GST_RATE > 0) {
    taxTotal = Number(((total * GST_RATE) / (100 + GST_RATE)).toFixed(2))
    subtotal = Number((total - taxTotal).toFixed(2))
  } else if (subtotal > 0 && taxTotal <= 0 && GST_RATE > 0) {
    taxTotal = Number(((subtotal * GST_RATE) / 100).toFixed(2))
    total = Number((subtotal + taxTotal).toFixed(2))
  }

  return { subtotal, taxTotal, total }
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
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

const getLogoBuffer = async (logoSource: string): Promise<Buffer | null> => {
  const source = logoSource.trim()
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
  try {
    return Buffer.from(source, "base64")
  } catch {
    return null
  }
}

export const getDefaultInvoiceConfig = (): InvoiceConfigRecord => {
  return {
    company_name: process.env.INVOICE_SELLER_NAME || WEBSITE_NAME,
    company_address: process.env.INVOICE_SELLER_ADDRESS || "",
    company_phone: process.env.INVOICE_SELLER_PHONE || "",
    company_email: process.env.INVOICE_SELLER_EMAIL || "",
    company_logo: WEBSITE_LOGO_URL,
    secondary_logo: process.env.INVOICE_SECONDARY_LOGO_URL || "",
    gstin: process.env.INVOICE_SELLER_GSTIN || "",
    state: process.env.INVOICE_SELLER_STATE || "",
    sac_code: process.env.INVOICE_SAC_CODE || "",
    reverse_charge: process.env.INVOICE_REVERSE_CHARGE || "No",
    signature_name: process.env.INVOICE_SIGNATURE_NAME || "",
    notes: process.env.INVOICE_NOTES || "",
    copyright_text: process.env.INVOICE_COPYRIGHT_TEXT || "",
  }
}

export const buildInvoiceSnapshot = (
  order: InvoiceOrderRecord,
  config?: InvoiceConfigRecord | null,
  invoiceNumber?: string
): InvoiceSnapshot => {
  const invoiceConfig = {
    ...getDefaultInvoiceConfig(),
    ...(config || {}),
  }

  const totals = getOrderTotals(order)
  const currencyCode = firstNonEmptyString(order.currency_code, "INR")
  const items = Array.isArray(order.items) ? order.items : []

  const lines: InvoiceLine[] =
    items.length > 0
      ? items.map((item, index) => {
          const qty = toNumericValue(item?.quantity) ?? toNumericValue(item?.raw_quantity) ?? 1
          const unit = toNumericValue(item?.unit_price) ?? toNumericValue(item?.detail?.unit_price) ?? 0
          const lineTotal = unit * qty
          return {
            no: index + 1,
            title: firstNonEmptyString(item?.title, "Digital Product"),
            qty,
            unit_price: unit,
            amount: lineTotal,
            sac_code: getItemSacCode(item, "-"),
            tax_rate: GST_RATE,
          }
        })
      : [
          {
            no: 1,
            title: "Digital Product",
            qty: 1,
            unit_price: totals.subtotal,
            amount: totals.subtotal,
            sac_code: "-",
            tax_rate: GST_RATE,
          },
        ]

  const invoiceNo = buildWebInvoiceNumber(order, invoiceNumber)

  return {
    invoice_number: invoiceNo,
    invoice_date: formatDate(order.created_at),
    order_id: order.id,
    order_number: order.display_id ? `#${order.display_id}` : order.id,
    transaction_id: firstNonEmptyString(getTransactionId(order), "N/A"),
    payment_id: getPaymentId(order),
    payment_mode: getPaymentMode(order),
    shipping_method: "Delivered via Email",
    customer_name: getCustomerName(order),
    customer_email: firstNonEmptyString(order.email, "N/A"),
    customer_phone: getCustomerPhone(order),
    billing_address: formatCustomerAddress(order.billing_address),
    place_of_supply: firstNonEmptyString(order.billing_address?.country_code).toUpperCase(),
    currency_code: currencyCode,
    lines,
    subtotal: totals.subtotal,
    tax_total: totals.taxTotal,
    total: totals.total,
    seller: {
      company_name: firstNonEmptyString(invoiceConfig.company_name, WEBSITE_NAME),
      company_address: firstNonEmptyString(invoiceConfig.company_address),
      company_phone: firstNonEmptyString(invoiceConfig.company_phone),
      company_email: firstNonEmptyString(invoiceConfig.company_email),
      company_logo: firstNonEmptyString(invoiceConfig.company_logo),
      secondary_logo: firstNonEmptyString(invoiceConfig.secondary_logo),
      gstin: firstNonEmptyString(invoiceConfig.gstin),
      state: firstNonEmptyString(invoiceConfig.state),
    },
    metadata: {
      sac_code: firstNonEmptyString(invoiceConfig.sac_code),
      reverse_charge: firstNonEmptyString(invoiceConfig.reverse_charge, "No"),
      signature_name: firstNonEmptyString(invoiceConfig.signature_name),
      notes: firstNonEmptyString(invoiceConfig.notes),
      copyright_text: firstNonEmptyString(invoiceConfig.copyright_text),
      gst_rate: GST_RATE,
    },
  }
}

export const generateInvoicePdfBuffer = async (invoice: InvoiceSnapshot): Promise<Buffer> => {
  const [logoBuffer, secondaryLogoBuffer] = await Promise.all([
    getLogoBuffer(invoice.seller.company_logo),
    getLogoBuffer(invoice.seller.secondary_logo),
  ])
  return await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 })
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const left = doc.page.margins.left
    const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const right = left + pageW
    let y = doc.y

    const logoTopY = y
    const logoWidth = 120
    const logoHeight = 44
    const logoSeparatorGap = 12
    let nextLogoX = left
    let logoRowEndX = left

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, nextLogoX, logoTopY, {
          fit: [logoWidth, logoHeight],
        })
        nextLogoX += logoWidth
        logoRowEndX = nextLogoX
      } catch {
        // Continue without rendering logo.
      }
    }

    if (logoBuffer && secondaryLogoBuffer) {
      const separatorX = nextLogoX + logoSeparatorGap
      doc.moveTo(separatorX, logoTopY).lineTo(separatorX, logoTopY + logoHeight).stroke("#d1d5db")
      nextLogoX = separatorX + logoSeparatorGap + 1
    } else if (!logoBuffer && secondaryLogoBuffer) {
      nextLogoX = left
    }

    if (secondaryLogoBuffer) {
      try {
        doc.image(secondaryLogoBuffer, nextLogoX, logoTopY, {
          fit: [logoWidth, logoHeight],
        })
        logoRowEndX = nextLogoX + logoWidth
      } catch {
        // Continue without rendering logo.
      }
    }

    const topRightWidth = 220
    const topRightX = right - topRightWidth
    const prefixedInvoiceNo = ensureInvoicePrefix(invoice.invoice_number)

    doc.fillColor("#334155").font("Helvetica").fontSize(12)
    doc.text("Original invoice", topRightX, y + 8, { width: topRightWidth, align: "right" })
    doc.fillColor("#334155").font("Helvetica-Bold").fontSize(14)
    doc.text(`${prefixedInvoiceNo}`, topRightX, y + 30, {
      width: topRightWidth,
      align: "right",
    })
    doc.fillColor("#334155").font("Helvetica").fontSize(12)
    doc.text(`Date: ${invoice.invoice_date || "-"}`, topRightX, y + 52, {
      width: topRightWidth,
      align: "right",
    })
    y += 68
    doc.moveTo(left, y).lineTo(right, y).stroke("#d1d5db")
    y += 14

    const colW = (pageW - 20) / 2
    const leftColX = left
    const rightColX = left + colW + 20
    const labelStyle = () => doc.fillColor("#334155").font("Helvetica-Bold").fontSize(10)
    const valueStyle = () => doc.fillColor("#111827").font("Helvetica").fontSize(10)

    labelStyle()
    doc.text("Sold By", leftColX, y)
    valueStyle()
    doc.text(invoice.seller.company_name || WEBSITE_NAME, leftColX, y + 14, { width: colW })
    let soldByY = y + 28
    if (invoice.seller.company_address) {
      doc.text(invoice.seller.company_address, leftColX, soldByY, { width: colW })
      soldByY = doc.y + 2
    }
    if (invoice.seller.gstin) {
      doc.text(`GSTIN: ${invoice.seller.gstin}`, leftColX, soldByY, { width: colW })
      soldByY = doc.y + 2
    }
    if (invoice.seller.company_email) {
      doc.text(`Email: ${invoice.seller.company_email}`, leftColX, soldByY, { width: colW })
      soldByY = doc.y + 2
    }
    if (invoice.seller.company_phone) {
      doc.text(`Phone: ${invoice.seller.company_phone}`, leftColX, soldByY, { width: colW })
      soldByY = doc.y
    }
    doc.text("For and on behalf of:- D Succeed Learners Pvt Ltd.", leftColX, soldByY + 6, {
      width: colW,
    })
    soldByY = doc.y

    labelStyle()
    doc.text("Bill To", rightColX, y)
    valueStyle()
    doc.text(invoice.customer_name, rightColX, y + 14, { width: colW })
    let billToY = y + 28
    doc.text(`Email: ${invoice.customer_email}`, rightColX, billToY, { width: colW })
    billToY = doc.y + 2
    doc.text(`Phone: ${invoice.customer_phone}`, rightColX, billToY, { width: colW })
    billToY = doc.y

    y = Math.max(soldByY, billToY) + 14
    doc.moveTo(left, y).lineTo(right, y).stroke("#e2e8f0")
    y += 12

    const metaRow = (label: string, value: string) => {
      labelStyle()
      doc.text(`${label}:`, left, y, { width: 110 })
      valueStyle()
      doc.text(value || "-", left + 110, y, { width: pageW - 110 })
      y += 16
    }

    metaRow("Order No", invoice.order_number)
    metaRow("Transaction ID", invoice.transaction_id)
    metaRow("Payment ID", invoice.payment_id)
    metaRow("Payment Mode", invoice.payment_mode)
    metaRow("Shipping Method", invoice.shipping_method)
    y += 8

    const tableX = left
    const tableW = pageW
    const col1 = 26
    const col3 = 56
    const col4 = 40
    const col5 = 92
    const col7 = 92
    const col2 = tableW - col1 - col3 - col4 - col5 - col7
    const headerH = 24
    const minRowH = 24
    const rowTopPadding = 7
    const rowBottomPadding = 6
    const drawTableHeader = () => {
      doc.rect(tableX, y, tableW, headerH).fillAndStroke("#e5e7eb", "#d1d5db")
      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9.2)
      doc.text("No", tableX + 6, y + 7, { width: col1 - 8 })
      doc.text("Product / Service", tableX + col1 + 6, y + 7, { width: col2 - 8 })
      doc.text("HSN/SAC", tableX + col1 + col2, y + 7, { width: col3 - 8, align: "right" })
      doc.text("Qty", tableX + col1 + col2 + col3, y + 7, { width: col4 - 8, align: "right" })
      doc.text("Unit Price", tableX + col1 + col2 + col3 + col4, y + 7, { width: col5 - 8, align: "right" })
      doc.text("Amount", tableX + col1 + col2 + col3 + col4 + col5, y + 7, { width: col7 - 8, align: "right" })
      y += headerH
    }

    drawTableHeader()

    doc.fillColor("#0f172a").font("Helvetica").fontSize(9.4)
    for (const line of invoice.lines) {
      const titleHeight = doc.heightOfString(line.title || "-", { width: col2 - 8 })
      const rowH = Math.max(minRowH, Math.ceil(titleHeight + rowTopPadding + rowBottomPadding))

      if (y + rowH > doc.page.height - doc.page.margins.bottom - 130) {
        doc.addPage()
        y = doc.page.margins.top
        drawTableHeader()
        doc.fillColor("#0f172a").font("Helvetica").fontSize(9.4)
      }

      doc.rect(tableX, y, tableW, rowH).stroke("#e2e8f0")
      doc.text(String(line.no), tableX + 6, y + rowTopPadding, { width: col1 - 8 })
      doc.text(line.title || "-", tableX + col1 + 6, y + rowTopPadding, {
        width: col2 - 8,
        height: rowH - rowTopPadding - rowBottomPadding,
        ellipsis: true,
      })
      doc.text(line.sac_code || "-", tableX + col1 + col2, y + rowTopPadding, { width: col3 - 8, align: "right", lineBreak: false })
      doc.text(String(line.qty), tableX + col1 + col2 + col3, y + rowTopPadding, { width: col4 - 8, align: "right", lineBreak: false })
      doc.text(formatMoney(line.unit_price, invoice.currency_code), tableX + col1 + col2 + col3 + col4, y + rowTopPadding, {
        width: col5 - 8,
        align: "right",
        lineBreak: false,
      })
      doc.text(formatMoney(line.amount, invoice.currency_code), tableX + col1 + col2 + col3 + col4 + col5, y + rowTopPadding, {
        width: col7 - 8,
        align: "right",
        lineBreak: false,
      })
      y += rowH
    }

    y += 14
    const summaryW = 300
    const summaryX = right - summaryW
    const labelW = 170
    const valueW = summaryW - labelW
    const summaryRow = (label: string, value: string, bold = false) => {
      doc.fillColor("#1e293b").font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10)
      doc.text(label, summaryX, y, { width: labelW })
      doc.text(value, summaryX + labelW, y, {
        width: valueW,
        align: "right",
        lineBreak: false,
      })
      y += bold ? 21 : 16
    }

    summaryRow("Subtotal (Excl GST)", formatMoney(invoice.subtotal, invoice.currency_code))
    summaryRow(
      `GST Included (${invoice.metadata.gst_rate}%)`,
      formatMoney(invoice.tax_total, invoice.currency_code)
    )
    doc.moveTo(summaryX, y + 2).lineTo(summaryX + summaryW, y + 2).stroke("#cbd5e1")
    y += 8
    summaryRow("Grand Total", formatMoney(invoice.total, invoice.currency_code), true)

    if (invoice.metadata.notes) {
      y += 8
      doc.fillColor("#334155").font("Helvetica-Bold").fontSize(9.5)
      doc.text("Notes:", left, y, { width: pageW })
      y += 12
      doc.fillColor("#64748b").font("Helvetica").fontSize(9)
      doc.text(invoice.metadata.notes, left, y, { width: pageW })
      y = doc.y + 4
    }

    if (invoice.metadata.copyright_text) {
      const footerY = doc.page.height - doc.page.margins.bottom - 28
      doc.fillColor("#475569").font("Helvetica").fontSize(10)
      doc.text(invoice.metadata.copyright_text, left, footerY, {
        width: pageW,
        align: "center",
        lineBreak: false,
      })
    }

    doc.end()
  })
}
