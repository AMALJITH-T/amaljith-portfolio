"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { projects } from "@/lib/data";
import { Project } from "@/lib/types";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { BackgroundGeometry } from "@/components/ui/BackgroundGeometry";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 90%", "start 30%"],
    });

    const y = useTransform(scrollYProgress, [0, 1], [48, 0]);
    const scale = useTransform(scrollYProgress, [0, 1], [0.97, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.35], [0, 1]);

    return (
        <motion.div
            ref={ref}
            style={{ y, scale, opacity }}
            transition={{ ease: EASE }}
            className="group relative border-b border-[var(--border)] py-12 cursor-pointer will-change-transform"
        >
            <div className="grid grid-cols-[1fr_auto] gap-8 items-start">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <span className="mono">{project.year}</span>
                        {project.featured && (
                            <span className="font-sans text-[0.6rem] tracking-widest uppercase text-[var(--accent-gold)] border border-[rgba(212,175,55,0.3)] px-2 py-0.5">
                                Featured
                            </span>
                        )}
                    </div>
                    <h3 className="font-serif text-[1.7rem] text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent-gold)] transition-colors duration-600 leading-tight">
                        {project.title}
                    </h3>
                    <p className="font-sans text-[var(--text-muted)] text-[0.9rem] leading-relaxed max-w-xl mb-2">
                        {project.description}
                    </p>
                    {project.longDescription && (
                        <p className="font-sans text-[var(--text-dim)] text-[0.82rem] leading-relaxed max-w-xl mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-600">
                            {project.longDescription}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-5">
                        {project.tags.map((tag) => (
                            <span
                                key={tag}
                                className="font-sans text-[0.65rem] tracking-widest uppercase text-[var(--text-dim)] border border-[var(--border)] px-2.5 py-1"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                {project.caseStudyUrl && (
                    <a
                        href={project.caseStudyUrl}
                        className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-400 text-[var(--accent-gold)]"
                        aria-label={`Read case study for ${project.title}`}
                    >
                        <ArrowUpRight size={18} strokeWidth={1.5} />
                    </a>
                )}
            </div>
        </motion.div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WorkPage() {
    const headerRef = useRef<HTMLDivElement>(null);
    const featured = projects.filter((p) => p.featured);
    const other = projects.filter((p) => !p.featured);

    return (
        <>
            <BackgroundGeometry />

            <main className="relative z-10 min-h-screen pt-24">
                <section className="section">
                    {/* ── Page Header ─────────────────────────────────────── */}
                    <div ref={headerRef} className="mb-16 max-w-3xl">
                        <div className="flex items-center gap-4 mb-8">
                            <Link
                                href="/"
                                className="font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-400 flex items-center gap-1.5"
                            >
                                <ArrowLeft size={11} strokeWidth={2} />
                                Home
                            </Link>
                        </div>

                        <p className="mono tracking-[0.2em] mb-6">Selected Work</p>
                        <h1 className="font-serif text-[clamp(2.8rem,6vw,5rem)] font-[300] leading-[1.05] text-[var(--text-primary)] mb-5">
                            Research &amp; Engineering
                        </h1>
                        <p className="font-sans text-[var(--text-muted)] text-[1rem] leading-relaxed max-w-lg">
                            Projects at the intersection of AI, computational geometry, and autonomous systems.
                        </p>
                        <div className="gold-line mt-8" />
                    </div>

                    {/* ── Featured Work ───────────────────────────────────── */}
                    {featured.length > 0 && (
                        <div className="mb-0">
                            <p className="font-sans text-[0.65rem] tracking-widest uppercase text-[var(--text-dim)] mb-0">
                                — Featured
                            </p>
                            {featured.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    )}

                    {/* ── Other Work ──────────────────────────────────────── */}
                    {other.length > 0 && (
                        <div className="mt-16">
                            <p className="font-sans text-[0.65rem] tracking-widest uppercase text-[var(--text-dim)] mb-0">
                                — Additional
                            </p>
                            {other.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    )}

                    {/* ── CTA ──────────────────────────────────────────────── */}
                    <div className="mt-20 pt-12 border-t border-[var(--border)]">
                        <p className="font-sans text-[var(--text-dim)] text-[0.85rem] mb-6">
                            Interested in collaboration or research conversations?
                        </p>
                        <MagneticButton
                            as="a"
                            href="/signal"
                            className="font-sans text-[0.78rem] tracking-widest uppercase text-[var(--text-primary)] border border-[var(--border)] px-8 py-3 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors duration-600"
                        >
                            Send Signal <ArrowUpRight size={12} className="inline ml-1" />
                        </MagneticButton>
                    </div>
                </section>
            </main>
        </>
    );
}
