import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { COUNTRIES_MODULE } from "../../../modules/countries"
import type CountriesService from "../../../modules/countries/service"

const ISO_4217_CODE_REGEX = /^[A-Z]{3}$/

export const CreateCountrySchema = z.object({
  country_name: z.string().min(1),
  currency_name: z
    .string()
    .trim()
    .toUpperCase()
    .regex(ISO_4217_CODE_REGEX, "Currency code must be a 3-letter ISO 4217 code"),
})

type CreateCountryInput = z.infer<typeof CreateCountrySchema>

export async function POST(
  req: MedusaRequest<CreateCountryInput>,
  res: MedusaResponse
): Promise<void> {
  const { country_name, currency_name } = req.validatedBody

  const countriesService: CountriesService = req.scope.resolve(COUNTRIES_MODULE)

  const country = await countriesService.createCountries({
    country_name,
    currency_name,
  })

  res.status(200).json({ country })
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const countriesService: CountriesService = req.scope.resolve(COUNTRIES_MODULE)
  const countries = await countriesService.listCountries({})

  res.status(200).json({ countries })
}
