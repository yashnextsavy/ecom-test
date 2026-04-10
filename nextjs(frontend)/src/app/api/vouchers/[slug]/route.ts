// src/app/api/vouchers/[slug]/route.ts
import { getMedusaProductCategoryListByCategorySlug } from "@/lib/apis/medusa-api";

export async function GET(
    _req: Request,
    context: { params: Promise<{ slug: string }> }
) {
    const { slug: rawSlug } = await context.params;
    const slug = rawSlug?.trim();

    if (!slug) {
        return new Response(JSON.stringify({ error: "Category slug is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const data = await getMedusaProductCategoryListByCategorySlug(slug);

        const clientData = {
            products: data.products || [],
            category: data.categories?.[0] || null,
            additional_information: data.additional_information || null,
        };

        return new Response(JSON.stringify(clientData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        console.error("Error fetching Medusa data:", err.message);
        return new Response(
            JSON.stringify({ error: err.message, products: [], category: null }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
