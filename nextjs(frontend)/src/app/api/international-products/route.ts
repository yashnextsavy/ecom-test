import { NextRequest, NextResponse } from "next/server";
import { getMedusaInternationalProductsByCategorySlug } from "@/lib/api";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const categorySlug = searchParams.get("categorySlug");

        if (!categorySlug) {
            return NextResponse.json(
                { error: "categorySlug is required" },
                { status: 400 }
            );
        }

        const data = await getMedusaInternationalProductsByCategorySlug(
            categorySlug
        );

        return NextResponse.json(data);
    } catch (error) {
        console.error("International products API error:", error);

        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}