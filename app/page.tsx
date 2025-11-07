"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Settings, Activity, Database, BarChart3 } from "lucide-react";

export default function AdminHome() {
  const cards = [
    {
      title: "Manajemen Pengguna",
      description: "Kelola akun, peran, dan status pengguna koperasi.",
      icon: <Users className="w-10 h-10 text-blue-600" />,
      href: "/admin/users",
      color: "from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100",
    },
    {
      title: "Monitoring",
      description: "Pantau data transaksi, aktivitas anggota, dan performa sistem.",
      icon: <Activity className="w-10 h-10 text-green-600" />,
      href: "/admin/monitor",
      color: "from-green-100 to-green-50 hover:from-green-200 hover:to-green-100",
    },
    {
      title: "Pengaturan Sistem",
      description: "Atur konfigurasi koperasi, preferensi admin, dan hak akses.",
      icon: <Settings className="w-10 h-10 text-gray-700" />,
      href: "/admin/settings",
      color: "from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100",
    },
    {
      title: "Database & Laporan",
      description: "Lihat struktur data, backup otomatis, dan laporan keuangan.",
      icon: <Database className="w-10 h-10 text-purple-600" />,
      href: "/admin/reports",
      color: "from-purple-100 to-purple-50 hover:from-purple-200 hover:to-purple-100",
    },
    {
      title: "Analisis & Statistik",
      description: "Visualisasi data anggota dan kinerja koperasi secara real-time.",
      icon: <BarChart3 className="w-10 h-10 text-orange-600" />,
      href: "/admin/analytics",
      color: "from-orange-100 to-orange-50 hover:from-orange-200 hover:to-orange-100",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            Dashboard Admin KKSUKA
          </h1>
          <p className="text-slate-500 mt-3 text-lg">
            Kelola seluruh aktivitas koperasi dengan mudah dan efisien.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Link href={card.href}>
                <div
                  className={`group cursor-pointer rounded-2xl p-6 bg-linear-to-br ${card.color} shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200`}
                >
                  <div className="flex items-center justify-between">
                    {card.icon}
                    <div className="text-sm text-slate-400 group-hover:text-slate-600 transition">
                      Klik untuk membuka
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800 mt-4">
                    {card.title}
                  </h2>
                  <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center text-slate-500 text-sm"
        >
          <p>© {new Date().getFullYear()} KKSUKA Cooperative System • Powered by Supabase & Next.js</p>
        </motion.div>
      </div>
    </div>
  );
}
