import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.JWT_SECRET || "fallback-secret-for-development-do-not-use" + Date.now();
const encodedKey = new TextEncoder().encode(secretKey);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function signToken(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(encodedKey);
}

export async function verifyToken(token: string | undefined = "") {
    try {
        const { payload } = await jwtVerify(token, encodedKey, {
            algorithms: ["HS256"],
        });
        return payload;
    } catch {
        return null;
    }
}

export async function createSession() {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await signToken({ admin: true, expiresAt });

    const cookieStore = await cookies();
    cookieStore.set("admin_session", session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: expiresAt,
        sameSite: "lax",
        path: "/",
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("admin_session")?.value;
    const session = await verifyToken(cookie);
    if (!session) return null;

    // Check expiration manually as fallback
    if (session.expiresAt && new Date(session.expiresAt as string) < new Date()) {
        return null;
    }
    return session;
}
