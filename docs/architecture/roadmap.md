# Roadmap por fases

- Estado: vigente (diseño)
- Fecha: 2026-10-22
- Referencias: [overview](overview.md), [plan-m0](plan-m0.md), [ADR-001](../adr/001-shell-hosting.md)

## 1. Principios de secuenciación

1. **Primero el contrato, después la infraestructura.** Sin `RoomDocument` validado no se construye editor ni base de datos.
2. **Cada fase es desplegable y reversible.** Nada de "big bang".
3. **La fase siguiente no empieza sin criterio de salida cumplido.** El criterio se escribe antes, no después.
4. **El riesgo se compra barato.** Los experimentos (calidad de L2, coste, onboarding) se hacen antes de invertir en la fase.
5. **Un cambio de alcance requiere ADR.** Si una fase crece, se parte o se justifica; no se estira el calendario en silencio.
6. **La deuda se paga en la fase que la crea.** No se acumula para "después".

## 2. Fases

| Fase | Semanas | Objetivo | Entregables | Depende de | Criterio de salida |
|---|---|---|---|---|---|
| **M0** | 2 | Fundaciones | Dominio, renderer data-driven, sesión, tooling, limpieza | — | `check` verde; paridad; cerrar lectura → explorar |
| **M1a** | 1,5 | Shell RR7 | Migración a RR7 + Workers; rutas; auth; sesión por cookies; perfil SSR básico | M0 | Perfil sin three; login; deploy |
| **M1b** | 2 | Espacios y publicación | Tablas, RLS, CRUD, autosave, publish transaccional, snapshots, manifiesto | M1a | 2 habitaciones publicadas; perfil agregado |
| **M1c** | 1 | Registro abierto | Turnstile, verificación, cuotas, rate limits, reportes, admin mínimo, legal | M1a | Desconocido se registra y publica; reporte oculta |
| **M2** | 3 | Editor v1 | Paleta, gizmos, inspector, contenido, undo/redo, presupuesto, playtest, plantillas | M1b | Persona no técnica publica en < 15 min |
| **M3** | 2 | Assets | GLB, validación, optimización cliente, colisionadores, thumbnails, cuotas | M1b | GLB de 12 MB usable con colisión |
| **M4** | 2 | Imagen→relieve | Worker de profundidad, wizard, GLB, caja, fallback | M3 | 10 imágenes → relieves usables, cada una en < 30 s |
| **M5** | 2 | Portales y espacio | Mapa de portales, transición, prefetch, perfil agregado, sitemap, OG | M2, M3 | Recorrer 3 habitaciones sin recargar |
| **M6** | 2 | Rendimiento y operación | Presupuestos bloqueantes, dispose, caché, observabilidad, self-host, backups | M1–M5 | Presupuesto verificado; `docker compose` |
| **M7** | 2 + infra | L2 condicional | Job GPU, proveedor, cuotas, calidad | M4 + experimento | ≥ 60% usable en 20 fotos |

Total: ~15–17 semanas a tiempo completo. A medio tiempo, duplicar.

## 3. Ruta crítica

```text
M0 ──► M1a ──► M1b ──► M2 ──► M3 ──► M4 ──► M5 ──► M6
               │        │
               └─► M1c  └─► (paralelo si hay manos)

M7 depende de M4 + experimento de calidad; no bloquea el resto.
```

- **M1c puede solaparse con M2** si hay una segunda persona.
- **M3 puede empezar tras M1b**, en paralelo con M2, porque el editor necesita assets para ser útil pero puede lanzarse con prefabs.
- **M5 no puede adelantarse a M2/M3**: los portales necesitan habitaciones editables y assets.

## 4. Puertas de decisión

| Puerta | Cuándo | Pregunta | Si falla |
|---|---|---|---|
| **G1** | Fin de M0 | ¿La paridad y la sesión son correctas? | No se migra el shell; se corrige M0 |
| **G2** | Fin de M1b | ¿Publicar es comprensible y el perfil indexa? | Se simplifica el flujo antes del editor |
| **G3** | Fin de M2 | ¿Una persona crea una habitación sin ayuda? | Se recorta el editor; no se añaden funciones |
| **G4** | Fin de M3 | ¿Los GLB se cargan y colisionan bien? | Se limita el tamaño y se pospone L1 |
| **G5** | Antes de M7 | ¿L2 alcanza 60% usable y coste viable? | No se construye L2; se refuerza L1 + GLB |

## 5. Métricas por fase

| Fase | Métrica principal | Umbral |
|---|---|---|
| M0 | Paridad + tests | Checklist 9/9; `check` verde |
| M1a | Peso del perfil público | < 120 KB gzip; sin three |
| M1b | Tiempo de publicación | < 3 s p95; 0 estados inconsistentes |
| M1c | Abuso | 0 registros automatizados sin Turnstile; < 1% reportes |
| M2 | Time to first publish | < 15 min sin ayuda |
| M3 | Tasa de GLB usables | > 90% sin fallo de carga |
| M4 | Relieves usables | > 80% en 10 imágenes |
| M5 | Navegación | 3 habitaciones sin recarga; memoria estable |
| M6 | Presupuesto | 100% de habitaciones dentro de límites |
| M7 | Calidad L2 | > 60% usable; coste por trabajo < umbral |

## 6. Qué desbloquea cada fase

| Fase | Desbloquea |
|---|---|
| M0 | Un contrato estable; todo lo demás se apoya en él |
| M1a | Perfil público, SEO, rutas, auth |
| M1b | Publicar, versionar, agregar |
| M1c | Abrir el registro sin que el proyecto se caiga |
| M2 | Que el usuario cree sin tocar JSON |
| M3 | Objetos propios |
| M4 | Diferenciador de imagen→3D barato |
| M5 | Portafolio por capítulos y navegación espacial |
| M6 | Sostener el crecimiento |
| M7 | Objetos 3D reales desde fotos, si el experimento lo justifica |

## 7. Control de cambios

- Un cambio de alcance dentro de una fase se evalúa contra su criterio de salida. Si lo compromete, se mueve a otra fase o se rechaza.
- Una decisión que afecte a más de una fase requiere ADR.
- Las estimaciones se revisan al final de cada fase con datos reales; no se ajustan a mitad de fase sin evidencia.
- El backlog se ordena por riesgo y valor, no por facilidad.

## 8. Capacidad y coste

| Hito | Usuarios estimados | Recurso crítico | Acción |
|---|---|---|---|
| Lanzamiento | < 100 | Free tier | Nada |
| Crecimiento | 100–1.000 | R2 (10 GB), Workers | Optimización, caché, cuotas |
| Escala | 1.000–2.000 | R2, DB | Revisar cuotas; evaluar Pro |
| Sostenido | > 2.000 | Storage/egress | R2 de pago o patrocinio; Supabase Pro |

El coste de L2 no está incluido: depende del proveedor y de la cuota. No se abre L2 sin modelo de coste.

## 9. Riesgos del roadmap

| Riesgo | Fase | Mitigación |
|---|---|---|
| El editor se desborda | M2 | Alcance cerrado; G3 |
| El registro abierto se abuse | M1c | Cuotas, Turnstile, unlisted, reportes |
| La migración RR7 rompe la experiencia | M1a | M0 primero; pruebas de humo |
| L1 decepciona | M4 | Ejemplos honestos; GLB como vía principal |
| Portales añaden memoria | M5 | Dispose + prueba de memoria |
| Free tier se agota | M6 | Umbrales y alertas |
| L2 no cumple | M7 | G5; no se construye |

## 10. Estado actual

- M0: **ejecutado** (2026-10-22): dominio, renderer data-driven, sesión, tooling y limpieza. Ver [plan-m0.md](plan-m0.md).
- M1a: **shell, perfiles SSR y experiencia 3D migrados**; auth OTP con Supabase implementada, pendiente de probar contra un proyecto real y de cerrar el ciclo de sesión/logout.
- M1b: **esquema Supabase, RLS, lectura pública DB+R2 y función de publicación implementados**; falta la UI del editor y validar migraciones contra un proyecto real.
- M1c: **Turnstile, cuotas, rate limits, reportes, auto-ocultado, cola de moderación, borrado de cuenta y páginas legales implementados**; falta probarlos contra Supabase real.
- M2–M7: diseñados, no implementados.
- Decisiones: [ADR-001](../adr/001-shell-hosting.md) a [ADR-007](../adr/007-telemetria-y-privacidad.md).
