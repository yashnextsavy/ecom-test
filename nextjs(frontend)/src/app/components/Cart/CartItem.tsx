import Link from "next/link";
import QuantitySelector from "./QuantitySelector";
import { formatPrice } from "@/lib/utils/formatPrice";

type CartItemProps = {
    item?: {
        id: string;
        title: string;
        productLink: string;
        image: string;
        quantity: number;
        actualPrice: number;
        discountedPrice: number;
        isOutOfStock?: boolean;
    };
    loading?: boolean;
};

const CartItem = ({ item, loading = false }: CartItemProps) => {
    if (loading || !item) {
        return (
            <div className="cart-item-wrapper animate-pulse">
                <div className="cart-item">
                    <div className="cart-item-left-img bg-gray-200 w-20 h-20 rounded"></div>
                    <div className="cart-item-center flex-1 ml-4 space-y-2">
                        <div className="h-5 bg-gray-200 w-3/4 rounded"></div>
                        <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
                    </div>
                    <div className="cart-item-right desktop hidden md:flex bg-gray-200 w-20 h-10 rounded"></div>
                </div>
                <div className="cart-item-right mobile flex md:hidden bg-gray-200 w-full h-10 rounded mt-2"></div>
            </div>
        );
    }

    return (

        // className={`cart-item-wrapper ${item?.isOutOfStock ? "out-of-stock-item" : ""
        //     }`}


        <div className="cart-item-wrapper">
            <div className="cart-item">
                <div className={`cart-item-left-img ${item?.isOutOfStock ? "out-of-stock-item" : ""}`}>
                    <img src={item!.image} alt={item!.title} />
                </div>

                <div className="cart-item-center cart-voucher-title">
                    <h4 className={`${item?.isOutOfStock ? "out-of-stock-item" : ""
                        }`} >
                        <Link href={item!.productLink}>{item!.title}</Link>
                    </h4>
                    {item!.isOutOfStock && (
                        <span style={{ color: "#dc2626", fontSize: "12px", fontWeight: 600 }}>
                            Out of stock
                        </span>
                    )}

                    <div className={`cart-item-price ${item?.isOutOfStock ? "out-of-stock-item" : ""}`}>
                        {item!.actualPrice !== item!.discountedPrice ? (
                            <>
                                <div className="cart-item-discounted-price">
                                    ₹{formatPrice(item!.discountedPrice)}
                                </div>
                                <div className="cart-item-actual-price">
                                    ₹{formatPrice(item!.actualPrice)}
                                </div>
                            </>
                        ) : (
                            <div className="cart-item-discounted-price">
                                ₹{formatPrice(item!.discountedPrice)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="cart-item-right desktop hidden md:flex">
                    <QuantitySelector quantity={item!.quantity} itemId={item!.id} isOutOfStock={item?.isOutOfStock} />
                </div>
            </div>

            <div className="cart-item-right mobile flex md:hidden">
                <QuantitySelector quantity={item!.quantity} itemId={item!.id} />
            </div>

            {item!.actualPrice !== item!.discountedPrice && (
                <div className={`cart-item-saving div-confetti ${item?.isOutOfStock ? "out-of-stock-item" : ""}`}>
                    <img src="/assets/images/confetti.svg" alt="confetti" /> You saved{" "}
                    <strong>₹{formatPrice(item!.actualPrice - item!.discountedPrice)}</strong> on
                    this voucher
                </div>
            )}
        </div>
    );
};

export default CartItem;
