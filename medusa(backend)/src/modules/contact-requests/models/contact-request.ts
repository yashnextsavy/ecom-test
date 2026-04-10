import { model } from "@medusajs/framework/utils"

export const ContactRequest = model.define("contact_request", {
  id: model.id().primaryKey(),
  full_name: model.text(),
  email: model.text(),
  phone: model.text(),
  country: model.text(),
  vendor: model.text(),
  course: model.text(),
  message: model.text(),
  page_url: model.text().default(""),
})
