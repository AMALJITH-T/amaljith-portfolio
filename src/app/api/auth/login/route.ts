import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { password } = body;

        // In a real application, use a strong hashed password or environment variable. 
        // We're mimicking the prior insecure behavior of just needing "access", but moving it to a secure cookie.
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

        if (password !== adminPassword) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await createSession();
        return NextResponse.json({ success: true, message: "Authentication successful." });
    } catch {
        return NextResponse.json({ error: "Server error." }, { status: 500 });
    }
}
