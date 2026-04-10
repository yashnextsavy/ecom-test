
"use client"

import Link from "next/link";
import { CgChevronRight } from "react-icons/cg";
import { useState, useEffect, useRef } from "react";

export type BlogProvider = {
    name: string;
    logo: string;
};




type Blog = {
    id: string;
    title: string;
    date: string;
    image: string;
    slug: string;
    provider: {
        name: string;
        logo: string;
    };
};

interface Props {
    blogs: Blog[];
}


export default function BlogListSection({ blogs }: Props) {


    const INITIAL_COUNT = 9;
    const LOAD_MORE_COUNT = 6;

    const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const blogList = blogs;
    const visibleBlogs = blogList.slice(0, visibleCount);



    const observerRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        setVisibleCount(Math.min(INITIAL_COUNT, blogList.length));
    }, [blogList.length]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];

                if (entry.isIntersecting && visibleCount < blogList.length && !isLoadingMore) {
                    setIsLoadingMore(true);

                    window.setTimeout(() => {
                        setVisibleCount((prev) =>
                            Math.min(prev + LOAD_MORE_COUNT, blogList.length)
                        );
                        setIsLoadingMore(false);
                    }, 250);
                }
            },
            {
                root: null,
                rootMargin: "200px",
                threshold: 0
            }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [blogList.length, visibleCount, isLoadingMore]);

    return (


        <section className="blog-list-section-wrapper">
            <div className="container-custom mx-auto">

                <div className="common__blogs__grid">
                    {visibleBlogs.map((blog) => (
                        <Link href={blog.slug} key={blog.id} className="common__blog-card">
                            <div className="common__blog-card__image">
                                <img className="blog-title-image" src={blog.image} alt={blog.title} />

                                <div className="common__blog-card__content">
                                    <div className="common__blog-card__provider__wrapper">
                                        <div className="common__blog-card-date">
                                            <time>{blog.date}</time>
                                        </div>

                                        <div className="common__blog-card__provider">
                                            <img
                                                src={blog.provider.logo}
                                                alt={blog.provider.name}
                                            />
                                        </div>
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
                    ))}
                </div>

                {/* View More area */}
                {visibleCount < blogList.length && (
                    <div
                        ref={observerRef}
                        className="blogs-view-more-wrapper flex items-center justify-center"
                        style={{ minHeight: "28px" }}
                    >
                        {isLoadingMore && (
                            <span
                                aria-label="Loading more blogs"
                                className="inline-block h-4 w-4 rounded-full border-2 border-solid border-t-transparent"
                                style={{
                                    borderColor: "#23408B",
                                    borderTopColor: "transparent",
                                    animation: "spin 0.8s linear infinite",
                                }}
                            />
                        )}
                    </div>
                )}
                {/* {visibleCount < blogList.length && (
                    <div ref={observerRef} className="blogs-view-more-wrapper">
                        <span className="loading-blogs">Loading more blogs...</span>
                    </div>
                )} */}

            </div>
        </section>
    );
}
