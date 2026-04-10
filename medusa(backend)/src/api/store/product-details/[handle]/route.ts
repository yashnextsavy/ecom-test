import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { compareCategories, sortCategories } from "../../utils/category-sort"

type CategoryMedia = {
  id: string
  url: string
  file_id: string
  type: "thumbnail" | "image"
  category_id: string
}

type AdditionalInformationItem = {
  title: string
  description: string
  values: string[]
}

type FaqItem = {
  question: string
  answer: string
}

type FaqSection = {
  title: string
  description: string
}

type ListingPageBanner = {
  title: string
  description: string
  button_1_text: string
  button_1_link: string
  button_2_text: string
  button_2_link: string
}

type ListingPageSideSection = {
  title: string
  description: string
}

type CategoryRecord = {
  id: string
  name?: string | null
  handle?: string | null
  fallbackDescription?: string
  parent_category_id?: string | null
  metadata?: Record<string, unknown> | null
  is_active?: boolean
  is_internal?: boolean
  media?: CategoryMedia[]
  description?: string
  offer_badge?: string
  additional_information?: {
    title: string
    description: string
    exam_information: AdditionalInformationItem[]
    certification_levels: AdditionalInformationItem[]
  }
  faq_section?: FaqSection
  faq?: FaqItem[]
  listing_page_banner?: ListingPageBanner
  listing_page_side_section?: ListingPageSideSection
  children_categories?: CategoryRecord[]
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
  metadata?: Record<string, unknown> | null
  categories?: CategoryRecord[]
}

type ExamSeriesRecord = {
  id: string
  title?: string | null
  description?: string | null
  category_id?: string | null
  category_title?: string | null
}

const PRODUCT_METADATA_DUPLICATE_KEYS = new Set([
  "our_price",
  "actual_price",
  "exam_series",
  "exam_series_text",
  "validity_title",
  "validity_description",
  "delivery_title",
  "delivery_description",
  "additional_title",
  "additional_description",
  "seo_meta_title",
  "seo_meta_description",
])

const CATEGORY_METADATA_DUPLICATE_KEYS = new Set([
  "rich_description",
  "offer_badge_text",
  "listing_page_banner",
  "listing_page_banner_title",
  "listing_page_banner_description",
  "listing_page_banner_button_1_text",
  "listing_page_banner_button_1_link",
  "listing_page_banner_button_2_text",
  "listing_page_banner_button_2_link",
  "listing_page_side_section",
  "listing_page_side_section_title",
  "listing_page_side_section_description",
  "additional_information",
  "additional_information_section_title",
  "additional_information_section_description",
  "additional_information_exam_information",
  "additional_information_certification_levels",
  "category_faqs",
])

const omitKeys = (
  input: Record<string, unknown> | null | undefined,
  keys: Set<string>
): Record<string, unknown> => {
  if (!input || typeof input !== "object") {
    return {}
  }

  return Object.entries(input).reduce((acc, [key, value]) => {
    if (!keys.has(key)) {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, unknown>)
}

const cleanCategoryResponse = (category: CategoryRecord): CategoryRecord => {
  const metadata = (category.metadata || {}) as Record<string, unknown>
  return {
    ...category,
    fallbackDescription: toText(metadata.fallbackDescription),
    metadata: omitKeys(category.metadata, CATEGORY_METADATA_DUPLICATE_KEYS),
    children_categories: (category.children_categories || []).map(cleanCategoryResponse),
  }
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

  // Keep HTML generated by rich text editors as-is.
  if (/<\s*\/?[a-z][^>]*>/i.test(text)) {
    return text
  }

  const withLineBreaks = escapeHtml(text).replace(/\r\n|\r|\n/g, "<br />")
  return `<p>${withLineBreaks}</p>`
}

const getAdditionalInformationItems = (value: unknown): AdditionalInformationItem[] => {
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
        title: toText(candidate.title),
        description: toText(candidate.description),
        values: Array.isArray(candidate.values)
          ? candidate.values
              .filter((v): v is string => typeof v === "string")
              .map((item) => toHtml(item))
          : [],
      }
    })
    .filter((item): item is AdditionalInformationItem => Boolean(item))
}

const getFaqItems = (value: unknown): FaqItem[] => {
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
        question: toText(candidate.question),
        answer: toHtml(candidate.answer),
      }
    })
    .filter((item): item is FaqItem => Boolean(item))
}

const enrichCategories = (
  categories: CategoryRecord[],
  mediaByCategoryId: Record<string, CategoryMedia[]>
): CategoryRecord[] => {
  return categories.map((category) => {
    const metadata = (category.metadata || {}) as Record<string, unknown>

    const additionalInformation = {
      title: toText(metadata.additional_information_section_title),
      description: toText(metadata.additional_information_section_description),
      exam_information: getAdditionalInformationItems(
        metadata.additional_information_exam_information
      ),
      certification_levels: getAdditionalInformationItems(
        metadata.additional_information_certification_levels
      ),
    }

    const listingPageBanner: ListingPageBanner = {
      title: toHtml(metadata.listing_page_banner_title),
      description: toHtml(metadata.listing_page_banner_description),
      button_1_text: toText(metadata.listing_page_banner_button_1_text),
      button_1_link: toText(metadata.listing_page_banner_button_1_link),
      button_2_text: toText(metadata.listing_page_banner_button_2_text),
      button_2_link: toText(metadata.listing_page_banner_button_2_link),
    }
    const listingPageSideSection: ListingPageSideSection = {
      title: toText(metadata.listing_page_side_section_title),
      description: toHtml(metadata.listing_page_side_section_description),
    }
    const faqSection: FaqSection = {
      title: toText(metadata.category_faq_section_title),
      description: toHtml(metadata.category_faq_section_description),
    }
    const faq = getFaqItems(metadata.category_faqs)

    return {
      ...category,
      metadata: {
        ...metadata,
        rich_description: toHtml(metadata.rich_description),
        listing_page_banner_title: listingPageBanner.title,
        listing_page_banner_description: listingPageBanner.description,
        listing_page_side_section_description: listingPageSideSection.description,
        category_faq_section_title: faqSection.title,
        category_faq_section_description: faqSection.description,
        additional_information: additionalInformation,
        faq_section: faqSection,
        category_faqs: faq,
        listing_page_banner: listingPageBanner,
        listing_page_side_section: listingPageSideSection,
      },
      media: (mediaByCategoryId[category.id] || []).map((media) => ({
        ...media,
        url: normalizeMediaUrl(media.url),
      })),
      description: toHtml(metadata.rich_description),
      offer_badge: toText(metadata.offer_badge_text),
      additional_information: additionalInformation,
      faq_section: faqSection,
      faq,
      listing_page_banner: listingPageBanner,
      listing_page_side_section: listingPageSideSection,
    }
  })
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
      variant_id: toText(variant?.id),
      variant_title: toText(variant?.title),
      sku: toText(variant?.sku),
      amount: typeof price?.amount === "number" ? price.amount : null,
      currency_code: toText(price?.currency_code),
      min_quantity: typeof price?.min_quantity === "number" ? price.min_quantity : null,
      max_quantity: typeof price?.max_quantity === "number" ? price.max_quantity : null,
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
  const handleFromParams = ((req.params || {}) as Record<string, string | undefined>).handle || ""
  const handleFromQuery =
    getSingleQueryValue(req.query, "product_slug") ||
    getSingleQueryValue(req.query, "product_handle") ||
    getSingleQueryValue(req.query, "slug") ||
    getSingleQueryValue(req.query, "handle")
  const requestedHandle = (handleFromParams || handleFromQuery || "").trim()

  if (!requestedHandle) {
    res.status(400).json({
      code: "invalid_data",
      message: "Product handle is required.",
    })
    return
  }

  const query = req.scope.resolve("query")

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
      "metadata",
      "categories.id",
      "categories.name",
      "categories.handle",
      "categories.parent_category_id",
      "categories.is_active",
      "categories.is_internal",
      "categories.metadata",
    ],
    filters: {
      handle: [requestedHandle],
    },
  })

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
  })
  const regionRows = regions as Array<{ id: string; currency_code?: string | null }>
  const defaultRegion =
    regionRows.find((region) => (region.currency_code || "").toLowerCase() === "inr") ||
    null

  const product = (products as ProductRecord[])[0]
  if (!product) {
    res.status(404).json({
      code: "not_found",
      message: `Product not found for handle: ${requestedHandle}`,
    })
    return
  }

  if (toBoolean((product.metadata || {}).is_international)) {
    res.status(404).json({
      code: "not_found",
      message: `Product not found for handle: ${requestedHandle}`,
    })
    return
  }

  const attachedExamSeriesIds = Array.from(
    new Set(getExamSeriesIdsFromMetadata(product.metadata))
  )

  const { data: examSeriesRows } = await query.graph({
    entity: "exam_series",
    fields: ["id", "title", "description", "category_id", "category_title"],
    filters: {
      id: attachedExamSeriesIds.length ? attachedExamSeriesIds : ["exam_no_match"],
    },
  })

  const examSeriesById = (examSeriesRows as ExamSeriesRecord[]).reduce((acc, series) => {
    acc[series.id] = series
    return acc
  }, {} as Record<string, ExamSeriesRecord>)

  const relevantCategoryMap = new Map<string, CategoryRecord>()
  for (const category of product.categories || []) {
    if (!category?.id || category.is_internal || category.is_active === false) {
      continue
    }
    relevantCategoryMap.set(category.id, category)
  }

  const responseCategories = sortCategories(Array.from(relevantCategoryMap.values()))
  const responseCategoryIds = responseCategories.map((category) => category.id)

  const { data: childCategories } = await query.graph({
    entity: "product_category",
    fields: [
      "id",
      "name",
      "handle",
      "parent_category_id",
      "is_active",
      "is_internal",
      "metadata",
    ],
    filters: {
      parent_category_id: responseCategoryIds.length ? responseCategoryIds : ["pcat_no_match"],
      is_active: true,
      is_internal: false,
    },
  })

  const childRows = sortCategories(childCategories as CategoryRecord[])
  const allCategoryRows = [...responseCategories, ...childRows]
  const allCategoryIds = Array.from(new Set(allCategoryRows.map((category) => category.id)))

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

  const enrichedParents = enrichCategories(responseCategories, mediaByCategoryId)
  const enrichedChildren = enrichCategories(childRows, mediaByCategoryId)
  const childrenByParentId = enrichedChildren.reduce((acc, child) => {
    const parentId = child.parent_category_id || ""
    if (!parentId) {
      return acc
    }

    const list = acc[parentId] || []
    list.push(child)
    acc[parentId] = list
    return acc
  }, {} as Record<string, CategoryRecord[]>)

  for (const list of Object.values(childrenByParentId)) {
    list.sort(compareCategories)
  }

  res.status(200).json({
    product_handle: requestedHandle,
    product: (() => {
      const metadata = (product.metadata || {}) as Record<string, unknown>
      const validityTitle = toText(metadata.validity_title)
      const validityDescription = toHtml(metadata.validity_description)
      const deliveryTitle = toText(metadata.delivery_title)
      const deliveryDescription = toHtml(metadata.delivery_description)
      const additionalTitle = toText(metadata.additional_title)
      const additionalDescription = toHtml(metadata.additional_description)
      const seoMetaTitle = toText(metadata.seo_meta_title)
      const seoMetaDescription = toText(metadata.seo_meta_description)
      const examSeriesIds = getExamSeriesIdsFromMetadata(metadata)
      const { price, currency_code, our_price, actual_price } = getProductPriceSummary(
        product,
        metadata
      )

      return {
        id: product.id,
        title: product.title || "",
        subtitle: product.subtitle || "",
        handle: product.handle || "",
        thumbnail: product.thumbnail || "",
        status: toBoolean(metadata.is_out_of_stock)
          ? "out_of_stock"
          : (product.status || ""),
        best_seller: toBoolean(metadata.best_seller),
        is_out_of_stock: toBoolean(metadata.is_out_of_stock),
        seo: {
          meta_title: seoMetaTitle,
          meta_description: seoMetaDescription,
        },
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
        region_id: defaultRegion?.id || "",
        sales_channel_id: toText(product.sales_channels?.[0]?.id),
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
          prices: (variant.prices || []).map((price) => ({
            amount: formatPrice(typeof price?.amount === "number" ? price.amount : null),
            currency_code: toText(price?.currency_code),
            min_quantity:
              typeof price?.min_quantity === "number" ? price.min_quantity : null,
            max_quantity:
              typeof price?.max_quantity === "number" ? price.max_quantity : null,
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
        category: enrichedParents
          .map((category) => ({
            ...category,
            children_categories: childrenByParentId[category.id] || [],
          }))
          .map(cleanCategoryResponse),
        metadata: omitKeys(
          {
            ...metadata,
            validity_description: validityDescription,
            delivery_description: deliveryDescription,
            additional_description: additionalDescription,
            seo_meta_title: seoMetaTitle,
            seo_meta_description: seoMetaDescription,
          },
          PRODUCT_METADATA_DUPLICATE_KEYS
        ),
      }
    })(),
  })
}
