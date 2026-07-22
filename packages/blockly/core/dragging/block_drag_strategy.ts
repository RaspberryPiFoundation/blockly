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
import {FocusManager} from '../focus_manager.js';
import {
  showConstrainedMovementHint,
  showUnconstrainedMoveHint,
} from '../hints.js';
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
import {Rect} from '../utils/rect.js';
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

  /**
   * Map from block IDs to reason(s) why it was disabled, used to restore
   * disabled state post-drag.
   */
  private lastBlockDisabledReasons: Map<string, Set<string>> = new Map();

  protected readonly BLOCK_CONNECTION_OFFSET = 10;

  /**
   * How far in from the edges of the workspace to position newly placed blocks.
   */
  protected readonly WORKSPACE_MARGIN = 10;

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
    newBlock.moveDuringDrag(workspaceCoordinates);

    if (this.moveMode !== MoveMode.CONSTRAINED) return;
    const workspace = newBlock.workspace;
    const initialY = this.WORKSPACE_MARGIN;
    const initialX = this.WORKSPACE_MARGIN;
    // How far apart the new block should be placed horizontally from an
    // existing one.
    const xSpacing = 80;
    const blockPadding =
      Math.max(config.connectingSnapRadius, config.snapRadius) + 2;

    const filteredTopBlocks = workspace
      .getTopBlocks(true)
      .filter((block) => block.id !== newBlock.id);
    const allBlockBounds = filteredTopBlocks.map((block) => {
      const bounds = block.getBoundingRectangle();
      // Expand the bounds to avoid the new block being placed within snapping
      // distance.
      return new Rect(
        bounds.top - blockPadding,
        bounds.bottom + blockPadding,
        bounds.left - blockPadding,
        bounds.right + blockPadding,
      );
    });

    const toolboxWidth = workspace.getToolbox()?.getWidth();
    const workspaceWidth =
      workspace.getParentSvg().clientWidth - (toolboxWidth ?? 0);
    const workspaceHeight = workspace.getParentSvg().clientHeight;
    const {height: newBlockHeight, width: newBlockWidth} =
      newBlock.getHeightWidth();

    const getNextIntersectingBlock = function (
      newBlockRect: Rect,
    ): Rect | null {
      for (const rect of allBlockBounds) {
        if (newBlockRect.intersects(rect)) {
          return rect;
        }
      }
      return null;
    };

    let cursorY = initialY;
    let cursorX = initialX;
    const minBlockHeight = workspace
      .getRenderer()
      .getConstants().MIN_BLOCK_HEIGHT;
    // Make the initial movement of shifting the block to its best possible
    // position.
    let boundingRect = newBlock.getBoundingRectangle();
    newBlock.moveBy(cursorX - boundingRect.left, cursorY - boundingRect.top, [
      'cleanup',
    ]);

    boundingRect = newBlock.getBoundingRectangle();
    let conflictingRect = getNextIntersectingBlock(boundingRect);
    while (conflictingRect != null) {
      const newCursorX =
        conflictingRect.left + conflictingRect.getWidth() + xSpacing;
      const newCursorY =
        conflictingRect.top + conflictingRect.getHeight() + minBlockHeight;
      if (newCursorX + newBlockWidth <= workspaceWidth) {
        cursorX = newCursorX;
      } else if (newCursorY + newBlockHeight <= workspaceHeight) {
        cursorY = newCursorY;
        cursorX = initialX;
      } else {
        // Off screen, but new blocks will be selected which will scroll them
        // into view.
        cursorY = newCursorY;
        cursorX = initialX;
      }
      newBlock.moveBy(cursorX - boundingRect.left, cursorY - boundingRect.top, [
        'cleanup',
      ]);
      boundingRect = newBlock.getBoundingRectangle();
      conflictingRect = getNextIntersectingBlock(boundingRect);
    }
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
        newBlock.render();
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
    this.updateMoveMode(e);
    const alternateTarget = this.getTargetBlock();
    if (alternateTarget !== this.block) {
      return alternateTarget.startDrag(e);
    }

    this.block.workspace.recordDragTargets();

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
    this.storeInitialConnections(healStack);

    if (this.shouldDisconnect(healStack)) {
      this.disconnectBlock(healStack);
    }

    this.block.setDragging(true);

    // Enable all blocks including children.
    this.enableAllDraggedBlocks(this.block);

    // Cached connection pairs are primarily used for keyboard-driven moves,
    // but they are also needed in order to determine whether announcement text
    // must disambiguate between multiple compatible connections. This is a
    // relatively expensive operation, so we only do it once at the start of
    // the drag.
    this.cacheAllConnectionPairs();

    // For keyboard-driven moves, cache a list of valid connection points for
    // use in constrained moved mode.
    if (e instanceof KeyboardEvent) {
      // Scooch the block to be offset from the connection preview indicator.
      const initialCandidate = this.getInitialCandidate() ?? undefined;
      const neighbour = this.updateConnectionPreview(
        this.block,
        new Coordinate(0, 0),
        initialCandidate,
      );
      if (neighbour) {
        this.block.moveDuringDrag(this.determineConnectionOffset());
      }

      if (this.allConnectionPairs.length) {
        showConstrainedMovementHint(this.workspace);
      } else {
        showUnconstrainedMoveHint(this.workspace);
      }
    } else {
      this.block.moveDuringDrag(this.startLoc);
    }

    this.workspace.getLayerManager()?.moveToDragLayer(this.block);
    this.getVisibleBubbles(this.block).forEach((bubble) => {
      this.workspace.getLayerManager()?.moveToDragLayer(bubble, false);
    });

    this.announceMove(true);
    return this.block;
  }

  /**
   * Caches a list of all valid connection pairs between the dragging block
   * and any other blocks on the workspace. This is used to determine the
   * closest valid connection during keyboard-driven moves and to determine
   * the need to disambiguate between multiple compatible connections when
   * announcing moves to assistive technologies.
   */
  cacheAllConnectionPairs() {
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
    this.block.unplug(healStack);
    blockAnimation.disconnectUiEffect(this.block);
  }

  /**
   * Stores the dragging block's current parent or child connection before
   * unplugging. This allows us to revert the drag cleanly. In keyboard move mode,
   * the initial connection pair is also used as the first connection candidate.
   */
  private storeInitialConnections(healStack: boolean) {
    this.startParentConn = null;
    this.startChildConn = null;
    // Prioritize the block's parent connection (output or previous) if one exists.
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
    this.updateMoveMode(e);
    if (this.moveMode === MoveMode.UNCONSTRAINED) {
      this.block.moveDuringDrag(newLoc);
    }

    const wasConnected = !!this.connectionCandidate;

    this.updateConnectionPreview(
      this.block,
      Coordinate.difference(newLoc, this.startLoc!),
    );

    // Handle the case where the drag has reached a possible connection.
    if (this.connectionCandidate) {
      if (this.moveMode === MoveMode.CONSTRAINED) {
        this.block.moveDuringDrag(this.determineConnectionOffset());
      }
    } else {
      // No connection was available or adequately close to the dragged block;
      // suggest using unconstrained mode to arbitrarily position the block if
      // we're in keyboard-driven constrained mode.
      if (this.moveMode === MoveMode.CONSTRAINED) {
        if (!this.allConnectionPairs.length) {
          showUnconstrainedMoveHint(this.workspace, true);
        }

        if (!wasConnected) {
          this.workspace.getAudioManager().playErrorBeep();
          return;
        }
      }
    }
    this.announceMove();
  }

  /**
   * Determines the offset to apply to the dragged block's position
   * based on the current connection candidate.
   *
   * @returns coordinates representing the offset
   */
  private determineConnectionOffset(): Coordinate {
    const {local, neighbour} = this.connectionCandidate!;

    const connOffset = local.getOffsetInBlock();

    let x = neighbour.x - connOffset.x;
    let y = neighbour.y - connOffset.y;

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

    return new Coordinate(x, y);
  }

  /**
   * Renders the connection preview indicator.
   *
   * @param draggingBlock The block being dragged.
   * @param delta How far the pointer has moved from the position
   *     at the start of the drag, in workspace units.
   * @param initialCandidate If provided, a connection candidate that the
   *     connection preview indicator will be attached to.
   * @returns The neighbouring connection to which the connection preview will
   *     be attached.
   */
  private updateConnectionPreview(
    draggingBlock: BlockSvg,
    delta: Coordinate,
    initialCandidate?: ConnectionCandidate,
  ): RenderedConnection | undefined {
    const currCandidate = this.connectionCandidate;
    const newCandidate = initialCandidate ?? this.getConnectionCandidate(delta);

    this.connectionCandidate = null;
    if (!newCandidate) {
      // Position above or below the first/last block.
      if (this.moveMode === MoveMode.CONSTRAINED) {
        const connectedBlock =
          currCandidate?.neighbour.getSourceBlock() ?? null;
        let root = connectedBlock?.getRootBlock() ?? connectedBlock;
        if (root === draggingBlock) root = connectedBlock;
        if (!root) {
          this.connectionPreviewer?.hidePreview();
          return;
        }

        const blockRects = draggingBlock.workspace
          .getTopBlocks()
          .filter((block) => block !== draggingBlock.getRootBlock())
          .map((block) => block.getBoundingRectangle());
        if (!blockRects.length) {
          this.connectionPreviewer?.hidePreview();
          return;
        }

        // If the block was previously connected, position the block near its previous connection.
        const destinationX =
          currCandidate?.neighbour.x ??
          draggingBlock.getRelativeToSurfaceXY().x;
        let destinationY: number;
        const offset = this.BLOCK_CONNECTION_OFFSET * 2;

        const direction = this.getDirectionToNewLocation(
          Coordinate.sum(this.startLoc!, delta),
        );
        switch (direction) {
          case Direction.LEFT:
          case Direction.UP:
            destinationY =
              Math.min(...blockRects.map((rect) => rect.top)) -
              offset -
              draggingBlock.getHeightWidth().height;
            break;
          case Direction.RIGHT:
          case Direction.DOWN:
          default:
            destinationY =
              Math.max(...blockRects.map((rect) => rect.bottom)) + offset;
            break;
        }
        draggingBlock.moveDuringDrag(
          new Coordinate(destinationX, destinationY),
        );
      }
      this.connectionPreviewer?.hidePreview();
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
      return this.findTraversalCandidate(delta);
    }

    // If we do not have a candidate yet, we fallback to the closest one nearby.
    return this.getClosestCandidate(this.block, delta);
  }

  /**
   * Returns the closest connection candidate for the given block.
   *
   * @param block The block to find a connection for.
   * @param delta The distance the block has traveled since dragging began.
   * @returns The closest available connection candidate, if any.
   */
  private getClosestCandidate(block: BlockSvg, delta: Coordinate) {
    let radius = this.getSearchRadius();
    const localConns = this.getLocalConnections(block);
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

      // Re-disable the block for its original reasons.
      this.redisableAllDraggedBlocks(this.block);
    }

    if (this.connectionCandidate) {
      // Applying connections also rerenders the relevant blocks.
      this.applyConnections(this.connectionCandidate);
      this.disposeStep();
    } else {
      // play a sound if the block didn't connect to anything and isn't being deleted
      if (disposition !== DragDisposition.DELETE) {
        this.workspace.getAudioManager().play('drop');
      }
      this.block.queueRender().then(() => this.disposeStep());
    }

    this.allConnectionPairs = [];
    this.startParentConn = null;
    this.startChildConn = null;
    this.connectionCandidate = null;
    this.dragging = false;
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
      this.block.moveDuringDrag(this.startLoc!);
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
    // Re-disable the block for its original reasons.
    this.redisableAllDraggedBlocks(this.block);
    this.dragging = false;
    aria.announceDynamicAriaState(Msg['ANNOUNCE_MOVE_CANCELED']);
  }

  /**
   * Get the nearest valid candidate connection in traversal order.
   *
   * @param delta The distance the block has moved since this drag began.
   * @returns A candidate connection and radius, or null if none was found.
   */
  findTraversalCandidate(delta: Coordinate): ConnectionCandidate | null {
    const direction = this.getDirectionToNewLocation(
      Coordinate.sum(this.startLoc!, delta),
    );
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

    const navigator = this.block.workspace.getNavigator();
    if (forwardTraversal) {
      if (currentPairIndex === -1) {
        const terminal = this.isInTerminalPosition(this.block, Direction.DOWN);
        if (terminal) {
          if (navigator.getNavigationLoops()) {
            return this.pairToCandidate(pairs[0]);
          } else {
            return null;
          }
        }
        return this.getClosestCandidate(this.block, delta);
      } else if (currentPairIndex === pairs.length - 1) {
        return null;
      } else {
        return this.pairToCandidate(pairs[currentPairIndex + 1]);
      }
    } else {
      if (currentPairIndex === -1) {
        const terminal = this.isInTerminalPosition(this.block, Direction.UP);
        if (terminal) {
          if (navigator.getNavigationLoops()) {
            return this.pairToCandidate(pairs[pairs.length - 1]);
          } else {
            return null;
          }
        }
        return this.getClosestCandidate(this.block, delta);
      } else if (currentPairIndex === 0) {
        return null;
      } else {
        return this.pairToCandidate(pairs[currentPairIndex - 1]);
      }
    }
  }

  /**
   * Returns whether or not the given block is at a terminal position (start or
   * end) of the blocks on the workspace. This helps distinguish between a block
   * that is at the end of the line because all valid connections have been
   * visited and the proposed constrained move destination is now to drop it on
   * the workspace as a top-level block (in which case it will be in a terminal
   * position), and a block that just entered move mode as a top-level block,
   * and should therefore still be able to move to another connection point
   * even if looping is disabled.
   *
   * @param block The block to check.
   * @param direction The current dragging direction.
   * @returns True if the block is at the start or end of its possible positions
   *     on the workspace.
   */
  private isInTerminalPosition(
    block: BlockSvg,
    direction: Direction.UP | Direction.DOWN,
  ) {
    if (block.getParent()) {
      return false;
    }

    const topBlocks = block.workspace.getTopBlocks(true);
    const blockRect = block.getBoundingRectangle();

    // A block is terminal if it is above (moving up) or below (moving down) all other blocks
    // that have valid connections with it. We need to consider the full shape of the blocks,
    // not just their top-left origins.
    const isMovingUp = direction === Direction.UP;
    const edge = isMovingUp ? 'top' : 'bottom';
    const directionalCompare = isMovingUp
      ? (a: number, b: number) => a <= b
      : (a: number, b: number) => a >= b;
    const blocksToConsider = topBlocks.filter(
      (b) =>
        b.id !== block.id &&
        directionalCompare(b.getBoundingRectangle()[edge], blockRect[edge]),
    );

    const blockConnections = block.getConnections_(false);
    for (const topBlock of blocksToConsider) {
      const stackConnections = this.getAllConnections(topBlock);
      for (const a of blockConnections) {
        for (const b of stackConnections) {
          if (
            block.workspace.connectionChecker.canConnect(a, b, true, Infinity)
          ) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Converts a connection pair to a connection candidate with a default
   * distance of 0.
   */
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
    // Pick the dominant axis rather than testing x before y. A keyboard move is
    // single-axis by intent, but the delta is round-tripped through pixels
    // (KeyboardMover scales up by workspace.scale, Dragger scales back down), so
    // at any zoom != 1 the axis that should be zero carries ~1e-14 of
    // floating-point residue. Comparing magnitudes keeps that residue from
    // outranking the real movement and flipping e.g. a DOWN press to RIGHT.
    if (Math.abs(x) > Math.abs(y))
      return x < 0 ? Direction.LEFT : Direction.RIGHT;
    if (Math.abs(y) > 0) return y < 0 ? Direction.UP : Direction.DOWN;
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

  /**
   * Returns a connection candidate to move the dragged block to at the start of
   * a drag. If the passively focused node is a connection and the dragged block
   * can connect to it, the connection will be returned. Otherwise, the first
   * compatible connection on the passively focused node's block, if any, will
   * be returned. Returns null if the workspace does not have passive focus.
   */
  private getInitialCandidate(): ConnectionCandidate | null {
    const passiveElement = this.workspace
      .getSvgGroup()
      .querySelector(`.${FocusManager.PASSIVE_FOCUS_NODE_CSS_CLASS_NAME}`);
    if (
      !passiveElement ||
      !passiveElement.id ||
      passiveElement === this.block.getFocusableElement()
    ) {
      return null;
    }
    const passiveNode = this.workspace.lookUpFocusableNode(passiveElement.id);
    if (!passiveNode) return null;

    const passiveBlock = this.workspace
      .getNavigator()
      .getSourceBlockFromNode(passiveNode);
    if (!passiveBlock) return null;

    const passiveBlockConnections = passiveBlock.getConnections_(false);
    let passiveConnection: RenderedConnection | null = null;

    // If the passively focused node is a connection, return it if it is
    // compatible with the dragged block.
    if (passiveBlockConnections.includes(passiveNode as any)) {
      passiveConnection = passiveNode as RenderedConnection;
      const connectionChecker = this.block.workspace.connectionChecker;
      const local = this.block.getConnections_(false).find((connection) => {
        return connectionChecker.canConnect(
          connection,
          passiveConnection,
          true,
          Infinity,
        );
      });

      if (local) {
        return {local, neighbour: passiveConnection, distance: 0};
      }
    }

    // Fall back to returning the first compatible connection on the passively
    // focused block, if any.
    const pair = this.allConnectionPairs.find(
      (pair) => pair.neighbour.getSourceBlock() === passiveBlock,
    );
    if (pair) {
      return this.pairToCandidate(pair);
    }

    // Fall back further to the parent connection of the passively focused
    // block, if any.
    const outputTarget = passiveBlock.outputConnection?.targetConnection;
    const parentPair = this.allConnectionPairs.find(
      (pair) => pair.neighbour === outputTarget,
    );
    if (parentPair) {
      return this.pairToCandidate(parentPair);
    }

    // Fall back to the nearest parent block that has a compatible connection.
    // This handles the case where a nested value block (e.g. a number input)
    // has passive focus but the dragged block is a statement block that should
    // be inserted after the containing statement block.
    let parentBlock = passiveBlock.getSurroundParent();
    while (parentBlock) {
      const pair = this.allConnectionPairs.find(
        (pair) => pair.neighbour.getSourceBlock() === parentBlock,
      );
      if (pair) return this.pairToCandidate(pair);
      parentBlock = parentBlock.getSurroundParent();
    }

    return null;
  }

  /**
   * Updates the current move mode based on the most recent drag-related event.
   */
  private updateMoveMode(event: KeyboardEvent | PointerEvent | undefined) {
    this.moveMode =
      event instanceof KeyboardEvent && !(event.ctrlKey || event.metaKey)
        ? MoveMode.CONSTRAINED
        : MoveMode.UNCONSTRAINED;
  }

  /**
   * Enables the given block and its children.
   * Stores the reasons each block was disabled so they can be restored.
   *
   * @param block The block to enable.
   */
  private enableAllDraggedBlocks(block: BlockSvg) {
    const oldUndo = eventUtils.getRecordUndo();
    eventUtils.setRecordUndo(false);
    this.lastBlockDisabledReasons.clear();
    // getDescendants includes the block itself.
    block.getDescendants(false).forEach((descendant) => {
      const reasons = new Set(descendant.getDisabledReasons());
      this.lastBlockDisabledReasons.set(descendant.id, reasons);
      reasons.forEach((reason) => descendant.setDisabledReason(false, reason));
    });
    eventUtils.setRecordUndo(oldUndo);
  }

  /**
   * Re-disables the given block and its children using their original
   * disabled reasons.
   *
   * @param block The block to re-disable, if applicable.
   */
  private redisableAllDraggedBlocks(block: BlockSvg) {
    const oldUndo = eventUtils.getRecordUndo();
    eventUtils.setRecordUndo(false);
    block.getDescendants(false).forEach((descendant) => {
      this.lastBlockDisabledReasons.get(descendant.id)?.forEach((reason) => {
        descendant.setDisabledReason(true, reason);
      });
    });
    eventUtils.setRecordUndo(oldUndo);
  }
}
