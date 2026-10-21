import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CapsuleCollider,
  RigidBody,
  type RapierRigidBody,
} from '@react-three/rapier';
import {
  Euler,
  MathUtils,
  Quaternion,
  Vector3,
} from 'three';
import {
  REQUEST_POINTER_LOCK_EVENT,
  setGamePointerLockTarget,
} from '@/player/pointer-lock-events';
import { useAppStore } from '@/store/useAppStore';
import { useInteractionStore } from '@/store/useInteractionStore';

const MOVE_SPEED = 3.25;
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.35;
const SPAWN_POSITION: [number, number, number] = [0, PLAYER_HEIGHT, 3.8];
const Y_AXIS = new Vector3(0, 1, 0);

export function PlayerController() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const inputRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const dragLookRef = useRef(false);
  const fallbackLookActiveRef = useRef(false);
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const pointerLockActive = useAppStore((state) => state.pointerLockActive);
  const fallbackLookActive = useAppStore((state) => state.fallbackLookActive);
  const gameStarted = useAppStore((state) => state.gameStarted);
  const gamePaused = useAppStore((state) => state.gamePaused);
  const setPointerLockActive = useAppStore((state) => state.setPointerLockActive);
  const setFallbackLookActive = useAppStore((state) => state.setFallbackLookActive);
  const setPointerLockError = useAppStore((state) => state.setPointerLockError);
  const setGameStarted = useAppStore((state) => state.setGameStarted);
  const setGamePaused = useAppStore((state) => state.setGamePaused);
  const { camera, gl } = useThree();

  const movement = useMemo(() => new Vector3(), []);
  const worldPosition = useMemo(() => new Vector3(), []);
  const yawQuaternion = useMemo(() => new Quaternion(), []);
  const cameraEuler = useMemo(() => new Euler(0, 0, 0, 'YXZ'), []);

  useEffect(() => {
    camera.rotation.order = 'YXZ';
  }, [camera]);

  useEffect(() => {
    fallbackLookActiveRef.current = fallbackLookActive;

    if (!fallbackLookActive) {
      lastMousePositionRef.current = null;
    }
  }, [fallbackLookActive]);

  useEffect(() => {
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === gl.domElement;
      setPointerLockActive(isLocked);
      if (isLocked) {
        setPointerLockError(null);
        setFallbackLookActive(false);
        setGameStarted(true);
      }
      setGamePaused(!isLocked);
      dragLookRef.current = false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        setGamePaused(true);
        setFallbackLookActive(false);
        if (document.pointerLockElement === gl.domElement) {
          document.exitPointerLock();
        }
      }
      if (event.code === 'KeyW') inputRef.current.forward = true;
      if (event.code === 'KeyS') inputRef.current.backward = true;
      if (event.code === 'KeyA') inputRef.current.left = true;
      if (event.code === 'KeyD') inputRef.current.right = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'KeyW') inputRef.current.forward = false;
      if (event.code === 'KeyS') inputRef.current.backward = false;
      if (event.code === 'KeyA') inputRef.current.left = false;
      if (event.code === 'KeyD') inputRef.current.right = false;
    };

    const applyLookDelta = (movementX: number, movementY: number) => {
      yawRef.current -= movementX * 0.0022;
      pitchRef.current = MathUtils.clamp(
        pitchRef.current - movementY * 0.0018,
        -1.15,
        1.15,
      );
    };

    const handleMouseMove = (event: MouseEvent) => {
      const hasPointerLock = document.pointerLockElement === gl.domElement;
      const hasFallbackLook = fallbackLookActiveRef.current;
      const canUseLook = hasPointerLock || hasFallbackLook || dragLookRef.current;

      if (!canUseLook) {
        lastMousePositionRef.current = null;
        return;
      }

      if (hasPointerLock || dragLookRef.current) {
        applyLookDelta(event.movementX, event.movementY);
        return;
      }

      const lastMousePosition = lastMousePositionRef.current;
      lastMousePositionRef.current = { x: event.clientX, y: event.clientY };

      if (!lastMousePosition) {
        return;
      }

      applyLookDelta(
        event.clientX - lastMousePosition.x,
        event.clientY - lastMousePosition.y,
      );
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0 || document.pointerLockElement === gl.domElement) {
        return;
      }

      dragLookRef.current = true;
    };

    const handleMouseUp = () => {
      dragLookRef.current = false;
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const lockPointer = () => {
      if (document.pointerLockElement !== gl.domElement) {
        setPointerLockError(null);
        setGamePaused(false);
        void gl.domElement.requestPointerLock().catch((error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : 'El navegador rechazo la captura del mouse.';

          setPointerLockError(
            `${message} Modo compatible activado: mueve el mouse dentro de la ventana. Para control infinito real, usa Chrome/Edge normal.`,
          );
          setGameStarted(true);
          setGamePaused(false);
          setFallbackLookActive(true);
          setPointerLockActive(false);
        });
      }
    };

    const handleExternalPointerLockRequest = () => {
      lockPointer();
    };

    setGamePointerLockTarget(gl.domElement);

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener(
      REQUEST_POINTER_LOCK_EVENT,
      handleExternalPointerLockRequest,
    );
    gl.domElement.addEventListener('click', lockPointer);
    gl.domElement.addEventListener('mousedown', handleMouseDown);
    gl.domElement.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener(
        'pointerlockchange',
        handlePointerLockChange,
      );
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener(
        REQUEST_POINTER_LOCK_EVENT,
        handleExternalPointerLockRequest,
      );
      gl.domElement.removeEventListener('click', lockPointer);
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      gl.domElement.removeEventListener('contextmenu', handleContextMenu);
      setGamePointerLockTarget(null);
      setFallbackLookActive(false);
      setPointerLockActive(false);
      setGamePaused(true);
    };
  }, [
    gl.domElement,
    setGamePaused,
    setGameStarted,
    setFallbackLookActive,
    setPointerLockActive,
    setPointerLockError,
  ]);

  useFrame((_, delta) => {
    const rigidBody = rigidBodyRef.current;
    const interactionMode = useInteractionStore.getState().mode;

    if (!rigidBody) {
      return;
    }

    movement.set(0, 0, 0);

    if (
      gameStarted &&
      !gamePaused &&
      (pointerLockActive || fallbackLookActive) &&
      interactionMode !== 'reading'
    ) {
      if (inputRef.current.forward) movement.z -= 1;
      if (inputRef.current.backward) movement.z += 1;
      if (inputRef.current.left) movement.x -= 1;
      if (inputRef.current.right) movement.x += 1;
    }

    if (movement.lengthSq() > 0) {
      movement.normalize().multiplyScalar(MOVE_SPEED);
      yawQuaternion.setFromAxisAngle(Y_AXIS, yawRef.current);
      movement.applyQuaternion(yawQuaternion);
    }

    const currentTranslation = rigidBody.translation();
    rigidBody.setLinvel({ x: movement.x, y: 0, z: movement.z }, true);

    worldPosition.set(
      currentTranslation.x + movement.x * delta,
      currentTranslation.y,
      currentTranslation.z + movement.z * delta,
    );

    camera.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
    cameraEuler.set(pitchRef.current, yawRef.current, 0);
    camera.quaternion.setFromEuler(cameraEuler);
  });

  useEffect(() => {
    if (gamePaused) {
      inputRef.current.forward = false;
      inputRef.current.backward = false;
      inputRef.current.left = false;
      inputRef.current.right = false;
      dragLookRef.current = false;
      lastMousePositionRef.current = null;
    }
  }, [gamePaused]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders={false}
      gravityScale={0}
      canSleep={false}
      linearDamping={8}
      enabledRotations={[false, false, false]}
      enabledTranslations={[true, false, true]}
      position={SPAWN_POSITION}
    >
      <CapsuleCollider args={[0.55, PLAYER_RADIUS]} />
      <group />
    </RigidBody>
  );
}
