import BlogDetailsLayout from '@/app/components/Blogs/BlogDetailsLayout'
import BlogImageBanner from '@/app/components/Blogs/BlogImageBanner'
import GetInTouch from '@/app/components/GetInTouch/GetInTouch'
import BlogsDetailHeroBanner from '@/app/components/HeroBanner/BlogsDetailHeroBanner'
import RelatedBlogs from '../RelatedBlogs'
import BlogsDetails from '@/app/components/Blogs/BlogsDetails'
import { getBlogDetailsData } from '@/lib/api'
import { getSimilarBlogsData } from '@/lib/api'
import Breadcrumbs from '@/app/components/Breadcrumbs/Breadcrumbs'
import { getMedusaProductCategories } from "@/lib/apis/medusa-api";
import { notFound } from 'next/navigation'
import type { Metadata } from "next";

type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const seoData = await getBlogDetailsData(slug);

    const title =
        seoData?.data?.seo?.metaTitle ||
        "Blogs | Global IT Success";

    const description =
        seoData?.data?.seo?.metaDescription ||
        "Learn more about Global IT Success and our certification programs.";

    return {
        title,
        description,

    };

}



const page = async ({ params }: PageProps) => {

    const { slug } = await params;

    console.log("Slug:", slug);

    // const pageData = await getBlogDetailsData(slug);

    const [pageData, similarBlogsData] = await Promise.all([
        getBlogDetailsData(slug),
        getSimilarBlogsData(slug),
    ]);
    if (!pageData?.data) {
        notFound()
    }

    const categoryData = await getMedusaProductCategories();



    const blog = pageData?.data;
    // const relatedBlogs = similarBlogsData?.data ?? [];
    const relatedBlogs = (similarBlogsData?.data ?? []).slice(0, 3);

    return (
        <>

            <pre>{JSON.stringify(blog, null, 2)}</pre>
            {/* <pre>{JSON.stringify(similarBlogsData, null, 2)}</pre> */}


            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    { label: "Blogs", href: "/blogs" },
                    { label: `${pageData?.data?.title}` },
                ]}

            />

            {/* <BlogsDetailHeroBanner extendedBG mobileExtendedBG /> */}
            <BlogsDetailHeroBanner
                title={blog?.title}
                description={blog?.excerpt}
                companyName={blog?.categories?.[0]?.name}
                authorName={blog?.author?.name || "Team GITS"}
                date={
                    blog?.publishedAt
                        ? new Date(blog.publishedAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })
                        : ""
                }
                extendedBG
                mobileExtendedBG
            />


            {/* <BlogImageBanner /> */}

            <BlogImageBanner
                title={blog?.title}
                personImage={blog?.featuredImage?.url}
            />


            {/* <BlogsDetails /> */}
            <BlogsDetails
                title={blog?.title}
                excerpt={blog?.excerpt}
                content={blog?.content}
                faqs={blog?.faqs ?? []}
                contactDetails={blog?.contactInformation}
            />



            {/* <RelatedBlogs
                relatedBlogsData={similarBlogsData?.data}
            /> */}

            {relatedBlogs.length > 1 ? (
                <RelatedBlogs
                    relatedBlogsData={relatedBlogs}
                />
            ) : (
                <div className="py-6 md:py-12"></div>
            )}


            <GetInTouch
                contactInfoData={pageData?.data?.contactInformation}
                categories={categoryData?.product_categories || []}
            />


        </>
    )
}

export default page
