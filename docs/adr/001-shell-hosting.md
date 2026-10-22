# ADR-001 — Shell y hosting: React Router 7, Cloudflare Workers, Supabase y R2

- Estado: Aceptado
- Fecha: 2026-10-22
- Decisores: Sergio Botero (mantenedor)
- Relacionado: [ADR-002](002-espacio-habitacion-portal.md), [ADR-003](003-perfil-publico-ssr.md), [ADR-006](006-registro-abierto.md)

## Contexto

El proyecto nació como una SPA de Vite + React + R3F sin router, sin backend y con una sola habitación hardcodeada. El producto objetivo es distinto:

- Cada usuario crea su espacio de trabajo 3D y lo publica.
- El perfil público debe ser indexable y accesible sin WebGL.
- Hay autenticación, contenido en base de datos, assets en almacenamiento de objetos y un editor.
- El presupuesto de infraestructura inicial es 0 y el proyecto es open source, self-hosteable.

La auditoría de arquitectura (2026-10-21) identificó que el arranque actual descarga `three` y `r3f` antes de decidir el fallback, y que el bundle se reparte en chunks que no cumplen lo declarado. Cualquier decisión de shell debe corregir eso, no heredarlo.

## Decisión

Adoptar **React Router 7 en modo framework** como shell de la aplicación, desplegado en **Cloudflare Workers** con **Workers Static Assets**, y este conjunto de servicios:

| Responsabilidad | Servicio | Plan |
|---|---|---|
| Shell, rutas, SSR del perfil, acciones | React Router 7 sobre Cloudflare Workers | Free |
| Bundle estático (JS/CSS/HTML del shell) | Workers Static Assets | Free |
| Auth, Postgres, RLS, migraciones | Supabase Cloud | Free |
| Assets GLB/KTX2, snapshots publicados, OG images | Cloudflare R2 | Free |
| Anti-abuso en registro y acciones sensibles | Cloudflare Turnstile | Free |
| CI | GitHub Actions | Free en repos públicos |
| Inferencia imagen→3D | Cliente (L1); worker externo para L2 | Sin coste en v1 |

### Topología

```text
Navegador
  ├─ GET /u/:handle/:room        → Worker (SSR) ──► Supabase (metadata) + R2 (documento)
  ├─ GET /assets/*               → Workers Static Assets (sin ejecutar el Worker)
  ├─ GET /u/:handle/:room/room   → HTML del shell + JS cliente → R3F
  ├─ POST /api/*                 → Worker (acciones) ──► Supabase / R2
  └─ PUT signed URL              → R2 directo (subida de assets)

Cloudflare Edge ── caché de perfiles públicos (s-maxage + SWR)
Supabase        ── Postgres + Auth + RLS
R2              ── assets inmutables + snapshots de habitaciones publicadas
```

### Rutas de alto nivel

| Ruta | Render | Auth |
|---|---|---|
| `/` | SSR | No |
| `/login` | SSR | No |
| `/u/:handle` | SSR + caché | No |
| `/u/:handle/:room` | SSR + caché | No |
| `/u/:handle/:room/room` | Cliente | No |
| `/editor`, `/editor/:roomId` | Cliente | Sí |
| `/settings` | SSR + cliente | Sí |
| `/admin` | SSR | Rol |
| `/api/*` | Worker | Variable |

El detalle de superficies y SEO está en [ADR-003](003-perfil-publico-ssr.md).

### Regla de oro

La ruta pública **no importa `three`, `@react-three/fiber`, `@react-three/rapier`, `gsap` ni `zustand`**. Se verifica con un test que inspeccione el grafo del bundle público. Esto resuelve de raíz el hallazgo H-05 de la auditoría: quien no tiene GPU no descarga el stack 3D.

### Caché

| Superficie | Política |
|---|---|
| Perfil público (`/u/:handle`, `/u/:handle/:room`) | `public, s-maxage=60, stale-while-revalidate=300`; purga al publicar (M6) |
| Documento publicado en R2 | `public, max-age=31536000, immutable` (la clave incluye versión) |
| Assets estáticos con hash | `public, max-age=31536000, immutable` |
| Borradores y `/api/*` autenticado | `private, no-store` |

## Consecuencias

### Positivas

- Una sola app, un solo despliegue, un solo sistema de rutas.
- El perfil público se renderiza en el servidor y es indexable desde el primer día.
- Los assets estáticos se sirven desde la red de Cloudflare sin ejecutar el Worker, lo que mantiene el consumo de CPU bajo.
- La experiencia 3D y el editor comparten el mismo `RoomDocument`, el mismo renderer y los mismos prefabs.
- R2 elimina el coste de egreso, que es el factor que rompe los planes gratuitos de almacenamiento.
- El stack es portable: RR7 corre en Node, Supabase es self-hosteable, R2 es S3-compatible.

### Negativas y riesgos aceptados

- **Dependencia de Cloudflare Workers.** Mitigación: RR7 es un framework estándar; el despliegue alternativo en Node está documentado.
- **Límite de 100k requests/día y 30 ms de CPU por request** en el plan gratuito. Mitigación: perfiles cacheados, assets estáticos fuera del Worker, y subida a Workers Paid ($5/mes) como primera palanca.
- **Supabase free se pausa tras una semana sin actividad.** Mitigación: cron de keep-alive en GitHub Actions; si el proyecto crece, Supabase Pro.
- **Latencia Worker → Supabase.** Mitigación: usar PostgREST/JS client, cachear perfiles, y no hacer consultas por asset.
- **Migración de shell.** Mitigación: se hace en M1a, después de M0 (dominio y renderer), y no cambia el código 3D, solo su punto de montaje.

## Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| Mantener Vite SPA + Worker separado para el perfil | Dos despliegues, dos plantillas de contenido y riesgo de divergencia. Se puede reconsiderar si la migración se bloquea |
| Astro + islas React | Excelente para el perfil, pero añade un segundo modelo mental y no mejora la experiencia 3D ni el editor |
| Next.js | RSC + R3F introduce fricción; el despliegue gratuito es menos claro y el modelo de datos no lo necesita |
| Todo Cloudflare (Workers + D1 + R2 + auth propio) | Un proveedor y egreso cero, pero sin RLS y con auth por construir. Se descarta por tiempo, no por arquitectura |
| Vercel + Supabase | Buen DX, pero el ancho de banda gratuito y el tratamiento de assets grandes son peores para este caso |

## Presupuesto del plan gratuito (verificado 2026-10-22)

| Recurso | Límite | Fuente |
|---|---|---|
| Supabase DB | 500 MB | [Supabase Pricing](https://supabase.com/pricing) |
| Supabase Storage | 1 GB | ídem |
| Supabase egress | 5 GB | ídem |
| Supabase MAU | 50.000 | ídem |
| Supabase proyectos | 2 activos; pausa tras 1 semana de inactividad | ídem |
| Cloudflare R2 | 10 GB; 1M escrituras / 10M lecturas al mes; egreso 0 | [Límites Cloudflare](https://eastondev.com/blog/es/posts/dev/20260526-cloudflare-free-limits/) |
| Cloudflare Workers | 100k requests/día; 30 ms CPU/request | ídem |
| Workers Static Assets | Servidos sin ejecutar el Worker | [Billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) |
| GitHub Actions | Gratis en repos públicos | — |

Los límites cambian. Antes de comprometerse con una campaña de lanzamiento, verificar las páginas oficiales.

## Salida (exit paths)

1. **Cloudflare → Node:** RR7 tiene adaptador Node; los assets estáticos se sirven con cualquier CDN.
2. **Supabase → Postgres propio:** las migraciones son SQL estándar; el adaptador de repositorio aísla el cliente.
3. **R2 → S3/MinIO:** API S3-compatible; solo cambian credenciales y endpoint.
4. **Dominio:** se puede lanzar en `*.workers.dev` y mover a dominio propio sin cambios de arquitectura; Turnstile requiere registrar el hostname.

## Referencias

- [React Router en Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/)
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [Supabase Pricing](https://supabase.com/pricing)
- Auditoría de arquitectura del repositorio, 2026-10-21 (hallazgos H-05, H-06, H-07)
