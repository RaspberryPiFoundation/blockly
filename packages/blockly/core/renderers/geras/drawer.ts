/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.geras.Drawer

import type {BlockSvg} from '../../block_svg.js';
import * as svgPaths from '../../utils/svg_paths.js';
import {Drawer as BaseDrawer} from '../common/drawer.js';
import type {Row} from '../measurables/row.js';
import type {ConstantProvider} from './constants.js';
import {Highlighter} from './highlighter.js';
import type {RenderInfo} from './info.js';
import type {InlineInput} from './measurables/inline_input.js';
import type {PathObject} from './path_object.js';

/**
 * An object that draws a block based on the given rendering information,
 * customized for the geras renderer.
 */
export class Drawer extends BaseDrawer {
  highlighter_: Highlighter;
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  override constants_!: ConstantProvider;

  /**
   * @param block The block to render.
   * @param info An object containing all information needed to render this
   *     block.
   */
  constructor(block: BlockSvg, info: RenderInfo) {
    super(block, info);
    // Unlike Thrasos, Geras has highlights and drop shadows.
    this.highlighter_ = new Highlighter(info);
  }

  override draw() {
    this.drawOutline_();
    this.drawInternals_();
    this.updateConnectionHighlights();

    const pathObject = this.block_.pathObject as PathObject;
    pathObject.setPath(this.outlinePath_ + '\n' + this.inlinePath_);
    pathObject.setHighlightPath(this.highlighter_.getPath());
    if (this.info_.RTL) {
      pathObject.flipRTL();
    }
    this.recordSizeOnBlock_();
  }

  override drawTop_() {
    this.highlighter_.drawTopCorner(this.info_.topRow);
    this.highlighter_.drawRightSideRow(this.info_.topRow);

    super.drawTop_();
  }

  override drawJaggedEdge_(row: Row) {
    this.highlighter_.drawJaggedEdge_(row);

    super.drawJaggedEdge_(row);
  }

  override drawValueInput_(row: Row) {
    this.highlighter_.drawValueInput(row);

    super.drawValueInput_(row);
  }

  override drawStatementInput_(row: Row) {
    this.highlighter_.drawStatementInput(row);

    super.drawStatementInput_(row);
  }

  override drawRightSideRow_(row: Row) {
    this.highlighter_.drawRightSideRow(row);

    this.outlinePath_ +=
      svgPaths.lineOnAxis('H', row.xPos + row.width) +
      svgPaths.lineOnAxis('V', row.yPos + row.height);
  }

  override drawBottom_() {
    this.highlighter_.drawBottomRow(this.info_.bottomRow);

    super.drawBottom_();
  }

  /**
   * Add steps for the left side of the block, which may include an output
   * connection
   */
  protected override drawLeft_() {
    this.highlighter_.drawLeft();

    super.drawLeft_();
  }

  override drawInlineInput_(input: InlineInput) {
    this.highlighter_.drawInlineInput(input);

    super.drawInlineInput_(input);
  }

  override positionInlineInputConnection_(input: InlineInput) {
    const yPos = input.centerline - input.height / 2;
    // Move the connection.
    if (input.connectionModel) {
      // xPos already contains info about startX
      let connX =
        input.xPos + input.connectionWidth + this.constants_.DARK_PATH_OFFSET;
      if (this.info_.RTL) {
        connX *= -1;
      }
      input.connectionModel.setOffsetInBlock(
        connX,
        yPos + input.connectionOffsetY + this.constants_.DARK_PATH_OFFSET,
      );
    }
  }

  override positionStatementInputConnection_(row: Row) {
    const input = row.getLastInput();
    if (input?.connectionModel) {
      let connX = row.xPos + row.statementEdge + input.notchOffset;
      if (this.info_.RTL) {
        connX *= -1;
      } else {
        connX += this.constants_.DARK_PATH_OFFSET;
      }
      input.connectionModel.setOffsetInBlock(
        connX,
        row.yPos + this.constants_.DARK_PATH_OFFSET,
      );
    }
  }

  override positionExternalValueConnection_(row: Row) {
    const input = row.getLastInput();
    if (input && input.connectionModel) {
      let connX = row.xPos + row.width + this.constants_.DARK_PATH_OFFSET;
      if (this.info_.RTL) {
        connX *= -1;
      }
      input.connectionModel.setOffsetInBlock(connX, row.yPos);
    }
  }

  override positionNextConnection_() {
    const bottomRow = this.info_.bottomRow;

    if (bottomRow.connection) {
      const connInfo = bottomRow.connection;
      const x = connInfo.xPos; // Already contains info about startX.
      const connX =
        (this.info_.RTL ? -x : x) + this.constants_.DARK_PATH_OFFSET / 2;
      connInfo.connectionModel.setOffsetInBlock(
        connX,
        bottomRow.baseline + this.constants_.DARK_PATH_OFFSET,
      );
    }
  }
}
