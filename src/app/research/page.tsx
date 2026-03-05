"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { research } from "@/lib/data";
import { Research } from "@/lib/types";
import { BackgroundGeometry } from "@/components/ui/BackgroundGeometry";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Head from "next/head";

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Research Row ─────────────────────────────────────────────────────────────
function ResearchRow({ item, index }: { item: Research; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 88%", "start 50%"],
    });

    // Lateral slide-in — transform is the primary driver
    const x = useTransform(scrollYProgress, [0, 1], [-32, 0]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

    return (
        <motion.div
            ref={ref}
            style={{ x, opacity }}
            transition={{ ease: EASE }}
            className="group grid grid-cols-[4rem_1fr_auto] gap-6 items-start py-8 border-b border-[var(--border)] last:border-0 will-change-transform"
        >
            {/* Year column */}
            <span className="mono pt-0.5">{item.year}</span>

            {/* Content column */}
            <div>
                <h3 className="font-serif text-[1.15rem] text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent-gold)] transition-colors duration-400 mb-2">
                    {item.title}
                </h3>
                <p className="font-sans text-[0.78rem] text-[var(--text-dim)] tracking-wide mb-3">
                    {item.conference}
                    {item.journal ? ` · ${item.journal}` : ""}
                </p>
                {item.abstract && (
                    <p className="font-sans text-[0.82rem] text-[var(--text-muted)] leading-relaxed max-w-xl opacity-0 group-hover:opacity-100 transition-opacity duration-600">
                        {item.abstract}
                    </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                    {item.tags.map((tag) => (
                        <span
                            key={tag}
                            className="font-sans text-[0.6rem] tracking-widest uppercase text-[var(--text-dim)] border border-[var(--border)] px-2 py-0.5"
                        >
                            {tag}
                        </span>
                    ))}
                    {item.status && (
                        <span
                            className={`font-sans text-[0.6rem] tracking-widest uppercase border px-2 py-0.5 ${item.status === "Published"
                                    ? "text-[var(--accent-gold)] border-[rgba(212,175,55,0.3)]"
                                    : "text-blue-400 border-[rgba(96,165,250,0.3)]"
                                }`}
                        >
                            {item.status}
                        </span>
                    )}
                </div>
            </div>

            {/* Link arrow or PDF link */}
            {(item.pdfLink || item.link) && (
                <a
                    href={item.pdfLink || item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-60 transition-opacity duration-400 text-[var(--accent-gold)] pt-0.5 flex-shrink-0"
                    aria-label={`Read paper: ${item.title}`}
                >
                    <ArrowUpRight size={14} strokeWidth={1.5} />
                </a>
            )}
        </motion.div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ResearchPage() {
    const grouped = research.reduce<Record<number, Research[]>>((acc, item) => {
        (acc[item.year] ??= []).push(item);
        return acc;
    }, {});
    const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

    // Generate JSON-LD Structured Data for ScholarlyArticles
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": research.map((item) => ({
            "@type": "ScholarlyArticle",
            "headline": item.title,
            "author": (item.authors || ["Amaljith Nair"]).map(author => ({
                "@type": "Person",
                "name": author
            })),
            "datePublished": item.publicationYear || item.year.toString(),
            "url": item.pdfLink ? `https://amaljithnair.com${item.pdfLink}` : "https://amaljithnair.com/research",
            "description": item.abstract || item.title
        }))
    };

    return (
        <>
            <Head>
                {/* Global Academic Google Scholar Meta Tags (Injecting Top-Level for indexers) */}
                {research.map((item) => (
                    <div key={`meta-${item.id}`}>
                        <meta name="citation_title" content={item.title} />
                        {(item.authors || ["Amaljith Nair"]).map((author, i) => (
                            <meta key={`author-${i}`} name="citation_author" content={author} />
                        ))}
                        <meta name="citation_publication_date" content={item.publicationYear || item.year.toString()} />
                        {item.journal && <meta name="citation_journal_title" content={item.journal} />}
                        {item.conference && <meta name="citation_conference_title" content={item.conference} />}
                        {item.abstract && <meta name="citation_abstract" content={item.abstract} />}
                        {item.pdfLink && <meta name="citation_pdf_url" content={`https://amaljithnair.com${item.pdfLink}`} />}
                    </div>
                ))}

                {/* JSON-LD Injection */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            </Head>

            <BackgroundGeometry />

            <main className="relative z-10 min-h-screen pt-24">
                <section className="section">
                    {/* ── Page Header ─────────────────────────────────────── */}
                    <div className="mb-16 max-w-3xl">
                        <motion.div
                            className="flex items-center gap-4 mb-8"
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Link
                                href="/"
                                className="font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-400 flex items-center gap-1.5"
                            >
                                <ArrowLeft size={11} strokeWidth={2} />
                                Home
                            </Link>
                        </motion.div>

                        <motion.p
                            className="mono tracking-[0.2em] mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                        >Research &amp; Publications</motion.p>

                        <motion.h1
                            className="font-serif text-[clamp(2.8rem,6vw,5rem)] font-[300] leading-[1.05] text-[var(--text-primary)] mb-5"
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.8, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        >
                            Published Work
                        </motion.h1>

                        <motion.p
                            className="font-sans text-[var(--text-muted)] text-[1rem] leading-relaxed max-w-lg"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        >
                            Peer-reviewed contributions in AI, computational geometry, and autonomous systems.
                        </motion.p>
                        <div className="gold-line mt-8" />
                    </div>

                    {/* ── Publications by Year ─────────────────────────────── */}
                    <div className="space-y-16 max-w-3xl">
                        {years.map((year) => (
                            <div key={year}>
                                {/* Year group header */}
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="mono text-[var(--accent-gold)] opacity-60">{year}</span>
                                    <div className="flex-1 h-px bg-[var(--border)]" />
                                </div>
                                {grouped[year].map((item, i) => (
                                    <ResearchRow key={item.id} item={item} index={i} />
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* ── Footer note ─────────────────────────────────────── */}
                    <div className="mt-20 pt-12 border-t border-[var(--border)] max-w-3xl">
                        <p className="font-sans text-[var(--text-dim)] text-[0.85rem] italic">
                            All publications are available via conference proceedings or preprint servers.
                        </p>
                    </div>
                </section>
            </main>
        </>
    );
}
