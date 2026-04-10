"use client"

import { useEffect } from "react"
import { useCheckout } from "@/app/context/CheckoutContext"

type Props = {
    orderId?: string
}

const OrderDataHydrator = ({ orderId }: Props) => {
    const { checkoutData, setCheckoutData } = useCheckout()

    useEffect(() => {
        const resolvedOrderId = orderId?.trim()
        if (!resolvedOrderId) return

        const hydrateOrder = async () => {
            try {
                const res = await fetch(
                    `/api/cart/get?order_id=${encodeURIComponent(resolvedOrderId)}`,
                    { method: "GET", cache: "no-store" }
                )
                const data = await res.json().catch(() => null)
                const order = (data as any)?.order

                if (!res.ok || !order?.id) return
                if (checkoutData?.order?.id === resolvedOrderId) return

                setCheckoutData({
                    order,
                    cartId: order?.cart_id || checkoutData?.cartId || null,
                })
            } catch (error) {
                console.error("OrderDataHydrator failed:", error)
            }
        }

        hydrateOrder()
    }, [checkoutData?.cartId, checkoutData?.order?.id, orderId, setCheckoutData])

    return null
}

export default OrderDataHydrator
