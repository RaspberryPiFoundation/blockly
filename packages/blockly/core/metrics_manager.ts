/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates and reports workspace metrics.
 *
 * @class
 */
// Former goog.module ID: Blockly.MetricsManager

import type {IFlyout} from './interfaces/i_flyout.js';
import type {IMetricsManager} from './interfaces/i_metrics_manager.js';
import type {IToolbox} from './interfaces/i_toolbox.js';
import * as registry from './registry.js';
import type {Metrics} from './utils/metrics.js';
import {Size} from './utils/size.js';
import * as toolboxUtils from './utils/toolbox.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * The manager for all workspace metrics calculations.
 */
export class MetricsManager implements IMetricsManager {
  /** The workspace to calculate metrics for. */
  protected readonly workspace_: WorkspaceSvg;

  /** @param workspace The workspace to calculate metrics for. */
  constructor(workspace: WorkspaceSvg) {
    this.workspace_ = workspace;
  }

  /**
   * Gets the dimensions of the given workspace component, in pixel coordinates.
   *
   * @param elem The element to get the dimensions of, or null.  It should be a
   *     toolbox or flyout, and should implement getWidth() and getHeight().
   * @returns An object containing width and height attributes, which will both
   *     be zero if elem did not exist.
   */
  protected getDimensionsPx_(elem: IToolbox | null | IFlyout): Size {
    let width = 0;
    let height = 0;
    if (elem) {
      width = elem.getWidth();
      height = elem.getHeight();
    }
    return new Size(width, height);
  }

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
  getFlyoutMetrics(opt_own?: boolean): ToolboxMetrics {
    const flyoutDimensions = this.getDimensionsPx_(
      this.workspace_.getFlyout(opt_own),
    );
    return {
      width: flyoutDimensions.width,
      height: flyoutDimensions.height,
      position: this.workspace_.toolboxPosition,
    };
  }

  /**
   * Gets the width, height and position of the toolbox on the workspace in
   * pixel coordinates. Returns 0 for the width and height if the workspace has
   * a simple toolbox instead of a category toolbox. To get the width and height
   * of a simple toolbox, see {@link (MetricsManager:class).getFlyoutMetrics}.
   *
   * @returns The object with the width, height and position of the toolbox.
   */
  getToolboxMetrics(): ToolboxMetrics {
    const toolboxDimensions = this.getDimensionsPx_(
      this.workspace_.getToolbox(),
    );

    return {
      width: toolboxDimensions.width,
      height: toolboxDimensions.height,
      position: this.workspace_.toolboxPosition,
    };
  }

  /**
   * Gets the width and height of the workspace's parent SVG element in pixel
   * coordinates. This area includes the toolbox and the visible workspace area.
   *
   * @returns The width and height of the workspace's parent SVG element.
   */
  getSvgMetrics(): Size {
    return this.workspace_.getCachedParentSvgSize();
  }

  /**
   * Gets the absolute left and absolute top in pixel coordinates.
   * This is where the visible workspace starts in relation to the SVG
   * container.
   *
   * @returns The absolute metrics for the workspace.
   */
  getAbsoluteMetrics(): AbsoluteMetrics {
    let absoluteLeft = 0;
    let absoluteTop = 0;

    const toolboxMetrics = this.getToolboxMetrics();
    const flyoutMetrics = this.getFlyoutMetrics();
    const respectToolbox = !!this.workspace_.getToolbox();
    const respectFlyout = !this.workspace_.getFlyout()?.autoClose;
    const toolboxPosition = respectToolbox
      ? toolboxMetrics.position
      : flyoutMetrics.position;

    const atLeft = toolboxPosition === toolboxUtils.Position.LEFT;
    const atTop = toolboxPosition === toolboxUtils.Position.TOP;
    if (atLeft) {
      if (respectToolbox) absoluteLeft += toolboxMetrics.width;
      if (respectFlyout) absoluteLeft += flyoutMetrics.width;
    }
    if (atTop) {
      if (respectToolbox) absoluteTop += toolboxMetrics.height;
      if (respectFlyout) absoluteTop += flyoutMetrics.height;
    }

    return {
      top: absoluteTop,
      left: absoluteLeft,
    };
  }

  /**
   * Gets the metrics for the visible workspace in either pixel or workspace
   * coordinates. The visible workspace does not include the toolbox or flyout.
   *
   * @param opt_getWorkspaceCoordinates True to get the view metrics in
   *     workspace coordinates, false to get them in pixel coordinates.
   * @returns The width, height, top and left of the viewport in either
   *     workspace coordinates or pixel coordinates.
   */
  getViewMetrics(opt_getWorkspaceCoordinates?: boolean): ContainerRegion {
    const scale = opt_getWorkspaceCoordinates ? this.workspace_.scale : 1;
    const svgMetrics = this.getSvgMetrics();
    const toolboxMetrics = this.getToolboxMetrics();
    const flyoutMetrics = this.getFlyoutMetrics();
    const respectToolbox = !!this.workspace_.getToolbox();
    const respectFlyout = !this.workspace_.getFlyout()?.autoClose;
    const toolboxPosition = respectToolbox
      ? toolboxMetrics.position
      : flyoutMetrics.position;

    const horizToolbox =
      toolboxPosition === toolboxUtils.Position.TOP ||
      toolboxPosition === toolboxUtils.Position.BOTTOM;
    const vertToolbox =
      toolboxPosition === toolboxUtils.Position.LEFT ||
      toolboxPosition === toolboxUtils.Position.RIGHT;
    if (horizToolbox) {
      if (respectToolbox) svgMetrics.height -= toolboxMetrics.height;
      if (respectFlyout) svgMetrics.height -= flyoutMetrics.height;
    }
    if (vertToolbox) {
      if (respectToolbox) svgMetrics.width -= toolboxMetrics.width;
      if (respectFlyout) svgMetrics.width -= flyoutMetrics.width;
    }
    return {
      height: svgMetrics.height / scale,
      width: svgMetrics.width / scale,
      top: -this.workspace_.scrollY / scale,
      left: -this.workspace_.scrollX / scale,
    };
  }

  /**
   * Gets content metrics in either pixel or workspace coordinates.
   * The content area is a rectangle around all the top bounded elements on the
   * workspace (workspace comments and blocks).
   *
   * @param opt_getWorkspaceCoordinates True to get the content metrics in
   *     workspace coordinates, false to get them in pixel coordinates.
   * @returns The metrics for the content container.
   */
  getContentMetrics(opt_getWorkspaceCoordinates?: boolean): ContainerRegion {
    const scale = opt_getWorkspaceCoordinates ? 1 : this.workspace_.scale;
    // Block bounding box is in workspace coordinates.
    const blockBox = this.workspace_.getBlocksBoundingBox();

    return {
      height: (blockBox.bottom - blockBox.top) * scale,
      width: (blockBox.right - blockBox.left) * scale,
      top: blockBox.top * scale,
      left: blockBox.left * scale,
    };
  }

  /**
   * Returns whether the scroll area has fixed edges.
   *
   * @returns Whether the scroll area has fixed edges.
   * @internal
   */
  hasFixedEdges(): boolean {
    // This exists for optimization of bump logic.
    return (
      !this.workspace_.isMovableHorizontally() ||
      !this.workspace_.isMovableVertically()
    );
  }

  /**
   * Computes the fixed edges of the scroll area.
   *
   * @param opt_viewMetrics The view metrics if they have been previously
   *     computed. Passing in null may cause the view metrics to be computed
   *     again, if it is needed.
   * @returns The fixed edges of the scroll area.
   */
  protected getComputedFixedEdges_(
    opt_viewMetrics?: ContainerRegion,
  ): FixedEdges {
    if (!this.hasFixedEdges()) {
      // Return early if there are no edges.
      return {};
    }

    const hScrollEnabled = this.workspace_.isMovableHorizontally();
    const vScrollEnabled = this.workspace_.isMovableVertically();

    const viewMetrics = opt_viewMetrics || this.getViewMetrics(false);

    const edges = {} as FixedEdges;
    if (!vScrollEnabled) {
      edges.top = viewMetrics.top;
      edges.bottom = viewMetrics.top + viewMetrics.height;
    }
    if (!hScrollEnabled) {
      edges.left = viewMetrics.left;
      edges.right = viewMetrics.left + viewMetrics.width;
    }
    return edges;
  }

  /**
   * Returns the content area with added padding.
   *
   * @param viewMetrics The view metrics.
   * @param contentMetrics The content metrics.
   * @returns The padded content area.
   */
  protected getPaddedContent_(
    viewMetrics: ContainerRegion,
    contentMetrics: ContainerRegion,
  ): {top: number; bottom: number; left: number; right: number} {
    const contentBottom = contentMetrics.top + contentMetrics.height;
    const contentRight = contentMetrics.left + contentMetrics.width;

    const viewWidth = viewMetrics.width;
    const viewHeight = viewMetrics.height;
    const halfWidth = viewWidth / 2;
    const halfHeight = viewHeight / 2;

    // Add a padding around the content that is at least half a screen wide.
    // Ensure padding is wide enough that blocks can scroll over entire screen.
    const top = Math.min(
      contentMetrics.top - halfHeight,
      contentBottom - viewHeight,
    );
    const left = Math.min(
      contentMetrics.left - halfWidth,
      contentRight - viewWidth,
    );
    const bottom = Math.max(
      contentBottom + halfHeight,
      contentMetrics.top + viewHeight,
    );
    const right = Math.max(
      contentRight + halfWidth,
      contentMetrics.left + viewWidth,
    );

    return {top, bottom, left, right};
  }

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
   * @returns The metrics for the scroll container.
   */
  getScrollMetrics(
    opt_getWorkspaceCoordinates?: boolean,
    opt_viewMetrics?: ContainerRegion,
    opt_contentMetrics?: ContainerRegion,
  ): ContainerRegion {
    const scale = opt_getWorkspaceCoordinates ? this.workspace_.scale : 1;
    const viewMetrics = opt_viewMetrics || this.getViewMetrics(false);
    const contentMetrics = opt_contentMetrics || this.getContentMetrics();
    const fixedEdges = this.getComputedFixedEdges_(viewMetrics);

    // Add padding around content.
    const paddedContent = this.getPaddedContent_(viewMetrics, contentMetrics);

    // Use combination of fixed bounds and padded content to make scroll area.
    const top =
      fixedEdges.top !== undefined ? fixedEdges.top : paddedContent.top;
    const left =
      fixedEdges.left !== undefined ? fixedEdges.left : paddedContent.left;
    const bottom =
      fixedEdges.bottom !== undefined
        ? fixedEdges.bottom
        : paddedContent.bottom;
    const right =
      fixedEdges.right !== undefined ? fixedEdges.right : paddedContent.right;

    return {
      top: top / scale,
      left: left / scale,
      width: (right - left) / scale,
      height: (bottom - top) / scale,
    };
  }

  /**
   * Returns common metrics used by UI elements.
   *
   * @returns The UI metrics.
   */
  getUiMetrics(): UiMetrics {
    return {
      viewMetrics: this.getViewMetrics(),
      absoluteMetrics: this.getAbsoluteMetrics(),
      toolboxMetrics: this.getToolboxMetrics(),
    };
  }

  /**
   * Returns an object with all the metrics required to size scrollbars for a
   * top level workspace.  The following properties are computed:
   * Coordinate system: pixel coordinates, -left, -up, +right, +down
   * .viewHeight: Height of the visible portion of the workspace.
   * .viewWidth: Width of the visible portion of the workspace.
   * .contentHeight: Height of the content.
   * .contentWidth: Width of the content.
   * .scrollHeight: Height of the scroll area.
   * .scrollWidth: Width of the scroll area.
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
   * .scrollTop: Top-edge of the scroll area, relative to the workspace origin.
   * .scrollLeft: Left-edge of the scroll area relative to the workspace origin.
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
  getMetrics(): Metrics {
    const toolboxMetrics = this.getToolboxMetrics();
    const flyoutMetrics = this.getFlyoutMetrics(true);
    const svgMetrics = this.getSvgMetrics();
    const absoluteMetrics = this.getAbsoluteMetrics();
    const viewMetrics = this.getViewMetrics();
    const contentMetrics = this.getContentMetrics();
    const scrollMetrics = this.getScrollMetrics(
      false,
      viewMetrics,
      contentMetrics,
    );

    return {
      contentHeight: contentMetrics.height,
      contentWidth: contentMetrics.width,
      contentTop: contentMetrics.top,
      contentLeft: contentMetrics.left,

      scrollHeight: scrollMetrics.height,
      scrollWidth: scrollMetrics.width,
      scrollTop: scrollMetrics.top,
      scrollLeft: scrollMetrics.left,

      viewHeight: viewMetrics.height,
      viewWidth: viewMetrics.width,
      viewTop: viewMetrics.top,
      viewLeft: viewMetrics.left,

      absoluteTop: absoluteMetrics.top,
      absoluteLeft: absoluteMetrics.left,

      svgHeight: svgMetrics.height,
      svgWidth: svgMetrics.width,

      toolboxWidth: toolboxMetrics.width,
      toolboxHeight: toolboxMetrics.height,
      toolboxPosition: toolboxMetrics.position,

      flyoutWidth: flyoutMetrics.width,
      flyoutHeight: flyoutMetrics.height,
    };
  }
}

export namespace MetricsManager {
  /**
   * Describes the width, height and location of the toolbox on the main
   * workspace.
   */
  export interface ToolboxMetrics {
    width: number;
    height: number;
    position: toolboxUtils.Position;
  }

  /** Describes where the viewport starts in relation to the workspace SVG. */
  export interface AbsoluteMetrics {
    left: number;
    top: number;
  }

  /**
   * All the measurements needed to describe the size and location of a
   * container.
   */
  export interface ContainerRegion {
    height: number;
    width: number;
    top: number;
    left: number;
  }

  /** Describes fixed edges of the workspace. */
  export interface FixedEdges {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }

  /** Common metrics used for UI elements. */
  export interface UiMetrics {
    viewMetrics: ContainerRegion;
    absoluteMetrics: AbsoluteMetrics;
    toolboxMetrics: ToolboxMetrics;
  }
}

export type ToolboxMetrics = MetricsManager.ToolboxMetrics;
export type AbsoluteMetrics = MetricsManager.AbsoluteMetrics;
export type ContainerRegion = MetricsManager.ContainerRegion;
export type FixedEdges = MetricsManager.FixedEdges;
export type UiMetrics = MetricsManager.UiMetrics;

registry.register(
  registry.Type.METRICS_MANAGER,
  registry.DEFAULT,
  MetricsManager,
);
