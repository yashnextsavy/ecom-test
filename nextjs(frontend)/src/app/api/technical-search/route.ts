import { NextResponse } from "next/server";
import { PAYLOAD_API_BASE_URL } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    const res = await fetch(
      `${PAYLOAD_API_BASE_URL}/api/search?q=${encodeURIComponent(q)}`
    );

    if (!res.ok) {
      console.error("Payload search failed:", res.status);
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();

    return NextResponse.json({
      results: data.data || data.docs || [],
    });

  } catch (error) {
    console.error("Technical search error:", error);

    return NextResponse.json(
      { results: [] },
      { status: 500 }
    );
  }
}