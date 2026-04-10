import { model } from "@medusajs/framework/utils"

export const PaymentRecoveryEntry = model.define("payment_recovery_entry", {
  id: model.id().primaryKey(),
  provider_id: model.text().default("pp_easebuzz_default"),
  payment_session_id: model.text(),
  cart_id: model.text(),
  txnid: model.text().nullable(),
  status: model.text().default("pending"),
  attempt_count: model.number().default(0),
  max_attempts: model.number().default(60),
  next_retry_at: model.dateTime(),
  last_attempt_at: model.dateTime().nullable(),
  last_error: model.text().nullable(),
  order_id: model.text().nullable(),
  payload: model.json().nullable(),
})
