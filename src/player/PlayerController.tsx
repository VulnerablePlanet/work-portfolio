import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CapsuleCollider,
  RigidBody,
  type RapierRigidBody,
} from '@react-three/rapier';
import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import { formatPointerLockError } from '@/application/session/pointer-lock-error';
import { useSessionStore } from '@/store/useSessionStore';
import {
  requestGamePointerLock,
  setGamePointerLockTarget,
} from '@/player/pointer-lock-events';

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
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const screen = useSessionStore((state) => state.screen);
  const look = useSessionStore((state) => state.look);
  const dispatch = useSessionStore((state) => state.dispatch);
  const { camera, gl } = useThree();

  const movement = useMemo(() => new Vector3(), []);
  const worldPosition = useMemo(() => new Vector3(), []);
  const yawQuaternion = useMemo(() => new Quaternion(), []);
  const cameraEuler = useMemo(() => new Euler(0, 0, 0, 'YXZ'), []);

  useEffect(() => {
    camera.rotation.order = 'YXZ';
  }, [camera]);

  useEffect(() => {
    if (look !== 'fallback') {
      lastMousePositionRef.current = null;
    }
  }, [look]);

  useEffect(() => {
    const applyLookDelta = (movementX: number, movementY: number) => {
      yawRef.current -= movementX * 0.0022;
      pitchRef.current = MathUtils.clamp(
        pitchRef.current - movementY * 0.0018,
        -1.15,
        1.15,
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (useSessionStore.getState().screen !== 'exploring') {
        return;
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

    const handleMouseMove = (event: MouseEvent) => {
      const session = useSessionStore.getState();

      if (session.screen !== 'exploring') {
        lastMousePositionRef.current = null;
        return;
      }

      const hasPointerLock = document.pointerLockElement === gl.domElement;
      const hasFallbackLook = session.look === 'fallback';
      const canUseLook =
        hasPointerLock || hasFallbackLook || dragLookRef.current;

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
      if (event.button !== 0) {
        return;
      }

      if (useSessionStore.getState().screen !== 'exploring') {
        return;
      }

      if (document.pointerLockElement === gl.domElement) {
        return;
      }

      dragLookRef.current = true;
    };

    const handleMouseUp = () => {
      dragLookRef.current = false;
    };

    const handleClick = () => {
      const session = useSessionStore.getState();

      if (session.screen !== 'exploring' || session.look === 'pointer') {
        return;
      }

      if (document.pointerLockElement === gl.domElement) {
        return;
      }

      void requestGamePointerLock().catch((error: unknown) => {
        dispatch({
          type: 'FALLBACK_LOOK',
          message: formatPointerLockError(error),
        });
      });
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    setGamePointerLockTarget(gl.domElement);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    gl.domElement.addEventListener('click', handleClick);
    gl.domElement.addEventListener('mousedown', handleMouseDown);
    gl.domElement.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      gl.domElement.removeEventListener('click', handleClick);
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      gl.domElement.removeEventListener('contextmenu', handleContextMenu);
      setGamePointerLockTarget(null);
      dragLookRef.current = false;
    };
  }, [dispatch, gl.domElement]);

  useEffect(() => {
    if (screen === 'exploring') {
      return;
    }

    inputRef.current.forward = false;
    inputRef.current.backward = false;
    inputRef.current.left = false;
    inputRef.current.right = false;
    dragLookRef.current = false;
    lastMousePositionRef.current = null;
  }, [screen]);

  useFrame((_, delta) => {
    const rigidBody = rigidBodyRef.current;

    if (!rigidBody) {
      return;
    }

    const sessionScreen = useSessionStore.getState().screen;

    movement.set(0, 0, 0);

    if (sessionScreen === 'exploring') {
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
