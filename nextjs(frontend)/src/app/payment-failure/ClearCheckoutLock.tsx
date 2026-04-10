"use client"

import { useEffect } from "react"

export default function ClearCheckoutLock() {
  useEffect(() => {
    try {
      localStorage.removeItem("checkout_payment_lock_v1")
      localStorage.removeItem("checkout_pending_payment")
      sessionStorage.removeItem("checkout_in_progress")
    } catch {
      // ignore storage access issues
    }
  }, [])

  return null
}
