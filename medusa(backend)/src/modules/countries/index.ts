import { Module } from "@medusajs/framework/utils"
import CountriesService from "./service"

export const COUNTRIES_MODULE = "countries"

export default Module(COUNTRIES_MODULE, {
  service: CountriesService,
})
