"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundGeometry } from "@/components/ui/BackgroundGeometry";
import { Thread } from "@/lib/types";
import { MessageSquare, Send, ChevronDown, Lock } from "lucide-react";

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Reply Form ────────────────────────────────────────────────────────────────
function ReplyForm({ threadId, onDone }: { threadId: string; onDone: () => void }) {
    const [content, setContent] = useState("");
    const [author, setAuthor] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "error" | "success">("idle");
    const [errMsg, setErrMsg] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        setStatus("sending");
        const res = await fetch(`/api/commons/${threadId}/reply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, author }),
        });
        const data = await res.json();
        if (!res.ok) {
            setStatus("error");
            setErrMsg(data.error || "Something went wrong.");
        } else {
            setStatus("success");
            setContent("");
            onDone();
        }
    };

    return (
        <form onSubmit={submit} className="mt-5 space-y-3">
            <input
                type="text"
                placeholder="Name (optional)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={60}
                className="w-full bg-transparent border-b border-[var(--border)] py-2 font-sans text-[0.85rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors duration-400 placeholder:text-[var(--text-dim)]"
            />
            <textarea
                rows={3}
                placeholder="Your reply…"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1500}
                className="w-full bg-transparent border-b border-[var(--border)] py-2 font-sans text-[0.85rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors duration-400 resize-none placeholder:text-[var(--text-dim)]"
            />
            {status === "error" && (
                <p className="font-sans text-[0.75rem] text-red-400">{errMsg}</p>
            )}
            {status === "success" && (
                <p className="font-sans text-[0.75rem] text-emerald-400">Reply posted.</p>
            )}
            <button
                type="submit"
                disabled={status === "sending"}
                className="font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-primary)] border border-[var(--border)] px-5 py-2 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors duration-400 disabled:opacity-40"
            >
                {status === "sending" ? "Posting…" : "Post Reply"}
            </button>
        </form>
    );
}

// ── Thread Card ───────────────────────────────────────────────────────────────
function ThreadCard({ thread, onReply }: { thread: Thread; onReply: (id: string) => void }) {
    const [open, setOpen] = useState(false);
    const [replyOpen, setReplyOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-[var(--border)] p-6 relative"
        >
            {thread.pinned && (
                <span className="absolute top-0 left-0 bg-[var(--accent-gold)] text-black font-sans text-[0.55rem] tracking-widest uppercase px-2 py-0.5">
                    Pinned
                </span>
            )}
            <div className={thread.pinned ? "mt-3" : ""}>
                <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-serif text-[1.15rem] font-[300] text-[var(--text-primary)] leading-snug">
                        {thread.title}
                    </h3>
                    {thread.locked && (
                        <Lock size={12} className="text-[var(--text-dim)] flex-shrink-0 mt-1" />
                    )}
                </div>
                <p className="font-sans text-[0.88rem] text-[var(--text-muted)] leading-relaxed mb-4">
                    {thread.content}
                </p>
                <div className="flex items-center gap-4">
                    <span className="font-sans text-[0.7rem] text-[var(--text-dim)]">
                        {thread.author}
                    </span>
                    <span className="text-[var(--border)]">·</span>
                    <span className="font-sans text-[0.7rem] text-[var(--text-dim)]">
                        {relativeTime(thread.timestamp)}
                    </span>
                    {thread.replies.length > 0 && (
                        <>
                            <span className="text-[var(--border)]">·</span>
                            <button
                                onClick={() => setOpen((o) => !o)}
                                className="flex items-center gap-1.5 font-sans text-[0.7rem] text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-300"
                            >
                                <MessageSquare size={11} />
                                {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}
                                <ChevronDown size={10} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                            </button>
                        </>
                    )}
                </div>

                {/* Replies */}
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-5 space-y-4 pl-4 border-l border-[var(--border)]"
                        >
                            {thread.replies.map((r) => (
                                <div key={r.id} className="space-y-1">
                                    <p className="font-sans text-[0.85rem] text-[var(--text-muted)] leading-relaxed">
                                        {r.content}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <span className="font-sans text-[0.65rem] text-[var(--text-dim)]">{r.author}</span>
                                        <span className="text-[var(--border)]">·</span>
                                        <span className="font-sans text-[0.65rem] text-[var(--text-dim)]">{relativeTime(r.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Reply button / form */}
                {!thread.locked && (
                    <div className="mt-4">
                        <button
                            onClick={() => setReplyOpen((o) => !o)}
                            className="font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-300"
                        >
                            {replyOpen ? "Cancel" : "Reply"}
                        </button>
                        <AnimatePresence>
                            {replyOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <ReplyForm
                                        threadId={thread.id}
                                        onDone={() => {
                                            setReplyOpen(false);
                                            onReply(thread.id);
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
                {thread.locked && (
                    <p className="mt-3 font-sans text-[0.7rem] text-[var(--text-dim)] italic">
                        This thread is locked.
                    </p>
                )}
            </div>
        </motion.div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CommonsPage() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [commonsStatus, setCommonsStatus] = useState<"active" | "hold" | "locked">("active");
    const [loading, setLoading] = useState(true);

    // New thread form
    const [form, setForm] = useState({ title: "", content: "", author: "" });
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState("");
    const [showForm, setShowForm] = useState(false);

    const fetchThreads = async () => {
        const res = await fetch("/api/commons");
        const data = await res.json();
        setThreads(data.threads ?? []);
        setCommonsStatus(data.status ?? "active");
        setLoading(false);
    };

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchThreads().then(() => {
            if (!active) return;
            // logic is already handled in fetchThreads safely
        });
        return () => { active = false; };
    }, []);

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        setPosting(true);
        setPostError("");
        const res = await fetch("/api/commons", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
            setPostError(data.error || "Post failed.");
        } else {
            setForm({ title: "", content: "", author: "" });
            setShowForm(false);
            fetchThreads();
        }
        setPosting(false);
    };

    return (
        <>
            <BackgroundGeometry />
            <main className="relative z-10 min-h-screen pt-24">
                <section className="section">

                    {/* Header */}
                    <div className="mb-14 max-w-2xl">
                        <p className="mono tracking-[0.2em] mb-6">Commons / Discussion</p>
                        <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-[300] leading-[1.1] text-[var(--text-primary)] mb-5">
                            The Research Commons
                        </h1>
                        <p className="font-sans text-[var(--text-muted)] text-[1rem] leading-relaxed">
                            An open space for curious minds. Post questions, observations, or
                            threads worth thinking about. Curiosity-driven conversations only.
                        </p>
                        <div className="gold-line mt-8" />
                    </div>

                    {commonsStatus === "hold" ? (
                        <div className="border border-[var(--border)] p-8 max-w-lg">
                            <p className="font-serif text-[1.2rem] text-[var(--text-muted)] font-[300]">
                                Discussion is temporarily paused.
                            </p>
                            <p className="font-sans text-[0.85rem] text-[var(--text-dim)] mt-2">
                                Check back soon.
                            </p>
                        </div>
                    ) : commonsStatus === "locked" ? (
                        /* LOCKED — threads visible, submissions disabled */
                        <div className="max-w-3xl">
                            <div className="mb-8 border border-[var(--border)] px-5 py-3 flex items-center gap-3">
                                <Lock size={11} className="text-[var(--text-dim)]" />
                                <p className="font-sans text-[0.75rem] text-[var(--text-dim)] tracking-wide">
                                    Read-only mode — new threads and replies are currently disabled.
                                </p>
                            </div>
                            {loading ? (
                                <p className="font-sans text-[0.8rem] text-[var(--text-dim)] mono tracking-widest">Loading…</p>
                            ) : threads.length === 0 ? (
                                <p className="font-sans text-[0.88rem] text-[var(--text-dim)]">No threads yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {threads.map((t) => (
                                        <ThreadCard key={t.id} thread={t} onReply={fetchThreads} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-3xl">

                            {/* Start thread toggle */}
                            <div className="mb-10">
                                <button
                                    onClick={() => setShowForm((s) => !s)}
                                    className="flex items-center gap-2 font-sans text-[0.78rem] tracking-widest uppercase text-[var(--text-primary)] border border-[var(--border)] px-7 py-3 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors duration-400"
                                >
                                    <Send size={13} />
                                    {showForm ? "Cancel" : "Start a Thread"}
                                </button>

                                <AnimatePresence>
                                    {showForm && (
                                        <motion.form
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            onSubmit={handlePost}
                                            className="mt-6 space-y-5 border border-[var(--border)] p-6"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Thread title"
                                                required
                                                maxLength={200}
                                                value={form.title}
                                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                                className="w-full bg-transparent border-b border-[var(--border)] pb-3 font-serif text-[1.1rem] font-[300] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors duration-400 placeholder:text-[var(--text-dim)]"
                                            />
                                            <textarea
                                                rows={5}
                                                placeholder="Your thoughts…"
                                                required
                                                maxLength={3000}
                                                value={form.content}
                                                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                                                className="w-full bg-transparent border-b border-[var(--border)] py-3 font-sans text-[0.9rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors duration-400 resize-none placeholder:text-[var(--text-dim)]"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Name (optional — defaults to Anonymous)"
                                                maxLength={60}
                                                value={form.author}
                                                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                                                className="w-full bg-transparent border-b border-[var(--border)] pb-3 font-sans text-[0.85rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors duration-400 placeholder:text-[var(--text-dim)]"
                                            />
                                            {postError && (
                                                <p className="font-sans text-[0.78rem] text-red-400">{postError}</p>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={posting}
                                                className="font-sans text-[0.78rem] tracking-widest uppercase text-[var(--text-primary)] border border-[var(--border)] px-7 py-3 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors duration-400 disabled:opacity-40"
                                            >
                                                {posting ? "Posting…" : "Post Thread"}
                                            </button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Thread list */}
                            {loading ? (
                                <p className="font-sans text-[0.8rem] text-[var(--text-dim)] mono tracking-widest">
                                    Loading…
                                </p>
                            ) : threads.length === 0 ? (
                                <div className="text-center py-16">
                                    <p className="font-serif text-[1.3rem] text-[var(--text-muted)] font-[300]">
                                        No threads yet.
                                    </p>
                                    <p className="font-sans text-[var(--text-dim)] text-[0.88rem] mt-2">
                                        Start the first conversation.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {threads.map((t) => (
                                        <ThreadCard
                                            key={t.id}
                                            thread={t}
                                            onReply={fetchThreads}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}
