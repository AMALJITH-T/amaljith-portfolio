"use client";

import { useEffect, useRef } from "react";

/**
 * useCursorParallax
 * ─────────────────
 * Tracks mouse movement and writes micro-parallax offsets to CSS custom
 * properties on `document.documentElement`. No React state — zero re-renders.
 *
 *   --cursor-px : horizontal offset in px  (range: -maxPx to +maxPx)
 *   --cursor-py : vertical offset in px    (range: -maxPx to +maxPx)
 *
 * These vars can then be consumed directly in `style` props:
 *   style={{ transform: "translate(var(--cursor-px, 0px), var(--cursor-py, 0px))" }}
 *
 * Fully respects `prefers-reduced-motion: reduce` — returns instantly if set.
 */
export function useCursorParallax(maxPx = 5) {
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        // Hard guard — never run when reduced motion is preferred
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const handleMove = (e: MouseEvent) => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

            rafRef.current = requestAnimationFrame(() => {
                // Normalise cursor position to [-1, 1] relative to viewport center
                const nx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
                const ny = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);

                document.documentElement.style.setProperty(
                    "--cursor-px",
                    `${(nx * maxPx).toFixed(2)}px`
                );
                document.documentElement.style.setProperty(
                    "--cursor-py",
                    `${(ny * maxPx).toFixed(2)}px`
                );
            });
        };

        window.addEventListener("mousemove", handleMove, { passive: true });

        return () => {
            window.removeEventListener("mousemove", handleMove);
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            // Reset vars on unmount
            document.documentElement.style.removeProperty("--cursor-px");
            document.documentElement.style.removeProperty("--cursor-py");
        };
    }, [maxPx]);
}
