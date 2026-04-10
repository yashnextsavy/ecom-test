import { NextResponse } from "next/server"

const BASE_URL = process.env.MEDUSA_API_BASE_URL!
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY!

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const cart_id = searchParams.get("cart_id")
    const order_id = searchParams.get("order_id")
    const fields = searchParams.get("fields")

    if (!cart_id && !order_id) {
      return NextResponse.json({ error: "Missing cart_id or order_id" }, { status: 400 })
    }

    if (order_id) {
      const orderRes = await fetch(`${BASE_URL}/store/orders/${order_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
        cache: "no-store",
      })

      const orderData = await orderRes.json().catch(() => null)
      const order = orderData?.order || orderData?.data?.order || null

      if (!orderRes.ok || !order) {
        return NextResponse.json(
          {
            error:
              orderData?.message ||
              orderData?.error?.message ||
              orderData?.error ||
              "Failed to fetch order",
            details: orderData,
          },
          { status: orderRes.status || 500 }
        )
      }

      return NextResponse.json({ order })
    }

    const endpoint = new URL(`${BASE_URL}/store/carts/${cart_id}`)
    if (fields) {
      endpoint.searchParams.set("fields", fields)
    }

    const res = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
    })

    const data = await res.json()

    // return NextResponse.json(data)
    return NextResponse.json({ cart: data.cart })

  } catch (err) {
    console.error("Get cart error:", err)
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 })
  }
}
