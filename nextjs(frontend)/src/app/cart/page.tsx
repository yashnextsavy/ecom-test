'use client'

import CartList from "@/app/components/Cart/CartList";
import CartSummary from "@/app/components/Cart/CartSummary"
import ProductCardListing from "../components/ProductCardListing/ProductCardListing";
import { useEffect, useState, useCallback } from "react";
import { useCart } from "../context/CartContext";
import { usePathname } from "next/navigation";


const CartPage = () => {

    const [relatedVouchers, setRelatedVouchers] = useState<any[]>([])


    const pathname = usePathname();

    const { cart, loading, refreshCart } = useCart();
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    useEffect(() => {
        if (!loading) {
            setHasLoadedOnce(true);
        }
    }, [loading]);

    useEffect(() => {
        refreshCart();
    }, [pathname, refreshCart])


    const fetchRelated = useCallback(async () => {
        if (!cart?.items?.length || loading) {
            setRelatedVouchers([])
            return
        }

        const slugs = [
            ...new Set(
                cart.items.flatMap((item: any) =>
                    item?.categories?.map((c: any) => c.slug)
                )
            ),
        ].filter(Boolean)

        if (!slugs.length) {
            setRelatedVouchers([])
            return
        }

        try {
            const res = await fetch(
                `/api/cart/related-vouchers?category_slug=${slugs.join(",")}`
            )

            const data = await res.json()

            setRelatedVouchers(data?.products || [])
        } catch (err) {
            console.error("Related vouchers fetch error:", err)
            setRelatedVouchers([])
        }
    }, [cart, loading])

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchRelated()
        }, 300)

        return () => clearTimeout(timeout)
    }, [fetchRelated])

    return (
        <>
            <section className="cart-page">
                <div className="container-custom mx-auto">
                    <div className="cart-page-container">

                        <div
                            className={`cart-page-left ${cart?.items?.length ? "add-border" : ""}`}
                        >
                            <CartList
                                title="Shopping Cart"
                                items={cart?.items ?? []}
                                loading={loading}
                                initialLoading={!hasLoadedOnce}
                            />
                        </div>

                        {(cart?.items?.length ?? 0) > 0 && (
                            <div className="cart-page-right">
                                <CartSummary
                                    cart={cart}
                                    moreVouchersLink="/voucher"
                                    loading={loading}
                                />
                            </div>
                        )}

                    </div>
                </div>
            </section>

            {relatedVouchers.length > 0 && (
                <div className="cart-related-wrapper">
                    <div className="container-custom mx-auto">
                        <h2 className="related-voucher-heading">
                            Customers also bought these vouchers
                        </h2>
                    </div>

                    <ProductCardListing
                        products={relatedVouchers}
                        slug="related-vouchers"
                    />
                </div>
            )}
        </>
    );
};

export default CartPage;