/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Colour input field.
 */

import * as Blockly from 'blockly/core';
import {
  FieldGridDropdown,
  FieldGridDropdownConfig,
  FieldGridDropdownFromJsonConfig,
} from '@blockly/field-grid-dropdown';

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * An array of colour strings for the palette.
 * Copied from goog.ui.ColorPicker.SIMPLE_GRID_COLORS
 */
const DEFAULT_COLOURS: Record<string, string> = {
  // greys
  '#ffffff': 'White',
  '#cccccc': 'Light Grey',
  '#c0c0c0': 'Silver',
  '#999999': 'Grey',
  '#666666': 'Dark Grey',
  '#333333': 'Charcoal',
  '#000000': 'Black',
  // reds
  '#ffcccc': 'Pale Red',
  '#ff6666': 'Light Red',
  '#ff0000': 'Red',
  '#cc0000': 'Dark Red',
  '#990000': 'Darker Red',
  '#660000': 'Maroon',
  '#330000': 'Darkest Red',
  // oranges
  '#ffcc99': 'Peach',
  '#ff9966': 'Light Orange',
  '#ff9900': 'Orange',
  '#ff6600': 'Bright Orange',
  '#cc6600': 'Dark Orange',
  '#993300': 'Rust',
  '#663300': 'Brown',
  // yellows
  '#ffff99': 'Light Yellow',
  '#ffff66': 'Pale Yellow',
  '#ffcc66': 'Light Gold',
  '#ffcc33': 'Gold',
  '#cc9933': 'Goldenrod',
  '#996633': 'Light Brown',
  '#663333': 'Dark Brown',
  // olives
  '#ffffcc': 'Cream',
  '#ffff33': 'Bright Yellow',
  '#ffff00': 'Yellow',
  '#ffcc00': 'Amber',
  '#999900': 'Olive',
  '#666600': 'Dark Olive',
  '#333300': 'Darkest Olive',
  // greens
  '#99ff99': 'Light Green',
  '#66ff99': 'Mint',
  '#33ff33': 'Bright Green',
  '#33cc00': 'Green',
  '#009900': 'Dark Green',
  '#006600': 'Darker Green',
  '#003300': 'Darkest Green',
  // turquoises
  '#99ffff': 'Pale Cyan',
  '#33ffff': 'Bright Cyan',
  '#66cccc': 'Light Teal',
  '#00cccc': 'Turquoise',
  '#339999': 'Teal',
  '#336666': 'Dark Teal',
  '#003333': 'Darkest Teal',
  // blues
  '#ccffff': 'Pale Aqua',
  '#66ffff': 'Light Cyan',
  '#33ccff': 'Sky Blue',
  '#3366ff': 'Blue',
  '#3333ff': 'Bright Blue',
  '#000099': 'Dark Blue',
  '#000066': 'Navy',
  // purples
  '#ccccff': 'Pale Periwinkle',
  '#9999ff': 'Periwinkle',
  '#6666cc': 'Slate Blue',
  '#6633ff': 'Violet',
  '#6600cc': 'Purple',
  '#333399': 'Indigo',
  '#330099': 'Dark Indigo',
  // violets
  '#ffccff': 'Pale Magenta',
  '#ff99ff': 'Light Magenta',
  '#cc66cc': 'Orchid',
  '#cc33cc': 'Magenta',
  '#993399': 'Dark Magenta',
  '#663366': 'Plum',
  '#330033': 'Darkest Purple',
};
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Class for a colour input field.
 */
export class FieldColour extends FieldGridDropdown {
  /**
   * Used to tell if the field needs to be rendered the next time the block is
   * rendered.  Colour fields are statically sized, and only need to be
   * rendered at initialization.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override isDirty_ = false;

  protected override ariaTypeName = Blockly.Msg['ARIA_TYPE_FIELD_COLOUR'];

  /**
   * @param value The initial value of the field.  Should be in '#rrggbb'
   *     format.  Defaults to the first value in the default colour array.  Also
   *     accepts Field.SKIP_SETUP if you wish to skip setup (only used by
   *     subclasses that want to handle configuration and setting the field
   *     value after their own constructors have run).
   * @param validator A function that is called to validate changes to the
   *     field's value.  Takes in a colour string & returns a validated colour
   *     string ('#rrggbb' format), or null to abort the change.
   * @param config A map of options used to configure the field.
   *     See the [field creation documentation]{@link
   * https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/colour}
   * for a list of properties this parameter supports.
   */
  constructor(
    value?: string | typeof Blockly.Field.SKIP_SETUP,
    validator?: FieldColourValidator,
    config?: FieldColourConfig,
  ) {
    const swatches = makeSwatches(
      config?.colourOptions ?? Object.keys(DEFAULT_COLOURS),
      config?.colourTitles,
    );
    super(swatches, validator, {...config, columns: config?.columns ?? 7});

    if (value === Blockly.Field.SKIP_SETUP) return;
    this.setValue(value);
  }

  /**
   * FieldDropdown has complex behaviors for normalizing options that aren't
   * applicable here. Instead, just return the options as-is.
   *
   * @param options The options (colour swatches) to normalize.
   * @returns The colour swatches as-is.
   */
  protected override trimOptions(options: Blockly.MenuOption[]) {
    return {options};
  }

  /**
   * Configure the field based on the given map of options.
   *
   * @param config A map of options to configure the field based on.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override configure_(config: FieldColourConfig) {
    super.configure_(config);
    if (config.colourOptions) {
      this.setColours(config.colourOptions, config.colourTitles);
    }
  }

  /**
   * Create the block UI for this colour field.
   *
   * @internal
   */
  override initView() {
    const constants = this.getConstants();
    // This can't happen, but TypeScript thinks it can and lint forbids `!.`.
    if (!constants) throw Error('Constants not found');
    this.size_ = new Blockly.utils.Size(
      constants.FIELD_COLOUR_DEFAULT_WIDTH,
      constants.FIELD_COLOUR_DEFAULT_HEIGHT,
    );
    if (this.isFullBlockField()) {
      this.clickTarget_ = (this.sourceBlock_ as Blockly.BlockSvg).getSvgRoot();
    } else {
      this.createBorderRect_();
      this.getBorderRect().style['fillOpacity'] = '1';
    }

    if (this.fieldGroup_) {
      this.fieldGroup_.classList.add('blocklyField');
    }

    this.recomputeAriaContext();
  }

  /**
   * Shows the colour picker dropdown attached to the field.
   *
   * @param e The event that triggered display of the colour picker dropdown.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override showEditor_(e?: MouseEvent) {
    super.showEditor_(e);
    Blockly.DropDownDiv.getContentDiv().classList.add('blocklyFieldColour');
    Blockly.DropDownDiv.repositionForWindowResize();
  }

  /**
   * Defines whether this field should take up the full block or not.
   *
   * @returns True if this field should take up the full block. False otherwise.
   */
  override isFullBlockField(): boolean {
    const block = this.getSourceBlock();
    if (!block) throw new Blockly.UnattachedFieldError();

    const constants = this.getConstants();
    return (
      this.blockIsSimpleReporter() &&
      Boolean(constants?.FIELD_COLOUR_FULL_BLOCK)
    );
  }

  /**
   * @returns True if the source block is a value block with a single editable
   *     field.
   * @internal
   */
  blockIsSimpleReporter(): boolean {
    const block = this.getSourceBlock();
    if (!block) throw new Blockly.UnattachedFieldError();

    if (!block.outputConnection) return false;

    for (const input of block.inputList) {
      if (input.connection || input.fieldRow.length > 1) return false;
    }
    return true;
  }

  /**
   * Updates text field to match the colour/style of the block.
   *
   * @internal
   */
  override applyColour() {
    const block = this.getSourceBlock() as Blockly.BlockSvg | null;
    if (!block) throw new Blockly.UnattachedFieldError();

    if (!this.fieldGroup_) return;

    const borderRect = this.borderRect_;

    if (!this.isFullBlockField()) {
      if (!borderRect) {
        throw new Error('The border rect has not been initialized');
      }
      borderRect.style.display = 'block';
      borderRect.style.fill = this.getValue() as string;
    } else {
      // In general, do *not* let fields control the color of blocks. Having the
      // field control the color is unexpected, and could have performance
      // impacts.
      block.pathObject.svgPath.setAttribute('fill', this.getValue() as string);
    }
    this.recomputeAriaContext();
  }

  /**
   * Returns the height and width of the field.
   *
   * This should *in general* be the only place render_ gets called from.
   *
   * @returns Height and width.
   */
  override getSize(): Blockly.utils.Size {
    if (this.getConstants()?.FIELD_COLOUR_FULL_BLOCK) {
      // In general, do *not* let fields control the color of blocks. Having the
      // field control the color is unexpected, and could have performance
      // impacts.
      // Full block fields have more control of the block than they should
      // (i.e. updating fill colour) so they always need to be rerendered.
      this.render_();
      this.isDirty_ = false;
    }
    return super.getSize();
  }

  /**
   * Updates the colour of the block to reflect whether this is a full
   * block field or not.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override render_() {
    this.updateSize_();

    const block = this.getSourceBlock() as Blockly.BlockSvg | null;
    if (!block) throw new Blockly.UnattachedFieldError();
    // Calling applyColour updates the UI (full-block vs non-full-block) for the
    // colour field, and the colour of the field/block.
    block.applyColour();
  }

  /**
   * Updates the size of the field based on whether it is a full block field
   * or not.
   *
   * @param margin margin to use when positioning the field.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected updateSize_(margin?: number) {
    const constants = this.getConstants();
    if (!constants) return;
    let totalWidth;
    let totalHeight;
    if (this.isFullBlockField()) {
      const xOffset = margin ?? 0;
      totalWidth = xOffset * 2;
      totalHeight = constants.FIELD_TEXT_HEIGHT;
    } else {
      totalWidth = constants.FIELD_COLOUR_DEFAULT_WIDTH;
      totalHeight = constants.FIELD_COLOUR_DEFAULT_HEIGHT;
    }

    this.size_.height = totalHeight;
    this.size_.width = totalWidth;

    this.positionBorderRect_();
  }

  /**
   * Ensure that the input value is a valid colour.
   *
   * @param newValue The input value.
   * @returns A valid colour, or null if invalid.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override doClassValidation_(
    newValue: string,
  ): string | null | undefined;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override doClassValidation_(newValue?: string): string | null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected override doClassValidation_(
    newValue?: string,
  ): string | null | undefined {
    if (typeof newValue !== 'string') {
      return null;
    }
    return Blockly.utils.colour.parse(newValue);
  }

  /**
   * Get the text for this field.  Used when the block is collapsed.
   *
   * @returns Text representing the value of this field.
   */
  override getText(): string {
    let colour = this.value_ as string;
    // Try to use #rgb format if possible, rather than #rrggbb.
    if (/^#(.)\1(.)\2(.)\3$/.test(colour)) {
      colour = '#' + colour[1] + colour[3] + colour[5];
    }
    return colour;
  }

  /**
   * Set a custom colour grid for this field.
   *
   * @param colours Array of colours for this block, or null to use default
   *     (FieldColour.COLOURS).
   * @param titles Optional array of colour tooltips, or null to use default
   *     (FieldColour.TITLES).
   * @returns Returns itself (for method chaining).
   */
  setColours(colours: string[], titles?: string[]): FieldColour {
    const swatches = makeSwatches(colours, titles);
    this.setOptions(swatches);
    return this;
  }

  /**
   * Construct a FieldColour from a JSON arg object.
   *
   * @param options A JSON object with options (colour).
   * @returns The new field instance.
   * @nocollapse
   * @internal
   */
  static fromJson(options: FieldColourFromJsonConfig): FieldColour {
    // `this` might be a subclass of FieldColour if that class doesn't override
    // the static fromJson method.
    return new this(options.colour, undefined, options);
  }
}

/**
 * Creates a set of divs representing colour swatches for use in the picker.
 *
 * @param colours An array of colours to create swatches for. The colours must
 *     be any legal CSS colour specifier.
 * @param titles A corresponding array of titles to be displayed as tooltips on
 *     the colour swatches.
 * @returns An array of pairs of DOM elements representing colour swatches and
 *     their corresponding colour.
 */
function makeSwatches(
  colours: string[],
  titles?: string[],
): Blockly.MenuOption[] {
  return colours.map((colour, index) => {
    const swatch = document.createElement('div');
    swatch.className = 'blocklyColourSwatch';
    swatch.style.backgroundColor = colour;

    if (titles && index < titles.length) {
      swatch.title = titles[index];
    }
    return [swatch, colour, titles?.[index] ?? DEFAULT_COLOURS[colour]];
  });
}

/** The default value for this field. */
FieldColour.prototype.DEFAULT_VALUE = '#ffffff';

/**
 * Register the field and any dependencies.
 */
export function registerFieldColour() {
  Blockly.fieldRegistry.register('field_colour', FieldColour);
}

/**
 * CSS for colour picker.
 */
Blockly.Css.register(`
.blocklyFieldColour .blocklyFieldGridItemSelected,
.blocklyFieldGridItemSelected:hover {
  border-color: #eee !important;
  outline: 1px solid #333;
  position: relative;
}

.blocklyColourSwatch {
  width: 20px;
  height: 20px;
}

.blocklyGridContainer {
  padding: 0px;
}

.blocklyFieldColour .blocklyFieldGrid {
  grid-gap: 0px;
  row-gap: 4px;
}

.blocklyFieldColour .blocklyFieldGrid .blocklyGridItem {
  border-radius: 0;
  padding: 0;
  border: 0.5px solid #888;
  cursor: pointer;
}

.blocklyFieldColour .blocklyFieldGrid .blocklyFieldGridItem {
  border: 0.5px solid #888;
  padding: 0;
  margin: 0;
  border-radius: 0;
}

.blocklyFieldColour .blocklyFieldGrid .blocklyFieldGridItem:focus {
  border-color: #eee;
  box-shadow: 2px 2px 7px 2px rgba(0, 0, 0, 0.3);
  position: relative;
  border-radius: 0;
  outline: none;
}

.blocklyKeyboardNavigation .blocklyFieldColour .blocklyFieldGrid .blocklyFieldGridItem:focus {
  outline: var(--blockly-selection-width) solid var(--blockly-active-node-color);
  outline-offset: -2px;
  border: none;
  box-shadow: none;
  border-radius: 4px;
}
`);

/**
 * Config options for the colour field.
 */
export interface FieldColourConfig extends FieldGridDropdownConfig {
  colourOptions?: string[];
  colourTitles?: string[];
}

/**
 * fromJson config options for the colour field.
 */
export interface FieldColourFromJsonConfig extends FieldGridDropdownFromJsonConfig {
  colour?: string;
}

/**
 * A function that is called to validate changes to the field's value before
 * they are set.
 *
 * @see {@link https://developers.google.com/blockly/guides/create-custom-blocks/fields/validators#return_values}
 * @param newValue The value to be validated.
 * @returns One of three instructions for setting the new value: `T`, `null`,
 * or `undefined`.
 *
 * - `T` to set this function's returned value instead of `newValue`.
 *
 * - `null` to invoke `doValueInvalid_` and not set a value.
 *
 * - `undefined` to set `newValue` as is.
 */
export type FieldColourValidator = Blockly.FieldValidator<string>;
