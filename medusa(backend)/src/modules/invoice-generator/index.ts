import { Module } from "@medusajs/framework/utils"
import InvoiceGeneratorService from "./service"

export const INVOICE_GENERATOR_MODULE = "invoiceGenerator"

export default Module(INVOICE_GENERATOR_MODULE, {
  service: InvoiceGeneratorService,
})
