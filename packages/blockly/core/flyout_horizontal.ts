/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Horizontal flyout tray containing blocks which may be created.
 *
 * @class
 */
// Former goog.module ID: Blockly.HorizontalFlyout

import * as browserEvents from './browser_events.js';
import * as dropDownDiv from './dropdowndiv.js';
import {Flyout} from './flyout_base.js';
import type {FlyoutItem} from './flyout_item.js';
import type {Options} from './options.js';
import * as registry from './registry.js';
import {Scrollbar} from './scrollbar.js';
import type {Coordinate} from './utils/coordinate.js';
import {Rect} from './utils/rect.js';
import * as toolbox from './utils/toolbox.js';
import * as WidgetDiv from './widgetdiv.js';

/**
 * Class for a flyout.
 */
export class HorizontalFlyout extends Flyout {
  override horizontalLayout = true;

  /** @param workspaceOptions Dictionary of options for the workspace. */
  constructor(workspaceOptions: Options) {
    super(workspaceOptions);
  }

  /**
   * Sets the translation of the flyout to match the scrollbars.
   *
   * @param xyRatio Contains a y property which is a float between 0 and 1
   *     specifying the degree of scrolling and a similar x property.
   */
  protected override setMetrics_(xyRatio: {x: number; y: number}) {
    if (!this.isVisible()) {
      return;
    }

    const metricsManager = this.workspace_.getMetricsManager();
    const scrollMetrics = metricsManager.getScrollMetrics();
    const viewMetrics = metricsManager.getViewMetrics();
    const absoluteMetrics = metricsManager.getAbsoluteMetrics();

    if (typeof xyRatio.x === 'number') {
      this.workspace_.scrollX = -(
        scrollMetrics.left +
        (scrollMetrics.width - viewMetrics.width) * xyRatio.x
      );
    }

    this.workspace_.translate(
      this.workspace_.scrollX + absoluteMetrics.left,
      this.workspace_.scrollY + absoluteMetrics.top,
    );
  }

  /**
   * Calculates the x coordinate for the flyout position.
   *
   * @returns X coordinate.
   */
  override getX(): number {
    // X is always 0 since this is a horizontal flyout.
    return 0;
  }

  /**
   * Calculates the y coordinate for the flyout position.
   *
   * @returns Y coordinate.
   */
  override getY(): number {
    if (!this.isVisible()) {
      return 0;
    }
    const metricsManager = this.targetWorkspace!.getMetricsManager();
    const absoluteMetrics = metricsManager.getAbsoluteMetrics();
    const viewMetrics = metricsManager.getViewMetrics();
    const toolboxMetrics = metricsManager.getToolboxMetrics();

    let y = 0;
    const atTop = this.toolboxPosition_ === toolbox.Position.TOP;
    // If this flyout is not the trashcan flyout (e.g. toolbox or mutator).
    // Trashcan flyout is opposite the main flyout.
    if (this.targetWorkspace!.toolboxPosition === this.toolboxPosition_) {
      // If there is a category toolbox.
      // Simple (flyout-only) toolbox.
      if (this.targetWorkspace!.getToolbox()) {
        if (atTop) {
          y = toolboxMetrics.height;
        } else {
          y = viewMetrics.height - this.getHeight();
        }
      } else {
        if (atTop) {
          y = 0;
        } else {
          // The simple flyout does not cover the workspace.
          y = viewMetrics.height;
        }
      }
    } else {
      if (atTop) {
        y = 0;
      } else {
        // Because the anchor point of the flyout is on the top, but we want
        // to align the bottom edge of the flyout with the bottom edge of the
        // blocklyDiv, we calculate the full height of the div minus the height
        // of the flyout.
        y = viewMetrics.height + absoluteMetrics.top - this.getHeight();
      }
    }

    return y;
  }

  /** Move the flyout to the edge of the workspace. */
  override position() {
    if (!this.isVisible() || !this.targetWorkspace!.isVisible()) {
      return;
    }
    const metricsManager = this.targetWorkspace!.getMetricsManager();
    const targetWorkspaceViewMetrics = metricsManager.getViewMetrics();
    this.width_ = targetWorkspaceViewMetrics.width;

    const edgeWidth = targetWorkspaceViewMetrics.width - 2 * this.CORNER_RADIUS;
    const edgeHeight = this.getHeight() - this.CORNER_RADIUS;
    this.setBackgroundPath(edgeWidth, edgeHeight);

    const x = this.getX();
    const y = this.getY();

    this.positionAt_(this.getWidth(), this.getHeight(), x, y);
  }

  /**
   * Create and set the path for the visible boundaries of the flyout.
   *
   * @param width The width of the flyout, not including the rounded corners.
   * @param height The height of the flyout, not including rounded corners.
   */
  private setBackgroundPath(width: number, height: number) {
    const atTop = this.toolboxPosition_ === toolbox.Position.TOP;
    // Start at top left.
    const path: (string | number)[] = [
      'M 0,' + (atTop ? 0 : this.CORNER_RADIUS),
    ];

    if (atTop) {
      // Top.
      path.push('h', width + 2 * this.CORNER_RADIUS);
      // Right.
      path.push('v', height);
      // Bottom.
      path.push(
        'a',
        this.CORNER_RADIUS,
        this.CORNER_RADIUS,
        0,
        0,
        1,
        -this.CORNER_RADIUS,
        this.CORNER_RADIUS,
      );
      path.push('h', -width);
      // Left.
      path.push(
        'a',
        this.CORNER_RADIUS,
        this.CORNER_RADIUS,
        0,
        0,
        1,
        -this.CORNER_RADIUS,
        -this.CORNER_RADIUS,
      );
      path.push('z');
    } else {
      // Top.
      path.push(
        'a',
        this.CORNER_RADIUS,
        this.CORNER_RADIUS,
        0,
        0,
        1,
        this.CORNER_RADIUS,
        -this.CORNER_RADIUS,
      );
      path.push('h', width);
      // Right.
      path.push(
        'a',
        this.CORNER_RADIUS,
        this.CORNER_RADIUS,
        0,
        0,
        1,
        this.CORNER_RADIUS,
        this.CORNER_RADIUS,
      );
      path.push('v', height);
      // Bottom.
      path.push('h', -width - 2 * this.CORNER_RADIUS);
      // Left.
      path.push('z');
    }
    this.svgBackground_!.setAttribute('d', path.join(' '));
  }

  /** Scroll the flyout to the top. */
  override scrollToStart() {
    this.workspace_.scrollbar?.setX(this.RTL ? Infinity : 0);
  }

  /**
   * Scroll the flyout.
   *
   * @param e Mouse wheel scroll event.
   */
  protected override wheel_(e: WheelEvent) {
    const scrollDelta = browserEvents.getScrollDeltaPixels(e);
    const delta = scrollDelta.x || scrollDelta.y;

    if (delta) {
      const metricsManager = this.workspace_.getMetricsManager();
      const scrollMetrics = metricsManager.getScrollMetrics();
      const viewMetrics = metricsManager.getViewMetrics();

      const pos = viewMetrics.left - scrollMetrics.left + delta;
      this.workspace_.scrollbar?.setX(pos);
      // When the flyout moves from a wheel event, hide WidgetDiv and
      // dropDownDiv.
      WidgetDiv.hideIfOwnerIsInWorkspace(this.workspace_);
      dropDownDiv.hideWithoutAnimation();
    }
    // Don't scroll the page.
    e.preventDefault();
    // Don't propagate mousewheel event (zooming).
    e.stopPropagation();
  }

  /**
   * Lay out the blocks in the flyout.
   *
   * @param contents The flyout items to lay out.
   */
  protected override layout_(contents: FlyoutItem[]) {
    this.workspace_.scale = this.targetWorkspace!.scale;
    const margin = this.MARGIN;
    let cursorX = margin + this.tabWidth_;
    const cursorY = margin;
    if (this.RTL) {
      contents = contents.reverse();
    }

    for (const item of contents) {
      const rect = item.getElement().getBoundingRectangle();
      const moveX = this.RTL ? cursorX + rect.getWidth() : cursorX;
      item.getElement().moveBy(moveX, cursorY);
      cursorX += item.getElement().getBoundingRectangle().getWidth();
    }
  }

  /**
   * Determine if a drag delta is toward the workspace, based on the position
   * and orientation of the flyout. This is used in determineDragIntention_ to
   * determine if a new block should be created or if the flyout should scroll.
   *
   * @param currentDragDeltaXY How far the pointer has moved from the position
   *     at mouse down, in pixel units.
   * @returns True if the drag is toward the workspace.
   */
  override isDragTowardWorkspace(currentDragDeltaXY: Coordinate): boolean {
    const dx = currentDragDeltaXY.x;
    const dy = currentDragDeltaXY.y;
    // Direction goes from -180 to 180, with 0 toward the right and 90 on top.
    const dragDirection = (Math.atan2(dy, dx) / Math.PI) * 180;

    const range = this.dragAngleRange_;
    // Check for up or down dragging.
    if (
      (dragDirection < 90 + range && dragDirection > 90 - range) ||
      (dragDirection > -90 - range && dragDirection < -90 + range)
    ) {
      return true;
    }
    return false;
  }

  /**
   * Returns the bounding rectangle of the drag target area in pixel units
   * relative to viewport.
   *
   * @returns The component's bounding box. Null if drag target area should be
   *     ignored.
   */
  override getClientRect(): Rect | null {
    if (!this.svgGroup_ || this.autoClose || !this.isVisible()) {
      // The bounding rectangle won't compute correctly if the flyout is closed
      // and auto-close flyouts aren't valid drag targets (or delete areas).
      return null;
    }

    const flyoutRect = this.svgGroup_.getBoundingClientRect();
    // BIG_NUM is offscreen padding so that blocks dragged beyond the shown
    // flyout area are still deleted.  Must be larger than the largest screen
    // size, but be smaller than half Number.MAX_SAFE_INTEGER (not available on
    // IE).
    const BIG_NUM = 1000000000;
    const top = flyoutRect.top;

    if (this.toolboxPosition_ === toolbox.Position.TOP) {
      const height = flyoutRect.height;
      return new Rect(-BIG_NUM, top + height, -BIG_NUM, BIG_NUM);
    } else {
      // Bottom.
      return new Rect(top, BIG_NUM, -BIG_NUM, BIG_NUM);
    }
  }

  /**
   * Compute height of flyout.  toolbox.Position mat under each block.
   * For RTL: Lay out the blocks right-aligned.
   */
  protected override reflowInternal_() {
    this.workspace_.scale = this.getFlyoutScale();
    let flyoutHeight = this.getContents().reduce((maxHeightSoFar, item) => {
      return Math.max(
        maxHeightSoFar,
        item.getElement().getBoundingRectangle().getHeight(),
      );
    }, 0);
    flyoutHeight += this.MARGIN * 1.5;
    flyoutHeight *= this.workspace_.scale;
    flyoutHeight += Scrollbar.scrollbarThickness;

    if (this.getHeight() !== flyoutHeight) {
      // TODO(#7689): Remove this.
      // Workspace with no scrollbars where this is permanently open on the top.
      // If scrollbars exist they properly update the metrics.
      if (
        !this.targetWorkspace.scrollbar &&
        !this.autoClose &&
        this.targetWorkspace.getFlyout() === this &&
        this.toolboxPosition_ === toolbox.Position.TOP
      ) {
        this.targetWorkspace.translate(
          this.targetWorkspace.scrollX,
          this.targetWorkspace.scrollY + flyoutHeight,
        );
      }

      this.height_ = flyoutHeight;
      this.position();
      this.targetWorkspace.resizeContents();
      this.targetWorkspace.recordDragTargets();
    }
  }
}

registry.register(
  registry.Type.FLYOUTS_HORIZONTAL_TOOLBOX,
  registry.DEFAULT,
  HorizontalFlyout,
);
