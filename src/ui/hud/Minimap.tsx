import { getInteractiveNodes } from '@/domain/room/selectors';
import { useProgressStore } from '@/store/useProgressStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useSessionStore } from '@/store/useSessionStore';

const VIEWBOX_SIZE = 120;

function mapToMinimap(value: number, size: number) {
  return (value / size) * VIEWBOX_SIZE + VIEWBOX_SIZE / 2;
}

export function Minimap() {
  const screen = useSessionStore((state) => state.screen);
  const document = useRoomStore((state) => state.document);
  const visitedObjectIds = useProgressStore((state) => state.visitedObjectIds);

  if (screen !== 'exploring') {
    return null;
  }

  const { width, depth } = document.room;
  const [spawnX, , spawnZ] = document.spawn.position;
  const interactiveNodes = getInteractiveNodes(document);

  return (
    <section className="minimap" aria-label="Mini mapa de la habitacion">
      <p>Mini mapa</p>
      <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} role="img">
        <title>Mapa de objetos interactivos</title>
        <rect x="1" y="1" width="118" height="118" rx="12" />
        <circle
          cx={mapToMinimap(spawnX, width)}
          cy={mapToMinimap(spawnZ, depth)}
          r="5"
          className="minimap__spawn"
        />
        {interactiveNodes.map((node) => {
          const visited = visitedObjectIds.includes(node.id);

          return (
            <circle
              key={node.id}
              cx={mapToMinimap(node.transform.position[0], width)}
              cy={mapToMinimap(node.transform.position[2], depth)}
              r={visited ? 5 : 4}
              className={
                visited ? 'minimap__point--visited' : 'minimap__point'
              }
            />
          );
        })}
      </svg>
    </section>
  );
}
