/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {assert} = require('chai');

/**
 * Runs test suite for plus/minus functionality for the  block of the given
 *    type.
 * @param {string} blockType The block type of block being tested.
 * @param {number} defaultInputCount The default count of inputs for this block.
 * @param {number} minimumInputCount The minimum allowed inputs for this block.
 * @param {string} inputPrefix The prefix to use to create input name for test.
 * @param {function(Blockly.Block, number)} assertBlockStructure The assertion
 *    function to use.
 */
function runPlusMinusTestSuite(
  blockType,
  defaultInputCount,
  minimumInputCount,
  inputPrefix,
  assertBlockStructure,
) {
  suite('Adding and removing inputs', function () {
    setup(function () {
      this.block = this.workspace.newBlock(blockType);
    });

    test('Add', function () {
      assertBlockStructure(this.block, defaultInputCount);
      this.block.plus();
      assertBlockStructure(this.block, defaultInputCount + 1);
    });

    test('Add many', function () {
      assertBlockStructure(this.block, defaultInputCount);
      for (let i = 0; i < 8; i++) {
        this.block.plus();
      }
      assertBlockStructure(this.block, defaultInputCount + 8);
    });

    if (defaultInputCount === minimumInputCount) {
      test('Remove', function () {
        assertBlockStructure(this.block, defaultInputCount);
        this.block.plus();
        this.block.minus();
        assertBlockStructure(this.block, defaultInputCount);
      });
    } else {
      test('Remove', function () {
        assertBlockStructure(this.block, defaultInputCount);
        this.block.minus();
        assertBlockStructure(this.block, defaultInputCount - 1);
      });
    }

    test('Remove many', function () {
      assertBlockStructure(this.block, defaultInputCount);
      for (let i = 0; i < 8; i++) {
        this.block.plus();
      }
      for (let i = 0; i < 5; i++) {
        this.block.minus();
      }
      assertBlockStructure(this.block, defaultInputCount + 3);
    });

    test('Remove too many', function () {
      assertBlockStructure(this.block, defaultInputCount);
      for (let i = 0; i < defaultInputCount + 1; i++) {
        this.block.minus();
      }
      assertBlockStructure(this.block, minimumInputCount);
    });

    test('Remove with child attached', function () {
      const block = this.workspace.newBlock('logic_boolean');
      assertBlockStructure(this.block, defaultInputCount);

      let inputCount = defaultInputCount;
      if (minimumInputCount === defaultInputCount) {
        this.block.plus();
        inputCount++;
      }

      const childInputName = inputPrefix + (inputCount - 1);

      this.block
        .getInput(childInputName)
        .connection.connect(block.outputConnection);
      assert.equal(this.block.getInputTargetBlock(childInputName), block);

      this.block.minus();
      assertBlockStructure(this.block, inputCount - 1);
      assert.isNull(this.block.getInputTargetBlock(childInputName));
      assert.isNull(block.outputConnection.targetBlock());

      // Assert that it does not get reattached. Only reattach on undo.
      this.block.plus();
      assertBlockStructure(this.block, inputCount);
      assert.isNull(block.outputConnection.targetBlock());
    });
  });
}

module.exports = {
  runPlusMinusTestSuite,
};
