import type { RoomShell, Spawn } from '@/domain/room/document';

interface StudioDecorProps {
  room: RoomShell;
  spawn: Spawn;
}

/**
 * Decoración del tema "studio". Es geometría de tema, no contenido: no
 * participa en el documento ni en los presupuestos de nodos.
 */
export function StudioDecor({ room, spawn }: StudioDecorProps) {
  const { width, depth, height } = room;
  const [spawnX, , spawnZ] = spawn.position;

  return (
    <group>
      <mesh position={[spawnX, 0.01, spawnZ]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.45, 0.62, 40]} />
        <meshBasicMaterial color="#9fc2ff" />
      </mesh>

      <mesh
        position={[spawnX, 0.015, spawnZ - depth * 0.22]}
        rotation-x={-Math.PI / 2}
      >
        <planeGeometry args={[0.08, depth * 0.44]} />
        <meshBasicMaterial color="#88b4ff" />
      </mesh>

      <mesh position={[0, 0.015, -depth * 0.09]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[width * 0.26, depth * 0.16]} />
        <meshBasicMaterial color="#182745" />
      </mesh>

      <mesh
        position={[0, 0.025, -depth / 2 + depth * 0.125]}
        rotation-x={-Math.PI / 2}
      >
        <planeGeometry args={[width * 0.76, 0.08]} />
        <meshBasicMaterial color="#ff80cb" />
      </mesh>

      <mesh
        position={[-width * 0.325, 0.026, depth * 0.135]}
        rotation-x={-Math.PI / 2}
      >
        <ringGeometry args={[0.52, 0.68, 40]} />
        <meshBasicMaterial color="#80f2c7" />
      </mesh>

      <mesh
        position={[width * 0.325, 0.026, depth * 0.145]}
        rotation-x={-Math.PI / 2}
      >
        <ringGeometry args={[0.52, 0.68, 40]} />
        <meshBasicMaterial color="#c7a2ff" />
      </mesh>

      <mesh position={[0, height - 0.35, -depth / 2 + depth * 0.24]}>
        <boxGeometry args={[width * 0.36, 0.08, 0.08]} />
        <meshBasicMaterial color="#9fc2ff" />
      </mesh>
    </group>
  );
}
