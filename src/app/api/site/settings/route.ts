import { NextResponse } from "next/server";
import { defaultSiteSettings } from "@/lib/types";

export async function GET() {
    return NextResponse.json(defaultSiteSettings);
}
