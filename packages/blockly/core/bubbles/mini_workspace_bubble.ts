/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BlocklyOptions} from '../blockly_options.js';
import {Abstract as AbstractEvent} from '../events/events_abstract.js';
import {Options} from '../options.js';
import {Coordinate} from '../utils/coordinate.js';
import * as dom from '../utils/dom.js';
import type {Rect} from '../utils/rect.js';
import {Size} from '../utils/size.js';
import {Svg} from '../utils/svg.js';
import type {WorkspaceSvg} from '../workspace_svg.js';
import {Bubble} from './bubble.js';

/**
 * A bubble that contains a mini-workspace which can hold arbitrary blocks.
 * Used by the mutator icon.
 */
export class MiniWorkspaceBubble extends Bubble {
  /**
   * The minimum amount of change to the mini workspace view to trigger
   * resizing the bubble.
   */
  private static readonly MINIMUM_VIEW_CHANGE = 10;

  /**
   * An arbitrary margin of whitespace to put around the blocks in the
   * workspace.
   */
  private static readonly MARGIN = Bubble.DOUBLE_BORDER * 3;

  /** The root svg element containing the workspace. */
  private svgDialog: SVGElement;

  /** The workspace that gets shown within this bubble. */
  private miniWorkspace: WorkspaceSvg;

  /**
   * Should this bubble automatically reposition itself when it resizes?
   * Becomes false after this bubble is first dragged.
   */
  private autoLayout = true;

  /** @internal */
  constructor(
    workspaceOptions: BlocklyOptions,
    public readonly workspace: WorkspaceSvg,
    protected anchor: Coordinate,
    protected ownerRect?: Rect,
  ) {
    super(workspace, anchor, ownerRect);
    const options = new Options(workspaceOptions);
    this.validateWorkspaceOptions(options);

    this.svgDialog = dom.createSvgElement(
      Svg.SVG,
      {
        'x': Bubble.BORDER_WIDTH,
        'y': Bubble.BORDER_WIDTH,
      },
      this.contentContainer,
    );
    workspaceOptions.parentWorkspace = this.workspace;
    this.miniWorkspace = this.newWorkspaceSvg(new Options(workspaceOptions));
    // TODO (#7422): Change this to `internalIsMiniWorkspace` or something. Not
    //   all mini workspaces are necessarily mutators.
    this.miniWorkspace.internalIsMutator = true;
    const background = this.miniWorkspace.createDom('blocklyMutatorBackground');
    this.svgDialog.appendChild(background);
    if (options.languageTree) {
      background.insertBefore(
        this.miniWorkspace.addFlyout(Svg.G),
        this.miniWorkspace.getCanvas(),
      );
      const flyout = this.miniWorkspace.getFlyout();
      flyout?.init(this.miniWorkspace);
      flyout?.show(options.languageTree);
    }

    dom.addClass(this.svgRoot, 'blocklyMiniWorkspaceBubble');
    this.miniWorkspace.addChangeListener(this.onWorkspaceChange.bind(this));
    this.miniWorkspace
      .getFlyout()
      ?.getWorkspace()
      ?.addChangeListener(this.onWorkspaceChange.bind(this));
    this.updateBubbleSize();
  }

  dispose() {
    this.miniWorkspace.dispose();
    super.dispose();
  }

  /** @internal */
  getWorkspace(): WorkspaceSvg {
    return this.miniWorkspace;
  }

  /** Adds a change listener to the mini workspace. */
  addWorkspaceChangeListener(listener: (e: AbstractEvent) => void) {
    this.miniWorkspace.addChangeListener(listener);
  }

  /**
   * Validates the workspace options to make sure folks aren't trying to
   * enable things the miniworkspace doesn't support.
   */
  private validateWorkspaceOptions(options: Options) {
    if (options.hasCategories) {
      throw new Error(
        'The miniworkspace bubble does not support toolboxes with categories',
      );
    }
    if (options.hasTrashcan) {
      throw new Error('The miniworkspace bubble does not support trashcans');
    }
    if (
      options.zoomOptions.controls ||
      options.zoomOptions.wheel ||
      options.zoomOptions.pinch
    ) {
      throw new Error('The miniworkspace bubble does not support zooming');
    }
    if (
      options.moveOptions.scrollbars ||
      options.moveOptions.wheel ||
      options.moveOptions.drag
    ) {
      throw new Error(
        'The miniworkspace bubble does not scrolling/moving the workspace',
      );
    }
    if (options.horizontalLayout) {
      throw new Error(
        'The miniworkspace bubble does not support horizontal layouts',
      );
    }
  }

  private onWorkspaceChange() {
    this.bumpBlocksIntoBounds();
    this.updateBubbleSize();
  }

  /**
   * Bumps blocks that are above the top or outside the start-side of the
   * workspace back within the workspace.
   *
   * Blocks that are below the bottom or outside the end-side of the workspace
   * are dealt with by resizing the workspace to show them.
   */
  private bumpBlocksIntoBounds() {
    if (
      this.miniWorkspace.isDragging() &&
      !this.miniWorkspace.keyboardMoveInProgress
    )
      return;

    const MARGIN = 20;

    for (const block of this.miniWorkspace.getTopBlocks(false)) {
      const blockXY = block.getRelativeToSurfaceXY();

      // Bump any block that's above the top back inside.
      if (blockXY.y < MARGIN) {
        block.moveBy(0, MARGIN - blockXY.y);
      }
      // Bump any block overlapping the flyout back inside.
      if (block.RTL) {
        let right = -MARGIN;
        const flyout = this.miniWorkspace.getFlyout();
        if (flyout) {
          right -= flyout.getWidth();
        }
        if (blockXY.x > right) {
          block.moveBy(right - blockXY.x, 0);
        }
      } else if (blockXY.x < MARGIN) {
        block.moveBy(MARGIN - blockXY.x, 0);
      }
    }
  }

  /**
   * Updates the size of this bubble to account for the size of the
   * mini workspace.
   */
  private updateBubbleSize() {
    if (
      this.miniWorkspace.isDragging() &&
      !this.miniWorkspace.keyboardMoveInProgress
    )
      return;

    // Disable autolayout if a keyboard move is in progress to prevent the
    // mutator bubble from jumping around.
    this.autoLayout &&= !this.miniWorkspace.keyboardMoveInProgress;

    const currSize = this.getSize();
    const newSize = this.calculateWorkspaceSize();
    if (
      Math.abs(currSize.width - newSize.width) <
        MiniWorkspaceBubble.MINIMUM_VIEW_CHANGE &&
      Math.abs(currSize.height - newSize.height) <
        MiniWorkspaceBubble.MINIMUM_VIEW_CHANGE
    ) {
      // Only resize if the size has noticeably changed.
      return;
    }
    this.svgDialog.setAttribute('width', `${newSize.width}px`);
    this.svgDialog.setAttribute('height', `${newSize.height}px`);
    this.miniWorkspace.setCachedParentSvgSize(newSize.width, newSize.height);
    if (this.miniWorkspace.RTL) {
      // Scroll the workspace to always left-align.
      this.miniWorkspace
        .getCanvas()
        .setAttribute('transform', `translate(${newSize.width}, 0)`);
    }
    this.setSize(
      new Size(
        newSize.width + Bubble.DOUBLE_BORDER,
        newSize.height + Bubble.DOUBLE_BORDER,
      ),
      this.autoLayout,
    );
    this.miniWorkspace.resize();
    this.miniWorkspace.recordDragTargets();
  }

  /**
   * Calculates the size of the mini workspace for use in resizing the bubble.
   */
  private calculateWorkspaceSize(): Size {
    const workspaceSize = this.miniWorkspace.getCanvas().getBBox();
    let width = workspaceSize.width + MiniWorkspaceBubble.MARGIN;
    let height = workspaceSize.height + MiniWorkspaceBubble.MARGIN;

    const flyout = this.miniWorkspace.getFlyout();
    if (flyout) {
      const flyoutScrollMetrics = flyout
        .getWorkspace()
        .getMetricsManager()
        .getScrollMetrics();
      height = Math.max(height, flyoutScrollMetrics.height + 20);
      width += flyout.getWidth();
    }
    return new Size(width, height);
  }

  /** Reapplies styles to all of the blocks in the mini workspace. */
  updateBlockStyles() {
    for (const block of this.miniWorkspace.getAllBlocks(false)) {
      block.setStyle(block.getStyleName());
    }

    const flyoutWs = this.miniWorkspace.getFlyout()?.getWorkspace();
    if (flyoutWs) {
      for (const block of flyoutWs.getAllBlocks(false)) {
        block.setStyle(block.getStyleName());
      }
    }
  }

  /**
   * Move this bubble during a drag.
   *
   * @param newLoc The location to translate to, in workspace coordinates.
   * @internal
   */
  moveDuringDrag(newLoc: Coordinate): void {
    super.moveDuringDrag(newLoc);
    this.autoLayout = false;
  }

  /** @internal */
  moveTo(x: number, y: number): void {
    super.moveTo(x, y);
    this.miniWorkspace.recordDragTargets();
  }

  /** @internal */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  newWorkspaceSvg(options: Options): WorkspaceSvg {
    throw new Error(
      'The implementation of newWorkspaceSvg should be ' +
        'monkey-patched in by blockly.ts',
    );
  }
}
