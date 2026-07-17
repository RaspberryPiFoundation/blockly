/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BlockSvg} from './block_svg.js';
import * as renderManagement from './render_management.js';
import {RenderedConnection} from './rendered_connection.js';
import {Coordinate} from './utils/coordinate.js';
import * as dom from './utils/dom.js';
import {Size} from './utils/size.js';
import {Svg} from './utils/svg.js';

/**
 * Visual representation of a mid-drag block if it were to be connected.
 */
export class InsertionMarker {
  /** The current size of the insertion marker, in workspace units. */
  private size: Size = new Size(0, 0);

  /** The DOM element representing the insertion marker. */
  private marker?: SVGGElement;

  /** The static connection to which the insertion marker is attached. */
  private parentConnection?: RenderedConnection;

  /**
   * Returns the current size of the insertion marker in workspace units.
   */
  getHeightWidth() {
    return this.size;
  }

  /**
   * Displays an insertion marker representing the block structure if
   * `draggingConnection` were to be connected to `staticConnection`.
   *
   * @param staticConnection The proposed connection on the stationary block.
   * @param draggingConnection The proposed connection on a block being dragged.
   */
  show(
    staticConnection: RenderedConnection,
    draggingConnection: RenderedConnection,
  ) {
    this.parentConnection = staticConnection;
    this.parentConnection.attachInsertionMarker(this);

    const connectingBlock = draggingConnection.getSourceBlock();

    // Save all the existing connections pairs on the dragged block.
    const oldConnections = new Map<
      RenderedConnection,
      RenderedConnection | null
    >();
    for (const connection of connectingBlock.getConnections_(false)) {
      oldConnections.set(connection, connection.targetConnection);
      connection.targetConnection = null;
    }

    // Temporarily connect the dragging and static connections and render the
    // dragging block to steal its size and path for use by the insertion
    // marker. Importantly, this does *not* call connect(), which causes DOM
    // manipulation, fires events, etc – it just swaps the target connection.
    draggingConnection.targetConnection = staticConnection;
    connectingBlock.workspace.getRenderer().render(connectingBlock);
    this.partiallyTighten(connectingBlock, draggingConnection);

    this.marker = this.makeMarker(connectingBlock);

    const bounds = connectingBlock.getBoundingRectangleWithoutChildren();
    this.size = new Size(bounds.getWidth(), bounds.getHeight());

    const blockOffset = staticConnection
      .getSourceBlock()
      .getRelativeToSurfaceXY();

    const connectionOffset = Coordinate.difference(
      staticConnection.getOffsetInBlock(),
      draggingConnection.getOffsetInBlock(),
    );

    // Restore the state of the dragging block and rerender it.
    for (const [source, target] of oldConnections.entries()) {
      source.targetConnection = target;
    }
    connectingBlock.workspace.getRenderer().render(connectingBlock);
    this.partiallyTighten(connectingBlock, draggingConnection);

    // Move the insertion marker to abut the static connection and render the
    // static block in case it needs to grow to accommodate the insertion
    // marker.
    this.marker.setAttribute(
      'transform',
      `translate(${blockOffset.x + connectionOffset.x}, ${blockOffset.y + connectionOffset.y})`,
    );
    staticConnection.getSourceBlock().queueRender();
    renderManagement.triggerQueuedRenders();
  }

  /**
   * Hides the insertion marker.
   */
  hide() {
    if (!this.parentConnection) return;

    this.marker?.remove();
    this.marker = undefined;
    this.parentConnection.detachInsertionMarker();

    this.parentConnection?.getSourceBlock().queueRender();
    renderManagement.triggerQueuedRenders();
    this.parentConnection = undefined;
  }

  /**
   * Creates a new insertion marker corresponding to the given block.
   *
   * @param block The block whose path will be used for the insertion marker.
   * @returns An SVG group representing an insertion marker.
   */
  private makeMarker(block: BlockSvg) {
    const newMarker = dom.createSvgElement(Svg.G, {
      'transform': `translate(${block.relativeCoords.x}, ${block.relativeCoords.y})`,
      'class': 'blocklyInsertionMarker',
    });

    const path = block.pathObject.svgPath;
    dom.createSvgElement(
      Svg.PATH,
      {
        'd': path.getAttribute('d') ?? '',
        'class': 'blocklyPath',
      },
      newMarker,
    );

    block.workspace.getCanvas().appendChild(newMarker);

    return newMarker;
  }

  /**
   * Moves all connections on the given block adjacent to one another, excepting
   * a specified connection. Otherwise identical to
   * `BlockSvg.tightenChildrenEfficiently()`.
   *
   * @param block The block whose connections should be tightened.
   * @param skip A connection to avoid tightening; generally that to which the
   *     insertion marker is being connected to, which may need to have a gap
   *     between it and its partner connection which the insertion marker will
   *     be spliced into.
   */
  private partiallyTighten(block: BlockSvg, skip: RenderedConnection) {
    for (const input of block.inputList) {
      if (input === skip.getParentInput()) {
        continue;
      }
      const conn = input.connection as RenderedConnection;
      if (conn) conn.tightenEfficiently();
    }
    if (block.nextConnection && block.nextConnection !== skip)
      block.nextConnection.tightenEfficiently();
  }
}
