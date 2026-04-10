import { MedusaService } from "@medusajs/framework/utils"
import { CheckoutOtp } from "./models/checkout-otp"

class CheckoutOtpService extends MedusaService({
  CheckoutOtp,
}) {}

export default CheckoutOtpService
