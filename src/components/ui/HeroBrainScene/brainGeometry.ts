/**
 * brainGeometry.ts
 * Parametric human brain surface in 3D spherical coordinates.
 * Generates point positions that clearly resemble a human brain.
 *
 * Anatomical features modeled:
 *  - Two cerebral hemispheres with medial longitudinal fissure
 *  - Temporal lobes (lateral, inferior protrusions)
 *  - Frontal and occipital lobe bulges
 *  - Cerebellum (posterior-inferior)
 *  - Gyri/sulci surface texture
 *
 * All Math.random() calls are inside this function — only call from useEffect.
 */

// ── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────
function mulberry32(seed: number) {
    let s = seed | 0;
    return function () {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── Angular distance helper (wraps correctly over 0/2π) ─────────────────────
function angDist(a: number, b: number): number {
    const d = Math.abs(a - b) % (2 * Math.PI);
    return d > Math.PI ? 2 * Math.PI - d : d;
}

/**
 * Returns brain surface radius at polar (phi) and azimuthal (theta) angles.
 * phi  ∈ [0, π]   — 0 = top, π = bottom
 * theta ∈ [0, 2π] — 0 = front, π/2 = right, π = back, 3π/2 = left
 */
export function brainRadiusAt(phi: number, theta: number): number {
    let r = 1.0;

    // ── Lower-body flattening (brainstem area) ───────────────────────────────
    const bottomFrac = Math.max(0, (phi - Math.PI * 0.60) / (Math.PI * 0.40));
    r -= 0.28 * bottomFrac * bottomFrac;

    // ── Medial longitudinal fissure (top-center groove) ──────────────────────
    // Creates the inter-hemispheric gap visible from front and top
    const dFront = angDist(theta, 0);
    const dBack = angDist(theta, Math.PI);
    const midline = Math.min(dFront, dBack);
    if (phi < Math.PI * 0.58) {
        r -= 0.10 * Math.exp(-20 * midline * midline) * Math.sin(phi * 2.5);
    }

    // ── Temporal lobes ───────────────────────────────────────────────────────
    // Right temporal (theta ≈ π/2), left temporal (theta ≈ 3π/2)
    // They extend downward and laterally: phi ≈ 0.70π
    const phiTemp = Math.PI * 0.69;
    const phiSigT = 0.16;
    const tempPhiFactor = Math.exp(-((phi - phiTemp) ** 2) / (2 * phiSigT * phiSigT));

    const dRight = angDist(theta, Math.PI * 0.5);
    const dLeft = angDist(theta, Math.PI * 1.5);
    r += 0.32 * tempPhiFactor * Math.exp(-3.5 * dRight * dRight);
    r += 0.32 * tempPhiFactor * Math.exp(-3.5 * dLeft * dLeft);

    // ── Frontal lobe emphasis ─────────────────────────────────────────────────
    // Frontal bulge: top-front (phi ≈ 0.38π, theta ≈ 0)
    const phiFront = Math.PI * 0.36;
    r += 0.18 * Math.exp(-4 * (phi - phiFront) ** 2)
        * Math.exp(-1.8 * dFront * dFront);

    // ── Occipital lobe ────────────────────────────────────────────────────────
    // Back protrusion: phi ≈ 0.42π, theta ≈ π
    r += 0.14 * Math.exp(-4 * (phi - Math.PI * 0.44) ** 2)
        * Math.exp(-2.5 * dBack * dBack);

    // ── Parietal widening (top-back sides) ───────────────────────────────────
    r += 0.08 * Math.exp(-6 * (phi - Math.PI * 0.30) ** 2)
        * (1 - Math.exp(-2 * midline * midline));

    // ── Cerebellum ────────────────────────────────────────────────────────────
    // Small posterior-inferior bulge: phi ≈ 0.82π, theta ≈ π
    r += 0.20 * Math.exp(-5 * (phi - Math.PI * 0.82) ** 2)
        * Math.exp(-2.2 * dBack * dBack);

    // ── Gyri/sulci surface texture ────────────────────────────────────────────
    r += 0.040 * Math.sin(9 * phi + 1.5) * Math.sin(7 * theta - 0.7);
    r += 0.028 * Math.sin(14 * phi - 2.3) * Math.cos(11 * theta + 0.9);
    r += 0.020 * Math.cos(11 * phi + 3.1) * Math.sin(8 * theta - 1.8);
    r += 0.015 * Math.sin(20 * phi - 1.0) * Math.cos(16 * theta + 0.4);
    r += 0.010 * Math.sin(25 * phi + 2.7) * Math.cos(19 * theta - 2.1);

    return Math.max(0.45, r);
}

// ── Surface point generation ─────────────────────────────────────────────────
export interface BrainSurface {
    positions: Float32Array;  // xyz flat array
    symbolIndices: Float32Array;  // per-point symbol index [0, symbolCount)
    phases: Float32Array;  // per-point animation phase offset
}

/**
 * Samples `count` points uniformly on the parametric brain surface.
 * Uses seeded PRNG for deterministic, hydration-safe output.
 * Scale: rx=1.2 (width), ry=1.0 (height), rz=1.35 (front-to-back depth).
 */
export function generateBrainSurface(count: number, symbolCount: number): BrainSurface {
    const rng = mulberry32(0xBEA42DA1);

    const positions = new Float32Array(count * 3);
    const symbolIndices = new Float32Array(count);
    const phases = new Float32Array(count);

    // Anisotropic scale — wider in X than Y, elongated front-to-back
    const rx = 1.30, ry = 1.05, rz = 1.40;

    for (let i = 0; i < count; i++) {
        // Uniform spherical sampling: phi via arccos, theta via uniform
        const u = rng();
        const v = rng();
        const phi = Math.acos(Math.max(-1, Math.min(1, 1 - 2 * u)));
        const theta = v * Math.PI * 2;

        const r = brainRadiusAt(phi, theta);

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) * rx;
        positions[i * 3 + 1] = r * Math.cos(phi) * ry;
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * rz;

        symbolIndices[i] = Math.floor(rng() * symbolCount);
        phases[i] = rng() * Math.PI * 2;
    }

    return { positions, symbolIndices, phases };
}
