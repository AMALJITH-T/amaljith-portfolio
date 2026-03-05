"use client";

import { useRef, useEffect } from "react";

/**
 * BackgroundScientificOverlay.tsx
 *
 * A subtle, academic-style scientific diagram overlay for the hero background.
 * Draws intersecting circular orbits, triangle construction lines, and a faint
 * polar/Cartesian coordinate grid.
 *
 * Designed to have extremely low opacity (<10%) so it doesn't distract from
 * the main content, but adds a sense of precision and computational research.
 * Entirely rendered via a single static Canvas (drawn once) for zero overhead.
 */

export function BackgroundScientificOverlay() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;

        const draw = () => {
            const rect = canvas.getBoundingClientRect();
            // Prevent drawing if width/height is 0
            if (rect.width === 0 || rect.height === 0) return;

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const W = canvas.width;
            const H = canvas.height;
            const CX = W * 0.7; // Position focal point under the right-side brain area
            const CY = H * 0.5;

            ctx.clearRect(0, 0, W, H);

            // Very subtle gold/white tone for scientific lines
            ctx.strokeStyle = "rgba(200, 180, 120, 0.04)";
            ctx.lineWidth = 1 * dpr;

            // 1. Cartesian Grid lines (faint)
            ctx.beginPath();
            const gridSize = 100 * dpr;
            for (let x = (CX % gridSize); x < W; x += gridSize) {
                ctx.moveTo(x, 0); ctx.lineTo(x, H);
            }
            for (let y = (CY % gridSize); y < H; y += gridSize) {
                ctx.moveTo(0, y); ctx.lineTo(W, y);
            }
            ctx.stroke();

            // 2. Main focal crosshairs
            ctx.strokeStyle = "rgba(200, 180, 120, 0.07)";
            ctx.beginPath();
            ctx.moveTo(CX, 0); ctx.lineTo(CX, H);
            ctx.moveTo(0, CY); ctx.lineTo(W, CY);
            ctx.stroke();

            // 3. Circular orbits (polar alignment around focal point)
            ctx.beginPath();
            const step = 200 * dpr;
            for (let r = step; r < Math.max(W, H) * 1.5; r += step) {
                ctx.arc(CX, CY, r, 0, Math.PI * 2);
            }
            ctx.stroke();

            // 4. Triangle construction lines / Diagonals
            ctx.beginPath();
            const len = Math.max(W, H) * 2;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) { // 30-degree increments
                ctx.moveTo(CX, CY);
                ctx.lineTo(CX + Math.cos(a) * len, CY + Math.sin(a) * len);
            }
            ctx.stroke();

            // 5. Connecting chord/tangent lines
            ctx.beginPath();
            ctx.strokeStyle = "rgba(200, 180, 120, 0.05)";
            const p1x = CX + Math.cos(Math.PI / 4) * step;
            const p1y = CY + Math.sin(Math.PI / 4) * step;
            const p2x = CX + Math.cos(-Math.PI / 4) * step * 2;
            const p2y = CY + Math.sin(-Math.PI / 4) * step * 2;
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.stroke();
        };

        draw();

        // Handle resize
        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(draw, 100);
        };
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);

    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none z-0 mix-blend-screen"
        />
    );
}
