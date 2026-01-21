/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.Drawer

import type {BlockSvg} from '../../block_svg.js';
import {ConnectionType} from '../../connection_type.js';
import {Coordinate} from '../../utils.js';
import * as svgPaths from '../../utils/svg_paths.js';
import {Connection} from '../measurables/connection.js';
import type {ExternalValueInput} from '../measurables/external_value_input.js';
import type {Field} from '../measurables/field.js';
import type {Icon} from '../measurables/icon.js';
import type {InlineInput} from '../measurables/inline_input.js';
import type {Row} from '../measurables/row.js';
import {Types} from '../measurables/types.js';
import type {ConstantProvider, Notch, PuzzleTab} from './constants.js';
import {isDynamicShape, isNotch, isPuzzleTab} from './constants.js';
import type {RenderInfo} from './info.js';

/**
 * An object that draws a block based on the given rendering information.
 */
export class Drawer {
  block_: BlockSvg;
  info_: RenderInfo;
  topLeft_: Coordinate;
  outlinePath_ = '';
  inlinePath_ = '';
  protected constants_: ConstantProvider;

  /**
   * @param block The block to render.
   * @param info An object containing all information needed to render this
   *     block.
   */
  constructor(block: BlockSvg, info: RenderInfo) {
    this.block_ = block;
    this.info_ = info;
    this.topLeft_ = block.getRelativeToSurfaceXY();

    /** The renderer's constant provider. */
    this.constants_ = info.getRenderer().getConstants();
  }

  /**
   * Draw the block to the workspace. Here "drawing" means setting SVG path
   * elements and moving fields, icons, and connections on the screen.
   *
   * The pieces of the paths are pushed into arrays of "steps", which are then
   * joined with spaces and set directly on the block.  This guarantees that
   * the steps are separated by spaces for improved readability, but isn't
   * required.
   */
  draw() {
    this.drawOutline_();
    this.drawInternals_();
    this.updateConnectionHighlights();

    this.block_.pathObject.setPath(this.outlinePath_ + '\n' + this.inlinePath_);
    if (this.info_.RTL) {
      this.block_.pathObject.flipRTL();
    }
    this.recordSizeOnBlock_();
  }

  /**
   * Save sizing information back to the block
   * Most of the rendering information can be thrown away at the end of the
   * render. Anything that needs to be kept around should be set in this
   * function.
   */
  protected recordSizeOnBlock_() {
    // This is used when the block is reporting its size to anyone else.
    // The dark path adds to the size of the block in both X and Y.
    this.block_.height = this.info_.height;
    this.block_.width = this.info_.widthWithChildren;
    this.block_.childlessWidth = this.info_.width;
  }

  /** Create the outline of the block.  This is a single continuous path. */
  protected drawOutline_() {
    this.drawTop_();
    for (let r = 1; r < this.info_.rows.length - 1; r++) {
      const row = this.info_.rows[r];
      if (row.hasJaggedEdge) {
        this.drawJaggedEdge_(row);
      } else if (row.hasStatement) {
        this.drawStatementInput_(row);
      } else if (row.hasExternalInput) {
        this.drawValueInput_(row);
      } else {
        this.drawRightSideRow_(row);
      }
    }
    this.drawBottom_();
    this.drawLeft_();
  }

  /**
   * Add steps for the top corner of the block, taking into account
   * details such as hats and rounded corners.
   */
  protected drawTop_() {
    const topRow = this.info_.topRow;
    const elements = topRow.elements;

    this.positionPreviousConnection_();
    this.outlinePath_ += svgPaths.moveBy(topRow.xPos, this.info_.startY);
    for (let i = 0, elem; (elem = elements[i]); i++) {
      if (Types.isLeftRoundedCorner(elem)) {
        this.outlinePath_ += this.constants_.OUTSIDE_CORNERS.topLeft;
      } else if (Types.isRightRoundedCorner(elem)) {
        this.outlinePath_ += this.constants_.OUTSIDE_CORNERS.topRight;
      } else if (Types.isPreviousConnection(elem)) {
        this.outlinePath_ += (elem.shape as Notch).pathLeft;
      } else if (Types.isHat(elem)) {
        this.outlinePath_ += this.constants_.START_HAT.path;
      } else if (Types.isSpacer(elem)) {
        this.outlinePath_ += svgPaths.lineOnAxis('h', elem.width);
      }
      // No branch for a square corner, because it's a no-op.
    }
    this.outlinePath_ += svgPaths.lineOnAxis(
      'v',
      topRow.height - topRow.ascenderHeight,
    );
  }

  /**
   * Add steps for the jagged edge of a row on a collapsed block.
   *
   * @param row The row to draw the side of.
   */
  protected drawJaggedEdge_(row: Row) {
    const remainder = row.height - this.constants_.JAGGED_TEETH.height;
    this.outlinePath_ +=
      this.constants_.JAGGED_TEETH.path + svgPaths.lineOnAxis('v', remainder);
  }

  /**
   * Add steps for an external value input, rendered as a notch in the side
   * of the block.
   *
   * @param row The row that this input belongs to.
   */
  protected drawValueInput_(row: Row) {
    const input = row.getLastInput() as ExternalValueInput | InlineInput;
    this.positionExternalValueConnection_(row);

    const pathDown = isDynamicShape(input.shape)
      ? input.shape.pathDown(input.height)
      : (input.shape as PuzzleTab).pathDown;

    this.outlinePath_ +=
      svgPaths.lineOnAxis('H', input.xPos + input.width) +
      pathDown +
      svgPaths.lineOnAxis('v', row.height - input.connectionHeight);
  }

  /**
   * Add steps for a statement input.
   *
   * @param row The row that this input belongs to.
   */
  protected drawStatementInput_(row: Row) {
    const input = row.getLastInput();
    if (!input) return;
    // Where to start drawing the notch, which is on the right side in LTR.
    const x = input.xPos + input.notchOffset + (input.shape as Notch).width;

    const innerTopLeftCorner =
      (input.shape as Notch).pathRight +
      svgPaths.lineOnAxis(
        'h',
        -(input.notchOffset - this.constants_.INSIDE_CORNERS.width),
      ) +
      this.constants_.INSIDE_CORNERS.pathTop;

    const innerHeight = row.height - 2 * this.constants_.INSIDE_CORNERS.height;

    this.outlinePath_ +=
      svgPaths.lineOnAxis('H', x) +
      innerTopLeftCorner +
      svgPaths.lineOnAxis('v', innerHeight) +
      this.constants_.INSIDE_CORNERS.pathBottom +
      svgPaths.lineOnAxis('H', row.xPos + row.width);

    this.positionStatementInputConnection_(row);
  }

  /**
   * Add steps for the right side of a row that does not have value or
   * statement input connections.
   *
   * @param row The row to draw the side of.
   */
  protected drawRightSideRow_(row: Row) {
    this.outlinePath_ += svgPaths.lineOnAxis('V', row.yPos + row.height);
  }

  /**
   * Add steps for the bottom edge of a block, possibly including a notch
   * for the next connection.
   */
  protected drawBottom_() {
    const bottomRow = this.info_.bottomRow;
    const elems = bottomRow.elements;
    this.positionNextConnection_();

    let rightCornerYOffset = 0;
    let outlinePath = '';
    for (let i = elems.length - 1, elem; (elem = elems[i]); i--) {
      if (Types.isNextConnection(elem)) {
        outlinePath += (elem.shape as Notch).pathRight;
      } else if (Types.isLeftSquareCorner(elem)) {
        outlinePath += svgPaths.lineOnAxis('H', bottomRow.xPos);
      } else if (Types.isLeftRoundedCorner(elem)) {
        outlinePath += this.constants_.OUTSIDE_CORNERS.bottomLeft;
      } else if (Types.isRightRoundedCorner(elem)) {
        outlinePath += this.constants_.OUTSIDE_CORNERS.bottomRight;
        rightCornerYOffset = this.constants_.OUTSIDE_CORNERS.rightHeight;
      } else if (Types.isSpacer(elem)) {
        outlinePath += svgPaths.lineOnAxis('h', elem.width * -1);
      }
    }

    this.outlinePath_ += svgPaths.lineOnAxis(
      'V',
      bottomRow.baseline - rightCornerYOffset,
    );
    this.outlinePath_ += outlinePath;
  }

  /**
   * Add steps for the left side of the block, which may include an output
   * connection
   */
  protected drawLeft_() {
    const outputConnection = this.info_.outputConnection;
    this.positionOutputConnection_();

    if (outputConnection) {
      const tabBottom =
        outputConnection.connectionOffsetY + outputConnection.height;
      const pathUp = isDynamicShape(outputConnection.shape)
        ? outputConnection.shape.pathUp(outputConnection.height)
        : (outputConnection.shape as PuzzleTab).pathUp;

      // Draw a line up to the bottom of the tab.
      this.outlinePath_ += svgPaths.lineOnAxis('V', tabBottom) + pathUp;
    }
    // Close off the path.  This draws a vertical line up to the start of the
    // block's path, which may be either a rounded or a sharp corner.
    this.outlinePath_ += 'z';
  }

  /**
   * Draw the internals of the block: inline inputs, fields, and icons.  These
   * do not depend on the outer path for placement.
   */
  protected drawInternals_() {
    for (let i = 0, row; (row = this.info_.rows[i]); i++) {
      for (let j = 0, elem; (elem = row.elements[j]); j++) {
        if (Types.isInlineInput(elem)) {
          this.drawInlineInput_(elem);
        } else if (Types.isIcon(elem) || Types.isField(elem)) {
          this.layoutField_(elem);
        }
      }
    }
  }

  /**
   * Push a field or icon's new position to its SVG root.
   *
   * @param fieldInfo The rendering information for the field or icon.
   */
  protected layoutField_(fieldInfo: Icon | Field) {
    const yPos = fieldInfo.centerline - fieldInfo.height / 2;
    let xPos = fieldInfo.xPos;
    let scale = '';
    if (this.info_.RTL) {
      xPos = -(xPos + fieldInfo.width);
      if (fieldInfo.flipRtl) {
        xPos += fieldInfo.width;
        scale = 'scale(-1 1)';
      }
    }

    if (Types.isIcon(fieldInfo)) {
      const icon = fieldInfo.icon;
      icon.setOffsetInBlock(new Coordinate(xPos, yPos));
      if (this.info_.isInsertionMarker) {
        icon.hideForInsertionMarker();
      }
    } else {
      const svgGroup = fieldInfo.field.getSvgRoot()!;
      svgGroup.setAttribute(
        'transform',
        'translate(' + xPos + ',' + yPos + ')' + scale,
      );
      if (this.info_.isInsertionMarker) {
        svgGroup.setAttribute('display', 'none');
      }
    }
  }

  /**
   * Add steps for an inline input.
   *
   * @param input The information about the input to render.
   */
  protected drawInlineInput_(input: InlineInput) {
    const width = input.width;
    const height = input.height;
    const yPos = input.centerline - height / 2;

    const connectionTop = input.connectionOffsetY;
    const connectionBottom = input.connectionHeight + connectionTop;
    const connectionRight = input.xPos + input.connectionWidth;

    this.inlinePath_ +=
      svgPaths.moveTo(connectionRight, yPos) +
      svgPaths.lineOnAxis('v', connectionTop) +
      (input.shape as PuzzleTab).pathDown +
      svgPaths.lineOnAxis('v', height - connectionBottom) +
      svgPaths.lineOnAxis('h', width - input.connectionWidth) +
      svgPaths.lineOnAxis('v', -height) +
      'z';

    this.positionInlineInputConnection_(input);
  }

  /**
   * Position the connection on an inline value input, taking into account
   * RTL and the small gap between the parent block and child block which lets
   * the parent block's dark path show through.
   *
   * @param input The information about the input that the connection is on.
   */
  protected positionInlineInputConnection_(input: InlineInput) {
    const yPos = input.centerline - input.height / 2;
    // Move the connection.
    if (input.connectionModel) {
      // xPos already contains info about startX
      let connX = input.xPos + input.connectionWidth + input.connectionOffsetX;
      if (this.info_.RTL) {
        connX *= -1;
      }
      input.connectionModel.setOffsetInBlock(
        connX,
        yPos + input.connectionOffsetY,
      );
    }
  }

  /**
   * Position the connection on a statement input, taking into account
   * RTL and the small gap between the parent block and child block which lets
   * the parent block's dark path show through.
   *
   * @param row The row that the connection is on.
   */
  protected positionStatementInputConnection_(row: Row) {
    const input = row.getLastInput();
    if (input?.connectionModel) {
      let connX = row.xPos + row.statementEdge + input.notchOffset;
      if (this.info_.RTL) {
        connX *= -1;
      }
      input.connectionModel.setOffsetInBlock(connX, row.yPos);
    }
  }

  /**
   * Position the connection on an external value input, taking into account
   * RTL and the small gap between the parent block and child block which lets
   * the parent block's dark path show through.
   *
   * @param row The row that the connection is on.
   */
  protected positionExternalValueConnection_(row: Row) {
    const input = row.getLastInput();
    if (input && input.connectionModel) {
      let connX = row.xPos + row.width;
      if (this.info_.RTL) {
        connX *= -1;
      }
      input.connectionModel.setOffsetInBlock(connX, row.yPos);
    }
  }

  /** Position the previous connection on a block. */
  protected positionPreviousConnection_() {
    const topRow = this.info_.topRow;
    if (topRow.connection) {
      const x = topRow.xPos + topRow.notchOffset;
      const connX = this.info_.RTL ? -x : x;
      topRow.connection.connectionModel.setOffsetInBlock(connX, 0);
    }
  }

  /** Position the next connection on a block. */
  protected positionNextConnection_() {
    const bottomRow = this.info_.bottomRow;

    if (bottomRow.connection) {
      const connInfo = bottomRow.connection;
      const x = connInfo.xPos; // Already contains info about startX.
      const connX = this.info_.RTL ? -x : x;
      connInfo.connectionModel.setOffsetInBlock(connX, bottomRow.baseline);
    }
  }

  /** Position the output connection on a block. */
  protected positionOutputConnection_() {
    if (this.info_.outputConnection) {
      const x =
        this.info_.startX + this.info_.outputConnection.connectionOffsetX;
      const connX = this.info_.RTL ? -x : x;
      this.block_.outputConnection.setOffsetInBlock(
        connX,
        this.info_.outputConnection.connectionOffsetY,
      );
    }
  }

  /**
   * Updates the path object to reflect which connections on the block are
   * highlighted.
   */
  protected updateConnectionHighlights() {
    for (const row of this.info_.rows) {
      for (const elem of row.elements) {
        if (!(elem instanceof Connection)) continue;

        const highlightSvg = this.drawConnectionHighlightPath(elem);
        if (highlightSvg) {
          highlightSvg.style.display = elem.highlighted ? '' : 'none';
        }
      }
    }
  }

  /** Returns a path to highlight the given connection. */
  drawConnectionHighlightPath(measurable: Connection): SVGElement | undefined {
    const conn = measurable.connectionModel;
    let path = '';
    if (
      conn.type === ConnectionType.INPUT_VALUE ||
      conn.type === ConnectionType.OUTPUT_VALUE
    ) {
      path = this.getExpressionConnectionHighlightPath(measurable);
    } else {
      path = this.getStatementConnectionHighlightPath(measurable);
    }
    const block = conn.getSourceBlock();
    return block.pathObject.addConnectionHighlight?.(
      conn,
      path,
      conn.getOffsetInBlock(),
      block.RTL,
    );
  }

  /**
   * Returns a path to highlight the given conneciton, assuming it is an
   * input or output connection.
   */
  private getExpressionConnectionHighlightPath(connection: Connection): string {
    let connPath = '';
    if (isDynamicShape(connection.shape)) {
      connPath = connection.shape.pathDown(connection.height);
    } else if (isPuzzleTab(connection.shape)) {
      connPath = connection.shape.pathDown;
    }

    // We are assuming that there is room for the tab offset above and below
    // the tab.
    const yLen = this.constants_.TAB_OFFSET_FROM_TOP;
    return (
      svgPaths.moveBy(0, -yLen) +
      svgPaths.lineOnAxis('v', yLen) +
      connPath +
      svgPaths.lineOnAxis('v', yLen)
    );
  }

  /**
   * Returns a path to highlight the given conneciton, assuming it is a
   * next or previous connection.
   */
  private getStatementConnectionHighlightPath(connection: Connection): string {
    if (!isNotch(connection.shape)) {
      throw new Error('Statement connections should have notch shapes');
    }

    const xLen =
      this.constants_.NOTCH_OFFSET_LEFT - this.constants_.CORNER_RADIUS;
    return (
      svgPaths.moveBy(-xLen, 0) +
      svgPaths.lineOnAxis('h', xLen) +
      connection.shape.pathLeft +
      svgPaths.lineOnAxis('h', xLen)
    );
  }
}
