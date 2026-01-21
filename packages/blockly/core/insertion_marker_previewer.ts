/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {BlockSvg} from './block_svg.js';
import {ConnectionType} from './connection_type.js';
import * as eventUtils from './events/utils.js';
import {IConnectionPreviewer} from './interfaces/i_connection_previewer.js';
import * as registry from './registry.js';
import * as renderManagement from './render_management.js';
import {RenderedConnection} from './rendered_connection.js';
import {Renderer as ZelosRenderer} from './renderers/zelos/renderer.js';
import * as blocks from './serialization/blocks.js';
import {WorkspaceSvg} from './workspace_svg.js';

export class InsertionMarkerPreviewer implements IConnectionPreviewer {
  private readonly workspace: WorkspaceSvg;

  private fadedBlock: BlockSvg | null = null;

  private markerConn: RenderedConnection | null = null;

  private draggedConn: RenderedConnection | null = null;

  private staticConn: RenderedConnection | null = null;

  constructor(draggedBlock: BlockSvg) {
    this.workspace = draggedBlock.workspace;
  }

  /**
   * Display a connection preview where the draggedCon connects to the
   * staticCon, replacing the replacedBlock (currently connected to the
   * staticCon).
   *
   * @param draggedConn The connection on the block stack being dragged.
   * @param staticConn The connection not being dragged that we are
   *     connecting to.
   * @param replacedBlock The block currently connected to the staticCon that
   *     is being replaced.
   */
  previewReplacement(
    draggedConn: RenderedConnection,
    staticConn: RenderedConnection,
    replacedBlock: BlockSvg,
  ) {
    eventUtils.disable();
    try {
      this.hidePreview();
      this.fadedBlock = replacedBlock;
      replacedBlock.fadeForReplacement(true);
      if (this.workspace.getRenderer().shouldHighlightConnection(staticConn)) {
        staticConn.highlight();
        this.staticConn = staticConn;
      }
    } finally {
      eventUtils.enable();
    }
  }

  /**
   * Display a connection preview where the draggedCon connects to the
   * staticCon, and no block is being relaced.
   *
   * @param draggedConn The connection on the block stack being dragged.
   * @param staticConn The connection not being dragged that we are
   *     connecting to.
   */
  previewConnection(
    draggedConn: RenderedConnection,
    staticConn: RenderedConnection,
  ) {
    if (draggedConn === this.draggedConn && staticConn === this.staticConn) {
      return;
    }

    eventUtils.disable();
    try {
      this.hidePreview();

      // TODO(7898): Instead of special casing, we should change the dragger to
      //   track the change in distance between the dragged connection and the
      //   static connection, so that it doesn't disconnect  unless that
      //   (+ a bit) has been exceeded.
      if (this.shouldUseMarkerPreview(draggedConn, staticConn)) {
        this.markerConn = this.previewMarker(draggedConn, staticConn);
      }

      if (this.workspace.getRenderer().shouldHighlightConnection(staticConn)) {
        staticConn.highlight();
      }

      this.draggedConn = draggedConn;
      this.staticConn = staticConn;
    } finally {
      eventUtils.enable();
    }
  }

  private shouldUseMarkerPreview(
    _draggedConn: RenderedConnection,
    staticConn: RenderedConnection,
  ): boolean {
    return (
      staticConn.type === ConnectionType.PREVIOUS_STATEMENT ||
      staticConn.type === ConnectionType.NEXT_STATEMENT ||
      !(this.workspace.getRenderer() instanceof ZelosRenderer)
    );
  }

  private previewMarker(
    draggedConn: RenderedConnection,
    staticConn: RenderedConnection,
  ): RenderedConnection | null {
    const dragged = draggedConn.getSourceBlock();
    const marker = this.createInsertionMarker(dragged);
    const markerConn = this.getMatchingConnection(dragged, marker, draggedConn);
    if (!markerConn) return null;

    // Render disconnected from everything else so that we have a valid
    // connection location.
    marker.queueRender();
    renderManagement.triggerQueuedRenders();

    // Connect() also renders the insertion marker.
    markerConn.connect(staticConn);

    const originalOffsetToTarget = {
      x: staticConn.x - markerConn.x,
      y: staticConn.y - markerConn.y,
    };
    const originalOffsetInBlock = markerConn.getOffsetInBlock().clone();
    renderManagement.finishQueuedRenders().then(() => {
      if (marker.isDeadOrDying()) return;
      eventUtils.disable();
      try {
        // Position so that the existing block doesn't move.
        marker?.positionNearConnection(
          markerConn,
          originalOffsetToTarget,
          originalOffsetInBlock,
        );
        marker?.getSvgRoot().setAttribute('visibility', 'visible');
      } finally {
        eventUtils.enable();
      }
    });
    return markerConn;
  }

  /**
   * Transforms the given block into a JSON representation used to construct an
   * insertion marker.
   *
   * @param block The block to serialize and use as an insertion marker.
   * @returns A JSON-formatted string corresponding to a serialized
   *     representation of the given block suitable for use as an insertion
   *     marker.
   */
  protected serializeBlockToInsertionMarker(block: BlockSvg) {
    const blockJson = blocks.save(block, {
      addCoordinates: false,
      addInputBlocks: false,
      addNextBlocks: false,
      doFullSerialization: false,
    });

    if (!blockJson) {
      throw new Error(
        `Failed to serialize source block. ${block.toDevString()}`,
      );
    }

    return blockJson;
  }

  private createInsertionMarker(origBlock: BlockSvg) {
    const blockJson = this.serializeBlockToInsertionMarker(origBlock);
    const result = blocks.append(blockJson, this.workspace) as BlockSvg;

    // Turn shadow blocks that are created programmatically during
    // initalization to insertion markers too.
    for (const block of result.getDescendants(false)) {
      block.setInsertionMarker(true);
    }

    result.initSvg();
    result.getSvgRoot().setAttribute('visibility', 'hidden');
    return result;
  }

  /**
   * Gets the connection on the marker block that matches the original
   * connection on the original block.
   *
   * @param orig The original block.
   * @param marker The marker block (where we want to find the matching
   *     connection).
   * @param origConn The original connection.
   */
  private getMatchingConnection(
    orig: BlockSvg,
    marker: BlockSvg,
    origConn: RenderedConnection,
  ): RenderedConnection | null {
    const origConns = orig.getConnections_(true);
    const markerConns = marker.getConnections_(true);
    if (origConns.length !== markerConns.length) return null;
    for (let i = 0; i < origConns.length; i++) {
      if (origConns[i] === origConn) {
        return markerConns[i];
      }
    }
    return null;
  }

  /** Hide any previews that are currently displayed. */
  hidePreview() {
    eventUtils.disable();
    try {
      if (this.staticConn) {
        this.staticConn.unhighlight();
        this.staticConn = null;
      }
      if (this.fadedBlock) {
        this.fadedBlock.fadeForReplacement(false);
        this.fadedBlock = null;
      }
      if (this.markerConn) {
        this.hideInsertionMarker(this.markerConn);
        this.markerConn = null;
        this.draggedConn = null;
      }
    } finally {
      eventUtils.enable();
    }
  }

  private hideInsertionMarker(markerConn: RenderedConnection) {
    const marker = markerConn.getSourceBlock();
    const markerPrev = marker.previousConnection;
    const markerOutput = marker.outputConnection;

    if (!markerPrev?.targetConnection && !markerOutput?.targetConnection) {
      // If we are the top block, unplugging doesn't do anything.
      // The marker connection may not have a target block if we are hiding
      // as part of applying connections.
      markerConn.targetBlock()?.unplug(false);
    } else {
      marker.unplug(true);
    }

    marker.dispose();
  }

  /** Dispose of any references held by this connection previewer. */
  dispose() {
    this.hidePreview();
  }
}

registry.register(
  registry.Type.CONNECTION_PREVIEWER,
  registry.DEFAULT,
  InsertionMarkerPreviewer,
);
