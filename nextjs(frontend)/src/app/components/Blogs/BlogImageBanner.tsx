import Image from "next/image";
import React from "react";

type BlogImageBannerProps = {
    title?: string;
    companyLogo?: string;
    personImage?: string;
};

const defaultBannerData = {
    title:
        "How to Save Money on Salesforce Certification Exam Vouchers: The Complete Guide",
    companyLogo: "/assets/images/company-certifications.svg",
    personImage: "/assets/images/about-hero.svg",
};

export default function BlogImageBanner({
    title,
    companyLogo,
    personImage,
}: BlogImageBannerProps) {
    const bannerTitle = title || defaultBannerData.title;
    const logo = companyLogo || defaultBannerData.companyLogo;
    const image = personImage || defaultBannerData.personImage;

    return (
        <section className="blog-image-banner-wrapper">
            <div className="container-custom mx-auto">
                <div className="blog-image-banner__wrapper">

                    <Image
                        src={image}
                        alt="Blog Banner"
                        className="blog-image-banner__image1 cover "
                        unoptimized
                        // style={'zIndex:2;'}
                        fill
                    />

                    {/* Decorative blocks – left */}

                    {/* <img
                        alt="Background shapes"
                        className="contact-bg-image absolute left-0 top-0 bottom-0 z-0 h-full"
                        src="/assets/images/cta-voucher-left.svg"
                    /> */}


                    {/* Decorative blocks – right */}


                    {/* <img
                        alt="Background shapes"
                        className="contact-bg-image absolute right-0 top-0 bottom-0 z-0 h-full"
                        src="/assets/images/cta-voucher-right.svg"
                    /> */}


                    {/* LEFT CONTENT */}
                    {/* <div className="blog-image-banner__content">
                        <img
                            src={logo}
                            alt="Company Logo"
                            className="blog-image-banner__logo"
                        />

                        <h2 className="blog-image-banner__title">
                            {bannerTitle}
                        </h2>
                    </div> */}

                    {/* RIGHT IMAGE WITH CURVE */}

                    {/* <div className="blog-image-banner__image-wrapper">
                        <img
                            src={image}
                            alt="Blog Banner"
                            className="blog-image-banner__image"

                        />
                    </div> */}
                </div>
            </div>
        </section>
    );

}


