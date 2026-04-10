import { NextResponse } from "next/server"

const MEDUSA_BASE_URL = process.env.MEDUSA_API_BASE_URL
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY

export async function POST(req: Request) {
  try {

    const body = await req.json()

    const { region_id, sales_channel_id, variant_id } = body

    console.log("Incoming Cart Request:", body)

    const res = await fetch(`${MEDUSA_BASE_URL}/store/carts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY || ""
      },
      body: JSON.stringify({
        region_id,
        sales_channel_id,
        items: [
          {
            variant_id,
            quantity: 1
          }
        ]
      })
    })

    const data = await res.json()

    console.log("Medusa Cart Response:", data)

    return NextResponse.json(data)

  } catch (error) {

    console.error("Cart Creation Error:", error)

    return NextResponse.json(
      { error: "Cart creation failed" },
      { status: 500 }
    )
  }
}