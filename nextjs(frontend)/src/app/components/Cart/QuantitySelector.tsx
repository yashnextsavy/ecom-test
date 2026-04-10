'use client'

import { useState } from "react"
import { useCart } from "@/app/context/CartContext"
import { useEffect } from "react"


type QuantitySelectorProps = {
    quantity: number
    itemId: string
    isOutOfStock?: boolean
}

const QuantitySelector = ({ quantity, itemId, isOutOfStock = false }: QuantitySelectorProps) => {

    const [qty, setQty] = useState(quantity)
    const [loading, setLoading] = useState(false)

    const { setCart } = useCart()

    const [loadingAction, setLoadingAction] = useState<"inc" | "dec" | "delete" | null>(null)


    function getCartId(): string | null {
        const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("cart_id="))
            ?.split("=")[1]

        return cookie || localStorage.getItem("cart_id")
    }


    // const updateQuantity = async (newQty: number) => {

    //     const cartId = getCartId();
    //     // const cartId = localStorage.getItem("cart_id");
    //     if (!cartId) return;

    //     try {
    //         setLoading(true);

    //         const res = await fetch("/api/cart/update-item", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify({
    //                 cart_id: cartId,
    //                 item_id: itemId,
    //                 quantity: newQty
    //             })
    //         });

    //         if (!res.ok) throw new Error("Quantity update failed");
    //         const data = await res.json().catch(() => null)
    //         if (data?.cart) {
    //             setCart(data.cart)
    //         }

    //         if (newQty > 0) {
    //             setQty(newQty);
    //         }

    //     } catch (err) {
    //         console.error(err);
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const updateQuantity = async (newQty: number, action: "inc" | "dec") => {
        const cartId = getCartId();
        if (!cartId) return;

        try {
            setLoadingAction(action);

            const res = await fetch("/api/cart/update-item", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cart_id: cartId,
                    item_id: itemId,
                    quantity: newQty
                })
            });

            if (!res.ok) throw new Error("Quantity update failed");

            const data = await res.json().catch(() => null);
            if (data?.cart) setCart(data.cart);

            if (newQty > 0) setQty(newQty);

        } catch (err) {
            console.error(err);
        } finally {
            setLoadingAction(null);
        }
    };


    const decreaseQty = () => {
        if (qty > 1) {
            updateQuantity(qty - 1, "dec");
        }
    };

    const increaseQty = () => {
        if (qty < 50) {
            updateQuantity(qty + 1, "inc");
        }
    };

    // const handleDelete = async () => {
    //     const cartId = getCartId();
    //     // const cartId = localStorage.getItem("cart_id");
    //     if (!cartId) return;

    //     try {
    //         setLoading(true);

    //         const res = await fetch("/api/cart/update-item", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify({
    //                 cart_id: cartId,
    //                 item_id: itemId,
    //                 quantity: 0
    //             })
    //         });

    //         if (!res.ok) throw new Error("Delete failed");
    //         const data = await res.json().catch(() => null)
    //         if (data?.cart) {
    //             setCart(data.cart)
    //         } else {
    //             setCart(null)
    //         }

    //     } catch (err) {
    //         console.error(err);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleDelete = async () => {
        const cartId = getCartId();
        if (!cartId) return;

        try {
            setLoadingAction("delete");

            const res = await fetch("/api/cart/update-item", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cart_id: cartId,
                    item_id: itemId,
                    quantity: 0
                })
            });

            if (!res.ok) throw new Error("Delete failed");

            const data = await res.json().catch(() => null);
            if (data?.cart) setCart(data.cart);
            else setCart(null);

        } catch (err) {
            console.error(err);
        } finally {
            setLoadingAction(null);
        }
    };


    useEffect(() => {
        setQty(quantity)
    }, [quantity])

    return (
        <div className="cart-qty">

            <div className="cart-qty-main">

                {/* <button
                    className={`cart-round-btn ${isOutOfStock ? "out-of-stock-item" : ""}`}
                    onClick={decreaseQty}
                    disabled={loading || qty === 1 || isOutOfStock}
                >
                    {loading ? <div className="qty-spinner" /> : "-"}
                </button> */}
                <button
                    className={`cart-round-btn ${isOutOfStock ? "out-of-stock-item" : ""}`}
                    onClick={decreaseQty}
                    disabled={loadingAction !== null || qty === 1 || isOutOfStock}
                >
                    {loadingAction === "dec" ? <div className="qty-spinner" /> : "-"}
                </button>



                <span className={isOutOfStock ? "out-of-stock-item" : ""}>
                    {qty}
                </span>

                <button
                    className={`cart-round-btn ${isOutOfStock ? "out-of-stock-item" : ""}`}
                    onClick={increaseQty}
                    disabled={loadingAction !== null || qty >= 50 || isOutOfStock}
                >
                    {loadingAction === "inc" ? <div className="qty-spinner" /> : "+"}
                </button>

            </div>

            <div className="cart-qty-delete">

                <button
                    className="cart-round-btn"
                    onClick={handleDelete}
                    disabled={loading}
                >
                    <img src="/assets/images/cart-bin.svg" alt="delete" />
                </button>

            </div>

        </div>
    )
}

export default QuantitySelector
