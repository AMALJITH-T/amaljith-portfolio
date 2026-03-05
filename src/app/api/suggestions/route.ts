import { NextRequest, NextResponse } from "next/server";
import { Draft, SuggestionResult } from "@/lib/types";
import { rateLimit } from "@/lib/rate-limit";
import { SuggestionSchema } from "@/lib/validations";
import { ZodError } from "zod";

// Heuristic ML suggestion engine — designed to be replaced with deeper ML models.
function analyzeDraft(draft: Pick<Draft, "title" | "content" | "tags">): SuggestionResult[] {
    const results: SuggestionResult[] = [];
    const wordCount = draft.content.trim().split(/\s+/).length;

    if (wordCount < 50) {
        results.push({
            type: "warning",
            message: `Draft is very short (${wordCount} words). Consider expanding the core idea.`,
            field: "content",
        });
    }

    if (!draft.title || draft.title.trim().length < 5) {
        results.push({
            type: "warning",
            message: "Title is missing or too brief.",
            field: "title",
        });
    }

    if (draft.tags.length === 0) {
        results.push({
            type: "info",
            message: "No tags assigned. Tagging helps with future retrieval and surfacing.",
            field: "tags",
        });
    }

    if (wordCount > 50 && wordCount < 150) {
        results.push({
            type: "info",
            message: "Consider adding a concrete example or analogy to ground the idea.",
            field: "content",
        });
    }

    if (results.length === 0) {
        results.push({
            type: "info",
            message: "Draft looks solid. Ready to develop further or publish.",
        });
    }

    return results;
}

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = rateLimit(ip, { maxRequests: 10, windowMs: 60 * 1000 });

        if (!success) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const body = await req.json();
        const { title, content, tags } = body;
        await SuggestionSchema.parseAsync(body);

        const suggestions = analyzeDraft({ title, content, tags: tags ?? [] });

        return NextResponse.json({ suggestions });
    } catch (error) {
        if (error instanceof ZodError) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Invalid input structure", details: (error as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Analysis failed." }, { status: 500 });
    }
}
