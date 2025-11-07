"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { Calendar, Users, CreditCard, TrendingUp, FileText, RefreshCw } from "lucide-react";
import useReportsData, { exportTransactionsToCSV } from "./useReportsData";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function ReportsPage() {
    const [periode, setPeriode] = useState("6 bulan terakhir");
    const { data, loading, refetch } = useReportsData();

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
                <div className="text-slate-600 animate-pulse text-center">
                    <h2 className="text-xl font-semibold">📊 Memuat laporan...</h2>
                    <p className="text-sm text-slate-400">Mengambil data dari Supabase</p>
                </div>
            </div>
        );
    }

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
                        <h1 className="text-3xl font-bold text-slate-800">📊 Laporan & Statistik Koperasi</h1>
                        <p className="text-slate-500 mt-1 text-sm">
                            Analisis aktivitas dan performa koperasi KKSUKA secara real-time.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={periode}
                            onChange={(e) => setPeriode(e.target.value)}
                            className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option>3 bulan terakhir</option>
                            <option>6 bulan terakhir</option>
                            <option>12 bulan terakhir</option>
                        </select>

                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </motion.div>

                {/* KPI Cards */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <ReportCard
                        icon={<Users className="w-8 h-8 text-blue-600" />}
                        title="Total Anggota"
                        value={data.summary.totalMembers.toLocaleString("id-ID")}
                        subtext="Dihitung dari tabel members"
                        color="bg-blue-50"
                    />
                    <ReportCard
                        icon={<CreditCard className="w-8 h-8 text-green-600" />}
                        title="Total Transaksi"
                        value={data.summary.totalTransactions.toLocaleString("id-ID")}
                        subtext="Diperbarui otomatis"
                        color="bg-green-50"
                    />
                    <ReportCard
                        icon={<TrendingUp className="w-8 h-8 text-orange-600" />}
                        title="Total Simpanan"
                        value={`Rp ${data.summary.totalSavings.toLocaleString("id-ID")}`}
                        subtext="Akumulasi dari tabel savings"
                        color="bg-orange-50"
                    />
                    <ReportCard
                        icon={<FileText className="w-8 h-8 text-purple-600" />}
                        title="Laporan Aktif"
                        value="34"
                        subtext="Placeholder sementara"
                        color="bg-purple-50"
                    />
                </motion.div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Grafik Transaksi Bulanan */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="col-span-2 bg-white p-6 rounded-2xl shadow-md border border-slate-200"
                    >
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Grafik Transaksi Bulanan</h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data.monthlyData}>
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="transaksi" fill="#3b82f6" name="Jumlah Transaksi" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="anggota" fill="#10b981" name="Anggota Aktif" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Pie Chart Role */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white p-6 rounded-2xl shadow-md border border-slate-200"
                    >
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Distribusi Role Pengguna</h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={data.distribusiRole} dataKey="value" nameKey="name" outerRadius={100} label>
                                    {data.distribusiRole.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>

                {/* Recent Transactions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-md border border-slate-200 p-6"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Transaksi Terbaru</h2>

                        <button
                            onClick={exportTransactionsToCSV}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition"
                        >
                            📤 Export CSV
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-left bg-slate-50 text-slate-600">
                                    <th className="px-3 py-2 rounded-l-lg">Nama</th>
                                    <th className="px-3 py-2">Jenis</th>
                                    <th className="px-3 py-2">Jumlah</th>
                                    <th className="px-3 py-2">Tanggal</th>
                                    <th className="px-3 py-2 rounded-r-lg text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentTransactions.map((t) => (
                                    <tr key={t.id} className="bg-white shadow-sm hover:shadow-md transition rounded-xl">
                                        <td className="px-3 py-2 font-medium text-slate-800">{t.nama}</td>
                                        <td className="px-3 py-2 text-slate-600">{t.jenis}</td>
                                        <td className="px-3 py-2 text-slate-700">{t.jumlah}</td>
                                        <td className="px-3 py-2 text-slate-500">{t.tanggal}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

function ReportCard({ icon, title, value, subtext, color }: any) {
    return (
        <div className={`rounded-2xl p-5 shadow-md border border-slate-200 ${color}`}>
            <div className="flex items-center justify-between">{icon}</div>
            <h3 className="text-sm text-slate-600 mt-2">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{subtext}</p>
        </div>
    );
}
