import { Module } from "@medusajs/framework/utils"
import EmailTemplateConfigService from "./service"

export const EMAIL_TEMPLATE_CONFIG_MODULE = "emailTemplateConfig"

export default Module(EMAIL_TEMPLATE_CONFIG_MODULE, {
  service: EmailTemplateConfigService,
})
