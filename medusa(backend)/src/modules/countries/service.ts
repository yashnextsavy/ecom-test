import { MedusaService } from "@medusajs/framework/utils"
import { Country } from "./models/country"

class CountriesService extends MedusaService({
  Country,
}) {}

export default CountriesService
