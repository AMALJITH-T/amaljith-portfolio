/**
 * brainShape.ts
 * Parametric brain silhouette in normalized [-1, 1] space.
 * Generates point positions for the token field using rejection sampling.
 * All math runs once at module load — zero runtime cost.
 */

export interface BrainPoint {
    nx: number;  // normalized x [-1, 1]
    ny: number;  // normalized y [-1, 1]
    layer: 1 | 2 | 3;  // 1=surface, 2=mid, 3=interior
    depth: number; // 0 (center) → 1 (exact edge)
    angle: number; // polar angle for phase variation
}

// ── Brain boundary in polar coords ───────────────────────────────────────────
// Returns max radius at given polar angle — approximates a coronal brain section.
// The shape: wide rounded top (cerebrum), narrow base with midline indent.
export function brainRadius(angle: number): number {
    const a = angle;
    return (
        0.82
        - 0.06 * Math.cos(2 * a)           // horizontal stretch
        + 0.04 * Math.cos(4 * a)           // 4-lobe gyrus hint
        + 0.015 * Math.sin(6 * a)          // minor surface texture
        - 0.04 * Math.max(0, Math.sin(a + 1.5)) * 0.8  // frontal bulge
    );
}

// Bottom-center indent (brainstem attachment notch)
function brainRadiusAt(nx: number, ny: number): number {
    const ay = ny + 0.06; // center offset — brain sits slightly above (0,0)
    const angle = Math.atan2(ay, nx);
    let r = brainRadius(angle);

    // Narrow the lower-center region to create brainstem notch
    const bottomness = Math.max(0, -ay - 0.15) / 0.6;
    const midness = Math.max(0, 1.0 - Math.abs(nx) * 3.5);
    r -= bottomness * midness * 0.28;

    return r;
}

export function inBrain(nx: number, ny: number): boolean {
    const ay = ny + 0.06;
    const r = Math.sqrt(nx * nx + ay * ay);
    return r < brainRadiusAt(nx, ny);
}

// Depth from center (0) to edge (1) — determines layer assignment
export function brainDepth(nx: number, ny: number): number {
    const ay = ny + 0.06;
    const r = Math.sqrt(nx * nx + ay * ay);
    const rMax = brainRadiusAt(nx, ny);
    return Math.min(1, r / Math.max(0.001, rMax));
}

// ── Seeded RNG (Mulberry32) ───────────────────────────────────────────────────
function mulberry32(seed: number) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── Point generation ──────────────────────────────────────────────────────────
// Returns exactly `count` points sampled within the brain boundary.
// Uses seeded RNG for deterministic output (same positions on SSR and client).
export function generateBrainPoints(count: number): BrainPoint[] {
    const rng = mulberry32(0xBEEF1337);
    const points: BrainPoint[] = [];
    let attempts = 0;

    while (points.length < count && attempts < count * 20) {
        attempts++;
        // Sample in [-1, 1] x [-1, 1]
        const nx = rng() * 2 - 1;
        const ny = rng() * 2 - 1;

        if (!inBrain(nx, ny)) continue;

        const d = brainDepth(nx, ny);
        const angle = Math.atan2(ny + 0.06, nx);

        // Layer assignment: surface (depth > 0.72) = Layer 1, mid = 2, interior = 3
        let layer: 1 | 2 | 3;
        if (d > 0.72) layer = 1;
        else if (d > 0.38) layer = 2;
        else layer = 3;

        // Bias sampling toward the surface to make the outline visible
        // Accept surface points always, inner with lower probability
        const acceptP = d > 0.65 ? 1.0 : (d > 0.38 ? 0.8 : 0.6);
        if (rng() > acceptP) continue;

        points.push({ nx, ny, layer, depth: d, angle });
    }

    return points;
}
