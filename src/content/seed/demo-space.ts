import type { RoomDocument } from '@/domain/room/document';
import { WORKSPACE_SEED_V1 } from '@/content/seed/workspace-v1';

export interface DemoSpace {
  handle: string;
  displayName: string;
  headline: string;
  title: string;
  summary: string;
  room: {
    slug: string;
    title: string;
    document: RoomDocument;
  };
}

export const DEMO_HANDLE = 'demo';
export const DEMO_ROOM_SLUG = 'estudio';

export const DEMO_SPACE: DemoSpace = {
  handle: DEMO_HANDLE,
  displayName: 'Sergio Botero',
  headline: 'Arquitectura frontend y sistemas 3D',
  title: 'Estudio',
  summary:
    'Espacio de trabajo de ejemplo: una habitación 3D con proyectos, skills y una consola de arquitectura. Es la semilla que cada usuario podrá personalizar en el editor.',
  room: {
    slug: DEMO_ROOM_SLUG,
    title: 'Estudio',
    document: WORKSPACE_SEED_V1,
  },
};
