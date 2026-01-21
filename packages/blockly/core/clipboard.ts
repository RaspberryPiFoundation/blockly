/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.clipboard

import {BlockCopyData, BlockPaster} from './clipboard/block_paster.js';
import * as registry from './clipboard/registry.js';
import type {ICopyData, ICopyable} from './interfaces/i_copyable.js';
import {isSelectable} from './interfaces/i_selectable.js';
import * as globalRegistry from './registry.js';
import {Coordinate} from './utils/coordinate.js';
import {WorkspaceSvg} from './workspace_svg.js';

/** Metadata about the object that is currently on the clipboard. */
let stashedCopyData: ICopyData | null = null;

let stashedWorkspace: WorkspaceSvg | null = null;

let stashedCoordinates: Coordinate | undefined = undefined;

/**
 * Copy a copyable item, and record its data and the workspace it was
 * copied from.
 *
 * This function does not perform any checks to ensure the copy
 * should be allowed, e.g. to ensure the block is deletable. Such
 * checks should be done before calling this function.
 *
 * Note that if the copyable item is not an `ISelectable` or its
 * `workspace` property is not a `WorkspaceSvg`, the copy will be
 * successful, but there will be no saved workspace data. This will
 * impact the ability to paste the data unless you explictily pass
 * a workspace into the paste method.
 *
 * @param toCopy item to copy.
 * @param location location to save as a potential paste location.
 * @returns the copied data if copy was successful, otherwise null.
 */
export function copy<T extends ICopyData>(
  toCopy: ICopyable<T>,
  location?: Coordinate,
): T | null {
  const data = toCopy.toCopyData();
  stashedCopyData = data;
  if (isSelectable(toCopy) && toCopy.workspace instanceof WorkspaceSvg) {
    stashedWorkspace = toCopy.workspace;
  } else {
    stashedWorkspace = null;
  }

  stashedCoordinates = location;
  return data;
}

/**
 * Gets the copy data for the last item copied. This is useful if you
 * are implementing custom copy/paste behavior. If you want the default
 * behavior, just use the copy and paste methods directly.
 *
 * @returns copy data for the last item copied, or null if none set.
 */
export function getLastCopiedData() {
  return stashedCopyData;
}

/**
 * Sets the last copied item. You should call this method if you implement
 * custom copy behavior, so that other callers are working with the correct
 * data. This method is called automatically if you use the built-in copy
 * method.
 *
 * @param copyData copy data for the last item copied.
 */
export function setLastCopiedData(copyData: ICopyData) {
  stashedCopyData = copyData;
}

/**
 * Gets the workspace that was last copied from. This is useful if you
 * are implementing custom copy/paste behavior and want to paste on the
 * same workspace that was copied from. If you want the default behavior,
 * just use the copy and paste methods directly.
 *
 * @returns workspace that was last copied from, or null if none set.
 */
export function getLastCopiedWorkspace() {
  return stashedWorkspace;
}

/**
 * Sets the workspace that was last copied from. You should call this method
 * if you implement custom copy behavior, so that other callers are working
 * with the correct data. This method is called automatically if you use the
 * built-in copy method.
 *
 * @param workspace workspace that was last copied from.
 */
export function setLastCopiedWorkspace(workspace: WorkspaceSvg) {
  stashedWorkspace = workspace;
}

/**
 * Gets the location that was last copied from. This is useful if you
 * are implementing custom copy/paste behavior. If you want the
 * default behavior, just use the copy and paste methods directly.
 *
 * @returns last saved location, or null if none set.
 */
export function getLastCopiedLocation() {
  return stashedCoordinates;
}

/**
 * Sets the location that was last copied from. You should call this method
 * if you implement custom copy behavior, so that other callers are working
 * with the correct data. This method is called automatically if you use the
 * built-in copy method.
 *
 * @param location last saved location, which can be used to paste at.
 */
export function setLastCopiedLocation(location: Coordinate) {
  stashedCoordinates = location;
}

/**
 * Paste a pasteable element into the given workspace.
 *
 * This function does not perform any checks to ensure the paste
 * is allowed, e.g. that the workspace is rendered or the block
 * is pasteable. Such checks should be done before calling this
 * function.
 *
 * @param copyData The data to paste into the workspace.
 * @param workspace The workspace to paste the data into.
 * @param coordinate The location to paste the thing at.
 * @returns The pasted thing if the paste was successful, null otherwise.
 */
export function paste<T extends ICopyData>(
  copyData: T,
  workspace: WorkspaceSvg,
  coordinate?: Coordinate,
): ICopyable<T> | null;

/**
 * Pastes the last copied ICopyable into the last copied-from workspace.
 *
 * @returns the pasted thing if the paste was successful, null otherwise.
 */
export function paste(): ICopyable<ICopyData> | null;

/**
 * Pastes the given data into the workspace, or the last copied ICopyable if
 * no data is passed.
 *
 * @param copyData The data to paste into the workspace.
 * @param workspace The workspace to paste the data into.
 * @param coordinate The location to paste the thing at.
 * @returns The pasted thing if the paste was successful, null otherwise.
 */
export function paste<T extends ICopyData>(
  copyData?: T,
  workspace?: WorkspaceSvg,
  coordinate?: Coordinate,
): ICopyable<ICopyData> | null {
  if (!copyData || !workspace) {
    if (!stashedCopyData || !stashedWorkspace) return null;
    return pasteFromData(stashedCopyData, stashedWorkspace, stashedCoordinates);
  }
  return pasteFromData(copyData, workspace, coordinate);
}

/**
 * Paste a pasteable element into the workspace.
 *
 * @param copyData The data to paste into the workspace.
 * @param workspace The workspace to paste the data into.
 * @param coordinate The location to paste the thing at.
 * @returns The pasted thing if the paste was successful, null otherwise.
 */
function pasteFromData<T extends ICopyData>(
  copyData: T,
  workspace: WorkspaceSvg,
  coordinate?: Coordinate,
): ICopyable<T> | null {
  workspace = workspace.isMutator
    ? workspace
    : // Use the parent workspace if it exists (e.g. for pasting into flyouts)
      (workspace.options.parentWorkspace ?? workspace);
  return (globalRegistry
    .getObject(globalRegistry.Type.PASTER, copyData.paster, false)
    ?.paste(copyData, workspace, coordinate) ?? null) as ICopyable<T> | null;
}

export {BlockCopyData, BlockPaster, registry};
