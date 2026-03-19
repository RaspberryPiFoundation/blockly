/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
import type {IDraggable} from '../interfaces/i_draggable.js';
import type {IDragger} from '../interfaces/i_dragger.js';
import * as registry from '../registry.js';
import {ShortcutRegistry} from '../shortcut_registry.js';
import {Coordinate} from '../utils/coordinate.js';
import {KeyCodes} from '../utils/keycodes.js';
import {MoveIndicator} from './move_indicator.js';

/**
 * Cardinal directions in which a move can proceed.
 */
export enum Direction {
  NONE,
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
  private dragger?: IDragger;

  /**
   * The object that is currently being moved.
   */
  private draggable?: IDraggable;

  /**
   * Workspace coordinate that the current move started from.
   */
  private startLocation?: Coordinate;

  /**
   * The total distance, in workspace coordinates, that the element being moved
   * has been moved since the movement process started.
   */
  private totalDelta = new Coordinate(0, 0);

  /**
   * The distance to move an item in workspace coordinates.
   */
  private stepDistance = 20;

  /**
   * Symbol attached to the item being moved to indicate it is in move mode.
   */
  private moveIndicator?: MoveIndicator;

  private allowedShortcuts: string[] = [];

  // Set up a blur listener to end the move if the user clicks away
  private readonly blurListener = () => {
    this.abortMove();
  };

  static mover = new KeyboardMover();

  // Constructor is private to keep this class a singleton.
  private constructor() {}

  /**
   * Returns true iff the given draggable is allowed to be moved.
   *
   * @param draggable The draggable element to try to move.
   * @returns True iff movement is allowed.
   */
  canMove(draggable: IDraggable) {
    return !draggable.workspace.isReadOnly() && draggable.isMovable();
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
  startMove(draggable: IDraggable, event?: KeyboardEvent) {
    if (!this.canMove(draggable) || this.isMoving()) return false;

    const DraggerClass = registry.getClassFromOptions(
      registry.Type.BLOCK_DRAGGER,
      draggable.workspace.options,
      true,
    );
    if (!DraggerClass) throw new Error('no Dragger registered');
    this.dragger = new DraggerClass(draggable, draggable.workspace);
    // Record that a move is in progress and start dragging.
    this.draggable = this.dragger.onDragStart(event);
    this.startLocation = this.draggable.getRelativeToSurfaceXY();

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
    this.moveIndicator = new MoveIndicator(this.draggable.workspace);
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
   * Returns a list of the names of shortcuts that are allowed to be run while
   * a keyboard-driven move is in progress.
   */
  getAllowedShortcuts() {
    return this.allowedShortcuts;
  }

  /**
   * Adds shortcuts with the given names to the list of shortcuts that are
   * allowed to be run while a keyboard-driven move is in progress.
   */
  setAllowedShortcuts(shortcutNames: string[]) {
    this.allowedShortcuts = shortcutNames;
  }

  /**
   * Repositions the move indicator to the corner of the item being moved.
   */
  private repositionMoveIndicator() {
    const bounds = this.draggable?.getBoundingRectangle();
    if (!bounds) return;

    this.moveIndicator?.moveTo(
      this.draggable?.workspace.RTL ? bounds.left : bounds.right,
      bounds.top,
    );
  }

  /**
   * Common clean-up for finish/abort run before terminating the move.
   */
  private preDragEndCleanup() {
    ShortcutRegistry.registry.unregister(COMMIT_MOVE_SHORTCUT);

    // Remove the blur listener before ending the drag
    this.draggable
      ?.getFocusableElement()
      .removeEventListener('blur', this.blurListener);
  }

  /**
   * Common clean-up for finish/abort run after terminating the move.
   */
  private postDragEndCleanup() {
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
  private totalPixelDelta() {
    const scale = this.draggable?.workspace.scale ?? 1;
    return new Coordinate(this.totalDelta.x * scale, this.totalDelta.y * scale);
  }

  /**
   * Scrolls the current element into view.
   */
  private scrollCurrentElementIntoView() {
    if (!this.draggable) return;
    const bounds = this.draggable.getBoundingRectangle();
    this.draggable.workspace.scrollBoundsIntoView(bounds);
  }

  /**
   * Recalculates the total movement delta from the starting location and the
   * current position of the item being moved.
   */
  private updateTotalDelta() {
    if (!this.draggable || !this.startLocation) return;

    this.totalDelta = new Coordinate(
      this.draggable.getRelativeToSurfaceXY().x - this.startLocation.x,
      this.draggable.getRelativeToSurfaceXY().y - this.startLocation.y,
    );
  }
}
