'use client'

import { createContext, useContext, useEffect, useState } from "react"
import { useCallback } from "react";


type CartContextType = {
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  cart: any
  setCart: (cart: any) => void
  refreshCart: () => Promise<void>
  loading: boolean
}

const CartContext = createContext<CartContextType | null>(null)
const CART_SYNC_SIGNAL_KEY = "cart_sync_signal"

export const CartProvider = ({ children }: { children: React.ReactNode }) => {

  const [isOpen, setIsOpen] = useState(false)
  const [cart, setCartState] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)

  const emitCartSyncSignal = useCallback(() => {
    try {
      localStorage.setItem(CART_SYNC_SIGNAL_KEY, `${Date.now()}_${Math.random()}`)
    } catch (error) {
      console.error("Failed to emit cart sync signal", error)
    }
  }, [])

  const setCart = useCallback((nextCart: any) => {
    setCartState(nextCart)
    emitCartSyncSignal()
  }, [emitCartSyncSignal])

  const clearClientCartState = useCallback((options?: { broadcast?: boolean }) => {
    setCartState(null)
    try {
      localStorage.removeItem("cart_id")
      localStorage.removeItem("checkout_pending_payment")
      localStorage.removeItem("checkout_payment_lock_v1")
      const rawCheckoutData = localStorage.getItem("checkout_data")
      if (rawCheckoutData) {
        try {
          const parsed = JSON.parse(rawCheckoutData) as Record<string, any>
          const { payment: _payment, ...rest } = parsed
          localStorage.setItem("checkout_data", JSON.stringify({ ...rest, cartId: null }))
        } catch {
          // ignore invalid checkout_data
        }
      }
      sessionStorage.removeItem("checkout_in_progress")
      sessionStorage.removeItem("easebuzz_callback_payload")
    } catch (error) {
      console.error("Failed to clear client cart state", error)
    }
    document.cookie = "cart_id=; Max-Age=0; path=/"
    if (options?.broadcast !== false) {
      emitCartSyncSignal()
    }
  }, [emitCartSyncSignal])

  // ✅ GET CART ID (cookie + fallback)
  const getCartId = () => {
    const cookieCartId =
      document.cookie
        .split("; ")
        .find(row => row.startsWith("cart_id="))
        ?.split("=")[1]

    return cookieCartId || localStorage.getItem("cart_id")
  }

  // ✅ REFRESH CART
  // const refreshCart = async () => {
  //   const cartId = getCartId()
  //   if (!cartId) {
  //     setCart(null)
  //     return
  //   }

  //   setLoading(true)

  //   try {
  //     const res = await fetch(`/api/cart/get?cart_id=${cartId}`)
  //     const data = await res.json()

  //     console.log("REFRESH STATUS:", res.status)
  //     console.log("REFRESH CART RESPONSE:", data)

  //     if (data?.cart && !data.cart.completed_at) {
  //       setCart(data.cart)
  //     } else {
  //       // ✅ cart is completed or invalid → clear it
  //       setCart(null)
  //       localStorage.removeItem("cart_id")
  //       document.cookie = "cart_id=; Max-Age=0; path=/"
  //     }

  //   } catch (err) {
  //     console.error("Cart fetch failed", err)
  //   } finally {
  //     setLoading(false)
  //   }
  // }
  // const refreshCart = useCallback(async () => {
  //   const cartId = getCartId();
  //   if (!cartId) {
  //     setCart(null);
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     const res = await fetch(`/api/cart/get?cart_id=${cartId}`);
  //     const data = await res.json();

  //     if (data?.cart && !data.cart.completed_at) {
  //       setCart(data.cart);
  //     } else {
  //       setCart(null);
  //       localStorage.removeItem("cart_id");
  //       document.cookie = "cart_id=; Max-Age=0; path=/";
  //     }
  //   } catch (err) {
  //     console.error("Cart fetch failed", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);
  const refreshCart = useCallback(async (options?: { silent?: boolean }) => {
    const cartId = getCartId();
    if (!cartId) {
      clearClientCartState({ broadcast: options?.silent ? false : true });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/cart/get?cart_id=${cartId}`);
      const data = await res.json();

      const cartData = data?.cart;

      // ✅ calculate total quantity
      const totalQuantity =
        cartData?.items?.reduce((sum: number, item: any) => {
          return sum + (item.quantity || 0);
        }, 0) || 0;

      // ✅ condition to clear cart
      if (
        !cartData ||
        cartData.completed_at ||
        totalQuantity === 0
      ) {
        clearClientCartState({ broadcast: options?.silent ? false : true });
        return;
      }

      setCartState(cartData);

    } catch (err) {
      console.error("Cart fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [clearClientCartState]);

  // useEffect(() => {
  //   const initCart = async () => {
  //     const cartId = getCartId()

  //     console.log("INIT cartId:", cartId)

  //     if (cartId) {
  //       await refreshCart()
  //     }
  //   }

  //   initCart()
  // }, [])

  useEffect(() => {
    const cartId = getCartId();

    if (cartId) {
      refreshCart();
    }
  }, [refreshCart]);


  // useEffect(() => {
  //   const syncCart = () => {
  //     console.log(" Cart sync triggered from another tab")

  //     const cartId =
  //       document.cookie
  //         .split("; ")
  //         .find(row => row.startsWith("cart_id="))
  //         ?.split("=")[1]

  //     if (!cartId) {
  //       setCart(null)
  //     } else {
  //       refreshCart()
  //     }
  //   }

  //   window.addEventListener("storage", syncCart)

  //   return () => {
  //     window.removeEventListener("storage", syncCart)

  //   }
  // }, [])


  useEffect(() => {
    const syncCart = () => {
      console.log("🔄 Cart sync triggered from another tab")
      refreshCart({ silent: true })
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === "cart_id" || event.key === CART_SYNC_SIGNAL_KEY) {
        syncCart()
      }
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener("focus", syncCart);

    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("focus", syncCart);

    }
  }, [refreshCart])


  useEffect(() => {
    console.log("Cart Updated:", cart)
  }, [cart])

  return (
    <CartContext.Provider
      value={{
        isOpen,
        openCart,
        closeCart,
        cart,
        setCart,
        refreshCart,
        loading
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }

  return context
}
