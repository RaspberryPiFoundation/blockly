/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  addMessageToCleanup,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {assertNoWarnings, assertWarnings} from './test_helpers/warnings.js';

suite('JSON Block Definitions', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace_ = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('defineBlocksWithJsonArray', function () {
    test('Basic block', function () {
      /**  Ensure a block can be instantiated from a JSON definition.  */
      const BLOCK_TYPE = 'test_json_minimal';
      let block;
      assertNoWarnings(() => {
        Blockly.defineBlocksWithJsonArray([
          {
            'type': BLOCK_TYPE,
          },
        ]);
        block = new Blockly.Block(this.workspace_, BLOCK_TYPE);
      });

      assert.isNotNull(block);
      assert.equal(BLOCK_TYPE, block.type);
    });

    test('Null or undefined type id', function () {
      const BLOCK_TYPE1 = 'test_json_before_bad_blocks';
      const BLOCK_TYPE2 = 'test_json_after_bad_blocks';

      assert.isUndefined(Blockly.Blocks[BLOCK_TYPE1]);
      assert.isUndefined(Blockly.Blocks[BLOCK_TYPE2]);
      const blockTypeCount = Object.keys(Blockly.Blocks).length;

      assertWarnings(() => {
        Blockly.defineBlocksWithJsonArray([
          {'type': BLOCK_TYPE1},
          {'type': undefined},
          {'type': null},
          {'type': BLOCK_TYPE2},
        ]);
      }, [/missing a type attribute/, /missing a type attribute/]);
      assert.isNotNull(
        Blockly.Blocks[BLOCK_TYPE1],
        'Block before bad blocks should be defined.',
      );
      assert.isNotNull(
        Blockly.Blocks[BLOCK_TYPE2],
        'Block after bad blocks should be defined.',
      );
      assert.equal(Object.keys(Blockly.Blocks).length, blockTypeCount + 2);
    });

    test('Null item', function () {
      const BLOCK_TYPE1 = 'test_block_before_null';
      const BLOCK_TYPE2 = 'test_block_after_null';

      assert.isUndefined(Blockly.Blocks[BLOCK_TYPE1]);
      assert.isUndefined(Blockly.Blocks[BLOCK_TYPE2]);
      const blockTypeCount = Object.keys(Blockly.Blocks).length;

      assertWarnings(() => {
        Blockly.defineBlocksWithJsonArray([
          {
            'type': BLOCK_TYPE1,
            'message0': 'before',
          },
          null,
          {
            'type': BLOCK_TYPE2,
            'message0': 'after',
          },
        ]);
      }, /is null/);
      assert.isNotNull(
        Blockly.Blocks[BLOCK_TYPE1],
        'Block before null in array should be defined.',
      );
      assert.isNotNull(
        Blockly.Blocks[BLOCK_TYPE2],
        'Block after null in array should be defined.',
      );
      assert.equal(Object.keys(Blockly.Blocks).length, blockTypeCount + 2);
    });

    test('Undefined item', function () {
      const BLOCK_TYPE1 = 'test_block_before_undefined';
      const BLOCK_TYPE2 = 'test_block_after_undefined';

      assert.isUndefined(Blockly.Blocks[BLOCK_TYPE1]);
      assert.isUndefined(Blockly.Blocks[BLOCK_TYPE2]);
      const blockTypeCount = Object.keys(Blockly.Blocks).length;
      assertWarnings(() => {
        Blockly.defineBlocksWithJsonArray([
          {
            'type': BLOCK_TYPE1,
            'message0': 'before',
          },
          undefined,
          {
            'type': BLOCK_TYPE2,
            'message0': 'after',
          },
        ]);
      }, /is undefined/);
      assert.isNotNull(
        Blockly.Blocks[BLOCK_TYPE1],
        'Block before undefined in array should be defined.',
      );
      assert.isNotNull(
        Blockly.Blocks[BLOCK_TYPE2],
        'Block after undefined in array should be defined.',
      );
      assert.equal(Object.keys(Blockly.Blocks).length, blockTypeCount + 2);
    });

    test('message0 creates input', function () {
      const BLOCK_TYPE = 'test_json_message0';
      const MESSAGE0 = 'message0';
      Blockly.defineBlocksWithJsonArray([
        {
          'type': BLOCK_TYPE,
          'message0': MESSAGE0,
        },
      ]);

      const block = new Blockly.Block(this.workspace_, BLOCK_TYPE);
      assert.equal(block.inputList.length, 1);
      assert.equal(block.inputList[0].fieldRow.length, 1);
      const textField = block.inputList[0].fieldRow[0];
      assert.equal(Blockly.FieldLabel, textField.constructor);
      assert.equal(MESSAGE0, textField.getText());
    });

    test('message1 and message0 creates two inputs', function () {
      /**  Ensure message1 creates a new input.  */
      const BLOCK_TYPE = 'test_json_message1';
      const MESSAGE0 = 'message0';
      const MESSAGE1 = 'message1';
      Blockly.defineBlocksWithJsonArray([
        {
          'type': BLOCK_TYPE,
          'message0': MESSAGE0,
          'message1': MESSAGE1,
        },
      ]);

      const block = new Blockly.Block(this.workspace_, BLOCK_TYPE);
      assert.equal(block.inputList.length, 2);

      assert.equal(block.inputList[0].fieldRow.length, 1);
      const firstTextField = block.inputList[0].fieldRow[0];
      assert.equal(Blockly.FieldLabel, firstTextField.constructor);
      assert.equal(MESSAGE0, firstTextField.getText());

      assert.equal(block.inputList[1].fieldRow.length, 1);
      const secondTextField = block.inputList[1].fieldRow[0];
      assert.equal(Blockly.FieldLabel, secondTextField.constructor);
      assert.equal(MESSAGE1, secondTextField.getText());
    });

    test('Message string is dereferenced', function () {
      const BLOCK_TYPE = 'test_json_message0_i18n';
      const MESSAGE0 = '%{BKY_MESSAGE}';
      const MESSAGE = 'message';

      addMessageToCleanup(this.sharedCleanup, 'MESSAGE');
      Blockly.Msg['MESSAGE'] = MESSAGE;
      Blockly.defineBlocksWithJsonArray([
        {
          'type': BLOCK_TYPE,
          'message0': MESSAGE0,
        },
      ]);

      const block = new Blockly.Block(this.workspace_, BLOCK_TYPE);
      assert.equal(block.inputList.length, 1);
      assert.equal(block.inputList[0].fieldRow.length, 1);
      const textField = block.inputList[0].fieldRow[0];
      assert.equal(Blockly.FieldLabel, textField.constructor);
      assert.equal(MESSAGE, textField.getText());
    });

    test('Dropdown', function () {
      const BLOCK_TYPE = 'test_json_dropdown';
      const FIELD_NAME = 'FIELD_NAME';
      const LABEL0 = 'LABEL0';
      const VALUE0 = 'VALUE0';
      const LABEL1 = 'LABEL1';
      const VALUE1 = 'VALUE1';
      Blockly.defineBlocksWithJsonArray([
        {
          'type': BLOCK_TYPE,
          'message0': '%1',
          'args0': [
            {
              'type': 'field_dropdown',
              'name': FIELD_NAME,
              'options': [
                [LABEL0, VALUE0],
                [LABEL1, VALUE1],
              ],
            },
          ],
        },
      ]);

      const block = new Blockly.Block(this.workspace_, BLOCK_TYPE);
      assert.equal(block.inputList.length, 1);
      assert.equal(block.inputList[0].fieldRow.length, 1);
      const dropdown = block.inputList[0].fieldRow[0];
      assert.equal(dropdown, block.getField(FIELD_NAME));
      assert.equal(Blockly.FieldDropdown, dropdown.constructor);
      assert.equal(VALUE0, dropdown.getValue());

      const options = dropdown.getOptions();
      assert.equal(LABEL0, options[0][0]);
      assert.equal(VALUE0, options[0][1]);
      assert.equal(LABEL1, options[1][0]);
      assert.equal(VALUE1, options[1][1]);
    });

    test('Dropdown with images', function () {
      const BLOCK_TYPE = 'test_json_dropdown';
      const FIELD_NAME = 'FIELD_NAME';
      const IMAGE1_ALT_TEXT = 'Localized message.';
      addMessageToCleanup(this.sharedCleanup, 'ALT_TEXT');
      Blockly.Msg['ALT_TEXT'] = IMAGE1_ALT_TEXT;
      const IMAGE0 = {
        'width': 12,
        'height': 34,
        'src': 'http://image0.src',
        'alt': 'IMAGE0 alt text',
      };
      const VALUE0 = 'VALUE0';
      const IMAGE1 = {
        'width': 56,
        'height': 78,
        'src': 'http://image1.src',
        'alt': '%{BKY_ALT_TEXT}',
      };
      const VALUE1 = 'VALUE1';

      Blockly.defineBlocksWithJsonArray([
        {
          'type': BLOCK_TYPE,
          'message0': '%1',
          'args0': [
            {
              'type': 'field_dropdown',
              'name': FIELD_NAME,
              'options': [
                [IMAGE0, VALUE0],
                [IMAGE1, VALUE1],
              ],
            },
          ],
        },
      ]);

      const block = new Blockly.Block(this.workspace_, BLOCK_TYPE);
      assert.equal(block.inputList.length, 1);
      assert.equal(block.inputList[0].fieldRow.length, 1);
      const dropdown = block.inputList[0].fieldRow[0];
      assert.equal(dropdown, block.getField(FIELD_NAME));
      assert.equal(Blockly.FieldDropdown, dropdown.constructor);
      assert.equal(VALUE0, dropdown.getValue());

      function assertImageEquals(actualImage, expectedImage) {
        assert.equal(actualImage.width, expectedImage.width);
        assert.equal(actualImage.height, expectedImage.height);
        assert.equal(actualImage.src, expectedImage.src);
      }

      const options = dropdown.getOptions();
      const image0 = options[0][0];
      assertImageEquals(IMAGE0, image0);
      assert.equal(IMAGE0.alt, image0.alt);
      assert.equal(options[0][1], VALUE0);

      const image1 = options[1][0];
      assertImageEquals(IMAGE1, image1);
      assert.equal(image1.alt, IMAGE1_ALT_TEXT); // Via Msg reference
      assert.equal(VALUE1, options[1][1]);
    });
  });
});
