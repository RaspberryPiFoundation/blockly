/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../utils/dom.js';
import {Svg} from '../utils/svg.js';
import type {WorkspaceSvg} from '../workspace_svg.js';

/**
 * Four-way arrow indicator attached to a workspace element to indicate that it
 * is being moved.
 */
export class MoveIndicator {
  /**
   * Root SVG element for the indicator.
   */
  svgRoot: SVGGElement;

  /**
   * Creates a new move indicator.
   *
   * @param workspace The workspace the indicator should be displayed on.
   */
  constructor(private workspace: WorkspaceSvg) {
    this.svgRoot = dom.createSvgElement(
      Svg.G,
      {},
      workspace.getLayerManager()?.getDragLayer(),
    );
    this.svgRoot.classList.add('blocklyMoveIndicator');
    const rtl = workspace.RTL;
    dom.createSvgElement(
      Svg.CIRCLE,
      {
        'fill': 'white',
        'fill-opacity': '0.8',
        'stroke': 'grey',
        'stroke-width': '1',
        'r': 20,
        'cx': 20 * (rtl ? -1 : 1),
        'cy': 20,
      },
      this.svgRoot,
    );
    dom.createSvgElement(
      Svg.PATH,
      {
        'fill': 'none',
        'stroke': 'black',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        'd': 'm18 9l3 3l-3 3m-3-3h6M6 9l-3 3l3 3m-3-3h6m0 6l3 3l3-3m-3-3v6m3-15l-3-3l-3 3m3-3v6',
        'transform': `translate(${(rtl ? -4 : 1) * 8} 8)`,
      },
      this.svgRoot,
    );
  }

  /**
   * Moves this indicator to the specified location.
   *
   * @param x The location on the X axis to move to.
   * @param y The location on the Y axis to move to.
   */
  moveTo(x: number, y: number) {
    this.svgRoot.setAttribute(
      'transform',
      `translate(${x + (this.workspace.RTL ? 20 : -20)}, ${y - 20})`,
    );
  }

  /**
   * Disposes of this move indicator.
   */
  dispose() {
    dom.removeNode(this.svgRoot);
  }
}
