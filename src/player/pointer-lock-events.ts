export const REQUEST_POINTER_LOCK_EVENT = 'portfolio:request-pointer-lock';

let pointerLockTarget: HTMLElement | null = null;

export function setGamePointerLockTarget(target: HTMLElement | null) {
  pointerLockTarget = target;
}

export async function requestGamePointerLock() {
  if (pointerLockTarget) {
    if (document.pointerLockElement !== pointerLockTarget) {
      await pointerLockTarget.requestPointerLock();
    }

    return;
  }

  window.dispatchEvent(new CustomEvent(REQUEST_POINTER_LOCK_EVENT));
}
