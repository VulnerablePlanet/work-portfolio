import { Text } from '@react-three/drei';
import type {
  AssetNode,
  LightNode,
  PortalNode,
  RoomNode,
  TextNode,
} from '@/domain/room/document';
import { PrefabView } from '@/presentation/prefabs/registry';

function AssetPlaceholder({ node }: { node: AssetNode }) {
  return (
    <group
      position={node.transform.position}
      rotation={node.transform.rotation}
      scale={node.transform.scale}
    >
      <mesh>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial
          color="#9fc2ff"
          wireframe
          transparent
          opacity={0.55}
        />
      </mesh>
    </group>
  );
}

function TextNodeView({ node }: { node: TextNode }) {
  return (
    <group
      position={node.transform.position}
      rotation={node.transform.rotation}
      scale={node.transform.scale}
    >
      <mesh position={[0, 0, -0.04]} receiveShadow>
        <boxGeometry args={[2.6, 1.4, 0.06]} />
        <meshStandardMaterial color="#101a33" roughness={0.6} />
      </mesh>
      <Text
        position={[0, 0.22, 0]}
        fontSize={0.24}
        color="#edf1ff"
        maxWidth={2.3}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
      >
        {node.content.title}
      </Text>
      <Text
        position={[0, -0.24, 0]}
        fontSize={0.13}
        color="#9aa3c7"
        maxWidth={2.3}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
      >
        {node.content.body}
      </Text>
    </group>
  );
}

function LightNodeView({ node }: { node: LightNode }) {
  const color =
    node.preset === 'warm'
      ? '#ffd7a8'
      : node.preset === 'cool'
        ? '#bcd8ff'
        : '#ffffff';

  if (node.preset === 'ambient') {
    return <ambientLight color={color} intensity={node.intensity} />;
  }

  if (node.preset === 'spot') {
    return (
      <spotLight
        position={node.transform.position}
        color={color}
        intensity={node.intensity * 12}
        angle={0.5}
        penumbra={0.6}
        distance={14}
      />
    );
  }

  return (
    <pointLight
      position={node.transform.position}
      color={color}
      intensity={node.intensity * 8}
      distance={10}
    />
  );
}

function PortalNodeView({ node }: { node: PortalNode }) {
  return (
    <group
      position={node.transform.position}
      rotation={node.transform.rotation}
      scale={node.transform.scale}
    >
      <mesh position={[-0.55, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 2.2, 0.25]} />
        <meshStandardMaterial color="#9fc2ff" roughness={0.4} />
      </mesh>
      <mesh position={[0.55, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 2.2, 0.25]} />
        <meshStandardMaterial color="#9fc2ff" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.12, 0.25]} />
        <meshStandardMaterial color="#9fc2ff" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[1, 2]} />
        <meshBasicMaterial
          color="#80f2c7"
          transparent
          opacity={0.16}
          depthWrite={false}
          side={2}
        />
      </mesh>
      <Text
        position={[0, 1.3, 0]}
        fontSize={0.12}
        color="#dce6ff"
        anchorX="center"
        anchorY="middle"
      >
        {node.label}
      </Text>
    </group>
  );
}

export function RoomNodeView({ node }: { node: RoomNode }) {
  switch (node.kind) {
    case 'prefab':
      return <PrefabView node={node} />;
    case 'asset':
      return <AssetPlaceholder node={node} />;
    case 'text':
      return <TextNodeView node={node} />;
    case 'light':
      return <LightNodeView node={node} />;
    case 'portal':
      return <PortalNodeView node={node} />;
  }
}
