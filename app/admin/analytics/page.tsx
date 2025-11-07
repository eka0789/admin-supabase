"use client";

import { motion } from "framer-motion";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
    LineChart,
    Line,
    Legend,
} from "recharts";
import {
    Users,
    DollarSign,
    Activity,
    PieChart as PieIcon,
    TrendingUp,
    TrendingDown,
    RefreshCw,
} from "lucide-react";
import useAnalyticsData from "./useAnalyticsData";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function AnalyticsPage() {
    const { data, loading, refetch } = useAnalyticsData();

    if (loading || !data) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 p-6 md:p-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {Array.from({ length: 4 }).map((_, i) => (
                            <KpiCard key={i} loading />
                        ))}
                    </motion.div>
                    <div className="text-center text-slate-500 animate-pulse">
                        📊 Memuat data analitik dari Supabase...
                    </div>
                </div>
            </div>
        );
    }

    const summary = data.summary || {
        totalMembers: 0,
        activeMembers: 0,
        totalSavings: 0,
        totalLoans: 0,
        totalTransactions: 0,
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            📈 Analitik & Insight KKSUKA
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm">
                            Pantau performa koperasi dan perilaku anggota secara real-time.
                        </p>
                    </div>

                    <button
                        onClick={() => refetch(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Data
                    </button>
                </motion.div>

                {/* KPI Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <KpiCard
                        icon={<Users className="w-8 h-8 text-blue-600" />}
                        title="Total Anggota"
                        value={summary.totalMembers.toLocaleString("id-ID")}
                        growth={compareTrend(summary.activeMembers, summary.totalMembers)}
                        trend="up"
                    />
                    <KpiCard
                        icon={<DollarSign className="w-8 h-8 text-green-600" />}
                        title="Total Simpanan"
                        value={`Rp ${summary.totalSavings.toLocaleString("id-ID")}`}
                        growth="+5.4%"
                        trend="up"
                    />
                    <KpiCard
                        icon={<Activity className="w-8 h-8 text-orange-600" />}
                        title="Total Pinjaman"
                        value={`Rp ${summary.totalLoans.toLocaleString("id-ID")}`}
                        growth="+2.8%"
                        trend="up"
                    />
                    <KpiCard
                        icon={<PieIcon className="w-8 h-8 text-purple-600" />}
                        title="Total Transaksi"
                        value={summary.totalTransactions}
                        growth="+3.2%"
                        trend="up"
                    />
                </motion.div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Area Chart: Simpanan vs Pinjaman */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="col-span-2 bg-white p-6 rounded-2xl shadow-md border border-slate-200"
                    >
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            Perbandingan Simpanan & Pinjaman
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={mergeTrends(data.trendSavings, data.trendLoans)}>
                                <defs>
                                    <linearGradient id="colorSimpanan" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPinjaman" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <CartesianGrid strokeDasharray="3 3" />
                                <Area
                                    type="monotone"
                                    dataKey="simpanan"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorSimpanan)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="pinjaman"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorPinjaman)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Pie Chart: Distribusi Transaksi */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white p-6 rounded-2xl shadow-md border border-slate-200"
                    >
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            Proporsi Jenis Transaksi
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.transactionDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={100}
                                    label
                                >
                                    {data.transactionDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>

                {/* Line Chart: Pertumbuhan Anggota */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-6 rounded-2xl shadow-md border border-slate-200"
                >
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">
                        Pertumbuhan Anggota per Bulan
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.memberGrowth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="active" stroke="#3b82f6" name="Aktif" />
                            <Line type="monotone" dataKey="new" stroke="#f59e0b" name="Baru" />
                            <Legend />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Insight Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white p-6 rounded-2xl shadow-md border border-slate-200"
                >
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">🔍 Insight Otomatis</h2>
                    <ul className="divide-y divide-slate-200">
                        {generateInsights(data).map((insight, i) => (
                            <li key={i} className="py-3 text-slate-700 text-sm">
                                {insight}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center text-slate-400 text-xs mt-8"
                >
                    © {new Date().getFullYear()} KKSUKA Cooperative System. Powered by Supabase & Next.js
                </motion.div>
            </div>
        </div>
    );
}

/* 🔹 Komponen KPI */
function KpiCard({ icon, title, value, growth, trend, loading = false }: any) {
    if (loading) {
        return (
            <div className="rounded-2xl p-5 bg-white shadow-md border border-slate-200 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 bg-slate-200 rounded-full" />
                    <div className="w-5 h-5 bg-slate-200 rounded" />
                </div>
                <div className="h-3 bg-slate-200 rounded w-1/3 mb-2" />
                <div className="h-6 bg-slate-300 rounded w-1/2 mb-2" />
                <div className="h-2 bg-slate-200 rounded w-1/4" />
            </div>
        );
    }

    return (
        <div className="rounded-2xl p-5 bg-white shadow-md border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
                {icon}
                {trend === "up" ? (
                    <TrendingUp className="text-green-500 w-5 h-5" />
                ) : (
                    <TrendingDown className="text-red-500 w-5 h-5" />
                )}
            </div>
            <h3 className="text-sm text-slate-500 mt-2">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            <p className={`text-xs mt-1 ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {growth}
            </p>
        </div>
    );
}

/* 🔹 Util: Merge dua tren (simpanan & pinjaman) berdasarkan bulan */
function mergeTrends(
    savings: { month: string; value: number }[],
    loans: { month: string; value: number }[]
) {
    const allMonths = Array.from(new Set([...savings.map((d) => d.month), ...loans.map((d) => d.month)]));
    return allMonths.map((m) => ({
        month: m,
        simpanan: savings.find((s) => s.month === m)?.value || 0,
        pinjaman: loans.find((l) => l.month === m)?.value || 0,
    }));
}

/* 🔹 Util: Generate Insight otomatis berdasarkan data */
function generateInsights(data: any): string[] {
    const insights = [];
    if (data.summary.totalSavings > data.summary.totalLoans)
        insights.push("💰 Simpanan anggota lebih besar dibanding pinjaman — likuiditas koperasi sehat.");
    if (data.summary.totalTransactions > 1000)
        insights.push("⚙️ Aktivitas transaksi tinggi, pertimbangkan optimasi performa sistem.");
    if (data.summary.totalMembers > 200)
        insights.push("👥 Pertumbuhan anggota stabil, perlu strategi retensi agar loyal.");
    if (data.summary.totalLoans / data.summary.totalSavings > 0.8)
        insights.push("⚠️ Rasio pinjaman tinggi terhadap simpanan, pantau risiko kredit.");
    if (data.summary.totalSavings < 10000000)
        insights.push("📉 Dana simpanan masih kecil, dorong promosi simpanan berjangka.");
    return insights.length ? insights : ["Tidak ada insight signifikan untuk periode ini."];
}

/* 🔹 Util: Hitung persentase perbandingan */
function compareTrend(current: number, total: number): string {
    if (!total) return "0%";
    const percentage = ((current / total) * 100).toFixed(1);
    return `${percentage}% aktif`;
}
