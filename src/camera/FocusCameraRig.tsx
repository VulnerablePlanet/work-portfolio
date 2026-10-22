import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { useSessionStore } from '@/store/useSessionStore';

const EXPLORING_FOV = 50;
const READING_FOV = 44;

export function FocusCameraRig() {
  const { camera } = useThree();
  const screen = useSessionStore((state) => state.screen);
  const isReading = screen === 'reading';

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
