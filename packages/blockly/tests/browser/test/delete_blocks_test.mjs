/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import {Key} from 'webdriverio';
import {
  clickBlock,
  clickWorkspace,
  contextMenuSelect,
  getAllBlocks,
  getBlockElementById,
  PAUSE_TIME,
  testFileLocations,
  testSetup,
} from './test_setup.mjs';

const firstBlockId = 'root_block';
const startBlocks = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: 'text_print',
        id: firstBlockId,
        x: 63,
        y: 88,
        inputs: {
          TEXT: {
            shadow: {
              type: 'text',
              id: 'text_shadow',
              fields: {
                TEXT: '1',
              },
            },
          },
        },
        next: {
          block: {
            type: 'text_print',
            id: 'second_block',
            inputs: {
              TEXT: {
                shadow: {
                  type: 'text',
                  id: 'second_text_shadow',
                  fields: {
                    TEXT: '2',
                  },
                },
                block: {
                  type: 'text_trim',
                  id: 'trim_block',
                  fields: {
                    MODE: 'BOTH',
                  },
                  inputs: {
                    TEXT: {
                      shadow: {
                        type: 'text',
                        id: 'text_to_trim_shadow',
                        fields: {
                          TEXT: 'abc',
                        },
                      },
                      block: {
                        type: 'text',
                        id: 'text_to_trim_real',
                        fields: {
                          TEXT: 'hello',
                        },
                      },
                    },
                  },
                },
              },
            },
            next: {
              block: {
                type: 'text_print',
                id: 'third_block',
                inputs: {
                  TEXT: {
                    shadow: {
                      type: 'text',
                      id: 'third_text_shadow',
                      fields: {
                        TEXT: '3',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
};

suite('Delete blocks', function (done) {
  // Setting timeout to unlimited as the webdriver takes a longer time to run than most mocha test
  this.timeout(0);

  // Setup Selenium for all of the tests
  suiteSetup(async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
  });

  // Clear the workspace and load the start blocks before each test
  setup(async function () {
    await this.browser.execute(() => {
      // Clear the workspace manually so we can ensure it's clear before moving on to the next test.
      Blockly.getMainWorkspace().clear();
    });
    // Wait for the workspace to be cleared of blocks (no blocks found on main workspace)
    await this.browser
      .$(
        '.blocklySvg .blocklyWorkspace > .blocklyBlockCanvas > .blocklyDraggable',
      )
      .waitForExist({timeout: 2000, reverse: true});

    // Load the start blocks. This hangs indefinitely if `startBlocks` is
    // passed without being stringified.
    this.browser.execute((blocks) => {
      Blockly.serialization.workspaces.load(
        JSON.parse(blocks),
        Blockly.getMainWorkspace(),
      );
    }, JSON.stringify(startBlocks));
    // Wait for there to be a block on the main workspace before continuing
    (await getBlockElementById(this.browser, firstBlockId)).waitForExist({
      timeout: 2000,
    });
    this.firstBlock = await getBlockElementById(this.browser, firstBlockId);
  });

  test('Delete block using backspace key', async function () {
    const before = (await getAllBlocks(this.browser)).length;
    // Get first print block, click to select it, and delete it using backspace key.
    await clickBlock(this.browser, this.firstBlock.id, {button: 1});
    await this.browser.keys([Key.Backspace]);
    const after = (await getAllBlocks(this.browser)).length;
    chai.assert.equal(
      before - 2,
      after,
      'Expected there to be two fewer blocks after deletion of block and shadow',
    );
  });

  test('Delete block using delete key', async function () {
    const before = (await getAllBlocks(this.browser)).length;
    // Get first print block, click to select it, and delete it using delete key.
    await clickBlock(this.browser, this.firstBlock.id, {button: 1});
    await this.browser.keys([Key.Delete]);
    const after = (await getAllBlocks(this.browser)).length;
    chai.assert.equal(
      before - 2,
      after,
      'Expected there to be two fewer blocks after deletion of block and shadow',
    );
  });

  test('Delete block using context menu', async function () {
    const before = (await getAllBlocks(this.browser)).length;
    // Get first print block, click to select it, and delete it using context menu.
    await contextMenuSelect(this.browser, this.firstBlock, 'Delete 2 Blocks');
    const after = (await getAllBlocks(this.browser)).length;
    chai.assert.equal(
      before - 2,
      after,
      'Expected there to be two fewer blocks after deletion of block and shadow',
    );
  });

  test('Undo block deletion', async function () {
    const before = (await getAllBlocks(this.browser)).length;
    // Get first print block, click to select it, and delete it using backspace key.
    await clickBlock(this.browser, this.firstBlock.id, {button: 1});
    await this.browser.keys([Key.Backspace]);
    await this.browser.pause(PAUSE_TIME);
    // Undo
    await this.browser.keys([Key.Ctrl, 'z']);
    await this.browser.pause(PAUSE_TIME);
    const after = (await getAllBlocks(this.browser)).length;
    chai.assert.equal(
      after,
      before,
      'Expected there to be the original number of blocks after undoing a delete',
    );
  });

  test('Redo block deletion', async function () {
    const before = (await getAllBlocks(this.browser)).length;
    // Get first print block, click to select it, and delete it using backspace key.
    await clickBlock(this.browser, this.firstBlock.id, {button: 1});
    await this.browser.keys([Key.Backspace]);
    await this.browser.pause(PAUSE_TIME);
    // Undo
    await this.browser.keys([Key.Ctrl, 'z']);
    await this.browser.pause(PAUSE_TIME);
    // Redo
    await clickWorkspace(this.browser);
    await this.browser.keys([Key.Ctrl, Key.Shift, 'z']);
    await this.browser.pause(PAUSE_TIME);
    const after = (await getAllBlocks(this.browser)).length;
    chai.assert.equal(
      before - 2,
      after,
      'Expected there to be fewer blocks after undoing and redoing a delete',
    );
  });
});
