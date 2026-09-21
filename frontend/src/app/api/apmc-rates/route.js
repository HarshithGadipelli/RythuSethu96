import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const state = searchParams.get("state");
    const source = searchParams.get("source");

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const endpoint = `${backendUrl.replace(/\/api\/?$/, "")}/api/crops/apmc-realtime`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 30 } // 30s cache
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (fetchErr) {
      clearTimeout(timeout);
    }

    // Direct fallback if backend is unreachable
    return NextResponse.json({
      success: true,
      source: "Fallback In-Memory Commodity Feed",
      lastUpdated: new Date().toISOString(),
      data: []
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
