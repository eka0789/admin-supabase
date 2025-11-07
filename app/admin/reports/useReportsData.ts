"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type MonthlyReport = { month: string; transaksi: number; anggota: number };
type RoleDistribution = { name: string; value: number };
type Transaction = { id: number; nama: string; jenis: string; jumlah: string; tanggal: string; status: string };

type ReportsData = {
  monthlyData: MonthlyReport[];
  distribusiRole: RoleDistribution[];
  recentTransactions: Transaction[];
  summary: {
    totalMembers: number;
    totalTransactions: number;
    totalSavings: number;
  };
};

const useReportsData = () => {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // === 1️⃣ Summary quick stats ===
      const { count: totalMembers } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true });
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("id, member_name, type, amount, created_at, status")
        .order("created_at", { ascending: false })
        .limit(10);

      const { data: savingsData } = await supabase.from("savings").select("amount");
      const totalSavings = savingsData?.reduce((acc, s) => acc + Number(s.amount || 0), 0) || 0;

      // === 2️⃣ Monthly aggregation ===
      const monthly: Record<string, { transaksi: number; anggota: Set<string> }> = {};
      transactionsData?.forEach((t) => {
        const month = new Date(t.created_at).toLocaleString("id-ID", { month: "short" });
        if (!monthly[month]) monthly[month] = { transaksi: 0, anggota: new Set() };
        monthly[month].transaksi += 1;
        if (t.member_name) monthly[month].anggota.add(t.member_name);
      });

      const monthlyData = Object.entries(monthly).map(([month, val]) => ({
        month,
        transaksi: val.transaksi,
        anggota: val.anggota.size,
      }));

      // === 3️⃣ Role distribution (from members or profiles table) ===
      const { data: roleData } = await supabase.from("members").select("role");
      const roleCounts: Record<string, number> = {};
      roleData?.forEach((r) => {
        const role = r.role || "Lainnya";
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
      const distribusiRole = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

      // === 4️⃣ Recent transactions table ===
      const recentTransactions =
        transactionsData?.map((t) => ({
          id: t.id,
          nama: t.member_name || "-",
          jenis: t.type,
          jumlah: `Rp ${Number(t.amount || 0).toLocaleString("id-ID")}`,
          tanggal: new Date(t.created_at).toLocaleDateString("id-ID"),
          status: t.status || "Selesai",
        })) || [];

      // === ✅ Combine all data ===
      setData({
        monthlyData,
        distribusiRole,
        recentTransactions,
        summary: {
          totalMembers: totalMembers || 0,
          totalTransactions: transactionsData?.length || 0,
          totalSavings,
        },
      });
    } catch (err) {
      console.error("❌ Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const channel = supabase
      .channel("reports_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, fetchReports)
      .subscribe();
    return () => {
      // cleanup must not return a Promise to satisfy EffectCallback signature
      void supabase.removeChannel(channel);
    };
  }, []);

  return { data, loading, refetch: fetchReports };
};

// 🔹 Export CSV utilitas
export async function exportTransactionsToCSV() {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, member_name, type, amount, created_at, status")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      alert("Tidak ada data transaksi untuk diekspor.");
      return;
    }

    // Konversi ke CSV
    const headers = ["ID", "Nama Anggota", "Jenis", "Jumlah", "Tanggal", "Status"];
    const rows = data.map((t) => [
      t.id,
      t.member_name || "-",
      t.type,
      `Rp ${Number(t.amount || 0).toLocaleString("id-ID")}`,
      new Date(t.created_at).toLocaleDateString("id-ID"),
      t.status || "Selesai",
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    // Buat file blob dan unduh
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-transaksi-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("❌ Gagal ekspor CSV:", err);
    alert("Terjadi kesalahan saat mengekspor laporan.");
  }
}


export default useReportsData;
