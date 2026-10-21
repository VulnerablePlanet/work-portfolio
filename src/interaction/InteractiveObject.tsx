import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, MeshStandardMaterial } from 'three';
import { useProgressiveAssetStage } from '@/engine/assets/useProgressiveAssetStage';
import { registerInteractiveObject } from '@/interaction/interaction-registry';
import {
  type InteractionContent,
  useInteractionStore,
} from '@/store/useInteractionStore';

interface InteractiveObjectProps {
  id: string;
  content: InteractionContent;
  position: [number, number, number];
  args: [number, number, number];
  color: string;
  maxDistance?: number;
}

export function InteractiveObject({
  id,
  content,
  position,
  args,
  color,
  maxDistance = 4,
}: InteractiveObjectProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const hoveredObjectId = useInteractionStore((state) => state.hoveredObjectId);
  const activeObjectId = useInteractionStore((state) => state.activeObjectId);
  const assetStage = useProgressiveAssetStage(id);
  const isHighlighted = hoveredObjectId === id || activeObjectId === id;

  useEffect(() => {
    if (!meshRef.current) {
      return;
    }

    return registerInteractiveObject({
      id,
      object: meshRef.current,
      content,
      maxDistance,
    });
  }, [content, id, maxDistance]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;

    if (!mesh || !material) {
      return;
    }

    const targetScale = isHighlighted ? 1.06 : 1;
    mesh.scale.lerp(
      { x: targetScale, y: targetScale, z: targetScale },
      1 - Math.exp(-delta * 12),
    );

    material.emissive.set(isHighlighted ? '#3e6dff' : '#000000');
    material.emissiveIntensity = isHighlighted ? 0.75 : 0;
    material.opacity = assetStage === 'placeholder' ? 0.62 : 1;
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        metalness={0.12}
        transparent
        roughness={0.32}
        wireframe={assetStage === 'placeholder'}
      />
    </mesh>
  );
}
