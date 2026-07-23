/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Overrides metrics to exclude the flyout from the viewport.
 */

import * as Blockly from 'blockly/core';

/** Computes metrics for a toolbox with an always open flyout. */
export class ContinuousMetrics extends Blockly.MetricsManager {
  /**
   * Computes the viewport size to not include the toolbox and the flyout.
   * The default viewport includes the flyout.
   *
   * @param getWorkspaceCoordinates True to get the view metrics in workspace
   *     coordinates, false to get them in pixel coordinates.
   * @returns The width, height, top and left of the viewport in either
   *     workspace coordinates or pixel coordinates.
   */
  override getViewMetrics(
    getWorkspaceCoordinates = false,
  ): Blockly.MetricsManager.ContainerRegion {
    const scale = getWorkspaceCoordinates ? this.workspace_.scale : 1;
    const svgMetrics = this.getSvgMetrics();
    const toolboxMetrics = this.getToolboxMetrics();
    const flyoutMetrics = this.getFlyoutMetrics(false);
    const toolboxPosition = toolboxMetrics.position;

    if (this.workspace_.getToolbox()) {
      // Note: Not actually supported at this time due to ContinuousToolbox
      // only supporting a vertical flyout. But included for completeness.
      if (
        toolboxPosition == Blockly.TOOLBOX_AT_TOP ||
        toolboxPosition == Blockly.TOOLBOX_AT_BOTTOM
      ) {
        svgMetrics.height -= toolboxMetrics.height + flyoutMetrics.height;
      } else if (
        toolboxPosition == Blockly.TOOLBOX_AT_LEFT ||
        toolboxPosition == Blockly.TOOLBOX_AT_RIGHT
      ) {
        svgMetrics.width -= toolboxMetrics.width + flyoutMetrics.width;
      }
    }
    return {
      height: svgMetrics.height / scale,
      width: svgMetrics.width / scale,
      top: -this.workspace_.scrollY / scale,
      left: -this.workspace_.scrollX / scale,
    };
  }

  /**
   * Gets the absolute left and absolute top in pixel coordinates.
   * This is where the visible workspace starts in relation to the SVG
   * container, adjusted to not include the area behind the flyout.
   *
   * @returns The absolute metrics for the workspace.
   */
  override getAbsoluteMetrics(): Blockly.MetricsManager.AbsoluteMetrics {
    const toolboxMetrics = this.getToolboxMetrics();
    const flyoutMetrics = this.getFlyoutMetrics(false);
    const toolboxPosition = toolboxMetrics.position;
    let absoluteLeft = 0;

    if (
      this.workspace_.getToolbox() &&
      toolboxPosition == Blockly.TOOLBOX_AT_LEFT
    ) {
      absoluteLeft = toolboxMetrics.width + flyoutMetrics.width;
    }
    let absoluteTop = 0;
    if (
      this.workspace_.getToolbox() &&
      toolboxPosition == Blockly.TOOLBOX_AT_TOP
    ) {
      absoluteTop = toolboxMetrics.height + flyoutMetrics.height;
    }
    return {
      top: absoluteTop,
      left: absoluteLeft,
    };
  }
}
