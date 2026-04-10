function toRecordFromEntries(entries: Iterable<[string, string]>) {
    const payload: Record<string, string> = {}
    for (const [key, value] of entries) {
        payload[key] = value
    }
    return payload
}

const FRONTEND_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.trim()

function getRedirectOrigin(req: Request) {
    if (FRONTEND_BASE_URL) {
        try {
            return new URL(FRONTEND_BASE_URL).origin
        } catch {
            // fall back to request origin below
        }
    }
    return new URL(req.url).origin
}

function htmlRedirect(redirectTo: string, payload: Record<string, string>) {
    const safeRedirect = JSON.stringify(redirectTo)
    const safePayload = JSON.stringify(payload)

    return `<!doctype html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body>
  <script>
    try { sessionStorage.setItem("easebuzz_callback_payload", ${safePayload}); } catch (_e) {}
    try { localStorage.removeItem("checkout_payment_lock_v1"); } catch (_e) {}
    window.location.replace(${safeRedirect});
  </script>
</body>
</html>`
}

function buildRedirectUrl(req: Request, payload: Record<string, string>) {
    const reqUrl = new URL(req.url)
    const cartId = payload.udf5 || reqUrl.searchParams.get("cart_id") || ""
    const txnid = payload.txnid || reqUrl.searchParams.get("txnid") || ""
    const redirectUrl = new URL("/payment-failure", getRedirectOrigin(req))
    redirectUrl.searchParams.set("gateway", "easebuzz")
    redirectUrl.searchParams.set("status", "failed")
    redirectUrl.searchParams.set("reason", "gateway_failed")
    if (cartId) redirectUrl.searchParams.set("cart_id", cartId)
    if (txnid) redirectUrl.searchParams.set("txnid", txnid)
    return redirectUrl.toString()
}

export async function POST(req: Request) {
    const formData = await req.formData()
    const entries = Array.from(formData.entries()).map(([k, v]) => [k, String(v)]) as Array<
        [string, string]
    >
    const payload = toRecordFromEntries(entries)
    console.log("[Easebuzz failure callback] body:", payload)
    console.log("[Easebuzz failure callback] query:", Object.fromEntries(new URL(req.url).searchParams.entries()))
    return new Response(htmlRedirect(buildRedirectUrl(req, payload), payload), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    })
}

export async function GET(req: Request) {
    const reqUrl = new URL(req.url)
    const payload = toRecordFromEntries(reqUrl.searchParams.entries())
    return new Response(htmlRedirect(buildRedirectUrl(req, payload), payload), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    })
}
