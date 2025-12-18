/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.common

import type {Block} from './block.js';
import {BlockDefinition, Blocks} from './blocks.js';
import * as browserEvents from './browser_events.js';
import type {Connection} from './connection.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import {getFocusManager} from './focus_manager.js';
import {ISelectable, isSelectable} from './interfaces/i_selectable.js';
import {ShortcutRegistry} from './shortcut_registry.js';
import type {Workspace} from './workspace.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/** Database of all workspaces. */
const WorkspaceDB_ = Object.create(null);

/**
 * Find the workspace with the specified ID.
 *
 * @param id ID of workspace to find.
 * @returns The sought after workspace or null if not found.
 */
export function getWorkspaceById(id: string): Workspace | null {
  return WorkspaceDB_[id] || null;
}

/**
 * Find all workspaces.
 *
 * @returns Array of workspaces.
 */
export function getAllWorkspaces(): Workspace[] {
  const workspaces = [];
  for (const workspaceId in WorkspaceDB_) {
    workspaces.push(WorkspaceDB_[workspaceId]);
  }
  return workspaces;
}

/**
 * Register a workspace in the workspace db.
 *
 * @param workspace
 */
export function registerWorkspace(workspace: Workspace) {
  WorkspaceDB_[workspace.id] = workspace;
}

/**
 * Unregister a workspace from the workspace db.
 *
 * @param workspace
 */
export function unregisterWorkpace(workspace: Workspace) {
  delete WorkspaceDB_[workspace.id];
}

/**
 * The main workspace most recently used.
 * Set by Blockly.WorkspaceSvg.prototype.markFocused
 */
let mainWorkspace: Workspace;

/**
 * Returns the last used top level workspace (based on focus).  Try not to use
 * this function, particularly if there are multiple Blockly instances on a
 * page.
 *
 * @returns The main workspace.
 */
export function getMainWorkspace(): Workspace {
  return mainWorkspace;
}

/**
 * Sets last used main workspace.
 *
 * @param workspace The most recently used top level workspace.
 */
export function setMainWorkspace(workspace: Workspace) {
  mainWorkspace = workspace;
}

/**
 * Returns the current selection.
 */
export function getSelected(): ISelectable | null {
  const focused = getFocusManager().getFocusedNode();
  if (focused && isSelectable(focused)) return focused;
  return null;
}

/**
 * Sets the current selection.
 *
 * To clear the current selection, select another ISelectable or focus a
 * non-selectable (like the workspace root node).
 *
 * @param newSelection The new selection to make.
 * @internal
 */
export function setSelected(newSelection: ISelectable) {
  getFocusManager().focusNode(newSelection);
}

/**
 * Fires a selection change event based on the new selection.
 *
 * This is only expected to be called by ISelectable implementations and should
 * always be called before updating the current selection state. It does not
 * change focus or selection state.
 *
 * @param newSelection The new selection.
 * @internal
 */
export function fireSelectedEvent(newSelection: ISelectable | null) {
  const selected = getSelected();
  const event = new (eventUtils.get(EventType.SELECTED))(
    selected?.id ?? null,
    newSelection?.id ?? null,
    newSelection?.workspace.id ?? selected?.workspace.id ?? '',
  );
  eventUtils.fire(event);
}

/**
 * Container element in which to render the WidgetDiv, DropDownDiv and Tooltip.
 */
let parentContainer: Element | null;

/**
 * Get the container element in which to render the WidgetDiv, DropDownDiv and
 * Tooltip.
 *
 * @returns The parent container.
 */
export function getParentContainer(): Element | null {
  return parentContainer;
}

/**
 * Set the parent container.  This is the container element that the WidgetDiv,
 * DropDownDiv, and Tooltip are rendered into the first time `Blockly.inject`
 * is called.
 * This method is a NOP if called after the first `Blockly.inject`.
 *
 * @param newParent The container element.
 */
export function setParentContainer(newParent: Element) {
  parentContainer = newParent;
}

/**
 * Size the SVG image to completely fill its container. Call this when the view
 * actually changes sizes (e.g. on a window resize/device orientation change).
 * See workspace.resizeContents to resize the workspace when the contents
 * change (e.g. when a block is added or removed).
 * Record the height/width of the SVG image.
 *
 * @param workspace Any workspace in the SVG.
 */
export function svgResize(workspace: WorkspaceSvg) {
  let mainWorkspace = workspace;
  while (mainWorkspace.options.parentWorkspace) {
    mainWorkspace = mainWorkspace.options.parentWorkspace;
  }
  const svg = mainWorkspace.getParentSvg();
  const cachedSize = mainWorkspace.getCachedParentSvgSize();
  const div = svg.parentElement;
  if (!(div instanceof HTMLElement)) {
    // Workspace deleted, or something.
    return;
  }

  const width = div.offsetWidth;
  const height = div.offsetHeight;
  if (cachedSize.width !== width) {
    svg.setAttribute('width', width + 'px');
    mainWorkspace.setCachedParentSvgSize(width, null);
  }
  if (cachedSize.height !== height) {
    svg.setAttribute('height', height + 'px');
    mainWorkspace.setCachedParentSvgSize(null, height);
  }
  mainWorkspace.resize();
}

/**
 * All of the connections on blocks that are currently being dragged.
 */
export const draggingConnections: Connection[] = [];

/**
 * Get a map of all the block's descendants mapping their type to the number of
 *    children with that type.
 *
 * @param block The block to map.
 * @param opt_stripFollowing Optionally ignore all following
 *    statements (blocks that are not inside a value or statement input
 *    of the block).
 * @returns Map of types to type counts for descendants of the bock.
 */
export function getBlockTypeCounts(
  block: Block,
  opt_stripFollowing?: boolean,
): {[key: string]: number} {
  const typeCountsMap = Object.create(null);
  const descendants = block.getDescendants(true);
  if (opt_stripFollowing) {
    const nextBlock = block.getNextBlock();
    if (nextBlock) {
      const index = descendants.indexOf(nextBlock);
      descendants.splice(index, descendants.length - index);
    }
  }
  for (let i = 0, checkBlock; (checkBlock = descendants[i]); i++) {
    if (typeCountsMap[checkBlock.type]) {
      typeCountsMap[checkBlock.type]++;
    } else {
      typeCountsMap[checkBlock.type] = 1;
    }
  }
  return typeCountsMap;
}

/**
 * Helper function for defining a block from JSON.  The resulting function has
 * the correct value of jsonDef at the point in code where jsonInit is called.
 *
 * @param jsonDef The JSON definition of a block.
 * @returns A function that calls jsonInit with the correct value
 *     of jsonDef.
 */
function jsonInitFactory(jsonDef: AnyDuringMigration): () => void {
  return function (this: Block) {
    this.jsonInit(jsonDef);
  };
}

/**
 * Define blocks from an array of JSON block definitions, as might be generated
 * by the Blockly Developer Tools.
 *
 * @param jsonArray An array of JSON block definitions.
 */
export function defineBlocksWithJsonArray(jsonArray: AnyDuringMigration[]) {
  TEST_ONLY.defineBlocksWithJsonArrayInternal(jsonArray);
}

/**
 * Private version of defineBlocksWithJsonArray for stubbing in tests.
 */
function defineBlocksWithJsonArrayInternal(jsonArray: AnyDuringMigration[]) {
  defineBlocks(createBlockDefinitionsFromJsonArray(jsonArray));
}

/**
 * Define blocks from an array of JSON block definitions, as might be generated
 * by the Blockly Developer Tools.
 *
 * @param jsonArray An array of JSON block definitions.
 * @returns A map of the block
 *     definitions created.
 */
export function createBlockDefinitionsFromJsonArray(
  jsonArray: AnyDuringMigration[],
): {[key: string]: BlockDefinition} {
  const blocks: {[key: string]: BlockDefinition} = {};
  for (let i = 0; i < jsonArray.length; i++) {
    const elem = jsonArray[i];
    if (!elem) {
      console.warn(`Block definition #${i} in JSON array is ${elem}. Skipping`);
      continue;
    }
    const type = elem['type'];
    if (!type) {
      console.warn(
        `Block definition #${i} in JSON array is missing a type attribute. ` +
          'Skipping.',
      );
      continue;
    }
    blocks[type] = {init: jsonInitFactory(elem)};
  }
  return blocks;
}

/**
 * Add the specified block definitions to the block definitions
 * dictionary (Blockly.Blocks).
 *
 * @param blocks A map of block
 *     type names to block definitions.
 */
export function defineBlocks(blocks: {[key: string]: BlockDefinition}) {
  // Iterate over own enumerable properties.
  for (const type of Object.keys(blocks)) {
    const definition = blocks[type];
    if (type in Blocks) {
      console.warn(
        `Block definition "${type}" overwrites previous definition.`,
      );
    }
    Blocks[type] = definition;
  }
}

/**
 * Handle a key-down on SVG drawing surface. Does nothing if the main workspace
 * is not visible.
 *
 * @internal
 * @param e Key down event.
 */
export function globalShortcutHandler(e: KeyboardEvent) {
  // This would ideally just be a `focusedTree instanceof WorkspaceSvg`, but
  // importing `WorkspaceSvg` (as opposed to just its type) causes cycles.
  let workspace: WorkspaceSvg = getMainWorkspace() as WorkspaceSvg;
  const focusedTree = getFocusManager().getFocusedTree();
  for (const ws of getAllWorkspaces()) {
    if (focusedTree === (ws as WorkspaceSvg)) {
      workspace = ws as WorkspaceSvg;
      break;
    }
  }

  if (
    browserEvents.isTargetInput(e) ||
    !workspace ||
    (workspace.rendered && !workspace.isFlyout && !workspace.isVisible())
  ) {
    // When focused on an HTML text input widget, don't trap any keys.
    // Ignore keypresses on rendered workspaces that have been explicitly
    // hidden.
    return;
  }
  ShortcutRegistry.registry.onKeyDown(workspace, e);
}

export const TEST_ONLY = {defineBlocksWithJsonArrayInternal};
