"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * ScrollInsightPulse
 * Wraps a section in an IntersectionObserver.
 * On first entry, fires a one-shot golden horizontal sweep across the top edge.
 * prefers-reduced-motion: skips animation entirely.
 */
export function ScrollInsightPulse({ children, className }: { children: React.ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [fired, setFired] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (!ref.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !fired) {
                    setVisible(true);
                    setFired(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [fired]);

    return (
        <div ref={ref} className={`relative ${className ?? ""}`}>
            {/* One-shot gold sweep — appears on first scroll-into-view */}
            {visible && (
                <motion.div
                    aria-hidden="true"
                    className="absolute top-0 left-0 w-full pointer-events-none"
                    style={{
                        height: "1px",
                        background:
                            "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.6) 40%, rgba(212,175,55,0.8) 50%, rgba(212,175,55,0.6) 60%, transparent 100%)",
                        zIndex: 2,
                        filter: "blur(0.5px)",
                    }}
                    initial={{ scaleX: 0, opacity: 0, originX: 0 }}
                    animate={{ scaleX: 1, opacity: [0, 1, 0] }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                />
            )}
            {children}
        </div>
    );
}
