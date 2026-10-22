import {
  useEffect,
  useRef,
  type ComponentType,
  type ReactNode,
} from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import { getPrefab } from '@/domain/prefabs/catalog';
import type { JsonObject, PrefabNode, Vec3 } from '@/domain/room/document';
import { registerInteractiveObject } from '@/interaction/interaction-registry';
import { useInteractionStore } from '@/store/useInteractionStore';

export interface PrefabRenderProps {
  props: JsonObject;
}

export type PrefabComponent = ComponentType<PrefabRenderProps>;

function numberProp(
  props: JsonObject,
  key: string,
  fallback: number,
): number {
  const value = props[key];

  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function colorProp(props: JsonObject, fallback: string): string {
  const value = props.accent;

  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function ScreenBox({
  width,
  height,
  depth,
  accent,
}: {
  width: number;
  height: number;
  depth: number;
  accent: string;
}) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={accent}
          metalness={0.14}
          roughness={0.32}
        />
      </mesh>
      <mesh position={[0, height * 0.08, depth / 2 + 0.012]}>
        <planeGeometry args={[width * 0.68, height * 0.32]} />
        <meshStandardMaterial
          color="#0a1020"
          emissive={accent}
          emissiveIntensity={0.45}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, -height * 0.32, depth / 2 + 0.012]}>
        <planeGeometry args={[width * 0.5, height * 0.07]} />
        <meshBasicMaterial color={accent} />
      </mesh>
    </group>
  );
}

function ConsolePrefab({ props }: PrefabRenderProps) {
  return (
    <ScreenBox
      width={numberProp(props, 'width', 1.2)}
      height={numberProp(props, 'height', 1.5)}
      depth={numberProp(props, 'depth', 0.8)}
      accent={colorProp(props, '#8db5ff')}
    />
  );
}

function TerminalPrefab({ props }: PrefabRenderProps) {
  return (
    <ScreenBox
      width={numberProp(props, 'width', 1.25)}
      height={numberProp(props, 'height', 1.3)}
      depth={numberProp(props, 'depth', 0.75)}
      accent={colorProp(props, '#80f2c7')}
    />
  );
}

function MonolithPrefab({ props }: PrefabRenderProps) {
  return (
    <ScreenBox
      width={numberProp(props, 'width', 0.9)}
      height={numberProp(props, 'height', 1.7)}
      depth={numberProp(props, 'depth', 0.9)}
      accent={colorProp(props, '#c7a2ff')}
    />
  );
}

function BlockPrefab({ props }: PrefabRenderProps) {
  const accent = colorProp(props, '#6f86bf');

  return (
    <mesh castShadow receiveShadow>
      <boxGeometry
        args={[
          numberProp(props, 'width', 2.4),
          numberProp(props, 'height', 1.2),
          numberProp(props, 'depth', 1.1),
        ]}
      />
      <meshStandardMaterial
        color={accent}
        emissive="#101a33"
        emissiveIntensity={0.28}
        roughness={0.58}
      />
    </mesh>
  );
}

function PedestalPrefab({ props }: PrefabRenderProps) {
  const width = numberProp(props, 'width', 0.6);
  const height = numberProp(props, 'height', 0.9);
  const depth = numberProp(props, 'depth', 0.6);
  const accent = colorProp(props, '#9fc2ff');

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height * 0.8, depth]} />
        <meshStandardMaterial color={accent} roughness={0.42} />
      </mesh>
      <mesh position={[0, height * 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.9, height * 0.12, depth * 0.9]} />
        <meshStandardMaterial color="#dce6ff" roughness={0.3} />
      </mesh>
      <mesh position={[0, height * 0.53, 0]}>
        <boxGeometry args={[width * 0.7, 0.02, depth * 0.7]} />
        <meshBasicMaterial color={accent} />
      </mesh>
    </group>
  );
}

function ShelfPrefab({ props }: PrefabRenderProps) {
  const width = numberProp(props, 'width', 1.8);
  const height = numberProp(props, 'height', 2.2);
  const depth = numberProp(props, 'depth', 0.5);
  const accent = colorProp(props, '#9fc2ff');
  const shelfCount = 3;

  return (
    <group>
      <mesh position={[-width / 2 + 0.04, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, height, depth]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
      <mesh position={[width / 2 - 0.04, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, height, depth]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -depth / 2 + 0.03]} receiveShadow>
        <boxGeometry args={[width, height, 0.06]} />
        <meshStandardMaterial color="#1f2e4c" roughness={0.7} />
      </mesh>
      {Array.from({ length: shelfCount }, (_, index) => {
        const y = -height / 2 + ((index + 1) * height) / (shelfCount + 1);

        return (
          <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[width - 0.12, 0.05, depth - 0.06]} />
            <meshStandardMaterial color={accent} roughness={0.45} />
          </mesh>
        );
      })}
    </group>
  );
}

function DeskPrefab({ props }: PrefabRenderProps) {
  const width = numberProp(props, 'width', 1.6);
  const height = numberProp(props, 'height', 0.75);
  const depth = numberProp(props, 'depth', 0.8);
  const accent = colorProp(props, '#9fc2ff');
  const legHeight = height - 0.08;
  const legY = -0.04;

  return (
    <group>
      <mesh position={[0, height / 2 - 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color={accent} roughness={0.45} />
      </mesh>
      {[
        [-width / 2 + 0.1, legY, -depth / 2 + 0.1],
        [width / 2 - 0.1, legY, -depth / 2 + 0.1],
        [-width / 2 + 0.1, legY, depth / 2 - 0.1],
        [width / 2 - 0.1, legY, depth / 2 - 0.1],
      ].map((position) => (
        <mesh
          key={position.join(':')}
          position={position as Vec3}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.08, legHeight, 0.08]} />
          <meshStandardMaterial color="#263657" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function ChairPrefab({ props }: PrefabRenderProps) {
  const width = numberProp(props, 'width', 0.6);
  const height = numberProp(props, 'height', 0.9);
  const depth = numberProp(props, 'depth', 0.6);
  const accent = colorProp(props, '#9fc2ff');

  return (
    <group>
      <mesh position={[0, -height * 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial color={accent} roughness={0.55} />
      </mesh>
      <mesh
        position={[0, height * 0.15, -depth / 2 + 0.03]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, height * 0.5, 0.06]} />
        <meshStandardMaterial color={accent} roughness={0.55} />
      </mesh>
      {[
        [-width / 2 + 0.06, -height / 2 + 0.01, -depth / 2 + 0.06],
        [width / 2 - 0.06, -height / 2 + 0.01, -depth / 2 + 0.06],
        [-width / 2 + 0.06, -height / 2 + 0.01, depth / 2 - 0.06],
        [width / 2 - 0.06, -height / 2 + 0.01, depth / 2 - 0.06],
      ].map((position) => (
        <mesh
          key={position.join(':')}
          position={position as Vec3}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.06, height * 0.55, 0.06]} />
          <meshStandardMaterial color="#263657" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function PlantPrefab({ props }: PrefabRenderProps) {
  const width = numberProp(props, 'width', 0.5);
  const height = numberProp(props, 'height', 1.2);
  const accent = colorProp(props, '#80f2c7');

  return (
    <group>
      <mesh position={[0, -height / 2 + height * 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[width * 0.32, width * 0.4, height * 0.24, 12]} />
        <meshStandardMaterial color="#6f5540" roughness={0.8} />
      </mesh>
      <mesh position={[0, height * 0.12, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[width * 0.55, 0]} />
        <meshStandardMaterial color={accent} roughness={0.8} />
      </mesh>
      <mesh position={[0, height * 0.3, 0]} castShadow>
        <coneGeometry args={[width * 0.35, height * 0.35, 8]} />
        <meshStandardMaterial color="#4f8f74" roughness={0.85} />
      </mesh>
    </group>
  );
}

function PlaquePrefab({ props }: PrefabRenderProps) {
  const width = numberProp(props, 'width', 0.8);
  const height = numberProp(props, 'height', 0.6);
  const depth = numberProp(props, 'depth', 0.05);
  const accent = colorProp(props, '#9fc2ff');

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#182745" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, depth / 2 + 0.002]}>
        <planeGeometry args={[width * 0.88, height * 0.86]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.2}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}

function DoorwayPrefab({ props }: PrefabRenderProps) {
  const width = numberProp(props, 'width', 1.2);
  const height = numberProp(props, 'height', 2.4);
  const depth = numberProp(props, 'depth', 0.3);
  const accent = colorProp(props, '#9fc2ff');

  return (
    <group>
      <mesh position={[-width / 2 + 0.08, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, height, depth]} />
        <meshStandardMaterial color={accent} roughness={0.4} />
      </mesh>
      <mesh position={[width / 2 - 0.08, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, height, depth]} />
        <meshStandardMaterial color={accent} roughness={0.4} />
      </mesh>
      <mesh position={[0, height / 2 - 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.14, depth]} />
        <meshStandardMaterial color={accent} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[width - 0.24, height - 0.2]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.14}
          depthWrite={false}
          side={2}
        />
      </mesh>
    </group>
  );
}

function SpotlightPrefab({ props }: PrefabRenderProps) {
  const accent = colorProp(props, '#ffe0b2');

  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.22, 12]} />
        <meshStandardMaterial color="#263657" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={1.2}
        />
      </mesh>
    </group>
  );
}

export const PREFAB_COMPONENTS: Record<string, PrefabComponent> = {
  console: ConsolePrefab,
  terminal: TerminalPrefab,
  monolith: MonolithPrefab,
  block: BlockPrefab,
  pedestal: PedestalPrefab,
  shelf: ShelfPrefab,
  desk: DeskPrefab,
  chair: ChairPrefab,
  plant: PlantPrefab,
  plaque: PlaquePrefab,
  doorway: DoorwayPrefab,
  spotlight: SpotlightPrefab,
};

function hitboxSize(node: PrefabNode): Vec3 {
  const prefab = getPrefab(node.prefab, node.prefabVersion);

  if (prefab?.collider.type === 'box') {
    return prefab.collider.size;
  }

  const props = {
    ...(prefab?.defaultProps ?? {}),
    ...(node.props ?? {}),
  };

  return [
    numberProp(props, 'width', 1),
    numberProp(props, 'height', 1),
    numberProp(props, 'depth', 1),
  ];
}

function InteractivePrefabGroup({
  node,
  children,
}: {
  node: PrefabNode;
  children: ReactNode;
}) {
  const visualRef = useRef<Group>(null);
  const hitboxRef = useRef<Mesh>(null);
  const hoveredObjectId = useInteractionStore(
    (state) => state.hoveredObjectId,
  );
  const activeObjectId = useInteractionStore((state) => state.activeObjectId);
  const isHighlighted =
    hoveredObjectId === node.id || activeObjectId === node.id;
  const interaction = node.interaction;

  useEffect(() => {
    if (!hitboxRef.current || !interaction) {
      return;
    }

    return registerInteractiveObject({
      id: node.id,
      object: hitboxRef.current,
      content: interaction,
      maxDistance: 4,
    });
  }, [interaction, node.id]);

  useFrame((_, delta) => {
    const group = visualRef.current;

    if (!group) {
      return;
    }

    const target = isHighlighted ? 1.05 : 1;
    const alpha = 1 - Math.exp(-delta * 12);

    group.scale.x += (target - group.scale.x) * alpha;
    group.scale.y += (target - group.scale.y) * alpha;
    group.scale.z += (target - group.scale.z) * alpha;
  });

  return (
    <group
      position={node.transform.position}
      rotation={node.transform.rotation}
      scale={node.transform.scale}
    >
      <group ref={visualRef}>{children}</group>
      <mesh ref={hitboxRef}>
        <boxGeometry args={hitboxSize(node)} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          colorWrite={false}
        />
      </mesh>
    </group>
  );
}

function UnknownPrefab({ node }: { node: PrefabNode }) {
  return (
    <group
      position={node.transform.position}
      rotation={node.transform.rotation}
      scale={node.transform.scale}
    >
      <mesh>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#ff8080" wireframe />
      </mesh>
    </group>
  );
}

export function PrefabView({ node }: { node: PrefabNode }) {
  const prefab = getPrefab(node.prefab, node.prefabVersion);
  const Component = prefab ? PREFAB_COMPONENTS[prefab.id] : undefined;

  if (!prefab || !Component) {
    return <UnknownPrefab node={node} />;
  }

  const props: JsonObject = {
    ...prefab.defaultProps,
    ...(node.props ?? {}),
  };
  const content = <Component props={props} />;

  if (node.interaction) {
    return (
      <InteractivePrefabGroup node={node}>{content}</InteractivePrefabGroup>
    );
  }

  return (
    <group
      position={node.transform.position}
      rotation={node.transform.rotation}
      scale={node.transform.scale}
    >
      {content}
    </group>
  );
}
