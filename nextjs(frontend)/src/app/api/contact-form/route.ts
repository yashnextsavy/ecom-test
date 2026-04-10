import { NextResponse } from "next/server"

const BASE_URL = process.env.MEDUSA_API_BASE_URL
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_API_KEY

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const fullName = body?.fullName ?? body?.full_name
        const emailID = body?.emailID ?? body?.email ?? body?.email_id
        const mobileNumber = body?.mobileNumber ?? body?.mobile ?? body?.mobile_number
        const country = body?.country
        const vendor = body?.vendor
        const course = body?.course
        const message = body?.message
        const pageUrl = body?.pageUrl ?? body?.page_url
        const resolvedPageUrl =
            typeof pageUrl === "string" && pageUrl.trim() ? pageUrl.trim() : "/"
        const captchaToken = body?.captchaToken

        //  Basic validation
        if (!fullName || !emailID || !mobileNumber) {
            return NextResponse.json(
                { error: "fullName, emailID and mobileNumber are required" },
                { status: 400 }
            )
        }

        if (!BASE_URL || !PUBLISHABLE_KEY) {
            console.error("contact-form env missing", {
                hasBaseUrl: !!BASE_URL,
                hasPublishableKey: !!PUBLISHABLE_KEY,
            })
            return NextResponse.json(
                { error: "Server is not configured for contact form submission" },
                { status: 500 }
            )
        }

        if (!captchaToken) {
            return NextResponse.json(
                { error: "Captcha token is missing" },
                { status: 400 }
            )
        }

        const verifyRes = await fetch(
            "https://www.google.com/recaptcha/api/siteverify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
            }
        )

        const verifyData = await verifyRes.json()

        if (!verifyData.success) {
            return NextResponse.json(
                { error: "Captcha verification failed" },
                { status: 400 }
            )
        }

        //  Call Medusa API
        // const res = await fetch(`${BASE_URL}/store/contact-requests`, {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json",
        //         "x-publishable-api-key": PUBLISHABLE_KEY,
        //     },
        //     body: JSON.stringify({
        //         fullName,
        //         emailID,
        //         mobileNumber,
        //         country,
        //         vendor,
        //         course,
        //         message,
        //         pageUrl: resolvedPageUrl,

        //     }),
        // })

        // ✅ Build payload first
        const medusaPayload: any = {
            fullName,
            emailID,
            mobileNumber,
            country,
            vendor,
            pageUrl: resolvedPageUrl,
        };

        //  Optional fields
        if (course) {
            medusaPayload.course = course;
        }

        if (typeof message === "string" && message.trim()) {
            medusaPayload.message = message.trim();
        }

        // Then send it
        const res = await fetch(`${BASE_URL}/store/contact-requests`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-publishable-api-key": PUBLISHABLE_KEY,
            },
            body: JSON.stringify(medusaPayload),
        });


        const text = await res.text()
        let data: any = null

        try {
            data = text ? JSON.parse(text) : null
        } catch {
            data = null
        }

        if (!res.ok) {
            return NextResponse.json(
                {
                    error:
                        data?.message ||
                        data?.error?.message ||
                        data?.error ||
                        "Failed to submit contact request",
                    details: data ?? text,
                },
                { status: res.status }
            )
        }

        if (data?.error || data?.success === false) {
            return NextResponse.json(
                {
                    error:
                        data?.message ||
                        data?.error?.message ||
                        data?.error ||
                        "Contact request was not saved",
                    details: data,
                },
                { status: 502 }
            )
        }

        if (!data) {
            return NextResponse.json(
                { success: true, message: "Contact request submitted" },
                { status: res.status }
            )
        }

        return NextResponse.json(data, { status: res.status })

    } catch (err) {
        console.error("Contact API Error:", err)
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        )
    }
}
