"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import React from "react"; // needed for React.Children.map

export function StaggerReveal({ children, className }: { children: ReactNode; className?: string }) {
    // We expect the children to be a set of HTML elements or components.
    // We will wrap them in a motion structure that orchestrates staggered reveals.

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.120, // 120ms delay
                delayChildren: 0.1,
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 18 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1] as const
            }
        }
    };

    return (
        <motion.div
            className={className}
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
        >
            {React.Children.map(children, (child, index) => {
                // Wrap each child in a motion.div item
                // If it's pure text or a fragment, we wrap it anyway
                return (
                    <motion.div key={index} variants={item}>
                        {child}
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
