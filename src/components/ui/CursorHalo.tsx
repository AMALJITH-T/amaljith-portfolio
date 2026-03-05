"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CursorHalo
 * Follows the cursor and emits a radial gold glow ONLY when over
 * research-interactive elements (those with data-research-hover).
 * Uses GPU-only transform — no layout thrash.
 */
export function CursorHalo() {
    const haloRef = useRef<HTMLDivElement>(null);
    const visibleRef = useRef(false);
    const frameRef = useRef<number>(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        let mx = -500, my = -500;

        const onMove = (e: MouseEvent) => {
            mx = e.clientX;
            my = e.clientY;

            // Detect hover over research elements
            const target = document.elementFromPoint(mx, my);
            const onResearch = !!(target?.closest("[data-research-hover]"));

            if (onResearch !== visibleRef.current) {
                visibleRef.current = onResearch;
                if (haloRef.current) {
                    haloRef.current.style.opacity = onResearch ? "1" : "0";
                }
            }
        };

        const tick = () => {
            if (haloRef.current) {
                // -50% centres the 160px halo on cursor
                haloRef.current.style.transform = `translate(${mx - 80}px, ${my - 80}px)`;
            }
            frameRef.current = requestAnimationFrame(tick);
        };

        window.addEventListener("mousemove", onMove, { passive: true });
        frameRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener("mousemove", onMove);
            cancelAnimationFrame(frameRef.current);
        };
    }, [mounted]);

    if (!mounted) return null;

    return (
        <div
            ref={haloRef}
            aria-hidden="true"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: 160,
                height: 160,
                borderRadius: "50%",
                background:
                    "radial-gradient(circle, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.04) 50%, transparent 75%)",
                filter: "blur(28px)",
                pointerEvents: "none",
                zIndex: 9999,
                opacity: 0,
                transition: "opacity 0.4s ease",
                willChange: "transform, opacity",
                transform: "translate(-500px, -500px)",
            }}
        />
    );
}
