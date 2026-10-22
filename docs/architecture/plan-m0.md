# Plan M0 — Fundaciones

- Estado: ejecutado (M0)
- Fecha: 2026-10-22
- Duración estimada: 2 semanas (1 desarrollador a tiempo completo)
- Depende de: nada
- Habilita: [M1a/M1b](../adr/001-shell-hosting.md), editor y assets
- Referencias: [room-document-v1](room-document-v1.md), [ADR-002](../adr/002-espacio-habitacion-portal.md)

## 0. Estado de ejecución

Actualizado: 2026-10-22.

| Tarea | Estado | Notas |
|---|---|---|
| T0.1 Dominio | Hecha | `src/domain/room/{document,schema,budgets,rules,migrations,validation}.ts` + suites |
| T0.2 Semilla | Hecha | `src/content/seed/workspace-v1.ts` (4 nodos) |
| T0.3 Prefabs | Hecha | Catálogo y geometría de 12 prefabs en `src/presentation/prefabs/registry.tsx` |
| T0.4 Renderer | Hecha | `RoomRenderer` data-driven, colisionadores derivados, HUD/progreso desde el documento y sincronización de viewport/DPR/aspect del renderer |
| T0.5 Sesión | Hecha | Máquina pura, store y controlador único de ESC/pointer lock |
| T0.6 Pointer lock | Hecha | Un solo camino de request/release; `GameModeControls` eliminado |
| T0.7 Limpieza | Hecha | Eliminados `RoomShell`, `InteractiveObject`, contenido legacy, `BootScene`, `three-catalog`, andamiaje de assets, flags y CSS muertos |
| T0.8 Tooling | Parcial | Vitest (10 suites, 47 pruebas), `test`/`check` y CI ejecutando pruebas; lint pendiente |
| T0.9 Docs | Hecha | README, plan y estado de la fase actualizados |

## 1. Objetivo

Convertir la habitación hardcodeada en un **documento de datos** renderizado por un renderer genérico, con una **máquina de sesión** explícita y una **red de pruebas**. Sin backend, sin editor, sin assets, sin migración de shell.

Al final de M0:

- La habitación actual se reconstruye desde un `RoomDocument` semilla.
- El renderer no contiene posiciones, colores ni textos hardcodeados.
- Cerrar la lectura vuelve a **explorar** (decisión 1 del producto).
- ESC tiene un único dueño y la interacción está gobernada por el estado de sesión.
- `npm run check` ejecuta typecheck + lint + tests y pasa.
- El código muerto de la auditoría está eliminado.

## 2. Alcance

### Incluido

- Dominio `RoomDocument` + Zod + presupuestos + migraciones (esqueleto).
- Catálogo de prefabs con metadata y geometría separadas.
- Renderer data-driven con paridad visual.
- Máquina de sesión y control de pointer lock.
- Extracción de la semilla desde el código actual.
- Limpieza de deuda: `BootScene`, `GameModeControls`, `three-catalog`, manifiesto inerte, flags muertas.
- Tooling: Vitest, lint, `check`, CI.
- Documentación de la fase y actualización del README de estado.

### Excluido

- React Router 7 (M1a).
- Supabase, auth, RLS, publicación (M1b).
- Editor, prefabs editables, assets, imagen→3D (M2–M4).
- Multihabitación y portales transitables (M5). El tipo `PortalNode` se define, pero no se usa en la UI.
- Cambios de diseño visual.

## 3. Estado de partida

Hechos verificados en la auditoría (2026-10-21):

| Hecho | Evidencia |
|---|---|
| La sala, el spawn y el obstáculo están hardcodeados | `RoomShell.tsx:12-17`, `PlayerController.tsx:24` |
| Los objetos viven en un array mutable con geometría y texto mezclados | `content/interactive-objects.ts` |
| El tipo de contenido vive en el store | `useInteractionStore.ts:11-15` |
| ESC tiene dos dueños (pausa y cierre de panel) | `PlayerController.tsx:82-88`, `InteractionManager.tsx:20-24` |
| La interacción no consulta pausa ni inicio de sesión | `InteractionManager.tsx:54-99` |
| Cuatro relojes de animación sin coordinador | store 120/100 ms, panel 320/220 ms, FOV 450 ms |
| Hay dos archivos muertos y un catálogo redundante | `BootScene.tsx`, `GameModeControls.tsx`, `three-catalog.ts` |
| No hay tests, lint ni runner | `package.json`, búsqueda vacía de `*.test.*` |
| `tsc --noEmit` pasa | ejecución del 2026-10-21 |

## 4. Tareas

| ID | Tarea | Días | Depende de | Entregable |
|---|---|---|---|---|
| **T0.1** | Dominio del documento | 3 | — | `src/domain/room/{document,schema,budgets,migrations}.ts` + tests |
| **T0.2** | Semilla de la habitación | 1 | T0.1 | `src/content/seed/workspace-v1.json` |
| **T0.3** | Catálogo de prefabs | 3 | T0.1 | `src/domain/prefabs/catalog.ts` + `src/presentation/prefabs/registry.tsx` |
| **T0.4** | Renderer data-driven | 3 | T0.2, T0.3 | `RoomRenderer`, `PrefabRenderer`, `AssetRenderer` (placeholder) |
| **T0.5** | Máquina de sesión | 2 | — | `src/application/session/*` + tests |
| **T0.6** | Pointer lock y ESC | 1 | T0.5 | Un solo dueño de ESC; E gobernada por estado |
| **T0.7** | Limpieza de deuda | 1 | T0.4 | Archivos y flags muertas eliminados |
| **T0.8** | Tooling y CI | 1 | — | Vitest, lint, `check`, workflow |
| **T0.9** | Documentación de fase | 0,5 | T0.1–T0.8 | README de estado + enlaces a `docs/` |

Total: ~15,5 días de trabajo; con revisión y buffer, 2 semanas.

### T0.1 Dominio

Archivos:

```text
src/domain/room/document.ts      # tipos
src/domain/room/schema.ts        # Zod (fuente normativa)
src/domain/room/budgets.ts       # cálculo y validación de presupuestos
src/domain/room/migrations.ts    # cadena v1 → vN (vacía al inicio)
src/domain/room/__tests__/
```

Criterios de aceptación:

- Un documento válido de la semilla pasa la validación.
- Fixtures inválidos fallan con mensajes por campo: nodo sin ID, ID duplicado, fuera de límites, enlace `javascript:`, asset inexistente, portal a sí mismo, 151 nodos, 301k triángulos.
- `budgets` calcula triángulos a partir del catálogo y de `asset.stats`, no de valores del cliente.
- `migrate()` devuelve el documento actual y rechaza versiones futuras.
- **Zod no entra en el bundle de la experiencia**: la validación ocurre en el editor y en el servidor. En runtime solo se consumen tipos.

### T0.2 Semilla

Procedimiento:

1. Copiar las dimensiones de `ROOM` a `room.{width,depth,height}`.
2. Mapear `SPAWN_POSITION` y la orientación inicial a `spawn`.
3. Convertir cada entrada de `PORTFOLIO_OBJECTS` en un `PrefabNode`:
   - `architecture-console` → `console`
   - `projects-terminal` → `terminal`
   - `skills-monolith` → `monolith`
   - conservar `content` y posición; `args` pasan a `props`.
4. Modelar el obstáculo como prefab `block` (nuevo, no interactivo) con su posición y tamaño.
5. Fijar `theme: 'studio'` y los materiales equivalentes a los actuales.

Criterios:

- El JSON valida contra el esquema.
- No quedan constantes de posición ni de texto en `RoomShell`/`content`.
- El documento es legible y está formateado.

### T0.3 Prefabs

- `catalog.ts`: `id`, `version`, `label`, `category`, `cost`, `collider`, `propsSchema`, `defaultProps`, `supportsInteraction`, `thumbnail`.
- `registry.tsx`: componente que dibuja cada prefab.
- Catálogo v1: `pedestal`, `console`, `terminal`, `monolith`, `shelf`, `desk`, `chair`, `plant`, `plaque`, `doorway`, `spotlight`, `block`.
- Props permitidas: dimensiones, color de acento, variante. Nada de geometría arbitraria.
- Tests: cada `PrefabId` tiene definición, componente y coste; los `defaultProps` validan.

### T0.4 Renderer

```text
<RoomRenderer document={doc} />
  ├─ <RoomShellRenderer room={doc.room} />
  ├─ <PrefabRenderer node={...} />
  ├─ <AssetRenderer node={...} />    ← placeholder hasta M3
  ├─ <TextRenderer node={...} />
  ├─ <LightRenderer node={...} />
  └─ <PortalRenderer node={...} />   ← visible, inerte hasta M5
```

- El spawn y la orientación salen del documento.
- Las colisiones se derivan de `room` y de los nodos; no hay `CuboidCollider` hardcodeado por objeto.
- La interacción se registra a partir de `node.interaction`.
- `assetId` sin asset resuelto muestra un placeholder visible (nunca un crash).
- Dispose de geometrías, materiales y texturas al desmontar o cambiar de documento.

Criterios:

- Paridad visual con la sala actual (checklist §6).
- Cambiar el documento (por ejemplo, mover un nodo en el JSON) cambia la escena sin tocar código.
- Sin warnings de React en consola.
- Memoria estable tras montar/desmontar 10 veces (medición manual con el profiler del navegador).

### T0.5 Máquina de sesión

Estados:

```text
boot → menu → exploring ↔ reading
                ↕
              paused
```

| Evento | Desde | Hacia | Efecto |
|---|---|---|---|
| `BOOT_READY` | `boot` | `menu` | Habilita entrada |
| `BOOT_FAILED` | `boot` | `boot` | Muestra error y fallback |
| `ENTER` | `menu` | `exploring` | Pide pointer lock |
| `PAUSE` | `exploring` | `paused` | Suelta pointer lock |
| `RESUME` | `paused` | `exploring` | Pide pointer lock |
| `INTERACT` | `exploring` | `reading` | Suelta pointer lock, abre panel |
| `CLOSE_READING` | `reading` | `exploring` | Cierra panel, **no** abre menú |
| `EXIT` | `exploring`/`paused` | `menu` | Suelta pointer lock |
| `FOCUS_LOST` | `exploring` | `paused` | Suelta pointer lock |

Invariantes:

1. Un solo estado activo.
2. `reading` y `paused` implican pointer lock liberado.
3. Solo hay un listener que decide ESC.
4. `E` solo actúa en `exploring` con un objeto apuntado.
5. El menú solo se muestra en `menu` y `paused` (no en `reading`).

Criterios:

- Test de matriz de transiciones (todos los pares estado/evento).
- Test: `CLOSE_READING` deja `exploring` y no monta el menú.
- Test: `E` en `menu`/`paused` no abre panel.
- Test: `FOCUS_LOST` pausa y libera el lock.

### T0.6 Pointer lock

- El target se registra una vez desde el canvas; se elimina el singleton con doble mecanismo (llamada directa + evento) o se deja un solo camino.
- La máquina de sesión es la única que decide pedir/soltar el lock.
- `PlayerController` consume el estado; no lo muta.
- Keep the fallback de look por arrastre, pero gobernado por `exploring`.

### T0.7 Limpieza

Eliminar:

- `src/scene/BootScene.tsx` (sin importadores).
- `src/ui/overlay/GameModeControls.tsx` (sin importadores; el menú lo reemplaza).
- `src/scene/three-catalog.ts` (R3F ya hace `extend(THREE)`).
- `src/engine/assets/asset-manifest.ts` y `getProgressiveAsset` (inerte).
- Flags `interaction` y `locomotion` (nunca evaluadas) o se conectan de verdad; por defecto, se eliminan.
- El `useProgressiveAssetStage` se conserva solo si el renderer lo usa; si no, se elimina.

Criterios:

- `rg` no encuentra referencias a los símbolos eliminados.
- El bundle no incluye los módulos eliminados.
- `DebugHud` no muestra "fase 6".

### T0.8 Tooling

- **Vitest** con entorno `jsdom` solo donde haga falta; dominio con entorno node.
- **Biome** (recomendado por velocidad) o ESLint + Prettier; una sola elección.
- `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "biome check .",
    "check": "npm run typecheck && npm run lint && npm run test"
  }
}
```

- CI: `npm ci`, `npm run check`, `npm run build`. Lighthouse se mantiene como está hasta M6.
- Regla de dependencias (aunque el dominio aún es pequeño): `eslint-plugin-boundaries` o `dependency-cruiser` con las reglas de [overview](../architecture/overview.md). Se puede activar en M0 con `domain` únicamente.

### T0.9 Documentación

- `docs/README.md` enlazado desde el README principal.
- README: cambiar "Fase 7 scaffold" por el estado real y enlazar a `docs/`.
- Eliminar la afirmación de "testing disciplinado" del perfil estático o convertirla en real.
- Nota de que `public/fallback.html` se retirará en M1a (sustituido por el perfil SSR).

## 5. Secuencia

```text
Semana 1
  L  T0.1 dominio (inicio)
  M  T0.1 dominio + tests
  X  T0.1 cierre / T0.2 semilla
  J  T0.3 prefabs (inicio) + T0.8 tooling
  V  T0.4 renderer (inicio)

Semana 2
  L  T0.4 renderer + paridad
  M  T0.4 cierre / T0.5 sesión
  X  T0.5 + T0.6 pointer lock
  J  T0.7 limpieza + T0.9 docs
  V  buffer, revisión, paridad final
```

T0.5 y T0.8 pueden ejecutarse en paralelo con T0.3/T0.4.

## 6. Checklist de paridad visual

- [ ] Dimensiones de la sala y altura de techo.
- [ ] Materiales de suelo, paredes y techo (rejilla y colores).
- [ ] Obstáculo: posición, tamaño y material.
- [ ] Tres objetos interactivos: posición, tamaño, color y contenido.
- [ ] Spawn y orientación inicial.
- [ ] Iluminación: cantidad, intensidad y sombras.
- [ ] Retícula, panel, menú y HUD se comportan igual.
- [ ] WASD, mouse, E y ESC.
- [ ] FPS dentro del 10% del baseline en la máquina de referencia.

## 7. Pruebas

| Tipo | Qué |
|---|---|
| Unidad | Esquema (válido/inválido), presupuestos, migraciones, prefabs, matriz de sesión |
| Integración ligera | Renderer construye el grafo esperado desde un documento (sin canvas) |
| Manual | Paridad visual, WASD/ESC/E, pointer lock, memoria tras 10 montajes |
| CI | `check` + `build` en cada PR |

No se intenta testear WebGL en CI. El renderer se prueba por su **grafo de escena** (función pura que transforma documento → descripción de escena), no por píxeles.

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| La paridad visual se rompe al pasar a datos | Mantener `RoomShell` detrás de una variable temporal hasta firmar el checklist; luego eliminar |
| Zod aumenta el bundle | Validar solo en editor/servidor; importar tipos en runtime |
| La máquina de sesión introduce regresiones | Matriz de transiciones + pruebas manuales de ESC/E en cada PR |
| Los prefabs no cubren la geometría actual | `block` y `pedestal` cubren el obstáculo y los objetos; el resto se aproxima |
| Se cuela el editor en M0 | El alcance excluido es explícito; cualquier idea nueva va al backlog de M2 |
| El tooling frena el desarrollo | Biome en lugar de ESLint+Prettier; una sola configuración |

## 9. Definición de done

1. `npm run check` pasa en local y en CI.
2. La semilla renderiza con paridad firmada.
3. `RoomShell`/`PORTFOLIO_OBJECTS` ya no contienen geometría ni textos hardcodeados.
4. Cerrar la lectura vuelve a explorar; ESC tiene un dueño; E está gobernada por estado.
5. Código muerto eliminado y `rg` sin referencias.
6. Presupuestos validados con fixtures.
7. README y `docs/` actualizados.
8. Ningún cambio de backend, editor o assets.

## 10. Handoff a M1

M0 deja el contrato y el renderer listos para que M1a/M1b hagan:

- `/u/:handle/:room/room` como ruta cliente que carga un documento desde Supabase/R2.
- `/u/:handle` y `/u/:handle/:room` como rutas SSR que consumen los `ContentBlock`.
- Publicación transaccional del documento validado.
- Migración de la semilla a la primera habitación de cada usuario nuevo.

El editor de M2 reutiliza el mismo `RoomRenderer` en modo playtest y el mismo esquema para el inspector.
