import GetInTouch from '../components/GetInTouch/GetInTouch'
import CompanyMarquee from '../components/BrandsMarquee/BrandsMarquee'
import CTABannerVoucher from '../components/CTABanner/CTABannerVoucher'
import MissionVision from '../components/MissionVision/MissionVision'
import WhyChooseUsType2 from '../components/WhyChooseUs/WhyChooseUs'
import ImageContentSection from '../components/ImageContentSection/ImageContentSection'
import TrustedPartner from '../components/TrustedPartner/TrustedPartner '
import AboutBannerSection from '../components/AboutBanner/AboutBanner'
import DiscoverCertificates from '../components/DiscoverCertificates/DiscoverCertificates'
import { Metadata } from "next";
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs'
import { getAboutPageData } from "@/lib/apis/payload-api";
import { getMedusaProductCategories } from '@/lib/api'




export async function generateMetadata(): Promise<Metadata> {
    try {
        const result = await getAboutPageData();


        return {
            title: result?.data?.seo?.title || "Global IT Success",
            description: result?.data?.seo?.description,
            // keywords: result.keywords,
        };
    } catch (error) {
        return {
            title: "Global IT Success",
            description:
                "Learn more about Global IT Success and our certification programs.",
        };
    }
}






const page = async () => {


    const [pageData, productCategoriesData] = await Promise.all([
        getAboutPageData(),
        getMedusaProductCategories(),

    ]);


    const trendingVouchers = productCategoriesData?.product_categories || [];

    const offersCtaBanner = pageData?.data?.offersCtaBanner || {};

    const DiscoverData = {
        ...offersCtaBanner,
        categories: trendingVouchers || [],
    };



    return (
        <>

            {/* <pre>
                {JSON.stringify(pageData?.data?.trendingOffersSection, null, 2)}
            </pre> */}

            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    { label: "About", href: "/about" },

                ]}
            />
            <AboutBannerSection bannerData={pageData?.data?.banner} />

            <CompanyMarquee
                brandsData={productCategoriesData?.product_categories || []}
            />
            <MissionVision missionVisionData={pageData?.data?.ourMissionAndVision} />
            <CTABannerVoucher
                CTABannerVoucherData={pageData?.data?.ctaBanner}
            />
            <WhyChooseUsType2 aboutData={pageData?.data?.aboutContent1} />

            <DiscoverCertificates
                DiscoverData={DiscoverData}
                trendingOffersSection={pageData?.data?.trendingOffersSection}
            />

            <TrustedPartner aboutData={pageData?.data?.aboutContent2} />
            <GetInTouch
                contactInfoData={pageData?.data?.contactInformation}
                categories={trendingVouchers}
            />


        </>
    )
}

export default page
