/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Checkbox field.  Checked or not checked.
 *
 * @class
 */
// Former goog.module ID: Blockly.FieldCheckbox

// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_block_change.js';

import {Field, FieldConfig, FieldValidator} from './field.js';
import * as fieldRegistry from './field_registry.js';
import * as dom from './utils/dom.js';

type BoolString = 'TRUE' | 'FALSE';
type CheckboxBool = BoolString | boolean;

/**
 * Class for a checkbox field.
 */
export class FieldCheckbox extends Field<CheckboxBool> {
  /** Default character for the checkmark. */
  static readonly CHECK_CHAR = '✓';
  private checkChar: string;

  /**
   * Serializable fields are saved by the serializer, non-serializable fields
   * are not. Editable fields should also be serializable.
   */
  override SERIALIZABLE = true;

  /**
   * NOTE: The default value is set in `Field`, so maintain that value instead
   * of overwriting it here or in the constructor.
   */
  override value_: boolean | null = this.value_;

  /**
   * @param value The initial value of the field. Should either be 'TRUE',
   *     'FALSE' or a boolean. Defaults to 'FALSE'. Also accepts
   *     Field.SKIP_SETUP if you wish to skip setup (only used by subclasses
   *     that want to handle configuration and setting the field value after
   *     their own constructors have run).
   * @param validator  A function that is called to validate changes to the
   *     field's value. Takes in a value ('TRUE' or 'FALSE') & returns a
   *     validated value ('TRUE' or 'FALSE'), or null to abort the change.
   * @param config A map of options used to configure the field.
   *     See the [field creation documentation]{@link
   * https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/checkbox#creation}
   * for a list of properties this parameter supports.
   */
  constructor(
    value?: CheckboxBool | typeof Field.SKIP_SETUP,
    validator?: FieldCheckboxValidator,
    config?: FieldCheckboxConfig,
  ) {
    super(Field.SKIP_SETUP);

    /**
     * Character for the check mark. Used to apply a different check mark
     * character to individual fields.
     */
    this.checkChar = FieldCheckbox.CHECK_CHAR;

    if (value === Field.SKIP_SETUP) return;
    if (config) {
      this.configure_(config);
    }
    this.setValue(value);
    if (validator) {
      this.setValidator(validator);
    }
  }

  /**
   * Configure the field based on the given map of options.
   *
   * @param config A map of options to configure the field based on.
   */
  protected override configure_(config: FieldCheckboxConfig) {
    super.configure_(config);
    if (config.checkCharacter) this.checkChar = config.checkCharacter;
  }

  /**
   * Saves this field's value.
   *
   * @returns The boolean value held by this field.
   * @internal
   */
  override saveState(): AnyDuringMigration {
    const legacyState = this.saveLegacyState(FieldCheckbox);
    if (legacyState !== null) {
      return legacyState;
    }
    return this.getValueBoolean();
  }

  /**
   * Create the block UI for this checkbox.
   */
  override initView() {
    super.initView();

    const textElement = this.getTextElement();
    dom.addClass(this.fieldGroup_!, 'blocklyCheckboxField');
    textElement.style.display = this.value_ ? 'block' : 'none';
  }

  override render_() {
    if (this.textContent_) {
      this.textContent_.nodeValue = this.getDisplayText_();
    }
    this.updateSize_(this.getConstants()!.FIELD_CHECKBOX_X_OFFSET);
  }

  override getDisplayText_() {
    return this.checkChar;
  }

  /**
   * Set the character used for the check mark.
   *
   * @param character The character to use for the check mark, or null to use
   *     the default.
   */
  setCheckCharacter(character: string | null) {
    this.checkChar = character || FieldCheckbox.CHECK_CHAR;
    this.forceRerender();
  }

  /** Toggle the state of the checkbox on click. */
  protected override showEditor_() {
    this.setValue(!this.value_);
  }

  /**
   * Ensure that the input value is valid ('TRUE' or 'FALSE').
   *
   * @param newValue The input value.
   * @returns A valid value ('TRUE' or 'FALSE), or null if invalid.
   */
  protected override doClassValidation_(
    newValue?: AnyDuringMigration,
  ): BoolString | null {
    if (newValue === true || newValue === 'TRUE') {
      return 'TRUE';
    }
    if (newValue === false || newValue === 'FALSE') {
      return 'FALSE';
    }
    return null;
  }

  /**
   * Update the value of the field, and update the checkElement.
   *
   * @param newValue The value to be saved. The default validator guarantees
   *     that this is a either 'TRUE' or 'FALSE'.
   */
  protected override doValueUpdate_(newValue: BoolString) {
    this.value_ = this.convertValueToBool(newValue);
    // Update visual.
    if (this.textElement_) {
      this.textElement_.style.display = this.value_ ? 'block' : 'none';
    }
  }

  /**
   * Get the value of this field, either 'TRUE' or 'FALSE'.
   *
   * @returns The value of this field.
   */
  override getValue(): BoolString {
    return this.value_ ? 'TRUE' : 'FALSE';
  }

  /**
   * Get the boolean value of this field.
   *
   * @returns The boolean value of this field.
   */
  getValueBoolean(): boolean | null {
    return this.value_;
  }

  /**
   * Get the text of this field. Used when the block is collapsed.
   *
   * @returns Text representing the value of this field ('true' or 'false').
   */
  override getText(): string {
    return String(this.convertValueToBool(this.value_));
  }

  /**
   * Convert a value into a pure boolean.
   *
   * Converts 'TRUE' to true and 'FALSE' to false correctly, everything else
   * is cast to a boolean.
   *
   * @param value The value to convert.
   * @returns The converted value.
   */
  private convertValueToBool(value: CheckboxBool | null): boolean {
    if (typeof value === 'string') return value === 'TRUE';
    return !!value;
  }

  /**
   * Construct a FieldCheckbox from a JSON arg object.
   *
   * @param options A JSON object with options (checked).
   * @returns The new field instance.
   * @nocollapse
   * @internal
   */
  static override fromJson(
    options: FieldCheckboxFromJsonConfig,
  ): FieldCheckbox {
    // `this` might be a subclass of FieldCheckbox if that class doesn't
    // 'override' the static fromJson method.
    return new this(options.checked, undefined, options);
  }
}

fieldRegistry.register('field_checkbox', FieldCheckbox);

FieldCheckbox.prototype.DEFAULT_VALUE = false;

/**
 * Config options for the checkbox field.
 */
export interface FieldCheckboxConfig extends FieldConfig {
  checkCharacter?: string;
}

/**
 * fromJson config options for the checkbox field.
 */
export interface FieldCheckboxFromJsonConfig extends FieldCheckboxConfig {
  checked?: boolean;
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
export type FieldCheckboxValidator = FieldValidator<CheckboxBool>;
