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
  };
  trendSavings: { month: string; value: number }[];
  trendLoans: { month: string; value: number }[];
  transactionDistribution: { name: string; value: number }[];
  memberGrowth: { month: string; active: number; new: number }[];
};

type UseAnalyticsResult = {
  data: AnalyticsData | null;
  loading: boolean;
  refetch: (force?: boolean) => Promise<void>;
};

// 🧠 Cache memory sederhana
let cache: { data: AnalyticsData | null; timestamp: number } = { data: null, timestamp: 0 };

const useAnalyticsData = (): UseAnalyticsResult => {
  const [data, setData] = useState<AnalyticsData | null>(cache.data);
  const [loading, setLoading] = useState(!cache.data);

  const fetchAnalytics = async (force = false) => {
    const cacheValid = Date.now() - cache.timestamp < 120000; // 2 menit cache
    if (!force && cache.data && cacheValid) {
      setData(cache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { count: totalMembers } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true });
      const { count: activeMembers } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { data: totalSavingsData } = await supabase.from("savings").select("amount, created_at");
      const { data: totalLoansData } = await supabase.from("loans").select("amount, created_at");
      const { data: transactionsData } = await supabase.from("transactions").select("type, amount, created_at");

      const totalSavings = totalSavingsData?.reduce((a, b) => a + Number(b.amount || 0), 0) || 0;
      const totalLoans = totalLoansData?.reduce((a, b) => a + Number(b.amount || 0), 0) || 0;
      const totalTransactions = transactionsData?.length || 0;

      const groupedTransactions: Record<string, number> = {};
      transactionsData?.forEach((t) => {
        const type = t.type || "Lainnya";
        groupedTransactions[type] = (groupedTransactions[type] || 0) + 1;
      });
      const transactionDistribution = Object.entries(groupedTransactions).map(([name, value]) => ({ name, value }));

      const aggregateByMonth = (rows: any[]) => {
        const monthly: Record<string, number> = {};
        rows?.forEach((t) => {
          const month = new Date(t.created_at).toLocaleString("id-ID", { month: "short" });
          monthly[month] = (monthly[month] || 0) + Number(t.amount || 0);
        });
        return Object.entries(monthly).map(([month, value]) => ({ month, value }));
      };

      const trendSavings = aggregateByMonth(totalSavingsData || []);
      const trendLoans = aggregateByMonth(totalLoansData || []);

      const { data: memberData } = await supabase.from("members").select("created_at, status");
      const memberMonthly: Record<string, number> = {};
      memberData?.forEach((m) => {
        const month = new Date(m.created_at).toLocaleString("id-ID", { month: "short" });
        memberMonthly[month] = (memberMonthly[month] || 0) + 1;
      });
      const memberGrowth = Object.entries(memberMonthly).map(([month, newMembers]) => ({
        month,
        active: Math.round(newMembers * 5),
        new: newMembers,
      }));

      const newData: AnalyticsData = {
        summary: {
          totalMembers: totalMembers || 0,
          activeMembers: activeMembers || 0,
          totalSavings,
          totalLoans,
          totalTransactions,
        },
        trendSavings,
        trendLoans,
        transactionDistribution,
        memberGrowth,
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

    // subscribe() can return a Promise; call it without awaiting so the effect stays synchronous
    channel.subscribe();

    return () => {
      // removeChannel returns a Promise; use void to ignore it so the cleanup is synchronous
      void supabase.removeChannel(channel);
    };
  }, []);

  return { data, loading, refetch: (force = false) => fetchAnalytics(force) };
};

export default useAnalyticsData;
