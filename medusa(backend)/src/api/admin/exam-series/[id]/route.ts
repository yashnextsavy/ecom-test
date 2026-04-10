import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { MedusaError } from "@medusajs/framework/utils"
import { EXAM_SERIES_MODULE } from "../../../../modules/exam-series"
import type ExamSeriesService from "../../../../modules/exam-series/service"

export const UpdateExamSeriesSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  category_id: z.string().min(1),
})

type UpdateExamSeriesInput = z.infer<typeof UpdateExamSeriesSchema>

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data: examSeries } = await query.graph({
    entity: "exam_series",
    fields: ["*"],
    filters: {
      id,
    },
  })

  const record = examSeries?.[0]
  if (!record) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Exam series not found"
    )
  }

  res.status(200).json({ exam_series: record })
}

async function handleUpdate(
  req: MedusaRequest<UpdateExamSeriesInput>,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
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

  const examSeries = await examSeriesService.updateExamSeries({
    id,
    title,
    description,
    category_id,
    category_title: category.name,
  })

  res.status(200).json({ exam_series: examSeries })
}

export async function PATCH(
  req: MedusaRequest<UpdateExamSeriesInput>,
  res: MedusaResponse
): Promise<void> {
  return handleUpdate(req, res)
}

export async function POST(
  req: MedusaRequest<UpdateExamSeriesInput>,
  res: MedusaResponse
): Promise<void> {
  return handleUpdate(req, res)
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params

  const examSeriesService: ExamSeriesService =
    req.scope.resolve(EXAM_SERIES_MODULE)

  await examSeriesService.deleteExamSeries(id)

  res.status(200).json({ id, deleted: true })
}
