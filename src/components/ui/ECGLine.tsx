"use client";

/**
 * ECGLine.tsx
 *
 * A continuously scrolling ECG/heartbeat waveform drawn on a Canvas element.
 * Designed to sit below the hero description text as a subtle scientific-aesthetic
 * UI element. Fully separate from the WebGL brain visualization.
 *
 * Features:
 *   - Realistic ECG shape: baseline → P-wave → QRS complex → T-wave → baseline
 *   - One heartbeat every 2 seconds (0.5 Hz)
 *   - Color: rgb(210,180,80) with very subtle shadow glow
 *   - Stroke width 1.2px
 *   - Loops continuously, runs independently of any other canvas
 *   - Hydration-safe: animation starts inside useEffect (client only)
 */

import { useRef, useEffect } from "react";

// ── ECG shape ─────────────────────────────────────────────────────────────────
// t ∈ [0, 1] → displacement in pixels (centre = 0, spike upward = negative y)
// One full cardiac cycle:  flat → P → Q → R (spike) → S → T → flat
function ecgSample(t: number): number {
    const g = (mu: number, s: number) => Math.exp(-0.5 * ((t - mu) / s) ** 2);
    return (
        g(0.13, 0.040) * 0.25   // P-wave   (+small)
        - g(0.41, 0.010) * 0.20  // Q dip    (−small)
        + g(0.45, 0.016) * 1.00  // R spike  (+large, the dominant peak)
        - g(0.49, 0.010) * 0.25  // S dip    (−small)
        + g(0.75, 0.068) * 0.35  // T-wave   (+medium)
    );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface ECGLineProps {
    /** Visible width in css pixels (default: 340) */
    width?: number;
    /** Visible height in css pixels (default: 52) */
    height?: number;
    /** Seconds per heartbeat cycle (default: 2.0) */
    periodSec?: number;
    /** Peak-to-baseline amplitude in css pixels (default: 18) */
    amplitude?: number;
    /** CSS class names to forward to the wrapper div */
    className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ECGLine({
    width = 340,
    height = 52,
    periodSec = 2.0,
    amplitude = 18,
    className = "",
}: ECGLineProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d")!;
        const dpr = window.devicePixelRatio || 1;

        // Back the canvas pixel buffer at device resolution
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        let dead = false;
        const startTs = performance.now();

        function draw(ts: number) {
            if (dead) return;

            const c = canvas!;
            const W = c.width / dpr;
            const H = c.height / dpr;
            const cy = H / 2;           // vertical centre
            const tSec = (ts - startTs) / 1000;
            // Normalised phase advances at 1/periodSec Hz
            const phase = tSec / periodSec;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);

            // ── Subtle baseline glow (very dim) ──────────────────────────────
            ctx.save();
            ctx.strokeStyle = "rgba(210,180,80,0.06)";
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(W, cy);
            ctx.stroke();
            ctx.restore();

            // ── ECG waveform ──────────────────────────────────────────────────
            ctx.save();
            ctx.strokeStyle = "rgb(210,180,80)";
            ctx.lineWidth = 1.2;
            ctx.shadowColor = "rgba(210,180,80,0.45)";
            ctx.shadowBlur = 7;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";

            ctx.beginPath();
            const STEP = 1.5; // px per sample — balance between quality and perf
            for (let x = 0; x <= W; x += STEP) {
                // Map x position into a phase offset so the waveform scrolls
                // continuously from left to right as tSec increases.
                // We want the waveform to appear to flow left, so we subtract the
                // time offset from the x-phase.
                const xPhase = (x / W) - phase;
                // Wrap into [0, 1)
                const t = ((xPhase % 1) + 1) % 1;
                const wy = cy - ecgSample(t) * amplitude;
                if (x === 0) {
                    ctx.moveTo(x, wy);
                } else {
                    ctx.lineTo(x, wy);
                }
            }
            ctx.stroke();
            ctx.restore();

            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);
        return () => {
            dead = true;
            cancelAnimationFrame(rafRef.current);
        };

    }, [width, height, periodSec, amplitude]);

    return (
        <div
            className={className}
            aria-hidden="true"
            style={{ lineHeight: 0 }}  // prevent inline block gap
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    display: "block",
                    opacity: 0.80,
                }}
            />
        </div>
    );
}
