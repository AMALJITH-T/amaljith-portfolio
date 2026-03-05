"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { BackgroundGeometry } from "@/components/ui/BackgroundGeometry";

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push("/admin");
            } else {
                const data = await res.json();
                setError(data.error || "Authentication failed");
                setPassword("");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative z-10 min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden bg-[#050505]">
            <BackgroundGeometry />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,5,5,0.9)] via-[rgba(5,5,5,0.4)] to-transparent pointer-events-none" />

            <div className="relative w-full max-w-sm px-6">
                <div className="mb-12">
                    <Link
                        href="/"
                        className="font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-400 flex items-center gap-1.5"
                    >
                        <ArrowLeft size={11} strokeWidth={2} />
                        Return
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="font-serif text-[2.5rem] font-[300] text-[var(--text-primary)] leading-tight tracking-tight mb-2">
                        System Access
                    </h1>
                    <p className="mono text-[0.75rem] text-[var(--accent-gold)] tracking-[0.2em] uppercase opacity-70">
                        Authorization Required_
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <input
                            type="password"
                            placeholder="Enter Passcode..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="w-full bg-transparent border-b border-[var(--border)] pb-3 font-mono text-[1rem] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)] transition-colors duration-400 disabled:opacity-50"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="font-sans text-[0.75rem] text-red-400 tracking-wide bg-red-500/10 px-3 py-2 border border-red-500/20">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="group flex items-center gap-3 font-sans text-[0.75rem] tracking-widest uppercase text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={13} className="animate-spin text-[var(--accent-gold)]" />
                                Authenticating
                            </>
                        ) : (
                            <>
                                Initiate Link
                                <ArrowRight size={13} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform duration-300" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
