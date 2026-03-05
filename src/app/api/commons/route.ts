import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import OpenAI from "openai";
import { filterContent, isSuspicious } from "@/lib/moderation";
import { CommonsData, Thread } from "@/lib/types";
import { rateLimit } from "@/lib/rate-limit";
import { ThreadSchema } from "@/lib/validations";
import { ZodError } from "zod";

const DATA_PATH = join(process.cwd(), "data", "commons.json");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Rate limiter now imported from global utility

function readData(): CommonsData {
    try { return JSON.parse(readFileSync(DATA_PATH, "utf-8")) as CommonsData; }
    catch { return { status: "active", threads: [] }; }
}
function writeData(data: CommonsData): void {
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ── Dual-layer moderation ─────────────────────────────────────────────────────
// Layer 1: synchronous keyword filter (zero latency)
// Layer 2: OpenAI omni-moderation-latest (authoritative, async)
async function moderateText(text: string): Promise<"ok" | "flagged" | "error"> {
    // Layer 1 — instant keyword check
    if (!filterContent(text).ok) {
        return "flagged";
    }
    // Layer 2 — AI moderation
    try {
        const moderation = await openai.moderations.create({
            model: "omni-moderation-latest",
            input: text,
        });
        return moderation.results[0].flagged ? "flagged" : "ok";
    } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 429) {
            // Rate limit on moderation API — keyword filter already passed, allow
            // console.warn("[moderation] 429 on moderation API, keyword filter passed — allowing.");
            return "ok";
        }
        // console.error("[moderation] OpenAI moderation error:", err);
        return "error";
    }
}

// GET /api/commons — public thread list (pinned first, archived excluded)
export async function GET() {
    const data = readData();
    const threads = data.threads
        .filter((t) => !t.archived)
        .sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
    return NextResponse.json({ status: data.status, threads });
}

// POST /api/commons — create thread
export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = rateLimit(ip, { maxRequests: 5, windowMs: 60 * 1000 });

        if (!success) {
            return NextResponse.json(
                { error: "Too many submissions. Please wait." },
                { status: 429 }
            );
        }

        const data = readData();

        if (data.status === "hold" || data.status === "locked") {
            return NextResponse.json(
                { error: "Discussion is temporarily paused." },
                { status: 403 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const { title, content, author } = await ThreadSchema.parseAsync(body);

        // Moderate title and content
        const [titleResult, contentResult] = await Promise.all([
            moderateText(title),
            moderateText(content),
        ]);

        if (titleResult === "flagged" || contentResult === "flagged") {
            return NextResponse.json(
                { error: "Content violates community guidelines." },
                { status: 400 }
            );
        }
        if (titleResult === "error" || contentResult === "error") {
            return NextResponse.json(
                { error: "Moderation service unavailable. Please try again." },
                { status: 503 }
            );
        }

        // Safe to store
        const thread: Thread = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: title.trim().slice(0, 200),
            content: content.trim().slice(0, 3000),
            author: (author?.trim() || "Anonymous").slice(0, 60),
            timestamp: new Date().toISOString(),
            pinned: false,
            locked: false,
            archived: false,
            flagged: isSuspicious(title) || isSuspicious(content),
            replies: [],
        };

        data.threads.unshift(thread);
        writeData(data);

        return NextResponse.json({ thread }, { status: 201 });

    } catch (error) {
        if (error instanceof ZodError) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Invalid input structure", details: (error as any).errors }, { status: 400 });
        }
        // console.error("[commons/POST] Unexpected error:", error);
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}
