# Architecture Decision Records

Registro de decisiones de arquitectura del proyecto. Cada ADR documenta **por qué** se tomó una decisión, qué alternativas se descartaron y qué consecuencias se aceptan. El **qué** vive en [`docs/architecture/`](../architecture/).

## Formato

Toda decisión nueva usa esta estructura:

```text
# ADR-NNN — Título

- Estado: Propuesto | Aceptado | Reemplazado por ADR-NNN | Obsoleto
- Fecha: AAAA-MM-DD
- Decisores: …
- Contexto relacionado: …

## Contexto
## Decisión
## Consecuencias
## Alternativas consideradas
## Referencias
```

Reglas:

1. Un ADR aceptado no se edita para cambiar la decisión; se crea otro que lo reemplace y se actualiza el estado.
2. Las correcciones de redacción o enlaces sí se permiten.
3. Si una decisión depende de límites de un proveedor, se cita la fuente y se anota la fecha de verificación. Los límites cambian.
4. Los ADR no contienen código de producción; pueden contener esquemas, diagramas y firmas.

## Índice

| ADR | Título | Estado | Fecha |
|---|---|---|---|
| [001](001-shell-hosting.md) | Shell y hosting: React Router 7, Cloudflare Workers, Supabase y R2 | Aceptado | 2026-10-22 |
| [002](002-espacio-habitacion-portal.md) | Espacio, habitación y portal; publicación por manifiesto | Aceptado | 2026-10-22 |
| [003](003-perfil-publico-ssr.md) | Perfil público renderizado en servidor, sin three en el bundle público | Aceptado | 2026-10-22 |
| [004](004-assets-y-colisionadores.md) | Assets GLB, optimización en cliente y colisionadores proxy | Aceptado | 2026-10-22 |
| [005](005-imagen-3d-l1.md) | Imagen→3D v1: relieve (L1) en el cliente; L2 condicionado a experimento | Aceptado | 2026-10-22 |
| [006](006-registro-abierto.md) | Registro abierto con verificación, cuotas y moderación | Aceptado | 2026-10-22 |
| [007](007-telemetria-y-privacidad.md) | Telemetría apagada por defecto; errores técnicos opt-in | Aceptado | 2026-10-22 |

## Decisiones pendientes de ADR

Estas están acordadas en conversación pero todavía no tienen documento propio; se crearán cuando se implementen:

- Política exacta de handles y nombres reservados.
- Estrategia de imágenes OG por habitación (generación en publish).
- Plan de backups y restauración de Supabase/R2.
- Política de retención de originales de imagen una vez procesados.
- Mecanismo de créditos o BYO key para L2.
