import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { filterContent, isSuspicious } from "@/lib/moderation";
import { Thread } from "@/lib/types";
import { rateLimit } from "@/lib/rate-limit";
import { ThreadSchema } from "@/lib/validations";
import { ZodError } from "zod";
import { getAllThreads, addThread, getStatus } from "@/lib/commonsStore";
import { verifyToken } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function moderateText(text: string): Promise<"ok" | "flagged" | "error"> {
    if (!filterContent(text).ok) return "flagged";
    try {
        const moderation = await openai.moderations.create({
            model: "omni-moderation-latest",
            input: text,
        });
        return moderation.results[0].flagged ? "flagged" : "ok";
    } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 429) return "ok";
        return "error";
    }
}

/** Resolve whether the caller is an authenticated admin via JWT cookie. */
async function isAdminRequest(req: NextRequest): Promise<boolean> {
    const token = req.cookies.get("admin_session")?.value;
    const payload = await verifyToken(token);
    return payload !== null;
}

// GET /api/commons — public: active threads only; admin: all threads
export async function GET(req: NextRequest) {
    const admin = await isAdminRequest(req);
    const threads = getAllThreads({ includeArchived: admin });
    const status = getStatus();
    return NextResponse.json({ status, threads });
}

// POST /api/commons — public: create thread
export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = rateLimit(ip, { maxRequests: 5, windowMs: 60 * 1000 });
        if (!success) {
            return NextResponse.json({ error: "Too many submissions. Please wait." }, { status: 429 });
        }

        const status = getStatus();
        if (status === "hold" || status === "locked") {
            return NextResponse.json({ error: "Discussion is temporarily paused." }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const { title, content, author } = await ThreadSchema.parseAsync(body);

        const [titleResult, contentResult] = await Promise.all([
            moderateText(title),
            moderateText(content),
        ]);

        if (titleResult === "flagged" || contentResult === "flagged") {
            return NextResponse.json({ error: "Content violates community guidelines." }, { status: 400 });
        }
        if (titleResult === "error" || contentResult === "error") {
            return NextResponse.json({ error: "Moderation service unavailable. Please try again." }, { status: 503 });
        }

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

        addThread(thread);
        return NextResponse.json({ thread }, { status: 201 });

    } catch (error) {
        if (error instanceof ZodError) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Invalid input structure", details: (error as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}
