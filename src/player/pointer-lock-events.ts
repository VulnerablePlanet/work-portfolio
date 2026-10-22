let pointerLockTarget: HTMLElement | null = null;
let pendingTargetResolvers: ((target: HTMLElement | null) => void)[] = [];

const TARGET_WAIT_MS = 1_500;

export function setGamePointerLockTarget(target: HTMLElement | null): void {
  pointerLockTarget = target;

  if (target) {
    const resolvers = pendingTargetResolvers;
    pendingTargetResolvers = [];
    resolvers.forEach((resolve) => resolve(target));
  }
}

export function getGamePointerLockTarget(): HTMLElement | null {
  return pointerLockTarget;
}

export function isGamePointerLocked(): boolean {
  return (
    pointerLockTarget !== null &&
    document.pointerLockElement === pointerLockTarget
  );
}

function waitForTarget(): Promise<HTMLElement | null> {
  if (pointerLockTarget) {
    return Promise.resolve(pointerLockTarget);
  }

  return new Promise((resolve) => {
    pendingTargetResolvers.push(resolve);
    window.setTimeout(() => resolve(pointerLockTarget), TARGET_WAIT_MS);
  });
}

export async function requestGamePointerLock(): Promise<void> {
  const target = await waitForTarget();

  if (!target) {
    throw new Error('El canvas todavía no está listo para capturar el mouse.');
  }

  if (document.pointerLockElement === target) {
    return;
  }

  await target.requestPointerLock();
}

export function releaseGamePointerLock(): void {
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
}
