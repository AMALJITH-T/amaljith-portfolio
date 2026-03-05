/**
 * moderation.ts
 * Synchronous keyword pre-filter (Layer 1).
 * OpenAI moderation API is Layer 2 (in the API routes).
 * Layer 1 must catch clear-cut violations instantly at zero latency.
 */

const BLOCK_PATTERNS: RegExp[] = [
    // ── Single profanity words (no repeat required) ─────────────────────────
    /\bf+u+c+k+(e[dr]|ing|s|off?)?\b/i,
    /\bs+h+i+t+s?\b/i,
    /\ba+s+s+(h+o+l+e+|f+a+c+e+)?\b/i,
    /\bb+i+t+c+h+(e[ds]|ing)?\b/i,
    /\bc+u+n+t+s?\b/i,
    /\bd+i+c+k+(s|h+e+a+d+)?\b/i,
    /\bp+i+s+s+(e[ds]|off?)?\b/i,
    /\bw+h+o+r+e+s?\b/i,
    /\bf+a+g+(g+o+t+)?\b/i,

    // ── Slurs (obfuscation-resistant) ───────────────────────────────────────
    /\bn[i1*]+g+[ae3*]+r+/i,
    /\bk[i1*]+k[e3*]+\b/i,
    /\bsp[i1*]+c+\b/i,

    // ── Threats ─────────────────────────────────────────────────────────────
    /\b(i.{0,25}(kill|murder|rape|bomb|shoot|stab)\s+(you|u|ur|your))\b/i,
    /\b(kill\s+your(self)?|kys|end\s+your\s+life)\b/i,

    // ── Spam patterns ────────────────────────────────────────────────────────
    /(https?:\/\/\S+\s*){3,}/,
    /\b(buy\s+now|click\s+here|limited\s+offer|earn\s+(cash|money)\s+fast)\b/i,
    /(.)\1{9,}/,  // 10+ repeated chars
];

const SUSPICIOUS_PATTERNS: RegExp[] = [
    /[A-Z]{60,}/,
    /(https?:\/\/\S+\s*){2,}/,
    /[!?]{5,}/,
    /(\b\w+\b)(\s+\1){4,}/i,
];

/** Hard block — returns ok:false for clear violations. Zero latency. */
export function filterContent(text: string): { ok: boolean } {
    for (const pat of BLOCK_PATTERNS) {
        if (pat.test(text)) return { ok: false };
    }
    return { ok: true };
}

/** Soft flag — suspicious but not definitively blocked. */
export function isSuspicious(text: string): boolean {
    return SUSPICIOUS_PATTERNS.some((p) => p.test(text));
}
