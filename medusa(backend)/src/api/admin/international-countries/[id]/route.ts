import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { COUNTRIES_MODULE } from "../../../../modules/countries"
import type CountriesService from "../../../../modules/countries/service"

const ISO_4217_CODE_REGEX = /^[A-Z]{3}$/

export const UpdateCountrySchema = z.object({
  country_name: z.string().min(1),
  currency_name: z
    .string()
    .trim()
    .toUpperCase()
    .regex(ISO_4217_CODE_REGEX, "Currency code must be a 3-letter ISO 4217 code"),
})

type UpdateCountryInput = z.infer<typeof UpdateCountrySchema>

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const countriesService: CountriesService = req.scope.resolve(COUNTRIES_MODULE)
  const countries = await countriesService.listCountries({ id })
  const country = countries?.[0]
  if (!country) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Country not found")
  }

  res.status(200).json({ country })
}

async function handleUpdate(
  req: MedusaRequest<UpdateCountryInput>,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const { country_name, currency_name } = req.validatedBody

  const countriesService: CountriesService = req.scope.resolve(COUNTRIES_MODULE)

  const country = await countriesService.updateCountries({
    id,
    country_name,
    currency_name,
  })

  res.status(200).json({ country })
}

export async function PATCH(
  req: MedusaRequest<UpdateCountryInput>,
  res: MedusaResponse
): Promise<void> {
  return handleUpdate(req, res)
}

export async function POST(
  req: MedusaRequest<UpdateCountryInput>,
  res: MedusaResponse
): Promise<void> {
  return handleUpdate(req, res)
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const countriesService: CountriesService = req.scope.resolve(COUNTRIES_MODULE)

  await countriesService.deleteCountries(id)

  res.status(200).json({ id, deleted: true })
}
