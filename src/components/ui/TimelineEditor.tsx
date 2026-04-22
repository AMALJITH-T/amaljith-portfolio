"use client";

import { TimelineEvent } from "@/lib/types";
import { Trash2, Plus } from "lucide-react";

export function TimelineEditor({
    events,
    onChange,
}: {
    events: TimelineEvent[];
    onChange: (e: TimelineEvent[]) => void;
}) {
    const addEvent = () => {
        onChange([...events, {
            year: String(new Date().getFullYear()),
            title: "New Timeline Event",
            description: "",
            tags: [],
        }]);
    };

    const remove = (idx: number) => onChange(events.filter((_, i) => i !== idx));

    const update = (idx: number, patch: Partial<TimelineEvent>) => {
        const next = [...events];
        next[idx] = { ...next[idx], ...patch };
        onChange(next);
    };

    const moveUp = (idx: number) => {
        if (idx === 0) return;
        const next = [...events];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        onChange(next);
    };

    const moveDown = (idx: number) => {
        if (idx === events.length - 1) return;
        const next = [...events];
        [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
        onChange(next);
    };

    const updateTags = (idx: number, value: string) => {
        const arr = value.split("\n").map(s => s.trim()).filter(Boolean);
        update(idx, { tags: arr });
    };

    return (
        <div className="space-y-6">
            {events.map((evt, i) => (
                <div key={`${evt.title}-${i}`} className="border border-[var(--border)] p-5 space-y-4 relative">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                        <input
                            type="text"
                            value={evt.title}
                            onChange={(e) => update(i, { title: e.target.value })}
                            className="bg-transparent font-serif text-[1.2rem] text-[var(--text-primary)] outline-none focus:text-[var(--accent-gold)] w-full transition-colors"
                        />
                        <div className="flex items-center gap-4 ml-4">
                            <div className="flex flex-col gap-1">
                                <button onClick={() => moveUp(i)} disabled={i === 0} className="text-[var(--text-dim)] hover:text-[var(--text-primary)] disabled:opacity-30">▲</button>
                                <button onClick={() => moveDown(i)} disabled={i === events.length - 1} className="text-[var(--text-dim)] hover:text-[var(--text-primary)] disabled:opacity-30">▼</button>
                            </div>
                            <button onClick={() => remove(i)} className="text-[var(--text-dim)] hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div>
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">Year</label>
                                <input
                                    type="text"
                                    value={evt.year}
                                    onChange={(e) => update(i, { year: e.target.value })}
                                    className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
                                />
                            </div>
                            <div>
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">Institution (Optional)</label>
                                <input
                                    type="text"
                                    value={evt.institution || ""}
                                    onChange={(e) => update(i, { institution: e.target.value })}
                                    className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
                                />
                            </div>
                            <div>
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">Target Label (Optional, eg. CURRENT SYSTEM)</label>
                                <input
                                    type="text"
                                    value={evt.targetLabel || ""}
                                    onChange={(e) => update(i, { targetLabel: e.target.value })}
                                    className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
                                />
                            </div>
                            <div>
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">Tags (one per line)</label>
                                <textarea
                                    value={(evt.tags || []).join("\n")}
                                    onChange={(e) => updateTags(i, e.target.value)}
                                    rows={3}
                                    className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-sans text-[0.75rem] text-[var(--text-muted)] outline-none focus:border-[var(--accent-gold)] resize-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="font-sans text-[0.62rem] tracking-widest uppercase text-[var(--text-dim)]">Description</label>
                                <textarea
                                    value={evt.description}
                                    onChange={(e) => update(i, { description: e.target.value })}
                                    rows={8}
                                    className="w-full bg-transparent border-b border-[var(--border)] pb-2 pt-1 font-sans text-[0.82rem] text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <button
                onClick={addEvent}
                className="flex items-center gap-2 font-sans text-[0.7rem] tracking-widest uppercase text-[var(--text-dim)] hover:text-[var(--accent-gold)] transition-colors mt-2"
            >
                <Plus size={12} /> Add Timeline Event
            </button>
        </div>
    );
}
