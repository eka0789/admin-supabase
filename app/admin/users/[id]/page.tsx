"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import Button from "@/components/ui/Button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

export default function UserPage({ params }: any) {
    const id = params?.id;
    const router = useRouter();

    const [profile, setProfile] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [summary, setSummary] = useState({ totalTransactions: 0, totalCommission: 0, totalIncentive: 0 });

    const fetchData = async () => {
        if (!id) return;
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", id).single();
        setProfile(prof);
        const { data: tx } = await supabase.from("transactions").select("id,amount,status,kind,created_at,verified_at").eq("user_id", id).order("created_at", { ascending: false });
        setTransactions(tx || []);
        const { data: pay } = await supabase.from("payouts").select("id,source,amount,created_at,note").eq("user_id", id).order("created_at", { ascending: false });
        setPayouts(pay || []);
        setSummary({
            totalTransactions: tx?.filter((t: any) => t.status === 'verified').length || 0,
            totalCommission: (pay || []).filter((p: any) => p.source === 'KOMISI').reduce((a: any, b: any) => a + Number(b.amount), 0),
            totalIncentive: (pay || []).filter((p: any) => p.source === 'INSENTIF').reduce((a: any, b: any) => a + Number(b.amount), 0),
        });
    };

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel(`user_${id}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "transactions" },
                fetchData
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "payouts" },
                fetchData
            );

        // ✅ Supabase subscribe() mengembalikan Promise, jadi bungkus manual
        const subscribe = async () => {
            try {
                const status = await channel.subscribe();
                console.log("Realtime subscription:", status);
            } catch (err) {
                console.error("Failed to subscribe:", err);
            }
        };

        // ✅ Jalankan async tanpa mengembalikan Promise ke useEffect
        void subscribe();

        // ✅ Cleanup function synchronous — tidak error TS
        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);


    return (
        <div className="min-h-screen p-8 bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">User Insights</h1>
                    <Button onClick={() => router.back()}>Back</Button>
                </div>

                <div className="flex gap-2 justify-end">
                    <Button onClick={() => exportToCSV(`user_${profile?.nik}_${new Date().toISOString().slice(0, 7)}`, payouts.map((p: any) => ({ tanggal: p.created_at.slice(0, 10), tipe: p.source, jumlah: p.amount, note: p.note })))}>Export CSV</Button>
                    <Button onClick={() => exportToExcel(`user_${profile?.nik}_${new Date().toISOString().slice(0, 7)}`, payouts.map((p: any) => ({ tanggal: p.created_at.slice(0, 10), tipe: p.source, jumlah: p.amount, note: p.note })))}>Export Excel</Button>
                </div>

                {profile && (
                    <Card>
                        <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2">
                                <div><strong>NIK:</strong> {profile.nik}</div>
                                <div><strong>ID:</strong> {profile.id}</div>
                                <div><strong>BH Aktif:</strong> {profile.bh_enabled ? 'Ya' : 'Tidak'}</div>
                                <div><strong>Last Topup:</strong> {profile.last_topup_at || '-'}</div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-3 gap-4">
                    <Card><CardHeader><CardTitle>Total Verified</CardTitle></CardHeader><CardContent><div className="text-2xl">{summary.totalTransactions}</div></CardContent></Card>
                    <Card><CardHeader><CardTitle>Total Komisi</CardTitle></CardHeader><CardContent><div className="text-2xl">{summary.totalCommission.toLocaleString()}</div></CardContent></Card>
                    <Card><CardHeader><CardTitle>Total Insentif</CardTitle></CardHeader><CardContent><div className="text-2xl">{summary.totalIncentive.toLocaleString()}</div></CardContent></Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Timeline Payout</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={payouts.map(p => ({ date: p.created_at.slice(0, 10), [p.source]: Number(p.amount) }))}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="KOMISI" stroke="#16a34a" fill="#bbf7d0" />
                                    <Area type="monotone" dataKey="INSENTIF" stroke="#0369a1" fill="#bfdbfe" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Aktivitas Terbaru</CardTitle></CardHeader>
                    <CardContent>
                        <table className="w-full text-sm">
                            <thead><tr className="text-left"><th>Tanggal</th><th>Tipe</th><th>Catatan</th><th className="text-right">Jumlah</th></tr></thead>
                            <tbody>
                                {[...transactions, ...payouts].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20).map((item: any) => (
                                    <tr key={item.id} className="border-t">
                                        <td className="py-2">{(item.created_at || item.verified_at || '').slice(0, 10)}</td>
                                        <td>{item.source || (item.kind || item.status)}</td>
                                        <td>{item.note || item.status || '-'}</td>
                                        <td className="text-right">{item.amount ? Number(item.amount).toLocaleString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
