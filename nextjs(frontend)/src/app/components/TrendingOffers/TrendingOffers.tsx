
'use client'

import { useState, useEffect } from "react";
import { CgChevronRight } from "react-icons/cg";
import { IoClose } from "react-icons/io5";
import CertificateCard from "../CertificateCard/CertificateCard";
import { OfferCategory } from "../DiscoverCertificates/DiscoverCertificates";
import Link from "next/link";




interface DiscoverCardsPocketProps {
    categories?: OfferCategory[];
    buttonLink?: string | null;
    buttonTitle?: string;
    trendingTitle?: string;
    trendingDescription?: string;
}

const TrendingOffers = ({
    categories = [],
    buttonLink,
    buttonTitle,
    trendingTitle,
    trendingDescription,
}: DiscoverCardsPocketProps) => {

    const [isTrendingPopUpOpen, setIsTrendingPopUpOpen] = useState(false);
    const [trendingCategories, setTrendingCategories] = useState<OfferCategory[]>(categories);

    const toggleTrendingPopUp = () => {
        setIsTrendingPopUpOpen(prev => !prev);
    };



    const openPopup = () => setIsTrendingPopUpOpen(true);
    const closePopup = () => setIsTrendingPopUpOpen(false);

    useEffect(() => {
        setTrendingCategories(categories);
    }, [categories]);

    useEffect(() => {
        const loadTrendingOffers = async () => {
            try {
                const res = await fetch("/api/trending-offers", { cache: "no-store" });
                if (!res.ok) return;

                const data = await res.json();
                const normalized: OfferCategory[] = (data?.product_categories || []).map((category: any) => ({
                    medusaCategoryId: category?.id,
                    name: category?.name,
                    handle: category?.handle,
                    offer_badge: category?.offer_badge_text || "",
                    media: category?.category_img
                        ? [{ id: `${category?.id}-img`, url: category?.category_img }]
                        : [],
                }));

                if (normalized.length > 0) {
                    setTrendingCategories(normalized);
                }
            } catch (error) {
                console.error("Failed to fetch trending offers:", error);
            }
        };

        loadTrendingOffers();
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") closePopup();
        };

        if (isTrendingPopUpOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleEsc);
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            window.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "auto";
        };
    }, [isTrendingPopUpOpen]);

    const cleanDescription = (html?: string) => {
        if (!html) return "";

        return html
            .replace(/<p>\s*<\/p>/g, "")
            .trim();
    };
    const safeDescription = cleanDescription(trendingDescription);

    return (
        <>
            <div className="discover-cards-wrapper w-full xl:w-1/3 flex justify-center xl:justify-end">
                <div className="discover-cards-pocket">
                    <div className="pocket-blur-layer" />

                    {/* {categories.map((card, index) => (
                        <CertificateCard
                            key={card.medusaCategoryId || index}
                            logo={card.media?.[0]?.url || "/assets/images/c-card-aws.webp"}
                            company={card.name || "Vendor"}
                            link={card.handle || "#"}
                            className={`c-card-${index + 1}`}
                        />
                    ))} */}

                    {trendingCategories.slice(0, 3).map((card, index) => (
                        <CertificateCard
                            key={card.medusaCategoryId || index}
                            logo={card.media?.[0]?.url || "/assets/images/c-card-aws.webp"}
                            company={card.name || "Vendor"}
                            link={card.handle || "#"}
                            className={`c-card-${index + 1}`}
                        />
                    ))}

                    <img
                        className="pocket-certificate-cards-cover"
                        src="/assets/images/pocket-cards-cover.svg"
                        alt="certificate cards cover"
                        width={385}
                        height={272}
                    />

                    <div className="card-offers">
                        <h3 className="bullet-point-blue">
                            {trendingTitle || "Trending Offers"}
                        </h3>
                        <div
                            dangerouslySetInnerHTML={{ __html: safeDescription }}
                        />
                    </div>

                    <div
                        onClick={toggleTrendingPopUp}
                        className="btn-primary whitespace-nowrap"
                    >
                        {buttonTitle}
                        <span className="inline-button-arrow">
                            <CgChevronRight className="primary-btn-first-arrow" />
                            <CgChevronRight className="primary-btn-second-arrow" />
                        </span>
                    </div>
                </div>
            </div>


            {/* <div
                onClick={closePopup}
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-250 z-40
                ${isTrendingPopUpOpen
                        ? "opacity-100 visible"
                        : "opacity-0 invisible"
                    }`}
            /> */}




            <div
                onClick={closePopup}
                className={`trending-popup-overlay ${isTrendingPopUpOpen ? "active" : ""
                    }`}
            />

            {/* Modal */}
            <div
                className={`trending-popup-wrapper-section ${isTrendingPopUpOpen ? "active" : ""}`}
            >




                <div
                    onClick={(e) => e.stopPropagation()}
                    className="trending-popup-wrapper w-[90%] max-w-3xl"
                >

                    <button
                        onClick={closePopup}
                        className="absolute top-4 right-4 text-xl hover:opacity-70 cursor-pointer"
                    >
                        <IoClose />
                    </button>

                    <h2 className="bullet-point-blue">
                        {trendingTitle || "Trending Offers"}
                    </h2>

                    {/* Your popup content here */}
                    <div className="trending-offer-grid-wrapper">
                        <div className="trending-offer-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* {dummyTrendingOffers.map((offer) => (
                                <Link href={offer?.handle || "#"}
                                    key={offer.id}
                                    className="trending-offer-item-wrapper"
                                >
                                    <div className="trending-offer-item">

                                        <div className="offer-item-information">
                                            <span className="block">
                                                upto {offer.discount} OFF
                                            </span>
                                            <div className="offer-item-title ">
                                                <h3>
                                                    {offer.name}

                                                </h3>
                                                <CgChevronRight />
                                            </div>
                                        </div>

                                        <div className="offer-item-card pop-image-card">

                                            <img
                                                src="/assets/images/c-card-aws.webp"
                                                alt="company logo"
                                                className="card-logo mobile-image"
                                            />

                                            <div className="hover-card-wrapper">


                                                <CertificateCard

                                                    logo={certificateCards?.[0].logo}
                                                    company={certificateCards[0].company}


                                                />

                                            </div>


                                        </div>

                                    </div>


                                </Link>
                            ))} */}







                            {trendingCategories.map((offer, index) => (
                                <Link
                                    href={`/voucher/${offer?.handle}` || "#"}
                                    key={offer.medusaCategoryId || index}
                                    className="trending-offer-item-wrapper"
                                >
                                    <div className="trending-offer-item">
                                        <div className="offer-item-information">
                                            <span className="block">
                                                {offer?.offer_badge || ""}
                                            </span>

                                            <div className="offer-item-title ">
                                                <h3>{offer.name}</h3>
                                                <CgChevronRight />
                                            </div>
                                        </div>

                                        <div className="offer-item-card pop-image-card">
                                            <img
                                                src={offer.media?.[0]?.url || "/assets/images/c-card-aws.webp"}
                                                alt={offer.name}
                                                className="card-logo mobile-image"
                                            />

                                            {/* <div className="hover-card-wrapper">
                                                <CertificateCard
                                                    logo={offer.media?.[0]?.url || "/assets/images/c-card-aws.webp"}
                                                    company={offer.name || "Vendor"}
                                                    link={offer.handle || "#"}
                                                />
                                            </div> */}
                                        </div>
                                    </div>
                                </Link>
                            ))}









                        </div>
                    </div>
                </div>
            </div>


        </>
    );
};

export default TrendingOffers;
