/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IMetricsManager

import type {
  AbsoluteMetrics,
  ContainerRegion,
  ToolboxMetrics,
  UiMetrics,
} from '../metrics_manager.js';
import type {Metrics} from '../utils/metrics.js';
import type {Size} from '../utils/size.js';

/**
 * Interface for a metrics manager.
 */
export interface IMetricsManager {
  /**
   * Returns whether the scroll area has fixed edges.
   *
   * @returns Whether the scroll area has fixed edges.
   * @internal
   */
  hasFixedEdges(): boolean;

  /**
   * Returns the metrics for the scroll area of the workspace.
   *
   * @param opt_getWorkspaceCoordinates True to get the scroll metrics in
   *     workspace coordinates, false to get them in pixel coordinates.
   * @param opt_viewMetrics The view metrics if they have been previously
   *     computed. Passing in null may cause the view metrics to be computed
   *     again, if it is needed.
   * @param opt_contentMetrics The content metrics if they have been previously
   *     computed. Passing in null may cause the content metrics to be computed
   *     again, if it is needed.
   * @returns The metrics for the scroll container
   */
  getScrollMetrics(
    opt_getWorkspaceCoordinates?: boolean,
    opt_viewMetrics?: ContainerRegion,
    opt_contentMetrics?: ContainerRegion,
  ): ContainerRegion;

  /**
   * Gets the width and the height of the flyout in pixel
   * coordinates. By default, will get metrics for either a simple flyout (owned
   * directly by the workspace) or for the flyout owned by the toolbox. If you
   * pass `opt_own` as `true` then only metrics for the simple flyout will be
   * returned, and it will return 0 for the width and height if the workspace
   * has a category toolbox instead of a simple toolbox.
   *
   * @param opt_own Whether to only return the workspace's own flyout metrics.
   * @returns The width and height of the flyout.
   */
  getFlyoutMetrics(opt_own?: boolean): ToolboxMetrics;

  /**
   * Gets the width, height and position of the toolbox on the workspace in
   * pixel coordinates. Returns 0 for the width and height if the workspace has
   * a simple toolbox instead of a category toolbox. To get the width and height
   * of a simple toolbox, see {@link IMetricsManager.getFlyoutMetrics}.
   *
   * @returns The object with the width, height and position of the toolbox.
   */
  getToolboxMetrics(): ToolboxMetrics;

  /**
   * Gets the width and height of the workspace's parent SVG element in pixel
   * coordinates. This area includes the toolbox and the visible workspace area.
   *
   * @returns The width and height of the workspace's parent SVG element.
   */
  getSvgMetrics(): Size;

  /**
   * Gets the absolute left and absolute top in pixel coordinates.
   * This is where the visible workspace starts in relation to the SVG
   * container.
   *
   * @returns The absolute metrics for the workspace.
   */
  getAbsoluteMetrics(): AbsoluteMetrics;

  /**
   * Gets the metrics for the visible workspace in either pixel or workspace
   * coordinates. The visible workspace does not include the toolbox or flyout.
   *
   * @param opt_getWorkspaceCoordinates True to get the view metrics in
   *     workspace coordinates, false to get them in pixel coordinates.
   * @returns The width, height, top and left of the viewport in either
   *     workspace coordinates or pixel coordinates.
   */
  getViewMetrics(opt_getWorkspaceCoordinates?: boolean): ContainerRegion;

  /**
   * Gets content metrics in either pixel or workspace coordinates.
   * The content area is a rectangle around all the top bounded elements on the
   * workspace (workspace comments and blocks).
   *
   * @param opt_getWorkspaceCoordinates True to get the content metrics in
   *     workspace coordinates, false to get them in pixel coordinates.
   * @returns The metrics for the content container.
   */
  getContentMetrics(opt_getWorkspaceCoordinates?: boolean): ContainerRegion;

  /**
   * Returns an object with all the metrics required to size scrollbars for a
   * top level workspace.  The following properties are computed:
   * Coordinate system: pixel coordinates, -left, -up, +right, +down
   * .viewHeight: Height of the visible portion of the workspace.
   * .viewWidth: Width of the visible portion of the workspace.
   * .contentHeight: Height of the content.
   * .contentWidth: Width of the content.
   * .svgHeight: Height of the Blockly div (the view + the toolbox,
   *    simple or otherwise),
   * .svgWidth: Width of the Blockly div (the view + the toolbox,
   *    simple or otherwise),
   * .viewTop: Top-edge of the visible portion of the workspace, relative to
   *     the workspace origin.
   * .viewLeft: Left-edge of the visible portion of the workspace, relative to
   *     the workspace origin.
   * .contentTop: Top-edge of the content, relative to the workspace origin.
   * .contentLeft: Left-edge of the content relative to the workspace origin.
   * .absoluteTop: Top-edge of the visible portion of the workspace, relative
   *     to the blocklyDiv.
   * .absoluteLeft: Left-edge of the visible portion of the workspace, relative
   *     to the blocklyDiv.
   * .toolboxWidth: Width of the toolbox, if it exists.  Otherwise zero.
   * .toolboxHeight: Height of the toolbox, if it exists.  Otherwise zero.
   * .flyoutWidth: Width of the flyout if it is always open.  Otherwise zero.
   * .flyoutHeight: Height of the flyout if it is always open.  Otherwise zero.
   * .toolboxPosition: Top, bottom, left or right. Use TOOLBOX_AT constants to
   *     compare.
   *
   * @returns Contains size and position metrics of a top level workspace.
   */
  getMetrics(): Metrics;

  /**
   * Returns common metrics used by UI elements.
   *
   * @returns The UI metrics.
   */
  getUiMetrics(): UiMetrics;
}
