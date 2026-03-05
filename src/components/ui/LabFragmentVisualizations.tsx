"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * LabFragmentVisualizations.tsx -> System Fragments
 *
 * 1. BehaviouralLandscapeViz: Stacked sine-wave ridges (3D ridge surface).
 * 2. DecisionGraphViz: Circular node graph with flowing particles to a central node.
 * 3. DrowsinessPipelineViz: Horizontal scrolling waveform with sliding temporal windows.
 * 4. ClinicalSurveillanceViz: Radial circular dashboard with rotating arcs and anomaly pulsing.
 *
 * Performance: Low particle count (<150), no cursor interaction, basic pure materials.
 */

// ── Shared Scene Config ───────────────────────────────────────────────────────
const canvasProps = {
    camera: { position: [0, 0, 3] as [number, number, number], fov: 45 },
    gl: { alpha: true, antialias: true, powerPreference: "low-power" as const },
    style: { background: "transparent", width: "100%", height: "100%", pointerEvents: "none" as const }
};

const GOLD = "#c29b27";
const RED_ALERT = "#ff4444";

// ── Seeded PRNG ───────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
    let s = seed | 0;
    return function () {
        s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// ── 1. Behavioural Signal Landscape ───────────────────────────────────────────
function RidgeSurface() {
    const groupRef = useRef<THREE.Group>(null!);
    const particlesRef = useRef<THREE.Points>(null!);

    const { ridges, particlePositions, particleOffsets } = useMemo(() => {
        const rng = mulberry32(0x1337);
        const R = 6; // Number of ridges
        const res = 80; // Samples per ridge
        const geos = [];

        // Generate ridge curves
        for (let i = 0; i < R; i++) {
            const pts = [];
            const z = (i / (R - 1)) * 1.6 - 0.8; // Z spread
            for (let j = 0; j < res; j++) {
                const x = (j / (res - 1)) * 3.6 - 1.8;
                pts.push(new THREE.Vector3(x, 0, z));
            }
            geos.push({ geo: new THREE.BufferGeometry().setFromPoints(pts), basZ: z, idx: i });
        }

        // Generate particles that travel along these ridges
        const N = 40;
        const pos = new Float32Array(N * 3);
        const offsets = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            offsets[i] = rng() * 10;
            // associate each particle with a ridge
            pos[i * 3 + 2] = Math.floor(rng() * R);
        }

        return { ridges: geos, particlePositions: pos, particleOffsets: offsets };
    }, []);

    useFrame((state) => {
        if (!groupRef.current || !particlesRef.current) return;
        const t = state.clock.getElapsedTime();

        // Tilt the group slightly to view the landscape
        groupRef.current.rotation.x = 0.5;
        groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.1;

        const R = 6;
        const res = 80;

        // Animate ridges
        ridges.forEach((r, idx) => {
            const line = groupRef.current.children[idx] as THREE.Line;
            const pos = line.geometry.attributes.position.array as Float32Array;
            for (let j = 0; j < res; j++) {
                const x = (j / (res - 1)) * 3.6 - 1.8;
                // Anomaly wave math
                const base = Math.exp(-(x * x) * 1.5) * 0.4;
                const wave = Math.sin(x * 3 - t + idx) * 0.2;
                pos[j * 3 + 1] = base + wave;
            }
            line.geometry.attributes.position.needsUpdate = true;
        });

        // Animate particles along ridges
        const pPos = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < 40; i++) {
            const ridgeIdx = pPos[i * 3 + 2]; // Retrieve stored ridge assignment
            const ridgeZ = (ridgeIdx / (R - 1)) * 1.6 - 0.8;

            // X position sweeps left to right
            const progress = ((t * 0.2 + particleOffsets[i]) % 1.0);
            const x = progress * 3.6 - 1.8;

            // calculate Y at this X
            const base = Math.exp(-(x * x) * 1.5) * 0.4;
            const wave = Math.sin(x * 3 - t + ridgeIdx) * 0.2;

            pPos[i * 3 + 0] = x;
            pPos[i * 3 + 1] = base + wave + 0.05; // hover slightly above
            pPos[i * 3 + 2] = ridgeZ;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;

        // Sync particles rotation with group
        particlesRef.current.rotation.x = groupRef.current.rotation.x;
        particlesRef.current.rotation.y = groupRef.current.rotation.y;
    });

    return (
        <group>
            <group ref={groupRef}>
                {ridges.map((r, idx) => (
                    <primitive
                        key={idx}
                        object={new THREE.Line(
                            r.geo,
                            new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.15 + (1 - idx / ridges.length) * 0.2 })
                        )}
                    />
                ))}
            </group>
            <points ref={particlesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
                </bufferGeometry>
                <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.6} />
            </points>
        </group>
    );
}

export function BehaviouralLandscapeViz() {
    return <Canvas {...canvasProps} camera={{ position: [0, 0.5, 2.5], fov: 45 }}><RidgeSurface /></Canvas>;
}

// ── 2. Explainable Decision Graph ─────────────────────────────────────────────
function DecisionGraph() {
    const nodesRef = useRef<THREE.Points>(null!);
    const edgesRef = useRef<THREE.LineSegments>(null!);
    const particlesRef = useRef<THREE.Points>(null!);

    const { nodesCoords, edgesCoords, pData } = useMemo(() => {
        const rng = mulberry32(0x4242);
        const N = 14;
        const nodes = new Float32Array((N + 1) * 3); // +1 for center node

        // Center node
        nodes[0] = 0; nodes[1] = 0; nodes[2] = 0;

        // Outer nodes
        for (let i = 1; i <= N; i++) {
            const angle = (i / N) * Math.PI * 2;
            const radius = 1.0 + (rng() - 0.5) * 0.2;
            nodes[i * 3] = Math.cos(angle) * radius;
            nodes[i * 3 + 1] = Math.sin(angle) * radius;
            nodes[i * 3 + 2] = (rng() - 0.5) * 0.4;
        }

        // Edges connecting outer nodes to center, and some outer connecting to each other
        const edges = [];
        for (let i = 1; i <= N; i++) {
            // to center
            edges.push(nodes[i * 3], nodes[i * 3 + 1], nodes[i * 3 + 2]);
            edges.push(0, 0, 0);

            // adjacent
            const next = i === N ? 1 : i + 1;
            if (rng() > 0.4) {
                edges.push(nodes[i * 3], nodes[i * 3 + 1], nodes[i * 3 + 2]);
                edges.push(nodes[next * 3], nodes[next * 3 + 1], nodes[next * 3 + 2]);
            }
        }

        // Flow particles
        const numP = 20;
        const pArray = [];
        for (let i = 0; i < numP; i++) {
            const startNode = Math.floor(rng() * N) + 1;
            pArray.push({
                start: [nodes[startNode * 3], nodes[startNode * 3 + 1], nodes[startNode * 3 + 2]],
                offset: rng() * 10,
                speed: 0.2 + rng() * 0.3
            });
        }

        return {
            nodesCoords: nodes,
            edgesCoords: new Float32Array(edges),
            pData: pArray
        };
    }, []);

    const pCoords = useMemo(() => new Float32Array(pData.length * 3), [pData]);

    useFrame((state) => {
        if (!nodesRef.current || !edgesRef.current || !particlesRef.current) return;
        const t = state.clock.getElapsedTime();

        const gRotY = t * 0.15;
        nodesRef.current.rotation.y = gRotY;
        edgesRef.current.rotation.y = gRotY;
        particlesRef.current.rotation.y = gRotY;

        // Pulsate center node
        const sizes = nodesRef.current.geometry.attributes.size;
        if (sizes) {
            setSizeAttribute(nodesRef.current.geometry, 0, 0.15 + Math.sin(t * 3) * 0.03);
        }

        // Animate particles flowing to center
        const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
        pData.forEach((p, i) => {
            const progress = (t * p.speed + p.offset) % 1.0;
            // Ease out to center
            const ease = 1 - Math.pow(1 - progress, 3);

            pos[i * 3] = p.start[0] * (1 - ease);
            pos[i * 3 + 1] = p.start[1] * (1 - ease);
            pos[i * 3 + 2] = p.start[2] * (1 - ease);
        });
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <group>
            <lineSegments ref={edgesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[edgesCoords, 3]} />
                </bufferGeometry>
                <lineBasicMaterial color={GOLD} transparent opacity={0.2} />
            </lineSegments>
            <points ref={nodesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[nodesCoords, 3]} />
                </bufferGeometry>
                <pointsMaterial size={0.06} color={GOLD} transparent opacity={0.6} />
            </points>
            <points ref={particlesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[pCoords, 3]} />
                </bufferGeometry>
                <pointsMaterial size={0.04} color="#ffffff" transparent opacity={0.9} />
            </points>
        </group>
    );
}

// helper for center node size pulse
function setSizeAttribute(geometry: THREE.BufferGeometry, index: number, val: number) {
    if (!geometry.attributes.size) {
        const sizes = new Float32Array(geometry.attributes.position.count);
        sizes.fill(0.06); // base size
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    }
    const arr = geometry.attributes.size.array as Float32Array;
    arr[index] = val;
    geometry.attributes.size.needsUpdate = true;
}

export function DecisionGraphViz() {
    return <Canvas {...canvasProps}><DecisionGraph /></Canvas>;
}

// ── 3. Drowsiness Detection Pipeline ──────────────────────────────────────────
function DrowsinessWaveform() {
    const waveRef = useRef<THREE.Line>(null!);
    const windowsRef = useRef<THREE.Group>(null!);
    const blinksRef = useRef<THREE.Points>(null!);

    const { wavePts, blinkQueue } = useMemo(() => {
        const rng = mulberry32(0x9999);
        const pts = new Float32Array(300 * 3);
        // We will generate the waveform dynamically in useFrame to scroll it

        // Blink events [time_offset, is_eye_closure]
        const blinks = [];
        for (let i = 0; i < 8; i++) {
            blinks.push({
                time: i * 2.5 + rng(),
                isClosure: rng() > 0.7
            });
        }
        return { wavePts: pts, blinkQueue: blinks };
    }, []);

    useFrame((state) => {
        if (!waveRef.current || !windowsRef.current || !blinksRef.current) return;
        const t = state.clock.getElapsedTime();

        // Scroll waveform
        const pos = waveRef.current.geometry.attributes.position.array as Float32Array;
        const speed = 1.0;

        for (let i = 0; i < 300; i++) {
            const x = (i / 299) * 3.6 - 1.8;
            const scrollTime = t * speed + (x * 0.5);

            // Complex biological-looking signal (EAR/MAR simulation)
            let y = Math.sin(scrollTime * 4) * 0.1 + Math.sin(scrollTime * 1.5) * 0.2;

            // Add blinks/closures based on global time mapped to wave space
            blinkQueue.forEach(b => {
                const dist = Math.abs((scrollTime % 20) - b.time);
                if (dist < 0.25) {
                    // smooth cubic bezier-like spike using exponential falloff
                    const spike = Math.exp(-(dist * dist) * 120) * (b.isClosure ? 0.7 : 0.35);
                    y -= spike;
                }
            });

            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = 0;
        }
        waveRef.current.geometry.attributes.position.needsUpdate = true;

        // Slide windows
        let wIdx = 0;
        windowsRef.current.children.forEach(c => {
            const offset = wIdx * 1.2;
            const wx = ((t * speed * 0.5 + offset) % 3.6) - 1.8;
            c.position.x = wx;
            wIdx++;
        });

        // Blinks indicator
        const bPos = blinksRef.current.geometry.attributes.position.array as Float32Array;
        let bIdx = 0;
        blinkQueue.forEach((b) => {
            const waveLocalTime = (t * speed) % 20;
            const diff = b.time - waveLocalTime;
            // map diff to screen x
            const bx = diff * 2.0;

            if (bx > -1.8 && bx < 1.8) {
                bPos[bIdx * 3] = bx;
                bPos[bIdx * 3 + 1] = 0.5; // above wave
                bPos[bIdx * 3 + 2] = 0;
            } else {
                bPos[bIdx * 3] = 999; // hide
            }
            bIdx++;
        });
        blinksRef.current.geometry.attributes.position.needsUpdate = true;
    });

    const blinkArray = useMemo(() => new Float32Array(blinkQueue.length * 3), [blinkQueue]);

    return (
        <group>
            <primitive
                object={(() => {
                    const geo = new THREE.BufferGeometry();
                    geo.setAttribute('position', new THREE.BufferAttribute(wavePts, 3));
                    const mat = new THREE.LineBasicMaterial({ color: GOLD, linewidth: 2 });
                    const line = new THREE.Line(geo, mat);
                    // Assign to the ref so useFrame can mutate it
                    waveRef.current = line;
                    return line;
                })()}
            />

            <group ref={windowsRef}>
                {[0, 1, 2].map(i => (
                    <mesh key={i} position={[0, 0, -0.1]}>
                        <planeGeometry args={[0.4, 1.2]} />
                        <meshBasicMaterial color={GOLD} transparent opacity={0.08} depthWrite={false} />
                    </mesh>
                ))}
            </group>

            <points ref={blinksRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[blinkArray, 3]} />
                </bufferGeometry>
                <pointsMaterial size={0.08} color="#ffffff" transparent opacity={0.8} />
            </points>
        </group>
    );
}

export function DrowsinessPipelineViz() {
    return <Canvas {...canvasProps}><DrowsinessWaveform /></Canvas>;
}

// ── 4. Clinical Surveillance Monitoring ───────────────────────────────────────
function CircularDashboard() {
    const arcsRef = useRef<THREE.Group>(null!);
    const nodesRef = useRef<THREE.Points>(null!);

    // arcs: [radius, length, speed, isDashed]
    const arcData = [
        [1.0, Math.PI * 1.5, 0.5, false],
        [0.8, Math.PI * 0.8, -0.3, true],
        [0.6, Math.PI * 1.8, 0.8, false],
        [0.4, Math.PI * 0.5, -1.0, true]
    ];

    const { nodesCoords, colors } = useMemo(() => {
        const N = 8;
        const pts = new Float32Array(N * 3);
        const col = new Float32Array(N * 3);

        const gold = new THREE.Color(GOLD);

        for (let i = 0; i < N; i++) {
            const a = (i / N) * Math.PI * 2;
            const r = 1.0;
            pts[i * 3] = Math.cos(a) * r;
            pts[i * 3 + 1] = Math.sin(a) * r;
            pts[i * 3 + 2] = 0;

            col[i * 3] = gold.r;
            col[i * 3 + 1] = gold.g;
            col[i * 3 + 2] = gold.b;
        }
        return { nodesCoords: pts, colors: col };
    }, []);

    useFrame((state) => {
        if (!arcsRef.current || !nodesRef.current) return;
        const t = state.clock.getElapsedTime();

        let i = 0;
        arcsRef.current.children.forEach(arc => {
            const data = arcData[i];
            arc.rotation.z = t * (data[2] as number);
            i++;
        });

        // Occasional red pulse anomaly
        const colArr = nodesRef.current.geometry.attributes.color.array as Float32Array;
        const sizes = nodesRef.current.geometry.attributes.size;

        const isAnomaly = (t % 5.0) < 0.3; // short pulse every 5 seconds
        const gold = new THREE.Color(GOLD);
        const red = new THREE.Color(RED_ALERT);

        for (let j = 0; j < 8; j++) {
            // make node 3 the primary anomaly
            if (j === 3 && isAnomaly) {
                colArr[j * 3] = red.r; colArr[j * 3 + 1] = red.g; colArr[j * 3 + 2] = red.b;
                if (sizes) setSizeAttribute(nodesRef.current.geometry, j, 0.12);
            } else {
                colArr[j * 3] = gold.r; colArr[j * 3 + 1] = gold.g; colArr[j * 3 + 2] = gold.b;
                if (sizes) setSizeAttribute(nodesRef.current.geometry, j, 0.06);
            }
        }
        nodesRef.current.geometry.attributes.color.needsUpdate = true;
    });

    return (
        <group>
            <group ref={arcsRef}>
                {arcData.map((data, i) => {
                    const r = data[0] as number;
                    const len = data[1] as number;
                    const dashed = data[3] as boolean;

                    const geo = new THREE.EdgesGeometry(new THREE.TorusGeometry(r, 0.015, 2, 64, len));
                    return (
                        <lineSegments key={i} geometry={geo}>
                            {dashed ? (
                                <lineDashedMaterial color={GOLD} transparent opacity={0.4} scale={1} dashSize={0.1} gapSize={0.1} />
                            ) : (
                                <lineBasicMaterial color={GOLD} transparent opacity={0.3} />
                            )}
                        </lineSegments>
                    );
                })}
            </group>

            <points ref={nodesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[nodesCoords, 3]} />
                    <bufferAttribute attach="attributes-color" args={[colors, 3]} />
                </bufferGeometry>
                <pointsMaterial size={0.06} vertexColors transparent opacity={0.8} />
            </points>

            {/* Center crosshair */}
            <mesh>
                <ringGeometry args={[0.05, 0.08, 16]} />
                <meshBasicMaterial color={GOLD} transparent opacity={0.5} />
            </mesh>
        </group >
    );
}

export function ClinicalSurveillanceViz() {
    return <Canvas {...canvasProps}><CircularDashboard /></Canvas>;
}
