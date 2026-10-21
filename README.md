# work-portfolio

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Portfolio 3D profesional construido con Vite, TypeScript, React, React Three Fiber, Three.js WebGPU/WebGL2, Rapier, Zustand y GSAP.

## Estado actual

Estamos en **Fase 7 scaffold de CI/CD**, no en producto visual final. El repositorio está publicado en GitHub (rama `main`) y la CI corre en cada push. La base técnica existe y se valida con TypeScript, pero aún faltan assets reales GLB/KTX2, optimización profunda y validación visual final en hardware real.

> Importante: en el estado actual **no existe backend**. Este repositorio es una aplicación frontend 3D servida por Vite. Si más adelante se agrega un backend/API, deberá documentarse como un servicio separado.

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

Actualmente **no hay backend que iniciar**.

No existe carpeta `backend/`, servidor API, base de datos, Docker Compose ni proceso Node/Express/Nest separado. Todo lo que ves en la app viene del frontend y de archivos locales dentro de `src/` y `public/`.

Por eso, para correr el proyecto hoy solo necesitas:

```powershell
npm install
npm run dev
```

Cuando el proyecto necesite backend real, la recomendación será documentarlo así:

```text
/frontend  -> Vite + React + R3F
/backend   -> API, auth, CMS o analytics si realmente se necesita
```

Pero NO conviene inventar backend antes de tener una necesidad real. Para este portfolio 3D, de momento el backend sería complejidad innecesaria.

## Comandos disponibles

```powershell
npm install        # Instala dependencias
npm run dev        # Inicia el frontend en modo desarrollo
npm run typecheck  # Valida TypeScript sin generar build
npm run check      # Alias de typecheck
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
- Mouse: mirar libremente cuando el pointer lock está activo.
- `WASD`: moverse por la habitación.
- `E`: interactuar con objetos apuntados por el reticle.
- `ESC`: salir del modo habitación, pausar y recuperar el cursor.

## Implementado

- Capability gate al arranque:
  - WebGPU preferente.
  - WebGL2 fallback.
  - fallback estático si no hay soporte.
- Renderer factory async con backend efectivo reportado al HUD.
- Room shell inicial con suelo, paredes, techo, obstáculo, colliders manuales y materiales procedurales de orientación.
- Locomoción FPS tipo Minecraft con WASD, pointer lock, pausa con `ESC` y Rapier.
- Sistema de interacción:
  - raycast central throttled.
  - reticle.
  - tecla `E` para leer.
  - panel DOM desacoplado del canvas.
  - cierre con `ESC`.
- Transiciones GSAP para panel y micro-ajuste de FOV.
- HUD técnico con backend, tier, boot, DPR, pointer lock y modo de interacción.
- Mini mapa SVG y progreso persistido con Zustand.
- Feature flags centralizados.
- Scaffold de assets progresivos: `placeholder -> low -> high`.
- Fallback estático en `public/fallback.html` (Vite lo copia a `dist/`).
- Service Worker básico para producción.
- CI con GitHub Actions y Lighthouse CI.

## Fase 7 / CI-CD

Archivos relevantes:

- `.github/workflows/ci.yml` — typecheck, build y Lighthouse CI en GitHub Actions.
- `.lighthouserc.cjs` — budgets de performance/accessibility/SEO.
- `.lighthouserc.local.cjs` — variante local para Windows usando Chrome/Edge por remote debugging.
- `scripts/run-lhci-local.ps1` — helper local de Lighthouse CI para Windows.
- `docs/deployment.md` — notas de despliegue.
- `vite.config.ts` — code splitting manual por vendors principales.

## Qué falta para producto final

1. Pipeline real Blender → GLB + Draco + KTX2.
2. Lazy zones reales por habitación/sección.
3. LOD/instancing/dispose sistemático.
4. Post-processing final compatible con la estrategia de renderer.
5. Validación manual en navegador y hardware real.
6. Elegir hosting real: Vercel, Netlify o GitHub Pages.
7. Configurar branch protection y deploy automático en el hosting elegido.
8. Agregar backend solo si aparece una necesidad real: CMS, analytics propio, autenticación o API dinámica.

## Licencia

Distribuido bajo la [licencia MIT](LICENSE). Puedes usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y/o vender copias del proyecto, siempre que conserves el aviso de copyright y la licencia.

Copyright (c) 2026 Sergio Andres Botero Castro.
