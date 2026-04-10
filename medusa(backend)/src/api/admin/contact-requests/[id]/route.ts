import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data: contactRequests } = await query.graph({
    entity: "contact_request",
    fields: [
      "id",
      "full_name",
      "email",
      "phone",
      "country",
      "vendor",
      "course",
      "message",
      "page_url",
      "created_at",
      "updated_at",
    ],
    filters: {
      id,
    },
  })

  const record = contactRequests?.[0]
  if (!record) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Contact request not found")
  }

  res.status(200).json({ contact_request: record })
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data: contactRequests } = await query.graph({
    entity: "contact_request",
    fields: ["id"],
    filters: {
      id,
    },
  })

  const record = contactRequests?.[0]
  if (!record) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Contact request not found")
  }

  const contactRequestService = req.scope.resolve("contactRequest")
  await contactRequestService.deleteContactRequests(id)

  res.status(200).json({ id, deleted: true })
}
