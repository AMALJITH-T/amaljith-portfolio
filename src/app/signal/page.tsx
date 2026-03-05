"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { SpotlightChat } from "@/components/ui/SpotlightChat";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { BackgroundGeometry } from "@/components/ui/BackgroundGeometry";
import { Mail, Github, Linkedin } from "lucide-react";
import { Profile, SiteConfig } from "@/lib/types";
import { defaultProfile, defaultSiteConfig } from "@/lib/data";
import { loadSiteConfig } from "@/lib/settingsLoader";

const SPRING = { type: "spring", stiffness: 220, damping: 24 } as const;

// ─── Precision helper ─────────────────────────────────────────────────────────
// Rounds to 3 d.p. so Node.js (SSR) and browser produce identical strings.
function rnd(n: number) { return Math.round(n * 1000) / 1000; }

// ─── Module-scope ScientificMesh geometry ────────────────────────────────────
// All coordinates computed once at module load, fully rounded.
// Zero math inside any React component → hydration-safe.
const SM = (() => {
    const W = 360, H = 480;
    const GCOLS = 7, GROWS = 9;

    type Pt = { x: number; y: number };
    type Seg = { x1: number; y1: number; x2: number; y2: number };

    // Build warped manifold grid
    const pts: Pt[][] = [];
    for (let row = 0; row < GROWS; row++) {
        pts[row] = [];
        for (let col = 0; col < GCOLS; col++) {
            const u = col / (GCOLS - 1);
            const v = row / (GROWS - 1);
            const warpX = Math.sin(v * Math.PI) * 28 * (u - 0.5);
            const warpY = Math.cos(u * Math.PI * 0.8) * 14 * (v - 0.5);
            pts[row][col] = {
                x: rnd(28 + u * (W - 56) + warpX),
                y: rnd(32 + v * (H - 64) + warpY),
            };
        }
    }

    // Horizontal + vertical grid edges
    const grid: Seg[] = [];
    for (let row = 0; row < GROWS; row++)
        for (let col = 0; col < GCOLS - 1; col++) {
            const a = pts[row][col], b = pts[row][col + 1];
            grid.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        }
    for (let col = 0; col < GCOLS; col++)
        for (let row = 0; row < GROWS - 1; row++) {
            const a = pts[row][col], b = pts[row + 1][col];
            grid.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        }

    // Sparse structural diagonals — research cross-connections
    const diags: Seg[] = [];
    const dPairs: [number, number, number, number][] = [
        [0, 0, 2, 2], [0, 2, 2, 4], [0, 4, 2, 6],
        [2, 0, 4, 2], [2, 2, 4, 4], [2, 4, 4, 6],
        [4, 0, 6, 2], [4, 2, 6, 4], [4, 4, 6, 6],
        [1, 1, 3, 3], [1, 3, 3, 5], [3, 1, 5, 3], [3, 3, 5, 5],
        [0, 6, 3, 8], [3, 6, 6, 8],
    ];
    for (const [r1, c1, r2, c2] of dPairs) {
        if (r1 < GROWS && c1 < GCOLS && r2 < GROWS && c2 < GCOLS) {
            const a = pts[r1][c1], b = pts[r2][c2];
            diags.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
        }
    }

    // Node dots
    const nodes: Pt[] = [];
    for (let row = 0; row < GROWS; row++)
        for (let col = 0; col < GCOLS; col++)
            nodes.push(pts[row][col]);

    // Gold iso-curve — pre-resolved bezier path string
    const goldPath =
        `M${rnd(W * 0.08)} ${rnd(H * 0.72)} ` +
        `C${rnd(W * 0.22)} ${rnd(H * 0.58)},${rnd(W * 0.42)} ${rnd(H * 0.42)},${rnd(W * 0.62)} ${rnd(H * 0.34)} ` +
        `S${rnd(W * 0.86)} ${rnd(H * 0.22)},${rnd(W * 0.94)} ${rnd(H * 0.14)} `;

    return { W, H, grid, diags, nodes, goldPath } as const;
})();

// ─── ScientificMeshPanel ──────────────────────────────────────────────────────
// Scroll-linked: scale 0.96→1, translateY 24→0 over first 50% of page scroll.
// SVG is static — no math inside render path.
function ScientificMeshPanel({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
    const { scrollYProgress } = useScroll({
        target: scrollRef,
        offset: ["start start", "end start"],
    });
    const scale = useTransform(scrollYProgress, [0, 0.5], [0.96, 1]);
    const translateY = useTransform(scrollYProgress, [0, 0.5], [24, 0]);
    const opacity = useTransform(scrollYProgress, [0, 0.3], [0.14, 0.22]);

    return (
        <motion.div
            style={{ scale, y: translateY, opacity }}
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
        >
            <svg
                viewBox={`0 0 ${SM.W} ${SM.H} `}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Lattice grid lines */}
                {SM.grid.map((s, i) => (
                    <line key={`g${i} `} {...s} stroke="white" strokeWidth="0.5" opacity={0.55} strokeLinecap="round" />
                ))}
                {/* Diagonal cross-connections */}
                {SM.diags.map((s, i) => (
                    <line key={`d${i} `} {...s} stroke="white" strokeWidth="0.35" opacity={0.35} strokeLinecap="round" strokeDasharray="2 5" />
                ))}
                {/* Node vertices */}
                {SM.nodes.map((n, i) => (
                    <circle key={`n${i} `} cx={n.x} cy={n.y} r={1.2} fill="white" opacity={0.5} />
                ))}
                {/* Gold iso-curve accent */}
                <path d={SM.goldPath} stroke="#c29b27" strokeWidth="0.9" opacity={0.45} strokeLinecap="round" fill="none" />
            </svg>
        </motion.div>
    );
}

// ─── GoldenSweepLine (Signal page only) ──────────────────────────────────────
// Two staggered champagne-gold lines drifting diagonally — infinite, elegant.
// z-0, pointer-events none — purely decorative, never interrupts content.
function GoldenSweepLine() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
            {/* Primary sweep */}
            <motion.div
                className="absolute"
                style={{
                    top: "38%",
                    left: "-20%",
                    width: "140%",
                    height: "1px",
                    background: "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.28) 30%, rgba(212,175,55,0.32) 52%, rgba(212,175,55,0.28) 70%, transparent 100%)",
                    filter: "blur(0.4px)",
                    rotate: "-4deg",
                }}
                animate={{ x: ["0%", "12%", "0%"], y: ["0px", "18px", "0px"], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 14, ease: [0.45, 0, 0.55, 1], repeat: Infinity, repeatType: "loop" }}
            />
            {/* Secondary echo — offset timing */}
            <motion.div
                className="absolute"
                style={{
                    top: "62%",
                    left: "-20%",
                    width: "140%",
                    height: "1px",
                    background: "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.14) 35%, rgba(212,175,55,0.18) 50%, rgba(212,175,55,0.14) 65%, transparent 100%)",
                    filter: "blur(0.3px)",
                    rotate: "-3.5deg",
                }}
                animate={{ x: ["0%", "-8%", "0%"], y: ["0px", "12px", "0px"], opacity: [0.5, 0.85, 0.5] }}
                transition={{ duration: 18, ease: [0.45, 0, 0.55, 1], repeat: Infinity, repeatType: "loop", delay: 4 }}
            />
        </div>
    );
}

// ─── Portrait Anchor ─────────────────────────────────────────────────────────
function PortraitAnchor({ profile, config }: { profile: Profile; config: SiteConfig }) {
    return (
        <div
            className="flex flex-col items-center gap-4 transition-transform duration-700 ease-luxury"
            style={{ transform: `translateY(${config.signalPortraitOffsetY}px) scale(${config.signalPortraitScale})` }}
        >
            <div className="relative" style={{ filter: "drop-shadow(0 0 48px rgba(212,175,55,0.08))" }}>
                <motion.div
                    whileHover={{ scale: 1.03 }}
                    transition={SPRING}
                    className="relative w-[160px] h-[160px] rounded-full overflow-hidden cursor-default"
                    style={{
                        outline: "1px solid rgba(212,175,55,0.35)",
                        outlineOffset: "3px",
                        boxShadow: `0 0 0 1px rgba(212, 175, 55, 0.08), 0 0 40px 6px rgba(212, 175, 55, ${config.signalPortraitRingGlow})`,
                    }}
                >
                    <Image
                        src={profile.portraitUrl}
                        alt={`${profile.name} — ${profile.role} `}
                        fill
                        className="object-cover object-top"
                        priority
                        unoptimized={profile.portraitUrl.startsWith("/uploads/")}
                        sizes="160px"
                    />
                </motion.div>
            </div>
            <div className="text-center">
                <p className="font-sans text-[0.72rem] tracking-widest uppercase text-[var(--text-primary)] opacity-70">
                    {profile.name}
                </p>
                <p className="mono text-[0.6rem] tracking-widest mt-0.5">{profile.role} · {profile.affiliation}</p>
            </div>
            <div
                className="w-px h-10 mt-1"
                style={{ background: "linear-gradient(to bottom, rgba(212,175,55,0.3), transparent)" }}
                aria-hidden="true"
            />
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SignalPage() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [profile, setProfile] = useState<Profile>(defaultProfile);
    const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
    const pageRef = useRef<HTMLElement>(null);

    useEffect(() => {
        Promise.all([
            fetch("/api/profile").then(r => r.json()),
            loadSiteConfig()
        ])
            .then(([profileData, configData]) => {
                if (profileData && profileData.name) setProfile(profileData);
                if (configData && typeof configData.heroVisualOpacity === 'number') setConfig(configData);
            })
            .catch(() => { /* keep defaults */ });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            setSent(true);
        } catch {
            // fail silently
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <BackgroundGeometry />

            {/* Animated golden line — Signal page only, fixed behind all content */}
            <GoldenSweepLine />

            <main ref={pageRef} className="relative z-10 min-h-screen pt-24">
                <section className="section">

                    {/* ── Header ──────────────────────────────────────────────── */}
                    <div className="mb-16">
                        <p className="mono tracking-[0.2em] mb-6">Signal / Contact</p>
                        <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-[300] leading-[1.1] text-[var(--text-primary)] mb-4">
                            Open to Connection.
                        </h1>
                        <p className="font-sans text-[var(--text-muted)] text-[1rem] max-w-md leading-relaxed">
                            For research discussions on AI, intelligent systems, or
                            MedTech direction. Collaborations, questions, and
                            intellectually meaningful exchanges welcome.
                        </p>
                        <div className="gold-line mt-8" />
                    </div>

                    {/* ── Main Grid ─────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 max-w-4xl">

                        {/* ── Left: Contact Form ────────────────────────────── */}
                        <div>
                            {sent ? (
                                <div className="py-8">
                                    <p className="font-serif text-[1.4rem] text-[var(--accent-gold)]">Signal received.</p>
                                    <p className="font-sans text-[var(--text-muted)] text-[0.9rem] mt-2">
                                        I&apos;ll respond when the time is right.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                                    {[
                                        { name: "name", label: "Name", type: "text" },
                                        { name: "email", label: "Email", type: "email" },
                                    ].map((field) => (
                                        <div key={field.name} className="flex flex-col gap-2">
                                            <label className="font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)]">
                                                {field.label}
                                            </label>
                                            <input
                                                type={field.type}
                                                required
                                                value={form[field.name as keyof typeof form]}
                                                onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                                                className="bg-transparent border-b border-[var(--border)] py-3 font-sans text-[0.9rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors duration-400 placeholder:text-[var(--text-dim)]"
                                            />
                                        </div>
                                    ))}
                                    <div className="flex flex-col gap-2">
                                        <label className="font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)]">
                                            Message
                                        </label>
                                        <textarea
                                            rows={4}
                                            required
                                            value={form.message}
                                            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                                            className="bg-transparent border-b border-[var(--border)] py-3 font-sans text-[0.9rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors duration-400 resize-none placeholder:text-[var(--text-dim)]"
                                        />
                                    </div>
                                    <MagneticButton
                                        as="button"
                                        className="self-start font-sans text-[0.78rem] tracking-widest uppercase text-[var(--text-primary)] border border-[var(--border)] px-7 py-3 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors duration-600 mt-2 disabled:opacity-40"
                                    >
                                        {sending ? "Sending…" : "Send Signal"}
                                    </MagneticButton>
                                </form>
                            )}

                            {/* Social links */}
                            <div className="flex items-center gap-6 mt-12">
                                <a href="mailto:amal2004t@gmail.com"
                                    className="text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-400">
                                    <Mail size={15} strokeWidth={1.5} />
                                </a>
                                <a href="https://github.com/AMALJITH-T" target="_blank" rel="noopener noreferrer"
                                    className="text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-400">
                                    <Github size={15} strokeWidth={1.5} />
                                </a>
                                <a href="https://www.linkedin.com/in/amaljith-thadathil/" target="_blank" rel="noopener noreferrer"
                                    className="text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors duration-400">
                                    <Linkedin size={15} strokeWidth={1.5} />
                                </a>
                            </div>
                        </div>

                        {/* ── Right: Scientific Mesh + Portrait + Chat ────────── */}
                        <div className="border-l border-[var(--border)] pl-12 relative min-h-[520px] flex flex-col gap-10">
                            {/* Manifold mesh visual — absolute, behind content, scroll-revealed */}
                            <ScientificMeshPanel scrollRef={pageRef} />

                            {/* Portrait anchor — profile-driven, shifted by SiteConfig offset wrapper */}
                            <div className="relative z-10 mt-6 lg:mt-10">
                                <PortraitAnchor profile={profile} config={config} />
                            </div>

                            {/* SpotlightChat */}
                            <div className="relative z-10 flex-1">
                                <p className="font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)] mb-6">
                                    Ask about my work
                                </p>
                                <div className="relative">
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.05) 0%, transparent 70%)" }}
                                        aria-hidden="true"
                                    />
                                    <SpotlightChat />
                                </div>
                            </div>
                        </div>

                    </div>
                </section>
            </main>
        </>
    );
}
