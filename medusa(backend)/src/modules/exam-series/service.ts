import { MedusaService } from "@medusajs/framework/utils"
import { ExamSeries } from "./models/exam-series"

class ExamSeriesService extends MedusaService({
  ExamSeries,
}) {}

export default ExamSeriesService
