# work-portfolio

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Portfolio 3D profesional construido con Vite, TypeScript, React, React Three Fiber, Three.js WebGPU/WebGL2, Rapier, Zustand y GSAP.

## Estado actual

Estamos en **M0 (fundaciones)**: contrato `RoomDocument` validado con Zod, renderer data-driven, 12 prefabs, máquina de sesión y pruebas. La habitación actual se reconstruye desde [`src/content/seed/workspace-v1.ts`](src/content/seed/workspace-v1.ts), no desde JSX hardcodeado. El repositorio está publicado en GitHub (rama `main`) y la CI corre en cada push. Aún no hay backend, editor, assets reales GLB/KTX2 ni validación visual en hardware real; el siguiente hito es M1 (React Router 7 + Supabase).

> Importante: en el estado actual **no existe backend**. La arquitectura objetivo (M1) incorpora Supabase para auth, Postgres y publicación, y R2 para assets; ver [`docs/adr/001-shell-hosting.md`](docs/adr/001-shell-hosting.md).

## Arquitectura

La arquitectura objetivo, las decisiones (ADR), el contrato del documento de habitación y el plan por fases están en [`docs/`](docs/README.md), empezando por [`docs/architecture/overview.md`](docs/architecture/overview.md). Lo implementado en M0 está descrito abajo y en [`docs/architecture/plan-m0.md`](docs/architecture/plan-m0.md).

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

Este comando levanta el frontend con Vite:

```powershell
npm run dev
```

Luego abre:

```text
http://127.0.0.1:4173/
```

Si Vite usa otro puerto porque `4173` está ocupado, la terminal mostrará la URL correcta.

## Backend

Actualmente **no hay backend que iniciar**. M0 se ejecuta íntegramente en el frontend y la habitación se carga desde la semilla local.

La arquitectura objetivo sí incluye backend porque el producto es una plataforma multiusuario: Supabase (Auth, Postgres, RLS) para cuentas y publicación, Cloudflare R2 para assets, y React Router 7 sobre Cloudflare Workers para el perfil público. Ese trabajo empieza en M1 y está documentado en [`docs/adr/001-shell-hosting.md`](docs/adr/001-shell-hosting.md) y [`docs/architecture/data-model.md`](docs/architecture/data-model.md).

Hasta M1, para correr el proyecto solo necesitas:

```powershell
npm install
npm run dev
```

## Comandos disponibles

```powershell
npm install        # Instala dependencias
npm run dev        # Inicia el frontend en modo desarrollo
npm run typecheck  # Valida TypeScript sin generar build
npm run lint       # Ejecuta ESLint sobre src
npm run test       # Ejecuta las pruebas con Vitest
npm run check      # typecheck + lint + tests
npm run preview    # Sirve el contenido de dist/ si ya existe
npm run lhci:local # Ejecuta Lighthouse CI local usando el script de Windows
```

> Regla del proyecto: no ejecutar `npm run build` automáticamente después de cambios. El build queda reservado para CI o para una validación manual explícita.
>
> `npm run preview` y `npm run lhci:local` requieren que exista `dist/`. Si quieres auditar Lighthouse localmente, primero debes generar un build manualmente bajo tu criterio.

## Rutas de prueba

Con el frontend corriendo:

- `http://127.0.0.1:4173/` — experiencia 3D normal.
- `http://127.0.0.1:4173/?renderer=webgl2` — fuerza WebGL2.
- `http://127.0.0.1:4173/?fallback=1` — fuerza fallback estático.
- `http://127.0.0.1:4173/?failboot=1` — error controlado de bootstrap.
- `http://127.0.0.1:4173/fallback.html` — fallback no-3D.

## Controles actuales

- Botón **Entrar/Reanudar habitación**: entra al modo habitación.
- Mouse: mirar libremente cuando el pointer lock está activo; si el navegador lo bloquea, el modo compatible permite mirar moviendo el mouse.
- `WASD`: moverse por la habitación.
- `E`: interactuar con objetos apuntados por el reticle.
- `ESC`: cierra el panel de lectura y vuelve a explorar; en exploración pausa; en pausa vuelve al menú.

## Implementado

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
- Service Worker básico para producción.
- Pruebas con Vitest y CI con GitHub Actions, Lighthouse CI.
- Documentación de arquitectura, ADR y contrato del documento.

## CI-CD

Archivos relevantes:

- `.github/workflows/ci.yml` — `check` (typecheck + tests), build y Lighthouse CI.
- `.lighthouserc.cjs` — budgets de performance/accessibility/SEO.
- `.lighthouserc.local.cjs` — variante local para Windows usando Chrome/Edge por remote debugging.
- `scripts/run-lhci-local.ps1` — helper local de Lighthouse CI para Windows.
- `docs/deployment.md` — notas del pipeline anterior.
- `vite.config.ts` — code splitting manual por vendors principales.

## Qué falta para producto final

1. **M1**: backend (Supabase), auth, publicación y perfil público SSR con React Router 7.
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
