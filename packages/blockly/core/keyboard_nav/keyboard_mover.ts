/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import type {IBoundedElement} from '../interfaces/i_bounded_element.js';
import type {IDraggable} from '../interfaces/i_draggable.js';
import type {IDragger} from '../interfaces/i_dragger.js';
import type {IFocusableNode} from '../interfaces/i_focusable_node.js';
import type {ISelectable} from '../interfaces/i_selectable.js';
import * as registry from '../registry.js';
import {ShortcutRegistry} from '../shortcut_registry.js';
import {Coordinate} from '../utils/coordinate.js';
import {KeyCodes} from '../utils/keycodes.js';
import type {WorkspaceSvg} from '../workspace_svg.js';
import {MoveIndicator} from './move_indicator.js';

/**
 * Cardinal directions in which a move can proceed.
 */
export enum Direction {
  NONE = 0,
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

/**
 * Identifier for a keyboard shortcut that commits the in-progress move.
 */
const COMMIT_MOVE_SHORTCUT = 'commitMove';

/**
 * Class responsible for coordinating keyboard-driven moves with the workspace
 * and dragging system.
 */
export class KeyboardMover {
  /**
   * Object responsible for dragging workspace elements in response to move
   * commands.
   */
  protected dragger?: IDragger;

  /**
   * The object that is currently being moved.
   */
  protected draggable?: IDraggable &
    IFocusableNode &
    IBoundedElement &
    ISelectable;

  /**
   * Workspace coordinate that the current move started from.
   */
  protected startLocation?: Coordinate;

  /**
   * The total distance, in workspace coordinates, that the element being moved
   * has been moved since the movement process started.
   */
  protected totalDelta = new Coordinate(0, 0);

  /**
   * The distance to move an item in workspace coordinates.
   */
  protected stepDistance = 20;

  /**
   * Symbol attached to the item being moved to indicate it is in move mode.
   */
  protected moveIndicator?: MoveIndicator;

  // Set up a blur listener to end the move if the user clicks away
  private readonly blurListener = () => {
    this.abortMove();
  };

  /**
   * Creates a new KeyboardMover instance.
   *
   * @param workspace The workspace that this mover will move items on.
   */
  constructor(protected workspace: WorkspaceSvg) {}

  /**
   * Returns true iff the given draggable is allowed to be moved.
   *
   * @param draggable The draggable element to try to move.
   * @returns True iff movement is allowed.
   */
  canMove(draggable: IDraggable) {
    return !this.workspace.isReadOnly() && draggable.isMovable();
  }

  /**
   * Returns true iff this Mover is currently moving an element.
   *
   * @returns True iff a workspace element is being moved.
   */
  isMoving() {
    return !!this.draggable;
  }

  /**
   * Start moving the currently-focused item on workspace, if possible.
   *
   * @param draggable The element to start moving.
   * @param event The keyboard event that triggered this move.
   * @returns True iff a move has successfully begun.
   */
  startMove(
    draggable: IDraggable & IFocusableNode & IBoundedElement & ISelectable,
    event: KeyboardEvent,
  ) {
    if (!this.canMove(draggable) || this.isMoving()) return false;

    const DraggerClass = registry.getClassFromOptions(
      registry.Type.BLOCK_DRAGGER,
      this.workspace.options,
      true,
    );
    if (!DraggerClass) throw new Error('no Dragger registered');
    this.draggable = draggable;
    this.dragger = new DraggerClass(draggable, this.workspace);
    this.startLocation = this.draggable.getRelativeToSurfaceXY();
    // Record that a move is in progress and start dragging.
    this.workspace.setKeyboardMoveInProgress(true);
    this.dragger.onDragStart(event);
    this.updateTotalDelta();

    this.draggable
      .getFocusableElement()
      .addEventListener('blur', this.blurListener);

    // Register a keyboard shortcut under the key combos of all existing
    // keyboard shortcuts that commits the move before allowing the real
    // shortcut to proceed. This avoids all kinds of fun brokenness when
    // deleting/copying/otherwise acting on a element in move mode.
    const shortcutKeys = Object.values(ShortcutRegistry.registry.getRegistry())
      .flatMap((shortcut) => shortcut.keyCodes)
      .filter((keyCode) => {
        return (
          keyCode &&
          ![
            KeyCodes.RIGHT,
            KeyCodes.LEFT,
            KeyCodes.UP,
            KeyCodes.DOWN,
            KeyCodes.ENTER,
            KeyCodes.ESC,
            KeyCodes.M,
          ].includes(
            typeof keyCode === 'number'
              ? keyCode
              : parseInt(`${keyCode.split('+').pop()}`),
          )
        );
      })
      // Convince TS there aren't undefined values.
      .filter((keyCode): keyCode is string | number => !!keyCode);

    const commitMoveShortcut = {
      name: COMMIT_MOVE_SHORTCUT,
      preconditionFn: () => {
        return this.isMoving();
      },
      callback: () => {
        this.finishMove();
        return false;
      },
      keyCodes: shortcutKeys,
      allowCollision: true,
    };

    ShortcutRegistry.registry.register(commitMoveShortcut, true);

    this.scrollCurrentElementIntoView();
    this.moveIndicator = new MoveIndicator(this.workspace);
    this.repositionMoveIndicator();

    return true;
  }

  /**
   * Moves the current element in the given direction.
   *
   * @param direction The direction to move the currently-moving element.
   * @param event The event that triggered this move, if any.
   * @returns True iff this action applies and has been performed.
   */
  move(direction: Direction, event?: KeyboardEvent | PointerEvent) {
    switch (direction) {
      case Direction.UP:
        this.totalDelta.y -= this.stepDistance;
        break;
      case Direction.DOWN:
        this.totalDelta.y += this.stepDistance;
        break;
      case Direction.LEFT:
        this.totalDelta.x -= this.stepDistance;
        break;
      case Direction.RIGHT:
        this.totalDelta.x += this.stepDistance;
        break;
    }

    this.dragger?.onDrag(event, this.totalPixelDelta());

    this.updateTotalDelta();
    this.scrollCurrentElementIntoView();
    this.repositionMoveIndicator();

    return true;
  }

  /**
   * Finish moving the item that is currently being moved.
   *
   * @param event The event that triggered the end of the move, if any.
   * @returns True iff move successfully finished.
   */
  finishMove(event?: KeyboardEvent | PointerEvent) {
    this.preDragEndCleanup();

    this.dragger?.onDragEnd(event, this.totalPixelDelta());

    this.postDragEndCleanup();
    return true;
  }

  /**
   * Abort moving the currently-focused item on workspace.
   *
   * @param event The event that triggered the end of the move, if any.
   * @returns True iff move successfully aborted.
   */
  abortMove(event?: KeyboardEvent | PointerEvent) {
    this.preDragEndCleanup();

    this.dragger?.onDragRevert(event, this.totalPixelDelta());

    this.postDragEndCleanup();
    return true;
  }

  /**
   * Sets the distance by which an object will be moved.
   *
   * @param stepDistance The distance in workspace coordinates that each move
   *     should move elements on the workspace by.
   */
  setMoveDistance(stepDistance: number) {
    this.stepDistance = stepDistance;
  }

  /**
   * Repositions the move indicator to the corner of the item being moved.
   */
  protected repositionMoveIndicator() {
    const bounds = this.draggable?.getBoundingRectangle();
    if (!bounds) return;

    this.moveIndicator?.moveTo(bounds.right, bounds.top);
  }

  /**
   * Common clean-up for finish/abort run before terminating the move.
   */
  protected preDragEndCleanup() {
    ShortcutRegistry.registry.unregister(COMMIT_MOVE_SHORTCUT);

    // Remove the blur listener before ending the drag
    this.draggable
      ?.getFocusableElement()
      .removeEventListener('blur', this.blurListener);
  }

  /**
   * Common clean-up for finish/abort run after terminating the move.
   */
  protected postDragEndCleanup() {
    this.workspace.setKeyboardMoveInProgress(false);

    this.moveIndicator?.dispose();
    this.moveIndicator = undefined;
    this.draggable = undefined;
    this.dragger = undefined;
    this.startLocation = undefined;
    this.totalDelta = new Coordinate(0, 0);
  }

  /**
   * Returns the total distance current element has moved in pixels.
   */
  protected totalPixelDelta() {
    const scale = this.workspace.scale;
    return new Coordinate(this.totalDelta.x * scale, this.totalDelta.y * scale);
  }

  /**
   * Scrolls the current element into view.
   */
  protected scrollCurrentElementIntoView() {
    if (!this.draggable) return;
    const bounds = this.draggable.getBoundingRectangle();
    this.workspace.scrollBoundsIntoView(bounds);
  }

  /**
   * Recalculates the total movement delta from the starting location and the
   * current position of the item being moved.
   */
  protected updateTotalDelta() {
    if (!this.draggable || !this.startLocation) return;

    this.totalDelta = new Coordinate(
      this.draggable.getRelativeToSurfaceXY().x - this.startLocation.x,
      this.draggable.getRelativeToSurfaceXY().y - this.startLocation.y,
    );
  }
}
