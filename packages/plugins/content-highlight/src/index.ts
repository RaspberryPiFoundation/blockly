/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A plugin that highlights the content on the workspace.
 */

import * as Blockly from 'blockly/core';

/**
 * List of events that cause a change in content area size.
 */
const contentChangeEvents: string[] = [
  Blockly.Events.VIEWPORT_CHANGE,
  Blockly.Events.BLOCK_CREATE,
  Blockly.Events.BLOCK_MOVE,
  Blockly.Events.BLOCK_DELETE,
  Blockly.Events.COMMENT_MOVE,
  Blockly.Events.COMMENT_RESIZE,
  Blockly.Events.COMMENT_CREATE,
  Blockly.Events.COMMENT_DELETE,
];

/**
 * The default padding to use for the content highlight in workspace units.
 */
const defaultPadding = 10;

/**
 * Length of opacity change transition in seconds.
 */
const animationTime = 0.25;

/**
 * A plugin that highlights the area where content exists on the workspace.
 */
export class ContentHighlight {
  /**
   * The width of the highlight rectangle in workspace units.
   */
  private width = 0;

  /**
   * The height of the highlight rectangle in workspace units.
   */
  private height = 0;

  /**
   * The top offset of the highlight rectangle in pixels.
   */
  private top = 0;

  /**
   * The left offset of the highlight rectangle in pixels.
   */
  private left = 0;

  /**
   * The last scale value applied on the content highlight.
   */
  private lastScale = 1;

  /**
   * The cached content metrics for the workspace in workspace units.
   */
  private cachedContentMetrics?: Blockly.MetricsManager.ContainerRegion;

  /**
   * The padding to use around the content area.
   */
  private padding = defaultPadding;

  private svgGroup?: SVGGElement;
  private rect?: SVGRectElement;
  private background?: SVGRectElement;
  private onChangeWrapper?: (event: Blockly.Events.Abstract) => void;

  /**
   * Constructor for the content highlight plugin.
   *
   * @param workspace The workspace that the plugin will be added to.
   */
  constructor(protected workspace: Blockly.WorkspaceSvg) {}

  /**
   * Initializes the plugin.
   *
   * @param padding The padding to use for the content area highlight
   *    rectangle, in workspace units.
   */
  init(padding?: number) {
    this.padding = padding || defaultPadding;

    /** @type {SVGElement} */
    this.svgGroup = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.G,
      {class: 'contentAreaHighlight'},
      null,
    );

    const rnd = String(Math.random()).substring(2);
    const mask = Blockly.utils.dom.createSvgElement(
      new Blockly.utils.Svg('mask'),
      {
        id: 'contentAreaHighlightMask' + rnd,
      },
      this.svgGroup,
    );
    Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        x: 0,
        y: 0,
        width: '100%',
        height: '100%',
        fill: 'white',
      },
      mask,
    );
    this.rect = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        x: 0,
        y: 0,
        rx: Blockly.bubbles.Bubble.BORDER_WIDTH,
        ry: Blockly.bubbles.Bubble.BORDER_WIDTH,
        fill: 'black',
      },
      mask,
    );
    this.background = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        x: 0,
        y: 0,
        width: '100%',
        height: '100%',
        mask: `url(#contentAreaHighlightMask${rnd})`,
      },
      this.svgGroup,
    );

    this.applyColor();
    const metricsManager = this.workspace.getMetricsManager();
    this.cachedContentMetrics = metricsManager.getContentMetrics(true);
    this.resize(this.cachedContentMetrics);
    const absoluteMetrics = metricsManager.getAbsoluteMetrics();
    this.position(this.cachedContentMetrics, absoluteMetrics);

    // Apply transition animation for opacity changes.
    this.svgGroup.style.transition = `opacity ${animationTime}s`;

    const parentSvg = this.workspace.getParentSvg();
    if (parentSvg.firstChild) {
      parentSvg.insertBefore(this.svgGroup, parentSvg.firstChild);
    } else {
      parentSvg.appendChild(this.svgGroup);
    }

    this.onChangeWrapper = this.onChange.bind(this);
    this.workspace.addChangeListener(this.onChangeWrapper);
  }

  /**
   * Disposes of content highlight.
   * Unlinks from all DOM elements and remove all event listeners
   * to prevent memory leaks.
   */
  dispose() {
    if (this.svgGroup) {
      Blockly.utils.dom.removeNode(this.svgGroup);
    }
    if (this.onChangeWrapper) {
      this.workspace.removeChangeListener(this.onChangeWrapper);
    }
  }

  /**
   * Handles events triggered on the workspace.
   *
   * @param event The event.
   */
  private onChange(event: Blockly.Events.Abstract) {
    if (event.type === Blockly.Events.THEME_CHANGE) {
      this.applyColor();
    } else if (contentChangeEvents.indexOf(event.type) !== -1) {
      const metricsManager = this.workspace.getMetricsManager();
      if (event.type !== Blockly.Events.VIEWPORT_CHANGE) {
        // The content metrics change when it's not a viewport change event.
        this.cachedContentMetrics = metricsManager.getContentMetrics(true);
        this.resize(this.cachedContentMetrics);
      }
      const absoluteMetrics = metricsManager.getAbsoluteMetrics();
      if (this.cachedContentMetrics) {
        this.position(this.cachedContentMetrics, absoluteMetrics);
      }
    } else if (event.type === Blockly.Events.BLOCK_DRAG) {
      this.handleDragEvent(event as Blockly.Events.BlockDrag);
    } else if (event.type === Blockly.Events.COMMENT_DRAG) {
      this.handleDragEvent(event as Blockly.Events.CommentDrag);
    } else if (event.type === Blockly.Events.BLOCK_CHANGE) {
      // Resizes the content highlight when it is a block change event
      const metricsManager = this.workspace.getMetricsManager();
      this.cachedContentMetrics = metricsManager.getContentMetrics(true);
      this.resize(this.cachedContentMetrics);
    }
  }

  /**
   * Changes opacity of the highlight based on what kind of block drag event
   * is passed.
   *
   * @param event The BlockDrag event.
   */
  private handleDragEvent(
    event: Blockly.Events.BlockDrag | Blockly.Events.CommentDrag,
  ) {
    const opacity = event.isStart ? '0' : '1';
    this.svgGroup?.setAttribute('opacity', opacity);
  }

  /**
   * Applies the color fill for the highlight based on the current theme.
   */
  private applyColor() {
    const theme = this.workspace.getTheme();
    const bgColor =
      theme.getComponentStyle('workspaceBackgroundColour') || '#ffffff';

    const colorDarkened = Blockly.utils.colour.blend('#000', bgColor, 0.1);
    const colorLightened = Blockly.utils.colour.blend('#fff', bgColor, 0.1);
    const color =
      bgColor === '#ffffff' || bgColor === '#fff'
        ? colorDarkened
        : colorLightened;
    if (!color) return;
    this.background?.setAttribute('fill', color);
  }

  /**
   * Resizes the content highlight.
   *
   * @param contentMetrics The content metrics for the workspace in workspace
   *     coordinates.
   */
  private resize(contentMetrics: Blockly.MetricsManager.ContainerRegion) {
    const width = contentMetrics.width
      ? contentMetrics.width + 2 * this.padding
      : 0;
    const height = contentMetrics.height
      ? contentMetrics.height + 2 * this.padding
      : 0;
    if (width !== this.width) {
      this.width = width;
      this.rect?.setAttribute('width', `${width}`);
    }
    if (height !== this.height) {
      this.height = height;
      this.rect?.setAttribute('height', `${height}`);
    }
  }

  /**
   * Positions the highlight on the workspace based on the workspace metrics.
   *
   * @param contentMetrics The content metrics for the workspace in workspace
   *     coordinates.
   * @param absoluteMetrics The absolute metrics for the workspace.
   */
  private position(
    contentMetrics: Blockly.MetricsManager.ContainerRegion,
    absoluteMetrics: Blockly.MetricsManager.AbsoluteMetrics,
  ) {
    // Compute top/left manually to avoid unnecessary extra computation.
    const viewTop = -this.workspace.scrollY;
    const viewLeft = -this.workspace.scrollX;
    const scale = this.workspace.scale;
    const top =
      absoluteMetrics.top +
      contentMetrics.top * scale -
      viewTop -
      this.padding * scale;
    const left =
      absoluteMetrics.left +
      contentMetrics.left * scale -
      viewLeft -
      this.padding * scale;

    if (top !== this.top || left !== this.left || this.lastScale !== scale) {
      this.top = top;
      this.left = left;
      this.lastScale = scale;
      this.rect?.setAttribute(
        'transform',
        `translate(${left}, ${top}) scale(${scale})`,
      );
    }
  }
}
