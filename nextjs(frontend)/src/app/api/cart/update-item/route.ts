import { NextResponse } from "next/server"

const BASE_URL = process.env.MEDUSA_API_BASE_URL
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY!

export async function POST(req: Request) {

    const { cart_id, item_id, quantity } = await req.json()

    const res = await fetch(
        `${BASE_URL}/store/carts/${cart_id}/line-items/${item_id}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-publishable-api-key": PUBLISHABLE_KEY
            },
            body: JSON.stringify({ quantity })
        }
    )

    const data = await res.json()

    return NextResponse.json(data)
}   