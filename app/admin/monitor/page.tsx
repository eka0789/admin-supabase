"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import Button from "@/components/ui/Button";

export default function MonitorPage() {
    const [bhActiveCount, setBhActiveCount] = useState(0);
    const [todayVerifiedCount, setTodayVerifiedCount] = useState(0);
    const [payoutsSummary, setPayoutsSummary] = useState<any[]>([]);
    const [topMarketer, setTopMarketer] = useState<any[]>([]);
    const [topKacab, setTopKacab] = useState<any[]>([]);

    const fetchData = async () => {
        // 1. BH active count
        const { count: active } = await supabase.from("profiles").select("*", { head: true, count: "exact" }).eq("bh_enabled", true);
        setBhActiveCount(active || 0);

        // 2. today's verified
        const today = new Date().toISOString().slice(0, 10);
        const { count: verified } = await supabase.from("transactions")
            .select("*", { head: true, count: "exact" })
            .eq("status", "verified")
            .gte("verified_at", `${today}T00:00:00Z`)
            .lte("verified_at", `${today}T23:59:59Z`);
        setTodayVerifiedCount(verified || 0);

        // 3. payouts month
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const { data } = await supabase.from("payouts").select("user_id, source, amount, created_at").gte("created_at", start);
        if (!data) return;

        // chart series
        const grouped: Record<string, any> = {};
        data.forEach((p: any) => {
            const d = p.created_at.slice(0, 10);
            if (!grouped[d]) grouped[d] = { date: d, KOMISI: 0, INSENTIF: 0 };
            grouped[d][p.source] = (grouped[d][p.source] || 0) + Number(p.amount);
        });
        const chart = Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setPayoutsSummary(chart);

        // leaderboard
        const marketerMap: Record<string, number> = {};
        const kacabMap: Record<string, number> = {};
        data.forEach((p: any) => {
            if (p.source === "KOMISI") marketerMap[p.user_id] = (marketerMap[p.user_id] || 0) + Number(p.amount);
            if (p.source === "INSENTIF") kacabMap[p.user_id] = (kacabMap[p.user_id] || 0) + Number(p.amount);
        });

        const sortedMark = Object.entries(marketerMap).map(([id, total]) => ({ user_id: id, total })).sort((a, b) => b.total - a.total).slice(0, 5);
        const sortedKacab = Object.entries(kacabMap).map(([id, total]) => ({ user_id: id, total })).sort((a, b) => b.total - a.total).slice(0, 5);

        const userIds = [...sortedMark.map(m => m.user_id), ...sortedKacab.map(k => k.user_id)];
        let nameMap: Record<string, string> = {};
        if (userIds.length > 0) {
            const { data: users } = await supabase.from("profiles").select("id, nik").in("id", userIds);
            nameMap = Object.fromEntries((users || []).map((u: any) => [u.id, u.nik]));
        }
        setTopMarketer(sortedMark.map(m => ({ name: nameMap[m.user_id] || m.user_id, total: m.total })));
        setTopKacab(sortedKacab.map(k => ({ name: nameMap[k.user_id] || k.user_id, total: k.total })));
    };

    useEffect(() => {
        fetchData();

        // buat channel
        const channel = supabase
            .channel("monitor")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "payouts" },
                fetchData
            );

        // subscribe async tapi tidak return promise
        const subscribe = async () => {
            const status = await channel.subscribe();
            console.log("Realtime status:", status);
        };

        // jalankan secara terpisah tanpa return promise
        void subscribe(); // ✅ 'void' mengabaikan promise

        // cleanup function
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);


    return (
        <div className="min-h-screen p-8 bg-slate-50">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Admin Monitor</h1>
                    <div className="flex gap-2">
                        <Button onClick={async () => {
                            const { data } = await supabase.from("payouts").select("user_id,source,amount,created_at,note");
                            exportToCSV(`laporan_global_${new Date().toISOString().slice(0, 7)}`, (data || []).map((p: any) => ({
                                tanggal: p.created_at.slice(0, 10),
                                user_id: p.user_id,
                                tipe: p.source,
                                keterangan: p.note || '',
                                jumlah: p.amount
                            })));
                        }}>Export CSV</Button>
                        <Button onClick={async () => {
                            const { data } = await supabase.from("payouts").select("user_id,source,amount,created_at,note");
                            exportToExcel(`laporan_global_${new Date().toISOString().slice(0, 7)}`, (data || []).map((p: any) => ({
                                tanggal: p.created_at.slice(0, 10),
                                user_id: p.user_id,
                                tipe: p.source,
                                keterangan: p.note || '',
                                jumlah: p.amount
                            })));
                        }}>Export Excel</Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <Card><CardHeader><CardTitle>Active BH</CardTitle></CardHeader><CardContent><div className="text-3xl">{bhActiveCount}</div></CardContent></Card>
                    <Card><CardHeader><CardTitle>Verified Today</CardTitle></CardHeader><CardContent><div className="text-3xl">{todayVerifiedCount}</div></CardContent></Card>
                    <Card><CardHeader><CardTitle>Notes</CardTitle></CardHeader><CardContent><div>Realtime metrics & export</div></CardContent></Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Trend Komisi & Insentif (Bulan Ini)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={payoutsSummary}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="KOMISI" stroke="#16a34a" />
                                    <Line type="monotone" dataKey="INSENTIF" stroke="#0369a1" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader><CardTitle>Top 5 Marketer (KOMISI)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topMarketer}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="total" fill="#16a34a" onClick={(d: any) => window.location.href = `/admin/users/${d.name}`} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Top 5 Kacab (INSENTIF)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topKacab}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="total" fill="#0369a1" onClick={(d: any) => window.location.href = `/admin/users/${d.name}`} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
