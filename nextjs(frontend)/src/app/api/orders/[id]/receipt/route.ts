import { NextResponse } from "next/server"

const BASE_URL = process.env.MEDUSA_API_BASE_URL
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!BASE_URL || !PUBLISHABLE_KEY) {
      return NextResponse.json(
        { error: "Medusa API configuration missing" },
        { status: 500 }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 })
    }

    const medusaRes = await fetch(`${BASE_URL}/store/orders/${id}/receipt`, {
      method: "GET",
      headers: {
        "x-publishable-api-key": PUBLISHABLE_KEY,
        Accept: "application/pdf",
      },
      cache: "no-store",
    })

    if (!medusaRes.ok) {
      const errorText = await medusaRes.text().catch(() => "")
      return NextResponse.json(
        {
          error: "Failed to fetch receipt from Medusa",
          details: errorText || medusaRes.statusText,
        },
        { status: medusaRes.status || 500 }
      )
    }

    const pdfBuffer = await medusaRes.arrayBuffer()
    const contentType =
      medusaRes.headers.get("content-type") || "application/pdf"
    const contentDisposition =
      medusaRes.headers.get("content-disposition") ||
      `attachment; filename="receipt-${id}.pdf"`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Receipt download proxy failed:", error)
    return NextResponse.json(
      { error: "Failed to download receipt" },
      { status: 500 }
    )
  }
}
