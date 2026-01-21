/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Components for creating connections between blocks.
 *
 * @class
 */
// Former goog.module ID: Blockly.RenderedConnection

import type {BlockSvg} from './block_svg.js';
import {config} from './config.js';
import {Connection} from './connection.js';
import type {ConnectionDB} from './connection_db.js';
import {ConnectionType} from './connection_type.js';
import * as ContextMenu from './contextmenu.js';
import {ContextMenuRegistry} from './contextmenu_registry.js';
import * as eventUtils from './events/utils.js';
import {IContextMenu} from './interfaces/i_contextmenu.js';
import type {IFocusableNode} from './interfaces/i_focusable_node.js';
import type {IFocusableTree} from './interfaces/i_focusable_tree.js';
import {hasBubble} from './interfaces/i_has_bubble.js';
import * as internalConstants from './internal_constants.js';
import {Coordinate} from './utils/coordinate.js';
import * as svgMath from './utils/svg_math.js';
import {WorkspaceSvg} from './workspace_svg.js';

/** Maximum randomness in workspace units for bumping a block. */
const BUMP_RANDOMNESS = 10;

/**
 * Class for a connection between blocks that may be rendered on screen.
 */
export class RenderedConnection
  extends Connection
  implements IContextMenu, IFocusableNode
{
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  sourceBlock_!: BlockSvg;
  private readonly db: ConnectionDB;
  private readonly dbOpposite: ConnectionDB;
  private readonly offsetInBlock: Coordinate;
  private trackedState: TrackedState;
  private highlighted: boolean = false;

  /** Connection this connection connects to.  Null if not connected. */
  override targetConnection: RenderedConnection | null = null;

  /**
   * @param source The block establishing this connection.
   * @param type The type of the connection.
   */
  constructor(source: BlockSvg, type: number) {
    super(source, type);

    /**
     * Connection database for connections of this type on the current
     * workspace.
     */
    this.db = source.workspace.connectionDBList[type];

    /**
     * Connection database for connections compatible with this type on the
     * current workspace.
     */
    this.dbOpposite =
      source.workspace.connectionDBList[internalConstants.OPPOSITE_TYPE[type]];

    /** Workspace units, (0, 0) is top left of block. */
    this.offsetInBlock = new Coordinate(0, 0);

    /** Describes the state of this connection's tracked-ness. */
    this.trackedState = RenderedConnection.TrackedState.WILL_TRACK;
  }

  /**
   * Dispose of this connection. Remove it from the database (if it is
   * tracked) and call the super-function to deal with connected blocks.
   *
   * @internal
   */
  override dispose() {
    super.dispose();
    if (this.trackedState === RenderedConnection.TrackedState.TRACKED) {
      this.db.removeConnection(this, this.y);
    }
    this.sourceBlock_.pathObject.removeConnectionHighlight?.(this);
  }

  /**
   * Get the source block for this connection.
   *
   * @returns The source block.
   */
  override getSourceBlock(): BlockSvg {
    return super.getSourceBlock() as BlockSvg;
  }

  /**
   * Returns the block that this connection connects to.
   *
   * @returns The connected block or null if none is connected.
   */
  override targetBlock(): BlockSvg | null {
    return super.targetBlock() as BlockSvg;
  }

  /**
   * Returns the distance between this connection and another connection in
   * workspace units.
   *
   * @param otherConnection The other connection to measure the distance to.
   * @returns The distance between connections, in workspace units.
   */
  distanceFrom(otherConnection: Connection): number {
    const xDiff = this.x - otherConnection.x;
    const yDiff = this.y - otherConnection.y;
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  }

  /**
   * Move the block(s) belonging to the connection to a point where they don't
   * visually interfere with the specified connection.
   *
   * @param superiorConnection The connection to move away from. The provided
   *     connection should be the superior connection and should not be
   *     connected to this connection.
   * @param initiatedByThis Whether or not the block group that was manipulated
   *     recently causing bump checks is associated with the inferior
   *     connection. Defaults to false.
   * @internal
   */
  bumpAwayFrom(
    superiorConnection: RenderedConnection,
    initiatedByThis = false,
  ) {
    if (this.sourceBlock_.workspace.isDragging()) {
      // Don't move blocks around while the user is doing the same.
      return;
    }
    let offsetX =
      config.snapRadius + Math.floor(Math.random() * BUMP_RANDOMNESS);
    let offsetY =
      config.snapRadius + Math.floor(Math.random() * BUMP_RANDOMNESS);
    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    const inferiorConnection = this;
    const superiorRootBlock = superiorConnection.sourceBlock_.getRootBlock();
    const inferiorRootBlock = inferiorConnection.sourceBlock_.getRootBlock();

    if (superiorRootBlock.isInFlyout || inferiorRootBlock.isInFlyout) {
      // Don't move blocks around in a flyout.
      return;
    }
    let moveInferior = true;
    if (!inferiorRootBlock.isMovable()) {
      // Can't bump an immovable block away.
      // Check to see if the other block is movable.
      if (!superiorRootBlock.isMovable()) {
        // Neither block is movable, abort operation.
        return;
      } else {
        // Only the superior block group is movable.
        moveInferior = false;
        // The superior block group moves in the opposite direction.
        offsetX = -offsetX;
        offsetY = -offsetY;
      }
    } else if (superiorRootBlock.isMovable()) {
      // Both block groups are movable. The one on the inferior side will be
      // moved to make space for the superior one. However, it's possible that
      // both groups of blocks have an inferior connection that bumps into a
      // superior connection on the other group, which could result in both
      // groups moving in the same direction and eventually bumping each other
      // again. It would be better if one group of blocks could consistently
      // move in an orthogonal direction from the other, so that they become
      // separated in the end. We can designate one group the "initiator" if
      // it's the one that was most recently manipulated, causing inputs to be
      // checked for bumpable neighbors. As a useful heuristic, in the case
      // where the inferior connection belongs to the initiator group, moving it
      // in the orthogonal direction will separate the blocks better.
      if (initiatedByThis) {
        offsetY = -offsetY;
      }
    }
    const staticConnection = moveInferior
      ? superiorConnection
      : inferiorConnection;
    const dynamicConnection = moveInferior
      ? inferiorConnection
      : superiorConnection;
    const dynamicRootBlock = moveInferior
      ? inferiorRootBlock
      : superiorRootBlock;
    // Raise it to the top for extra visibility.
    if (dynamicRootBlock.RTL) {
      offsetX = -offsetX;
    }
    const dx = staticConnection.x + offsetX - dynamicConnection.x;
    const dy = staticConnection.y + offsetY - dynamicConnection.y;
    dynamicRootBlock.moveBy(dx, dy, ['bump']);
  }

  /**
   * Change the connection's coordinates.
   *
   * @param x New absolute x coordinate, in workspace coordinates.
   * @param y New absolute y coordinate, in workspace coordinates.
   * @returns True if the position of the connection in the connection db
   *     was updated.
   */
  moveTo(x: number, y: number): boolean {
    // TODO(#6922): Readd this optimization.
    // const moved = this.x !== x || this.y !== y;
    const moved = true;
    let updated = false;

    if (this.trackedState === RenderedConnection.TrackedState.WILL_TRACK) {
      this.db.addConnection(this, y);
      this.trackedState = RenderedConnection.TrackedState.TRACKED;
      updated = true;
    } else if (
      this.trackedState === RenderedConnection.TrackedState.TRACKED &&
      moved
    ) {
      this.db.removeConnection(this, this.y);
      this.db.addConnection(this, y);
      updated = true;
    }

    this.x = x;
    this.y = y;

    return updated;
  }

  /**
   * Change the connection's coordinates.
   *
   * @param dx Change to x coordinate, in workspace units.
   * @param dy Change to y coordinate, in workspace units.
   * @returns True if the position of the connection in the connection db
   *     was updated.
   */
  moveBy(dx: number, dy: number): boolean {
    return this.moveTo(this.x + dx, this.y + dy);
  }

  /**
   * Move this connection to the location given by its offset within the block
   * and the location of the block's top left corner.
   *
   * @param blockTL The location of the top left corner of the block, in
   *     workspace coordinates.
   * @returns True if the position of the connection in the connection db
   *     was updated.
   */
  moveToOffset(blockTL: Coordinate): boolean {
    return this.moveTo(
      blockTL.x + this.offsetInBlock.x,
      blockTL.y + this.offsetInBlock.y,
    );
  }

  /**
   * Set the offset of this connection relative to the top left of its block.
   *
   * @param x The new relative x, in workspace units.
   * @param y The new relative y, in workspace units.
   */
  setOffsetInBlock(x: number, y: number) {
    this.offsetInBlock.x = x;
    this.offsetInBlock.y = y;
  }

  /**
   * Get the offset of this connection relative to the top left of its block.
   *
   * @returns The offset of the connection.
   */
  getOffsetInBlock(): Coordinate {
    return this.offsetInBlock;
  }

  /**
   * Moves the blocks on either side of this connection right next to
   * each other, based on their local offsets, not global positions.
   *
   * @internal
   */
  tightenEfficiently() {
    const target = this.targetConnection;
    const block = this.targetBlock();
    if (!target || !block) return;
    const offset = Coordinate.difference(
      this.offsetInBlock,
      target.offsetInBlock,
    );
    block.translate(offset.x, offset.y);
  }

  /**
   * Find the closest compatible connection to this connection.
   * All parameters are in workspace units.
   *
   * @param maxLimit The maximum radius to another connection.
   * @param dxy Offset between this connection's location in the database and
   *     the current location (as a result of dragging).
   * @returns Contains two properties: 'connection' which is either another
   *     connection or null, and 'radius' which is the distance.
   */
  closest(
    maxLimit: number,
    dxy: Coordinate,
  ): {connection: RenderedConnection | null; radius: number} {
    return this.dbOpposite.searchForClosest(this, maxLimit, dxy);
  }

  /** Add highlighting around this connection. */
  highlight() {
    this.highlighted = true;

    // Note that this needs to be done synchronously (vs. queuing a render pass)
    // since only a displayed element can be focused, and this focusable node is
    // implemented to make itself visible immediately prior to receiving DOM
    // focus. It's expected that the connection's position should already be
    // correct by this point (otherwise it will be corrected in a subsequent
    // draw pass).
    const highlightSvg = this.findHighlightSvg();
    if (highlightSvg) {
      highlightSvg.style.display = '';
    }
  }

  /** Remove the highlighting around this connection. */
  unhighlight() {
    this.highlighted = false;

    // Note that this is done synchronously for parity with highlight().
    const highlightSvg = this.findHighlightSvg();
    if (highlightSvg) {
      highlightSvg.style.display = 'none';
    }
  }

  /** Returns true if this connection is highlighted, false otherwise. */
  isHighlighted(): boolean {
    return this.highlighted;
  }

  /**
   * Set whether this connections is tracked in the database or not.
   *
   * @param doTracking If true, start tracking. If false, stop tracking.
   * @internal
   */
  setTracking(doTracking: boolean) {
    if (
      (doTracking &&
        this.trackedState === RenderedConnection.TrackedState.TRACKED) ||
      (!doTracking &&
        this.trackedState === RenderedConnection.TrackedState.UNTRACKED)
    ) {
      return;
    }
    if (this.sourceBlock_.isInFlyout) {
      // Don't bother maintaining a database of connections in a flyout.
      return;
    }
    if (doTracking) {
      this.db.addConnection(this, this.y);
      this.trackedState = RenderedConnection.TrackedState.TRACKED;
      return;
    }
    if (this.trackedState === RenderedConnection.TrackedState.TRACKED) {
      this.db.removeConnection(this, this.y);
    }
    this.trackedState = RenderedConnection.TrackedState.UNTRACKED;
  }

  /**
   * Stop tracking this connection, as well as all down-stream connections on
   * any block attached to this connection. This happens when a block is
   * collapsed.
   *
   * Also closes down-stream icons/bubbles.
   *
   * @internal
   */
  stopTrackingAll() {
    this.setTracking(false);
    if (this.targetConnection) {
      const blocks = this.targetBlock()!.getDescendants(false);
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        // Stop tracking connections of all children.
        const connections = block.getConnections_(true);
        for (let j = 0; j < connections.length; j++) {
          connections[j].setTracking(false);
        }
        // Close all bubbles of all children.
        for (const icon of block.getIcons()) {
          if (hasBubble(icon)) icon.setBubbleVisible(false);
        }
      }
    }
  }

  /**
   * Start tracking this connection, as well as all down-stream connections on
   * any block attached to this connection. This happens when a block is
   * expanded.
   *
   * @returns List of blocks to render.
   */
  startTrackingAll(): BlockSvg[] {
    this.setTracking(true);
    // All blocks that are not tracked must start tracking before any
    // rendering takes place, since rendering requires knowing the dimensions
    // of lower blocks. Also, since rendering a block renders all its parents,
    // we only need to render the leaf nodes.
    let renderList: BlockSvg[] = [];
    if (
      this.type !== ConnectionType.INPUT_VALUE &&
      this.type !== ConnectionType.NEXT_STATEMENT
    ) {
      // Only spider down.
      return renderList;
    }
    const block = this.targetBlock();
    if (block) {
      let connections;
      if (block.isCollapsed()) {
        // This block should only be partially revealed since it is collapsed.
        connections = [];
        if (block.outputConnection) connections.push(block.outputConnection);
        if (block.nextConnection) connections.push(block.nextConnection);
        if (block.previousConnection)
          connections.push(block.previousConnection);
      } else {
        // Show all connections of this block.
        connections = block.getConnections_(true);
      }
      for (let i = 0; i < connections.length; i++) {
        renderList.push(...connections[i].startTrackingAll());
      }
      if (!renderList.length) {
        // Leaf block.
        renderList = [block];
      }
    }
    return renderList;
  }

  /**
   * Behaviour after a connection attempt fails.
   * Bumps this connection away from the other connection. Called when an
   * attempted connection fails.
   *
   * @param superiorConnection Connection that this connection failed to connect
   *     to. The provided connection should be the superior connection.
   * @internal
   */
  override onFailedConnect(superiorConnection: Connection) {
    const block = this.getSourceBlock();
    if (eventUtils.getRecordUndo()) {
      const group = eventUtils.getGroup();
      setTimeout(
        function (this: RenderedConnection) {
          if (!block.isDisposed() && !block.getParent()) {
            eventUtils.setGroup(group);
            this.bumpAwayFrom(superiorConnection as RenderedConnection);
            eventUtils.setGroup(false);
          }
        }.bind(this),
        config.bumpDelay,
      );
    }
  }

  /**
   * Disconnect two blocks that are connected by this connection.
   *
   * @param setParent Whether to set the parent of the disconnected block or
   *     not, defaults to true.
   *     If you do not set the parent, ensure that a subsequent action does,
   *     otherwise the view and model will be out of sync.
   */
  override disconnectInternal(setParent = true) {
    const {parentConnection, childConnection} =
      this.getParentAndChildConnections();
    if (!parentConnection || !childConnection) return;
    const existingGroup = eventUtils.getGroup();
    if (!existingGroup) eventUtils.setGroup(true);

    const parent = parentConnection.getSourceBlock() as BlockSvg;
    const child = childConnection.getSourceBlock() as BlockSvg;
    super.disconnectInternal(setParent);

    parent.queueRender();
    child.updateDisabled();
    child.queueRender();
    // Reset visibility, since the child is now a top block.
    child.getSvgRoot().style.display = 'block';

    eventUtils.setGroup(existingGroup);
  }

  /**
   * Respawn the shadow block if there was one connected to the this connection.
   * Render/rerender blocks as needed.
   */
  protected override respawnShadow_() {
    super.respawnShadow_();
    const blockShadow = this.targetBlock();
    if (!blockShadow) {
      return;
    }
    blockShadow.initSvg();
    blockShadow.queueRender();
  }

  /**
   * Find all nearby compatible connections to this connection.
   * Type checking does not apply, since this function is used for bumping.
   *
   * @param maxLimit The maximum radius to another connection, in workspace
   *     units.
   * @returns List of connections.
   * @internal
   */
  override neighbours(maxLimit: number): RenderedConnection[] {
    return this.dbOpposite.getNeighbours(this, maxLimit);
  }

  /**
   * Connect two connections together.  This is the connection on the superior
   * block.  Rerender blocks as needed.
   *
   * @param childConnection Connection on inferior block.
   */
  protected override connect_(childConnection: Connection) {
    super.connect_(childConnection);

    const renderedChildConnection = childConnection as RenderedConnection;

    const parentBlock = this.getSourceBlock();
    const childBlock = renderedChildConnection.getSourceBlock();

    parentBlock.updateDisabled();
    childBlock.updateDisabled();
    childBlock.queueRender();

    // The input the child block is connected to (if any).
    const parentInput = parentBlock.getInputWithBlock(childBlock);
    if (parentInput) {
      const visible = parentInput.isVisible();
      childBlock.getSvgRoot().style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Function to be called when this connection's compatible types have changed.
   */
  protected override onCheckChanged_() {
    // The new value type may not be compatible with the existing connection.
    if (
      this.isConnected() &&
      (!this.targetConnection ||
        !this.getConnectionChecker().canConnect(
          this,
          this.targetConnection,
          false,
        ))
    ) {
      const child = this.isSuperior() ? this.targetBlock() : this.sourceBlock_;
      child!.unplug();
    }
  }

  /**
   * Change a connection's compatibility.
   * Rerender blocks as needed.
   *
   * @param check Compatible value type or list of value types. Null if all
   *     types are compatible.
   * @returns The connection being modified (to allow chaining).
   */
  override setCheck(check: string | string[] | null): RenderedConnection {
    super.setCheck(check);
    this.sourceBlock_.queueRender();
    return this;
  }

  /**
   * Handles showing the context menu when it is opened on a connection.
   * Note that typically the context menu can't be opened with the mouse
   * on a connection, because you can't select a connection. But keyboard
   * users may open the context menu with a keyboard shortcut.
   *
   * @param e Event that triggered the opening of the context menu.
   */
  showContextMenu(e: Event): void {
    const menuOptions = ContextMenuRegistry.registry.getContextMenuOptions(
      {focusedNode: this},
      e,
    );

    if (!menuOptions.length) return;

    const block = this.getSourceBlock();
    const workspace = block.workspace;

    let location;
    if (e instanceof PointerEvent) {
      location = new Coordinate(e.clientX, e.clientY);
    } else {
      const connectionWSCoords = new Coordinate(this.x, this.y);
      const connectionScreenCoords = svgMath.wsToScreenCoordinates(
        workspace,
        connectionWSCoords,
      );
      location = connectionScreenCoords.translate(block.RTL ? -5 : 5, 5);
    }

    ContextMenu.show(e, menuOptions, block.RTL, workspace, location);
  }

  /** See IFocusableNode.getFocusableElement. */
  getFocusableElement(): HTMLElement | SVGElement {
    const highlightSvg = this.findHighlightSvg();
    if (highlightSvg) return highlightSvg;
    throw new Error('No highlight SVG found corresponding to this connection.');
  }

  /** See IFocusableNode.getFocusableTree. */
  getFocusableTree(): IFocusableTree {
    return this.getSourceBlock().workspace as WorkspaceSvg;
  }

  /** See IFocusableNode.onNodeFocus. */
  onNodeFocus(): void {
    this.highlight();
    this.getSourceBlock().workspace.scrollBoundsIntoView(
      this.getSourceBlock().getBoundingRectangleWithoutChildren(),
    );
  }

  /** See IFocusableNode.onNodeBlur. */
  onNodeBlur(): void {
    this.unhighlight();
  }

  /** See IFocusableNode.canBeFocused. */
  canBeFocused(): boolean {
    return true;
  }

  private findHighlightSvg(): SVGPathElement | null {
    // This cast is valid as TypeScript's definition is wrong. See:
    // https://github.com/microsoft/TypeScript/issues/60996.
    return document.getElementById(this.id) as
      | unknown
      | null as SVGPathElement | null;
  }
}

export namespace RenderedConnection {
  /**
   * Enum for different kinds of tracked states.
   *
   * WILL_TRACK means that this connection will add itself to
   * the db on the next moveTo call it receives.
   *
   * UNTRACKED means that this connection will not add
   * itself to the database until setTracking(true) is explicitly called.
   *
   * TRACKED means that this connection is currently being tracked.
   */
  export enum TrackedState {
    WILL_TRACK = -1,
    UNTRACKED = 0,
    TRACKED = 1,
  }
}

export type TrackedState = RenderedConnection.TrackedState;
export const TrackedState = RenderedConnection.TrackedState;
