import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Raycaster, Vector2 } from 'three';
import { useSessionStore } from '@/store/useSessionStore';
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
  const setHoveredObject = useInteractionStore(
    (state) => state.setHoveredObject,
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE' || event.repeat) {
        return;
      }

      const session = useSessionStore.getState();

      if (session.screen !== 'exploring') {
        return;
      }

      const { hoveredObjectId } = useInteractionStore.getState();

      if (!hoveredObjectId) {
        return;
      }

      const entry = getInteractiveObjectById(hoveredObjectId);

      if (!entry) {
        return;
      }

      useInteractionStore.getState().activateObject(entry.id, entry.content);
      session.dispatch({ type: 'INTERACT' });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useFrame(({ camera }) => {
    const session = useSessionStore.getState();

    if (session.screen !== 'exploring') {
      if (hoveredIdRef.current !== null) {
        hoveredIdRef.current = null;
        setHoveredObject(null);
      }

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
