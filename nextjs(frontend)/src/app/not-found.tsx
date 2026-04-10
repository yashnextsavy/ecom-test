import SearchBanner from "./components/SearchBanner/SearchBanner";
import { getMedusaProductCategories, searchContent } from "@/lib/api";
import { getMedusaProductCategoryListByCategorySlug } from "@/lib/api";
import ListAllItems from "./components/ListAllItems/ListAllItems";
import NotFoundSearchBanner from "./components/NotFoundSearchBanner/NotFoundSearchBanner";
// import { MedusaSearchResponse } from "@/lib/api";
// import { SearchResultItem } from "@/lib/api";

const page = async () => {

    const pageData = await getMedusaProductCategories();
    const categories = pageData?.product_categories || [];
    const searchExample = await searchContent("exam vouchers");

    let bestSellingProducts: any[] = [];

    for (const category of categories) {
        const productData =
            await getMedusaProductCategoryListByCategorySlug(category.handle);

        const best = productData?.products?.filter(
            (p: any) => p.best_seller === true
        ) || [];

        bestSellingProducts.push(...best);
    }




    return (
        <>


            {/* <pre>{JSON.stringify(searchExample, null, 2)}</pre> */}

            <NotFoundSearchBanner query="" resultsCount={0} />

            <ListAllItems
                items={categories}
                bestSellers={bestSellingProducts}
            />


        </>
    );
};

export default page;

