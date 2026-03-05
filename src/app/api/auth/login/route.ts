import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { password } = body;

        if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
            return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 });
        }

        const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
        const session = await signToken({ admin: true, expiresAt });

        const cookieStore = await cookies();
        cookieStore.set("admin_session", session, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 6
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch {
        return new Response(JSON.stringify({ error: "Server error." }), { status: 500 });
    }
}
