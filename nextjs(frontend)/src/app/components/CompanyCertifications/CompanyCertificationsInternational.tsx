
'use client';


import { useState, useEffect, useRef } from "react";
import '@splidejs/react-splide/css';
import { CgChevronRight, CgChevronDown } from 'react-icons/cg';
import Link from 'next/link';
import Image from 'next/image';
import { IoClose } from "react-icons/io5";




type ExamPrice = {
    id: string;
    title: string;
    examSeries: string;
    actualPrice: number;
    discountedPrice: number;
};

type CountryPricing = {
    country: string;
    currency: string;
    prices: ExamPrice[];
};





type ProductCategory = {
    id: string;
    name: string;
    handle: string;

    media?: {
        id: string;
        url: string;
    }[];

    offer_badge?: string;
    metadata?: {
        offer_badge_text?: string;
    };
};

interface CompanyCertificationsGridProps {
    certificationsGridData?: ProductCategory[];
    contactData?: {
        whatsappNumber?: string;
        callNumber?: string;
        email?: string;
    };
}

const CompanyCertificationsInternational = ({
    certificationsGridData = [],
    contactData,
}: CompanyCertificationsGridProps) => {

    const [isInternationalPopUpOpen, setIsInternationalPopUpOpen] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<CountryPricing | null>(null);

    const [internationalProducts, setInternationalProducts] = useState<any[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [countryPricing, setCountryPricing] = useState<CountryPricing[]>([]);
    const pricingRef = useRef<HTMLDivElement | null>(null);
    const [showBottomShadow, setShowBottomShadow] = useState(false); useEffect(() => {
        const el = pricingRef.current;
        if (!el) return;

        const handleScroll = () => {
            const isScrollable = el.scrollHeight > el.clientHeight;
            const isAtBottom =
                el.scrollTop + el.clientHeight >= el.scrollHeight - 10;

            setShowBottomShadow(isScrollable && !isAtBottom);
        };

        handleScroll(); // run once

        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
    }, [selectedCountry, isLoadingProducts]);

    const openPopup = (category: ProductCategory) => {
        setSelectedCategory(category);
        setSelectedCountry(null);
        setIsCountryOpen(false);
        setIsInternationalPopUpOpen(true);
    };

    const closePopup = () => {
        setIsInternationalPopUpOpen(false);

        setTimeout(() => {
            setSelectedCategory(null);
            setIsCountryOpen(false);
            setSelectedCountry(null);
            setCountryPricing([]);
        }, 350);
    };

    useEffect(() => {
        if (!selectedCategory?.handle) return;

        const fetchInternationalProducts = async () => {
            try {
                setIsLoadingProducts(true);

                const res = await fetch(
                    `/api/international-products?categorySlug=${selectedCategory.handle}`
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch products");
                }

                const data = await res.json();

                const products = data.products || [];

                if (!products.length) {
                    setCountryPricing([]);
                    return;
                }

                // const allCountries = products.flatMap(
                //     (product: any) => product.international_country_prices || []
                // );

                // // then deduplicate by country_name
                // const uniqueCountriesMap = new Map();

                // allCountries.forEach((country: any) => {
                //     if (!uniqueCountriesMap.has(country.country_name)) {
                //         uniqueCountriesMap.set(country.country_name, country);
                //     }
                // });

                // const uniqueCountries = Array.from(uniqueCountriesMap.values());

                const countries = products[0].international_country_prices.map(
                    (country: any) => {
                        return {
                            country: country.country_name,
                            currency: country.currency_name,
                            prices: products.map((product: any) => {
                                const productCountryPrice = product.international_country_prices?.find(
                                    (p: any) => p.country_name === country.country_name
                                );

                                return {
                                    id: product.id,
                                    title: product.title,
                                    examSeries: product.exam_series
                                        ?.map((s: any) => s.title)
                                        .join(", ") || "",
                                    actualPrice: productCountryPrice?.actual_price ?? 0,
                                    discountedPrice: productCountryPrice?.our_price ?? 0,
                                };
                            }),
                        };
                    }
                );

                setCountryPricing(countries);

                if (countries.length) {
                    setSelectedCountry(countries[0]);
                }
            } catch (error) {
                console.error("Error fetching international products:", error);
            } finally {
                setIsLoadingProducts(false);
            }
        };

        fetchInternationalProducts();
    }, [selectedCategory?.handle]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") closePopup();
        };

        if (isInternationalPopUpOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleEsc);
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            window.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "auto";
        };
    }, [isInternationalPopUpOpen]);

    const currencySymbols: Record<string, string> = {

        INR: "₹",
        USD: "$",
        CAD: "$",
        AUD: "$",
        EUR: "$",
        GBP: "$",
        JPY: "$",
        CNY: "$",
        SGD: "$",
        NZD: "$",
        CHF: "$",
        AED: "$",
        ZAR: "$",
        BRL: "$",
        MXN: "$",

    };



    if (!certificationsGridData.length) return null;

    return (

        <>
            <section className="cert-grid cert-grid-wrapper">
                <div className='container-custom mx-auto'>

                    {/* DESKTOP GRID */}
                    <div className="cert-grid__desktop">

                        {certificationsGridData.map((item) => {

                            const badgeText =
                                item.offer_badge ||
                                item.metadata?.offer_badge_text ||
                                '';
                            const selectedMedia = item?.media?.[0]?.url;
                            return (
                                <div
                                    onClick={() => openPopup(item)}
                                    key={item.id}
                                    className="cert-card"
                                >
                                    <div className="cert-card__inner">

                                        {badgeText && (
                                            <span className="cert-card__badge">
                                                {badgeText}
                                            </span>
                                        )}

                                        {/* Keeping image structure untouched */}
                                        <Image
                                            // src="/assets/images/company-certifications.svg"
                                            src={
                                                item.media?.[0]?.url ||
                                                ""}
                                            alt={item.name}
                                            width={250}
                                            height={90}
                                            unoptimized

                                        />

                                    </div>

                                    <div className="cert-card__cta">
                                        <span className="hidden! lg:flex! btn-primary small-btn whitespace-nowrap">
                                            Explore Vouchers
                                            <span className='inline-button-arrow'>
                                                <CgChevronRight className='primary-btn-first-arrow' />
                                                <CgChevronRight className='primary-btn-second-arrow' />
                                            </span>
                                        </span>

                                        <span className="btn-primary small-btn whitespace-nowrap lg:hidden!">
                                            Explore
                                            <span className='inline-button-arrow'>
                                                <CgChevronRight className='primary-btn-first-arrow' />
                                                <CgChevronRight className='primary-btn-second-arrow' />
                                            </span>
                                        </span>
                                    </div>

                                </div>
                            );
                        })}

                    </div>
                </div>
            </section>




            {/* Overlay */}
            <div
                onClick={closePopup}
                className={`international-popup-overlay ${isInternationalPopUpOpen ? "active" : ""
                    }`}
            />

            {/* Modal */}
            <div
                className={`international-popup-wrapper-section ${isInternationalPopUpOpen ? "active" : ""
                    }`}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="international-popup-wrapper"
                >
                    {/* Close Button */}
                    <button
                        onClick={closePopup}
                        className="international-popup-close"
                    >
                        <IoClose />
                    </button>

                    {/* Title */}
                    <h2 className="international-popup-title">
                        {selectedCategory?.name} Exam Voucher
                    </h2>

                    {/* Country Dropdown */}

                    {countryPricing.length > 0 && (
                        <div className="international-country-dropdown">
                            <div
                                className="international-country-selected"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsCountryOpen(!isCountryOpen);
                                }}
                            >
                                <span>{selectedCountry?.country ?? "Select Country"}</span>
                                <CgChevronDown
                                    className={`dropdown-arrow ${isCountryOpen ? "rotate" : ""}`}
                                />
                            </div>

                            {isCountryOpen && (
                                <div className="international-country-menu">
                                    {countryPricing.map((countryObj) => (
                                        <div
                                            key={countryObj.country}
                                            className="international-country-item-wrapper"
                                            onClick={() => {
                                                setSelectedCountry(countryObj);
                                                setIsCountryOpen(false);
                                            }}
                                        >
                                            <div className="international-country-item">
                                                {countryObj.country}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content Section */}
                    <div className="international-popup-content">

                        {/* Left Logo */}
                        <div className="international-popup-logo">
                            <img
                                src={
                                    selectedCategory?.media?.[0]?.url || "/assets/images/company-certifications1.svg"
                                }
                                alt={selectedCategory?.name}
                                width={150}
                                height={80}
                            />
                        </div>

                        {/* Right Pricing */}
                        <div
                            ref={pricingRef}


                            className="international-popup-pricing">
                            {isLoadingProducts ? (
                                <p>Loading pricing...</p>
                            ) : selectedCountry?.prices?.length ? (
                                selectedCountry.prices.map((exam) => (
                                    <div key={exam.id} className="international-pricing-item">

                                        <h3>{exam.title}</h3>

                                        <p>
                                            Valid for exam series:
                                        </p>
                                        <h5> {exam.examSeries}</h5>

                                        <div className="international-pricing-values">

                                            <div className="price-old">
                                                <p>Actual Price</p>
                                                <span>
                                                    {currencySymbols[selectedCountry.currency] ?? selectedCountry.currency}
                                                    {exam.actualPrice}
                                                </span>
                                            </div>

                                            <div className="price-new">
                                                <p>Offer Price</p>
                                                <span>
                                                    {currencySymbols[selectedCountry.currency] ?? selectedCountry.currency}
                                                    {exam.discountedPrice}
                                                </span>

                                            </div>
                                        </div>
                                    </div>)
                                )) : (
                                <p className="flex justify-center items-center h-full">No Vouchers available</p>
                            )}
                        </div>
                        {selectedCountry?.prices?.length && (
                            <div className="international-drawer-scroll-shadow" />
                        )}

                    </div>

                    {/* Bottom CTA */}


                    <div className="international-popup-footer">
                        <Link
                            href={`https://wa.me/${contactData?.whatsappNumber?.replace(/[^0-9]/g, '')}`}
                            // href={`https://wa.me/${buttonLink}`}
                            // target={openInNewTabPrimary ? "_blank" : "_self"}
                            target="_blank"

                            rel="noopener noreferrer"
                            className="btn-primary whitespace-nowrap"
                        >
                            {/* {buttonText} */}
                            Connect via WhatsApp
                            <span className="inline-button-arrow">
                                <CgChevronRight className="primary-btn-first-arrow" />
                                <CgChevronRight className="primary-btn-second-arrow" />
                            </span>
                        </Link>
                        <Link

                            href={`tel:${contactData?.callNumber}`}
                            // target={openInNewTabSecondary ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            className="secondary-btn-link inline-flex justify-center items-center"
                        >

                            {/* {buttonTwoText} */}
                            CALL OUR EXPERTS
                            <span className="secondary-link-arrow">
                                <CgChevronRight />
                            </span>
                        </Link>

                    </div>
                </div>
            </div>

        </>


    );
};

export default CompanyCertificationsInternational;