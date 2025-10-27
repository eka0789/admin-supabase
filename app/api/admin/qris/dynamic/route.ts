import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate_qris_dynamic`, {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` // panggil sebagai admin
    },
    body: JSON.stringify(body)
  });
  const text = await r.text();
  return new NextResponse(text, { status: r.status });
}
