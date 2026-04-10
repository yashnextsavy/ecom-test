import { NextResponse } from "next/server"

const BASE_URL = process.env.MEDUSA_API_BASE_URL!
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY!

export async function POST(req: Request) {
    try {
        const { cart_id, variant_id, quantity = 1 } = await req.json();

        if (!cart_id || !variant_id) {
            return NextResponse.json(
                { error: "cart_id and variant_id are required" },
                { status: 400 }
            );
        }

        const res = await fetch(`${BASE_URL}/store/carts/${cart_id}/line-items`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-publishable-api-key": PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
                variant_id,
                quantity,
            }),
        });

        // Check if response is ok
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            return NextResponse.json(data);
        } catch (err) {
            console.error("Invalid JSON from Medusa:", text);
            return NextResponse.json(
                { error: "Medusa did not return valid JSON", text },
                { status: 500 }
            );
        }
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}