/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Grid dropdown field.
 * @author kozbial@google.com (Monica Kozbial)
 */

import * as Blockly from 'blockly/core';
import {Grid} from './grid';
import type {GridItem} from './grid_item';

/**
 * A config object for defining a field grid dropdown.
 */
export interface FieldGridDropdownConfig extends Blockly.FieldDropdownConfig {
  columns?: string | number;
  primaryColour?: string;
  borderColour?: string;
}

/**
 * Construct a FieldGridDropdown from a JSON arg object.
 */
export interface FieldGridDropdownFromJsonConfig extends FieldGridDropdownConfig {
  options?: Blockly.MenuGenerator;
}

type FieldGridDropdownValidator = Blockly.FieldDropdownValidator;

/**
 * Grid dropdown field.
 */
export class FieldGridDropdown extends Blockly.FieldDropdown {
  /**
   * The number of columns in the dropdown grid. Must be an integer value
   * greater than 0. Defaults to 3.
   */
  private columns = 3;

  private primaryColour?: string;

  private borderColour?: string;

  /** Object representing the grid of choices shown in the dropdown. */
  private grid: Grid | null = null;

  protected override ariaTypeName = Blockly.Msg['ARIA_TYPE_FIELD_GRID'];

  /**
   * Class for an grid dropdown field.
   *
   * @param menuGenerator A non-empty array of options for a dropdown list,
   *   or a function which generates these options.
   * @param validator A function that is called to validate
   *  changes to the field's value. Takes in a language-neutral dropdown
   *  option & returns a validated language-neutral dropdown option, or null
   *  to abort the change.
   * @param config A map of options used to configure the field.
   *  See the [field creation documentation]{@link
   * https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/dropdown#creation}
   *  for a list of properties this parameter supports.
   * @extends {Blockly.Field}
   * @constructor
   * @throws {TypeError} If `menuGenerator` options are incorrectly structured.
   */
  constructor(
    menuGenerator: Blockly.MenuGenerator,
    validator?: FieldGridDropdownValidator,
    config?: FieldGridDropdownConfig,
  ) {
    super(menuGenerator, validator, config);

    if (config?.columns) {
      this.setColumns(parseInt(`${config.columns}`));
    }

    if (config && config.primaryColour) {
      this.primaryColour = config.primaryColour;
    }

    if (config && config.borderColour) {
      this.borderColour = config.borderColour;
    }
  }

  /**
   * Constructs a FieldGridDropdown from a JSON arg object.
   *
   * @param config A JSON object with options.
   * @returns The new field instance.
   * @package
   * @nocollapse
   */
  static fromJson(config: FieldGridDropdownFromJsonConfig) {
    if (!config.options) {
      throw new Error(
        'options are required for the dropdown field. The ' +
          'options property must be assigned an array of ' +
          '[humanReadableValue, languageNeutralValue] tuples.',
      );
    }
    // `this` might be a subclass of FieldDropdown if that class doesn't
    // override the static fromJson method.
    return new this(config.options, undefined, config);
  }

  /**
   * Sets the number of columns on the grid. Updates the styling to reflect.
   *
   * @param columns The number of columns. Is rounded to
   *    an integer value and must be greater than 0. Invalid
   *    values are ignored.
   */
  setColumns(columns: number) {
    if (!isNaN(columns) && columns >= 1) {
      this.columns = columns;
      // If the field is currently being shown, reload the grid.
      if (
        Blockly.DropDownDiv.getOwner() === this &&
        Blockly.DropDownDiv.isVisible()
      ) {
        this.grid?.dispose();
        this.showEditor_();
      }
    }
  }

  /**
   * Updates the ARIA roles and label for this field.
   */
  override recomputeAriaContext(): boolean {
    const shouldCustomize = super.recomputeAriaContext();
    if (!shouldCustomize) return false;
    const focusableElement = this.getFocusableElement();
    Blockly.utils.aria.setState(
      focusableElement,
      Blockly.utils.aria.State.HASPOPUP,
      'grid',
    );
    Blockly.utils.aria.setState(
      focusableElement,
      Blockly.utils.aria.State.EXPANDED,
      !!this.grid,
    );
    return true;
  }

  /* eslint-disable @typescript-eslint/naming-convention */
  /**
   * Create a dropdown menu under the text.
   *
   * @param e Optional mouse event that triggered the field to open, or
   *  undefined if triggered programmatically.
   */
  protected showEditor_(e?: MouseEvent) {
    Blockly.DropDownDiv.clearContent();
    const rtl = !!this.getSourceBlock()?.workspace.RTL;
    this.grid = new Grid(
      Blockly.DropDownDiv.getContentDiv(),
      this.getOptions(false),
      this.columns,
      rtl,
      (selectedItem: GridItem) => {
        Blockly.DropDownDiv.hideIfOwner(this);
        this.setValue(selectedItem.getValue());
      },
    );

    Blockly.DropDownDiv.getContentDiv().classList.add(
      'blocklyFieldGridContainer',
    );

    const colours = this.getColours();
    if (colours && colours.border) {
      Blockly.DropDownDiv.setColour(colours.primary, colours.border);
    }

    Blockly.DropDownDiv.showPositionedByField(
      this,
      this.dropdownDispose_.bind(this),
    );

    const selectedValue = this.getValue();
    if (selectedValue) {
      this.grid.setSelectedValue(selectedValue);
    }
    this.recomputeAriaContext();
  }

  /**
   * Disposes of events and DOM-references belonging to the dropdown editor.
   */
  protected override dropdownDispose_() {
    // Keep aria-expanded accurate on later recomputes.
    this.grid = null;
    super.dropdownDispose_();
    this.recomputeAriaContext();
  }

  /**
   * Updates the field's value to the given value.
   *
   * @param newValue The new value for this field.
   */
  protected override doValueUpdate_(newValue: string) {
    super.doValueUpdate_(newValue);
    this.grid?.setSelectedValue(newValue);
  }

  /**
   * Determine the colours for the dropdowndiv. The dropdown should match block
   * colour unless other colours are specified in the config.
   *
   * @returns The colours to set for the dropdowndiv.
   */
  private getColours() {
    if (this.primaryColour && this.borderColour) {
      return {
        primary: this.primaryColour,
        border: this.borderColour,
      };
    }

    const sourceBlock = this.getSourceBlock();
    if (!(sourceBlock instanceof Blockly.BlockSvg)) return;

    const colourSource = sourceBlock.isShadow()
      ? sourceBlock.getParent()
      : sourceBlock;
    if (!colourSource) return;

    return {
      primary: this.primaryColour ?? colourSource.getColour(),
      border: this.borderColour ?? colourSource.getColourTertiary(),
    };
  }
}

Blockly.fieldRegistry.register('field_grid_dropdown', FieldGridDropdown);

/**
 * CSS for grid field.
 */
Blockly.Css.register(`
   .blocklyFieldGridContainer {
     padding: 7px;
     overflow: auto;
   }

  .blocklyFieldGrid {
    display: grid;
    grid-gap: 7px;
    grid-template-columns: repeat(var(--grid-columns), min-content);
  }

 .blocklyFieldGrid .blocklyFieldGridItem {
   border: 1px solid rgba(1, 1, 1, 0.5);
   border-radius: 4px;
   color: white;
   min-width: auto;
   background: none;
   white-space: nowrap;
   cursor: pointer;
   padding: 6px 15px;
 }

 .blocklyFieldGrid .blocklyFieldGridRow {
   display: contents;
 }

 .blocklyFieldGrid .blocklyFieldGridItem.blocklyFieldGridItemSelected {
   background-color: rgba(1, 1, 1, 0.25);
 }

 .blocklyFieldGrid .blocklyFieldGridItem:focus {
   box-shadow: 0 0 0 4px hsla(0, 0%, 100%, .2);
   outline: none;
 }
 `);
