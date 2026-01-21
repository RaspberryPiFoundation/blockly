/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import {Key} from 'webdriverio';
import {
  PAUSE_TIME,
  clickWorkspace,
  focusOnBlock,
  getAllBlocks,
  getBlockTypeFromWorkspace,
  getCategory,
  getSelectedBlockId,
  getSelectedBlockType,
  openMutatorForBlock,
  testFileLocations,
  testSetup,
} from './test_setup.mjs';

const testBlockJson = {
  'blocks': {
    'languageVersion': 0,
    'blocks': [
      {
        'type': 'controls_repeat_ext',
        'id': 'controls_repeat_1',
        'x': 88,
        'y': 88,
        'inputs': {
          'TIMES': {
            'shadow': {
              'type': 'math_number',
              'id': 'math_number_shadow_1',
              'fields': {
                'NUM': 10,
              },
            },
          },
          'DO': {
            'block': {
              'type': 'controls_if',
              'id': 'controls_if_1',
              'inputs': {
                'IF0': {
                  'block': {
                    'type': 'logic_boolean',
                    'id': 'logic_boolean_1',
                    'fields': {
                      'BOOL': 'TRUE',
                    },
                  },
                },
                'DO0': {
                  'block': {
                    'type': 'text_print',
                    'id': 'text_print_1',
                    'inputs': {
                      'TEXT': {
                        'shadow': {
                          'type': 'text',
                          'id': 'text_shadow_1',
                          'fields': {
                            'TEXT': 'abc',
                          },
                        },
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

async function loadStartBlocks(browser) {
  await browser.execute((stringifiedJson) => {
    // Hangs forever if the json isn't stringified ¯\_(ツ)_/¯
    const testBlockJson = JSON.parse(stringifiedJson);
    const workspace = Blockly.common.getMainWorkspace();
    Blockly.serialization.workspaces.load(testBlockJson, workspace);
  }, JSON.stringify(testBlockJson));
  await browser.pause(PAUSE_TIME);
}

suite('Clipboard test', async function () {
  // Setting timeout to unlimited as these tests take longer time to run
  this.timeout(0);

  // Clear the workspace and load start blocks
  setup(async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
    await this.browser.pause(PAUSE_TIME);
  });

  test('Paste block to/from main workspace', async function () {
    await loadStartBlocks(this.browser);
    // Select and copy the "true" block
    await focusOnBlock(this.browser, 'logic_boolean_1');
    await this.browser.pause(PAUSE_TIME);

    await this.browser.keys([Key.Ctrl, 'c']);
    await this.browser.pause(PAUSE_TIME);

    // Check how many blocks there are before pasting
    const allBlocksBeforePaste = await getAllBlocks(this.browser);

    // Paste the block while still in the main workspace
    await this.browser.keys([Key.Ctrl, 'v']);
    await this.browser.pause(PAUSE_TIME);

    // Check result
    const allBlocksAfterPaste = await getAllBlocks(this.browser);
    chai.assert.equal(
      allBlocksAfterPaste.length,
      allBlocksBeforePaste.length + 1,
      'Expected there to be one additional block after paste',
    );
    const focusedBlockId = await getSelectedBlockId(this.browser);
    chai.assert.notEqual(
      focusedBlockId,
      'logic_boolean_1',
      'Newly pasted block should be selected',
    );
    const focusedBlockType = await getSelectedBlockType(this.browser);
    chai.assert.equal(
      focusedBlockType,
      'logic_boolean',
      'Newly pasted block should be selected',
    );
  });

  test('Copying a block also copies and pastes its children', async function () {
    await loadStartBlocks(this.browser);
    // Select and copy the "if/else" block which has children
    await focusOnBlock(this.browser, 'controls_if_1');
    await this.browser.pause(PAUSE_TIME);

    await this.browser.keys([Key.Ctrl, 'c']);
    await this.browser.pause(PAUSE_TIME);

    // Check how many blocks there are before pasting
    const allBlocksBeforePaste = await getAllBlocks(this.browser);

    // Paste the block while still in the main workspace
    await this.browser.keys([Key.Ctrl, 'v']);
    await this.browser.pause(PAUSE_TIME);

    // Check result
    const allBlocksAfterPaste = await getAllBlocks(this.browser);
    chai.assert.equal(
      allBlocksAfterPaste.length,
      allBlocksBeforePaste.length + 4,
      'Expected there to be four additional blocks after paste',
    );
  });

  test('Paste shadow block to/from main workspace', async function () {
    await loadStartBlocks(this.browser);
    // Select and copy the shadow number block
    await focusOnBlock(this.browser, 'math_number_shadow_1');
    await this.browser.pause(PAUSE_TIME);

    await this.browser.keys([Key.Ctrl, 'c']);
    await this.browser.pause(PAUSE_TIME);

    // Check how many blocks there are before pasting
    const allBlocksBeforePaste = await getAllBlocks(this.browser);

    // Paste the block while still in the main workspace
    await this.browser.keys([Key.Ctrl, 'v']);
    await this.browser.pause(PAUSE_TIME);

    // Check result
    const allBlocksAfterPaste = await getAllBlocks(this.browser);
    chai.assert.equal(
      allBlocksAfterPaste.length,
      allBlocksBeforePaste.length + 1,
      'Expected there to be one additional block after paste',
    );
    const focusedBlockId = await getSelectedBlockId(this.browser);
    chai.assert.notEqual(
      focusedBlockId,
      'math_number_shadow_1',
      'Newly pasted block should be selected',
    );
    const focusedBlockType = await getSelectedBlockType(this.browser);
    chai.assert.equal(
      focusedBlockType,
      'math_number',
      'Newly pasted block should be selected',
    );
    const focusedBlockIsShadow = await this.browser.execute(() => {
      return Blockly.common.getSelected().isShadow();
    });
    chai.assert.isFalse(
      focusedBlockIsShadow,
      'Expected the pasted version of the block to not be a shadow block',
    );
  });

  test('Copy block from flyout, paste to main workspace', async function () {
    // Open flyout
    await getCategory(this.browser, 'Logic').then((category) =>
      category.click(),
    );

    // Focus on first block in flyout
    await this.browser.execute(() => {
      const ws = Blockly.getMainWorkspace().getFlyout().getWorkspace();
      const block = ws.getBlocksByType('controls_if')[0];
      Blockly.getFocusManager().focusNode(block);
    });
    await this.browser.pause(PAUSE_TIME);

    // Copy
    await this.browser.keys([Key.Ctrl, 'c']);
    await this.browser.pause(PAUSE_TIME);

    // Select the main workspace
    await clickWorkspace(this.browser);
    await this.browser.pause(PAUSE_TIME);

    // Paste
    await this.browser.keys([Key.Ctrl, 'v']);
    await this.browser.pause(PAUSE_TIME);

    // Check that the block is now on the workspace and selected
    const allBlocks = await getAllBlocks(this.browser);
    chai.assert.equal(
      allBlocks.length,
      1,
      'Expected there to be one block on main workspace after paste from flyout',
    );

    const focusedBlockType = await getSelectedBlockType(this.browser);
    chai.assert.equal(
      focusedBlockType,
      'controls_if',
      'Newly pasted block should be selected',
    );
  });

  test('Copy block from flyout, paste while flyout focused', async function () {
    // Open flyout
    await getCategory(this.browser, 'Logic').then((category) =>
      category.click(),
    );

    // Focus on first block in flyout
    await this.browser.execute(() => {
      const ws = Blockly.getMainWorkspace().getFlyout().getWorkspace();
      const block = ws.getBlocksByType('controls_if')[0];
      Blockly.getFocusManager().focusNode(block);
    });
    await this.browser.pause(PAUSE_TIME);

    // Copy
    await this.browser.keys([Key.Ctrl, 'c']);
    await this.browser.pause(PAUSE_TIME);

    // Paste
    await this.browser.keys([Key.Ctrl, 'v']);
    await this.browser.pause(PAUSE_TIME);

    // Check that the flyout is closed
    const flyoutIsVisible = await this.browser
      .$('.blocklyToolboxFlyout')
      .then((elem) => elem.isDisplayed());
    chai.assert.isFalse(flyoutIsVisible, 'Expected flyout to not be open');

    // Check that the block is now on the main workspace and selected
    const allBlocks = await getAllBlocks(this.browser);
    chai.assert.equal(
      allBlocks.length,
      1,
      'Expected there to be one block on main workspace after paste from flyout',
    );

    const focusedBlockType = await getSelectedBlockType(this.browser);
    chai.assert.equal(
      focusedBlockType,
      'controls_if',
      'Newly pasted block should be selected',
    );
  });

  test('Copy block from mutator flyout, paste to mutator workspace', async function () {
    // Load the start blocks
    await loadStartBlocks(this.browser);

    // Open the controls_if mutator
    const block = await getBlockTypeFromWorkspace(
      this.browser,
      'controls_if',
      0,
    );
    await openMutatorForBlock(this.browser, block);

    // Select the first block in the mutator flyout
    await this.browser.execute(
      (blockId, mutatorBlockType) => {
        const flyoutBlock = Blockly.getMainWorkspace()
          .getBlockById(blockId)
          .mutator.getWorkspace()
          .getFlyout()
          .getWorkspace()
          .getBlocksByType(mutatorBlockType)[0];

        Blockly.getFocusManager().focusNode(flyoutBlock);
      },
      'controls_if_1',
      'controls_if_elseif',
    );
    await this.browser.pause(PAUSE_TIME);

    // Copy
    await this.browser.keys([Key.Ctrl, 'c']);
    await this.browser.pause(PAUSE_TIME);

    // Paste
    await this.browser.keys([Key.Ctrl, 'v']);
    await this.browser.pause(PAUSE_TIME);

    // Check that the block is now in the mutator workspace and selected
    const numberOfIfElseBlocks = await this.browser.execute(
      (blockId, mutatorBlockType) => {
        return Blockly.getMainWorkspace()
          .getBlockById(blockId)
          .mutator.getWorkspace()
          .getBlocksByType(mutatorBlockType).length;
      },
      'controls_if_1',
      'controls_if_elseif',
    );

    chai.assert.equal(
      numberOfIfElseBlocks,
      1,
      'Expected there to be one if_else block in mutator workspace',
    );

    const focusedBlockType = await getSelectedBlockType(this.browser);
    chai.assert.equal(
      focusedBlockType,
      'controls_if_elseif',
      'Newly pasted block should be selected',
    );
  });

  test('Copy block from mutator flyout, paste to main workspace while mutator open', async function () {
    // Load the start blocks
    await loadStartBlocks(this.browser);

    // Open the controls_if mutator
    const block = await getBlockTypeFromWorkspace(
      this.browser,
      'controls_if',
      0,
    );
    await openMutatorForBlock(this.browser, block);

    // Select the first block in the mutator flyout
    await this.browser.execute(
      (blockId, mutatorBlockType) => {
        const flyoutBlock = Blockly.getMainWorkspace()
          .getBlockById(blockId)
          .mutator.getWorkspace()
          .getFlyout()
          .getWorkspace()
          .getBlocksByType(mutatorBlockType)[0];

        Blockly.getFocusManager().focusNode(flyoutBlock);
      },
      'controls_if_1',
      'controls_if_elseif',
    );
    await this.browser.pause(PAUSE_TIME);

    // Copy
    await this.browser.keys([Key.Ctrl, 'c']);
    await this.browser.pause(PAUSE_TIME);

    // Click the main workspace
    await clickWorkspace(this.browser);

    // Paste
    await this.browser.keys([Key.Ctrl, 'v']);
    await this.browser.pause(PAUSE_TIME);

    // Check that the block is now in the mutator workspace and selected
    const numberOfIfElseBlocks = await this.browser.execute(
      (blockId, mutatorBlockType) => {
        return Blockly.getMainWorkspace()
          .getBlockById(blockId)
          .mutator.getWorkspace()
          .getBlocksByType(mutatorBlockType).length;
      },
      'controls_if_1',
      'controls_if_elseif',
    );

    chai.assert.equal(
      numberOfIfElseBlocks,
      1,
      'Expected there to be one if_else block in mutator workspace',
    );

    const focusedBlockType = await getSelectedBlockType(this.browser);
    chai.assert.equal(
      focusedBlockType,
      'controls_if_elseif',
      'Newly pasted block should be selected',
    );

    // Check that there are no new blocks on the main workspace
    const numberOfIfElseBlocksOnMainWorkspace = await this.browser.execute(
      (mutatorBlockType) => {
        return Blockly.getMainWorkspace().getBlocksByType(mutatorBlockType)
          .length;
      },
      'controls_if_elseif',
    );
    chai.assert.equal(
      numberOfIfElseBlocksOnMainWorkspace,
      0,
      'Mutator blocks should not appear on main workspace',
    );
  });

  test('Copy block from mutator flyout, paste to main workspace while mutator closed', async function () {
    // Load the start blocks
    await loadStartBlocks(this.browser);

    // Open the controls_if mutator
    const block = await getBlockTypeFromWorkspace(
      this.browser,
      'controls_if',
      0,
    );
    await openMutatorForBlock(this.browser, block);

    // Select the first block in the mutator flyout
    await this.browser.execute(
      (blockId, mutatorBlockType) => {
        const flyoutBlock = Blockly.getMainWorkspace()
          .getBlockById(blockId)
          .mutator.getWorkspace()
          .getFlyout()
          .getWorkspace()
          .getBlocksByType(mutatorBlockType)[0];

        Blockly.getFocusManager().focusNode(flyoutBlock);
      },
      'controls_if_1',
      'controls_if_elseif',
    );
    await this.browser.pause(PAUSE_TIME);

    // Copy
    await this.browser.keys([Key.Ctrl, 'c']);
    await this.browser.pause(PAUSE_TIME);

    // Close the mutator flyout (calling this method on open mutator closes it)
    await openMutatorForBlock(this.browser, block);

    // Click the main workspace
    await clickWorkspace(this.browser);

    // Paste
    await this.browser.keys([Key.Ctrl, 'v']);
    await this.browser.pause(PAUSE_TIME);

    // Check that there are no new blocks on the main workspace
    const numberOfIfElseBlocksOnMainWorkspace = await this.browser.execute(
      (mutatorBlockType) => {
        return Blockly.getMainWorkspace().getBlocksByType(mutatorBlockType)
          .length;
      },
      'controls_if_elseif',
    );
    chai.assert.equal(
      numberOfIfElseBlocksOnMainWorkspace,
      0,
      'Mutator blocks should not appear on main workspace',
    );
  });

  test('Copy workspace comment, paste to main workspace', async function () {
    // Add a workspace comment to the workspace
    await this.browser.execute(() => {
      const workspace = Blockly.getMainWorkspace();
      const json = {
        'workspaceComments': [
          {
            'height': 100,
            'width': 120,
            'id': 'workspace_comment_1',
            'x': 13,
            'y': -12,
            'text': 'This is a comment',
          },
        ],
      };
      Blockly.serialization.workspaces.load(json, workspace);
    });
    await this.browser.pause(PAUSE_TIME);

    // Select the workspace comment
    await this.browser.execute(() => {
      const comment = Blockly.getMainWorkspace().getCommentById(
        'workspace_comment_1',
      );
      Blockly.getFocusManager().focusNode(comment);
    });
    await this.browser.pause(PAUSE_TIME);

    // Copy
    await this.browser.keys([Key.Ctrl, 'c']);
    await this.browser.pause(PAUSE_TIME);

    // Click the main workspace
    await clickWorkspace(this.browser);

    // Paste
    await this.browser.keys([Key.Ctrl, 'v']);
    await this.browser.pause(PAUSE_TIME);

    // Check that there are 2 comments on the workspace
    const numberOfComments = await this.browser.execute(() => {
      return Blockly.getMainWorkspace().getTopComments().length;
    });
    chai.assert.equal(
      numberOfComments,
      2,
      'Expected 2 workspace comments after pasting',
    );
  });

  test('Cut block from main workspace, paste to main workspace', async function () {
    await loadStartBlocks(this.browser);
    // Select and cut the "true" block
    await focusOnBlock(this.browser, 'logic_boolean_1');
    await this.browser.pause(PAUSE_TIME);

    await this.browser.keys([Key.Ctrl, 'x']);
    await this.browser.pause(PAUSE_TIME);

    // Check that the "true" block was deleted
    const trueBlock = await this.browser.execute(() => {
      return Blockly.getMainWorkspace().getBlockById('logic_boolean_1') ?? null;
    });
    chai.assert.isNull(trueBlock);

    // Check how many blocks there are before pasting
    const allBlocksBeforePaste = await getAllBlocks(this.browser);

    // Paste the block while still in the main workspace
    await this.browser.keys([Key.Ctrl, 'v']);
    await this.browser.pause(PAUSE_TIME);

    // Check result
    const allBlocksAfterPaste = await getAllBlocks(this.browser);
    chai.assert.equal(
      allBlocksAfterPaste.length,
      allBlocksBeforePaste.length + 1,
      'Expected there to be one additional block after paste',
    );
  });

  test('Cannot cut block from flyout', async function () {
    // Open flyout
    await getCategory(this.browser, 'Logic').then((category) =>
      category.click(),
    );

    // Focus on first block in flyout
    await this.browser.execute(() => {
      const ws = Blockly.getMainWorkspace().getFlyout().getWorkspace();
      const block = ws.getBlocksByType('controls_if')[0];
      Blockly.getFocusManager().focusNode(block);
    });
    await this.browser.pause(PAUSE_TIME);

    // Cut
    await this.browser.keys([Key.Ctrl, 'x']);
    await this.browser.pause(PAUSE_TIME);

    // Select the main workspace
    await clickWorkspace(this.browser);
    await this.browser.pause(PAUSE_TIME);

    // Paste
    await this.browser.keys([Key.Ctrl, 'v']);
    await this.browser.pause(PAUSE_TIME);

    // Check that no block was pasted
    const allBlocks = await getAllBlocks(this.browser);
    chai.assert.equal(
      allBlocks.length,
      0,
      'Expected no blocks in the workspace because nothing to paste',
    );
  });
});
