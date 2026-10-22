# ADR-002 — Espacio, habitación y portal; publicación por manifiesto

- Estado: Aceptado
- Fecha: 2026-10-22
- Decisores: Sergio Botero (mantenedor)
- Relacionado: [ADR-001](001-shell-hosting.md), [ADR-003](003-perfil-publico-ssr.md), [room-document-v1](../architecture/room-document-v1.md)

## Contexto

El sistema actual tiene **una** habitación definida en código (`RoomShell`, `PORTFOLIO_OBJECTS`). El objetivo es que cada usuario reconstruya **todo su espacio de trabajo** en 3D: un portafolio compuesto por varias habitaciones con propósitos distintos (estudio, galería de proyectos, laboratorio de skills, sala de contacto).

Se necesita:

- Varias habitaciones por usuario, cada una editable y publicable.
- Navegación entre habitaciones dentro de la experiencia 3D.
- Un perfil público que agregue el contenido de todas las habitaciones.
- Publicación coherente: no puede existir un portal que lleve a una habitación no publicada.
- Límites de coste y rendimiento: no cargar todo el espacio a la vez.

## Decisión

### 1. Tres niveles de dominio

```text
Espacio (el portafolio)
  └─ Habitación (una escena 3D, un RoomDocument)
       └─ Portal (un nodo que enlaza a otra habitación del mismo espacio)
```

- **Espacio:** metadatos del portafolio (título, resumen, tema, handle) y el **manifiesto publicado**.
- **Habitación:** un `RoomDocument` versionado con su propio ciclo borrador → publicado.
- **Portal:** un nodo del documento con `targetRoomId` y `targetSpawnId` opcional.

La habitación es un **capítulo** del portafolio, no el portafolio completo. El espacio es lo que se comparte y se indexa.

### 2. Publicación por habitación + manifiesto de espacio

- Cada habitación se publica de forma independiente y crea una **versión inmutable** en R2.
- Tras publicar, se recalcula el **manifiesto** del espacio: un JSON que fija `roomId → versionId → clave R2` y la habitación de llegada (`spawnRoomId`).
- El manifiesto es lo que leen el perfil público y la experiencia. Es el snapshot coherente del portafolio.
- Publicar es una **transacción**: inserta la versión, actualiza el puntero de la habitación y recalcula el manifiesto. No existe el estado "publicado a medias".

```text
publish_room(room_id, owner_id, document_key, stats):
  lock room
  validar documento (Zod + presupuestos + portales)
  version = max(room_versions.version) + 1
  insert room_versions (version, document_key, stats)
  update rooms.published_version_id, visibility
  update spaces.published_manifest = build_manifest(space_id)
```

El DDL y la función están en [data-model.md](../architecture/data-model.md).

### 3. Reglas de portales

1. El destino debe existir, pertenecer al mismo espacio y estar **publicado**.
2. Un portal no puede apuntar a su propia habitación.
3. Los ciclos son válidos (puertas de ida y vuelta).
4. Si una habitación se despublica o se suspende, los portales que la apuntan se marcan **inactivos** en el manifiesto; la habitación de origen sigue funcionando y muestra el portal como "no disponible".
5. El destino declara un `targetSpawnId` opcional; si no, se usa el spawn por defecto de la habitación destino.
6. Los portales solo son transitables en la experiencia publicada; en playtest se permite cualquier habitación del espacio, incluidos borradores.

### 4. Runtime: una habitación a la vez

- Solo se monta una habitación en el canvas. Al cruzar un portal:
  1. Se muestra un overlay de transición.
  2. `navigate('/u/:handle/:room/room')`.
  3. El `clientLoader` obtiene el documento destino (R2 o API).
  4. Se desmonta la escena anterior y se liberan geometrías, texturas, materiales y colisionadores.
  5. El jugador aparece en el spawn destino.
- **Prefetch:** al acercarse a un portal (≈2 m) o al hacer hover, se descarga el documento y los assets críticos del destino.
- **Memoria:** el dispose es obligatorio; el test de M5 mide memoria tras recorrer 10 habitaciones.
- **Presupuesto:** por habitación, no por espacio. 150 nodos, 300k triángulos, 12 MB de texturas. El espacio crece sin coste de runtime.

### 5. URLs y superficies

| URL | Contenido |
|---|---|
| `/u/:handle` | Perfil del espacio: todas las habitaciones publicadas y su contenido |
| `/u/:handle/:room` | Página de una habitación (canonical propio) |
| `/u/:handle/:room/room` | Experiencia 3D; `noindex` |
| `/editor` | Lista de habitaciones, estado de publicación y mapa de portales |
| `/editor/:roomId` | Composer de la habitación |

El detalle de SEO y render está en [ADR-003](003-perfil-publico-ssr.md).

### 6. Editor en dos niveles

| Nivel | Responsabilidad | Fase |
|---|---|---|
| Espacio | Lista de habitaciones, propósito, plantillas, mapa de portales, publicar | M2 básico, M5 completo |
| Habitación | Composer: paleta, viewport, inspector, contenido, presupuesto, playtest | M2 |

Plantillas iniciales: **Estudio** (llegada + about), **Galería** (proyectos), **Laboratorio** (skills), **Sala** (contacto). El usuario puede renombrar, borrar y crear habitaciones; las plantillas resuelven el onboarding.

### 7. Cuotas

| Límite | v1 |
|---|---|
| Espacios por usuario | 1 (el modelo soporta N) |
| Habitaciones por espacio | 8 |
| Nodos por habitación | 150 |
| Assets por usuario | 25 |
| Almacenamiento por usuario | 25 MB |
| Peso por GLB | 15 MB (10 MB sin optimizar) |

## Consecuencias

### Positivas

- El portafolio tiene una estructura narrativa clara y ampliable.
- El perfil público puede agregar contenido por habitación y por propósito.
- Publicar una habitación no obliga a republicar el resto.
- El coste de runtime no crece con el tamaño del espacio: solo con la habitación activa.
- Los portales convierten la navegación en parte del producto, no en un menú.

### Negativas y riesgos aceptados

- **Más estados que gestionar:** borrador, publicado, no listado, suspendido, portal inactivo.
- **Publicación compuesta:** un portal puede quedar obsoleto si se despublica el destino. Se resuelve con validación y manifiesto.
- **Complejidad del editor:** dos niveles (espacio y habitación) en lugar de uno.
- **Riesgo de memoria:** cambiar de habitación exige dispose sistemático.
- **Migraciones:** el documento de habitación y el manifiesto tienen versiones independientes.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| Una sola habitación con "zonas" | No permite narrativa por capítulos ni presupuestos por escena; el documento crece sin límite |
| Un único documento gigante para todo el espacio | Carga todo, publica todo y bloquea la edición por partes; imposible de escalar |
| Publicar todo el espacio de forma atómica | Cada cambio menor obliga a republicar todas las habitaciones y a revalidar todos los assets |
| Habitaciones independientes sin espacio | Se pierde la coherencia de portales y el perfil agregado; cada habitación sería un producto distinto |
| Portales por URL externa | Rompe el control de navegación, la analítica y la coherencia de publicación |

## Referencias

- [room-document-v1.md](../architecture/room-document-v1.md) — contrato del documento y del nodo portal.
- [data-model.md](../architecture/data-model.md) — tablas, RLS y función de publicación.
- [plan-m0.md](../architecture/plan-m0.md) — primera fase, todavía sin multihabitación.
