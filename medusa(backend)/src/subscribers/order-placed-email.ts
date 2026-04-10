import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { sendOrderPlacedEmails } from "../lib/order-email"
import { generateOrderInvoiceWorkflow } from "../workflows/generate-order-invoice"
import { generateInvoicePdfBuffer, type InvoiceSnapshot } from "../lib/invoice"

const RECENT_EMAIL_SENT_AT = new Map<string, number>()
const DEDUPE_WINDOW_MS = 5 * 60 * 1000

const isTruthy = (value: string | undefined) => {
  return ["1", "true", "yes", "on"].includes((value || "").trim().toLowerCase())
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
      "decimal",
      "float",
      "calculated_amount",
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

const getNestedValue = (obj: Record<string, any>, path: string): unknown => {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") {
      return undefined
    }

    return (acc as Record<string, unknown>)[key]
  }, obj)
}

const pickNumericValue = (obj: Record<string, any>, paths: string[]): number | null => {
  for (const path of paths) {
    const value = getNestedValue(obj, path)
    const numeric = toNumericValue(value)
    if (numeric !== null) {
      return numeric
    }
  }

  return null
}

const getCategoryImageUrl = (categories: Array<Record<string, any>>) => {
  for (const category of categories) {
    const media = Array.isArray(category?.media) ? category.media : []
    const thumbnail = media.find((item: any) => item?.type === "thumbnail" && item?.url)?.url
    if (thumbnail) {
      return thumbnail
    }

    const firstImage = media.find((item: any) => item?.url)?.url
    if (firstImage) {
      return firstImage
    }
  }

  return ""
}

const loadProductDataByProductId = async (
  container: SubscriberArgs["container"],
  items: Array<Record<string, any>>
) => {
  const productIds = Array.from(
    new Set(
      items
        .map((item) => item?.product_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  )

  if (!productIds.length) {
    return {}
  }

  const query = container.resolve("query")
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "subtitle",
      "description",
      "thumbnail",
      "metadata",
      "categories.id",
      "categories.name",
      "categories.handle",
    ],
    filters: {
      id: productIds,
    },
  })

  const categoryIds = Array.from(
    new Set(
      (products || []).flatMap((product: any) =>
        (Array.isArray(product?.categories) ? product.categories : [])
          .map((category: any) => category?.id)
          .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
      )
    )
  )

  const mediaByCategoryId: Record<string, Array<{ url: string; type?: string }>> = {}

  if (categoryIds.length) {
    const { data: categoryImages } = await query.graph({
      entity: "product_category_image",
      fields: ["category_id", "url", "type"],
      filters: {
        category_id: categoryIds,
      },
    })

    for (const image of categoryImages as Array<{ category_id: string; url: string; type?: string }>) {
      const list = mediaByCategoryId[image.category_id] || []
      list.push({
        url: image.url,
        type: image.type,
      })
      mediaByCategoryId[image.category_id] = list
    }
  }

  return (products || []).reduce((acc, product: any) => {
    const categories = Array.isArray(product?.categories) ? product.categories : []
    const mappedCategories = categories.map((category: any) => ({
      id: category.id,
      title: category.name || "",
      slug: category.handle || "",
      handle: category.handle || "",
      img_url: getCategoryImageUrl([
        {
          media: mediaByCategoryId[category.id] || [],
        },
      ]),
      media: mediaByCategoryId[category.id] || [],
    }))
    acc[product.id] = {
      product: {
        id: product.id,
        title: product.title || "",
        handle: product.handle || "",
        subtitle: product.subtitle || "",
        description: product.description || "",
        thumbnail: product.thumbnail || "",
        metadata: product.metadata || {},
      },
      categories: mappedCategories,
    }
    return acc
  }, {} as Record<string, { product: Record<string, any>; categories: Array<Record<string, any>> }>)
}

const loadOrder = async (container: SubscriberArgs["container"], id: string) => {
  const query = container.resolve("query")

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "status",
      "payment_status",
      "created_at",
      "summary.subtotal",
      "summary.tax_total",
      "summary.total",
      "summary.discount_total",
      "first_name",
      "last_name",
      "customer_id",
      "email",
      "currency_code",
      "subtotal",
      "tax_total",
      "discount_total",
      "total",
      "items.title",
      "items.product_id",
      "items.quantity",
      "items.raw_quantity",
      "items.unit_price",
      "items.is_tax_inclusive",
      "items.total",
      "items.subtotal",
      "items.thumbnail",
      "items.detail.quantity",
      "items.detail.unit_price",
      "items.detail.total",
      "items.detail.subtotal",
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
      "billing_address.email",
      "billing_address.first_name",
      "billing_address.last_name",
      "billing_address.phone",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.phone",
    ],
    filters: {
      id,
    },
  })

  return orders?.[0]
}

const hasSuccessfulPayment = (order: Record<string, any>): boolean => {
  const paymentStatus = String(order?.payment_status || "").trim().toLowerCase()
  if (["captured", "paid", "partially_paid"].includes(paymentStatus)) {
    return true
  }

  const collections = Array.isArray(order?.payment_collections)
    ? order.payment_collections
    : []

  for (const collection of collections) {
    const payments = Array.isArray((collection as any)?.payments)
      ? (collection as any).payments
      : []

    for (const payment of payments) {
      const captures = Array.isArray((payment as any)?.captures)
        ? (payment as any).captures
        : []

      if (captures.length > 0) {
        return true
      }

      const data = (payment as any)?.data && typeof (payment as any).data === "object"
        ? ((payment as any).data as Record<string, unknown>)
        : {}

      const candidates = [
        data.status,
        data.payment_status,
        data.tx_status,
        data.easebuzz_status,
      ]

      if (
        candidates.some((value) => {
          const normalized = String(value || "").trim().toLowerCase()
          return ["success", "captured", "paid"].includes(normalized)
        })
      ) {
        return true
      }
    }
  }

  return false
}

const syncCustomerDetails = async (
  container: SubscriberArgs["container"],
  order: Awaited<ReturnType<typeof loadOrder>>
) => {
  const customerId = (order as any)?.customer_id

  if (!customerId) {
    return
  }

  const firstName =
    order?.billing_address?.first_name ||
    order?.shipping_address?.first_name ||
    undefined
  const lastName =
    order?.billing_address?.last_name ||
    order?.shipping_address?.last_name ||
    undefined
  const phone =
    order?.billing_address?.phone ||
    order?.shipping_address?.phone ||
    undefined

  if (!firstName && !lastName && !phone) {
    return
  }

  const customerService = container.resolve(Modules.CUSTOMER)

  await customerService.updateCustomers(customerId, {
    first_name: firstName,
    last_name: lastName,
    phone,
  })
}

export default async function orderPlacedEmail({ event, container }: SubscriberArgs<{ id: string }>) {
  const orderId = event?.data?.id
  if (!orderId) return

  const logger = (container.resolve("logger") || console) as {
    info?: (message: string) => void
    warn?: (message: string) => void
    error?: (message: string) => void
  }

  const eventName = String(event?.name || "")
  logger.info?.(`[OrderEmail] Subscriber triggered. event=${eventName || "unknown"}, order_id=${orderId}`)

  const now = Date.now()
  const lastSent = RECENT_EMAIL_SENT_AT.get(orderId) || 0
  if (now - lastSent < DEDUPE_WINDOW_MS) {
    logger.warn?.(
      `[OrderEmail] Skipping duplicate send for order_id=${orderId}. within_dedupe_window_ms=${DEDUPE_WINDOW_MS}`
    )
    return
  }

  try {
    const order = await loadOrder(container, orderId)
    if (!order) {
      logger.warn?.(`[OrderEmail] Order not found for order_id=${orderId}`)
      return
    }

    const shouldAttachPaymentDocs = hasSuccessfulPayment(order as Record<string, any>)
    if (!shouldAttachPaymentDocs) {
      logger.info?.(
        `[OrderEmail] Skipping send for unpaid order. order_id=${orderId}, event=${eventName || "unknown"}`
      )
      return
    }

    const includeReceiptAttachment = eventName !== "order.updated"

    await syncCustomerDetails(container, order)

    const items = (order.items || []) as Array<Record<string, any>>
    const productDataByProductId = await loadProductDataByProductId(container, items)

    const computedTotal = items.reduce((sum: number, item: any) => {
      const itemObj = (item || {}) as Record<string, any>
      const qty =
        pickNumericValue(itemObj, ["quantity", "raw_quantity", "detail.quantity"]) ?? 0
      const unit =
        pickNumericValue(itemObj, ["unit_price", "detail.unit_price"]) ?? 0
      return sum + unit * qty
    }, 0)

    const computedTax = items.reduce((sum: number, item: any) => {
      const taxLines = Array.isArray(item.tax_lines) ? item.tax_lines : []
      const lineTax = taxLines.reduce((acc: number, line: any) => {
        const total = toNumericValue(line.total) ?? 0
        return acc + total
      }, 0)
      return sum + lineTax
    }, 0)

    const summary = (order as any).summary || {}
    let total =
      toNumericValue((order as any).total) ??
      toNumericValue(summary.total) ??
      computedTotal
    let taxTotal =
      toNumericValue((order as any).tax_total) ??
      toNumericValue(summary.tax_total) ??
      computedTax
    const subtotalValue =
      toNumericValue((order as any).subtotal) ??
      toNumericValue(summary.subtotal)
    let subtotal = subtotalValue !== null ? subtotalValue : Math.max(total - taxTotal, 0)

    const forceGst = isTruthy(process.env.ORDER_EMAIL_FORCE_GST_FALLBACK)
    const gstRate = Number(process.env.ORDER_EMAIL_GST_RATE || 18)
    if (forceGst && (taxTotal <= 0 || !Number.isFinite(taxTotal)) && gstRate > 0) {
      const hasTaxInclusiveItems = items.some((item) => (item as any)?.is_tax_inclusive === true)

      if (hasTaxInclusiveItems || Math.abs(total - subtotal) < 0.01) {
        const baseTotal = total > 0 ? total : subtotal
        const fallbackTax = (baseTotal * gstRate) / (100 + gstRate)
        taxTotal = Number(fallbackTax.toFixed(2))
        subtotal = Number((baseTotal - taxTotal).toFixed(2))
        total = Number(baseTotal.toFixed(2))
      } else {
        const fallbackTax = (subtotal * gstRate) / 100
        taxTotal = Number(fallbackTax.toFixed(2))
        total = Number((subtotal + taxTotal).toFixed(2))
        subtotal = Number(subtotal.toFixed(2))
      }
    }

    const mappedItems = (items as any[]).map((item) => {
      const itemObj = (item || {}) as Record<string, any>
      const productData = itemObj.product_id
        ? productDataByProductId[itemObj.product_id] || null
        : null
      const categories = productData?.categories || []
      const productInfo = productData?.product || null
      const primaryCategory = categories[0] || null
      const quantity = pickNumericValue(itemObj, [
        "quantity",
        "raw_quantity",
        "detail.quantity",
      ])
      const unitPrice = pickNumericValue(itemObj, [
        "unit_price",
        "detail.unit_price",
      ])
      const itemSubtotal = pickNumericValue(itemObj, [
        "subtotal",
        "detail.subtotal",
      ])
      const itemTotal = pickNumericValue(itemObj, [
        "total",
        "detail.total",
      ])

      return {
        title: item.title,
        product_id: itemObj.product_id,
        product_title: productInfo?.title || item.title || null,
        product_handle: productInfo?.handle || null,
        product_subtitle: productInfo?.subtitle || null,
        product_description: productInfo?.description || null,
        product_metadata: productInfo?.metadata || null,
        quantity,
        unit_price: unitPrice,
        is_tax_inclusive: itemObj.is_tax_inclusive ?? null,
        subtotal: itemSubtotal,
        total: itemTotal,
        thumbnail:
          item.thumbnail ||
          productInfo?.thumbnail ||
          primaryCategory?.img_url ||
          null,
        category_title: primaryCategory?.title || null,
        category_slug: primaryCategory?.slug || null,
        category_image_url: primaryCategory?.img_url || null,
        categories,
      }
    })

    let invoiceAttachment:
      | {
          filename: string
          content: Buffer
          contentType: string
        }
      | undefined

    if (shouldAttachPaymentDocs) {
      try {
        const { result } = await generateOrderInvoiceWorkflow(container).run({
          input: {
            order_id: order.id,
            force_regenerate: true,
          },
        })

        const invoice = result as
          | {
              order_id: string
              display_id?: string | number | null
              invoice_json?: InvoiceSnapshot
            }
          | undefined

        if (invoice?.invoice_json) {
          const invoiceBuffer = await generateInvoicePdfBuffer(invoice.invoice_json)
          const invoiceNumber = String(invoice.invoice_json.invoice_number || "").trim()
          const safeInvoiceNumber = invoiceNumber.replace(/[^A-Za-z0-9_-]/g, "")
          invoiceAttachment = {
            filename: `Invoice-${safeInvoiceNumber || String(order.display_id || order.id)}.pdf`,
            content: invoiceBuffer,
            contentType: "application/pdf",
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.warn?.(
          `[OrderEmail] Invoice attachment generation failed for order_id=${orderId}. ${message}`
        )
      }
    }

    await sendOrderPlacedEmails(
      {
        id: order.id,
        display_id: order.display_id,
        status: (order as any).status,
        created_at: (order as any).created_at,
        first_name: (order as any).first_name,
        last_name: (order as any).last_name,
        email: order.email,
        currency_code: order.currency_code,
        subtotal,
        tax_total: taxTotal,
        total,
        discount_total:
          toNumericValue((order as any).discount_total) ??
          toNumericValue(summary.discount_total) ??
          0,
        summary,
        items: mappedItems,
        payment_collections: (order as any).payment_collections || [],
        cart_complete_response: {
          type: "order",
          order: {
            id: order.id,
            status: (order as any).status,
            summary: summary || {},
            currency_code: order.currency_code,
            display_id: order.display_id,
            email: order.email,
            total,
            subtotal,
            tax_total: taxTotal,
            discount_total:
              toNumericValue((order as any).discount_total) ??
              toNumericValue(summary.discount_total) ??
              0,
            created_at: (order as any).created_at,
            updated_at: (order as any).updated_at || (order as any).created_at,
            items: mappedItems,
            shipping_address: order.shipping_address,
            billing_address: order.billing_address,
            first_name: (order as any).first_name,
            last_name: (order as any).last_name,
          },
        },
        billing_address: order.billing_address,
        shipping_address: order.shipping_address,
      },
      {
        invoiceAttachment,
        includeCustomerPaymentAttachments: shouldAttachPaymentDocs,
        includeReceiptAttachment,
        scope: container,
      }
    )

    RECENT_EMAIL_SENT_AT.set(orderId, now)
    logger.info?.(`[OrderEmail] Order placed email sent for order_id=${orderId}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error?.(`[OrderEmail] Failed to send order placed email for order_id=${orderId}. ${message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.created", "order.updated"],
}
