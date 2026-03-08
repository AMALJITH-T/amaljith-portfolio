import { NextRequest, NextResponse } from "next/server";
import { getThread, updateThread, deleteThread } from "@/lib/commonsStore";
import { verifyToken } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin(req: NextRequest): Promise<boolean> {
    const token = req.cookies.get("admin_session")?.value;
    const payload = await verifyToken(token);
    return payload !== null;
}

// GET /api/commons/[id] — single thread with all replies (non-archived only for public)
export async function GET(req: NextRequest, { params }: Params) {
    const { id } = await params;
    const admin = await requireAdmin(req);
    const thread = getThread(id);

    if (!thread || (!admin && thread.archived)) {
        return NextResponse.json({ error: "Thread not found." }, { status: 404 });
    }
    return NextResponse.json({ thread });
}

// PATCH /api/commons/[id] — admin: lock / unlock / pin / unpin / archive / unarchive / unflag / edit
export async function PATCH(req: NextRequest, { params }: Params) {
    const { id } = await params;

    if (!(await requireAdmin(req))) {
        return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const thread = getThread(id);
    if (!thread) {
        return NextResponse.json({ error: "Thread not found." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, content } = body as { action?: string; content?: string };

    let patch: Partial<typeof thread> = {};

    switch (action) {
        case "lock": patch = { locked: true }; break;
        case "unlock": patch = { locked: false }; break;
        case "pin": patch = { pinned: true }; break;
        case "unpin": patch = { pinned: false }; break;
        case "archive": patch = { archived: true }; break;
        case "unarchive": patch = { archived: false }; break;
        case "unflag": patch = { flagged: false }; break;
        case "edit":
            if (!content?.trim()) {
                return NextResponse.json({ error: "Content required for edit." }, { status: 400 });
            }
            patch = { content: content.trim().slice(0, 3000) };
            break;
        default:
            return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const updated = updateThread(id, patch);
    return NextResponse.json({ success: true, thread: updated });
}

// DELETE /api/commons/[id] — admin: permanent delete
export async function DELETE(req: NextRequest, { params }: Params) {
    const { id } = await params;

    if (!(await requireAdmin(req))) {
        return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const deleted = deleteThread(id);
    if (!deleted) {
        return NextResponse.json({ error: "Thread not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
