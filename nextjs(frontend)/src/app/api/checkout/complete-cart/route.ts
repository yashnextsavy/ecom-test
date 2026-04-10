import { NextResponse } from "next/server"

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractOrder(data: any) {
    return data?.order || data?.data?.order || null
}

function readIdempotencyKey(res: Response) {
    return (
        res.headers.get("idempotency-key") ||
        res.headers.get("Idempotency-Key") ||
        ""
    )
}

function normalizeKey(value: string) {
    const cleaned = value.trim().replace(/[^a-zA-Z0-9_-]/g, "_")
    return cleaned.replace(/_+/g, "_").replace(/^_+|_+$/g, "")
}

function buildCompletionIdempotencyKey(cartId: string, seed?: string) {
    const safeCartId = normalizeKey(cartId).slice(0, 64) || "cart"
    const safeSeed = normalizeKey(seed || "").slice(0, 64)
    const attempt = safeSeed || "default_attempt"
    return `complete_${safeCartId}_${attempt}`.slice(0, 128)
}

function getCompletionErrorText(data: any) {
    return String(
        data?.message || data?.error?.message || data?.error || data?.type || ""
    ).toLowerCase()
}

function isInvalidIdempotencyError(data: any) {
    const text = getCompletionErrorText(data)
    return text.includes("idempotency") && text.includes("invalid")
}

async function fetchCartOrder(cartId: string) {
    const cartRes = await fetch(
        `${process.env.MEDUSA_API_BASE_URL}/store/carts/${cartId}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_API_KEY!,
            },
            cache: "no-store",
        }
    )
    const cartData = await cartRes.json().catch(() => null)
    const cart = cartData?.cart
    const embeddedOrder = cart?.order

    if (embeddedOrder?.id) {
        return embeddedOrder
    }

    if (cart?.order_id) {
        const orderRes = await fetch(
            `${process.env.MEDUSA_API_BASE_URL}/store/orders/${cart.order_id}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_API_KEY!,
                },
                cache: "no-store",
            }
        )
        const orderData = await orderRes.json().catch(() => null)
        const fetchedOrder = orderData?.order || orderData?.data?.order
        if (fetchedOrder?.id) {
            return fetchedOrder
        }
    }

    return null
}

async function waitForOrder(cartId: string, tries = 8, delayMs = 1200) {
    for (let i = 0; i < tries; i++) {
        const order = await fetchCartOrder(cartId)
        if (order?.id) {
            return order
        }
        await wait(delayMs)
    }
    return null
}

export async function POST(req: Request) {
    try {
        const { cart_id, idempotency_key } = await req.json()

        const cartId = String(cart_id || "").trim()
        if (!cartId) {
            return NextResponse.json({ error: "Cart ID is required" }, { status: 400 })
        }

        let idempotencyKey =
            typeof idempotency_key === "string" && idempotency_key.trim().length > 0
                ? buildCompletionIdempotencyKey(cartId, idempotency_key)
                : buildCompletionIdempotencyKey(cartId)
        let lastData: any = null

        // Retry completion with a stable idempotency key and poll for resulting order.
        for (let attempt = 0; attempt < 4; attempt++) {
            const res = await fetch(
                `${process.env.MEDUSA_API_BASE_URL}/store/carts/${cartId}/complete`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_API_KEY!,
                        "Idempotency-Key": idempotencyKey,
                    },
                    cache: "no-store",
                }
            )

            const data = await res.json().catch(() => null)
            lastData = data
            const nextKey = readIdempotencyKey(res)
            if (nextKey) {
                idempotencyKey = buildCompletionIdempotencyKey(cartId, nextKey)
            }

            console.log("MEDUSA COMPLETE CART RESPONSE:", {
                cart_id: cartId,
                attempt: attempt + 1,
                status: res.status,
                idempotency_key: idempotencyKey,
                data,
            })

            const order = extractOrder(data)
            if (order?.id) {
                return NextResponse.json({ order })
            }

            if (res.ok) {
                return NextResponse.json(data)
            }

            if (isInvalidIdempotencyError(data)) {
                idempotencyKey = buildCompletionIdempotencyKey(
                    cartId,
                    `${idempotencyKey}_${attempt + 1}`
                )
                continue
            }

            if (res.status !== 409 && res.status !== 202) {
                return NextResponse.json(
                    {
                        error:
                            data?.message ||
                            data?.error?.message ||
                            data?.error ||
                            "Failed to complete cart",
                        details: data,
                    },
                    { status: res.status }
                )
            }

            // 409/202 usually means completion is still in-flight.
            // Poll cart/order first to avoid conflict loops.
            const orderFromCart = await waitForOrder(cartId, 8, 1200)
            if (orderFromCart?.id) {
                return NextResponse.json({ order: orderFromCart })
            }
        }

        return NextResponse.json(
            {
                pending: true,
                error:
                    "Cart completion is still in progress. Please retry shortly.",
                details: lastData,
            },
            { status: 202 }
        )
    } catch (error) {
        console.error("Complete cart error:", error)
        return NextResponse.json({ error: "Failed to complete cart" }, { status: 500 })
    }
}
