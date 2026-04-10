import { Module } from "@medusajs/framework/utils"
import PaymentRecoveryService from "./service"

export const PAYMENT_RECOVERY_MODULE = "paymentRecovery"

export default Module(PAYMENT_RECOVERY_MODULE, {
  service: PaymentRecoveryService,
})
