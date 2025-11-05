"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Download, FileSpreadsheet, Activity, Users, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";


export default function MonitorPage() {
    const [bhActiveCount, setBhActiveCount] = useState(0);
    const [todayVerifiedCount, setTodayVerifiedCount] = useState(0);
    const [payoutsSummary, setPayoutsSummary] = useState<any[]>([]);
    const [topMarketer, setTopMarketer] = useState<any[]>([]);
    const [topKacab, setTopKacab] = useState<any[]>([]);

    const fetchData = async () => {
        const { count: active } = await supabase
            .from("profiles")
            .select("*", { head: true, count: "exact" })
            .eq("bh_enabled", true);
        setBhActiveCount(active || 0);

        const today = new Date().toISOString().slice(0, 10);
        const { count: verified } = await supabase
            .from("transactions")
            .select("*", { head: true, count: "exact" })
            .eq("status", "verified")
            .gte("verified_at", `${today}T00:00:00Z`)
            .lte("verified_at", `${today}T23:59:59Z`);
        setTodayVerifiedCount(verified || 0);

        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const { data } = await supabase
            .from("payouts")
            .select("user_id, source, amount, created_at")
            .gte("created_at", start);

        if (!data) return;
        const grouped: Record<string, any> = {};
        data.forEach((p: any) => {
            const d = p.created_at.slice(0, 10);
            if (!grouped[d]) grouped[d] = { date: d, KOMISI: 0, INSENTIF: 0 };
            grouped[d][p.source] = (grouped[d][p.source] || 0) + Number(p.amount);
        });
        const chart = Object.values(grouped).sort(
            (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setPayoutsSummary(chart);

        const marketerMap: Record<string, number> = {};
        const kacabMap: Record<string, number> = {};
        data.forEach((p: any) => {
            if (p.source === "KOMISI")
                marketerMap[p.user_id] = (marketerMap[p.user_id] || 0) + Number(p.amount);
            if (p.source === "INSENTIF")
                kacabMap[p.user_id] = (kacabMap[p.user_id] || 0) + Number(p.amount);
        });

        const sortedMark = Object.entries(marketerMap)
            .map(([id, total]) => ({ user_id: id, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
        const sortedKacab = Object.entries(kacabMap)
            .map(([id, total]) => ({ user_id: id, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        const userIds = [
            ...sortedMark.map((m) => m.user_id),
            ...sortedKacab.map((k) => k.user_id),
        ];
        let nameMap: Record<string, string> = {};
        if (userIds.length > 0) {
            const { data: users } = await supabase
                .from("profiles")
                .select("id, nik")
                .in("id", userIds);
            nameMap = Object.fromEntries(
                (users || []).map((u: any) => [u.id, u.nik])
            );
        }
        setTopMarketer(
            sortedMark.map((m) => ({
                name: nameMap[m.user_id] || m.user_id,
                total: m.total,
            }))
        );
        setTopKacab(
            sortedKacab.map((k) => ({
                name: nameMap[k.user_id] || k.user_id,
                total: k.total,
            }))
        );
    };

    useEffect(() => {
        fetchData();
        const channel = supabase
            .channel("monitor")
            .on("postgres_changes", { event: "*", schema: "public", table: "payouts" }, fetchData);
        void channel.subscribe();
        return () => { void supabase.removeChannel(channel); };
    }, []);

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-100 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">📊 Dashboard Monitor KKSUKA</h1>
                        <p className="text-slate-500 mt-1">Pemantauan real-time aktivitas dan performa koperasi</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={async () => {
                                const { data } = await supabase.from("payouts").select("user_id,source,amount,created_at,note");
                                exportToCSV(`laporan_global_${new Date().toISOString().slice(0, 7)}`, (data || []).map((p: any) => ({
                                    tanggal: p.created_at.slice(0, 10),
                                    user_id: p.user_id,
                                    tipe: p.source,
                                    keterangan: p.note || '',
                                    jumlah: p.amount
                                })));
                            }}
                        >
                            <Download className="w-4 h-4 mr-2" /> CSV
                        </Button>
                        <Button
                            onClick={async () => {
                                const { data } = await supabase.from("payouts").select("user_id,source,amount,created_at,note");
                                exportToExcel(`laporan_global_${new Date().toISOString().slice(0, 7)}`, (data || []).map((p: any) => ({
                                    tanggal: p.created_at.slice(0, 10),
                                    user_id: p.user_id,
                                    tipe: p.source,
                                    keterangan: p.note || '',
                                    jumlah: p.amount
                                })));
                            }}
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SummaryCard icon={<Users className="text-green-600" />} title="Active BH" value={bhActiveCount} />
                    <SummaryCard icon={<Activity className="text-blue-600" />} title="Verified Today" value={todayVerifiedCount} />
                    <SummaryCard icon={<TrendingUp className="text-slate-600" />} title="Realtime Monitor" value="✓ Aktif" />
                </div>

                {/* Trend Chart */}
                <Card className="shadow-sm">
                    <CardHeader><CardTitle>📈 Tren Komisi & Insentif (Bulan Ini)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={payoutsSummary}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="KOMISI" stroke="#16a34a" strokeWidth={2} />
                                    <Line type="monotone" dataKey="INSENTIF" stroke="#0369a1" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Leaderboards */}
                <div className="grid md:grid-cols-2 gap-6">
                    <LeaderBoardCard title="🏅 Top 5 Marketer (KOMISI)" data={topMarketer} color="#16a34a" />
                    <LeaderBoardCard title="🎯 Top 5 Kacab (INSENTIF)" data={topKacab} color="#0369a1" />
                </div>
            </div>
        </div>
    );
}

// ✨ Sub-components
function SummaryCard({ icon, title, value }: any) {
    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 200 }}
        >
            <Card className="bg-white border border-slate-200 shadow-sm">
                <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-slate-700 text-sm font-semibold">{title}</CardTitle>
                    {icon}
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold text-slate-800">{value}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function LeaderBoardCard({ title, data, color }: any) {
    return (
        <Card className="shadow-sm">
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="total" fill={color} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
