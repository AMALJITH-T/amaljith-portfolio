"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { StaggerReveal } from "@/components/ui/StaggerReveal";
import { ScrollInsightPulse } from "@/components/ui/ScrollInsightPulse";

interface Repo {
    id: number;
    name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    updated_at: string;
    html_url: string;
}

function RepoCard({ repo }: { repo: Repo }) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 90%", "start 40%"],
    });

    const y = useTransform(scrollYProgress, [0, 1], [30, 0]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

    const date = new Date(repo.updated_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const timeAgo = diffDays === 1 ? "1 day ago" : diffDays === 0 ? "Today" : `${diffDays} days ago`;

    return (
        <motion.div
            ref={ref}
            style={{ y, opacity }}
            className="group relative border-b border-[var(--border)] py-8 will-change-transform cursor-pointer"
            onClick={() => window.open(repo.html_url, "_blank")}
        >
            <div className="grid grid-cols-[1fr_auto] gap-6 items-start">
                <div>
                    <h3 className="font-serif text-[1.4rem] text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-gold)] transition-colors duration-400 leading-tight">
                        {repo.name}
                    </h3>
                    {repo.description && (
                        <p className="font-sans text-[var(--text-muted)] text-[0.85rem] leading-relaxed max-w-xl mb-4">
                            {repo.description}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        {repo.language && (
                            <span className="font-sans text-[0.65rem] tracking-widest uppercase text-[var(--text-dim)] border border-[var(--border)] px-2.5 py-1">
                                {repo.language}
                            </span>
                        )}
                        <span className="font-sans text-[0.65rem] tracking-widest uppercase text-[var(--text-dim)] flex items-center gap-1">
                            <span className="text-[var(--accent-gold)]">★</span> {repo.stargazers_count}
                        </span>
                        <span className="font-sans text-[0.65rem] tracking-widest uppercase text-[var(--text-dim)]">
                            Updated: {timeAgo}
                        </span>
                    </div>
                </div>

                <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 text-[var(--accent-gold)] mt-1"
                    aria-label={`View ${repo.name} on GitHub`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <ArrowUpRight size={18} strokeWidth={1.5} />
                </a>
            </div>
        </motion.div>
    );
}

export function GitHubActivity() {
    const [repos, setRepos] = useState<Repo[]>([]);
    const headerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/github")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setRepos(data);
                }
            })
            .catch(err => console.error("Error fetching GitHub repos", err));
    }, []);

    const { scrollYProgress: headerProgress } = useScroll({
        target: headerRef,
        offset: ["start 85%", "start 40%"],
    });
    const headerY = useTransform(headerProgress, [0, 1], [24, 0]);
    const headerOpacity = useTransform(headerProgress, [0, 1], [0, 1]);

    if (repos.length === 0) return null;

    return (
        <ScrollInsightPulse>
            <section id="github-activity" className="section border-t border-[var(--border)] relative z-10 overflow-hidden">
                <motion.div
                    ref={headerRef}
                    style={{ y: headerY, opacity: headerOpacity }}
                    className="mb-8 relative z-10"
                >
                    <p className="mono tracking-[0.2em] mb-3 text-[var(--accent-gold)]">Research Activity</p>
                    <div className="gold-line" />
                    <p className="font-sans text-[var(--text-dim)] text-[0.88rem] mt-5 max-w-xl leading-relaxed">
                        Live signals from ongoing work.
                    </p>
                </motion.div>

                <StaggerReveal className="mt-4 relative z-10">
                    {repos.map((repo) => (
                        <RepoCard key={repo.id} repo={repo} />
                    ))}
                </StaggerReveal>
            </section>
        </ScrollInsightPulse>
    );
}
