import type { InteractionContent } from '@/store/useInteractionStore';

export interface PortfolioObjectDefinition {
  id: string;
  color: string;
  position: [number, number, number];
  args: [number, number, number];
  maxDistance: number;
  content: InteractionContent;
}

export const PORTFOLIO_OBJECTS: PortfolioObjectDefinition[] = [
  {
    id: 'architecture-console',
    color: '#8db5ff',
    position: [1.4, 0.75, -2.5],
    args: [1.2, 1.5, 0.8],
    maxDistance: 4,
    content: {
      eyebrow: 'Arquitectura',
      title: 'Sistemas interactivos de alto rendimiento',
      body:
        'Este punto representa arquitectura frontend avanzada: renderer con fallback real, estado desacoplado, interacción por raycast y UI DOM separada del canvas.',
    },
  },
  {
    id: 'projects-terminal',
    color: '#80f2c7',
    position: [-3.25, 0.65, 1.35],
    args: [1.25, 1.3, 0.75],
    maxDistance: 4,
    content: {
      eyebrow: 'Proyectos',
      title: 'Casos de producto con criterio técnico',
      body:
        'Aquí vivirán proyectos reales con contexto, tradeoffs, decisiones de arquitectura, métricas y resultados. No solo screenshots bonitos: evidencia técnica.',
    },
  },
  {
    id: 'skills-monolith',
    color: '#c7a2ff',
    position: [3.25, 0.85, 1.45],
    args: [0.9, 1.7, 0.9],
    maxDistance: 4,
    content: {
      eyebrow: 'Skills',
      title: 'Fundamentos antes que frameworks',
      body:
        'Este punto agrupa capacidades técnicas: TypeScript, arquitectura limpia, renderizado 3D, performance budgets, testing y diseño de sistemas mantenibles.',
    },
  },
];
