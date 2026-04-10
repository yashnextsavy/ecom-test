import React from 'react'
import HeroTextBannerImage from '../components/HeroBanner/HeroTextBannerImage'
import GetInTouch from '../components/GetInTouch/GetInTouch'
import PoliciesContent from '../components/PrivacyPolicy/PoliciesContent'
import { getHomePageData } from '@/lib/api';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';
import { getGeneralPageBySlug } from "@/lib/api";
import { getGeneralPagesList } from '@/lib/api';
import { Metadata } from "next";


export async function generateMetadata(): Promise<Metadata> {
    try {
        const result = await getGeneralPageBySlug("terms-of-service");

        return {
            title: result?.data?.seo?.metaTitle || " Global IT Success",
            description: result?.data?.seo?.metaDescription,
        };
    } catch {
        return {
            title: "Global IT Success",
            description:
                "Learn more about Global IT Success and our certification programs.",
        };
    }
}




const page = async () => {

    const pageData = await getHomePageData();
    const data = await getGeneralPageBySlug("terms-of-service");
    const dataList = await getGeneralPagesList()
    const pageContent = data?.data;


    return (
        <>

       

            <Breadcrumbs

                items={[
                    { label: "Home", href: "/" },
                    { label: "Terms & Conditions", href: "/terms-conditions" },
                ]}

            />
            <HeroTextBannerImage
                title={pageContent?.banner?.title}
                description={pageContent?.banner?.description}
                image={pageContent?.banner?.image?.url}
            />

            <PoliciesContent content={pageContent?.content} />


            <GetInTouch
                contactInfoData={pageData?.data?.contactInformation}
            />
        </>
    )
}

export default page
