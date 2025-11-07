"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AnalyticsData = {
  summary: {
    totalMembers: number;
    activeMembers: number;
    totalSavings: number;
    totalLoans: number;
    totalTransactions: number;
    withdrawApprovalRate: number;
    totalMarketingEarnings: number;
    topBranch: string | null;
    topBranchAmount: number;
  };
  trendSavings: { month: string; value: number }[];
  trendLoans: { month: string; value: number }[];
  transactionDistribution: { name: string; value: number }[];
  memberGrowth: { month: string; active: number; new: number }[];

  // 🔹 Tambahan Analitik
  transactionPerMonth: { month: string; total: number }[];
  savingDistribution: { name: string; count: number }[];
  marketingEarnings: { marketer_id: string; total: number }[];
  topBranches: { kacab_id: string; total: number }[];

  // 🔹 Insight & Rasio
  insights: string[];
  ratios: {
    loanToDepositRatio: number;
    activeMemberRatio: number;
    avgTransactionValue: number;
    savingGrowthRate: number;
    loanGrowthRate: number;
  };
  performance: {
    topMarketer: string | null;
    topMarketerEarning: number;
    mostActiveMonth: string | null;
    branchCount: number;
  };
};

type UseAnalyticsResult = {
  data: AnalyticsData | null;
  loading: boolean;
  refetch: (force?: boolean) => Promise<void>;
};

let cache: { data: AnalyticsData | null; timestamp: number } = { data: null, timestamp: 0 };

const useAnalyticsData = (): UseAnalyticsResult => {
  const [data, setData] = useState<AnalyticsData | null>(cache.data);
  const [loading, setLoading] = useState(!cache.data);

  const fetchAnalytics = async (force = false) => {
    const cacheValid = Date.now() - cache.timestamp < 120000;
    if (!force && cache.data && cacheValid) {
      setData(cache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // =======================================================
      // 🧍 1️⃣ Anggota
      // =======================================================
      const { count: totalMembers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "member");

      const { count: activeMembers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "member")
        .eq("bh_enabled", true);

      // =======================================================
      // 💰 2️⃣ Transaksi & Pinjaman
      // =======================================================
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("amount, kind, status, created_at")
        .not("status", "is", null);

      const validTransactions =
        transactionsData?.filter((t) => ["verified", "settled", "approved"].includes(t.status)) || [];

      const totalSavings =
        validTransactions
          .filter((t) => ["deposit", "topup", "p2p_recv"].includes(t.kind))
          .reduce((a, b) => a + Number(b.amount || 0), 0) || 0;

      const totalTransactions = validTransactions.length;
      const avgTransactionValue =
        totalTransactions > 0
          ? validTransactions.reduce((a, b) => a + Number(b.amount || 0), 0) / totalTransactions
          : 0;

      const { data: totalLoansData } = await supabase
        .from("mpb_contracts")
        .select("principal, created_at, status");

      const totalLoans =
        totalLoansData
          ?.filter((l) => ["active", "completed"].includes(l.status || ""))
          .reduce((a, b) => a + Number(b.principal || 0), 0) || 0;

      // =======================================================
      // 📆 3️⃣ Transaksi Per Bulan
      // =======================================================
      const aggregateByMonth = (rows: any[], field: string) => {
        const monthly: Record<string, number> = {};
        rows?.forEach((r) => {
          const month = new Date(r.created_at).toLocaleString("id-ID", { month: "short" });
          monthly[month] = (monthly[month] || 0) + Number(r[field] || 0);
        });
        return Object.entries(monthly).map(([month, value]) => ({ month, value }));
      };

      const transactionPerMonth = aggregateByMonth(validTransactions, "amount");
      const trendSavings = aggregateByMonth(
        validTransactions.filter((t) => ["deposit", "topup", "p2p_recv"].includes(t.kind)),
        "amount"
      );
      const trendLoans = aggregateByMonth(totalLoansData || [], "principal");

      // Hitung pertumbuhan bulanan (rate)
      const savingGrowthRate = calcGrowthRate(trendSavings);
      const loanGrowthRate = calcGrowthRate(trendLoans);

      // =======================================================
      // 🏦 4️⃣ Jenis Simpanan & Cabang
      // =======================================================
      const { data: accountsData } = await supabase
        .from("accounts")
        .select("id, savings_types(name)");
      const savingCount: Record<string, number> = {};
      accountsData?.forEach((a: any) => {
        const type = a.savings_types?.name || "Tidak Diketahui";
        savingCount[type] = (savingCount[type] || 0) + 1;
      });
      const savingDistribution = Object.entries(savingCount).map(([name, count]) => ({ name, count }));

      const { data: branchData } = await supabase
        .from("branch_incentives")
        .select("kacab_id, amount");
      const branchMap: Record<string, number> = {};
      branchData?.forEach((b) => {
        branchMap[b.kacab_id] = (branchMap[b.kacab_id] || 0) + Number(b.amount);
      });
      const topBranches = Object.entries(branchMap)
        .map(([kacab_id, total]) => ({ kacab_id, total }))
        .sort((a, b) => b.total - a.total);
      const topBranch = topBranches[0]?.kacab_id || null;
      const topBranchAmount = topBranches[0]?.total || 0;

      // =======================================================
      // 👥 5️⃣ Marketing & Withdraw
      // =======================================================
      const { data: marketingData } = await supabase
        .from("marketing_commissions")
        .select("marketer_id, amount");
      const marketingEarningsMap: Record<string, number> = {};
      marketingData?.forEach((m) => {
        marketingEarningsMap[m.marketer_id] =
          (marketingEarningsMap[m.marketer_id] || 0) + Number(m.amount);
      });
      const marketingEarnings = Object.entries(marketingEarningsMap).map(([marketer_id, total]) => ({
        marketer_id,
        total,
      }));
      const totalMarketingEarnings = Object.values(marketingEarningsMap).reduce((a, b) => a + b, 0);

      const topMarketerData = marketingEarnings.sort((a, b) => b.total - a.total)[0];
      const topMarketer = topMarketerData?.marketer_id || null;
      const topMarketerEarning = topMarketerData?.total || 0;

      const { data: wdData } = await supabase.from("withdrawals").select("status");
      const totalWd = wdData?.length || 0;
      const approvedWd = wdData?.filter((w) => w.status === "approved").length || 0;
      const withdrawApprovalRate = totalWd ? (approvedWd / totalWd) * 100 : 0;

      // =======================================================
      // 🌱 6️⃣ Pertumbuhan Anggota
      // =======================================================
      const { data: memberData } = await supabase
        .from("profiles")
        .select("created_at, bh_enabled, role")
        .eq("role", "member");

      const memberMonthly: Record<string, number> = {};
      memberData?.forEach((m) => {
        const month = new Date(m.created_at).toLocaleString("id-ID", { month: "short" });
        memberMonthly[month] = (memberMonthly[month] || 0) + 1;
      });
      const memberGrowth = Object.entries(memberMonthly).map(([month, newMembers]) => ({
        month,
        active: Math.round(newMembers * 0.8),
        new: newMembers,
      }));

      // =======================================================
      // 🧠 7️⃣ Insight Otomatis
      // =======================================================
      const insights = generateInsights({
        totalSavings,
        totalLoans,
        totalTransactions,
        totalMembers,
        activeMembers,
        withdrawApprovalRate,
        savingGrowthRate,
        loanGrowthRate,
      });

      // =======================================================
      // 📊 8️⃣ Rasio & Performance
      // =======================================================
      const ratios = {
        loanToDepositRatio: totalSavings ? (totalLoans / totalSavings) * 100 : 0,
        activeMemberRatio: totalMembers ? ((activeMembers ?? 0) / totalMembers) * 100 : 0,
        avgTransactionValue,
        savingGrowthRate,
        loanGrowthRate,
      };

      const mostActiveMonth =
        transactionPerMonth.sort((a, b) => b.value - a.value)[0]?.month || null;

      const performance = {
        topMarketer,
        topMarketerEarning,
        mostActiveMonth,
        branchCount: topBranches.length,
      };

      // =======================================================
      // 🧩 9️⃣ Kompilasi Akhir
      // =======================================================
      const newData: AnalyticsData = {
        summary: {
          totalMembers: totalMembers || 0,
          activeMembers: activeMembers || 0,
          totalSavings,
          totalLoans,
          totalTransactions,
          withdrawApprovalRate,
          totalMarketingEarnings,
          topBranch,
          topBranchAmount,
        },
        trendSavings,
        trendLoans,
        transactionDistribution: Object.entries(
          validTransactions?.reduce((acc: any, t: any) => {
            const type = t.kind || "Lainnya";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {}) || {}
        ).map(([name, value]) => ({ name, value: Number(value) })),
        memberGrowth,
        transactionPerMonth: transactionPerMonth.map(({ month, value }) => ({ month, total: value })),
        savingDistribution,
        marketingEarnings,
        topBranches,
        insights,
        ratios,
        performance,
      };

      cache = { data: newData, timestamp: Date.now() };
      setData(newData);
    } catch (err) {
      console.error("❌ Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const channel = supabase
      .channel("analytics_realtime")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        void fetchAnalytics(true);
      });
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return { data, loading, refetch: (force = false) => fetchAnalytics(force) };
};

// =======================================================
// 🧩 Utility Functions
// =======================================================

function calcGrowthRate(trend: { month: string; value: number }[]) {
  if (trend.length < 2) return 0;
  const last = trend.at(-1)?.value || 0;
  const prev = trend.at(-2)?.value || 0;
  return prev > 0 ? ((last - prev) / prev) * 100 : 0;
}

function generateInsights(summary: any): string[] {
  const result: string[] = [];

  if (summary.totalSavings > summary.totalLoans)
    result.push("💰 Koperasi dalam kondisi likuid — simpanan lebih besar dari pinjaman.");
  if (summary.loanToDepositRatio > 80)
    result.push("⚠️ Rasio pinjaman terhadap simpanan tinggi, perhatikan risiko kredit.");
  if (summary.activeMembers / summary.totalMembers < 0.6)
    result.push("📉 Aktivitas anggota menurun, lakukan pendekatan dan edukasi ulang.");
  if (summary.withdrawApprovalRate < 70)
    result.push("⏳ Banyak penarikan belum disetujui, evaluasi proses verifikasi.");
  if (summary.savingGrowthRate > 5)
    result.push("📈 Pertumbuhan simpanan meningkat bulan ini — pertahankan momentum.");
  if (summary.loanGrowthRate < 0)
    result.push("📉 Pinjaman menurun, pertimbangkan promosi produk pinjaman baru.");
  if (result.length === 0)
    result.push("✅ Semua indikator koperasi dalam kondisi stabil.");

  return result;
}

export default useAnalyticsData;
