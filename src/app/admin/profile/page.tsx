"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Profile } from "@/lib/types";
import { defaultProfile } from "@/lib/data";
import { Upload, Save, User, CheckCircle2, AlertTriangle } from "lucide-react";

// ─── Field Row ────────────────────────────────────────────────────────────────
function FieldRow({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="flex flex-col gap-2">
            <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder ?? label}
                className="bg-transparent border-b border-[var(--border)] pb-3 font-sans text-[0.9rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors duration-400 placeholder:text-[var(--text-dim)]"
            />
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProfileAdminPage() {
    const [profile, setProfile] = useState<Profile>(defaultProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Load profile on mount
    useEffect(() => {
        fetch("/api/profile")
            .then((r) => r.json())
            .then((data: Profile) => setProfile(data))
            .catch(() => { /* use default */ })
            .finally(() => setLoading(false));
    }, []);

    // Auto-dismiss toast
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    const showToast = (type: "success" | "error", msg: string) => setToast({ type, msg });

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            });
            if (!res.ok) throw new Error();
            showToast("success", "Profile saved.");
        } catch {
            showToast("error", "Save failed — try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/profile/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (data.url) {
                setProfile((p) => ({ ...p, portraitUrl: data.url }));
                showToast("success", "Portrait uploaded.");
            } else {
                showToast("error", data.error ?? "Upload failed.");
            }
        } catch {
            showToast("error", "Upload failed.");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    return (
        <AdminLayout>
            {/* ── Header band ──────────────────────────────────────────────── */}
            <div
                className="border-b border-[var(--border)] px-10 py-6 flex items-center justify-between flex-shrink-0"
                style={{ background: "var(--bg-secondary)" }}
            >
                <div>
                    <p className="mono text-[0.65rem] tracking-[0.2em] mb-1">Identity</p>
                    <h1 className="font-serif text-[1.6rem] font-[300] text-[var(--text-primary)] leading-none">
                        Profile Settings
                    </h1>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="flex items-center gap-2 font-sans text-[0.7rem] tracking-widest uppercase border border-[var(--border)] px-5 py-2.5 rounded-sm transition-all duration-400 disabled:opacity-40 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] text-[var(--text-dim)]"
                >
                    <Save size={11} strokeWidth={1.5} />
                    {saving ? "Saving…" : "Save"}
                </button>
            </div>

            {/* ── Toast ────────────────────────────────────────────────────── */}
            {toast && (
                <div
                    className={`mx-10 mt-5 flex items-center gap-3 px-4 py-3 rounded-sm border text-[0.75rem] font-sans ${toast.type === "success"
                            ? "border-[rgba(212,175,55,0.35)] text-[var(--accent-gold)] bg-[rgba(212,175,55,0.05)]"
                            : "border-[rgba(239,68,68,0.3)] text-red-400 bg-[rgba(239,68,68,0.04)]"
                        }`}
                >
                    {toast.type === "success"
                        ? <CheckCircle2 size={13} strokeWidth={1.5} />
                        : <AlertTriangle size={13} strokeWidth={1.5} />}
                    {toast.msg}
                </div>
            )}

            {/* ── Content ──────────────────────────────────────────────────── */}
            <div className="px-10 py-8 flex gap-14 items-start flex-wrap">

                {/* Portrait upload panel */}
                <div className="flex flex-col gap-5 items-center">
                    <div
                        className="relative w-[160px] h-[160px] rounded-full overflow-hidden"
                        style={{
                            outline: "1px solid rgba(212,175,55,0.3)",
                            outlineOffset: "3px",
                            boxShadow: "0 0 0 1px rgba(212,175,55,0.06)",
                        }}
                    >
                        {loading ? (
                            <div className="w-full h-full" style={{ background: "var(--bg-card)" }} />
                        ) : (
                            <Image
                                src={profile.portraitUrl || "/portrait.jpg"}
                                alt="Portrait preview"
                                fill
                                className="object-cover object-top"
                                unoptimized={profile.portraitUrl.startsWith("/uploads/")}
                                sizes="160px"
                            />
                        )}
                    </div>

                    {/* Upload trigger */}
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 font-sans text-[0.68rem] tracking-widest uppercase border border-[var(--border)] px-4 py-2 rounded-sm transition-all duration-400 disabled:opacity-40 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] text-[var(--text-dim)]"
                    >
                        <Upload size={11} strokeWidth={1.5} />
                        {uploading ? "Uploading…" : "Change Portrait"}
                    </button>

                    <p className="font-sans text-[0.6rem] text-[var(--text-dim)] text-center max-w-[160px]">
                        JPEG · PNG · WebP · AVIF<br />Max 4 MB
                    </p>
                </div>

                {/* Identity fields */}
                <div
                    className="flex-1 min-w-[280px] border border-[var(--border)] rounded-sm px-7 py-6 flex flex-col gap-6"
                    style={{ background: "var(--bg-card)" }}
                >
                    <div className="flex items-center gap-2.5 mb-1 pb-4 border-b border-[var(--border)]">
                        <User size={12} strokeWidth={1.3} className="text-[var(--accent-gold)]" />
                        <p className="font-sans text-[0.68rem] tracking-widest uppercase text-[var(--text-dim)]">
                            Identity Data
                        </p>
                    </div>

                    {loading ? (
                        <p className="font-sans text-[0.8rem] text-[var(--text-dim)]">Loading…</p>
                    ) : (
                        <>
                            <FieldRow
                                label="Name"
                                value={profile.name}
                                onChange={(v) => setProfile((p) => ({ ...p, name: v }))}
                                placeholder="Full Name"
                            />
                            <FieldRow
                                label="Role"
                                value={profile.role}
                                onChange={(v) => setProfile((p) => ({ ...p, role: v }))}
                                placeholder="AI / ML Researcher"
                            />
                            <FieldRow
                                label="Affiliation"
                                value={profile.affiliation}
                                onChange={(v) => setProfile((p) => ({ ...p, affiliation: v }))}
                                placeholder="Institution"
                            />
                            <FieldRow
                                label="Portrait URL"
                                value={profile.portraitUrl}
                                onChange={(v) => setProfile((p) => ({ ...p, portraitUrl: v }))}
                                placeholder="/portrait.jpg"
                            />
                        </>
                    )}

                    <p className="font-sans text-[0.62rem] text-[var(--text-dim)] mt-2 leading-relaxed">
                        Changes reflect on the Signal page after saving.
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
