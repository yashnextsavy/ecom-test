import { PopularBlogItem, PopularBlogsSection } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'
import { CgChevronRight } from 'react-icons/cg';

export type BlogProvider = {
  name: string;
  logo: string;
};

export type BlogItem = {
  id: string;
  title: string;
  date: string;
  image: string;
  provider: BlogProvider;
  slug: string;
};



interface Props {
  popularBlogsData?: PopularBlogsSection;
  popularBlogsList?: PopularBlogItem[];

}

const UsefulBlogs = ({ popularBlogsData, popularBlogsList }: Props) => {
  return (
    <section className="common__blogs-wrapper">
      <div className="container-custom mx-auto">
        <div className="common__home-blogs__layout">

          <div className="common__blogs__intro">
            <h2>{popularBlogsData?.title}</h2>
            <p>{popularBlogsData?.description}</p>

            <Link
              href={popularBlogsData?.popularBlogsButtonLink || "#"}
              target={popularBlogsData?.openInNewTab ? "_blank" : "_self"}
              rel={popularBlogsData?.openInNewTab ? "noopener noreferrer" : undefined}
              className="btn-primary whitespace-nowrap"
            >
              {popularBlogsData?.popularBlogsButtonText}
              <span className='inline-button-arrow'>
                <CgChevronRight className='primary-btn-first-arrow' />
                <CgChevronRight className='primary-btn-second-arrow' />
              </span>
            </Link>
          </div>

          {/* <div className="common__blogs__grid">
            {blogsData.map((blog) => (
              <Link href="#" key={blog.id} className="common__blog-card">
                <div className="common__blog-card__image">
                  <img src={blog.image} alt={blog.title} />


                  <div className="common__blog-card__content">
                    <div className='common__blog-card__provider__wrapper' >
                      <div className='common__blog-card-date'> <time>{blog.date}</time></div>
                      <div className="common__blog-card__provider">

                        <img

                          src={blog.provider.logo}
                          alt={blog.provider.name}
                        />

                      </div>
                    </div>
                    <h3>{blog.title}</h3>

                  
                  </div >


                </div>
                <div className='common__blog-card__link'>
                  <div className="secondary-btn-link inline-flex  justify-center items-center ">
                    Call our experts <span className='secondary-link-arrow'> <CgChevronRight /></span>
                  </div>
                </div>


              </Link>
            )
            )}
          </div> */}

          <div className="common__blogs__grid">
            {popularBlogsList?.map((blog, index) => {
              const image =
                blog.listingImage?.url ||
                blog.featuredImage?.url ||
                "/assets/images/common-blogs-1.webp";

              const provider = blog.categories?.[0];
              const providerLogo = provider?.imageUrl;

              return (
                <Link
                  href={`/blogs/${blog.slug}`}
                  key={blog.slug || index}
                  className="common__blog-card"
                >
                  <div className="common__blog-card__image">
                    <Image className='blog-title-image' width={420} height={260} src={image} alt={blog.title} unoptimized={true} />

                    <div className="common__blog-card__content">
                      <div className="common__blog-card__provider__wrapper">

                        {/* Date */}
                        <div className="common__blog-card-date">
                          <time>
                            {new Date(blog.publishedAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </time>
                        </div>

                        {/* Provider Logo */}
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
    </section>

  )
}

export default UsefulBlogs
