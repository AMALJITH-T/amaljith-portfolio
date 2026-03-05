"use client";

import { motion } from "framer-motion";

/**
 * SVGSignalTrace.tsx
 *
 * A subtle, looping SVG path animation representing a biosignal trace.
 * Features an ECG-like `__/\____/\__` structure rendered with extremely
 * low opacity and a slow, purposeful GSAP/Framer animation.
 *
 * Required by design constraints: Must be SVG (not canvas), must NOT follow
 * the cursor, must loop infinitely. Used as section separators and subtle accents.
 */

interface SVGSignalTraceProps {
    width?: number | string;
    height?: number;
    color?: string;
    opacity?: number;
    duration?: number;
    className?: string;
}

export function SVGSignalTrace({
    width = "100%",
    height = 40,
    color = "#c29b27", // Muted Gold
    opacity = 0.25,
    duration = 4.0, // Slow loop
    className = "",
}: SVGSignalTraceProps) {
    // A classic "__/\__" cardiac-like physiological rhythm.
    // Normalized to 1000 width, allowing vector scaling.
    const pathData = `
        M 0,20 
        L 200,20 
        C 210,20 215,5 220,-10 
        C 225,25 230,20 240,20 
        L 260,20
        C 280,20 285,-30 290,-30 
        C 295,-30 300,50 305,50 
        C 310,50 315,20 320,20 
        L 480,20
        C 490,20 495,30 500,40
        C 505,50 510,20 520,20
        L 700,20
        C 710,20 715,-10 720,-10
        C 725,25 730,20 740,20
        L 1000,20
    `;

    // To create an infinite continuous trace, we use strokeDasharray and strokeDashoffset.
    // The path length here acts as the dash unit, sliding endlessly.
    // Instead of drawing the line (which has a start and end), we shift the dash offset.

    return (
        <div
            className={`flex items-center justify-center pointer-events-none overflow-hidden ${className}`}
            style={{ width, height, opacity }}
            aria-hidden="true"
        >
            <svg
                width="100%"
                height="100%"
                viewBox="0 -50 1000 100"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block", overflow: "visible" }}
            >
                {/* 1. Underlying faint baseline (keeps structural presence) */}
                <path
                    d={pathData}
                    stroke={color}
                    strokeWidth="1.6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.15}
                    vectorEffect="non-scaling-stroke"
                />

                {/* 2. Emphasized traveling pulse (SVG path drawing / sliding animation) */}
                <motion.path
                    d={pathData}
                    stroke={color}
                    strokeWidth="2.4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="150 1500" // A small lit segment navigating a large gap
                    animate={{ strokeDashoffset: [1650, 0] }} // Move backwards so the pulse travels forwards (left-to-right)
                    transition={{
                        repeat: Infinity,
                        duration: duration,
                        ease: "linear",
                    }}
                />
            </svg>
        </div>
    );
}
