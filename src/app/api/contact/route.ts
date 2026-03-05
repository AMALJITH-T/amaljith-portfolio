import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { ContactSchema } from "@/lib/validations";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = rateLimit(ip, { maxRequests: 5, windowMs: 60 * 1000 });

        if (!success) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const body = await req.json();
        const { name, email, message } = await ContactSchema.parseAsync(body);
        // We ensure variables are used to pass TS checks, though this is a mock endpoint.
        // console.log(`Received signal from ${name} (${email}): ${message.substring(0, 10)}...`);

        // Mock processing/sending logic

        return NextResponse.json({ success: true, message: "Signal received." });
    } catch (error) {
        if (error instanceof ZodError) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return NextResponse.json({ error: "Invalid input structure", details: (error as any).errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Server error." }, { status: 500 });
    }
}
