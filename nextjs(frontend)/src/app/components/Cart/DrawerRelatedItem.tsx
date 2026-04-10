'use client'

import AddToCartButton from "../AddToCartButton/AddToCartButton"

const DrawerRelatedItem = ({ item }: any) => {
    return (
        <div className="drawer-related-item">

            <div className="drawer-related-left">
                <img src={item.image} alt={item.title} />
            </div>

            <div className="drawer-related-center">
                <h4>{item.title}</h4>

                <div className="drawer-related-price">
                    ₹{item.prices?.[0]?.our_price}
                </div>
            </div>

            <div className="drawer-related-right">
                <AddToCartButton
                    variantId={item.variants?.[0]?.id}
                    productId={item.id}
                    regionId={item.region_id}
                    salesChannelId={item.sales_channel_id}
                    isOutOfStock={item.is_out_of_stock}
                />
            </div>

        </div>
    )
}

export default DrawerRelatedItem
