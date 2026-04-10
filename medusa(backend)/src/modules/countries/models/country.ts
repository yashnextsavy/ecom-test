import { model } from "@medusajs/framework/utils"

export const Country = model.define("international_country", {
  id: model.id().primaryKey(),
  country_name: model.text(),
  currency_name: model.text(),
})
