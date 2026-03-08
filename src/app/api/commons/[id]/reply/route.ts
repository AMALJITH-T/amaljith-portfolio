import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { filterContent, isSuspicious } from "@/lib/moderation";
import { Reply } from "@/lib/types";
import { rateLimit } from "@/lib/rate-limit";
import { ReplySchema } from "@/lib/validations";
import { ZodError } from "zod";
import { getThread, getStatus, addReply } from "@/lib/commonsStore";

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

type Params = { params: Promise<{ id: string }> };

// POST /api/commons/[id]/reply — public, rate-limited
export async function POST(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = rateLimit(ip, { maxRequests: 10, windowMs: 60 * 1000 });
        if (!success) {
            return NextResponse.json({ error: "Too many requests." }, { status: 429 });
        }

        // Respect global Commons status
        const commonsStatus = getStatus();
        if (commonsStatus === "hold") {
            return NextResponse.json({ error: "Discussion is temporarily paused." }, { status: 403 });
        }
        if (commonsStatus === "locked") {
            return NextResponse.json({ error: "Replies are disabled in read-only mode." }, { status: 403 });
        }

        const thread = getThread(id);
        if (!thread || thread.archived) {
            return NextResponse.json({ error: "Thread not found." }, { status: 404 });
        }

        // Respect per-thread lock
        if (thread.locked) {
            return NextResponse.json({ error: "This thread has been locked." }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const { content, author } = await ReplySchema.parseAsync(body);

        const result = await moderateText(content);
        if (result === "flagged") {
            return NextResponse.json({ error: "Content violates community guidelines." }, { status: 400 });
        }
        if (result === "error") {
            return NextResponse.json({ error: "Moderation service unavailable. Please try again." }, { status: 503 });
        }

        const reply: Reply = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            content: content.trim().slice(0, 1500),
            author: (author?.trim() || "Anonymous").slice(0, 60),
            timestamp: new Date().toISOString(),
            flagged: isSuspicious(content),
        };

        const updated = addReply(id, reply);
        if (!updated) {
            return NextResponse.json({ error: "Thread not found." }, { status: 404 });
        }

        return NextResponse.json({ reply }, { status: 201 });

    } catch (error) {
        if (error instanceof ZodError) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Invalid input structure", details: (error as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}
