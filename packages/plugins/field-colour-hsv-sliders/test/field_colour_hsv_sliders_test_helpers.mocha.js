/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {testHelpers} from '@blockly/dev-tools';
import {FieldColourHsvSliders} from '../src/index.js';

/**
 * Assert the colour hsv sliders field options.
 * @param {FieldColourHsvSliders} colourHsvSlidersField The colour hsv sliders
 *   field.
 * @param {string} expectedValue The expected value.
 * @param {string} expectedText The expected text.
 */
function assertColourHsvSlidersField(
  colourHsvSlidersField,
  expectedValue,
  expectedText,
) {
  testHelpers.assertFieldValue(
    colourHsvSlidersField,
    expectedValue,
    expectedText,
  );
}

/**
 * Assert the slider field's value is the default value.
 * @param {FieldColourHsvSliders} colourHsvSlidersField The slider field.
 */
function assertColourHsvSlidersFieldDefault(colourHsvSlidersField) {
  assertColourHsvSlidersField(colourHsvSlidersField, '#ffffff', '#fff');
}

export {assertColourHsvSlidersField, assertColourHsvSlidersFieldDefault};
