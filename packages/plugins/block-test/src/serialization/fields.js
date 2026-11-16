/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import * as Blockly from 'blockly/core';

/**
 * Field that does not override any serialization hooks.
 */
class NoOverridesField extends Blockly.FieldLabel {
  /**
   * Constructor.
   * @param {string=} value The value for the field to hold.
   * @param {string=} cssClass The css class to apply to the field.
   * @param {*} config The config for the field.
   */
  constructor(value, cssClass, config) {
    super(value, cssClass, config);

    this.EDITABLE = false;
    this.SERIALIZABLE = true;
  }
}

/**
 * Creates the field based on its JSON definition.
 * @param {*} options Options for creating the field.
 * @returns {!NoOverridesField} The field that was created.
 */
NoOverridesField.fromJson = function (options) {
  const text = Blockly.utils.parsing.replaceMessageReferences(options['text']);
  return new this(text, undefined, options);
};

Blockly.fieldRegistry.register('field_no_overrides', NoOverridesField);

/**
 * Field that overrides XML serialization hooks.
 */
class XmlField extends Blockly.FieldLabel {
  /**
   * Constructor.
   * @param {string=} value The value for the field to hold.
   * @param {string=} cssClass The css class to apply to the field.
   * @param {*} config The config for the field.
   */
  constructor(value, cssClass, config) {
    super(value, cssClass, config);

    this.EDITABLE = false;
    this.SERIALIZABLE = true;
  }

  /**
   * Saves the state of the field as XML.
   * @param {!Element} element The element to add the state to.
   * @returns {!Element} The element with the state added.
   */
  toXml(element) {
    element.setAttribute('value', this.getValue());
    return element;
  }

  /**
   * Applies the given state to the field.
   * @param {!Element} element The element containing the state to apply.
   */
  fromXml(element) {
    this.setValue(element.getAttribute('value'));
  }
}

/**
 * Creates the field based on its JSON definition.
 * @param {*} options Options for creating the field.
 * @returns {!XmlField} The field that was created.
 */
XmlField.fromJson = function (options) {
  const text = Blockly.utils.parsing.replaceMessageReferences(options['text']);
  return new this(text, undefined, options);
};

Blockly.fieldRegistry.register('field_xml', XmlField);

/**
 * Field that overrides JSO serialization hooks.
 */
class JsoField extends Blockly.FieldLabel {
  /**
   * Constructor.
   * @param {string=} value The value for the field to hold.
   * @param {string=} cssClass The css class to apply to the field.
   * @param {*} config The config for the field.
   */
  constructor(value, cssClass, config) {
    super(value, cssClass, config);

    this.EDITABLE = false;
    this.SERIALIZABLE = true;
  }

  /**
   * Saves the state of the field as a JSON serializable value.
   * @returns {*} The state of the field.
   */
  saveState() {
    return {
      value: this.getValue(),
    };
  }

  /**
   * Applies the given state to the field.
   * @param {*} state The state to apply.
   */
  loadState(state) {
    this.setValue(state['value']);
  }
}

/**
 * Creates the field based on its JSON definition.
 * @param {*} options Options for creating the field.
 * @returns {!JsoField} The field that was created.
 */
JsoField.fromJson = function (options) {
  const text = Blockly.utils.parsing.replaceMessageReferences(options['text']);
  return new this(text, undefined, options);
};

Blockly.fieldRegistry.register('field_jso', JsoField);

/**
 * Field that overrides XML and JSO serialization hooks.
 */
class BothField extends Blockly.FieldLabel {
  /**
   * Constructor.
   * @param {string=} value The value for the field to hold.
   * @param {string=} cssClass The css class to apply to the field.
   * @param {*} config The config for the field.
   */
  constructor(value, cssClass, config) {
    super(value, cssClass, config);

    this.EDITABLE = false;
    this.SERIALIZABLE = true;
  }

  /**
   * Saves the state of the field as XML.
   * @param {!Element} element The element to add the state to.
   * @returns {!Element} The element with the state added.
   */
  toXml(element) {
    element.setAttribute('value', this.getValue());
    return element;
  }

  /**
   * Applies the given state to the field.
   * @param {!Element} element The element containing the state to apply.
   */
  fromXml(element) {
    this.setValue(element.getAttribute('value'));
  }

  /**
   * Saves the state of the field as a JSON serializable value.
   * @returns {*} The state of the field.
   */
  saveState() {
    return {
      value: this.getValue(),
    };
  }

  /**
   * Applies the given state to the field.
   * @param {*} state The state to apply.
   */
  loadState(state) {
    this.setValue(state['value']);
  }
}

/**
 * Creates the field based on its JSON definition.
 * @param {*} options Options for creating the field.
 * @returns {!BothField} The field that was created.
 */
BothField.fromJson = function (options) {
  const text = Blockly.utils.parsing.replaceMessageReferences(options['text']);
  return new this(text, undefined, options);
};

Blockly.fieldRegistry.register('field_both', BothField);
