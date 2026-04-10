import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { CONTACT_REQUEST_MODULE } from "../../../modules/contact-requests"
import { sendContactRequestEmails } from "../../../lib/contact-request-email"
import type ContactRequestService from "../../../modules/contact-requests/service"

export const CreateContactRequestSchema = z.object({
  fullName: z.string().min(1),
  emailID: z.string().email(),
  mobileNumber: z.string().min(3),
  country: z.string().min(1),
  vendor: z.string().min(1),
  course: z.string().min(1),
  message: z.string().optional(),
  pageUrl: z.string().trim().optional().default(""),
  page_url: z.string().trim().optional(),
})

type CreateContactRequestInput = z.infer<typeof CreateContactRequestSchema>

export async function POST(
  req: MedusaRequest<CreateContactRequestInput>,
  res: MedusaResponse
): Promise<void> {
  const {
    fullName,
    emailID,
    mobileNumber,
    country,
    vendor,
    course,
    message,
    pageUrl,
    page_url,
  } = req.validatedBody

  const contactRequestService: ContactRequestService =
    req.scope.resolve(CONTACT_REQUEST_MODULE)

  const headerReferer =
    typeof req.headers?.referer === "string" ? req.headers.referer : ""
  const resolvedPageUrl = pageUrl || page_url || headerReferer || ""

  const createPayload = {
    full_name: fullName,
    email: emailID,
    phone: mobileNumber,
    country,
    vendor,
    course,
    message: message || "",
    page_url: resolvedPageUrl,
  }

  const serviceAny = contactRequestService as unknown as {
    createContactRequests?: (payload: typeof createPayload) => Promise<unknown>
    createContactRequest?: (payload: typeof createPayload) => Promise<unknown>
    create?: (payload: typeof createPayload) => Promise<unknown>
  }

  let record: unknown
  if (typeof serviceAny.createContactRequests === "function") {
    record = await serviceAny.createContactRequests(createPayload)
  } else if (typeof serviceAny.createContactRequest === "function") {
    record = await serviceAny.createContactRequest(createPayload)
  } else if (typeof serviceAny.create === "function") {
    record = await serviceAny.create(createPayload)
  } else {
    throw new Error("Contact request service is missing a create method")
  }

  try {
    await sendContactRequestEmails(
      {
        fullName,
        email: emailID,
        phone: mobileNumber,
        country,
        vendor,
        course,
        message: message || "",
        pageUrl: resolvedPageUrl,
      },
      { scope: req.scope }
    )
  } catch (error) {
    console.error("Failed to send contact request emails", error)
  }

  res.status(200).json({ contact_request: record })
}
