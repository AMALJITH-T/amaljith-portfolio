/**
 * vectorField.ts
 * Dual-Gaussian curl field for token drift motion.
 * Returns (fx, fy) force components at any (nx, ny) position in [-1,1] space.
 */

export interface VectorForce {
    fx: number;
    fy: number;
}

// Dual-Gaussian saddle field — same topology as the hero SVG vector field
// but operating in normalized space for the canvas renderer.
export function vectorAt(nx: number, ny: number): VectorForce {
    const g1x = nx - 0.35, g1y = ny - 0.25;
    const g2x = nx + 0.35, g2y = ny + 0.30;

    const s1 = Math.exp(-(g1x * g1x + g1y * g1y) / 0.40);
    const s2 = Math.exp(-(g2x * g2x + g2y * g2y) / 0.40);

    // Curl of the Gaussians → rotational flow
    const fx = (-g1y * s1 + g2y * s2 * 0.65);
    const fy = (g1x * s1 - g2x * s2 * 0.65);

    // Normalise to unit magnitude
    const mag = Math.sqrt(fx * fx + fy * fy) || 1;
    return { fx: fx / mag, fy: fy / mag };
}

// Noise field for Layer 3 fine-grain drift
// Approximates Perlin noise using sin harmonics (cheap, no dependency)
export function noiseAt(nx: number, ny: number, t: number): VectorForce {
    const f0 = Math.sin(nx * 3.7 + ny * 2.1 + t * 0.3) * 0.5;
    const f1 = Math.sin(nx * 7.1 - ny * 5.3 + t * 0.2) * 0.3;
    const f2 = Math.sin(nx * 13.0 + ny * 8.7 - t * 0.15) * 0.2;
    return {
        fx: f0 + f1 + f2,
        fy: Math.sin(nx * 4.3 - ny * 3.1 + t * 0.25) * 0.5
            + Math.sin(nx * 6.7 + ny * 9.1 + t * 0.18) * 0.35,
    };
}
