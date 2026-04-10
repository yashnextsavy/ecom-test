import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { createHmac, randomInt } from "crypto"
import { sendCheckoutOtpEmail } from "../../../../lib/checkout-otp-email"
import { CHECKOUT_OTP_MODULE } from "../../../../modules/checkout-otp"

const OTP_TTL_MINUTES = Number(process.env.CHECKOUT_OTP_TTL_MINUTES || 10)
const RESEND_COOLDOWN_SECONDS = Number(
  process.env.CHECKOUT_OTP_RESEND_COOLDOWN_SECONDS || 30
)
const MAX_RESENDS_PER_WINDOW = Number(process.env.CHECKOUT_OTP_MAX_RESENDS || 5)
const MAX_REQUESTS_PER_HOUR = Number(
  process.env.CHECKOUT_OTP_MAX_REQUESTS_PER_HOUR || 10
)
const OTP_HASH_SECRET =
  process.env.CHECKOUT_OTP_HASH_SECRET ||
  process.env.JWT_SECRET ||
  "checkout-otp-secret"

export const CreateCheckoutOtpRequestSchema = z.object({
  cartId: z.string().min(1),
  email: z.string().email(),
})

type CreateCheckoutOtpRequestInput = z.infer<
  typeof CreateCheckoutOtpRequestSchema
>

type CheckoutOtpRecord = {
  id: string
  cart_id: string
  email: string
  otp_hash: string
  expires_at: string | Date
  last_sent_at: string | Date
  attempt_count: number
  resend_count: number
  verified: boolean
  created_at?: string | Date
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const hashOtp = (cartId: string, email: string, otp: string): string => {
  return createHmac("sha256", OTP_HASH_SECRET)
    .update(`${cartId}:${email}:${otp}`)
    .digest("hex")
}

const createOtp = (): string => {
  return randomInt(0, 1_000_000).toString().padStart(6, "0")
}

const toDate = (value: string | Date): Date => {
  return value instanceof Date ? value : new Date(value)
}

const sortByCreatedDesc = (rows: CheckoutOtpRecord[]): CheckoutOtpRecord[] => {
  return [...rows].sort((a, b) => {
    const at = a.created_at ? toDate(a.created_at).getTime() : 0
    const bt = b.created_at ? toDate(b.created_at).getTime() : 0
    return bt - at
  })
}

const resolveCreateMethod = (service: any) => {
  if (typeof service.createCheckoutOtps === "function") {
    return service.createCheckoutOtps.bind(service)
  }
  if (typeof service.createCheckoutOtp === "function") {
    return service.createCheckoutOtp.bind(service)
  }
  if (typeof service.create === "function") {
    return service.create.bind(service)
  }
  return null
}

const resolveUpdateMethod = (service: any) => {
  if (typeof service.updateCheckoutOtps === "function") {
    return service.updateCheckoutOtps.bind(service)
  }
  if (typeof service.updateCheckoutOtp === "function") {
    return service.updateCheckoutOtp.bind(service)
  }
  if (typeof service.update === "function") {
    return service.update.bind(service)
  }
  return null
}

export async function POST(
  req: MedusaRequest<CreateCheckoutOtpRequestInput>,
  res: MedusaResponse
): Promise<void> {
  const { cartId, email } = req.validatedBody
  const normalizedEmail = normalizeEmail(email)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const query = req.scope.resolve("query")

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "email"],
    filters: {
      id: cartId,
    },
  })

  const cart = (carts as Array<{ id: string; email?: string | null }>)?.[0]
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
  }

  const { data: otpRows } = await query.graph({
    entity: "checkout_otp",
    fields: ["*"],
    filters: {
      cart_id: cartId,
      email: normalizedEmail,
    },
  })

  const rows = sortByCreatedDesc((otpRows || []) as CheckoutOtpRecord[])
  const latest = rows[0]

  const recentRequestsInHour = rows.filter((row) => {
    return toDate(row.last_sent_at).getTime() >= oneHourAgo.getTime()
  }).length

  if (recentRequestsInHour >= MAX_REQUESTS_PER_HOUR) {
    res.status(429).json({
      type: "too_many_requests",
      message: "Too many OTP requests. Please try again later.",
    })
    return
  }

  if (latest) {
    const secondsSinceLastSent = Math.floor(
      (now.getTime() - toDate(latest.last_sent_at).getTime()) / 1000
    )
    if (secondsSinceLastSent < RESEND_COOLDOWN_SECONDS) {
      res.status(429).json({
        type: "cooldown",
        message: "Please wait before requesting another OTP.",
        retry_after_seconds: RESEND_COOLDOWN_SECONDS - secondsSinceLastSent,
      })
      return
    }
  }

  const isActiveUnverified = Boolean(
    latest && !latest.verified && toDate(latest.expires_at).getTime() > now.getTime()
  )

  const nextResendCount = isActiveUnverified ? (latest.resend_count || 0) + 1 : 0

  if (nextResendCount > MAX_RESENDS_PER_WINDOW) {
    res.status(429).json({
      type: "resend_limit",
      message: "Maximum OTP resend attempts reached. Please try again later.",
    })
    return
  }

  const otp = createOtp()
  const otpHash = hashOtp(cartId, normalizedEmail, otp)

  const checkoutOtpService = req.scope.resolve(CHECKOUT_OTP_MODULE)
  const createMethod = resolveCreateMethod(checkoutOtpService)
  const updateMethod = resolveUpdateMethod(checkoutOtpService)

  if (!createMethod || !updateMethod) {
    throw new Error("Checkout OTP service is missing create/update methods")
  }

  if (isActiveUnverified && latest) {
    await updateMethod({
      id: latest.id,
      otp_hash: otpHash,
      expires_at: expiresAt,
      last_sent_at: now,
      attempt_count: 0,
      resend_count: nextResendCount,
      verified: false,
    })
  } else {
    await createMethod({
      cart_id: cartId,
      email: normalizedEmail,
      otp_hash: otpHash,
      expires_at: expiresAt,
      last_sent_at: now,
      attempt_count: 0,
      resend_count: 0,
      verified: false,
    })
  }

  try {
    await sendCheckoutOtpEmail(
      {
        email: normalizedEmail,
        otp,
        expiresInMinutes: OTP_TTL_MINUTES,
      },
      { scope: req.scope }
    )
  } catch (error) {
    console.error("Failed to send checkout OTP email", error)
    res.status(500).json({
      message: "Failed to send OTP email. Please try again.",
    })
    return
  }

  res.status(200).json({
    success: true,
    message: "OTP sent successfully.",
    expires_at: expiresAt.toISOString(),
    retry_after_seconds: RESEND_COOLDOWN_SECONDS,
  })
}
