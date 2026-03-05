"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    ArrowLeft,
    CircleDot,
    MessagesSquare,
} from "lucide-react";

const adminNav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/editor", label: "Editor", icon: FileText },
    { href: "/admin/commons", label: "Commons", icon: MessagesSquare },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>

            {/* ── Sidebar ──────────────────────────────────────────────────────── */}
            <aside
                className="w-52 flex-shrink-0 flex flex-col border-r border-[var(--border)]"
                style={{ background: "var(--bg-secondary)" }}
            >
                {/* Top: Back to public */}
                <div className="px-5 py-6 border-b border-[var(--border)]">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-[var(--text-dim)] hover:text-[var(--text-muted)] text-[0.68rem] tracking-widest uppercase transition-colors duration-400"
                    >
                        <ArrowLeft size={11} strokeWidth={1.5} />
                        Public Site
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-5">
                    <p className="font-sans text-[0.6rem] text-[var(--text-dim)] tracking-[0.18em] uppercase px-2 mb-3">
                        Workspace
                    </p>
                    <div className="flex flex-col gap-0.5">
                        {adminNav.map(({ href, label, icon: Icon }) => {
                            const active = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-[0.8rem] font-sans transition-all duration-300 ${active
                                        ? "text-[var(--text-primary)] bg-[rgba(255,255,255,0.04)]"
                                        : "text-[var(--text-dim)] hover:text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.025)]"
                                        }`}
                                >
                                    <Icon
                                        size={13}
                                        strokeWidth={1.5}
                                        className={active ? "text-[var(--accent-gold)]" : ""}
                                    />
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer: System status */}
                <div className="px-5 py-5 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                        <CircleDot size={9} className="text-emerald-500 opacity-80" />
                        <span className="font-sans text-[0.65rem] text-[var(--text-dim)] tracking-wider">
                            Local · Analysis active
                        </span>
                    </div>
                </div>
            </aside>

            {/* ── Main ─────────────────────────────────────────────────────────── */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
