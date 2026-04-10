'use client'

import { useState } from "react"

import { useCart } from "@/app/context/CartContext"
import { usePathname } from "next/navigation"


type AddToCartButtonProps = {
  variantId?: string
  productId?: string
  regionId?: string
  salesChannelId?: string
  isOutOfStock?: boolean
}

export default function AddToCartButton({
  variantId,
  productId: _productId,
  regionId,
  salesChannelId,
  isOutOfStock

}: AddToCartButtonProps) {
  const { openCart, setCart } = useCart()
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()


  function getCartId(): string | null {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("cart_id="))
      ?.split("=")[1]

    return cookie || localStorage.getItem("cart_id")
  }

  function saveCartId(cartId: string) {
    localStorage.setItem("cart_id", cartId)
    document.cookie = `cart_id=${cartId}; path=/; max-age=2592000`
  }

  async function validateCart(cartId: string) {
    try {
      const res = await fetch(`/api/cart/get?cart_id=${cartId}`)
      if (!res.ok) return null

      const data = await res.json()
      const cart = data?.cart

      const itemsCount = Array.isArray(cart?.items) ? cart.items.length : 0
      const isCompleted = Boolean(cart?.completed_at)
      const isUsable = Boolean(cart?.id) && !isCompleted && itemsCount > 0

      return isUsable ? cart : null
    } catch {
      return null
    }
  }

  const handleAddToCart = async () => {
    if (isOutOfStock) return;

    if (!variantId || !regionId || !salesChannelId) {
      console.error("Missing add-to-cart identifiers", {
        variantId,
        regionId,
        salesChannelId
      })
      return
    }

    setLoading(true)

    try {
      let cartId = getCartId()
      let cart = null

      if (cartId) {
        cart = await validateCart(cartId)

        if (cartId && !cart) {
          localStorage.removeItem("cart_id")
          document.cookie = "cart_id=; path=/; max-age=0"
          cartId = null
        }


      }

      let res: Response

      if (!cart) {
        res = await fetch("/api/cart/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            region_id: regionId,
            sales_channel_id: salesChannelId,
            variant_id: variantId
          })
        })

        if (!res.ok) throw new Error("Cart creation failed")

        const data = await res.json()

        const newCartId = data.cart.id as string | undefined
        if (!newCartId) {
          throw new Error("Cart creation returned no cart id")
        }

        cartId = newCartId
        saveCartId(newCartId)
        setCart(data.cart)
      } else {
        res = await fetch("/api/cart/add-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cart_id: cartId,
            variant_id: variantId
          })
        })

        if (!res.ok) throw new Error("Add item failed")

        const data = await res.json()
        setCart(data.cart)
      }

      if (pathname === "/cart") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        openCart()
      }

    } catch (error) {
      console.error("Add to cart error:", error)

      setCart(null)
      localStorage.removeItem("cart_id")
      document.cookie = "cart_id=; max-age=0; path=/"
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className={`card-button-primary primary-color-btn ${isOutOfStock ? "out-of-stock-btn" : ""
        }`}
      onClick={handleAddToCart}
      disabled={loading || isOutOfStock}
      style={{
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1
      }}
    >
      {loading ? (
        <div
          style={{
            width: "18px",
            height: "18px",
            border: "2px solid #fff",
            borderTop: "2px solid #23408B",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto"
          }}
        />
      ) : isOutOfStock ? (
        "Out of Stock"
      ) : (
        "Add to cart"
      )}
    </button>
  )
}
