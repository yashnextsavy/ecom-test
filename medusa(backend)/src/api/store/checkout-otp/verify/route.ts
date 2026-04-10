import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { createHmac } from "crypto"
import { CHECKOUT_OTP_MODULE } from "../../../../modules/checkout-otp"

const MAX_VERIFY_ATTEMPTS = Number(process.env.CHECKOUT_OTP_MAX_VERIFY_ATTEMPTS || 5)
const VERIFIED_TTL_MINUTES = Number(process.env.CHECKOUT_OTP_VERIFIED_TTL_MINUTES || 30)
const OTP_HASH_SECRET =
  process.env.CHECKOUT_OTP_HASH_SECRET ||
  process.env.JWT_SECRET ||
  "checkout-otp-secret"

export const VerifyCheckoutOtpSchema = z.object({
  cartId: z.string().min(1),
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
})

type VerifyCheckoutOtpInput = z.infer<typeof VerifyCheckoutOtpSchema>

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
  req: MedusaRequest<VerifyCheckoutOtpInput>,
  res: MedusaResponse
): Promise<void> {
  const { cartId, email, otp } = req.validatedBody
  const normalizedEmail = normalizeEmail(email)
  const now = new Date()

  const query = req.scope.resolve("query")
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

  if (!latest) {
    res.status(400).json({
      success: false,
      message: "No OTP request found for this cart and email.",
    })
    return
  }

  const checkoutOtpService = req.scope.resolve(CHECKOUT_OTP_MODULE)
  const updateMethod = resolveUpdateMethod(checkoutOtpService)

  if (!updateMethod) {
    throw new Error("Checkout OTP service is missing update methods")
  }

  if (latest.verified && toDate(latest.expires_at).getTime() > now.getTime()) {
    res.status(200).json({
      success: true,
      message: "OTP already verified.",
      verified_until: toDate(latest.expires_at).toISOString(),
    })
    return
  }

  if (toDate(latest.expires_at).getTime() <= now.getTime()) {
    res.status(400).json({
      success: false,
      message: "OTP has expired. Please request a new code.",
    })
    return
  }

  if (latest.attempt_count >= MAX_VERIFY_ATTEMPTS) {
    res.status(429).json({
      success: false,
      message: "Maximum verification attempts reached. Please request a new OTP.",
    })
    return
  }

  const candidateHash = hashOtp(cartId, normalizedEmail, otp)

  if (candidateHash !== latest.otp_hash) {
    const nextAttemptCount = (latest.attempt_count || 0) + 1

    await updateMethod({
      id: latest.id,
      attempt_count: nextAttemptCount,
    })

    if (nextAttemptCount >= MAX_VERIFY_ATTEMPTS) {
      res.status(429).json({
        success: false,
        message: "Maximum verification attempts reached. Please request a new OTP.",
      })
      return
    }

    res.status(400).json({
      success: false,
      message: "Invalid OTP.",
      attempts_left: MAX_VERIFY_ATTEMPTS - nextAttemptCount,
    })
    return
  }

  const verifiedUntil = new Date(now.getTime() + VERIFIED_TTL_MINUTES * 60 * 1000)

  await updateMethod({
    id: latest.id,
    verified: true,
    otp_hash: "",
    attempt_count: 0,
    expires_at: verifiedUntil,
  })

  res.status(200).json({
    success: true,
    message: "OTP verified successfully.",
    verified_until: verifiedUntil.toISOString(),
  })
}
