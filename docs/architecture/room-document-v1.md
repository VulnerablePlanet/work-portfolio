# Contrato `RoomDocument` v1

- Estado: vigente (diseño)
- Fecha: 2026-10-22
- Relacionado: [ADR-002](../adr/002-espacio-habitacion-portal.md), [ADR-004](../adr/004-assets-y-colisionadores.md)
- Fuente normativa: `src/domain/room/schema.ts` (Zod) cuando se implemente. Este documento y el esquema deben evolucionar juntos.

## 1. Propósito

`RoomDocument` es la representación serializable de una habitación. Es la **única fuente de verdad** para:

- el renderer de la experiencia,
- el composer del editor,
- el perfil público (a través de los `ContentBlock`),
- la validación de publicación.

No contiene geometría embebida ni código. Contiene referencias a prefabs y assets, transformaciones, contenido y parámetros.

## 2. Tipos normativos

```ts
export type Vec3 = [number, number, number];

export interface RoomDocument {
  schemaVersion: 1;
  meta: RoomMeta;
  room: RoomShell;
  spawn: Spawn;
  nodes: RoomNode[];
}

export interface RoomMeta {
  title: string;          // 1..80
  summary: string;        // 0..240
  theme: RoomTheme;       // 'studio' | 'gallery' | 'lab' | 'lounge' | 'minimal'
}

export interface RoomShell {
  width: number;          // 4..40 m
  depth: number;          // 4..40 m
  height: number;         // 2.4..12 m
  floor: MaterialId;
  walls: MaterialId;
  ceiling: boolean;
}

export type MaterialId =
  | 'grid-blue' | 'concrete' | 'wood' | 'metal' | 'carpet' | 'plaster';

export interface Spawn {
  id?: string;            // requerido si un portal apunta a este spawn
  position: Vec3;         // dentro de la sala, y = altura de ojos
  yaw: number;            // radianes, -π..π
}

export interface Transform {
  position: Vec3;         // metros, origen en el centro del suelo
  rotation: Vec3;         // Euler XYZ en radianes
  scale: Vec3;            // 1 = tamaño natural
}

export type RoomNode =
  | PrefabNode
  | AssetNode
  | TextNode
  | LightNode
  | PortalNode;

interface NodeBase {
  id: string;             // ^[a-z0-9][a-z0-9-]{0,31}$, único
  transform: Transform;
  locked?: boolean;
}

export interface PrefabNode extends NodeBase {
  kind: 'prefab';
  prefab: PrefabId;
  prefabVersion: number;
  props?: Record<string, JsonValue>;
  interaction?: ContentBlock;
}

export interface AssetNode extends NodeBase {
  kind: 'asset';
  assetId: string;        // UUID de assets
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
  intensity: number;      // 0..3
}

export interface PortalNode extends NodeBase {
  kind: 'portal';
  targetRoomId: string;
  targetSpawnId?: string;
  label: string;          // 1..40
}

export interface ContentBlock {
  eyebrow: string;        // 0..40
  title: string;          // 1..80
  body: string;           // 0..600
  links?: ContentLink[];  // máx. 5
}

export interface ContentLink {
  label: string;          // 1..40
  href: string;           // http/https, máx. 500
}
```

`JsonValue` es el subconjunto JSON estándar; las props de cada prefab se validan con su propio esquema.

## 3. Reglas de validación

### 3.1 Documento

| Regla | Valor |
|---|---|
| `schemaVersion` | exactamente `1` |
| `nodes.length` | 1..150 |
| IDs de nodo | patrón, únicos, sin reservados |
| `meta.title` | 1..80 |
| `meta.summary` | 0..240 |
| `room.width`, `room.depth` | 4..40 |
| `room.height` | 2.4..12 |
| `spawn.position` | dentro de los límites de la sala, `y` = 1.6..1.9 |
| `transform.scale` | cada eje 0.05..20 |
| `transform.position` | dentro de la sala ± 1 m (permite objetos en pared) |
| `transform.rotation` | radianes, normalizados a [-π, π] |
| `ContentBlock.links` | máx. 5; solo `http`/`https`; sin `javascript:` ni `data:` |
| Tamaño serializado | ≤ 256 KB |
| Triángulos estimados | ≤ 300.000 |
| Texturas | ≤ 12 MB |

### 3.2 Nodos

- **Prefab:** `prefab` debe existir en el catálogo; `prefabVersion` debe ser soportada; `props` validado por el esquema del prefab.
- **Asset:** `assetId` debe existir, pertenecer al dueño, estar `ready` y respetar el presupuesto del asset.
- **Text:** siempre requiere `content`; no se permite texto vacío en `title`.
- **Light:** `intensity` 0..3; máximo 8 luces por habitación (además de las globales).
- **Portal:** `targetRoomId` válido, del mismo espacio, distinto de la habitación actual; `targetSpawnId` debe existir en el destino si se especifica; el destino debe estar publicado al publicar (o se advierte y el portal queda inactivo).

### 3.3 Publicación

El servidor revalida todo y además:

- Assets referenciados en estado `ready`.
- Portales apuntando a habitaciones publicadas (o se marcan inactivos).
- Presupuesto total calculado con los `stats` de los assets.
- `spawn` dentro de la sala y sin colisión con un nodo estático (advertencia, no error).

## 4. Prefabs

### 4.1 Separación de responsabilidades

| Parte | Ubicación | Contenido |
|---|---|---|
| Metadatos | `src/domain/prefabs/catalog.ts` | `id`, `version`, `label`, `category`, coste, tipo de colisión, esquema de props, defaults |
| Geometría | `src/presentation/prefabs/registry.tsx` | Componente React/three que dibuja el prefab |
| Colisión | `src/domain/prefabs/catalog.ts` | `ColliderSpec` (caja, compuesta o convexa) |

El dominio puede validar un prefab sin importar three. La presentación no decide reglas.

### 4.2 Catálogo v1

| ID | Categoría | Interacción | Notas |
|---|---|---|---|
| `pedestal` | structure | Sí | Base para exhibir assets |
| `console` | furniture | Sí | Consola de arquitectura |
| `terminal` | furniture | Sí | Terminal de proyectos |
| `monolith` | display | Sí | Columna de skills |
| `shelf` | furniture | No | Estantería |
| `desk` | furniture | No | Escritorio |
| `chair` | furniture | No | Silla |
| `plant` | prop | No | Planta procedural |
| `plaque` | display | Sí | Placa de texto |
| `doorway` | structure | Sí (portal) | Marco de portal |
| `spotlight` | light | No | Foco de exposición |

Cada prefab declara `thumbnail`, `cost` (triángulos, texturas) y `defaultProps`.

### 4.3 Versionado

- `prefabVersion` se fija en el documento.
- El renderer mantiene la versión anterior mientras existan documentos que la usen, o aplica una migración documentada.
- Cambiar la geometría de un prefab sin subir versión es un error de revisión.

## 5. `SpaceManifest` v1

```ts
export interface SpaceManifest {
  schemaVersion: 1;
  generatedAt: string;      // ISO 8601
  spawnRoomId: string | null;
  rooms: ManifestRoom[];
}

export interface ManifestRoom {
  roomId: string;
  slug: string;
  title: string;
  purpose: 'about' | 'projects' | 'skills' | 'contact' | 'lab' | 'custom';
  versionId: string;
  version: number;
  r2Key: string;
}
```

Se escribe en `spaces/{spaceId}/manifest.json` y se cachea con TTL corto. Es el snapshot coherente del espacio publicado.

## 6. Ejemplo (semilla de la habitación actual)

```json
{
  "schemaVersion": 1,
  "meta": {
    "title": "Estudio",
    "summary": "Espacio de trabajo de ejemplo",
    "theme": "studio"
  },
  "room": {
    "width": 10,
    "depth": 10,
    "height": 3.2,
    "floor": "grid-blue",
    "walls": "concrete",
    "ceiling": true
  },
  "spawn": { "id": "main", "position": [0, 1.7, 3.8], "yaw": 0 },
  "nodes": [
    {
      "id": "architecture-console",
      "kind": "prefab",
      "prefab": "console",
      "prefabVersion": 1,
      "transform": { "position": [1.4, 0.75, -2.5], "rotation": [0, 0, 0], "scale": [1, 1, 1] },
      "props": { "width": 1.2, "height": 1.5, "depth": 0.8 },
      "interaction": {
        "eyebrow": "Arquitectura",
        "title": "Sistemas interactivos de alto rendimiento",
        "body": "Renderer con fallback real, estado desacoplado, interacción por raycast y UI DOM separada del canvas.",
        "links": [{ "label": "Ver caso", "href": "https://example.com/caso" }]
      }
    },
    {
      "id": "projects-terminal",
      "kind": "prefab",
      "prefab": "terminal",
      "prefabVersion": 1,
      "transform": { "position": [-3.25, 0.65, 1.35], "rotation": [0, 0.4, 0], "scale": [1, 1, 1] },
      "props": { "width": 1.25, "height": 1.3, "depth": 0.75 },
      "interaction": {
        "eyebrow": "Proyectos",
        "title": "Casos con criterio técnico",
        "body": "Proyectos reales con contexto, decisiones y resultados."
      }
    },
    {
      "id": "skills-monolith",
      "kind": "prefab",
      "prefab": "monolith",
      "prefabVersion": 1,
      "transform": { "position": [3.25, 0.85, 1.45], "rotation": [0, -0.4, 0], "scale": [1, 1, 1] },
      "props": { "width": 0.9, "height": 1.7, "depth": 0.9 },
      "interaction": {
        "eyebrow": "Skills",
        "title": "Fundamentos antes que frameworks",
        "body": "TypeScript, arquitectura, renderizado 3D, performance y testing."
      }
    }
  ]
}
```

Este documento sustituye a `PORTFOLIO_OBJECTS` y a los valores hardcodeados de `RoomShell`. Es el artefacto que produce la tarea T0.2 de [plan-m0.md](plan-m0.md).

## 7. Migraciones

```text
schemaVersion 1 → 2 → 3 …
```

Reglas:

1. **Migrar al leer, escribir siempre la versión actual.**
2. Cada migración es una función pura `(doc: unknown) => RoomDocumentVNext` con tests de fixture.
3. Un documento con versión **mayor** que la soportada se abre en modo lectura y se avisa; nunca se sobrescribe.
4. Las migraciones no dependen de red, base de datos ni React.
5. Se mantiene un fixture por versión en `src/domain/room/__fixtures__/`.

Ejemplo de migración futura (v1 → v2, añadir `tags` a los nodos):

```ts
export function migrateV1toV2(doc: RoomDocumentV1): RoomDocumentV2 {
  return {
    ...doc,
    schemaVersion: 2,
    nodes: doc.nodes.map((node) => ({ ...node, tags: [] })),
  };
}
```

## 8. Lo que no incluye v1

- Grupos, jerarquías o instancias anidadas.
- Animaciones, triggers o scripts.
- Materiales personalizados por nodo (solo `MaterialId` del catálogo).
- Luces arbitrarias más allá de los presets.
- Física dinámica de objetos de usuario.
- Colaboración en tiempo real.
- Datos privados o secretos.

Se añadirán con `schemaVersion` nuevo y migración, no editando v1.

## 9. Seguridad

- El documento es **datos**: no se evalúa, no se interpreta como código.
- Los textos se escapan en SSR y en el panel; nunca `dangerouslySetInnerHTML`.
- Los enlaces se validan por esquema y longitud.
- Los IDs se validan por patrón; no se usan como rutas de archivo.
- El tamaño máximo se aplica antes de parsear y después de serializar.
- El servidor no confía en `stats` enviados por el cliente: recalcula con los assets y el catálogo de prefabs.
