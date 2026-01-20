/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Block} from '../block.js';
import * as blockAnimation from '../block_animations.js';
import {BlockSvg} from '../block_svg.js';
import * as bumpObjects from '../bump_objects.js';
import {config} from '../config.js';
import {Connection} from '../connection.js';
import {ConnectionType} from '../connection_type.js';
import type {BlockMove} from '../events/events_block_move.js';
import {EventType} from '../events/type.js';
import * as eventUtils from '../events/utils.js';
import type {IBubble} from '../interfaces/i_bubble.js';
import {IConnectionPreviewer} from '../interfaces/i_connection_previewer.js';
import {IDragStrategy} from '../interfaces/i_draggable.js';
import {IHasBubble, hasBubble} from '../interfaces/i_has_bubble.js';
import * as layers from '../layers.js';
import * as registry from '../registry.js';
import {finishQueuedRenders} from '../render_management.js';
import {RenderedConnection} from '../rendered_connection.js';
import {Coordinate} from '../utils.js';
import * as dom from '../utils/dom.js';
import {WorkspaceSvg} from '../workspace_svg.js';

/** Represents a nearby valid connection. */
interface ConnectionCandidate {
  /** A connection on the dragging stack that is compatible with neighbour. */
  local: RenderedConnection;

  /** A nearby connection that is compatible with local. */
  neighbour: RenderedConnection;

  /** The distance between the local connection and the neighbour connection. */
  distance: number;
}

export class BlockDragStrategy implements IDragStrategy {
  private workspace: WorkspaceSvg;

  /** The parent block at the start of the drag. */
  private startParentConn: RenderedConnection | null = null;

  /**
   * The child block at the start of the drag. Only gets set if
   * `healStack` is true.
   */
  private startChildConn: RenderedConnection | null = null;

  private startLoc: Coordinate | null = null;

  private connectionCandidate: ConnectionCandidate | null = null;

  private connectionPreviewer: IConnectionPreviewer | null = null;

  private dragging = false;

  /**
   * If this is a shadow block, the offset between this block and the parent
   * block, to add to the drag location. In workspace units.
   */
  private dragOffset = new Coordinate(0, 0);

  /** Used to persist an event group when snapping is done async. */
  private originalEventGroup = '';

  constructor(private block: BlockSvg) {
    this.workspace = block.workspace;
  }

  /** Returns true if the block is currently movable. False otherwise. */
  isMovable(): boolean {
    if (this.block.isShadow()) {
      return this.block.getParent()?.isMovable() ?? false;
    }

    return (
      this.block.isOwnMovable() &&
      !this.block.isDeadOrDying() &&
      !this.workspace.isReadOnly() &&
      // We never drag blocks in the flyout, only create new blocks that are
      // dragged.
      !this.block.isInFlyout
    );
  }

  /**
   * Handles any setup for starting the drag, including disconnecting the block
   * from any parent blocks.
   */
  startDrag(e?: PointerEvent): void {
    if (this.block.isShadow()) {
      this.startDraggingShadow(e);
      return;
    }

    this.dragging = true;
    this.fireDragStartEvent();

    this.startLoc = this.block.getRelativeToSurfaceXY();

    this.connectionCandidate = null;
    const previewerConstructor = registry.getClassFromOptions(
      registry.Type.CONNECTION_PREVIEWER,
      this.workspace.options,
    );
    this.connectionPreviewer = new previewerConstructor!(this.block);

    // During a drag there may be a lot of rerenders, but not field changes.
    // Turn the cache on so we don't do spurious remeasures during the drag.
    dom.startTextWidthCache();
    this.workspace.setResizesEnabled(false);
    blockAnimation.disconnectUiStop();

    const healStack = this.shouldHealStack(e);

    if (this.shouldDisconnect(healStack)) {
      this.disconnectBlock(healStack);
    }
    this.block.setDragging(true);
    this.workspace.getLayerManager()?.moveToDragLayer(this.block);
    this.getVisibleBubbles(this.block).forEach((bubble) => {
      this.workspace.getLayerManager()?.moveToDragLayer(bubble, false);
    });
  }

  /**
   * Returns an array of visible bubbles attached to the given block or its
   * descendants.
   *
   * @param block The block to identify open bubbles on.
   * @returns An array of all currently visible bubbles on the given block or
   *    its descendants.
   */
  private getVisibleBubbles(block: BlockSvg): IBubble[] {
    return block
      .getDescendants(false)
      .flatMap((block) => block.getIcons())
      .filter((icon) => hasBubble(icon) && icon.bubbleIsVisible())
      .map((icon) => (icon as unknown as IHasBubble).getBubble())
      .filter((bubble) => !!bubble) // Convince TS they're non-null.
      .sort((a, b) => {
        // Sort the bubbles by their position in the DOM in order to maintain
        // their relative z-ordering when moving between layers.
        const position = a.getSvgRoot().compareDocumentPosition(b.getSvgRoot());
        if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        return 0;
      });
  }

  /**
   * Get whether the drag should act on a single block or a block stack.
   *
   * @param e The instigating pointer event, if any.
   * @returns True if just the initial block should be dragged out, false
   *     if all following blocks should also be dragged.
   */
  protected shouldHealStack(e: PointerEvent | undefined) {
    return !!e && (e.altKey || e.ctrlKey || e.metaKey);
  }

  /** Starts a drag on a shadow, recording the drag offset. */
  private startDraggingShadow(e?: PointerEvent) {
    const parent = this.block.getParent();
    if (!parent) {
      throw new Error(
        'Tried to drag a shadow block with no parent. ' +
          'Shadow blocks should always have parents.',
      );
    }
    this.dragOffset = Coordinate.difference(
      parent.getRelativeToSurfaceXY(),
      this.block.getRelativeToSurfaceXY(),
    );
    parent.startDrag(e);
  }

  /**
   * Whether or not we should disconnect the block when a drag is started.
   *
   * @param healStack Whether or not to heal the stack after disconnecting.
   * @returns True to disconnect the block, false otherwise.
   */
  private shouldDisconnect(healStack: boolean): boolean {
    return !!(
      this.block.getParent() ||
      (healStack &&
        this.block.nextConnection &&
        this.block.nextConnection.targetBlock())
    );
  }

  /**
   * Disconnects the block from any parents. If `healStack` is true and this is
   * a stack block, we also disconnect from any next blocks and attempt to
   * attach them to any parent.
   *
   * @param healStack Whether or not to heal the stack after disconnecting.
   */
  private disconnectBlock(healStack: boolean) {
    this.startParentConn =
      this.block.outputConnection?.targetConnection ??
      this.block.previousConnection?.targetConnection;
    if (healStack) {
      this.startChildConn = this.block.nextConnection?.targetConnection;
    }

    this.block.unplug(healStack);
    blockAnimation.disconnectUiEffect(this.block);
  }

  /** Fire a UI event at the start of a block drag. */
  private fireDragStartEvent() {
    const event = new (eventUtils.get(EventType.BLOCK_DRAG))(
      this.block,
      true,
      this.block.getDescendants(false),
    );
    eventUtils.fire(event);
  }

  /** Fire a UI event at the end of a block drag. */
  private fireDragEndEvent() {
    const event = new (eventUtils.get(EventType.BLOCK_DRAG))(
      this.block,
      false,
      this.block.getDescendants(false),
    );
    eventUtils.fire(event);
  }

  /** Fire a move event at the end of a block drag. */
  private fireMoveEvent() {
    if (this.block.isDeadOrDying()) return;
    const event = new (eventUtils.get(EventType.BLOCK_MOVE))(
      this.block,
    ) as BlockMove;
    event.setReason(['drag']);
    event.oldCoordinate = this.startLoc!;
    event.recordNew();
    eventUtils.fire(event);
  }

  /** Moves the block and updates any connection previews. */
  drag(newLoc: Coordinate): void {
    if (this.block.isShadow()) {
      this.block.getParent()?.drag(Coordinate.sum(newLoc, this.dragOffset));
      return;
    }

    this.block.moveDuringDrag(newLoc);
    this.updateConnectionPreview(
      this.block,
      Coordinate.difference(newLoc, this.startLoc!),
    );
  }

  /**
   * @param draggingBlock The block being dragged.
   * @param delta How far the pointer has moved from the position
   *     at the start of the drag, in workspace units.
   */
  private updateConnectionPreview(draggingBlock: BlockSvg, delta: Coordinate) {
    const currCandidate = this.connectionCandidate;
    const newCandidate = this.getConnectionCandidate(draggingBlock, delta);
    if (!newCandidate) {
      this.connectionPreviewer?.hidePreview();
      this.connectionCandidate = null;
      return;
    }
    const candidate =
      currCandidate &&
      this.currCandidateIsBetter(currCandidate, delta, newCandidate)
        ? currCandidate
        : newCandidate;
    this.connectionCandidate = candidate;

    const {local, neighbour} = candidate;
    const localIsOutputOrPrevious =
      local.type === ConnectionType.OUTPUT_VALUE ||
      local.type === ConnectionType.PREVIOUS_STATEMENT;
    const neighbourIsConnectedToRealBlock =
      neighbour.isConnected() && !neighbour.targetBlock()?.isInsertionMarker();
    if (
      localIsOutputOrPrevious &&
      neighbourIsConnectedToRealBlock &&
      !this.orphanCanConnectAtEnd(
        draggingBlock,
        neighbour.targetBlock()!,
        local.type,
      )
    ) {
      this.connectionPreviewer?.previewReplacement(
        local,
        neighbour,
        neighbour.targetBlock()!,
      );
      return;
    }
    this.connectionPreviewer?.previewConnection(local, neighbour);
  }

  /**
   * Returns true if the given orphan block can connect at the end of the
   * top block's stack or row, false otherwise.
   */
  private orphanCanConnectAtEnd(
    topBlock: BlockSvg,
    orphanBlock: BlockSvg,
    localType: number,
  ): boolean {
    const orphanConnection =
      localType === ConnectionType.OUTPUT_VALUE
        ? orphanBlock.outputConnection
        : orphanBlock.previousConnection;
    return !!Connection.getConnectionForOrphanedConnection(
      topBlock as Block,
      orphanConnection as Connection,
    );
  }

  /**
   * Returns true if the current candidate is better than the new candidate.
   *
   * We slightly prefer the current candidate even if it is farther away.
   */
  private currCandidateIsBetter(
    currCandiate: ConnectionCandidate,
    delta: Coordinate,
    newCandidate: ConnectionCandidate,
  ): boolean {
    const {local: currLocal, neighbour: currNeighbour} = currCandiate;
    const localPos = new Coordinate(currLocal.x, currLocal.y);
    const neighbourPos = new Coordinate(currNeighbour.x, currNeighbour.y);
    const currDistance = Coordinate.distance(
      Coordinate.sum(localPos, delta),
      neighbourPos,
    );
    return (
      newCandidate.distance > currDistance - config.currentConnectionPreference
    );
  }

  /**
   * Returns the closest valid candidate connection, if one can be found.
   *
   * Valid neighbour connections are within the configured start radius, with a
   * compatible type (input, output, etc) and connection check.
   */
  private getConnectionCandidate(
    draggingBlock: BlockSvg,
    delta: Coordinate,
  ): ConnectionCandidate | null {
    const localConns = this.getLocalConnections(draggingBlock);
    let radius = this.getSearchRadius();
    let candidate = null;

    for (const conn of localConns) {
      const {connection: neighbour, radius: rad} = conn.closest(radius, delta);
      if (neighbour) {
        candidate = {
          local: conn,
          neighbour: neighbour,
          distance: rad,
        };
        radius = rad;
      }
    }

    return candidate;
  }

  /**
   * Get the radius to use when searching for a nearby valid connection.
   */
  protected getSearchRadius() {
    return this.connectionCandidate
      ? config.connectingSnapRadius
      : config.snapRadius;
  }

  /**
   * Returns all of the connections we might connect to blocks on the workspace.
   *
   * Includes any connections on the dragging block, and any last next
   * connection on the stack (if one exists).
   */
  private getLocalConnections(draggingBlock: BlockSvg): RenderedConnection[] {
    const available = draggingBlock.getConnections_(false);
    const lastOnStack = draggingBlock.lastConnectionInStack(true);
    if (lastOnStack && lastOnStack !== draggingBlock.nextConnection) {
      available.push(lastOnStack);
    }
    return available;
  }

  /**
   * Cleans up any state at the end of the drag. Applies any pending
   * connections.
   */
  endDrag(e?: PointerEvent): void {
    if (this.block.isShadow()) {
      this.block.getParent()?.endDrag(e);
      return;
    }
    this.originalEventGroup = eventUtils.getGroup();

    this.fireDragEndEvent();
    this.fireMoveEvent();

    dom.stopTextWidthCache();

    blockAnimation.disconnectUiStop();
    this.connectionPreviewer?.hidePreview();

    if (!this.block.isDeadOrDying() && this.dragging) {
      // These are expensive and don't need to be done if we're deleting, or
      // if we've already stopped dragging because we moved back to the start.
      this.workspace
        .getLayerManager()
        ?.moveOffDragLayer(this.block, layers.BLOCK);

      this.getVisibleBubbles(this.block).forEach((bubble) =>
        this.workspace
          .getLayerManager()
          ?.moveOffDragLayer(bubble, layers.BUBBLE, false),
      );

      this.block.setDragging(false);
    }

    if (this.connectionCandidate) {
      // Applying connections also rerenders the relevant blocks.
      this.applyConnections(this.connectionCandidate);
      this.disposeStep();
    } else {
      this.block.queueRender().then(() => this.disposeStep());
    }
  }

  /** Disposes of any state at the end of the drag. */
  private disposeStep() {
    const newGroup = eventUtils.getGroup();
    eventUtils.setGroup(this.originalEventGroup);
    this.block.snapToGrid();

    // Must dispose after connections are applied to not break the dynamic
    // connections plugin. See #7859
    this.connectionPreviewer?.dispose();
    this.workspace.setResizesEnabled(true);
    eventUtils.setGroup(newGroup);
  }

  /** Connects the given candidate connections. */
  private applyConnections(candidate: ConnectionCandidate) {
    const {local, neighbour} = candidate;
    local.connect(neighbour);

    const inferiorConnection = local.isSuperior() ? neighbour : local;
    const rootBlock = this.block.getRootBlock();

    finishQueuedRenders().then(() => {
      blockAnimation.connectionUiEffect(inferiorConnection.getSourceBlock());
      // bringToFront is incredibly expensive. Delay until the next frame.
      setTimeout(() => {
        rootBlock.bringToFront();
      }, 0);
    });
  }

  /**
   * Moves the block back to where it was at the beginning of the drag,
   * including reconnecting connections.
   */
  revertDrag(): void {
    if (this.block.isShadow()) {
      this.block.getParent()?.revertDrag();
      return;
    }

    this.connectionPreviewer?.hidePreview();
    this.connectionCandidate = null;

    this.startChildConn?.connect(this.block.nextConnection);
    if (this.startParentConn) {
      switch (this.startParentConn.type) {
        case ConnectionType.INPUT_VALUE:
          this.startParentConn.connect(this.block.outputConnection);
          break;
        case ConnectionType.NEXT_STATEMENT:
          this.startParentConn.connect(this.block.previousConnection);
      }
    } else {
      this.block.moveTo(this.startLoc!, ['drag']);
      this.workspace
        .getLayerManager()
        ?.moveOffDragLayer(this.block, layers.BLOCK);
      this.getVisibleBubbles(this.block).forEach((bubble) =>
        this.workspace
          .getLayerManager()
          ?.moveOffDragLayer(bubble, layers.BUBBLE, false),
      );

      // Blocks dragged directly from a flyout may need to be bumped into
      // bounds.
      bumpObjects.bumpIntoBounds(
        this.workspace,
        this.workspace.getMetricsManager().getScrollMetrics(true),
        this.block,
      );
    }

    this.startChildConn = null;
    this.startParentConn = null;

    this.block.setDragging(false);
    this.dragging = false;
  }
}
