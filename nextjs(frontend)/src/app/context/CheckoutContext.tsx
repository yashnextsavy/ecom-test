'use client'

import { createContext, useContext, useState, useEffect, useCallback } from "react"

type CheckoutData = {
    cartId?: string | null
    payment?: any
    order?: any
    user?: {
        firstName: string
        lastName: string
        email: string
        mobile: string
    }
}

type CheckoutContextType = {
    checkoutData: CheckoutData | null
    setCheckoutData: (data: Partial<CheckoutData>) => void
}

const CheckoutContext = createContext<CheckoutContextType | null>(null)

export const CheckoutProvider = ({ children }: { children: React.ReactNode }) => {
    const [checkoutData, setCheckoutState] = useState<CheckoutData | null>(null)

    // ✅ Load from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("checkout_data")
            if (stored) {
                setCheckoutState(JSON.parse(stored))
            }
        }
    }, [])

    // ✅ Save to localStorage whenever data changes
    useEffect(() => {
        if (typeof window !== "undefined" && checkoutData) {
            localStorage.setItem(
                "checkout_data",
                JSON.stringify(checkoutData)
            )
        }
    }, [checkoutData])

    const setCheckoutData = useCallback((data: Partial<CheckoutData>) => {
        setCheckoutState((prev) => ({
            ...(prev || {}),
            ...data
        }))
    }, [])

    return (
        <CheckoutContext.Provider value={{ checkoutData, setCheckoutData }}>
            {children}
        </CheckoutContext.Provider>
    )
}

export const useCheckout = () => {
    const context = useContext(CheckoutContext)
    if (!context) throw new Error("useCheckout must be used inside CheckoutProvider")
    return context
}
