// import { NextResponse } from "next/server"

// const BASE_URL = process.env.MEDUSA_API_BASE_URL!
// const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY!

// export async function POST(req: Request) {
//     try {
//         const { cartId, email, otp } = await req.json()

//         const res = await fetch(`${BASE_URL}/store/checkout-otp/verify`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "x-publishable-api-key": PUBLISHABLE_KEY
//             },
//             body: JSON.stringify({ cartId, email, otp })
//         })

//         const data = await res.json()

//         if (res.ok) {
//             return NextResponse.json(data)
//         }

//         return NextResponse.json(
//             { error: data?.message || "OTP verification failed" },
//             { status: res.status }
//         )
//     } catch (error) {
//         return NextResponse.json(
//             { error: "OTP verification failed" },
//             { status: 500 }
//         )
//     }
// }



import { NextResponse } from "next/server"

const BASE_URL = process.env.MEDUSA_API_BASE_URL
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY

export async function POST(req: Request) {
    try {
        // ✅ ENV validation
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

        const { cartId, email, otp } = await req.json()

        // ✅ Input validation
        if (!cartId || !email || !otp) {
            return NextResponse.json(
                { error: "cartId, email and otp are required" },
                { status: 400 }
            )
        }

        console.log("📤 Verifying OTP:", { cartId, email })

        const res = await fetch(`${BASE_URL}/store/checkout-otp/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-publishable-api-key": PUBLISHABLE_KEY
            },
            body: JSON.stringify({ cartId, email, otp })
        })

        const text = await res.text()

        console.log("📥 Medusa verify response:", {
            status: res.status,
            text
        })

        // ✅ Safe JSON parsing
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

        // ✅ Handle failure properly
        if (!res.ok) {
            return NextResponse.json(
                {
                    error:
                        data?.message ||
                        data?.error ||
                        "OTP verification failed",
                    details: data
                },
                { status: res.status }
            )
        }

        return NextResponse.json(data)

    } catch (error) {
        console.error("❌ OTP VERIFY ERROR:", error)

        return NextResponse.json(
            {
                error: "OTP verification failed",
                details: String(error)
            },
            { status: 500 }
        )
    }
}