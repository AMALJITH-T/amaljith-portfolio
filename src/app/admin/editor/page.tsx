"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { drafts as initialDrafts } from "@/lib/data";
import { Draft, SuggestionResult, Tag } from "@/lib/types";
import { BrainCircuit, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

const availableTags: Tag[] = [
    "AI", "ML", "Chess", "Geometry", "Nanobots", "Research", "Open Source",
];

// ─── Suggestion Card ──────────────────────────────────────────────────────────
function SuggestionCard({ s }: { s: SuggestionResult }) {
    const isWarning = s.type === "warning";
    const isSuccess = s.type === "success";

    const Icon = isWarning ? AlertTriangle : isSuccess ? CheckCircle2 : Info;
    const iconColor = isWarning
        ? "text-[var(--accent-gold)]"
        : isSuccess
            ? "text-emerald-500"
            : "text-[var(--text-dim)]";

    return (
        <div
            className={`flex gap-3 p-4 rounded-sm border ${isWarning
                    ? "border-[rgba(212,175,55,0.25)] bg-[rgba(212,175,55,0.04)]"
                    : isSuccess
                        ? "border-[rgba(52,211,153,0.15)] bg-[rgba(52,211,153,0.03)]"
                        : "border-[var(--border)] bg-transparent"
                }`}
        >
            <Icon size={12} strokeWidth={1.5} className={`${iconColor} flex-shrink-0 mt-0.5`} />
            <p className="font-sans text-[0.74rem] text-[var(--text-muted)] leading-relaxed">
                {s.message}
            </p>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EditorPage() {
    const [draft, setDraft] = useState<Pick<Draft, "title" | "content" | "tags">>({
        title: initialDrafts[0]?.title ?? "",
        content: initialDrafts[0]?.content ?? "",
        tags: initialDrafts[0]?.tags ?? [],
    });
    const [suggestions, setSuggestions] = useState<SuggestionResult[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [status, setStatus] = useState<"draft" | "ready">("draft");

    const wordCount = draft.content.trim()
        ? draft.content.trim().split(/\s+/).length
        : 0;

    // Debounced ML analysis
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!draft.content.trim()) {
                setSuggestions([]);
                return;
            }
            setAnalyzing(true);
            try {
                const res = await fetch("/api/suggestions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(draft),
                });
                const data = await res.json();
                setSuggestions(data.suggestions ?? []);
            } finally {
                setAnalyzing(false);
            }
        }, 1200);
        return () => clearTimeout(timer);
    }, [draft]);

    const toggleTag = (tag: Tag) => {
        setDraft((d) => ({
            ...d,
            tags: d.tags.includes(tag)
                ? d.tags.filter((t) => t !== tag)
                : [...d.tags, tag],
        }));
    };

    return (
        <AdminLayout>
            {/* ── Full-height writing layout ───────────────────────────────── */}
            <div className="flex h-screen overflow-hidden">

                {/* ── Writing Column ──────────────────────────────────────── */}
                <div className="flex-1 flex flex-col overflow-auto"
                    style={{ background: "var(--bg-secondary)" }}>

                    {/* Header band */}
                    <div
                        className="border-b border-[var(--border)] px-10 py-5 flex-shrink-0"
                        style={{ background: "var(--bg-primary)" }}
                    >
                        <div className="flex items-center justify-between">
                            <p className="mono text-[0.65rem] tracking-[0.2em]">Editor</p>

                            {/* Metadata row */}
                            <div className="flex items-center gap-5">
                                <span className="mono text-[0.65rem] text-[var(--text-dim)]">
                                    {wordCount}{" "}
                                    <span className="tracking-widest uppercase">words</span>
                                </span>

                                {/* Status toggle */}
                                <button
                                    onClick={() =>
                                        setStatus((s) => (s === "draft" ? "ready" : "draft"))
                                    }
                                    className={`font-sans text-[0.6rem] tracking-widest uppercase px-2.5 py-1 border rounded-sm transition-all duration-400 ${status === "ready"
                                            ? "border-[rgba(212,175,55,0.4)] text-[var(--accent-gold)] bg-[rgba(212,175,55,0.06)]"
                                            : "border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--text-dim)]"
                                        }`}
                                >
                                    {status}
                                </button>

                                {/* Tags inline */}
                                <div className="flex items-center gap-1.5">
                                    {availableTags.map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`font-sans text-[0.58rem] tracking-widest uppercase px-2 py-1 border rounded-[2px] transition-all duration-300 ${draft.tags.includes(tag)
                                                    ? "border-[rgba(212,175,55,0.5)] text-[var(--accent-gold)] bg-[rgba(212,175,55,0.06)]"
                                                    : "border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--text-dim)]"
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Writing surface — centered, constrained column */}
                    <div className="flex-1 flex justify-center overflow-auto py-12 px-6">
                        <div className="w-full max-w-[65ch] flex flex-col gap-6">

                            {/* Serif Title */}
                            <input
                                type="text"
                                placeholder="Draft title…"
                                value={draft.title}
                                onChange={(e) =>
                                    setDraft((d) => ({ ...d, title: e.target.value }))
                                }
                                className="w-full bg-transparent border-b border-[var(--border)] pb-4 font-serif text-[2rem] font-[300] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors duration-400 placeholder:text-[var(--text-dim)]"
                            />

                            {/* Body textarea on slightly elevated surface */}
                            <div
                                className="flex-1 border border-[var(--border)] rounded-sm overflow-hidden"
                                style={{ background: "var(--bg-card)" }}
                            >
                                <textarea
                                    placeholder="Start writing. Let ideas unfold…"
                                    value={draft.content}
                                    onChange={(e) =>
                                        setDraft((d) => ({ ...d, content: e.target.value }))
                                    }
                                    className="w-full h-full min-h-[520px] bg-transparent px-6 py-5 font-sans text-[0.92rem] text-[var(--text-muted)] leading-[1.85] outline-none resize-none placeholder:text-[var(--text-dim)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Analysis Sidebar ─────────────────────────────────────── */}
                <aside
                    className="w-72 flex-shrink-0 flex flex-col border-l border-[var(--border)] overflow-auto"
                    style={{ background: "var(--bg-primary)" }}
                >
                    {/* Sidebar header */}
                    <div className="border-b border-[var(--border)] px-6 py-5 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2.5">
                            <BrainCircuit size={13} strokeWidth={1.3} className="text-[var(--accent-gold)]" />
                            <p className="font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-muted)]">
                                Analysis Assistant
                            </p>
                        </div>
                        {analyzing && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] animate-pulse" />
                        )}
                    </div>

                    {/* Suggestions */}
                    <div className="flex-1 px-5 py-5 flex flex-col gap-2.5 overflow-auto">
                        {suggestions.length === 0 && !analyzing && (
                            <div className="flex flex-col gap-2 mt-2">
                                <p className="font-sans text-[0.75rem] text-[var(--text-dim)] leading-relaxed">
                                    Begin writing to activate contextual analysis.
                                </p>
                                <div className="mt-4 h-px bg-[var(--border)]" />
                                <p className="font-sans text-[0.67rem] text-[var(--text-dim)] leading-relaxed mt-3">
                                    The assistant evaluates <span className="text-[var(--text-muted)]">structure</span>,{" "}
                                    <span className="text-[var(--text-muted)]">depth</span>, and{" "}
                                    <span className="text-[var(--text-muted)]">completeness</span> in real time.
                                </p>
                            </div>
                        )}
                        {analyzing && suggestions.length === 0 && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="w-1 h-1 rounded-full bg-[var(--accent-gold)] animate-pulse" />
                                <p className="font-sans text-[0.72rem] text-[var(--text-dim)]">Analysing…</p>
                            </div>
                        )}
                        {suggestions.map((s, i) => (
                            <SuggestionCard key={i} s={s} />
                        ))}
                    </div>

                    {/* Sidebar footer: word target */}
                    <div className="border-t border-[var(--border)] px-6 py-4 flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-sans text-[0.6rem] tracking-widest uppercase text-[var(--text-dim)]">
                                Word Target
                            </p>
                            <p className="mono text-[0.7rem] text-[var(--text-muted)]">
                                {wordCount} / 500
                            </p>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-px bg-[var(--border)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--accent-gold)] transition-all duration-700 ease-out"
                                style={{ width: `${Math.min((wordCount / 500) * 100, 100)}%`, opacity: 0.7 }}
                            />
                        </div>
                    </div>
                </aside>
            </div>
        </AdminLayout>
    );
}
