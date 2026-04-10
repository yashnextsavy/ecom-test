import { NextRequest, NextResponse } from "next/server"
import { getMedusaRelatedVouchers } from "@/lib/api"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const categorySlug = searchParams.get("category_slug")

        if (!categorySlug) {
            return NextResponse.json({ products: [] })
        }

        const slugs = categorySlug.split(",")

        const data = await getMedusaRelatedVouchers(slugs)

        // ✅ TRANSFORM HERE
        const products = (data?.products || []).map((p: any) => {
            const variantId =
                p?.variants?.[0]?.id ||
                p?.variant_id ||
                p?.variants?.[0]?.variant_id

            return {
                id: p.id,
                title: p.title,
                handle: p.handle,

                // ✅ REQUIRED FOR ADD TO CART
                variants: [{ id: variantId }],
                region_id: "reg_01KGPYG739RK5C9N02SCWFEXW1",
                sales_channel_id: "sc_01KGPTNP9JY4KGVR5C0T5YW76J",

                // ✅ IMAGE FIX
                image:
                    p.thumbnail ||
                    p.image ||
                    p?.categories?.[0]?.media_url ||
                    "/assets/images/common-blogs-1.webp",

                // ✅ OTHER FIELDS
                exam_series: p.exam_series || [],
                is_out_of_stock: p?.is_out_of_stock ?? false,

                prices: [
                    {
                        currency_code: "inr",
                        price: p?.pricing?.unit_price || p?.prices?.[0]?.price || 0,
                        our_price: p?.pricing?.our_price || p?.prices?.[0]?.our_price || 0,
                        actual_price:
                            p?.pricing?.actual_price || p?.prices?.[0]?.actual_price || 0,
                    },
                ],

                categories: p.categories || [],
            }
        }).filter((product: any) => product && !product.is_out_of_stock)
            .sort(() => Math.random() - 0.5)
            .slice(0, 4)

        return NextResponse.json({ products })
    } catch (error) {
        console.error("RELATED VOUCHERS ERROR:", error)
        return NextResponse.json({ products: [] }, { status: 500 })
    }
}
