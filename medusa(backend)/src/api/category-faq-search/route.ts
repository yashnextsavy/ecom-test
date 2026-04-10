import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GET as storeCategoryFaqSearch } from "../store/category-faq-search/route"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  return storeCategoryFaqSearch(req, res)
}
