/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates and reports flyout workspace metrics.
 *
 * @class
 */
// Former goog.module ID: Blockly.FlyoutMetricsManager

import type {IFlyout} from './interfaces/i_flyout.js';
import {ContainerRegion, MetricsManager} from './metrics_manager.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Calculates metrics for a flyout's workspace.
 * The metrics are mainly used to size scrollbars for the flyout.
 */
export class FlyoutMetricsManager extends MetricsManager {
  /** The flyout that owns the workspace to calculate metrics for. */
  protected flyout_: IFlyout;

  /**
   * @param workspace The flyout's workspace.
   * @param flyout The flyout.
   */
  constructor(workspace: WorkspaceSvg, flyout: IFlyout) {
    super(workspace);
    this.flyout_ = flyout;
  }

  /**
   * Gets the bounding box of the blocks on the flyout's workspace.
   * This is in workspace coordinates.
   *
   * @returns The bounding box of the blocks on the workspace.
   */
  private getBoundingBox():
    | SVGRect
    | {height: number; y: number; width: number; x: number} {
    let blockBoundingBox;
    try {
      blockBoundingBox = this.workspace_.getCanvas().getBBox();
    } catch {
      // Firefox has trouble with hidden elements (Bug 528969).
      // 2021 Update: It looks like this was fixed around Firefox 77 released in
      // 2020.
      blockBoundingBox = {height: 0, y: 0, width: 0, x: 0};
    }
    return blockBoundingBox;
  }

  override getContentMetrics(opt_getWorkspaceCoordinates?: boolean) {
    // The bounding box is in workspace coordinates.
    const blockBoundingBox = this.getBoundingBox();
    const scale = opt_getWorkspaceCoordinates ? 1 : this.workspace_.scale;

    return {
      height: blockBoundingBox.height * scale,
      width: blockBoundingBox.width * scale,
      top: blockBoundingBox.y * scale,
      left: blockBoundingBox.x * scale,
    };
  }

  override getScrollMetrics(
    opt_getWorkspaceCoordinates?: boolean,
    opt_viewMetrics?: ContainerRegion,
    opt_contentMetrics?: ContainerRegion,
  ) {
    const contentMetrics = opt_contentMetrics || this.getContentMetrics();
    const margin = this.flyout_.MARGIN * this.workspace_.scale;
    const scale = opt_getWorkspaceCoordinates ? this.workspace_.scale : 1;

    // The left padding isn't just the margin. Some blocks are also offset by
    // tabWidth so that value and statement blocks line up.
    // The contentMetrics.left value is equivalent to the variable left padding.
    const leftPadding = contentMetrics.left;

    return {
      height: (contentMetrics.height + 2 * margin) / scale,
      width: (contentMetrics.width + leftPadding + margin) / scale,
      top: 0,
      left: 0,
    };
  }
}
