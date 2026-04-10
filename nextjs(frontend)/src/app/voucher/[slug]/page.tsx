import React from 'react'
import TestimonialsSection from '@/app/components/TestimonialSection/TestimonialSection'
import WhyTrustGits from '@/app/components/WhyTrustGits/WhyTrustGits'
import GetInTouch from '@/app/components/GetInTouch/GetInTouch'
import HeroBannerDefault from '@/app/components/HeroBanner/HeroBannerDefault'
import ProductCard from '@/app/components/ProductCard/ProductCard'
import ProductCardListing from '@/app/components/ProductCardListing/ProductCardListing'
import CertificationAccordion from '@/app/components/CertificationAccordion/CertificationAccordion'
import Breadcrumbs from '@/app/components/Breadcrumbs/Breadcrumbs'
import { getMedusaProductCategories, getMedusaProductCategoryListByCategorySlug } from '@/lib/apis/medusa-api'
import { getHomePageData } from '@/lib/api'
import { notFound } from "next/navigation";
import type { Metadata } from "next";


const cleanMeta = (str?: string) => {
    if (!str) return "";

    let result = str;

    // remove HTML tags
    result = result.replace(/<[^>]*>/g, "");

    // decode repeatedly (handles &amp;nbsp;)
    let prev;
    do {
        prev = result;
        result = result
            .replace(/&amp;/g, "&")
            .replace(/&nbsp;/g, " ")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    } while (result !== prev);

    return result.replace(/\s+/g, " ").trim();
};



export async function generateMetadata({ params }: PageProps): Promise<Metadata> {




    try {
        const { slug } = await params;

        const categoryListData =
            await getMedusaProductCategoryListByCategorySlug(slug);

        const category = categoryListData?.categories?.[0];

        if (!category) {
            return {
                title: "Page Not Found",
                description: "The page you are looking for does not exist.",
            };
        }

        const rawTitle = category?.listing_page_banner?.title;
        const rawDescription = category?.listing_page_banner?.description;

        const cleanTitle = cleanMeta(rawTitle);
        const cleanDescription = cleanMeta(rawDescription);

        return {
            title: cleanTitle || "Global IT Success",
            description:
                cleanDescription ||
                "Explore certification vouchers and boost your IT career.",
        };
    } catch {
        return {
            title: "Global IT Success",
            description:
                "Learn more about Global IT Success and our certification programs.",
        };
    }
}


interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}


const page = async ({ params }: PageProps) => {
    const { slug } = await params;

    const categoryListData = await getMedusaProductCategoryListByCategorySlug(slug);
    const categoryData = await getMedusaProductCategories();


    const pageData = await getHomePageData();
    const category = categoryListData?.categories?.[0];

    if (!category) {
        notFound();
    }





    return (
        <>


            {/* <pre>{JSON.stringify(categoryListData?.products, null, 2)}</pre> */}
{/*  */}
            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    { label: "Voucher", href: "/voucher" },
                    { label: `${categoryListData?.categories?.[0]?.name}` },

                ]}
            />

            {category?.listing_page_banner && (
                <HeroBannerDefault
                    banner={{
                        title: category.listing_page_banner.title,
                        description: category.listing_page_banner.description,
                    }}
                    buttons
                    beautifulBackground
                    primaryBtn={{
                        label:
                            category?.listing_page_banner?.button_1_text ||
                            "Contact via WhatsApp",
                        link: `https://wa.me/${category?.listing_page_banner?.button_1_link}`,
                    }}
                    secondaryBtn={{
                        label:
                            category?.listing_page_banner?.button_2_text ||
                            "Call Our Experts",
                        link: `tel:${category?.listing_page_banner?.button_2_link}`,
                    }}
                />
            )}

            <ProductCardListing

                products={categoryListData?.products}
                category={categoryListData?.categories?.[0]}
                slug={slug}
            />


            <GetInTouch
                contactInfoData={pageData?.data?.contactInformation}
                categories={categoryData?.product_categories || []}
            />
            <CertificationAccordion
                additionalInformation={categoryListData?.categories?.[0]?.additional_information}
                faq={categoryListData?.categories?.[0]?.faq}
            />


            <WhyTrustGits
                whyTrustUsData={pageData?.data?.whyChooseUs}
            />
            <TestimonialsSection
                TestimonialsData={pageData?.data?.testimonials || {}} />

        </>
    )
}



export default page




