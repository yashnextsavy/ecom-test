

import GetInTouch from '../components/GetInTouch/GetInTouch'
import LeftRightImgInfo from '../components/LeftRightImgInfo/LeftRightImgInfo'
import WhyTrustGits from '../components/WhyTrustGits/WhyTrustGits'
import { getAchievementPageData } from '@/lib/api'
import HeroTextBannerDefault from '@/app/components/HeroBanner/HeroBannerDefault'
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs'
import { Metadata } from "next";
import { getMedusaProductCategories } from "@/lib/apis/medusa-api";




interface AchievementApiItem {
    id: string;
    image: string | null;
    title: string;
    description: string;
}

type LeftRightItem = {
    title: string;
    description: string;
    image: string;
    imageAlt?: string;


};

export async function generateMetadata(): Promise<Metadata> {
    try {
        const result = await getAchievementPageData();

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




const Page = async () => {

    const [pageData,] = await Promise.all([
        getAchievementPageData(),

    ]);

    const categoryData = await getMedusaProductCategories();


    const achievementsData: LeftRightItem[] =
        pageData?.data?.achievements?.map((item: AchievementApiItem) => ({
            title: item.title,
            description: item.description,
            image: item.image ?? "/assets/images/achivements-ats01.webp",
            imageAlt: item.title,
        })) ?? [];


    return (
        <>

            {/* <pre>{JSON.stringify(pageData, null, 2)}</pre> */}


            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    { label: "Achievements", href: "/achievements" },
                    // { label:                    }
                ]}



            />
            <HeroTextBannerDefault
                banner={pageData?.data?.banner}
            />

            <LeftRightImgInfo
                achievementsData={achievementsData}
            />

            {/* <LeftRightImgInfo achievementsData={achievementsData} /> */}


            <WhyTrustGits
                whyTrustUsData={pageData?.data?.whyChooseUs}
            />
            <GetInTouch
                contactInfoData={pageData?.data?.contactInformation}
                categories={categoryData?.product_categories || []}
            />

        </>
    )
}

export default Page
