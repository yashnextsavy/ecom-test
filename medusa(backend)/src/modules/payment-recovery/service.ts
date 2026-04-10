import { MedusaService } from "@medusajs/framework/utils"
import { PaymentRecoveryEntry } from "./models/payment-recovery-entry"

class PaymentRecoveryService extends MedusaService({
  PaymentRecoveryEntry,
}) {}

export default PaymentRecoveryService
