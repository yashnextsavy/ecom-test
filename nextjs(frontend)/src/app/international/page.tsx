import React from 'react'
import CompanyCertificationsWithSlider from '../components/CompanyCertifications/CompanyCertificationWithSlider'
import FaqSection from '../components/FAQs/FAQs'
import CTABannerVoucher from '../components/CTABanner/CTABannerVoucher'
import WhyTrustGits from '../components/WhyTrustGits/WhyTrustGits'
import TestimonialsSection from '../components/TestimonialSection/TestimonialSection'
import CTABulkVouchers from '../components/CTABulkVouchers/CTABulkVouchers'
import HeroBannerTypeTwo from '../components/HeroBanner/HeroBannerTypeTwo'
import { getInternationalPageData } from '@/lib/api'
import { getMedusaProductCategories, getHomePageData } from '@/lib/api'
import CompanyCertificationsGrid from '../components/CompanyCertifications/CompanyCertificationsGrid'
import CompanyCertificationsInternational from '../components/CompanyCertifications/CompanyCertificationsInternational'
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs'
import { Metadata } from "next";
import { getMedusaInternationalCategories, getMedusaInternationalProductsByCategorySlug } from '@/lib/api'
import { getContactPageData } from '@/lib/api'



export async function generateMetadata(): Promise<Metadata> {
    try {
        const result = await getInternationalPageData();

        return {
            title: result?.data?.seo?.title || " Global IT Success",
            description: result?.data?.seo?.description,
        };
    } catch {
        return {
            title: "Global IT Success",
            description:
                "Learn more about Global IT Success and our certification programs.",
        };
    }
}




const Page = async () => {


    const [pageData, productInternationalCategories, productCategoriesData, homePageData, contactData] = await Promise.all([
        getInternationalPageData(),
        getMedusaInternationalCategories(),
        getMedusaProductCategories(),
        getHomePageData(),
        getContactPageData(),
    ]);

    const formattedCategories =
        productInternationalCategories?.product_categories?.map((cat) => ({
            id: cat.id,
            name: cat.name,
            handle: cat.handle,
            offer_badge: cat.offer_badge_text,
            media: cat.category_img
                ? [{ id: cat.id, url: cat.category_img }]
                : [],
        })) || [];


    return (
        <>

            {/* <pre>{JSON.stringify(pageData?.data?.banner, null, 2)}</pre> */}

            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    { label: "International", href: "/international" },
                ]}

            />


            <HeroBannerTypeTwo
                bannerData={pageData?.data?.banner}
            />
            <CompanyCertificationsInternational
                certificationsGridData={formattedCategories}
                contactData={contactData?.data?.contactDetails}
            />
            <WhyTrustGits
                whyTrustUsData={pageData?.data?.sectionInfo}
            />
            <FaqSection
                faqData={pageData?.data?.faqSection}
            />

            <CTABannerVoucher
                CTABannerVoucherData={pageData?.data?.ctaBanner}
            />

            <TestimonialsSection
                TestimonialsData={homePageData?.data?.testimonials || {}}
            />
            {/* <CTABulkVouchers /> */}

            <CTABulkVouchers data={pageData?.data?.ctaBannerInquiry} />

        </>
    )
}

export default Page
