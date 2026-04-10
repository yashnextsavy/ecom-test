import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { sortProducts } from "../utils/product-sort"

type ProductRecord = {
  id: string
  title?: string | null
  subtitle?: string | null
  handle?: string | null
  thumbnail?: string | null
  status?: string | null
  metadata?: Record<string, unknown> | null
  categories?: Array<{
    id?: string | null
    name?: string | null
    handle?: string | null
  }> | null
}

type ExamSeriesRecord = {
  id: string
  title?: string | null
  description?: string | null
  category_id?: string | null
  category_title?: string | null
}

type CategoryRecord = {
  id: string
  name?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

type FaqSourceType = "product" | "category"

type FaqResult = {
  question: string
  answer: string
  source_type: FaqSourceType
  source_id: string
  source_title: string
}

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

const toText = (value: unknown): string => {
  return typeof value === "string" ? value : ""
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

const toSafeLimit = (value: string): number => {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT
  }

  return Math.min(parsed, MAX_LIMIT)
}

const includesTerm = (value: unknown, term: string): boolean => {
  return toText(value).toLowerCase().includes(term)
}

const normalizeForSearch = (value: unknown): string => {
  return toText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const v0 = new Array(b.length + 1).fill(0)
  const v1 = new Array(b.length + 1).fill(0)

  for (let i = 0; i <= b.length; i++) v0[i] = i

  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost)
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j]
  }

  return v1[b.length]
}

const fuzzyMatch = (value: unknown, term: string): boolean => {
  const normalizedValue = normalizeForSearch(value)
  const normalizedTerm = normalizeForSearch(term)
  if (!normalizedValue || !normalizedTerm) return false

  if (normalizedValue.includes(normalizedTerm)) return true

  const valueTokens = normalizedValue.split(/\s+/).filter(Boolean)
  const termTokens = normalizedTerm.split(/\s+/).filter(Boolean)

  if (!valueTokens.length || !termTokens.length) return false

  for (const termToken of termTokens) {
    let bestDistance = Infinity
    for (const valueToken of valueTokens) {
      const distance = levenshtein(termToken, valueToken)
      if (distance < bestDistance) bestDistance = distance
      if (bestDistance <= 1) break
    }

    const allowedDistance = termToken.length <= 4 ? 1 : 2
    if (bestDistance > allowedDistance) {
      return false
    }
  }

  return true
}

const matchesTerm = (value: unknown, term: string): boolean => {
  if (includesTerm(value, term)) return true
  return fuzzyMatch(value, term)
}

const toBoolean = (value: unknown): boolean => {
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
  }

  return false
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

const getFaqsFromMetadata = (metadata: Record<string, unknown> | null | undefined): Array<{ question: string; answer: string }> => {
  if (!metadata || typeof metadata !== "object") {
    return []
  }

  const faqKeys = ["faq", "faqs", "faq_items", "frequently_asked_questions", "questions"]
  const rows: Array<{ question: string; answer: string }> = []

  const parseFaqValue = (value: unknown) => {
    if (!Array.isArray(value)) {
      return
    }

    for (const entry of value) {
      if (!entry || typeof entry !== "object") {
        continue
      }

      const candidate = entry as Record<string, unknown>
      const question = toText(candidate.question || candidate.q || candidate.title).trim()
      const answer = toText(candidate.answer || candidate.a || candidate.description).trim()

      if (!question && !answer) {
        continue
      }

      rows.push({ question, answer })
    }
  }

  for (const key of faqKeys) {
    parseFaqValue(metadata[key])
  }

  return rows
}

const buildFaqResults = (
  term: string,
  products: ProductRecord[],
  categories: CategoryRecord[]
): FaqResult[] => {
  const results: FaqResult[] = []

  for (const product of products) {
    const faqs = getFaqsFromMetadata(product.metadata)
    for (const faq of faqs) {
      const sourceTitle = toText(product.title).trim()
      if (
        includesTerm(faq.question, term) ||
        includesTerm(faq.answer, term) ||
        includesTerm(sourceTitle, term)
      ) {
        results.push({
          question: faq.question,
          answer: faq.answer,
          source_type: "product",
          source_id: product.id,
          source_title: sourceTitle,
        })
      }
    }
  }

  for (const category of categories) {
    const faqs = getFaqsFromMetadata(category.metadata)
    for (const faq of faqs) {
      const sourceTitle = toText(category.name).trim()
      if (
        includesTerm(faq.question, term) ||
        includesTerm(faq.answer, term) ||
        includesTerm(sourceTitle, term)
      ) {
        results.push({
          question: faq.question,
          answer: faq.answer,
          source_type: "category",
          source_id: category.id,
          source_title: sourceTitle,
        })
      }
    }
  }

  const unique = new Map<string, FaqResult>()
  for (const item of results) {
    const key = [
      item.source_type,
      item.source_id,
      item.question.toLowerCase(),
      item.answer.toLowerCase(),
    ].join(":")

    if (!unique.has(key)) {
      unique.set(key, item)
    }
  }

  return Array.from(unique.values())
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const searchTermRaw =
    getSingleQueryValue(req.query, "q") ||
    getSingleQueryValue(req.query, "query") ||
    getSingleQueryValue(req.query, "search")

  const searchTerm = searchTermRaw.trim().toLowerCase()
  if (!searchTerm) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Query parameter `q` is required"
    )
  }

  const limit = toSafeLimit(getSingleQueryValue(req.query, "limit"))
  const query = req.scope.resolve("query")

  const [{ data: products }, { data: examSeries }, { data: categories }] = await Promise.all([
    query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "subtitle",
        "handle",
        "thumbnail",
        "status",
        "metadata",
        "categories.id",
        "categories.name",
        "categories.handle",
      ],
    }),
    query.graph({
      entity: "exam_series",
      fields: ["id", "title", "description", "category_id", "category_title"],
    }),
    query.graph({
      entity: "product_category",
      fields: ["id", "name", "handle", "metadata"],
      filters: {
        is_active: true,
        is_internal: false,
      },
    }),
  ])

  const matchedProducts = (products as ProductRecord[]).filter((product) => {
    return (
      matchesTerm(product.title, searchTerm) ||
      matchesTerm(product.subtitle, searchTerm) ||
      matchesTerm(product.handle, searchTerm)
    )
  })

  const matchedCategories = (categories as CategoryRecord[]).filter((category) => {
    return (
      matchesTerm(category.name, searchTerm) ||
      matchesTerm(category.handle, searchTerm)
    )
  })

  const matchedCategoryIds = new Set<string>()
  for (const category of matchedCategories) {
    if (typeof category.id === "string" && category.id.length > 0) {
      matchedCategoryIds.add(category.id)
    }
  }

  const matchedProductsByCategory = (products as ProductRecord[]).filter((product) => {
    if (!Array.isArray(product.categories)) {
      return false
    }

    return product.categories.some((category) => {
      const id = category?.id
      return typeof id === "string" && matchedCategoryIds.has(id)
    })
  })

  const uniqueProducts = new Map<string, ProductRecord>()
  for (const product of matchedProducts) {
    uniqueProducts.set(product.id, product)
  }
  for (const product of matchedProductsByCategory) {
    uniqueProducts.set(product.id, product)
  }

  const categoriesById = new Map<string, CategoryRecord>()
  for (const category of categories as CategoryRecord[]) {
    if (typeof category.id === "string" && category.id.length > 0) {
      categoriesById.set(category.id, category)
    }
  }

  for (const product of uniqueProducts.values()) {
    if (!Array.isArray(product.categories)) {
      continue
    }

    for (const category of product.categories) {
      const id = category?.id
      if (typeof id === "string" && id.length > 0) {
        matchedCategoryIds.add(id)
      }
    }
  }

  const matchedCategoriesWithProducts = Array.from(matchedCategoryIds)
    .map((id) => categoriesById.get(id))
    .filter((category): category is CategoryRecord => Boolean(category))

  const attachedExamSeriesIds = new Set<string>()
  for (const product of products as ProductRecord[]) {
    for (const id of getExamSeriesIdsFromMetadata(product.metadata)) {
      attachedExamSeriesIds.add(id)
    }
  }

  const matchedExamSeries = (examSeries as ExamSeriesRecord[]).filter((series) => {
    if (!series.id || !attachedExamSeriesIds.has(series.id)) {
      return false
    }

    return (
      matchesTerm(series.title, searchTerm) ||
      matchesTerm(series.description, searchTerm) ||
      matchesTerm(series.category_title, searchTerm)
    )
  })

  const matchedFaqs = buildFaqResults(
    searchTerm,
    products as ProductRecord[],
    categories as CategoryRecord[]
  )

  const sortedProducts = sortProducts(Array.from(uniqueProducts.values()))

  res.status(200).json({
    query: searchTermRaw.trim(),
    counts: {
      products: uniqueProducts.size,
      categories: matchedCategoriesWithProducts.length,
      exam_series: matchedExamSeries.length,
      faqs: matchedFaqs.length,
    },
    products: sortedProducts
      .slice(0, limit)
      .map((product) => ({
      id: product.id,
      title: toText(product.title),
      subtitle: toText(product.subtitle),
      handle: toText(product.handle),
      thumbnail: toText(product.thumbnail),
      status: toBoolean(product.metadata?.is_out_of_stock)
        ? "out_of_stock"
        : toText(product.status),
      best_seller: toBoolean(product.metadata?.best_seller),
      is_out_of_stock: toBoolean(product.metadata?.is_out_of_stock),
      categories: Array.isArray(product.categories)
        ? product.categories.map((category) => ({
            id: toText(category?.id),
            name: toText(category?.name),
            handle: toText(category?.handle),
          }))
        : [],
    })),
    categories: matchedCategoriesWithProducts.slice(0, limit).map((category) => ({
      id: toText(category.id),
      name: toText(category.name),
      handle: toText(category.handle),
    })),
    exam_series: matchedExamSeries.slice(0, limit).map((series) => ({
      id: series.id,
      title: toText(series.title),
      description: toText(series.description),
      category_id: toText(series.category_id),
      category_title: toText(series.category_title),
    })),
    faqs: matchedFaqs.slice(0, limit),
  })
}
