import { MedusaService } from "@medusajs/framework/utils"
import { EmailTemplateConfig } from "./models/email-template-config"

class EmailTemplateConfigService extends MedusaService({
  EmailTemplateConfig,
}) {}

export default EmailTemplateConfigService
