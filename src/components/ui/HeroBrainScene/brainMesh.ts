/**
 * brainMesh.ts
 * Generates a cortically-folded 3D brain mesh via procedural displacement
 * of a high-resolution sphere, then samples points from its surface triangles.
 *
 * Key properties:
 *  - Points live ON the surface, not filling the volume
 *  - Multi-frequency displacement creates visible gyri / sulci ridges
 *  - Surface normals returned for shading (front-facing = bright)
 *  - All Three.js geometry created client-side (useEffect safe)
 */

import * as THREE from "three";

// ── Shared Displacement Logic ───────────────────────────────────────────────
export function getFoldedPoint(phi: number, theta: number): { x: number, y: number, z: number } {
    const rx = 1.32, ry = 1.06, rz = 1.42;
    let r = brainMacroRadius(phi, theta);

    // Primary gyri
    r += 0.110 * Math.sin(12 * phi + 1.30) * Math.cos(10 * theta - 0.80);
    r += 0.090 * Math.cos(14 * phi - 0.70) * Math.sin(12 * theta + 1.10);
    // Secondary sulci
    r += 0.060 * Math.sin(20 * phi + 2.10) * Math.cos(18 * theta - 1.40);
    r += 0.048 * Math.cos(24 * phi - 1.20) * Math.sin(22 * theta + 0.60);
    // Fine
    r += 0.030 * Math.sin(32 * phi + 0.50) * Math.cos(28 * theta - 2.10);
    r += 0.018 * Math.cos(40 * phi - 1.80) * Math.sin(35 * theta + 1.30);

    const nx = Math.sin(phi) * Math.cos(theta);
    const ny = Math.cos(phi);
    const nz = Math.sin(phi) * Math.sin(theta);

    return { x: nx * r * rx, y: ny * r * ry, z: nz * r * rz };
}

// ── Seeded PRNG ───────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
    let s = seed | 0;
    return () => {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── Angular distance (wraps over 0/2π) ───────────────────────────────────────
function angDist(a: number, b: number): number {
    const d = Math.abs(a - b) % (Math.PI * 2);
    return d > Math.PI ? Math.PI * 2 - d : d;
}

// ── Macro brain shape in spherical coords ─────────────────────────────────────
// phi  ∈ [0, π]: polar angle  (0 = top)
// theta ∈ [−π, π]: azimuthal  (0 = front, π/2 = right, π = back)
function brainMacroRadius(phi: number, theta: number): number {
    let r = 1.0;

    const dFront = angDist(theta, 0);
    const dBack = angDist(theta, Math.PI);
    const midline = Math.min(dFront, dBack);

    // Brainstem / lower flattening
    const bFrac = Math.max(0, (phi - Math.PI * 0.60) / (Math.PI * 0.40));
    r -= 0.30 * bFrac * bFrac;

    // Medial longitudinal fissure (top groove between hemispheres)
    if (phi < Math.PI * 0.58) {
        r -= 0.11 * Math.exp(-18 * midline * midline) * Math.sin(phi * 2.5);
    }

    // Temporal lobes (lateral, inferior)
    const tFac = Math.exp(-((phi - Math.PI * 0.69) ** 2) / (2 * 0.16 * 0.16));
    r += 0.34 * tFac * Math.exp(-3.0 * angDist(theta, Math.PI * 0.50) ** 2);
    r += 0.34 * tFac * Math.exp(-3.0 * angDist(theta, Math.PI * 1.50) ** 2);

    // Frontal bulge (top-front)
    r += 0.20 * Math.exp(-3.5 * (phi - Math.PI * 0.36) ** 2) * Math.exp(-1.6 * dFront * dFront);

    // Occipital (back)
    r += 0.16 * Math.exp(-3.5 * (phi - Math.PI * 0.44) ** 2) * Math.exp(-2.2 * dBack * dBack);

    // Parietal widening (top-sides)
    r += 0.09 * Math.exp(-5 * (phi - Math.PI * 0.30) ** 2) * (1 - Math.exp(-1.5 * midline * midline));

    // Cerebellum (posterior-inferior)
    r += 0.22 * Math.exp(-4.5 * (phi - Math.PI * 0.83) ** 2) * Math.exp(-2.0 * dBack * dBack);

    return Math.max(0.42, r);
}

// ── Build folded brain geometry ───────────────────────────────────────────────
// Returns a THREE.BufferGeometry with displaced vertices and computed normals.
// Must be called client-side only.
export function generateFoldedBrainMesh(): THREE.BufferGeometry {
    // High-resolution sphere as base (4941 vertices ≈ 9600 triangles)
    const geo = new THREE.SphereGeometry(1, 80, 60);
    const posAttr = geo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
        const len = Math.sqrt(x * x + y * y + z * z) || 1;

        // Unit outward normal (= position on unit sphere)
        const nx = x / len, ny = y / len, nz = z / len;

        // Spherical coordinates: phi from Y (SphereGeometry Y = cos(phi))
        const phi = Math.acos(Math.max(-1, Math.min(1, ny)));
        const theta = Math.atan2(nz, nx);

        const pt = getFoldedPoint(phi, theta);
        posAttr.setXYZ(i, pt.x, pt.y, pt.z);
    }

    posAttr.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
}

// ── Surface point sampler ─────────────────────────────────────────────────────
export interface MeshSurface {
    positions: Float32Array;   // xyz, length = count × 3
    normals: Float32Array;   // xyz normalised surface normals, length = count × 3
    symbolIndices: Float32Array;   // which symbol to show, length = count
    phases: Float32Array;   // per-point animation phase, length = count
    glitchPhases: Float32Array;   // for glitch trigger, length = count
}

/**
 * Uniformly samples `count` points from the triangle mesh surface.
 * Barycentric interpolation gives exact on-surface positions + interpolated normals.
 */
export function sampleMeshSurface(
    geo: THREE.BufferGeometry,
    count: number,
    symbolCount: number
): MeshSurface {
    const rng = mulberry32(0xBEEF1234);

    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const normAttr = geo.attributes.normal as THREE.BufferAttribute;
    const idx = geo.index!;
    const triCount = idx.count / 3;

    const positions = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    const symbolIndices = new Float32Array(count);
    const phases = new Float32Array(count);
    const glitchPhases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        // Random triangle
        const tri = Math.floor(rng() * triCount);
        const ia = idx.getX(tri * 3);
        const ib = idx.getX(tri * 3 + 1);
        const ic = idx.getX(tri * 3 + 2);

        // Random barycentric coordinates (uniform distribution on triangle)
        let r1 = rng(), r2 = rng();
        if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
        const r3 = 1 - r1 - r2;

        // Interpolate position
        positions[i * 3] = posAttr.getX(ia) * r1 + posAttr.getX(ib) * r2 + posAttr.getX(ic) * r3;
        positions[i * 3 + 1] = posAttr.getY(ia) * r1 + posAttr.getY(ib) * r2 + posAttr.getY(ic) * r3;
        positions[i * 3 + 2] = posAttr.getZ(ia) * r1 + posAttr.getZ(ib) * r2 + posAttr.getZ(ic) * r3;

        // Interpolate normal and renormalise
        const nnx = normAttr.getX(ia) * r1 + normAttr.getX(ib) * r2 + normAttr.getX(ic) * r3;
        const nny = normAttr.getY(ia) * r1 + normAttr.getY(ib) * r2 + normAttr.getY(ic) * r3;
        const nnz = normAttr.getZ(ia) * r1 + normAttr.getZ(ib) * r2 + normAttr.getZ(ic) * r3;
        const nlen = Math.sqrt(nnx * nnx + nny * nny + nnz * nnz) || 1;
        normals[i * 3] = nnx / nlen;
        normals[i * 3 + 1] = nny / nlen;
        normals[i * 3 + 2] = nnz / nlen;

        symbolIndices[i] = Math.floor(rng() * symbolCount);
        phases[i] = rng() * Math.PI * 2;
        glitchPhases[i] = rng();
    }

    return { positions, normals, symbolIndices, phases, glitchPhases };
}

// ── Pick a random surface point (for pulse origins) ───────────────────────────
export function randomSurfacePoint(
    geo: THREE.BufferGeometry,
    seed: number
): THREE.Vector3 {
    const rng = mulberry32(seed);
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const idx = geo.index!;
    const tri = Math.floor(rng() * (idx.count / 3));
    const ia = idx.getX(tri * 3);
    let r1 = rng(), r2 = rng();
    if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
    const r3 = 1 - r1 - r2;
    return new THREE.Vector3(
        posAttr.getX(ia) * r3 + posAttr.getX(idx.getX(tri * 3 + 1)) * r1 + posAttr.getX(idx.getX(tri * 3 + 2)) * r2,
        posAttr.getY(ia) * r3 + posAttr.getY(idx.getX(tri * 3 + 1)) * r1 + posAttr.getY(idx.getX(tri * 3 + 2)) * r2,
        posAttr.getZ(ia) * r3 + posAttr.getZ(idx.getX(tri * 3 + 1)) * r1 + posAttr.getZ(idx.getX(tri * 3 + 2)) * r2,
    );
}

// ── Cortex Lines generation ───────────────────────────────────────────────────
export function generateCortexLines(numLines = 40, segments = 60): THREE.BufferGeometry {
    const rng = mulberry32(0x12345678);
    const positions = [];

    for (let k = 0; k < numLines; k++) {
        // Random starting region
        const basePhi = Math.PI * 0.1 + (rng() * 0.8) * Math.PI;
        const baseTheta = rng() * Math.PI * 2;

        let prevPt = null;
        for (let i = 0; i < segments; i++) {
            // spiral / contour around the folds slightly
            const phi = basePhi + Math.sin(i * 0.15) * 0.2;
            const theta = baseTheta + (i / segments) * 1.5;

            const pt = getFoldedPoint(phi, theta);

            if (prevPt) {
                positions.push(prevPt.x, prevPt.y, prevPt.z);
                positions.push(pt.x, pt.y, pt.z);
            }
            prevPt = pt;
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
}
