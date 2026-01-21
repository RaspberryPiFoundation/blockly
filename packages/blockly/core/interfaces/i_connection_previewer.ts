/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BlockSvg} from '../block_svg';
import type {RenderedConnection} from '../rendered_connection';

/**
 * Displays visual "previews" of where a block will be connected if it is
 * dropped.
 */
export interface IConnectionPreviewer {
  /**
   * Display a connection preview where the draggedCon connects to the
   * staticCon, replacing the replacedBlock (currently connected to the
   * staticCon).
   *
   * @param draggedCon The connection on the block stack being dragged.
   * @param staticCon The connection not being dragged that we are
   *     connecting to.
   * @param replacedBlock The block currently connected to the staticCon that
   *     is being replaced.
   */
  previewReplacement(
    draggedConn: RenderedConnection,
    staticConn: RenderedConnection,
    replacedBlock: BlockSvg,
  ): void;

  /**
   * Display a connection preview where the draggedCon connects to the
   * staticCon, and no block is being relaced.
   *
   * @param draggedCon The connection on the block stack being dragged.
   * @param staticCon The connection not being dragged that we are
   *     connecting to.
   */
  previewConnection(
    draggedConn: RenderedConnection,
    staticConn: RenderedConnection,
  ): void;

  /** Hide any previews that are currently displayed. */
  hidePreview(): void;

  /** Dispose of any references held by this connection previewer. */
  dispose(): void;
}
