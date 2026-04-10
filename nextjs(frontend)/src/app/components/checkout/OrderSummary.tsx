'use client'

import { useState, useEffect } from 'react';
import { CgChevronRight } from 'react-icons/cg';
import InformationsPopup from "@/app/components/InformationsPopup/InformationsPopup";
import { useRouter } from 'next/navigation'
import { formatPrice } from "@/lib/utils/formatPrice";


const OrderSummary = ({ cart, contactData }: any) => {

    const router = useRouter()
    const [isCashbackApplied, setIsCashbackApplied] = useState(cart?.cashback ?? false)
    const [popupData, setPopupData] = useState<{
        title: string
        description: string
        emailLink?: string
        phoneLink?: string
        whatsappLink?: string
    } | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const contact = contactData?.data?.contactDetails

    const OpenPopUp = () => {
        setPopupData({
            title: "Cashback Available",
            description: "By selecting the Cashback option, you are choosing to receive cashback instead of the discounts currently offered by Global IT Success. Please note that cashback and Global IT Success discounts cannot be combined for the same order. Once the cashback option is selected, all applicable Global IT Success discounts will be removed automatically from this purchase. To understand cashback eligibility, processing timelines, or for any additional information related to cashback, please contact our team. We’ll be happy to assist you and help you choose the option that works best for you.",
            emailLink: contact?.email ? `mailto:${contact.email}` : undefined,
            phoneLink: contact?.callNumber ? `tel:${contact.callNumber}` : undefined,
            whatsappLink: contact?.whatsappNumber
                ? `https://wa.me/${contact.whatsappNumber.replace("+", "")}`
                : undefined
        })
    }

    

    const savings =
        cart?.items?.reduce((acc: number, item: any) => {
            const discount = item?.pricing?.discount_amount ?? 0
            const quantity = item?.quantity ?? 1

            return acc + (discount * quantity)
        }, 0) ?? 0

    const handleCashbackToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked

        setIsLoading(true)
        setIsCashbackApplied(checked)

        try {
            await fetch('/api/cart/update-cashback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cart_id: cart.id,
                    cashback: checked
                })
            })

            router.refresh()

        } catch (err) {
            console.error("Cashback update failed", err)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        setIsLoading(false)
        setIsCashbackApplied(cart?.metadata?.cashback ?? false)
    }, [cart])

    const finalTotal = cart?.item_total || cart?.total

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
                        cart?.items?.map((item: any) => {
                            const image =
                                item?.categories?.[0]?.media?.[0]?.url ||
                                "/assets/images/default-product.png"

                            const discount = item?.pricing?.discount_amount ?? 0
                            const finalPrice = item?.pricing?.our_total ?? 0
                            const originalPrice = finalPrice + discount


                            return (
                                <div key={item.id} className="checkout-summary-item">
                                    <div className="checkout-summary-item-img-wrapper">
                                        <img src={image} alt={item.product_title} />
                                        <span className="checkout-summary-item-qty">
                                            {item.quantity}
                                        </span>
                                    </div>

                                    <div className="checkout-summary-item-content">
                                        <p className="checkout-summary-item-title">
                                            {item.product_title}
                                        </p>
                                      
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
                            )
                        })
                    )}

                </div>

                <div className="checkout-summary-pricing">

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
                                <div>₹{formatPrice(cart?.item_subtotal)}</div>
                            </div>

                            <div className="checkout-summary-row">
                                <div>GST - 18%</div>
                                <div>₹{formatPrice(cart?.item_tax_total)}</div>
                            </div>
                        </>
                    )}

                </div>

                {/*  SAVINGS BLOCK */}
                {!isLoading && !isCashbackApplied && savings > 0 && (
                    <div className="cart-summary-saved mt-4">
                        <div className="inline-flex gap-2 whitespace-nowrap">
                            <img src="/assets/images/confetti.svg" alt="confetti" />
                            You Saved With Us!
                        </div>

                        <strong>₹{formatPrice(savings)}</strong>
                    </div>
                )}

                <div className="checkout-summary-cashback">

                    <label className="checkout-summary-checkbox">
                        <input
                            type="checkbox"
                            disabled={isLoading}
                            checked={isCashbackApplied}
                            onChange={handleCashbackToggle}
                        />
                        <span className="custom-checkbox"></span>
                        Cashback Available
                    </label>

                    <div
                        onClick={OpenPopUp}
                        className="checkout-summary-view-details secondary-btn-link inline-flex justify-center items-center"
                    >
                        View Details
                        <span className="secondary-link-arrow">
                            <CgChevronRight />
                        </span>
                    </div>
                </div>

                <div className="checkout-summary-total">
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

export default OrderSummary
