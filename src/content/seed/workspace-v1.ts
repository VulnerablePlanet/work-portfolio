import type { RoomDocument } from '@/domain/room/document';

/**
 * Semilla de la habitación actual, extraída de `RoomShell` y
 * `PORTFOLIO_OBJECTS` durante M0 (T0.2).
 *
 * Es el documento que reemplaza a la geometría y los textos hardcodeados.
 */
export const WORKSPACE_SEED_V1 = {
  schemaVersion: 1,
  meta: {
    title: 'Estudio',
    summary: 'Espacio de trabajo de ejemplo',
    theme: 'studio',
  },
  room: {
    width: 10,
    depth: 10,
    height: 3.2,
    floor: 'grid-blue',
    walls: 'concrete',
    ceiling: true,
  },
  spawn: {
    id: 'main',
    position: [0, 1.7, 3.8],
    yaw: 0,
  },
  nodes: [
    {
      id: 'architecture-console',
      kind: 'prefab',
      prefab: 'console',
      prefabVersion: 1,
      transform: {
        position: [1.4, 0.75, -2.5],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      props: {
        width: 1.2,
        height: 1.5,
        depth: 0.8,
        accent: '#8db5ff',
      },
      interaction: {
        eyebrow: 'Arquitectura',
        title: 'Sistemas interactivos de alto rendimiento',
        body: 'Este punto representa arquitectura frontend avanzada: renderer con fallback real, estado desacoplado, interacción por raycast y UI DOM separada del canvas.',
      },
    },
    {
      id: 'projects-terminal',
      kind: 'prefab',
      prefab: 'terminal',
      prefabVersion: 1,
      transform: {
        position: [-3.25, 0.65, 1.35],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      props: {
        width: 1.25,
        height: 1.3,
        depth: 0.75,
        accent: '#80f2c7',
      },
      interaction: {
        eyebrow: 'Proyectos',
        title: 'Casos de producto con criterio técnico',
        body: 'Aquí vivirán proyectos reales con contexto, tradeoffs, decisiones de arquitectura, métricas y resultados. No solo screenshots bonitos: evidencia técnica.',
      },
    },
    {
      id: 'skills-monolith',
      kind: 'prefab',
      prefab: 'monolith',
      prefabVersion: 1,
      transform: {
        position: [3.25, 0.85, 1.45],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      props: {
        width: 0.9,
        height: 1.7,
        depth: 0.9,
        accent: '#c7a2ff',
      },
      interaction: {
        eyebrow: 'Skills',
        title: 'Fundamentos antes que frameworks',
        body: 'Este punto agrupa capacidades técnicas: TypeScript, arquitectura limpia, renderizado 3D, performance budgets, testing y diseño de sistemas mantenibles.',
      },
    },
    {
      id: 'workspace-block',
      kind: 'prefab',
      prefab: 'block',
      prefabVersion: 1,
      transform: {
        position: [-2, 0.6, -1.4],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      props: {
        width: 2.4,
        height: 1.2,
        depth: 1.1,
        accent: '#6f86bf',
      },
    },
  ],
} satisfies RoomDocument;
