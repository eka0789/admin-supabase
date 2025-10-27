"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
    id: string;
    name: string | null;
    phone: string | null;
    qris_code: string | null;
    qris_image_url: string | null;
};

export default function AdminQrisPage() {
    const [rows, setRows] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, name, phone, qris_code, qris_image_url")
            .order("created_at", { ascending: false });
        if (!error) setRows(data as Profile[]);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-semibold">QRIS Anggota</h1>
            <p className="text-sm text-gray-600">
                Mode: <b>Static by Admin</b> (set manual) + <b>Dynamic Fallback</b> (Midtrans /v2/charge)
            </p>

            <table className="w-full border text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="border p-2">Nama</th>
                        <th className="border p-2">Telepon</th>
                        <th className="border p-2">QRIS</th>
                        <th className="border p-2 w-72">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((p) => (
                        <tr key={p.id}>
                            <td className="border p-2">{p.name}</td>
                            <td className="border p-2">{p.phone}</td>
                            <td className="border p-2">
                                {p.qris_image_url ? (
                                    <img src={p.qris_image_url} alt="qris" className="w-20 h-20 object-contain" />
                                ) : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="border p-2 space-y-2">
                                <SetStaticForm profileId={p.id} onDone={fetchData} />
                                <DynamicGenerateButton profileId={p.id} onDone={fetchData} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SetStaticForm({ profileId, onDone }: { profileId: string; onDone: () => void }) {
    const [img, setImg] = useState("");  // URL gambar QR statis (mis. upload ke bucket qris/)
    const [code, setCode] = useState(""); // (opsional) string EMV QRIS bila Anda punya
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        const { error } = await supabase.from("profiles").update({
            qris_image_url: img || null,
            qris_code: code || null
        }).eq("id", profileId);
        setSaving(false);
        if (error) return alert("Gagal simpan: " + error.message);
        onDone();
    };

    return (
        <div className="flex gap-2 items-center">
            <input
                placeholder="Static QR Image URL"
                className="border px-2 py-1 text-xs w-64"
                value={img} onChange={(e) => setImg(e.target.value)}
            />
            <input
                placeholder="(Opsional) QR EMV string"
                className="border px-2 py-1 text-xs w-64"
                value={code} onChange={(e) => setCode(e.target.value)}
            />
            <button onClick={save} disabled={saving}
                className="px-3 py-1 bg-gray-700 text-white text-xs rounded">
                {saving ? "Menyimpan..." : "Set Static"}
            </button>
        </div>
    );
}

function DynamicGenerateButton({ profileId, onDone }: { profileId: string; onDone: () => void }) {
    const [loading, setLoading] = useState(false);

    const run = async () => {
        setLoading(true);
        const res = await fetch("/api/admin/qris/dynamic", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: profileId, amount: 1000 })
        });
        setLoading(false);
        if (!res.ok) {
            const t = await res.text();
            return alert("Gagal generate dynamic: " + t);
        }
        onDone();
    };

    return (
        <button onClick={run} disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded">
            {loading ? "Proses..." : "Generate (Dynamic Fallback)"}
        </button>
    );
}
