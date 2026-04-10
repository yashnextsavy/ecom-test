import { NextResponse } from "next/server";
import { getMedusaProductCategoryListByCategorySlug } from "@/lib/api";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const vendor = searchParams.get("vendor");

        if (!vendor) {
            return NextResponse.json({ products: [] });
        }

        const res = await getMedusaProductCategoryListByCategorySlug(vendor);

        const products = res.products || [];

        const formatted = products.map((product: any) => ({
            id: product.id,
            title: product.title,
            handle: product.handle,
        }));

        return NextResponse.json({
            products: formatted,
        });

    } catch (error) {
        console.error("COURSES API ERROR:", error);

        return NextResponse.json(
            { error: "Failed to fetch courses" },
            { status: 500 }
        );
    }
}