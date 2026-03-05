import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { password } = body;

        if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const session = await signToken({ admin: true, expiresAt });

        const response = NextResponse.json({ success: true });
        response.cookies.set("admin_session", session, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
            expires: expiresAt,
        });

        return response;
    } catch {
        return NextResponse.json({ error: "Server error." }, { status: 500 });
    }
}
