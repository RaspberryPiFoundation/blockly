/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as browserEvents from '../browser_events.js';
import * as common from '../common.js';
import {BubbleDragStrategy} from '../dragging/bubble_drag_strategy.js';
import {getFocusManager} from '../focus_manager.js';
import {IBubble} from '../interfaces/i_bubble.js';
import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import type {IFocusableTree} from '../interfaces/i_focusable_tree.js';
import type {IHasBubble} from '../interfaces/i_has_bubble.js';
import {ISelectable} from '../interfaces/i_selectable.js';
import {ContainerRegion} from '../metrics_manager.js';
import {Scrollbar} from '../scrollbar.js';
import {Coordinate} from '../utils/coordinate.js';
import * as dom from '../utils/dom.js';
import * as idGenerator from '../utils/idgenerator.js';
import * as math from '../utils/math.js';
import {Rect} from '../utils/rect.js';
import {Size} from '../utils/size.js';
import {Svg} from '../utils/svg.js';
import {WorkspaceSvg} from '../workspace_svg.js';

/**
 * The abstract pop-up bubble class. This creates a UI that looks like a speech
 * bubble, where it has a "tail" that points to the block, and a "head" that
 * displays arbitrary svg elements.
 */
export abstract class Bubble implements IBubble, ISelectable, IFocusableNode {
  /** The width of the border around the bubble. */
  static readonly BORDER_WIDTH = 6;

  /** Double the width of the border around the bubble. */
  static readonly DOUBLE_BORDER = this.BORDER_WIDTH * 2;

  /** The minimum size the bubble can have. */
  static readonly MIN_SIZE = this.DOUBLE_BORDER;

  /**
   * The thickness of the base of the tail in relation to the size of the
   * bubble. Higher numbers result in thinner tails.
   */
  static readonly TAIL_THICKNESS = 1;

  /** The number of degrees that the tail bends counter-clockwise. */
  static readonly TAIL_ANGLE = 20;

  /**
   * The sharpness of the tail's bend. Higher numbers result in smoother
   * tails.
   */
  static readonly TAIL_BEND = 4;

  /** Distance between arrow point and anchor point. */
  static readonly ANCHOR_RADIUS = 8;

  public id: string;

  /** The SVG group containing all parts of the bubble. */
  protected svgRoot: SVGGElement;

  /** The SVG path for the arrow from the anchor to the bubble. */
  private tail: SVGPathElement;

  /** The SVG background rect for the main body of the bubble. */
  private background: SVGRectElement;

  /** The SVG group containing the contents of the bubble. */
  protected contentContainer: SVGGElement;

  /**
   * The size of the bubble (including background and contents but not tail).
   */
  private size = new Size(0, 0);

  /** The colour of the background of the bubble. */
  private colour = '#ffffff';

  /** True if the bubble has been disposed, false otherwise. */
  public disposed = false;

  /** The position of the top of the bubble relative to its anchor. */
  private relativeTop = 0;

  /** The position of the left of the bubble realtive to its anchor. */
  private relativeLeft = 0;

  private dragStrategy = new BubbleDragStrategy(this, this.workspace);

  private focusableElement: SVGElement | HTMLElement;

  /**
   * @param workspace The workspace this bubble belongs to.
   * @param anchor The anchor location of the thing this bubble is attached to.
   *     The tail of the bubble will point to this location.
   * @param ownerRect An optional rect we don't want the bubble to overlap with
   *     when automatically positioning.
   * @param overriddenFocusableElement An optional replacement to the focusable
   *     element that's represented by this bubble (as a focusable node). This
   *     element will have its ID overwritten. If not provided, the focusable
   *     element of this node will default to the bubble's SVG root.
   * @param owner The object responsible for hosting/spawning this bubble.
   */
  constructor(
    public readonly workspace: WorkspaceSvg,
    protected anchor: Coordinate,
    protected ownerRect?: Rect,
    overriddenFocusableElement?: SVGElement | HTMLElement,
    protected owner?: IHasBubble & IFocusableNode,
  ) {
    this.id = idGenerator.getNextUniqueId();
    this.svgRoot = dom.createSvgElement(
      Svg.G,
      {'class': 'blocklyBubble'},
      workspace.getBubbleCanvas(),
    );
    const embossGroup = dom.createSvgElement(
      Svg.G,
      {'class': 'blocklyEmboss'},
      this.svgRoot,
    );
    this.tail = dom.createSvgElement(
      Svg.PATH,
      {'class': 'blocklyBubbleTail'},
      embossGroup,
    );
    this.background = dom.createSvgElement(
      Svg.RECT,
      {
        'class': 'blocklyDraggable',
        'x': 0,
        'y': 0,
        'rx': Bubble.BORDER_WIDTH,
        'ry': Bubble.BORDER_WIDTH,
      },
      embossGroup,
    );
    this.contentContainer = dom.createSvgElement(Svg.G, {}, this.svgRoot);

    this.focusableElement = overriddenFocusableElement ?? this.svgRoot;
    this.focusableElement.setAttribute('id', this.id);

    browserEvents.conditionalBind(
      this.background,
      'pointerdown',
      this,
      this.onMouseDown,
    );

    browserEvents.conditionalBind(
      this.focusableElement,
      'keydown',
      this,
      this.onKeyDown,
    );
  }

  /** Dispose of this bubble. */
  dispose() {
    dom.removeNode(this.svgRoot);
    this.disposed = true;
  }

  /**
   * Set the location the tail of this bubble points to.
   *
   * @param anchor The location the tail of this bubble points to.
   * @param relayout If true, reposition the bubble from scratch so that it is
   *     optimally visible. If false, reposition it so it maintains the same
   *     position relative to the anchor.
   */
  setAnchorLocation(anchor: Coordinate, relayout = false) {
    this.anchor = anchor;
    if (relayout) {
      this.positionByRect(this.ownerRect);
    } else {
      this.positionRelativeToAnchor();
    }
    this.renderTail();
  }

  /** Sets the position of this bubble relative to its anchor. */
  setPositionRelativeToAnchor(left: number, top: number) {
    this.relativeLeft = left;
    this.relativeTop = top;
    this.positionRelativeToAnchor();
    this.renderTail();
  }

  /** @returns the size of this bubble. */
  protected getSize() {
    return this.size;
  }

  /**
   * Sets the size of this bubble, including the border.
   *
   * @param size Sets the size of this bubble, including the border.
   * @param relayout If true, reposition the bubble from scratch so that it is
   *     optimally visible. If false, reposition it so it maintains the same
   *     position relative to the anchor.
   */
  protected setSize(size: Size, relayout = false) {
    size.width = Math.max(size.width, Bubble.MIN_SIZE);
    size.height = Math.max(size.height, Bubble.MIN_SIZE);
    this.size = size;

    this.background.setAttribute('width', `${size.width}`);
    this.background.setAttribute('height', `${size.height}`);

    if (relayout) {
      this.positionByRect(this.ownerRect);
    } else {
      this.positionRelativeToAnchor();
    }
    this.renderTail();
  }

  /** Returns the colour of the background and tail of this bubble. */
  protected getColour(): string {
    return this.colour;
  }

  /** Sets the colour of the background and tail of this bubble. */
  public setColour(colour: string) {
    this.colour = colour;
    this.tail.setAttribute('fill', colour);
    this.background.setAttribute('fill', colour);
  }

  /**
   * Passes the pointer event off to the gesture system and ensures the bubble
   * is focused.
   */
  private onMouseDown(e: PointerEvent) {
    this.workspace.getGesture(e)?.handleBubbleStart(e, this);
    getFocusManager().focusNode(this);
  }

  /**
   * Handles key events when this bubble is focused. By default, closes the
   * bubble on Escape.
   *
   * @param e The keyboard event to handle.
   */
  protected onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.owner) {
      this.owner.setBubbleVisible(false);
      getFocusManager().focusNode(this.owner);
    }
  }

  /** Positions the bubble relative to its anchor. Does not render its tail. */
  protected positionRelativeToAnchor() {
    let left = this.anchor.x;
    if (this.workspace.RTL) {
      left -= this.relativeLeft + this.size.width;
    } else {
      left += this.relativeLeft;
    }
    const top = this.relativeTop + this.anchor.y;
    this.moveTo(left, top);
  }

  /**
   * Moves the bubble to the given coordinates.
   *
   * @internal
   */
  moveTo(x: number, y: number) {
    this.svgRoot.setAttribute('transform', `translate(${x}, ${y})`);
  }

  /**
   * Positions the bubble "optimally" so that the most of it is visible and
   * it does not overlap the rect (if provided).
   */
  protected positionByRect(rect = new Rect(0, 0, 0, 0)) {
    const viewMetrics = this.workspace.getMetricsManager().getViewMetrics(true);

    const optimalLeft = this.getOptimalRelativeLeft(viewMetrics);
    const optimalTop = this.getOptimalRelativeTop(viewMetrics);

    const topPosition = {
      x: optimalLeft,
      y: (-this.size.height -
        this.workspace.getRenderer().getConstants().MIN_BLOCK_HEIGHT) as number,
    };
    const startPosition = {x: -this.size.width - 30, y: optimalTop};
    const endPosition = {x: rect.getWidth(), y: optimalTop};
    const bottomPosition = {x: optimalLeft, y: rect.getHeight()};

    const closerPosition =
      rect.getWidth() < rect.getHeight() ? endPosition : bottomPosition;
    const fartherPosition =
      rect.getWidth() < rect.getHeight() ? bottomPosition : endPosition;

    const topPositionOverlap = this.getOverlap(topPosition, viewMetrics);
    const startPositionOverlap = this.getOverlap(startPosition, viewMetrics);
    const closerPositionOverlap = this.getOverlap(closerPosition, viewMetrics);
    const fartherPositionOverlap = this.getOverlap(
      fartherPosition,
      viewMetrics,
    );

    // Set the position to whichever position shows the most of the bubble,
    // with tiebreaks going in the order: top > start > close > far.
    const mostOverlap = Math.max(
      topPositionOverlap,
      startPositionOverlap,
      closerPositionOverlap,
      fartherPositionOverlap,
    );
    if (topPositionOverlap === mostOverlap) {
      this.relativeLeft = topPosition.x;
      this.relativeTop = topPosition.y;
      this.positionRelativeToAnchor();
      return;
    }
    if (startPositionOverlap === mostOverlap) {
      this.relativeLeft = startPosition.x;
      this.relativeTop = startPosition.y;
      this.positionRelativeToAnchor();
      return;
    }
    if (closerPositionOverlap === mostOverlap) {
      this.relativeLeft = closerPosition.x;
      this.relativeTop = closerPosition.y;
      this.positionRelativeToAnchor();
      return;
    }
    // TODO: I believe relativeLeft_ should actually be called relativeStart_
    //  and then the math should be fixed to reflect this. (hopefully it'll
    //  make it look simpler)
    this.relativeLeft = fartherPosition.x;
    this.relativeTop = fartherPosition.y;
    this.positionRelativeToAnchor();
  }

  /**
   * Calculate the what percentage of the bubble overlaps with the visible
   * workspace (what percentage of the bubble is visible).
   *
   * @param relativeMin The position of the top-left corner of the bubble
   *     relative to the anchor point.
   * @param viewMetrics The view metrics of the workspace the bubble will appear
   *     in.
   * @returns The percentage of the bubble that is visible.
   */
  private getOverlap(
    relativeMin: {x: number; y: number},
    viewMetrics: ContainerRegion,
  ): number {
    // The position of the top-left corner of the bubble in workspace units.
    const bubbleMin = {
      x: this.workspace.RTL
        ? this.anchor.x - relativeMin.x - this.size.width
        : relativeMin.x + this.anchor.x,
      y: relativeMin.y + this.anchor.y,
    };
    // The position of the bottom-right corner of the bubble in workspace units.
    const bubbleMax = {
      x: bubbleMin.x + this.size.width,
      y: bubbleMin.y + this.size.height,
    };

    // We could adjust these values to account for the scrollbars, but the
    // bubbles should have been adjusted to not collide with them anyway, so
    // giving the workspace a slightly larger "bounding box" shouldn't affect
    // the calculation.

    // The position of the top-left corner of the workspace.
    const workspaceMin = {x: viewMetrics.left, y: viewMetrics.top};
    // The position of the bottom-right corner of the workspace.
    const workspaceMax = {
      x: viewMetrics.left + viewMetrics.width,
      y: viewMetrics.top + viewMetrics.height,
    };

    const overlapWidth =
      Math.min(bubbleMax.x, workspaceMax.x) -
      Math.max(bubbleMin.x, workspaceMin.x);
    const overlapHeight =
      Math.min(bubbleMax.y, workspaceMax.y) -
      Math.max(bubbleMin.y, workspaceMin.y);
    return Math.max(
      0,
      Math.min(
        1,
        (overlapWidth * overlapHeight) / (this.size.width * this.size.height),
      ),
    );
  }

  /**
   * Calculate what the optimal horizontal position of the top-left corner of
   * the bubble is (relative to the anchor point) so that the most area of the
   * bubble is shown.
   *
   * @param viewMetrics The view metrics of the workspace the bubble will appear
   *     in.
   * @returns The optimal horizontal position of the top-left corner of the
   *     bubble.
   */
  private getOptimalRelativeLeft(viewMetrics: ContainerRegion): number {
    // By default, show the bubble just a bit to the left of the anchor.
    let relativeLeft = -this.size.width / 4;

    // No amount of sliding left or right will give us better overlap.
    if (this.size.width > viewMetrics.width) return relativeLeft;

    const workspaceRect = this.getWorkspaceViewRect(viewMetrics);

    if (this.workspace.RTL) {
      // Bubble coordinates are flipped in RTL.
      const bubbleRight = this.anchor.x - relativeLeft;
      const bubbleLeft = bubbleRight - this.size.width;

      if (bubbleLeft < workspaceRect.left) {
        // Slide the bubble right until it is onscreen.
        relativeLeft = -(workspaceRect.left - this.anchor.x + this.size.width);
      } else if (bubbleRight > workspaceRect.right) {
        // Slide the bubble left until it is onscreen.
        relativeLeft = -(workspaceRect.right - this.anchor.x);
      }
    } else {
      const bubbleLeft = relativeLeft + this.anchor.x;
      const bubbleRight = bubbleLeft + this.size.width;

      if (bubbleLeft < workspaceRect.left) {
        // Slide the bubble right until it is onscreen.
        relativeLeft = workspaceRect.left - this.anchor.x;
      } else if (bubbleRight > workspaceRect.right) {
        // Slide the bubble left until it is onscreen.
        relativeLeft = workspaceRect.right - this.anchor.x - this.size.width;
      }
    }

    return relativeLeft;
  }

  /**
   * Calculate what the optimal vertical position of the top-left corner of
   * the bubble is (relative to the anchor point) so that the most area of the
   * bubble is shown.
   *
   * @param viewMetrics The view metrics of the workspace the bubble will appear
   *     in.
   * @returns The optimal vertical position of the top-left corner of the
   *     bubble.
   */
  private getOptimalRelativeTop(viewMetrics: ContainerRegion): number {
    // By default, show the bubble just a bit higher than the anchor.
    let relativeTop = -this.size.height / 4;

    // No amount of sliding up or down will give us better overlap.
    if (this.size.height > viewMetrics.height) return relativeTop;

    const top = this.anchor.y + relativeTop;
    const bottom = top + this.size.height;
    const workspaceRect = this.getWorkspaceViewRect(viewMetrics);

    if (top < workspaceRect.top) {
      // Slide the bubble down until it is onscreen.
      relativeTop = workspaceRect.top - this.anchor.y;
    } else if (bottom > workspaceRect.bottom) {
      // Slide the bubble up until it is onscreen.
      relativeTop = workspaceRect.bottom - this.anchor.y - this.size.height;
    }

    return relativeTop;
  }

  /**
   * @returns a rect defining the bounds of the workspace's view in workspace
   * coordinates.
   */
  private getWorkspaceViewRect(viewMetrics: ContainerRegion): Rect {
    const top = viewMetrics.top;
    let bottom = viewMetrics.top + viewMetrics.height;
    let left = viewMetrics.left;
    let right = viewMetrics.left + viewMetrics.width;

    bottom -= this.getScrollbarThickness();
    if (this.workspace.RTL) {
      left -= this.getScrollbarThickness();
    } else {
      right -= this.getScrollbarThickness();
    }

    return new Rect(top, bottom, left, right);
  }

  /** @returns the scrollbar thickness in workspace units. */
  private getScrollbarThickness() {
    return Scrollbar.scrollbarThickness / this.workspace.scale;
  }

  /** Draws the tail of the bubble. */
  private renderTail() {
    const steps = [];
    // Find the relative coordinates of the center of the bubble.
    const relBubbleX = this.size.width / 2;
    const relBubbleY = this.size.height / 2;
    // Find the relative coordinates of the center of the anchor.
    let relAnchorX = -this.relativeLeft;
    let relAnchorY = -this.relativeTop;
    if (relBubbleX === relAnchorX && relBubbleY === relAnchorY) {
      // Null case.  Bubble is directly on top of the anchor.
      // Short circuit this rather than wade through divide by zeros.
      steps.push('M ' + relBubbleX + ',' + relBubbleY);
    } else {
      // Compute the angle of the tail's line.
      const rise = relAnchorY - relBubbleY;
      let run = relAnchorX - relBubbleX;
      if (this.workspace.RTL) {
        run *= -1;
      }
      const hypotenuse = Math.sqrt(rise * rise + run * run);
      let angle = Math.acos(run / hypotenuse);
      if (rise < 0) {
        angle = 2 * Math.PI - angle;
      }
      // Compute a line perpendicular to the tail.
      let rightAngle = angle + Math.PI / 2;
      if (rightAngle > Math.PI * 2) {
        rightAngle -= Math.PI * 2;
      }
      const rightRise = Math.sin(rightAngle);
      const rightRun = Math.cos(rightAngle);

      // Calculate the thickness of the base of the tail.
      let thickness =
        (this.size.width + this.size.height) / Bubble.TAIL_THICKNESS;
      thickness = Math.min(thickness, this.size.width, this.size.height) / 4;

      // Back the tip of the tail off of the anchor.
      const backoffRatio = 1 - Bubble.ANCHOR_RADIUS / hypotenuse;
      relAnchorX = relBubbleX + backoffRatio * run;
      relAnchorY = relBubbleY + backoffRatio * rise;

      // Coordinates for the base of the tail.
      const baseX1 = relBubbleX + thickness * rightRun;
      const baseY1 = relBubbleY + thickness * rightRise;
      const baseX2 = relBubbleX - thickness * rightRun;
      const baseY2 = relBubbleY - thickness * rightRise;

      // Distortion to curve the tail.
      const radians = math.toRadians(
        this.workspace.RTL ? -Bubble.TAIL_ANGLE : Bubble.TAIL_ANGLE,
      );
      let swirlAngle = angle + radians;
      if (swirlAngle > Math.PI * 2) {
        swirlAngle -= Math.PI * 2;
      }
      const swirlRise = (Math.sin(swirlAngle) * hypotenuse) / Bubble.TAIL_BEND;
      const swirlRun = (Math.cos(swirlAngle) * hypotenuse) / Bubble.TAIL_BEND;

      steps.push('M' + baseX1 + ',' + baseY1);
      steps.push(
        'C' +
          (baseX1 + swirlRun) +
          ',' +
          (baseY1 + swirlRise) +
          ' ' +
          relAnchorX +
          ',' +
          relAnchorY +
          ' ' +
          relAnchorX +
          ',' +
          relAnchorY,
      );
      steps.push(
        'C' +
          relAnchorX +
          ',' +
          relAnchorY +
          ' ' +
          (baseX2 + swirlRun) +
          ',' +
          (baseY2 + swirlRise) +
          ' ' +
          baseX2 +
          ',' +
          baseY2,
      );
    }
    steps.push('z');
    this.tail?.setAttribute('d', steps.join(' '));
  }
  /**
   * Move this bubble to the front of the visible workspace.
   *
   * @returns Whether or not the bubble has been moved.
   * @internal
   */
  bringToFront(): boolean {
    const svgGroup = this.svgRoot?.parentNode;
    if (this.svgRoot && svgGroup?.lastChild !== this.svgRoot) {
      svgGroup?.appendChild(this.svgRoot);
      return true;
    }
    return false;
  }

  /** @internal */
  getRelativeToSurfaceXY(): Coordinate {
    return new Coordinate(
      this.workspace.RTL
        ? -this.relativeLeft + this.anchor.x - this.size.width
        : this.anchor.x + this.relativeLeft,
      this.anchor.y + this.relativeTop,
    );
  }

  /** @internal */
  getSvgRoot(): SVGElement {
    return this.svgRoot;
  }

  /**
   * Move this bubble during a drag.
   *
   * @param newLoc The location to translate to, in workspace coordinates.
   * @internal
   */
  moveDuringDrag(newLoc: Coordinate) {
    this.moveTo(newLoc.x, newLoc.y);
    if (this.workspace.RTL) {
      this.relativeLeft = this.anchor.x - newLoc.x - this.size.width;
    } else {
      this.relativeLeft = newLoc.x - this.anchor.x;
    }
    this.relativeTop = newLoc.y - this.anchor.y;
    this.renderTail();
  }

  setDragging(_start: boolean) {
    // NOOP in base class.
  }

  /** @internal */
  setDeleteStyle(_enable: boolean) {
    // NOOP in base class.
  }

  /** @internal */
  isDeletable(): boolean {
    return false;
  }

  /** @internal */
  showContextMenu(_e: Event) {
    // NOOP in base class.
  }

  /** Returns whether this bubble is movable or not. */
  isMovable(): boolean {
    return true;
  }

  /** Starts a drag on the bubble. */
  startDrag(): void {
    this.dragStrategy.startDrag();
  }

  /** Drags the bubble to the given location. */
  drag(newLoc: Coordinate): void {
    this.dragStrategy.drag(newLoc);
  }

  /** Ends the drag on the bubble. */
  endDrag(): void {
    this.dragStrategy.endDrag();
  }

  /** Moves the bubble back to where it was at the start of a drag. */
  revertDrag(): void {
    this.dragStrategy.revertDrag();
  }

  select(): void {
    // Bubbles don't have any visual for being selected.
    common.fireSelectedEvent(this);
  }

  unselect(): void {
    // Bubbles don't have any visual for being selected.
    common.fireSelectedEvent(null);
  }

  /** See IFocusableNode.getFocusableElement. */
  getFocusableElement(): HTMLElement | SVGElement {
    return this.focusableElement;
  }

  /** See IFocusableNode.getFocusableTree. */
  getFocusableTree(): IFocusableTree {
    return this.workspace;
  }

  /** See IFocusableNode.onNodeFocus. */
  onNodeFocus(): void {
    this.select();
    this.bringToFront();
    const xy = this.getRelativeToSurfaceXY();
    const size = this.getSize();
    const bounds = new Rect(xy.y, xy.y + size.height, xy.x, xy.x + size.width);
    this.workspace.scrollBoundsIntoView(bounds);
  }

  /** See IFocusableNode.onNodeBlur. */
  onNodeBlur(): void {
    this.unselect();
  }

  /** See IFocusableNode.canBeFocused. */
  canBeFocused(): boolean {
    return true;
  }

  /**
   * Returns the object that owns/hosts this bubble, if any.
   */
  getOwner(): (IHasBubble & IFocusableNode) | undefined {
    return this.owner;
  }
}
