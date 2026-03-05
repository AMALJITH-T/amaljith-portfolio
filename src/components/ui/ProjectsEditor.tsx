"use client";

import { Project } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";

export function ProjectsEditor({
    projects,
    onChange,
}: {
    projects: Project[];
    onChange: (p: Project[]) => void;
}) {
    const addProject = () => {
        const id = "proj-" + String(Date.now()).slice(-4);
        onChange([...projects, {
            id,
            title: "New Project",
            description: "",
            tags: [],
            year: new Date().getFullYear(),
            featured: false,
            methods: [],
            datasets: [],
            results: []
        }]);
    };

    const remove = (idx: number) => onChange(projects.filter((_, i) => i !== idx));

    const update = (idx: number, patch: Partial<Project>) => {
        const next = [...projects];
        next[idx] = { ...next[idx], ...patch };
        onChange(next);
    };

    const updateArray = (idx: number, field: "methods" | "datasets" | "results" | "tags", value: string) => {
        const arr = value.split("\n").map(s => s.trim()).filter(Boolean);
        update(idx, { [field]: arr });
    };

    return (
        <div className="space-y-6">
            {projects.map((p, i) => (
                <div key={p.id} className="border border-[var(--border)] p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <input
                            type="text"
                            value={p.title}
                            onChange={(e) => update(i, { title: e.target.value })}
                            className="bg-transparent font-serif text-[1.2rem] text-[var(--text-primary)] outline-none focus:text-[var(--accent-gold)] w-full transition-colors"
                        />
                        <button onClick={() => remove(i)} className="text-[var(--text-dim)] hover:text-red-400 transition-colors ml-4">
                            <Trash2 size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div>
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">Description</label>
                                <textarea
                                    value={p.description}
                                    onChange={(e) => update(i, { description: e.target.value })}
                                    rows={2}
                                    className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] resize-none"
                                />
                            </div>
                            <div>
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">Case Study URL</label>
                                <input
                                    type="text"
                                    value={p.caseStudyUrl || ""}
                                    onChange={(e) => update(i, { caseStudyUrl: e.target.value })}
                                    className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">Year</label>
                                    <input
                                        type="number"
                                        value={p.year}
                                        onChange={(e) => update(i, { year: parseInt(e.target.value) || 2024 })}
                                        className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
                                    />
                                </div>
                                <div className="flex-1 flex items-center justify-between border-b border-[var(--border)] pb-2 pt-1 mt-4">
                                    <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">Featured Project</label>
                                    <input
                                        type="checkbox"
                                        checked={p.featured || false}
                                        onChange={(e) => update(i, { featured: e.target.checked })}
                                        className="accent-[var(--accent-gold)]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">Tags (one per line)</label>
                                <textarea
                                    value={(p.tags || []).join("\n")}
                                    onChange={(e) => updateArray(i, "tags", e.target.value)}
                                    rows={2}
                                    className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-sans text-[0.75rem] text-[var(--text-muted)] outline-none focus:border-[var(--accent-gold)] resize-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--accent-gold)]">Methods (one per line)</label>
                                <textarea
                                    value={(p.methods || []).join("\n")}
                                    onChange={(e) => updateArray(i, "methods", e.target.value)}
                                    rows={2}
                                    className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-sans text-[0.75rem] text-[var(--text-muted)] outline-none focus:border-[var(--accent-gold)] resize-none"
                                />
                            </div>
                            <div>
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--accent-gold)]">Datasets (one per line)</label>
                                <textarea
                                    value={(p.datasets || []).join("\n")}
                                    onChange={(e) => updateArray(i, "datasets", e.target.value)}
                                    rows={2}
                                    className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-sans text-[0.75rem] text-[var(--text-muted)] outline-none focus:border-[var(--accent-gold)] resize-none"
                                />
                            </div>
                            <div>
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--accent-gold)]">Results (one per line)</label>
                                <textarea
                                    value={(p.results || []).join("\n")}
                                    onChange={(e) => updateArray(i, "results", e.target.value)}
                                    rows={2}
                                    className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-sans text-[0.75rem] text-[var(--text-muted)] outline-none focus:border-[var(--accent-gold)] resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <button
                onClick={addProject}
                className="flex items-center gap-2 font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors mt-2"
            >
                <Plus size={12} /> Add Project
            </button>
        </div>
    );
}
