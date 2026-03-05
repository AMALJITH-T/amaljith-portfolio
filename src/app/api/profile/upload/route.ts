import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Saves an uploaded portrait image to /public/uploads/portrait-<timestamp>.<ext>
// Returns the public URL path.
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided." }, { status: 400 });
        }

        // Validate MIME type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Only JPEG, PNG, WebP, or AVIF images are accepted." }, { status: 415 });
        }

        // Limit size: 4 MB
        if (file.size > 4 * 1024 * 1024) {
            return NextResponse.json({ error: "Image must be under 4 MB." }, { status: 413 });
        }

        const ext = file.type.split("/")[1].replace("jpeg", "jpg");
        const filename = `portrait-${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(path.join(uploadDir, filename), buffer);

        return NextResponse.json({ success: true, url: `/uploads/${filename}` });
    } catch {
        return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }
}
