import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Raycaster, Vector2 } from 'three';
import {
  getInteractiveObjectById,
  getInteractiveObjects,
} from '@/interaction/interaction-registry';
import { useInteractionStore } from '@/store/useInteractionStore';

const CENTER_SCREEN = new Vector2(0, 0);

export function InteractionManager() {
  const raycaster = useMemo(() => new Raycaster(), []);
  const frameCountRef = useRef(0);
  const hoveredIdRef = useRef<string | null>(null);
  const setHoveredObject = useInteractionStore((state) => state.setHoveredObject);
  const activateObject = useInteractionStore((state) => state.activateObject);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        useInteractionStore.getState().beginCloseActiveObject();
        return;
      }

      if (event.code !== 'KeyE' || event.repeat) {
        return;
      }

      const { hoveredObjectId, mode } = useInteractionStore.getState();

      if (!hoveredObjectId || mode === 'reading') {
        return;
      }

      const entry = getInteractiveObjectById(hoveredObjectId);

      if (entry) {
        if (document.pointerLockElement) {
          void document.exitPointerLock();
        }

        activateObject(entry.id, entry.content);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activateObject]);

  useFrame(({ camera }) => {
    const mode = useInteractionStore.getState().mode;

    if (mode === 'reading') {
      return;
    }

    frameCountRef.current += 1;

    if (frameCountRef.current % 2 !== 0) {
      return;
    }

    const entries = getInteractiveObjects();

    if (entries.length === 0) {
      if (hoveredIdRef.current !== null) {
        hoveredIdRef.current = null;
        setHoveredObject(null);
      }

      return;
    }

    raycaster.setFromCamera(CENTER_SCREEN, camera);
    const intersections = raycaster.intersectObjects(
      entries.map((entry) => entry.object),
      false,
    );
    const closestIntersection = intersections.find((intersection) => {
      const entry = entries.find(
        (candidate) => candidate.object === intersection.object,
      );

      return entry ? intersection.distance <= entry.maxDistance : false;
    });
    const nextHoveredId = closestIntersection
      ? entries.find((entry) => entry.object === closestIntersection.object)
          ?.id ?? null
      : null;

    if (nextHoveredId !== hoveredIdRef.current) {
      hoveredIdRef.current = nextHoveredId;
      setHoveredObject(nextHoveredId);
    }
  });

  return null;
}
