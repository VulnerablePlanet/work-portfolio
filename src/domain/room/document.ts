export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type Vec3 = [number, number, number];

export type RoomTheme = 'studio' | 'gallery' | 'lab' | 'lounge' | 'minimal';

export type MaterialId =
  | 'grid-blue'
  | 'concrete'
  | 'wood'
  | 'metal'
  | 'carpet'
  | 'plaster';

export type PrefabId = string;

export interface RoomDocument {
  schemaVersion: 1;
  meta: RoomMeta;
  room: RoomShell;
  spawn: Spawn;
  nodes: RoomNode[];
}

export interface RoomMeta {
  title: string;
  summary: string;
  theme: RoomTheme;
}

export interface RoomShell {
  width: number;
  depth: number;
  height: number;
  floor: MaterialId;
  walls: MaterialId;
  ceiling: boolean;
}

export interface Spawn {
  id?: string;
  position: Vec3;
  yaw: number;
}

export interface Transform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export type RoomNode =
  | PrefabNode
  | AssetNode
  | TextNode
  | LightNode
  | PortalNode;

interface NodeBase {
  id: string;
  transform: Transform;
  locked?: boolean;
}

export interface PrefabNode extends NodeBase {
  kind: 'prefab';
  prefab: PrefabId;
  prefabVersion: number;
  props?: JsonObject;
  interaction?: ContentBlock;
}

export interface AssetNode extends NodeBase {
  kind: 'asset';
  assetId: string;
  collider: 'auto' | 'box' | 'none';
  interaction?: ContentBlock;
}

export interface TextNode extends NodeBase {
  kind: 'text';
  style: 'plaque' | 'wall' | 'floating';
  content: ContentBlock;
}

export interface LightNode extends NodeBase {
  kind: 'light';
  preset: 'warm' | 'cool' | 'spot' | 'ambient';
  intensity: number;
}

export interface PortalNode extends NodeBase {
  kind: 'portal';
  targetRoomId: string;
  targetSpawnId?: string;
  label: string;
}

export interface ContentBlock {
  eyebrow: string;
  title: string;
  body: string;
  links?: ContentLink[];
}

export interface ContentLink {
  label: string;
  href: string;
}
