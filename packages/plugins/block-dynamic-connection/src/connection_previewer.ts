/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

interface ConnectionPreviewerConstructor {
  new (draggedBlock: Blockly.BlockSvg): Blockly.IConnectionPreviewer;
}

interface DynamicBlock extends Blockly.BlockSvg {
  onPendingConnection(connection: Blockly.RenderedConnection): void;
  finalizeConnections(): void;
}

/**
 * A type guard that checks if the given block fulfills the DynamicBlock
 * interface.
 *
 * @param block
 */
export function blockIsDynamic(block: Blockly.BlockSvg): block is DynamicBlock {
  return (
    (block as DynamicBlock)['onPendingConnection'] !== undefined &&
    (block as DynamicBlock)['finalizeConnections'] !== undefined
  );
}

/**
 * Returns a connection previewer constructor that decorates the passed
 * constructor to add connection previewing.
 *
 * @param BasePreviewerConstructor The constructor for the base connection
 *     previewer class being decorated. If not provided, the default
 *     InsertionMarkerPreviewer will be used.
 * @return A decorated connection previewer constructor.
 */
export function decoratePreviewer(
  BasePreviewerConstructor?: ConnectionPreviewerConstructor,
): ConnectionPreviewerConstructor {
  return class implements Blockly.IConnectionPreviewer {
    private basePreviewer: Blockly.IConnectionPreviewer;

    private pendingBlocks: Set<DynamicBlock> = new Set();

    constructor(draggedBlock: Blockly.BlockSvg) {
      const BaseConstructor =
        BasePreviewerConstructor ?? Blockly.InsertionMarkerPreviewer;
      this.basePreviewer = new BaseConstructor(draggedBlock);
    }

    previewReplacement(
      draggedConn: Blockly.RenderedConnection,
      staticConn: Blockly.RenderedConnection,
      replacedBlock: Blockly.BlockSvg,
    ): void {
      this.previewDynamism(staticConn);
      this.basePreviewer.previewReplacement(
        draggedConn,
        staticConn,
        replacedBlock,
      );
    }

    previewConnection(
      draggedConn: Blockly.RenderedConnection,
      staticConn: Blockly.RenderedConnection,
    ): void {
      this.previewDynamism(staticConn);
      this.basePreviewer.previewConnection(draggedConn, staticConn);
    }

    hidePreview(): void {
      this.basePreviewer.hidePreview();
    }

    dispose(): void {
      for (const block of this.pendingBlocks) {
        if (block.isDeadOrDying()) return;
        block.finalizeConnections();
      }
      this.pendingBlocks.clear();
      this.basePreviewer.dispose();
    }

    /**
     * If the block is a dynamic block, calls onPendingConnection and
     * stores the block to be finalized later.
     *
     * @param conn The block to trigger onPendingConnection on.
     */
    private previewDynamism(conn: Blockly.RenderedConnection) {
      const block = conn.getSourceBlock();
      if (blockIsDynamic(block)) {
        block.onPendingConnection(conn);
        this.pendingBlocks.add(block);
      }
    }
  };
}
