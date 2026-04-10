// import { NextResponse } from "next/server"

// const BASE_URL = process.env.MEDUSA_API_BASE_URL!
// const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY!

// export async function POST(req: Request) {
//     try {
//         const { cartId, email } = await req.json()

//         const res = await fetch(`${BASE_URL}/store/checkout-otp/request`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "x-publishable-api-key": PUBLISHABLE_KEY
//             },
//             body: JSON.stringify({ cartId, email })
//         })

//         const data = await res.json()

//         if (res.ok) {
//             return NextResponse.json(data)
//         }

//         return NextResponse.json(
//             { error: data?.message || "Failed to send OTP" },
//             { status: res.status }
//         )
//     } catch (error) {
//         return NextResponse.json(
//             { error: "OTP request failed" },
//             { status: 500 }
//         )
//     }
// }
import { NextResponse } from "next/server"

const BASE_URL = process.env.MEDUSA_API_BASE_URL
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY

export async function POST(req: Request) {
    try {
        // ✅ Validate ENV first (VERY IMPORTANT)
        if (!BASE_URL || !PUBLISHABLE_KEY) {
            console.error("❌ Missing ENV:", {
                BASE_URL,
                PUBLISHABLE_KEY
            })

            return NextResponse.json(
                { error: "Server misconfiguration" },
                { status: 500 }
            )
        }

        const { cartId, email } = await req.json()

        if (!cartId || !email) {
            return NextResponse.json(
                { error: "cartId and email are required" },
                { status: 400 }
            )
        }

        console.log("📤 Sending OTP request:", { cartId, email })

        const res = await fetch(`${BASE_URL}/store/checkout-otp/request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-publishable-api-key": PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ cartId, email }),
        })

        const text = await res.text()

        console.log("📥 Medusa raw response:", {
            status: res.status,
            text
        })

        // ✅ Safe JSON parsing (same as contact API)
        let data
        try {
            data = text ? JSON.parse(text) : null
        } catch (err) {
            console.error("❌ Invalid JSON from Medusa:", text)

            return NextResponse.json(
                { error: "Invalid response from Medusa", raw: text },
                { status: 500 }
            )
        }

        // ✅ Handle non-OK responses properly
        if (!res.ok) {
            return NextResponse.json(
                {
                    error:
                        data?.message ||
                        data?.error ||
                        "Failed to send OTP",
                    details: data
                },
                { status: res.status }
            )
        }

        return NextResponse.json(data)

    } catch (error) {
        console.error("❌ OTP API Error:", error)

        return NextResponse.json(
            {
                error: "OTP request failed",
                details: String(error)
            },
            { status: 500 }
        )
    }
}