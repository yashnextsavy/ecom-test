// app/api/detect-country/route.ts
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const res = await fetch("https://ipapi.co/json/");
        const raw = await res.text();
        const contentType = res.headers.get("content-type") || "";

        let data: { country_name?: string } | null = null;

        if (contentType.includes("application/json")) {
            try {
                data = JSON.parse(raw);
            } catch {
                data = null;
            }
        }

        const country = data?.country_name || "India"; // fallback if API responds but no country_name
        return NextResponse.json({ country_name: country });
    } catch (err) {
        console.error("Country detection failed:", err);
        // Fallback to India instead of returning 500
        return NextResponse.json({ country_name: "India" });
    }
}
