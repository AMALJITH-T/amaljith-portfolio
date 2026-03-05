"use client";
import Image from "next/image";
/**
 * BrainViz/index.tsx
 * Client-side wrapper:
 * - Captures wheel events inside the hero panel → zoom level (0–1)
 * - Tracks mouse position for fragment hover highlight
 * - Opens Lab Fragment modal on token click
 * - Does NOT interfere with global page scroll
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { BrainCanvas, BrainCanvasConfig } from "./BrainCanvas";
import type { LabFragment, SiteSettings } from "@/lib/types";
import { DEFAULT_SYMBOLS, DEFAULT_EQUATIONS, DEFAULT_WORDS } from "./symbolPool";

interface BrainVizProps {
    settings: SiteSettings;
}

// ── Fragment modal (local — no dependency on LabFragments component) ──────────
function FragmentModal({ fragment, onClose }: { fragment: LabFragment; onClose: () => void }) {
    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[200] flex items-center justify-center p-6"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
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
                    {fragment.imageUrl ? (
                        <div className="relative w-full" style={{ height: 260, borderBottom: "1px solid var(--border)" }}>
                            <Image src={fragment.imageUrl} alt={fragment.caption} fill className="object-cover" sizes="600px" />
                        </div>
                    ) : (
                        <div style={{ height: 180, background: "#050505", borderBottom: "1px solid var(--border)" }}
                            className="flex items-center justify-center">
                            <span style={{ color: "var(--accent-gold)", fontSize: 32, opacity: 0.3 }}>⊗</span>
                        </div>
                    )}
                    <div className="p-7">
                        <p className="mono text-[0.6rem] tracking-[0.2em] mb-3 text-[var(--accent-gold)]">
                            Lab Fragment
                        </p>
                        <p className="font-serif text-[1.1rem] text-[var(--text-primary)] mb-3 leading-snug">
                            {fragment.caption}
                        </p>
                        <p className="font-sans text-[0.88rem] text-[var(--text-muted)] leading-relaxed">
                            {fragment.description}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
                        aria-label="Close">
                        <X size={14} />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── Zoom indicator ────────────────────────────────────────────────────────────
function ZoomIndicator({ zoom }: { zoom: number }) {
    const label = zoom < 0.35 ? "Structure" : zoom < 0.65 ? "Equations" : "Signals";
    return (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none"
            style={{ opacity: 0.45 }}>
            <div className="w-16 h-px bg-[var(--border)]">
                <div className="h-full bg-[var(--accent-gold)] transition-all duration-300"
                    style={{ width: `${zoom * 100}%` }} />
            </div>
            <span className="mono text-[0.55rem] tracking-widest uppercase text-[var(--text-dim)]">
                {label}
            </span>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export function BrainViz({ settings }: BrainVizProps) {
    const [zoom, setZoom] = useState(0);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [activeFragment, setActiveFragment] = useState<LabFragment | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef(0);

    // Smooth zoom target with exponential easing
    const targetZoomRef = useRef(0);
    const rafRef = useRef<number>(0);

    const animateZoom = useCallback(function animateZoomLoop() {
        const diff = targetZoomRef.current - zoomRef.current;
        if (Math.abs(diff) > 0.0005) {
            zoomRef.current += diff * 0.08;
            setZoom(Number(zoomRef.current.toFixed(4)));
            rafRef.current = requestAnimationFrame(animateZoomLoop);
        } else {
            zoomRef.current = targetZoomRef.current;
            setZoom(targetZoomRef.current);
        }
    }, []);

    // Wheel handler — only active inside the container
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            // Prevent page scroll only when inside brain viz
            e.preventDefault();
            const delta = e.deltaY * 0.0008 * (settings.brainZoomDepth ?? 1.5);
            targetZoomRef.current = Math.min(1, Math.max(0, targetZoomRef.current + delta));
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(animateZoom);
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [animateZoom, settings.brainZoomDepth]);

    // Mouse tracking for fragment hover
    const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, []);

    const onMouseLeave = useCallback(() => setMousePos(null), []);

    const canvasConfig: BrainCanvasConfig = {
        symbols: settings.brainSymbols ?? DEFAULT_SYMBOLS,
        equations: settings.brainEquations ?? DEFAULT_EQUATIONS,
        words: settings.orbitKeywords ?? DEFAULT_WORDS,
        density: settings.brainDensity ?? 1.0,
        zoomDepth: settings.brainZoomDepth ?? 1.5,
        labFragments: settings.labFragments,
        onFragmentClick: (idx) => {
            if (settings.labFragments[idx]) setActiveFragment(settings.labFragments[idx]);
        },
    };

    return (
        <>
            {/* Container — captures wheel events, tracks mouse */}
            <div
                ref={containerRef}
                className="relative select-none"
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                title="Scroll to zoom into the structure"
            >
                <BrainCanvas config={canvasConfig} zoom={zoom} mousePos={mousePos} />

                {/* Scroll hint — visible only at default zoom */}
                {zoom < 0.05 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none"
                        style={{ opacity: 0.3 }}>
                        <p className="mono text-[0.55rem] tracking-[0.22em] uppercase text-[var(--text-dim)]">
                            scroll to zoom
                        </p>
                    </div>
                )}

                <ZoomIndicator zoom={zoom} />
            </div>

            {/* Fragment modal */}
            {activeFragment && (
                <FragmentModal fragment={activeFragment} onClose={() => setActiveFragment(null)} />
            )}
        </>
    );
}
