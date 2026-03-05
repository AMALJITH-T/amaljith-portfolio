"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { SiteConfig } from "@/lib/types";
import { defaultSiteConfig } from "@/lib/data";

export function GoldenMotionLines() {
    const pathname = usePathname();
    const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
    // Ambient drift state — one faint line every 20–40 seconds
    const [driftActive, setDriftActive] = useState(false);
    const [driftStyle, setDriftStyle] = useState({ top: "50%", rotate: "0deg" });
    const driftRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    useEffect(() => {
        fetch("/api/config")
            .then((r) => r.json())
            .then((data: SiteConfig) => setConfig(data))
            .catch(() => { /* use default */ });
    }, []);

    // Ambient drift scheduler — fires once, then reschedules
    useEffect(() => {
        if (prefersReduced) return;

        const schedule = () => {
            const delay = 20000 + Math.random() * 20000; // 20–40 seconds
            driftRef.current = setTimeout(() => {
                setDriftStyle({
                    top: `${25 + Math.random() * 50}%`,
                    rotate: `${-15 + Math.random() * 30}deg`
                });
                setDriftActive(true);
                // On-screen for 3.5s then reset and reschedule
                setTimeout(() => {
                    setDriftActive(false);
                    schedule();
                }, 3500);
            }, delay);
        };

        schedule();
        return () => { if (driftRef.current) clearTimeout(driftRef.current); };
    }, [prefersReduced]);

    // Do not show on home or admin pages
    if (pathname === "/" || pathname.startsWith("/admin")) return null;

    const globalSpeed = config.goldenLineSpeed > 0 ? config.goldenLineSpeed : 1;
    const baseDuration = 18;
    const duration = baseDuration / globalSpeed;

    return (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden" aria-hidden="true">

            {/* Primary Metro Line */}
            <motion.div
                className="absolute"
                style={{
                    top: "30%",
                    left: "-20%",
                    width: "140%",
                    height: "1px",
                    background: "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.18) 40%, rgba(212,175,55,0.25) 50%, rgba(212,175,55,0.18) 60%, transparent 100%)",
                    filter: "blur(0.5px)",
                    rotate: "12deg",
                    transformOrigin: "center center",
                }}
                animate={{ x: ["-40%", "40%", "-40%"], opacity: [0, 0.8, 0] }}
                transition={{ duration, ease: "linear", repeat: Infinity }}
            />

            {/* Secondary Counter-rotating Line */}
            <motion.div
                className="absolute"
                style={{
                    top: "70%",
                    left: "-20%",
                    width: "140%",
                    height: "1px",
                    background: "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.12) 40%, rgba(212,175,55,0.18) 50%, rgba(212,175,55,0.12) 60%, transparent 100%)",
                    filter: "blur(0.8px)",
                    rotate: "-8deg",
                    transformOrigin: "center center",
                }}
                animate={{ x: ["30%", "-30%", "30%"], opacity: [0, 0.6, 0] }}
                transition={{ duration: duration * 1.3, ease: "linear", repeat: Infinity, delay: duration * 0.2 }}
            />

            {/* Ambient Drift Line — faint diagonal, fires every 20–40s, one at a time */}
            <AnimatePresence>
                {driftActive && (
                    <motion.div
                        key="ambient-drift"
                        className="absolute"
                        style={{
                            top: driftStyle.top,
                            left: "-10%",
                            width: "120%",
                            height: "1px",
                            background: "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.10) 35%, rgba(212,175,55,0.14) 50%, rgba(212,175,55,0.10) 65%, transparent 100%)",
                            filter: "blur(1px)",
                            rotate: driftStyle.rotate,
                        }}
                        initial={{ x: "-60%", opacity: 0 }}
                        animate={{ x: "60%", opacity: [0, 1, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 3.2, ease: "linear" }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
