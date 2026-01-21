/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.Types

import type {Measurable} from './base.js';
import type {BottomRow} from './bottom_row.js';
import type {ExternalValueInput} from './external_value_input.js';
import type {Field} from './field.js';
import type {Hat} from './hat.js';
import type {Icon} from './icon.js';
import type {InRowSpacer} from './in_row_spacer.js';
import type {InlineInput} from './inline_input.js';
import type {InputConnection} from './input_connection.js';
import type {InputRow} from './input_row.js';
import type {JaggedEdge} from './jagged_edge.js';
import type {NextConnection} from './next_connection.js';
import type {PreviousConnection} from './previous_connection.js';
import type {RoundCorner} from './round_corner.js';
import type {Row} from './row.js';
import type {SpacerRow} from './spacer_row.js';
import type {SquareCorner} from './square_corner.js';
import type {StatementInput} from './statement_input.js';
import type {TopRow} from './top_row.js';

/**
 * Types of rendering elements.
 */
class TypesContainer {
  // This class is very non-idiomatic for typescript, so we have to use
  // the Function type to make it happy.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  [index: string]: number | Function;

  NONE = 0; // None
  FIELD = 1 << 0; // Field.
  HAT = 1 << 1; // Hat.
  ICON = 1 << 2; // Icon.
  SPACER = 1 << 3; // Spacer.
  BETWEEN_ROW_SPACER = 1 << 4; // Between Row Spacer.
  IN_ROW_SPACER = 1 << 5; // In Row Spacer.
  EXTERNAL_VALUE_INPUT = 1 << 6; // External Value Input.
  INPUT = 1 << 7; // Input.
  INLINE_INPUT = 1 << 8; // Inline Input.
  STATEMENT_INPUT = 1 << 9; // Statement Input.
  CONNECTION = 1 << 10; // Connection.
  PREVIOUS_CONNECTION = 1 << 11; // Previous Connection.
  NEXT_CONNECTION = 1 << 12; // Next Connection.
  OUTPUT_CONNECTION = 1 << 13; // Output Connection.
  CORNER = 1 << 14; // Corner.
  LEFT_SQUARE_CORNER = 1 << 15; // Square Corner.
  LEFT_ROUND_CORNER = 1 << 16; // Round Corner.
  RIGHT_SQUARE_CORNER = 1 << 17; // Right Square Corner.
  RIGHT_ROUND_CORNER = 1 << 18; // Right Round Corner.
  JAGGED_EDGE = 1 << 19; // Jagged Edge.
  ROW = 1 << 20; // Row.
  TOP_ROW = 1 << 21; // Top Row.
  BOTTOM_ROW = 1 << 22; // Bottom Row.
  INPUT_ROW = 1 << 23; // Input Row.

  /**
   * A Left Corner Union Type.
   */
  LEFT_CORNER = this.LEFT_SQUARE_CORNER | this.LEFT_ROUND_CORNER;

  /**
   * A Right Corner Union Type.
   */
  RIGHT_CORNER = this.RIGHT_SQUARE_CORNER | this.RIGHT_ROUND_CORNER;

  /**
   * Next flag value to use for custom rendering element types.
   * This must be updated to reflect the next enum flag value
   * to use if additional elements are added to
   * `Types`.
   */
  nextTypeValue_ = 1 << 24;

  /**
   * Get the enum flag value of an existing type or register a new type.
   *
   * @param type The name of the type.
   * @returns The enum flag value associated with that type.
   */
  getType(type: string): number {
    if (!Object.prototype.hasOwnProperty.call(this, type)) {
      this[type] = this.nextTypeValue_;
      this.nextTypeValue_ <<= 1;
    }
    return this[type] as number;
  }

  /**
   * Whether a measurable stores information about a field.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a field.
   */
  isField(elem: Measurable): elem is Field {
    return (elem.type & this.FIELD) >= 1;
  }

  /**
   * Whether a measurable stores information about a hat.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a hat.
   */
  isHat(elem: Measurable): elem is Hat {
    return (elem.type & this.HAT) >= 1;
  }

  /**
   * Whether a measurable stores information about an icon.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about an icon.
   */
  isIcon(elem: Measurable): elem is Icon {
    return (elem.type & this.ICON) >= 1;
  }

  /**
   * Whether a measurable stores information about a spacer.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a spacer.
   */
  isSpacer(elem: Measurable | Row): elem is SpacerRow | InRowSpacer {
    return (elem.type & this.SPACER) >= 1;
  }

  /**
   * Whether a measurable stores information about an in-row spacer.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about an in-row spacer.
   */
  isInRowSpacer(elem: Measurable): elem is InRowSpacer {
    return (elem.type & this.IN_ROW_SPACER) >= 1;
  }

  /**
   * Whether a row is a spacer row.
   *
   * @param row The row to check.
   * @returns True if the row is a spacer row.
   */
  isSpacerRow(row: Row): row is SpacerRow {
    return (row.type & this.BETWEEN_ROW_SPACER) >= 1;
  }

  /**
   * Whether a measurable stores information about an input.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about an input.
   */
  isInput(elem: Measurable): elem is InputConnection {
    return (elem.type & this.INPUT) >= 1;
  }

  /**
   * Whether a measurable stores information about an external input.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about an external input.
   */
  isExternalInput(elem: Measurable): elem is ExternalValueInput {
    return (elem.type & this.EXTERNAL_VALUE_INPUT) >= 1;
  }

  /**
   * Whether a measurable stores information about an inline input.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about an inline input.
   */
  isInlineInput(elem: Measurable): elem is InlineInput {
    return (elem.type & this.INLINE_INPUT) >= 1;
  }

  /**
   * Whether a measurable stores information about a statement input.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a statement input.
   */
  isStatementInput(elem: Measurable): elem is StatementInput {
    return (elem.type & this.STATEMENT_INPUT) >= 1;
  }

  /**
   * Whether a measurable stores information about a previous connection.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a previous connection.
   */
  isPreviousConnection(elem: Measurable): elem is PreviousConnection {
    return (elem.type & this.PREVIOUS_CONNECTION) >= 1;
  }

  /**
   * Whether a measurable stores information about a next connection.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a next connection.
   */
  isNextConnection(elem: Measurable): elem is NextConnection {
    return (elem.type & this.NEXT_CONNECTION) >= 1;
  }

  /**
   * Whether a measurable stores information about a previous or next
   * connection.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a previous or next
   *     connection.
   */
  isPreviousOrNextConnection(
    elem: Measurable,
  ): elem is PreviousConnection | NextConnection {
    return this.isPreviousConnection(elem) || this.isNextConnection(elem);
  }

  isRoundCorner(elem: Measurable): elem is RoundCorner {
    return (
      (elem.type & this.LEFT_ROUND_CORNER) >= 1 ||
      (elem.type & this.RIGHT_ROUND_CORNER) >= 1
    );
  }

  /**
   * Whether a measurable stores information about a left round corner.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a left round corner.
   */
  isLeftRoundedCorner(elem: Measurable): boolean {
    return (
      this.isRoundCorner(elem) && (elem.type & this.LEFT_ROUND_CORNER) >= 1
    );
  }

  /**
   * Whether a measurable stores information about a right round corner.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a right round corner.
   */
  isRightRoundedCorner(elem: Measurable): boolean {
    return (
      this.isRoundCorner(elem) && (elem.type & this.RIGHT_ROUND_CORNER) >= 1
    );
  }

  /**
   * Whether a measurable stores information about a left square corner.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a left square corner.
   */
  isLeftSquareCorner(elem: Measurable): boolean {
    return (elem.type & this.LEFT_SQUARE_CORNER) >= 1;
  }

  /**
   * Whether a measurable stores information about a right square corner.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a right square corner.
   */
  isRightSquareCorner(elem: Measurable): boolean {
    return (elem.type & this.RIGHT_SQUARE_CORNER) >= 1;
  }

  /**
   * Whether a measurable stores information about a corner.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a corner.
   */
  isCorner(elem: Measurable): elem is SquareCorner | RoundCorner {
    return (elem.type & this.CORNER) >= 1;
  }

  /**
   * Whether a measurable stores information about a jagged edge.
   *
   * @param elem The element to check.
   * @returns 1 if the object stores information about a jagged edge.
   */
  isJaggedEdge(elem: Measurable): elem is JaggedEdge {
    return (elem.type & this.JAGGED_EDGE) >= 1;
  }

  /**
   * Whether a measurable stores information about a row.
   *
   * @param row The row to check.
   * @returns 1 if the object stores information about a row.
   */
  isRow(row: Row): row is Row {
    return (row.type & this.ROW) >= 1;
  }

  /**
   * Whether a measurable stores information about a between-row spacer.
   *
   * @param row The row to check.
   * @returns 1 if the object stores information about a between-row spacer.
   */
  isBetweenRowSpacer(row: Row): row is SpacerRow {
    return (row.type & this.BETWEEN_ROW_SPACER) >= 1;
  }

  /**
   * Whether a measurable stores information about a top row.
   *
   * @param row The row to check.
   * @returns 1 if the object stores information about a top row.
   */
  isTopRow(row: Row): row is TopRow {
    return (row.type & this.TOP_ROW) >= 1;
  }

  /**
   * Whether a measurable stores information about a bottom row.
   *
   * @param row The row to check.
   * @returns 1 if the object stores information about a bottom row.
   */
  isBottomRow(row: Row): row is BottomRow {
    return (row.type & this.BOTTOM_ROW) >= 1;
  }

  /**
   * Whether a measurable stores information about a top or bottom row.
   *
   * @param row The row to check.
   * @returns 1 if the object stores information about a top or bottom row.
   */
  isTopOrBottomRow(row: Row): row is TopRow | BottomRow {
    return this.isTopRow(row) || this.isBottomRow(row);
  }

  /**
   * Whether a measurable stores information about an input row.
   *
   * @param row The row to check.
   * @returns 1 if the object stores information about an input row.
   */
  isInputRow(row: Row): row is InputRow {
    return (row.type & this.INPUT_ROW) >= 1;
  }
}

export const Types = new TypesContainer();
