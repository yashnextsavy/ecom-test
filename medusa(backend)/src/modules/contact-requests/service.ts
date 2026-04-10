import { MedusaService } from "@medusajs/framework/utils"
import { ContactRequest } from "./models/contact-request"

class ContactRequestService extends MedusaService({
  ContactRequest,
}) {}

export default ContactRequestService
