import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { CommonsData } from "@/lib/types";

const DATA_PATH = join(process.cwd(), "data", "commons.json");

function readData(): CommonsData {
    try {
        return JSON.parse(readFileSync(DATA_PATH, "utf-8")) as CommonsData;
    } catch {
        return { status: "active", threads: [] };
    }
}

function writeData(data: CommonsData): void {
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

type Params = { params: Promise<{ id: string }> };

// GET /api/commons/[id] — single thread with all replies
export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;
    const data = readData();
    const thread = data.threads.find((t) => t.id === id);
    if (!thread || thread.archived) {
        return NextResponse.json({ error: "Thread not found." }, { status: 404 });
    }
    return NextResponse.json({ thread });
}

// PATCH /api/commons/[id] — admin: lock / pin / archive / edit
export async function PATCH(req: NextRequest, { params }: Params) {
    const { id } = await params;
    const isAdmin = req.headers.get("x-admin") === "1";
    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const data = readData();
    const idx = data.threads.findIndex((t) => t.id === id);
    if (idx === -1) {
        return NextResponse.json({ error: "Thread not found." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, content } = body as { action?: string; content?: string };

    const thread = data.threads[idx];

    switch (action) {
        case "lock": thread.locked = true; break;
        case "unlock": thread.locked = false; break;
        case "pin": thread.pinned = true; break;
        case "unpin": thread.pinned = false; break;
        case "archive": thread.archived = true; break;
        case "unarchive": thread.archived = false; break;
        case "unflag": thread.flagged = false; break;
        case "edit":
            if (content?.trim()) {
                thread.content = content.trim().slice(0, 3000);
            }
            break;
        default:
            return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    data.threads[idx] = thread;
    writeData(data);
    return NextResponse.json({ thread });
}

// DELETE /api/commons/[id] — admin: permanent delete
export async function DELETE(req: NextRequest, { params }: Params) {
    const { id } = await params;
    const isAdmin = req.headers.get("x-admin") === "1";
    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const data = readData();
    const before = data.threads.length;
    data.threads = data.threads.filter((t) => t.id !== id);

    if (data.threads.length === before) {
        return NextResponse.json({ error: "Thread not found." }, { status: 404 });
    }

    writeData(data);
    return NextResponse.json({ ok: true });
}
