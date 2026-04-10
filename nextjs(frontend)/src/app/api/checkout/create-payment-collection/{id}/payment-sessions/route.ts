export async function POST(req: Request) {
    try {
        const { payment_collection_id } = await req.json()

        const res = await fetch(
            `${process.env.MEDUSA_API_BASE_URL}/store/payment-collections/${payment_collection_id}/payment-sessions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-publishable-api-key": process.env.MEDUSA_PUBLISHABLE_API_KEY!,
                },
                body: JSON.stringify({
                    provider_id: "pp_easebuzz_default"
                }),
            }
        )

        const data = await res.json()

        return Response.json(data)

    } catch (err) {
        console.error(err)
        return Response.json({ error: "Failed" }, { status: 500 })
    }
}
