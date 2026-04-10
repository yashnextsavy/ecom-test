const BASE_URL = process.env.MEDUSA_API_BASE_URL!

function toSearchParams(entries: Array<[string, string]>) {
  const body = new URLSearchParams()
  for (const [key, value] of entries) {
    body.append(key, value)
  }
  return body
}

async function proxyToMedusaCallback(req: Request, method: "GET" | "POST") {
  const target = new URL(`${BASE_URL.replace(/\/$/, "")}/easebuzz/callback`)

  if (method === "GET") {
    const reqUrl = new URL(req.url)
    for (const [key, value] of reqUrl.searchParams.entries()) {
      target.searchParams.append(key, value)
    }

    const response = await fetch(target.toString(), {
      method: "GET",
      headers: {
        Accept: req.headers.get("accept") || "text/html",
      },
      cache: "no-store",
    })

    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "text/html; charset=utf-8",
      },
    })
  }

  const formData = await req.formData()
  const entries = Array.from(formData.entries()).map(([k, v]) => [k, String(v)]) as Array<
    [string, string]
  >

  const response = await fetch(target.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: req.headers.get("accept") || "text/html",
    },
    body: toSearchParams(entries).toString(),
    cache: "no-store",
  })

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "text/html; charset=utf-8",
    },
  })
}

export async function POST(req: Request) {
  return proxyToMedusaCallback(req, "POST")
}

export async function GET(req: Request) {
  return proxyToMedusaCallback(req, "GET")
}
