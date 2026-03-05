import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { SiteSettings, defaultSiteSettings } from "@/lib/types";

const SETTINGS_PATH = join(process.cwd(), "data", "site-settings.json");

function readSettings(): SiteSettings {
    try {
        return { ...defaultSiteSettings, ...JSON.parse(readFileSync(SETTINGS_PATH, "utf-8")) };
    } catch {
        return defaultSiteSettings;
    }
}

function writeSettings(s: SiteSettings): void {
    writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2), "utf-8");
}

// GET /api/site/settings
export async function GET() {
    return NextResponse.json(readSettings());
}

// PATCH /api/site/settings — admin-only partial update
export async function PATCH(req: NextRequest) {
    try {
        const patch = await req.json();
        const current = readSettings();

        // Deep-merge: allow partial updates (e.g. only heroTitle)
        const updated: SiteSettings = {
            ...current,
            ...patch,
            // Arrays replace entirely if provided
            orbitKeywords: patch.orbitKeywords ?? current.orbitKeywords,
            labFragments: patch.labFragments ?? current.labFragments,
        };

        writeSettings(updated);
        return NextResponse.json(updated);
    } catch (error) {
        // console.error("[site/settings PATCH]", error);
        return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
    }
}
