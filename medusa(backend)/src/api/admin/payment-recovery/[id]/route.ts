import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

type PaymentRecoveryRow = {
  id: string
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

export async function GET(
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

  res.status(200).json({
    payment_recovery_entry: recovery,
  })
}

