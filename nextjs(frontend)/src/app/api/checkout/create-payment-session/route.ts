import { NextResponse } from "next/server"

const BASE_URL = process.env.MEDUSA_API_BASE_URL!
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY!
const PAYMENT_PROVIDER_ID = "pp_easebuzz_default"

function toStringRecord(value: unknown): Record<string, string> {
    if (!value || typeof value !== "object") return {}
    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [
            k,
            typeof v === "string" ? v : String(v ?? ""),
        ])
    )
}

function pickSession(data: any, selectedProviderId: string) {
    const sessions = data?.payment_collection?.payment_sessions
    if (!Array.isArray(sessions)) return null

    const byProvider = sessions.find((s: any) => s?.provider_id === selectedProviderId)
    if (byProvider) return byProvider

    const withUrl = sessions.find(
        (s: any) => typeof s?.data?.payment_url === "string" || typeof s?.payment_url === "string"
    )
    return withUrl || sessions[0] || null
}

function normalizeEasebuzzPayload(data: any, selectedProviderId: string) {
    const session = data?.payment_session || pickSession(data, selectedProviderId)
    if (!session) return null

    const paymentUrl = session?.payment_url || session?.data?.payment_url || session?.data?.url
    const paymentMethodRaw =
        session?.payment_method || session?.data?.payment_method || "POST"
    const paymentMethod =
        typeof paymentMethodRaw === "string" && paymentMethodRaw.trim()
            ? paymentMethodRaw.trim().toUpperCase()
            : "POST"
    const primaryFields = toStringRecord(session?.payment_fields || session?.data?.payment_fields)
    const fallbackFields = toStringRecord(session?.fields || session?.data?.fields)
    const paymentFields = Object.keys(primaryFields).length > 0 ? primaryFields : fallbackFields

    if (typeof paymentUrl !== "string" || !paymentUrl.trim()) {
        return null
    }

    if (paymentMethod === "POST" && Object.keys(paymentFields).length === 0) {
        return null
    }

    return {
        payment_session_id: session?.id || null,
        payment_url: paymentUrl,
        payment_method: paymentMethod,
        payment_fields: paymentFields,
    }
}

export async function POST(req: Request) {
    try {
        const {
            payment_collection_id,
            cart_id,
            callback_url,
            email,
            phone,
            first_name,
        } = await req.json()

        if (!payment_collection_id) {
            return NextResponse.json(
                { error: "payment_collection_id is required" },
                { status: 400 }
            )
        }

        const selectedProviderId = PAYMENT_PROVIDER_ID

        const requestUrl = new URL(req.url)
        const inferredBaseUrl =
            process.env.NEXT_PUBLIC_BASE_URL ??
            `${requestUrl.protocol}//${requestUrl.host}`
        const defaultCallbackUrl = cart_id
            ? `${inferredBaseUrl}/easebuzz/callback?cart_id=${encodeURIComponent(cart_id)}`
            : `${inferredBaseUrl}/easebuzz/callback`
        const safeCallbackUrl =
            typeof callback_url === "string" && callback_url.trim()
                ? callback_url.trim()
                : defaultCallbackUrl

        const res = await fetch(
            `${BASE_URL}/store/payment-collections/${payment_collection_id}/payment-sessions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-publishable-api-key": PUBLISHABLE_KEY,
                },
                body: JSON.stringify({
                    provider_id: selectedProviderId,
                    data: {
                        surl: safeCallbackUrl,
                        furl: safeCallbackUrl,
                        ...(cart_id ? { udf5: cart_id } : {}),
                        ...(payment_collection_id ? { udf6: payment_collection_id } : {}),
                        ...(typeof first_name === "string" && first_name.trim()
                            ? { udf7: first_name.trim() }
                            : {}),
                        ...(typeof email === "string" && email.trim()
                            ? { email: email.trim() }
                            : {}),
                        ...(typeof phone === "string" && phone.trim()
                            ? { phone: phone.trim() }
                            : {}),
                        ...(typeof first_name === "string" && first_name.trim()
                            ? { firstname: first_name.trim() }
                            : {}),
                    },
                }),
            }
        )

        const data = await res.json().catch(() => null)
        console.log("MEDUSA PAYMENT SESSION RESPONSE:", {
            payment_collection_id,
            providerId: selectedProviderId,
            status: res.status,
            data,
        })

        if (res.ok) {
            const normalized = normalizeEasebuzzPayload(data, selectedProviderId)
            return NextResponse.json({
                ...data,
                ...(normalized || {}),
            })
        }

        return NextResponse.json(
            {
                error:
                    data?.message ||
                    data?.error?.message ||
                    data?.error ||
                    `Failed to create payment session for provider ${selectedProviderId}`,
                details: data,
            },
            { status: res.status }
        )
    } catch (error) {
        console.error("SESSION ERROR:", error)
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create payment session",
            },
            { status: 500 }
        )
    }
}
