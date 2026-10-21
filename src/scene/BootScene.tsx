import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

interface BootSceneProps {
  enableShadows: boolean;
  shadowMapSize: 1024 | 2048;
}

export function BootScene({
  enableShadows,
  shadowMapSize,
}: BootSceneProps) {
  const heroRef = useRef<Mesh>(null);
  const position = useMemo<[number, number, number]>(() => [0, 0.5, 0], []);

  useFrame((_, delta) => {
    const hero = heroRef.current;

    if (!hero) {
      return;
    }

    hero.rotation.y += delta * 0.35;
    hero.rotation.x = Math.sin(performance.now() * 0.0004) * 0.08;
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        castShadow={enableShadows}
        intensity={1.25}
        position={[4, 6, 3]}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
      />

      <mesh
        position={[0, -0.05, 0]}
        receiveShadow={enableShadows}
        rotation-x={-Math.PI / 2}
      >
        <boxGeometry args={[5, 0.1, 5]} />
        <meshStandardMaterial color="#0f1731" />
      </mesh>

      <mesh
        ref={heroRef}
        castShadow={enableShadows}
        receiveShadow={enableShadows}
        position={position}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#7ca7ff" metalness={0.2} roughness={0.35} />
      </mesh>
    </>
  );
}
