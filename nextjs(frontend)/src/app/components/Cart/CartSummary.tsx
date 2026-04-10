import Link from "next/link";
import { CgChevronRight } from 'react-icons/cg';
import { formatPrice } from "@/lib/utils/formatPrice";


type CartSummaryProps = {
    cart?: any;
    moreVouchersLink?: string;
    loading?: boolean; // 
};

const CartSummary = ({ cart, moreVouchersLink }: CartSummaryProps) => {


    const subtotal = cart?.subtotal ?? 0
    const tax = cart?.tax_total ?? 0
    const total = cart?.total ?? 0

    // const savings =
    //     cart?.items?.reduce((acc: number, item: any) => {
    //         const discount = item?.pricing?.discount_amount ?? 0
    //         const quantity = item?.quantity ?? 1

    //         return acc + (discount * quantity)
    //     }, 0) ?? 0
    const savings =
        cart?.items?.reduce((acc: number, item: any) => {
            const discount = item?.pricing?.discount_amount ?? 0
            const quantity = item?.quantity ?? 1

            return acc + (discount * quantity)
        }, 0) ?? 0


    return (
        <div className="cart-summary-wrapper relative">

           

            <div className="cart-summary">

                <div className="cart-summary-row">
                    <span>Total Price</span>
                    <span>₹{formatPrice(subtotal)}</span>
                </div>

                <div className="cart-summary-row">
                    <span>GST - 18%</span>
                    <span>₹{formatPrice(tax)}</span>
                </div>

                {/* <div className="cart-summary-saved">
                    <div className="inline-flex gap-2 whitespace-nowrap">
                        <img src="/assets/images/confetti.svg" alt="confetti" />
                        You Saved With Us!
                    </div>

                    <strong>₹{formatPrice(savings)}</strong>
                </div> */}
                {/* <div
                    className="cart-summary-saved"
                    style={{
                        opacity: savings > 0 ? 1 : 0,
                        visibility: savings > 0 ? "visible" : "hidden",
                        height: savings > 0 ? "auto" : "auto",
                        overflow: "hidden"
                    }}
                >
                    <div className="inline-flex gap-2 whitespace-nowrap">
                        <img src="/assets/images/confetti.svg" alt="confetti" />
                        You Saved With Us!
                    </div>

                    <strong>₹{formatPrice(savings)}</strong>
                </div> */}

                {savings > 0 && (
                    <div className="cart-summary-saved">
                        <div className="inline-flex gap-2 whitespace-nowrap">
                            <img src="/assets/images/confetti.svg" alt="confetti" />
                            You Saved With Us!
                        </div>

                        <strong>₹{formatPrice(savings)}</strong>
                    </div>
                )}

                <div className="cart-summary-total">
                    <span>Grand Total</span>
                    <strong>₹{formatPrice(total)}</strong>
                </div>

                <Link href="/checkout" className="cart-checkout-btn" >
                    Go To Checkout
                </Link>


            </div>

            {moreVouchersLink && (
                <div className="cart-summary-link-voucher">
                    <Link
                        className="secondary-btn-link inline-flex justify-center items-center"
                        href={moreVouchersLink}
                    >
                        Explore More Vouchers
                        <span className="secondary-link-arrow">
                            <CgChevronRight />
                        </span>
                    </Link>
                </div>
            )}

        </div>
    );
};

export default CartSummary;