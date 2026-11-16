/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Edit field overview.
/**
 * @fileoverview Field overview.
 */

import * as Blockly from 'blockly/core';

// TODO: Rename field and update description.
/**
 * Field description.
 */
export class FieldTemplate extends Blockly.Field {
  /**
   * Constructs a FieldTemplate from a JSON arg object.
   *
   * @param options A JSON object with options.
   * @returns The new field instance.
   * @package
   * @nocollapse
   */
  static fromJson(options: FieldTemplateFromJsonConfig): FieldTemplate {
    // `this` might be a subclass of FieldTemplate if that class doesn't
    // override the static fromJson method.
    return new this(options.value);
  }
}

// TODO: Edit the type of value and add any other JSON options.
/**
 * fromJson configuration options for the template field.
 */
export interface FieldTemplateFromJsonConfig extends Blockly.FieldConfig {
  value?: string;
}

// TODO: Edit field registration key.
Blockly.fieldRegistry.register('field_template', FieldTemplate);
