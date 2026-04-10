import GetInTouch from '../components/GetInTouch/GetInTouch'
import LocationMap from '../components/LocationMaps/LocationMaps'
import { getContactPageData, getMedusaProductCategories } from '@/lib/api';
import { Metadata } from "next";
import HeroTextBannerDefault from '../components/HeroBanner/HeroBannerDefault';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';



export async function generateMetadata(): Promise<Metadata> {
    try {
        const result = await getContactPageData();

        return {
            title: result?.data?.seo?.metaTitle || " Global IT Success",
            description: result?.data?.seo?.metaDescription,
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
    const [contactPageData] = await Promise.all([

        getContactPageData(),



    ]);


    const categoryData = await getMedusaProductCategories();


    return (
        <>

            {/* <pre>{JSON.stringify(contactPageData, null, 2)}</pre> */}

            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    { label: "Contact", href: "/contact" },
                ]}

            />



            <HeroTextBannerDefault
                banner={contactPageData?.data?.banner}

            />
            {/* <GetInTouch /> */}
            <GetInTouch
                contactInfoData={contactPageData?.data}
                categories={categoryData?.product_categories || []}
            />
            <LocationMap
                locationData={contactPageData?.data?.contactDetails}
            />

        </>
    )
}

export default page