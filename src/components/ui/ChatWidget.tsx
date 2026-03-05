"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";

interface Msg {
    role: "user" | "assistant";
    content: string;
}

/**
 * ChatWidget
 * ──────────
 * Persistent floating chatbot. Injects on all public pages via PublicShell.
 * Hidden on /admin/* routes. Uses /api/chat (retrieval-based, no LLM API cost).
 * Respects prefers-reduced-motion for the open/close animation.
 */
export function ChatWidget() {
    // ── All hooks declared unconditionally — never call hooks after a conditional return ──
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([
        {
            role: "assistant",
            content: "Hi — I can help you navigate the research, projects, and ideas here. What are you curious about?",
        },
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new message — must be above any early return
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Derived value — not a hook, safe anywhere after hooks
    const isAdmin = pathname.startsWith("/admin");

    // Render nothing on admin routes (after all hooks are declared)
    if (isAdmin) return null;

    const send = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setInput("");
        const userMsg: Msg = { role: "user", content: text };
        setMessages((m) => [...m, userMsg]);
        setSending(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMsg] }),
            });
            const data = await res.json();
            setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "…" }]);
        } catch {
            setMessages((m) => [...m, { role: "assistant", content: "Something went quiet. Try again?" }]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Chat panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="w-[310px] flex flex-col border border-[var(--border)] shadow-2xl overflow-hidden"
                        style={{ background: "#090909", height: "420px" }}
                        aria-label="Research assistant chat"
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0"
                            style={{ background: "#0d0d0d" }}
                        >
                            <div>
                                <p className="font-sans text-[0.7rem] tracking-widest uppercase text-[var(--accent-gold)]">
                                    Research Assistant
                                </p>
                                <p className="font-sans text-[0.6rem] text-[var(--text-dim)] mt-0.5">
                                    Intelligent · Curious · Calm
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
                                aria-label="Close chat"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-3 py-2.5 text-[0.82rem] font-sans leading-relaxed ${m.role === "user"
                                            ? "bg-[rgba(201,166,70,0.1)] text-[var(--text-primary)] border border-[rgba(201,166,70,0.15)]"
                                            : "bg-[rgba(255,255,255,0.03)] text-[var(--text-muted)] border border-[var(--border)]"
                                            }`}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {sending && (
                                <div className="flex justify-start">
                                    <div className="bg-[rgba(255,255,255,0.03)] border border-[var(--border)] px-3 py-2.5">
                                        <div className="flex gap-1 items-center h-4">
                                            {[0, 1, 2].map((i) => (
                                                <span
                                                    key={i}
                                                    className="w-1 h-1 rounded-full bg-[var(--accent-gold)] opacity-60"
                                                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div
                            className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border)] flex-shrink-0"
                            style={{ background: "#0d0d0d" }}
                        >
                            <input
                                type="text"
                                placeholder="Ask anything…"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && send()}
                                className="flex-1 bg-transparent font-sans text-[0.82rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-dim)]"
                                aria-label="Chat input"
                            />
                            <button
                                onClick={send}
                                disabled={sending || !input.trim()}
                                className="text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors disabled:opacity-30"
                                aria-label="Send message"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger button */}
            <motion.button
                onClick={() => setOpen((o) => !o)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 flex items-center justify-center border border-[var(--border)] shadow-2xl transition-colors duration-300 hover:border-[var(--accent-gold)]"
                style={{ background: "#0d0d0d" }}
                aria-label={open ? "Close research assistant" : "Open research assistant"}
            >
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.span key="x" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}>
                            <X size={16} className="text-[var(--text-muted)]" />
                        </motion.span>
                    ) : (
                        <motion.span key="msg" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}>
                            <MessageCircle size={16} className="text-[var(--accent-gold)]" />
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
