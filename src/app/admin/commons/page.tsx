"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Thread, CommonsStatus } from "@/lib/types";
import { Pin, Lock, Archive, Trash2, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function adminAction(id: string, action: string) {
    return fetch(`/api/commons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin": "1" },
        body: JSON.stringify({ action }),
    });
}

function adminDelete(id: string) {
    return fetch(`/api/commons/${id}`, {
        method: "DELETE",
        headers: { "x-admin": "1" },
    });
}

// ── Analytics ─────────────────────────────────────────────────────────────────
function threadHealthScore(t: Thread): number {
    // Engagement (0–40 pts): up to 8 replies = 40 pts
    const engagement = Math.min(t.replies.length * 5, 40);
    // Word depth (0–30 pts): 50+ words in content = 30 pts
    const wordCount = t.content.split(/\s+/).filter(Boolean).length;
    const depth = Math.min(Math.floor((wordCount / 50) * 30), 30);
    // Penalty: flagged −20, locked −10
    const penalty = (t.flagged ? 20 : 0) + (t.locked ? 10 : 0);
    return Math.max(0, engagement + depth - penalty);
}

function healthColor(score: number): string {
    if (score >= 60) return "bg-emerald-500";
    if (score >= 30) return "bg-amber-500";
    return "bg-red-500";
}

function computeAnalytics(threads: Thread[]) {
    const all = [...threads];
    const totalThreads = all.length;
    const totalReplies = all.reduce((s, t) => s + t.replies.length, 0);
    const flaggedCount = all.filter((t) => t.flagged || t.replies.some((r) => r.flagged)).length;
    const lockedCount = all.filter((t) => t.locked).length;
    const archivedCount = all.filter((t) => t.archived).length;

    const stopwords = new Set(["the", "a", "an", "and", "or", "is", "in", "of", "to", "for", "on", "how", "why", "what", "that", "this", "it", "at", "be", "can", "by"]);
    const wordMap = new Map<string, number>();
    all.forEach((t) => {
        (t.title + " " + t.content)
            .toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/)
            .filter((w) => w.length > 3 && !stopwords.has(w))
            .forEach((w) => wordMap.set(w, (wordMap.get(w) ?? 0) + 1));
    });
    const topKeywords = [...wordMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word]) => word);

    return { totalThreads, totalReplies, flaggedCount, lockedCount, archivedCount, topKeywords };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminCommonsPage() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [status, setStatus] = useState<CommonsStatus>("active");
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"active" | "archived" | "flagged">("active");
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            // Fetch all threads including archived — we need to hit status endpoint for hold state
            const [commonsRes, statusRes] = await Promise.all([
                fetch("/api/commons", { headers: { "x-admin": "1" } }),
                fetch("/api/commons/status"),
            ]);
            const commonsData = await commonsRes.json();
            const statusData = await statusRes.json();
            // /api/commons returns non-archived only — for admin we need all
            // We'll show archived ones if the view is "archived" using local state
            setThreads(commonsData.threads ?? []);
            setStatus(statusData.status ?? "active");
        } finally {
            setLoading(false);
        }
    };

    // Also fetch archived threads separately for admin view
    useEffect(() => {
        fetchAll();
    }, []);

    const cycleStatus = async () => {
        const cycle: Record<CommonsStatus, CommonsStatus> = {
            active: "hold",
            hold: "locked",
            locked: "active",
        };
        const next = cycle[status];
        const res = await fetch("/api/commons/status", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-admin": "1" },
            body: JSON.stringify({ status: next }),
        });
        if (res.ok) {
            setStatus(next);
            showToast("success", `Commons set to ${next.toUpperCase()}.`);
        } else {
            showToast("error", "Failed to update status.");
        }
    };

    const handleAction = async (id: string, action: string) => {
        const res = await adminAction(id, action);
        if (res.ok) {
            showToast("success", `Thread ${action}d.`);
            fetchAll();
        } else {
            showToast("error", `Action failed.`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Permanently delete this thread? This cannot be undone.")) return;
        const res = await adminDelete(id);
        if (res.ok) {
            showToast("success", "Thread deleted.");
            fetchAll();
        } else {
            showToast("error", "Delete failed.");
        }
    };

    const analytics = computeAnalytics(threads);

    const displayed = threads.filter((t) => {
        if (view === "archived") return t.archived;
        if (view === "flagged") return t.flagged && !t.archived;
        return !t.archived;
    });

    return (
        <AdminLayout>
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-8 right-8 z-50">
                    <div className="flex items-center gap-3 border border-[var(--border)] bg-[#050505] shadow-2xl px-6 py-4">
                        <span className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-[var(--accent-gold)]" : "bg-red-800"}`} />
                        <p className="font-sans text-[0.8rem] text-[var(--text-primary)]">{toast.msg}</p>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="border-b border-[var(--border)] px-10 py-6 flex items-center justify-between" style={{ background: "var(--bg-secondary)" }}>
                <div>
                    <p className="mono text-[0.65rem] tracking-[0.2em] mb-1">Commons</p>
                    <h1 className="font-serif text-[1.6rem] font-[300] text-[var(--text-primary)] leading-none">
                        Discussion Control
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={fetchAll} className="text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors">
                        <RefreshCw size={14} />
                    </button>
                    {/* 3-State Status Toggle */}
                    <button
                        onClick={cycleStatus}
                        title="Click to cycle: ACTIVE → HOLD → LOCKED"
                        className={`flex items-center gap-2 font-sans text-[0.7rem] tracking-widest uppercase px-5 py-2 border transition-all duration-400 ${status === "active" ? "border-emerald-700 text-emerald-400 hover:bg-emerald-900/20"
                            : status === "hold" ? "border-amber-700 text-amber-400 hover:bg-amber-900/20"
                                : "border-red-800 text-red-400 hover:bg-red-900/20"
                            }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-emerald-400"
                            : status === "hold" ? "bg-amber-400"
                                : "bg-red-400"
                            }`} />
                        Commons: {status.toUpperCase()}
                    </button>
                </div>
            </div>

            <div className="px-10 py-10 space-y-10 max-w-5xl">

                {/* Analytics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {[
                        { label: "Threads", value: analytics.totalThreads },
                        { label: "Replies", value: analytics.totalReplies },
                        { label: "Flagged", value: analytics.flaggedCount },
                        { label: "Locked", value: analytics.lockedCount },
                        { label: "Archived", value: analytics.archivedCount },
                    ].map(({ label, value }) => (
                        <div key={label} className="border border-[var(--border)] p-4" style={{ background: "var(--bg-card)" }}>
                            <p className="font-serif text-[2rem] font-[300] text-[var(--text-primary)] leading-none">{value}</p>
                            <p className="font-sans text-[0.6rem] tracking-widest uppercase text-[var(--text-dim)] mt-1">{label}</p>
                        </div>
                    ))}
                </div>

                {analytics.topKeywords.length > 0 && (
                    <div>
                        <p className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)] mb-3">Top Keywords</p>
                        <div className="flex flex-wrap gap-2">
                            {analytics.topKeywords.map((kw) => (
                                <span key={kw} className="font-sans text-[0.7rem] tracking-wide px-3 py-1 border border-[var(--border)] text-[var(--text-muted)]">
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* View tabs */}
                <div className="flex gap-6 border-b border-[var(--border)] pb-px">
                    {(["active", "archived", "flagged"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`font-sans text-[0.7rem] tracking-widest uppercase pb-3 transition-colors duration-300 ${view === v
                                ? "text-[var(--accent-gold)] border-b border-[var(--accent-gold)] -mb-px"
                                : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
                                }`}
                        >
                            {v}
                        </button>
                    ))}
                </div>

                {/* Thread List */}
                {loading ? (
                    <p className="font-sans text-[0.8rem] text-[var(--text-dim)] mono tracking-widest">Loading…</p>
                ) : displayed.length === 0 ? (
                    <p className="font-sans text-[0.85rem] text-[var(--text-dim)]">No threads in this view.</p>
                ) : (
                    <div className="space-y-3">
                        {displayed.map((t) => (
                            <div
                                key={t.id}
                                className="border border-[var(--border)] p-5 grid grid-cols-[1fr_auto] gap-4 items-start"
                                style={{ background: "var(--bg-card)" }}
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                                        {t.pinned && <span className="font-sans text-[0.55rem] tracking-widest uppercase text-[var(--accent-gold)]">Pinned</span>}
                                        {t.locked && <span className="font-sans text-[0.55rem] tracking-widest uppercase text-amber-400">Locked</span>}
                                        {t.flagged && <span className="flex items-center gap-1 font-sans text-[0.55rem] tracking-widest uppercase text-red-400"><AlertTriangle size={9} />Flagged</span>}
                                        {t.archived && <span className="font-sans text-[0.55rem] tracking-widest uppercase text-[var(--text-dim)]">Archived</span>}
                                    </div>
                                    <p className="font-serif text-[1rem] font-[300] text-[var(--text-primary)]">{t.title}</p>
                                    <p className="font-sans text-[0.8rem] text-[var(--text-muted)] mt-1 line-clamp-2">{t.content}</p>
                                    <p className="font-sans text-[0.65rem] text-[var(--text-dim)] mt-2">
                                        {t.author} · {relativeTime(t.timestamp)} · {t.replies.length} repl{t.replies.length === 1 ? "y" : "ies"}
                                    </p>
                                    {/* Thread Health Score */}
                                    {(() => {
                                        const score = threadHealthScore(t);
                                        return (
                                            <div className="mt-3 flex items-center gap-3">
                                                <p className="font-sans text-[0.6rem] tracking-widest uppercase text-[var(--text-dim)]">Health</p>
                                                <div className="flex-1 h-px bg-[var(--border)] rounded-full max-w-[80px] relative overflow-hidden">
                                                    <div
                                                        className={`absolute left-0 top-0 h-full rounded-full ${healthColor(score)}`}
                                                        style={{ width: `${score}%` }}
                                                    />
                                                </div>
                                                <span className="font-sans text-[0.6rem] text-[var(--text-dim)] mono">{score}</span>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Admin actions */}
                                <div className="flex items-center gap-3 flex-wrap justify-end">
                                    <button onClick={() => handleAction(t.id, t.pinned ? "unpin" : "pin")}
                                        title={t.pinned ? "Unpin" : "Pin"}
                                        className={`transition-colors duration-300 ${t.pinned ? "text-[var(--accent-gold)]" : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"}`}>
                                        <Pin size={14} />
                                    </button>
                                    <button onClick={() => handleAction(t.id, t.locked ? "unlock" : "lock")}
                                        title={t.locked ? "Unlock" : "Lock"}
                                        className={`transition-colors duration-300 ${t.locked ? "text-amber-400" : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"}`}>
                                        <Lock size={14} />
                                    </button>
                                    <button onClick={() => handleAction(t.id, t.archived ? "unarchive" : "archive")}
                                        title={t.archived ? "Restore" : "Archive"}
                                        className="text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors duration-300">
                                        <Archive size={14} />
                                    </button>
                                    {t.flagged && (
                                        <button onClick={() => handleAction(t.id, "unflag")}
                                            title="Clear flag"
                                            className="text-red-400 hover:text-red-300 transition-colors duration-300">
                                            <CheckCircle size={14} />
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(t.id)}
                                        title="Delete permanently"
                                        className="text-[var(--text-dim)] hover:text-red-400 transition-colors duration-300">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
