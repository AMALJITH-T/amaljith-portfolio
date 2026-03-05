"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * BackgroundNodeGraph.tsx
 *
 * A subtle, slow-moving node graph visualization used as the background 
 * for the Research section. Represents academic connections and topological
 * data structures. Extremely low opacity and slow movement so it doesn't 
 * distract from the text.
 */

function mulberry32(seed: number) {
    let s = seed | 0;
    return function () {
        s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function NodeNetwork() {
    const groupRef = useRef<THREE.Group>(null!);

    // Generate nodes and edges
    const { positions, lines } = useMemo(() => {
        const rng = mulberry32(0x1234);
        const N = 40;
        const pos = new Float32Array(N * 3);
        const pts = [];

        for (let i = 0; i < N; i++) {
            // Spread widely across x, y, z
            pts.push(new THREE.Vector3(
                (rng() - 0.5) * 15,
                (rng() - 0.5) * 8,
                (rng() - 0.5) * 5
            ));
        }

        const lineGeo = new THREE.BufferGeometry();
        const linePts = [];

        // Connect nearby nodes
        for (let i = 0; i < N; i++) {
            pos[i * 3] = pts[i].x;
            pos[i * 3 + 1] = pts[i].y;
            pos[i * 3 + 2] = pts[i].z;

            for (let j = i + 1; j < N; j++) {
                if (pts[i].distanceTo(pts[j]) < 4.0) {
                    linePts.push(pts[i], pts[j]);
                }
            }
        }

        lineGeo.setFromPoints(linePts);

        return { positions: pos, lines: lineGeo };
    }, []);

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        // Extremely slow drift
        groupRef.current.rotation.y = t * 0.02;
        groupRef.current.rotation.x = Math.sin(t * 0.01) * 0.1;
    });

    return (
        <group ref={groupRef}>
            <points>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                </bufferGeometry>
                <pointsMaterial size={0.06} color="#c29b27" transparent opacity={0.3} sizeAttenuation />
            </points>
            <lineSegments geometry={lines}>
                <lineBasicMaterial color="#c29b27" transparent opacity={0.08} />
            </lineSegments>
        </group>
    );
}

export function BackgroundNodeGraph() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden mix-blend-screen opacity-40">
            <Canvas
                camera={{ position: [0, 0, 10], fov: 50 }}
                gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
            >
                <NodeNetwork />
            </Canvas>
            {/* Soft gradient mask to fade the edges into black */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--bg-black)_80%)]" />
        </div>
    );
}
