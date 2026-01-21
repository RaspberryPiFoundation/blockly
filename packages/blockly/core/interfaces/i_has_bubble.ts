/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IBubble} from './i_bubble';

export interface IHasBubble {
  /** @returns True if the bubble is currently open, false otherwise. */
  bubbleIsVisible(): boolean;

  /** Sets whether the bubble is open or not. */
  setBubbleVisible(visible: boolean): Promise<void>;

  /**
   * Returns the current IBubble that implementations are managing, or null if
   * there isn't one.
   *
   * Note that this cannot be expected to return null if bubbleIsVisible()
   * returns false, i.e., the nullability of the returned bubble does not
   * necessarily imply visibility.
   *
   * @returns The current IBubble maintained by implementations, or null if
   *     there is not one.
   */
  getBubble(): IBubble | null;
}

/** Type guard that checks whether the given object is a IHasBubble. */
export function hasBubble(obj: any): obj is IHasBubble {
  return (
    typeof obj.bubbleIsVisible === 'function' &&
    typeof obj.setBubbleVisible === 'function' &&
    typeof obj.getBubble === 'function'
  );
}
