"use client";

import { useScroll, useTransform, motion } from "framer-motion";

/**
 * GoldenLine
 * ──────────
 * A single ultra-thin champagne-gold Bézier line that slowly "travels"
 * across the page as the user scrolls. Opacity never exceeds 0.12.
 * Implemented via strokeDashoffset animation tied to scrollYProgress.
 *
 * Rendered as fixed-position, behind all content (z-1).
 * Transform-driven motion — opacity is a secondary softener only.
 */
export function GoldenLine() {
    const { scrollYProgress } = useScroll();

    // Total dash length matches the path length (approx 2200px for this curve)
    const DASH_LEN = 2200;

    // As user scrolls 0→100%, the line "draws" from start to end
    const dashOffset = useTransform(scrollYProgress, [0, 1], [DASH_LEN, 0]);

    // Opacity: present from 0, fades near the very end of the page
    const opacity = useTransform(
        scrollYProgress,
        [0, 0.05, 0.8, 1],
        [0, 0.11, 0.09, 0.04]
    );

    return (
        <motion.div
            className="fixed inset-0 pointer-events-none z-[1]"
            style={{ opacity }}
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 1440 900"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                preserveAspectRatio="none"
            >
                {/*
                    A single gentle S-curve that sweeps across the viewport:
                    starts bottom-left, arches through center-right,
                    finishes upper-right. Feels like a golden thread drifting.
                */}
                <motion.path
                    d="M -80 820 C 240 640, 600 720, 860 480 S 1200 120, 1540 60"
                    stroke="#c29b27"
                    strokeWidth="0.65"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={DASH_LEN}
                    style={{ strokeDashoffset: dashOffset }}
                />
            </svg>
        </motion.div>
    );
}
