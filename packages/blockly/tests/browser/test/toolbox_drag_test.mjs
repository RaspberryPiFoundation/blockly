/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Tests for the dragging out of the toolbox and flyout.
 */

import * as chai from 'chai';
import {Key} from 'webdriverio';
import {
  getBlockTypeFromCategory,
  getCategory,
  PAUSE_TIME,
  screenDirection,
  testFileLocations,
  testSetup,
} from './test_setup.mjs';

// Categories in the basic toolbox.
const basicCategories = [
  'Logic',
  'Loops',
  'Math',
  'Text',
  'Lists',
  'Variables',
  'Functions',
];

// Categories in the test blocks toolbox.
const testCategories = [
  'Align',
  'Basic',
  // Skip connections because it's an accordion that is already open.
  // 'Connections',
  'Row',
  'Stack',
  'Statement',
  // Disabled due to #8466
  // 'Drag',

  // Skip fields because it's an accordion that is already open.
  // 'Fields',
  'Defaults',
  'Numbers',
  'Drop-downs',
  // Note: images has a block that has a bad image source, but still builds and renders
  // just fine.
  'Images',
  'Emoji! o((*^ᴗ^*))o',
  'Validators',
  'Mutators',
  'Style',
  'Serialization',
];

/**
 * Get the type of the nth block in the specified category.
 * @param browser The active WebdriverIO Browser object.
 * @param categoryName The name of the category to inspect.
 * @param n The index of the block to get
 * @returns A Promise resolving to the type the block in the specified
 *     category's flyout at index i.
 */
async function getNthBlockType(browser, categoryName, n) {
  const category = await getCategory(browser, categoryName);
  await category.click();
  await browser.pause(PAUSE_TIME);

  const blockType = await browser.execute((i) => {
    return Blockly.getMainWorkspace()
      .getFlyout()
      .getWorkspace()
      .getTopBlocks(false)[i].type;
  }, n);

  // Unicode escape to close flyout.
  await browser.keys([Key.Escape]);
  await browser.pause(PAUSE_TIME);
  return blockType;
}

/**
 * Get how many top-level blocks there are in the specified category.
 * @param browser The active WebdriverIO Browser object.
 * @param categoryName The name of the category to inspect.
 * @returns A Promise resolving to the number of top-level blocks in the specified
 *     category's flyout.
 */
async function getBlockCount(browser, categoryName) {
  const category = await getCategory(browser, categoryName);
  await category.click();
  await browser.pause(PAUSE_TIME);

  const blockCount = await browser.execute(() => {
    return Blockly.getMainWorkspace()
      .getFlyout()
      .getWorkspace()
      .getTopBlocks(false).length;
  });

  // Unicode escape to close flyout.
  await browser.keys([Key.Escape]);
  await browser.pause(PAUSE_TIME);
  return blockCount;
}

/**
 * Check whether the block at the given index in the flyout is disabled.
 * @param browser The active WebdriverIO Browser object.
 * @param i The index of the block in the currently open flyout.
 * @returns A Promise resolving to true if the ith block in the flyout is
 *     disabled, and false otherwise.
 */
async function isBlockDisabled(browser, i) {
  return await browser.execute((n) => {
    return !Blockly.getMainWorkspace()
      .getFlyout()
      .getWorkspace()
      .getTopBlocks()
      [n].isEnabled();
  }, i);
}

/**
 * Loop over a list of categories and click on each one to open it.
 * @param browser The WebdriverIO Browser instance for this test.
 * @param categoryList An array of category names, as strings.
 * @param directionMultiplier 1 for LTR and -1 for RTL.
 * @returns A Promise that resolves when all actions have finished.
 */
async function openCategories(browser, categoryList, directionMultiplier) {
  let failureCount = 0;
  for (const categoryName of categoryList) {
    const blockCount = await getBlockCount(browser, categoryName);

    try {
      for (let i = 0; i < blockCount; i++) {
        const category = await getCategory(browser, categoryName);
        await category.click();
        if (await isBlockDisabled(browser, i)) {
          // Unicode escape to close flyout.
          await browser.keys([Key.Escape]);
          await browser.pause(PAUSE_TIME);
          continue;
        }
        const blockType = await getNthBlockType(browser, categoryName, i);
        const blockElem = await getBlockTypeFromCategory(
          browser,
          categoryName,
          blockType,
        );
        await blockElem.dragAndDrop({x: 50 * directionMultiplier, y: 20});
        await browser.pause(PAUSE_TIME);
        // Should be one top level block on the workspace.
        const topBlockCount = await browser.execute(() => {
          return Blockly.getMainWorkspace().getTopBlocks(false).length;
        });

        if (topBlockCount != 1) {
          failureCount++;
          console.log(`fail: block ${i} in category ${categoryName}`);
        }

        // Clean up between blocks so they can't interact with each other.
        await browser.execute(() => {
          Blockly.getMainWorkspace().clear();
        });
        await browser.pause(PAUSE_TIME);
      }
    } catch (e) {
      failureCount++;
      throw e;
    }
  }
  chai.assert.equal(failureCount, 0);
}

// TODO (#9217) These take too long to run and are very flakey. Need to pull
// these out into their own test runner.
suite('Open toolbox categories', function () {
  this.timeout(0);

  test('opening every toolbox category in the category toolbox in LTR', async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
    await openCategories(this.browser, basicCategories, screenDirection.LTR);
  });

  test('opening every toolbox category in the category toolbox in RTL', async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND_RTL);
    await openCategories(this.browser, basicCategories, screenDirection.RTL);
  });

  test('opening every toolbox category in the test toolbox in LTR', async function () {
    this.browser = await testSetup(
      testFileLocations.PLAYGROUND + '?toolbox=test-blocks',
    );
    await openCategories(this.browser, testCategories, screenDirection.LTR);
  });

  test('opening every toolbox category in the test toolbox in RTL', async function () {
    this.browser = await testSetup(
      testFileLocations.PLAYGROUND + '?toolbox=test-blocks&dir=rtl',
    );
    await openCategories(this.browser, testCategories, screenDirection.RTL);
  });

  test('clicking the toolbox itself does not open the flyout', async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
    await this.browser.$('.blocklyToolbox').click();
    const flyoutOpen = await this.browser.execute(() => {
      return Blockly.getMainWorkspace().getFlyout().isVisible();
    });
    chai.assert.isFalse(flyoutOpen);
  });
});
