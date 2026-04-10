"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/app/context/CartContext"

export default function CheckoutGuard() {
    const router = useRouter()
    const { cart } = useCart()

    const [isReady, setIsReady] = useState(false)

    // wait for hydration
    useEffect(() => {
        setIsReady(true)
    }, [])

    useEffect(() => {
        if (!isReady) return

        // 🚨 only redirect if cart is DEFINITELY empty
        if (cart && (!cart.items || cart.items.length === 0)) {
            router.replace("/cart")
        }
    }, [cart, isReady, router])

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === "cart_sync") {
                router.refresh()
            }
        }

        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
    }, [router])

    return null
}