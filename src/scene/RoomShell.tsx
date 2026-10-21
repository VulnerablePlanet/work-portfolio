import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import { PORTFOLIO_OBJECTS } from '@/content/interactive-objects';
import { InteractiveObject } from '@/interaction/InteractiveObject';
import { PlayerController } from '@/player/PlayerController';
import { useRoomMaterials } from '@/scene/materials/useRoomMaterials';

interface RoomShellProps {
  enableShadows: boolean;
  shadowMapSize: 1024 | 2048;
}

const ROOM = {
  width: 10,
  depth: 10,
  wallHeight: 3.2,
  wallThickness: 0.2,
};

export function RoomShell({ enableShadows, shadowMapSize }: RoomShellProps) {
  const roomMaterials = useRoomMaterials();

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

      <Physics timeStep={1 / 60} gravity={[0, 0, 0]} colliders={false}>
        <PlayerController />

        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider
            args={[ROOM.width / 2, 0.1, ROOM.depth / 2]}
            position={[0, -0.1, 0]}
          />
          <CuboidCollider
            args={[ROOM.width / 2, ROOM.wallHeight / 2, ROOM.wallThickness / 2]}
            position={[0, ROOM.wallHeight / 2, -ROOM.depth / 2]}
          />
          <CuboidCollider
            args={[ROOM.width / 2, ROOM.wallHeight / 2, ROOM.wallThickness / 2]}
            position={[0, ROOM.wallHeight / 2, ROOM.depth / 2]}
          />
          <CuboidCollider
            args={[ROOM.wallThickness / 2, ROOM.wallHeight / 2, ROOM.depth / 2]}
            position={[-ROOM.width / 2, ROOM.wallHeight / 2, 0]}
          />
          <CuboidCollider
            args={[ROOM.wallThickness / 2, ROOM.wallHeight / 2, ROOM.depth / 2]}
            position={[ROOM.width / 2, ROOM.wallHeight / 2, 0]}
          />
          <CuboidCollider args={[1.2, 0.6, 0.55]} position={[-2, 0.6, -1.4]} />
          {PORTFOLIO_OBJECTS.map((object) => (
            <CuboidCollider
              key={object.id}
              args={[
                object.args[0] / 2,
                object.args[1] / 2,
                object.args[2] / 2,
              ]}
              position={object.position}
            />
          ))}
        </RigidBody>
      </Physics>

      <mesh position={[0, -0.05, 0]} receiveShadow={enableShadows}>
        <boxGeometry args={[ROOM.width, 0.1, ROOM.depth]} />
        <primitive object={roomMaterials.floor} attach="material" />
      </mesh>

      <mesh position={[0, 0.01, 0.8]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.45, 0.62, 40]} />
        <meshBasicMaterial color="#9fc2ff" />
      </mesh>

      <mesh position={[0, 0.015, 0.8]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.08, 4.2]} />
        <meshBasicMaterial color="#88b4ff" />
      </mesh>

      <mesh position={[0, 0.015, -0.9]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.6, 1.6]} />
        <meshBasicMaterial color="#182745" />
      </mesh>

      <mesh
        position={[0, ROOM.wallHeight / 2, -ROOM.depth / 2]}
        receiveShadow={enableShadows}
      >
        <boxGeometry
          args={[ROOM.width, ROOM.wallHeight, ROOM.wallThickness]}
        />
        <primitive object={roomMaterials.backWall} attach="material" />
      </mesh>

      <mesh
        position={[0, ROOM.wallHeight / 2, ROOM.depth / 2]}
        receiveShadow={enableShadows}
      >
        <boxGeometry
          args={[ROOM.width, ROOM.wallHeight, ROOM.wallThickness]}
        />
        <primitive object={roomMaterials.backWall} attach="material" />
      </mesh>

      <mesh
        position={[-ROOM.width / 2, ROOM.wallHeight / 2, 0]}
        receiveShadow={enableShadows}
      >
        <boxGeometry
          args={[ROOM.wallThickness, ROOM.wallHeight, ROOM.depth]}
        />
        <primitive object={roomMaterials.sideWall} attach="material" />
      </mesh>

      <mesh
        position={[ROOM.width / 2, ROOM.wallHeight / 2, 0]}
        receiveShadow={enableShadows}
      >
        <boxGeometry
          args={[ROOM.wallThickness, ROOM.wallHeight, ROOM.depth]}
        />
        <primitive object={roomMaterials.sideWall} attach="material" />
      </mesh>


      <mesh position={[0, ROOM.wallHeight + 0.04, 0]} receiveShadow={enableShadows}>
        <boxGeometry args={[ROOM.width, 0.08, ROOM.depth]} />
        <primitive object={roomMaterials.ceiling} attach="material" />
      </mesh>

      <mesh position={[0, 0.025, -3.75]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[7.6, 0.08]} />
        <meshBasicMaterial color="#ff80cb" />
      </mesh>

      <mesh position={[-3.25, 0.026, 1.35]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.52, 0.68, 40]} />
        <meshBasicMaterial color="#80f2c7" />
      </mesh>

      <mesh position={[3.25, 0.026, 1.45]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.52, 0.68, 40]} />
        <meshBasicMaterial color="#c7a2ff" />
      </mesh>

      <mesh position={[0, ROOM.wallHeight - 0.35, -2.6]}>
        <boxGeometry args={[3.6, 0.08, 0.08]} />
        <meshBasicMaterial color="#9fc2ff" />
      </mesh>

      <mesh
        castShadow={enableShadows}
        receiveShadow={enableShadows}
        position={[-2, 0.6, -1.4]}
      >
        <boxGeometry args={[2.4, 1.2, 1.1]} />
        <primitive object={roomMaterials.obstacle} attach="material" />
      </mesh>

      {PORTFOLIO_OBJECTS.map((object) => (
        <InteractiveObject
          key={object.id}
          id={object.id}
          args={object.args}
          color={object.color}
          maxDistance={object.maxDistance}
          position={object.position}
          content={object.content}
        />
      ))}
    </>
  );
}
