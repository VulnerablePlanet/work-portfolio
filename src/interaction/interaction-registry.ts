import type { Object3D } from 'three';
import type { InteractionContent } from '@/store/useInteractionStore';

export interface InteractiveRegistryEntry {
  id: string;
  object: Object3D;
  content: InteractionContent;
  maxDistance: number;
}

const interactiveObjects = new Map<string, InteractiveRegistryEntry>();

export function registerInteractiveObject(entry: InteractiveRegistryEntry) {
  interactiveObjects.set(entry.id, entry);

  return () => {
    interactiveObjects.delete(entry.id);
  };
}

export function getInteractiveObjects() {
  return Array.from(interactiveObjects.values());
}

export function getInteractiveObjectById(id: string) {
  return interactiveObjects.get(id) ?? null;
}
