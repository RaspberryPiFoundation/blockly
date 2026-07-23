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
   * @param {!Object} options A JSON object with options.
   * @returns {!FieldTemplate} The new field instance.
   * @package
   * @nocollapse
   */
  static fromJson(options) {
    // `this` might be a subclass of FieldTemplate if that class doesn't
    // override the static fromJson method.
    return new this(options['value']);
  }
}

// TODO: Edit field registration key.
Blockly.fieldRegistry.register('field_template', FieldTemplate);
