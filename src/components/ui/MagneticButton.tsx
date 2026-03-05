"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLElement>) => void;
    href?: string;
    strength?: number;
    as?: "button" | "a";
}

export function MagneticButton({
    children,
    className = "",
    onClick,
    href,
    strength = 0.35,
    as: Tag = "button",
}: MagneticButtonProps) {
    const ref = useRef<HTMLDivElement>(null);
    // const [hovering, setHovering] = useState(false);

    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);

    const x = useSpring(rawX, { stiffness: 150, damping: 15, mass: 0.1 });
    const y = useSpring(rawY, { stiffness: 150, damping: 15, mass: 0.1 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        rawX.set((e.clientX - cx) * strength);
        rawY.set((e.clientY - cy) * strength);
    };

    const handleMouseLeave = () => {
        rawX.set(0);
        rawY.set(0);
    };

    return (
        <motion.div
            ref={ref}
            style={{ x, y }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="inline-block"
        >
            {Tag === "a" && href ? (
                <a
                    href={href}
                    onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
                    className={`inline-flex items-center gap-2 transition-all duration-600 ease-luxury ${className}`}
                >
                    {children}
                </a>
            ) : (
                <button
                    onClick={onClick}
                    className={`inline-flex items-center gap-2 transition-all duration-600 ease-luxury ${className}`}
                >
                    {children}
                </button>
            )}
        </motion.div>
    );
}
