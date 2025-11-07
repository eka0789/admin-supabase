"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Calendar, Users, CreditCard, TrendingUp, FileText } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function ReportsPage() {
    // Dummy data — nanti bisa dihubungkan ke Supabase atau API
    const monthlyData = [
        { month: "Jan", transaksi: 120, anggota: 35 },
        { month: "Feb", transaksi: 200, anggota: 50 },
        { month: "Mar", transaksi: 180, anggota: 42 },
        { month: "Apr", transaksi: 250, anggota: 65 },
        { month: "Mei", transaksi: 300, anggota: 80 },
        { month: "Jun", transaksi: 260, anggota: 70 },
    ];

    const distribusiRole = [
        { name: "Admin", value: 3 },
        { name: "Kacab", value: 5 },
        { name: "Marketer", value: 12 },
        { name: "Anggota", value: 150 },
    ];

    const recentTransactions = [
        { id: 1, nama: "Budi Santoso", jenis: "Simpanan", jumlah: "Rp 1.200.000", tanggal: "2025-11-01" },
        { id: 2, nama: "Siti Aminah", jenis: "Pinjaman", jumlah: "Rp 3.500.000", tanggal: "2025-10-28" },
        { id: 3, nama: "Agus Widodo", jenis: "Simpanan", jumlah: "Rp 850.000", tanggal: "2025-10-25" },
        { id: 4, nama: "Dewi Lestari", jenis: "Pembayaran", jumlah: "Rp 2.000.000", tanggal: "2025-10-20" },
    ];

    const [periode, setPeriode] = useState("6 bulan terakhir");

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
                        <p className="text-slate-500 mt-1 text-sm">Analisis aktivitas dan performa koperasi KKSUKA secara real-time.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <select
                            value={periode}
                            onChange={(e) => setPeriode(e.target.value)}
                            className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option>3 bulan terakhir</option>
                            <option>6 bulan terakhir</option>
                            <option>12 bulan terakhir</option>
                        </select>
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
                        value="250"
                        subtext="+5% dari bulan lalu"
                        color="bg-blue-50"
                    />
                    <ReportCard
                        icon={<CreditCard className="w-8 h-8 text-green-600" />}
                        title="Transaksi Bulan Ini"
                        value="Rp 85.000.000"
                        subtext="+12 transaksi dari bulan lalu"
                        color="bg-green-50"
                    />
                    <ReportCard
                        icon={<TrendingUp className="w-8 h-8 text-orange-600" />}
                        title="Pertumbuhan Simpanan"
                        value="+15%"
                        subtext="Trend positif selama 3 bulan"
                        color="bg-orange-50"
                    />
                    <ReportCard
                        icon={<FileText className="w-8 h-8 text-purple-600" />}
                        title="Laporan Dibuat"
                        value="34"
                        subtext="Termasuk laporan keuangan & audit"
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
                            <BarChart data={monthlyData}>
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
                                <Pie
                                    data={distribusiRole}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={100}
                                    label
                                >
                                    {distribusiRole.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>
                </div>

                {/* Recent Transactions Table */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-md border border-slate-200 p-6"
                >
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Transaksi Terbaru</h2>
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
                                {recentTransactions.map((t) => (
                                    <tr key={t.id} className="bg-white shadow-sm hover:shadow-md transition rounded-xl">
                                        <td className="px-3 py-2 font-medium text-slate-800">{t.nama}</td>
                                        <td className="px-3 py-2 text-slate-600">{t.jenis}</td>
                                        <td className="px-3 py-2 text-slate-700">{t.jumlah}</td>
                                        <td className="px-3 py-2 text-slate-500">{t.tanggal}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                Selesai
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-slate-400 text-xs mt-8"
                >
                    © {new Date().getFullYear()} KKSUKA Cooperative System. All rights reserved.
                </motion.div>
            </div>
        </div>
    );
}

function ReportCard({ icon, title, value, subtext, color }: any) {
    return (
        <div className={`rounded-2xl p-5 shadow-md border border-slate-200 ${color}`}>
            <div className="flex items-center justify-between">
                {icon}
            </div>
            <h3 className="text-sm text-slate-600 mt-2">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{subtext}</p>
        </div>
    );
}
