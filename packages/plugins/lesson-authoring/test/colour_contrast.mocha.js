/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import {pickContrastingColour} from '../src/colour_contrast';

suite('pickContrastingColour', function () {
  test('keeps the preferred colour when it contrasts enough', function () {
    assert.equal(pickContrastingColour('#ff0000', '#ffffff'), '#ff0000');
  });

  test('uses black on light backgrounds', function () {
    assert.equal(pickContrastingColour('#eeee00', '#ffff00'), '#000000');
  });

  test('uses white on dark backgrounds', function () {
    assert.equal(pickContrastingColour('#330033', '#440044'), '#ffffff');
  });
});
