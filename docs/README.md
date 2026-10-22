# Documentación

Este directorio contiene la arquitectura objetivo y las decisiones que la sostienen. El código actual sigue siendo el punto de partida, no el destino.

## Estado del proyecto

`work-portfolio` evoluciona de una experiencia 3D de una sola habitación a una **plataforma open source de espacios de trabajo 3D para portafolios**:

- Cada usuario crea un **espacio** compuesto por una o varias **habitaciones**.
- Cada habitación se edita en un **composer** visual y se publica como una versión inmutable.
- El **perfil público** es HTML renderizado en el servidor: indexable, accesible y sin depender de WebGL.
- La **experiencia 3D** es una mejora progresiva sobre ese perfil.
- El contenido, los assets y las habitaciones viven en una base de datos y en almacenamiento de objetos.

## Documentos

### Arquitectura

| Documento | Contenido |
|---|---|
| [overview.md](architecture/overview.md) | Contexto, superficies, módulos, reglas de dependencia, atributos de calidad, modelo de extensión y no-objetivos |
| [data-model.md](architecture/data-model.md) | Esquema relacional, RLS, publicación transaccional, layout de R2, cuotas y capacidad |
| [room-document-v1.md](architecture/room-document-v1.md) | Contrato del `RoomDocument` v1: tipos, límites, validación, prefabs y migraciones |
| [plan-m0.md](architecture/plan-m0.md) | Plan detallado de la fase M0 (fundaciones), con criterios de aceptación |
| [roadmap.md](architecture/roadmap.md) | Fases M0–M7, ruta crítica, puertas de decisión y control de cambios |

### Decisiones (ADR)

| ADR | Decisión |
|---|---|
| [001](adr/001-shell-hosting.md) | React Router 7 sobre Cloudflare Workers + Supabase + R2 |
| [002](adr/002-espacio-habitacion-portal.md) | Modelo espacio → habitación → portal y publicación por manifiesto |
| [003](adr/003-perfil-publico-ssr.md) | Perfil público SSR sin three en el bundle público |
| [004](adr/004-assets-y-colisionadores.md) | Pipeline de GLB, optimización en cliente y colisionadores proxy |
| [005](adr/005-imagen-3d-l1.md) | Imagen→3D v1 limitado a relieve (L1) en el cliente |
| [006](adr/006-registro-abierto.md) | Registro abierto con controles de abuso desde el día uno |
| [007](adr/007-telemetria-y-privacidad.md) | Telemetría apagada por defecto; errores técnicos opt-in |

### Operación

- [deployment.md](deployment.md) — notas de despliegue y CI/CD del estado anterior (fase 7). Se actualizará cuando exista la plataforma.

## Cómo leer esto

1. Empieza por [overview.md](architecture/overview.md) para entender el sistema completo.
2. Lee los ADR en orden: cada uno explica el porqué de una pieza.
3. Usa [room-document-v1.md](architecture/room-document-v1.md) como contrato de datos.
4. [plan-m0.md](architecture/plan-m0.md) es el trabajo inmediato, sin backend ni editor todavía.

## Convenciones

- **Habitación**: una escena 3D con su propio documento y ciclo de publicación.
- **Espacio**: el portafolio completo del usuario; agrupa habitaciones y portales.
- **Prefab**: objeto predefinido por el proyecto, parametrizable; no es código de usuario.
- **Asset**: GLB o imagen subida/procesada, referenciada por ID.
- **Composer**: editor de una habitación.
- **Experiencia**: visor 3D de una habitación publicada o de un borrador en playtest.

Los documentos están en español porque es el idioma del proyecto y de su documentación existente. Los identificadores del código se mantienen en inglés.
