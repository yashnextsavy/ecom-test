import { Module } from "@medusajs/framework/utils"
import ExamSeriesService from "./service"

export const EXAM_SERIES_MODULE = "examSeries"

export default Module(EXAM_SERIES_MODULE, {
  service: ExamSeriesService,
})
