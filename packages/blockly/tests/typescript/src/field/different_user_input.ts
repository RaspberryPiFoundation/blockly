/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Test: Should allow a subclass of Field to have different setValue and
 * constructor input type than the type that is stored.
 */

import {Field, FieldValidator, fieldRegistry} from 'blockly-test/core';

interface Cell {
  cellId: string;
}

interface CellGroup {
  cells: Cell[];
}

type FieldMitosisValidator = FieldValidator<CellGroup>;

class FieldMitosis extends Field<CellGroup> {
  constructor(cell: Cell, validator: FieldMitosisValidator) {
    super(Field.SKIP_SETUP);

    this.setValue(cell);
    this.setValidator(validator);
  }

  // Overwritten Field methods.

  protected doClassValidation_(newCell?: unknown): CellGroup | null {
    if (!this.isCell(newCell)) return null;

    const cellGroup = this.getValue() ?? {cells: []};
    cellGroup.cells.push(newCell);
    return cellGroup;
  }

  // Example-specific methods.

  private isCell(maybeCell: unknown): maybeCell is Cell {
    if (!maybeCell) return false;
    const couldBeCell = maybeCell as {[key: string]: unknown};
    return 'cellId' in couldBeCell && typeof couldBeCell.cellId === 'string';
  }

  /**
   * The cell divides, creating two new cells!
   */
  doMitosis(): void {
    const cellGroup = this.getValue();
    if (!cellGroup) return;

    const cells = cellGroup.cells.flatMap((cell) => {
      const leftCell: Cell = {cellId: `${cell.cellId}-left`};
      const rightCell: Cell = {cellId: `${cell.cellId}-right`};
      return [leftCell, rightCell];
    });
    this.value_ = {cells};
  }
}

fieldRegistry.register('field_mitosis', FieldMitosis);

// Example use of the class.

function cellValidator(cellGroup: CellGroup): CellGroup | undefined {
  // The cell group is good! Use it as is.
  if (cellGroup.cells.length > 0) return undefined;

  // Uh oh! No cells.
  const emergencyCell: Cell = {cellId: 'emergency-cell'};
  return {cells: [emergencyCell]};
}

const cellField = new FieldMitosis({cellId: 'cell-A'}, cellValidator);
cellField.setValue({cellId: 'cell-B'});
cellField.doMitosis();
