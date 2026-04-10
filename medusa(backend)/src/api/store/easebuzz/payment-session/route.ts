import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { Modules } from "@medusajs/framework/utils"
import { PAYMENT_RECOVERY_MODULE } from "../../../../modules/payment-recovery"

type PaymentSessionRecord = {
  id: string
  amount: number
  currency_code: string
  data?: Record<string, unknown> | null
}

export const UpdateEasebuzzPaymentSessionSchema = z
  .object({
    payment_session_id: z.string().trim().optional(),
    session_id: z.string().trim().optional(),
    provider_id: z.string().trim().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()

type UpdateEasebuzzPaymentSessionInput = z.infer<
  typeof UpdateEasebuzzPaymentSessionSchema
>

type PaymentRecoveryRow = {
  id: string
  status?: string
}

type RecoveryState =
  | "pending"
  | "awaiting_gateway"
  | "gateway_failed"
  | "refunded"
  | "pending_review"

const SUCCESSFUL_CALLBACK_STATUSES = new Set([
  "success",
  "successful",
  "captured",
  "authorized",
])

const FAILURE_CALLBACK_STATUSES = new Set([
  "failed",
  "failure",
  "dropped",
  "cancelled",
  "canceled",
  "aborted",
  "declined",
  "rejected",
  "timeout",
  "timed_out",
  "user_cancelled",
  "user_canceled",
])

const PENDING_CALLBACK_STATUSES = new Set([
  "pending",
  "processing",
  "in_progress",
  "created",
  "initiated",
  "submitted",
])

const REFUND_CALLBACK_STATUSES = new Set([
  "refund",
  "refunded",
  "refund_initiated",
  "partial_refund",
  "partially_refunded",
])

const firstNonEmptyString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

const resolveCreateMethod = (service: any) => {
  if (typeof service.createPaymentRecoveryEntries === "function") {
    return service.createPaymentRecoveryEntries.bind(service)
  }
  if (typeof service.createPaymentRecoveryEntry === "function") {
    return service.createPaymentRecoveryEntry.bind(service)
  }
  if (typeof service.create === "function") {
    return service.create.bind(service)
  }
  return null
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

const normalizeGatewayStatus = (value: unknown): string => {
  if (typeof value !== "string") {
    return ""
  }
  return value.trim().toLowerCase()
}

const deriveRecoveryState = (gatewayStatus: string): RecoveryState => {
  if (SUCCESSFUL_CALLBACK_STATUSES.has(gatewayStatus)) {
    return "pending"
  }

  if (FAILURE_CALLBACK_STATUSES.has(gatewayStatus)) {
    return "gateway_failed"
  }

  if (REFUND_CALLBACK_STATUSES.has(gatewayStatus)) {
    return "refunded"
  }

  if (PENDING_CALLBACK_STATUSES.has(gatewayStatus) || gatewayStatus === "") {
    return "awaiting_gateway"
  }

  return "pending_review"
}

export async function POST(
  req: MedusaRequest<UpdateEasebuzzPaymentSessionInput>,
  res: MedusaResponse
): Promise<void> {
  const body = req.validatedBody
  const sessionId = firstNonEmptyString(
    body.payment_session_id,
    body.session_id,
    body.data?.udf1
  )

  if (!sessionId) {
    res.status(400).json({
      message:
        "payment_session_id is required (or session_id / data.udf1 for callback payloads).",
    })
    return
  }

  const callbackData =
    body.data && typeof body.data === "object" ? { ...body.data } : {}
  const topLevelData = { ...body }
  delete topLevelData.data
  delete topLevelData.provider_id

  const query = req.scope.resolve("query")
  const { data: sessionRows } = await query.graph({
    entity: "payment_session",
    fields: ["id", "amount", "currency_code", "data"],
    filters: { id: sessionId },
  })

  const paymentSession = (sessionRows as PaymentSessionRecord[] | undefined)?.[0]

  if (!paymentSession) {
    res.status(404).json({
      message: `Payment session ${sessionId} not found.`,
    })
    return
  }

  const paymentModuleService = req.scope.resolve(Modules.PAYMENT) as {
    updatePaymentSession: (input: {
      id: string
      amount: number
      currency_code: string
      data: Record<string, unknown>
    }) => Promise<unknown>
  }

  const updatedPaymentSession = await paymentModuleService.updatePaymentSession({
    id: paymentSession.id,
    amount: paymentSession.amount,
    currency_code: paymentSession.currency_code,
    data: {
      ...(paymentSession.data ?? {}),
      ...callbackData,
      ...topLevelData,
    },
  })

  const rawStatus = firstNonEmptyString(
    callbackData.status,
    callbackData.tx_status,
    callbackData.payment_status,
    callbackData.result,
    callbackData.easebuzz_status,
    topLevelData.status,
    topLevelData.tx_status,
    topLevelData.payment_status
  )

  const normalizedStatus = normalizeGatewayStatus(rawStatus)
  const cartId = firstNonEmptyString(
    callbackData.udf5,
    callbackData.cart_id,
    callbackData.cartId,
    topLevelData.udf5,
    topLevelData.cart_id,
    topLevelData.cartId
  )
  const txnid = firstNonEmptyString(
    callbackData.txnid,
    callbackData.easebuzz_txnid,
    callbackData.easepayid,
    topLevelData.txnid
  )

  if (cartId) {
    try {
      const recoveryService = req.scope.resolve(PAYMENT_RECOVERY_MODULE)
      const createMethod = resolveCreateMethod(recoveryService)
      const updateMethod = resolveUpdateMethod(recoveryService)

      if (createMethod && updateMethod) {
        const derivedState = deriveRecoveryState(normalizedStatus)
        const shouldRetryComplete = SUCCESSFUL_CALLBACK_STATUSES.has(normalizedStatus)
        const lastError =
          shouldRetryComplete
            ? null
            : firstNonEmptyString(
                callbackData.error_Message,
                callbackData.error,
                topLevelData.error_Message,
                topLevelData.error
              ) || `Gateway status: ${normalizedStatus || "unknown"}`

        const { data: existingRows } = await query.graph({
          entity: "payment_recovery_entry",
          fields: ["id", "status"],
          filters: {
            payment_session_id: sessionId,
          },
        })

        const existing = (existingRows as PaymentRecoveryRow[] | undefined)?.[0]
        const payload = {
          provider_id: "pp_easebuzz_default",
          payment_session_id: sessionId,
          cart_id: cartId,
          txnid: txnid || null,
          status: derivedState,
          next_retry_at: new Date(),
          last_error: lastError,
          payload: {
            ...callbackData,
            ...topLevelData,
            payment_session_id: sessionId,
            cart_id: cartId,
            gateway_status: normalizedStatus || "unknown",
          },
        }

        if (existing?.id) {
          if (existing.status !== "completed") {
            await updateMethod({
              id: existing.id,
              ...payload,
            })
          }
        } else {
          await createMethod({
            ...payload,
            attempt_count: 0,
            max_attempts: shouldRetryComplete ? 120 : 0,
          })
        }
      }
    } catch (error) {
      console.error(
        "[Easebuzz payment-session] Failed to enqueue recovery task",
        error
      )
    }
  }

  res.status(200).json({
    payment_session: updatedPaymentSession,
  })
}
