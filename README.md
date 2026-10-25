# work-portfolio

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Portfolio 3D profesional construido con React Router 7, Cloudflare Workers, Vite, TypeScript, React, React Three Fiber, Three.js WebGPU/WebGL2, Rapier, Zustand y GSAP.

## Estado actual

Estamos en **M1c (registro abierto)**: React Router 7 sobre Cloudflare Workers, perfil público SSR, lectura Supabase + R2 con fallback a la semilla, auth OTP con Turnstile, cuotas y rate limits en base de datos, reportes con auto-ocultado a 3 reportes, cola de moderación, borrado de cuenta y páginas legales. Queda el editor (M2) y validar todo el flujo contra un proyecto Supabase real.

> Importante: el backend está implementado como migraciones y capa de servidor, pero **no hay un proyecto Supabase conectado en este entorno**. Sin `SUPABASE_URL`/`SUPABASE_ANON_KEY`, el handle `demo` usa la semilla local; ver [`supabase/README.md`](supabase/README.md).

## Arquitectura

La arquitectura objetivo, las decisiones (ADR), el contrato del documento de habitación y el plan por fases están en [`docs/`](docs/README.md), empezando por [`docs/architecture/overview.md`](docs/architecture/overview.md).

## Requisitos

- Node.js 20+ recomendado.
- npm incluido con Node.
- Navegador moderno:
  - WebGPU si está disponible.
  - WebGL2 como fallback.
  - Fallback estático si no hay soporte 3D suficiente.

## Instalación inicial

Desde PowerShell, dentro del proyecto:

```powershell
cd C:\Projects\work-portfolio
npm install
```

## Inicializar el frontend en desarrollo

Este comando levanta React Router con el plugin de Cloudflare (el servidor corre en el runtime de Workers):

```powershell
npm run dev
```

Luego abre:

```text
http://127.0.0.1:4173/
```

Si el puerto `4173` está ocupado, la terminal mostrará la URL correcta.

## Backend

El backend está implementado en código (migraciones, lectura DB+R2 y publicación transaccional), pero **no hay un proyecto Supabase conectado en este entorno**. Sin credenciales, el perfil público y la habitación usan la semilla local; `/login` detecta si el Worker tiene `SUPABASE_URL` y `SUPABASE_ANON_KEY`.

La arquitectura objetivo incluye Supabase (Auth, Postgres, RLS) para cuentas y publicación, Cloudflare R2 para assets y React Router 7 sobre Cloudflare Workers para el perfil público. Está documentado en [`docs/adr/001-shell-hosting.md`](docs/adr/001-shell-hosting.md) y [`docs/architecture/data-model.md`](docs/architecture/data-model.md).

Para correr el proyecto hoy solo necesitas:

```powershell
npm install
npm run dev
```

### Autenticación

`/login` envía un enlace mágico con Supabase Auth. Para probarlo:

1. Copia [`.dev.vars.example`](.dev.vars.example) a `.dev.vars` y rellena `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
2. En Supabase, configura la plantilla del email **Magic Link** para que apunte a:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
3. Añade el origen local o el dominio de producción a las Redirect URLs permitidas.
4. Configura `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`. En local puedes usar las claves de prueba de Cloudflare incluidas en `.dev.vars.example`.

Sin esas variables, el perfil público y la experiencia 3D funcionan igual; solo `/login` queda deshabilitado.

### Base de datos y R2

La migración inicial está en [`supabase/migrations/20261025000000_initial_schema.sql`](supabase/migrations/20261025000000_initial_schema.sql). Para aplicarla:

```powershell
npx supabase link --project-ref <project-ref>
npx supabase db push
npx wrangler r2 bucket create work-portfolio-snapshots
```

Los detalles están en [`supabase/README.md`](supabase/README.md). La lectura pública usa `spaces.published_manifest` + snapshots de R2; sin Supabase, el handle `demo` usa la semilla local.

### Moderación y cuenta

- Cualquier visitante puede reportar una habitación publicada desde su perfil; 3 reportes abiertos la ocultan automáticamente.
- `/admin` es la cola de moderación; requiere `profiles.role = 'admin'`.
- `/settings` permite borrar la cuenta (perfil, espacios, habitaciones, versiones y assets) con `SUPABASE_SERVICE_ROLE_KEY`.
- `/terms`, `/privacy` y `/content-policy` son borradores operativos; deben revisarse antes de producción.

## Comandos disponibles

```powershell
npm install        # Instala dependencias
npm run dev        # Inicia React Router + Cloudflare en desarrollo
npm run typecheck  # Genera tipos de rutas y valida TypeScript
npm run lint       # Ejecuta ESLint sobre src y workers
npm run test       # Ejecuta las pruebas con Vitest
npm run check      # typecheck + lint + tests
npm run build      # Build de cliente y servidor (React Router)
npm run preview    # Build y preview del Worker en local
npm run deploy     # Build y despliegue con Wrangler
npm run lhci:local # Ejecuta Lighthouse CI local usando el script de Windows
```

> Regla del proyecto: no ejecutar `npm run build` automáticamente después de cambios. El build queda reservado para CI o para una validación manual explícita.
>
> `npm run preview` y `npm run lhci:local` requieren que exista `build/client`. Si quieres auditar Lighthouse localmente, primero debes generar el build manualmente bajo tu criterio.

## Rutas

Con el servidor corriendo:

- `http://127.0.0.1:4173/` — landing.
- `http://127.0.0.1:4173/u/demo` — perfil público del espacio de ejemplo (SSR).
- `http://127.0.0.1:4173/u/demo/estudio` — perfil de la habitación.
- `http://127.0.0.1:4173/u/demo/estudio/room` — experiencia 3D.
- `http://127.0.0.1:4173/u/demo/estudio/room?renderer=webgl2` — fuerza WebGL2.
- `http://127.0.0.1:4173/u/demo/estudio/room?fallback=1` — fuerza fallback estático.
- `http://127.0.0.1:4173/u/demo/estudio/room?failboot=1` — error controlado de bootstrap.
- `http://127.0.0.1:4173/login` — estado de configuración de autenticación.
- `http://127.0.0.1:4173/fallback.html` — fallback no-3D.

## Controles actuales

- Botón **Entrar/Reanudar habitación**: entra al modo habitación.
- Mouse: mirar libremente cuando el pointer lock está activo; si el navegador lo bloquea, el modo compatible permite mirar moviendo el mouse.
- `WASD`: moverse por la habitación.
- `E`: interactuar con objetos apuntados por el reticle.
- `ESC`: cierra el panel de lectura y vuelve a explorar; en exploración pausa; en pausa vuelve al menú.

## Implementado

- Shell React Router 7 sobre Cloudflare Workers (plugin de Vite + Wrangler).
- Perfil público SSR (`/u/:handle`, `/u/:handle/:room`) sin three en su bundle.
- Experiencia 3D en ruta cliente con carga diferida del bundle de three.
- Supabase: migración de perfiles, espacios, habitaciones, versiones, assets, cuotas y moderación; lectura pública DB + R2 con fallback a la semilla.
- Publicación validada: propiedad, assets, portales, presupuestos, snapshot en R2 y RPC transaccional.
- Auth OTP con cookies SSR, Turnstile y aceptación de términos.
- Rate limits por IP, cuotas de habitaciones/assets y auto-ocultado a 3 reportes.
- Cola de moderación en `/admin` y borrado de cuenta en `/settings`.
- Páginas legales: términos, privacidad y política de contenido.
- Contrato `RoomDocument` v1 con validación Zod, presupuestos y reglas de assets/portales.
- Renderer data-driven: la sala, sus objetos y sus colisiones se derivan del documento, no de JSX hardcodeado.
- 12 prefabs con geometría y catálogo de costes.
- Máquina de sesión explícita: `boot → menu → exploring ↔ reading` y `paused`; ESC tiene un único dueño y cerrar lectura vuelve a explorar.
- Capability gate al arranque:
  - WebGPU preferente.
  - WebGL2 fallback.
  - fallback estático si no hay soporte.
- Renderer factory async con backend efectivo reportado al HUD.
- Locomoción FPS tipo Minecraft con WASD, pointer lock, modo compatible y Rapier.
- Sistema de interacción:
  - raycast central throttled.
  - reticle.
  - tecla `E` para leer.
  - panel DOM desacoplado del canvas.
- Transiciones GSAP para panel y micro-ajuste de FOV.
- HUD técnico con backend, tier, boot, DPR, look y pantalla de sesión.
- Mini mapa SVG y progreso persistido con Zustand, derivados del documento activo.
- Feature flags para minimapa, progreso y service worker.
- Fallback estático en `public/fallback.html`.
- Service Worker que no cachea navegaciones SSR.
- Pruebas con Vitest (57), ESLint y CI con GitHub Actions + Lighthouse CI.
- Documentación de arquitectura, ADR, contrato del documento y planes M0/M1.

## CI-CD

Archivos relevantes:

- `.github/workflows/ci.yml` — `check` (typecheck + lint + tests), build de React Router y Lighthouse CI.
- `.lighthouserc.cjs` — budgets de performance/accessibility/SEO sobre el Worker en preview.
- `.lighthouserc.local.cjs` — variante local para Windows usando Chrome/Edge por remote debugging.
- `scripts/run-lhci-local.ps1` — helper local de Lighthouse CI para Windows.
- `wrangler.json` — configuración del Worker y variables públicas.
- `vite.config.ts` — React Router + Cloudflare Vite plugin.

## Qué falta para producto final

1. Validar migraciones, auth, publicación y moderación contra un proyecto Supabase real.
2. **M2**: editor de habitación, paleta de prefabs y plantillas.
3. **M3**: pipeline de assets GLB/KTX2, optimización y colisiones de usuario.
4. **M4**: imagen → relieve L1.
5. **M5**: multihabitación, portales y perfil agregado.
6. Lazy zones, LOD/instancing y dispose sistemático.
7. Validación manual en navegador y hardware real.
8. Hosting según ADR-001: Cloudflare, Supabase y R2.

## Licencia

Distribuido bajo la [licencia MIT](LICENSE). Puedes usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y/o vender copias del proyecto, siempre que conserves el aviso de copyright y la licencia.

Copyright (c) 2026 Sergio Andres Botero Castro.
