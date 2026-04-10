// src/lib/server/medusa-server.ts
import "server-only";
import { fetchJson } from "@/lib/server/http-client";
import type { ProductCardListing } from "@/lib/apis/medusa-api";

const MEDUSA_DEFAULT_BASE_URL = process.env.MEDUSA_API_BASE_URL || "http://localhost:9000";

export async function getProducts(): Promise<ProductCardListing[]> {
    const res = await fetchJson<{ products: ProductCardListing[] }>(
        `${MEDUSA_DEFAULT_BASE_URL}/store/products`,
        {
            headers: {
                "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_API_KEY!,
            },
        }
    );

    return res?.products || [];
}
