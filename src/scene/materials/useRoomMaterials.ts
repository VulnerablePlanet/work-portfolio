import { useEffect, useMemo } from 'react';
import {
  CanvasTexture,
  Color,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';

type StripeDirection = 'horizontal' | 'vertical';

function createGridTexture({
  base,
  line,
  accent,
  size = 512,
  cells = 8,
  stripeDirection,
}: {
  base: string;
  line: string;
  accent?: string;
  size?: number;
  cells?: number;
  stripeDirection?: StripeDirection;
}) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('No se pudo crear el contexto 2D para textura procedural.');
  }

  context.fillStyle = base;
  context.fillRect(0, 0, size, size);

  const cellSize = size / cells;
  context.strokeStyle = line;
  context.lineWidth = Math.max(2, size / 180);

  for (let index = 0; index <= cells; index += 1) {
    const offset = Math.round(index * cellSize) + 0.5;
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, size);
    context.stroke();

    context.beginPath();
    context.moveTo(0, offset);
    context.lineTo(size, offset);
    context.stroke();
  }

  if (accent) {
    const gradient =
      stripeDirection === 'vertical'
        ? context.createLinearGradient(0, 0, size, 0)
        : context.createLinearGradient(0, 0, 0, size);

    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.48, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.5, accent);
    gradient.addColorStop(0.52, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 4;

  return texture;
}

export function useRoomMaterials() {
  const materials = useMemo(() => {
    const floorMap = createGridTexture({
      base: '#18243d',
      line: 'rgba(159, 194, 255, 0.22)',
      accent: 'rgba(128, 242, 199, 0.28)',
      cells: 10,
      stripeDirection: 'horizontal',
    });
    floorMap.repeat.set(4, 4);

    const backWallMap = createGridTexture({
      base: '#263657',
      line: 'rgba(159, 194, 255, 0.14)',
      accent: 'rgba(255, 128, 203, 0.2)',
      cells: 6,
      stripeDirection: 'vertical',
    });
    backWallMap.repeat.set(3, 1);

    const sideWallMap = createGridTexture({
      base: '#1f2e4c',
      line: 'rgba(136, 180, 255, 0.12)',
      accent: 'rgba(255, 190, 112, 0.14)',
      cells: 5,
      stripeDirection: 'vertical',
    });
    sideWallMap.repeat.set(3, 1);

    const ceilingMap = createGridTexture({
      base: '#10182b',
      line: 'rgba(255, 255, 255, 0.09)',
      accent: 'rgba(159, 194, 255, 0.12)',
      cells: 8,
      stripeDirection: 'horizontal',
    });
    ceilingMap.repeat.set(4, 4);

    return {
      floor: new MeshStandardMaterial({
        map: floorMap,
        color: new Color('#ffffff'),
        roughness: 0.9,
        metalness: 0.02,
      }),
      backWall: new MeshStandardMaterial({
        map: backWallMap,
        color: new Color('#ffffff'),
        roughness: 0.84,
      }),
      sideWall: new MeshStandardMaterial({
        map: sideWallMap,
        color: new Color('#ffffff'),
        roughness: 0.88,
      }),
      ceiling: new MeshStandardMaterial({
        map: ceilingMap,
        color: new Color('#ffffff'),
        roughness: 0.92,
      }),
      obstacle: new MeshStandardMaterial({
        color: '#6f86bf',
        emissive: '#101a33',
        emissiveIntensity: 0.28,
        roughness: 0.58,
        metalness: 0.08,
      }),
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((material) => {
        material.map?.dispose();
        material.dispose();
      });
    };
  }, [materials]);

  return materials;
}
