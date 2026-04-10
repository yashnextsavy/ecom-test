import { model } from "@medusajs/framework/utils"

export const ExamSeries = model.define("exam_series", {
  id: model.id().primaryKey(),

  title: model.text(),
  description: model.text(),
  category_id: model.text(),
  category_title: model.text(),
})
