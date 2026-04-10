import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sortCategories } from "../utils/category-sort"
import { sortProducts } from "../utils/product-sort"

type CategoryMedia = {
  id: string
  url: string
  file_id: string
  type: "thumbnail" | "image"
  category_id: string
}

type CategoryRecord = {
  id: string
  name: string
  handle: string
  is_active?: boolean
  is_internal?: boolean
  parent_category_id?: string | null
  metadata?: Record<string, unknown> | null
}

type ProductRecord = {
  id: string
  title?: string | null
  subtitle?: string | null
  handle?: string | null
  status?: string | null
  metadata?: Record<string, unknown> | null
  categories?: Array<{
    id: string
    is_active?: boolean
    is_internal?: boolean
  }> | null
  variants?: Array<{
    prices?: Array<{
      amount?: number | null
      currency_code?: string | null
    }> | null
  }> | null
}

type ExamSeriesRecord = {
  id: string
  title?: string | null
  description?: string | null
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

const getProductPriceSummary = (
  product: ProductRecord,
  metadata: Record<string, unknown>
) => {
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

const getCategoryImageUrl = (media: CategoryMedia[] | undefined): string | null => {
  if (!media || media.length === 0) {
    return null
  }

  const thumbnail = media.find((item) => item.type === "thumbnail") || media[0]
  return thumbnail?.url ? normalizeMediaUrl(thumbnail.url) : null
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

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve("query")

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: [
      "id",
      "name",
      "handle",
      "is_active",
      "is_internal",
      "parent_category_id",
      "metadata",
    ],
    filters: {
      is_active: true,
      is_internal: false,
    },
  })

  const internationalCategories = sortCategories(
    (categories as CategoryRecord[]).filter((category) =>
      toBoolean(category.metadata?.show_in_international_products)
    )
  )

  const categoryIds = internationalCategories.map((category) => category.id)
  const categoryIdSet = new Set(categoryIds)

  const { data: mediaRows } = await query.graph({
    entity: "product_category_image",
    fields: ["id", "url", "file_id", "type", "category_id"],
    filters: {
      category_id: categoryIds.length ? categoryIds : ["pcat_no_match"],
    },
  })

  const mediaByCategoryId = (mediaRows as CategoryMedia[]).reduce((acc, media) => {
    const list = acc[media.category_id] || []
    list.push(media)
    acc[media.category_id] = list
    return acc
  }, {} as Record<string, CategoryMedia[]>)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "subtitle",
      "handle",
      "status",
      "metadata",
      "variants.prices.amount",
      "variants.prices.currency_code",
      "categories.id",
      "categories.is_active",
      "categories.is_internal",
    ],
  })

  const productRows = products as ProductRecord[]
  const internationalProducts = productRows.filter((product) =>
    toBoolean((product.metadata || {})["is_international"])
  )

  const attachedExamSeriesIds = Array.from(
    new Set(
      internationalProducts.flatMap((product) =>
        getExamSeriesIdsFromMetadata(product.metadata)
      )
    )
  )

  const { data: examSeriesRows } = await query.graph({
    entity: "exam_series",
    fields: ["id", "title", "description"],
    filters: {
      id: attachedExamSeriesIds.length ? attachedExamSeriesIds : ["exam_no_match"],
    },
  })

  const examSeriesById = (examSeriesRows as ExamSeriesRecord[]).reduce((acc, series) => {
    acc[series.id] = series
    return acc
  }, {} as Record<string, ExamSeriesRecord>)

  const productsByCategoryId = internationalProducts.reduce((acc, product) => {
    for (const category of product.categories || []) {
      if (!category?.id || !categoryIdSet.has(category.id)) {
        continue
      }

      const list = acc[category.id] || []
      list.push(product)
      acc[category.id] = list
    }

    return acc
  }, {} as Record<string, ProductRecord[]>)

  const responseCategories = internationalCategories.map((category) => {
    const metadata = (category.metadata || {}) as Record<string, unknown>
    const showInInternationalProducts = toBoolean(metadata.show_in_international_products)
    const attachedProducts = sortProducts(productsByCategoryId[category.id] || [])

    return {
      id: category.id,
      name: category.name,
      handle: category.handle,
      is_active: category.is_active ?? null,
      is_internal: category.is_internal ?? null,
      parent_category_id: category.parent_category_id ?? null,
      offer_badge_text: toText(metadata.offer_badge_text),
      fallbackDescription: toText(metadata.fallbackDescription),
      category_img: getCategoryImageUrl(mediaByCategoryId[category.id]),
      show_in_international_products: showInInternationalProducts,
      products: attachedProducts.map((product) => {
        const productMetadata = (product.metadata || {}) as Record<string, unknown>
        const { price, currency_code, our_price, actual_price } = getProductPriceSummary(
          product,
          productMetadata
        )
        const examSeriesIds = getExamSeriesIdsFromMetadata(productMetadata)

        return {
          id: product.id,
          title: toText(product.title),
          subtitle: toText(product.subtitle),
          handle: toText(product.handle),
          status: toBoolean(productMetadata.is_out_of_stock)
            ? "out_of_stock"
            : toText(product.status),
          prices: [
            {
              currency_code,
              price: formatPrice(price),
              our_price: formatPrice(our_price),
              actual_price: formatPrice(actual_price),
            },
          ],
          best_seller: toBoolean(productMetadata.best_seller),
          is_out_of_stock: toBoolean(productMetadata.is_out_of_stock),
          exam_series: examSeriesIds
            .map((id) => examSeriesById[id])
            .filter((series): series is ExamSeriesRecord => Boolean(series))
            .map((series) => ({
              id: series.id,
              title: toText(series.title),
              description: toText(series.description),
            })),
          exam_series_text: toText(productMetadata.exam_series_text),
          fallbackDescription: toText(
            productMetadata.exam_series_description ?? productMetadata.fallbackDescription
          ),
          international_country_prices: productMetadata.international_country_prices ?? null,
        }
      }),
    }
  })

  res.status(200).json({
    product_categories: responseCategories,
    count: responseCategories.length,
  })
}
