import { NextResponse } from "next/server"

const BASE_URL = process.env.MEDUSA_API_BASE_URL!
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY!

export async function POST(req: Request) {
    try {
        const {
            payment_collection_id,
            payment_session_id,
            provider_id,
            data,
        } = await req.json()

        if (!payment_collection_id || !payment_session_id) {
            return NextResponse.json(
                {
                    error: "payment_collection_id and payment_session_id are required",
                },
                { status: 400 }
            )
        }

        const url = `${BASE_URL}/store/payment-collections/${payment_collection_id}/payment-sessions/${payment_session_id}`
        const payload = {
            ...(provider_id ? { provider_id } : {}),
            ...(data && typeof data === "object" ? { data } : {}),
        }

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-publishable-api-key": PUBLISHABLE_KEY,
            },
            body: JSON.stringify(payload),
        })

        const responseData = await res.json().catch(() => null)

        if (!res.ok) {
            return NextResponse.json(
                {
                    error:
                        responseData?.message ||
                        responseData?.error?.message ||
                        responseData?.error ||
                        "Failed to update payment session",
                    details: responseData,
                },
                { status: res.status }
            )
        }

        return NextResponse.json(responseData)
    } catch (error) {
        console.error("Update payment session error:", error)
        return NextResponse.json(
            { error: "Failed to update payment session" },
            { status: 500 }
        )
    }
}
