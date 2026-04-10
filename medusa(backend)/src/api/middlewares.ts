import {
  defineMiddlewares,
  validateAndTransformBody,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  CreateCategoryImagesSchema,
} from "./admin/categories/[category_id]/images/route"
import { DeleteCategoryImagesSchema, UpdateCategoryImagesSchema } from "./admin/categories/[category_id]/images/batch/route"
import { CreateExamSeriesSchema } from "./admin/exam-series/route"
import { UpdateExamSeriesSchema } from "./admin/exam-series/[id]/route"
import { CreateCountrySchema } from "./admin/international-countries/route"
import { UpdateCountrySchema } from "./admin/international-countries/[id]/route"
import { CreateContactRequestSchema } from "./store/contact-requests/route"
import { CreateContactRequestAdminSchema } from "./admin/contact-requests/route"
import { UpsertEmailTemplateConfigSchema } from "./admin/email-template-config/route"
import { CreateCheckoutOtpRequestSchema } from "./store/checkout-otp/request/route"
import { VerifyCheckoutOtpSchema } from "./store/checkout-otp/verify/route"
import { UpdateEasebuzzPaymentSessionSchema } from "./store/easebuzz/payment-session/route"
import { sortCategories } from "./store/utils/category-sort"

type CategoryRecord = {
  id: string
  name?: string
  handle?: string
  metadata?: Record<string, unknown> | null
  children_categories?: CategoryRecord[]
  media?: Array<{
    id: string
    url: string
    file_id: string
    type: "thumbnail" | "image"
    category_id: string
  }>
  rich_description?: string
  description?: string
  offer_badge?: string
  additional_information?: {
    title: string
    description: string
    exam_information: Array<{
      title: string
      description: string
      values: string[]
    }>
    certification_levels: Array<{
      title: string
      description: string
      values: string[]
    }>
  }
  listing_page_banner?: {
    title: string
    description: string
    button_1_text: string
    button_1_link: string
    button_2_text: string
    button_2_link: string
  }
  listing_page_side_section?: {
    title: string
    description: string
  }
}

type CategoryApiBody = {
  product_category?: CategoryRecord
  product_categories?: CategoryRecord[]
}

type ProductRecord = {
  id: string
  metadata?: Record<string, unknown> | null
  categories?: CategoryRecord[]
  best_seller?: boolean
  is_out_of_stock?: boolean
  validity_title?: string
  validity_description?: string
  delivery_title?: string
  delivery_description?: string
  additional_title?: string
  additional_description?: string
  details_information?: {
    validity_information: {
      title: string
      description: string
    }
    delivery_information: {
      title: string
      description: string
    }
    additional_information: {
      title: string
      description: string
    }
  }
}

type ProductApiBody = {
  product?: ProductRecord
  products?: ProductRecord[]
}

type CartItemRecord = {
  id?: string | null
  product_id?: string | null
  is_out_of_stock?: boolean
  quantity?: number | null
  unit_price?: number | string | null
  is_tax_inclusive?: boolean | null
  tax_lines?: Array<{
    rate?: number | null
  }> | null
  categories?: Array<{
    id: string
    title: string
    slug: string
    img_url: string
    handle: string
    media: NonNullable<CategoryRecord["media"]>
  }>
  category_image_url?: string
  product_category_image_url?: string
  pricing?: {
    actual_price: number | null
    our_price: number | null
    discount_amount: number | null
    discount_percent: number | null
    actual_total: number | null
    our_total: number | null
    discount_total: number | null
    unit_price: number | null
    unit_total: number | null
  }
}

type CartApiBody = {
  cart?: {
    cashback?: boolean
    metadata?: Record<string, unknown> | null
    billing_address?: {
      first_name?: string | null
      last_name?: string | null
      phone?: string | null
    } | null
    shipping_address?: {
      first_name?: string | null
      last_name?: string | null
      phone?: string | null
    } | null
    items?: CartItemRecord[]
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    item_total?: number | null
    item_subtotal?: number | null
    item_tax_total?: number | null
    original_total?: number | null
    original_tax_total?: number | null
    original_item_total?: number | null
    original_item_subtotal?: number | null
    original_item_tax_total?: number | null
  }
}

type CompleteCartApiBody = {
  type?: string
  cart?: CartApiBody["cart"]
  order?: {
    first_name?: string | null
    last_name?: string | null
    billing_address?: {
      first_name?: string | null
      last_name?: string | null
    } | null
    shipping_address?: {
      first_name?: string | null
      last_name?: string | null
    } | null
    customer?: {
      first_name?: string | null
      last_name?: string | null
    } | null
    items?: CartItemRecord[]
  }
}

type OrderApiBody = {
  order?: {
    id?: string
    items?: CartItemRecord[]
    payment_collections?: unknown[]
    transaction_id?: string
    payment_mode?: string
    bank_ref?: string
    refund_id?: string
  }
  orders?: Array<{
    id?: string
    items?: CartItemRecord[]
    payment_collections?: unknown[]
    transaction_id?: string
    payment_mode?: string
    bank_ref?: string
    refund_id?: string
  }>
}

const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"])

const getMediaBaseOrigin = (): string => {
  const configuredUrl =
    process.env.FILE_BACKEND_URL ||
    (process.env.MEDUSA_BACKEND_URL
      ? `${process.env.MEDUSA_BACKEND_URL.replace(/\/$/, "")}/static`
      : "")

  if (!configuredUrl) {
    return ""
  }

  try {
    return new URL(configuredUrl).origin
  } catch {
    return ""
  }
}

const MEDIA_BASE_ORIGIN = getMediaBaseOrigin()
type CompleteCartResponseCache = {
  statusCode: number
  body: unknown
  capturedAt: number
}

type InFlightCompleteCart = {
  startedAt: number
  waiters: Array<() => void>
  response?: CompleteCartResponseCache
}

const IN_FLIGHT_COMPLETE_CARTS = new Map<string, InFlightCompleteCart>()
const COMPLETE_CART_GUARD_TTL_MS = Number(process.env.COMPLETE_CART_GUARD_TTL_MS || 90_000)
const COMPLETE_CART_WAIT_MS = Number(process.env.COMPLETE_CART_WAIT_MS || 35_000)
const COMPLETE_CART_RESPONSE_CACHE_TTL_MS = Number(
  process.env.COMPLETE_CART_RESPONSE_CACHE_TTL_MS || 60_000
)

const normalizeMediaUrl = (url: string): string => {
  if (!url || !MEDIA_BASE_ORIGIN) {
    return url
  }

  if (url.startsWith("/")) {
    return `${MEDIA_BASE_ORIGIN}${url}`
  }

  if (!/^https?:\/\//i.test(url)) {
    return `${MEDIA_BASE_ORIGIN}/${url.replace(/^\/+/, "")}`
  }

  try {
    const parsedUrl = new URL(url)

    if (!LOCALHOST_HOSTNAMES.has(parsedUrl.hostname)) {
      return url
    }

    return `${MEDIA_BASE_ORIGIN}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
  } catch {
    return url
  }
}

const getMetadataText = (value: unknown): string => {
  return typeof value === "string" ? value : ""
}

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const getMetadataHtml = (value: unknown): string => {
  const text = getMetadataText(value).trim()

  if (!text) {
    return ""
  }

  // Keep HTML generated by rich text editors as-is.
  if (/<\s*\/?[a-z][^>]*>/i.test(text)) {
    return text
  }

  const withLineBreaks = escapeHtml(text).replace(/\r\n|\r|\n/g, "<br />")
  return `<p>${withLineBreaks}</p>`
}

const getMetadataBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return value !== 0
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["true", "1", "yes", "y"].includes(normalized)) {
      return true
    }
    if (["false", "0", "no", "n", ""].includes(normalized)) {
      return false
    }
  }

  return false
}

const getMetadataNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const roundMoney = (value: number | null): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }

  return Number(value.toFixed(2))
}

const toStringArray = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string")
  }

  return []
}

const isCategoryId = (value: string): boolean => value.startsWith("pcat_")

const firstNonEmptyString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return ""
}

const getTransactionIdFromRecord = (value: unknown): string => {
  if (!value || typeof value !== "object") {
    return ""
  }

  const record = value as Record<string, unknown>
  return firstNonEmptyString(
    record.transaction_id,
    record.payment_transaction_id,
    record.easebuzz_txnid,
    record.txnid,
    record.mihpayid,
    record.bank_ref_num,
    record.bank_ref_no
  )
}

const toTitleCase = (value: string): string => {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ")
}

const normalizePaymentMode = (value: string): string => {
  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, " ")

  if (!normalized) {
    return ""
  }

  if (["netbanking", "net banking"].includes(normalized)) {
    return "Net Banking"
  }

  if (["creditcard", "credit card", "cc"].includes(normalized)) {
    return "Credit Card"
  }

  if (["debitcard", "debit card", "dc"].includes(normalized)) {
    return "Debit Card"
  }

  if (normalized === "upi") {
    return "UPI"
  }

  if (normalized === "wallet") {
    return "Wallet"
  }

  if (normalized === "emi") {
    return "EMI"
  }

  return toTitleCase(normalized)
}

const getPaymentModeFromRecord = (value: unknown): string => {
  if (!value || typeof value !== "object") {
    return ""
  }

  const record = value as Record<string, unknown>
  const mode = firstNonEmptyString(
    record.payment_mode,
    record.mode,
    record.paymentMode,
    record.easebuzz_payment_mode,
    record.pg_type,
    record.PG_TYPE,
    record.card_type,
    record.bankcode
  )

  return mode ? normalizePaymentMode(mode) : ""
}

const getBankRefFromRecord = (value: unknown): string => {
  if (!value || typeof value !== "object") {
    return ""
  }

  const record = value as Record<string, unknown>
  return firstNonEmptyString(
    record.bank_ref,
    record.bank_ref_num,
    record.bank_ref_no,
    record.bank_ref_number,
    record.utr,
    record.rrn
  )
}

const getRefundIdFromRecord = (value: unknown): string => {
  if (!value || typeof value !== "object") {
    return ""
  }

  const record = value as Record<string, unknown>
  const refundResponse =
    record.refund_response && typeof record.refund_response === "object"
      ? (record.refund_response as Record<string, unknown>)
      : {}
  const refundResponseData =
    refundResponse.data && typeof refundResponse.data === "object"
      ? (refundResponse.data as Record<string, unknown>)
      : {}

  return firstNonEmptyString(
    record.refund_id,
    record.refund_request_id,
    record.merchant_refund_id,
    record.easebuzz_refund_id,
    record.refundid,
    refundResponse.refund_id,
    refundResponse.refund_request_id,
    refundResponse.merchant_refund_id,
    refundResponseData.refund_id,
    refundResponseData.refund_request_id,
    refundResponseData.merchant_refund_id
  )
}

const extractOrderTransactionId = (order: Record<string, unknown>): string => {
  const directId = firstNonEmptyString(
    getTransactionIdFromRecord(order),
    getTransactionIdFromRecord(order.metadata),
    getTransactionIdFromRecord(order.data),
    getTransactionIdFromRecord(order.payload)
  )
  if (directId) {
    return directId
  }

  const paymentCollections = Array.isArray(order.payment_collections)
    ? (order.payment_collections as unknown[])
    : []

  for (const paymentCollection of paymentCollections) {
    const collectionId = firstNonEmptyString(
      getTransactionIdFromRecord(paymentCollection),
      getTransactionIdFromRecord(
        paymentCollection && typeof paymentCollection === "object"
          ? (paymentCollection as Record<string, unknown>).data
          : undefined
      )
    )
    if (collectionId) {
      return collectionId
    }

    const payments =
      paymentCollection &&
      typeof paymentCollection === "object" &&
      Array.isArray((paymentCollection as Record<string, unknown>).payments)
        ? ((paymentCollection as Record<string, unknown>).payments as unknown[])
        : []

    for (const payment of payments) {
      const paymentId = firstNonEmptyString(
        getTransactionIdFromRecord(payment),
        getTransactionIdFromRecord(
          payment && typeof payment === "object"
            ? (payment as Record<string, unknown>).data
            : undefined
        ),
        getTransactionIdFromRecord(
          payment && typeof payment === "object"
            ? (payment as Record<string, unknown>).metadata
            : undefined
        )
      )
      if (paymentId) {
        return paymentId
      }

      const captures =
        payment &&
        typeof payment === "object" &&
        Array.isArray((payment as Record<string, unknown>).captures)
          ? ((payment as Record<string, unknown>).captures as unknown[])
          : []

      for (const capture of captures) {
        const captureId = firstNonEmptyString(
          getTransactionIdFromRecord(capture),
          getTransactionIdFromRecord(
            capture && typeof capture === "object"
              ? (capture as Record<string, unknown>).data
              : undefined
          )
        )
        if (captureId) {
          return captureId
        }
      }
    }

    const paymentSessions =
      paymentCollection &&
      typeof paymentCollection === "object" &&
      Array.isArray((paymentCollection as Record<string, unknown>).payment_sessions)
        ? ((paymentCollection as Record<string, unknown>).payment_sessions as unknown[])
        : []

    for (const paymentSession of paymentSessions) {
      const sessionId = firstNonEmptyString(
        getTransactionIdFromRecord(paymentSession),
        getTransactionIdFromRecord(
          paymentSession && typeof paymentSession === "object"
            ? (paymentSession as Record<string, unknown>).data
            : undefined
        )
      )
      if (sessionId) {
        return sessionId
      }
    }
  }

  return ""
}

const extractOrderPaymentMode = (order: Record<string, unknown>): string => {
  const directMode = firstNonEmptyString(
    getPaymentModeFromRecord(order),
    getPaymentModeFromRecord(order.metadata),
    getPaymentModeFromRecord(order.data),
    getPaymentModeFromRecord(order.payload)
  )
  if (directMode) {
    return directMode
  }

  const paymentCollections = Array.isArray(order.payment_collections)
    ? (order.payment_collections as unknown[])
    : []

  for (const paymentCollection of paymentCollections) {
    const collectionMode = firstNonEmptyString(
      getPaymentModeFromRecord(paymentCollection),
      getPaymentModeFromRecord(
        paymentCollection && typeof paymentCollection === "object"
          ? (paymentCollection as Record<string, unknown>).data
          : undefined
      )
    )
    if (collectionMode) {
      return collectionMode
    }

    const payments =
      paymentCollection &&
      typeof paymentCollection === "object" &&
      Array.isArray((paymentCollection as Record<string, unknown>).payments)
        ? ((paymentCollection as Record<string, unknown>).payments as unknown[])
        : []

    for (const payment of payments) {
      const paymentMode = firstNonEmptyString(
        getPaymentModeFromRecord(payment),
        getPaymentModeFromRecord(
          payment && typeof payment === "object"
            ? (payment as Record<string, unknown>).data
            : undefined
        ),
        getPaymentModeFromRecord(
          payment && typeof payment === "object"
            ? (payment as Record<string, unknown>).metadata
            : undefined
        )
      )
      if (paymentMode) {
        return paymentMode
      }

      const captures =
        payment &&
        typeof payment === "object" &&
        Array.isArray((payment as Record<string, unknown>).captures)
          ? ((payment as Record<string, unknown>).captures as unknown[])
          : []

      for (const capture of captures) {
        const captureMode = firstNonEmptyString(
          getPaymentModeFromRecord(capture),
          getPaymentModeFromRecord(
            capture && typeof capture === "object"
              ? (capture as Record<string, unknown>).data
              : undefined
          )
        )
        if (captureMode) {
          return captureMode
        }
      }
    }

    const paymentSessions =
      paymentCollection &&
      typeof paymentCollection === "object" &&
      Array.isArray((paymentCollection as Record<string, unknown>).payment_sessions)
        ? ((paymentCollection as Record<string, unknown>).payment_sessions as unknown[])
        : []

    for (const paymentSession of paymentSessions) {
      const sessionMode = firstNonEmptyString(
        getPaymentModeFromRecord(paymentSession),
        getPaymentModeFromRecord(
          paymentSession && typeof paymentSession === "object"
            ? (paymentSession as Record<string, unknown>).data
            : undefined
        )
      )
      if (sessionMode) {
        return sessionMode
      }
    }
  }

  return ""
}

const extractOrderBankRef = (order: Record<string, unknown>): string => {
  const directBankRef = firstNonEmptyString(
    getBankRefFromRecord(order),
    getBankRefFromRecord(order.metadata),
    getBankRefFromRecord(order.data),
    getBankRefFromRecord(order.payload)
  )
  if (directBankRef) {
    return directBankRef
  }

  const paymentCollections = Array.isArray(order.payment_collections)
    ? (order.payment_collections as unknown[])
    : []

  for (const paymentCollection of paymentCollections) {
    const collectionBankRef = firstNonEmptyString(
      getBankRefFromRecord(paymentCollection),
      getBankRefFromRecord(
        paymentCollection && typeof paymentCollection === "object"
          ? (paymentCollection as Record<string, unknown>).data
          : undefined
      )
    )
    if (collectionBankRef) {
      return collectionBankRef
    }

    const payments =
      paymentCollection &&
      typeof paymentCollection === "object" &&
      Array.isArray((paymentCollection as Record<string, unknown>).payments)
        ? ((paymentCollection as Record<string, unknown>).payments as unknown[])
        : []

    for (const payment of payments) {
      const paymentBankRef = firstNonEmptyString(
        getBankRefFromRecord(payment),
        getBankRefFromRecord(
          payment && typeof payment === "object"
            ? (payment as Record<string, unknown>).data
            : undefined
        ),
        getBankRefFromRecord(
          payment && typeof payment === "object"
            ? (payment as Record<string, unknown>).metadata
            : undefined
        )
      )
      if (paymentBankRef) {
        return paymentBankRef
      }

      const captures =
        payment &&
        typeof payment === "object" &&
        Array.isArray((payment as Record<string, unknown>).captures)
          ? ((payment as Record<string, unknown>).captures as unknown[])
          : []

      for (const capture of captures) {
        const captureBankRef = firstNonEmptyString(
          getBankRefFromRecord(capture),
          getBankRefFromRecord(
            capture && typeof capture === "object"
              ? (capture as Record<string, unknown>).data
              : undefined
          )
        )
        if (captureBankRef) {
          return captureBankRef
        }
      }
    }

    const paymentSessions =
      paymentCollection &&
      typeof paymentCollection === "object" &&
      Array.isArray((paymentCollection as Record<string, unknown>).payment_sessions)
        ? ((paymentCollection as Record<string, unknown>).payment_sessions as unknown[])
        : []

    for (const paymentSession of paymentSessions) {
      const sessionBankRef = firstNonEmptyString(
        getBankRefFromRecord(paymentSession),
        getBankRefFromRecord(
          paymentSession && typeof paymentSession === "object"
            ? (paymentSession as Record<string, unknown>).data
            : undefined
        )
      )
      if (sessionBankRef) {
        return sessionBankRef
      }
    }
  }

  return ""
}

const extractOrderRefundId = (order: Record<string, unknown>): string => {
  const directRefundId = firstNonEmptyString(
    getRefundIdFromRecord(order),
    getRefundIdFromRecord(order.metadata),
    getRefundIdFromRecord(order.data),
    getRefundIdFromRecord(order.payload)
  )
  if (directRefundId) {
    return directRefundId
  }

  const paymentCollections = Array.isArray(order.payment_collections)
    ? (order.payment_collections as unknown[])
    : []

  for (const paymentCollection of paymentCollections) {
    const collectionRefundId = firstNonEmptyString(
      getRefundIdFromRecord(paymentCollection),
      getRefundIdFromRecord(
        paymentCollection && typeof paymentCollection === "object"
          ? (paymentCollection as Record<string, unknown>).data
          : undefined
      )
    )
    if (collectionRefundId) {
      return collectionRefundId
    }

    const payments =
      paymentCollection &&
      typeof paymentCollection === "object" &&
      Array.isArray((paymentCollection as Record<string, unknown>).payments)
        ? ((paymentCollection as Record<string, unknown>).payments as unknown[])
        : []

    for (const payment of payments) {
      const paymentRefundId = firstNonEmptyString(
        getRefundIdFromRecord(payment),
        getRefundIdFromRecord(
          payment && typeof payment === "object"
            ? (payment as Record<string, unknown>).data
            : undefined
        ),
        getRefundIdFromRecord(
          payment && typeof payment === "object"
            ? (payment as Record<string, unknown>).metadata
            : undefined
        )
      )
      if (paymentRefundId) {
        return paymentRefundId
      }

      const refunds =
        payment &&
        typeof payment === "object" &&
        Array.isArray((payment as Record<string, unknown>).refunds)
          ? ((payment as Record<string, unknown>).refunds as unknown[])
          : []

      for (const refund of refunds) {
        const refundId = firstNonEmptyString(
          getRefundIdFromRecord(refund),
          refund && typeof refund === "object"
            ? firstNonEmptyString((refund as Record<string, unknown>).id)
            : ""
        )
        if (refundId) {
          return refundId
        }
      }
    }
  }

  return ""
}

type OrderPaymentDetails = {
  transaction_id?: string
  payment_mode?: string
  bank_ref?: string
  refund_id?: string
}

const loadOrderPaymentDetailsMap = async (
  req: MedusaRequest,
  orderIds: string[]
): Promise<Record<string, OrderPaymentDetails>> => {
  if (!orderIds.length) {
    return {}
  }

  const query = req.scope.resolve("query")

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "cart_id",
        "payment_collections.id",
        "payment_collections.data",
        "payment_collections.payment_sessions.id",
        "payment_collections.payment_sessions.data",
        "payment_collections.payments.id",
        "payment_collections.payments.data",
        "payment_collections.payments.metadata",
        "payment_collections.payments.refunds.id",
        "payment_collections.payments.captures.id",
        "payment_collections.payments.captures.data",
      ],
      filters: {
        id: orderIds,
      },
    })

    const detailsByOrderId: Record<string, OrderPaymentDetails> = {}
    const cartIdByOrderId: Record<string, string> = {}
    const orderIdByCartId: Record<string, string> = {}

    for (const order of orders as Array<Record<string, unknown>>) {
      const orderId = firstNonEmptyString(order.id)
      if (!orderId) {
        continue
      }

      const cartId = firstNonEmptyString(order.cart_id)
      if (cartId) {
        cartIdByOrderId[orderId] = cartId
        orderIdByCartId[cartId] = orderId
      }

      const transactionId = extractOrderTransactionId(order)
      const paymentMode = extractOrderPaymentMode(order)
      const bankRef = extractOrderBankRef(order)
      const refundId = extractOrderRefundId(order)

      if (transactionId || paymentMode || bankRef || refundId) {
        detailsByOrderId[orderId] = {
          ...(transactionId ? { transaction_id: transactionId } : {}),
          ...(paymentMode ? { payment_mode: paymentMode } : {}),
          ...(bankRef ? { bank_ref: bankRef } : {}),
          ...(refundId ? { refund_id: refundId } : {}),
        }
      }
    }

    const cartIds = Array.from(new Set(Object.values(cartIdByOrderId))).filter(Boolean)
    const { data: recoveryByOrderRows } = await query.graph({
      entity: "payment_recovery_entry",
      fields: ["id", "order_id", "cart_id", "txnid", "payload", "updated_at", "created_at"],
      filters: {
        order_id: orderIds,
      },
    })

    let recoveryRows = (recoveryByOrderRows as Array<Record<string, unknown>> | undefined) || []

    if (cartIds.length) {
      const { data: recoveryByCartRows } = await query.graph({
        entity: "payment_recovery_entry",
        fields: ["id", "order_id", "cart_id", "txnid", "payload", "updated_at", "created_at"],
        filters: {
          cart_id: cartIds,
        },
      })

      const merged = new Map<string, Record<string, unknown>>()
      for (const row of recoveryRows) {
        const rowId = firstNonEmptyString(row.id)
        if (!rowId) {
          continue
        }
        merged.set(rowId, row)
      }
      for (const row of (recoveryByCartRows as Array<Record<string, unknown>> | undefined) || []) {
        const rowId = firstNonEmptyString(row.id)
        if (!rowId) {
          continue
        }
        merged.set(rowId, row)
      }
      recoveryRows = Array.from(merged.values())
    }

    recoveryRows.sort((a, b) => {
      const at = new Date(firstNonEmptyString(a.updated_at, a.created_at) || 0).getTime()
      const bt = new Date(firstNonEmptyString(b.updated_at, b.created_at) || 0).getTime()
      return bt - at
    })

    for (const recovery of recoveryRows) {
      const recoveryOrderId = firstNonEmptyString(recovery.order_id)
      const recoveryCartId = firstNonEmptyString(recovery.cart_id)
      const resolvedOrderId =
        recoveryOrderId || (recoveryCartId ? orderIdByCartId[recoveryCartId] || "" : "")

      if (!resolvedOrderId) {
        continue
      }

      const payload =
        recovery.payload && typeof recovery.payload === "object"
          ? (recovery.payload as Record<string, unknown>)
          : {}

      const transactionId = firstNonEmptyString(
        firstNonEmptyString(recovery.txnid),
        getTransactionIdFromRecord(payload)
      )
      const paymentMode = getPaymentModeFromRecord(payload)
      const bankRef = getBankRefFromRecord(payload)
      const refundId = getRefundIdFromRecord(payload)

      const existing = detailsByOrderId[resolvedOrderId] || {}
      detailsByOrderId[resolvedOrderId] = {
        ...existing,
        ...(existing.transaction_id ? {} : transactionId ? { transaction_id: transactionId } : {}),
        ...(existing.payment_mode ? {} : paymentMode ? { payment_mode: paymentMode } : {}),
        ...(existing.bank_ref ? {} : bankRef ? { bank_ref: bankRef } : {}),
        ...(existing.refund_id ? {} : refundId ? { refund_id: refundId } : {}),
      }
    }

    return detailsByOrderId
  } catch {
    return {}
  }
}

const getCategoryImageUrl = (
  media: NonNullable<CategoryRecord["media"]> | undefined
): string => {
  if (!media?.length) {
    return ""
  }

  return (
    media.find((item) => item.type === "thumbnail")?.url ||
    media[0]?.url ||
    ""
  )
}

const getMetadataAdditionalInformationItems = (
  value: unknown
): Array<{ title: string; description: string; values: string[] }> => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const candidate = item as Record<string, unknown>

      return {
        title: getMetadataText(candidate.title),
        description: getMetadataText(candidate.description),
        values: Array.isArray(candidate.values)
          ? candidate.values
              .filter((v): v is string => typeof v === "string")
              .map((item) => getMetadataHtml(item))
          : [],
      }
    })
    .filter((item): item is { title: string; description: string; values: string[] } => Boolean(item))
}

const enrichCategories = async (
  req: MedusaRequest,
  categories: CategoryRecord[]
) => {
  if (!categories.length) {
    return
  }

  const query = req.scope.resolve("query")
  const categoryIds = Array.from(new Set(categories.map((cat) => cat.id)))

  const [{ data: mediaRows }, { data: metadataRows }] = await Promise.all([
    query.graph({
      entity: "product_category_image",
      fields: ["id", "url", "file_id", "type", "category_id"],
      filters: {
        category_id: categoryIds,
      },
    }),
    query.graph({
      entity: "product_category",
      fields: ["id", "metadata"],
      filters: {
        id: categoryIds,
      },
    }),
  ])

  const mediaByCategoryId = mediaRows.reduce((acc, media) => {
    const list = acc[media.category_id] || []
    list.push(media)
    acc[media.category_id] = list
    return acc
  }, {} as Record<string, typeof mediaRows>)

  const metadataByCategoryId = metadataRows.reduce((acc, category) => {
    acc[category.id] = category.metadata || {}
    return acc
  }, {} as Record<string, Record<string, unknown>>)

  for (const category of categories) {
    const metadata = metadataByCategoryId[category.id] || category.metadata || {}
    const richDescription = getMetadataHtml(metadata.rich_description)
    const offerBadge = typeof metadata.offer_badge_text === "string"
      ? metadata.offer_badge_text
      : ""
    const additionalInformationTitle = getMetadataText(metadata.additional_information_section_title)
    const additionalInformationDescription = getMetadataText(metadata.additional_information_section_description)
    const additionalInformationExamInformation = getMetadataAdditionalInformationItems(
      metadata.additional_information_exam_information
    )
    const additionalInformationCertificationLevels = getMetadataAdditionalInformationItems(
      metadata.additional_information_certification_levels
    )
    const listingPageBannerTitle = getMetadataHtml(metadata.listing_page_banner_title)
    const listingPageBannerDescription = getMetadataHtml(metadata.listing_page_banner_description)
    const listingPageBannerButton1Text = getMetadataText(metadata.listing_page_banner_button_1_text)
    const listingPageBannerButton1Link = getMetadataText(metadata.listing_page_banner_button_1_link)
    const listingPageBannerButton2Text = getMetadataText(metadata.listing_page_banner_button_2_text)
    const listingPageBannerButton2Link = getMetadataText(metadata.listing_page_banner_button_2_link)
    const listingPageSideSectionTitle = getMetadataText(metadata.listing_page_side_section_title)
    const listingPageSideSectionDescriptionHtml = getMetadataHtml(
      metadata.listing_page_side_section_description
    )
    const normalizedMetadata = { ...metadata } as Record<string, unknown>
    normalizedMetadata.additional_information = {
      title: additionalInformationTitle,
      description: additionalInformationDescription,
      exam_information: additionalInformationExamInformation,
      certification_levels: additionalInformationCertificationLevels,
    }
    normalizedMetadata.listing_page_banner = {
      title: listingPageBannerTitle,
      description: listingPageBannerDescription,
      button_1_text: listingPageBannerButton1Text,
      button_1_link: listingPageBannerButton1Link,
      button_2_text: listingPageBannerButton2Text,
      button_2_link: listingPageBannerButton2Link,
    }
    normalizedMetadata.rich_description = richDescription
    normalizedMetadata.listing_page_banner_title = listingPageBannerTitle
    normalizedMetadata.listing_page_banner_description = listingPageBannerDescription
    normalizedMetadata.listing_page_side_section_description = listingPageSideSectionDescriptionHtml
    normalizedMetadata.listing_page_side_section = {
      title: listingPageSideSectionTitle,
      description: listingPageSideSectionDescriptionHtml,
    }

    category.metadata = normalizedMetadata
    category.media = (mediaByCategoryId[category.id] || []).map((media) => ({
      ...media,
      url: normalizeMediaUrl(media.url),
    }))
    category.offer_badge = offerBadge
    category.additional_information = {
      title: additionalInformationTitle,
      description: additionalInformationDescription,
      exam_information: additionalInformationExamInformation,
      certification_levels: additionalInformationCertificationLevels,
    }
    category.listing_page_banner = {
      title: listingPageBannerTitle,
      description: listingPageBannerDescription,
      button_1_text: listingPageBannerButton1Text,
      button_1_link: listingPageBannerButton1Link,
      button_2_text: listingPageBannerButton2Text,
      button_2_link: listingPageBannerButton2Link,
    }
    category.listing_page_side_section = {
      title: listingPageSideSectionTitle,
      description: listingPageSideSectionDescriptionHtml,
    }
  }
}

const enrichItemCategories = async (
  req: MedusaRequest,
  items: CartItemRecord[]
) => {
  if (!items.length) {
    return
  }

  const productIds = Array.from(
    new Set(
      items
        .map((item) => item?.product_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  )

  if (!productIds.length) {
    return
  }

  const query = req.scope.resolve("query")
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "metadata",
      "categories.id",
      "categories.name",
      "categories.handle",
      "categories.metadata",
    ],
    filters: {
      id: productIds,
    },
  })

  const categoryById = new Map<string, CategoryRecord>()
  const categoriesByProductId = (products as Array<{
    id: string
    categories?: CategoryRecord[] | null
  }>).reduce((acc, product) => {
    const categories = Array.isArray(product.categories) ? product.categories : []
    const categoryIds: string[] = []

    for (const category of categories) {
      if (category?.id) {
        if (!categoryById.has(category.id)) {
          categoryById.set(category.id, category)
        }
        categoryIds.push(category.id)
      }
    }

    acc[product.id] = categoryIds
    return acc
  }, {} as Record<string, string[]>)

  const categoryList = Array.from(categoryById.values())
  await enrichCategories(req, categoryList)

  for (const item of items) {
    if (!item?.product_id) {
      continue
    }

    item.categories = (categoriesByProductId[item.product_id] || [])
      .map((categoryId) => categoryById.get(categoryId))
      .filter((category): category is CategoryRecord => Boolean(category))
      .map((category) => ({
        id: category.id,
        title: category.name ?? "",
        slug: category.handle ?? "",
        img_url: getCategoryImageUrl(category.media),
        handle: category.handle ?? "",
        media: category.media || [],
      }))

    const primaryCategoryImageUrl =
      item.categories.find((category) => Boolean(category.img_url))?.img_url || ""
    item.category_image_url = primaryCategoryImageUrl
    item.product_category_image_url = primaryCategoryImageUrl
  }
}

const categoryExtrasMiddleware = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const originalJson = res.json.bind(res)

  res.json = (async (body: CategoryApiBody) => {
    try {
      if (!body || (typeof body !== "object")) {
        return originalJson(body)
      }

      const categories: CategoryRecord[] = []

      if (body.product_category?.id) {
        categories.push(body.product_category)
      }

      if (Array.isArray(body.product_categories)) {
        categories.push(...body.product_categories.filter((cat): cat is CategoryRecord => Boolean(cat?.id)))
      }

      if (!categories.length) {
        return originalJson(body)
      }

      await enrichCategories(req, categories)

      const sortCategoryTree = (nodes: CategoryRecord[]) => {
        const sorted = sortCategories(nodes)
        for (const node of sorted) {
          if (Array.isArray(node.children_categories) && node.children_categories.length) {
            node.children_categories = sortCategoryTree(node.children_categories)
          }
        }
        return sorted
      }

      if (Array.isArray(body.product_categories)) {
        body.product_categories = sortCategoryTree(body.product_categories)
      }

      if (body.product_category?.children_categories?.length) {
        body.product_category.children_categories = sortCategoryTree(
          body.product_category.children_categories
        )
      }

      return originalJson(body)
    } catch {
      return originalJson(body)
    }
  }) as unknown as typeof res.json

  next()
}

const productCategorySlugFilterMiddleware = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    const filterableFields = (req.filterableFields || {}) as Record<string, unknown>

    const categoryIdsFromFilter = toStringArray(filterableFields.category_id)
    const explicitCategoryIds = categoryIdsFromFilter.filter(isCategoryId)
    const categorySlugsFromCategoryId = categoryIdsFromFilter
      .filter((value) => !isCategoryId(value))
      .map((value) => value.trim())
      .filter(Boolean)

    const rawCategorySlugParam = (req.query as Record<string, unknown> | undefined)?.category_slug
    const categorySlugsParam = toStringArray(rawCategorySlugParam)
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean)

    const requestedSlugs = Array.from(new Set([
      ...categorySlugsFromCategoryId,
      ...categorySlugsParam,
    ]))

    if (!requestedSlugs.length) {
      return next()
    }

    const query = req.scope.resolve("query")
    const { data: categories } = await query.graph({
      entity: "product_category",
      fields: ["id", "handle"],
      filters: {
        handle: requestedSlugs,
        is_active: true,
        is_internal: false,
      },
    })

    const resolvedCategoryIds = categories.map((category) => category.id)
    const mergedCategoryIds = Array.from(new Set([
      ...explicitCategoryIds,
      ...resolvedCategoryIds,
    ]))

    filterableFields.category_id = mergedCategoryIds.length ? mergedCategoryIds : ["pcat_no_match"]
    delete filterableFields.category_slug
    req.filterableFields = filterableFields
  } catch {
    // Preserve the default products endpoint behavior if slug resolution fails.
  }

  next()
}

const productExtrasMiddleware = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const originalJson = res.json.bind(res)

  res.json = (async (body: ProductApiBody) => {
    try {
      if (!body || typeof body !== "object") {
        return originalJson(body)
      }

      const products: ProductRecord[] = []

      if (body.product?.id) {
        products.push(body.product)
      }

      if (Array.isArray(body.products)) {
        products.push(...body.products.filter((product): product is ProductRecord => Boolean(product?.id)))
      }

      if (!products.length) {
        return originalJson(body)
      }

      const query = req.scope.resolve("query")
      const productIds = Array.from(new Set(products.map((product) => product.id)))
      const { data: productRows } = await query.graph({
        entity: "product",
        fields: ["id", "metadata", "categories.id", "categories.name", "categories.handle", "categories.is_active", "categories.is_internal", "categories.rank", "categories.parent_category_id", "categories.metadata"],
        filters: {
          id: productIds,
        },
      })

      const metadataByProductId = productRows.reduce((acc, product) => {
        acc[product.id] = product.metadata || {}
        return acc
      }, {} as Record<string, Record<string, unknown>>)

      const categoryById = new Map<string, CategoryRecord>()
      const categoriesByProductId = productRows.reduce((acc, product) => {
        const categories = Array.isArray(product.categories) ? product.categories : []
        const categoryIds: string[] = []

        for (const category of categories) {
          if (category?.id) {
            if (!categoryById.has(category.id)) {
              categoryById.set(category.id, category as CategoryRecord)
            }
            categoryIds.push(category.id)
          }
        }

        acc[product.id] = categoryIds
        return acc
      }, {} as Record<string, string[]>)

      const categoryList = Array.from(categoryById.values())
      await enrichCategories(req, categoryList)

      for (const product of products) {
        const metadata = metadataByProductId[product.id] || product.metadata || {}

        const validityTitle = getMetadataText(metadata.validity_title)
        const validityDescription = getMetadataHtml(metadata.validity_description)
        const deliveryTitle = getMetadataText(metadata.delivery_title)
        const deliveryDescription = getMetadataHtml(metadata.delivery_description)
        const additionalTitle = getMetadataText(metadata.additional_title)
        const additionalDescription = getMetadataHtml(metadata.additional_description)
        const bestSeller = getMetadataBoolean(metadata.best_seller)
        const isOutOfStock = getMetadataBoolean(metadata.is_out_of_stock)

        const normalizedMetadata = {
          ...metadata,
          validity_description: validityDescription,
          delivery_description: deliveryDescription,
          additional_description: additionalDescription,
        }

        product.metadata = normalizedMetadata
        product.best_seller = bestSeller
        product.is_out_of_stock = isOutOfStock
        product.validity_title = validityTitle
        product.validity_description = validityDescription
        product.delivery_title = deliveryTitle
        product.delivery_description = deliveryDescription
        product.additional_title = additionalTitle
        product.additional_description = additionalDescription
        product.categories = (categoriesByProductId[product.id] || [])
          .map((categoryId) => categoryById.get(categoryId))
          .filter((category): category is CategoryRecord => Boolean(category))
        product.details_information = {
          validity_information: {
            title: validityTitle,
            description: validityDescription,
          },
          delivery_information: {
            title: deliveryTitle,
            description: deliveryDescription,
          },
          additional_information: {
            title: additionalTitle,
            description: additionalDescription,
          },
        }
      }

      return originalJson(body)
    } catch {
      return originalJson(body)
    }
  }) as unknown as typeof res.json

  next()
}

const collectItemProductIds = (items: CartItemRecord[]): string[] => {
  return Array.from(
    new Set(
      items
        .map((item) => item?.product_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  )
}

const getProductMetadataByProductId = async (
  req: MedusaRequest,
  productIds: string[]
): Promise<Record<string, Record<string, unknown>>> => {
  if (!productIds.length) {
    return {}
  }

  const query = req.scope.resolve("query")
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "metadata",
      "categories.id",
      "categories.name",
      "categories.handle",
      "categories.metadata",
    ],
    filters: {
      id: productIds,
    },
  })

  return (products as Array<{
    id: string
    metadata?: Record<string, unknown> | null
  }>).reduce((acc, product) => {
    acc[product.id] = product.metadata || {}
    return acc
  }, {} as Record<string, Record<string, unknown>>)
}

const getOutOfStockProducts = async (
  req: MedusaRequest,
  productIds: string[]
): Promise<Array<{ id: string; title: string }>> => {
  if (!productIds.length) {
    return []
  }

  const query = req.scope.resolve("query")
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata"],
    filters: {
      id: productIds,
    },
  })

  return (products as Array<{
    id: string
    title?: string | null
    metadata?: Record<string, unknown> | null
  }>).reduce((acc, product) => {
    if (getMetadataBoolean(product?.metadata?.is_out_of_stock)) {
      acc.push({
        id: product.id,
        title: typeof product.title === "string" ? product.title : "",
      })
    }
    return acc
  }, [] as Array<{ id: string; title: string }>)
}

const extractVariantIdsFromLineItemPayload = (payload: unknown): string[] => {
  if (!payload || typeof payload !== "object") {
    return []
  }

  const body = payload as Record<string, unknown>
  const candidates: unknown[] = []

  candidates.push(body.variant_id)
  candidates.push(body.variantId)

  const items = Array.isArray(body.items) ? body.items : []
  const lineItems = Array.isArray(body.line_items) ? body.line_items : []
  const allRows = [...items, ...lineItems]

  for (const row of allRows) {
    if (!row || typeof row !== "object") {
      continue
    }

    const rowRecord = row as Record<string, unknown>
    candidates.push(rowRecord.variant_id)
    candidates.push(rowRecord.variantId)
  }

  return Array.from(
    new Set(
      candidates.filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0
      )
    )
  )
}

const getOutOfStockProductsByVariantIds = async (
  req: MedusaRequest,
  variantIds: string[]
): Promise<Array<{ id: string; title: string }>> => {
  if (!variantIds.length) {
    return []
  }

  const query = req.scope.resolve("query")
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "product.id", "product.title", "product.metadata"],
    filters: {
      id: variantIds,
    },
  })

  return (variants as Array<{
    product?: {
      id?: string
      title?: string | null
      metadata?: Record<string, unknown> | null
    } | null
  }>).reduce((acc, variant) => {
    const product = variant.product
    const productId = product?.id
    if (!productId) {
      return acc
    }

    if (getMetadataBoolean(product.metadata?.is_out_of_stock)) {
      acc.push({
        id: productId,
        title: typeof product.title === "string" ? product.title : "",
      })
    }

    return acc
  }, [] as Array<{ id: string; title: string }>)
}

const getOutOfStockProductsByLineItemId = async (
  req: MedusaRequest,
  cartId: string,
  lineItemId: string
): Promise<Array<{ id: string; title: string }>> => {
  const query = req.scope.resolve("query")
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "items.id", "items.product_id"],
    filters: {
      id: cartId,
    },
  })

  const cart = (carts as Array<{
    id: string
    items?: Array<{ id?: string | null; product_id?: string | null }>
  }>)[0]
  const matchedLine = (cart?.items || []).find((item) => item?.id === lineItemId)
  const productId =
    matchedLine?.product_id && typeof matchedLine.product_id === "string"
      ? matchedLine.product_id
      : ""

  if (!productId) {
    return []
  }

  return getOutOfStockProducts(req, [productId])
}

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const isLineItemRemovalRequest = (payload: unknown): boolean => {
  if (!payload || typeof payload !== "object") {
    return false
  }

  const body = payload as Record<string, unknown>
  const quantity = toNumberOrNull(body.quantity)
  if (typeof quantity === "number" && quantity <= 0) {
    return true
  }

  if (body.delete === true || body.remove === true) {
    return true
  }

  if (typeof body.action === "string") {
    const normalized = body.action.trim().toLowerCase()
    if (["remove", "delete"].includes(normalized)) {
      return true
    }
  }

  return false
}

const enrichItemsPricing = (
  items: CartItemRecord[],
  metadataByProductId: Record<string, Record<string, unknown>>,
  cashbackEnabled: boolean,
  options?: {
    mutateUnitPrice?: boolean
  }
) => {
  const shouldMutateUnitPrice = options?.mutateUnitPrice ?? false
  let computedTotal = 0
  let computedSubtotal = 0
  let computedTax = 0

  for (const item of items) {
    if (!item?.product_id) {
      continue
    }

    const metadata = metadataByProductId[item.product_id] || {}
    const isOutOfStock = getMetadataBoolean(metadata.is_out_of_stock)
    const actualPrice = getMetadataNumber(metadata.actual_price)
    const baseOurPrice = getMetadataNumber(metadata.our_price)
    const ourPrice = cashbackEnabled ? actualPrice : baseOurPrice
    const discountAmount =
      typeof actualPrice === "number" && typeof ourPrice === "number"
        ? actualPrice - ourPrice
        : null
    const discountPercent =
      typeof actualPrice === "number" && actualPrice > 0 && typeof discountAmount === "number"
        ? (discountAmount / actualPrice) * 100
        : null
    const quantity = typeof item.quantity === "number" && Number.isFinite(item.quantity)
      ? item.quantity
      : 0
    const actualTotal = typeof actualPrice === "number" ? actualPrice * quantity : null
    const ourTotal = typeof ourPrice === "number" ? ourPrice * quantity : null
    const discountTotal =
      typeof discountAmount === "number" ? discountAmount * quantity : null
    const unitPrice =
      (cashbackEnabled ? actualPrice : null) ??
      getMetadataNumber(item.unit_price) ??
      (typeof ourPrice === "number" ? ourPrice : null) ??
      (typeof actualPrice === "number" ? actualPrice : null)
    const unitTotal = typeof unitPrice === "number" ? unitPrice * quantity : null

    if (isOutOfStock) {
      if (shouldMutateUnitPrice) {
        item.unit_price = 0
      }

      item.pricing = {
        actual_price: roundMoney(actualPrice),
        our_price: roundMoney(ourPrice),
        discount_amount: roundMoney(discountAmount),
        discount_percent: roundMoney(discountPercent),
        actual_total: 0,
        our_total: 0,
        discount_total: 0,
        unit_price: 0,
        unit_total: 0,
      }
      continue
    }

    if (typeof unitPrice === "number" && quantity > 0) {
      const lineTotal = unitPrice * quantity
      const rate = typeof item.tax_lines?.[0]?.rate === "number"
        ? item.tax_lines?.[0]?.rate || 0
        : 0
      const isTaxInclusive = Boolean(item.is_tax_inclusive)
      const lineTax = isTaxInclusive && rate > 0
        ? (lineTotal * rate) / (100 + rate)
        : 0
      const lineSubtotal = lineTotal - lineTax

      computedTotal += lineTotal
      computedTax += lineTax
      computedSubtotal += lineSubtotal

      if (cashbackEnabled && shouldMutateUnitPrice) {
        item.unit_price = roundMoney(unitPrice)
      }
    }

    item.pricing = {
      actual_price: roundMoney(actualPrice),
      our_price: roundMoney(ourPrice),
      discount_amount: roundMoney(discountAmount),
      discount_percent: roundMoney(discountPercent),
      actual_total: roundMoney(actualTotal),
      our_total: roundMoney(ourTotal),
      discount_total: roundMoney(discountTotal),
      unit_price: roundMoney(unitPrice),
      unit_total: roundMoney(unitTotal),
    }
  }

  return {
    computedTotal,
    computedSubtotal,
    computedTax,
  }
}

const cartPricingMiddleware = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const originalJson = res.json.bind(res)

  res.json = (async (body: CartApiBody) => {
    try {
      if (!body || typeof body !== "object") {
        return originalJson(body)
      }

      const cart = body.cart
      if (!cart || !Array.isArray(cart.items) || !cart.items.length) {
        return originalJson(body)
      }

      const cashbackEnabled = getMetadataBoolean(cart.metadata?.cashback)
      cart.cashback = cashbackEnabled

      const productIds = collectItemProductIds(cart.items)

      if (!productIds.length) {
        return originalJson(body)
      }

      const metadataByProductId = await getProductMetadataByProductId(req, productIds)

      await enrichItemCategories(req, cart.items)

      const shouldPersistCashbackPricing =
        cashbackEnabled && req.method?.toUpperCase() === "POST"
      let hasOutOfStockItems = false

      const lineItemUpdates: Array<{ id: string; unit_price: number }> = []

      for (const item of cart.items) {
        item.is_out_of_stock = item?.product_id
          ? getMetadataBoolean((metadataByProductId[item.product_id] || {}).is_out_of_stock)
          : false
        hasOutOfStockItems = hasOutOfStockItems || Boolean(item.is_out_of_stock)

        const lineItemId = (item as { id?: string } | null)?.id
        const actualPrice = item?.product_id
          ? getMetadataNumber((metadataByProductId[item.product_id] || {}).actual_price)
          : null
        if (
          shouldPersistCashbackPricing &&
          !item.is_out_of_stock &&
          typeof actualPrice === "number" &&
          lineItemId
        ) {
          lineItemUpdates.push({
            id: lineItemId,
            unit_price: actualPrice,
          })
        }
      }

      const {
        computedTotal,
        computedSubtotal,
        computedTax,
      } = enrichItemsPricing(cart.items, metadataByProductId, cashbackEnabled, {
        mutateUnitPrice: true,
      })

      if (lineItemUpdates.length) {
        try {
          const cartService = req.scope.resolve(Modules.CART)
          await cartService.updateLineItems(lineItemUpdates)
        } catch {
          // ignore persistence errors to avoid breaking the response
        }
      }

      if (cashbackEnabled || hasOutOfStockItems) {
        cart.total = roundMoney(computedTotal)
        cart.subtotal = roundMoney(computedSubtotal)
        cart.tax_total = roundMoney(computedTax)
        cart.item_total = roundMoney(computedTotal)
        cart.item_subtotal = roundMoney(computedSubtotal)
        cart.item_tax_total = roundMoney(computedTax)
        cart.original_total = roundMoney(computedTotal)
        cart.original_tax_total = roundMoney(computedTax)
        cart.original_item_total = roundMoney(computedTotal)
        cart.original_item_subtotal = roundMoney(computedSubtotal)
        cart.original_item_tax_total = roundMoney(computedTax)
      }

      return originalJson(body)
    } catch {
      return originalJson(body)
    }
  }) as unknown as typeof res.json

  next()
}

const completeCartCategoryMiddleware = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const originalJson = res.json.bind(res)

  res.json = (async (body: CompleteCartApiBody) => {
    try {
      if (!body || typeof body !== "object") {
        return originalJson(body)
      }

      if (body.order?.items?.length) {
        await enrichItemCategories(req, body.order.items)
      }

      if (body.order) {
        const firstName =
          body.order.first_name ||
          body.order.billing_address?.first_name ||
          body.order.shipping_address?.first_name ||
          body.cart?.billing_address?.first_name ||
          body.cart?.shipping_address?.first_name ||
          null
        const lastName =
          body.order.last_name ||
          body.order.billing_address?.last_name ||
          body.order.shipping_address?.last_name ||
          body.cart?.billing_address?.last_name ||
          body.cart?.shipping_address?.last_name ||
          null

        body.order.first_name = firstName
        body.order.last_name = lastName

        if (body.order.customer) {
          body.order.customer.first_name = body.order.customer.first_name || firstName
          body.order.customer.last_name = body.order.customer.last_name || lastName
        }
      }

      if (body.cart?.items?.length) {
        await enrichItemCategories(req, body.cart.items)
      }

      const orderItems = Array.isArray(body.order?.items) ? body.order.items : []
      const cartItems = Array.isArray(body.cart?.items) ? body.cart.items : []
      const allItems = [...orderItems, ...cartItems]
      const productIds = collectItemProductIds(allItems)

      if (productIds.length) {
        const metadataByProductId = await getProductMetadataByProductId(req, productIds)
        const cashbackEnabled = getMetadataBoolean(body.cart?.metadata?.cashback)

        if (body.cart) {
          body.cart.cashback = cashbackEnabled
        }

        if (orderItems.length) {
          for (const item of orderItems) {
            item.is_out_of_stock = item?.product_id
              ? getMetadataBoolean((metadataByProductId[item.product_id] || {}).is_out_of_stock)
              : false
          }

          enrichItemsPricing(orderItems, metadataByProductId, cashbackEnabled, {
            mutateUnitPrice: false,
          })
        }

        if (cartItems.length) {
          for (const item of cartItems) {
            item.is_out_of_stock = item?.product_id
              ? getMetadataBoolean((metadataByProductId[item.product_id] || {}).is_out_of_stock)
              : false
          }
          const hasOutOfStockItems = cartItems.some((item) => Boolean(item.is_out_of_stock))

          const {
            computedTotal,
            computedSubtotal,
            computedTax,
          } = enrichItemsPricing(cartItems, metadataByProductId, cashbackEnabled, {
            mutateUnitPrice: false,
          })

          if (body.cart && (cashbackEnabled || hasOutOfStockItems)) {
            body.cart.total = roundMoney(computedTotal)
            body.cart.subtotal = roundMoney(computedSubtotal)
            body.cart.tax_total = roundMoney(computedTax)
            body.cart.item_total = roundMoney(computedTotal)
            body.cart.item_subtotal = roundMoney(computedSubtotal)
            body.cart.item_tax_total = roundMoney(computedTax)
            body.cart.original_total = roundMoney(computedTotal)
            body.cart.original_tax_total = roundMoney(computedTax)
            body.cart.original_item_total = roundMoney(computedTotal)
            body.cart.original_item_subtotal = roundMoney(computedSubtotal)
            body.cart.original_item_tax_total = roundMoney(computedTax)
          }
        }
      }

      return originalJson(body)
    } catch {
      return originalJson(body)
    }
  }) as unknown as typeof res.json

  next()
}

const orderCategoryMiddleware = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const originalJson = res.json.bind(res)

  res.json = (async (body: OrderApiBody) => {
    try {
      if (!body || typeof body !== "object") {
        return originalJson(body)
      }

      const items: CartItemRecord[] = []

      if (Array.isArray(body.order?.items)) {
        items.push(...body.order.items)
      }

      if (Array.isArray(body.orders)) {
        for (const order of body.orders) {
          if (Array.isArray(order?.items)) {
            items.push(...order.items)
          }
        }
      }

      const responseOrders: Array<Record<string, unknown>> = []

      if (body.order && typeof body.order === "object") {
        responseOrders.push(body.order as Record<string, unknown>)
      }
      if (Array.isArray(body.orders)) {
        for (const order of body.orders) {
          if (order && typeof order === "object") {
            responseOrders.push(order as Record<string, unknown>)
          }
        }
      }

      const orderIdsNeedingLookup = responseOrders
        .map((order) => {
          const existingTransactionId = extractOrderTransactionId(order)
          const existingPaymentMode = extractOrderPaymentMode(order)
          const existingBankRef = extractOrderBankRef(order)
          const existingRefundId = extractOrderRefundId(order)

          if (existingTransactionId) {
            order.transaction_id = existingTransactionId
          }
          if (existingPaymentMode) {
            order.payment_mode = existingPaymentMode
          }
          if (existingBankRef) {
            order.bank_ref = existingBankRef
          }
          if (existingRefundId) {
            order.refund_id = existingRefundId
          }

          const orderId = firstNonEmptyString(order.id)
          if (
            !orderId ||
            (existingTransactionId &&
              existingPaymentMode &&
              existingBankRef &&
              existingRefundId)
          ) {
            return ""
          }

          return orderId
        })
        .filter(Boolean)

      if (orderIdsNeedingLookup.length) {
        const paymentDetailsByOrderId = await loadOrderPaymentDetailsMap(
          req,
          Array.from(new Set(orderIdsNeedingLookup))
        )

        for (const order of responseOrders) {
          const orderId = firstNonEmptyString(order.id)
          if (!orderId) {
            continue
          }

          const details = paymentDetailsByOrderId[orderId]
          if (!details) {
            continue
          }

          if (!order.transaction_id && details.transaction_id) {
            order.transaction_id = details.transaction_id
          }

          if (!order.payment_mode && details.payment_mode) {
            order.payment_mode = details.payment_mode
          }

          if (!order.bank_ref && details.bank_ref) {
            order.bank_ref = details.bank_ref
          }

          if (!order.refund_id && details.refund_id) {
            order.refund_id = details.refund_id
          }
        }
      }

      if (!items.length) {
        return originalJson(body)
      }

      await enrichItemCategories(req, items)

      return originalJson(body)
    } catch {
      return originalJson(body)
    }
  }) as unknown as typeof res.json

  next()
}

const SUCCESSFUL_EASEBUZZ_STATUSES = new Set([
  "success",
  "successful",
  "captured",
  "authorized",
])

const hasCapturedEasebuzzPaymentSession = async (
  query: {
    graph: (input: {
      entity: string
      fields: string[]
      filters: Record<string, unknown>
    }) => Promise<{ data?: unknown[] }>
  },
  cartId: string
): Promise<boolean> => {
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.status",
      "payment_collection.payment_sessions.data",
    ],
    filters: {
      id: cartId,
    },
  })

  const cart = (carts as Array<{ payment_collection?: { payment_sessions?: any[] } }> | undefined)?.[0]
  const rawSessions = cart?.payment_collection?.payment_sessions
  const sessions = Array.isArray(rawSessions) ? rawSessions : []

  return sessions.some((session) => {
    const providerId = String(session?.provider_id || "").trim()
    if (providerId !== "pp_easebuzz_default") {
      return false
    }

    const rawStatus = String(
      session?.status ||
        session?.data?.status ||
        session?.data?.payment_status ||
        session?.data?.tx_status ||
        session?.data?.result ||
        session?.data?.easebuzz_status ||
        ""
    )
      .trim()
      .toLowerCase()

    return SUCCESSFUL_EASEBUZZ_STATUSES.has(rawStatus)
  })
}

const checkoutOtpGuardMiddleware = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const otpRequired = (process.env.CHECKOUT_OTP_REQUIRED || "false")
    .trim()
    .toLowerCase() === "true"

  if (!otpRequired) {
    next()
    return
  }

  const cartId = req.params?.id
  if (!cartId || typeof cartId !== "string") {
    res.status(400).json({
      message: "Cart id is required for OTP verification.",
    })
    return
  }

  const query = req.scope.resolve("query")
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "email"],
    filters: {
      id: cartId,
    },
  })

  const cart = (carts as Array<{ id: string; email?: string | null }>)?.[0]
  const cartEmail = (cart?.email || "").trim().toLowerCase()

  if (!cart || !cartEmail) {
    res.status(400).json({
      message: "A verified cart email is required before completing checkout.",
    })
    return
  }

  const { data: otpRows } = await query.graph({
    entity: "checkout_otp",
    fields: ["*"],
    filters: {
      cart_id: cartId,
      email: cartEmail,
      verified: true,
    },
  })

  const latestVerified = [...(otpRows || [])]
    .sort((a: any, b: any) => {
      const at = a?.created_at ? new Date(a.created_at).getTime() : 0
      const bt = b?.created_at ? new Date(b.created_at).getTime() : 0
      return bt - at
    })[0] as { expires_at?: string | Date } | undefined

  const verifiedUntil = latestVerified?.expires_at
    ? new Date(latestVerified.expires_at).getTime()
    : 0

  if (!latestVerified || verifiedUntil <= Date.now()) {
    const hasCapturedGatewayPayment = await hasCapturedEasebuzzPaymentSession(
      query as any,
      cartId
    )

    if (hasCapturedGatewayPayment) {
      next()
      return
    }

    res.status(403).json({
      message: "OTP verification is required before completing checkout.",
    })
    return
  }

  next()
}

const checkoutOutOfStockGuardMiddleware = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const cartId = req.params?.id

  if (!cartId || typeof cartId !== "string") {
    res.status(400).json({
      message: "Cart id is required before completing checkout.",
    })
    return
  }

  const query = req.scope.resolve("query")
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "items.product_id"],
    filters: {
      id: cartId,
    },
  })

  const cart = (carts as Array<{
    id: string
    items?: Array<{ product_id?: string | null }>
  }>)[0]

  if (!cart) {
    res.status(404).json({
      message: "Cart not found.",
    })
    return
  }

  const productIds = Array.from(
    new Set(
      (cart.items || [])
        .map((item) => item?.product_id)
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    )
  )

  const outOfStockProducts = await getOutOfStockProducts(req, productIds)
  if (!outOfStockProducts.length) {
    next()
    return
  }

  res.status(409).json({
    message: "Some items in your cart are currently unavailable.",
    code: "out_of_stock_products",
    products: outOfStockProducts,
  })
}

const cartLineItemsOutOfStockGuardMiddleware = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const cartId = req.params?.id

  if (!cartId || typeof cartId !== "string") {
    res.status(400).json({
      message: "Cart id is required before adding line items.",
    })
    return
  }

  const lineItemId = req.params?.line_id
  if (
    typeof lineItemId === "string" &&
    lineItemId.trim().length > 0 &&
    isLineItemRemovalRequest(req.body)
  ) {
    next()
    return
  }

  const outOfStockProducts =
    typeof lineItemId === "string" && lineItemId.trim().length > 0
      ? await getOutOfStockProductsByLineItemId(req, cartId, lineItemId)
      : await getOutOfStockProductsByVariantIds(
          req,
          extractVariantIdsFromLineItemPayload(req.body)
        )

  if (!outOfStockProducts.length) {
    next()
    return
  }

  res.status(409).json({
    message: "This product is currently unavailable and cannot be added to cart.",
    code: "out_of_stock_products",
    products: outOfStockProducts,
  })
}

const waitForCartComplete = async (entry: InFlightCompleteCart) => {
  return await new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => {
      resolve(false)
    }, COMPLETE_CART_WAIT_MS)

    entry.waiters.push(() => {
      clearTimeout(timeout)
      resolve(true)
    })
  })
}

const preventConcurrentCartCompleteMiddleware = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const cartId = req.params?.id

  if (!cartId || typeof cartId !== "string") {
    next()
    return
  }

  const now = Date.now()
  const existingEntry = IN_FLIGHT_COMPLETE_CARTS.get(cartId)

  if (existingEntry && now - existingEntry.startedAt < COMPLETE_CART_GUARD_TTL_MS) {
    if (
      existingEntry.response &&
      now - existingEntry.response.capturedAt < COMPLETE_CART_RESPONSE_CACHE_TTL_MS
    ) {
      res.status(existingEntry.response.statusCode).json(existingEntry.response.body)
      return
    }

    await waitForCartComplete(existingEntry)
    const latestEntry = IN_FLIGHT_COMPLETE_CARTS.get(cartId)
    const replayableResponse = latestEntry?.response

    if (
      replayableResponse &&
      Date.now() - replayableResponse.capturedAt < COMPLETE_CART_RESPONSE_CACHE_TTL_MS
    ) {
      res.status(replayableResponse.statusCode).json(replayableResponse.body)
      return
    }

    res.status(409).json({
      type: "checkout_in_progress",
      message: "Checkout is already in progress for this cart. Please wait a few seconds and retry.",
    })
    return
  }

  const entry: InFlightCompleteCart = {
    startedAt: now,
    waiters: [],
  }
  IN_FLIGHT_COMPLETE_CARTS.set(cartId, entry)

  const originalJson = res.json.bind(res)
  res.json = ((body: unknown) => {
    entry.response = {
      statusCode: res.statusCode || 200,
      body,
      capturedAt: Date.now(),
    }
    return originalJson(body as any)
  }) as typeof res.json

  let released = false
  const release = () => {
    if (released) {
      return
    }

    released = true
    const activeEntry = IN_FLIGHT_COMPLETE_CARTS.get(cartId)
    if (activeEntry !== entry) {
      return
    }

    for (const notify of entry.waiters) {
      notify()
    }
    entry.waiters.length = 0

    if (!entry.response) {
      IN_FLIGHT_COMPLETE_CARTS.delete(cartId)
      return
    }

    const cleanupTimer = setTimeout(() => {
      const currentEntry = IN_FLIGHT_COMPLETE_CARTS.get(cartId)
      if (currentEntry === entry) {
        IN_FLIGHT_COMPLETE_CARTS.delete(cartId)
      }
    }, COMPLETE_CART_RESPONSE_CACHE_TTL_MS)

    ;(cleanupTimer as ReturnType<typeof setTimeout> & { unref?: () => void }).unref?.()
  }

  res.on("finish", release)
  res.on("close", release)

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/products",
      method: ["GET"],
      middlewares: [productCategorySlugFilterMiddleware, productExtrasMiddleware],
    },
    {
      matcher: "/store/products/:id",
      method: ["GET"],
      middlewares: [productExtrasMiddleware],
    },
    {
      matcher: "/store/product-categories",
      method: ["GET"],
      middlewares: [categoryExtrasMiddleware],
    },
    {
      matcher: "/store/product-categories/:id",
      method: ["GET"],
      middlewares: [categoryExtrasMiddleware],
    },
    {
      matcher: "/admin/product-categories",
      method: ["GET"],
      middlewares: [categoryExtrasMiddleware],
    },
    {
      matcher: "/admin/product-categories/:id",
      method: ["GET"],
      middlewares: [categoryExtrasMiddleware],
    },
    {
      matcher: "/admin/categories/:category_id/images",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(CreateCategoryImagesSchema),
      ],
    },
    {
      matcher: "/admin/categories/:category_id/images/batch",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(UpdateCategoryImagesSchema),
      ],
    },
    {
      matcher: "/admin/categories/:category_id/images/batch",
      method: ["DELETE"],
      middlewares: [
        validateAndTransformBody(DeleteCategoryImagesSchema),
      ],
    },
    {
      matcher: "/admin/exam-series",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(CreateExamSeriesSchema),
      ],
    },
    {
      matcher: "/admin/exam-series/:id",
      method: ["PATCH", "POST"],
      middlewares: [
        validateAndTransformBody(UpdateExamSeriesSchema),
      ],
    },
    {
      matcher: "/admin/international-countries",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(CreateCountrySchema),
      ],
    },
    {
      matcher: "/admin/international-countries/:id",
      method: ["PATCH", "POST"],
      middlewares: [
        validateAndTransformBody(UpdateCountrySchema),
      ],
    },
    {
      matcher: "/store/contact-requests",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(CreateContactRequestSchema),
      ],
    },
    {
      matcher: "/store/checkout-otp/request",
      method: ["POST"],
      middlewares: [validateAndTransformBody(CreateCheckoutOtpRequestSchema)],
    },
    {
      matcher: "/store/checkout-otp/verify",
      method: ["POST"],
      middlewares: [validateAndTransformBody(VerifyCheckoutOtpSchema)],
    },
    {
      matcher: "/store/easebuzz/payment-session",
      method: ["POST"],
      middlewares: [validateAndTransformBody(UpdateEasebuzzPaymentSessionSchema)],
    },
    {
      matcher: "/admin/contact-requests",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(CreateContactRequestAdminSchema),
      ],
    },
    {
      matcher: "/admin/email-template-config",
      method: ["POST", "PATCH"],
      middlewares: [
        validateAndTransformBody(UpsertEmailTemplateConfigSchema),
      ],
    },
    {
      matcher: "/store/carts",
      method: ["POST", "GET"],
      middlewares: [cartPricingMiddleware],
    },
    {
      matcher: "/store/carts/:id",
      method: ["POST", "GET"],
      middlewares: [cartPricingMiddleware],
    },
    {
      matcher: "/store/carts/:id/line-items",
      method: ["POST"],
      middlewares: [cartLineItemsOutOfStockGuardMiddleware, cartPricingMiddleware],
    },
    {
      matcher: "/store/carts/:id/line-items/:line_id",
      method: ["POST"],
      middlewares: [cartLineItemsOutOfStockGuardMiddleware, cartPricingMiddleware],
    },
    {
      matcher: "/store/carts/:id/complete",
      method: ["POST"],
      middlewares: [
        preventConcurrentCartCompleteMiddleware,
        checkoutOutOfStockGuardMiddleware,
        checkoutOtpGuardMiddleware,
        completeCartCategoryMiddleware,
      ],
    },
    {
      matcher: "/store/orders",
      method: ["GET"],
      middlewares: [orderCategoryMiddleware],
    },
    {
      matcher: "/store/orders/:id",
      method: ["GET"],
      middlewares: [orderCategoryMiddleware],
    },
    {
      matcher: "/admin/orders",
      method: ["GET"],
      middlewares: [orderCategoryMiddleware],
    },
    {
      matcher: "/admin/orders/:id",
      method: ["GET"],
      middlewares: [orderCategoryMiddleware],
    },

  ],
})
