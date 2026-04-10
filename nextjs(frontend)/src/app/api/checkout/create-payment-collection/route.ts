import { NextResponse } from "next/server"

const BASE_URL = process.env.MEDUSA_API_BASE_URL!
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY!

export async function POST(req: Request) {
    try {
        const { cart_id } = await req.json()

        const res = await fetch(`${BASE_URL}/store/payment-collections`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-publishable-api-key": PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ cart_id }),
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
            return NextResponse.json(
                {
                    error:
                        data?.message ||
                        data?.error?.message ||
                        data?.error ||
                        "Failed to create payment collection",
                    details: data,
                },
                { status: res.status }
            )
        }

        return NextResponse.json(data, { status: res.status })
    } catch (err) {
        console.error("Payment collection error:", err)
        return NextResponse.json(
            {
                error:
                    err instanceof Error
                        ? err.message
                        : "Failed to create payment collection",
            },
            { status: 500 }
        )
    }
}
