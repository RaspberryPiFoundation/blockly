/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.ShortcutItems

import {computeAriaLabel} from './block_aria_composer.js';
import {BlockSvg} from './block_svg.js';
import * as clipboard from './clipboard.js';
import {RenderedWorkspaceComment} from './comments.js';
import * as contextmenu from './contextmenu.js';
import type {Scope} from './contextmenu_registry.js';
import * as dropDownDiv from './dropdowndiv.js';
import * as eventUtils from './events/utils.js';
import {FlyoutButton} from './flyout_button.js';
import {getFocusManager} from './focus_manager.js';
import {
  clearPasteHints,
  showCopiedHint,
  showCutHint,
  showScreenreaderModeHint,
} from './hints.js';
import {hasContextMenu} from './interfaces/i_contextmenu.js';
import {isCopyable as isICopyable} from './interfaces/i_copyable.js';
import {isDeletable as isIDeletable} from './interfaces/i_deletable.js';
import {type IDraggable, isDraggable} from './interfaces/i_draggable.js';
import {type IFlyout} from './interfaces/i_flyout.js';
import {type IFocusableNode} from './interfaces/i_focusable_node.js';
import {isSelectable} from './interfaces/i_selectable.js';
import {Direction, KeyboardMover} from './keyboard_nav/keyboard_mover.js';
import {keyboardNavigationController} from './keyboard_navigation_controller.js';
import {Msg} from './msg.js';
import {RenderedConnection} from './rendered_connection.js';
import {KeyboardShortcut, ShortcutRegistry} from './shortcut_registry.js';
import * as Tooltip from './tooltip.js';
import {aria} from './utils.js';
import {Coordinate} from './utils/coordinate.js';
import {KeyCodes} from './utils/keycodes.js';
import {Rect} from './utils/rect.js';
import * as svgMath from './utils/svg_math.js';
import * as widgetDiv from './widgetdiv.js';
import {WorkspaceSvg} from './workspace_svg.js';

/**
 * Object holding the names of the default shortcut items.
 */
export enum names {
  ESCAPE = 'escape',
  DELETE = 'delete',
  COPY = 'copy',
  CUT = 'cut',
  PASTE = 'paste',
  UNDO = 'undo',
  REDO = 'redo',
  MENU = 'menu',
  FOCUS_WORKSPACE = 'focus_workspace',
  FOCUS_TOOLBOX = 'focus_toolbox',
  START_MOVE = 'start_move',
  START_MOVE_STACK = 'start_move_stack',
  FINISH_MOVE = 'finish_move',
  ABORT_MOVE = 'abort_move',
  MOVE_UP = 'move_up',
  MOVE_DOWN = 'move_down',
  MOVE_LEFT = 'move_left',
  MOVE_RIGHT = 'move_right',
  NAVIGATE_RIGHT = 'right',
  NAVIGATE_LEFT = 'left',
  NAVIGATE_UP = 'up',
  NAVIGATE_DOWN = 'down',
  DISCONNECT = 'disconnect',
  NEXT_STACK = 'next_stack',
  PREVIOUS_STACK = 'previous_stack',
  INFORMATION = 'information',
  EXTENDED_INFORMATION = 'extended_information',
  PERFORM_ACTION = 'perform_action',
  DUPLICATE = 'duplicate',
  CLEANUP = 'cleanup',
  SHOW_TOOLTIP = 'show_tooltip',
  NEXT_HEADING = 'next_heading',
  PREVIOUS_HEADING = 'previous_heading',
  TOGGLE_SCREENREADER = 'toggle_screenreader',
  JUMP_TOP_STACK = 'jump_to_top_of_stack',
  JUMP_BOTTOM_STACK = 'jump_to_bottom_of_stack',
  JUMP_BLOCK_START = 'jump_to_block_start',
  JUMP_BLOCK_END = 'jump_to_block_end',
  JUMP_FIRST_BLOCK = 'jump_to_first_block',
  JUMP_LAST_BLOCK = 'jump_to_last_block',
}

/**
 * Keyboard shortcut to hide chaff on escape.
 */
export function registerEscape() {
  const escapeAction: KeyboardShortcut = {
    name: names.ESCAPE,
    preconditionFn(workspace) {
      return !workspace.isReadOnly();
    },
    callback(workspace) {
      workspace.hideChaff();
      return true;
    },
    keyCodes: [KeyCodes.ESC],
    displayText: () => Msg['SHORTCUTS_ESCAPE'],
  };
  ShortcutRegistry.registry.register(escapeAction);
}

/**
 * Keyboard shortcut to delete a block on delete or backspace
 */
export function registerDelete() {
  const deleteShortcut: KeyboardShortcut = {
    name: names.DELETE,
    preconditionFn(workspace, scope) {
      const focused = scope.focusedNode;
      const result =
        !workspace.isReadOnly() &&
        focused != null &&
        isIDeletable(focused) &&
        focused.isDeletable() &&
        !workspace.isDragging() &&
        // Don't delete the block if a field editor is open
        !getFocusManager().ephemeralFocusTaken();
      if (!result) {
        workspace.getAudioManager().playErrorBeep();
      }
      return result;
    },
    callback(workspace, e, shortcut, scope) {
      // Delete or backspace.
      // Stop the browser from going back to the previous page.
      // Do this first to prevent an error in the delete code from resulting in
      // data loss.
      e.preventDefault();
      const focused = scope.focusedNode;
      if (focused instanceof BlockSvg) {
        focused.checkAndDelete();
      } else if (isIDeletable(focused) && focused.isDeletable()) {
        eventUtils.setGroup(true);
        focused.dispose();
        eventUtils.setGroup(false);
        workspace.getAudioManager().play('delete');
      }
      return true;
    },
    keyCodes: [KeyCodes.DELETE, KeyCodes.BACKSPACE],
    displayText: () => Msg['SHORTCUTS_DELETE'],
  };
  ShortcutRegistry.registry.register(deleteShortcut);
}

/**
 * Determine if a focusable node can be copied.
 *
 * This will use the isCopyable method if the node implements it, otherwise
 * it will fall back to checking if the node is deletable and draggable not
 * considering the workspace's edit state.
 *
 * @param focused The focused object.
 */
function isCopyable(focused: IFocusableNode): boolean {
  if (!isICopyable(focused) || !isIDeletable(focused) || !isDraggable(focused))
    return false;
  if (focused.isCopyable) {
    return focused.isCopyable();
  } else if (
    focused instanceof BlockSvg ||
    focused instanceof RenderedWorkspaceComment
  ) {
    return focused.isOwnDeletable() && focused.isOwnMovable();
  }
  // This isn't a class Blockly knows about, so fall back to the stricter
  // checks for deletable and movable.
  return focused.isDeletable() && focused.isMovable();
}

/**
 * Determine if a focusable node can be cut.
 *
 * This will check if the node can be both copied and deleted in its current
 * workspace.
 *
 * @param focused The focused object.
 */
function isCuttable(focused: IFocusableNode): boolean {
  return isCopyable(focused) && isIDeletable(focused) && focused.isDeletable();
}

/**
 * Keyboard shortcut to copy a block on ctrl+c, cmd+c, or alt+c.
 */
export function registerCopy() {
  const ctrlC = ShortcutRegistry.registry.createSerializedKey(KeyCodes.C, [
    KeyCodes.CTRL_CMD,
  ]);

  const copyShortcut: KeyboardShortcut = {
    name: names.COPY,
    preconditionFn(workspace, scope) {
      const focused = scope.focusedNode;

      const targetWorkspace = workspace.isFlyout
        ? workspace.targetWorkspace
        : workspace;
      const result =
        !!focused &&
        !!targetWorkspace &&
        !targetWorkspace.isDragging() &&
        !getFocusManager().ephemeralFocusTaken() &&
        isCopyable(focused);
      if (!result) {
        workspace.getAudioManager().playErrorBeep();
      }
      return result;
    },
    callback(workspace, e, shortcut, scope) {
      // Prevent the default copy behavior, which may beep or otherwise indicate
      // an error due to the lack of a selection.
      e.preventDefault();

      const focused = scope.focusedNode;
      if (!focused || !isICopyable(focused) || !isCopyable(focused))
        return false;
      const targetWorkspace = workspace.isFlyout
        ? workspace.targetWorkspace
        : workspace;
      if (!targetWorkspace) return false;

      if (!focused.workspace.isFlyout) {
        targetWorkspace.hideChaff();
      }

      const copyCoords =
        isDraggable(focused) && focused.workspace == targetWorkspace
          ? focused.getRelativeToSurfaceXY()
          : undefined;
      const copied = !!clipboard.copy(focused, copyCoords);
      if (copied && e instanceof KeyboardEvent) {
        showCopiedHint(workspace);
      }
      return copied;
    },
    keyCodes: [ctrlC],
    displayText: () => Msg['COPY_SHORTCUT'],
  };
  ShortcutRegistry.registry.register(copyShortcut);
}

/**
 * Keyboard shortcut to copy and delete a block on ctrl+x, cmd+x, or alt+x.
 */
export function registerCut() {
  const ctrlX = ShortcutRegistry.registry.createSerializedKey(KeyCodes.X, [
    KeyCodes.CTRL_CMD,
  ]);

  const cutShortcut: KeyboardShortcut = {
    name: names.CUT,
    preconditionFn(workspace, scope) {
      const focused = scope.focusedNode;
      const result =
        !!focused &&
        !workspace.isReadOnly() &&
        !workspace.isDragging() &&
        !getFocusManager().ephemeralFocusTaken() &&
        isCuttable(focused);
      if (!result) {
        workspace.getAudioManager().playErrorBeep();
      }
      return result;
    },
    callback(workspace, e, shortcut, scope) {
      const focused = scope.focusedNode;
      if (!focused || !isCuttable(focused) || !isICopyable(focused)) {
        return false;
      }
      const copyCoords = isDraggable(focused)
        ? focused.getRelativeToSurfaceXY()
        : undefined;
      const copyData = clipboard.copy(focused, copyCoords);

      if (focused instanceof BlockSvg) {
        focused.checkAndDelete();
        e.preventDefault();
      } else if (isIDeletable(focused)) {
        eventUtils.setGroup(true);
        focused.dispose();
        eventUtils.setGroup(false);
        workspace.getAudioManager().play('delete');
        e.preventDefault();
      }
      if (copyData && e instanceof KeyboardEvent) {
        showCutHint(workspace);
      }
      return !!copyData;
    },
    keyCodes: [ctrlX],
    displayText: () => Msg['CUT_SHORTCUT'],
  };

  ShortcutRegistry.registry.register(cutShortcut);
}

/**
 * Keyboard shortcut to paste a block on ctrl+v, cmd+v, or alt+v.
 */
export function registerPaste() {
  const ctrlV = ShortcutRegistry.registry.createSerializedKey(KeyCodes.V, [
    KeyCodes.CTRL_CMD,
  ]);

  const pasteShortcut: KeyboardShortcut = {
    name: names.PASTE,
    preconditionFn() {
      // Regardless of the currently focused workspace, we will only
      // paste into the last-copied-from workspace.
      const workspace = clipboard.getLastCopiedWorkspace();
      // If we don't know where we copied from, we don't know where to paste.
      // If the workspace isn't rendered (e.g. closed mutator workspace),
      // we can't paste into it.
      if (!workspace || !workspace.rendered) return false;
      const targetWorkspace = workspace.isFlyout
        ? workspace.targetWorkspace
        : workspace;
      const result =
        !!clipboard.getLastCopiedData() &&
        !!targetWorkspace &&
        !targetWorkspace.isReadOnly() &&
        !targetWorkspace.isDragging() &&
        !getFocusManager().ephemeralFocusTaken();
      if (!result) {
        workspace.getAudioManager().playErrorBeep();
      }
      return result;
    },
    callback(workspace: WorkspaceSvg, e: Event) {
      const copyData = clipboard.getLastCopiedData();
      const focusedNode = getFocusManager().getFocusedNode();
      if (!copyData) return false;

      const copyWorkspace = clipboard.getLastCopiedWorkspace();
      if (!copyWorkspace) return false;

      clearPasteHints(workspace);

      const targetWorkspace = copyWorkspace.isFlyout
        ? copyWorkspace.targetWorkspace
        : copyWorkspace;
      if (!targetWorkspace || targetWorkspace.isReadOnly()) return false;

      if (e instanceof PointerEvent) {
        // The event that triggers a shortcut would conventionally be a KeyboardEvent.
        // However, it may be a PointerEvent if a context menu item was used as a
        // wrapper for this callback, in which case the new block(s) should be pasted
        // at the mouse coordinates where the menu was opened, and this PointerEvent
        // is where the menu was opened.
        const mouseCoords = svgMath.screenToWsCoordinates(
          targetWorkspace,
          new Coordinate(e.clientX, e.clientY),
        );
        return !!clipboard.paste(copyData, targetWorkspace, mouseCoords);
      }

      // If the focused node is a block, or part of a block (connection, field, etc.),
      // paste relative to that block's position.
      const block = targetWorkspace
        .getNavigator()
        .getSourceBlockFromNode(focusedNode);
      const pasteOrigin = block?.getRelativeToSurfaceXY();
      if (pasteOrigin) {
        return !!clipboard.paste(copyData, targetWorkspace, pasteOrigin);
      }

      // No spatial focus target (e.g. workspace root) — use copy-location behavior.
      const copyCoords = clipboard.getLastCopiedLocation();
      if (!copyCoords) {
        // If we don't have location data about the original copyable, let the
        // paster determine position.
        return !!clipboard.paste(copyData, targetWorkspace);
      }

      const {left, top, width, height} = targetWorkspace
        .getMetricsManager()
        .getViewMetrics(true);
      const viewportRect = new Rect(top, top + height, left, left + width);

      if (viewportRect.contains(copyCoords.x, copyCoords.y)) {
        // If the original copyable is inside the viewport, let the paster
        // determine position.
        return !!clipboard.paste(copyData, targetWorkspace);
      }

      // Otherwise, paste in the middle of the viewport.
      const centerCoords = new Coordinate(left + width / 2, top + height / 2);
      return !!clipboard.paste(copyData, targetWorkspace, centerCoords);
    },
    keyCodes: [ctrlV],
    displayText: () => Msg['PASTE_SHORTCUT'],
  };

  ShortcutRegistry.registry.register(pasteShortcut);
}

/**
 * Keyboard shortcut to undo the previous action on ctrl+z, cmd+z, or alt+z.
 */
export function registerUndo() {
  const ctrlZ = ShortcutRegistry.registry.createSerializedKey(KeyCodes.Z, [
    KeyCodes.CTRL_CMD,
  ]);

  const undoShortcut: KeyboardShortcut = {
    name: names.UNDO,
    preconditionFn(workspace) {
      return (
        !workspace.isReadOnly() &&
        !workspace.isDragging() &&
        !getFocusManager().ephemeralFocusTaken()
      );
    },
    callback(workspace, e) {
      // 'z' for undo 'Z' is for redo.
      (workspace as WorkspaceSvg).hideChaff();
      workspace.undo();
      e.preventDefault();
      return true;
    },
    keyCodes: [ctrlZ],
    displayText: () => Msg['UNDO'],
  };
  ShortcutRegistry.registry.register(undoShortcut);
}

/**
 * Keyboard shortcut to redo the previous action on ctrl+shift+z, cmd+shift+z,
 * or alt+shift+z.
 */
export function registerRedo() {
  const ctrlShiftZ = ShortcutRegistry.registry.createSerializedKey(KeyCodes.Z, [
    KeyCodes.CTRL_CMD,
    KeyCodes.SHIFT,
  ]);

  // Ctrl-y is redo in Windows.  Command-y is never valid on Macs.
  const ctrlY = ShortcutRegistry.registry.createSerializedKey(KeyCodes.Y, [
    KeyCodes.CTRL,
  ]);

  const redoShortcut: KeyboardShortcut = {
    name: names.REDO,
    preconditionFn(workspace) {
      return (
        !workspace.isDragging() &&
        !workspace.isReadOnly() &&
        !getFocusManager().ephemeralFocusTaken()
      );
    },
    callback(workspace, e) {
      // 'z' for undo 'Z' is for redo.
      (workspace as WorkspaceSvg).hideChaff();
      workspace.redo();
      e.preventDefault();
      return true;
    },
    keyCodes: [ctrlShiftZ, ctrlY],
    displayText: () => Msg['REDO'],
  };
  ShortcutRegistry.registry.register(redoShortcut);
}

/**
 * Registers keyboard shortcuts for keyboard-driven movement of workspace
 * elements.
 */
export function registerMovementShortcuts() {
  const getCurrentDraggable = (
    workspace: WorkspaceSvg,
  ): IDraggable | undefined => {
    const node = getFocusManager().getFocusedNode();
    if (isDraggable(node)) return node;
    return (
      workspace
        .getNavigator()
        .getSourceBlockFromNode(getFocusManager().getFocusedNode()) ?? undefined
    );
  };

  const shiftM = ShortcutRegistry.registry.createSerializedKey(KeyCodes.M, [
    KeyCodes.SHIFT,
  ]);

  const startMoveShortcut: KeyboardShortcut = {
    name: names.START_MOVE,
    preconditionFn: (workspace) => {
      const startDraggable = getCurrentDraggable(workspace);
      return !!startDraggable && KeyboardMover.mover.canMove(startDraggable);
    },
    callback: (workspace, e) => {
      keyboardNavigationController.setIsActive(true);
      const startDraggable = getCurrentDraggable(workspace);
      // Focus the root draggable in case one of its children
      // was focused when the move was triggered.
      if (startDraggable) {
        getFocusManager().focusNode(startDraggable);
      }
      return (
        !!startDraggable &&
        KeyboardMover.mover.startMove(startDraggable, e as KeyboardEvent)
      );
    },
    keyCodes: [KeyCodes.M],
    displayText: () => Msg['SHORTCUTS_START_MOVE'],
  };
  const shortcuts: ShortcutRegistry.KeyboardShortcut[] = [
    startMoveShortcut,
    {
      ...startMoveShortcut,
      name: names.START_MOVE_STACK,
      keyCodes: [shiftM],
      displayText: () => Msg['SHORTCUTS_START_MOVE_STACK'],
    },
    {
      name: names.FINISH_MOVE,
      preconditionFn: () => KeyboardMover.mover.isMoving(),
      callback: (_workspace, e) =>
        KeyboardMover.mover.finishMove(e as KeyboardEvent),
      keyCodes: [KeyCodes.ENTER, KeyCodes.SPACE],
      allowCollision: true,
      displayText: () => Msg['SHORTCUTS_FINISH_MOVE'],
    },
    {
      name: names.ABORT_MOVE,
      preconditionFn: () => KeyboardMover.mover.isMoving(),
      callback: (_workspace, e) =>
        KeyboardMover.mover.abortMove(e as KeyboardEvent),
      keyCodes: [KeyCodes.ESC],
      allowCollision: true,
      displayText: () => Msg['SHORTCUTS_ABORT_MOVE'],
    },
    {
      name: names.MOVE_LEFT,
      preconditionFn: () => KeyboardMover.mover.isMoving(),
      callback: (_workspace, e) => {
        e.preventDefault();
        return KeyboardMover.mover.move(Direction.LEFT, e as KeyboardEvent);
      },
      keyCodes: [
        KeyCodes.LEFT,
        ShortcutRegistry.registry.createSerializedKey(KeyCodes.LEFT, [
          KeyCodes.CTRL_CMD,
        ]),
      ],
      allowCollision: true,
      displayText: () => Msg['SHORTCUTS_MOVE_LEFT'],
    },
    {
      name: names.MOVE_RIGHT,
      preconditionFn: () => KeyboardMover.mover.isMoving(),
      callback: (_workspace, e) => {
        e.preventDefault();
        return KeyboardMover.mover.move(Direction.RIGHT, e as KeyboardEvent);
      },
      keyCodes: [
        KeyCodes.RIGHT,
        ShortcutRegistry.registry.createSerializedKey(KeyCodes.RIGHT, [
          KeyCodes.CTRL_CMD,
        ]),
      ],
      allowCollision: true,
      displayText: () => Msg['SHORTCUTS_MOVE_RIGHT'],
    },
    {
      name: names.MOVE_UP,
      preconditionFn: () => KeyboardMover.mover.isMoving(),
      callback: (_workspace, e) => {
        e.preventDefault();
        return KeyboardMover.mover.move(Direction.UP, e as KeyboardEvent);
      },
      keyCodes: [
        KeyCodes.UP,
        ShortcutRegistry.registry.createSerializedKey(KeyCodes.UP, [
          KeyCodes.CTRL_CMD,
        ]),
      ],
      allowCollision: true,
      displayText: () => Msg['SHORTCUTS_MOVE_UP'],
    },
    {
      name: names.MOVE_DOWN,
      preconditionFn: () => KeyboardMover.mover.isMoving(),
      callback: (_workspace, e) => {
        e.preventDefault();
        return KeyboardMover.mover.move(Direction.DOWN, e as KeyboardEvent);
      },
      keyCodes: [
        KeyCodes.DOWN,
        ShortcutRegistry.registry.createSerializedKey(KeyCodes.DOWN, [
          KeyCodes.CTRL_CMD,
        ]),
      ],
      allowCollision: true,
      displayText: () => Msg['SHORTCUTS_MOVE_DOWN'],
    },
  ];

  for (const shortcut of shortcuts) {
    ShortcutRegistry.registry.register(shortcut);
  }
}

/**
 * Keyboard shortcut to show the context menu on ctrl/cmd+Enter, shift+F10, and
 * the menu key.
 */
export function registerShowContextMenu() {
  const ctrlEnter = ShortcutRegistry.registry.createSerializedKey(
    KeyCodes.ENTER,
    [KeyCodes.CTRL_CMD],
  );

  const shiftF10 = ShortcutRegistry.registry.createSerializedKey(KeyCodes.F10, [
    KeyCodes.SHIFT,
  ]);

  const contextMenuShortcut: KeyboardShortcut = {
    name: names.MENU,
    preconditionFn: (workspace) => {
      return !workspace.isDragging();
    },
    callback: (workspace, e) => {
      keyboardNavigationController.setIsActive(true);
      const target = getFocusManager().getFocusedNode();
      if (hasContextMenu(target)) {
        target.showContextMenu(e);
        contextmenu.getMenu()?.highlightNext();

        return true;
      }
      return false;
    },
    keyCodes: [ctrlEnter, shiftF10, KeyCodes.CONTEXT_MENU],
    displayText: () => Msg['SHORTCUTS_SHOW_CONTEXT_MENU'],
  };
  ShortcutRegistry.registry.register(contextMenuShortcut);
}

/**
 * Registers keyboard shortcuts to navigate around the Blockly interface.
 */
export function registerArrowNavigation() {
  const shortcuts: {
    [name: string]: ShortcutRegistry.KeyboardShortcut;
  } = {
    /** Go to the next location to the right. */
    right: {
      name: names.NAVIGATE_RIGHT,
      preconditionFn: (workspace) =>
        !workspace.isDragging() &&
        !dropDownDiv.isVisible() &&
        !widgetDiv.isVisible(),
      callback: (workspace, e) => {
        e.preventDefault();
        keyboardNavigationController.setIsActive(true);
        const node = workspace.RTL
          ? getFocusManager().getFocusedTree()?.getNavigator().getOutNode()
          : getFocusManager().getFocusedTree()?.getNavigator().getInNode();
        if (!node) {
          workspace.getAudioManager().playErrorBeep();
          return false;
        }
        getFocusManager().focusNode(node);
        return true;
      },
      keyCodes: [KeyCodes.RIGHT],
      allowCollision: true,
      displayText: () => Msg['SHORTCUTS_NAVIGATE_RIGHT'],
    },

    /** Go to the next location to the left. */
    left: {
      name: names.NAVIGATE_LEFT,
      preconditionFn: (workspace) =>
        !workspace.isDragging() &&
        !dropDownDiv.isVisible() &&
        !widgetDiv.isVisible(),
      callback: (workspace, e) => {
        e.preventDefault();
        keyboardNavigationController.setIsActive(true);
        const node = workspace.RTL
          ? getFocusManager().getFocusedTree()?.getNavigator().getInNode()
          : getFocusManager().getFocusedTree()?.getNavigator().getOutNode();
        if (!node) {
          workspace.getAudioManager().playErrorBeep();
          return false;
        }
        getFocusManager().focusNode(node);
        return true;
      },
      keyCodes: [KeyCodes.LEFT],
      allowCollision: true,
      displayText: () => Msg['SHORTCUTS_NAVIGATE_LEFT'],
    },

    /** Go down to the next location. */
    down: {
      name: names.NAVIGATE_DOWN,
      preconditionFn: (workspace) =>
        !workspace.isDragging() &&
        !dropDownDiv.isVisible() &&
        !widgetDiv.isVisible(),
      callback: (workspace, e) => {
        e.preventDefault();
        keyboardNavigationController.setIsActive(true);
        const node = getFocusManager()
          .getFocusedTree()
          ?.getNavigator()
          .getNextNode();
        if (!node) {
          workspace.getAudioManager().playErrorBeep();
          return false;
        }
        workspace.getAudioManager().maybePlayScopeChangeAudioCue(node);
        getFocusManager().focusNode(node);
        return true;
      },
      keyCodes: [KeyCodes.DOWN],
      allowCollision: true,
      displayText: () => Msg['SHORTCUTS_NAVIGATE_DOWN'],
    },
    /** Go up to the previous location. */
    up: {
      name: names.NAVIGATE_UP,
      preconditionFn: (workspace) =>
        !workspace.isDragging() &&
        !dropDownDiv.isVisible() &&
        !widgetDiv.isVisible(),
      callback: (workspace, e) => {
        e.preventDefault();
        keyboardNavigationController.setIsActive(true);
        const node = getFocusManager()
          .getFocusedTree()
          ?.getNavigator()
          .getPreviousNode();
        if (!node) {
          workspace.getAudioManager().playErrorBeep();
          return false;
        }
        workspace.getAudioManager().maybePlayScopeChangeAudioCue(node);
        getFocusManager().focusNode(node);
        return true;
      },
      keyCodes: [KeyCodes.UP],
      allowCollision: true,
      displayText: () => Msg['SHORTCUTS_NAVIGATE_UP'],
    },
  };

  for (const shortcut of Object.values(shortcuts)) {
    ShortcutRegistry.registry.register(shortcut);
  }
}

const resolveWorkspace = (workspace: WorkspaceSvg) => {
  if (workspace.isFlyout) {
    const target = workspace.targetWorkspace;
    if (target) {
      return resolveWorkspace(target);
    }
  }
  return workspace.getRootWorkspace() ?? workspace;
};

/**
 * Registers keyboard shortcut to focus the workspace.
 */
export function registerFocusWorkspace() {
  const focusWorkspaceShortcut: KeyboardShortcut = {
    name: names.FOCUS_WORKSPACE,
    preconditionFn: (workspace) => !workspace.isDragging(),
    callback: (workspace) => {
      keyboardNavigationController.setIsActive(true);
      // Focus the focus target (which announces the stack count) rather than the
      // workspace region, falling back to the region if there's no focus target.
      const rootWorkspace = resolveWorkspace(workspace);
      getFocusManager().focusNode(
        rootWorkspace.getWorkspaceFocusTarget() ?? rootWorkspace,
      );
      return true;
    },
    keyCodes: [KeyCodes.W],
    displayText: () => Msg['SHORTCUTS_FOCUS_WORKSPACE'],
  };
  ShortcutRegistry.registry.register(focusWorkspaceShortcut);
}

/**
 * Registers keyboard shortcut to focus the toolbox.
 */
export function registerFocusToolbox() {
  const focusToolboxShortcut: KeyboardShortcut = {
    name: names.FOCUS_TOOLBOX,
    preconditionFn: (workspace) => !workspace.isDragging(),
    callback: (workspace, event) => {
      const toolbox = workspace.getToolbox();
      if (toolbox) {
        keyboardNavigationController.setIsActive(true);
        getFocusManager().focusTree(toolbox);
        event.preventDefault();
        return true;
      } else {
        const flyout = workspace.getFlyout();
        if (!flyout) return false;

        keyboardNavigationController.setIsActive(true);
        getFocusManager().focusTree(flyout.getWorkspace());
        event.preventDefault();
        return true;
      }
    },
    keyCodes: [KeyCodes.T],
    displayText: () => Msg['SHORTCUTS_FOCUS_TOOLBOX'],
  };
  ShortcutRegistry.registry.register(focusToolboxShortcut);
}

/**
 * Registers keyboard shortcut to announce information about the focused
 * element.
 */
export function registerReadInformation() {
  const announceBlockInformation = (block: BlockSvg) => {
    const description = computeAriaLabel(block, aria.Verbosity.LOQUACIOUS);
    aria.announceDynamicAriaState(description);
  };

  const announceWorkspaceInformation = (workspace: WorkspaceSvg) => {
    const rootWorkspace = resolveWorkspace(workspace);
    const stackCount = rootWorkspace.getTopBlocks().length;
    const commentCount = rootWorkspace.getTopComments().length;

    // Build base string with block stack count.
    let baseMsgKey;
    if (stackCount === 0) {
      baseMsgKey = 'WORKSPACE_CONTENTS_BLOCKS_ZERO';
    } else if (stackCount === 1) {
      baseMsgKey = 'WORKSPACE_CONTENTS_BLOCKS_ONE';
    } else {
      baseMsgKey = 'WORKSPACE_CONTENTS_BLOCKS_MANY';
    }

    // Build comment suffix.
    let suffix = '';
    if (commentCount > 0) {
      suffix = Msg[
        commentCount === 1
          ? 'WORKSPACE_CONTENTS_COMMENTS_ONE'
          : 'WORKSPACE_CONTENTS_COMMENTS_MANY'
      ].replace('%1', String(commentCount));
    }

    // Build final message.
    const msg = Msg[baseMsgKey]
      .replace('%1', String(stackCount))
      .replace('%2', suffix);

    aria.announceDynamicAriaState(msg);
  };

  const shortcut: KeyboardShortcut = {
    name: names.INFORMATION,
    preconditionFn: () => true,
    callback: (workspace) => {
      const focusedNode = getFocusManager().getFocusedNode();
      const block = workspace
        .getNavigator()
        .getSourceBlockFromNode(focusedNode);
      if (block) {
        announceBlockInformation(block);
        return true;
      } else if (focusedNode === workspace) {
        announceWorkspaceInformation(workspace);
        return true;
      }
      return false;
    },
    keyCodes: [KeyCodes.I],
    displayText: () => Msg['SHORTCUTS_INFORMATION'],
  };
  ShortcutRegistry.registry.register(shortcut);
}

/**
 * Registers keyboard shortcut to announce an extended description of the
 * focused element.
 */
export function registerReadExtendedInformation() {
  const shiftI = ShortcutRegistry.registry.createSerializedKey(KeyCodes.I, [
    KeyCodes.SHIFT,
  ]);
  const shortcut: KeyboardShortcut = {
    name: names.EXTENDED_INFORMATION,
    preconditionFn: () => true,
    callback: (workspace) => {
      const block = workspace
        .getNavigator()
        .getSourceBlockFromNode(getFocusManager().getFocusedNode());
      if (!block) return false;

      const toAnnounce = [];
      // First go up the chain of output connections and start finding parents
      // from there because the outputs of a block are read anyway, so we don't
      // need to repeat them.
      let startBlock = block;
      while (startBlock.outputConnection?.isConnected()) {
        startBlock = startBlock.getParent()!;
      }

      if (startBlock !== block) {
        toAnnounce.push(computeAriaLabel(startBlock, aria.Verbosity.TERSE));
      }

      let parent = startBlock.getParent();
      while (parent) {
        toAnnounce.push(computeAriaLabel(parent, aria.Verbosity.TERSE));
        parent = parent.getParent();
      }

      if (toAnnounce.length) {
        toAnnounce.reverse();
        if (!block.outputConnection?.isConnected()) {
          // The current block was already read out earlier if it has an output
          // connection.
          toAnnounce.push(
            Msg['CURRENT_BLOCK_ANNOUNCEMENT'].replace(
              '%1',
              computeAriaLabel(block, aria.Verbosity.TERSE),
            ),
          );
        }

        aria.announceDynamicAriaState(
          Msg['PARENT_BLOCKS_ANNOUNCEMENT'].replace('%1', toAnnounce.join(',')),
        );
      } else {
        aria.announceDynamicAriaState(Msg['NO_PARENT_ANNOUNCEMENT']);
      }
      return true;
    },
    keyCodes: [shiftI],
    displayText: () => Msg['SHORTCUTS_EXTENDED_INFORMATION'],
  };
  ShortcutRegistry.registry.register(shortcut);
}

/**
 * Registers keyboard shortcut to disconnect the focused block.
 */
export function registerDisconnectBlock() {
  const shiftX = ShortcutRegistry.registry.createSerializedKey(KeyCodes.X, [
    KeyCodes.SHIFT,
  ]);
  const disconnectShortcut: ShortcutRegistry.KeyboardShortcut = {
    name: names.DISCONNECT,
    preconditionFn: (workspace, scope) => {
      const focused = scope.focusedNode;
      const result =
        !workspace.isDragging() &&
        !workspace.isReadOnly() &&
        focused instanceof BlockSvg &&
        !focused.isShadow();

      if (!result) {
        workspace.getAudioManager().playErrorBeep();
      }
      return result;
    },
    callback: (_workspace, event) => {
      keyboardNavigationController.setIsActive(true);
      const curNode = getFocusManager().getFocusedNode();
      if (!(curNode instanceof BlockSvg)) return false;

      const healStack = !(event instanceof KeyboardEvent && event.shiftKey);
      eventUtils.setGroup(true);
      curNode.unplug(healStack);
      eventUtils.setGroup(false);
      return true;
    },
    keyCodes: [KeyCodes.X, shiftX],
    displayText: () => Msg['SHORTCUTS_DISCONNECT'],
  };
  ShortcutRegistry.registry.register(disconnectShortcut);
}

/**
 * Registers keyboard shortcuts to jump between stacks/top-level items on the
 * workspace.
 */
export function registerStackNavigation() {
  /**
   * Finds the stack root of the currently focused or specified item.
   */
  const resolveStack = (
    workspace: WorkspaceSvg,
    node = getFocusManager().getFocusedNode(),
  ) => {
    const navigator = workspace.getNavigator();

    for (
      let parent: IFocusableNode | null = node;
      parent && parent !== workspace;
      parent = navigator.getParent(parent)
    ) {
      node = parent;
    }

    if (!isSelectable(node)) return null;

    return node;
  };

  const nextStackShortcut: KeyboardShortcut = {
    name: names.NEXT_STACK,
    preconditionFn: (workspace) =>
      !workspace.isDragging() &&
      !!resolveStack(workspace) &&
      !dropDownDiv.isVisible() &&
      !widgetDiv.isVisible(),
    callback: (workspace) => {
      keyboardNavigationController.setIsActive(true);
      const start = resolveStack(workspace);
      if (!start) return false;
      const target = workspace.getNavigator().navigateStacks(start, 1);
      if (!target) return false;
      getFocusManager().focusNode(target);
      return true;
    },
    keyCodes: [KeyCodes.N],
    displayText: () => Msg['SHORTCUTS_NEXT_STACK'],
  };

  const previousStackShortcut: KeyboardShortcut = {
    name: names.PREVIOUS_STACK,
    preconditionFn: (workspace) =>
      !workspace.isDragging() &&
      !!resolveStack(workspace) &&
      !dropDownDiv.isVisible() &&
      !widgetDiv.isVisible(),
    callback: (workspace) => {
      keyboardNavigationController.setIsActive(true);
      const start = resolveStack(workspace);
      if (!start) return false;
      // navigateStacks() returns the last connection in the stack when going
      // backwards, but we want the root block, so resolve the stack from the
      // element we get back.
      const target = resolveStack(
        workspace,
        workspace.getNavigator().navigateStacks(start, -1),
      );
      if (!target) return false;
      getFocusManager().focusNode(target);
      return true;
    },
    keyCodes: [KeyCodes.B],
    displayText: () => Msg['SHORTCUTS_PREVIOUS_STACK'],
  };

  ShortcutRegistry.registry.register(nextStackShortcut);
  ShortcutRegistry.registry.register(previousStackShortcut);
}

/**
 * Registers keyboard shortcuts to jump between headings (labels) in a flyout.
 *
 * Pressing H moves focus to the next heading; Shift+H moves focus to the
 * previous heading. The shortcut only activates when focus is already inside
 * the flyout; otherwise it returns false so other handlers may take over.
 */
export function registerHeadingNavigation() {
  /**
   * Returns the flyout the user is currently focused in, or null if focus is
   * not inside any flyout's workspace.
   */
  const getActiveFlyout = (): IFlyout | null => {
    const focusedTree = getFocusManager().getFocusedTree();
    if (
      focusedTree instanceof WorkspaceSvg &&
      focusedTree.isFlyout &&
      focusedTree.targetWorkspace
    ) {
      return focusedTree.targetWorkspace.getFlyout() ?? null;
    }
    return null;
  };

  /**
   * Walks up from the focused node to find the top-level flyout item it
   * belongs to (e.g. the block whose field is focused). Returns null if no
   * flyout item is focused.
   */
  const getCurrentFlyoutItem = (flyout: IFlyout): IFocusableNode | null => {
    const navigator = flyout.getWorkspace().getNavigator();
    const items: IFocusableNode[] = flyout
      .getContents()
      .map((item) => item.getElement());
    let node: IFocusableNode | null =
      getFocusManager().getFocusedNode() ?? null;
    while (node && !items.includes(node)) {
      node = navigator.getParent(node);
    }
    return node;
  };

  /**
   * Finds the next or previous heading in the flyout relative to the
   * currently focused item, or the first/last heading if no flyout item is
   * focused. Returns null if there is no heading to navigate to.
   */
  const findHeading = (
    flyout: IFlyout,
    direction: 1 | -1,
  ): FlyoutButton | null => {
    const items: IFocusableNode[] = flyout
      .getContents()
      .map((item) => item.getElement());
    const current = getCurrentFlyoutItem(flyout);
    // When nothing in the flyout is focused, start from before the first item
    // (for next) or after the last item (for previous) so the loop finds the
    // first or last heading respectively.
    const startIndex = current
      ? items.indexOf(current)
      : direction === 1
        ? -1
        : items.length;

    for (let offset = 1; offset <= items.length; offset++) {
      const index = startIndex + direction * offset;
      if (index < 0 || index >= items.length) break;
      const item = items[index];
      if (item instanceof FlyoutButton && item.isLabel()) {
        return item;
      }
    }
    return null;
  };

  const shiftH = ShortcutRegistry.registry.createSerializedKey(KeyCodes.H, [
    KeyCodes.SHIFT,
  ]);

  const nextHeadingShortcut: KeyboardShortcut = {
    name: names.NEXT_HEADING,
    preconditionFn: (workspace) =>
      !workspace.isDragging() &&
      !dropDownDiv.isVisible() &&
      !widgetDiv.isVisible() &&
      !!getActiveFlyout(),
    callback: () => {
      const flyout = getActiveFlyout();
      if (!flyout) return false;
      const target = findHeading(flyout, 1);
      if (!target) return false;
      keyboardNavigationController.setIsActive(true);
      getFocusManager().focusNode(target);
      return true;
    },
    keyCodes: [KeyCodes.H],
    displayText: () => Msg['SHORTCUTS_NEXT_HEADING'],
  };

  const previousHeadingShortcut: KeyboardShortcut = {
    name: names.PREVIOUS_HEADING,
    preconditionFn: (workspace) =>
      !workspace.isDragging() &&
      !dropDownDiv.isVisible() &&
      !widgetDiv.isVisible() &&
      !!getActiveFlyout(),
    callback: () => {
      const flyout = getActiveFlyout();
      if (!flyout) return false;
      const target = findHeading(flyout, -1);
      if (!target) return false;
      keyboardNavigationController.setIsActive(true);
      getFocusManager().focusNode(target);
      return true;
    },
    keyCodes: [shiftH],
    displayText: () => Msg['SHORTCUTS_PREVIOUS_HEADING'],
  };

  ShortcutRegistry.registry.register(nextHeadingShortcut);
  ShortcutRegistry.registry.register(previousHeadingShortcut);
}

/**
 * Registers keyboard shortcut to perform an action on the focused element.
 */
export function registerPerformAction() {
  const performActionShortcut: KeyboardShortcut = {
    name: names.PERFORM_ACTION,
    preconditionFn: (workspace) =>
      !workspace.isDragging() &&
      !dropDownDiv.isVisible() &&
      !widgetDiv.isVisible() &&
      !getFocusManager().ephemeralFocusTaken(),
    callback: (_workspace, e) => {
      keyboardNavigationController.setIsActive(true);
      const focusedNode = getFocusManager().getFocusedNode();
      if (focusedNode && 'performAction' in focusedNode) {
        e.preventDefault();
        focusedNode.performAction?.(e);
        return true;
      }
      return false;
    },
    keyCodes: [KeyCodes.ENTER, KeyCodes.SPACE],
    allowCollision: true,
    displayText: () => Msg['SHORTCUTS_PERFORM_ACTION'],
  };
  ShortcutRegistry.registry.register(performActionShortcut);
}

/**
 * Registers keyboard shortcut to duplicate a block or workspace comment.
 */
export function registerDuplicate() {
  const duplicateShortcut: KeyboardShortcut = {
    name: names.DUPLICATE,
    preconditionFn: (workspace, scope) => {
      const {focusedNode} = scope;
      const result =
        !workspace.isDragging() &&
        !workspace.isReadOnly() &&
        !workspace.isFlyout &&
        (focusedNode instanceof BlockSvg ? focusedNode.isDuplicatable() : true);
      if (!result) {
        workspace.getAudioManager().playErrorBeep();
      }
      return result;
    },
    callback: (workspace, _e, _shortcut, scope) => {
      keyboardNavigationController.setIsActive(true);
      const copyable = isICopyable(scope.focusedNode) && scope.focusedNode;
      if (!copyable) return false;
      const data = copyable.toCopyData();
      if (!data) return false;
      return !!clipboard.paste(data, workspace);
    },
    keyCodes: [KeyCodes.D],
    allowCollision: true,
    displayText: () => Msg['SHORTCUTS_DUPLICATE'],
  };
  ShortcutRegistry.registry.register(duplicateShortcut);
}

/**
 * Registers keyboard shortcut to clean up the workspace.
 */
export function registerCleanup() {
  const cleanupShortcut: KeyboardShortcut = {
    name: names.CLEANUP,
    preconditionFn: (workspace) =>
      !workspace.isDragging() && !workspace.isReadOnly() && !workspace.isFlyout,
    callback: (workspace) => {
      keyboardNavigationController.setIsActive(true);
      workspace.cleanUp();
      return true;
    },
    keyCodes: [KeyCodes.C],
    allowCollision: true,
    displayText: () => Msg['SHORTCUTS_CLEANUP'],
  };
  ShortcutRegistry.registry.register(cleanupShortcut);
}

/**
 * Registers keyboard shortcut to display the tooltip for the focused element.
 */
export function registerShowTooltip() {
  const ctrlJ = ShortcutRegistry.registry.createSerializedKey(KeyCodes.J, [
    KeyCodes.CTRL_CMD,
  ]);

  const showTooltip: KeyboardShortcut = {
    name: names.SHOW_TOOLTIP,
    preconditionFn: (workspace) => !workspace.isDragging(),
    callback: (workspace) => {
      const target = getFocusManager().getFocusedNode();
      if (target !== null) {
        keyboardNavigationController.setIsActive(true);
        Tooltip.display(target, workspace);
      }
      return true;
    },
    keyCodes: [ctrlJ],
    allowCollision: true,
    displayText: () => Msg['SHORTCUTS_SHOW_TOOLTIP'],
  };
  ShortcutRegistry.registry.register(showTooltip);
}

/**
 * Registers keyboard shortcut to toggle on or off various behaviors that
 * improve the experience for individuals using screenreaders.
 */
export function registerToggleScreenreaderMode() {
  const shortcut = ShortcutRegistry.registry.createSerializedKey(KeyCodes.A, [
    KeyCodes.ALT,
    KeyCodes.SHIFT,
  ]);

  let enabled = false;

  const toggleScreenreader: KeyboardShortcut = {
    name: names.TOGGLE_SCREENREADER,
    preconditionFn: () => true,
    callback: (workspace, e) => {
      enabled = !enabled;
      keyboardNavigationController.setScopeChangeAudioCuesEnabled(enabled);
      workspace.getNavigator().setNavigationLoops(!enabled);
      workspace.getToolbox()?.getNavigator().setNavigationLoops(!enabled);
      workspace
        .getFlyout()
        ?.getWorkspace()
        .getNavigator()
        .setNavigationLoops(!enabled);
      showScreenreaderModeHint(workspace, enabled);
      e.preventDefault();
      return true;
    },
    keyCodes: [shortcut],
    allowCollision: true,
    displayText: () => Msg['SHORTCUTS_TOGGLE_SCREENREADER_MODE'],
  };
  ShortcutRegistry.registry.register(toggleScreenreader);
}

/**
 * @param workspace
 * @param scope
 * @returns true if the block navigation shortcuts should be allowed, false otherwise.
 */
const shouldDoBlockNavigation = (workspace: WorkspaceSvg, scope: Scope) => {
  return (
    !workspace.isFlyout &&
    !!scope.focusedNode &&
    !workspace.isDragging() &&
    !getFocusManager().ephemeralFocusTaken() &&
    // Either a block or something that has a parent block is focused
    !!workspace.getNavigator().getSourceBlockFromNode(scope.focusedNode)
  );
};

/**
 * Registers a keyboard shortcut that sets the focus to the block
 * that owns the current focused node.
 */
export function registerJumpBlockStart() {
  const jumpBlockStartShortcut: KeyboardShortcut = {
    name: names.JUMP_BLOCK_START,
    preconditionFn: shouldDoBlockNavigation,
    callback(workspace, e, shortcut, scope) {
      if (!scope.focusedNode) return false;
      let selectedBlock = workspace
        .getNavigator()
        .getSourceBlockFromNode(scope.focusedNode);
      if (selectedBlock?.getFullBlockField() && !!selectedBlock.getParent()) {
        // Act on the parent block if the current block is a full-block field block.
        // Because full-block field blocks look like fields, so treat them that way.
        selectedBlock = selectedBlock.getParent();
      }
      if (!selectedBlock) return false;

      getFocusManager().focusNode(selectedBlock);
      return true;
    },
    keyCodes: [KeyCodes.HOME],
    displayText: () => Msg['SHORTCUTS_JUMP_BLOCK_START'],
  };
  ShortcutRegistry.registry.register(jumpBlockStartShortcut);
}

/**
 * Registers a keyboard shortcut that sets the focus to the
 * last input of the block that owns the current focused node.
 */
export function registerJumpBlockEnd() {
  const jumpBlockEndShortcut: KeyboardShortcut = {
    name: names.JUMP_BLOCK_END,
    preconditionFn: shouldDoBlockNavigation,
    callback(workspace, e, shortcut, scope) {
      if (!scope.focusedNode) return false;
      let selectedBlock = workspace
        .getNavigator()
        .getSourceBlockFromNode(scope.focusedNode);
      if (selectedBlock?.getFullBlockField() && !!selectedBlock.getParent()) {
        // Act on the parent block if the current block is a full-block field block.
        // Because full-block field blocks look like fields, so treat them that way.
        selectedBlock = selectedBlock.getParent();
      }
      if (!selectedBlock) return false;
      const inputs = selectedBlock.inputList;
      if (!inputs.length) return false;
      const connection = inputs[inputs.length - 1].connection;
      if (!connection || !(connection instanceof RenderedConnection))
        return false;
      getFocusManager().focusNode(connection);
      return true;
    },
    keyCodes: [KeyCodes.END],
    displayText: () => Msg['SHORTCUTS_JUMP_BLOCK_END'],
  };
  ShortcutRegistry.registry.register(jumpBlockEndShortcut);
}

/**
 * Registers a keyboard shortcut that sets the focus to the top block
 * in the current stack.
 */
export function registerJumpTopStack() {
  const jumpTopStackShortcut: KeyboardShortcut = {
    name: names.JUMP_TOP_STACK,
    preconditionFn: shouldDoBlockNavigation,
    callback(workspace, e, shortcut, scope) {
      if (!scope.focusedNode) return false;
      const selectedBlock = workspace
        .getNavigator()
        .getSourceBlockFromNode(scope.focusedNode);
      if (!selectedBlock) return false;
      const topOfStack = selectedBlock.getRootBlock();
      getFocusManager().focusNode(topOfStack);
      return true;
    },
    keyCodes: [KeyCodes.PAGE_UP],
    displayText: () => Msg['SHORTCUTS_JUMP_TOP_STACK'],
  };
  ShortcutRegistry.registry.register(jumpTopStackShortcut);
}

/**
 * Registers a keyboard shortcut that sets the focus to the bottom block
 * in the current stack.
 */
export function registerJumpBottomStack() {
  const jumpBottomStackShortcut: KeyboardShortcut = {
    name: names.JUMP_BOTTOM_STACK,
    preconditionFn: shouldDoBlockNavigation,
    callback(workspace, e, shortcut, scope) {
      if (!scope.focusedNode) return false;
      const selectedBlock = workspace
        .getNavigator()
        .getSourceBlockFromNode(scope.focusedNode);
      if (!selectedBlock) return false;
      // To get the bottom block in a stack, first go to the top of the stack
      // Then get the last next connection
      // Then get the last descendant of that block
      const lastBlock = selectedBlock
        .getRootBlock()
        .lastConnectionInStack(false)
        ?.getSourceBlock();
      if (!lastBlock) return false;
      const descendants = lastBlock.getDescendants(true);
      const bottomOfStack = descendants[descendants.length - 1];
      getFocusManager().focusNode(bottomOfStack);
      return true;
    },
    keyCodes: [KeyCodes.PAGE_DOWN],
    displayText: () => Msg['SHORTCUTS_JUMP_BOTTOM_STACK'],
  };
  ShortcutRegistry.registry.register(jumpBottomStackShortcut);
}

/**
 * Registers a keyboard shortcut that sets the focus to the first
 * block in the workspace.
 */
export function registerJumpFirstBlock() {
  const ctrlCmdHome = ShortcutRegistry.registry.createSerializedKey(
    KeyCodes.HOME,
    [KeyCodes.CTRL_CMD],
  );
  const jumpFirstBlockShortcut: KeyboardShortcut = {
    name: names.JUMP_FIRST_BLOCK,
    preconditionFn: (workspace) => {
      return (
        !workspace.isDragging() && !getFocusManager().ephemeralFocusTaken()
      );
    },
    callback(workspace) {
      const topBlocks = workspace.getTopBlocks(true);
      if (!topBlocks.length) return false;
      getFocusManager().focusNode(topBlocks[0]);
      return true;
    },
    keyCodes: [ctrlCmdHome],
    displayText: () => Msg['SHORTCUTS_JUMP_FIRST_BLOCK'],
  };
  ShortcutRegistry.registry.register(jumpFirstBlockShortcut);
}

/**
 * Registers a keyboard shortcut that sets the focus to the last
 * block in the workspace.
 */
export function registerJumpLastBlock() {
  const ctrlCmdEnd = ShortcutRegistry.registry.createSerializedKey(
    KeyCodes.END,
    [KeyCodes.CTRL_CMD],
  );
  const jumpLastBlockShortcut: KeyboardShortcut = {
    name: names.JUMP_LAST_BLOCK,
    preconditionFn: (workspace) => {
      return (
        !workspace.isDragging() && !getFocusManager().ephemeralFocusTaken()
      );
    },
    callback(workspace) {
      const allBlocks = workspace.getAllBlocks(true);
      if (!allBlocks.length) return false;
      getFocusManager().focusNode(allBlocks[allBlocks.length - 1]);
      return true;
    },
    keyCodes: [ctrlCmdEnd],
    displayText: () => Msg['SHORTCUTS_JUMP_LAST_BLOCK'],
  };
  ShortcutRegistry.registry.register(jumpLastBlockShortcut);
}

/**
 * Registers all default keyboard shortcut item. This should be called once per
 * instance of KeyboardShortcutRegistry.
 *
 * @internal
 */
export function registerDefaultShortcuts() {
  registerEscape();
  registerDelete();
  registerCopy();
  registerCut();
  registerPaste();
  registerUndo();
  registerRedo();
}

/**
 * Registers an extended set of keyboard shortcuts used to support deep keyboard
 * navigation of Blockly.
 */
export function registerKeyboardNavigationShortcuts() {
  registerShowContextMenu();
  registerMovementShortcuts();
  registerFocusWorkspace();
  registerFocusToolbox();
  registerArrowNavigation();
  registerDisconnectBlock();
  registerStackNavigation();
  registerHeadingNavigation();
  registerPerformAction();
  registerDuplicate();
  registerCleanup();
  registerShowTooltip();
}

/**
 * Registers keyboard shortcuts used to announce screen reader information.
 */
export function registerScreenReaderShortcuts() {
  registerReadInformation();
  registerReadExtendedInformation();
  registerToggleScreenreaderMode();
}

/**
 * Registers keyboard shortcuts used to jump between blocks and stacks in the workspace.
 * Note these are not registered by default, so call this function to enable them if desired.
 */
export function registerNavigationShortcuts() {
  registerJumpBlockStart();
  registerJumpBlockEnd();
  registerJumpTopStack();
  registerJumpBottomStack();
  registerJumpFirstBlock();
  registerJumpLastBlock();
}

registerDefaultShortcuts();
registerKeyboardNavigationShortcuts();
registerScreenReaderShortcuts();
