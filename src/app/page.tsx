"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { research, defaultSiteConfig } from "@/lib/data";
import { Project, Research, SiteConfig, SiteSettings, defaultSiteSettings } from "@/lib/types";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { BackgroundGeometry } from "@/components/ui/BackgroundGeometry";
import { GoldenLine } from "@/components/ui/GoldenLine";
import { useCursorParallax } from "@/hooks/useCursorParallax";
import { ScrollInsightPulse } from "@/components/ui/ScrollInsightPulse";
import { LabFragments } from "@/components/ui/LabFragments";
import { ResearchTimeline } from "@/components/ui/ResearchTimeline";
import { StaggerReveal } from "@/components/ui/StaggerReveal";
import { GitHubActivity } from "@/components/ui/GitHubActivity";
import { ArrowUpRight } from "lucide-react";
import { SVGSignalTrace } from "@/components/ui/SVGSignalTrace";
import { BackgroundScientificOverlay } from "@/components/ui/BackgroundScientificOverlay";
import { BackgroundNodeGraph } from "@/components/ui/BackgroundNodeGraph";
import { loadSiteConfig, loadSiteSettings } from "@/lib/settingsLoader";

// HeroBrainScene is WebGL/R3F — dynamic import prevents SSR / hydration mismatch
const HeroBrainScene = dynamic(
  () => import("@/components/ui/HeroBrainScene").then((m) => ({ default: m.HeroBrainScene })),
  { ssr: false, loading: () => <div style={{ width: "100%", height: 520, background: "transparent" }} /> }
);

// ─── Constants ────────────────────────────────────────────────────────────────
const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Module-scope precision helper ───────────────────────────────────────────
// Rounds to 3 d.p. so server (Node.js) and browser produce identical strings.
// This eliminates any floating-point serialisation drift across runtimes.
function r(n: number) { return Math.round(n * 1000) / 1000; }

// ─── Module-scope SVG geometry (computed once at module load) ─────────────────
// All math runs OUTSIDE React — no hooks, no component body, no render path.
// Server and client execute the same pure function, producing identical output.
const VF = (() => {
  const W = 480, H = 420, PAD = 24;
  const COLS = 16, ROWS = 13;
  const HA = 0.42; // arrowhead half-angle (radians)

  type Seg = { x1: number; y1: number; x2: number; y2: number };
  const arrows: { shaft: Seg; left: Seg; right: Seg }[] = [];

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const nx = (col / (COLS - 1)) * 2 - 1;
      const ny = (row / (ROWS - 1)) * 2 - 1;

      // Curl of a blended dual-Gaussian → saddle-like rotation topology
      const g1x = nx - 0.4, g1y = ny - 0.3;
      const g2x = nx + 0.4, g2y = ny + 0.35;
      const s1 = Math.exp(-(g1x * g1x + g1y * g1y) / 0.45);
      const s2 = Math.exp(-(g2x * g2x + g2y * g2y) / 0.45);
      const fx = -g1y * s1 + g2y * s2 * 0.7;
      const fy = g1x * s1 - g2x * s2 * 0.7;
      const mag = Math.sqrt(fx * fx + fy * fy) || 0.001;

      const angle = Math.atan2(fy, fx);
      const len = 8 + (mag / 1.2) * 14;
      const cx = PAD + (col / (COLS - 1)) * (W - PAD * 2);
      const cy = PAD + (row / (ROWS - 1)) * (H - PAD * 2);

      // Resolve ALL coordinates here — rounded to stable precision
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const hx = cx + ca * len, hy = cy + sa * len;
      const tx = cx - ca * (len * 0.4), ty = cy - sa * (len * 0.4);
      const hl = len * 0.28;

      arrows.push({
        shaft: { x1: r(tx), y1: r(ty), x2: r(hx), y2: r(hy) },
        left: {
          x1: r(hx), y1: r(hy),
          x2: r(hx - Math.cos(angle - HA) * hl),
          y2: r(hy - Math.sin(angle - HA) * hl)
        },
        right: {
          x1: r(hx), y1: r(hy),
          x2: r(hx - Math.cos(angle + HA) * hl),
          y2: r(hy - Math.sin(angle + HA) * hl)
        },
      });
    }
  }

  // Contour Bézier strings — all literal numbers, zero float ops in JSX
  const contours = [
    "M0 63Q144 21 288 147T480 105",
    "M0 147Q120 84 264 231T480 189",
    "M0 231Q144 168 288 302.4T480 273",
    "M0 302.4Q168 252 312 369.6T480 344.4",
  ];

  // Gold streamline — resolved once, never re-computed
  // Graph nodes — deterministic grid sampling
  type Pt = { x: number; y: number };
  const NODE_COLS = 6, NODE_ROWS = 5;
  const nodes: Pt[] = [];
  for (let nc = 0; nc < NODE_COLS; nc++) {
    for (let nr = 0; nr < NODE_ROWS; nr++) {
      nodes.push({
        x: r(PAD * 2 + (nc / (NODE_COLS - 1)) * (W - PAD * 4)),
        y: r(PAD * 2 + (nr / (NODE_ROWS - 1)) * (H - PAD * 4)),
      });
    }
  }

  // Triangulation edges — Delaunay-like by connecting adjacent pairs deterministically
  const tEdges: Seg[] = [];
  // horizontal + vertical adjacency
  for (let nc = 0; nc < NODE_COLS; nc++) {
    for (let nr = 0; nr < NODE_ROWS; nr++) {
      const idx = nc * NODE_ROWS + nr;
      if (nc + 1 < NODE_COLS) {
        const b = nodes[(nc + 1) * NODE_ROWS + nr];
        tEdges.push({ x1: nodes[idx].x, y1: nodes[idx].y, x2: b.x, y2: b.y });
      }
      if (nr + 1 < NODE_ROWS) {
        const b = nodes[nc * NODE_ROWS + nr + 1];
        tEdges.push({ x1: nodes[idx].x, y1: nodes[idx].y, x2: b.x, y2: b.y });
      }
      // Diagonals on even columns
      if (nc % 2 === 0 && nc + 1 < NODE_COLS && nr + 1 < NODE_ROWS) {
        const b = nodes[(nc + 1) * NODE_ROWS + nr + 1];
        tEdges.push({ x1: nodes[idx].x, y1: nodes[idx].y, x2: b.x, y2: b.y });
      }
    }
  }

  const streamline = `M${r(W * 0.15)} ${r(H * 0.82)} C${r(W * 0.28)} ${r(H * 0.55)},${r(W * 0.38)} ${r(H * 0.32)},${r(W * 0.52)} ${r(H * 0.22)} S${r(W * 0.72)} ${r(H * 0.18)},${r(W * 0.85)} ${r(H * 0.15)}`;

  // Tick mark coordinate pairs — static
  const ticks = ([0.25, 0.5, 0.75] as const).map(t => ({
    bx1: r(W * t), by1: r(H - PAD + 4), bx2: r(W * t), by2: r(H - PAD + 9),
    lx1: r(PAD - 9), ly1: r(H * t), lx2: r(PAD - 4), ly2: r(H * t),
  }));

  return { W, H, PAD, arrows, contours, streamline, ticks, nodes, tEdges } as const;
})();

// ─── Scientific Visual ────────────────────────────────────────────────────────
// Purely presentational — no hooks, no math, no branching.
// Renders pre-computed VF constants directly; output is byte-identical between
// SSR and client hydration.
function ScientificVisual() {
  const { W, H, PAD } = VF;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[560px]"
      aria-hidden="true"
    >
      {/* Contour iso-lines */}
      {VF.contours.map((d, i) => (
        <path key={i} d={d} stroke="#c29b27" strokeWidth="0.65" opacity={0.18} strokeDasharray="4 6" />
      ))}

      {/* Triangulation edges — graph structure */}
      {VF.tEdges.map((e, i) => (
        <line key={`te${i}`} {...e} stroke="white" strokeWidth="0.55" opacity={0.20} strokeLinecap="round" />
      ))}

      {/* Vector field arrows */}
      {VF.arrows.map((a, i) => (
        <g key={i}>
          <line {...a.shaft} stroke="white" strokeWidth="0.75" opacity={0.28} strokeLinecap="round" />
          <line {...a.left} stroke="white" strokeWidth="0.65" opacity={0.22} strokeLinecap="round" />
          <line {...a.right} stroke="white" strokeWidth="0.65" opacity={0.22} strokeLinecap="round" />
        </g>
      ))}

      {/* Graph node dots */}
      {VF.nodes.map((n, i) => (
        <circle key={`n${i}`} cx={n.x} cy={n.y} r={1.6} fill="white" className="sci-node" />
      ))}

      {/* Gold streamline — principal geodesic */}
      <path d={VF.streamline} stroke="#c29b27" strokeWidth="1.2" opacity={0.45} strokeLinecap="round" fill="none" className="sci-streamline" />

      {/* Axis tick marks */}
      {VF.ticks.map((t, i) => (
        <g key={i}>
          <line x1={t.bx1} y1={t.by1} x2={t.bx2} y2={t.by2} stroke="white" strokeWidth="0.6" opacity={0.18} />
          <line x1={t.lx1} y1={t.ly1} x2={t.lx2} y2={t.ly2} stroke="white" strokeWidth="0.6" opacity={0.18} />
        </g>
      ))}

      {/* L-shaped coordinate frame */}
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="white" strokeWidth="0.5" opacity={0.14} />
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="white" strokeWidth="0.5" opacity={0.14} />
    </svg>
  );
}


// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const heroRef = useRef<HTMLDivElement>(null);

  useCursorParallax(5);

  useEffect(() => {
    loadSiteConfig()
      .then((data: SiteConfig) => setConfig(data))
      .catch(() => { /* use default */ });
    loadSiteSettings()
      .then((data: SiteSettings) => setSettings(data))
      .catch(() => { /* use default */ });
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Left: text rises + fades — exits as scientific visual takes over compositionally
  const textY = useTransform(scrollYProgress, [0, 0.25], ["0%", "50%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  // The absolute shift is controlled by the config value. Base shift is fixed to keep deterministic hook calls.
  // We use useTransform from 0->1 mapped to [0, -parallaxStr]
  const visualYBase = useTransform(scrollYProgress, [0, 1], [0, -1]);
  const [visualY, setVisualY] = useState(0);

  // Image Panel parallax
  const imgYBase = useTransform(scrollYProgress, [0, 1], [0, -1]);
  const [imgY, setImgY] = useState(0);

  useEffect(() => {
    return visualYBase.onChange((v) => setVisualY(v * 20)); // Base SVG parallax is fixed max 20px
  }, [visualYBase]);

  useEffect(() => {
    return imgYBase.onChange((v) => setImgY(v * config.heroScientificImageParallax));
  }, [imgYBase, config.heroScientificImageParallax]);

  // Accent line — mid layer, parallax at 50%
  const lineY = useTransform(scrollYProgress, [0, 1], [0, 180]);

  // Scroll chevron
  const chevronOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  return (
    <section
      ref={heroRef}
      className="relative h-screen flex items-center overflow-hidden"
      aria-label="Hero"
    >
      {/* ── Scientific Geometry Overlay (Layer 0) ── */}
      <BackgroundScientificOverlay />

      {/* Atmospheric hero glow — behind everything, just above bg geometry */}
      <div
        className="absolute inset-0 z-[5] pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 28% 52%, rgba(212,175,55,0.045) 0%, transparent 80%)",
        }}
      />

      {/* Golden Thought Trails — ideas drifting through the hero space */}
      {/* Cursor parallax shifts the entire trail container a tiny amount */}
      <div
        className="absolute inset-0 z-[6] pointer-events-none overflow-hidden"
        aria-hidden="true"
        style={{ transform: "translate(var(--cursor-px, 0px), var(--cursor-py, 0px))" }}
      >
        <div className="thought-trail thought-trail-a" />
        <div className="thought-trail thought-trail-b" />
        <div className="thought-trail thought-trail-c" />
      </div>

      {/* Mid layer: vertical champagne-gold accent line — hero-only, slow parallax */}
      <motion.div
        style={{ y: lineY }}
        className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
      >
        <div className="w-px h-[40vh] bg-gradient-to-b from-transparent via-[rgba(212,175,55,0.13)] to-transparent" />
      </motion.div>

      {/* Foreground Content Grid */}
      <div className="relative z-20 w-full h-full">
        <div
          className="w-full h-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          style={{
            maxWidth: "1440px",
            paddingLeft: "clamp(24px, 4vw, 72px)",
            paddingRight: "clamp(24px, 4vw, 72px)",
          }}
        >
          {/* Left: Typography (scroll-driven exit) */}
          <motion.div
            style={{ y: textY, opacity: textOpacity }}
            className="will-change-transform mt-28 pb-12"
          >
            <p className="mono mb-6 tracking-[0.2em]">{settings.heroTagline}</p>

            <h1 className="font-serif text-[clamp(3rem,7vw,6.5rem)] font-[300] leading-[1.05] tracking-[-0.02em] text-[var(--text-primary)] mb-8">
              {(settings?.heroTitle || "Curious About\nHow Systems\nReason.").split("\n").map((line, i, arr) => (
                <span key={i}>
                  {i === Math.floor(arr.length / 2) ? (
                    <span className="text-[var(--accent-gold)] opacity-90">{line}</span>
                  ) : line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="font-sans text-[var(--text-muted)] text-[1.05rem] max-w-md leading-relaxed mb-8">
              {settings.heroSubtitle}
            </p>

            {/* SVG heartbeat strip — scientific aesthetic below description */}
            <div className="mb-8 w-[320px]">
              <SVGSignalTrace className="mb-8" />
            </div>

            <div className="flex items-center gap-8">
              <MagneticButton
                as="a"
                href="/#work"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="font-sans text-[0.78rem] tracking-widest uppercase text-[var(--text-primary)] border border-[var(--border)] px-8 py-3 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors duration-600"
              >
                View Work
              </MagneticButton>
              <MagneticButton
                as="a"
                href="/signal"
                className="font-sans text-[0.78rem] tracking-widest uppercase text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors duration-600"
              >
                Signal <ArrowUpRight size={12} className="inline" />
              </MagneticButton>
            </div>
          </motion.div>

          {/* Right: Brain Visualization Engine */}
          <div className="hidden lg:flex items-center justify-center relative h-full min-h-[500px]">
            {/* Soft gold depth glow — behind the canvas */}
            <div
              className="absolute pointer-events-none"
              aria-hidden="true"
              style={{
                inset: "-20% -10%",
                background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(201,166,70,0.06) 0%, transparent 70%)",
                zIndex: 9,
              }}
            />

            <div className="relative w-full h-full flex items-center justify-center z-10">
              <HeroBrainScene settings={settings} />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        style={{ opacity: chevronOpacity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-10 bg-gradient-to-b from-[var(--accent-gold)] to-transparent opacity-35"
        />
      </motion.div>
    </section>
  );
}

// ─── Work Section ─────────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "start 30%"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [48, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.97, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [0, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ y, scale, opacity }}
      transition={{ ease: EASE }}
      className="group relative border-b border-[var(--border)] py-12 cursor-pointer will-change-transform"
      data-research-hover
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="grid grid-cols-[1fr_auto] gap-8 items-start">
        <div>
          <span className="mono mb-3 block text-[var(--accent-gold)]">{project.year}</span>
          <h3
            className={`font-serif text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent-gold)] transition-colors duration-600 leading-tight ${project.featured ? 'text-[2.2rem]' : 'text-[1.5rem]'}`}
          >
            {project.title}
          </h3>
          <p className="font-sans text-[var(--text-muted)] text-[0.95rem] leading-relaxed max-w-xl">
            {project.description}
          </p>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden mt-6 max-w-2xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[rgba(212,175,55,0.1)]">
                  {project.methods && (
                    <div>
                      <h4 className="mono text-[0.6rem] tracking-[0.2em] mb-2 text-[var(--text-dim)] uppercase">Methods</h4>
                      <ul className="space-y-1">
                        {project.methods.map((m, i) => (
                          <li key={i} className="font-sans text-[0.8rem] text-[var(--text-muted)] flex items-start">
                            <span className="mr-2 text-[var(--accent-gold)]"></span>{m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {project.datasets && (
                    <div>
                      <h4 className="mono text-[0.6rem] tracking-[0.2em] mb-2 text-[var(--text-dim)] uppercase">Datasets</h4>
                      <ul className="space-y-1">
                        {project.datasets.map((d, i) => (
                          <li key={i} className="font-sans text-[0.8rem] text-[var(--text-muted)] flex items-start">
                            <span className="mr-2 text-[var(--accent-gold)]"></span>{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {project.results && (
                    <div>
                      <h4 className="mono text-[0.6rem] tracking-[0.2em] mb-2 text-[var(--text-dim)] uppercase">Results</h4>
                      <ul className="space-y-1">
                        {project.results.map((r, i) => (
                          <li key={i} className="font-sans text-[0.8rem] text-[var(--text-muted)] flex items-start">
                            <span className="mr-2 text-[var(--accent-gold)]"></span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-2 mt-8">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="font-sans text-[0.65rem] tracking-widest uppercase text-[var(--text-dim)] border border-[var(--border)] px-2.5 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        {project.caseStudyUrl && (
          <a
            href={project.caseStudyUrl}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 text-[var(--accent-gold)]"
            aria-label={`Read case study for ${project.title}`}
          >
            <ArrowUpRight size={18} strokeWidth={1.5} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

function WorkSection({ items }: { items: Project[] }) {
  const headerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: headerProgress } = useScroll({
    target: headerRef,
    offset: ["start 85%", "start 40%"],
  });
  const headerY = useTransform(headerProgress, [0, 1], [24, 0]);
  const headerOpacity = useTransform(headerProgress, [0, 1], [0, 1]);

  return (
    <ScrollInsightPulse>
      <section id="work" className="section relative z-10">
        <div className="w-full flex justify-center pb-12 opacity-80">
          <SVGSignalTrace width="min(800px, 80vw)" opacity={0.10} duration={5.5} />
        </div>
        <motion.div
          ref={headerRef}
          style={{ y: headerY, opacity: headerOpacity }}
          className="mb-4"
        >
          <p className="mono tracking-[0.2em] mb-3">Selected Work</p>
          <div className="gold-line" />
        </motion.div>
        <StaggerReveal className="mt-0">
          {items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </StaggerReveal>
      </section>
    </ScrollInsightPulse>
  );
}

// ─── Research Section ─────────────────────────────────────────────────────────
function ResearchRow({ item, index }: { item: Research; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    // Tighter window — each row reveals within a controlled range
    offset: ["start 88%", "start 50%"],
  });

  // Slide in from left with controlled timing — more pronounced than before
  const x = useTransform(scrollYProgress, [0, 1], [-32, 0]);
  // Opacity is secondary
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ x, opacity }}
      className="group grid grid-cols-[4rem_1fr_auto] gap-6 items-start py-6 border-b border-[var(--border)] last:border-0 will-change-transform"
      data-research-hover
    >
      <span className="mono pt-0.5">{item.year}</span>
      <div>
        <h4 className="font-serif text-[1.05rem] text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent-gold)] transition-colors duration-400">
          {item.title}
        </h4>
        <p className="font-sans text-[0.78rem] text-[var(--text-dim)] mt-1 tracking-wide">
          {item.conference}
          {item.journal ? ` · ${item.journal}` : ""}
        </p>
      </div>
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-60 transition-opacity duration-400 text-[var(--accent-gold)] pt-0.5"
          aria-label={`Read paper: ${item.title}`}
        >
          <ArrowUpRight size={14} strokeWidth={1.5} />
        </a>
      )}
    </motion.div>
  );
}

function ResearchSection({ items }: { items: Research[] }) {
  const headerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: headerProgress } = useScroll({
    target: headerRef,
    offset: ["start 85%", "start 40%"],
  });
  const headerY = useTransform(headerProgress, [0, 1], [24, 0]);
  const headerOpacity = useTransform(headerProgress, [0, 1], [0, 1]);

  return (
    <ScrollInsightPulse>
      <section id="research" className="section border-t border-[var(--border)] relative z-10 overflow-hidden">
        <BackgroundNodeGraph />

        <div className="w-full flex justify-center py-8 relative z-10">
          <SVGSignalTrace width="min(600px, 60vw)" opacity={0.08} duration={4.5} />
        </div>
        <motion.div
          ref={headerRef}
          style={{ y: headerY, opacity: headerOpacity }}
          className="mb-4 relative z-10"
        >
          <p className="mono tracking-[0.2em] mb-3">Research &amp; Publications</p>
          <div className="gold-line" />
        </motion.div>
        <StaggerReveal className="mt-8 relative z-10">
          {items.map((item, i) => (
            <ResearchRow key={item.id} item={item} index={i} />
          ))}
        </StaggerReveal>
      </section>
    </ScrollInsightPulse>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadSiteSettings()
      .then((data: SiteSettings) => setProjects(data.projects || []))
      .catch(() => {
        import("@/lib/data").then((m) => setProjects(m.projects));
      });
  }, []);

  return (
    <>
      <BackgroundGeometry />
      <GoldenLine />

      <main className="relative">
        <HeroSection />
        <WorkSection items={projects} />
        <ResearchSection items={research} />

        <GitHubActivity />

        {/* System Fragments — visual artifacts extracted from active systems */}
        <ScrollInsightPulse>
          <section id="system-fragments" className="section border-t border-[var(--border)] relative z-10">
            <StaggerReveal className="mb-10">
              <p className="mono tracking-[0.2em] mb-3">System Fragments</p>
              <div className="gold-line" />
              <p className="font-sans text-[var(--text-dim)] text-[0.88rem] mt-5 max-w-xl leading-relaxed">
                Visual artifacts extracted from active systems, experimental research,
                and computational explorations.
              </p>
            </StaggerReveal>
            <LabFragments />
          </section>
        </ScrollInsightPulse>

        {/* ─── Research Timeline ───────────────────────────────────────────── */}
        <ResearchTimeline />
      </main>
    </>
  );
}
