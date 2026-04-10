// /api/cart/update-cashback/route.ts
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const { cart_id, cashback } = await req.json()

    const res = await fetch(
        `${process.env.MEDUSA_API_BASE_URL}/store/carts/${cart_id}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_API_KEY!,
            },
            body: JSON.stringify({
                metadata: {
                    cashback
                }
            })
        }
    )

    const data = await res.json()

    return NextResponse.json(data)
}