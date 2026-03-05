import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { CommonsData } from "@/lib/types";

const DATA_PATH = join(process.cwd(), "data", "commons.json");

function readData(): CommonsData {
    try { return JSON.parse(readFileSync(DATA_PATH, "utf-8")) as CommonsData; }
    catch { return { status: "active", threads: [] }; }
}
function writeData(data: CommonsData): void {
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// GET /api/commons/status
export async function GET() {
    const { status } = readData();
    return NextResponse.json({ status });
}

// POST /api/commons/status — admin: set ACTIVE | HOLD | LOCKED
export async function POST(req: NextRequest) {
    const isAdmin = req.headers.get("x-admin") === "1";
    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { status } = body as { status?: string };

    const valid = ["active", "hold", "locked"];
    if (!status || !valid.includes(status)) {
        return NextResponse.json(
            { error: "status must be 'active', 'hold', or 'locked'." },
            { status: 400 }
        );
    }

    const data = readData();
    data.status = status as CommonsData["status"];
    writeData(data);

    return NextResponse.json({ status });
}
