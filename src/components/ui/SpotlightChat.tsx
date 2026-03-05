"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/lib/types";

interface SpotlightChatProps {
    initialGreeting?: string;
}

export function SpotlightChat({
    initialGreeting = "Ask me about my research, projects, or work.",
}: SpotlightChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: initialGreeting },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const send = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg: ChatMessage = { role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMsg] }),
            });
            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.reply },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Unable to respond right now." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Message thread */}
            <div className="space-y-4 min-h-[120px] mb-6">
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className={msg.role === "user" ? "text-right" : "text-left"}
                        >
                            <span
                                className={`inline-block text-[0.9rem] leading-relaxed font-sans ${msg.role === "user"
                                        ? "text-[var(--text-primary)]"
                                        : "text-[var(--text-muted)]"
                                    }`}
                            >
                                {msg.content}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-1.5 items-center"
                    >
                        {[0, 1, 2].map((i) => (
                            <motion.span
                                key={i}
                                className="w-1 h-1 rounded-full bg-[var(--accent-gold)] opacity-60"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </motion.div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input — Spotlight-style */}
            <div className="relative flex items-center border border-[var(--border)] bg-[var(--bg-card)] rounded-sm overflow-hidden focus-within:border-[var(--accent-gold)] transition-colors duration-600">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Ask about my work..."
                    className="flex-1 bg-transparent px-5 py-4 text-[var(--text-primary)] text-[0.9rem] font-sans placeholder:text-[var(--text-dim)] outline-none"
                />
                <button
                    onClick={send}
                    disabled={!input.trim() || loading}
                    className="px-5 py-4 text-[var(--accent-gold)] text-[0.75rem] tracking-widest uppercase font-sans opacity-60 hover:opacity-100 transition-opacity duration-400 disabled:opacity-20"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
