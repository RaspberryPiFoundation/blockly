/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Node.js script to run Automated tests in Chrome, via webdriver.
 */

import * as chai from 'chai';
import {testFileLocations, testSetup} from './test_setup.mjs';

suite('Testing Connecting Blocks', function (done) {
  // Setting timeout to unlimited as the webdriver takes a longer time to run than most mocha test
  this.timeout(0);

  // Setup Selenium for all of the tests
  suiteSetup(async function () {
    this.browser = await testSetup(testFileLocations.BLOCK_FACTORY);
  });

  test('Testing Block Drag', async function () {
    const startingBlock = await this.browser.$(
      '#blockly > div > svg.blocklySvg > g > g.blocklyBlockCanvas > g:nth-child(2)',
    );
    const blocklyCanvas = await this.browser.$(
      '#blockly > div > svg.blocklySvg > g > g.blocklyBlockCanvas',
    );
    const firstPostion = await blocklyCanvas.getAttribute('transform');
    await startingBlock.dragAndDrop({x: 20, y: 20});
    const secondPosition = await blocklyCanvas.getAttribute('transform');
    chai.assert.notEqual(firstPostion, secondPosition);
  });

  suiteTeardown(async function () {
    await this.browser.execute(() => {
      // If you leave blocks on the workspace, the block factory pops up an alert asking
      // if you really want to lose your work when you try to load a new page.
      // Clearing blocks resolves this and is easier than waiting for the alert.
      Blockly.getMainWorkspace().clear();
    });
  });
});
