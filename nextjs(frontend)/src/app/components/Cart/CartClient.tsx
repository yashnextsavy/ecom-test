'use client'

import { useState, useEffect } from "react";
import CartList from "@/app/components/Cart/CartList";
import CartSummary from "@/app/components/Cart/CartSummary";
import ProductCardListing from "@/app/components/ProductCardListing/ProductCardListing";
import { getMedusaCart } from "@/lib/api";

type CartPageClientProps = {
    cartId: string | null;
};

const CartClient = ({ cartId }: CartPageClientProps) => {
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchCart = async () => {
        if (!cartId) return;
        setLoading(true);
        const cartData = await getMedusaCart(cartId);
        setCart(cartData?.cart ?? null);
        setLoading(false);
    };

    // fetch on mount
    useEffect(() => {
        fetchCart();
    }, [cartId]);


    const relatedVouchers = [
        {
            id: "sample-1",
            title: "AWS Certified SysOps Administrator – Associate",
            status: "published",
            handle: "aws-certified-sysops-administrator",
            image: "/assets/images/company-certifications1.png",
            categories: [{ name: "AWS" }],
            exam_series: [{ id: "1", title: "AWS Associate" }],
            prices: [
                {
                    currency_code: "inr",
                    price: "27140",
                    our_price: "21397",
                    actual_price: "27140",
                },
            ],
        },
        {
            id: "sample-2",
            title: "Cisco Associate CCNA Certification",
            status: "published",
            handle: "cisco-ccna-certification",
            image: "/assets/images/company-certifications2.png",
            categories: [{ name: "Cisco" }],
            exam_series: [{ id: "2", title: "Cisco Associate" }],
            prices: [
                {
                    currency_code: "inr",
                    price: "36108",
                    our_price: "29500",
                    actual_price: "36108",
                },
            ],
        },
        {
            id: "sample-3",
            title: "Microsoft Azure Administrator",
            status: "published",
            handle: "microsoft-azure-administrator",
            image: "/assets/images/company-certifications3.png",
            categories: [{ name: "Microsoft" }],
            exam_series: [{ id: "3", title: "Azure" }],
            prices: [
                {
                    currency_code: "inr",
                    price: "32000",
                    our_price: "26999",
                    actual_price: "32000",
                },
            ],
        },
        {
            id: "sample-4",
            title: "CompTIA Security+ Certification",
            status: "published",
            handle: "comptia-security-plus",
            image: "/assets/images/company-certifications4.png",
            categories: [{ name: "CompTIA" }],
            exam_series: [{ id: "4", title: "CompTIA Security+" }],
            prices: [
                {
                    currency_code: "inr",
                    price: "28900",
                    our_price: "23900",
                    actual_price: "28900",
                },
            ],
        },
    ];


    return (
        <>
            <section className="cart-page">
                <div className="container-custom mx-auto">
                    <div className="cart-page-container">
                        <div className="cart-page-left">
                            <CartList
                                title="Shopping Cart"
                                items={cart?.items ?? []}
                                loading={loading} // show skeleton
                            />
                        </div>
                        <div className="cart-page-right">
                            <CartSummary
                                cart={cart}
                                moreVouchersLink="/voucher"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="container-custom mx-auto">
                <h2 className="related-voucher-heading">
                    Customers also bought these vouchers
                </h2>
            </div>

            <ProductCardListing
                products={relatedVouchers}
                slug="related-vouchers"
            />
        </>
    );
};

export default CartClient;
