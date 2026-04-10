import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { MedusaError } from "@medusajs/framework/utils"
import { EXAM_SERIES_MODULE } from "../../../modules/exam-series"
import type ExamSeriesService from "../../../modules/exam-series/service"

export const CreateExamSeriesSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  category_id: z.string().min(1),
})

type CreateExamSeriesInput = z.infer<typeof CreateExamSeriesSchema>

export async function POST(
  req: MedusaRequest<CreateExamSeriesInput>,
  res: MedusaResponse
): Promise<void> {
  const { title, description, category_id } = req.validatedBody

  const examSeriesService: ExamSeriesService =
    req.scope.resolve(EXAM_SERIES_MODULE)

  const query = req.scope.resolve("query")
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
    filters: {
      id: category_id,
    },
  })

  const category = categories?.[0]
  if (!category) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Category not found"
    )
  }

  const examSeries = await examSeriesService.createExamSeries({
    title,
    description,
    category_id,
    category_title: category.name,
  })

  res.status(200).json({ exam_series: examSeries })
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve("query")

  const { data: examSeries } = await query.graph({
    entity: "exam_series",
    fields: ["*"],
  })

  const categoryIds = Array.from(
    new Set(examSeries.map((s) => s.category_id).filter(Boolean))
  )

  let categoriesById: Record<string, any> = {}
  if (categoryIds.length) {
    const { data: categories } = await query.graph({
      entity: "product_category",
      fields: ["*"],
      filters: {
        id: categoryIds,
      },
    })

    categoriesById = categories.reduce((acc, c) => {
      acc[c.id] = c
      return acc
    }, {} as Record<string, any>)
  }

  const enriched = examSeries.map((s) => ({
    ...s,
    category: s.category_id ? categoriesById[s.category_id] ?? null : null,
  }))

  res.status(200).json({ exam_series: enriched })
}
