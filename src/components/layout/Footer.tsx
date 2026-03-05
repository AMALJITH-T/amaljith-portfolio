"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Github, Linkedin, Mail } from "lucide-react";
import { SiteSettings, defaultSiteSettings } from "@/lib/types";
import { loadSiteSettings } from "@/lib/settingsLoader";

import { motion } from "framer-motion";

export function Footer() {
    const [s, setS] = useState<SiteSettings>(defaultSiteSettings);

    useEffect(() => {
        loadSiteSettings()
            .then((data: SiteSettings) => setS(data))
            .catch(() => { /* use default */ });
    }, []);

    return (
        <footer className="relative bg-[#070707] border-t border-[rgba(212,175,55,0.15)] overflow-hidden min-h-[120px] flex items-center shrink-0 w-full z-10">
            {/* Animated Scanning Line Tracker */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] opacity-60">
                <motion.div
                    animate={{ left: ["-100%", "100%"] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent shadow-[0_0_12px_var(--accent-gold)]"
                />
            </div>

            <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-8 flex flex-col lg:flex-row items-center justify-between gap-6">

                {/* 1. System Status */}
                <div className="flex flex-col gap-1 w-full lg:w-1/3 text-center lg:text-left">
                    <p className="mono text-[9px] tracking-[0.2em] text-[var(--accent-gold)] opacity-70 uppercase">
                        System Status
                    </p>
                    <div className="flex items-center justify-center lg:justify-start gap-2 mt-1">
                        <div className="w-[5px] h-[5px] rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] shrink-0"
                            style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                        <p className="mono text-[11px] text-[var(--text-dim)] tracking-wide">
                            All neural connections stable. Awaiting logical input_
                        </p>
                    </div>
                </div>

                {/* 2. Standard Links */}
                <div className="flex items-center justify-center gap-8 w-[100%] lg:w-1/3">
                    <a
                        href="https://github.com/AMALJITH-T"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-400 group relative"
                        aria-label="GitHub"
                    >
                        <Github size={17} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
                    </a>
                    <a
                        href="https://www.linkedin.com/in/amaljith-thadathil/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-400 group relative"
                        aria-label="LinkedIn"
                    >
                        <Linkedin size={17} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
                    </a>
                    <a
                        href={s.contactEmail ? `mailto:${s.contactEmail}` : "mailto:amal2004t@gmail.com"}
                        className="text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-400 group relative"
                        aria-label="Email"
                    >
                        <Mail size={17} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
                    </a>
                    <Link
                        href="/privacy"
                        className="text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-400 mono text-xs uppercase tracking-widest"
                    >
                        Privacy Policy
                    </Link>
                </div>

                {/* 3. Copyright */}
                <div className="w-full lg:w-1/3 flex justify-center lg:justify-end">
                    <p className="mono text-[10px] text-[var(--text-dim)] tracking-widest opacity-60">
                        © 2026 Amaljith Nair
                    </p>
                </div>
            </div>
        </footer>
    );
}
