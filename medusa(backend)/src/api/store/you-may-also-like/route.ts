import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sortProducts } from "../utils/product-sort"

type CategoryRecord = {
  id: string
  name?: string | null
  handle?: string | null
  parent_category_id?: string | null
  metadata?: Record<string, unknown> | null
  is_active?: boolean
  is_internal?: boolean
}

type ProductRecord = {
  id: string
  title?: string | null
  subtitle?: string | null
  handle?: string | null
  thumbnail?: string | null
  status?: string | null
  type_id?: string | null
  collection_id?: string | null
  type?: {
    id?: string | null
    value?: string | null
  } | null
  collection?: {
    id?: string | null
    title?: string | null
  } | null
  tags?: Array<{
    id?: string | null
    value?: string | null
  }> | null
  metadata?: Record<string, unknown> | null
  categories?: CategoryRecord[]
  variants?: Array<{
    id?: string | null
    title?: string | null
    sku?: string | null
    prices?: Array<{
      amount?: number | null
      currency_code?: string | null
      min_quantity?: number | null
      max_quantity?: number | null
    }> | null
  }> | null
  sales_channels?: Array<{
    id?: string | null
    name?: string | null
    is_default?: boolean | null
    is_active?: boolean | null
  }> | null
}

type CategoryImageRecord = {
  id: string
  url: string
  type: "thumbnail" | "image"
  category_id: string
}

type ExamSeriesRecord = {
  id: string
  title?: string | null
  description?: string | null
  category_id?: string | null
  category_title?: string | null
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

const getSingleQueryValue = (
  query: MedusaRequest["query"],
  key: string
): string => {
  const raw = (query as Record<string, unknown> | undefined)?.[key]

  if (typeof raw === "string") {
    return raw
  }

  if (Array.isArray(raw)) {
    const firstString = raw.find((value): value is string => typeof value === "string")
    return firstString || ""
  }

  return ""
}

const parseHandleList = (value: string): string[] => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "number") {
    return value !== 0
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase())
  }

  return false
}

const toText = (value: unknown): string => {
  if (typeof value === "string") {
    return value
  }

  if (typeof value === "number") {
    return value.toString()
  }

  return ""
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const formatPrice = (value: number | null): string | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }

  return value.toFixed(2)
}

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const toHtml = (value: unknown): string => {
  const text = toText(value).trim()

  if (!text) {
    return ""
  }

  if (/<\s*\/?[a-z][^>]*>/i.test(text)) {
    return text
  }

  const withLineBreaks = escapeHtml(text).replace(/\r\n|\r|\n/g, "<br />")
  return `<p>${withLineBreaks}</p>`
}

const getCategoryImageUrl = (media: CategoryImageRecord[] | undefined): string => {
  if (!media?.length) {
    return ""
  }

  const url = media.find((item) => item.type === "thumbnail")?.url || media[0]?.url || ""
  return normalizeMediaUrl(url)
}

const getExamSeriesIdsFromMetadata = (
  metadata: Record<string, unknown> | null | undefined
): string[] => {
  if (!metadata || typeof metadata !== "object") {
    return []
  }

  const raw = metadata.exam_series

  if (Array.isArray(raw)) {
    return raw.filter((value): value is string => typeof value === "string")
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim()
    if (!trimmed) {
      return []
    }

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === "string")
      }
    } catch {
      return trimmed
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    }
  }

  return []
}

const getProductPriceSummary = (product: ProductRecord, metadata: Record<string, unknown>) => {
  const prices = (product.variants || []).flatMap((variant) =>
    (variant?.prices || []).map((price) => ({
      amount: typeof price?.amount === "number" ? price.amount : null,
      currency_code: toText(price?.currency_code),
    }))
  )

  const pricedRows = prices.filter(
    (row): row is typeof row & { amount: number } => typeof row.amount === "number"
  )

  if (!pricedRows.length) {
    const metadataOurPrice = toNumber(metadata.our_price)
    const metadataActualPrice = toNumber(metadata.actual_price)
    return {
      price: metadataOurPrice,
      currency_code: "",
      actual_price: metadataActualPrice ?? metadataOurPrice,
      our_price: metadataOurPrice,
    }
  }

  const selected = pricedRows.reduce((lowest, current) =>
    current.amount < lowest.amount ? current : lowest
  )

  return {
    price: toNumber(metadata.our_price) ?? selected.amount,
    currency_code: selected.currency_code || "",
    actual_price: toNumber(metadata.actual_price) ?? toNumber(metadata.our_price) ?? selected.amount,
    our_price: toNumber(metadata.our_price) ?? selected.amount,
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const handleRaw =
    getSingleQueryValue(req.query, "category_slug") ||
    getSingleQueryValue(req.query, "category_handle") ||
    getSingleQueryValue(req.query, "handle")

  const requestedHandles = parseHandleList(handleRaw)
  const query = req.scope.resolve("query")

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "is_active", "is_internal"],
    filters: requestedHandles.length
      ? { handle: requestedHandles, is_active: true, is_internal: false }
      : { is_active: true, is_internal: false },
  })

  const selectedCategories = categories as CategoryRecord[]
  const selectedCategoryIds = new Set(selectedCategories.map((category) => category.id))

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
  })
  const regionRows = regions as Array<{ id: string; currency_code?: string | null }>
  const defaultRegion =
    regionRows.find((region) => (region.currency_code || "").toLowerCase() === "inr") ||
    null

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "subtitle",
      "handle",
      "thumbnail",
      "status",
      "type_id",
      "collection_id",
      "type.id",
      "type.value",
      "collection.id",
      "collection.title",
      "tags.id",
      "tags.value",
      "metadata",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.prices.amount",
      "variants.prices.currency_code",
      "variants.prices.min_quantity",
      "variants.prices.max_quantity",
      "sales_channels.id",
      "sales_channels.name",
      "sales_channels.is_default",
      "sales_channels.is_active",
      "categories.id",
      "categories.name",
      "categories.handle",
      "categories.parent_category_id",
      "categories.is_active",
      "categories.is_internal",
      "categories.metadata",
    ],
  })

  const productRows = products as ProductRecord[]
  const attachedExamSeriesIds = Array.from(
    new Set(
      productRows.flatMap((product) => getExamSeriesIdsFromMetadata(product.metadata))
    )
  )
  const { data: examSeriesRows } = await query.graph({
    entity: "exam_series",
    fields: ["id", "title", "description", "category_id", "category_title"],
    filters: {
      id: attachedExamSeriesIds.length ? attachedExamSeriesIds : ["exam_no_match"],
    },
  })
  const examSeriesById = (examSeriesRows as ExamSeriesRecord[]).reduce((acc, item) => {
    acc[item.id] = item
    return acc
  }, {} as Record<string, ExamSeriesRecord>)
  const allCategoryIds = Array.from(
    new Set(
      productRows.flatMap((product) =>
        (product.categories || [])
          .map((category) => category?.id)
          .filter((id): id is string => Boolean(id))
      )
    )
  )
  const { data: categoryMedia } = await query.graph({
    entity: "product_category_image",
    fields: ["id", "url", "type", "category_id"],
    filters: {
      category_id: allCategoryIds.length ? allCategoryIds : ["pcat_no_match"],
    },
  })
  const categoryMediaById = (categoryMedia as CategoryImageRecord[]).reduce((acc, item) => {
    const list = acc[item.category_id] || []
    list.push(item)
    acc[item.category_id] = list
    return acc
  }, {} as Record<string, CategoryImageRecord[]>)

  const filteredProducts = sortProducts(
    productRows.filter((product) => {
      const metadata = (product.metadata || {}) as Record<string, unknown>
      if (toBoolean(metadata.is_international)) {
        return false
      }

      if (!requestedHandles.length) {
        return true
      }

      return (product.categories || []).some((category) => selectedCategoryIds.has(category.id))
    })
  ).slice(0, 5)

  res.status(200).json({
    filters: {
      category_handles: requestedHandles,
    },
    count: filteredProducts.length,
    counts: {
      products: filteredProducts.length,
    },
    products: filteredProducts.map((product) => {
      const metadata = (product.metadata || {}) as Record<string, unknown>
      const validityTitle = toText(metadata.validity_title)
      const validityDescription = toHtml(metadata.validity_description)
      const deliveryTitle = toText(metadata.delivery_title)
      const deliveryDescription = toHtml(metadata.delivery_description)
      const additionalTitle = toText(metadata.additional_title)
      const additionalDescription = toHtml(metadata.additional_description)
      const examSeriesIds = getExamSeriesIdsFromMetadata(metadata)
      const { price, currency_code, our_price, actual_price } = getProductPriceSummary(
        product,
        metadata
      )

      return {
        id: product.id,
        variant_id: toText(product.variants?.[0]?.id),
        region_id: defaultRegion?.id || "",
        sales_channel_id: toText(product.sales_channels?.[0]?.id),
        title: toText(product.title),
        subtitle: toText(product.subtitle),
        handle: toText(product.handle),
        thumbnail: toText(product.thumbnail),
        status: toBoolean(metadata.is_out_of_stock)
          ? "out_of_stock"
          : toText(product.status),
        best_seller: toBoolean(metadata.best_seller),
        is_out_of_stock: toBoolean(metadata.is_out_of_stock),
        details_information: {
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
        },
        organize: {
          type: product.type
            ? {
                id: toText(product.type.id),
                value: toText(product.type.value),
              }
            : null,
          collection: product.collection
            ? {
                id: toText(product.collection.id),
                title: toText(product.collection.title),
              }
            : null,
          tags: (product.tags || []).map((tag) => ({
            id: toText(tag.id),
            value: toText(tag.value),
          })),
          categories: (product.categories || []).map((category) => ({
            id: category.id,
            name: toText(category.name),
            handle: toText(category.handle),
            parent_category_id: toText(category.parent_category_id),
            fallbackDescription: toText(
              (category.metadata as Record<string, unknown> | null | undefined)
                ?.fallbackDescription
            ),
          })),
        },
        type_id: toText(product.type_id),
        collection_id: toText(product.collection_id),
        type: product.type
          ? {
              id: toText(product.type.id),
              value: toText(product.type.value),
            }
          : null,
        prices: [
          {
            currency_code,
            price: formatPrice(price),
            our_price: formatPrice(our_price),
            actual_price: formatPrice(actual_price),
          },
        ],
        sales_channels: (product.sales_channels || []).map((channel) => ({
          id: toText(channel.id),
          name: toText(channel.name),
          is_default: Boolean(channel.is_default),
          is_active: channel.is_active ?? null,
        })),
        variants: (product.variants || []).map((variant) => ({
          id: toText(variant.id),
          title: toText(variant.title),
          sku: toText(variant.sku),
          prices: (variant.prices || []).map((variantPrice) => ({
            amount: formatPrice(
              typeof variantPrice?.amount === "number" ? variantPrice.amount : null
            ),
            currency_code: toText(variantPrice?.currency_code),
            min_quantity:
              typeof variantPrice?.min_quantity === "number"
                ? variantPrice.min_quantity
                : null,
            max_quantity:
              typeof variantPrice?.max_quantity === "number"
                ? variantPrice.max_quantity
                : null,
          })),
        })),
        exam_series: examSeriesIds
          .map((id) => examSeriesById[id])
          .filter((series): series is ExamSeriesRecord => Boolean(series))
          .map((series) => ({
            id: series.id,
            title: toText(series.title),
            description: toText(series.description),
            category_id: toText(series.category_id),
            category_title: toText(series.category_title),
          })),
        exam_series_text: toText(metadata.exam_series_text),
        fallbackDescription: toText(metadata.exam_series_description ?? metadata.fallbackDescription),
        metadata: {
          ...metadata,
          validity_description: validityDescription,
          delivery_description: deliveryDescription,
          additional_description: additionalDescription,
        },
        categories: (product.categories || [])
          .filter((category) => !category.is_internal && category.is_active !== false)
          .map((category) => ({
            id: category.id,
            slug: toText(category.handle),
            title: toText(category.name),
            media_url: getCategoryImageUrl(categoryMediaById[category.id]),
            fallbackDescription: toText(
              (category.metadata as Record<string, unknown> | null | undefined)
                ?.fallbackDescription
            ),
          })),
      }
    }),
  })
}
