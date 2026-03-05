"use client";

import { motion } from "framer-motion";
import { articles } from "@/lib/data";
import { BackgroundGeometry } from "@/components/ui/BackgroundGeometry";

// Removed ArticleAccordion in favor of direct minimal render

export default function CuriosityPage() {
    return (
        <>
            <BackgroundGeometry />

            <main className="relative z-10 min-h-screen pt-24">
                <section className="section">
                    {/* Header */}
                    <div className="mb-16 max-w-2xl">
                        <motion.p
                            className="mono tracking-[0.2em] mb-6"
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        >Curiosity / Archive</motion.p>

                        <motion.h1
                            className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-[300] leading-[1.1] text-[var(--text-primary)] mb-5"
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        >
                            The Quiet Archive
                        </motion.h1>

                        <motion.p
                            className="font-sans text-[var(--text-muted)] text-[1rem] leading-relaxed"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        >
                            Thought threads from ongoing inquiry. On what it means
                            for a system to understand. On measurement and what it
                            hides. On intelligence at the scale of the body.
                        </motion.p>
                        <div className="gold-line mt-8" />
                    </div>

                    {/* Minimal Essay List */}
                    <div className="max-w-2xl mt-12 space-y-16">
                        {articles.map((article) => (
                            <motion.article
                                key={article.id}
                                className="group cursor-pointer"
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.5 }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <header className="mb-4">
                                    <span className="mono text-[0.65rem] tracking-widest uppercase text-[var(--accent-gold)] block mb-3">
                                        {new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                    <h2 className="font-serif text-[1.8rem] text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors duration-500 leading-snug">
                                        {article.title}
                                    </h2>
                                </header>
                                <p className="font-sans text-[0.95rem] leading-relaxed text-[var(--text-muted)] max-w-xl">
                                    {article.excerpt}
                                </p>
                                <div className="mt-5 flex gap-3">
                                    {article.tags.map(tag => (
                                        <span key={tag} className="font-sans text-[0.65rem] tracking-widest uppercase text-[var(--text-dim)] border border-[var(--border)] px-2.5 py-1">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}
