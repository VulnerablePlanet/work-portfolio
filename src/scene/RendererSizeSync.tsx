import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';

/**
 * R3F dimensiona el canvas, pero el WebGPURenderer creado por la factory
 * conserva su viewport inicial de 300x150 y la cámara puede quedarse con
 * aspect 0. Sincronizamos tamaño, DPR y proyección con el canvas real.
 */
export function RendererSizeSync() {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const dpr = useThree((state) => state.viewport.dpr);

  useLayoutEffect(() => {
    const sync = () => {
      const width = gl.domElement.clientWidth || gl.domElement.width;
      const height = gl.domElement.clientHeight || gl.domElement.height;

      if (!width || !height) {
        return;
      }

      gl.setPixelRatio(dpr);
      gl.setSize(width, height, false);

      const perspectiveCamera = camera as PerspectiveCamera;

      if (perspectiveCamera.isPerspectiveCamera) {
        perspectiveCamera.aspect = width / height;
        perspectiveCamera.updateProjectionMatrix();
      }
    };

    sync();

    const target = gl.domElement.parentElement ?? gl.domElement;
    const observer = new ResizeObserver(sync);
    observer.observe(target);
    window.addEventListener('resize', sync);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [camera, dpr, gl]);

  return null;
}
