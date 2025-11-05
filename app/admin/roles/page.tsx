"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ShieldCheck, Plus, Trash2, Save, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
// Local fallback Dialog components (used when "@/components/ui/Dialog" is unavailable)
type DialogProps = {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    // Basic behavior: render children when open is true.
    // Call onOpenChange(false) if user clicks overlay (optional).
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/40"
                onClick={() => onOpenChange && onOpenChange(false)}
            />
            <div className="relative z-10 max-w-2xl w-full mx-4">
                {children}
            </div>
        </div>
    );
}

export function DialogContent({ children }: { children?: React.ReactNode }) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {children}
        </div>
    );
}

export function DialogHeader({ children }: { children?: React.ReactNode }) {
    return <div className="mb-4">{children}</div>;
}

export function DialogTitle({ children }: { children?: React.ReactNode }) {
    return <h3 className="text-lg font-semibold text-slate-800">{children}</h3>;
}

export function DialogFooter(props: React.HTMLAttributes<HTMLDivElement>) {
    const { children, className, ...rest } = props;
    return (
        <div {...rest} className={"mt-6 flex justify-end gap-2 " + (className || "")}>
            {children}
        </div>
    );
}

function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
    const { children, className, ...rest } = props;
    return (
        <label
            {...rest}
            className={
                "block text-sm font-medium text-slate-700 " +
                (className || "")
            }
        >
            {children}
        </label>
    );
}

/**
 * Local Input replacement for missing "@/components/ui/Input".
 * Uses native <input> and forwards standard input props.
 */
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={
                "w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 " +
                (props.className || "")
            }
        />
    );
}
import { toast } from "sonner";

type Role = {
    id: string;
    name: string;
    description: string | null;
};

type Permission = {
    id: string;
    role_id: string;
    permission: string;
    allowed: boolean;
};

const AVAILABLE_PERMISSIONS = [
    { key: "can_view_dashboard", label: "Lihat Dashboard" },
    { key: "can_edit_user", label: "Edit User" },
    { key: "can_manage_qris", label: "Kelola QRIS" },
    { key: "can_view_finance", label: "Akses Keuangan" },
    { key: "can_manage_roles", label: "Kelola Role" },
];

export default function RoleManagementPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newRole, setNewRole] = useState({ name: "", description: "" });
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const { data: rolesData } = await supabase.from("roles").select("*").order("created_at", { ascending: true });
        const { data: permData } = await supabase.from("role_permissions").select("*");
        setRoles(rolesData || []);
        setPermissions(permData || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel("roles_admin")
            .on("postgres_changes", { event: "*", schema: "public", table: "roles" }, fetchData)
            .on("postgres_changes", { event: "*", schema: "public", table: "role_permissions" }, fetchData);

        void channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addRole = async () => {
        if (!newRole.name.trim()) return toast.error("Nama role tidak boleh kosong");
        setSaving(true);
        const { error } = await supabase.from("roles").insert({
            name: newRole.name.trim(),
            description: newRole.description.trim(),
        });
        setSaving(false);
        if (error) toast.error("Gagal menambahkan role");
        else {
            toast.success("Role baru berhasil ditambahkan 🎉");
            setAdding(false);
            setNewRole({ name: "", description: "" });
            fetchData();
        }
    };

    const deleteRole = async (roleId: string) => {
        if (!confirm("Yakin ingin menghapus role ini?")) return;
        const { error } = await supabase.from("roles").delete().eq("id", roleId);
        if (error) toast.error("Gagal menghapus role");
        else toast.success("Role berhasil dihapus 🗑️");
        fetchData();
    };

    const togglePermission = async (roleId: string, permKey: string, current: boolean) => {
        const existing = permissions.find(
            (p) => p.role_id === roleId && p.permission === permKey
        );
        let error;
        if (existing) {
            const res = await supabase
                .from("role_permissions")
                .update({ allowed: !current })
                .eq("id", existing.id);
            error = res.error;
        } else {
            const res = await supabase
                .from("role_permissions")
                .insert({ role_id: roleId, permission: permKey, allowed: true });
            error = res.error;
        }

        if (error) toast.error("Gagal update permission");
        else toast.success("Permission diperbarui ✅");
        fetchData();
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-100 via-white to-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-slate-700" />
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                            Role & Permission Management
                        </h1>
                    </div>
                    <Button onClick={() => setAdding(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Tambah Role
                    </Button>
                </div>

                {/* Table */}
                <Card className="border border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Daftar Role & Hak Akses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-16 text-slate-500">
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memuat data...
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm border-separate border-spacing-y-2">
                                    <thead>
                                        <tr className="text-left text-slate-600 bg-slate-50 border-b">
                                            <th className="px-3 py-2">Role</th>
                                            {AVAILABLE_PERMISSIONS.map((perm) => (
                                                <th key={perm.key} className="px-3 py-2 text-center">
                                                    {perm.label}
                                                </th>
                                            ))}
                                            <th className="px-3 py-2 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roles.map((r, i) => (
                                            <motion.tr
                                                key={r.id}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="bg-white shadow-sm hover:shadow-md transition rounded-xl"
                                            >
                                                <td className="px-3 py-2 font-medium text-slate-700 rounded-l-xl">
                                                    {r.name}
                                                    <p className="text-xs text-slate-500">{r.description}</p>
                                                </td>
                                                {AVAILABLE_PERMISSIONS.map((perm) => {
                                                    const p = permissions.find(
                                                        (x) => x.role_id === r.id && x.permission === perm.key
                                                    );
                                                    return (
                                                        <td key={perm.key} className="text-center">
                                                            <Switch
                                                                checked={!!p?.allowed}
                                                                onChange={() =>
                                                                    togglePermission(r.id, perm.key, !!p?.allowed)
                                                                }
                                                            />
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-3 py-2 text-center rounded-r-xl">
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => deleteRole(r.id)}
                                                        className="bg-red-600 hover:bg-red-700 text-xs"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dialog Tambah Role */}
                <Dialog open={adding} onOpenChange={setAdding}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Role Baru</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Nama Role</Label>
                                <Input
                                    placeholder="mis. auditor"
                                    value={newRole.name}
                                    onChange={(e) =>
                                        setNewRole({ ...newRole, name: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Deskripsi</Label>
                                <Input
                                    placeholder="keterangan singkat"
                                    value={newRole.description}
                                    onChange={(e) =>
                                        setNewRole({ ...newRole, description: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setAdding(false)}>
                                Batal
                            </Button>
                            <Button
                                onClick={addRole}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {saving ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
