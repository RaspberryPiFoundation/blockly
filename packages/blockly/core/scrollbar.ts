/**
 * @license
 * Copyright 2011 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Object representing a scrollbar.
 *
 * @class
 */
// Former goog.module ID: Blockly.Scrollbar

import * as browserEvents from './browser_events.js';
import * as Touch from './touch.js';
import {Coordinate} from './utils/coordinate.js';
import * as dom from './utils/dom.js';
import type {Metrics} from './utils/metrics.js';
import {Svg} from './utils/svg.js';
import * as svgMath from './utils/svg_math.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * A note on units: most of the numbers that are in CSS pixels are scaled if the
 * scrollbar is in a mutator.
 */

/**
 * Class for a pure SVG scrollbar.
 * This technique offers a scrollbar that is guaranteed to work, but may not
 * look or behave like the system's scrollbars.
 */
export class Scrollbar {
  /**
   * Width of vertical scrollbar or height of horizontal scrollbar in CSS
   * pixels. Scrollbars should be larger on touch devices.
   */
  static scrollbarThickness = Touch.TOUCH_ENABLED ? 25 : 15;

  /**
   * Default margin around the scrollbar (between the scrollbar and the edge of
   * the viewport in pixels).
   *
   * @internal
   */
  static readonly DEFAULT_SCROLLBAR_MARGIN = 0.5;

  /** Whether this scrollbar is part of a pair. */
  private readonly pair: boolean;

  /**
   * Margin around the scrollbar (between the scrollbar and the edge of the
   * viewport in pixels).
   */
  private readonly margin: number;

  /** Previously recorded metrics from the workspace. */
  private oldHostMetrics: Metrics | null = null;

  /**
   * The ratio of handle position offset to workspace content displacement.
   *
   * @internal
   */
  ratio = 1;

  /**
   * The location of the origin of the workspace that the scrollbar is in,
   * measured in CSS pixels relative to the injection div origin.  This is
   * usually (0, 0).  When the scrollbar is in a flyout it may have a
   * different origin.
   */
  private origin = new Coordinate(0, 0);

  /**
   * The position of the mouse along this scrollbar's major axis at the start
   * of the most recent drag. Units are CSS pixels, with (0, 0) at the top
   * left of the browser window. For a horizontal scrollbar this is the x
   * coordinate of the mouse down event; for a vertical scrollbar it's the y
   * coordinate of the mouse down event.
   */
  private startDragMouse = 0;

  /**
   * The length of the scrollbars (including the handle and the background),
   * in CSS pixels. This is equivalent to scrollbar background length and the
   * area within which the scrollbar handle can move.
   */
  private scrollbarLength = 0;

  /** The length of the scrollbar handle in CSS pixels. */
  private handleLength = 0;

  /**
   * The offset of the start of the handle from the scrollbar position, in CSS
   * pixels.
   */
  private handlePosition = 0;

  private startDragHandle = 0;

  /** Whether the scrollbar handle is visible. */
  private isHandleVisible = true;

  /** Whether the workspace containing this scrollbar is visible. */
  private containerVisible = true;

  /** The transparent background behind the handle. */
  private svgBackground: SVGRectElement;

  /** The visible handle that can be dragged around. */
  private svgHandle: SVGRectElement;

  /** The outermost SVG element, which contains all parts of the scrollbar. */
  private outerSvg: SVGSVGElement;

  /**
   * The upper left corner of the scrollbar's SVG group in CSS pixels relative
   * to the scrollbar's origin.  This is usually relative to the injection div
   * origin.
   *
   * @internal
   */
  position = new Coordinate(0, 0);

  /**
   * The DOM attribute that controls the length of the scrollbar. Different
   * for horizontal and vertical scrollbars.
   */
  lengthAttribute_: string;

  /**
   * The DOM attribute that controls the position of the scrollbar.
   * Different for horizontal and vertical scrollbars.
   */
  positionAttribute_: string;

  /** Handler for mouse down events on the background of the scrollbar. */
  onMouseDownBarWrapper_: browserEvents.Data;

  /** Handler for mouse down events on the handle of the scrollbar. */
  onMouseDownHandleWrapper_: browserEvents.Data;

  /** Handler for mouse move events during scrollbar drags. */
  onMouseUpWrapper_: browserEvents.Data | null = null;

  /** Handler for mouse up events to end scrollbar drags. */
  onMouseMoveWrapper_: browserEvents.Data | null = null;

  /**
   * @param workspace Workspace to bind the scrollbar to.
   * @param horizontal True if horizontal, false if vertical.
   * @param opt_pair True if scrollbar is part of a horiz/vert pair.
   * @param opt_class A class to be applied to this scrollbar.
   * @param opt_margin The margin to apply to this scrollbar.
   */
  constructor(
    private workspace: WorkspaceSvg,
    private readonly horizontal: boolean,
    opt_pair?: boolean,
    opt_class?: string,
    opt_margin?: number,
  ) {
    this.pair = opt_pair || false;

    this.margin =
      opt_margin !== undefined
        ? opt_margin
        : Scrollbar.DEFAULT_SCROLLBAR_MARGIN;

    let className =
      'blocklyScrollbar' + (this.horizontal ? 'Horizontal' : 'Vertical');
    if (opt_class) {
      className += ' ' + opt_class;
    }

    /* Create the following DOM:
      <svg class="blocklyScrollbarHorizontal optionalClass">
        <g>
          <rect class="blocklyScrollbarBackground" />
          <rect class="blocklyScrollbarHandle" rx="8" ry="8" />
        </g>
      </svg>
    */
    this.outerSvg = dom.createSvgElement(Svg.SVG, {'class': className});
    // Child group to hold the handle and background together.
    const group = dom.createSvgElement(Svg.G, {}, this.outerSvg);

    this.svgBackground = dom.createSvgElement(
      Svg.RECT,
      {'class': 'blocklyScrollbarBackground'},
      group,
    );

    const radius = Math.floor((Scrollbar.scrollbarThickness - 5) / 2);
    this.svgHandle = dom.createSvgElement(
      Svg.RECT,
      {'class': 'blocklyScrollbarHandle', 'rx': radius, 'ry': radius},
      group,
    );

    this.workspace
      .getThemeManager()
      .subscribe(this.svgHandle, 'scrollbarColour', 'fill');
    this.workspace
      .getThemeManager()
      .subscribe(this.svgHandle, 'scrollbarOpacity', 'fill-opacity');

    // Add everything to the DOM.
    dom.insertAfter(this.outerSvg, this.workspace.getParentSvg());

    this.setInitialThickness();

    if (horizontal) {
      this.lengthAttribute_ = 'width';
      this.positionAttribute_ = 'x';
    } else {
      this.lengthAttribute_ = 'height';
      this.positionAttribute_ = 'y';
    }

    this.onMouseDownBarWrapper_ = browserEvents.conditionalBind(
      this.svgBackground,
      'pointerdown',
      this,
      this.onMouseDownBar,
    );
    this.onMouseDownHandleWrapper_ = browserEvents.conditionalBind(
      this.svgHandle,
      'pointerdown',
      this,
      this.onMouseDownHandle,
    );
  }

  /**
   * Set the size of the scrollbar DOM elements along the minor axis.
   */
  private setInitialThickness() {
    const scrollbarThickness = Scrollbar.scrollbarThickness;
    if (this.horizontal) {
      this.svgBackground.setAttribute('height', String(scrollbarThickness));
      this.outerSvg.setAttribute('height', String(scrollbarThickness));
      this.svgHandle.setAttribute('height', String(scrollbarThickness - 5));
      this.svgHandle.setAttribute('y', '2.5');
    } else {
      this.svgBackground.setAttribute('width', String(scrollbarThickness));
      this.outerSvg.setAttribute('width', String(scrollbarThickness));
      this.svgHandle.setAttribute('width', String(scrollbarThickness - 5));
      this.svgHandle.setAttribute('x', '2.5');
    }
  }

  /**
   * Dispose of this scrollbar. Remove DOM elements, event listeners,
   * and theme subscriptions.
   */
  dispose() {
    this.cleanUp();
    browserEvents.unbind(this.onMouseDownBarWrapper_);
    browserEvents.unbind(this.onMouseDownHandleWrapper_);

    dom.removeNode(this.outerSvg);
    this.workspace.getThemeManager().unsubscribe(this.svgHandle);
  }

  /**
   * Constrain the handle's length within the minimum (0) and maximum
   * (scrollbar background) values allowed for the scrollbar.
   *
   * @param value Value that is potentially out of bounds, in CSS pixels.
   * @returns Constrained value, in CSS pixels.
   */
  private constrainHandleLength(value: number): number {
    if (value <= 0 || isNaN(value)) {
      value = 0;
    } else {
      value = Math.min(value, this.scrollbarLength);
    }
    return value;
  }

  /**
   * Set the length of the scrollbar's handle and change the SVG attribute
   * accordingly.
   *
   * @param newLength The new scrollbar handle length in CSS pixels.
   */
  private setHandleLength(newLength: number) {
    this.handleLength = newLength;
    this.svgHandle.setAttribute(
      this.lengthAttribute_,
      String(this.handleLength),
    );
  }

  /**
   * Constrain the handle's position within the minimum (0) and maximum values
   * allowed for the scrollbar.
   *
   * @param value Value that is potentially out of bounds, in CSS pixels.
   * @returns Constrained value, in CSS pixels.
   */
  private constrainHandlePosition(value: number): number {
    if (value <= 0 || isNaN(value)) {
      value = 0;
    } else {
      // Handle length should never be greater than this.scrollbarLength_.
      // If the viewSize is greater than or equal to the scrollSize, the
      // handleLength will end up equal to this.scrollbarLength_.
      value = Math.min(value, this.scrollbarLength - this.handleLength);
    }
    return value;
  }

  /**
   * Set the offset of the scrollbar's handle from the scrollbar's position, and
   * change the SVG attribute accordingly.
   *
   * @param newPosition The new scrollbar handle offset in CSS pixels.
   */
  setHandlePosition(newPosition: number) {
    this.handlePosition = newPosition;
    this.svgHandle.setAttribute(
      this.positionAttribute_,
      String(this.handlePosition),
    );
  }

  /**
   * Set the size of the scrollbar's background and change the SVG attribute
   * accordingly.
   *
   * @param newSize The new scrollbar background length in CSS pixels.
   */
  private setScrollbarLength(newSize: number) {
    this.scrollbarLength = newSize;
    this.outerSvg.setAttribute(
      this.lengthAttribute_,
      String(this.scrollbarLength),
    );
    this.svgBackground.setAttribute(
      this.lengthAttribute_,
      String(this.scrollbarLength),
    );
  }

  /**
   * Set the position of the scrollbar's SVG group in CSS pixels relative to the
   * scrollbar's origin.  This sets the scrollbar's location within the
   * workspace.
   *
   * @param x The new x coordinate.
   * @param y The new y coordinate.
   * @internal
   */
  setPosition(x: number, y: number) {
    this.position.x = x;
    this.position.y = y;

    const tempX = this.position.x + this.origin.x;
    const tempY = this.position.y + this.origin.y;
    const transform = 'translate(' + tempX + 'px,' + tempY + 'px)';
    dom.setCssTransform(this.outerSvg, transform);
  }

  /**
   * Recalculate the scrollbar's location and its length.
   *
   * @param opt_metrics A data structure of from the describing all the required
   *     dimensions.  If not provided, it will be fetched from the host object.
   */
  resize(opt_metrics?: Metrics) {
    // Determine the location, height and width of the host element.
    let hostMetrics = opt_metrics;
    if (!hostMetrics) {
      hostMetrics = this.workspace.getMetrics();
      if (!hostMetrics) {
        // Host element is likely not visible.
        return;
      }
    }

    if (
      this.oldHostMetrics &&
      Scrollbar.metricsAreEquivalent(hostMetrics, this.oldHostMetrics)
    ) {
      return;
    }

    if (this.horizontal) {
      this.resizeHorizontal(hostMetrics);
    } else {
      this.resizeVertical(hostMetrics);
    }

    this.oldHostMetrics = hostMetrics;

    // Resizing may have caused some scrolling.
    this.updateMetrics();
  }

  /**
   * Returns whether the a resizeView is necessary by comparing the passed
   * hostMetrics with cached old host metrics.
   *
   * @param hostMetrics A data structure describing all the required dimensions,
   *     possibly fetched from the host object.
   * @returns Whether a resizeView is necessary.
   */
  private requiresViewResize(hostMetrics: Metrics): boolean {
    if (!this.oldHostMetrics) {
      return true;
    }
    return (
      this.oldHostMetrics.viewWidth !== hostMetrics.viewWidth ||
      this.oldHostMetrics.viewHeight !== hostMetrics.viewHeight ||
      this.oldHostMetrics.absoluteLeft !== hostMetrics.absoluteLeft ||
      this.oldHostMetrics.absoluteTop !== hostMetrics.absoluteTop
    );
  }

  /**
   * Recalculate a horizontal scrollbar's location and length.
   *
   * @param hostMetrics A data structure describing all the required dimensions,
   *     possibly fetched from the host object.
   */
  private resizeHorizontal(hostMetrics: Metrics) {
    if (this.requiresViewResize(hostMetrics)) {
      this.resizeViewHorizontal(hostMetrics);
    } else {
      this.resizeContentHorizontal(hostMetrics);
    }
  }

  /**
   * Recalculate a horizontal scrollbar's location on the screen and path
   * length. This should be called when the layout or size of the window has
   * changed.
   *
   * @param hostMetrics A data structure describing all the required dimensions,
   *     possibly fetched from the host object.
   */
  resizeViewHorizontal(hostMetrics: Metrics) {
    let viewSize = hostMetrics.viewWidth - this.margin * 2;
    if (this.pair) {
      // Shorten the scrollbar to make room for the corner square.
      viewSize -= Scrollbar.scrollbarThickness;
    }
    this.setScrollbarLength(Math.max(0, viewSize));

    let xCoordinate = hostMetrics.absoluteLeft + this.margin;
    if (this.pair && this.workspace.RTL) {
      xCoordinate += Scrollbar.scrollbarThickness;
    }

    // Horizontal toolbar should always be just above the bottom of the
    // workspace.
    const yCoordinate =
      hostMetrics.absoluteTop +
      hostMetrics.viewHeight -
      Scrollbar.scrollbarThickness -
      this.margin;
    this.setPosition(xCoordinate, yCoordinate);

    // If the view has been resized, a content resize will also be necessary.
    // The reverse is not true.
    this.resizeContentHorizontal(hostMetrics);
  }

  /**
   * Recalculate a horizontal scrollbar's location within its path and length.
   * This should be called when the contents of the workspace have changed.
   *
   * @param hostMetrics A data structure describing all the required dimensions,
   *     possibly fetched from the host object.
   */
  resizeContentHorizontal(hostMetrics: Metrics) {
    if (hostMetrics.viewWidth >= hostMetrics.scrollWidth) {
      // viewWidth is often greater than scrollWidth in flyouts and
      // non-scrollable workspaces.
      this.setHandleLength(this.scrollbarLength);
      this.setHandlePosition(0);
      if (!this.pair) {
        // The scrollbar isn't needed.
        // This doesn't apply to scrollbar pairs because interactions with the
        // corner square aren't handled.
        this.setVisible(false);
      }
      return;
    } else if (!this.pair) {
      // The scrollbar is needed. Only non-paired scrollbars are hidden/shown.
      this.setVisible(true);
    }

    // Resize the handle.
    let handleLength =
      (this.scrollbarLength * hostMetrics.viewWidth) / hostMetrics.scrollWidth;
    handleLength = this.constrainHandleLength(handleLength);
    this.setHandleLength(handleLength);

    // Compute the handle offset.
    // The position of the handle can be between:
    //     0 and this.scrollbarLength_ - handleLength
    // If viewLeft === scrollLeft
    //     then the offset should be 0
    // If viewRight === scrollRight
    //     then viewLeft = scrollLeft + scrollWidth - viewWidth
    //     then the offset should be max offset

    const maxScrollDistance = hostMetrics.scrollWidth - hostMetrics.viewWidth;
    const contentDisplacement = hostMetrics.viewLeft - hostMetrics.scrollLeft;
    // Percent of content to the left of our current position.
    const offsetRatio = contentDisplacement / maxScrollDistance;
    // Area available to scroll * percent to the left
    const maxHandleOffset = this.scrollbarLength - this.handleLength;
    let handleOffset = maxHandleOffset * offsetRatio;
    handleOffset = this.constrainHandlePosition(handleOffset);
    this.setHandlePosition(handleOffset);

    // Compute ratio (for use with set calls, which pass in content
    // displacement).
    this.ratio = maxHandleOffset / maxScrollDistance;
  }

  /**
   * Recalculate a vertical scrollbar's location and length.
   *
   * @param hostMetrics A data structure describing all the required dimensions,
   *     possibly fetched from the host object.
   */
  private resizeVertical(hostMetrics: Metrics) {
    if (this.requiresViewResize(hostMetrics)) {
      this.resizeViewVertical(hostMetrics);
    } else {
      this.resizeContentVertical(hostMetrics);
    }
  }

  /**
   * Recalculate a vertical scrollbar's location on the screen and path length.
   * This should be called when the layout or size of the window has changed.
   *
   * @param hostMetrics A data structure describing all the required dimensions,
   *     possibly fetched from the host object.
   */
  resizeViewVertical(hostMetrics: Metrics) {
    let viewSize = hostMetrics.viewHeight - this.margin * 2;
    if (this.pair) {
      // Shorten the scrollbar to make room for the corner square.
      viewSize -= Scrollbar.scrollbarThickness;
    }
    this.setScrollbarLength(Math.max(0, viewSize));

    const xCoordinate = this.workspace.RTL
      ? hostMetrics.absoluteLeft + this.margin
      : hostMetrics.absoluteLeft +
        hostMetrics.viewWidth -
        Scrollbar.scrollbarThickness -
        this.margin;

    const yCoordinate = hostMetrics.absoluteTop + this.margin;
    this.setPosition(xCoordinate, yCoordinate);

    // If the view has been resized, a content resize will also be necessary.
    // The reverse is not true.
    this.resizeContentVertical(hostMetrics);
  }

  /**
   * Recalculate a vertical scrollbar's location within its path and length.
   * This should be called when the contents of the workspace have changed.
   *
   * @param hostMetrics A data structure describing all the required dimensions,
   *     possibly fetched from the host object.
   */
  resizeContentVertical(hostMetrics: Metrics) {
    if (hostMetrics.viewHeight >= hostMetrics.scrollHeight) {
      // viewHeight is often greater than scrollHeight in flyouts and
      // non-scrollable workspaces.
      this.setHandleLength(this.scrollbarLength);
      this.setHandlePosition(0);
      if (!this.pair) {
        // The scrollbar isn't needed.
        // This doesn't apply to scrollbar pairs because interactions with the
        // corner square aren't handled.
        this.setVisible(false);
      }
      return;
    } else if (!this.pair) {
      // The scrollbar is needed. Only non-paired scrollbars are hidden/shown.
      this.setVisible(true);
    }

    // Resize the handle.
    let handleLength =
      (this.scrollbarLength * hostMetrics.viewHeight) /
      hostMetrics.scrollHeight;
    handleLength = this.constrainHandleLength(handleLength);
    this.setHandleLength(handleLength);

    // Compute the handle offset.
    // The position of the handle can be between:
    //     0 and this.scrollbarLength_ - handleLength
    // If viewTop === scrollTop
    //     then the offset should be 0
    // If viewBottom === scrollBottom
    //     then viewTop = scrollTop + scrollHeight - viewHeight
    //     then the offset should be max offset

    const maxScrollDistance = hostMetrics.scrollHeight - hostMetrics.viewHeight;
    const contentDisplacement = hostMetrics.viewTop - hostMetrics.scrollTop;
    // Percent of content to the left of our current position.
    const offsetRatio = contentDisplacement / maxScrollDistance;
    // Area available to scroll * percent to the left
    const maxHandleOffset = this.scrollbarLength - this.handleLength;
    let handleOffset = maxHandleOffset * offsetRatio;
    handleOffset = this.constrainHandlePosition(handleOffset);
    this.setHandlePosition(handleOffset);

    // Compute ratio (for use with set calls, which pass in content
    // displacement).
    this.ratio = maxHandleOffset / maxScrollDistance;
  }

  /**
   * Is the scrollbar visible.  Non-paired scrollbars disappear when they aren't
   * needed.
   *
   * @returns True if visible.
   */
  isVisible(): boolean {
    return this.isHandleVisible;
  }

  /**
   * Set whether the scrollbar's container is visible and update
   * display accordingly if visibility has changed.
   *
   * @param visible Whether the container is visible
   */
  setContainerVisible(visible: boolean) {
    const visibilityChanged = visible !== this.containerVisible;

    this.containerVisible = visible;
    if (visibilityChanged) {
      this.updateDisplay_();
    }
  }

  /**
   * Set whether the scrollbar is visible.
   * Only applies to non-paired scrollbars.
   *
   * @param visible True if visible.
   */
  setVisible(visible: boolean) {
    // Ideally this would also apply to scrollbar pairs, but that's a bigger
    // headache (due to interactions with the corner square), and the fact
    // that telling the pair to resize itself would cause circular dependencies.
    if (this.pair) {
      throw Error('Unable to toggle visibility of paired scrollbars.');
    }
    this.setVisibleInternal(visible);
  }

  /**
   * Set whether the scrollbar is visible. Bypasses checking whether this
   * scrollbar is part of a pair so that it can be toggled by the scrollbar
   * pair.
   *
   * @param visible True if visible.
   * @internal
   */
  setVisibleInternal(visible: boolean) {
    const visibilityChanged = visible !== this.isVisible();
    this.isHandleVisible = visible;
    if (visibilityChanged) {
      this.updateDisplay_();
    }
  }

  /**
   * Update visibility of scrollbar based on whether it thinks it should
   * be visible and whether its containing workspace is visible.
   * We cannot rely on the containing workspace being hidden to hide us
   * because it is not necessarily our parent in the DOM.
   */
  updateDisplay_() {
    let show = true;
    // Check whether our parent/container is visible.
    if (!this.containerVisible) {
      show = false;
    } else {
      show = this.isVisible();
    }
    if (show) {
      this.outerSvg.setAttribute('display', 'block');
    } else {
      this.outerSvg.setAttribute('display', 'none');
    }
  }

  /**
   * Scroll by one pageful.
   * Called when scrollbar background is clicked.
   *
   * @param e Mouse down event.
   */
  private onMouseDownBar(e: MouseEvent) {
    this.workspace.markFocused();
    Touch.clearTouchIdentifier(); // This is really a click.
    this.cleanUp();
    if (browserEvents.isRightButton(e)) {
      // Right-click.
      // Scrollbars have no context menu.
      e.stopPropagation();
      return;
    }
    const mouseXY = browserEvents.mouseToSvg(
      e,
      this.workspace.getParentSvg(),
      this.workspace.getInverseScreenCTM(),
    );
    const mouseLocation = this.horizontal ? mouseXY.x : mouseXY.y;

    const handleXY = svgMath.getInjectionDivXY(this.svgHandle);
    const handleStart = this.horizontal ? handleXY.x : handleXY.y;
    let handlePosition = this.handlePosition;

    const pageLength = this.handleLength * 0.95;
    if (mouseLocation <= handleStart) {
      // Decrease the scrollbar's value by a page.
      handlePosition -= pageLength;
    } else if (mouseLocation >= handleStart + this.handleLength) {
      // Increase the scrollbar's value by a page.
      handlePosition += pageLength;
    }

    this.setHandlePosition(this.constrainHandlePosition(handlePosition));

    this.updateMetrics();
    e.stopPropagation();
    e.preventDefault();
  }

  /**
   * Start a dragging operation.
   * Called when scrollbar handle is clicked.
   *
   * @param e Mouse down event.
   */
  private onMouseDownHandle(e: PointerEvent) {
    this.workspace.markFocused();
    this.cleanUp();
    if (browserEvents.isRightButton(e)) {
      // Right-click.
      // Scrollbars have no context menu.
      e.stopPropagation();
      return;
    }
    // Look up the current translation and record it.
    this.startDragHandle = this.handlePosition;

    // Record the current mouse position.
    this.startDragMouse = this.horizontal ? e.clientX : e.clientY;
    this.onMouseUpWrapper_ = browserEvents.conditionalBind(
      document,
      'pointerup',
      this,
      this.onMouseUpHandle,
    );
    this.onMouseMoveWrapper_ = browserEvents.conditionalBind(
      document,
      'pointermove',
      this,
      this.onMouseMoveHandle,
    );
    e.stopPropagation();
    e.preventDefault();
  }

  /**
   * Drag the scrollbar's handle.
   *
   * @param e Mouse move event.
   */
  private onMouseMoveHandle(e: PointerEvent) {
    const currentMouse = this.horizontal ? e.clientX : e.clientY;
    const mouseDelta = currentMouse - this.startDragMouse;
    const handlePosition = this.startDragHandle + mouseDelta;
    // Position the bar.
    this.setHandlePosition(this.constrainHandlePosition(handlePosition));
    this.updateMetrics();
  }

  /** Release the scrollbar handle and reset state accordingly. */
  private onMouseUpHandle() {
    Touch.clearTouchIdentifier();
    this.cleanUp();
  }

  /**
   * Hide chaff and stop binding to mouseup and mousemove events.  Call this to
   * wrap up loose ends associated with the scrollbar.
   */
  private cleanUp() {
    this.workspace.hideChaff(true);
    if (this.onMouseUpWrapper_) {
      browserEvents.unbind(this.onMouseUpWrapper_);
      this.onMouseUpWrapper_ = null;
    }
    if (this.onMouseMoveWrapper_) {
      browserEvents.unbind(this.onMouseMoveWrapper_);
      this.onMouseMoveWrapper_ = null;
    }
  }

  /**
   * Helper to calculate the ratio of handle position to scrollbar view size.
   *
   * @returns Ratio.
   * @internal
   */
  getRatio_(): number {
    const scrollHandleRange = this.scrollbarLength - this.handleLength;
    let ratio = this.handlePosition / scrollHandleRange;
    if (isNaN(ratio)) {
      ratio = 0;
    }
    return ratio;
  }

  /**
   * Updates workspace metrics based on new scroll ratio. Called when scrollbar
   * is moved.
   */
  private updateMetrics() {
    const ratio = this.getRatio_();
    if (this.horizontal) {
      this.workspace.setMetrics({x: ratio});
    } else {
      this.workspace.setMetrics({y: ratio});
    }
  }

  /**
   * Set the scrollbar handle's position.
   *
   * @param value The content displacement, relative to the view in pixels.
   * @param updateMetrics Whether to update metrics on this set call.
   *    Defaults to true.
   */
  set(value: number, updateMetrics?: boolean) {
    this.setHandlePosition(this.constrainHandlePosition(value * this.ratio));
    if (updateMetrics || updateMetrics === undefined) {
      this.updateMetrics();
    }
  }

  /**
   * Record the origin of the workspace that the scrollbar is in, in pixels
   * relative to the injection div origin. This is for times when the scrollbar
   * is used in an object whose origin isn't the same as the main workspace
   * (e.g. in a flyout.)
   *
   * @param x The x coordinate of the scrollbar's origin, in CSS pixels.
   * @param y The y coordinate of the scrollbar's origin, in CSS pixels.
   */
  setOrigin(x: number, y: number) {
    this.origin = new Coordinate(x, y);
  }

  /**
   * @param first An object containing computed measurements of a workspace.
   * @param second Another object containing computed measurements of a
   *     workspace.
   * @returns Whether the two sets of metrics are equivalent.
   */
  private static metricsAreEquivalent(
    first: Metrics,
    second: Metrics,
  ): boolean {
    return (
      first.viewWidth === second.viewWidth &&
      first.viewHeight === second.viewHeight &&
      first.viewLeft === second.viewLeft &&
      first.viewTop === second.viewTop &&
      first.absoluteTop === second.absoluteTop &&
      first.absoluteLeft === second.absoluteLeft &&
      first.scrollWidth === second.scrollWidth &&
      first.scrollHeight === second.scrollHeight &&
      first.scrollLeft === second.scrollLeft &&
      first.scrollTop === second.scrollTop
    );
  }
}
