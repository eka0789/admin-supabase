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
  Percent,
  Star,
  Building2,
} from "lucide-react";
import useAnalyticsData from "./useAnalyticsData";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsPage() {
  const { data, loading, refetch } = useAnalyticsData();

  // 🔹 Handle loading
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 p-6 md:p-10">
        <div className="max-w-7xl mx-auto text-center text-slate-500 animate-pulse">
          📊 Memuat data analitik dari Supabase...
        </div>
      </div>
    );
  }

  // ✅ Ambil data utama dari hook
  const summary = data.summary;
  const ratios = data.ratios || {
    loanToDepositRatio: 0,
    activeMemberRatio: 0,
    avgTransactionValue: 0,
    savingGrowthRate: 0,
    loanGrowthRate: 0,
  };
  const performance = data.performance || {
    branchCount: 0,
    topMarketer: "-",
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
            growth={`${ratios.savingGrowthRate.toFixed(1)}% bulan ini`}
            trend={ratios.savingGrowthRate >= 0 ? "up" : "down"}
          />
          <KpiCard
            icon={<Activity className="w-8 h-8 text-orange-600" />}
            title="Total Pinjaman"
            value={`Rp ${summary.totalLoans.toLocaleString("id-ID")}`}
            growth={`${ratios.loanGrowthRate.toFixed(1)}% bulan ini`}
            trend={ratios.loanGrowthRate >= 0 ? "up" : "down"}
          />
          <KpiCard
            icon={<PieIcon className="w-8 h-8 text-purple-600" />}
            title="Total Transaksi"
            value={summary.totalTransactions}
            growth={`Avg Rp ${ratios.avgTransactionValue.toLocaleString("id-ID")}`}
            trend="up"
          />
        </motion.div>

        {/* Ratio Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-center"
        >
          <RatioBox
            icon={<Percent className="w-6 h-6 text-green-600 mx-auto" />}
            label="Loan-to-Deposit Ratio"
            value={`${ratios.loanToDepositRatio.toFixed(1)}%`}
          />
          <RatioBox
            icon={<Users className="w-6 h-6 text-blue-600 mx-auto" />}
            label="Active Member Ratio"
            value={`${ratios.activeMemberRatio.toFixed(1)}%`}
          />
          <RatioBox
            icon={<DollarSign className="w-6 h-6 text-yellow-600 mx-auto" />}
            label="Withdraw Approval"
            value={`${summary.withdrawApprovalRate.toFixed(1)}%`}
          />
          <RatioBox
            icon={<Building2 className="w-6 h-6 text-purple-600 mx-auto" />}
            label="Jumlah Cabang"
            value={performance.branchCount ?? "-"}
          />
          <RatioBox
            icon={<Star className="w-6 h-6 text-orange-500 mx-auto" />}
            label="Top Marketer"
            value={performance.topMarketer ?? "-"}
          />
        </motion.div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ChartCard title="Perbandingan Simpanan & Pinjaman">
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
          </ChartCard>

          <ChartCard title="Proporsi Jenis Transaksi">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.transactionDistribution}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {data.transactionDistribution.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Member Growth */}
        <ChartCard title="Pertumbuhan Anggota per Bulan">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="active" stroke="#3b82f6" name="Aktif" />
              <Line type="monotone" dataKey="new" stroke="#f59e0b" name="Baru" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Insight Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl shadow-md border border-slate-200"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            🔍 Insight Otomatis
          </h2>
          <ul className="divide-y divide-slate-200">
            {(data.insights || []).map((insight, i) => (
              <li key={i} className="py-3 text-slate-700 text-sm">
                {insight}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-slate-400 text-xs mt-8"
        >
          © {new Date().getFullYear()} KKSUKA Cooperative System. Powered by Supabase & Next.js
        </motion.div>
      </div>
    </div>
  );
}

/* 🔹 Components */
function KpiCard({ icon, title, value, growth, trend, loading = false }: any) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 bg-white shadow-md border border-slate-200 animate-pulse" />
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
      <p className={`text-xs mt-1 ${trend === "up" ? "text-green-600" : "text-red-600"}`}>{growth}</p>
    </div>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-md border border-slate-200"
    >
      <h2 className="text-lg font-semibold text-slate-800 mb-4">{title}</h2>
      {children}
    </motion.div>
  );
}

function RatioBox({ icon, label, value }: any) {
  return (
    <div>
      {icon}
      <p className="text-xs text-slate-500 mt-2">{label}</p>
      <p className="text-lg font-semibold text-slate-800">{value}</p>
    </div>
  );
}

/* 🔹 Util */
function mergeTrends(
  savings: { month: string; value: number }[] = [],
  loans: { month: string; value: number }[] = []
) {
  const allMonths = Array.from(new Set([...savings.map((d) => d.month), ...loans.map((d) => d.month)]));
  return allMonths.map((m) => ({
    month: m,
    simpanan: savings.find((s) => s.month === m)?.value || 0,
    pinjaman: loans.find((l) => l.month === m)?.value || 0,
  }));
}

function compareTrend(current: number, total: number): string {
  if (!total) return "0%";
  const percentage = ((current / total) * 100).toFixed(1);
  return `${percentage}% aktif`;
}
