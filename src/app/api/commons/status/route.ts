import { NextRequest, NextResponse } from "next/server";
import { getStatus, setStatus } from "@/lib/commonsStore";
import { verifyToken } from "@/lib/auth";
import { CommonsData } from "@/lib/types";

// GET /api/commons/status — public
export async function GET() {
    const status = getStatus();
    return NextResponse.json({ status });
}

// POST /api/commons/status — admin: set ACTIVE | HOLD | LOCKED
export async function POST(req: NextRequest) {
    const token = req.cookies.get("admin_session")?.value;
    const payload = await verifyToken(token);
    if (!payload) {
        return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { status } = body as { status?: string };

    const valid: CommonsData["status"][] = ["active", "hold", "locked"];
    if (!status || !valid.includes(status as CommonsData["status"])) {
        return NextResponse.json(
            { error: "status must be 'active', 'hold', or 'locked'." },
            { status: 400 }
        );
    }

    setStatus(status as CommonsData["status"]);
    return NextResponse.json({ success: true, status });
}
