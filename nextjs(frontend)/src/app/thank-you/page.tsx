import Confetti from "../components/Confetti/Confetti"
import OrderConfirmation from "../components/OrderConfirmation/OrderConfirmation"
import OrderDetails from "../components/OrderConfirmation/OrderDetails"
import OrderDataHydrator from "../components/OrderConfirmation/OrderDataHydrator"


const page = async ({
    searchParams,
}: {
    searchParams: Promise<{ order_id?: string; txnid?: string }>
}) => {
    const params = await searchParams
    const orderId = params?.order_id
    const txnid = params?.txnid

    console.log("inside the thank you page: ", orderId);

    return (
        <>

            <div className='checkout-page-wrapper thankyou-page-wrapper relative'>

                <div className='container-custom mx-auto'>

                    <div className='checkout-elemetns-wrapper'>
                        <OrderDataHydrator orderId={orderId} />

                        <div className='checkout-user-authentication-wrapper thankyou-page'>

                            <OrderConfirmation orderId={orderId} txnid={txnid} />

                        </div>

                        <div className='checkout-order-summary-wrapper'>
                            <div className='checkout-light-background-mobile'></div>

                            <OrderDetails />

                        </div>
                    </div>


                </div>

                <div className='checkout-light-background'></div>

                {orderId && (
                    <div className='checkout-confetti-wrapper'>
                        <div className='checkout-confetti-container'>
                            <Confetti />
                        </div>
                    </div>
                )}

            </div>

        </>
    )
}

export default page
