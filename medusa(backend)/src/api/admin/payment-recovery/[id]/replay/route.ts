import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PAYMENT_RECOVERY_MODULE } from "../../../../../modules/payment-recovery"

type PaymentRecoveryRow = {
  id: string
  status?: string
  attempt_count?: number
  max_attempts?: number
  cart_id?: string
  payment_session_id?: string
  txnid?: string
}

const resolveUpdateMethod = (service: any) => {
  if (typeof service.updatePaymentRecoveryEntries === "function") {
    return service.updatePaymentRecoveryEntries.bind(service)
  }
  if (typeof service.updatePaymentRecoveryEntry === "function") {
    return service.updatePaymentRecoveryEntry.bind(service)
  }
  if (typeof service.update === "function") {
    return service.update.bind(service)
  }
  return null
}

const findRecoveryEntry = async (
  query: any,
  idOrKey: string
): Promise<PaymentRecoveryRow | null> => {
  const findBy = async (field: "id" | "txnid" | "payment_session_id") => {
    const { data } = await query.graph({
      entity: "payment_recovery_entry",
      fields: ["*"],
      filters: {
        [field]: idOrKey,
      },
    })
    return (data as PaymentRecoveryRow[] | undefined)?.[0] || null
  }

  const byId = await findBy("id")
  if (byId) return byId

  const byTxnid = await findBy("txnid")
  if (byTxnid) return byTxnid

  const byPaymentSession = await findBy("payment_session_id")
  if (byPaymentSession) return byPaymentSession

  return null
}

export async function POST(
  req: MedusaRequest<{ id: string }>,
  res: MedusaResponse
): Promise<void> {
  const idOrKey = (req.params?.id || "").trim()
  if (!idOrKey) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "id is required")
  }

  const query = req.scope.resolve("query")
  const recovery = await findRecoveryEntry(query, idOrKey)
  if (!recovery) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Payment recovery entry not found"
    )
  }

  const recoveryService = req.scope.resolve(PAYMENT_RECOVERY_MODULE)
  const updateMethod = resolveUpdateMethod(recoveryService)
  if (!updateMethod) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Payment recovery service update method is not available"
    )
  }

  const updated = await updateMethod({
    id: recovery.id,
    status: "pending",
    next_retry_at: new Date(),
    last_error: null,
    max_attempts:
      typeof recovery.max_attempts === "number" && recovery.max_attempts > 0
        ? recovery.max_attempts
        : 120,
  })

  res.status(200).json({
    success: true,
    message: "Recovery replay queued",
    payment_recovery_entry: updated,
  })
}

