import { projects, research, articles, drafts } from "@/lib/data";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Link from "next/link";
import type { Metadata } from "next";
import { BarChart2, BookOpen, FolderOpen, FileText, ArrowUpRight, PenLine, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
    title: "Research Cockpit — Dashboard",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
    label,
    value,
    icon: Icon,
    accent = false,
}: {
    label: string;
    value: number;
    icon: LucideIcon;
    accent?: boolean;
}) {
    return (
        <div
            className="relative p-5 border border-[var(--border)] rounded-sm overflow-hidden"
            style={{ background: "var(--bg-card)" }}
        >
            {/* Subtle top-left accent rule */}
            {accent && (
                <div className="absolute top-0 left-0 w-8 h-px bg-[var(--accent-gold)] opacity-50" />
            )}
            <div className="flex items-start justify-between mb-4">
                <Icon
                    size={14}
                    strokeWidth={1.3}
                    className={accent ? "text-[var(--accent-gold)]" : "text-[var(--text-dim)]"}
                />
            </div>
            <p className="font-serif text-[2.4rem] font-[300] text-[var(--text-primary)] leading-none mb-1">
                {value}
            </p>
            <p className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">
                {label}
            </p>
        </div>
    );
}

// ─── Draft Row ────────────────────────────────────────────────────────────────
function DraftRow({
    title,
    tags,
    status,
    updatedAt,
}: {
    title: string;
    tags: string[];
    status: string;
    updatedAt: string;
}) {
    const published = status === "published";
    return (
        <div className="group grid grid-cols-[1fr_auto] gap-4 items-center py-4 border-b border-[var(--border)] last:border-0">
            <div>
                <p className="font-sans text-[0.88rem] text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent-gold)] transition-colors duration-400">
                    {title}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                    {tags.slice(0, 3).map((t) => (
                        <span
                            key={t}
                            className="font-sans text-[0.6rem] tracking-widest uppercase text-[var(--text-dim)]"
                        >
                            {t}
                        </span>
                    ))}
                    <span className="text-[var(--border)]">·</span>
                    <span className="font-sans text-[0.6rem] text-[var(--text-dim)]">
                        {new Date(updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </span>
                </div>
            </div>
            <span
                className={`font-sans text-[0.6rem] tracking-widest uppercase px-2.5 py-1 rounded-sm border ${published
                    ? "border-[rgba(212,175,55,0.4)] text-[var(--accent-gold)] bg-[rgba(212,175,55,0.06)]"
                    : "border-[var(--border)] text-[var(--text-dim)]"
                    }`}
            >
                {status}
            </span>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const draftCount = drafts.filter((d) => d.status === "draft").length;
    const publishedCount = drafts.filter((d) => d.status === "published").length;

    return (
        <AdminLayout>
            {/* Page header band */}
            <div
                className="border-b border-[var(--border)] px-10 py-6 flex items-center justify-between"
                style={{ background: "var(--bg-secondary)" }}
            >
                <div>
                    <p className="mono text-[0.65rem] tracking-[0.2em] mb-1">Overview</p>
                    <h1 className="font-serif text-[1.6rem] font-[300] text-[var(--text-primary)] leading-none">
                        Research Cockpit
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-2 font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)] border border-[var(--border)] px-4 py-2 rounded-sm hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-all duration-400"
                    >
                        Settings
                    </Link>
                    <Link
                        href="/admin/profile"
                        className="flex items-center gap-2 font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)] border border-[var(--border)] px-4 py-2 rounded-sm hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-all duration-400"
                    >
                        Profile
                    </Link>
                    <Link
                        href="/admin/editor"
                        className="flex items-center gap-2 font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)] border border-[var(--border)] px-4 py-2 rounded-sm hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-all duration-400"
                    >
                        <PenLine size={11} strokeWidth={1.5} />
                        New Draft
                    </Link>
                </div>
            </div>

            <div className="px-10 py-8 space-y-10">
                {/* Stats */}
                <section>
                    <p className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)] mb-4">
                        Content Library
                    </p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard label="Projects" value={projects.length} icon={FolderOpen} accent />
                        <StatCard label="Research" value={research.length} icon={BookOpen} />
                        <StatCard label="Articles" value={articles.length} icon={BarChart2} />
                        <StatCard label="Drafts" value={draftCount} icon={FileText} />
                    </div>
                </section>

                {/* Quick metrics */}
                <section>
                    <p className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)] mb-4">
                        Publishing Status
                    </p>
                    <div
                        className="grid grid-cols-2 gap-3 border border-[var(--border)] rounded-sm p-5"
                        style={{ background: "var(--bg-card)" }}
                    >
                        <div>
                            <p className="mono text-[1.8rem] font-[300] text-[var(--accent-gold)] leading-none mb-1">
                                {publishedCount}
                            </p>
                            <p className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">
                                Published
                            </p>
                        </div>
                        <div>
                            <p className="mono text-[1.8rem] font-[300] text-[var(--text-muted)] leading-none mb-1">
                                {draftCount}
                            </p>
                            <p className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">
                                In Progress
                            </p>
                        </div>
                    </div>
                </section>

                {/* Recent drafts */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <p className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">
                            Recent Drafts
                        </p>
                        <Link
                            href="/admin/editor"
                            className="flex items-center gap-1 font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-400"
                        >
                            Open Editor <ArrowUpRight size={10} strokeWidth={1.5} />
                        </Link>
                    </div>
                    <div
                        className="border border-[var(--border)] rounded-sm px-5"
                        style={{ background: "var(--bg-card)" }}
                    >
                        {drafts.map((d) => (
                            <DraftRow
                                key={d.id}
                                title={d.title}
                                tags={d.tags}
                                status={d.status}
                                updatedAt={d.updatedAt}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
