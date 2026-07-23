/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A class that highlights the user's
 * viewport on the minimap.
 * @author cesarades@google.com (Cesar Ades)
 */

import * as Blockly from 'blockly/core';

const blockEvents = new Set<string>([
  Blockly.Events.VIEWPORT_CHANGE,
  Blockly.Events.BLOCK_CHANGE,
  Blockly.Events.BLOCK_CREATE,
  Blockly.Events.BLOCK_DELETE,
  Blockly.Events.BLOCK_DRAG,
  Blockly.Events.BLOCK_MOVE,
]);

const borderRadius = 6;

/**
 * A class that highlights the user's viewport on the minimap.
 */
export class FocusRegion {
  private onChangeWrapper: (e: Blockly.Events.Abstract) => void;
  private svgGroup: SVGElement | null = null;
  private rect: SVGElement | null = null;
  private background: SVGElement | null = null;
  private id: string;
  private initialized = false;

  /**
   * Constructor for the focus region.
   *
   * @param primaryWorkspace The primary workspaceSvg.
   * @param minimapWorkspace The minimap workspaceSvg.
   */
  constructor(
    private primaryWorkspace: Blockly.WorkspaceSvg,
    private minimapWorkspace: Blockly.WorkspaceSvg,
  ) {
    this.id = String(Math.random()).substring(2);
    this.onChangeWrapper = this.onChange.bind(this);
  }

  /**
   * Initializes focus region.
   */
  init() {
    // Make the svg group element.
    this.svgGroup = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.G,
      {class: 'blockly-focus-region'},
      null,
    );

    // Make the mask under the svg group.
    const mask = Blockly.utils.dom.createSvgElement(
      new Blockly.utils.Svg('mask'),
      {id: 'focusRegionMask' + this.id},
      this.svgGroup,
    );

    // Make the background under the svg group.
    this.background = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        x: 0,
        y: 0,
        width: '100%',
        height: '100%',
        mask: 'url(#focusRegionMask' + this.id + ')',
      },
      this.svgGroup,
    );

    // Make the white layer under the svg mask.
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

    // Make the black layer under the mask.
    this.rect = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        x: 0,
        y: 0,
        rx: borderRadius,
        ry: borderRadius,
        fill: 'black',
      },
      mask,
    );

    // Add the svg group to the minimap.
    const parentSvg = this.minimapWorkspace.getParentSvg();
    if (parentSvg.firstChild) {
      parentSvg.insertBefore(this.svgGroup, parentSvg.firstChild);
    } else {
      parentSvg.appendChild(this.svgGroup);
    }

    window.addEventListener('resize', () => void this.update());
    window.addEventListener('load', () => void this.update());
    this.onChangeWrapper = this.onChange.bind(this);
    this.primaryWorkspace.addChangeListener(this.onChangeWrapper);

    this.update();
    this.initialized = true;
  }

  /**
   * Disposes of the focus region.
   * Unlinks from all DOM elements and remove all event listeners
   * to prevent memory leaks.
   */
  dispose() {
    if (this.onChangeWrapper) {
      this.primaryWorkspace.removeChangeListener(this.onChangeWrapper);
      this.onChangeWrapper = () => null;
    }
    if (this.svgGroup) {
      Blockly.utils.dom.removeNode(this.svgGroup);
    }
    this.svgGroup = null;
    this.rect = null;
    this.background = null;
    this.initialized = false;
  }

  /**
   * Handles events triggered on the primary workspace.
   *
   * @param event The event.
   */
  private onChange(event: Blockly.Events.Abstract): void {
    if (blockEvents.has(event.type)) {
      this.update();
    }
  }

  /**
   * Positions and sizes the highlight on the minimap
   * based on the primary workspace.
   */
  private update(): void {
    // Get the metrics.
    const primaryMetrics = this.primaryWorkspace.getMetricsManager();
    const minimapMetrics = this.minimapWorkspace.getMetricsManager();

    const primaryView = primaryMetrics.getViewMetrics(true);
    const primaryContent = primaryMetrics.getContentMetrics(true);
    const minimapContent = minimapMetrics.getContentMetrics();
    const minimapSvg = minimapMetrics.getSvgMetrics();

    // Return if there is no content.
    if (primaryContent.width === 0) {
      return;
    }

    // Get the workscape to pixel scale on the minimap.
    const scale =
      minimapContent.width / minimapMetrics.getContentMetrics(true).width;

    // Get the viewport size on a minimap scale.
    const width = primaryView.width * scale;
    const height = primaryView.height * scale;

    // Get the viewport position in relation to the content.
    let left = (primaryView.left - primaryContent.left) * scale;
    let top = (primaryView.top - primaryContent.top) * scale;

    // Account for the padding outside the content on the minimap.
    left += (minimapSvg.width - minimapContent.width) / 2;
    top += (minimapSvg.height - minimapContent.height) / 2;

    // Set the svg attributes.
    if (!this.rect) {
      throw new Error(
        'The focus region must be initialized (`init`) before calling `update`',
      );
    } else {
      this.rect.setAttribute('transform', `translate(${left},${top})`);
      this.rect.setAttribute('width', width.toString());
      this.rect.setAttribute('height', height.toString());
    }
  }

  /**
   * Returns whether focus region is initialized or not.
   *
   * @returns True if focus region is initialized else false.
   */
  isEnabled(): boolean {
    return this.initialized;
  }
}

Blockly.Css.register(`
.blockly-focus-region {
  fill: #e6e6e6;
}
`);
