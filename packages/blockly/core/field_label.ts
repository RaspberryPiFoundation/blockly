/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Non-editable, non-serializable text field.  Used for titles,
 *    labels, etc.
 *
 * @class
 */
// Former goog.module ID: Blockly.FieldLabel

import {Field, FieldConfig} from './field.js';
import * as fieldRegistry from './field_registry.js';
import * as dom from './utils/dom.js';
import * as parsing from './utils/parsing.js';

/**
 * Class for a non-editable, non-serializable text field.
 */
export class FieldLabel extends Field<string> {
  /** The HTML class name to use for this field. */
  private class: string | null = null;

  /**
   * Editable fields usually show some sort of UI indicating they are
   * editable. This field should not.
   */
  override EDITABLE = false;

  /** Text labels should not truncate. */
  override maxDisplayLength = Infinity;

  /**
   * @param value The initial value of the field. Should cast to a string.
   *     Defaults to an empty string if null or undefined. Also accepts
   *     Field.SKIP_SETUP if you wish to skip setup (only used by subclasses
   *     that want to handle configuration and setting the field value after
   *     their own constructors have run).
   * @param textClass Optional CSS class for the field's text.
   * @param config A map of options used to configure the field.
   *    See the [field creation documentation]{@link
   * https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/label#creation}
   * for a list of properties this parameter supports.
   */
  constructor(
    value?: string | typeof Field.SKIP_SETUP,
    textClass?: string,
    config?: FieldLabelConfig,
  ) {
    super(Field.SKIP_SETUP);

    if (value === Field.SKIP_SETUP) return;
    if (config) {
      this.configure_(config);
    } else {
      this.class = textClass || null;
    }
    this.setValue(value);
  }

  protected override configure_(config: FieldLabelConfig) {
    super.configure_(config);
    if (config.class) this.class = config.class;
  }

  /**
   * Create block UI for this label.
   */
  override initView() {
    this.createTextElement_();
    if (this.class) {
      dom.addClass(this.getTextElement(), this.class);
    }
    if (this.fieldGroup_) {
      dom.addClass(this.fieldGroup_, 'blocklyLabelField');
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
    if (newValue === null || newValue === undefined) {
      return null;
    }
    return `${newValue}`;
  }

  /**
   * Set the CSS class applied to the field's textElement_.
   *
   * @param cssClass The new CSS class name, or null to remove.
   */
  setClass(cssClass: string | null) {
    if (this.textElement_) {
      if (this.class) {
        dom.removeClass(this.textElement_, this.class);
      }
      if (cssClass) {
        dom.addClass(this.textElement_, cssClass);
      }
    }
    this.class = cssClass;
  }

  /**
   * Construct a FieldLabel from a JSON arg object,
   * dereferencing any string table references.
   *
   * @param options A JSON object with options (text, and class).
   * @returns The new field instance.
   * @nocollapse
   * @internal
   */
  static override fromJson(options: FieldLabelFromJsonConfig): FieldLabel {
    const text = parsing.replaceMessageReferences(options.text);
    // `this` might be a subclass of FieldLabel if that class doesn't override
    // the static fromJson method.
    return new this(text, undefined, options);
  }
}

fieldRegistry.register('field_label', FieldLabel);

FieldLabel.prototype.DEFAULT_VALUE = '';

// clang-format off
// Clang does not like the 'class' keyword being used as a property.
/**
 * Config options for the label field.
 */
export interface FieldLabelConfig extends FieldConfig {
  class?: string;
}
// clang-format on

/**
 * fromJson config options for the label field.
 */
export interface FieldLabelFromJsonConfig extends FieldLabelConfig {
  text?: string;
}
