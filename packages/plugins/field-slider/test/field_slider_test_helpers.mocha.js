/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {assert} = require('chai');
const {assertFieldValue} = require('@blockly/dev-tools').testHelpers;
const {FieldSlider} = require('../src/index');

/**
 * Assert the slider field options.
 * @param {FieldSlider} sliderField The slider field.
 * @param {number} expectedMin The expected min value.
 * @param {number} expectedMax  The expected max value.
 * @param {number} expectedPrecision The expected precision value.
 * @param {number} expectedValue The expected value.
 */
function assertSliderField(
  sliderField,
  expectedMin,
  expectedMax,
  expectedPrecision,
  expectedValue,
) {
  assertFieldValue(sliderField, expectedValue);
  assert.equal(sliderField.getMin(), expectedMin, 'Min');
  assert.equal(sliderField.getMax(), expectedMax, 'Max');
  assert.equal(sliderField.getPrecision(), expectedPrecision, 'Precision');
}
/**
 * Assert the slider field's value is the default value.
 * @param {FieldSlider} sliderField The slider field.
 */
function assertSliderFieldDefault(sliderField) {
  assertSliderField(sliderField, -Infinity, Infinity, 0, 0);
}

module.exports = {
  assertSliderField,
  assertSliderFieldDefault,
};
