"use client";

/**
 * BrainScene.tsx — v7
 *
 * Three-layer particle system with camera-DISTANCE-based visibility:
 *
 *   Layer 0 — Surface   (~8 000 pts)  always visible from outside
 *   Layer 1 — Cortex    (~15 000 pts) fades in at dist 1.2–2.5
 *   Layer 2 — Equations (~6 000 pts)  fades in at dist < 1.2
 *
 * SDF-like glyph rendering:
 *   • Atlas is white-on-black with layered shadow gradient (see symbolTexture.ts)
 *   • Fragment shader uses smoothstep on the alpha value to produce a
 *     sharp, zoom-invariant glyph edge — no pixelation at any size
 *   • Circular fallback for very small points (anti-blocky)
 *
 * Hydration-safe: all particle data generated inside useEffect only.
 */

import { useRef, useEffect, useMemo, MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import {
    buildSymbolAtlas,
    SYMBOL_ATLAS_COLS,
    SYMBOL_ATLAS_ROWS,
    SYMBOL_ATLAS_COUNT,
    EQUATION_SYMBOL_START,
} from "./symbolTexture";
import { generateCortexLines } from "./brainMesh";
import type { SiteSettings } from "@/lib/types";

// ── Seeded PRNG — never runs during SSR ───────────────────────────────────────
function mulberry32(seed: number) {
    let s = seed | 0;
    return () => {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── Three-layer particle sampler ───────────────────────────────────────────────
interface ParticleData {
    positions: Float32Array;
    normals: Float32Array;
    symbols: Float32Array;
    phases: Float32Array;
    glitch: Float32Array;
    layer: Float32Array;  // 0 surface | 1 cortex | 2 equation
}

function buildParticles(
    geo: THREE.BufferGeometry,
    surfN: number,
    cortN: number,
    eqN: number
): ParticleData {
    const total = surfN + cortN + eqN;
    const rng = mulberry32(0xF8A3C1D2);
    const pA = geo.attributes.position as THREE.BufferAttribute;
    const nA = geo.attributes.normal as THREE.BufferAttribute;
    const idx = geo.index;
    const tris = idx ? idx.count / 3 : pA.count / 3;

    const pos = new Float32Array(total * 3);
    const nor = new Float32Array(total * 3);
    const sym = new Float32Array(total);
    const ph = new Float32Array(total);
    const gl = new Float32Array(total);
    const lay = new Float32Array(total);

    // symRange: [start, end) of symbol atlas indices for this layer
    function fillOne(i: number, isVolume: boolean, depth: number,
        layerId: number, symStart: number, symEnd: number) {
        // Sample a random triangle
        const t = Math.floor(rng() * tris);
        const ia = idx ? idx.getX(t * 3) : t * 3;
        const ib = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
        const ic = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;

        let r1 = rng(), r2 = rng();
        if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
        const r3 = 1 - r1 - r2;

        let px = pA.getX(ia) * r1 + pA.getX(ib) * r2 + pA.getX(ic) * r3;
        let py = pA.getY(ia) * r1 + pA.getY(ib) * r2 + pA.getY(ic) * r3;
        let pz = pA.getZ(ia) * r1 + pA.getZ(ib) * r2 + pA.getZ(ic) * r3;

        let nx = nA.getX(ia) * r1 + nA.getX(ib) * r2 + nA.getX(ic) * r3;
        let ny = nA.getY(ia) * r1 + nA.getY(ib) * r2 + nA.getY(ic) * r3;
        let nz = nA.getZ(ia) * r1 + nA.getZ(ib) * r2 + nA.getZ(ic) * r3;
        const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;

        if (isVolume) {
            // Push inward — random depth 0..depthScale
            const d = rng() * depth;
            px -= nx * d; py -= ny * d; pz -= nz * d;
        }

        pos[i * 3] = px; pos[i * 3 + 1] = py; pos[i * 3 + 2] = pz;
        nor[i * 3] = isVolume ? -nx : nx;
        nor[i * 3 + 1] = isVolume ? -ny : ny;
        nor[i * 3 + 2] = isVolume ? -nz : nz;

        const range = symEnd - symStart;
        sym[i] = symStart + Math.floor(rng() * range);
        ph[i] = rng() * Math.PI * 2;
        gl[i] = rng();
        lay[i] = layerId;
    }

    for (let i = 0; i < surfN; i++)
        fillOne(i, false, 0, 0, 0, EQUATION_SYMBOL_START);

    for (let i = 0; i < cortN; i++)
        fillOne(surfN + i, true, 1.30, 1, 0, EQUATION_SYMBOL_START);

    for (let i = 0; i < eqN; i++)
        fillOne(surfN + cortN + i, true, 1.25, 2, EQUATION_SYMBOL_START, SYMBOL_ATLAS_COUNT);

    return { positions: pos, normals: nor, symbols: sym, phases: ph, glitch: gl, layer: lay };
}

// ── GLSL: vertex shader ────────────────────────────────────────────────────────
const VERT = /* glsl */`
attribute float aSymbol;
attribute float aPhase;
attribute float aGlitch;
attribute vec3  aNormal;
attribute float aLayer;    // 0=surface  1=cortex  2=equation

uniform float uTime;
uniform float uSize;
uniform float uReducedMotion;
uniform float uGlitchI;
uniform float uColorI;
uniform vec3  uPulseOrig;
uniform float uPulseStart;
uniform float uPulseSpeed;

varying float vSym;
varying float vAlpha;
varying vec3  vColor;
varying float vPulse;
varying float vPtSize;
varying float vLayer;

void main() {
    vSym   = aSymbol;
    vLayer = aLayer;

    vec3 p = position;

    // ── Drift along normal ─────────────────────────────────────────────────
    float driftAmp = uReducedMotion > 0.5 ? 0.0008 : 0.004;
    p += aNormal * sin(uTime * 0.22 + aPhase) * driftAmp;

    // ── Glitch ────────────────────────────────────────────────────────────
    float gTick = floor(uTime * 4.0 * uGlitchI + aGlitch * 89.1);
    float gFire = step(0.964, fract(sin(gTick * 139.7) * 43758.5));
    p += aNormal * gFire * 0.026 * uGlitchI;

    // ── Pulse ring ────────────────────────────────────────────────────────
    float pAge   = uTime - uPulseStart;
    float pDist  = distance(p, uPulseOrig);
    float pRing  = max(0.0, 1.0 - abs(pDist - pAge * uPulseSpeed) / 0.22);
    float pDecay = max(0.0, 1.0 - pAge / 6.5);
    vPulse = pRing * pDecay;

    // ── Camera distance from brain center ─────────────────────────────────
    // Actual Euclidean distance from camera to world origin (brain center)
    // Used for distance-threshold layer visibility.
    float camDist = length(cameraPosition);

    // ── Layer visibility based on camera distance ─────────────────────────
    //
    //  Layer 0 (surface):   always visible when outside brain, fades when inside
    //  Layer 1 (cortex):    fades IN as dist drops from 2.5 → 1.2
    //  Layer 2 (equations): fades IN as dist drops below 1.2
    //
    float alpha = 0.0;
    float cull   = 1.0;

    if (aLayer < 0.5) {
        // ── Surface ───────────────────────────────────────────────────────
        // Back-face culling: only front-facing surface particles visible
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vec3 wn = normalize(mat3(modelMatrix) * aNormal);
        vec3 tc = normalize(cameraPosition - wp.xyz);
        float ff = dot(wn, tc);
        cull = smoothstep(-0.10, 0.25, ff);

        // Lambertian fold shading
        float lamb = max(0.0, ff * 0.65 + 0.35);
        cull *= lamb;

        // Visibility: bright outside brain, fades as cam enters deep inside
        // Smooth fade: full at camDist>1.8, gone at camDist<0.6
        float surfVis = clamp((camDist - 0.6) / 1.2, 0.0, 1.0);
        alpha = surfVis;

    } else if (aLayer < 1.5) {
        // ── Cortex (volume) ───────────────────────────────────────────────
        // No back-face cull — interior particles visible from all angles
        // Fades IN from dist 2.5 → 1.2, stays visible below 1.2
        float cortVis = clamp((2.5 - camDist) / 1.3, 0.0, 1.0);
        alpha = cortVis * 0.70;   // cortex is dimmer than surface

    } else {
        // ── Equations (deep zoom) ─────────────────────────────────────────
        // Only visible when dist < 1.2 — strictly after cortex appears
        float eqVis = clamp((1.2 - camDist) / 0.8, 0.0, 1.0);
        alpha = eqVis * 0.85;
    }

    // ── Color: soft gold rgb(200,170,70) ──────────────────────────────────
    // Surface: warm gold  Cortex: dimmer gold  Equations: bright white-gold
    vec3 surfGold = vec3(0.784, 0.667, 0.275);    // (200,170,70)/255
    vec3 cortGold = vec3(0.490, 0.420, 0.165);    // darker for depth sense
    vec3 eqWhite  = vec3(0.900, 0.870, 0.680);    // brighter for legibility
    vec3 pulseTin = vec3(0.95,  0.92,  0.80);

    vec3 baseCol;
    if      (aLayer < 0.5) baseCol = surfGold;
    else if (aLayer < 1.5) baseCol = cortGold;
    else                   baseCol = eqWhite;

    vColor = mix(baseCol, pulseTin, vPulse * 0.55);

    // ── Final alpha ───────────────────────────────────────────────────────
    float flicker = 0.92 + 0.08 * sin(uTime * 1.7 + aPhase * 3.8);
    float baseA   = (aLayer < 0.5) ? 0.55 : (aLayer < 1.5) ? 0.30 : 0.70;
    vAlpha = cull * alpha * flicker * baseA * uColorI;
    vAlpha = clamp(vAlpha, 0.0, 1.0);

    // ── Perspective size ──────────────────────────────────────────────────
    // Equations at close zoom get larger for readability (up to 32px)
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float sizeScale = (aLayer > 1.5) ? uSize * 1.35 : uSize;
    float pSize = sizeScale * (190.0 / -mv.z);
    float maxSz = (aLayer > 1.5) ? 32.0 : 20.0;
    gl_PointSize = clamp(pSize, 0.5, maxSz);
    vPtSize = gl_PointSize;
    gl_Position = projectionMatrix * mv;
}
`;

// ── GLSL: fragment shader — SDF-like glyph rendering ─────────────────────────
const FRAG = /* glsl */`
uniform sampler2D uAtlas;
uniform float uCols;
uniform float uRows;

varying float vSym;
varying float vAlpha;
varying vec3  vColor;
varying float vPulse;
varying float vPtSize;
varying float vLayer;

void main() {
    if (vAlpha < 0.003) discard;

    float col = mod(floor(vSym), uCols);
    float row = floor(floor(vSym) / uCols);

    // Sample atlas cell with inner margin to prevent edge bleed
    vec2 uv = vec2(
        (col + gl_PointCoord.x * 0.84 + 0.08) / uCols,
        1.0 - (row + (1.0 - gl_PointCoord.y) * 0.84 + 0.08) / uRows
    );

    float field = texture2D(uAtlas, uv).r;   // red channel = SDF-like distance

    float bright = 1.0 + vPulse * 0.55;

    // ── SDF-like edge threshold for crisp symbols ─────────────────────────
    // The atlas stores a white-on-black gradient:
    //   field ≈ 1.0  → deep inside glyph (solid white)
    //   field ≈ 0.45 → glyph boundary
    //   field ≈ 0.0  → outside glyph (black background)
    //
    // smoothstep near the threshold creates a clean anti-aliased edge
    // without any blurriness or blockiness.
    //
    if (vPtSize >= 6.0) {
        // Adapt threshold based on rendered size:
        //   larger point = more anti-aliasing needed (wider smoothstep)
        //   smaller point = tighter threshold (crisper edge)
        float w = fwidth(field) * 0.5 + 0.01;          // GLSL derivative for AA
        float lo = 0.42 - w;
        float hi = 0.42 + w;
        float glyph = smoothstep(lo, hi, field);

        if (glyph < 0.04) discard;
        gl_FragColor = vec4(vColor * bright, glyph * vAlpha);
        return;
    }

    // ── Tiny-point fallback: crisp circular dot (not square, not blurry) ──
    vec2  pc = gl_PointCoord - 0.5;
    float r  = length(pc);
    if (r > 0.38) discard;
    float dot_ = 1.0 - smoothstep(0.20, 0.38, r);  // sharp inner disk
    gl_FragColor = vec4(vColor * bright, dot_ * vAlpha * 0.65);
}
`;

// ── BrainPoints — three-layer particle system ──────────────────────────────────
function BrainPoints({
    settings,
    reducedMotion,
    triggerPulseRef,
}: {
    settings: SiteSettings;
    reducedMotion: boolean;
    triggerPulseRef?: MutableRefObject<(() => void) | null>;
}) {
    const ptsRef = useRef<THREE.Points>(null!);
    const matRef = useRef<THREE.ShaderMaterial>(null!);
    const pulseOrig = useRef(new THREE.Vector3(0, 0.8, 0));
    // const pulseStart = useRef(-30.0);
    const nextPulse = useRef(2.0);

    const density = Math.max(0.4, Math.min(2.0, settings.brainDensity ?? 1.0));
    // Rebalanced to keep total strictly under 20k instances. 
    // Layer 1 (Cortex Shell) = surfN + cortN = ~9000. Layer 2 (Equations) = 4000.
    const surfN = Math.round(2500 * density);
    const cortN = Math.round(6500 * density);
    const eqN = Math.round(16000 * density); // 4x equation density
    const glitchI = settings.glitchIntensity ?? 0.5;
    const pulseHz = settings.pulseFrequency ?? 0.25;
    const colorI = settings.colorIntensity ?? 1.0;

    // ── Client-side: OBJ load + surface sampling ─────────────────────────────
    useEffect(() => {
        const pts = ptsRef.current;
        const mat = matRef.current;
        if (!pts || !mat) return;

        let dead = false;
        new OBJLoader().load(
            "/models/brain.obj",
            (obj) => {
                if (dead) return;
                let geo: THREE.BufferGeometry | null = null;
                obj.traverse((c) => {
                    if (geo) return;
                    if (c instanceof THREE.Mesh) {
                        const g = c.geometry as THREE.BufferGeometry;
                        if (!g.attributes.normal) g.computeVertexNormals();
                        geo = g;
                    }
                });
                if (!geo) return;

                // All RNG inside this callback — runs only on client, after mount
                const data = buildParticles(geo, surfN, cortN, eqN);
                const ptGeo = pts.geometry as THREE.BufferGeometry;
                ptGeo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
                ptGeo.setAttribute("aNormal", new THREE.BufferAttribute(data.normals, 3));
                ptGeo.setAttribute("aSymbol", new THREE.BufferAttribute(data.symbols, 1));
                ptGeo.setAttribute("aPhase", new THREE.BufferAttribute(data.phases, 1));
                ptGeo.setAttribute("aGlitch", new THREE.BufferAttribute(data.glitch, 1));
                ptGeo.setAttribute("aLayer", new THREE.BufferAttribute(data.layer, 1));
                ptGeo.computeBoundingSphere();
            },
            undefined,
            (e) => console.error("[Brain] OBJ load error:", e)
        );

        // Symbol atlas — SDF-like, high resolution (client only)
        const atlas = buildSymbolAtlas(settings.brainSymbols ?? []);
        const tex = new THREE.CanvasTexture(atlas);
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        mat.uniforms.uAtlas.value = tex;
        mat.needsUpdate = true;

        return () => { dead = true; tex.dispose(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [surfN, cortN, eqN, (settings.brainSymbols ?? []).join("")]);

    const uniforms = useMemo(() => ({
        uAtlas: { value: null as THREE.Texture | null },
        uTime: { value: 0.0 },
        uSize: { value: 1.75 },
        uReducedMotion: { value: reducedMotion ? 1.0 : 0.0 },
        uGlitchI: { value: glitchI },
        uColorI: { value: colorI },
        uPulseOrig: { value: new THREE.Vector3() },
        uPulseStart: { value: -30.0 },
        uPulseSpeed: { value: 1.45 },
        uCols: { value: SYMBOL_ATLAS_COLS },
        uRows: { value: SYMBOL_ATLAS_ROWS },
    }), []); // eslint-disable-line

    // Register external trigger function into ref (called by BiosignalCanvas on proximity)
    const externalTrigger = useRef(false);
    useEffect(() => {
        if (triggerPulseRef) {
            triggerPulseRef.current = () => {
                externalTrigger.current = true;
            };
            return () => { if (triggerPulseRef) triggerPulseRef.current = null; };
        }
    }, [triggerPulseRef]);

    useFrame((state) => {
        const mat = matRef.current;
        const pts = ptsRef.current;
        if (!mat || !pts) return;

        const t = state.clock.getElapsedTime();
        mat.uniforms.uTime.value = t;

        // External proximity pulse — fire immediately at a random surface point
        if (externalTrigger.current) {
            externalTrigger.current = false;
            const a = (t * 1.3 + Math.sin(t * 0.7)) % (Math.PI * 2);
            pulseOrig.current.set(
                Math.cos(a) * 0.75,
                0.35 + Math.sin(t * 0.4) * 0.28,
                Math.sin(a) * 0.68
            );
            mat.uniforms.uPulseStart.value = t;
            mat.uniforms.uPulseOrig.value = pulseOrig.current;
            // Push next scheduled pulse forward so they don't overlap
            nextPulse.current = t + 1.0;
        }

        // Fire scheduled neural pulse
        if (t > nextPulse.current) {
            const a = (t * 0.58) % (Math.PI * 2);
            pulseOrig.current.set(
                Math.cos(a) * 0.88,
                0.38 + Math.sin(t * 0.22) * 0.32,
                Math.sin(a) * 0.78
            );
            mat.uniforms.uPulseStart.value = t;
            mat.uniforms.uPulseOrig.value = pulseOrig.current;
            nextPulse.current = t + 1.0 / Math.max(0.05, pulseHz);
        }

        // Slow rotation (0.015 rad/sec at 60fps = 0.00025 per frame)
        pts.rotation.y += reducedMotion ? 0.0001 : 0.00025;
        pts.rotation.x = 0.10;
        if (!reducedMotion) pts.rotation.z = Math.sin(t * 0.035) * 0.018;
    });

    return (
        <points ref={ptsRef}>
            <bufferGeometry />
            <shaderMaterial
                ref={matRef}
                vertexShader={VERT}
                fragmentShader={FRAG}
                uniforms={uniforms}
                transparent={true}
                depthTest={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

// ── Layer 3: Neural Graph Core ────────────────────────────────────────────────
// Visualizes the inner "reasoning network" with glowing nodes and connecting edges
// that occasionally transmit signal pulses.
function NeuralGraphCore({ reducedMotion }: { reducedMotion: boolean }) {
    const groupRef = useRef<THREE.Group>(null!);
    const materialRef = useRef<THREE.LineBasicMaterial>(null!);
    const pointsRef = useRef<THREE.Points>(null!);
    const linesRef = useRef<THREE.LineSegments>(null!);
    const pulseMeshRef = useRef<THREE.Mesh>(null!);

    // Pulse animation state
    const pulseActive = useRef(false);
    const pulseSource = useRef(0);
    const pulseTarget = useRef(0);
    const pulseProgress = useRef(0);
    const nextPulseDelay = useRef(2.0);

    const { nodes, edges } = useMemo(() => {
        const N = 75; // 75 nodes
        const pos = new Float32Array(N * 3);
        const rng = mulberry32(0x19B8C7A3);

        // Generate nodes clustered towards the center (radius ~1.0)
        for (let i = 0; i < N; i++) {
            const r = Math.pow(rng(), 1 / 3) * 1.0;
            const theta = rng() * Math.PI * 2;
            const phi = Math.acos(2 * rng() - 1);
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
        }

        // Generate edges based on distance
        const edgeIndices: number[] = [];
        for (let i = 0; i < N; i++) {
            // Find closest neighbors
            const dSq: { idx: number, d: number }[] = [];
            for (let j = 0; j < N; j++) {
                if (i === j) continue;
                const dx = pos[i * 3] - pos[j * 3];
                const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
                const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
                dSq.push({ idx: j, d: dx * dx + dy * dy + dz * dz });
            }
            dSq.sort((a, b) => a.d - b.d);
            // Connect to 2-4 nearest neighbors to form a web
            const connects = 2 + Math.floor(rng() * 3);
            for (let k = 0; k < connects; k++) {
                // To avoid drawing duplicates, only add if i < j
                if (i < dSq[k].idx) {
                    edgeIndices.push(i, dSq[k].idx);
                }
            }
        }

        const ptGeo = new THREE.BufferGeometry();
        ptGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        lineGeo.setIndex(edgeIndices);

        return { nodes: ptGeo, edges: lineGeo };
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();

        // Slow structural rotation (~0.015 rad/s)
        groupRef.current.rotation.y = reducedMotion ? t * 0.005 : t * 0.015;
        groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;

        // Simple pulsing opacity for lines
        if (materialRef.current) {
            materialRef.current.opacity = 0.15 + Math.sin(t * 1.5) * 0.05;
        }

        // Pulse logic - traveling glowing dot along invisible structural paths
        if (linesRef.current && pulseMeshRef.current && pointsRef.current) {
            const edgeIndices = linesRef.current.geometry.getIndex();
            const posAttr = pointsRef.current.geometry.getAttribute('position');

            if (edgeIndices && posAttr) {
                if (!pulseActive.current && t > nextPulseDelay.current) {
                    pulseActive.current = true;
                    pulseProgress.current = 0;
                    const rng = Math.random;
                    const edgeOffset = Math.floor(rng() * (edgeIndices.count / 2)) * 2;
                    pulseSource.current = edgeIndices.getX(edgeOffset);
                    pulseTarget.current = edgeIndices.getX(edgeOffset + 1);
                } else if (pulseActive.current) {
                    pulseProgress.current += delta * 2.0;
                    if (pulseProgress.current > 1.0) {
                        pulseActive.current = false;
                        nextPulseDelay.current = t + Math.random() * 1.5;
                        pulseMeshRef.current.visible = false;
                    } else {
                        pulseMeshRef.current.visible = true;

                        const sx = posAttr.getX(pulseSource.current);
                        const sy = posAttr.getY(pulseSource.current);
                        const sz = posAttr.getZ(pulseSource.current);

                        const tx = posAttr.getX(pulseTarget.current);
                        const ty = posAttr.getY(pulseTarget.current);
                        const tz = posAttr.getZ(pulseTarget.current);

                        const startV = new THREE.Vector3(sx, sy, sz);
                        const targetV = new THREE.Vector3(tx, ty, tz);

                        pulseMeshRef.current.position.lerpVectors(startV, targetV, pulseProgress.current);
                        const mat = pulseMeshRef.current.material as THREE.MeshBasicMaterial;
                        mat.opacity = Math.sin(pulseProgress.current * Math.PI) * 0.9;
                    }
                }
            }
        }

        if (pointsRef.current) {
            const mat = pointsRef.current.material as THREE.PointsMaterial;
            mat.opacity = 0.6 + Math.sin(t * 3.0) * 0.2;
        }
    });

    return (
        <group ref={groupRef}>
            <points ref={pointsRef} geometry={nodes}>
                <pointsMaterial
                    size={0.06}
                    color="#f8f0c6"
                    transparent
                    opacity={0.7}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>
            <lineSegments ref={linesRef} geometry={edges}>
                <lineBasicMaterial
                    ref={materialRef}
                    color="#c29b27"
                    transparent
                    opacity={0.15}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </lineSegments>
            <mesh ref={pulseMeshRef} visible={false}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color="#ffffff" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
        </group>
    );
}

// ── Layer 4: Curved Cortex Lines ──────────────────────────────────────────────
function CortexLines({ reducedMotion }: { reducedMotion: boolean }) {
    const groupRef = useRef<THREE.Group>(null!);

    const lines = useMemo(() => {
        return generateCortexLines(30, 80);
    }, []);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        // Match structure rotation
        groupRef.current.rotation.y = reducedMotion ? t * 0.005 : t * 0.015;
        groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    });

    return (
        <group ref={groupRef}>
            <lineSegments geometry={lines}>
                <lineBasicMaterial
                    color="#c29b27"
                    transparent
                    opacity={0.25}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </lineSegments>
        </group>
    );
}

// ── Camera rig ────────────────────────────────────────────────────────────────
// Maps depth 0-3 to camera positions such that the distance thresholds
// for each layer are crossed smoothly:
//
//   depth 0 → z=7.5   camDist≈7.5  (only surface visible)
//   depth 1 → z=4.0   camDist≈4.0  (approaching, surface bright, cortex starting)
//   depth 2 → z=2.0   camDist≈2.0  (cortex visible, equations about to appear)
//   depth 3 → z=0.5   camDist≈0.58 (deep inside — equations fully visible)
//
function CameraRig({ depthRef }: { depthRef: MutableRefObject<number> }) {
    useFrame((state) => {
        const d = depthRef.current;
        // Piece-wise z to give the right distance thresholds per layer
        // depth 0→1: z 7.5→4.0  (outer overview approaching cortex threshold 2.5)
        // depth 1→2: z 4.0→2.0  (cortex fade-in range 2.5→1.2)
        // depth 2→3: z 2.0→0.5  (inside brain — equation range <1.2)
        let targetZ: number;
        if (d < 1) {
            targetZ = 7.5 - d * 3.5;       // 7.5 → 4.0
        } else if (d < 2) {
            targetZ = 4.0 - (d - 1) * 2.0; // 4.0 → 2.0
        } else {
            targetZ = 2.0 - (d - 2) * 1.5; // 2.0 → 0.5
        }
        const targetY = d * 0.04;

        state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.055);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.055);
        state.camera.lookAt(0, 0.08, 0);
    });
    return null;
}

// ── Scene export ──────────────────────────────────────────────────────────────
export function BrainScene({
    settings,
    depthRef,
    reducedMotion,
    triggerPulseRef,
}: {
    settings: SiteSettings;
    depthRef: MutableRefObject<number>;
    reducedMotion: boolean;
    triggerPulseRef?: MutableRefObject<(() => void) | null>;
}) {
    return (
        <Canvas
            camera={{ position: [0, 0.08, 7.5], fov: 58, near: 0.01, far: 60 }}
            gl={{
                antialias: false,
                powerPreference: "high-performance",
                alpha: true,
            }}
            style={{ background: "transparent", width: "100%", height: "100%", display: "block" }}
            dpr={[1, 1.5]}
        >
            <CameraRig depthRef={depthRef} />
            {/* Layers 1 & 2: Cortex Shell & Equation Field */}
            <BrainPoints
                settings={settings}
                reducedMotion={reducedMotion}
                triggerPulseRef={triggerPulseRef}
            />
            <CortexLines reducedMotion={reducedMotion} />
            {/* Layer 3: Neural Graph Core */}
            <NeuralGraphCore reducedMotion={reducedMotion} />
        </Canvas>
    );
}
