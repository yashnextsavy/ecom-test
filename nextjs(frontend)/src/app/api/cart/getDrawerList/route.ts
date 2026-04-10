import { NextResponse } from "next/server"
import { getMedusaCart } from "@/lib/apis/medusa-api"

export async function POST(req: Request) {

    const { cart_id } = await req.json()

    if (!cart_id) {
        return NextResponse.json({ cart: null })
    }

    const data = await getMedusaCart(cart_id)

    return NextResponse.json(data)
}