import { Module } from "@medusajs/framework/utils"
import CheckoutOtpService from "./service"

export const CHECKOUT_OTP_MODULE = "checkoutOtp"

export default Module(CHECKOUT_OTP_MODULE, {
  service: CheckoutOtpService,
})
