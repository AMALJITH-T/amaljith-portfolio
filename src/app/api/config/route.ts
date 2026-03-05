import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { SiteConfig } from "@/lib/types";
import { defaultSiteConfig } from "@/lib/data";

const STORE = path.join(process.cwd(), "data", "config.json");

async function readConfig(): Promise<SiteConfig> {
    try {
        const raw = await fs.readFile(STORE, "utf-8");
        return JSON.parse(raw) as SiteConfig;
    } catch {
        return defaultSiteConfig;
    }
}

export async function GET() {
    const config = await readConfig();
    return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as Partial<SiteConfig>;
        const current = await readConfig();

        // Merge with current, ensuring numbers remain numbers
        const updated: SiteConfig = {
            heroScientificImageUrl: typeof body.heroScientificImageUrl === "string" ? body.heroScientificImageUrl.slice(0, 512) : current.heroScientificImageUrl,
            heroScientificImageOpacity: typeof body.heroScientificImageOpacity === "number" ? body.heroScientificImageOpacity : current.heroScientificImageOpacity,
            heroScientificImageParallax: typeof body.heroScientificImageParallax === "number" ? body.heroScientificImageParallax : current.heroScientificImageParallax,
            heroVisualOpacity: typeof body.heroVisualOpacity === "number" ? body.heroVisualOpacity : current.heroVisualOpacity,
            signalPortraitOffsetY: typeof body.signalPortraitOffsetY === "number" ? body.signalPortraitOffsetY : current.signalPortraitOffsetY,
            signalPortraitScale: typeof body.signalPortraitScale === "number" ? body.signalPortraitScale : current.signalPortraitScale,
            signalPortraitRingGlow: typeof body.signalPortraitRingGlow === "number" ? body.signalPortraitRingGlow : current.signalPortraitRingGlow,
            goldenLineSpeed: typeof body.goldenLineSpeed === "number" ? body.goldenLineSpeed : current.goldenLineSpeed,
        };

        await fs.mkdir(path.dirname(STORE), { recursive: true });
        await fs.writeFile(STORE, JSON.stringify(updated, null, 2), "utf-8");

        return NextResponse.json({ success: true, config: updated });
    } catch {
        return NextResponse.json({ error: "Failed to save configuration." }, { status: 500 });
    }
}
