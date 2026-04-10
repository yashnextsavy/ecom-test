import Link from "next/link"

type FailureSearchParams = {
    gateway?: string
    status?: string
    cart_id?: string
    txnid?: string
    reason?: string
}

const reasonLabel = (reason?: string) => {
    if (!reason) return "Payment was not completed."

    const mapping: Record<string, string> = {
        gateway_failed: "Payment gateway reported failure.",
        session_not_authorized: "Payment session was not authorized.",
        session_update_failed: "Unable to sync payment status.",
        order_not_created: "Order could not be created after payment.",
        missing_cart: "Cart reference was missing in callback.",
    }

    return mapping[reason] || reason.replaceAll("_", " ")
}

export default async function PaymentFailurePage({
    searchParams,
}: {
    searchParams: Promise<FailureSearchParams>
}) {
    const params = await searchParams
    const cartId = params?.cart_id || ""
    const txnId = params?.txnid || ""
    const status = params?.status || "failed"
    const gateway = params?.gateway || "easebuzz"
    const reason = reasonLabel(params?.reason)

    return (
        <div className="checkout-page-wrapper thankyou-page-wrapper relative">
            <div className="container-custom mx-auto">
                <div className="w-full flex items-center justify-center">
                    <div className="checkout-user-authentication-wrapper thankyou-page">
                        <div className="thankyou-message-banner-wrapper">
                            <div className="thankyou-message-banner">
                                <img
                                    className="thankyou-banner-bg"
                                    src="/assets/images/thankyou-banner-bg.svg"
                                    alt="payment-failure-banner"
                                />
                                <div className="thankyou-title">
                                    <h1>Payment Failed</h1>
                                </div>
                                <div className="thankyou-description">
                                    <p>{reason}</p>
                                </div>
                            </div>
                        </div>

                        <div className="thankyou-order-confirmation-details mt-5">
                            <div className="thankyou-order-details-row">
                                <div className="thankyou-order-details-title">Gateway</div>
                                <div className="thankyou-order-details-value">{gateway}</div>
                            </div>
                            <div className="thankyou-order-details-row">
                                <div className="thankyou-order-details-title">Status</div>
                                <div className="thankyou-order-details-value">{status}</div>
                            </div>
                            {txnId ? (
                                <div className="thankyou-order-details-row">
                                    <div className="thankyou-order-details-title">Transaction ID</div>
                                    <div className="thankyou-order-details-value">{txnId}</div>
                                </div>
                            ) : null}
                            {cartId ? (
                                <div className="thankyou-order-details-row">
                                    <div className="thankyou-order-details-title">Cart ID</div>
                                    <div className="thankyou-order-details-value">{cartId}</div>
                                </div>
                            ) : null}
                        </div>

                        <div className="thankyou-action-buttons-wrapper pt-5">
                            <Link
                                className="thankyou-btn primary"
                                href={cartId ? `/checkout?cart_id=${encodeURIComponent(cartId)}` : "/checkout"}
                            >
                                Retry Payment
                            </Link>
                            <Link className="thankyou-btn secondary" href="/">
                                Back To Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

