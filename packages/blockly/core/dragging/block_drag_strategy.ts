/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Block} from '../block.js';
import * as blockAnimation from '../block_animations.js';
import {computeMoveLabel} from '../block_aria_composer.js';
import type {BlockSvg} from '../block_svg.js';
import * as bumpObjects from '../bump_objects.js';
import {config} from '../config.js';
import {Connection} from '../connection.js';
import {ConnectionType} from '../connection_type.js';
import type {BlockMove} from '../events/events_block_move.js';
import {EventType} from '../events/type.js';
import * as eventUtils from '../events/utils.js';
import {showUnconstrainedMoveHint} from '../hints.js';
import type {IBubble} from '../interfaces/i_bubble.js';
import type {IConnectionPreviewer} from '../interfaces/i_connection_previewer.js';
import type {IDragStrategy} from '../interfaces/i_draggable.js';
import {DragDisposition} from '../interfaces/i_draggable.js';
import {IHasBubble, hasBubble} from '../interfaces/i_has_bubble.js';
import {Direction} from '../keyboard_nav/keyboard_mover.js';
import * as layers from '../layers.js';
import {Msg} from '../msg.js';
import * as registry from '../registry.js';
import {finishQueuedRenders} from '../render_management.js';
import type {RenderedConnection} from '../rendered_connection.js';
import * as blocks from '../serialization/blocks.js';
import {Coordinate} from '../utils.js';
import * as aria from '../utils/aria.js';
import * as dom from '../utils/dom.js';
import * as svgMath from '../utils/svg_math.js';
import type {WorkspaceSvg} from '../workspace_svg.js';

/** Represents a valid pair of connections between the dragging block and a block on the workspace. */
interface ConnectionPair {
  /** A connection on the dragging stack that is compatible with neighbour. */
  local: RenderedConnection;
  /** A nearby connection that is compatible with local. */
  neighbour: RenderedConnection;
}

/** Represents a nearby valid connection. */
interface ConnectionCandidate extends ConnectionPair {
  /** The distance between the local connection and the neighbour connection. */
  distance: number;
}

/**
 * Represents a block movement paradigm; constrained moves only to valid
 * connections, while unconstrained allows free movement to anywhere on the
 * workspace.
 */
enum MoveMode {
  CONSTRAINED = 1,
  UNCONSTRAINED = 2,
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

  /** List of all connections available on the workspace. */
  private allConnectionPairs: ConnectionPair[] = [];

  /** The current movement mode. */
  private moveMode = MoveMode.UNCONSTRAINED;

  /** Used to persist an event group when snapping is done async. */
  private originalEventGroup = '';

  protected readonly BLOCK_CONNECTION_OFFSET = 10;

  constructor(private block: BlockSvg) {
    this.workspace = block.workspace;
  }

  /** Returns true if the block is currently movable. False otherwise. */
  isMovable(): boolean {
    return (
      this.block.isOwnMovable() &&
      !this.block.isDeadOrDying() &&
      !this.workspace.isReadOnly() &&
      (!this.block.isInFlyout ||
        (this.block.isEnabled() &&
          !this.block.workspace.targetWorkspace?.isReadOnly()))
    );
  }

  /**
   * Positions a cloned block on its new workspace.
   *
   * @param oldBlock The flyout block that was cloned.
   * @param newBlock The new block to position.
   */
  private positionNewBlock(oldBlock: BlockSvg, newBlock: BlockSvg) {
    const screenCoordinate = svgMath.wsToScreenCoordinates(
      oldBlock.workspace,
      oldBlock.getRelativeToSurfaceXY(),
    );
    const workspaceCoordinates = svgMath.screenToWsCoordinates(
      newBlock.workspace,
      screenCoordinate,
    );
    newBlock.moveTo(workspaceCoordinates);
  }

  /**
   * Returns the block to use for the current drag operation. This may create
   * and return a newly instantiated block when e.g. dragging from a flyout.
   */
  protected getTargetBlock() {
    if (this.block.isShadow()) {
      const parent = this.block.getParent();
      if (parent) {
        return parent;
      }
    } else if (this.block.isInFlyout && this.block.workspace.targetWorkspace) {
      const rootBlock = this.block.getRootBlock();

      const json = blocks.save(rootBlock);
      if (json) {
        const newBlock = blocks.appendInternal(
          json,
          this.block.workspace.targetWorkspace,
          {
            recordUndo: true,
          },
        ) as BlockSvg;
        eventUtils.setRecordUndo(false);
        this.positionNewBlock(this.block, newBlock);
        eventUtils.setRecordUndo(true);

        return newBlock;
      }
    }

    return this.block;
  }

  /**
   * Announces a move on the ARIA live region for assistive technologies.
   *
   * @param isMoveStart Whether this announcement is for the start of a move. If false,
   * skip announcing the block label since it should have already been announced at the
   * start of the move.
   */
  private announceMove(isMoveStart: boolean = false) {
    let announcementTemplate = '';
    let announcement = '';
    if (this.connectionCandidate) {
      announcement = computeMoveLabel(
        this.connectionCandidate.local,
        this.connectionCandidate.neighbour,
        this.hasMultipleCompatibleConnections.bind(this),
        isMoveStart,
      );
    } else {
      const blockLabel = isMoveStart
        ? this.block.getStackBlocksCountLabel()
        : '';
      announcementTemplate = Msg['ANNOUNCE_MOVE_WORKSPACE'];
      announcement = announcementTemplate.replace('%1', blockLabel);
    }
    // Collapse whitespace from unused template substitutions.
    aria.announceDynamicAriaState(announcement.replace(/\s+/g, ' '));
  }

  /**
   * Checks if there are multiple compatible connections for the specified side of the pair.
   *
   * @param forLocal Whether we are considering the local or neighbour side of the pair
   * @returns True if there are multiple compatible connections, false otherwise
   */
  private hasMultipleCompatibleConnections(forLocal: boolean = true): boolean {
    const connectionCandidate = this.connectionCandidate;
    if (!connectionCandidate) {
      return false;
    }
    const currentSide = forLocal ? 'local' : 'neighbour';
    const oppositeSide = forLocal ? 'neighbour' : 'local';

    const filteredPairs = this.allConnectionPairs.filter(
      (pair) =>
        pair[oppositeSide] === connectionCandidate[oppositeSide] &&
        pair[currentSide] !==
          connectionCandidate[currentSide].getSourceBlock().nextConnection &&
        pair[currentSide].getSourceBlock().id ===
          connectionCandidate[currentSide].getSourceBlock().id,
    );
    return filteredPairs.length > 1;
  }
  /**
   * Handles any setup for starting the drag, including disconnecting the block
   * from any parent blocks.
   */
  startDrag(e?: PointerEvent | KeyboardEvent) {
    const alternateTarget = this.getTargetBlock();
    if (alternateTarget !== this.block) {
      return alternateTarget.startDrag(e);
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

    // For keyboard-driven moves, cache a list of valid connection points for
    // use in constrained moved mode.
    if (e instanceof KeyboardEvent) {
      this.cacheAllConnectionPairs();

      // Scooch the block to be offset from the connection preview indicator.
      this.block.moveDuringDrag(this.startLoc);
      const neighbour = this.updateConnectionPreview(
        this.block,
        new Coordinate(0, 0),
      );
      if (neighbour) {
        let offset: Coordinate;
        if (neighbour.type === ConnectionType.PREVIOUS_STATEMENT) {
          const origin = this.block.getRelativeToSurfaceXY();
          offset = new Coordinate(
            origin.x + this.BLOCK_CONNECTION_OFFSET,
            origin.y - this.BLOCK_CONNECTION_OFFSET,
          );
        } else {
          offset = new Coordinate(
            neighbour.x + this.BLOCK_CONNECTION_OFFSET,
            neighbour.y + this.BLOCK_CONNECTION_OFFSET,
          );
        }
        this.block.moveDuringDrag(offset);
      }
    }

    this.announceMove(true);
    return this.block;
  }

  /**
   * Handles any setup for starting the drag, including disconnecting the block
   * from any parent blocks.
   */
  private cacheAllConnectionPairs() {
    const connectionChecker = this.block.workspace.connectionChecker;
    const workspaceConns = [];
    this.allConnectionPairs = [];
    const localConns = this.getLocalConnections(this.block);
    for (const topBlock of this.block.workspace.getTopBlocks(true)) {
      workspaceConns.push(...this.getAllConnections(topBlock));
    }
    for (const neighbour of workspaceConns) {
      for (const local of localConns) {
        if (
          connectionChecker.canConnect(local, neighbour, true, Infinity) &&
          !neighbour.targetBlock()?.isInsertionMarker()
        ) {
          this.allConnectionPairs.push({
            local,
            neighbour,
          });
        }
      }
    }
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
   * @param e The instigating pointer or keyboard event, if any.
   * @returns True if just the initial block should be dragged out, false
   *     if all following blocks should also be dragged.
   */
  protected shouldHealStack(e: PointerEvent | KeyboardEvent | undefined) {
    if (e instanceof PointerEvent) {
      // For pointer events, we drag the whole stack unless a modifier key
      // was also pressed.
      return e.ctrlKey || e.metaKey;
    } else if (e instanceof KeyboardEvent) {
      // For keyboard events, we drag the single focused block, unless the
      // shift key is pressed or the block has no previous connection.
      return !(e.shiftKey || !this.block.previousConnection);
    } else {
      return false;
    }
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
    this.storeInitialConnections(healStack);
    this.block.unplug(healStack);
    blockAnimation.disconnectUiEffect(this.block);
  }

  /**
   * Stores the dragging block's current parent or child connection before
   * unplugging. This allows us to revert the drag cleanly. In keyboard move mode,
   * the initial connection pair is also used as the first connection candidate.
   */
  private storeInitialConnections(healStack: boolean) {
    // Prioritze the block's parent connection (output or previous) if one exists.
    let localParentConn: RenderedConnection | null = null;
    let parentTargetConn: RenderedConnection | null = null;

    if (this.block.outputConnection?.isConnected()) {
      localParentConn = this.block.outputConnection;
      parentTargetConn = this.block.outputConnection.targetConnection;
    } else if (this.block.previousConnection?.isConnected()) {
      localParentConn = this.block.previousConnection;
      parentTargetConn = this.block.previousConnection.targetConnection;
    }

    this.startParentConn = parentTargetConn;
    if (localParentConn && parentTargetConn) {
      this.connectionCandidate = {
        local: localParentConn,
        neighbour: parentTargetConn,
        distance: 0,
      };
    } else {
      // If there is no parent connection and we are moving a single block,
      // use the next connection.
      if (healStack) {
        const localNextConn = this.block.nextConnection;
        const nextTargetConn = localNextConn?.targetConnection;

        if (localNextConn && nextTargetConn) {
          this.connectionCandidate = {
            local: localNextConn,
            neighbour: nextTargetConn,
            distance: 0,
          };
        }

        this.startChildConn = nextTargetConn ?? null;
      }
    }
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
  drag(newLoc: Coordinate, e?: PointerEvent | KeyboardEvent): void {
    this.moveMode =
      e instanceof KeyboardEvent && !(e.ctrlKey || e.metaKey)
        ? MoveMode.CONSTRAINED
        : MoveMode.UNCONSTRAINED;

    if (this.moveMode === MoveMode.UNCONSTRAINED) {
      this.block.moveDuringDrag(newLoc);
    }
    this.updateConnectionPreview(
      this.block,
      Coordinate.difference(newLoc, this.startLoc!),
    );

    // Handle the case where the drag has reached a possible connection.
    if (this.connectionCandidate) {
      if (this.moveMode === MoveMode.CONSTRAINED) {
        const {local, neighbour} = this.connectionCandidate;

        const dx = neighbour.x - local.x;
        const dy = neighbour.y - local.y;

        // Base aligned position
        let x = this.startLoc!.x + dx;
        let y = this.startLoc!.y + dy;

        // Decide offset direction
        const becomingChild =
          local.type === ConnectionType.PREVIOUS_STATEMENT ||
          local.type === ConnectionType.OUTPUT_VALUE;

        const offset = this.BLOCK_CONNECTION_OFFSET;

        // An offset is used to distinguish the block from insertion marker,
        // while keeping the connection point visible. The offset direction
        // changes based on the parent/child relationship of the blocks
        // being connected.
        if (becomingChild) {
          x += offset;
          y += offset;
        } else {
          x -= offset;
          y -= offset;
        }

        this.block.moveDuringDrag(new Coordinate(x, y));
      }
    } else {
      // No connection was available or adequately close to the dragged block;
      // suggest using unconstrained mode to arbitrarily position the block if
      // we're in keyboard-driven constrained mode.
      if (this.moveMode === MoveMode.CONSTRAINED) {
        showUnconstrainedMoveHint(this.workspace, true);
        this.workspace.getAudioManager().playErrorBeep();
      }
    }
    this.announceMove();
  }

  /**
   * Renders the connection preview indicator.
   *
   * @param draggingBlock The block being dragged.
   * @param delta How far the pointer has moved from the position
   *     at the start of the drag, in workspace units.
   * @returns The neighbouring connection to which the connection preview will
   *     be attached.
   */
  private updateConnectionPreview(
    draggingBlock: BlockSvg,
    delta: Coordinate,
  ): RenderedConnection | undefined {
    const currCandidate = this.connectionCandidate;
    const newCandidate = this.getConnectionCandidate(delta);

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
    } else {
      this.connectionPreviewer?.previewConnection(local, neighbour);
    }
    return neighbour;
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
    // New connection is always better during a constrained move.
    if (this.moveMode === MoveMode.CONSTRAINED) return false;

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
    delta: Coordinate,
  ): ConnectionCandidate | null {
    if (this.moveMode === MoveMode.CONSTRAINED) {
      const direction = this.getDirectionToNewLocation(
        Coordinate.sum(this.startLoc!, delta),
      );
      return this.findTraversalCandidate(direction);
    }

    // If we do not have a candidate yet, we fallback to the closest one nearby.
    let radius = this.getSearchRadius();
    const localConns = this.getLocalConnections(this.block);
    let candidate: ConnectionCandidate | null = null;

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
    if (this.moveMode === MoveMode.CONSTRAINED) return Infinity;

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

    // Reversing the order of input connections provides a more natural traversal
    // experience. With each move right/down, the dragging block should move in
    // one of those directions (except when wrapping to the other end of the list).
    const nonInputConnections = [
      draggingBlock.outputConnection,
      draggingBlock.previousConnection,
      draggingBlock.nextConnection,
    ].filter((c) => !!c); // Removes falsy (null) values.
    const inputConnections: RenderedConnection[] = [];

    for (const conn of available) {
      if (!nonInputConnections.includes(conn)) {
        inputConnections.push(conn);
      }
    }
    inputConnections.reverse();

    return [...nonInputConnections, ...inputConnections];
  }

  /**
   * Cleans up any state at the end of the drag. Applies any pending
   * connections.
   */
  endDrag(
    _e: PointerEvent | KeyboardEvent | undefined,
    disposition: DragDisposition,
  ): void {
    if (disposition === DragDisposition.DELETE) {
      blockAnimation.disposeUiEffect(this.block);
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

    this.allConnectionPairs = [];
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
    this.connectionPreviewer?.hidePreview();
    this.connectionCandidate = null;

    if (this.block.nextConnection) {
      this.startChildConn?.connect(this.block.nextConnection);
    }
    if (this.startParentConn) {
      switch (this.startParentConn.type) {
        case ConnectionType.INPUT_VALUE:
          if (this.block.outputConnection) {
            this.startParentConn.connect(this.block.outputConnection);
          }
          break;
        case ConnectionType.NEXT_STATEMENT:
          if (this.block.previousConnection) {
            this.startParentConn.connect(this.block.previousConnection);
          }
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
    aria.announceDynamicAriaState(Msg['ANNOUNCE_MOVE_CANCELED']);
  }

  /**
   * Get the nearest valid candidate connection in traversal order.
   *
   * @param direction The cardinal direction in which the block is being moved.
   * @returns A candidate connection and radius, or null if none was found.
   */
  findTraversalCandidate(direction: Direction): ConnectionCandidate | null {
    const pairs = this.allConnectionPairs;
    if (direction === Direction.NONE || !pairs.length) {
      return this.connectionCandidate;
    }
    const forwardTraversal =
      direction === Direction.RIGHT || direction === Direction.DOWN;
    const currentPairIndex = pairs.findIndex(
      (pair) =>
        this.connectionCandidate?.local === pair.local &&
        this.connectionCandidate?.neighbour === pair.neighbour,
    );

    if (forwardTraversal) {
      if (currentPairIndex === -1) {
        return this.pairToCandidate(pairs[0]);
      } else if (currentPairIndex === pairs.length - 1) {
        return null;
      } else {
        return this.pairToCandidate(pairs[currentPairIndex + 1]);
      }
    } else {
      if (currentPairIndex === -1) {
        return this.pairToCandidate(pairs[pairs.length - 1]);
      } else if (currentPairIndex === 0) {
        return null;
      } else {
        return this.pairToCandidate(pairs[currentPairIndex - 1]);
      }
    }
  }

  private pairToCandidate(pair: ConnectionPair): ConnectionCandidate {
    return {...pair, distance: 0};
  }
  /**
   * Returns the cardinal direction that the block being dragged would have to
   * move in to reach the given location.
   * The given coordinate should differ from the current location on only one
   * axis.
   *
   * @param newLocation The intended destination for the block.
   * @returns The direction the block would need to travel to reach the new
   *     location.
   */
  private getDirectionToNewLocation(newLocation: Coordinate): Direction {
    const actualPosition = this.block.getRelativeToSurfaceXY();
    const delta = Coordinate.difference(newLocation, actualPosition);
    const {x, y} = delta;

    if (x < 0) return Direction.LEFT;
    if (x > 0) return Direction.RIGHT;
    if (y < 0) return Direction.UP;
    if (y > 0) return Direction.DOWN;
    return Direction.NONE;
  }

  /**
   * Returns all navigable connections on the given block and its children.
   * Omits connections on shadow blocks, collapsed blocks, or those that are
   * associated with a hidden input.
   *
   * @param block The block to use as a starting point for retrieving
   *     connections.
   * @returns All connections on the block and its children.
   */
  private getAllConnections(block: BlockSvg): RenderedConnection[] {
    if (block.isShadow()) return [];

    const connections = [];

    if (block.outputConnection) connections.push(block.outputConnection);
    if (block.previousConnection) connections.push(block.previousConnection);

    if (!block.isCollapsed()) {
      for (const input of block.inputList) {
        if (input.connection && input.isVisible()) {
          connections.push(input.connection);
          const target = input.connection.targetBlock() as BlockSvg;
          if (target) {
            connections.push(...this.getAllConnections(target));
          }
        }
      }
    }
    if (block.nextConnection) {
      connections.push(block.nextConnection);

      const target = block.nextConnection.targetBlock() as BlockSvg;
      if (target) {
        connections.push(...this.getAllConnections(target));
      }
    }

    return connections as RenderedConnection[];
  }
}
