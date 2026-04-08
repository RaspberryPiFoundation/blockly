/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {Msg} from './msg.js';
import {Toast} from './toast.js';
import {getShortActionShortcut} from './utils/shortcut_formatting.js';
import * as userAgent from './utils/useragent.js';
import type {WorkspaceSvg} from './workspace_svg.js';

const unconstrainedMoveHintId = 'unconstrainedMoveHint';
const constrainedMoveHintId = 'constrainedMoveHint';
const helpHintId = 'helpHint';
const blockNavigationHintId = 'blockNavigationHint';
const workspaceNavigationHintId = 'workspaceNavigationHint';

/**
 * Nudge the user to use unconstrained movement.
 *
 * @param workspace Workspace.
 * @param force Set to show it even if previously shown.
 */
export function showUnconstrainedMoveHint(
  workspace: WorkspaceSvg,
  force = false,
) {
  const modifier =
    userAgent.MAC || userAgent.IPAD || userAgent.IPHONE
      ? Msg['COMMAND_KEY']
      : Msg['CONTROL_KEY'];
  const message = Msg['KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT']
    .replace('%1', modifier)
    .replace('%2', Msg['ENTER_KEY']);
  Toast.show(workspace, {
    message,
    id: unconstrainedMoveHintId,
    oncePerSession: !force,
  });
}

/**
 * Nudge the user to move a block that's in move mode.
 *
 * @param workspace Workspace.
 */
export function showConstrainedMovementHint(workspace: WorkspaceSvg) {
  const message = Msg['KEYBOARD_NAV_CONSTRAINED_MOVE_HINT'].replace(
    '%1',
    Msg['ENTER_KEY'],
  );
  Toast.show(workspace, {
    message,
    id: constrainedMoveHintId,
    oncePerSession: true,
  });
}

/**
 * Clear active move-related hints, if any.
 *
 * @param workspace The workspace.
 */
export function clearMoveHints(workspace: WorkspaceSvg) {
  Toast.hide(workspace, constrainedMoveHintId);
  Toast.hide(workspace, unconstrainedMoveHintId);
}

/**
 * Nudge the user to open the help.
 *
 * @param workspace The workspace.
 */
export function showHelpHint(workspace: WorkspaceSvg) {
  const shortcut = getShortActionShortcut('list_shortcuts');
  if (!shortcut) return;

  const message = Msg['HELP_PROMPT'].replace('%1', shortcut);
  const id = helpHintId;
  Toast.show(workspace, {message, id});
}

/**
 * Tell the user how to navigate inside blocks.
 *
 * @param workspace The workspace.
 */
export function showBlockNavigationHint(workspace: WorkspaceSvg) {
  const message = Msg['KEYBOARD_NAV_BLOCK_NAVIGATION_HINT'];
  const id = blockNavigationHintId;
  Toast.show(workspace, {message, id});
}

/**
 * Tell the user how to navigate inside the workspace.
 *
 * @param workspace The workspace.
 */
export function showWorkspaceNavigationHint(workspace: WorkspaceSvg) {
  const message = Msg['KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT'];
  const id = workspaceNavigationHintId;
  Toast.show(workspace, {message, id});
}
