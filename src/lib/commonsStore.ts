/**
 * commonsStore.ts
 *
 * Serverless-compatible in-memory KV store for Commons thread data.
 *
 * Key format: "thread:{id}"  →  Thread object
 * Hot-seeded from data/commons.json at cold start (read-only is fine on Vercel).
 * All mutations are in-memory — resets on Lambda cold start.
 *
 * Drop-in swap: replace the Map with @vercel/kv for true persistence.
 */

import { readFileSync } from "fs";
import { join } from "path";
import type { CommonsData, CommonsStatus, Thread, Reply } from "./types";

// ── Global singleton (survives warm Lambda invocations) ───────────────────────
const kvStore = new Map<string, Thread>();
let commonsStatus: CommonsStatus = "active";
let seeded = false;

function seed() {
    if (seeded) return;
    seeded = true;
    try {
        const raw = readFileSync(join(process.cwd(), "data", "commons.json"), "utf-8");
        const data = JSON.parse(raw) as CommonsData;
        commonsStatus = data.status ?? "active";
        for (const thread of data.threads ?? []) {
            kvStore.set(`thread:${thread.id}`, thread);
        }
    } catch {
        // No seed file — start empty (normal on Vercel)
    }
}

// ── KV helpers ────────────────────────────────────────────────────────────────

/** Returns all threads. Archived threads only included when includeArchived = true. */
export function getAllThreads(opts: { includeArchived?: boolean } = {}): Thread[] {
    seed();
    const threads = [...kvStore.values()];
    const filtered = opts.includeArchived ? threads : threads.filter((t) => !t.archived);
    return filtered.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
}

export function getThread(id: string): Thread | undefined {
    seed();
    return kvStore.get(`thread:${id}`);
}

export function addThread(thread: Thread): void {
    seed();
    kvStore.set(`thread:${thread.id}`, thread);
}

export function updateThread(id: string, patch: Partial<Thread>): Thread | null {
    seed();
    const existing = kvStore.get(`thread:${id}`);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    kvStore.set(`thread:${id}`, updated);
    return updated;
}

export function deleteThread(id: string): boolean {
    seed();
    return kvStore.delete(`thread:${id}`);
}

export function addReply(threadId: string, reply: Reply): Thread | null {
    seed();
    const thread = kvStore.get(`thread:${threadId}`);
    if (!thread) return null;
    const updated = { ...thread, replies: [...thread.replies, reply] };
    kvStore.set(`thread:${threadId}`, updated);
    return updated;
}

export function getStatus(): CommonsStatus {
    seed();
    return commonsStatus;
}

export function setStatus(status: CommonsStatus): void {
    seed();
    commonsStatus = status;
}
