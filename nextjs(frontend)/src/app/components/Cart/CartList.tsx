'use client'

import Link from "next/link";
import CartItem from "./CartItem";
import DrawerCartItem from "./DrawerCartItem";
import { useMemo } from "react"

type RawCartItem = {
    id: string;
    product_title?: string;
    product_handle?: string;
    quantity?: number;
    unit_price?: number;
    is_out_of_stock?: boolean;
    pricing?: {
        actual_price?: number;
        our_price?: number;
    };
    categories?: Array<{
        handle?: string;
        media?: Array<{
            url?: string;
        }>;
    }>;
};

type FormattedCartItem = {
    id: string;
    title: string;
    productLink: string;
    image: string;
    quantity: number;
    actualPrice: number;
    discountedPrice: number;
    isOutOfStock: boolean;
};

type CartListProps = {
    title?: string;
    variant?: "default" | "drawer";
    items?: RawCartItem[];
    loading?: boolean;
    initialLoading?: boolean;
};

const CartList = ({ items = [], title, variant = "default", loading = false, initialLoading = false, }: CartListProps) => {


    // const items: RawCartItem[] = (cart?.items as RawCartItem[]) || [];


    const formattedItems: FormattedCartItem[] = useMemo(() => {
        return items.map((item: RawCartItem) => ({
            id: item.id,
            title: item.product_title ?? "",
            productLink: `/voucher/${item.categories?.[0]?.handle ?? "general"}/${item.product_handle}`,
            image: item.categories?.[0]?.media?.[0]?.url || "/assets/images/company-certifications1.png",
            quantity: item.quantity ?? 0,
            actualPrice: item.pricing?.actual_price ?? item.unit_price ?? 0,
            discountedPrice: item.pricing?.our_price ?? item.unit_price ?? 0,
            isOutOfStock: item.is_out_of_stock ?? false,
        }));
    }, [items]);




    const ItemComponent = variant === "drawer" ? DrawerCartItem : CartItem;


    const skeletonCount = 1;

    const totalItems = useMemo(() => {
        return items.reduce(
            (sum: number, item: RawCartItem) => sum + (item.quantity || 0),
            0
        )
    }, [items])

    return (
        <>
            {title && (
                <h2 className="cart-page-title">
                    {initialLoading || (loading && items.length === 0)
                        ? "Loading your cart..."
                        : items.length > 0
                            ? `${title} : ${totalItems} items`
                            : "Your cart is empty"}
                </h2>
            )}

            <div className="cart-list">
                {/* {
                    formattedItems.map((item) => (
                        <ItemComponent key={item.id} item={item} />
                    ))} */}



                {initialLoading || (loading && items.length === 0) ? (
                    Array.from({ length: skeletonCount }).map((_, idx) => (
                        <ItemComponent key={idx} loading={true} />
                    ))
                ) : items.length === 0 ? (
                    <div className="empty-drawer-wrapper">

                        <img
                            src="/assets/images/empty-cart.svg"
                            alt="Empty Cart"
                            className="empty-drawer-image"
                        />

                        {/* <h2 className="empty-drawer-title">
                            Your Cart Is Empty
                        </h2> */}

                        <p className="empty-drawer-subtitle">
                            Your next great deal is waiting
                        </p>

                        <Link href="/voucher" className="empty-drawer-button cart">
                            Browse Our Vouchers
                        </Link>

                    </div>
                ) : (
                    formattedItems.map((item) => (
                        <ItemComponent key={item.id} item={item} />

                    ))
                )}



                {/* {loading
                    ? Array.from({ length: skeletonCount }).map((_, idx) => (
                        <ItemComponent key={idx} loading={true} />
                    ))
                    : formattedItems.map((item) => (
                        <ItemComponent key={item.id} item={item}
                        //  refreshCart={refreshCart} 
                        />
                    ))} */}
            </div>
        </>
    );
};

export default CartList;
