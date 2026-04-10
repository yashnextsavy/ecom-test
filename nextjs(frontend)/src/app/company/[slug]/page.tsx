import React from "react";
import HeroTextBannerImage from "@/app/components/HeroBanner/HeroTextBannerImage";
import GetInTouch from "@/app/components/GetInTouch/GetInTouch";
import PoliciesContent from "@/app/components/PrivacyPolicy/PoliciesContent";
import Breadcrumbs from "@/app/components/Breadcrumbs/Breadcrumbs";
import { Metadata } from "next";

import { getHomePageData, getGeneralPageBySlug } from "@/lib/api";

type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};

// ✅ Dynamic SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;

    try {
        const data = await getGeneralPageBySlug(slug);

        return {
            title: data?.data?.seo?.metaTitle || "Global IT Success",
            description: data?.data?.seo?.metaDescription,
        };
    } catch {
        return {
            title: "Global IT Success",
            description: "Learn more about Global IT Success and our certification programs.",
        };
    }
}

// ✅ Dynamic Page
const Page = async ({ params }: PageProps) => {
    const { slug } = await params;

    console.log("Slug from URL:", slug);

    const [pageData, data] = await Promise.all([
        getHomePageData(),
        getGeneralPageBySlug(slug) // ✅ FIXED (no hardcoding)
    ]);

    const pageContent = data?.data;

    return (
        <>
            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    {
                        label: pageContent?.title || slug.replace(/-/g, " "),
                        href: `/company/${slug}`,
                    },
                ]}
            />

            <HeroTextBannerImage
                title={pageContent?.banner?.title}
                description={pageContent?.banner?.description}
                image={pageContent?.banner?.image?.url}
            />

            <PoliciesContent content={pageContent?.content} />

            <GetInTouch contactInfoData={pageData?.data?.contactInformation} />
        </>
    );
};

export default Page;