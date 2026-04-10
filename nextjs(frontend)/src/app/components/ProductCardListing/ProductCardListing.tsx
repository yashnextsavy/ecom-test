import React from "react";
import ProductCard from "../ProductCard/ProductCard";


interface ExamSeries {
    id: string;
    title: string;
}

interface Variant {
    id: string;
}

interface ProductPrice {
    currency_code: string;
    price: string;
    our_price: string;
    actual_price: string;
}
interface ProductCardListingCategory {
    name: string;
}
interface ProductCategory {
    id: string;
    name: string;
    handle: string;
    parent_category_id: string;
}


interface Organize {
    type: { id: string; value: string };
    categories: ProductCategory[];
}
interface Product {
    id: string;
    title: string;
    status: string;
    is_out_of_stock?: boolean;
    thumbnail?: string;
    variants?: Variant[]
    region_id?: string;
    sales_channel_id?: string;
    handle: string;
    examSeries?: ExamSeries[];
    exam_series?: ExamSeries[];
    prices?: ProductPrice[];
    image?: string;
    categories: ProductCardListingCategory[];
    imageAlt?: string;
    viewLink?: string;
    cartLink?: string;
    exam_series_text?: string;
}

interface Category {
    media?: {
        url?: string;
    }[];
    listing_page_side_section?: {
        title?: string
        description?: string
    }
}

interface Props {

    products?: Product[];
    category?: Category;
    slug?: string;
}



const ProductCardListing: React.FC<Props> = ({ products = [], category, slug = "" }) => {


    const mappedProducts = products.map((product) => {


        const rawActualPrice = Number(product.prices?.[0]?.actual_price || 0);
        const rawDiscountedPrice = Number(product.prices?.[0]?.our_price || 0);

        const actualPrice = new Intl.NumberFormat('en-IN').format(
            Math.round(Number(rawActualPrice))
        );

        const discountedPrice = new Intl.NumberFormat('en-IN').format(
            Math.round(Number(rawDiscountedPrice))
        );

        const discountPercentage =
            rawActualPrice > rawDiscountedPrice && rawActualPrice > 0
                ? Math.round(((rawActualPrice - rawDiscountedPrice) / rawActualPrice) * 100)
                : undefined;

        return {
            id: product?.id,
            variant_id: product?.variants?.[0]?.id ?? "",
            region_id: product.region_id ?? "",
            sales_channel_id: product.sales_channel_id ?? "",
            title: product?.title,
            image:
                category?.media?.[0]?.url ||
                product?.image ||
                "/assets/images/common-blogs-1.webp",
            imageAlt: product?.categories?.[0]?.name,
            examSeries: product?.exam_series || [],
            examSeriesText:
                product?.exam_series_text ||
                (product as any)?.metadata?.exam_series_text ||
                "Valid for exam series:",
            actualPrice,
            discountedPrice,
            discountPercentage,
            viewLink: `${product.handle}`,
            cartLink: `/cart/add/${product.id}`,
            isOutOfStock: product?.is_out_of_stock ?? false,
        };
    });


    return (
        <section className="products-section">
            <div className="container-custom mx-auto">



                {products && (
                    products.length > 2 ? (
                        <div className="products-grid">


                            {mappedProducts.map((product) => (

                                <ProductCard key={product.id} {...product} slug={slug} />


                            ))}
                        </div>
                    ) : (
                        <div className="title-cards-products-list-wrapper">
                            <div className="title-cards-products-list-content-wrapper">
                                <div className="title-cards-products-list-content">
                                    <h2 className="title-cards-products-list-heading">
                                        {category?.listing_page_side_section?.title}
                                    </h2>

                                    <div
                                        className="title-cards-products-list-sub-description"
                                        dangerouslySetInnerHTML={{
                                            __html: category?.listing_page_side_section?.description ?? ""
                                        }}
                                    />

                                </div>
                            </div>
                            <div className="title-cards-products-list-cards">
                                {mappedProducts.map((product) => (
                                    <ProductCard key={product.id} {...product} slug={slug} />
                                ))}
                            </div>

                        </div>
                    )
                )}




            </div>
        </section>

    );
};

export default ProductCardListing;
