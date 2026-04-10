import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

type CategoryRecord = {
  id: string
  name?: string | null
  handle?: string | null
  metadata?: Record<string, unknown> | null
}

type FaqItem = {
  question: string
  answer: string
}

type FaqSection = {
  title: string
  description: string
}

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

const stripHtml = (value: string): string => {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

const parseCategoryFaqs = (
  metadata: Record<string, unknown> | null | undefined
): FaqItem[] => {
  if (!metadata || typeof metadata !== "object") {
    return []
  }

  const rawFaqs = metadata.category_faqs
  if (!Array.isArray(rawFaqs)) {
    return []
  }

  return rawFaqs
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const candidate = item as Record<string, unknown>
      const question = toText(candidate.question).trim()
      const answer = toText(candidate.answer).trim()

      if (!question && !answer) {
        return null
      }

      return { question, answer }
    })
    .filter((item): item is FaqItem => Boolean(item))
}

const matchesAllTerms = (faq: FaqItem, terms: string[]): boolean => {
  const searchable = `${stripHtml(faq.question)} ${stripHtml(faq.answer)}`.toLowerCase()
  return terms.every((term) => searchable.includes(term))
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const searchRaw =
    getSingleQueryValue(req.query, "q") ||
    getSingleQueryValue(req.query, "query") ||
    getSingleQueryValue(req.query, "search")

  const normalizedQuery = searchRaw.trim().toLowerCase()
  if (!normalizedQuery) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Query parameter `q` is required"
    )
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean)
  if (!terms.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Query parameter `q` is required"
    )
  }

  const query = req.scope.resolve("query")
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "is_active", "is_internal", "metadata"],
    filters: {
      is_active: true,
      is_internal: false,
    },
  })

  const matchedCategories = (categories as CategoryRecord[])
    .map((category) => {
      const faqs = parseCategoryFaqs(category.metadata)
      const matchedFaqs = faqs.filter((faq) => matchesAllTerms(faq, terms))

      if (!matchedFaqs.length) {
        return null
      }

      return {
        id: category.id,
        name: toText(category.name),
        handle: toText(category.handle),
        faq_section: {
          title: toText(category.metadata?.category_faq_section_title),
          description: toText(category.metadata?.category_faq_section_description),
        } as FaqSection,
        faqs: matchedFaqs,
      }
    })
    .filter((category): category is {
      id: string
      name: string
      handle: string
      faq_section: FaqSection
      faqs: FaqItem[]
    } => Boolean(category))

  const faqCount = matchedCategories.reduce((sum, category) => sum + category.faqs.length, 0)

  res.status(200).json({
    query: searchRaw.trim(),
    counts: {
      categories: matchedCategories.length,
      faqs: faqCount,
    },
    product_categories: matchedCategories,
  })
}
