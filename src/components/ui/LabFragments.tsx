"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { LabFragment, SiteSettings, defaultSiteSettings } from "@/lib/types";

import { BehaviouralLandscapeViz, DecisionGraphViz, DrowsinessPipelineViz, ClinicalSurveillanceViz } from "@/components/ui/LabFragmentVisualizations";

function FragmentCard({ fragment, index, onClick }: { fragment: LabFragment; index: number; onClick: () => void }) {
    const cardRef = useRef<HTMLButtonElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        card.style.transform = `perspective(800px) rotateY(${dx * 6}deg) rotateX(${-dy * 4}deg) scale(1.02)`;
    };

    const handleMouseLeave = () => {
        if (cardRef.current) {
            cardRef.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)";
        }
    };

    return (
        <motion.button
            ref={cardRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="group relative border border-[rgba(212,175,55,0.15)] rounded-[14px] overflow-hidden text-left w-full hover:border-[rgba(212,175,55,0.45)]"
            style={{ background: "#050505", transition: "transform 0.25s ease, border-color 0.4s ease", willChange: "transform" }}
            data-research-hover
        >
            {/* Hover Glow */}
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                style={{ boxShadow: "inset 0 0 60px rgba(212,175,55,0.25)", borderRadius: "14px" }} />

            {/* Visual area — miniature webgl scientific visualization */}
            <div className="w-full relative overflow-hidden flex items-center justify-center pointer-events-none" style={{ height: "160px", background: "#060606", borderBottom: "1px solid var(--border)" }}>
                {fragment.imageUrl ? (
                    <Image src={fragment.imageUrl} alt={fragment.caption} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                ) : (
                    <div className="absolute inset-0 w-full h-full">
                        {index % 4 === 0 && <BehaviouralLandscapeViz />}
                        {index % 4 === 1 && <DecisionGraphViz />}
                        {index % 4 === 2 && <DrowsinessPipelineViz />}
                        {index % 4 === 3 && <ClinicalSurveillanceViz />}
                    </div>
                )}
            </div>

            <div className="p-[28px] relative z-10 transition-colors duration-400 group-hover:brightness-110">
                <h3 className="font-serif text-[18px] font-[600] tracking-[0.02em] mb-2 text-[var(--accent-gold)]">{fragment.caption}</h3>
                <p className="font-sans text-[14px] text-[var(--text-dim)] leading-[1.6] opacity-75 group-hover:opacity-100 transition-opacity duration-400 line-clamp-3">
                    {fragment.description ?? ""}
                </p>
                <p className="font-sans text-[0.65rem] tracking-widest uppercase text-[var(--text-dim)] mt-3 opacity-0 group-hover:opacity-60 transition-opacity duration-400">
                    Expand →
                </p>
            </div>
        </motion.button>
    );
}

export function LabFragments() {
    const [fragments, setFragments] = useState<LabFragment[]>(defaultSiteSettings.labFragments);
    const [active, setActive] = useState<LabFragment | null>(null);

    useEffect(() => {
        fetch("/api/site/settings")
            .then((r) => r.json())
            .then((data: SiteSettings) => {
                if (data.labFragments?.length) setFragments(data.labFragments);
            })
            .catch(() => { /* use default */ });
    }, []);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[32px]">
                {fragments.map((f, i) => (
                    <div key={f.id}>
                        <FragmentCard fragment={f} index={i} onClick={() => setActive(f)} />
                    </div>
                ))}
            </div>

            {/* Modal expand */}
            <AnimatePresence>
                {active && (
                    <motion.div
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setActive(null)}
                    >
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div
                            className="relative z-10 border border-[var(--border)] max-w-xl w-full"
                            style={{ background: "#0a0a0a" }}
                            initial={{ scale: 0.94, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 8 }}
                            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ height: "260px", background: "#050505", borderBottom: "1px solid var(--border)" }} className="relative flex items-center justify-center overflow-hidden">
                                {active.imageUrl ? (
                                    <Image src={active.imageUrl} alt={active.caption} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" />
                                ) : (
                                    <div className="absolute inset-0 w-full h-full">
                                        {(() => {
                                            const type = active.type;
                                            if (type === "behavioural-landscape") return <BehaviouralLandscapeViz />;
                                            if (type === "decision-graph") return <DecisionGraphViz />;
                                            if (type === "drowsiness-pipeline") return <DrowsinessPipelineViz />;
                                            if (type === "clinical-surveillance") return <ClinicalSurveillanceViz />;
                                            return <BehaviouralLandscapeViz />; // Fallback
                                        })()}
                                    </div>
                                )}
                            </div>
                            <div className="p-7">
                                <p className="mono text-[0.6rem] tracking-[0.2em] mb-3 text-[var(--accent-gold)]">{active.caption}</p>
                                <p className="font-sans text-[0.88rem] text-[var(--text-muted)] leading-relaxed">{active.description}</p>
                            </div>
                            <button onClick={() => setActive(null)}
                                className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
                                aria-label="Close">
                                <X size={14} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ── Admin-side editor (used in admin/settings page) ────────────────────────────
export function LabFragmentsEditor({
    fragments,
    onChange,
}: {
    fragments: LabFragment[];
    onChange: (f: LabFragment[]) => void;
}) {
    const addFragment = () => {
        const id = String(Date.now()).slice(-4);
        onChange([...fragments, { id, imageUrl: "", type: "behavioural-landscape", caption: "New Fragment", description: "" }]);
    };

    const remove = (idx: number) => onChange(fragments.filter((_, i) => i !== idx));

    const update = (idx: number, patch: Partial<LabFragment>) => {
        const next = [...fragments];
        next[idx] = { ...next[idx], ...patch };
        onChange(next);
    };

    return (
        <div className="space-y-6">
            {fragments.map((f, i) => (
                <div key={f.id} className="border border-[var(--border)] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="mono text-[0.6rem] tracking-[0.2em] text-[var(--accent-gold)]">Fragment {f.id}</p>
                        <button onClick={() => remove(i)} className="text-[var(--text-dim)] hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Caption / label"
                            value={f.caption}
                            onChange={(e) => update(i, { caption: e.target.value })}
                            className="w-full bg-transparent border-b border-[var(--border)] pb-2 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors placeholder:text-[var(--text-dim)]"
                        />
                        <textarea
                            placeholder="Description (optional)"
                            value={f.description ?? ""}
                            rows={2}
                            onChange={(e) => update(i, { description: e.target.value })}
                            className="w-full bg-transparent border-b border-[var(--border)] pb-2 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors placeholder:text-[var(--text-dim)] resize-none"
                        />
                        <input
                            type="text"
                            placeholder="Image URL (leave blank for SVG placeholder)"
                            value={f.imageUrl}
                            onChange={(e) => update(i, { imageUrl: e.target.value })}
                            className="w-full bg-transparent border-b border-[var(--border)] pb-2 font-sans text-[0.75rem] text-[var(--text-dim)] outline-none focus:border-[var(--accent-gold)] transition-colors placeholder:text-[var(--text-dim)]"
                        />
                        <select
                            value={f.type || "behavioural-landscape"}
                            onChange={(e) => update(i, { type: e.target.value as LabFragment["type"] })}
                            className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-2 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors"
                        >
                            <option value="behavioural-landscape" className="bg-[#050505] text-[var(--text-primary)]">Behavioural Landscape</option>
                            <option value="decision-graph" className="bg-[#050505] text-[var(--text-primary)]">Decision Graph</option>
                            <option value="drowsiness-pipeline" className="bg-[#050505] text-[var(--text-primary)]">Drowsiness Pipeline</option>
                            <option value="clinical-surveillance" className="bg-[#050505] text-[var(--text-primary)]">Clinical Surveillance</option>
                        </select>
                    </div>
                </div>
            ))}
            <button
                onClick={addFragment}
                className="flex items-center gap-2 font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors"
            >
                <Plus size={12} /> Add Fragment
            </button>
        </div>
    );
}
