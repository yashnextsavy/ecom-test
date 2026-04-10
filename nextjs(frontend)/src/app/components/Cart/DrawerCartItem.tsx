// import QuantitySelector from "./QuantitySelector";
// import { formatPrice } from "@/lib/utils/formatPrice";

// type CartItemType = {
//     id: string
//     title: string
//     image: string
//     quantity: number
//     actualPrice: number
//     discountedPrice: number
// }

// const CartItem = ({ item }: { item: CartItemType }) => {

//     console.log("check format : ", item);
//     const savedAmount = item?.actualPrice - item?.discountedPrice
//     return (
//         <div className="cart-item-wrapper">

//             <div className="cart-item">

//                 <div className="cart-item-left-img">
//                     <img src={item?.image || "placeholder"} alt={item?.title} />
//                 </div>

//                 <div className="cart-item-center cart-voucher-title">

//                     <h4>{item?.title}</h4>

//                     <div className="drawer-pricing-qty">

//                         <div className="cart-item-price">

//                             <div className="cart-item-discounted-price">
//                                 ₹{formatPrice(item?.discountedPrice)}
//                             </div>

//                             <div className="cart-item-actual-price">
//                                 ₹{formatPrice(item?.actualPrice)}
//                             </div>

//                         </div>

//                         <div className="cart-item-right desktop">
//                             <QuantitySelector
//                                 quantity={item?.quantity}
//                                 itemId={item?.id}
//                             />
//                         </div>

//                     </div>

//                 </div>

//             </div>

//             <div className="cart-item-right mobile">
//                 <QuantitySelector
//                     quantity={item?.quantity}
//                     itemId={item?.id}
//                 />
//             </div>

//             <div className="cart-item-saving div-confetti">

//                 <img src="/assets/images/confetti.svg" alt="confetti" />

//                 <span>
//                     You saved <strong>₹{formatPrice(savedAmount)}</strong> on this voucher with <strong>Global IT Success!</strong>
//                 </span>

//             </div>

//         </div>
//     )
// }

// export default CartItem

import QuantitySelector from "./QuantitySelector";
import { formatPrice } from "@/lib/utils/formatPrice";

type CartItemType = {
    id: string
    title: string
    image: string
    quantity: number
    actualPrice: number
    discountedPrice: number
    isOutOfStock?: boolean
}

const CartItem = ({
    item,
    loading = false
}: {
    item?: CartItemType
    loading?: boolean
}) => {






    if (loading) {
        return (
            <div className="cart-item-wrapper animate-pulse">

                <div className="cart-item">

                    <div className="cart-item-left-img">
                        <div className="w-[80px] h-[60px] bg-gray-200 rounded" />
                    </div>

                    <div className="cart-item-center cart-voucher-title">

                        <h4>
                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                        </h4>

                        <div className="drawer-pricing-qty">

                            <div className="cart-item-price">

                                <div className="cart-item-discounted-price">
                                    <div className="h-4 bg-gray-200 rounded w-20 mb-1" />
                                </div>

                                <div className="cart-item-discounted-price">
                                    <div className="h-3 bg-gray-200 rounded w-16" />
                                </div>

                            </div>

                            <div className="cart-item-right desktop">
                                <div className="h-8 w-20 bg-gray-200 rounded" />
                            </div>

                        </div>

                    </div>

                </div>

                <div className="cart-item-right mobile">
                    <div className="h-8 w-20 bg-gray-200 rounded" />
                </div>

                <div className="cart-item-saving div-confetti">
                    <div className="h-4 bg-gray-200 rounded w-[90%]" />
                </div>

            </div>
        )
    }

    if (!item) {
        return null
    }

    const savedAmount = item.actualPrice - item.discountedPrice
    const hasDiscount = item.discountedPrice < item.actualPrice
    // return (
    //     <div className={`cart-item-wrapper ${item?.isOutOfStock ? "out-of-stock-item" : ""
    //         }`}>

    //         <div className="cart-item">

    //             <div className="cart-item-left-img">
    //                 <img src={item?.image || "placeholder"} alt={item?.title} />
    //             </div>

    //             <div className="cart-item-center cart-voucher-title">

    //                 <h4>{item?.title}</h4>
    //                 {item?.isOutOfStock && (
    //                     <span style={{ color: "#dc2626", fontSize: "12px", fontWeight: 600 }}>
    //                         Out of stock
    //                     </span>
    //                 )}

    //                 <div className="drawer-pricing-qty">

    //                     {/* <div className="cart-item-price">

    //                         <div className="cart-item-discounted-price">
    //                             ₹{formatPrice(item?.discountedPrice ?? 0)}
    //                         </div>

    //                         <div className="cart-item-actual-price">
    //                             ₹{formatPrice(item?.actualPrice ?? 0)}
    //                         </div>

    //                     </div> */}
    //                     <div className="cart-item-price">

    //                         <div className="cart-item-discounted-price">
    //                             ₹{formatPrice(item?.discountedPrice ?? 0)}
    //                         </div>

    //                         {hasDiscount && (
    //                             <div className="cart-item-actual-price">
    //                                 ₹{formatPrice(item?.actualPrice ?? 0)}
    //                             </div>
    //                         )}

    //                     </div>


    //                     <div className="cart-item-right desktop">
    //                         <QuantitySelector
    //                             quantity={item?.quantity}
    //                             itemId={item?.id}
    //                         />
    //                     </div>

    //                 </div>

    //             </div>

    //         </div>

    //         <div className="cart-item-right mobile">
    //             <QuantitySelector
    //                 quantity={item?.quantity}
    //                 itemId={item?.id}
    //             />
    //         </div>

    //         {/* <div className="cart-item-saving div-confetti">

    //             <img src="/assets/images/confetti.svg" alt="confetti" />

    //             <span>
    //                 You saved <strong>₹{formatPrice(savedAmount)}</strong> on this voucher with <strong>Global IT Success!</strong>
    //             </span>

    //         </div> */}
    //         {savedAmount > 0 && (
    //             <div className="cart-item-saving div-confetti">

    //                 <img src="/assets/images/confetti.svg" alt="confetti" />

    //                 <span>
    //                     You saved <strong>₹{formatPrice(savedAmount)}</strong> on this voucher with <strong>Global IT Success!</strong>
    //                 </span>

    //             </div>
    //         )}

    //     </div>
    // )
    return (
        <div className="cart-item-wrapper">

            <div className="cart-item">

                <div className={`cart-item-left-img ${item.isOutOfStock ? "out-of-stock-item" : ""}`}>
                    <img src={item.image || "placeholder"} alt={item.title} />
                </div>

                <div className="cart-item-center cart-voucher-title">

                    <h4 className={`${item.isOutOfStock ? "out-of-stock-item" : ""}`}>
                        {item.title}
                    </h4>

                    {item.isOutOfStock && (
                        <span style={{ color: "#dc2626", fontSize: "12px", fontWeight: 600 }}>
                            Out of stock
                        </span>
                    )}

                    <div className="drawer-pricing-qty">

                        <div className={`cart-item-price ${item.isOutOfStock ? "out-of-stock-item" : ""}`}>

                            <div className="cart-item-discounted-price">
                                ₹{formatPrice(item?.discountedPrice ?? 0)}
                            </div>

                            {hasDiscount && (
                                <div className="cart-item-actual-price">
                                    ₹{formatPrice(item?.actualPrice ?? 0)}
                                </div>
                            )}

                        </div>

                        <div className="cart-item-right desktop">
                            <QuantitySelector
                                quantity={item.quantity}
                                itemId={item.id}
                                isOutOfStock={item.isOutOfStock}
                            />
                        </div>

                    </div>

                </div>

            </div>

            <div className="cart-item-right mobile">
                <QuantitySelector
                    quantity={item.quantity}
                    itemId={item.id}
                    isOutOfStock={item.isOutOfStock}
                />
            </div>

            {savedAmount > 0 && (
                <div className={`cart-item-saving div-confetti ${item.isOutOfStock ? "out-of-stock-item" : ""}`}>
                    <img src="/assets/images/confetti.svg" alt="confetti" />
                    <span>
                        You saved <strong>₹{formatPrice(savedAmount)}</strong> on this voucher with <strong>Global IT Success!</strong>
                    </span>
                </div>
            )}

        </div>
    )
}

export default CartItem
