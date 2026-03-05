import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { password } = body;

        if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        await createSession();
        return NextResponse.json({ success: true, message: "Authentication successful." });
    } catch {
        return NextResponse.json({ error: "Server error." }, { status: 500 });
    }
}
