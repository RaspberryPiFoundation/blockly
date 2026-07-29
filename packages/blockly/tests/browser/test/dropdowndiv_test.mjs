/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import {testFileLocations, testSetup} from './test_setup.mjs';

suite('DropDownDiv', function () {
  suiteSetup(async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
  });

  test('show() with bounds set positions and shows div near specified location', async function () {
    const result = await this.browser.execute(() => {
      const workspace = Blockly.getMainWorkspace();
      Blockly.DropDownDiv.setBoundsElement(document.body);
      const block = Blockly.serialization.blocks.append(
        {'type': 'text', 'fields': {'TEXT': ''}},
        workspace,
      );
      const field = Array.from(block.getFields())[0];

      Blockly.DropDownDiv.show(field, false, 50, 60, 70, 80, false);

      const dropDownDivElem = document.querySelector('.blocklyDropDownDiv');
      const bounds = dropDownDivElem.getBoundingClientRect();
      return {
        opacity: dropDownDivElem.style.opacity,
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
      };
    });

    chai.assert.strictEqual(
      result.opacity,
      '1',
      'Expected the div to be shown',
    );
    // The div is centered horizontally on the requested x, and its top edge
    // sits at the requested y.
    chai.assert.strictEqual(result.left, 50 - result.width / 2);
    chai.assert.strictEqual(result.top, 60);
  });
});
