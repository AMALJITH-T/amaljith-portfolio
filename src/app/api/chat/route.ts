import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { ChatRequest } from "@/lib/types";
import { rateLimit } from "@/lib/rate-limit";
import { ChatRequestSchema } from "@/lib/validations";
import { ZodError } from "zod";

// Server-side only — API key never reaches the client.
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiter utility imported globally

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a research assistant embedded in an interdisciplinary AI/ML research website belonging to Amaljith T, an undergraduate researcher at SRM Institute of Science and Technology (2023–2027), Chennai.

The site documents an active research journey across AI/ML, biosignal analytics, computational geometry (as a tool), and a long-term direction toward intelligent medical systems.

Key facts:
- Projects: Feelosophy Core (biosignal cycle prediction), CampusWeb (academic performance analytics), CalCOFI (oceanographic sensor calibration)
- Research: NIT Calicut internship (computational geometry, spatial image processing, C++/OpenCV/LibIGL/CGAL), SRM UROP (insider threat detection, behavioural anomaly modelling)
- Site pages: Work, Research, Curiosity (thought archive), Commons (discussion), Signal (contact)

Tone: calm, intelligent, curious. Slightly witty but never sarcastic or cringe.
Encourage thoughtful exploration. Keep responses to 2–4 sentences unless more is clearly warranted.
Do not fabricate achievements, publications, or affiliations.
If the user uses inappropriate language, redirect gracefully — no scolding.
Never use hollow phrases like "Certainly!" or "Great question!"`;

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = rateLimit(ip, { maxRequests: 10, windowMs: 60 * 1000 });

        if (!success) {
            return NextResponse.json(
                { reply: "You're moving fast — give me a moment to think." },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { messages } = await ChatRequestSchema.parseAsync(body);

        if (messages.length === 0) {
            return NextResponse.json({ reply: "What would you like to know?" });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages.map((m) => ({
                    role: m.role as "user" | "assistant",
                    content: m.content,
                })),
            ],
            max_tokens: 350,
            temperature: 0.7,
        });

        const reply = completion.choices[0]?.message?.content?.trim() ?? "I didn't catch that — could you rephrase?";

        return NextResponse.json({ reply });

    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json({ reply: "I couldn't process that message. Please try again." }, { status: 400 });
        }
        // console.error("[chat/route] OpenAI error:", error);
        return NextResponse.json(
            { reply: "The assistant is temporarily unavailable. Please try again." },
            { status: 500 }
        );
    }
}
