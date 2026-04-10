import { model } from "@medusajs/framework/utils"

export const InvoiceConfig = model.define("invoice_config", {
  id: model.id().primaryKey(),
  company_name: model.text(),
  company_address: model.text(),
  company_phone: model.text().nullable(),
  company_email: model.text().nullable(),
  company_logo: model.text().nullable(),
  secondary_logo: model.text().nullable(),
  gstin: model.text().nullable(),
  state: model.text().nullable(),
  sac_code: model.text().nullable(),
  reverse_charge: model.text().nullable(),
  signature_name: model.text().nullable(),
  notes: model.text().nullable(),
  copyright_text: model.text().nullable(),
})
