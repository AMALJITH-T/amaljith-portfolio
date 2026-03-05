"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// ── Admin unlock constants ─────────────────────────────────────────────────────
const UNLOCK_CLICKS = 7;        // Required sequential clicks
const CLICK_WINDOW_MS = 4000;   // Window resets after this idle period
const DEBOUNCE_MS = 150;        // Ignore clicks faster than this

function smoothScrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

export function Header() {
    const [hidden, setHidden] = useState(false);
    const [atTop, setAtTop] = useState(true);
    const { scrollY } = useScroll();
    const pathname = usePathname();
    const router = useRouter();

    // ── Admin unlock refs (no state — zero re-renders) ─────────────────────────
    const clickCount = useRef(0);
    const lastClickTime = useRef(0);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string | null) => {
        if (!targetId) return;
        e.preventDefault();
        if (pathname === "/") {
            smoothScrollTo(targetId);
        } else {
            router.push("/");
            setTimeout(() => smoothScrollTo(targetId), 500);
        }
    };

    // ── Logo click handler ─────────────────────────────────────────────────────
    const handleLogoClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            const now = Date.now();
            const gap = now - lastClickTime.current;

            // Debounce — ignore hyper-fast clicks
            if (gap < DEBOUNCE_MS) return;

            // Reset window if user paused too long
            if (gap > CLICK_WINDOW_MS) {
                clickCount.current = 0;
            }

            clickCount.current += 1;
            lastClickTime.current = now;

            // Clear and re-arm the idle reset timer
            if (resetTimer.current) clearTimeout(resetTimer.current);
            resetTimer.current = setTimeout(() => {
                clickCount.current = 0;
            }, CLICK_WINDOW_MS);

            // Threshold reached — navigate to admin
            if (clickCount.current >= UNLOCK_CLICKS) {
                clickCount.current = 0;
                if (resetTimer.current) clearTimeout(resetTimer.current);
                e.preventDefault(); // override the "/" href
                router.push("/admin");
                return;
            }

            // Normal home navigation only on the first click (navigates once)
            // Subsequent clicks within the window don't re-navigate
        },
        [router]
    );

    // ── Shift+A keyboard shortcut ──────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === "A") {
                router.push("/admin");
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [router]);

    // ── Scroll hide/show ───────────────────────────────────────────────────────
    useMotionValueEvent(scrollY, "change", (latest) => {
        const prev = scrollY.getPrevious() ?? 0;
        setAtTop(latest < 40);
        setHidden(latest > prev && latest > 100);
    });

    return (
        <motion.header
            animate={{ y: hidden ? -80 : 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 right-0 z-50"
        >
            {/* Centering shell — max 1440px, clamp horizontal padding */}
            <div
                className={`transition-all duration-600 ${!atTop
                    ? "bg-[rgba(5,5,5,0.85)] backdrop-blur-[10px] border-b border-[var(--border)]"
                    : "bg-transparent"
                    }`}
            >
                <div
                    className="flex items-center justify-between py-5 mx-auto"
                    style={{
                        maxWidth: "1440px",
                        paddingLeft: "clamp(24px, 4vw, 72px)",
                        paddingRight: "clamp(24px, 4vw, 72px)",
                    }}
                >
                    {/* Monogram — secret 7-click admin unlock */}
                    <Link
                        href="/"
                        onClick={handleLogoClick}
                        className="font-serif text-[1.4rem] text-[var(--text-primary)] tracking-tight hover:text-[var(--accent-gold)] transition-colors duration-600"
                        aria-label="Home"
                    >
                        A.T.
                    </Link>

                    {/* Navigation */}
                    <nav>
                        <ul className="flex items-center gap-8">
                            {["WORK", "RESEARCH", "CURIOSITY", "COMMONS", "SIGNAL"].map((item) => (
                                <li key={`/${item.toLowerCase()}`}>
                                    <a
                                        href={`/${item.toLowerCase()}`}
                                        onClick={(e) => handleNav(e, null)}
                                        className="font-sans text-[0.78rem] tracking-widest uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-400 relative group cursor-pointer"
                                    >
                                        {item}
                                        <span
                                            className="absolute -bottom-[2px] left-0 w-full h-[3px] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-600 ease-luxury"
                                            style={{
                                                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'3\' viewBox=\'0 0 24 3\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 1.5 L6 1.5 L8 0 L12 3 L14 1.5 L24 1.5\' stroke=\'%23c29b27\' fill=\'none\' stroke-width=\'0.8\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                                                backgroundRepeat: 'repeat-x',
                                                opacity: 0.8
                                            }}
                                        />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </div>
        </motion.header>
    );
}

