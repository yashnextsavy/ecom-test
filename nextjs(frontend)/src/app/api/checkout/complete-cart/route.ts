import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Deprecated endpoint: cart completion now happens in Medusa callback processing. Frontend should not call complete-cart.",
    },
    { status: 410 }
  )
}
