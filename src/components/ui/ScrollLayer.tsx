"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface ScrollLayerProps {
    /** 0 = foreground (full speed), 10 = deep background (very slow) */
    depth?: number;
    children: React.ReactNode;
    className?: string;
    /** Override the scroll range used for the transform */
    inputRange?: [number, number];
}

/**
 * ScrollLayer — wraps children in a parallax depth layer.
 * depth=0: moves at normal scroll speed (foreground)
 * depth=5: mid layer (slower)
 * depth=10: background layer (very slow, almost static)
 */
export function ScrollLayer({
    depth = 0,
    children,
    className,
    inputRange = [0, 1],
}: ScrollLayerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    // Speed multiplier: depth=0 → yFactor=-30, depth=10 → yFactor=-3
    const speedFactor = 1 - depth / 11;
    const yRange = 80 * speedFactor;

    const y: MotionValue<number> = useTransform(
        scrollYProgress,
        inputRange,
        [-yRange / 2, yRange / 2]
    );

    return (
        <motion.div ref={ref} style={{ y }} className={className}>
            {children}
        </motion.div>
    );
}

/**
 * HeroScrollLayer — for the hero specifically, uses root scroll
 * rather than element scroll for the depth effect.
 */
export function HeroScrollLayer({
    depth = 0,
    children,
    className,
}: Omit<ScrollLayerProps, "inputRange">) {
    const { scrollYProgress } = useScroll();

    const speedFactor = 1 - depth / 11;
    const yRange = 200 * speedFactor;

    const y = useTransform(scrollYProgress, [0, 0.4], [0, yRange]);
    const opacity = useTransform(scrollYProgress, [0, 0.15], [1, depth < 3 ? 0.6 : 1]);

    return (
        <motion.div style={{ y, opacity }} className={className}>
            {children}
        </motion.div>
    );
}
