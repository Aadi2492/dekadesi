import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const base = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/$/, "");
  try {
    const body = await req.text();
    const upstream = await fetch(`${base}/payments/verify`, { method: "POST", headers: { "content-type": "application/json" }, body, cache: "no-store" });
    const raw = await upstream.text();
    return new NextResponse(raw, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json" } });
  } catch {
    return NextResponse.json({ message: "Could not reach payment verification API." }, { status: 502 });
  }
}
