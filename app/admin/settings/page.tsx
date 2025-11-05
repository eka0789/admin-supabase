"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import Switch from "@/components/ui/Switch";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Settings, RefreshCcw, ShieldCheck, Loader2 } from "lucide-react";

export default function SettingsPage() {
    const [bhEnabled, setBhEnabled] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);

    // --- Ambil status dari RPC ---
    const fetchStatus = async () => {
        const { data, error } = await supabase.rpc("get_setting", { p_key: "bh_enabled_global" });
        if (error) {
            console.error(error);
            return;
        }
        setBhEnabled(data === true || data === "true" || data === "True");
    };

    // --- Toggle status global ---
    const toggle = async () => {
        if (bhEnabled === null) return;
        setLoading(true);
        const newVal = !bhEnabled;
        const { error } = await supabase.rpc("set_setting", {
            p_key: "bh_enabled_global",
            p_value: newVal,
        });
        setLoading(false);
        if (error) console.error(error);
    };

    // --- Listen ke perubahan realtime (app_settings) ---
    useEffect(() => {
        fetchStatus();

        const channel = supabase
            .channel("app_settings")
            .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, (payload) => {
                const data = payload.new as { key?: string; value?: any } | null;
                if (data?.key === "bh_enabled_global") {
                    setBhEnabled(data.value === true || data.value === "true");
                }
            });

        void channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-100 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Settings className="w-6 h-6 text-slate-700" />
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                            Pengaturan Sistem KKSUKA
                        </h1>
                    </div>
                    <Button onClick={fetchStatus} variant="outline" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memuat...
                            </>
                        ) : (
                            <>
                                <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
                            </>
                        )}
                    </Button>
                </div>

                {/* Main Setting Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-700">
                                <ShieldCheck className="w-5 h-5 text-green-600" />
                                Bonus Harian (BH) Global
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-medium text-slate-800">
                                        Aktifkan atau nonaktifkan fitur BH untuk seluruh user
                                    </h4>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Jika dimatikan, semua user tidak akan menerima bonus harian.
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Switch checked={!!bhEnabled} onChange={toggle} />
                                    <span
                                        className={`font-semibold ${bhEnabled === null
                                            ? "text-slate-400"
                                            : bhEnabled
                                                ? "text-green-600"
                                                : "text-red-600"
                                            }`}
                                    >
                                        {bhEnabled === null
                                            ? "Loading..."
                                            : bhEnabled
                                                ? "Aktif"
                                                : "Nonaktif"}
                                    </span>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="mt-6 flex justify-end">
                                <Button
                                    onClick={toggle}
                                    disabled={loading || bhEnabled === null}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                                        </>
                                    ) : bhEnabled ? (
                                        "Nonaktifkan"
                                    ) : (
                                        "Aktifkan"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Info Section */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <Card className="bg-linear-to-br from-blue-50 to-green-50 border-none shadow-inner">
                        <CardContent className="p-6">
                            <p className="text-sm text-slate-600 leading-relaxed">
                                🔒 Perubahan di halaman ini berlaku secara global dan realtime. Pastikan Anda memiliki hak akses admin sebelum melakukan modifikasi.
                                Setiap perubahan akan disinkronkan ke seluruh sistem koperasi melalui Supabase Realtime Channel.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
