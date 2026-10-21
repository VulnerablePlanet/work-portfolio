import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { useInteractionStore } from '@/store/useInteractionStore';

const EXPLORING_FOV = 50;
const READING_FOV = 44;

export function FocusCameraRig() {
  const { camera } = useThree();
  const mode = useInteractionStore((state) => state.mode);
  const isReading = mode === 'reading';

  useEffect(() => {
    gsap.to(camera, {
      fov: isReading ? READING_FOV : EXPLORING_FOV,
      duration: 0.45,
      ease: 'power2.out',
      onUpdate: () => {
        camera.updateProjectionMatrix();
      },
    });

    return () => {
      gsap.killTweensOf(camera);
    };
  }, [camera, isReading]);

  return null;
}
