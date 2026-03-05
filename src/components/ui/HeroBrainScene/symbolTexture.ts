/**
 * symbolTexture.ts — v2
 *
 * Generates a SDF-approximation glyph atlas using canvas layered shadows.
 * Each symbol is rendered with a 3-pass shadow approach:
 *   pass 1: wide soft shadow (outer falloff)
 *   pass 2: medium shadow (mid-range)
 *   pass 3: fill + thin stroke (core)
 *
 * This creates a gradient around each glyph that the GLSL fragment shader
 * interprets as a distance field: smoothstep near the edge value gives
 * sharp, alias-free symbols at any zoom level.
 *
 * Atlas layout: COLS × ROWS grid, each CELL × CELL pixels.
 * Default: 8 × 5 = 40 symbols, 256 × 256 px cells = 2048 × 1280 texture.
 */

const COLS = 8;
const ROWS = 5;
const CELL = 256;      // high-res cells for SDF-like quality

export const DEFAULT_BRAIN_SYMBOLS = [
    // Row 0 — single math symbols (surface + cortex layers)
    "π", "∑", "∫", "Δ", "σ", "λ", "∇", "∂",
    // Row 1 — operators and constants
    "ε", "μ", "θ", "∞", "φ", "ρ", "τ", "ω",
    // Row 2 — short expressions (equation layer)
    "E=mc²", "x(t)", "f(x)", "∂ψ/∂t", "eˣ", "ln", "∃", "∀",
    // Row 3 — longer equations (equation layer, deep zoom)
    "f(x)", "E[X]", "σ²", "P(x)", "∂L", "D_KL", "relu", "tanh",
    // Row 4 — extended expressions
    "argmax", "softmax", "∝", "rank", "‖x‖", "H(X)", "∇×F", "argmin",
];

/**
 * Renders the SDF-like atlas.
 * Returns an HTMLCanvasElement ready to be wrapped in THREE.CanvasTexture.
 */
export function buildSymbolAtlas(customSymbols?: string[]): HTMLCanvasElement {
    const symbols = (customSymbols && customSymbols.length > 0)
        ? [...customSymbols].slice(0, COLS * ROWS)
        : DEFAULT_BRAIN_SYMBOLS;

    const canvas = document.createElement("canvas");
    canvas.width = CELL * COLS;   // 2048
    canvas.height = CELL * ROWS;   // 1280

    const ctx = canvas.getContext("2d")!;
    // Black background — symbol alpha encodes the "SDF distance"
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    symbols.forEach((sym, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const cx = col * CELL + CELL / 2;
        const cy = row * CELL + CELL / 2;

        // Font size based on symbol length
        const len = sym.length;
        const fontSize = len > 5 ? 52 : len > 3 ? 64 : len > 1 ? 80 : 110;

        ctx.save();
        ctx.font = `400 ${fontSize}px 'Cormorant Garamond', 'Times New Roman', Georgia, serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // ── Pass 1: Wide outer gradient (SDF outer falloff) ──────────────────
        ctx.shadowColor = "rgba(255,255,255,0.12)";
        ctx.shadowBlur = 60;
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillText(sym, cx, cy);

        // ── Pass 2: Medium gradient (SDF mid-range) ───────────────────────────
        ctx.shadowColor = "rgba(255,255,255,0.35)";
        ctx.shadowBlur = 28;
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillText(sym, cx, cy);

        // ── Pass 3: Close gradient ────────────────────────────────────────────
        ctx.shadowColor = "rgba(255,255,255,0.70)";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(255,255,255,0.70)";
        ctx.fillText(sym, cx, cy);

        // ── Pass 4: Sharp core (full white fill) ──────────────────────────────
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(sym, cx, cy);

        ctx.restore();
    });

    return canvas;
}

export const SYMBOL_ATLAS_COUNT = COLS * ROWS;
export const SYMBOL_ATLAS_COLS = COLS;
export const SYMBOL_ATLAS_ROWS = ROWS;

// Which symbol indices belong to the equation layer (rows 2–4, deeper zoom)
// Surface layer uses 0–15, cortex 0–31, equation layer uses 16–39
export const EQUATION_SYMBOL_START = 16;
