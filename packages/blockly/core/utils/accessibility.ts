/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

let shouldReduceMotion: MediaQueryList | undefined = undefined;

/**
 * Returns true if motion and animations should be minimized.
 */
export function shouldReduceMotion(): boolean {
  if (shouldReduceMotion === undefined) {
    if (typeof window === 'undefined' || !('matchMedia' in window)) {
      // No point in animating if there's no window, i.e. we're running under
      // Node.
      return true;
    }

    shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  }
  return shouldReduceMotion.matches;
}
