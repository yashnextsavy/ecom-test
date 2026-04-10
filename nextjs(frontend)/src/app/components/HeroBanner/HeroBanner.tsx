"use client";

import React from "react";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { CgChevronRight } from "react-icons/cg";
import Image from "next/image";

type BannerImage = {
    url: string;
    alt: string;
};

type BannerItem = {
    id: string;
    image: BannerImage;
    brandLogo?: BannerImage;
    title: string;
    shortDescription?: string;
    description: string; // HTML string
    actualPrice: string;
    offerPrice: string;
    buttonTitle: string;
    buttonLink: string;
};

interface HeroBannerProps {
    bannerData?: BannerItem[];
}

const HeroBanner = ({ bannerData = [] }: HeroBannerProps) => {
    if (!bannerData.length) return null;

    return (
        <section className="hero_banner_wrapper">
            <Splide
                className="hero-bannner-slider"
                options={{
                    type: bannerData.length > 1 ? "loop" : "slide",
                    autoplay: bannerData.length > 1,
                    interval: 5000,
                    pauseOnHover: true,
                    drag: bannerData.length > 1,
                    swipe: bannerData.length > 1,
                    arrows: bannerData.length > 1,
                    pagination: bannerData.length > 1,
                }}
            >
                {bannerData.map((slide) => (
                    <SplideSlide key={slide.id}>
                        {/* Background Image */}
                        <img
                            className="contact-bg-image absolute right-0 top-0 bottom-0 z-0 h-full w-2/5 object-cover"
                            src={slide.image?.url}
                            alt={slide.image?.alt || "banner"}
                        />

                        <div className="contact-bg-image gradient absolute right-0 top-0 bottom-0 z-0 h-full w-2/5 object-cover">

                        </div>

                        {/* <div className="hero-banner-bg-gradient-image">

                        </div> */}

                        <Image
                            height={100}
                            width={500}
                            className="hero-banner-bg-gradient absolute right-0 top-0 bottom-0 z-0 h-full w-2/5 object-cover"
                            src="/assets/images/hero-bg-gradient.svg"
                            alt="hero-gradient"
                        />

                        <div className="container-custom mx-auto">
                            <div className="hero__slide">
                                <div className="hero__content">

                                    {
                                        slide?.brandLogo?.url && (
                                            <div className="icon-wrapper mb-5">
                                                <img alt={slide.brandLogo?.alt || ""} width={66} height={66} className="object-contain max-w-[74px] max-h-[74px]" src={slide?.brandLogo?.url || ""} />
                                            </div>
                                        )
                                    }


                                    <h1>{slide.title}</h1>

                                    {/* Description coming as HTML */}
                                    <div
                                        className="cta-trust-points mt-8"
                                        dangerouslySetInnerHTML={{ __html: slide.description }}
                                    />

                                    {slide.shortDescription && (
                                        <div
                                            className="hero__short-description mt-2 lg:mt-8 "
                                            dangerouslySetInnerHTML={{ __html: slide.shortDescription }}
                                        />
                                    )}

                                    {/* here */}

                                    <div className="hero__explore">
                                        <div className="hero__pricing relative">
                                            <div className="hero__actual__price">
                                                <h3>Actual Price</h3>
                                                <p>{slide.actualPrice}</p>
                                                <span>*Including GST</span>
                                            </div>

                                            <div className="hero__pricing-divider">
                                                <Image
                                                    fill
                                                    className="object-contain"
                                                    src="/assets/images/hero-price-banner-divider.svg"
                                                    alt="divider"
                                                />
                                            </div>

                                            <div className="hero__offer__price">
                                                <h3>Offer Price</h3>
                                                <p>{slide.offerPrice}</p>
                                                <span>*Including GST</span>
                                            </div>
                                        </div>

                                        <a
                                            href={`/voucher/${slide.buttonLink}`}
                                            className="btn-primary whitespace-nowrap"
                                        >
                                            {slide.buttonTitle}
                                            <span className="inline-button-arrow">
                                                <CgChevronRight className="primary-btn-first-arrow" />
                                                <CgChevronRight className="primary-btn-second-arrow" />
                                            </span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SplideSlide>
                ))}
            </Splide>
        </section>
    );
};

export default HeroBanner;
