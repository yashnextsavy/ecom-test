import { NextResponse } from "next/server"




const BASE_URL = process.env.MEDUSA_API_BASE_URL
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY!

export async function POST(req: Request) {





    try {


        const body = await req.json()

        console.log("RAW REQUEST FROM FRONTEND:", body)
        const { cart_id, email, shipping_address } = body



        if (!cart_id || !email || !shipping_address) {
            return NextResponse.json(
                { error: "cart_id, email, and shipping_address are required" },
                { status: 400 }
            )
        }

        const normalizedAddress = {
            first_name: shipping_address.first_name ?? "Test-F",
            last_name: shipping_address.last_name ?? "Test",
            phone: shipping_address.phone ?? "Test",
            address_1: shipping_address.address_1 ?? "Test Address",
            address_2: shipping_address.address_2 ?? "",
            city: shipping_address.city ?? "New Delhi",
            province: shipping_address.province ?? "DL",
            postal_code: shipping_address.postal_code ?? "110018",
            country_code: (shipping_address.country_code ?? "in").toLowerCase(),
        }

        console.log("TO MEDUSA:", {
            email,
            shipping_address: normalizedAddress,
            billing_address: normalizedAddress,
        })
        console.log("=============== CART UPDATE DEBUG START =============")
        console.log("Cart ID:", cart_id)
        console.log("Email:", email)
        console.log("Incoming Address:", shipping_address)
        console.log("Normalized Address:", normalizedAddress)


        const res = await fetch(
            `${BASE_URL}/store/carts/${cart_id}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-publishable-api-key": PUBLISHABLE_KEY
                },
                body: JSON.stringify({
                    email,
                    shipping_address: normalizedAddress,
                    billing_address: normalizedAddress,
                })
            }
        )

        const rawText = await res.text()
        const data = rawText ? JSON.parse(rawText) : null


        const verifyRes = await fetch(`${BASE_URL}/store/carts/${cart_id}`, {
            headers: {
                "x-publishable-api-key": PUBLISHABLE_KEY
            }
        })

        const verifyData = await verifyRes.json()

        console.log("CART AFTER UPDATTTTTTTTTTTTTE:", verifyData.cart)


        if (!res.ok) {
            console.error("MEDUSA CART UPDATE ERROR:", {
                status: res.status,
                body: data,
                request: { cart_id, email, shipping_address: normalizedAddress },
            })

            return NextResponse.json(
                { error: data },
                { status: res.status }
            )
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error("CART UPDATE ROUTE ERROR:", error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
