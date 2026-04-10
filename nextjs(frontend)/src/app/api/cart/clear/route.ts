import { NextResponse } from "next/server"

export async function POST() {
    const res = NextResponse.json({ success: true })

    res.cookies.set("cart_id", "", {
        maxAge: 0, // delete cookie
        path: "/",
    })

    return res
}