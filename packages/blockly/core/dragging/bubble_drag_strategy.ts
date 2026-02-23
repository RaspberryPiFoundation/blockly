/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IBubble} from '../interfaces/i_bubble.js';
import type {IDragStrategy} from '../interfaces/i_draggable.js';
import * as layers from '../layers.js';
import type {Coordinate} from '../utils.js';
import type {WorkspaceSvg} from '../workspace_svg.js';

export class BubbleDragStrategy implements IDragStrategy {
  private startLoc: Coordinate | null = null;

  constructor(
    private bubble: IBubble,
    private workspace: WorkspaceSvg,
  ) {}

  isMovable(): boolean {
    return true;
  }

  startDrag() {
    this.startLoc = this.bubble.getRelativeToSurfaceXY();
    this.workspace.setResizesEnabled(false);
    this.workspace.getLayerManager()?.moveToDragLayer(this.bubble);
    if (this.bubble.setDragging) {
      this.bubble.setDragging(true);
    }

    return this.bubble;
  }

  drag(newLoc: Coordinate): void {
    this.bubble.moveDuringDrag(newLoc);
  }

  endDrag(): void {
    this.workspace.setResizesEnabled(true);

    this.workspace
      .getLayerManager()
      ?.moveOffDragLayer(this.bubble, layers.BUBBLE);
    this.bubble.setDragging(false);
  }

  revertDrag(): void {
    if (this.startLoc) this.bubble.moveDuringDrag(this.startLoc);
  }
}
