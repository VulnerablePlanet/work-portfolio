import { PORTFOLIO_OBJECTS } from '@/content/interactive-objects';
import { useAppStore } from '@/store/useAppStore';
import { useProgressStore } from '@/store/useProgressStore';

const ROOM_SIZE = 10;
const VIEWBOX_SIZE = 120;

function mapToMinimap(value: number) {
  return (value / ROOM_SIZE) * VIEWBOX_SIZE + VIEWBOX_SIZE / 2;
}

export function Minimap() {
  const pointerLockActive = useAppStore((state) => state.pointerLockActive);
  const fallbackLookActive = useAppStore((state) => state.fallbackLookActive);
  const gamePaused = useAppStore((state) => state.gamePaused);
  const visitedObjectIds = useProgressStore((state) => state.visitedObjectIds);

  if ((!pointerLockActive && !fallbackLookActive) || gamePaused) {
    return null;
  }

  return (
    <section className="minimap" aria-label="Mini mapa de la habitacion">
      <p>Mini mapa</p>
      <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} role="img">
        <title>Mapa de objetos interactivos</title>
        <rect x="1" y="1" width="118" height="118" rx="12" />
        <circle cx="60" cy="70" r="5" className="minimap__spawn" />
        {PORTFOLIO_OBJECTS.map((object) => {
          const visited = visitedObjectIds.includes(object.id);

          return (
            <circle
              key={object.id}
              cx={mapToMinimap(object.position[0])}
              cy={mapToMinimap(object.position[2])}
              r={visited ? 5 : 4}
              className={visited ? 'minimap__point--visited' : 'minimap__point'}
            />
          );
        })}
      </svg>
    </section>
  );
}
