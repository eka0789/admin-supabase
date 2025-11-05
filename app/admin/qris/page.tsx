"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { QrCode, RefreshCcw, Image, Link2 } from "lucide-react";
import Button from "@/components/ui/Button";

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

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-slate-500 animate-pulse">
                Memuat data QRIS...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-100 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <QrCode className="text-slate-700" />
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                            Manajemen QRIS Anggota
                        </h1>
                    </div>
                    <Button onClick={fetchData} variant="outline">
                        <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </div>

                <p className="text-sm text-slate-500">
                    Mode: <b>Static by Admin</b> (QR diatur manual) + <b>Dynamic Fallback</b> (via Midtrans /v2/charge)
                </p>

                {/* Table View */}
                <Card className="border border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Daftar QRIS Anggota</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-left text-slate-600 bg-slate-50 border-b">
                                        <th className="px-3 py-2">Nama</th>
                                        <th className="px-3 py-2">Telepon</th>
                                        <th className="px-3 py-2">QRIS</th>
                                        <th className="px-3 py-2 w-96 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((p, i) => (
                                        <motion.tr
                                            key={p.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="bg-white shadow-sm hover:shadow-md transition rounded-xl"
                                        >
                                            <td className="px-3 py-3 font-medium text-slate-700 rounded-l-xl">
                                                {p.name || "-"}
                                            </td>
                                            <td className="px-3 py-3 text-slate-600">{p.phone || "-"}</td>
                                            <td className="px-3 py-3 text-center">
                                                {p.qris_image_url ? (
                                                    <img
                                                        src={p.qris_image_url}
                                                        alt="qris"
                                                        className="w-20 h-20 object-contain rounded-md border border-slate-200 mx-auto"
                                                    />
                                                ) : (
                                                    <span className="text-gray-400 italic">Belum diatur</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 rounded-r-xl text-center space-y-3">
                                                <SetStaticForm profileId={p.id} onDone={fetchData} />
                                                <DynamicGenerateButton profileId={p.id} onDone={fetchData} />
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// --- Static QR Setter ---
function SetStaticForm({ profileId, onDone }: { profileId: string; onDone: () => void }) {
    const [img, setImg] = useState("");
    const [code, setCode] = useState("");
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        const { error } = await supabase
            .from("profiles")
            .update({ qris_image_url: img || null, qris_code: code || null })
            .eq("id", profileId);
        setSaving(false);
        if (error) return alert("Gagal simpan: " + error.message);
        onDone();
    };

    return (
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
            <div className="relative">
                <input
                    placeholder="URL Gambar QR Statis"
                    className="border border-slate-300 rounded-md px-2 py-1 text-xs w-60 focus:ring-2 focus:ring-green-500"
                    value={img}
                    onChange={(e) => setImg(e.target.value)}
                />
                <Image className="absolute right-2 top-2 text-slate-400 w-4 h-4" />
            </div>
            <div className="relative">
                <input
                    placeholder="(Opsional) QR EMV String"
                    className="border border-slate-300 rounded-md px-2 py-1 text-xs w-60 focus:ring-2 focus:ring-blue-500"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />
                <Link2 className="absolute right-2 top-2 text-slate-400 w-4 h-4" />
            </div>
            <Button
                onClick={save}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white text-xs"
            >
                {saving ? "Menyimpan..." : "Set Static"}
            </Button>
        </div>
    );
}

// --- Dynamic QR Generator ---
function DynamicGenerateButton({ profileId, onDone }: { profileId: string; onDone: () => void }) {
    const [loading, setLoading] = useState(false);

    const run = async () => {
        setLoading(true);
        const res = await fetch("/api/admin/qris/dynamic", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: profileId, amount: 1000 }),
        });
        setLoading(false);
        if (!res.ok) {
            const t = await res.text();
            return alert("Gagal generate dynamic: " + t);
        }
        onDone();
    };

    return (
        <Button
            onClick={run}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white w-full sm:w-auto"
        >
            {loading ? "Proses..." : "Generate Dynamic"}
        </Button>
    );
}
