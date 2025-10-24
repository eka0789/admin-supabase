"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Switch from "@/components/ui/Switch";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

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
        const { error } = await supabase.rpc("set_setting", { p_key: "bh_enabled_global", p_value: newVal });
        setLoading(false);
        if (error) console.error(error);
    };

    // --- Listen ke perubahan realtime (app_settings) ---
    useEffect(() => {
        fetchStatus();

        const channel = supabase
            .channel("app_settings")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "app_settings" },
                (payload) => {
                    // ✅ Gunakan casting agar TS tahu field-nya ada
                    const data = payload.new as { key?: string; value?: any } | null;
                    if (data?.key === "bh_enabled_global") {
                        setBhEnabled(data.value === true || data.value === "true");
                    }
                }
            );

        // ✅ subscribe() sekarang async, jangan return promise
        const subscribe = async () => {
            try {
                await channel.subscribe();
            } catch (err) {
                console.error("Subscription failed:", err);
            }
        };

        // ✅ jalankan tanpa return promise
        void subscribe();

        // cleanup
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="min-h-screen p-8 bg-slate-50">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Pengaturan Sistem</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Bonus Harian (BH) Global</h4>
                                <p className="text-sm text-gray-500">
                                    Aktifkan atau nonaktifkan fitur BH untuk seluruh user
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Switch checked={!!bhEnabled} onChange={toggle} />
                                <span
                                    className={`font-semibold ${bhEnabled ? "text-green-600" : "text-red-600"
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
                        <div className="mt-4 flex justify-end">
                            <Button onClick={fetchStatus} disabled={loading}>
                                Refresh
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
