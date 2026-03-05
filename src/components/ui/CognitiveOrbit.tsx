"use client";

import { useEffect, useRef, useState } from "react";
import { defaultSiteSettings, SiteSettings } from "@/lib/types";

// Orbital parameters — unique ellipse per token slot
const ORBITS = [
    { rx: 210, ry: 90, phase: 0, period: 38, rot: -12 },
    { rx: 190, ry: 110, phase: 0.78, period: 46, rot: 8 },
    { rx: 230, ry: 80, phase: 1.57, period: 52, rot: -5 },
    { rx: 175, ry: 125, phase: 2.36, period: 41, rot: 15 },
    { rx: 220, ry: 95, phase: 3.14, period: 58, rot: -18 },
    { rx: 200, ry: 105, phase: 3.93, period: 44, rot: 6 },
    { rx: 215, ry: 85, phase: 4.71, period: 49, rot: -10 },
    { rx: 185, ry: 115, phase: 5.50, period: 63, rot: 20 },
];

export function CognitiveOrbit() {
    const containerRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<number>(0);
    const startRef = useRef<number>(0);
    const [keywords, setKeywords] = useState<string[]>(defaultSiteSettings.orbitKeywords);
    const [prefersReduced] = useState(
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    // Fetch orbit keywords from site settings
    useEffect(() => {
        fetch("/api/site/settings")
            .then((r) => r.json())
            .then((data: SiteSettings) => {
                if (data.orbitKeywords?.length) setKeywords(data.orbitKeywords);
            })
            .catch(() => { /* use default */ });
    }, []);

    useEffect(() => {
        if (prefersReduced) return;
        const container = containerRef.current;
        if (!container) return;

        const spans = Array.from(container.querySelectorAll<HTMLSpanElement>("[data-token]"));

        const tick = (now: number) => {
            if (startRef.current === 0) startRef.current = now;
            const t = (now - startRef.current) / 1000;
            spans.forEach((span, i) => {
                const o = ORBITS[i % ORBITS.length];
                const angle = (t / o.period) * Math.PI * 2 + o.phase;
                const x = Math.cos(angle) * o.rx;
                const y = Math.sin(angle) * o.ry;
                span.style.transform = `translate(${x}px, ${y}px) rotate(${o.rot}deg)`;
                span.style.opacity = String(0.045 + Math.abs(Math.sin(angle * 0.5)) * 0.065);
            });
            frameRef.current = requestAnimationFrame(tick);
        };

        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [prefersReduced, keywords]);

    if (prefersReduced) return null;

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 pointer-events-none overflow-hidden will-change-transform"
            aria-hidden="true"
            style={{ zIndex: 15 }}
        >
            <div className="absolute" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                {keywords.map((word, i) => (
                    <span
                        key={`${word}-${i}`}
                        data-token={i}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            opacity: 0.06,
                            color: "var(--accent-gold)",
                            fontFamily: "var(--font-manrope, sans-serif)",
                            fontSize: "0.62rem",
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            willChange: "transform, opacity",
                            userSelect: "none",
                        }}
                    >
                        {word}
                    </span>
                ))}
            </div>
        </div>
    );
}
