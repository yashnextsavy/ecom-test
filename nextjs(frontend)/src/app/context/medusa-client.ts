const BASE_URL = process.env.MEDUSA_API_BASE_URL

export const createMedusaCart = async (variantId: string) => {

    const res = await fetch(`${BASE_URL}/store/carts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_API_KEY || ""
        },
        body: JSON.stringify({
            region_id: "reg_01KGPYG739RK5C9N02SCWFEXW1",
            sales_channel_id: "sc_01KGPTNP9JY4KGVR5C0T5YW76J",
            items: [
                {
                    variant_id: variantId,
                    quantity: 1
                }
            ]
        })
    })

    return res.json()
}

export const getMedusaCart = async (cartId: string) => {

    const res = await fetch(`${BASE_URL}/store/carts/${cartId}`)

    return res.json()

}

export const addMedusaLineItem = async (cartId: string, variantId: string) => {

    const res = await fetch(`${BASE_URL}/store/carts/${cartId}/line-items`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || ""
        },
        body: JSON.stringify({
            variant_id: variantId,
            quantity: 1
        })
    })

    return res.json()

}