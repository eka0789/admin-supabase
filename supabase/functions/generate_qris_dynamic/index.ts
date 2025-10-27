// deno run -A supabase/functions/generate_qris_dynamic/index.ts
import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY")!;
const MIDTRANS_BASE = Deno.env.get("MIDTRANS_BASE") || "https://api.sandbox.midtrans.com";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const { user_id, amount = 1000 } = await req.json();
    if (!user_id) return new Response("user_id required", { status: 400 });

    // minimal verifikasi user
    const { data: prof, error } = await supabase
      .from("profiles").select("id, name").eq("id", user_id).single();
    if (error || !prof) return new Response("profile not found", { status: 404 });

    // order_id unik bawa konteks user
    const orderId = `KKSUQR-${user_id}-${Date.now()}`;

    const payload = {
      payment_type: "qris",
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      qris: { acquirer: "gopay" } // atau "shopeepay" sesuai aktivasi
    };

    const auth = "Basic " + btoa(`${MIDTRANS_SERVER_KEY}:`);
    const res = await fetch(`${MIDTRANS_BASE}/v2/charge`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization": auth },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), { status: 400 });
    }

    // Ambil QR image URL dari actions (generate-qr-code)
    // Catatan: docs menyebut "actions" mengandung URL QR untuk ditampilkan. 
    const actions = data.actions || [];
    const qrAction = actions.find((a: any) =>
      (a.name || "").toLowerCase().includes("generate-qr-code") || (a.method || "").toLowerCase() === "qr" || a.url
    );
    const qris_image_url = qrAction?.url || data.qr_string || null;

    // Simpan "terakhir dibuat" ke profil (pseudo-static untuk tampilkan di UI)
    await supabase.from("profiles").update({
      qris_image_url,
      qris_code: data.qr_string ?? null
    }).eq("id", user_id);

    return new Response(JSON.stringify({
      order_id: orderId,
      qris_image_url,
      qr_string: data.qr_string ?? null
    }), { status: 200 });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});

