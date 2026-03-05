import { NextResponse } from "next/server";
import { defaultSiteConfig } from "@/lib/data";

export async function GET() {
    return NextResponse.json(defaultSiteConfig);
}
