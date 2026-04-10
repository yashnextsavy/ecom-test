import { NextResponse } from "next/server";
import { getMedusaProductCategories, getMedusaProductCategoryListByCategorySlug } from "@/lib/api";

export async function GET() {
  try {
    // 1. Fetch all categories
    const categoriesRes = await getMedusaProductCategories();
    const categories = categoriesRes?.product_categories || [];

    // 2. Fetch products for each category in parallel
    const categoryProductsPromises = categories.map(async (category) => {
      try {
        const res = await getMedusaProductCategoryListByCategorySlug(category.handle);
        return res.products || [];
      } catch (err) {
        console.error(`Error fetching products for ${category.handle}`, err);
        return [];
      }
    });

    const productsByCategory = await Promise.all(categoryProductsPromises);

    // 3. Flatten all products into one array
    const allProducts = productsByCategory.flat();

    // 4. Remove duplicates (by handle or id)
    const uniqueProductsMap = new Map();

    allProducts.forEach((product) => {
      if (!uniqueProductsMap.has(product.handle)) {
        uniqueProductsMap.set(product.handle, {
          id: product.id,
          title: product.title,
          handle: product.handle,
        });
      }
    });

    const uniqueProducts = Array.from(uniqueProductsMap.values());

    return NextResponse.json({
      products: uniqueProducts,
    });
  } catch (error: any) {
    console.error("ALL VOUCHERS ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}
