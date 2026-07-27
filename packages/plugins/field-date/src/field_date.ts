/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin overview.
 */
import * as Blockly from 'blockly/core';
import {getLocaleDateString} from './utils';

/**
 * Class for a date input field.
 */
export class FieldDate extends Blockly.FieldTextInput {
  /**
   * Serializable fields are saved by the XML renderer, non-serializable fields
   * are not. Editable fields should also be serializable.
   */
  SERIALIZABLE = true;

  /**
   * Class for a date input field. Derived from the Closure library date
   * picker.
   *
   * @param value The initial value of the field. Should be in
   *    'YYYY-MM-DD' format. Defaults to the current date.
   * @param validator A function that is called to validate
   *    changes to the field's value. Takes in a date string & returns a
   *    validated date string ('YYYY-MM-DD' format), or null to abort the
   *    change.
   * @param config A map of options used to configure the field.
   */
  constructor(
    value?: string,
    validator?: FieldDateValidator,
    config?: FieldDateConfig,
  ) {
    super(value, validator, config);
  }

  /**
   * Constructs a FieldDate from a JSON arg object.
   *
   * @param options A JSON object with options (date).
   * @returns The new field instance.
   * @package
   * @nocollapse
   */
  static fromJson(options: FieldDateFromJsonConfig): FieldDate {
    const {date, ...fieldDateConfig} = options;
    // `this` might be a subclass of FieldDate if that class doesn't
    // override the static fromJson method.
    return new this(date, undefined, fieldDateConfig);
  }

  /* eslint-disable @typescript-eslint/naming-convention */
  /**
   * Ensures that the input value is a valid date. Additionally, if the date
   * string provided includes a time, the time will be removed and the date for
   * relative to the user's timezone will be used.
   *
   * @param newValue The input value. Ex: '2023-04-28'
   * @returns A valid date string, or null if invalid.
   * @override
   */
  protected doClassValidation_(newValue?: string): string | null {
    if (!newValue) return null;

    const newDate = typeof newValue === 'string' ? new Date(newValue) : null;
    if (!newDate || isNaN(newDate.getTime())) return null;

    // NOTE: 'newValue' should be a valid date format here.
    if (isISOFormat(newValue)) return newValue;

    // Assume the time needs to be corrected.
    return toLocalISOString(newDate);
  }

  /**
   * Get the text to display on the block when the input hasn't spawned in.
   *
   * @returns The text to display on the block.
   * @override
   */
  protected getText_(): string | null {
    const value = this.getValue();
    if (!value) return null;
    // NOTE: There may be discrepancies between the text and the input based on
    // browser. For example, 'en-US' would display the text '2/14/2020', then
    // clicking in Safari on iOS would display 'Feb 14, 2020'.
    return getLocaleDateString(value);
  }

  /**
   * Returns a description of the type of this field for screenreaders.
   */
  override getAriaTypeName() {
    return Blockly.Msg['ARIA_TYPE_FIELD_DATE'];
  }

  /**
   * Returns a description of the current date for use by screenreaders.
   */
  override getAriaValue() {
    const stringValue = this.getValue();
    if (!stringValue) return super.getAriaValue();

    const date = new Date(stringValue);
    // Use a localized long-form description of the date, e.g. January XX, 20XX,
    // rather than a short-form/ISO version of the date which may be read out
    // with slashes or the like.
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }

  /**
   * Renders the field. If the picker is shown make sure it has the current
   * date selected.
   */
  protected render_() {
    super.render_();
  }

  /**
   * Shows the inline free-text editor on top of the text along with the date
   * editor.
   *
   * @param e Optional mouse event that triggered the field to
   *     open, or undefined if triggered programmatically.
   * @override
   */
  protected showEditor_(e?: Event) {
    // Pass in `true` for `quietInput` to disable modal inputs for the date
    // block without setting `this.sourceBlock_.workspace.options.modalInputs`,
    // which would impact the entire workspace.
    super.showEditor_(e, true);

    // Even though `quietInput` was set true, focus on the element.
    this.htmlInput_?.focus({
      preventScroll: true,
    });
    this.htmlInput_?.select();
    this.showDropdown();
  }

  /**
   * Updates the size of the field based on the text.
   *
   * @param margin margin to use when positioning the text element.
   * @override
   */
  protected updateSize_(margin?: number) {
    // Add margin so that the date input's datepicker icon doesn't clip with
    // the text when sized for the date.
    super.updateSize_((margin ?? 0) + 20);
  }

  /**
   * Shows the datepicker.
   */
  private showDropdown(): void {
    if (!this.htmlInput_) return;
    Blockly.utils.dom.addClass(this.htmlInput_, 'blocklyDateInput');

    // Delay showing the picker until the editor has a chance to position
    window.requestAnimationFrame(() => {
      // NOTE: HTMLInputElement.showPicker() is not available in earlier
      // TypeScript versions (like 4.7.4), so casting to `any` to be compatible
      // with dev scripts. Additionally, it's not available for date inputs for
      // Safari. For browser compatibility of showPicker, see:
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/showPicker
      /* eslint-disable @typescript-eslint/no-explicit-any */
      (this.htmlInput_ as any).showPicker();
      /* eslint-enable @typescript-eslint/no-explicit-any */
    });
  }

  /**
   * Create the html input and set it to type date.
   *
   * @returns The newly created date input editor.
   */
  protected widgetCreate_(): HTMLInputElement {
    // NOTE: field_input should return HTMLInputElement for this.
    const htmlInput = super.widgetCreate_() as HTMLInputElement;
    htmlInput.type = 'date';

    return htmlInput;
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}

/**
 * NOTE: There are a few minor ways to tweak the datepicker CSS, though they're
 * not consistent across browsers.
 *
 * @see{@link https://developer.mozilla.org/en-US/docs/Learn/Forms/Property_compatibility_table_for_form_controls#date_pickers}
 *
 * Below are a few ways this can be tweaked on *some* browsers:
 * Blockly.Css.register(`
 * ::-webkit-datetime-edit { }
 * ::-webkit-datetime-edit-fields-wrapper { }
 * ::-webkit-datetime-edit-text { }
 * ::-webkit-datetime-edit-month-field { }
 * ::-webkit-datetime-edit-day-field { }
 * ::-webkit-datetime-edit-year-field { }
 * ::-webkit-inner-spin-button { }
 * ::-webkit-calendar-picker-indicator { }
 * `);
 */
if (Blockly.utils.userAgent.MAC) {
  // NOTE: By default, 4 px padding total are added within the User Agent
  // Shadow Content on Safari on MAC. Remove the padding so the inner input
  // matches the outer input's height and, by extension, the height of the text
  // node.
  Blockly.Css.register(`
input.blocklyDateInput::-webkit-datetime-edit,
input.blocklyDateInput::-webkit-datetime-edit-month-field,
input.blocklyDateInput::-webkit-datetime-edit-day-field,
input.blocklyDateInput::-webkit-datetime-edit-year-field {
  padding: 0;
}
`);
}

Blockly.fieldRegistry.register('field_date', FieldDate);

/**
 * A config object for defining a field date.
 */
export interface FieldDateConfig extends Blockly.FieldTextInputConfig {
  // NOTE: spellcheck is defined for FieldInput though irrelevant for FieldDate.
  spellcheck?: never;
}

/**
 * Options used to define a field date from JSON.
 */
export interface FieldDateFromJsonConfig extends FieldDateConfig {
  date?: string;
}

export type FieldDateValidator = Blockly.FieldTextInputValidator;

/**
 * Validate a string value to see if it matches the format.
 *
 * @param value The value to validate the format for.
 * @returns true if the value is in 'yyyy-mm-dd' format.
 * @example
 * isISOFormat('2000-02-20T00:00:00Z') === false
 * isISOFormat('2000-02-20') === true
 */
export function isISOFormat(value: string): boolean {
  const valueMatch = value.match(/\d\d\d\d-\d\d-\d\d/);
  // If it matches ####-##-## and is the same as its input string,
  // then assume this is the right format
  return valueMatch !== null && valueMatch[0] === valueMatch.input;
}

/**
 * Convert the date to ISO format for the current timezone.
 *
 * @param date The date to convert to an ISO string.
 * @returns The string in 'yyyy-mm-dd' format, though for the current timezone.
 * Ex: new Date('2000-02-20')
 */
export function toLocalISOString(date: Date) {
  // NOTE: If the date is Feb 20, 2000 at 23:00 for GMT-6, it would be
  // '2000-02-21' at GMT+0, which is what `date.toISOString()` would return.
  // For a user whose timezone is GMT-6, this should return '2000-02-20'.
  // For a user whose timezone is GMT-5, that date should return '2000-02-21'.
  return date
    .toLocaleDateString('en-US')
    .replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2')
    .replace(/-(\d)(?!\d)/g, '-0$1');
}

// NOTE: Set default here instead of in class so it's available at Field.
FieldDate.prototype.DEFAULT_VALUE = toLocalISOString(new Date());
