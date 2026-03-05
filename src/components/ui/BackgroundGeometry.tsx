"use client";

import { useScroll, useTransform, motion } from "framer-motion";

/**
 * BackgroundGeometry
 * ──────────────────
 * Reusable fixed-position geometric background used across all public routes.
 * Slowly rotates and scales with scroll depth. Opacity stays ≤ 0.08.
 * Gold-stroke concentric geometry — atmospheric, never decorative.
 */
export function BackgroundGeometry() {
    const { scrollYProgress } = useScroll();

    const rotate = useTransform(scrollYProgress, [0, 1], [0, 60]);
    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.55]);
    const opacity = useTransform(
        scrollYProgress,
        [0, 0.07, 0.55, 1],
        [0.10, 0.07, 0.04, 0.02]
    );

    return (
        <motion.div
            className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center"
            style={{ opacity }}
            aria-hidden="true"
        >
            <motion.svg
                viewBox="0 0 1000 1000"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-[140vmax] h-[140vmax]"
                style={{ rotate, scale }}
            >
                {/* Concentric circles — three depths */}
                <circle cx="500" cy="500" r="240" stroke="#c29b27" strokeWidth="0.6" />
                <circle cx="500" cy="500" r="375" stroke="#c29b27" strokeWidth="0.4" />
                <circle cx="500" cy="500" r="490" stroke="#c29b27" strokeWidth="0.25" />

                {/* Intersecting triangles — computational / geometric motif */}
                <polygon
                    points="500,80 880,740 120,740"
                    stroke="#c29b27" strokeWidth="0.5" fill="none"
                />
                <polygon
                    points="500,920 120,260 880,260"
                    stroke="#c29b27" strokeWidth="0.3" fill="none"
                />

                {/* Crosshair axes */}
                <line x1="100" y1="500" x2="900" y2="500" stroke="#c29b27" strokeWidth="0.3" />
                <line x1="500" y1="100" x2="500" y2="900" stroke="#c29b27" strokeWidth="0.3" />

                {/* Diagonal cross — structural depth */}
                <line x1="160" y1="160" x2="840" y2="840" stroke="#c29b27" strokeWidth="0.2" />
                <line x1="840" y1="160" x2="160" y2="840" stroke="#c29b27" strokeWidth="0.2" />

                {/* Micro pulse nodes — spontaneous insight moments */}
                {/* Positions are deterministic intersections of geometry elements */}
                <circle className="geo-pulse-node" cx="500" cy="500" r="4" fill="#c29b27" style={{ animationDelay: "0s" }} />
                <circle className="geo-pulse-node" cx="500" cy="260" r="3" fill="#c29b27" style={{ animationDelay: "-2.1s" }} />
                <circle className="geo-pulse-node" cx="740" cy="630" r="3.5" fill="#c29b27" style={{ animationDelay: "-4.3s" }} />
                <circle className="geo-pulse-node" cx="260" cy="630" r="3" fill="#c29b27" style={{ animationDelay: "-6.7s" }} />
                <circle className="geo-pulse-node" cx="500" cy="740" r="2.5" fill="#c29b27" style={{ animationDelay: "-1.4s" }} />
            </motion.svg>
        </motion.div>
    );
}
