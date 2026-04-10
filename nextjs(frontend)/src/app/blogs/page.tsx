import React from 'react'
import TopContactBar from '../components/TopContactBar/TopContactBar'
import HeroTextBanner1 from '../components/HeroBanner/HeroTextBanner1'
import BlogList from '../components/BlogList/BlogList'
import GetInTouch from '../components/GetInTouch/GetInTouch'
import { BlogsListItem, getBlogsListData, getBlogsPageData, getMedusaProductCategories } from '@/lib/api'
import { Metadata } from "next";
import HeroTextBannerDefault from '../components/HeroBanner/HeroBannerDefault';
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs'

export async function generateMetadata(): Promise<Metadata> {
    try {
        const result = await getBlogsPageData();

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


const page = async () => {

    const [pageData, blogsPageData] = await Promise.all([
        getBlogsListData(),
        getBlogsPageData()

    ]);
    const categoryData = await getMedusaProductCategories();

    const blogsData: BlogsListItem[] = pageData?.data ?? [];


    const blogs = blogsData.map((blog) => ({
        id: blog.id.toString(),
        title: blog.title,
        date: new Date(blog.publishedAt).toLocaleDateString("en-GB"),
        image:
            blog.listingImage?.url || blog.featuredImage?.url ||
            "",
        alt: blog.listingImage?.alt || blog.featuredImage?.alt ||
            "",
        slug: `/blogs/${blog.slug}`,
        provider: {
            name: blog.categories?.[0]?.name || "General",
            logo:
                blog.categories?.[0]?.imageUrl || "",
        },
    }));

    return (
        <>

            {/* <pre>{JSON.stringify(blogs, null, 2)}</pre> */}

            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    { label: "Blogs", href: "/blogs" },
                ]}

            />


            <HeroTextBannerDefault
                banner={blogsPageData?.data?.banner}
                extendedBG
                centerTitle

            />
            <BlogList blogs={blogs}
            />
            <GetInTouch
                contactInfoData={blogsPageData?.data?.contactInformation}
                categories={categoryData?.product_categories || []}
            />

        </>
    )
}

export default page
