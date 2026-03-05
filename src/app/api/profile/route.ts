import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { Profile } from "@/lib/types";
import { defaultProfile } from "@/lib/data";

const STORE = path.join(process.cwd(), "data", "profile.json");

async function readProfile(): Promise<Profile> {
    try {
        const raw = await fs.readFile(STORE, "utf-8");
        return JSON.parse(raw) as Profile;
    } catch {
        return defaultProfile;
    }
}

export async function GET() {
    const profile = await readProfile();
    return NextResponse.json(profile);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as Partial<Profile>;

        // Merge with current, ignore unknown keys
        const current = await readProfile();
        const updated: Profile = {
            name: typeof body.name === "string" ? body.name.slice(0, 120) : current.name,
            role: typeof body.role === "string" ? body.role.slice(0, 120) : current.role,
            affiliation: typeof body.affiliation === "string" ? body.affiliation.slice(0, 120) : current.affiliation,
            portraitUrl: typeof body.portraitUrl === "string" ? body.portraitUrl.slice(0, 512) : current.portraitUrl,
        };

        await fs.mkdir(path.dirname(STORE), { recursive: true });
        await fs.writeFile(STORE, JSON.stringify(updated, null, 2), "utf-8");

        return NextResponse.json({ success: true, profile: updated });
    } catch {
        return NextResponse.json({ error: "Failed to save profile." }, { status: 500 });
    }
}
