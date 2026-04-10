import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type CategoryRecord = {
  id: string
  name: string
  handle: string
  is_active?: boolean
  is_internal?: boolean
  parent_category_id?: string | null
  metadata?: Record<string, unknown> | null
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
  })

  const internationalCategories = (categories as CategoryRecord[]).filter((category) =>
    toBoolean(category.metadata?.show_in_international_products)
  )

  res.status(200).json({
    product_categories: internationalCategories,
    count: internationalCategories.length,
  })
}
