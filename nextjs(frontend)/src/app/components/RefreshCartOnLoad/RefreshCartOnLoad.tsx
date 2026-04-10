"use client"

import { useEffect } from "react"
import { useCart } from "@/app/context/CartContext"

export default function RefreshCartOnLoad() {
    const { refreshCart } = useCart()

    useEffect(() => {
        refreshCart()
    }, [])

    return null
}