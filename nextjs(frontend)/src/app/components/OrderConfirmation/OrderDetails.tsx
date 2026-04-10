'use client'

import { useState, useEffect } from 'react';
import InformationsPopup from "@/app/components/InformationsPopup/InformationsPopup";
import { useCheckout } from "@/app/context/CheckoutContext";
import { formatPrice } from "@/lib/utils/formatPrice";


const OrderDetails = () => {

    const { checkoutData } = useCheckout()

    const [localOrder, setLocalOrder] = useState<any>(null)
    const [popupData, setPopupData] = useState<{
        title: string
        description: string
        emailLink?: string
        phoneLink?: string
        whatsappLink?: string
    } | null>(null)

    const order = checkoutData?.order || localOrder
    const isLoading = !order
    const items = order?.items || []





    useEffect(() => {
        if (order?.items) {

            order.items.forEach((item: any, i: number) => {
                console.log(`ITEM ${i} 👉`, item)
            })
        }
    }, [order])


    useEffect(() => {
        if (!checkoutData?.order) {
            const stored = localStorage.getItem("checkout_data")
            if (stored) {
                try {
                    const parsed = JSON.parse(stored)
                    setLocalOrder(parsed?.order)
                } catch {
                    console.error("Invalid checkout_data")
                }
            }
        }
    }, [checkoutData])

    const finalTotal = order?.total ?? 0
    const subtotal = order?.subtotal ?? 0
    const tax = order?.tax_total ?? 0


    const savings =
        order?.items?.reduce((acc: number, item: any) => {
            const discount = item?.pricing?.discount_amount ?? 0
            const quantity = item?.quantity ?? 1
            return acc + (discount * quantity)

        }, 0) ?? 0


    return (
        <>
            <div className={`checkout-summary ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>

                <div className='checkout-summary-heading'>
                    <h2>Order Summary</h2>
                </div>

                <div className="checkout-summary-list">

                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="checkout-summary-item flex gap-3">
                                <div className="w-[100px] h-[90px] rounded-md bg-gray-400 animate-pulse"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-400 rounded w-full mb-2 animate-pulse"></div>
                                    <div className="h-4 bg-gray-400 rounded w-1/2 animate-pulse"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        items.map((item: any) => {
                            const image =
                                item?.categories?.[0]?.img_url ||
                                "/assets/images/company-certifications2.svg"

                            const discount = item?.pricing?.discount_amount ?? 0
                            const finalPrice = item?.unit_price ?? 0
                            const originalPrice = finalPrice + discount



                            return (
                                <div key={item.id} className="checkout-summary-item">
                                    <div className="checkout-summary-item-img-wrapper">
                                        <img src={image} alt={item.product_title} />
                                        <span className="checkout-summary-item-qty">
                                            {item.quantity}
                                        </span>
                                    </div>

                                    <div className="checkout-summary-item-content thankyou-page">
                                        <p className="checkout-summary-item-title">
                                            {item.product_title || item.product_description}
                                        </p>


                                        <div className="cart-item-price">
                                            {/* <div className="cart-item-discounted-price">
                                                ₹{formatPrice(item.unit_price)}
                                            </div> */}
                                            <div className="checkout-summary-item-price">
                                                {discount > 0 ? (
                                                    <>
                                                        <span className="discounted-price checkout">
                                                            ₹{formatPrice(finalPrice)}
                                                        </span>

                                                        <span className="original-price checkout">
                                                            ₹{formatPrice(originalPrice)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span>
                                                        ₹{formatPrice(finalPrice)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}

                </div>

                <div className="checkout-summary-pricing thankyou-page">
                    {isLoading ? (
                        <>
                            <div className="checkout-summary-row flex justify-between">
                                <div className="h-4 w-24 bg-gray-400 rounded animate-pulse"></div>
                                <div className="h-4 w-16 bg-gray-400 rounded animate-pulse"></div>
                            </div>

                            <div className="checkout-summary-row flex justify-between">
                                <div className="h-4 w-20 bg-gray-400 rounded animate-pulse"></div>
                                <div className="h-4 w-16 bg-gray-400 rounded animate-pulse"></div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="checkout-summary-row">
                                <div>Total Price</div>
                                <div>₹{formatPrice(subtotal)}</div>
                            </div>

                            <div className="checkout-summary-row">
                                <div>GST - 18%</div>
                                <div>₹{formatPrice(tax)}</div>
                            </div>
                        </>
                    )}
                </div>

                {savings > 0 && (
                    <div className="cart-summary-saved thankyou-page">
                        <div className="inline-flex gap-2 whitespace-nowrap">
                            <img src="/assets/images/confetti.svg" alt="confetti" />
                            You Saved With Us!
                        </div>
                        <strong>₹{formatPrice(savings)}</strong>
                    </div>
                )}

                <div className="checkout-summary-total thankyou-page">
                    <div>Grand Total</div>
                    <div className='checkout-total-amount'>
                        {isLoading ? (
                            <div className="h-5 w-24 bg-gray-400 rounded animate-pulse"></div>
                        ) : (
                            <>₹{formatPrice(finalTotal)}</>
                        )}
                    </div>
                </div>

            </div>

            <InformationsPopup
                isOpen={popupData !== null}
                title={popupData?.title}
                description={popupData?.description}
                emailLink={popupData?.emailLink}
                phoneLink={popupData?.phoneLink}
                whatsappLink={popupData?.whatsappLink}
                onClose={() => setPopupData(null)}
            />
        </>
    )
}

export default OrderDetails