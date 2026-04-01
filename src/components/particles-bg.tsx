"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FloatingParticles({ count = 80 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);
  const mouseRef = useRef({ x: 0, y: 0 });

  const [positions, sizes, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const col = new Float32Array(count * 3);

    // Sage green palette in RGB
    const palette = [
      [0.35, 0.55, 0.38],  // sage
      [0.3, 0.5, 0.45],    // teal-sage
      [0.45, 0.65, 0.45],  // light sage
      [0.25, 0.4, 0.35],   // dark sage
      [0.5, 0.7, 0.55],    // bright sage
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
      sz[i] = Math.random() * 3 + 0.5;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    return [pos, sz, col];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.elapsedTime;
    const posAttr = mesh.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      // Gentle floating motion
      arr[idx] += Math.sin(time * 0.3 + i * 0.5) * 0.002;
      arr[idx + 1] += Math.cos(time * 0.2 + i * 0.3) * 0.003;
      arr[idx + 2] += Math.sin(time * 0.15 + i * 0.7) * 0.001;

      // Wrap around
      if (arr[idx] > 10) arr[idx] = -10;
      if (arr[idx] < -10) arr[idx] = 10;
      if (arr[idx + 1] > 6) arr[idx + 1] = -6;
      if (arr[idx + 1] < -6) arr[idx + 1] = 6;
    }
    posAttr.needsUpdate = true;
    mesh.current.rotation.y = time * 0.02;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function FloatingLines({ count = 12 }: { count?: number }) {
  const group = useRef<THREE.Group>(null!);

  const lines = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const points = [];
      const startX = (Math.random() - 0.5) * 16;
      const startY = (Math.random() - 0.5) * 10;
      const startZ = (Math.random() - 0.5) * 4 - 3;
      for (let j = 0; j < 20; j++) {
        points.push(
          new THREE.Vector3(
            startX + Math.sin(j * 0.5) * 2,
            startY + j * 0.3,
            startZ + Math.cos(j * 0.3) * 0.5
          )
        );
      }
      return { points, speed: 0.1 + Math.random() * 0.2, offset: i * 1.5 };
    });
  }, [count]);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.02;
  });

  return (
    <group ref={group}>
      {lines.map((line, i) => {
        const curve = new THREE.CatmullRomCurve3(line.points);
        const curvePoints = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        return (
          <line key={i}>
            <bufferGeometry attach="geometry" {...geometry} />
            <lineBasicMaterial
              color={new THREE.Color(0.4, 0.6, 0.42)}
              transparent
              opacity={0.08}
              linewidth={1}
            />
          </line>
        );
      })}
    </group>
  );
}

export function ParticlesBg() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <FloatingParticles count={60} />
        <FloatingLines count={8} />
      </Canvas>
    </div>
  );
}
