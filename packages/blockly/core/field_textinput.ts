/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Text input field.
 *
 * @class
 */
// Former goog.module ID: Blockly.FieldTextInput

// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_block_change.js';

import {Field} from './field.js';
import {
  FieldInput,
  FieldInputConfig,
  FieldInputValidator,
} from './field_input.js';
import * as fieldRegistry from './field_registry.js';
import * as dom from './utils/dom.js';
import * as parsing from './utils/parsing.js';

/**
 * Class for an editable text field.
 */
export class FieldTextInput extends FieldInput<string> {
  /**
   * @param value The initial value of the field. Should cast to a string.
   *     Defaults to an empty string if null or undefined. Also accepts
   *     Field.SKIP_SETUP if you wish to skip setup (only used by subclasses
   *     that want to handle configuration and setting the field value after
   *     their own constructors have run).
   * @param validator A function that is called to validate changes to the
   *     field's value. Takes in a string & returns a validated string, or null
   *     to abort the change.
   * @param config A map of options used to configure the field.
   *     See the [field creation documentation]{@link
   * https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/text-input#creation}
   * for a list of properties this parameter supports.
   */
  constructor(
    value?: string | typeof Field.SKIP_SETUP,
    validator?: FieldTextInputValidator | null,
    config?: FieldTextInputConfig,
  ) {
    super(value, validator, config);
  }

  override initView() {
    super.initView();
    if (this.fieldGroup_) {
      dom.addClass(this.fieldGroup_, 'blocklyTextInputField');
    }
  }

  /**
   * Ensure that the input value casts to a valid string.
   *
   * @param newValue The input value.
   * @returns A valid string, or null if invalid.
   */
  protected override doClassValidation_(
    newValue?: AnyDuringMigration,
  ): string | null {
    if (newValue === undefined) {
      return null;
    }
    return `${newValue}`;
  }

  /**
   * Construct a FieldTextInput from a JSON arg object,
   * dereferencing any string table references.
   *
   * @param options A JSON object with options (text, and spellcheck).
   * @returns The new field instance.
   * @nocollapse
   * @internal
   */
  static override fromJson(
    options: FieldTextInputFromJsonConfig,
  ): FieldTextInput {
    const text = parsing.replaceMessageReferences(options.text);
    // `this` might be a subclass of FieldTextInput if that class doesn't
    // override the static fromJson method.
    return new this(text, undefined, options);
  }
}

fieldRegistry.register('field_input', FieldTextInput);

FieldTextInput.prototype.DEFAULT_VALUE = '';

/**
 *  Config options for the text input field.
 */
export type FieldTextInputConfig = FieldInputConfig;

/**
 * fromJson config options for the text input field.
 */
export interface FieldTextInputFromJsonConfig extends FieldTextInputConfig {
  text?: string;
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
export type FieldTextInputValidator = FieldInputValidator<string>;
