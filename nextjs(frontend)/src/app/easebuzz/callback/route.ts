function toRecordFromObjectEntries(
    entries: Iterable<[string, string]>
): Record<string, string> {
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

function buildRedirectUrl(req: Request, payload: Record<string, string>) {
    const reqUrl = new URL(req.url)
    const statusRaw =
        payload.status ||
        payload.tx_status ||
        payload.payment_status ||
        payload.result
    const status = (statusRaw || "unknown").toLowerCase()
    const cartId = payload.udf5 || reqUrl.searchParams.get("cart_id") || ""
    const txnid = payload.txnid || reqUrl.searchParams.get("txnid") || ""

    const isSuccess =
        status === "success" ||
        status === "successful" ||
        status === "authorized" ||
        status === "captured"

    const redirectUrl = new URL(
        isSuccess ? "/payment-success" : "/payment-failure",
        getRedirectOrigin(req)
    )
    redirectUrl.searchParams.set("gateway", "easebuzz")
    redirectUrl.searchParams.set("status", status)
    if (!isSuccess) {
        redirectUrl.searchParams.set("reason", "gateway_failed")
    }

    if (cartId) {
        redirectUrl.searchParams.set("cart_id", cartId)
    }
    if (txnid) {
        redirectUrl.searchParams.set("txnid", txnid)
    }

    return redirectUrl.toString()
}

function htmlRedirect(redirectTo: string, payload: Record<string, string>) {
    const escapedRedirect = JSON.stringify(redirectTo)
    const escapedPayload = JSON.stringify(payload)

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting...</title>
</head>
<body>
  <script>
    try {
      sessionStorage.setItem("easebuzz_callback_payload", ${escapedPayload});
    } catch (_e) {}
    try {
      localStorage.removeItem("checkout_payment_lock_v1");
    } catch (_e) {}
    window.location.replace(${escapedRedirect});
  </script>
  <noscript>
    <p>Payment processed. <a href=${escapedRedirect}>Continue</a></p>
  </noscript>
</body>
</html>`
}

export async function POST(req: Request) {
    const formData = await req.formData()
    const entries = Array.from(formData.entries()).map(([key, value]) => [
        key,
        String(value),
    ]) as Array<[string, string]>
    const payload = toRecordFromObjectEntries(entries)
    const redirectTo = buildRedirectUrl(req, payload)

    return new Response(htmlRedirect(redirectTo, payload), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    })
}

export async function GET(req: Request) {
    const reqUrl = new URL(req.url)
    const payload = toRecordFromObjectEntries(reqUrl.searchParams.entries())
    const redirectTo = buildRedirectUrl(req, payload)

    return new Response(htmlRedirect(redirectTo, payload), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    })
}
