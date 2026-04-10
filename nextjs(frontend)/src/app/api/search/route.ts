import { NextRequest, NextResponse } from "next/server";
import { searchMedusaProducts } from "@/lib/api";

export async function GET(req: NextRequest) {

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  try {

    const data = await searchMedusaProducts(query);

    return NextResponse.json({
      products: data.products ?? []
    });

  } catch (error) {

    console.error("SEARCH API ERROR:", error);

    return NextResponse.json({
      products: []
    });

  }

}