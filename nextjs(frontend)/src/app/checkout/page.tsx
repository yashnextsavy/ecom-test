import React from 'react'
import UserAuthentication from '../components/checkout/UserAuthentication'
import OrderSummary from '../components/checkout/OrderSummary'
import { cookies } from "next/headers"
import { getMedusaCart } from "@/lib/api";
import { redirect } from "next/navigation"
import { getContactPageData } from '@/lib/api';
import CheckoutGuard from '@/app/components/checkout/CheckoutGuard';

const page = async () => {


    const cartId = (await cookies()).get("cart_id")?.value
    const contactData = await getContactPageData();


    let cart = null
    let cartData = null

    if (cartId) {
        cartData = await getMedusaCart(cartId)
        cart = cartData?.cart
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        redirect("/cart")
    }

    const inStockItems = cart.items.filter((item: any) => !item?.is_out_of_stock)

    if (inStockItems.length === 0) {
        redirect("/cart")
    }

    const filteredCart = {
        ...cart,
        items: inStockItems,
    }

    return (
        <>

            <CheckoutGuard />

            <div className='checkout-page-wrapper'>
                <div className='container-custom mx-auto'>

                    <div className='checkout-elemetns-wrapper'>
                        <div className='checkout-user-authentication-wrapper'>



                            <UserAuthentication />

                        </div>

                        <div className='checkout-order-summary-wrapper'>
                            <div className='checkout-light-background-mobile'></div>

                            <OrderSummary cart={filteredCart}
                                contactData={contactData}

                            />

                        </div>
                    </div>


                </div>

                <div className='checkout-light-background'></div>

            </div>




        </>
    )
}

export default page
