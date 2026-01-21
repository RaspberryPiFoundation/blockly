/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.RenderInfo

import type {BlockSvg} from '../../block_svg.js';
import {Align} from '../../inputs/align.js';
import {DummyInput} from '../../inputs/dummy_input.js';
import {EndRowInput} from '../../inputs/end_row_input.js';
import {Input} from '../../inputs/input.js';
import {StatementInput} from '../../inputs/statement_input.js';
import {ValueInput} from '../../inputs/value_input.js';
import type {RenderedConnection} from '../../rendered_connection.js';
import type {Measurable} from '../measurables/base.js';
import {BottomRow} from '../measurables/bottom_row.js';
import {Connection} from '../measurables/connection.js';
import {ExternalValueInput} from '../measurables/external_value_input.js';
import {Field} from '../measurables/field.js';
import {Hat} from '../measurables/hat.js';
import {Icon} from '../measurables/icon.js';
import {InRowSpacer} from '../measurables/in_row_spacer.js';
import {InlineInput} from '../measurables/inline_input.js';
import {InputRow} from '../measurables/input_row.js';
import {JaggedEdge} from '../measurables/jagged_edge.js';
import {NextConnection} from '../measurables/next_connection.js';
import {OutputConnection} from '../measurables/output_connection.js';
import {PreviousConnection} from '../measurables/previous_connection.js';
import {RoundCorner} from '../measurables/round_corner.js';
import type {Row} from '../measurables/row.js';
import {SpacerRow} from '../measurables/spacer_row.js';
import {SquareCorner} from '../measurables/square_corner.js';
import {StatementInput as StatementInputMeasurable} from '../measurables/statement_input.js';
import {TopRow} from '../measurables/top_row.js';
import {Types} from '../measurables/types.js';
import type {ConstantProvider} from './constants.js';
import type {Renderer} from './renderer.js';

/**
 * An object containing all sizing information needed to draw this block.
 *
 * This measure pass does not propagate changes to the block (although fields
 * may choose to rerender when getSize() is called).  However, calling it
 * repeatedly may be expensive.
 */
export class RenderInfo {
  block_: BlockSvg;
  protected constants_: ConstantProvider;
  outputConnection: OutputConnection | null;
  isInline: boolean;
  isCollapsed: boolean;
  isInsertionMarker: boolean;
  RTL: boolean;

  /** The block renderer in use. */
  protected readonly renderer_!: Renderer;

  /** The height of the rendered block, including child blocks. */
  height = 0;

  /** The width of the rendered block, including child blocks. */
  widthWithChildren = 0;

  /**
   * The width of the rendered block, excluding child blocks.  This is the
   * right edge of the block when rendered LTR.
   */
  width = 0;
  statementEdge = 0;

  /** An array of Row objects containing sizing information. */
  rows: Row[] = [];

  /** An array of input rows on the block. */
  inputRows: InputRow[] = [];

  topRow: TopRow;
  bottomRow: BottomRow;

  // The position of the start point for drawing, relative to the block's
  // location.
  startX = 0;
  startY = 0;

  /**
   * @param renderer The renderer in use.
   * @param block The block to measure.
   */
  constructor(renderer: Renderer, block: BlockSvg) {
    this.renderer_ = renderer;

    this.block_ = block;

    /** The renderer's constant provider. */
    this.constants_ = this.renderer_.getConstants();

    /**
     * A measurable representing the output connection if the block has one.
     * Otherwise null.
     */
    this.outputConnection = block.outputConnection
      ? new OutputConnection(this.constants_, block.outputConnection)
      : null;

    /**
     * Whether the block should be rendered as a single line, either because
     * it's inline or because it has been collapsed.
     */
    this.isInline = block.getInputsInline() && !block.isCollapsed();

    /** Whether the block is collapsed. */
    this.isCollapsed = block.isCollapsed();

    /**
     * Whether the block is an insertion marker.  Insertion markers are the same
     * shape as normal blocks, but don't show fields.
     */
    this.isInsertionMarker = block.isInsertionMarker();

    /** True if the block should be rendered right-to-left. */
    this.RTL = block.RTL;

    /**
     * An object with rendering information about the top row of the block.
     */
    this.topRow = new TopRow(this.constants_);

    /**
     * An object with rendering information about the bottom row of the block.
     */
    this.bottomRow = new BottomRow(this.constants_);
  }

  /**
   * Get the block renderer in use.
   *
   * @returns The block renderer in use.
   */
  getRenderer(): Renderer {
    return this.renderer_;
  }

  /**
   * Populate this object with all sizing information needed to draw the block.
   *
   * This measure pass does not propagate changes to the block (although fields
   * may choose to rerender when getSize() is called).  However, calling it
   * repeatedly may be expensive.
   */
  measure() {
    this.createRows_();
    this.addElemSpacing_();
    this.addRowSpacing_();
    this.computeBounds_();
    this.alignRowElements_();
    this.finalize_();
  }

  /**
   * Create rows of Measurable objects representing all renderable parts of the
   * block.
   */
  protected createRows_() {
    this.populateTopRow_();
    this.rows.push(this.topRow);
    let activeRow = new InputRow(this.constants_);
    this.inputRows.push(activeRow);

    // Icons always go on the first row, before anything else.
    const icons = this.block_.getIcons();
    for (let i = 0, icon; (icon = icons[i]); i++) {
      const iconInfo = new Icon(this.constants_, icon);
      if (!this.isCollapsed || icon.isShownWhenCollapsed()) {
        activeRow.elements.push(iconInfo);
      }
    }

    let lastInput = undefined;
    // Loop across all of the inputs on the block, creating objects for anything
    // that needs to be rendered and breaking the block up into visual rows.
    for (let i = 0, input; (input = this.block_.inputList[i]); i++) {
      if (!input.isVisible()) {
        continue;
      }
      if (this.shouldStartNewRow_(input, lastInput)) {
        // Finish this row and create a new one.
        this.rows.push(activeRow);
        activeRow = new InputRow(this.constants_);
        this.inputRows.push(activeRow);
      }

      // All of the fields in an input go on the same row.
      for (let j = 0, field; (field = input.fieldRow[j]); j++) {
        activeRow.elements.push(new Field(this.constants_, field, input));
      }
      this.addInput_(input, activeRow);
      lastInput = input;
    }

    if (this.isCollapsed) {
      activeRow.hasJaggedEdge = true;
      activeRow.elements.push(new JaggedEdge(this.constants_));
    }

    if (activeRow.elements.length || activeRow.hasDummyInput) {
      this.rows.push(activeRow);
    }
    this.populateBottomRow_();
    this.rows.push(this.bottomRow);
  }

  /**
   * Create all non-spacer elements that belong on the top row.
   */
  protected populateTopRow_() {
    const hasPrevious = !!this.block_.previousConnection;
    const hasHat =
      (this.block_.hat
        ? this.block_.hat === 'cap'
        : this.constants_.ADD_START_HATS) &&
      !this.outputConnection &&
      !hasPrevious;

    let cornerClass = this.topRow.hasLeftSquareCorner(this.block_)
      ? SquareCorner
      : RoundCorner;
    this.topRow.elements.push(new cornerClass(this.constants_));

    if (hasHat) {
      const hat = new Hat(this.constants_);
      this.topRow.elements.push(hat);
    } else if (hasPrevious) {
      this.topRow.hasPreviousConnection = true;
      this.topRow.connection = new PreviousConnection(
        this.constants_,
        this.block_.previousConnection as RenderedConnection,
      );
      this.topRow.elements.push(this.topRow.connection);
    }

    const precedesStatement =
      this.block_.inputList.length &&
      this.block_.inputList[0] instanceof StatementInput;

    // This is the minimum height for the row. If one of its elements has a
    // greater height it will be overwritten in the compute pass.
    if (precedesStatement && !this.block_.isCollapsed()) {
      this.topRow.minHeight =
        this.constants_.TOP_ROW_PRECEDES_STATEMENT_MIN_HEIGHT;
    } else {
      this.topRow.minHeight = this.constants_.TOP_ROW_MIN_HEIGHT;
    }

    cornerClass = this.topRow.hasRightSquareCorner(this.block_)
      ? SquareCorner
      : RoundCorner;
    this.topRow.elements.push(new cornerClass(this.constants_, 'right'));
  }

  /**
   * Create all non-spacer elements that belong on the bottom row.
   */
  protected populateBottomRow_() {
    this.bottomRow.hasNextConnection = !!this.block_.nextConnection;

    const followsStatement =
      this.block_.inputList.length &&
      this.block_.inputList[this.block_.inputList.length - 1] instanceof
        StatementInput;

    // This is the minimum height for the row. If one of its elements has a
    // greater height it will be overwritten in the compute pass.
    if (followsStatement) {
      this.bottomRow.minHeight =
        this.constants_.BOTTOM_ROW_AFTER_STATEMENT_MIN_HEIGHT;
    } else {
      this.bottomRow.minHeight = this.constants_.BOTTOM_ROW_MIN_HEIGHT;
    }

    const leftSquareCorner = this.bottomRow.hasLeftSquareCorner(this.block_);

    if (leftSquareCorner) {
      this.bottomRow.elements.push(new SquareCorner(this.constants_));
    } else {
      this.bottomRow.elements.push(new RoundCorner(this.constants_));
    }

    if (this.bottomRow.hasNextConnection) {
      this.bottomRow.connection = new NextConnection(
        this.constants_,
        this.block_.nextConnection as RenderedConnection,
      );
      this.bottomRow.elements.push(this.bottomRow.connection);
    }

    const rightSquareCorner = this.bottomRow.hasRightSquareCorner(this.block_);

    if (rightSquareCorner) {
      this.bottomRow.elements.push(new SquareCorner(this.constants_, 'right'));
    } else {
      this.bottomRow.elements.push(new RoundCorner(this.constants_, 'right'));
    }
  }

  /**
   * Add an input element to the active row, if needed, and record the type of
   * the input on the row.
   *
   * @param input The input to record information about.
   * @param activeRow The row that is currently being populated.
   */
  protected addInput_(input: Input, activeRow: Row) {
    // Non-dummy inputs have visual representations onscreen.
    if (this.isInline && input instanceof ValueInput) {
      activeRow.elements.push(new InlineInput(this.constants_, input));
      activeRow.hasInlineInput = true;
    } else if (input instanceof StatementInput) {
      activeRow.elements.push(
        new StatementInputMeasurable(this.constants_, input),
      );
      activeRow.hasStatement = true;
    } else if (input instanceof ValueInput) {
      activeRow.elements.push(new ExternalValueInput(this.constants_, input));
      activeRow.hasExternalInput = true;
    } else if (input instanceof DummyInput || input instanceof EndRowInput) {
      // Dummy and end-row inputs have no visual representation, but the
      // information is still important.
      activeRow.minHeight = Math.max(
        activeRow.minHeight,
        input.getSourceBlock() && input.getSourceBlock()!.isShadow()
          ? this.constants_.DUMMY_INPUT_SHADOW_MIN_HEIGHT
          : this.constants_.DUMMY_INPUT_MIN_HEIGHT,
      );
      activeRow.hasDummyInput = true;
    }
    if (activeRow.align === null) {
      activeRow.align = input.align;
    }
  }

  /**
   * Decide whether to start a new row between the two Blockly.Inputs.
   *
   * @param currInput The current input.
   * @param prevInput The previous input.
   * @returns True if the current input should be rendered on a new row.
   */
  protected shouldStartNewRow_(currInput: Input, prevInput?: Input): boolean {
    // If this is the first input, just add to the existing row.
    // That row is either empty or has some icons in it.
    if (!prevInput) {
      return false;
    }
    // If the previous input was an end-row input, then any following input
    // should always be rendered on the next row.
    if (prevInput instanceof EndRowInput) {
      return true;
    }
    // A statement input or an input following one always gets a new row.
    if (
      currInput instanceof StatementInput ||
      prevInput instanceof StatementInput
    ) {
      return true;
    }
    // Value inputs, dummy inputs, and any input following an external value
    // input get a new row if inputs are not inlined.
    if (
      currInput instanceof ValueInput ||
      currInput instanceof DummyInput ||
      prevInput instanceof ValueInput
    ) {
      return !this.isInline;
    }
    return false;
  }

  /** Add horizontal spacing between and around elements within each row. */
  protected addElemSpacing_() {
    for (let i = 0, row; (row = this.rows[i]); i++) {
      const oldElems = row.elements;
      row.elements = [];
      // No spacing needed before the corner on the top row or the bottom row.
      if (row.startsWithElemSpacer()) {
        // There's a spacer before the first element in the row.
        row.elements.push(
          new InRowSpacer(
            this.constants_,
            this.getInRowSpacing_(null, oldElems[0]),
          ),
        );
      }
      if (!oldElems.length) {
        continue;
      }
      for (let e = 0; e < oldElems.length - 1; e++) {
        row.elements.push(oldElems[e]);
        const spacing = this.getInRowSpacing_(oldElems[e], oldElems[e + 1]);
        row.elements.push(new InRowSpacer(this.constants_, spacing));
      }
      row.elements.push(oldElems[oldElems.length - 1]);
      if (row.endsWithElemSpacer()) {
        // There's a spacer after the last element in the row.
        row.elements.push(
          new InRowSpacer(
            this.constants_,
            this.getInRowSpacing_(oldElems[oldElems.length - 1], null),
          ),
        );
      }
    }
  }

  /**
   * Calculate the width of a spacer element in a row based on the previous and
   * next elements in that row.  For instance, extra padding is added between
   * two editable fields.
   *
   * @param prev The element before the spacer.
   * @param next The element after the spacer.
   * @returns The size of the spacing between the two elements.
   */
  protected getInRowSpacing_(
    prev: Measurable | null,
    next: Measurable | null,
  ): number {
    if (!prev) {
      // Statement input padding.
      if (next && Types.isStatementInput(next)) {
        return this.constants_.STATEMENT_INPUT_PADDING_LEFT;
      }
    }
    // Between inputs and the end of the row.
    if (prev && Types.isInput(prev) && !next) {
      if (Types.isExternalInput(prev)) {
        return this.constants_.NO_PADDING;
      } else if (Types.isInlineInput(prev)) {
        return this.constants_.LARGE_PADDING;
      } else if (Types.isStatementInput(prev)) {
        return this.constants_.NO_PADDING;
      }
    }

    // Spacing between a square corner and a previous or next connection
    if (prev && Types.isLeftSquareCorner(prev) && next) {
      if (Types.isPreviousConnection(next) || Types.isNextConnection(next)) {
        return next.notchOffset;
      }
    }

    // Spacing between a rounded corner and a previous or next connection.
    if (prev && Types.isLeftRoundedCorner(prev) && next) {
      if (Types.isPreviousConnection(next) || Types.isNextConnection(next)) {
        return next.notchOffset - this.constants_.CORNER_RADIUS;
      }
    }

    // Don't add padding after zero-width fields.
    if (prev && Types.isField(prev) && prev.width === 0) {
      return this.constants_.NO_PADDING;
    }

    return this.constants_.MEDIUM_PADDING;
  }

  /**
   * Figure out where the right edge of the block and right edge of statement
   * inputs should be placed.
   */
  protected computeBounds_() {
    let widestStatementRowFields = 0;
    let blockWidth = 0;
    let widestRowWithConnectedBlocks = 0;
    for (let i = 0, row; (row = this.rows[i]); i++) {
      row.measure();
      blockWidth = Math.max(blockWidth, row.width);
      if (row.hasStatement) {
        const statementInput = row.getLastInput();
        const innerWidth = row.width - (statementInput?.width ?? 0);
        widestStatementRowFields = Math.max(
          widestStatementRowFields,
          innerWidth,
        );
      }
      widestRowWithConnectedBlocks = Math.max(
        widestRowWithConnectedBlocks,
        row.widthWithConnectedBlocks,
      );
    }

    this.statementEdge = widestStatementRowFields;
    this.width = blockWidth;

    for (let i = 0, row; (row = this.rows[i]); i++) {
      if (row.hasStatement) {
        row.statementEdge = this.statementEdge;
      }
    }

    this.widthWithChildren = Math.max(blockWidth, widestRowWithConnectedBlocks);

    if (this.outputConnection) {
      this.startX = this.outputConnection.width;
      this.width += this.outputConnection.width;
      this.widthWithChildren += this.outputConnection.width;
    }
  }

  /**
   * Extra spacing may be necessary to make sure that the right sides of all
   * rows line up.  This can only be calculated after a first pass to calculate
   * the sizes of all rows.
   */
  protected alignRowElements_() {
    for (let i = 0, row; (row = this.rows[i]); i++) {
      if (row.hasStatement) {
        this.alignStatementRow_(row as InputRow);
      } else {
        const currentWidth = row.width;
        const desiredWidth = this.getDesiredRowWidth_(row);
        const missingSpace = desiredWidth - currentWidth;
        if (missingSpace > 0) {
          this.addAlignmentPadding_(row, missingSpace);
        }
        if (Types.isTopOrBottomRow(row)) {
          row.widthWithConnectedBlocks = row.width;
        }
      }
    }
  }

  /**
   * Calculate the desired width of an input row.
   *
   * @param _row The input row.
   * @returns The desired width of the input row.
   */
  protected getDesiredRowWidth_(_row: Row): number {
    return this.width - this.startX;
  }

  /**
   * Modify the given row to add the given amount of padding around its fields.
   * The exact location of the padding is based on the alignment property of the
   * last input in the field.
   *
   * @param row The row to add padding to.
   * @param missingSpace How much padding to add.
   */
  protected addAlignmentPadding_(row: Row, missingSpace: number) {
    const firstSpacer = row.getFirstSpacer();
    const lastSpacer = row.getLastSpacer();
    if (row.hasExternalInput || row.hasStatement) {
      row.widthWithConnectedBlocks += missingSpace;
    }

    // Decide where the extra padding goes.
    if (row.align === Align.LEFT && lastSpacer) {
      // Add padding to the end of the row.
      lastSpacer.width += missingSpace;
    } else if (row.align === Align.CENTRE && firstSpacer && lastSpacer) {
      // Split the padding between the beginning and end of the row.
      firstSpacer.width += missingSpace / 2;
      lastSpacer.width += missingSpace / 2;
    } else if (row.align === Align.RIGHT && firstSpacer) {
      // Add padding at the beginning of the row.
      firstSpacer.width += missingSpace;
    } else if (lastSpacer) {
      // Default to left-aligning.
      lastSpacer.width += missingSpace;
    } else {
      return;
    }
    row.width += missingSpace;
  }

  /**
   * Align the elements of a statement row based on computed bounds.
   * Unlike other types of rows, statement rows add space in multiple places.
   *
   * @param row The statement row to resize.
   */
  protected alignStatementRow_(row: InputRow) {
    const statementInput = row.getLastInput();
    if (!statementInput) return;
    let currentWidth = row.width - statementInput.width;
    let desiredWidth = this.statementEdge;
    // Add padding before the statement input.
    const missingSpace = desiredWidth - currentWidth;
    if (missingSpace > 0) {
      this.addAlignmentPadding_(row, missingSpace);
    }
    // Also widen the statement input to reach to the right side of the
    // block. Note that this does not add padding.
    currentWidth = row.width;
    desiredWidth = this.getDesiredRowWidth_(row);
    statementInput.width += desiredWidth - currentWidth;
    statementInput.height = Math.max(statementInput.height, row.height);
    row.width += desiredWidth - currentWidth;
    row.widthWithConnectedBlocks = Math.max(
      row.width,
      this.statementEdge + row.connectedBlockWidths,
    );
  }

  /** Add spacers between rows and set their sizes. */
  protected addRowSpacing_() {
    const oldRows = this.rows;
    this.rows = [];

    for (let r = 0; r < oldRows.length; r++) {
      this.rows.push(oldRows[r]);
      if (r !== oldRows.length - 1) {
        this.rows.push(this.makeSpacerRow_(oldRows[r], oldRows[r + 1]));
      }
    }
  }

  /**
   * Create a spacer row to go between prev and next, and set its size.
   *
   * @param prev The previous row.
   * @param next The next row.
   * @returns The newly created spacer row.
   */
  protected makeSpacerRow_(prev: Row, next: Row): SpacerRow {
    const height = this.getSpacerRowHeight_(prev, next);
    const width = this.getSpacerRowWidth_(prev, next);
    const spacer = new SpacerRow(this.constants_, height, width);
    if (prev.hasStatement) {
      spacer.followsStatement = true;
    }
    if (next.hasStatement) {
      spacer.precedesStatement = true;
    }
    return spacer;
  }

  /**
   * Calculate the width of a spacer row.
   *
   * @param _prev The row before the spacer.
   * @param _next The row after the spacer.
   * @returns The desired width of the spacer row between these two rows.
   */
  protected getSpacerRowWidth_(_prev: Row, _next: Row): number {
    return this.width - this.startX;
  }

  /**
   * Calculate the height of a spacer row.
   *
   * @param _prev The row before the spacer.
   * @param _next The row after the spacer.
   * @returns The desired height of the spacer row between these two rows.
   */
  protected getSpacerRowHeight_(_prev: Row, _next: Row): number {
    return this.constants_.MEDIUM_PADDING;
  }

  /**
   * Calculate the centerline of an element in a rendered row.
   * This base implementation puts the centerline at the middle of the row
   * vertically, with no special cases.  You will likely need extra logic to
   * handle (at minimum) top and bottom rows.
   *
   * @param row The row containing the element.
   * @param elem The element to place.
   * @returns The desired centerline of the given element, as an offset from the
   *     top left of the block.
   */
  protected getElemCenterline_(row: Row, elem: Measurable): number {
    if (Types.isSpacer(elem)) {
      return row.yPos + elem.height / 2;
    }
    if (Types.isBottomRow(row)) {
      const baseline = row.yPos + row.height - row.descenderHeight;
      if (Types.isNextConnection(elem)) {
        return baseline + elem.height / 2;
      }
      return baseline - elem.height / 2;
    }
    if (Types.isTopRow(row)) {
      if (Types.isHat(elem)) {
        return row.capline - elem.height / 2;
      }
      return row.capline + elem.height / 2;
    }
    return row.yPos + row.height / 2;
  }

  /**
   * Record final position information on elements on the given row, for use in
   * drawing.  At minimum this records xPos and centerline on each element.
   *
   * @param row The row containing the elements.
   */
  protected recordElemPositions_(row: Row) {
    let xCursor = row.xPos;
    for (let j = 0, elem; (elem = row.elements[j]); j++) {
      // Now that row heights are finalized, make spacers use the row height.
      if (Types.isSpacer(elem)) {
        elem.height = row.height;
      }
      elem.xPos = xCursor;
      elem.centerline = this.getElemCenterline_(row, elem);
      xCursor += elem.width;
    }
  }

  /**
   * Make any final changes to the rendering information object.  In particular,
   * store the y position of each row, and record the height of the full block.
   */
  protected finalize_() {
    // Performance note: this could be combined with the draw pass, if the time
    // that this takes is excessive.  But it shouldn't be, because it only
    // accesses and sets properties that already exist on the objects.
    let widestRowWithConnectedBlocks = 0;
    let yCursor = 0;
    for (let i = 0, row; (row = this.rows[i]); i++) {
      row.yPos = yCursor;
      row.xPos = this.startX;
      yCursor += row.height;

      widestRowWithConnectedBlocks = Math.max(
        widestRowWithConnectedBlocks,
        row.widthWithConnectedBlocks,
      );
      this.recordElemPositions_(row);
    }
    if (this.outputConnection && this.block_.nextConnection) {
      const target = this.block_.nextConnection.targetBlock();
      if (target) {
        // Include width of connected block in value to stack width measurement.
        widestRowWithConnectedBlocks = Math.max(
          widestRowWithConnectedBlocks,
          target.getHeightWidth().width,
        );
      }
    }

    this.widthWithChildren = widestRowWithConnectedBlocks + this.startX;

    this.height = yCursor;
    this.startY = this.topRow.capline;
    this.bottomRow.baseline = yCursor - this.bottomRow.descenderHeight;
  }

  /** Returns the connection measurable associated with the given connection. */
  getMeasureableForConnection(conn: RenderedConnection): Connection | null {
    if (this.outputConnection?.connectionModel === conn) {
      return this.outputConnection;
    }

    for (const row of this.rows) {
      for (const elem of row.elements) {
        if (elem instanceof Connection && elem.connectionModel === conn) {
          return elem;
        }
      }
    }

    return null;
  }
}
