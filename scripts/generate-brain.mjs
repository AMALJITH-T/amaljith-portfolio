/**
 * generate-brain.mjs  v2
 * Generates a higher-quality brain surface OBJ mesh.
 *
 * Key improvements over v1:
 *  - Medial fissure amplitude: -0.28 → -0.48 (creates a clear canyon between hemispheres)
 *  - Temporal lobes: +0.38 → +0.46 (much more pronounced lateral protrusions)
 *  - Frontal bulge: +0.22 → +0.28
 *  - Cerebellum: +0.25 → +0.30
 *  - Higher resolution: 110×80 instead of 90×70 (17,600 triangles)
 *  - Fold amplitude: slightly increased for more visible texture
 *
 * Run: node scripts/generate-brain.mjs
 */

import { writeFileSync, mkdirSync } from "fs";

function angDist(a, b) {
    const d = Math.abs(a - b) % (Math.PI * 2);
    return d > Math.PI ? Math.PI * 2 - d : d;
}

function brainRadius(phi, theta) {
    let r = 1.0;

    const dFront = angDist(theta, 0);
    const dBack = angDist(theta, Math.PI);
    const midline = Math.min(dFront, dBack);  // 0 at midline, grows laterally

    // ── Brainstem / inferior narrowing ───────────────────────────────────────
    const bFrac = Math.max(0, (phi - Math.PI * 0.60) / (Math.PI * 0.40));
    r -= 0.34 * bFrac * bFrac;

    // ── DEEP medial longitudinal fissure ─────────────────────────────────────
    // This is the MOST IMPORTANT feature for brain recognizability.
    // A deep narrow groove from top (phi≈0) to mid-level separates the hemispheres.
    if (phi < Math.PI * 0.65) {
        const fissureDepth = 0.48 * Math.sin(phi * 2.0);  // deepest at mid-latitude
        r -= fissureDepth * Math.exp(-62.0 * midline * midline);
    }

    // ── Temporal lobes (lateral protrusions at phi~0.68π) ────────────────────
    const phiT = Math.PI * 0.68;
    const phiSigT = 0.14;
    const tFac = Math.exp(-((phi - phiT) ** 2) / (2 * phiSigT * phiSigT));
    r += 0.46 * tFac * Math.exp(-2.0 * angDist(theta, Math.PI * 0.5) ** 2);
    r += 0.46 * tFac * Math.exp(-2.0 * angDist(theta, Math.PI * 1.5) ** 2);

    // ── Frontal lobe (top-front bulge) ────────────────────────────────────────
    r += 0.28 * Math.exp(-3.2 * (phi - Math.PI * 0.33) ** 2)
        * Math.exp(-1.3 * dFront * dFront);

    // ── Occipital lobe ────────────────────────────────────────────────────────
    r += 0.20 * Math.exp(-3.5 * (phi - Math.PI * 0.42) ** 2)
        * Math.exp(-2.2 * dBack * dBack);

    // ── Parietal widening ─────────────────────────────────────────────────────
    r += 0.12 * Math.exp(-5.0 * (phi - Math.PI * 0.28) ** 2)
        * (1 - Math.exp(-1.0 * midline * midline));

    // ── Cerebellum ────────────────────────────────────────────────────────────
    r += 0.30 * Math.exp(-4.5 * (phi - Math.PI * 0.84) ** 2)
        * Math.exp(-1.8 * dBack * dBack);

    // ── Gyri / sulci folds (no folds at the midline fissure) ─────────────────
    const foldMask = 1 - Math.exp(-12.0 * midline * midline);
    r += foldMask * 0.130 * Math.sin(11 * phi + 1.20) * Math.cos(9 * theta - 0.70);
    r += foldMask * 0.100 * Math.cos(14 * phi - 0.80) * Math.sin(11 * theta + 1.00);
    r += foldMask * 0.075 * Math.sin(20 * phi + 2.00) * Math.cos(17 * theta - 1.30);
    r += foldMask * 0.052 * Math.cos(26 * phi - 1.10) * Math.sin(23 * theta + 0.50);
    r += foldMask * 0.034 * Math.sin(34 * phi + 0.40) * Math.cos(29 * theta - 2.00);
    r += foldMask * 0.022 * Math.cos(42 * phi - 1.70) * Math.sin(37 * theta + 1.20);

    return Math.max(0.38, r);
}

// ── UV sphere at 110×80 resolution → 17,600 triangles ───────────────────────
const W = 110, H = 80;
const RX = 1.36, RY = 1.10, RZ = 1.46;   // anisotropic scaling (wider, taller)

const vertices = [];
const normals = [];
const indices = [];

for (let j = 0; j <= H; j++) {
    const phi = (j / H) * Math.PI;
    for (let i = 0; i <= W; i++) {
        const theta = (i / W) * Math.PI * 2;
        const nx0 = Math.sin(phi) * Math.cos(theta);
        const ny0 = Math.cos(phi);
        const nz0 = Math.sin(phi) * Math.sin(theta);
        const r = brainRadius(phi, theta);
        vertices.push(nx0 * r * RX, ny0 * r * RY, nz0 * r * RZ);
        normals.push(nx0, ny0, nz0);   // placeholder, recomputed below
    }
}

// Recompute normals via finite differences for smooth shading
const stride = W + 1;
for (let j = 0; j <= H; j++) {
    for (let i = 0; i <= W; i++) {
        const idx = j * stride + i;
        const ip1 = j * stride + ((i + 1) % (W + 1));
        const im1 = j * stride + ((i - 1 + W) % W);
        const jp1 = Math.min(j + 1, H) * stride + i;
        const jm1 = Math.max(j - 1, 0) * stride + i;

        const dxi = vertices[ip1 * 3] - vertices[im1 * 3];
        const dyi = vertices[ip1 * 3 + 1] - vertices[im1 * 3 + 1];
        const dzi = vertices[ip1 * 3 + 2] - vertices[im1 * 3 + 2];
        const dxj = vertices[jp1 * 3] - vertices[jm1 * 3];
        const dyj = vertices[jp1 * 3 + 1] - vertices[jm1 * 3 + 1];
        const dzj = vertices[jp1 * 3 + 2] - vertices[jm1 * 3 + 2];

        let cnx = dyi * dzj - dzi * dyj;
        let cny = dzi * dxj - dxi * dzj;
        let cnz = dxi * dyj - dyi * dxj;
        const len = Math.sqrt(cnx * cnx + cny * cny + cnz * cnz) || 1;
        normals[idx * 3] = cnx / len;
        normals[idx * 3 + 1] = cny / len;
        normals[idx * 3 + 2] = cnz / len;
    }
}

// Quad→triangle indices
for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
        const a = j * stride + i, b = j * stride + i + 1;
        const c = (j + 1) * stride + i, d = (j + 1) * stride + i + 1;
        indices.push(a, b, c, b, d, c);
    }
}

// ── Write OBJ ─────────────────────────────────────────────────────────────────
const vCount = vertices.length / 3;
let obj = `# Brain surface mesh v2\n# ${vCount} vertices  ${indices.length / 3} triangles\n# Deep medial fissure (-0.48), temporal lobes (+0.46), cortical folds\n\n`;
for (let i = 0; i < vCount; i++)
    obj += `v ${vertices[i * 3].toFixed(5)} ${vertices[i * 3 + 1].toFixed(5)} ${vertices[i * 3 + 2].toFixed(5)}\n`;
for (let i = 0; i < vCount; i++)
    obj += `vn ${normals[i * 3].toFixed(5)} ${normals[i * 3 + 1].toFixed(5)} ${normals[i * 3 + 2].toFixed(5)}\n`;
for (let i = 0; i < indices.length / 3; i++) {
    const a = indices[i * 3] + 1, b = indices[i * 3 + 1] + 1, c = indices[i * 3 + 2] + 1;
    obj += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
}

mkdirSync("./public/models", { recursive: true });
writeFileSync("./public/models/brain.obj", obj);
console.log(`Brain OBJ v2: ${vCount} vertices, ${indices.length / 3} triangles`);
console.log(`  Medial fissure: -0.48 amplitude (deeper than v1 -0.28)`);
console.log(`  Temporal lobes: +0.46 (was +0.38)`);
