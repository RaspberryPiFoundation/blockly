/**
 * @license
 * Copyright 2011 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Object representing a pair of scrollbars.
 *
 * @class
 */
// Former goog.module ID: Blockly.ScrollbarPair

import * as eventUtils from './events/utils.js';
import {Scrollbar} from './scrollbar.js';
import * as dom from './utils/dom.js';
import type {Metrics} from './utils/metrics.js';
import {Svg} from './utils/svg.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Class for a pair of scrollbars.  Horizontal and vertical.
 */
export class ScrollbarPair {
  hScroll: Scrollbar | null = null;
  vScroll: Scrollbar | null = null;
  corner_: SVGRectElement | null = null;

  /** Previously recorded metrics from the workspace. */
  private oldHostMetrics: Metrics | null = null;

  /**
   * @param workspace Workspace to bind the scrollbars to.
   * @param addHorizontal Whether to add a horizontal scrollbar.
   *    Defaults to true.
   * @param addVertical Whether to add a vertical scrollbar. Defaults to true.
   * @param opt_class A class to be applied to these scrollbars.
   * @param opt_margin The margin to apply to these scrollbars.
   */
  constructor(
    private workspace: WorkspaceSvg,
    addHorizontal?: boolean,
    addVertical?: boolean,
    opt_class?: string,
    opt_margin?: number,
  ) {
    addHorizontal = addHorizontal === undefined ? true : addHorizontal;
    addVertical = addVertical === undefined ? true : addVertical;
    const isPair = addHorizontal && addVertical;

    if (addHorizontal) {
      this.hScroll = new Scrollbar(
        workspace,
        true,
        isPair,
        opt_class,
        opt_margin,
      );
    }
    if (addVertical) {
      this.vScroll = new Scrollbar(
        workspace,
        false,
        isPair,
        opt_class,
        opt_margin,
      );
    }

    if (isPair) {
      this.corner_ = dom.createSvgElement(Svg.RECT, {
        'height': Scrollbar.scrollbarThickness,
        'width': Scrollbar.scrollbarThickness,
        'class': 'blocklyScrollbarBackground',
      });
      dom.insertAfter(this.corner_, workspace.getBubbleCanvas());
    }
  }

  /**
   * Dispose of this pair of scrollbars.
   * Unlink from all DOM elements to prevent memory leaks.
   */
  dispose() {
    dom.removeNode(this.corner_);
    this.corner_ = null;
    this.oldHostMetrics = null;
    if (this.hScroll) {
      this.hScroll.dispose();
      this.hScroll = null;
    }
    if (this.vScroll) {
      this.vScroll.dispose();
      this.vScroll = null;
    }
  }

  /**
   * Recalculate both of the scrollbars' locations and lengths.
   * Also reposition the corner rectangle.
   */
  resize() {
    // Look up the host metrics once, and use for both scrollbars.
    const hostMetrics = this.workspace.getMetrics();
    if (!hostMetrics) {
      // Host element is likely not visible.
      return;
    }

    // Only change the scrollbars if there has been a change in metrics.
    let resizeH = false;
    let resizeV = false;
    if (
      !this.oldHostMetrics ||
      this.oldHostMetrics.viewWidth !== hostMetrics.viewWidth ||
      this.oldHostMetrics.viewHeight !== hostMetrics.viewHeight ||
      this.oldHostMetrics.absoluteTop !== hostMetrics.absoluteTop ||
      this.oldHostMetrics.absoluteLeft !== hostMetrics.absoluteLeft
    ) {
      // The window has been resized or repositioned.
      resizeH = true;
      resizeV = true;
    } else {
      // Has the content been resized or moved?
      if (
        !this.oldHostMetrics ||
        this.oldHostMetrics.scrollWidth !== hostMetrics.scrollWidth ||
        this.oldHostMetrics.viewLeft !== hostMetrics.viewLeft ||
        this.oldHostMetrics.scrollLeft !== hostMetrics.scrollLeft
      ) {
        resizeH = true;
      }
      if (
        !this.oldHostMetrics ||
        this.oldHostMetrics.scrollHeight !== hostMetrics.scrollHeight ||
        this.oldHostMetrics.viewTop !== hostMetrics.viewTop ||
        this.oldHostMetrics.scrollTop !== hostMetrics.scrollTop
      ) {
        resizeV = true;
      }
    }

    if (resizeH || resizeV) {
      try {
        eventUtils.disable();
        if (this.hScroll && resizeH) {
          this.hScroll.resize(hostMetrics);
        }
        if (this.vScroll && resizeV) {
          this.vScroll.resize(hostMetrics);
        }
      } finally {
        eventUtils.enable();
      }
      this.workspace.maybeFireViewportChangeEvent();
    }

    if (this.hScroll && this.vScroll) {
      // Reposition the corner square.
      if (
        !this.oldHostMetrics ||
        this.oldHostMetrics.viewWidth !== hostMetrics.viewWidth ||
        this.oldHostMetrics.absoluteLeft !== hostMetrics.absoluteLeft
      ) {
        this.corner_?.setAttribute('x', String(this.vScroll.position.x));
      }
      if (
        !this.oldHostMetrics ||
        this.oldHostMetrics.viewHeight !== hostMetrics.viewHeight ||
        this.oldHostMetrics.absoluteTop !== hostMetrics.absoluteTop
      ) {
        this.corner_?.setAttribute('y', String(this.hScroll.position.y));
      }
    }

    // Cache the current metrics to potentially short-cut the next resize event.
    this.oldHostMetrics = hostMetrics;
  }

  /**
   * Returns whether scrolling horizontally is enabled.
   *
   * @returns True if horizontal scroll is enabled.
   */
  canScrollHorizontally(): boolean {
    return !!this.hScroll;
  }

  /**
   * Returns whether scrolling vertically is enabled.
   *
   * @returns True if vertical scroll is enabled.
   */
  canScrollVertically(): boolean {
    return !!this.vScroll;
  }

  /**
   * Record the origin of the workspace that the scrollbar is in, in pixels
   * relative to the injection div origin. This is for times when the scrollbar
   * is used in an object whose origin isn't the same as the main workspace
   * (e.g. in a flyout.)
   *
   * @param x The x coordinate of the scrollbar's origin, in CSS pixels.
   * @param y The y coordinate of the scrollbar's origin, in CSS pixels.
   * @internal
   */
  setOrigin(x: number, y: number) {
    if (this.hScroll) {
      this.hScroll.setOrigin(x, y);
    }
    if (this.vScroll) {
      this.vScroll.setOrigin(x, y);
    }
  }

  /**
   * Set the handles of both scrollbars.
   *
   * @param x The horizontal content displacement, relative to the view in
   *     pixels.
   * @param y The vertical content displacement, relative to the view in pixels.
   * @param updateMetrics Whether to update metrics on this set call.
   *    Defaults to true.
   */
  set(x: number, y: number, updateMetrics: boolean) {
    // This function is equivalent to:
    //   this.hScroll.set(x);
    //   this.vScroll.set(y);
    // However, that calls setMetrics twice which causes a chain of
    // getAttribute->setAttribute->getAttribute resulting in an extra layout
    // pass. Combining them speeds up rendering.
    if (this.hScroll) {
      this.hScroll.set(x, false);
    }
    if (this.vScroll) {
      this.vScroll.set(y, false);
    }

    if (updateMetrics || updateMetrics === undefined) {
      // Update metrics.
      const xyRatio: {x?: number; y?: number} = {};
      if (this.hScroll) {
        xyRatio.x = this.hScroll.getRatio_();
      }
      if (this.vScroll) {
        xyRatio.y = this.vScroll.getRatio_();
      }
      this.workspace.setMetrics(xyRatio);
    }
  }

  /**
   * Set the handle of the horizontal scrollbar to be at a certain position in
   *    CSS pixels relative to its parents.
   *
   * @param x Horizontal scroll value.
   */
  setX(x: number) {
    if (this.hScroll) {
      this.hScroll.set(x, true);
    }
  }

  /**
   * Set the handle of the vertical scrollbar to be at a certain position in
   *    CSS pixels relative to its parents.
   *
   * @param y Vertical scroll value.
   */
  setY(y: number) {
    if (this.vScroll) {
      this.vScroll.set(y, true);
    }
  }

  /**
   * Set whether this scrollbar's container is visible.
   *
   * @param visible Whether the container is visible.
   */
  setContainerVisible(visible: boolean) {
    if (this.hScroll) {
      this.hScroll.setContainerVisible(visible);
    }
    if (this.vScroll) {
      this.vScroll.setContainerVisible(visible);
    }
  }

  /**
   * If any of the scrollbars are visible. Non-paired scrollbars may disappear
   * when they aren't needed.
   *
   * @returns True if visible.
   */
  isVisible(): boolean {
    let isVisible = false;
    if (this.hScroll) {
      isVisible = this.hScroll.isVisible();
    }
    if (this.vScroll) {
      isVisible = isVisible || this.vScroll.isVisible();
    }
    return isVisible;
  }

  /**
   * Sets the visibility of any existing scrollbars.
   *
   * @param visible True if visible.
   */
  setVisible(visible: boolean) {
    if (this.hScroll) this.hScroll.setVisibleInternal(visible);
    if (this.vScroll) this.vScroll.setVisibleInternal(visible);
  }

  /**
   * Recalculates the scrollbars' locations within their path and length.
   * This should be called when the contents of the workspace have changed.
   *
   * @param hostMetrics A data structure describing all the required dimensions,
   *     possibly fetched from the host object.
   */
  resizeContent(hostMetrics: Metrics) {
    if (this.hScroll) {
      this.hScroll.resizeContentHorizontal(hostMetrics);
    }
    if (this.vScroll) {
      this.vScroll.resizeContentVertical(hostMetrics);
    }
  }

  /**
   * Recalculates the scrollbars' locations on the screen and path length.
   * This should be called when the layout or size of the window has changed.
   *
   * @param hostMetrics A data structure describing all the required dimensions,
   *     possibly fetched from the host object.
   */
  resizeView(hostMetrics: Metrics) {
    if (this.hScroll) {
      this.hScroll.resizeViewHorizontal(hostMetrics);
    }
    if (this.vScroll) {
      this.vScroll.resizeViewVertical(hostMetrics);
    }
  }
}
