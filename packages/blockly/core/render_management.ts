/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {BlockSvg} from './block_svg.js';
import * as eventUtils from './events/utils.js';
import * as userAgent from './utils/useragent.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/** The set of all blocks in need of rendering which don't have parents. */
const rootBlocks = new Set<BlockSvg>();

/** The set of all blocks in need of rendering. */
const dirtyBlocks = new WeakSet<BlockSvg>();

/**
 * A map from queued blocks to the event context from when they were queued.
 */
const eventContexts = new WeakMap<
  BlockSvg,
  {group: string; recordUndo: boolean}
>();

/**
 * The promise which resolves after the current set of renders is completed. Or
 * null if there are no queued renders.
 *
 * Stored so that we can return it from afterQueuedRenders.
 */
let afterRendersPromise: Promise<void> | null = null;

/** The function to call to resolve the `afterRendersPromise`. */
let afterRendersResolver: (() => void) | null = null;

/**
 * The ID of the current animation frame request. Used to cancel the request
 * if necessary.
 */
let animationRequestId = 0;

/**
 * Registers that the given block and all of its parents need to be rerendered,
 * and registers a callback to do so after a delay, to allowf or batching.
 *
 * @param block The block to rerender.
 * @returns A promise that resolves after the currently queued renders have been
 *     completed. Used for triggering other behavior that relies on updated
 *     size/position location for the block.
 * @internal
 */
export function queueRender(block: BlockSvg): Promise<void> {
  queueBlock(block);

  if (alwaysImmediatelyRender()) {
    doRenders();
    return Promise.resolve();
  }

  if (!afterRendersPromise) {
    afterRendersPromise = new Promise((resolve) => {
      afterRendersResolver = resolve;
      animationRequestId = window.requestAnimationFrame(() => {
        doRenders();
        resolve();
      });
    });
  }
  return afterRendersPromise;
}

/**
 * @returns A promise that resolves after the currently queued renders have
 *     been completed.
 */
export function finishQueuedRenders(): Promise<void> {
  // If there are no queued renders, return a resolved promise so `then`
  // callbacks trigger immediately.
  return afterRendersPromise ? afterRendersPromise : Promise.resolve();
}

/**
 * Triggers an immediate render of all queued renders. Should only be used in
 * cases where queueing renders breaks functionality + backwards compatibility
 * (such as rendering icons).
 *
 * @param workspace If provided, only rerender blocks in this workspace.
 *
 * @internal
 */
export function triggerQueuedRenders(workspace?: WorkspaceSvg) {
  if (!workspace) window.cancelAnimationFrame(animationRequestId);
  doRenders(workspace);
  if (!workspace && afterRendersResolver) afterRendersResolver();
}

/**
 * @returns True if we should always trigger an immediate render.
 *     Some platforms don't properly support `requestAnimationFrame`, so to
 *     avoid glitchiness, we give up the performance improvements.
 */
function alwaysImmediatelyRender() {
  return userAgent.JavaFx;
}

/**
 * Adds the given block and its parents to the render queue. Adds the root block
 * to the list of root blocks.
 *
 * @param block The block to queue.
 */
function queueBlock(block: BlockSvg) {
  dirtyBlocks.add(block);
  eventContexts.set(block, {
    group: eventUtils.getGroup(),
    recordUndo: eventUtils.getRecordUndo(),
  });
  const parent = block.getParent();
  if (parent) {
    queueBlock(parent);
  } else {
    rootBlocks.add(block);
  }
}

/**
 * Rerenders all of the blocks in the queue.
 *
 * @param workspace If provided, only rerender blocks in this workspace.
 */
function doRenders(workspace?: WorkspaceSvg) {
  const workspaces = workspace
    ? new Set([workspace])
    : new Set([...rootBlocks].map((block) => block.workspace));
  const blocks = [...rootBlocks]
    .filter(shouldRenderRootBlock)
    .filter((b) => workspaces.has(b.workspace));
  for (const block of blocks) {
    renderBlock(block);
  }
  for (const workspace of workspaces) {
    workspace.resizeContents();
    workspace.connectionDBList.forEach((db) => db?.beginBulkUpdates());
  }
  for (const block of blocks) {
    const blockOrigin = block.getRelativeToSurfaceXY();
    block.updateComponentLocations(blockOrigin);
  }
  for (const workspace of workspaces) {
    workspace.connectionDBList.forEach((db) => db?.endBulkUpdates());
  }
  for (const block of blocks) {
    const oldGroup = eventUtils.getGroup();
    const oldRecordUndo = eventUtils.getRecordUndo();
    const context = eventContexts.get(block);
    if (context) {
      if (context.group) eventUtils.setGroup(context.group);
      eventUtils.setRecordUndo(context.recordUndo);
    }

    block.bumpNeighbours();

    eventUtils.setGroup(oldGroup);
    eventUtils.setRecordUndo(oldRecordUndo);
  }

  for (const block of blocks) {
    dequeueBlock(block);
  }
  if (!workspace) afterRendersPromise = null;
}

/** Removes the given block and children from the render queue. */
function dequeueBlock(block: BlockSvg) {
  rootBlocks.delete(block);
  dirtyBlocks.delete(block);
  eventContexts.delete(block);
  for (const child of block.getChildren(false)) {
    dequeueBlock(child);
  }
}

/**
 * Returns true if the block should be rendered.
 *
 * No need to render dead blocks.
 *
 * No need to render blocks with parents. A render for the block may have been
 * queued, and the block was connected to a parent, so it is no longer a
 * root block. Rendering will be triggered through the real root block.
 */
function shouldRenderRootBlock(block: BlockSvg): boolean {
  return !block.isDisposed() && !block.getParent();
}

/**
 * Recursively renders all of the dirty children of the given block, and
 * then renders the block.
 *
 * @param block The block to rerender.
 */
function renderBlock(block: BlockSvg) {
  if (!dirtyBlocks.has(block)) return;
  if (!block.initialized) return;
  for (const child of block.getChildren(false)) {
    renderBlock(child);
  }
  block.renderEfficiently();
}
