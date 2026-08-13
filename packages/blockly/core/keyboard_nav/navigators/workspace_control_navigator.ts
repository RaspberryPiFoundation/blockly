/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {Navigator} from './navigator.js';

/**
 * No-op Navigator for single-node workspace controls (trashcan, zoom).
 */
export class WorkspaceControlNavigator extends Navigator {
  override getNextNode() {
    return null;
  }

  override getPreviousNode() {
    return null;
  }

  override getInNode() {
    return null;
  }

  override getOutNode() {
    return null;
  }

  override navigateStacks() {
    return null;
  }
}
