/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The class representing an in-progress gesture, e.g. a drag,
 * tap, or pinch to zoom.
 *
 * @class
 */
// Former goog.module ID: Blockly.Gesture

// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_click.js';

import * as blockAnimations from './block_animations.js';
import type {BlockSvg} from './block_svg.js';
import * as browserEvents from './browser_events.js';
import {RenderedWorkspaceComment} from './comments.js';
import * as common from './common.js';
import {config} from './config.js';
import * as dropDownDiv from './dropdowndiv.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import type {Field} from './field.js';
import {getFocusManager} from './focus_manager.js';
import type {IBubble} from './interfaces/i_bubble.js';
import {IDraggable, isDraggable} from './interfaces/i_draggable.js';
import {IDragger} from './interfaces/i_dragger.js';
import type {IFlyout} from './interfaces/i_flyout.js';
import type {IIcon} from './interfaces/i_icon.js';
import {keyboardNavigationController} from './keyboard_navigation_controller.js';
import * as registry from './registry.js';
import * as Tooltip from './tooltip.js';
import * as Touch from './touch.js';
import {Coordinate} from './utils/coordinate.js';
import {WorkspaceDragger} from './workspace_dragger.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Note: In this file "start" refers to pointerdown
 * events.  "End" refers to pointerup events.
 */

/** A multiplier used to convert the gesture scale to a zoom in delta. */
const ZOOM_IN_MULTIPLIER = 5;

/** A multiplier used to convert the gesture scale to a zoom out delta. */
const ZOOM_OUT_MULTIPLIER = 6;

/**
 * Class for one gesture.
 */
export class Gesture {
  /**
   * The position of the pointer when the gesture started.  Units are CSS
   * pixels, with (0, 0) at the top left of the browser window (pointer event
   * clientX/Y).
   */
  private mouseDownXY = new Coordinate(0, 0);
  private currentDragDeltaXY: Coordinate;

  /**
   * The bubble that the gesture started on, or null if it did not start on a
   * bubble.
   */
  private startBubble: IBubble | null = null;

  /**
   * The field that the gesture started on, or null if it did not start on a
   * field.
   */
  private startField: Field | null = null;

  /**
   * The icon that the gesture started on, or null if it did not start on an
   * icon.
   */
  private startIcon: IIcon | null = null;

  /**
   * The block that the gesture started on, or null if it did not start on a
   * block.
   */
  private startBlock: BlockSvg | null = null;

  /**
   * The comment that the gesture started on, or null if it did not start on a
   * comment.
   */
  private startComment: RenderedWorkspaceComment | null = null;

  /**
   * The block that this gesture targets.  If the gesture started on a
   * shadow block, this is the first non-shadow parent of the block.  If the
   * gesture started in the flyout, this is the root block of the block group
   * that was clicked or dragged.
   */
  private targetBlock: BlockSvg | null = null;

  /**
   * The workspace that the gesture started on.  There may be multiple
   * workspaces on a page; this is more accurate than using
   * Blockly.common.getMainWorkspace().
   */
  protected startWorkspace_: WorkspaceSvg | null = null;

  /**
   * Whether the pointer has at any point moved out of the drag radius.
   * A gesture that exceeds the drag radius is a drag even if it ends exactly
   * at its start point.
   */
  private hasExceededDragRadius = false;

  /**
   * Array holding info needed to unbind events.
   * Used for disposing.
   * Ex: [[node, name, func], [node, name, func]].
   */
  private boundEvents: browserEvents.Data[] = [];

  private dragger: IDragger | null = null;

  /**
   * The object tracking a workspace or flyout workspace drag, or null if none
   * is in progress.
   */
  private workspaceDragger: WorkspaceDragger | null = null;

  /** Whether the gesture is dragging or not. */
  private dragging: boolean = false;

  /** The flyout a gesture started in, if any. */
  private flyout: IFlyout | null = null;

  /** Boolean for sanity-checking that some code is only called once. */
  private calledUpdateIsDragging = false;

  /** Boolean for sanity-checking that some code is only called once. */
  private gestureHasStarted = false;

  /** Boolean used internally to break a cycle in disposal. */
  protected isEnding_ = false;

  /** The event that most recently updated this gesture. */
  private mostRecentEvent: PointerEvent;

  /** Boolean for whether or not this gesture is a multi-touch gesture. */
  private multiTouch = false;

  /** A map of cached points used for tracking multi-touch gestures. */
  private cachedPoints = new Map<string, Coordinate | null>();

  /**
   * This is the ratio between the starting distance between the touch points
   * and the most recent distance between the touch points.
   * Scales between 0 and 1 mean the most recent zoom was a zoom out.
   * Scales above 1.0 mean the most recent zoom was a zoom in.
   */
  private previousScale = 0;

  /** The starting distance between two touch points. */
  private startDistance = 0;

  /** Boolean for whether or not the workspace supports pinch-zoom. */
  private isPinchZoomEnabled: boolean | null = null;

  /**
   * The owner of the dropdownDiv when this gesture first starts.
   * Needed because we'll close the dropdown before fields get to
   * act on their events, and some fields care about who owns
   * the dropdown.
   */
  currentDropdownOwner: Field | null = null;

  /**
   * @param e The event that kicked off this gesture.
   * @param creatorWorkspace The workspace that created this gesture and has a
   *     reference to it.
   */
  constructor(
    e: PointerEvent,
    private readonly creatorWorkspace: WorkspaceSvg,
  ) {
    this.mostRecentEvent = e;

    /**
     * How far the pointer has moved during this drag, in pixel units.
     * (0, 0) is at this.mouseDownXY_.
     */
    this.currentDragDeltaXY = new Coordinate(0, 0);
  }

  /**
   * Sever all links from this object.
   *
   * @internal
   */
  dispose() {
    Touch.clearTouchIdentifier();
    Tooltip.unblock();
    // Clear the owner's reference to this gesture.
    this.creatorWorkspace.clearGesture();

    for (const event of this.boundEvents) {
      browserEvents.unbind(event);
    }
    this.boundEvents.length = 0;

    if (this.workspaceDragger) {
      this.workspaceDragger.dispose();
    }
  }

  /**
   * Update internal state based on an event.
   *
   * @param e The most recent pointer event.
   */
  private updateFromEvent(e: PointerEvent) {
    const currentXY = new Coordinate(e.clientX, e.clientY);
    const changed = this.updateDragDelta(currentXY);
    // Exceeded the drag radius for the first time.
    if (changed) {
      this.updateIsDragging(e);
      Touch.longStop();
    }
    this.mostRecentEvent = e;
  }

  /**
   * DO MATH to set currentDragDeltaXY_ based on the most recent pointer
   * position.
   *
   * @param currentXY The most recent pointer position, in pixel units,
   *     with (0, 0) at the window's top left corner.
   * @returns True if the drag just exceeded the drag radius for the first time.
   */
  private updateDragDelta(currentXY: Coordinate): boolean {
    this.currentDragDeltaXY = Coordinate.difference(
      currentXY,
      this.mouseDownXY,
    );

    if (!this.hasExceededDragRadius) {
      const currentDragDelta = Coordinate.magnitude(this.currentDragDeltaXY);

      // The flyout has a different drag radius from the rest of Blockly.
      const limitRadius = this.flyout
        ? config.flyoutDragRadius
        : config.dragRadius;

      this.hasExceededDragRadius = currentDragDelta > limitRadius;
      return this.hasExceededDragRadius;
    }
    return false;
  }

  /**
   * Update this gesture to record whether a block is being dragged from the
   * flyout.
   * This function should be called on a pointermove event the first time
   * the drag radius is exceeded.  It should be called no more than once per
   * gesture. If a block should be dragged from the flyout this function creates
   * the new block on the main workspace and updates targetBlock_ and
   * startWorkspace_.
   *
   * @returns True if a block is being dragged from the flyout.
   */
  private updateIsDraggingFromFlyout(): boolean {
    if (!this.targetBlock || !this.flyout?.isBlockCreatable(this.targetBlock)) {
      return false;
    }
    if (!this.flyout.targetWorkspace) {
      throw new Error(`Cannot update dragging from the flyout because the ' +
          'flyout's target workspace is undefined`);
    }
    if (
      !this.flyout.isScrollable() ||
      this.flyout.isDragTowardWorkspace(this.currentDragDeltaXY)
    ) {
      this.startWorkspace_ = this.flyout.targetWorkspace;
      this.startWorkspace_.updateScreenCalculationsIfScrolled();
      // Start the event group now, so that the same event group is used for
      // block creation and block dragging.
      if (!eventUtils.getGroup()) {
        eventUtils.setGroup(true);
      }
      // The start block is no longer relevant, because this is a drag.
      this.startBlock = null;
      this.targetBlock = this.flyout.createBlock(this.targetBlock);
      getFocusManager().focusNode(this.targetBlock);
      return true;
    }
    return false;
  }

  /**
   * Check whether to start a workspace drag. If a workspace is being dragged,
   * create the necessary WorkspaceDragger and start the drag.
   *
   * This function should be called on a pointermove event the first time
   * the drag radius is exceeded.  It should be called no more than once per
   * gesture. If a workspace is being dragged this function creates the
   * necessary WorkspaceDragger and starts the drag.
   */
  private updateIsDraggingWorkspace() {
    if (!this.startWorkspace_) {
      throw new Error(
        'Cannot update dragging the workspace because the ' +
          'start workspace is undefined',
      );
    }

    const wsMovable = this.flyout
      ? this.flyout.isScrollable()
      : this.startWorkspace_ && this.startWorkspace_.isDraggable();
    if (!wsMovable) return;

    this.dragging = true;
    this.workspaceDragger = new WorkspaceDragger(this.startWorkspace_);

    this.workspaceDragger.startDrag();
  }

  /**
   * Update this gesture to record whether anything is being dragged.
   * This function should be called on a pointermove event the first time
   * the drag radius is exceeded.  It should be called no more than once per
   * gesture.
   */
  private updateIsDragging(e: PointerEvent) {
    if (!this.startWorkspace_) {
      throw new Error(
        'Cannot update dragging because the start workspace is undefined',
      );
    }

    if (this.calledUpdateIsDragging) {
      throw Error('updateIsDragging_ should only be called once per gesture.');
    }
    this.calledUpdateIsDragging = true;

    // If we drag a block out of the flyout, it updates `common.getSelected`
    // to return the new block.
    if (this.flyout) this.updateIsDraggingFromFlyout();

    const selected = common.getSelected();
    if (selected && isDraggable(selected) && selected.isMovable()) {
      this.dragging = true;
      this.dragger = this.createDragger(selected, this.startWorkspace_);
      this.dragger.onDragStart(e);
      this.dragger.onDrag(e, this.currentDragDeltaXY);
    } else {
      this.updateIsDraggingWorkspace();
    }
  }

  private createDragger(
    draggable: IDraggable,
    workspace: WorkspaceSvg,
  ): IDragger {
    const DraggerClass = registry.getClassFromOptions(
      registry.Type.BLOCK_DRAGGER,
      this.creatorWorkspace.options,
      true,
    );
    return new DraggerClass!(draggable, workspace);
  }

  /**
   * Start a gesture: update the workspace to indicate that a gesture is in
   * progress and bind pointermove and pointerup handlers.
   *
   * @param e A pointerdown event.
   * @internal
   */
  doStart(e: PointerEvent) {
    if (!this.startWorkspace_) {
      throw new Error(
        'Cannot start the touch gesture becauase the start ' +
          'workspace is undefined',
      );
    }
    this.isPinchZoomEnabled =
      this.startWorkspace_.options.zoomOptions &&
      this.startWorkspace_.options.zoomOptions.pinch;

    if (browserEvents.isTargetInput(e)) {
      this.cancel();
      return;
    }

    this.gestureHasStarted = true;

    blockAnimations.disconnectUiStop();

    this.startWorkspace_.updateScreenCalculationsIfScrolled();
    if (this.startWorkspace_.isMutator) {
      // Mutator's coordinate system could be out of date because the bubble was
      // dragged, the block was moved, the parent workspace zoomed, etc.
      this.startWorkspace_.resize();
    }

    // Keep track of which field owns the dropdown before we close it.
    this.currentDropdownOwner = dropDownDiv.getOwner();
    // Hide chaff also hides the flyout, so don't do it if the click is in a
    // flyout.
    this.startWorkspace_.hideChaff(!!this.flyout);

    this.startWorkspace_.markFocused();
    this.mostRecentEvent = e;

    Tooltip.block();

    if (browserEvents.isRightButton(e)) {
      this.handleRightClick(e);
      return;
    }

    if (e.type.toLowerCase() === 'pointerdown' && e.pointerType !== 'mouse') {
      Touch.longStart(e, this);
    }

    this.mouseDownXY = new Coordinate(e.clientX, e.clientY);

    this.bindMouseEvents(e);

    if (!this.isEnding_) {
      this.handleTouchStart(e);
    }
  }

  /**
   * Bind gesture events.
   *
   * @param e A pointerdown event.
   * @internal
   */
  bindMouseEvents(e: PointerEvent) {
    this.boundEvents.push(
      browserEvents.conditionalBind(
        document,
        'pointerdown',
        null,
        this.handleStart.bind(this),
        /* opt_noCaptureIdentifier */ true,
      ),
    );
    this.boundEvents.push(
      browserEvents.conditionalBind(
        document,
        'pointermove',
        null,
        this.handleMove.bind(this),
        /* opt_noCaptureIdentifier */ true,
      ),
    );
    this.boundEvents.push(
      browserEvents.conditionalBind(
        document,
        'pointerup',
        null,
        this.handleUp.bind(this),
        /* opt_noCaptureIdentifier */ true,
      ),
    );
    this.boundEvents.push(
      browserEvents.conditionalBind(
        document,
        'pointercancel',
        null,
        this.handleUp.bind(this),
        /* opt_noCaptureIdentifier */ true,
      ),
    );

    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * Handle a pointerdown event.
   *
   * @param e A pointerdown event.
   * @internal
   */
  handleStart(e: PointerEvent) {
    if (this.isDragging()) {
      // A drag has already started, so this can no longer be a pinch-zoom.
      return;
    }
    this.handleTouchStart(e);

    if (this.isMultiTouch()) {
      Touch.longStop();
    }
  }

  /**
   * Handle a pointermove event.
   *
   * @param e A pointermove event.
   * @internal
   */
  handleMove(e: PointerEvent) {
    if (
      (this.isDragging() && Touch.shouldHandleEvent(e)) ||
      !this.isMultiTouch()
    ) {
      this.updateFromEvent(e);
      if (this.workspaceDragger) {
        this.workspaceDragger.drag(this.currentDragDeltaXY);
      } else if (this.dragger) {
        this.dragger.onDrag(this.mostRecentEvent, this.currentDragDeltaXY);
      }
      e.preventDefault();
      e.stopPropagation();
    } else if (this.isMultiTouch()) {
      this.handleTouchMove(e);
      Touch.longStop();
    }
  }

  /**
   * Handle a pointerup event.
   *
   * @param e A pointerup event.
   * @internal
   */
  handleUp(e: PointerEvent) {
    if (!this.isDragging()) {
      this.handleTouchEnd(e);
    }
    if (!this.isMultiTouch() || this.isDragging()) {
      if (!Touch.shouldHandleEvent(e)) {
        return;
      }
      this.updateFromEvent(e);
      Touch.longStop();

      if (this.isEnding_) {
        console.log('Trying to end a gesture recursively.');
        return;
      }
      this.isEnding_ = true;
      // The ordering of these checks is important: drags have higher priority
      // than clicks.  Fields and icons have higher priority than blocks; blocks
      // have higher priority than workspaces. The ordering within drags does
      // not matter, because the three types of dragging are exclusive.
      if (this.dragger) {
        keyboardNavigationController.setIsActive(false);
        this.dragger.onDragEnd(e, this.currentDragDeltaXY);
      } else if (this.workspaceDragger) {
        keyboardNavigationController.setIsActive(false);
        this.workspaceDragger.endDrag(this.currentDragDeltaXY);
      } else if (this.isBubbleClick()) {
        // Do nothing, bubbles don't currently respond to clicks.
      } else if (this.isCommentClick()) {
        // Do nothing, comments don't currently respond to clicks.
      } else if (this.isFieldClick()) {
        this.doFieldClick();
      } else if (this.isIconClick()) {
        this.doIconClick();
      } else if (this.isBlockClick()) {
        this.doBlockClick();
      } else if (this.isWorkspaceClick()) {
        this.doWorkspaceClick(e);
      }

      e.preventDefault();
      e.stopPropagation();

      this.dispose();
    } else {
      e.preventDefault();
      e.stopPropagation();

      this.dispose();
    }
  }

  /**
   * Handle a pointerdown event and keep track of current
   * pointers.
   *
   * @param e A pointerdown event.
   * @internal
   */
  handleTouchStart(e: PointerEvent) {
    const pointerId = Touch.getTouchIdentifierFromEvent(e);
    // store the pointerId in the current list of pointers
    this.cachedPoints.set(pointerId, this.getTouchPoint(e));
    const pointers = Array.from(this.cachedPoints.keys());
    // If two pointers are down, store info
    if (pointers.length === 2) {
      const point0 = this.cachedPoints.get(pointers[0])!;
      const point1 = this.cachedPoints.get(pointers[1])!;
      this.startDistance = Coordinate.distance(point0, point1);
      this.multiTouch = true;
      e.preventDefault();
    }
  }

  /**
   * Handle a pointermove event and zoom in/out if two pointers
   * are on the screen.
   *
   * @param e A pointermove event.
   * @internal
   */
  handleTouchMove(e: PointerEvent) {
    const pointerId = Touch.getTouchIdentifierFromEvent(e);
    this.cachedPoints.set(pointerId, this.getTouchPoint(e));

    if (this.isPinchZoomEnabled && this.cachedPoints.size === 2) {
      this.handlePinch(e);
    } else {
      // Handle the move directly instead of calling handleMove
      this.updateFromEvent(e);
      if (this.workspaceDragger) {
        this.workspaceDragger.drag(this.currentDragDeltaXY);
      } else if (this.dragger) {
        this.dragger.onDrag(this.mostRecentEvent, this.currentDragDeltaXY);
      }
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * Handle pinch zoom gesture.
   *
   * @param e A pointermove event.
   */
  private handlePinch(e: PointerEvent) {
    const pointers = Array.from(this.cachedPoints.keys());
    // Calculate the distance between the two pointers
    const point0 = this.cachedPoints.get(pointers[0])!;
    const point1 = this.cachedPoints.get(pointers[1])!;
    const moveDistance = Coordinate.distance(point0, point1);
    const scale = moveDistance / this.startDistance;

    if (this.previousScale > 0 && this.previousScale < Infinity) {
      const gestureScale = scale - this.previousScale;
      const delta =
        gestureScale > 0
          ? gestureScale * ZOOM_IN_MULTIPLIER
          : gestureScale * ZOOM_OUT_MULTIPLIER;
      if (!this.startWorkspace_) {
        throw new Error(
          'Cannot handle a pinch because the start workspace ' + 'is undefined',
        );
      }
      const workspace = this.startWorkspace_;
      const position = browserEvents.mouseToSvg(
        e,
        workspace.getParentSvg(),
        workspace.getInverseScreenCTM(),
      );
      workspace.zoom(position.x, position.y, delta);
    }
    this.previousScale = scale;
    e.preventDefault();
  }

  /**
   * Handle a pointerup event and end the gesture.
   *
   * @param e A pointerup event.
   * @internal
   */
  handleTouchEnd(e: PointerEvent) {
    const pointerId = Touch.getTouchIdentifierFromEvent(e);
    if (this.cachedPoints.has(pointerId)) {
      this.cachedPoints.delete(pointerId);
    }
    if (this.cachedPoints.size < 2) {
      this.cachedPoints.clear();
      this.previousScale = 0;
    }
  }

  /**
   * Helper function returning the current touch point coordinate.
   *
   * @param e A pointer event.
   * @returns The current touch point coordinate
   * @internal
   */
  getTouchPoint(e: PointerEvent): Coordinate | null {
    if (!this.startWorkspace_) {
      return null;
    }
    return new Coordinate(e.pageX, e.pageY);
  }

  /**
   * Whether this gesture is part of a multi-touch gesture.
   *
   * @returns Whether this gesture is part of a multi-touch gesture.
   * @internal
   */
  isMultiTouch(): boolean {
    return this.multiTouch;
  }

  /**
   * Cancel an in-progress gesture.  If a workspace or block drag is in
   * progress, end the drag at the most recent location.
   *
   * @internal
   */
  cancel() {
    // Disposing of a block cancels in-progress drags, but dragging to a delete
    // area disposes of a block and leads to recursive disposal. Break that
    // cycle.
    if (this.isEnding_) {
      return;
    }
    Touch.longStop();
    if (this.dragger) {
      this.dragger.onDragEnd(this.mostRecentEvent, this.currentDragDeltaXY);
    } else if (this.workspaceDragger) {
      this.workspaceDragger.endDrag(this.currentDragDeltaXY);
    }
    this.dispose();
  }

  /**
   * Handle a real or faked right-click event by showing a context menu.
   *
   * @param e A pointerdown event.
   * @internal
   */
  handleRightClick(e: PointerEvent) {
    if (this.targetBlock) {
      this.bringBlockToFront();
      this.targetBlock.workspace.hideChaff(!!this.flyout);
      this.targetBlock.showContextMenu(e);
    } else if (this.startBubble) {
      this.startBubble.showContextMenu(e);
    } else if (this.startComment) {
      this.startComment.workspace.hideChaff();
      this.startComment.showContextMenu(e);
    } else if (this.startWorkspace_ && !this.flyout) {
      this.startWorkspace_.hideChaff();
      getFocusManager().focusNode(this.startWorkspace_);
      this.startWorkspace_.showContextMenu(e);
    }

    // TODO: Handle right-click on a bubble.
    e.preventDefault();
    e.stopPropagation();

    keyboardNavigationController.setIsActive(false);

    this.dispose();
  }

  /**
   * Handle a pointerdown event on a workspace.
   *
   * @param e A pointerdown event.
   * @param ws The workspace the event hit.
   * @internal
   */
  handleWsStart(e: PointerEvent, ws: WorkspaceSvg) {
    if (this.gestureHasStarted) {
      throw Error(
        'Tried to call gesture.handleWsStart, ' +
          'but the gesture had already been started.',
      );
    }
    this.setStartWorkspace(ws);
    this.mostRecentEvent = e;

    if (!this.startBlock && !this.startBubble && !this.startComment) {
      // Ensure the workspace is selected if nothing else should be. Note that
      // this is focusNode() instead of focusTree() because if any active node
      // is focused in the workspace it should be defocused.
      getFocusManager().focusNode(ws);
    } else if (this.startBlock) {
      getFocusManager().focusNode(this.startBlock);
    }

    this.doStart(e);
  }

  /**
   * Fires a workspace click event.
   *
   * @param ws The workspace that a user clicks on.
   */
  private fireWorkspaceClick(ws: WorkspaceSvg) {
    eventUtils.fire(
      new (eventUtils.get(EventType.CLICK))(null, ws.id, 'workspace'),
    );
  }

  /**
   * Handle a pointerdown event on a flyout.
   *
   * @param e A pointerdown event.
   * @param flyout The flyout the event hit.
   * @internal
   */
  handleFlyoutStart(e: PointerEvent, flyout: IFlyout) {
    if (this.gestureHasStarted) {
      throw Error(
        'Tried to call gesture.handleFlyoutStart, ' +
          'but the gesture had already been started.',
      );
    }
    this.setStartFlyout(flyout);
    this.handleWsStart(e, flyout.getWorkspace());
  }

  /**
   * Handle a pointerdown event on a block.
   *
   * @param e A pointerdown event.
   * @param block The block the event hit.
   * @internal
   */
  handleBlockStart(e: PointerEvent, block: BlockSvg) {
    if (this.gestureHasStarted) {
      throw Error(
        'Tried to call gesture.handleBlockStart, ' +
          'but the gesture had already been started.',
      );
    }
    this.setStartBlock(block);
    this.mostRecentEvent = e;
  }

  /**
   * Handle a pointerdown event on a bubble.
   *
   * @param e A pointerdown event.
   * @param bubble The bubble the event hit.
   * @internal
   */
  handleBubbleStart(e: PointerEvent, bubble: IBubble) {
    if (this.gestureHasStarted) {
      throw Error(
        'Tried to call gesture.handleBubbleStart, ' +
          'but the gesture had already been started.',
      );
    }
    this.setStartBubble(bubble);
    this.mostRecentEvent = e;
  }

  /**
   * Handle a pointerdown event on a workspace comment.
   *
   * @param e A pointerdown event.
   * @param comment The comment the event hit.
   * @internal
   */
  handleCommentStart(e: PointerEvent, comment: RenderedWorkspaceComment) {
    if (this.gestureHasStarted) {
      throw Error(
        'Tried to call gesture.handleCommentStart, ' +
          'but the gesture had already been started.',
      );
    }
    this.setStartComment(comment);
    this.mostRecentEvent = e;
  }

  /* Begin functions defining what actions to take to execute clicks on each
   * type of target.  Any developer wanting to add behaviour on clicks should
   * modify only this code. */

  /** Execute a field click. */
  private doFieldClick() {
    if (!this.startField) {
      throw new Error(
        'Cannot do a field click because the start field is undefined',
      );
    }

    // Note that the order is important here: bringing a block to the front will
    // cause it to become focused and showing the field editor will capture
    // focus ephemerally. It's important to ensure that focus is properly
    // restored back to the block after field editing has completed.
    this.bringBlockToFront();

    // Only show the editor if the field's editor wasn't already open
    // right before this gesture started.
    const dropdownAlreadyOpen = this.currentDropdownOwner === this.startField;
    if (!dropdownAlreadyOpen) {
      this.startField.showEditor(this.mostRecentEvent);
    }
  }

  /** Execute an icon click. */
  private doIconClick() {
    if (!this.startIcon) {
      throw new Error(
        'Cannot do an icon click because the start icon is undefined',
      );
    }
    this.bringBlockToFront();
    this.startIcon.onClick();
  }

  /** Execute a block click. */
  private doBlockClick() {
    // Block click in an autoclosing flyout.
    if (this.flyout && this.flyout.autoClose) {
      if (!this.targetBlock) {
        throw new Error(
          'Cannot do a block click because the target block is ' + 'undefined',
        );
      }
      if (this.flyout.isBlockCreatable(this.targetBlock)) {
        if (!eventUtils.getGroup()) {
          eventUtils.setGroup(true);
        }
        const newBlock = this.flyout.createBlock(this.targetBlock);
        newBlock.snapToGrid();
        newBlock.bumpNeighbours();

        // If a new block was added, make sure that it's correctly focused.
        getFocusManager().focusNode(newBlock);
      }
    } else {
      if (!this.startWorkspace_) {
        throw new Error(
          'Cannot do a block click because the start workspace ' +
            'is undefined',
        );
      }
      // Clicks events are on the start block, even if it was a shadow.
      const event = new (eventUtils.get(EventType.CLICK))(
        this.startBlock,
        this.startWorkspace_.id,
        'block',
      );
      eventUtils.fire(event);
    }
    this.bringBlockToFront();
    eventUtils.setGroup(false);
  }

  /**
   * Execute a workspace click. When in accessibility mode shift clicking will
   * move the cursor.
   *
   * @param _e A pointerup event.
   */
  private doWorkspaceClick(_e: PointerEvent) {
    this.fireWorkspaceClick(this.startWorkspace_ || this.creatorWorkspace);
  }

  /* End functions defining what actions to take to execute clicks on each type
   * of target. */

  // TODO (fenichel): Move bubbles to the front.

  /**
   * Move the dragged/clicked block to the front of the workspace so that it is
   * not occluded by other blocks.
   */
  private bringBlockToFront() {
    // Blocks in the flyout don't overlap, so skip the work.
    if (this.targetBlock && !this.flyout) {
      // Always ensure the block being dragged/clicked has focus.
      getFocusManager().focusNode(this.targetBlock);
      this.targetBlock.bringToFront();
    }
  }

  /* Begin functions for populating a gesture at pointerdown. */

  /**
   * Record the field that a gesture started on.
   *
   * @param field The field the gesture started on.
   * @internal
   */
  setStartField<T>(field: Field<T>) {
    if (this.gestureHasStarted) {
      throw Error(
        'Tried to call gesture.setStartField, ' +
          'but the gesture had already been started.',
      );
    }
    if (!this.startField) {
      this.startField = field as Field;
    }
  }

  /**
   * Record the icon that a gesture started on.
   *
   * @param icon The icon the gesture started on.
   * @internal
   */
  setStartIcon(icon: IIcon) {
    if (this.gestureHasStarted) {
      throw Error(
        'Tried to call gesture.setStartIcon, ' +
          'but the gesture had already been started.',
      );
    }

    if (!this.startIcon) this.startIcon = icon;
  }

  /**
   * Record the bubble that a gesture started on
   *
   * @param bubble The bubble the gesture started on.
   * @internal
   */
  setStartBubble(bubble: IBubble) {
    if (!this.startBubble) {
      this.startBubble = bubble;
    }
  }

  /**
   * Record the comment that a gesture started on
   *
   * @param comment The comment the gesture started on.
   * @internal
   */
  setStartComment(comment: RenderedWorkspaceComment) {
    if (!this.startComment) {
      this.startComment = comment;
    }
  }

  /**
   * Record the block that a gesture started on, and set the target block
   * appropriately.
   *
   * @param block The block the gesture started on.
   * @internal
   */
  setStartBlock(block: BlockSvg) {
    // If the gesture already went through a bubble, don't set the start block.
    if (!this.startBlock && !this.startBubble) {
      this.startBlock = block;
      if (block.isInFlyout && block !== block.getRootBlock()) {
        this.setTargetBlock(block.getRootBlock());
      } else {
        this.setTargetBlock(block);
      }
    }
  }

  /**
   * Record the block that a gesture targets, meaning the block that will be
   * dragged if this turns into a drag.  If this block is a shadow, that will be
   * its first non-shadow parent.
   *
   * @param block The block the gesture targets.
   */
  private setTargetBlock(block: BlockSvg) {
    if (block.isShadow()) {
      // Non-null assertion is fine b/c it is an invariant that shadows always
      // have parents.
      this.setTargetBlock(block.getParent()!);
    } else {
      this.targetBlock = block;
      getFocusManager().focusNode(block);
    }
  }

  /**
   * Record the workspace that a gesture started on.
   *
   * @param ws The workspace the gesture started on.
   */
  private setStartWorkspace(ws: WorkspaceSvg) {
    if (!this.startWorkspace_) {
      this.startWorkspace_ = ws;
    }
  }

  /**
   * Record the flyout that a gesture started on.
   *
   * @param flyout The flyout the gesture started on.
   */
  private setStartFlyout(flyout: IFlyout) {
    if (!this.flyout) {
      this.flyout = flyout;
    }
  }

  /* End functions for populating a gesture at pointerdown. */

  /* Begin helper functions defining types of clicks.  Any developer wanting
   * to change the definition of a click should modify only this code. */

  /**
   * Whether this gesture is a click on a bubble.  This should only be called
   * when ending a gesture (pointerup).
   *
   * @returns Whether this gesture was a click on a bubble.
   */
  private isBubbleClick(): boolean {
    // A bubble click starts on a bubble and never escapes the drag radius.
    const hasStartBubble = !!this.startBubble;
    return hasStartBubble && !this.hasExceededDragRadius;
  }

  private isCommentClick(): boolean {
    return !!this.startComment && !this.hasExceededDragRadius;
  }

  /**
   * Whether this gesture is a click on a block.  This should only be called
   * when ending a gesture (pointerup).
   *
   * @returns Whether this gesture was a click on a block.
   */
  private isBlockClick(): boolean {
    // A block click starts on a block, never escapes the drag radius, and is
    // not a field click.
    const hasStartBlock = !!this.startBlock;
    return (
      hasStartBlock &&
      !this.hasExceededDragRadius &&
      !this.isFieldClick() &&
      !this.isIconClick()
    );
  }

  /**
   * Whether this gesture is a click on a field that should be handled.  This should only be called
   * when ending a gesture (pointerup).
   *
   * @returns Whether this gesture was a click on a field.
   */
  private isFieldClick(): boolean {
    if (!this.startField) return false;
    return (
      this.startField.isClickable() &&
      !this.hasExceededDragRadius &&
      (!this.flyout ||
        this.startField.isClickableInFlyout(this.flyout.autoClose))
    );
  }

  /** @returns Whether this gesture is a click on an icon that should be handled. */
  private isIconClick(): boolean {
    if (!this.startIcon) return false;
    const handleInFlyout =
      !this.flyout ||
      !this.startIcon.isClickableInFlyout ||
      this.startIcon.isClickableInFlyout(this.flyout.autoClose);
    return !this.hasExceededDragRadius && handleInFlyout;
  }

  /**
   * Whether this gesture is a click on a workspace.  This should only be called
   * when ending a gesture (pointerup).
   *
   * @returns Whether this gesture was a click on a workspace.
   */
  private isWorkspaceClick(): boolean {
    const onlyTouchedWorkspace =
      !this.startBlock && !this.startBubble && !this.startField;
    return onlyTouchedWorkspace && !this.hasExceededDragRadius;
  }

  /* End helper functions defining types of clicks. */

  /** Returns the current dragger if the gesture is a drag. */
  getCurrentDragger(): WorkspaceDragger | IDragger | null {
    return this.workspaceDragger ?? this.dragger ?? null;
  }

  /**
   * Whether this gesture is a drag of either a workspace or block.
   * This function is called externally to block actions that cannot be taken
   * mid-drag (e.g. using the keyboard to delete the selected blocks).
   *
   * @returns True if this gesture is a drag of a workspace or block.
   * @internal
   */
  isDragging(): boolean {
    return this.dragging;
  }

  /**
   * Whether this gesture has already been started.  In theory every pointerdown
   * has a corresponding pointerup, but in reality it is possible to lose a
   * pointerup, leaving an in-process gesture hanging.
   *
   * @returns Whether this gesture was a click on a workspace.
   * @internal
   */
  hasStarted(): boolean {
    return this.gestureHasStarted;
  }

  /**
   * Is a drag or other gesture currently in progress on any workspace?
   *
   * @returns True if gesture is occurring.
   */
  static inProgress(): boolean {
    const workspaces = common.getAllWorkspaces();
    for (let i = 0, workspace; (workspace = workspaces[i]); i++) {
      // Not actually necessarily a WorkspaceSvg, but it doesn't matter b/c
      // we're just checking if the property exists. Theoretically we would
      // want to use instanceof, but that causes a circular dependency.
      if ((workspace as WorkspaceSvg).currentGesture_) {
        return true;
      }
    }
    return false;
  }
}
