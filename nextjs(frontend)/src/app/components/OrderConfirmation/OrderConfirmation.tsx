'use client'
import { useEffect, useState } from "react"
import Link from 'next/link'
import { CgChevronRight } from 'react-icons/cg'
import { formatPrice } from "@/lib/utils/formatPrice"
import { IoCallOutline } from "react-icons/io5"
import { FaWhatsapp } from "react-icons/fa"
import { LuDownload } from "react-icons/lu"
import Confetti from "../Confetti/Confetti"
import { useCart } from "@/app/context/CartContext"
import { useContact } from "@/app/context/contact-context"
import { useCheckout } from "@/app/context/CheckoutContext"


const formatDisplayNumber = (number?: string) =>
    number?.startsWith("+91") && !number.includes("-")
        ? number.replace("+91", "+91-")
        : number;



const OrderConfirmation = ({ orderId, txnid }: { orderId?: string; txnid?: string }) => {
    const { contactData } = useContact()
    const { checkoutData } = useCheckout()

    const finalOrderId =
        checkoutData?.order?.id || orderId

    const displayOrderId = checkoutData?.order?.display_id

    const orderDateSource =
        checkoutData?.order?.created_at ||
        checkoutData?.order?.shipping_address?.created_at
    const orderDate = orderDateSource
        ? new Date(orderDateSource).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).replace(/(\d{4})$/, ", $1")
        : "—"
    const customerName =
        checkoutData?.user
            ? `${checkoutData.user.firstName} ${checkoutData.user.lastName}`
            : checkoutData?.order?.shipping_address?.first_name
                ? `${checkoutData.order.shipping_address.first_name} ${checkoutData.order.shipping_address.last_name}`
                : "—"
    const email =
        checkoutData?.user?.email ||
        checkoutData?.order?.email ||
        "—"
    const transactionId =
        checkoutData?.order?.transaction_id ||
        checkoutData?.order?.txnid ||
        txnid ||
        "—"
    // const totalDiscount = checkoutData?.order?.discount_total ?? 0
    const totalDiscount =
        checkoutData?.order?.items?.reduce((acc: number, item: any) => {
            return acc + (item?.pricing?.discount_amount || 0) * (item?.quantity || 1)
        }, 0) ?? 0

    const supportContact = contactData?.contactDetails?.callNumber || "—"
    const supportWhatsapp = contactData?.contactDetails?.whatsappNumber || "—"

    const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false)

    useEffect(() => {
        // Add a new history entry
        window.history.pushState(null, "", window.location.href)

        const handlePopState = () => {
            // Instead of blocking → redirect cleanly
            window.location.replace("/")
        }

        window.addEventListener("popstate", handlePopState)

        return () => {
            window.removeEventListener("popstate", handlePopState)
        }
    }, [])

    const handleDownloadReceipt = async () => {
        if (!finalOrderId || isDownloadingReceipt) return

        try {
            setIsDownloadingReceipt(true)
            const res = await fetch(`/api/orders/${finalOrderId}/receipt`, {
                method: "GET",
            })

            if (!res.ok) {
                const errorText = await res.text().catch(() => "")
                throw new Error(errorText || `Failed to download receipt (${res.status})`)
            }

            const blob = await res.blob()
            const objectUrl = window.URL.createObjectURL(blob)
            const contentDisposition = res.headers.get("content-disposition") || ""
            const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)
            const filenameFromHeader = filenameMatch?.[1]
                ? decodeURIComponent(filenameMatch[1].replace(/"/g, ""))
                : null
            const fallbackName = `receipt-${displayOrderId || finalOrderId}.pdf`
            const filename = filenameFromHeader?.endsWith(".pdf")
                ? filenameFromHeader
                : filenameFromHeader
                    ? `${filenameFromHeader}.pdf`
                    : fallbackName

            const link = document.createElement("a")
            link.href = objectUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(objectUrl)
        } catch (error) {
            console.error("Receipt download failed:", error)
            window.alert("Unable to download receipt right now. Please try again.")
        } finally {
            setIsDownloadingReceipt(false)
        }
    }



    return (
        <>

            {/* <div style={{ marginTop: "20px", padding: "16px", background: "#111", color: "#0f0", borderRadius: "8px", overflowX: "auto" }}>
                <h3>Debug Checkout Data</h3>
                <pre>
                    {JSON.stringify(checkoutData, null, 2)}
                </pre>
            </div> */}


            <div className="checkout-authentication-sticky-wrapper relative">

                <div className='checkout-authentication'>
                    <div className="thankyou-message-banner-wrapper">
                        {totalDiscount > 0 && (
                            <div className="thankyou-floating-title">
                                <div className="cart-item-saving div-confetti">
                                    <img src="/assets/images/confetti.svg" alt="confetti" />
                                    <div className="thankyou-saved-amount">
                                        You saved &nbsp;
                                        <strong>₹{formatPrice(totalDiscount)}</strong>&nbsp; on this order
                                    </div>
                                    <img src="/assets/images/confetti.svg" alt="confetti" />
                                </div>
                            </div>
                        )}
                        <div className='thankyou-message-banner'>
                            <img className="thankyou-banner-bg" src="/assets/images/thankyou-banner-bg.svg" alt="thankyou-banner-bg" />
                            <div className="thankyou-title">
                                <span>
                                    <img src="/assets/images/list-icon-white.svg" alt="payment done" />
                                </span>
                                <h1>
                                    Thank You for Choosing Us
                                </h1>
                            </div>
                            <div className="thankyou-description">
                                <p><strong>We&apos;ve received your order and confirmed your payment.</strong> You&apos;ll receive a confirmation email shortly with your order details and voucher information.</p>
                            </div>
                        </div>
                    </div>
                    <div className="thankyou-order-confirmation-details">
                        <div className='thankyou-order-details-row'>
                            <div className="flex flex-col gap-2 lg:gap-3">
                                <div className="thankyou-order-details-title">Order number</div>
                                <div className="thankyou-order-details-value">
                                    {displayOrderId}
                                    {/* {finalOrderId ? finalOrderId.replace(/^order_\d+/, "") : "—"} */}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 lg:gap-3 items-end">
                                <div className="thankyou-order-details-title">Order date</div>
                                <div className="thankyou-order-details-value">{orderDate}</div>
                            </div>
                        </div>
                        <div className='thankyou-order-details-row'>
                            <div className="flex flex-col gap-2 lg:gap-3">
                                <div className="thankyou-order-details-title">Transaction ID</div>
                                <div className="thankyou-order-details-value">{transactionId}</div>
                            </div>
                        </div>
                        <div className='thankyou-order-details-row'>
                            <div className="flex flex-col gap-2 lg:gap-3">
                                <div className="thankyou-order-details-title">Order Placed By</div>
                                <div className="thankyou-order-details-value">{customerName}</div>
                            </div>
                            <div className="flex flex-col gap-2 lg:gap-3 items-end">
                                <div className="thankyou-order-details-title">Sent to email ID</div>
                                <div className="thankyou-order-details-value">{email}</div>
                            </div>
                        </div>
                        <div className='thankyou-order-details-row need-support-row'>
                            <div className="flex flex-col gap-2 lg:gap-3 need-support-row-question">
                                <div className="thankyou-order-details-title ask-questions">Have Questions?</div>
                            </div>
                            <div className="flex flex-row gap-2 items-end need-support-contact">
                                {supportContact && supportContact !== "—" && (
                                    <div className="thankyou-order-details-title flex items-center">
                                        <IoCallOutline className="size-5 me-1.5" />
                                        <a
                                            className="secondary-btn-link inline-flex justify-center items-center"
                                            href={`tel:${supportContact}`}

                                        >
                                            {formatDisplayNumber(supportContact)}
                                            <span className="secondary-link-arrow">
                                                <CgChevronRight className="me-2" />
                                            </span>
                                        </a>
                                    </div>
                                )}
                                {supportWhatsapp && supportWhatsapp !== "—" && (
                                    <div className="thankyou-order-details-title flex items-center">
                                        <FaWhatsapp className="me-2 text-[#6BD65F] me-1.5 size-5" />
                                        <a
                                            className="secondary-btn-link inline-flex justify-center items-center"
                                            href={`https://wa.me/${supportWhatsapp.replace("+", "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {formatDisplayNumber(supportWhatsapp)}

                                            <span className="secondary-link-arrow">
                                                <CgChevronRight />
                                            </span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="thankyou-action-buttons-wrapper">
                        <button
                            type="button"
                            className="thankyou-btn primary"
                            onClick={handleDownloadReceipt}
                            disabled={!finalOrderId || isDownloadingReceipt}
                        >
                            {isDownloadingReceipt ? (
                                <span className="spinner"></span>
                            ) : (
                                <>
                                    <LuDownload className="me-2" />
                                    Download Receipt
                                </>
                            )}
                        </button>
                        <Link
                            href="/vendors"
                            type="button"
                            className="thankyou-btn secondary"

                        >
                            {isDownloadingReceipt ? <span className="spinner"></span> : "Explore Vouchers"}
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}
export default OrderConfirmation
