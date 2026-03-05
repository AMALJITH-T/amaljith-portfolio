"use client";

/**
 * BrainCanvas.tsx
 * Canvas 2D renderer for the Semantic Brain Visualization Engine.
 * rAF loop: zero React state mutations during animation.
 * All math in TypeScript, all drawing in 2D canvas context.
 */

import { useEffect, useRef } from "react";
import { generateBrainPoints, inBrain, brainDepth } from "./brainShape";
import { buildTokenPool, TokenSpec } from "./symbolPool";
import { vectorAt, noiseAt } from "./vectorField";
import type { LabFragment } from "@/lib/types";

// ── Config passed from parent ────────────────────────────────────────────────
export interface BrainCanvasConfig {
    symbols: string[];
    equations: string[];
    words: string[];
    density: number;       // multiplier on base count (0.5 – 2.0)
    zoomDepth: number;     // scroll sensitivity multiplier (1.0 – 3.0)
    labFragments: LabFragment[];
    onFragmentClick: (index: number) => void;
}

// ── Token runtime state ───────────────────────────────────────────────────────
interface Token {
    // Normalized position in [-1, 1]
    nx: number; ny: number;
    // Initial position (spring target)
    inx: number; iny: number;
    // Velocity in normalized space
    vx: number; vy: number;
    // Display
    text: string;
    layer: 1 | 2 | 3;
    size: number;         // font size in CSS px (before DPR scale)
    phase: number;        // per-token phase offset for oscillation
    fragmentIdx: number;  // -1 = not a fragment anchor; 0-3 = fragment
    depth: number;        // 0 center → 1 edge (used for per-point opacity)
}

// ── Canvas sizing ─────────────────────────────────────────────────────────────
const BASE_W = 560, BASE_H = 480;
// Map normalized [-1, 1] → canvas pixel
function toPixel(n: number, size: number, margin: number): number {
    return margin + (n + 1) * 0.5 * (size - margin * 2);
}
function nxToX(nx: number): number { return toPixel(nx, BASE_W, 28); }
function nyToY(ny: number): number { return toPixel(ny, BASE_H, 28); }
// Pixel back to normalized
// function xToNx(x: number): number { return (x - 28) / (BASE_W - 56) * 2 - 1; }
// function yToNy(y: number): number { return (y - 28) / (BASE_H - 56) * 2 - 1; }

// ── Build token list from brain points ───────────────────────────────────────
function buildTokens(
    cfg: BrainCanvasConfig,
): Token[] {
    const count = Math.round(2400 * Math.max(0.4, Math.min(2.0, cfg.density)));
    const brainPoints = generateBrainPoints(count);
    const tokenSpecs = buildTokenPool(cfg.symbols, cfg.equations, cfg.words, count);

    // Fragment anchors: pick 4 mid-depth interior points for lab fragment links
    const midPoints = brainPoints.filter(p => p.layer === 2).slice(0, 4);

    return brainPoints.map((pt, i) => {
        const spec: TokenSpec = tokenSpecs[i % tokenSpecs.length];
        const isFrag = midPoints.indexOf(pt);
        return {
            nx: pt.nx, ny: pt.ny,
            inx: pt.nx, iny: pt.ny,
            vx: 0, vy: 0,
            text: isFrag >= 0 && cfg.labFragments[isFrag]
                ? `[${cfg.labFragments[isFrag].caption.slice(0, 12)}]`
                : spec.text,
            layer: isFrag >= 0 ? 2 : pt.layer,
            size: isFrag >= 0 ? 7 : spec.size,
            phase: pt.angle + i * 0.031,
            fragmentIdx: isFrag,
            depth: pt.depth,
        };
    });
}

// ── Main component ────────────────────────────────────────────────────────────
export function BrainCanvas({
    config,
    zoom,
    mousePos,
}: {
    config: BrainCanvasConfig;
    zoom: number;        // 0.0 – 1.0 from parent wheel handler
    mousePos: { x: number; y: number } | null; // canvas-local coords
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tokensRef = useRef<Token[]>([]);
    const frameRef = useRef<number>(0);
    const zoomRef = useRef(zoom);
    const mousePosRef = useRef(mousePos);
    const cfgRef = useRef(config);

    // Keep refs in sync without triggering re-renders
    zoomRef.current = zoom;
    mousePosRef.current = mousePos;
    cfgRef.current = config;

    // ── Initialise tokens ────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = BASE_W * dpr;
        canvas.height = BASE_H * dpr;
        canvas.style.width = `${BASE_W}px`;
        canvas.style.height = `${BASE_H}px`;

        const tokens = buildTokens(config);
        tokensRef.current = tokens;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.density, config.symbols.join(","), config.equations.join(","), config.words.join(",")]);

    // ── rAF animation loop ────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        let t = 0;

        // Precompute: gold colour components for perf
        const GOLD = "rgba(212,175,55,";
        const WHITE = "rgba(237,237,237,";

        const draw = () => {
            t += 0.008;
            const tokens = tokensRef.current;
            const z = zoomRef.current;
            const mpos = mousePosRef.current;
            const cfg = cfgRef.current;

            // Layer alphas as function of zoom
            // L1 peaks at z=0, fades above 0.45
            const l1a = Math.max(0, 1 - z / 0.40);
            // L2 fades in at z=0.30, peaks at z=0.55, fades above 0.85
            const l2a = Math.min(Math.max(0, (z - 0.28) / 0.22), 1) * Math.max(0, 1 - (z - 0.68) / 0.20);
            // L3 fades in at z=0.60, peaks and stays above
            const l3a = Math.min(Math.max(0, (z - 0.58) / 0.22), 1);

            // Camera zoom transform: simulate flying forward
            const camScale = 1 + z * cfg.zoomDepth * 1.8;
            // Offset to keep center stable
            const cx = (BASE_W * dpr) / 2;
            const cy = (BASE_H * dpr) / 2;

            ctx.clearRect(0, 0, BASE_W * dpr, BASE_H * dpr);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(camScale * dpr, camScale * dpr);
            ctx.translate(-BASE_W / 2, -BASE_H / 2);

            // ── Physics update + draw in one pass (no double-loop) ───────────
            for (let i = 0; i < tokens.length; i++) {
                const tk = tokens[i];

                // Determine layer alpha
                const la = tk.layer === 1 ? l1a : tk.layer === 2 ? l2a : l3a;
                if (la < 0.005) continue;

                // ── Physics ──────────────────────────────────────────────────
                // Spring toward initial position (keeps brain shape)
                const dxI = (tk.inx - tk.nx) * 0.0004;
                const dyI = (tk.iny - tk.ny) * 0.0004;

                // Vector field drift
                const vf = vectorAt(tk.nx, tk.ny);
                const speed = tk.layer === 3 ? 0.0006 : tk.layer === 2 ? 0.0003 : 0.00015;

                // Layer 3 gets noise-based drift for particle feel
                const noise = tk.layer === 3 ? noiseAt(tk.nx, tk.ny, t) : { fx: 0, fy: 0 };
                const noiseFactor = tk.layer === 3 ? 0.0004 : 0;

                tk.vx = (tk.vx + dxI + vf.fx * speed + noise.fx * noiseFactor) * 0.94;
                tk.vy = (tk.vy + dyI + vf.fy * speed + noise.fy * noiseFactor) * 0.94;
                tk.nx += tk.vx;
                tk.ny += tk.vy;

                // Clamp: bounce back if drifted outside brain
                if (!inBrain(tk.nx, tk.ny)) {
                    const bFrac = Math.max(0, 1 - brainDepth(tk.nx, tk.ny));
                    tk.nx = tk.nx * 0.85 + tk.inx * 0.15 * bFrac;
                    tk.ny = tk.ny * 0.85 + tk.iny * 0.15 * bFrac;
                    tk.vx *= -0.5;
                    tk.vy *= -0.5;
                }

                // ── Draw ─────────────────────────────────────────────────────
                const px = nxToX(tk.nx);
                const py = nyToY(tk.ny);

                // Per-token opacity: surface tokens are slightly brighter
                const depthOpa = 0.06 + tk.depth * 0.10;
                // Oscillation
                const osc = 0.5 + 0.5 * Math.sin(t * 0.8 + tk.phase);
                const opa = la * (depthOpa + osc * 0.03);

                // Fragment anchors get extra highlight in Layer 2+
                const isFrag = tk.fragmentIdx >= 0;
                const nearMouse = isFrag && mpos
                    ? Math.sqrt((px - mpos.x / (camScale)) ** 2 + (py - mpos.y / (camScale)) ** 2) < 24
                    : false;

                if (nearMouse) {
                    // Highlighted fragment: bright gold ring
                    ctx.save();
                    ctx.strokeStyle = `${GOLD}0.5)`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.arc(px, py, 10, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }

                // Font — batch by layer to minimize state changes
                const fontSize = tk.size;
                const fontFamily = tk.layer === 1
                    ? "var(--font-cormorant, Georgia, serif)"
                    : "var(--font-jetbrains, monospace)";
                ctx.font = `${tk.layer === 1 ? "400" : "300"} ${fontSize}px ${fontFamily}`;

                // Layer 1: gold symbols; Layer 2: off-white equations; Layer 3: dim
                const colBase = tk.layer === 1 ? GOLD : WHITE;
                ctx.fillStyle = `${colBase}${Math.min(1, opa).toFixed(3)})`;
                ctx.fillText(tk.text, px, py);
            }

            // ── Connection lines between nearby Layer-2 tokens in L2 zoom ──
            if (l2a > 0.15) {
                const l2tokens = tokens.filter(t => t.layer === 2).slice(0, 60);
                ctx.globalAlpha = l2a * 0.08;
                ctx.strokeStyle = `${GOLD}1)`;
                ctx.lineWidth = 0.3;
                for (let i = 0; i < l2tokens.length; i += 3) {
                    const a = l2tokens[i], b = l2tokens[i + 1];
                    if (!a || !b) continue;
                    const dist = Math.sqrt((a.nx - b.nx) ** 2 + (a.ny - b.ny) ** 2);
                    if (dist < 0.22) {
                        ctx.beginPath();
                        ctx.moveTo(nxToX(a.nx), nyToY(a.ny));
                        ctx.lineTo(nxToX(b.nx), nyToY(b.ny));
                        ctx.stroke();
                    }
                }
                ctx.globalAlpha = 1;
            }

            ctx.restore();
            frameRef.current = requestAnimationFrame(draw);
        };

        // Respect prefers-reduced-motion
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            // Draw one static frame then stop
            draw();
            return;
        }

        frameRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(frameRef.current);
    }, []);

    // ── Hit-test on click for fragment anchors ────────────────────────────────
    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const z = zoomRef.current;
        if (z < 0.55) return; // only active in Layer 2+

        const camScale = 1 + z * cfgRef.current.zoomDepth * 1.8;
        const mx = (e.clientX - rect.left) / camScale;
        const my = (e.clientY - rect.top) / camScale;

        const tokens = tokensRef.current;
        for (const tk of tokens) {
            if (tk.fragmentIdx < 0) continue;
            const px = nxToX(tk.nx);
            const py = nyToY(tk.ny);
            if (Math.sqrt((px - mx) ** 2 + (py - my) ** 2) < 22) {
                config.onFragmentClick(tk.fragmentIdx);
                return;
            }
        }
    };

    return (
        <canvas
            ref={canvasRef}
            onClick={handleClick}
            aria-label="Interactive brain visualization — mathematical structures form a brain silhouette"
            style={{
                display: "block",
                cursor: zoom > 0.55 ? "crosshair" : "default",
                willChange: "transform",
            }}
        />
    );
}
