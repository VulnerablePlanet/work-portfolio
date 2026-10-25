import { WORKSPACE_SEED_V1 } from '@/content/seed/workspace-v1';
import type { PublicSpace } from '@/lib/public-space';

export const DEMO_HANDLE = 'demo';
export const DEMO_ROOM_SLUG = 'estudio';

export const DEMO_SPACE: PublicSpace = {
  handle: DEMO_HANDLE,
  displayName: 'Sergio Botero',
  headline: 'Arquitectura frontend y sistemas 3D',
  title: 'Estudio',
  summary:
    'Espacio de trabajo de ejemplo: una habitación 3D con proyectos, skills y una consola de arquitectura. Es la semilla que cada usuario podrá personalizar en el editor.',
  rooms: [
    {
      id: 'demo-estudio',
      slug: DEMO_ROOM_SLUG,
      title: 'Estudio',
      purpose: 'about',
      document: WORKSPACE_SEED_V1,
    },
  ],
};

export function getDemoRoom(slug: string) {
  return DEMO_SPACE.rooms.find((room) => room.slug === slug) ?? null;
}
