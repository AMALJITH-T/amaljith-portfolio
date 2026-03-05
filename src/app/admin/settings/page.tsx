"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SiteConfig, SiteSettings, defaultSiteSettings } from "@/lib/types";
import { defaultSiteConfig } from "@/lib/data";
import { LabFragmentsEditor } from "@/components/ui/LabFragments";
import { ProjectsEditor } from "@/components/ui/ProjectsEditor";
import { loadSiteConfig, loadSiteSettings } from "@/lib/settingsLoader";

// ─── Shared Field Components ──────────────────────────────────────────────────
function SliderRow({ label, value, min, max, step, onChange }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-between items-end">
                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">{label}</label>
                <span className="mono text-[0.8rem] text-[var(--accent-gold)]">{value.toFixed(3)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full accent-[var(--accent-gold)] h-1 bg-[var(--border)] rounded-full appearance-none outline-none cursor-pointer"
            />
        </div>
    );
}

function TextRow({ label, value, placeholder, multiline, onChange }: {
    label: string; value: string; placeholder?: string; multiline?: boolean;
    onChange: (v: string) => void;
}) {
    const cls = "w-full bg-transparent border-b border-[var(--border)] pb-3 font-sans text-[0.9rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors duration-400 placeholder:text-[var(--text-dim)]";
    return (
        <div className="flex flex-col gap-2">
            <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">{label}</label>
            {multiline ? (
                <textarea value={value} placeholder={placeholder} rows={3}
                    onChange={(e) => onChange(e.target.value)}
                    className={`${cls} resize-none`}
                />
            ) : (
                <input type="text" value={value} placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                    className={cls}
                />
            )}
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="pb-4 border-b border-[var(--border)]">
            <h2 className="font-serif text-[1.3rem] text-[var(--text-primary)] tracking-tight">{children}</h2>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsAdminPage() {
    const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);
    const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    useEffect(() => {
        Promise.all([
            loadSiteConfig(),
            loadSiteSettings(),
        ])
            .then(([cfg, ss]) => { setConfig(cfg); setSettings(ss); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    const showToast = (type: "success" | "error", msg: string) => setToast({ type, msg });

    const handleSave = async () => {
        setSaving(true);
        try {
            localStorage.setItem("site_config", JSON.stringify(config));
            localStorage.setItem("site_settings", JSON.stringify(settings));
            await new Promise(r => setTimeout(r, 400)); // UX delay
            showToast("success", "All settings saved locally.");
            // Force a reload of preview in current tab if needed, or let admin see.
            // Since it's React state, current view is updated.
        } catch {
            showToast("error", "Save failed.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[50vh] text-[var(--text-dim)] mono uppercase text-xs tracking-widest">
                    Initializing Interface...
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="border-b border-[var(--border)] px-10 py-6 flex items-center justify-between" style={{ background: "var(--bg-secondary)" }}>
                <div>
                    <p className="mono text-[0.65rem] tracking-[0.2em] mb-1">Architecture</p>
                    <h1 className="font-serif text-[1.6rem] font-[300] text-[var(--text-primary)] leading-none">Site Configuration</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-primary)] border border-[var(--accent-gold)] px-6 py-2 rounded-sm hover:bg-[var(--accent-gold)] hover:text-black transition-all duration-400 disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save All"}
                </button>
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 border border-[var(--border)] bg-[#050505] shadow-2xl px-6 py-4">
                        <span className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-[var(--accent-gold)]" : "bg-red-800"}`} />
                        <p className="font-sans text-[0.8rem] text-[var(--text-primary)] tracking-wide">{toast.msg}</p>
                    </div>
                </div>
            )}

            <div className="px-10 py-12 max-w-5xl space-y-16">

                {/* ── SECTION: Hero Content ─────────────────────────────────── */}
                <div className="space-y-8">
                    <SectionTitle>Hero Content</SectionTitle>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <TextRow
                                label="Tagline (mono above title)"
                                value={settings.heroTagline}
                                placeholder="SRM IST · AI / ML · Systems"
                                onChange={(v) => setSettings({ ...settings, heroTagline: v })}
                            />
                            <TextRow
                                label="Hero Title (use \\n for line breaks, middle line gets gold)"
                                value={settings.heroTitle}
                                placeholder={"Curious About\nHow Systems\nReason."}
                                multiline
                                onChange={(v) => setSettings({ ...settings, heroTitle: v })}
                            />
                        </div>
                        <div className="space-y-8">
                            <TextRow
                                label="Hero Subtitle"
                                value={settings.heroSubtitle}
                                multiline
                                onChange={(v) => setSettings({ ...settings, heroSubtitle: v })}
                            />
                        </div>
                    </div>
                </div>

                {/* ── SECTION: Hero Visual ─────────────────────────────────── */}
                <div className="space-y-8">
                    <SectionTitle>Hero Visual</SectionTitle>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <TextRow
                                label="Scientific Image URL (leave blank for SVG only)"
                                value={config.heroScientificImageUrl}
                                placeholder="/images/research-slide.jpg"
                                onChange={(v) => setConfig({ ...config, heroScientificImageUrl: v })}
                            />
                            <SliderRow label="Scientific Image Opacity" value={config.heroScientificImageOpacity}
                                min={0} max={1} step={0.05}
                                onChange={(v) => setConfig({ ...config, heroScientificImageOpacity: v })}
                            />
                            <SliderRow label="Scientific Image Parallax (px)" value={config.heroScientificImageParallax}
                                min={0} max={150} step={5}
                                onChange={(v) => setConfig({ ...config, heroScientificImageParallax: v })}
                            />
                            <SliderRow label="Background SVG Opacity" value={config.heroVisualOpacity}
                                min={0} max={1} step={0.05}
                                onChange={(v) => setConfig({ ...config, heroVisualOpacity: v })}
                            />
                        </div>
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)] block">
                                    Orbit Keywords (one per line)
                                </label>
                                <textarea
                                    rows={8}
                                    value={settings.orbitKeywords.join("\n")}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        orbitKeywords: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                                    })}
                                    className="w-full bg-transparent border border-[var(--border)] p-3 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors resize-none placeholder:text-[var(--text-dim)]"
                                    placeholder={"Inference\nSignal\nDrift\nEmergence"}
                                />
                                <p className="font-sans text-[0.65rem] text-[var(--text-dim)]">Up to 8 words display; extras are ignored.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SECTION: Contact & Footer ─────────────────────────────── */}
                <div className="space-y-8">
                    <SectionTitle>Contact &amp; Footer</SectionTitle>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <TextRow label="Contact Email (used by contact form &amp; footer icon)"
                                value={settings.contactEmail}
                                placeholder="you@example.com"
                                onChange={(v) => setSettings({ ...settings, contactEmail: v })}
                            />
                            <TextRow label="Footer Name"
                                value={settings.footerName}
                                placeholder="A. T."
                                onChange={(v) => setSettings({ ...settings, footerName: v })}
                            />
                        </div>
                        <div className="space-y-8">
                            <TextRow label="Footer Tagline"
                                value={settings.footerTagline}
                                placeholder="AI/ML Researcher · SRM IST"
                                onChange={(v) => setSettings({ ...settings, footerTagline: v })}
                            />
                            <TextRow label="Footer Copyright Text"
                                value={settings.footerCopyright}
                                placeholder="crafted with geometry"
                                onChange={(v) => setSettings({ ...settings, footerCopyright: v })}
                            />
                        </div>
                    </div>
                </div>

                {/* ── SECTION: Motion & Signal ──────────────────────────────── */}
                <div className="space-y-8">
                    <SectionTitle>Motion &amp; Signal Portrait</SectionTitle>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <SliderRow label="Golden Metro Line Speed" value={config.goldenLineSpeed}
                                min={0.1} max={5} step={0.1}
                                onChange={(v) => setConfig({ ...config, goldenLineSpeed: v })}
                            />
                            <SliderRow label="Motion Intensity (cursor parallax depth)" value={settings.motionIntensity}
                                min={0.002} max={0.02} step={0.001}
                                onChange={(v) => setSettings({ ...settings, motionIntensity: v })}
                            />
                        </div>
                        <div className="space-y-8">
                            <SliderRow label="Portrait Y-Offset" value={config.signalPortraitOffsetY}
                                min={-100} max={100} step={2}
                                onChange={(v) => setConfig({ ...config, signalPortraitOffsetY: v })}
                            />
                            <SliderRow label="Portrait Scale" value={config.signalPortraitScale}
                                min={0.5} max={1.5} step={0.05}
                                onChange={(v) => setConfig({ ...config, signalPortraitScale: v })}
                            />
                            <SliderRow label="Ring Glow Intensity" value={config.signalPortraitRingGlow}
                                min={0} max={1} step={0.02}
                                onChange={(v) => setConfig({ ...config, signalPortraitRingGlow: v })}
                            />
                        </div>
                    </div>
                </div>

                {/* ── SECTION: Lab Fragments ────────────────────────────────── */}
                <div className="space-y-8">
                    <SectionTitle>Lab Fragments</SectionTitle>
                    <p className="font-sans text-[0.78rem] text-[var(--text-dim)] -mt-4">
                        Shown on the homepage between Research and the bottom. Each card has a caption, description, and optional image URL.
                    </p>
                    <LabFragmentsEditor
                        fragments={settings.labFragments}
                        onChange={(f) => setSettings({ ...settings, labFragments: f })}
                    />
                </div>

                {/* ── SECTION: Work Projects ─────────────────────────────────── */}
                <div className="space-y-8 mt-12">
                    <SectionTitle>Work Section Projects</SectionTitle>
                    <p className="font-sans text-[0.78rem] text-[var(--text-dim)] -mt-4">
                        Manage your Selected Work portfolio. Define methods, datasets, and structural hover interactions.
                    </p>
                    <ProjectsEditor
                        projects={settings.projects || []}
                        onChange={(p) => setSettings({ ...settings, projects: p })}
                    />
                </div>

                {/* ── SECTION: Hero Visualization ───────────────────────────── */}
                <div className="space-y-8">
                    <SectionTitle>Hero Visualization (Brain Engine)</SectionTitle>
                    <p className="font-sans text-[0.78rem] text-[var(--text-dim)] -mt-4">
                        Controls the Semantic Brain Visualization on the homepage hero. Scroll inside the brain panel to zoom through layers.
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <SliderRow
                                label="Token Density (Particle Count)"
                                value={settings.brainDensity ?? 5000}
                                min={2000} max={6000} step={100}
                                onChange={(v) => setSettings({ ...settings, brainDensity: v })}
                            />
                            <SliderRow
                                label="Zoom Depth Sensitivity (scroll speed)"
                                value={settings.brainZoomDepth ?? 1.5}
                                min={0.5} max={3.0} step={0.1}
                                onChange={(v) => setSettings({ ...settings, brainZoomDepth: v })}
                            />
                            <div className="flex flex-col gap-2">
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">
                                    Layer 1 — Math Symbols (one per line)
                                </label>
                                <textarea
                                    rows={6}
                                    value={(settings.brainSymbols ?? []).join("\n")}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        brainSymbols: e.target.value.split("\n").map(s => s.trim()).filter(Boolean),
                                    })}
                                    className="w-full bg-transparent border border-[var(--border)] p-3 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors resize-none placeholder:text-[var(--text-dim)]"
                                    placeholder={"∑\n∂\n∫\nπ\nλ"}
                                />
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div className="flex flex-col gap-2">
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">
                                    Layer 2 — Equations (one per line)
                                </label>
                                <textarea
                                    rows={6}
                                    value={(settings.brainEquations ?? []).join("\n")}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        brainEquations: e.target.value.split("\n").map(s => s.trim()).filter(Boolean),
                                    })}
                                    className="w-full bg-transparent border border-[var(--border)] p-3 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] transition-colors resize-none placeholder:text-[var(--text-dim)]"
                                    placeholder={"x(t)\n∇f(x)\nP(A|B)\n∑wᵢxᵢ"}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">
                                    Layer 3 — Concept Words (driven by Orbit Keywords above)
                                </label>
                                <p className="font-sans text-[0.68rem] text-[var(--text-dim)]">
                                    Edit the Orbit Keywords field in Hero Visual section above — those words also populate the deep brain interior layer.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}

