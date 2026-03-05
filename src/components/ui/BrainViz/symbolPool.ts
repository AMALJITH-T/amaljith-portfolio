/**
 * symbolPool.ts
 * Text content for each layer of the brain visualization.
 * Designed to be overridden by admin settings at runtime.
 */

// Layer 1 — bold math symbols (surface of the brain)
// Large, sparse, clearly form the silhouette at distance.
export const DEFAULT_SYMBOLS = [
    "∑", "∂", "∫", "π", "λ", "σ", "Δ", "∇",
    "ε", "μ", "θ", "φ", "Ω", "ρ", "ξ", "η",
    "∞", "≈", "∝", "⊗", "⊕", "∈", "∀", "∃",
];

// Layer 2 — scientific expressions (mid-depth, appear on zoom)
export const DEFAULT_EQUATIONS = [
    "x(t)", "∇f(x)", "P(A|B)", "∑wᵢxᵢ",
    "e^{iπ}", "σ(z)", "∂L/∂w", "E[X]",
    "H(X)", "D_KL", "Var[X]", "x²",
    "f(x)→", "argmax", "tanh", "relu",
    "‖x‖₂", "rank(A)", "det(M)", "λᵢ",
];

// Layer 3 — conceptual research words (deep interior, particle-like)
export const DEFAULT_WORDS = [
    "signal", "entropy", "geometry", "inference",
    "drift", "structure", "emergence", "noise",
    "latent", "gradient", "manifold", "topology",
    "sparse", "dense", "flow", "basin",
    "attractor", "phase", "eigenvalue", "field",
];

export interface TokenSpec {
    text: string;
    layer: 1 | 2 | 3;
    size: number;     // font size in px (pre-DPR)
    weight: string;   // css font-weight
}

// Build a combined token pool from admin-configurable arrays.
// Shuffles deterministically using seeded index modulo.
export function buildTokenPool(
    symbols: string[],
    equations: string[],
    words: string[],
    totalCount: number
): TokenSpec[] {
    const pool: TokenSpec[] = [];

    // Target distribution: 35% surface symbols, 35% equations, 30% words
    const symCount = Math.round(totalCount * 0.35);
    const eqCount = Math.round(totalCount * 0.35);
    const wordCount = totalCount - symCount - eqCount;

    for (let i = 0; i < symCount; i++) {
        pool.push({ text: symbols[i % symbols.length], layer: 1, size: 11, weight: "400" });
    }
    for (let i = 0; i < eqCount; i++) {
        pool.push({ text: equations[i % equations.length], layer: 2, size: 8, weight: "300" });
    }
    for (let i = 0; i < wordCount; i++) {
        pool.push({ text: words[i % words.length], layer: 3, size: 6, weight: "300" });
    }

    return pool;
}
