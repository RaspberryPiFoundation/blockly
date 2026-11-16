/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A positionable version of the minimap.
 * @author cesarades@google.com (Cesar Ades)
 */

import * as Blockly from 'blockly/core';
import {Minimap} from './minimap';

const minWidth = 200;

/**
 * A positionable version of minimap that implements IPositionable.
 */
export class PositionedMinimap
  extends Minimap
  implements Blockly.IPositionable
{
  protected margin: number;
  protected top: number;
  protected left: number;
  protected width: number;
  protected height: number;
  id: string;

  /**
   * Constructor for a positionable minimap.
   *
   * @param workspace The workspace to mirror.
   */
  constructor(workspace: Blockly.WorkspaceSvg) {
    super(workspace);
    this.id = 'minimap';
    this.margin = 20;
    this.top = 0;
    this.left = 0;
    this.width = 225;
    this.height = 150;
  }

  /**
   * Initialize.
   */
  init(): void {
    super.init();
    this.primaryWorkspace.getComponentManager().addComponent({
      component: this,
      weight: 3,
      capabilities: [Blockly.ComponentManager.Capability.POSITIONABLE],
    });
    this.primaryWorkspace.resize();
  }

  /**
   * Returns the bounding rectangle of the UI element in pixel units
   * relative to the Blockly injection div.
   *
   * @returns The component’s bounding box.
   */
  getBoundingRectangle(): Blockly.utils.Rect {
    return new Blockly.utils.Rect(
      this.top,
      this.top + this.height,
      this.left,
      this.left + this.width,
    );
  }

  /**
   * Positions the minimap.
   *
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles already on the workspace.
   */
  position(
    metrics: Blockly.MetricsManager.UiMetrics,
    savedPositions: Blockly.utils.Rect[],
  ): void {
    this.setSize();
    this.setPosition(metrics, savedPositions);
    this.setAttributes();
  }

  /**
   * Sizes the minimap.
   *
   * @internal
   */
  setSize(): void {
    const viewWidth = this.primaryWorkspace.getMetrics().viewWidth;
    this.width = Math.max(minWidth, viewWidth / 5);
    this.height = (this.width * 2) / 3;
  }

  /**
   * Calculates the position of the minimap over the primary workspace.
   *
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles already on the workspace.
   * @internal
   */
  setPosition(
    metrics: Blockly.MetricsManager.UiMetrics,
    savedPositions: Blockly.utils.Rect[],
  ): void {
    // Aliases.
    const workspace = this.primaryWorkspace;
    const scrollbars = workspace.scrollbar;

    const hasVerticalScrollbars =
      scrollbars && scrollbars.isVisible() && scrollbars.canScrollVertically();
    const hasHorizontalScrollbars =
      scrollbars &&
      scrollbars.isVisible() &&
      scrollbars.canScrollHorizontally();

    if (
      metrics.toolboxMetrics.position === Blockly.TOOLBOX_AT_LEFT ||
      (workspace.horizontalLayout && !workspace.RTL)
    ) {
      // Right edge placement.
      this.left =
        metrics.absoluteMetrics.left +
        metrics.viewMetrics.width -
        this.width -
        this.margin;
      if (hasVerticalScrollbars && !workspace.RTL) {
        this.left -= Blockly.Scrollbar.scrollbarThickness;
      }
    } else {
      // Left edge placement.
      this.left = this.margin;
      if (hasVerticalScrollbars && workspace.RTL) {
        this.left += Blockly.Scrollbar.scrollbarThickness;
      }
    }

    const startAtBottom =
      metrics.toolboxMetrics.position === Blockly.TOOLBOX_AT_BOTTOM;
    if (startAtBottom) {
      // Bottom edge placement.
      this.top =
        metrics.absoluteMetrics.top +
        metrics.viewMetrics.height -
        this.height -
        this.margin;
      if (hasHorizontalScrollbars) {
        // The horizontal scrollbars are always positioned on the bottom.
        this.top -= Blockly.Scrollbar.scrollbarThickness;
      }
    } else {
      // Upper edge placement.
      this.top = metrics.absoluteMetrics.top + this.margin;
    }

    // Check for collision and bump if needed.
    let boundingRect = this.getBoundingRectangle();
    for (let i = 0; i < savedPositions.length; i++) {
      if (boundingRect.intersects(savedPositions[i])) {
        if (startAtBottom) {
          this.top = savedPositions[i].top - this.height - this.margin;
        } else {
          this.top = savedPositions[i].bottom + this.margin;
        }
        // Recheck other savedPositions.
        boundingRect = this.getBoundingRectangle();
        i = -1;
      }
    }
  }

  /**
   * Sets the CSS attribute for the minimap.
   */
  private setAttributes(): void {
    const injectDiv = this.minimapWorkspace?.getInjectionDiv();
    if (!injectDiv) {
      return;
    }
    if (injectDiv?.parentElement === null) {
      return;
    }
    const style = injectDiv.parentElement.style;
    style.zIndex = '2';
    style.position = 'absolute';
    style.width = `${this.width}px`;
    style.height = `${this.height}px`;
    style.top = `${this.top}px`;
    style.left = `${this.left}px`;
    if (this.minimapWorkspace) {
      Blockly.svgResize(this.minimapWorkspace);
    }
  }
}

Blockly.Css.register(`
.blockly-minimap {
  box-shadow: 2px 2px 10px grey;
}
`);
