# Arquitectura — visión general

- Estado: vigente
- Fecha: 2026-10-22
- Decisiones: [ADR-001](../adr/001-shell-hosting.md) a [ADR-007](../adr/007-telemetria-y-privacidad.md)

## 1. Qué es el sistema

Una plataforma open source donde cualquier persona crea un **espacio de trabajo 3D** para su portafolio:

- Un **espacio** agrupa una o varias **habitaciones**.
- Cada habitación se compone en un **editor visual** a partir de prefabs y assets propios.
- Cada nodo puede llevar **contenido** (proyecto, skill, contacto) que se lee en 3D y en el perfil público.
- Se **publica** una versión inmutable; el perfil se renderiza en el servidor y la experiencia 3D es una mejora progresiva.
- Cualquiera puede **explorar** espacios publicados sin cuenta. Para crear se necesita cuenta.

El objetivo no es un visor bonito: es que una persona pueda contar su trabajo en un espacio navegable y que ese contenido sea descubrible, accesible y mantenible.

## 2. Principios

1. **El documento es la verdad.** `RoomDocument` describe la habitación; el renderer, el editor y el perfil lo proyectan. No hay geometría hardcodeada en la presentación.
2. **Una sola dirección de dependencias.** `presentación → aplicación → dominio`; infraestructura implementa puertos.
3. **El dominio no sabe de React, three, Supabase ni R2.** Se puede testear sin navegador.
4. **Publicar es atómico.** Una versión publicada no cambia; el manifiesto del espacio apunta a versiones concretas.
5. **El perfil público no depende de WebGL.** Es HTML renderizado en servidor y es el producto principal.
6. **La personalización se hace con datos, no con código de usuario.** Prefabs y assets parametrizados; nunca JavaScript de usuario.
7. **Los límites son contratos.** Nodos, triángulos, texturas, bytes y publicaciones tienen presupuesto y se validan en el servidor.
8. **El coste es un requisito.** Cada decisión se contrasta con el plan gratuito y con una salida clara.
9. **La seguridad es por defecto.** RLS, URLs firmadas, límites, CSP, moderación y borrado de datos.
10. **La evolución es incremental.** Cada fase deja el producto funcionando y es revisable por separado.

## 3. Contexto del sistema

```text
┌──────────────┐        ┌──────────────────────────────┐
│  Visitante   │───────►│  Perfil público (SSR)        │
│  (sin cuenta)│        │  /u/:handle, /u/:handle/:room│
└──────┬───────┘        └──────────────┬───────────────┘
       │                               │ CTA
       │                               ▼
       │                ┌──────────────────────────────┐
       └───────────────►│  Experiencia 3D (cliente)    │
                        │  /u/:handle/:room/room       │
                        └──────────────┬───────────────┘
                                       │
┌──────────────┐        ┌──────────────▼───────────────┐
│  Autor       │───────►│  Editor (cliente, auth)      │
│  (cuenta)    │        │  /editor, /editor/:roomId    │
└──────┬───────┘        └──────────────┬───────────────┘
       │                               │
       ▼                               ▼
┌─────────────────────────────────────────────────────┐
│ Cloudflare Workers (RR7): rutas, SSR, acciones      │
│  ├─ Supabase: Auth, Postgres, RLS, migraciones      │
│  ├─ R2: assets, snapshots publicados, OG images     │
│  └─ Turnstile: anti-abuso                           │
└─────────────────────────────────────────────────────┘
```

Servicios externos opcionales: worker de GPU para L2 (fuera de v1), proveedor de errores opt-in, CI de GitHub.

## 4. Superficies

| Superficie | Render | Audiencia | Depende de 3D |
|---|---|---|---|
| Perfil del espacio | SSR + caché | Público, buscadores | No |
| Perfil de habitación | SSR + caché | Público, buscadores | No |
| Experiencia | Cliente | Público | Sí |
| Editor de habitación | Cliente | Autor | Sí |
| Editor de espacio | Cliente | Autor | No (mapa 2D) |
| Administración | SSR/cliente | Moderador | No |

## 5. Módulos y reglas de dependencia

```text
src/
  domain/                 # puro
    room/                 # document, schema, migrations, budgets
    portfolio/            # content, progress
    prefabs/catalog.ts    # metadata de prefabs (sin three)
  application/
    session/              # máquina de estados
    rooms/                # create, load, saveDraft, publish, rollback
    assets/               # upload, finalize, relief, jobs
    moderation/           # report, resolve
    ports/                # RoomRepository, AssetRepository, JobQueue, Telemetry
  infrastructure/
    supabase/             # adaptadores de repositorio
    r2/                   # storage
    rendering/            # renderer-factory, carga GLB
    pwa/
  presentation/
    experience/           # canvas, player, interacción
    editor/               # composer
    profile/              # componentes del perfil
    prefabs/registry.tsx  # geometría de prefabs (three/React)
  app/                    # rutas RR7, composición, guards, SSR
```

### Reglas

| Desde | Puede importar | No puede importar |
|---|---|---|
| `domain` | nada del proyecto | `react`, `three`, `zustand`, `@supabase/*`, `infrastructure/*` |
| `application` | `domain`, `ports` | `react`, `three`, `infrastructure/*` |
| `infrastructure` | `domain`, `application/ports`, SDKs | `presentation/*` |
| `presentation` | `application`, `domain`, `infrastructure` (solo composición) | nada de `app` salvo tipos |
| `app` | todo | — (es la raíz de composición) |

**Enforcement:** `eslint-plugin-boundaries` o `dependency-cruiser` en CI. Sin regla automática, la arquitectura se degrada en tres sprints.

### Puertos

| Puerto | Implementación v1 | Alternativa futura |
|---|---|---|
| `RoomRepository` | Supabase | API propia (Hono) o Postgres directo |
| `AssetRepository` | R2 + Supabase | S3/MinIO |
| `JobQueue` | Tabla `asset_jobs` + worker | Cola gestionada |
| `Telemetry` | No-op | Endpoint propio / Sentry opt-in |
| `Clock` | `Date` | Inyectable en tests |

## 6. Flujo de publicación

```text
Editor
  └─ guardar borrador (PUT, If-Match revision) ──► rooms.draft
  └─ publicar
       ├─ validar RoomDocument (Zod + presupuestos + portales + assets ready)
       ├─ escribir snapshot a R2 (inmutable)
       ├─ transacción SQL: room_versions + rooms.published_version_id
       │                  + spaces.published_manifest
       └─ invalidar caché del perfil

Visitante
  └─ GET /u/:handle ──► manifiesto + documentos publicados ──► HTML
  └─ GET /u/:handle/:room/room ──► cliente descarga documento + assets
```

Detalle en [ADR-002](../adr/002-espacio-habitacion-portal.md) y [data-model.md](data-model.md).

## 7. Modelo de extensión

La personalización debe ser amplia sin que el proyecto pierda el control. Estos son los puntos de extensión, ordenados por seguridad:

| Punto | Quién | Cómo | Control |
|---|---|---|---|
| **Props de prefab** | Usuario | Datos validados por `propsSchema` | Esquema + límites |
| **Documento de habitación** | Usuario | JSON validado | Zod + presupuestos |
| **Assets** | Usuario | GLB optimizado y validado | Límites + cuotas |
| **Plantillas de habitación** | Comunidad | Documentos JSON versionados | Revisión de PR |
| **Prefabs nuevos** | Comunidad | Código del proyecto (metadata + geometría) | Revisión de PR + versión |
| **Temas/materiales** | Comunidad | Catálogo de IDs | Revisión de PR |
| **Importadores** | Comunidad | Herramientas externas (Blender, CLI) | Fuera del runtime |
| **Scripts de usuario** | — | **No se admite** | Riesgo de ejecución remota |

**Regla dura:** el contenido del usuario es **datos**, no código. Un prefab es código del proyecto, versionado y revisado; una habitación solo referencia `prefab` + `props` y `assetId`.

### Versionado

- `RoomDocument.schemaVersion` con migraciones on-read.
- `SpaceManifest.schemaVersion`.
- `prefabVersion` por prefab; el renderer soporta versiones anteriores o migra.
- Assets inmutables: reemplazar crea otro asset.
- El esquema se publica como JSON Schema para que terceros construyan importadores y validadores.

### 7.1 Escalabilidad: qué crece y cómo

| Dimensión | Cómo escala | Límite / acción |
|---|---|---|
| **Usuarios** | Auth y RLS; escrituras centralizadas en el Worker | DB 500 MB free; medir y pasar a Pro |
| **Habitaciones** | Un documento por habitación; solo una cargada a la vez | 8 por espacio; el runtime no crece con el espacio |
| **Assets** | R2 con egreso cero; optimización antes de subir | 25 MB/usuario; 10 GB free |
| **Contenido** | El mismo `ContentBlock` alimenta 3D y perfil | Sin duplicación; el perfil se cachea |
| **Editor** | Comandos y documento; undo/redo por parches | 150 nodos; documento ≤ 256 KB |
| **Operación** | Un deploy, una DB, un bucket, un manifiesto | Un solo equipo puede operarlo |
| **Moderación** | Automática por reportes + cuotas | No escala con revisión manual |
| **Inferencia L2** | Worker externo con cola y cuota | No es gratis; se abre con modelo de coste |

Lo que **no** escala linealmente y hay que vigilar: la moderación manual, el coste de GPU y el egreso. Las tres tienen decisión explícita en los ADR.

## 8. Atributos de calidad

| Atributo | Objetivo | Cómo se verifica |
|---|---|---|
| **Rendimiento público** | Ruta pública < 120 KB gzip, sin three | Test de grafo de bundle en CI |
| **Rendimiento 3D** | 60 fps desktop / 30 fps low tier; ≤ 150 draw calls | Presupuesto por habitación + perfilado manual |
| **Presupuesto por habitación** | 150 nodos, 300k triángulos, 12 MB texturas | Validador en editor y servidor |
| **Disponibilidad** | El perfil funciona sin JS y sin WebGL | Prueba con JS desactivado |
| **Seguridad** | RLS, sin código de usuario, límites, CSP | Tests de RLS + revisión |
| **Privacidad** | Sin analítica de terceros; errores opt-in | Revisión de red |
| **Accesibilidad** | WCAG 2.2 AA en perfil y editor | Auditoría + teclado |
| **SEO** | SSR, canonical, sitemap, OG | Lighthouse + inspección |
| **Coste** | Dentro del free tier hasta el umbral documentado | Panel de uso + alertas |
| **Mantenibilidad** | Reglas de dependencia en CI; dominio testeado | Lint + cobertura de dominio |

## 9. No-objetivos (v1)

- Multijugador o colaboración en tiempo real.
- Edición en móvil (el editor es de escritorio; la experiencia sí es responsive).
- Shaders o materiales personalizados por el usuario.
- Scripts, plugins o JavaScript de usuario.
- Reconstrucción de habitaciones desde fotos (L3).
- VR/AR.
- Monetización, planes de pago o marketplace.
- Backend propio always-on (se usa Supabase; el adaptador permite migrar).

## 10. Mapa de decisiones

| Tema | ADR |
|---|---|
| Shell, hosting, límites | [001](../adr/001-shell-hosting.md) |
| Espacio, habitación, portal, publicación | [002](../adr/002-espacio-habitacion-portal.md) |
| Perfil SSR y SEO | [003](../adr/003-perfil-publico-ssr.md) |
| Assets y colisionadores | [004](../adr/004-assets-y-colisionadores.md) |
| Imagen→3D L1 / L2 | [005](../adr/005-imagen-3d-l1.md) |
| Registro abierto y moderación | [006](../adr/006-registro-abierto.md) |
| Telemetría y privacidad | [007](../adr/007-telemetria-y-privacidad.md) |

## 11. Glosario

| Término | Significado |
|---|---|
| **Espacio** | Portafolio del usuario; agrupa habitaciones y portales |
| **Habitación** | Escena 3D con un `RoomDocument` y ciclo de publicación propio |
| **Portal** | Nodo que enlaza a otra habitación del mismo espacio |
| **Prefab** | Objeto predefinido por el proyecto, parametrizable por props |
| **Asset** | GLB o imagen subida/generada, inmutable, referenciada por ID |
| **Composer** | Editor visual de una habitación |
| **Experiencia** | Visor 3D de una habitación |
| **Manifiesto** | Snapshot publicado del espacio (qué versión de cada habitación) |
| **Presupuesto** | Límite de nodos, triángulos, texturas o bytes |
| **Playtest** | Modo que monta la experiencia real con el borrador |
