"use client";

import { useEffect, useState, useRef, useCallback, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
    UserCog,
    Search,
    Shield,
    Loader2,
    Edit3,
    Upload,
    X,
    ArrowUpDown,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/Dialog";
import { toast } from "sonner";

/* -------------------- Fallback Input & Label -------------------- */
function Input(props: any) {
    const { className = "", ...rest } = props;
    return (
        <input
            className={`border border-slate-300 rounded-md px-3 py-2 text-sm w-full ${className}`}
            {...rest}
        />
    );
}
function Label({ children, className, ...props }: any) {
    return (
        <label className={`block text-sm text-slate-700 ${className || ""}`} {...props}>
            {children}
        </label>
    );
}

/* -------------------- Debounce Hook -------------------- */
function useDebounce<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced;
}

/* -------------------- Helper: safe error message -------------------- */
function getErrorMessage(err: unknown) {
    try {
        if (!err) return "Unknown error";
        // common shapes
        const anyErr = err as any;
        if (typeof anyErr === "string") return anyErr;
        if (anyErr?.message) return String(anyErr.message);
        if (anyErr?.error_description) return String(anyErr.error_description);
        if (anyErr?.hint) return String(anyErr.hint);
        // if it's a plain object, stringify but limit length
        const str = JSON.stringify(anyErr, Object.getOwnPropertyNames(anyErr));
        return str.length > 1000 ? str.slice(0, 1000) + "..." : str;
    } catch (e) {
        return "Failed to parse error";
    }
}

/* -------------------- Type Definition -------------------- */
type Profile = {
    id: string;
    nik: string | null;
    name: string | null;
    phone: string | null;
    role: string | null;
    bh_enabled: boolean;
    qris_image_url: string | null;
    avatar_url?: string | null;
    created_at?: string;
};

/* -------------------- Skeleton Row -------------------- */
function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-3 py-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200" />
                <div className="h-3 w-32 bg-slate-200 rounded-md" />
            </td>
            <td className="px-3 py-2">
                <div className="h-3 w-28 bg-slate-200 rounded-md" />
            </td>
            <td className="px-3 py-2">
                <div className="h-3 w-16 bg-slate-200 rounded-md" />
            </td>
            <td className="px-3 py-2 text-center">
                <div className="h-4 w-6 bg-slate-200 rounded-md mx-auto" />
            </td>
            <td className="px-3 py-2">
                <div className="h-3 w-20 bg-slate-200 rounded-md" />
            </td>
            <td className="px-3 py-2 text-center">
                <div className="h-6 w-10 bg-slate-200 rounded-md mx-auto" />
            </td>
        </tr>
    );
}

/* =================================================================== */
export default function AdminUserManagementPage() {
    const [rows, setRows] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [editUser, setEditUser] = useState<Profile | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const limit = 12;
    const pageRef = useRef(1);
    const totalRef = useRef<number | null>(null);
    const [sortField, setSortField] = useState<"name" | "role" | "created_at">("created_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const fetchLockRef = useRef(false);

    /* -------------------- Query Builder -------------------- */
    const buildQuery = (pg: number) => {
        const from = (pg - 1) * limit;
        const to = from + limit - 1;
        let query = supabase
            .from("profiles")
            .select(
                "id, nik, name, phone, role, bh_enabled, qris_image_url, avatar_url, created_at",
                { count: "exact" }
            )
            .order(sortField, { ascending: sortOrder === "asc" })
            .range(from, to);

        if (debouncedSearch && debouncedSearch.trim() !== "") {
            const s = debouncedSearch.trim().replace(/%/g, "\\%");
            query = query.or(
                `name.ilike.%${s}%,nik.ilike.%${s}%,phone.ilike.%${s}%`
            );
        }

        if (roleFilter !== "ALL") {
            query = query.eq("role", roleFilter);
        }

        return query;
    };

    /* -------------------- Load Data -------------------- */
    const loadPage = useCallback(
        async (pg: number, replace = false) => {
            if (fetchLockRef.current) return;
            fetchLockRef.current = true;
            if (pg === 1) setLoading(true);
            else setIsFetchingMore(true);

            try {
                const { data, count, error } = await buildQuery(pg);

                if (error) {
                    // don't throw raw PostgrestError; handle gracefully
                    const msg = getErrorMessage(error);
                    console.error("LoadPage Supabase error:", msg);
                    toast.error("Gagal memuat pengguna: " + msg);
                    return;
                }

                totalRef.current = typeof count === "number" ? count : totalRef.current;
                setRows((prev) => {
                    if (replace) return data || [];
                    const existingIds = new Set(prev.map((r) => r.id));
                    const newRows = (data || []).filter((r: Profile) => !existingIds.has(r.id));
                    return [...prev, ...newRows];
                });
                pageRef.current = pg;
            } catch (err: unknown) {
                const msg = getErrorMessage(err);
                console.error("Unexpected loadPage error:", msg);
                toast.error("Gagal memuat pengguna: " + msg);
            } finally {
                if (pg === 1) setLoading(false);
                else setIsFetchingMore(false);
                fetchLockRef.current = false;
            }
        },
        [sortField, sortOrder, debouncedSearch, roleFilter]
    );

    const resetAndLoad = useCallback(async () => {
        pageRef.current = 1;
        totalRef.current = null;
        setRows([]);
        await loadPage(1, true);
    }, [loadPage]);

    const loadMore = useCallback(async () => {
        const total = totalRef.current;
        if (total !== null && rows.length >= total) return;
        await loadPage(pageRef.current + 1, false);
    }, [rows.length, loadPage]);

    /* -------------------- Infinite Scroll -------------------- */
    useEffect(() => {
        if (!("IntersectionObserver" in window)) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !isFetchingMore && !loading) {
                        void loadMore();
                    }
                });
            },
            { root: null, rootMargin: "200px", threshold: 0.1 }
        );

        const obs = observerRef.current;
        const el = sentinelRef.current;
        if (el) obs.observe(el);

        return () => {
            if (el && obs) obs.unobserve(el);
            obs.disconnect();
        };
    }, [loadMore, isFetchingMore, loading]);

    /* -------------------- Fetch On Filter / Sort Change -------------------- */
    useEffect(() => {
        void resetAndLoad();
    }, [resetAndLoad]);

    /* -------------------- Realtime Patch Update -------------------- */
    useEffect(() => {
        const channel = supabase
            .channel("profiles_admin_infinite")
            .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, (payload) => {
                const newRow = payload.new as Profile | null;
                const oldRow = payload.old as Profile | null;

                setRows((prev) => {
                    let updated = [...prev];
                    switch (payload.eventType) {
                        case "INSERT":
                            if (newRow && !updated.some((r) => r.id === newRow.id)) {
                                updated.unshift(newRow);
                            }
                            break;
                        case "UPDATE":
                            updated = updated.map((r) => (r.id === newRow?.id ? { ...r, ...newRow } : r));
                            break;
                        case "DELETE":
                            updated = updated.filter((r) => r.id !== oldRow?.id);
                            break;
                    }
                    return updated;
                });
            });

        void channel.subscribe();
        return () => void supabase.removeChannel(channel);
    }, []);

    /* -------------------- Sorting -------------------- */
    const handleSort = (field: "name" | "role" | "created_at") => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    /* -------------------- Toggle BH -------------------- */
    const toggleBh = async (user: Profile) => {
        const newVal = !user.bh_enabled;
        const { error } = await supabase.from("profiles").update({ bh_enabled: newVal }).eq("id", user.id);
        if (error) {
            const msg = getErrorMessage(error);
            console.error("toggleBh error:", msg);
            toast.error("Gagal memperbarui status BH: " + msg);
        } else {
            setRows((prev) => prev.map((r) => (r.id === user.id ? { ...r, bh_enabled: newVal } : r)));
            toast.success(`BH ${user.name} ${newVal ? "diaktifkan" : "dinonaktifkan"}`);
        }
    };

    /* -------------------- Save User -------------------- */
    const saveUser = async () => {
        if (!editUser) return;
        setSaving(true);
        const { id, name, phone, role, bh_enabled, avatar_url } = editUser;
        const { error } = await supabase.from("profiles").update({ name, phone, role, bh_enabled, avatar_url }).eq("id", id);
        setSaving(false);
        if (error) {
            const msg = getErrorMessage(error);
            console.error("saveUser error:", msg);
            toast.error("Gagal menyimpan perubahan: " + msg);
        } else {
            setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name, phone, role, bh_enabled, avatar_url } : r)));
            toast.success("Data pengguna berhasil diperbarui 🎉");
            setEditUser(null);
        }
    };

    /* -------------------- Upload Avatar -------------------- */
    const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files?.length || !editUser) return;
            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `${editUser.id}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;
            setUploading(true);

            const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
            if (uploadError) {
                const msg = getErrorMessage(uploadError);
                console.error("uploadAvatar error:", msg);
                toast.error("Gagal upload foto: " + msg);
                return;
            }

            const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(filePath);
            setEditUser({ ...editUser, avatar_url: publicUrl.publicUrl });
            toast.success("Foto profil berhasil diunggah 🖼️");
        } catch (err: unknown) {
            const msg = getErrorMessage(err);
            console.error("uploadAvatar unexpected error:", msg);
            toast.error("Gagal upload foto: " + msg);
        } finally {
            setUploading(false);
        }
    };

    const removeAvatar = () => {
        if (!editUser) return;
        setEditUser({ ...editUser, avatar_url: null });
        toast.info("Foto profil dihapus (belum disimpan)");
    };

    const hasMore = totalRef.current === null ? true : rows.length < totalRef.current;

    /* -------------------- UI -------------------- */
    return (
        <div className="min-h-screen bg-linear-to-br from-slate-100 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <UserCog className="text-slate-700" />
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                            Manajemen Pengguna KKSUKA
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => void resetAndLoad()}>
                            <Shield className="w-4 h-4 mr-2" /> Refresh
                        </Button>
                        <div className="text-sm text-slate-500 ml-2">
                            Total loaded: {rows.length}
                            {totalRef.current ? ` / ${totalRef.current}` : ""}
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <Card className="border border-slate-200 shadow-sm">
                    <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4">
                        <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Cari nama / NIK / telepon..."
                                value={search}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                className="border border-slate-300 rounded-md px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-slate-600">Role:</label>
                            <select
                                value={roleFilter}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
                                className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-green-500"
                            >
                                <option value="ALL">Semua</option>
                                <option value="admin">Admin</option>
                                <option value="kacab">Kacab</option>
                                <option value="marketing">Marketer</option>
                                <option value="member">Member</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>
                            Daftar Pengguna (loaded {rows.length}
                            {totalRef.current ? ` / ${totalRef.current}` : ""})
                            <span className="ml-2 text-xs text-green-600 font-medium">
                                (Realtime Active)
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-left text-slate-600 bg-slate-50 border-b">
                                        <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort("name")}>
                                            Nama <ArrowUpDown className="inline w-3 h-3 ml-1" />
                                        </th>
                                        <th className="px-3 py-2">Telepon</th>
                                        <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort("role")}>
                                            Role <ArrowUpDown className="inline w-3 h-3 ml-1" />
                                        </th>
                                        <th className="px-3 py-2 text-center">BH</th>
                                        <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort("created_at")}>
                                            Dibuat <ArrowUpDown className="inline w-3 h-3 ml-1" />
                                        </th>
                                        <th className="px-3 py-2 text-center">Aksi</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading
                                        ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                        : rows.map((p, i) => (
                                            <motion.tr
                                                key={p.id}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.01 }}
                                                className="bg-white shadow-sm hover:shadow-md transition rounded-xl"
                                            >
                                                <td className="px-3 py-2 font-medium text-slate-700 rounded-l-xl flex items-center gap-2">
                                                    {p.avatar_url ? (
                                                        <img src={p.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                                                    )}
                                                    {p.name || "-"}
                                                </td>
                                                <td className="px-3 py-2 text-slate-600">{p.phone || "-"}</td>
                                                <td className="px-3 py-2 text-slate-700">{p.role?.toUpperCase() || "-"}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <Switch checked={p.bh_enabled} onChange={() => toggleBh(p)} />
                                                </td>
                                                <td className="px-3 py-2 text-slate-500">{p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID") : "-"}</td>
                                                <td className="px-3 py-2 text-center space-x-2 rounded-r-xl">
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs" onClick={() => setEditUser(p)}>
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Sentinel + Lazy Loading Indicator */}
                        <div ref={sentinelRef} className="h-6" />
                        {isFetchingMore && (
                            <div className="mt-4 space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="animate-pulse h-6 bg-slate-200 rounded-md" />
                                ))}
                            </div>
                        )}
                        {!isFetchingMore && !hasMore && (
                            <div className="text-slate-400 text-sm text-center mt-3">Semua pengguna telah dimuat</div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Modal */}
                <Dialog open={!!editUser} onOpenChange={(val) => !val && setEditUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Data Pengguna</DialogTitle>
                        </DialogHeader>
                        {editUser && (
                            <div className="space-y-4">
                                <div className="flex flex-col items-center gap-3">
                                    {editUser.avatar_url ? (
                                        <div className="relative">
                                            <img src={editUser.avatar_url} alt="avatar" className="w-24 h-24 rounded-full object-cover border" />
                                            <button onClick={removeAvatar} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center">
                                            <Upload className="w-6 h-6 text-slate-500" />
                                        </div>
                                    )}
                                    <label className="text-sm text-blue-600 cursor-pointer hover:underline">
                                        {uploading ? "Mengunggah..." : "Ganti Foto"}
                                        <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
                                    </label>
                                </div>

                                <div>
                                    <Label>Nama</Label>
                                    <Input value={editUser.name || ""} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditUser({ ...editUser, name: e.target.value })} />
                                </div>

                                <div>
                                    <Label>Telepon</Label>
                                    <Input value={editUser.phone || ""} onChange={(e: ChangeEvent<HTMLInputElement>) => setEditUser({ ...editUser, phone: e.target.value })} />
                                </div>

                                <div>
                                    <Label>Role</Label>
                                    <select value={editUser.role || "member"} onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditUser({ ...editUser, role: e.target.value })} className="border border-slate-300 rounded-md px-2 py-2 text-sm w-full">
                                        <option value="admin">Admin</option>
                                        <option value="kacab">Kacab</option>
                                        <option value="marketing">Marketer</option>
                                        <option value="member">Member</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between border-t pt-3">
                                    <Label className="font-medium">Status BH Aktif</Label>
                                    <Switch checked={editUser.bh_enabled} onChange={(v) => setEditUser({ ...editUser, bh_enabled: v })} />
                                </div>
                            </div>
                        )}

                        <DialogFooter className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setEditUser(null)}>Batal</Button>
                            <Button onClick={saveUser} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                {saving ? "Menyimpan..." : "Simpan Perubahan"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
