import Link from "next/link";
import { CgChevronRight } from 'react-icons/cg';

type CategoryMedia = {
    url: string;
};

type Category = {
    id: number;
    name: string;
    imageUrl?: string;
    media?: CategoryMedia[];
};

export type RelatedBlogItem = {
    title: string;
    slug: string;
    publishedAt: string;
    featuredImage?: {
        url?: string;
        alt?: string;
    } | null;
    categories?: Category[];
};

type Props = {
    relatedBlogsData?: RelatedBlogItem[];
};

const RelatedBlogs = ({ relatedBlogsData = [] }: Props) => {
    return (
        <section className="related-blogs-wrapper">

            <div className="container-custom mx-auto">
                <div className="related-blogs-content flex flex-col gap-7">
                    <div className="related-blogs-title flex justify-center">
                        <h2>Insights You May Find Useful</h2>
                    </div>

                    <div className="related-blogs-cards">
                        <div className="common__blogs__grid">
                            {relatedBlogsData.map((blog, index) => {
                                const provider = blog.categories?.[0];
                                const providerLogo = provider?.imageUrl;

                                return (
                                    <Link
                                        href={`/blogs/${blog.slug}`}
                                        key={index}
                                        className="common__blog-card"
                                    >
                                        <div className="common__blog-card__image">
                                            <img
                                                className="blog-title-image"
                                                src={
                                                    blog.featuredImage?.url ||
                                                    "/assets/images/common-blogs-1.webp"
                                                }
                                                alt={blog?.featuredImage?.alt}
                                            />

                                            <div className="common__blog-card__content">
                                                <div className="common__blog-card__provider__wrapper">
                                                    <div className="common__blog-card-date">
                                                        <time>
                                                            {new Date(
                                                                blog.publishedAt
                                                            ).toLocaleDateString()}
                                                        </time>
                                                    </div>

                                                    {providerLogo && (
                                                        <div className="common__blog-card__provider">
                                                            <img
                                                                src={providerLogo}
                                                                alt={provider?.name}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <h3>{blog.title}</h3>
                                            </div>
                                        </div>

                                        <div className="common__blog-card__link">
                                            <div className="secondary-btn-link inline-flex justify-center items-center">
                                                Read Full Blog
                                                <span className="secondary-link-arrow">
                                                    <CgChevronRight />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default RelatedBlogs
