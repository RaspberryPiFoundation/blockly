/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

/**
 * Class for zoom to fit control.
 */
export class ZoomToFitControl
  implements Blockly.IComponent, Blockly.IPositionable, Blockly.IFocusableNode
{
  /**
   * The unique id for this component.
   */
  id = 'zoomToFit';

  /**
   * The SVG group containing the zoom-to-fit control.
   */
  private svgGroup: SVGElement | null = null;

  /**
   * Left coordinate of the zoom-to-fit control.
   */
  private left = 0;

  /**
   * Top coordinate of the zoom-to-fit control.
   */
  private top = 0;

  /**
   * Width of the zoom-to-fit control.
   */
  private readonly width = 32;

  /**
   * Height of the zoom-to-fit control.
   */
  private readonly height = 32;

  /**
   * Distance between zoom-to-fit control and bottom or top edge of workspace.
   */
  private readonly marginVertical = 20;

  /**
   * Distance between zoom-to-fit control and right or left edge of workspace.
   */
  private readonly marginHorizontal = 20;

  /**
   * Whether this has been initialized.
   */
  private initialized = false;

  private onZoomToFitWrapper: Blockly.browserEvents.Data | null = null;

  /**
   * Constructor for zoom-to-fit control.
   *
   * @param workspace The workspace that the zoom-to-fit
   *     control will be added to.
   */
  constructor(protected workspace: Blockly.WorkspaceSvg) {}

  /**
   * Initializes the zoom reset control.
   */
  init() {
    this.workspace.getComponentManager().addComponent({
      component: this,
      weight: 2,
      capabilities: [
        Blockly.ComponentManager.Capability.POSITIONABLE,
        Blockly.ComponentManager.Capability.FOCUSABLE,
      ],
    });
    this.createDom();
    this.initialized = true;
    this.workspace.resize();
  }
  /**
   * Disposes of workspace search.
   * Unlink from all DOM elements and remove all event listeners
   * to prevent memory leaks.
   */
  dispose() {
    if (this.svgGroup) {
      Blockly.utils.dom.removeNode(this.svgGroup);
    }
    if (this.onZoomToFitWrapper) {
      Blockly.browserEvents.unbind(this.onZoomToFitWrapper);
      this.onZoomToFitWrapper = null;
    }
  }

  /**
   * Creates DOM for ui element.
   */
  private createDom() {
    this.svgGroup = Blockly.utils.dom.createSvgElement(Blockly.utils.Svg.G, {
      height: `${this.height}px`,
      width: `${this.width}px`,
      class: 'zoomToFit',
      id: Blockly.utils.idGenerator.getNextUniqueId(),
      tabindex: '0',
    });
    Blockly.utils.aria.setState(
      this.svgGroup,
      Blockly.utils.aria.State.LABEL,
      Blockly.Msg['ZOOM_TO_FIT_ARIA_LABEL'],
    );
    Blockly.utils.aria.setRole(this.svgGroup, Blockly.utils.aria.Role.BUTTON);

    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        width: 40,
        height: 40,
        x: -4,
        y: -4,
        rx: 2,
        ry: 2,
        fill: 'none',
        class: 'blocklyFocusRing',
      },
      this.svgGroup,
    );

    const image = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.IMAGE,
      {
        height: `${this.height}px`,
        width: `${this.width}px`,
        class: 'zoomToFitIcon',
      },
      this.svgGroup,
    );

    image.setAttributeNS(
      Blockly.utils.dom.XLINK_NS,
      'xlink:href',
      zoomToFitSvgDataUri,
    );

    Blockly.utils.dom.insertAfter(
      this.svgGroup,
      this.workspace.getBubbleCanvas(),
    );

    // Attach listener.
    this.onZoomToFitWrapper = Blockly.browserEvents.conditionalBind(
      this.svgGroup,
      'pointerdown',
      null,
      this.onClick.bind(this),
    );
  }

  /**
   * Handle click event.
   *
   * @param e A pointer down event.
   */
  private onClick(e?: Event) {
    this.workspace.zoomToFit();
    const uiEvent = new (Blockly.Events.get(Blockly.Events.CLICK))(
      null,
      this.workspace.id,
      'zoom_reset_control',
    );
    Blockly.Events.fire(uiEvent);
    e?.stopPropagation(); // avoid to also fire workspace click event
    e?.preventDefault();
  }

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
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
   * Positions the zoom-to-fit control.
   * It is positioned in the opposite corner to the corner the
   * categories/toolbox starts at.
   *
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles that
   *     are already on the workspace.
   */
  position(
    metrics: Blockly.MetricsManager.UiMetrics,
    savedPositions: Blockly.utils.Rect[],
  ) {
    if (!this.initialized) {
      return;
    }
    const hasVerticalScrollbars =
      this.workspace.scrollbar &&
      this.workspace.scrollbar.canScrollHorizontally();
    const hasHorizontalScrollbars =
      this.workspace.scrollbar &&
      this.workspace.scrollbar.canScrollVertically();

    if (
      metrics.toolboxMetrics.position === Blockly.TOOLBOX_AT_LEFT ||
      (this.workspace.horizontalLayout && !this.workspace.RTL)
    ) {
      // Right corner placement.
      this.left =
        metrics.absoluteMetrics.left +
        metrics.viewMetrics.width -
        this.width -
        this.marginHorizontal;
      if (hasVerticalScrollbars && !this.workspace.RTL) {
        this.left -= Blockly.Scrollbar.scrollbarThickness;
      }
    } else {
      // Left corner placement.
      this.left = this.marginHorizontal;
      if (hasVerticalScrollbars && this.workspace.RTL) {
        this.left += Blockly.Scrollbar.scrollbarThickness;
      }
    }

    const startAtBottom =
      metrics.toolboxMetrics.position !== Blockly.TOOLBOX_AT_BOTTOM;
    if (startAtBottom) {
      // Bottom corner placement
      this.top =
        metrics.absoluteMetrics.top +
        metrics.viewMetrics.height -
        this.height -
        this.marginVertical;
      if (hasHorizontalScrollbars) {
        // The horizontal scrollbars are always positioned on the bottom.
        this.top -= Blockly.Scrollbar.scrollbarThickness;
      }
    } else {
      // Upper corner placement
      this.top = metrics.absoluteMetrics.top + this.marginVertical;
    }

    // Check for collision and bump if needed.
    let boundingRect = this.getBoundingRectangle();
    for (let i = 0, otherEl; (otherEl = savedPositions[i]); i++) {
      if (boundingRect.intersects(otherEl)) {
        if (startAtBottom) {
          // Bump up.
          this.top = otherEl.top - this.height - this.marginVertical;
        } else {
          // Bump down.
          this.top = otherEl.bottom + this.marginVertical;
        }
        // Recheck other savedPositions
        boundingRect = this.getBoundingRectangle();
        i = -1;
      }
    }

    this.svgGroup?.setAttribute(
      'transform',
      `translate(${this.left}, ${this.top})`,
    );
  }

  getFocusableElement(): HTMLElement | SVGElement {
    if (!this.svgGroup) {
      throw new Error('Tried to focus an uninitialized zoom to fit control');
    }
    return this.svgGroup;
  }

  getFocusableTree(): Blockly.IFocusableTree {
    return this.workspace;
  }

  onNodeFocus(): void {}

  onNodeBlur(): void {}

  canBeFocused(): boolean {
    return true;
  }

  performAction(e?: Event): void {
    this.onClick(e);
  }
}

/**
 * Base64 encoded data uri for zoom to fit icon.
 */
const zoomToFitSvgDataUri =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC' +
  '9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjRweCIgZm' +
  'lsbD0iIzU0NkU3QSI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PH' +
  'BhdGggZD0iTTUgNi40Mkw4LjA5IDkuNSA5LjUgOC4wOSA2LjQxIDVIOVYzSDN2Nmgyem0xMC' +
  '0zLjQxdjJoMi41N0wxNC41IDguMDlsMS40MSAxLjQxTDE5IDYuNDFWOWgyVjMuMDF6bTQgMT' +
  'QuNTdsLTMuMDktMy4wOC0xLjQxIDEuNDFMMTcuNTkgMTlIMTV2Mmg2di02aC0yek04LjA5ID' +
  'E0LjVMNSAxNy41OVYxNUgzdjZoNnYtMkg2LjQybDMuMDgtMy4wOXoiLz48L3N2Zz4=';

Blockly.Css.register(`
.zoomToFitIcon {
  opacity: 0.4;
}
.zoomToFitIcon:hover, .zoomToFit:focus .zoomToFitIcon {
  opacity: 0.6;
}
.zoomToFitIcon:active {
  opacity: 0.8;
}
`);
