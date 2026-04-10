'use client'

import { useCart } from "@/app/context/CartContext"
import { useEffect, useState } from "react"
import CartSummary from "./CartSummary"
import { IoClose } from "react-icons/io5"
import CartList from "./CartList"
import { usePathname } from "next/navigation"
import DrawerRelatedItem from "./DrawerRelatedItem"
import Link from "next/link"


export default function CartDrawer() {

    const { isOpen, closeCart, cart, loading, refreshCart } = useCart()

    const pathname = usePathname()
    const [relatedVouchers, setRelatedVouchers] = useState<any[]>([])

    const isCartEmpty = !cart?.items || cart.items.length === 0


    useEffect(() => {
        const fetchRelated = async () => {
            if (!cart?.items?.length) return

            const slugs = [
                ...new Set(
                    cart.items.flatMap((item: any) =>
                        item?.categories?.map((c: any) => c.id) // use ID (important)
                    )
                ),
            ].filter(Boolean)

            if (!slugs.length) return

            try {
                const res = await fetch(
                    `/api/cart/related-vouchers?category_slug=${slugs.join(",")}`
                )

                const data = await res.json()

                const cartProductIds = cart.items.map((i: any) => i.product_id)


                if (data?.products) {

                    const filtered = data.products.filter(
                        (p: any) => !cartProductIds.includes(p.id)
                    )
                    setRelatedVouchers(filtered)
                }
            } catch (err) {
                console.error("Drawer related vouchers error:", err)
            }
        }

        fetchRelated()
    }, [cart])


    useEffect(() => {
        if (isOpen) {
            refreshCart()
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }

        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    useEffect(() => {
        closeCart()
    }, [pathname])


    // useEffect(() => {
    //     if (!cart?.items?.length) {
    //         localStorage.removeItem("cart_id")
    //         document.cookie = "cart_id=; path=/; max-age=0"

    //          closeCart()
    //     }
    // }, [cart])

    const handleNavigate = () => {
        if (pathname === '/voucher') {
            closeCart()
        }

    }
    return (
        <>

            {/* <pre>{JSON.stringify(cart, null, 2)}</pre> */}

            <div className={`drawer-cart-wrapper ${isOpen ? "is-open" : ""}`}>

                {/* overlay */}
                <div
                    className="drawer-overlay"
                    onClick={(e) => {
                        e.stopPropagation()
                        closeCart()
                    }}
                />

                {/* drawer */}
                <div className="drawer-window">

                    <button
                        className="drawer-close-btn"
                        onClick={(e) => {
                            e.stopPropagation()
                            closeCart()
                        }}
                    >
                        <IoClose size={18} />
                    </button>

                    <div className="drawer-body cart-page">

                        <h2 className="drawer-title">
                            My Cart
                        </h2>

                        <div className={`drawer-item-list ${isCartEmpty ? "empty-cart-flag" : ""}`}>
                            {/* {loading && <p>Loading cart...</p>} */}


                            {isCartEmpty && !loading && (
                                <div className="empty-drawer-wrapper cart-drawer">

                                    <img
                                        src="/assets/images/empty-cart.svg"
                                        alt="Empty Cart"
                                        className="empty-drawer-image"
                                    />

                                    <h2 className="empty-drawer-title">
                                        Your Cart Is Empty
                                    </h2>

                                    <p className="empty-drawer-subtitle">
                                        Your next great deal is waiting
                                    </p>

                                    <Link href="/voucher" className="empty-drawer-button" onClick={handleNavigate}>
                                        Browse Our Vouchers
                                    </Link>

                                </div>
                            )}

                            {!isCartEmpty && (

                                <CartList
                                    variant="drawer"
                                    items={cart?.items ?? []}
                                    loading={loading}
                                />
                            )}

                            {/* 
                        <CartList
                            variant="drawer"
                            items={cart?.items ?? []}
                            loading={loading}
                        /> */}



                        </div>

                        {relatedVouchers.length > 0 && (
                            <div className="drawer-related-section mt-4">

                                <h2 className="drawer-related-heading">
                                    You may also like
                                </h2>

                                <div className="drawer-related-list">
                                    {relatedVouchers.map((item) => (
                                        <DrawerRelatedItem key={item.id} item={item} />
                                    ))}
                                </div>

                            </div>
                        )}


                    </div>

                    {!loading && cart?.items?.length > 0 && (
                        <div className="drawer-scroll-shadow" />
                    )}



                    {cart?.items?.length > 0 && (
                        <div className="drawer-footer cart-page relative">

                            <div className="drawer-scroll-shadow part2">
                            </div>
                            <CartSummary cart={cart} />
                        </div>
                    )}

                </div>

            </div>
        </>
    )
}
