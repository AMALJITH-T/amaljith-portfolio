"use client";

import { useEffect, useState } from "react";
import { motion, Variants, Transition } from "framer-motion";

export function CustomCursor() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only run on desktop/devices with fine pointer
        if (window.matchMedia("(pointer: coarse)").matches) return;

        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if hovering over clickable elements
            if (target.closest('a') || target.closest('button') || target.closest('input') || target.closest('[data-clickable="true"]')) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        window.addEventListener("mousemove", updateMousePosition);
        window.addEventListener("mouseover", handleMouseOver);
        document.body.addEventListener("mouseleave", handleMouseLeave);
        document.body.addEventListener("mouseenter", handleMouseEnter);

        return () => {
            window.removeEventListener("mousemove", updateMousePosition);
            window.removeEventListener("mouseover", handleMouseOver);
            document.body.removeEventListener("mouseleave", handleMouseLeave);
            document.body.removeEventListener("mouseenter", handleMouseEnter);
        };
    }, [isVisible]);

    if (!isVisible) return null;

    const springTransition: Transition = {
        type: "spring",
        stiffness: 150,
        damping: 15,
        mass: 0.5
    };

    const variants: Variants = {
        default: {
            x: mousePosition.x - 16,
            y: mousePosition.y - 16,
            width: 32,
            height: 32,
            backgroundColor: "transparent",
            border: "1px solid rgba(212,175,55,0.3)",
            transition: springTransition
        },
        hover: {
            x: mousePosition.x - 24,
            y: mousePosition.y - 24,
            width: 48,
            height: 48,
            backgroundColor: "rgba(212,175,55,0.05)",
            border: "1px solid rgba(212,175,55,0.6)",
            transition: springTransition
        }
    };

    return (
        <motion.div
            className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999] mix-blend-difference"
            variants={variants}
            animate={isHovering ? "hover" : "default"}
        />
    );
}
