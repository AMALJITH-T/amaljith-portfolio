"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { timelineData } from "@/lib/data";
import { TimelineEvent, SiteSettings } from "@/lib/types";
import { loadSiteSettings } from "@/lib/settingsLoader";

function TimelineNode({ event, index }: { event: TimelineEvent; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px 0px" });

    // Alternating delay based on index for staggered scroll reveals
    const delay = index * 0.15;

    return (
        <div ref={ref} className="relative flex flex-col md:flex-row items-start md:items-center w-full gap-6 md:gap-0 mb-[120px] md:mb-[160px] last:mb-0">

            {/* 1. Desktop Year (Left Column) */}
            <div className="hidden md:flex flex-1 justify-end pr-12 lg:pr-16">
                <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ duration: 0.6, delay: delay }}
                    className="font-serif text-[24px] tracking-wide text-[var(--accent-gold)]"
                >
                    {event.year}
                </motion.span>
            </div>

            {/* 2. Spine & Node (Center Column) */}
            <div className="absolute left-[8px] md:static md:flex flex-col items-center justify-center w-[2px] h-full z-10">
                {/* Node Circle */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                    transition={{ duration: 0.5, delay: delay, type: "spring", stiffness: 200 }}
                    className="w-[10px] h-[10px] rounded-full bg-[var(--accent-gold)] shrink-0 absolute top-2 md:top-auto flex items-center justify-center relative"
                    style={{
                        boxShadow: "0 0 8px rgba(212,175,55,0.8)",
                        marginLeft: "-4px", // Align perfectly over the 1px line
                        marginTop: "16px" // Align with card title on mobile
                    }}
                >
                    {/* Breathing Halo */}
                    <motion.div
                        animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: delay }}
                        className="absolute inset-0 rounded-full bg-[var(--accent-gold)]"
                    />
                </motion.div>
            </div>

            {/* 3. Card & Mobile Year (Right Column) */}
            <div className="flex-1 pl-12 md:pl-12 lg:pl-16 w-full">
                {/* Mobile Year */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.4, delay: delay }}
                    className="md:hidden font-serif text-[20px] tracking-wide text-[var(--accent-gold)] mb-3"
                >
                    {event.year}
                </motion.div>

                {/* Card Body */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                    transition={{ duration: 0.7, delay: delay + 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative rounded-[10px] p-[22px] overflow-hidden text-left"
                    style={{
                        background: "rgba(15,15,15,0.85)",
                        border: "1px solid rgba(212,175,55,0.2)",
                        transition: "border-color 0.4s ease"
                    }}
                >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                        style={{ boxShadow: "inset 0 0 40px rgba(212,175,55,0.1)", borderRadius: "10px" }} />

                    <div className="relative z-10">
                        {event.targetLabel && (
                            <span className="inline-block px-2 py-1 mb-3 text-[10px] tracking-widest font-mono text-[var(--bg-primary)] bg-[var(--accent-gold)] rounded-sm font-bold">
                                {event.targetLabel}
                            </span>
                        )}
                        <h3 className="font-serif text-[18px] font-[600] tracking-[0.02em] mb-1 text-[var(--text-primary)]">
                            {event.title}
                        </h3>
                        {event.institution && (
                            <p className="font-sans text-[13px] text-[var(--accent-gold)] mb-3 opacity-90">
                                {event.institution}
                            </p>
                        )}
                        <p className="font-sans text-[14px] text-[var(--text-dim)] leading-[1.6] mb-5 mt-2">
                            {event.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-auto">
                            {event.tags.map(tag => (
                                <span key={tag} className="font-sans text-[11px] tracking-[0.06em] px-[8px] py-[4px] rounded-[6px]"
                                    style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "var(--text-primary)" }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// Background Particle Noise layer
function TimelineParticleNoise() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.15]" style={{ zIndex: 0 }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="noise-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="1" fill="#c29b27" opacity="0.3" />
                        <circle cx="40" cy="25" r="0.5" fill="#ffffff" opacity="0.2" />
                        <circle cx="20" cy="50" r="1.5" fill="#c29b27" opacity="0.1" />
                        <circle cx="50" cy="55" r="1" fill="#ffffff" opacity="0.2" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#noise-pattern)">
                    <animate attributeName="x" from="0" to="-60" dur="20s" repeatCount="indefinite" />
                    <animate attributeName="y" from="0" to="60" dur="30s" repeatCount="indefinite" />
                </rect>
            </svg>
        </div>
    );
}


export function ResearchTimeline() {
    // Top-level spine ref
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px 0px" });
    const [events, setEvents] = useState<TimelineEvent[]>(timelineData);

    useEffect(() => {
        loadSiteSettings()
            .then((settings: SiteSettings) => {
                if (settings && settings.timeline && settings.timeline.length > 0) {
                    setEvents(settings.timeline);
                }
            })
            .catch(() => {});
    }, []);

    return (
        <section id="research-timeline" className="relative w-full py-24 border-t border-[var(--border)] overflow-hidden">
            <TimelineParticleNoise />

            <div className="max-w-5xl mx-auto px-6 relative z-10 w-full" ref={containerRef}>
                <div className="mb-20 text-center md:text-left">
                    <p className="mono tracking-[0.2em] mb-3">Research Timeline</p>
                    <div className="gold-line mx-auto md:mx-0" />
                    <p className="font-sans text-[var(--text-dim)] text-[0.88rem] mt-5 max-w-xl leading-relaxed mx-auto md:mx-0">
                        The evolution of systems, experiments, and applied intelligence across computational geometry, machine learning, and medical systems.
                    </p>
                </div>

                <div className="relative w-full mt-16">
                    {/* The Continuous Glowing Spine */}
                    <div className="absolute left-[8px] md:left-1/2 md:-ml-[1px] top-0 bottom-0 w-[1px] md:w-[2px]"
                        style={{ background: "rgba(212,175,55,0.45)", filter: "drop-shadow(0 0 4px rgba(212,175,55,0.5))" }}>
                        <motion.div
                            initial={{ scaleY: 0 }}
                            animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full h-full bg-[var(--accent-gold)] origin-top relative overflow-hidden"
                        >
                            {/* Traveling Pulse down the spine */}
                            <motion.div
                                animate={{ top: ["-10%", "110%"] }}
                                transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 w-full h-[120px] bg-gradient-to-b from-transparent via-[#ffeeb3] to-transparent opacity-80"
                                style={{ filter: "blur(2px)" }}
                            />
                        </motion.div>
                    </div>

                    {/* Timeline Nodes */}
                    <div className="relative pt-8 pb-8">
                        {events.map((evt, idx) => (
                            <TimelineNode key={evt.title + evt.year + idx} event={evt} index={idx} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
