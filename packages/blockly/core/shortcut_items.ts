/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.ShortcutItems

import {BlockSvg} from './block_svg.js';
import * as clipboard from './clipboard.js';
import {RenderedWorkspaceComment} from './comments.js';
import * as contextmenu from './contextmenu.js';
import * as eventUtils from './events/utils.js';
import {getFocusManager} from './focus_manager.js';
import {hasContextMenu} from './interfaces/i_contextmenu.js';
import {isCopyable as isICopyable} from './interfaces/i_copyable.js';
import {isDeletable as isIDeletable} from './interfaces/i_deletable.js';
import {type IDraggable, isDraggable} from './interfaces/i_draggable.js';
import {type IFocusableNode} from './interfaces/i_focusable_node.js';
import {Direction, KeyboardMover} from './keyboard_nav/keyboard_mover.js';
import {keyboardNavigationController} from './keyboard_navigation_controller.js';
import {KeyboardShortcut, ShortcutRegistry} from './shortcut_registry.js';
import {Coordinate} from './utils/coordinate.js';
import {KeyCodes} from './utils/keycodes.js';
import {Rect} from './utils/rect.js';
import * as svgMath from './utils/svg_math.js';
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
  START_MOVE = 'start_move',
  START_MOVE_STACK = 'start_move_stack',
  FINISH_MOVE = 'finish_move',
  ABORT_MOVE = 'abort_move',
  MOVE_UP = 'move_up',
  MOVE_DOWN = 'move_down',
  MOVE_LEFT = 'move_left',
  MOVE_RIGHT = 'move_right',
  DISCONNECT = 'disconnect',
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
      return (
        !workspace.isReadOnly() &&
        focused != null &&
        isIDeletable(focused) &&
        focused.isDeletable() &&
        !workspace.isDragging() &&
        // Don't delete the block if a field editor is open
        !getFocusManager().ephemeralFocusTaken()
      );
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
      }
      return true;
    },
    keyCodes: [KeyCodes.DELETE, KeyCodes.BACKSPACE],
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
      return (
        !!focused &&
        !!targetWorkspace &&
        !targetWorkspace.isDragging() &&
        !getFocusManager().ephemeralFocusTaken() &&
        isCopyable(focused)
      );
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
      return !!clipboard.copy(focused, copyCoords);
    },
    keyCodes: [ctrlC],
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
      return (
        !!focused &&
        !workspace.isReadOnly() &&
        !workspace.isDragging() &&
        !getFocusManager().ephemeralFocusTaken() &&
        isCuttable(focused)
      );
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
      } else if (isIDeletable(focused)) {
        focused.dispose();
      }
      return !!copyData;
    },
    keyCodes: [ctrlX],
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
      return (
        !!clipboard.getLastCopiedData() &&
        !!targetWorkspace &&
        !targetWorkspace.isReadOnly() &&
        !targetWorkspace.isDragging() &&
        !getFocusManager().ephemeralFocusTaken()
      );
    },
    callback(workspace: WorkspaceSvg, e: Event) {
      const copyData = clipboard.getLastCopiedData();
      if (!copyData) return false;

      const copyWorkspace = clipboard.getLastCopiedWorkspace();
      if (!copyWorkspace) return false;

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
      workspace.undo(false);
      e.preventDefault();
      return true;
    },
    keyCodes: [ctrlZ],
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
      workspace.undo(true);
      e.preventDefault();
      return true;
    },
    keyCodes: [ctrlShiftZ, ctrlY],
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
    return workspace.getCursor().getSourceBlock() ?? undefined;
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
  };
  const shortcuts: ShortcutRegistry.KeyboardShortcut[] = [
    startMoveShortcut,
    {
      ...startMoveShortcut,
      name: names.START_MOVE_STACK,
      keyCodes: [shiftM],
    },
    {
      name: names.FINISH_MOVE,
      preconditionFn: () => KeyboardMover.mover.isMoving(),
      callback: (_workspace, e) =>
        KeyboardMover.mover.finishMove(e as KeyboardEvent),
      keyCodes: [KeyCodes.ENTER, KeyCodes.SPACE],
      allowCollision: true,
    },
    {
      name: names.ABORT_MOVE,
      preconditionFn: () => KeyboardMover.mover.isMoving(),
      callback: (_workspace, e) =>
        KeyboardMover.mover.abortMove(e as KeyboardEvent),
      keyCodes: [KeyCodes.ESC],
      allowCollision: true,
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
    },
  ];

  for (const shortcut of shortcuts) {
    ShortcutRegistry.registry.register(shortcut);
  }
}

/**
 * Keyboard shortcut to show the context menu on ctrl/cmd+Enter.
 */
export function registerShowContextMenu() {
  const ctrlEnter = ShortcutRegistry.registry.createSerializedKey(
    KeyCodes.ENTER,
    [KeyCodes.CTRL_CMD],
  );

  const contextMenuShortcut: KeyboardShortcut = {
    name: names.MENU,
    preconditionFn: (workspace) => {
      return !workspace.isDragging();
    },
    callback: (_workspace, e) => {
      const target = getFocusManager().getFocusedNode();
      if (hasContextMenu(target)) {
        target.showContextMenu(e);
        contextmenu.getMenu()?.highlightNext();

        return true;
      }
      return false;
    },
    keyCodes: [ctrlEnter],
  };
  ShortcutRegistry.registry.register(contextMenuShortcut);
}

/**
 * Registers keyboard shortcut to focus the workspace.
 */
export function registerFocusWorkspace() {
  const resolveWorkspace = (workspace: WorkspaceSvg) => {
    if (workspace.isFlyout) {
      const target = workspace.targetWorkspace;
      if (target) {
        return resolveWorkspace(target);
      }
    }
    return workspace.getRootWorkspace() ?? workspace;
  };

  const contextMenuShortcut: KeyboardShortcut = {
    name: names.FOCUS_WORKSPACE,
    preconditionFn: (workspace) => !workspace.isDragging(),
    callback: (workspace) => {
      keyboardNavigationController.setIsActive(true);
      getFocusManager().focusNode(resolveWorkspace(workspace));
      return true;
    },
    keyCodes: [KeyCodes.W],
  };
  ShortcutRegistry.registry.register(contextMenuShortcut);
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
    preconditionFn: (workspace) =>
      !workspace.isDragging() && !workspace.isReadOnly(),
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
  };
  ShortcutRegistry.registry.register(disconnectShortcut);
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
  registerDisconnectBlock();
}

registerDefaultShortcuts();
registerKeyboardNavigationShortcuts();
