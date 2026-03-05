import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

interface AdminLoginModalProps {
    open: boolean;
    onClose: () => void;
}

export function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto focus when modal opens
    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setPassword("");
            setError(null);
            setLoading(false);
        }
    }, [open]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
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
                setError("Invalid admin password");
                setPassword("");
                inputRef.current?.focus();
            }
        } catch {
            setError("Network error. Please try again.");
            inputRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-[400px] bg-[#070707] border border-[var(--accent-gold)] p-8 rounded-sm shadow-[0_0_30px_rgba(212,175,55,0.15)] opacity-0 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors"
                >
                    <X size={18} strokeWidth={1.5} />
                </button>

                <div className="mb-6">
                    <h2 className="font-serif text-[1.5rem] tracking-tight text-[var(--text-primary)] mb-1">
                        System Access
                    </h2>
                    <p className="mono text-[0.65rem] tracking-widest uppercase text-[var(--accent-gold)] opacity-70">
                        Authentication Required_
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            ref={inputRef}
                            type="password"
                            placeholder="Enter Passcode..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-mono text-[0.9rem] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-gold)] transition-colors duration-400 disabled:opacity-50"
                        />
                    </div>

                    {error && (
                        <p className="font-sans text-[0.7rem] tracking-wide text-red-400 bg-red-500/10 px-3 py-2 border border-red-500/20">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="group flex items-center gap-2 font-sans text-[0.75rem] tracking-widest uppercase text-[var(--text-primary)] hover:text-[var(--accent-gold)] transition-colors duration-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 size={13} className="animate-spin text-[var(--accent-gold)]" />
                            ) : null}
                            Authenticate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
