import { Suspense } from 'react';
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import { resolveRoomColliders } from '@/domain/room/colliders';
import type { RoomDocument } from '@/domain/room/document';
import { PlayerController } from '@/player/PlayerController';
import { RoomNodeView } from '@/presentation/room/RoomNodeView';
import { StudioDecor } from '@/presentation/room/StudioDecor';
import { useRoomMaterials } from '@/scene/materials/useRoomMaterials';

interface RoomRendererProps {
  document: RoomDocument;
  enableShadows: boolean;
  shadowMapSize: 1024 | 2048;
}

export function RoomRenderer({
  document,
  enableShadows,
  shadowMapSize,
}: RoomRendererProps) {
  const materials = useRoomMaterials();
  const colliders = resolveRoomColliders(document);
  const { width, depth, height } = document.room;

  return (
    <>
      <ambientLight intensity={0.95} />
      <directionalLight
        castShadow={enableShadows}
        intensity={1.8}
        position={[5, 6, 3]}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
      />
      <directionalLight intensity={0.45} position={[-4, 3, -2]} />

      <Suspense fallback={null}>
        <Physics timeStep={1 / 60} gravity={[0, 0, 0]} colliders={false}>
          <PlayerController spawn={document.spawn} />

          <RigidBody type="fixed" colliders={false}>
            {colliders.map((collider) => (
              <CuboidCollider
                key={collider.id}
                args={[
                  collider.size[0] / 2,
                  collider.size[1] / 2,
                  collider.size[2] / 2,
                ]}
                position={collider.position}
                rotation={collider.rotation}
              />
            ))}
          </RigidBody>
        </Physics>
      </Suspense>

      {document.nodes.map((node) => (
        <RoomNodeView key={node.id} node={node} />
      ))}

      <mesh position={[0, -0.05, 0]} receiveShadow={enableShadows}>
        <boxGeometry args={[width, 0.1, depth]} />
        <primitive object={materials.floor} attach="material" />
      </mesh>

      <mesh
        position={[0, height / 2, -depth / 2]}
        receiveShadow={enableShadows}
      >
        <boxGeometry args={[width, height, 0.2]} />
        <primitive object={materials.backWall} attach="material" />
      </mesh>

      <mesh
        position={[0, height / 2, depth / 2]}
        receiveShadow={enableShadows}
      >
        <boxGeometry args={[width, height, 0.2]} />
        <primitive object={materials.backWall} attach="material" />
      </mesh>

      <mesh
        position={[-width / 2, height / 2, 0]}
        receiveShadow={enableShadows}
      >
        <boxGeometry args={[0.2, height, depth]} />
        <primitive object={materials.sideWall} attach="material" />
      </mesh>

      <mesh
        position={[width / 2, height / 2, 0]}
        receiveShadow={enableShadows}
      >
        <boxGeometry args={[0.2, height, depth]} />
        <primitive object={materials.sideWall} attach="material" />
      </mesh>

      <mesh position={[0, height + 0.04, 0]} receiveShadow={enableShadows}>
        <boxGeometry args={[width, 0.08, depth]} />
        <primitive object={materials.ceiling} attach="material" />
      </mesh>

      {document.meta.theme === 'studio' ? (
        <StudioDecor room={document.room} spawn={document.spawn} />
      ) : null}
    </>
  );
}
