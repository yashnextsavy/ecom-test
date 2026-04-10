import { NextResponse } from "next/server";
import { getMedusaTrendingOffers } from "@/lib/api";

export async function GET() {
  try {
    const data = await getMedusaTrendingOffers();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Trending offers API error:", error);
    return NextResponse.json({ product_categories: [], count: 0 }, { status: 500 });
  }
}
