'use client';
import { useState } from "react";

import Image from "next/image";
import { FaCircleCheck } from "react-icons/fa6";
import EnquireForm from "../Forms/EnquiryForm";
import BrandsMarquee from "../BrandsMarquee/BrandsMarquee";
import TrendingOffers from "../TrendingOffers/TrendingOffers";
import InformationsPopup from "../InformationsPopup/InformationsPopup";
import { useCart } from "@/app/context/CartContext"


type ExamSeries = {
    id: string
    title: string
    description?: string
}

type ProductDetailsBannerProps = {
    title?: string
    logo?: string
    actualPrice?: string | number
    ourPrice?: string | number
    discount?: number
    examSeries?: ExamSeries[]
    validity?: {
        title?: string
        description?: string
    }
    delivery?: {
        title?: string
        description?: string
    }
    additional?: {
        title?: string
        description?: string
    }
    description?: string
    CategoryDataa?: {
        product_categories?: any[]
    }
    region_id?: string
    sales_channel_id?: string
    variant_id?: string
    categories?: any[];
    fallbackDescription?: string
    trendingOffersSection?: {
        sectionInfo?: {
            title?: string,
            description?: string,
            buttonText?: string,
        }
    }
    isOutOfStock?: boolean;
}

const ProductDetailsBanner = ({
    title = "",
    logo,
    actualPrice = 0,
    ourPrice = 0,
    discount = 0,
    examSeries = [],
    description,
    fallbackDescription,
    validity,
    delivery,
    additional,
    CategoryDataa,
    region_id,
    sales_channel_id,
    variant_id,
    categories = [],
    trendingOffersSection,
    isOutOfStock,

}: ProductDetailsBannerProps) => {

    const [openId, setOpenId] = useState<number | null>(null);
    const [activeExamId, setActiveExamId] = useState<number>(0);

    const { openCart, setCart } = useCart()
    const [loading, setLoading] = useState(false)


    console.log("PRODUCT DETAILS DATA 2387438274637824678326478", {
        title,
        logo,
        actualPrice,
        ourPrice,
        discount,
        examSeries,
        region_id,
        sales_channel_id,
        variant_id
    })

    const cleanHTML = (html?: string) => {
        if (!html) return ""

        const stripped = html.replace(/<[^>]*>/g, "").trim()

        return stripped ? html : ""
    }

    const safeHTML = (html?: string) => {
        if (!html) return ""

        const text = html.replace(/<[^>]*>/g, "").trim()
        return text ? html : ""
    }

    function getCartId(): string | null {
        const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("cart_id="))
            ?.split("=")[1]

        return cookie || localStorage.getItem("cart_id")
    }

    function saveCartId(cartId: string) {
        localStorage.setItem("cart_id", cartId)
        document.cookie = `cart_id=${cartId}; path=/; max-age=2592000`
    }

    function clearCartId() {
        localStorage.removeItem("cart_id")
        document.cookie = "cart_id=; path=/; max-age=0"
    }

    async function validateCart(cartId: string) {
        try {
            const res = await fetch(`/api/cart/get?cart_id=${cartId}`)
            if (!res.ok) return null

            const data = await res.json()
            const cart = data?.cart
            const itemsCount = Array.isArray(cart?.items) ? cart.items.length : 0
            const isCompleted = Boolean(cart?.completed_at)
            const isUsable = Boolean(cart?.id) && !isCompleted && itemsCount > 0

            return isUsable ? cart : null
        } catch {
            return null
        }
    }


    const [popupData, setPopupData] = useState<{
        title?: string
        description?: string
    } | null>(null)


    const handleAddToCart = async () => {
        if (isOutOfStock) return;

        let cartId = getCartId()

        setLoading(true)

        try {
            let res
            let cart = null

            if (cartId) {
                cart = await validateCart(cartId)

                if (!cart) {
                    clearCartId()
                    cartId = null
                }
            }

            if (!cart) {
                res = await fetch("/api/cart/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        region_id,
                        sales_channel_id,
                        variant_id
                    })
                })

                if (!res.ok) throw new Error("Cart creation failed")

                const data = await res.json()

                if (!data?.cart?.id) {
                    console.error("Invalid cart response:", data)
                    return
                }

                const createdCartId = data.cart.id
                cartId = createdCartId

                saveCartId(createdCartId)

                if (data?.cart) setCart(data.cart)

            } else {
                res = await fetch("/api/cart/add-item", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cart_id: cartId,
                        variant_id
                    })
                })

                if (!res.ok) throw new Error("Add item failed")

                const data = await res.json()

                if (data?.cart) setCart(data.cart)
            }

            openCart()

        } catch (error) {
            console.error("Add to cart error:", error)
            clearCartId()
            setCart(null)
        } finally {
            setLoading(false)
        }
    }


    const parsePrice = (value: string | number | undefined): number => {
        if (!value) return 0;

        if (typeof value === "number") return value;

        // remove commas, spaces, currency symbols
        const cleaned = value.replace(/[^0-9.]/g, "");

        return Number(cleaned) || 0;
    };


    const actual = parsePrice(actualPrice);
    const selling = parsePrice(ourPrice);

    const hasDiscount = actual > selling;


    const formatPrice = (value: number) => {
        if (!value || isNaN(value)) return "₹0";

        return `₹${new Intl.NumberFormat("en-IN").format(Math.round(value))}`;
    };

    return (
        <>
            <section className='product-details-banner-wrapper'>

                <div className='container-custom mx-auto'>
                    <div className='product-details-wrapper'>

                        <div className='product-details-overview-wrapper'>

                            <div className='product-details-overview-content'>

                                {/* left nav with accordian */}
                                <div className='product-card-meta-info-wrapper hide-small-desktop'>

                                    <div className='product-meta-card'>
                                        <div className="product-card-wrapper">
                                            <div className="product-card-body">

                                                {Number(discount) > 0 && (
                                                    <div className="product-card-discount-tag">
                                                        <span>{discount}% OFF</span>
                                                    </div>
                                                )}

                                                {/* Image Section */}
                                                <div className="product-card-hero">
                                                    <div className="product-card-image-wrapper">
                                                        <img
                                                            className="object-contain"
                                                            src={logo}
                                                            alt="company"
                                                            width={210}
                                                            height={77}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Bottom Content */}
                                                <div className="product-card-main-content">
                                                    <div className="product-card-title-heading-p-details">
                                                        {title}
                                                    </div>

                                                    <div className="product-price-card">
                                                        {/* <div className="card-product-price-wrapper">
                                                            <div className="card-product-price product-price-actual-price">
                                                                <p>Actual price</p>
                                                                <h3>₹{actualPrice}</h3>
                                                            </div>

                                                            <div className="card-product-price product-price-discounted-price">
                                                                <p>Discounted price</p>
                                                                <h3>₹{ourPrice}</h3>
                                                            </div>
                                                        </div> */}

                                                        <div
                                                            className={"price-wrapper"}
                                                        >
                                                            {
                                                                hasDiscount ? (
                                                                    <div className="card-product-price-wrapper">
                                                                        <div className="card-product-price product-price-actual-price">
                                                                            <p>Actual price</p>
                                                                            <h3 >
                                                                                {formatPrice(actual)}
                                                                            </h3>

                                                                        </div>

                                                                        <div className="card-product-price product-price-discounted-price">
                                                                            <p>Discounted price</p>
                                                                            <h3>
                                                                                {formatPrice(selling)}
                                                                            </h3>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <div className="card-product-price-wrapper no-discount">
                                                                            <div className="card-product-price product-price-discounted-price">
                                                                                <p>Voucher Price</p>
                                                                                <h3>₹{actualPrice}</h3>
                                                                            </div>
                                                                        </div>

                                                                    </>


                                                                )}
                                                        </div>

                                                        <span className="price-terms-quote">
                                                            *The above-quoted prices are inclusive of GST.
                                                        </span>

                                                        <div className="product-card-buttons-wrapper">
                                                            {/* <div className="card-button-primary primary-color-btn ">
                                                                Add to cart test
                                                            </div> */}


                                                            {/* <div
                                                                className="card-button-primary primary-color-btn"
                                                                onClick={handleAddToCart}

                                                                style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                                                            > */}
                                                            <div
                                                                className={`card-button-primary primary-color-btn ${isOutOfStock ? "out-of-stock-btn" : ""
                                                                    }`}
                                                                onClick={handleAddToCart}
                                                                style={{
                                                                    cursor: loading || isOutOfStock ? "not-allowed" : "pointer",
                                                                    opacity: loading || isOutOfStock ? 0.7 : 1
                                                                }}
                                                            >
                                                                {loading ? (
                                                                    <div
                                                                        style={{
                                                                            width: "18px",
                                                                            height: "18px",
                                                                            border: "2px solid #fff",
                                                                            borderTop: "2px solid #23408B",
                                                                            borderRadius: "50%",
                                                                            animation: "spin 0.8s linear infinite",
                                                                            margin: "0 auto"
                                                                        }}
                                                                    />
                                                                ) : isOutOfStock ? (
                                                                    "Out of Stock"
                                                                ) : (
                                                                    "Add to cart"
                                                                )}
                                                            </div>


                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='product-meta-accordian-wrapper'>

                                        <div className="faq-list">

                                            {validity?.title && validity?.description && (
                                                <div className={`faq-item ${openId === 1 ? 'open' : ''}`}>
                                                    <button
                                                        className="faq-question"
                                                        onClick={() =>
                                                            setPopupData({
                                                                title: validity?.title,
                                                                description: validity?.description
                                                            })
                                                        }
                                                    >
                                                        <span>{validity?.title}</span>
                                                        <span className={`faq-icon ${openId === 1 ? 'open' : ''}`}>+</span>
                                                    </button>

                                                    {/* <div className="faq-answer">
                                                        <div
                                                            dangerouslySetInnerHTML={{
                                                                __html: cleanHTML(validity?.description) || ""
                                                            }}
                                                        />
                                                    </div> */}
                                                </div>
                                            )}

                                            {delivery?.title && delivery?.description && (
                                                <div className={`faq-item ${openId === 2 ? 'open' : ''}`}>
                                                    <button
                                                        className="faq-question"
                                                        onClick={() =>
                                                            setPopupData({
                                                                title: delivery?.title,
                                                                description: delivery?.description
                                                            })
                                                        }
                                                    >
                                                        <span>{delivery?.title}</span>
                                                        <span className={`faq-icon ${openId === 2 ? 'open' : ''}`}>+</span>
                                                    </button>

                                                    {/* <div className="faq-answer">
                                                        <div dangerouslySetInnerHTML={{ __html: delivery?.description || "" }} />
                                                    </div> */}
                                                </div>
                                            )}

                                            {additional?.title && additional?.description && (
                                                <div className={`faq-item ${openId === 3 ? 'open' : ''}`}>
                                                    <button
                                                        className="faq-question"
                                                        onClick={() =>
                                                            setPopupData({
                                                                title: additional?.title,
                                                                description: additional?.description
                                                            })
                                                        }
                                                    >
                                                        <span>{additional?.title}</span>
                                                        <span className={`faq-icon ${openId === 3 ? 'open' : ''}`}>+</span>
                                                    </button>

                                                    {/* <div className="faq-answer">
                                                        <div dangerouslySetInnerHTML={{ __html: additional?.description || "" }} />
                                                    </div> */}
                                                </div>
                                            )}

                                        </div>
                                    </div>


                                </div>
                                {/* overview title with exam list */}
                                <div className='product-hero-info-wrapper'>
                                    <div className='product-hero-title'>
                                        {/* <h1>  Associate CCNA/CCNP Concentration Specialist Exam </h1> */}
                                        <h1>{title}</h1>
                                    </div>
                                    {/* <div className='product-exam-series'>
                                        <p>valid for exam: </p>


                                        <div className='product-exam-series-list'>
                                            {examSeries.map((exam, index) => (
                                                <div
                                                    key={exam.id}
                                                    className={`exam-title ${activeExamId === index ? 'selected-exam' : ''}`}
                                                    onClick={() => setActiveExamId(index)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <span><FaCircleCheck /></span>
                                                    {exam.title}
                                                </div>
                                            ))}
                                        </div>


                                    </div>
                                    <div
                                        className="product-hero-description"
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                safeHTML(examSeries?.[activeExamId]?.description) ||
                                                "<p>No description available.</p>"
                                        }}
                                    /> */}
                                    {examSeries.length > 0 ? (
                                        <>
                                            <div className='product-exam-series'>
                                                <p>valid for exam: </p>

                                                <div className='product-exam-series-list'>
                                                    {examSeries.map((exam, index) => (
                                                        <div
                                                            key={exam.id}
                                                            className={`exam-title ${activeExamId === index ? 'selected-exam' : ''}`}
                                                            onClick={() => setActiveExamId(index)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <span><FaCircleCheck /></span>
                                                            {exam.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div
                                                className="product-hero-description"
                                                dangerouslySetInnerHTML={{
                                                    __html:
                                                        safeHTML(examSeries?.[activeExamId]?.description) ||
                                                        "<p>No description available</p>"
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <div
                                            className="product-hero-description"
                                            dangerouslySetInnerHTML={{
                                                __html:
                                                    safeHTML(fallbackDescription) ||
                                                    "<p>No description available</p>"
                                            }}
                                        />
                                    )}

                                </div>
                            </div>


                            <div className='enquire-form-wrapper hide-small-desktop'>

                                <EnquireForm categories={categories} />

                            </div>

                        </div>

                    </div>

                    <div className="details-card-form-stack">
                        <div className='product-details-overview-content'>
                            <div className='product-card-meta-info-wrapper'>
                                <div className='product-meta-card'>
                                    <div className="product-card-wrapper">
                                        <div className="product-card-body">
                                            {Number(discount) > 0 && (
                                                <div className="product-card-discount-tag">
                                                    <span>{discount}% OFF</span>
                                                </div>
                                            )}
                                            <div className="product-card-hero">
                                                <div className="product-card-image-wrapper">
                                                    <img
                                                        className="object-contain"
                                                        src={logo || "abc"}
                                                        alt="company"
                                                        width={210}
                                                        height={77}
                                                    />
                                                </div>
                                            </div>
                                            <div className="product-card-main-content">
                                                <div className="product-card-title-heading-p-details">
                                                    {title}
                                                </div>

                                                <div className="product-price-card">
                                                    {/* <div className="card-product-price-wrapper">
                                                        <div className="card-product-price product-price-actual-price">
                                                            <p>Actual price</p>
                                                            <h3>₹{actualPrice}</h3>
                                                        </div>

                                                        <div className="card-product-price product-price-discounted-price">
                                                            <p>Discounted price</p>
                                                            <h3>₹{ourPrice}</h3>
                                                        </div>
                                                    </div> */}

                                                    <div
                                                        className={"price-wrapper"}
                                                    >
                                                        {
                                                            hasDiscount ? (
                                                                <div className="card-product-price-wrapper">
                                                                    <div className="card-product-price product-price-actual-price">
                                                                        <p>Actual price</p>
                                                                        <h3>₹{actualPrice}</h3>
                                                                    </div>

                                                                    <div className="card-product-price product-price-discounted-price">
                                                                        <p>Discounted price</p>
                                                                        <h3>₹{ourPrice}</h3>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="card-product-price-wrapper no-discount">
                                                                        <div className="card-product-price product-price-discounted-price">
                                                                            <p>Voucher Price</p>
                                                                            <h3>₹{actualPrice}</h3>
                                                                        </div>
                                                                    </div>

                                                                </>


                                                            )}
                                                    </div>



                                                    <span className="price-terms-quote">
                                                        *The above-quoted prices are inclusive of GST.
                                                    </span>

                                                    <div className="product-card-buttons-wrapper">
                                                        {/* <div
                                                            className="card-button-primary primary-color-btn"
                                                            onClick={handleAddToCart}

                                                            style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                                                        >
                                                            {loading ? (
                                                                <div
                                                                    style={{
                                                                        width: "18px",
                                                                        height: "18px",
                                                                        border: "2px solid #fff",
                                                                        borderTop: "2px solid #23408B",
                                                                        borderRadius: "50%",
                                                                        animation: "spin 0.8s linear infinite",
                                                                        margin: "0 auto"
                                                                    }}
                                                                />
                                                            ) : (
                                                                "Add to cart"
                                                            )}
                                                        </div> */}
                                                        <div
                                                            className={`card-button-primary primary-color-btn ${isOutOfStock ? "out-of-stock-btn" : ""
                                                                }`}
                                                            onClick={handleAddToCart}
                                                            style={{
                                                                cursor: loading || isOutOfStock ? "not-allowed" : "pointer",
                                                                opacity: loading || isOutOfStock ? 0.7 : 1
                                                            }}
                                                        >
                                                            {loading ? (
                                                                <div
                                                                    style={{
                                                                        width: "18px",
                                                                        height: "18px",
                                                                        border: "2px solid #fff",
                                                                        borderTop: "2px solid #23408B",
                                                                        borderRadius: "50%",
                                                                        animation: "spin 0.8s linear infinite",
                                                                        margin: "0 auto"
                                                                    }}
                                                                />
                                                            ) : isOutOfStock ? (
                                                                "Out of Stock"
                                                            ) : (
                                                                "Add to cart"
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='product-meta-accordian-wrapper'>
                                    <div className="faq-list">

                                        {validity?.title && validity?.description && (
                                            <div className={`faq-item ${openId === 1 ? 'open' : ''}`}>
                                                <button
                                                    className="faq-question"
                                                    onClick={() =>
                                                        setPopupData({
                                                            title: validity?.title,
                                                            description: validity?.description
                                                        })
                                                    }
                                                >
                                                    <span>Validity Information</span>
                                                    <span className={`faq-icon ${openId === 1 ? 'open' : ''}`}>+</span>
                                                </button>

                                                {/* <div className="faq-answer">
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: cleanHTML(validity?.description) || ""
                                                        }}
                                                    />
                                                </div> */}
                                            </div>
                                        )}

                                        {delivery?.title && delivery?.description && (
                                            <div className={`faq-item ${openId === 2 ? 'open' : ''}`}>
                                                <button
                                                    className="faq-question"
                                                    onClick={() =>
                                                        setPopupData({
                                                            title: delivery?.title,
                                                            description: delivery?.description
                                                        })
                                                    }
                                                >
                                                    <span>Delivery Information</span>
                                                    <span className={`faq-icon ${openId === 2 ? 'open' : ''}`}>+</span>
                                                </button>

                                                {/* <div className="faq-answer">
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: delivery?.description || ""
                                                        }}
                                                    />
                                                </div> */}
                                            </div>
                                        )}

                                        {additional?.title && additional?.description && (
                                            <div className={`faq-item ${openId === 3 ? 'open' : ''}`}>
                                                <button
                                                    className="faq-question"
                                                    onClick={() =>
                                                        setPopupData({
                                                            title: additional?.title,
                                                            description: additional?.description
                                                        })
                                                    }
                                                >
                                                    <span>Additional Information</span>
                                                    <span className={`faq-icon ${openId === 3 ? 'open' : ''}`}>+</span>
                                                </button>

                                                {/* <div className="faq-answer">
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: additional?.description || ""
                                                        }}
                                                    />
                                                </div> */}
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='enquire-form-wrapper'>
                            <EnquireForm categories={categories} />
                        </div>
                    </div>
                </div>

            </section>


            <section className="product-details-body-wrapper">
                <div className="container-custom mx-auto">
                    <div className="product-details-body">
                        <div className="product-details-body-content-wrapper">


                            <div
                                className="product-details-body-content"
                                dangerouslySetInnerHTML={{
                                    __html:
                                        safeHTML(description)
                                            ? safeHTML(description)
                                            : `<div class="product-details-body-content-wrapper">
                                        <div class="product-details-body-content">
                                            <h2>No information found</h2>
                                            <p>No info available at this moment, please try again later.</p>
                                        </div>
                                   </div>`
                                }}
                            />




                        </div>
                        <span className="details-page-divider">
                        </span>
                        <div className="product-details-body-cards">




                            <TrendingOffers
                                categories={CategoryDataa?.product_categories || []}
                                trendingTitle={trendingOffersSection?.sectionInfo?.title}
                                buttonTitle={trendingOffersSection?.sectionInfo?.buttonText}
                                trendingDescription={trendingOffersSection?.sectionInfo?.description}
                            />



                            <BrandsMarquee edgeShadow
                                brandsData={CategoryDataa?.product_categories || []}
                            />


                        </div>


                    </div>

                </div>
            </section>

            <InformationsPopup
                isOpen={popupData !== null}
                title={popupData?.title}
                description={popupData?.description}
                onClose={() => setPopupData(null)}
            />
        </>
    )
}

export default ProductDetailsBanner
