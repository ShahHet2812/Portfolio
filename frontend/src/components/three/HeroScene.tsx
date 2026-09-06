import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { Points as ThreePoints, Group } from 'three';

const GRID = 14;
const SPACING = 0.62;

/**
 * A 3D lattice of points — the CSS dot-matrix background extended into depth.
 * Drifts slowly and leans toward the pointer.
 */
function Lattice() {
  const points = useRef<ThreePoints>(null);

  const positions = useMemo(() => {
    const coords = new Float32Array(GRID * GRID * GRID * 3);
    const offset = ((GRID - 1) * SPACING) / 2;
    let i = 0;
    for (let x = 0; x < GRID; x++) {
      for (let y = 0; y < GRID; y++) {
        for (let z = 0; z < GRID; z++) {
          coords[i++] = x * SPACING - offset;
          coords[i++] = y * SPACING - offset;
          coords[i++] = z * SPACING - offset;
        }
      }
    }
    return coords;
  }, []);

  useFrame((state, delta) => {
    const mesh = points.current;
    if (!mesh) return;
    mesh.rotation.y += delta * 0.045;
    mesh.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.12;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.032} color="#56d364" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/** A slowly counter-rotating wireframe shell for a second depth cue. */
function Shell() {
  const mesh = useRef<any>(null);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.y -= delta * 0.06;
    mesh.current.rotation.z += delta * 0.02;
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[3.4, 1]} />
      <meshBasicMaterial color="#58a6ff" wireframe transparent opacity={0.09} />
    </mesh>
  );
}

/** Eases the whole scene toward the pointer without re-rendering React. */
function PointerLean({ children }: { children: React.ReactNode }) {
  const group = useRef<Group>(null);
  const { pointer } = useThree();

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y += (pointer.x * 0.22 - group.current.rotation.y) * 0.04;
    group.current.rotation.x += (-pointer.y * 0.16 - group.current.rotation.x) * 0.04;
  });

  return <group ref={group}>{children}</group>;
}

const HeroScene: React.FC = () => (
  <Canvas
    className="hero-canvas"
    camera={{ position: [0, 0, 9], fov: 55 }}
    // Cap the pixel ratio: this is decorative, not worth rendering at 3x.
    dpr={[1, 1.5]}
    gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
    frameloop="always"
  >
    <PointerLean>
      <Lattice />
      <Shell />
    </PointerLean>
  </Canvas>
);

export default HeroScene;
