import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sortProducts } from "../utils/product-sort"

type CategoryRecord = {
  id: string
  name?: string | null
  handle?: string | null
  is_active?: boolean
  is_internal?: boolean
  metadata?: Record<string, unknown> | null
}

type CategoryMedia = {
  id: string
  url: string
  file_id: string
  type: "thumbnail" | "image"
  category_id: string
}

type ProductRecord = {
  id: string
  title?: string | null
  subtitle?: string | null
  handle?: string | null
  status?: string | null
  metadata?: Record<string, unknown> | null
  categories?: CategoryRecord[]
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
  return typeof value === "string" ? value : ""
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

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const categoryHandleRaw =
    getSingleQueryValue(req.query, "category_slug") ||
    getSingleQueryValue(req.query, "category_handle") ||
    getSingleQueryValue(req.query, "handle")

  const requestedHandles = parseHandleList(categoryHandleRaw)
  const query = req.scope.resolve("query")

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "is_active", "is_internal", "metadata"],
    filters: requestedHandles.length
      ? {
          handle: requestedHandles,
          is_active: true,
          is_internal: false,
        }
      : {
          is_active: true,
          is_internal: false,
        },
  })

  const selectedCategories = categories as CategoryRecord[]
  const selectedCategoryIds = new Set(selectedCategories.map((category) => category.id))

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
      "categories.name",
      "categories.handle",
      "categories.is_active",
      "categories.is_internal",
    ],
  })

  const productRows = products as ProductRecord[]

  const filteredProducts = productRows.filter((product) => {
    const metadata = (product.metadata || {}) as Record<string, unknown>
    const isInternational = toBoolean(metadata.is_international)
    if (!isInternational) {
      return false
    }

    if (!requestedHandles.length) {
      return true
    }

    return (product.categories || []).some((category) => selectedCategoryIds.has(category.id))
  })

  const sortedProducts = sortProducts(filteredProducts)

  const attachedExamSeriesIds = Array.from(
    new Set(
      filteredProducts.flatMap((product) =>
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

  const allCategoryIds = Array.from(
    new Set(
      filteredProducts.flatMap((product) =>
        (product.categories || []).map((category) => category.id)
      )
    )
  )

  const { data: mediaRows } = await query.graph({
    entity: "product_category_image",
    fields: ["id", "url", "file_id", "type", "category_id"],
    filters: {
      category_id: allCategoryIds.length ? allCategoryIds : ["pcat_no_match"],
    },
  })

  const mediaByCategoryId = (mediaRows as CategoryMedia[]).reduce((acc, media) => {
    const list = acc[media.category_id] || []
    list.push(media)
    acc[media.category_id] = list
    return acc
  }, {} as Record<string, CategoryMedia[]>)

  res.status(200).json({
    filters: {
      category_handles: requestedHandles,
      international_only: true,
    },
    count: sortedProducts.length,
    products: sortedProducts.map((product) => {
      const metadata = (product.metadata || {}) as Record<string, unknown>
      const { price, currency_code, our_price, actual_price } = getProductPriceSummary(
        product,
        metadata
      )
      const examSeriesIds = getExamSeriesIdsFromMetadata(metadata)
      return {
        id: product.id,
        title: toText(product.title),
        subtitle: toText(product.subtitle),
        handle: toText(product.handle),
        status: toBoolean(metadata.is_out_of_stock)
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
        best_seller: toBoolean(metadata.best_seller),
        is_out_of_stock: toBoolean(metadata.is_out_of_stock),
        exam_series: examSeriesIds
          .map((id) => examSeriesById[id])
          .filter((series): series is ExamSeriesRecord => Boolean(series))
          .map((series) => ({
            id: series.id,
            title: toText(series.title),
            description: toText(series.description),
          })),
        exam_series_text: toText(metadata.exam_series_text),
        fallbackDescription: toText(metadata.exam_series_description ?? metadata.fallbackDescription),
        international_country_prices: metadata.international_country_prices ?? null,
      }
    }),
    category: (() => {
      if (!requestedHandles.length) {
        return null
      }

      const matchedCategory = selectedCategories[0]
      if (!matchedCategory) {
        return null
      }

      return {
        title: toText(matchedCategory.name),
        handle: toText(matchedCategory.handle),
        img: getCategoryImageUrl(mediaByCategoryId[matchedCategory.id]),
        fallbackDescription: toText(
          (matchedCategory.metadata as Record<string, unknown> | null | undefined)
            ?.fallbackDescription
        ),
      }
    })(),
  })
}
