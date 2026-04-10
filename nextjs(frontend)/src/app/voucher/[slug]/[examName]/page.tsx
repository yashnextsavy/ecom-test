import Breadcrumbs from '@/app/components/Breadcrumbs/Breadcrumbs'
import FaqSection from '@/app/components/FAQs/FAQs'
import GetInTouch from '@/app/components/GetInTouch/GetInTouch'
import ProductDetailsBanner from '@/app/components/ProductDetailsBanner/ProductDetailsBanner'
import React from 'react'
import { getMedusaProductDetailsByHandle, getMedusaProductCategories } from '@/lib/api'
import { getHomePageData, getTrendingOffersSection } from "@/lib/apis/payload-api";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import FAQs from "@/app/components/FAQs/FAQs";




interface PageProps {
    params: Promise<{
        examName: string;
        slug: string;
    }>;
}


// export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
//     const { slug, examName } = await params;

//     try {
//         const result = await getMedusaProductDetailsByHandle(examName);
//         // console.log("pro-details-seo check", result);

//         console.log("SEO DATA:", result?.seo);
//         console.log("FULL RESULT:", result);


//         return {
//             title: result?.seo?.meta_title || "Global IT Success",
//             description: result?.seo?.meta_description || "",
//             keywords: result?.seo?.keywords || "",
//         };
//     } catch (error) {
//         return {
//             title: "Global IT Success",
//             description:
//                 "Learn more about Global IT Success and our certification programs.",
//         };
//     }
// }

function stripHtml(html?: string): string {
    if (!html) return "";

    return html
        .replace(/<[^>]*>/g, "")   // remove tags
        .replace(/&nbsp;/g, " ")   // fix common entities
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")      // normalize spaces
        .trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { examName } = await params;

    try {
        const result = await getMedusaProductDetailsByHandle(examName);

        const productTitle = result?.title;
        const categoryDescription = stripHtml(
            result?.category?.[0]?.description
        );

        const title =
            result?.seo?.meta_title ||
            productTitle ||
            "Global IT Success";

        const description =
            result?.seo?.meta_description ||
            categoryDescription ||
            "Learn more about Global IT Success and our certification programs.";

        return {
            title,
            description,
            keywords: result?.seo?.keywords || "",
        };
    } catch (error) {
        return {
            title: "Global IT Success",
            description:
                "Learn more about Global IT Success and our certification programs.",
        };
    }
}


const page = async ({ params }: PageProps) => {

    const { slug, examName } = await params;



    const detailsData = await getMedusaProductDetailsByHandle(examName);
    const trendingOffersSection = await getTrendingOffersSection();

    if (!detailsData) {
        notFound();
    }

    // const detailsData = await getMedusaProductDetailsByHandle("associate-ccnaccnp-concentration-specialist-exams");
    const pageData = await getHomePageData();

    const CategoryDataa = await getMedusaProductCategories();



    const product = detailsData

    const category = product?.categories?.[0]

    const logo = product?.category?.[0]?.media?.[0]?.url

    const validity = product?.details_information?.validity_information
    const delivery = product?.details_information?.delivery_information
    const additional = product?.details_information?.additional_information




    const priceData = product?.prices?.[0];

    const rawActualPrice = Number(priceData?.actual_price || 0);
    const rawOurPrice = Number(priceData?.our_price || 0);

    const actualPrice = new Intl.NumberFormat("en-IN").format(
        Math.round(rawActualPrice)
    );

    const ourPrice = new Intl.NumberFormat("en-IN").format(
        Math.round(rawOurPrice)
    );

    const discountPercentage =
        rawActualPrice > rawOurPrice
            ? Math.round(((rawActualPrice - rawOurPrice) / rawActualPrice) * 100)
            : 0;



    const categories = product?.category?.[0];

    const faqData = categories
        ? {
            sectionInfo: {
                title: categories?.faq_section?.title,
                description: categories?.faq_section?.description,
            },
            faqCategories: [
                {
                    id: categories.id || categories.name || "faq-category",
                    categoryTitle: "",
                    faqs: (categories.faq || []).map((item: any, index: number) => ({
                        id: `${categories.id || categories.name || "faq-category"}-${index}`,
                        question: item.question, // already HTML string
                        answer: item.answer,
                    })),
                },
            ],
        }
        : undefined;


    const isOutOfStock = product?.is_out_of_stock ?? false;
    // const isOutOfStock = (product as { is_out_of_stock?: boolean })?.is_out_of_stock ?? false;


    // console.log("PRODUCT DATA", product);

    return (
        <>
            {/* <pre>{JSON.stringify(product?.is_out_of_stock, null, 2)}</pre> */}

            {/* <pre>{JSON.stringify(trendingOffersSection?.data, null, 2)}</pre> */}

            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    { label: "Voucher", href: "/voucher" },
                    { label: `${detailsData?.category?.[0]?.name}`, href: `/voucher/${slug}` },
                    { label: `${detailsData?.title}` },
                ]}
            />

            <ProductDetailsBanner
                title={product?.title}
                logo={logo}
                actualPrice={actualPrice}
                ourPrice={ourPrice}
                discount={discountPercentage}
                examSeries={product?.exam_series || []}
                validity={validity}
                description={product?.category?.[0]?.description}
                fallbackDescription={product?.fallbackDescription}
                delivery={delivery}
                additional={additional}
                CategoryDataa={CategoryDataa ?? undefined}
                variant_id={product?.variants?.[0]?.id}
                region_id={product?.region_id}
                sales_channel_id={product?.sales_channel_id}
                //   categories={CategoryDataa?.product_categories || []}
                categories={CategoryDataa?.product_categories || []}
                trendingOffersSection={trendingOffersSection?.data}
                isOutOfStock={isOutOfStock}
            />

            <GetInTouch
                contactInfoData={pageData?.data?.contactInformation}
                categories={CategoryDataa?.product_categories || []}
            />

            <FaqSection faqData={faqData} />

            {/* <FAQs faqData={pageData?.data?.faqSection} /> */}


        </>
    )
}

export default page
