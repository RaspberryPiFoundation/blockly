/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A metrics manager that makes fixed edges more easily
 * configurable.
 */

import * as Blockly from 'blockly/core';

/**
 * @typedef {{
 *   top: (boolean|undefined),
 *   bottom: (boolean|undefined),
 *   left: (boolean|undefined),
 *   right: (boolean|undefined)
 * }}
 */
let FixedEdgesConfig;

/**
 * The current configuration for fixed edges.
 * @type {!FixedEdgesConfig}
 * @private
 */
const fixedEdges = {};

/**
 * The metrics manager for workspace metrics calculations with customizable
 * fixed edges.
 * @param {!Blockly.WorkspaceSvg} workspace The workspace to calculate metrics
 *     for.
 * @implements {Blockly.IMetricsManager}
 * @constructor
 */
export class FixedEdgesMetricsManager extends Blockly.MetricsManager {
  /**
   * Constructor for fixed edges workspace metrics manager.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace that the plugin will
   *     be added to.
   */
  constructor(workspace) {
    super(workspace);
  }

  /**
   * Sets which edges are fixed. This does not prevent fixed edges set by
   * no scrollbars or single-direction scrollbars.
   * @param {!FixedEdgesConfig} updatedFixedEdges The edges to set as fixed.
   * @public
   */
  static setFixedEdges(updatedFixedEdges) {
    fixedEdges.top = !!updatedFixedEdges.top;
    fixedEdges.bottom = !!updatedFixedEdges.bottom;
    fixedEdges.left = !!updatedFixedEdges.left;
    fixedEdges.right = !!updatedFixedEdges.right;
  }

  /**
   * Returns whether the scroll area has fixed edges.
   * @returns {boolean} Whether the scroll area has fixed edges.
   * @package
   * @override
   */
  hasFixedEdges() {
    return true;
  }

  /**
   * Computes the fixed edges of the scroll area.
   * @param {!Blockly.MetricsManager.ContainerRegion=} cachedViewMetrics The
   *     view metrics if they have been previously computed. Passing in null may
   *     cause the view metrics to be computed again, if it is needed.
   * @returns {!Blockly.MetricsManager.FixedEdges} The fixed edges of the scroll
   *     area.
   * @protected
   * @override
   */
  getComputedFixedEdges_(cachedViewMetrics = undefined) {
    const hScrollEnabled = this.workspace_.isMovableHorizontally();
    const vScrollEnabled = this.workspace_.isMovableVertically();

    const viewMetrics = cachedViewMetrics || this.getViewMetrics(false);

    const edges = {
      top: fixedEdges.top ? 0 : undefined,
      bottom: fixedEdges.bottom ? 0 : undefined,
      left: fixedEdges.left ? 0 : undefined,
      right: fixedEdges.right ? 0 : undefined,
    };
    if (fixedEdges.top && fixedEdges.bottom) {
      edges.bottom = viewMetrics.height;
    }
    if (fixedEdges.left && fixedEdges.right) {
      edges.right = viewMetrics.width;
    }

    if (!vScrollEnabled) {
      if (edges.top !== undefined) {
        edges.bottom = edges.top + viewMetrics.height;
      } else if (edges.bottom !== undefined) {
        edges.top = edges.bottom - viewMetrics.height;
      } else {
        edges.top = viewMetrics.top;
        edges.bottom = viewMetrics.top + viewMetrics.height;
      }
    }
    if (!hScrollEnabled) {
      if (edges.left !== undefined) {
        edges.right = edges.left + viewMetrics.width;
      } else if (edges.right !== undefined) {
        edges.left = edges.right - viewMetrics.width;
      } else {
        edges.left = viewMetrics.left;
        edges.right = viewMetrics.left + viewMetrics.width;
      }
    }
    return edges;
  }
}
