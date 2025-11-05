"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import Button from "@/components/ui/Button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { User, ArrowLeft, FileSpreadsheet, Download, Activity, Wallet } from "lucide-react";

export default function UserPage({ params }: any) {
    const id = params?.id;
    const router = useRouter();

    const [profile, setProfile] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        totalTransactions: 0,
        totalCommission: 0,
        totalIncentive: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", id).single();
        const { data: tx } = await supabase
            .from("transactions")
            .select("id,amount,status,kind,created_at,verified_at")
            .eq("user_id", id)
            .order("created_at", { ascending: false });
        const { data: pay } = await supabase
            .from("payouts")
            .select("id,source,amount,created_at,note")
            .eq("user_id", id)
            .order("created_at", { ascending: false });

        setProfile(prof);
        setTransactions(tx || []);
        setPayouts(pay || []);
        setSummary({
            totalTransactions: tx?.filter((t: any) => t.status === "verified").length || 0,
            totalCommission:
                (pay || [])
                    .filter((p: any) => p.source === "KOMISI")
                    .reduce((a: any, b: any) => a + Number(b.amount), 0) || 0,
            totalIncentive:
                (pay || [])
                    .filter((p: any) => p.source === "INSENTIF")
                    .reduce((a: any, b: any) => a + Number(b.amount), 0) || 0,
        });
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        const channel = supabase
            .channel(`user_${id}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, fetchData)
            .on("postgres_changes", { event: "*", schema: "public", table: "payouts" }, fetchData);
        void channel.subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-100 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <User className="text-slate-700" />
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                            Detail Pengguna
                        </h1>
                    </div>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                    </Button>
                </div>

                {/* Export Buttons */}
                {profile && (
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            onClick={() =>
                                exportToCSV(
                                    `user_${profile?.nik}_${new Date().toISOString().slice(0, 7)}`,
                                    payouts.map((p: any) => ({
                                        tanggal: p.created_at.slice(0, 10),
                                        tipe: p.source,
                                        jumlah: p.amount,
                                        note: p.note,
                                    }))
                                )
                            }
                        >
                            <Download className="w-4 h-4 mr-2" /> CSV
                        </Button>
                        <Button
                            onClick={() =>
                                exportToExcel(
                                    `user_${profile?.nik}_${new Date().toISOString().slice(0, 7)}`,
                                    payouts.map((p: any) => ({
                                        tanggal: p.created_at.slice(0, 10),
                                        tipe: p.source,
                                        jumlah: p.amount,
                                        note: p.note,
                                    }))
                                )
                            }
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                        </Button>
                    </div>
                )}

                {/* Profil User */}
                {loading ? (
                    <div className="text-center text-slate-500 py-20 animate-pulse">
                        Memuat data pengguna...
                    </div>
                ) : (
                    <>
                        {profile && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="border border-slate-200 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-slate-700">Profil Pengguna</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="font-semibold text-slate-700">NIK</span>
                                                <p>{profile.nik}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-700">ID</span>
                                                <p>{profile.id}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-700">BH Aktif</span>
                                                <p>{profile.bh_enabled ? "Ya" : "Tidak"}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-700">Last Topup</span>
                                                <p>{profile.last_topup_at || "-"}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Summary */}
                        <div className="grid sm:grid-cols-3 gap-6">
                            <SummaryCard
                                title="Total Transaksi Terverifikasi"
                                value={summary.totalTransactions}
                                icon={<Activity className="text-green-600" />}
                            />
                            <SummaryCard
                                title="Total Komisi"
                                value={`Rp ${summary.totalCommission.toLocaleString()}`}
                                icon={<Wallet className="text-blue-600" />}
                            />
                            <SummaryCard
                                title="Total Insentif"
                                value={`Rp ${summary.totalIncentive.toLocaleString()}`}
                                icon={<Wallet className="text-slate-600" />}
                            />
                        </div>

                        {/* Grafik */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>📊 Tren Komisi & Insentif</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={payouts.map((p) => ({
                                                date: p.created_at.slice(0, 10),
                                                [p.source]: Number(p.amount),
                                            }))}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area
                                                type="monotone"
                                                dataKey="KOMISI"
                                                stroke="#16a34a"
                                                fill="#bbf7d0"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="INSENTIF"
                                                stroke="#0369a1"
                                                fill="#bfdbfe"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Aktivitas */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>🧾 Aktivitas Terbaru</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left border-b">
                                                <th className="py-2">Tanggal</th>
                                                <th>Tipe</th>
                                                <th>Catatan</th>
                                                <th className="text-right">Jumlah</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...transactions, ...payouts]
                                                .sort(
                                                    (a: any, b: any) =>
                                                        new Date(b.created_at).getTime() -
                                                        new Date(a.created_at).getTime()
                                                )
                                                .slice(0, 20)
                                                .map((item: any) => (
                                                    <tr
                                                        key={item.id}
                                                        className="border-b hover:bg-slate-50 transition"
                                                    >
                                                        <td className="py-2">
                                                            {(item.created_at || item.verified_at || "").slice(0, 10)}
                                                        </td>
                                                        <td>{item.source || item.kind || item.status}</td>
                                                        <td>{item.note || item.status || "-"}</td>
                                                        <td className="text-right">
                                                            {item.amount
                                                                ? Number(item.amount).toLocaleString()
                                                                : "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}

// 🔹 Sub-component reusable untuk summary metric
function SummaryCard({ title, value, icon }: any) {
    return (
        <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 250 }}>
            <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-sm text-slate-600">{title}</CardTitle>
                    {icon}
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
