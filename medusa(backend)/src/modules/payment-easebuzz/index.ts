import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import EasebuzzPaymentProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [EasebuzzPaymentProviderService],
})

