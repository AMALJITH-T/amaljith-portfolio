// A simple in-memory rate limiter using a sliding window.
// In a distributed production environment, this should ideally be backed by Redis (e.g., upstash/ratelimit).

type TokenBucket = {
    tokens: number;
    lastRefill: number;
};

const store = new Map<string, TokenBucket>();

interface RateLimitConfig {
    maxRequests: number;    // Maximum requests allowed in the window
    windowMs: number;       // Window size in milliseconds
}

export function rateLimit(ip: string, config: RateLimitConfig) {
    const now = Date.now();

    // Create bucket if it doesn't exist
    if (!store.has(ip)) {
        store.set(ip, {
            tokens: config.maxRequests - 1,
            lastRefill: now,
        });
        return { success: true };
    }

    const bucket = store.get(ip)!;

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed * (config.maxRequests / config.windowMs));

    if (tokensToAdd > 0) {
        bucket.tokens = Math.min(config.maxRequests, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return { success: true };
    }

    return { success: false };
}
