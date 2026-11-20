/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

let reduceMotion: MediaQueryList | undefined = undefined;

/**
 * Returns true if motion and animations should be minimized.
 */
export function shouldReduceMotion(): boolean {
  if (reduceMotion === undefined) {
    if (typeof window === 'undefined' || !('matchMedia' in window)) {
      // No point in animating if there's no window, i.e. we're running under
      // Node.
      return true;
    }

    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  }
  return reduceMotion.matches;
}

let increaseContrast: MediaQueryList | undefined = undefined;

/**
 * Returns true if the user has asked their operating system for more contrast.
 */
export function shouldIncreaseContrast(): boolean {
  if (increaseContrast === undefined) {
    if (typeof window === 'undefined' || !('matchMedia' in window)) {
      // Nothing is drawn if there's no window, i.e. we're running under Node.
      return false;
    }

    increaseContrast = window.matchMedia('(prefers-contrast: more)');
  }
  return increaseContrast.matches;
}
