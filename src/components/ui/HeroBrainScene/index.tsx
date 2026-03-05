"use client";
import Image from "next/image";
/**
 * HeroBrainScene/index.tsx — v3
 *
 * Key improvements:
 *  - Wheel event captured with passive:false + capture:true so the page
 *    does NOT scroll while cursor is inside the brain panel
 *  - `overscroll-behavior: contain` + `touch-action: none` on container
 *  - Spring-eased depth via rAF (no React state in animation loop)
 *  - Double-click resets depth
 *  - Lab Fragment modal on deep-zoom click
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { BrainScene } from "./BrainScene";
import { BiosignalCanvas } from "./BiosignalCanvas";
import type { SiteSettings, LabFragment } from "@/lib/types";

// ── Lab Fragment modal ────────────────────────────────────────────────────────
function FragmentModal({ fragment, onClose }: { fragment: LabFragment; onClose: () => void }) {
    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[300] flex items-center justify-center p-6"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <div className="absolute inset-0 bg-black/88 backdrop-blur-sm" />
                <motion.div
                    className="relative z-10 border border-[var(--border)] max-w-xl w-full"
                    style={{ background: "#080808" }}
                    initial={{ scale: 0.93, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 10 }}
                    transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {fragment.imageUrl ? (
                        <div className="relative w-full" style={{ height: 240, borderBottom: "1px solid var(--border)" }}>
                            <Image src={fragment.imageUrl} alt={fragment.caption} fill className="object-cover" sizes="600px" />
                        </div>
                    ) : <div style={{ height: 140, background: "#040404", borderBottom: "1px solid var(--border)" }}
                        className="flex items-center justify-center">
                        <span style={{ color: "var(--accent-gold)", fontSize: 36, opacity: 0.2 }}>∑</span>
                    </div>
                    }
                    <div className="p-7">
                        <p className="mono text-[0.56rem] tracking-[0.22em] mb-2 text-[var(--accent-gold)]">Lab Fragment</p>
                        <p className="font-serif text-[1.1rem] text-[var(--text-primary)] mb-3 leading-snug">{fragment.caption}</p>
                        <p className="font-sans text-[0.86rem] text-[var(--text-muted)] leading-relaxed">{fragment.description}</p>
                    </div>
                    <button onClick={onClose}
                        className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors"
                        aria-label="Close"><X size={13} /></button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── Layer indicator ───────────────────────────────────────────────────────────
const LAYERS = ["Structure", "Equations", "Signals", "Cortex"];

function LayerUI({ depthRef }: { depthRef: React.MutableRefObject<number> }) {
    const [d, setD] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setD(Math.round(depthRef.current)), 250);
        return () => clearInterval(id);
    }, [depthRef]);
    const layer = LAYERS[Math.min(Math.floor(d), 3)];
    return (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none select-none" style={{ opacity: 0.45 }}>
            <div className="flex gap-[3px]">
                {LAYERS.map((_, i) => (
                    <div key={i} className="w-[5px] h-[5px] rounded-full transition-colors duration-300"
                        style={{ background: i <= d ? "rgba(210,180,60,0.9)" : "rgba(255,255,255,0.12)" }} />
                ))}
            </div>
            <span className="mono text-[0.50rem] tracking-[0.25em] uppercase" style={{ color: "rgba(210,180,60,0.8)" }}>{layer}</span>
        </div>
    );
}

// ── Main exported component ───────────────────────────────────────────────────
export function HeroBrainScene({ settings }: { settings: SiteSettings }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const brainPanelRef = useRef<HTMLDivElement>(null);
    const depthRef = useRef(0);
    const targetRef = useRef(0);
    const rafRef = useRef<number>(0);
    const triggerPulseRef = useRef<(() => void) | null>(null);
    const [fragment, setFragment] = useState<LabFragment | null>(null);

    const [reducedMotion] = useState(
        () => typeof window !== "undefined"
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false
    );

    // ── Spring depth animation ────────────────────────────────────────────────
    const animateDepth = useCallback(function animateDepthLoop() {
        const diff = targetRef.current - depthRef.current;
        if (Math.abs(diff) > 0.001) {
            depthRef.current += diff * 0.075;
            rafRef.current = requestAnimationFrame(animateDepthLoop);
        } else {
            depthRef.current = targetRef.current;
        }
    }, []);

    // ── Wheel handler — MUST be { passive: false, capture: true } ─────────────
    // capture:true  → fires before R3F canvas sees the event
    // passive:false → allows e.preventDefault() so page does NOT scroll
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();      // ← stops page scroll
            e.stopPropagation();

            // Normalize delta — trackpads produce small deltas (< 30), mice larger
            const isTrackpad = Math.abs(e.deltaY) < 30;
            const speed = isTrackpad ? 0.004 : 0.038;
            const delta = e.deltaY * speed * Math.max(0.5, settings.brainZoomDepth ?? 1.0);

            targetRef.current = Math.min(3, Math.max(0, targetRef.current + delta));
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(animateDepth);
        };

        el.addEventListener("wheel", onWheel, { passive: false, capture: true });
        return () => el.removeEventListener("wheel", onWheel, { capture: true });
    }, [animateDepth, settings.brainZoomDepth]);

    // ── Double-click resets depth ─────────────────────────────────────────────
    const onDoubleClick = useCallback(() => {
        targetRef.current = 0;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(animateDepth);
    }, [animateDepth]);

    // ── Canvas click — deep zoom opens fragment modal ─────────────────────────
    const onCanvasClick = useCallback(() => {
        if (depthRef.current < 1.8) return;
        const frags = settings.labFragments;
        if (!frags?.length) return;
        setFragment(frags[Math.floor(Math.random() * frags.length)]);
    }, [settings.labFragments]);

    return (
        <>
            <div
                ref={containerRef}
                className="relative w-full select-none"
                style={{
                    height: "calc(100vh - 80px)",
                    minHeight: 480,
                    maxHeight: 700,
                    // These two CSS properties prevent browser scroll chaining:
                    overscrollBehavior: "contain",
                    touchAction: "none",
                    cursor: "crosshair",
                }}
                onDoubleClick={onDoubleClick}
                onClick={onCanvasClick}
                title="Scroll to zoom · Double-click to reset"
                role="img"
                aria-label="3D interactive brain visualization constructed from mathematical symbols"
            >
                {/* Scroll hint */}
                <p className="absolute bottom-10 left-1/2 -translate-x-1/2 mono text-[0.50rem] tracking-[0.24em] uppercase select-none pointer-events-none z-10"
                    style={{ color: "rgba(210,180,60,0.25)" }}>
                    scroll to explore · double-click to reset
                </p>

                {/* Biosignal canvas overlay — covers full hero, pointer-events:none */}
                <BiosignalCanvas
                    containerRef={containerRef}
                    brainPanelRef={brainPanelRef}
                    onBrainProximity={() => {
                        if (triggerPulseRef.current) triggerPulseRef.current();
                    }}
                />

                {/* WebGL Brain Canvas */}
                <div ref={brainPanelRef} className="absolute inset-0 z-0">
                    <BrainScene
                        settings={settings}
                        depthRef={depthRef}
                        reducedMotion={reducedMotion}
                        triggerPulseRef={triggerPulseRef}
                    />
                </div>

                {/* Layer indicator */}
                <LayerUI depthRef={depthRef} />
            </div>

            {fragment && (
                <FragmentModal fragment={fragment} onClose={() => setFragment(null)} />
            )}
        </>
    );
}
