import { model } from "@medusajs/framework/utils"

export const CheckoutOtp = model.define("checkout_otp", {
  id: model.id().primaryKey(),
  cart_id: model.text(),
  email: model.text(),
  otp_hash: model.text(),
  expires_at: model.dateTime(),
  last_sent_at: model.dateTime(),
  attempt_count: model.number().default(0),
  resend_count: model.number().default(0),
  verified: model.boolean().default(false),
})
