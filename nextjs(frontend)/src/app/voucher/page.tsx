

// import { redirect } from "next/navigation";

// const page = () => {
//     redirect("/vendors");
// };

// export default page;



import React from 'react'
import GetInTouch from '../components/GetInTouch/GetInTouch'
import HeroBannerDefault from '../components/HeroBanner/HeroBannerDefault'
import CompanyCertifications from '../components/CompanyCertifications/CompanyCertifications'
import { Metadata } from "next";
import { getVendorsPageData, getVouchersPageData } from '@/lib/api';
import { getMedusaProductCategories } from '@/lib/api';
import CompanyCertificationsGrid from '../components/CompanyCertifications/CompanyCertificationsGrid';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs';


export async function generateMetadata(): Promise<Metadata> {
    try {
        const result = await getVouchersPageData();

        return {
            title: result?.data?.seo?.metaTitle || " Global IT Success",
            description: result?.data?.seo?.metaDescription,

        };
    } catch (error) {
        return {
            title: "Global IT Success",
            description:
                "Learn more about Global IT Success and our certification programs.",
        };
    }
}




const Page = async () => {

    const [pageData, productCategoriesData] = await Promise.all([
        getVouchersPageData(),
        getMedusaProductCategories()

    ]);



    return (
        <>


            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    { label: "Voucher", href: "/voucher" },
                ]}

            />

            {/* <pre>{JSON.stringify(productCategoriesData, null, 2)}</pre> */}
            {/* <HeroBannerDefault
                banner={pageData?.data?.banner}
            /> */}

            <HeroBannerDefault
                banner={pageData?.data?.banner}
            />


            <CompanyCertificationsGrid
                certificationsGridData={productCategoriesData?.product_categories || []}
            />
            {/* <CompanyCertifications
                certificationsGridData={productCategoriesData?.product_categories || []}
            /> */}
            <GetInTouch
                contactInfoData={pageData?.data?.contactInformation}
                categories={productCategoriesData?.product_categories || []}
            />
        </>
    )
}

export default Page;




