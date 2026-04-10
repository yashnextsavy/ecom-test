"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Legacy route kept for backward compatibility.
// Redirects old /payment-success links to the active checkout success route.
export default function LegacyPaymentSuccessRedirectPage() {
    const router = useRouter()

    useEffect(() => {
        const search = window.location.search || ""
        router.replace(`/checkout/payment/success${search}`)
    }, [router])

    return (
        <div className="container-custom mx-auto h-[70vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#23408B] rounded-full animate-spin"></div>
        </div>
    )
}
