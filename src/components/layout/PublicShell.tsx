"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GoldenMotionLines } from "@/components/ui/GoldenMotionLines";
import { ChatWidget } from "@/components/ui/ChatWidget";
import { CursorHalo } from "@/components/ui/CursorHalo";

export function PublicShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname.startsWith("/admin");

    return (
        <>
            {!isAdmin && <Header />}
            {!isAdmin && <GoldenMotionLines />}
            {children}
            {!isAdmin && <Footer />}
            <ChatWidget />
            {!isAdmin && <CursorHalo />}
        </>
    );
}

