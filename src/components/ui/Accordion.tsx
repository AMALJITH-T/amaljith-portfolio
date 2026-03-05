"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

interface AccordionItem {
    id: string;
    title: string;
    content: string;
}

interface AccordionProps {
    items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
    const [open, setOpen] = useState<string | null>(null);

    return (
        <div className="divide-y divide-[var(--border)]">
            {items.map((item) => (
                <AccordionRow
                    key={item.id}
                    item={item}
                    isOpen={open === item.id}
                    onToggle={() => setOpen(open === item.id ? null : item.id)}
                />
            ))}
        </div>
    );
}

function AccordionRow({
    item,
    isOpen,
    onToggle,
}: {
    item: AccordionItem;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <div>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between py-6 text-left group"
                aria-expanded={isOpen}
            >
                <span className="font-serif text-[1.25rem] text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors duration-600 ease-luxury">
                    {item.title}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="text-[var(--accent-gold)] opacity-60 flex-shrink-0 ml-8"
                >
                    <Plus size={16} strokeWidth={1.5} />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: "hidden" }}
                    >
                        <div className="pb-8 pr-12">
                            <p className="text-[var(--text-muted)] font-sans text-[0.95rem] leading-relaxed">
                                {item.content}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
