/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Node.js script to run Automated tests in Chrome, via webdriver.
 */

import * as chai from 'chai';
import {Key} from 'webdriverio';
import {
  clickWorkspace,
  dragBlockTypeFromFlyout,
  screenDirection,
  testFileLocations,
  testSetup,
} from './test_setup.mjs';

suite('Testing Field Edits', function (done) {
  // Setting timeout to unlimited as the webdriver takes a longer time to run than most mocha test
  this.timeout(0);

  test('Testing Field Edits LTR', async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
    await testFieldEdits(this.browser, screenDirection.LTR);
  });

  test('Testing Field Edits RTL', async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND_RTL);
    await testFieldEdits(this.browser, screenDirection.RTL);
  });
});

async function testFieldEdits(browser, direction) {
  const numberBlock = await dragBlockTypeFromFlyout(
    browser,
    'Math',
    'math_number',
    50 * direction,
    20,
  );

  // Click on the field to change the value
  await numberBlock.click();
  await browser.keys([Key.Delete]);
  await browser.keys(['1093']);

  // Click on the workspace to exit the field editor
  await clickWorkspace(browser);

  const fieldValue = await browser.execute((id) => {
    return Blockly.getMainWorkspace()
      .getBlockById(id)
      .getField('NUM')
      .getValue();
  }, numberBlock.id);

  chai.assert.equal(fieldValue, '1093');
}
