"use client";

/**
 * BiosignalCanvas.tsx — v2
 *
 * Full-hero canvas overlay (pointer-events: none) that draws:
 *   1. Ambient background biosignals — 7 very faint horizontal ECG-style
 *      waveforms scrolling slowly across the hero at 0.04–0.08 opacity.
 *   2. Brain proximity detection — fires onBrainProximity() when cursor
 *      enters the brain panel zone so BrainScene fires a neural pulse.
 *
 * NOTE: Cursor burst trails have been removed. They appeared on top of the
 * brain particle system and created visual noise. Use ECGLine for the
 * explicit waveform UI element instead.
 */

import { useRef, useEffect, RefObject } from "react";

// ── ECG waveform sample — t ∈ [0, 1] ──────────────────────────────────────────
function ecgSample(t: number): number {
    const g = (mu: number, s: number) => Math.exp(-0.5 * ((t - mu) / s) ** 2);
    return (
        g(0.13, 0.042) * 0.28   // P-wave
        - g(0.41, 0.011) * 0.18  // Q
        + g(0.45, 0.017) * 1.00  // R spike
        - g(0.49, 0.011) * 0.22  // S
        + g(0.75, 0.072) * 0.38  // T-wave
    );
}

interface AmbientLine {
    yFrac: number; phase: number; speed: number;
    amp: number; opacity: number; freq: number;
}

// Seeded PRNG — no Math.random in module scope
function seededRng(seed: number) {
    let s = seed | 0;
    return () => {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

interface BiosignalCanvasProps {
    containerRef: RefObject<HTMLDivElement | null>;
    brainPanelRef?: RefObject<HTMLDivElement | null>;
    onBrainProximity?: () => void;
}

const SIGNAL_COLOR = "220,190,90";

export function BiosignalCanvas({
    containerRef,
    brainPanelRef,
    onBrainProximity,
}: BiosignalCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef(0);
    const lastProxRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: true })!;
        const dpr = window.devicePixelRatio || 1;

        const applySize = () => {
            const r = canvas.getBoundingClientRect();
            canvas.width = Math.round(r.width * dpr);
            canvas.height = Math.round(r.height * dpr);
        };
        applySize();
        const ro = new ResizeObserver(applySize);
        ro.observe(canvas);

        // Deterministic ambient lines
        const rng = seededRng(0xB105F00D);
        const lines: AmbientLine[] = Array.from({ length: 7 }, () => ({
            yFrac: 0.06 + rng() * 0.88,
            phase: rng() * Math.PI * 2,
            speed: 0.010 + rng() * 0.015,
            amp: 7 + rng() * 13,
            opacity: 0.040 + rng() * 0.038,
            freq: 1.4 + rng() * 2.4,
        }));

        // Proximity detection only — no burst tracking
        let dead = false;
        const onMouseMove = (e: MouseEvent) => {
            if (!onBrainProximity || !brainPanelRef?.current) return;
            const br = brainPanelRef.current.getBoundingClientRect();
            const bx = (br.left + br.right) / 2;
            const by = (br.top + br.bottom) / 2;
            const dx = e.clientX - bx;
            const dy = e.clientY - by;
            const now = performance.now();
            if (Math.sqrt(dx * dx + dy * dy) < 200 && now - lastProxRef.current > 3000) {
                lastProxRef.current = now;
                onBrainProximity();
            }
        };

        const container = containerRef.current;
        container?.addEventListener("mousemove", onMouseMove, { passive: true });

        // Animation loop
        function draw(ts: number) {
            if (dead) return;
            const c = canvas!;
            const W = c.width / dpr;
            const H = c.height / dpr;
            const tSec = ts / 1000;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);

            for (const ln of lines) {
                const y0 = ln.yFrac * H;
                ctx.save();
                ctx.strokeStyle = `rgba(${SIGNAL_COLOR},${ln.opacity})`;
                ctx.lineWidth = 0.75;
                ctx.shadowColor = `rgba(${SIGNAL_COLOR},${ln.opacity * 0.55})`;
                ctx.shadowBlur = 3;
                ctx.beginPath();
                for (let x = 0; x <= W; x += 2) {
                    const ph = ((x / W * 3.5 * ln.freq) + tSec * ln.speed + ln.phase) % 1;
                    const wy = y0 + ecgSample(ph) * ln.amp;
                    if (x === 0) {
                        ctx.moveTo(x, wy);
                    } else {
                        ctx.lineTo(x, wy);
                    }
                }
                ctx.stroke();
                ctx.restore();
            }

            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);

        return () => {
            dead = true;
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
            container?.removeEventListener("mousemove", onMouseMove);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                pointerEvents: "none",
                zIndex: 2,
            }}
        />
    );
}
