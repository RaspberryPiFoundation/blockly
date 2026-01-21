/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('Navigation', function () {
  setup(function () {
    sharedTestSetup.call(this);
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'input_statement',
        'message0': '%1 %2 %3 %4',
        'args0': [
          {
            'type': 'field_input',
            'name': 'NAME',
            'text': 'default',
          },
          {
            'type': 'field_input',
            'name': 'NAME',
            'text': 'default',
          },
          {
            'type': 'input_value',
            'name': 'NAME',
          },
          {
            'type': 'input_statement',
            'name': 'NAME',
          },
        ],
        'previousStatement': null,
        'nextStatement': null,
        'colour': 230,
        'tooltip': '',
        'helpUrl': '',
      },
      {
        'type': 'value_input',
        'message0': '%1',
        'args0': [
          {
            'type': 'input_value',
            'name': 'NAME',
          },
        ],
        'colour': 230,
        'tooltip': '',
        'helpUrl': '',
      },
      {
        'type': 'field_input',
        'message0': '%1',
        'args0': [
          {
            'type': 'field_input',
            'name': 'NAME',
            'text': 'default',
          },
        ],
        'output': null,
        'colour': 230,
        'tooltip': '',
        'helpUrl': '',
      },
      {
        'type': 'double_value_input',
        'message0': '%1 %2',
        'args0': [
          {
            'type': 'input_value',
            'name': 'NAME1',
          },
          {
            'type': 'input_value',
            'name': 'NAME2',
          },
        ],
      },
    ]);
    this.workspace = Blockly.inject('blocklyDiv', {});
    this.navigator = this.workspace.getNavigator();
    const statementInput1 = this.workspace.newBlock('input_statement');
    const statementInput2 = this.workspace.newBlock('input_statement');
    const statementInput3 = this.workspace.newBlock('input_statement');
    const statementInput4 = this.workspace.newBlock('input_statement');
    const fieldWithOutput = this.workspace.newBlock('field_input');
    const doubleValueInput = this.workspace.newBlock('double_value_input');
    const valueInput = this.workspace.newBlock('value_input');

    statementInput1.nextConnection.connect(statementInput2.previousConnection);
    statementInput1.inputList[0].connection.connect(
      fieldWithOutput.outputConnection,
    );
    statementInput2.inputList[1].connection.connect(
      statementInput3.previousConnection,
    );

    this.blocks = {
      statementInput1: statementInput1,
      statementInput2: statementInput2,
      statementInput3: statementInput3,
      statementInput4: statementInput4,
      fieldWithOutput: fieldWithOutput,
      valueInput: valueInput,
      doubleValueInput,
    };
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('NavigationFunctions', function () {
    setup(function () {
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'top_connection',
          'message0': '',
          'previousStatement': null,
          'colour': 230,
          'tooltip': '',
          'helpUrl': '',
        },
        {
          'type': 'start_block',
          'message0': '',
          'nextStatement': null,
          'colour': 230,
          'tooltip': '',
          'helpUrl': '',
        },
        {
          'type': 'fields_and_input',
          'message0': '%1 hi %2 %3 %4',
          'args0': [
            {
              'type': 'field_input',
              'name': 'NAME',
              'text': 'default',
            },
            {
              'type': 'input_dummy',
            },
            {
              'type': 'field_input',
              'name': 'NAME',
              'text': 'default',
            },
            {
              'type': 'input_value',
              'name': 'NAME',
            },
          ],
          'previousStatement': null,
          'nextStatement': null,
          'colour': 230,
          'tooltip': '',
          'helpUrl': '',
        },
        {
          'type': 'two_fields',
          'message0': '%1 hi',
          'args0': [
            {
              'type': 'field_input',
              'name': 'NAME',
              'text': 'default',
            },
          ],
          'colour': 230,
          'tooltip': '',
          'helpUrl': '',
        },
        {
          'type': 'hidden_field',
          'message0': '%1 %2 %3',
          'args0': [
            {
              'type': 'field_input',
              'name': 'ONE',
              'text': 'default',
            },
            {
              'type': 'field_input',
              'name': 'TWO',
              'text': 'default',
            },
            {
              'type': 'field_input',
              'name': 'THREE',
              'text': 'default',
            },
          ],
          'colour': 230,
          'tooltip': '',
          'helpUrl': '',
        },
        {
          'type': 'fields_and_input2',
          'message0': '%1 %2 %3 %4 bye',
          'args0': [
            {
              'type': 'input_value',
              'name': 'NAME',
            },
            {
              'type': 'field_input',
              'name': 'NAME',
              'text': 'default',
            },
            {
              'type': 'input_value',
              'name': 'NAME',
            },
            {
              'type': 'input_statement',
              'name': 'NAME',
            },
          ],
          'colour': 230,
          'tooltip': '',
          'helpUrl': '',
        },
        {
          'type': 'dummy_input',
          'message0': 'Hello',
          'colour': 230,
          'tooltip': '',
          'helpUrl': '',
        },
        {
          'type': 'dummy_inputValue',
          'message0': 'Hello %1  %2',
          'args0': [
            {
              'type': 'input_dummy',
            },
            {
              'type': 'input_value',
              'name': 'NAME',
            },
          ],
          'colour': 230,
          'tooltip': '',
          'helpUrl': '',
        },
        {
          'type': 'output_next',
          'message0': '',
          'output': null,
          'colour': 230,
          'tooltip': '',
          'helpUrl': '',
          'nextStatement': null,
        },
        {
          'type': 'hidden_input',
          'message0': '%1 hi %2 %3 %4 %5 %6',
          'args0': [
            {
              'type': 'field_input',
              'name': 'ONE',
              'text': 'default',
            },
            {
              'type': 'input_dummy',
            },
            {
              'type': 'field_input',
              'name': 'TWO',
              'text': 'default',
            },
            {
              'type': 'input_value',
              'name': 'SECOND',
            },
            {
              'type': 'field_input',
              'name': 'THREE',
              'text': 'default',
            },
            {
              'type': 'input_value',
              'name': 'THIRD',
            },
          ],
          'previousStatement': null,
          'nextStatement': null,
          'colour': 230,
          'tooltip': '',
          'helpUrl': '',
        },
        {
          'type': 'buttons',
          'message0': 'If %1 %2 Then %3 %4 more %5 %6 %7',
          'args0': [
            {
              'type': 'field_image',
              'name': 'BUTTON1',
              'src': 'https://www.gstatic.com/codesite/ph/images/star_on.gif',
              'width': 30,
              'height': 30,
              'alt': '*',
            },
            {
              'type': 'input_value',
              'name': 'VALUE1',
              'check': '',
            },
            {
              'type': 'field_image',
              'name': 'BUTTON2',
              'src': 'https://www.gstatic.com/codesite/ph/images/star_on.gif',
              'width': 30,
              'height': 30,
              'alt': '*',
            },
            {
              'type': 'input_dummy',
              'name': 'DUMMY1',
              'check': '',
            },
            {
              'type': 'input_value',
              'name': 'VALUE2',
              'check': '',
            },
            {
              'type': 'input_statement',
              'name': 'STATEMENT1',
              'check': 'Number',
            },
            {
              'type': 'field_image',
              'name': 'BUTTON3',
              'src': 'https://www.gstatic.com/codesite/ph/images/star_on.gif',
              'width': 30,
              'height': 30,
              'alt': '*',
            },
          ],
          'previousStatement': null,
          'nextStatement': null,
          'colour': 230,
          'tooltip': '',
          'helpUrl': '',
        },
      ]);
      const noNextConnection = this.workspace.newBlock('top_connection');
      const fieldAndInputs = this.workspace.newBlock('fields_and_input');
      const twoFields = this.workspace.newBlock('two_fields');
      const fieldAndInputs2 = this.workspace.newBlock('fields_and_input2');
      const noPrevConnection = this.workspace.newBlock('start_block');
      const hiddenField = this.workspace.newBlock('hidden_field');
      const hiddenInput = this.workspace.newBlock('hidden_input');
      this.blocks.noNextConnection = noNextConnection;
      this.blocks.fieldAndInputs = fieldAndInputs;
      this.blocks.twoFields = twoFields;
      this.blocks.fieldAndInputs2 = fieldAndInputs2;
      this.blocks.noPrevConnection = noPrevConnection;
      this.blocks.hiddenField = hiddenField;
      this.blocks.hiddenInput = hiddenInput;

      hiddenField.inputList[0].fieldRow[1].setVisible(false);
      hiddenInput.inputList[1].setVisible(false);

      const dummyInput = this.workspace.newBlock('dummy_input');
      const dummyInputValue = this.workspace.newBlock('dummy_inputValue');
      const fieldWithOutput2 = this.workspace.newBlock('field_input');
      this.blocks.dummyInput = dummyInput;
      this.blocks.dummyInputValue = dummyInputValue;
      this.blocks.fieldWithOutput2 = fieldWithOutput2;

      const secondBlock = this.workspace.newBlock('input_statement');
      const outputNextBlock = this.workspace.newBlock('output_next');
      this.blocks.secondBlock = secondBlock;
      this.blocks.outputNextBlock = outputNextBlock;

      const buttonBlock = this.workspace.newBlock('buttons', 'button_block');
      const buttonInput1 = this.workspace.newBlock(
        'field_input',
        'button_input1',
      );
      const buttonInput2 = this.workspace.newBlock(
        'field_input',
        'button_input2',
      );
      const buttonNext = this.workspace.newBlock(
        'input_statement',
        'button_next',
      );
      buttonBlock.inputList[0].connection.connect(
        buttonInput1.outputConnection,
      );
      buttonBlock.inputList[2].connection.connect(
        buttonInput2.outputConnection,
      );
      buttonBlock.nextConnection.connect(buttonNext.previousConnection);
      // Make buttons by adding a click handler
      const clickHandler = function () {
        return;
      };
      buttonBlock.getField('BUTTON1').setOnClickHandler(clickHandler);
      buttonBlock.getField('BUTTON2').setOnClickHandler(clickHandler);
      buttonBlock.getField('BUTTON3').setOnClickHandler(clickHandler);
      this.blocks.buttonBlock = buttonBlock;
      this.blocks.buttonInput1 = buttonInput1;
      this.blocks.buttonInput2 = buttonInput2;
      this.blocks.buttonNext = buttonNext;

      this.workspace.cleanUp();
    });
    suite('Next', function () {
      setup(function () {
        this.singleBlockWorkspace = new Blockly.Workspace();
        const singleBlock = this.singleBlockWorkspace.newBlock('two_fields');
        this.blocks.singleBlock = singleBlock;
      });
      teardown(function () {
        workspaceTeardown.call(this, this.singleBlockWorkspace);
      });

      test('fromPreviousToBlock', function () {
        const prevConnection = this.blocks.statementInput1.previousConnection;
        const nextNode = this.navigator.getNextSibling(prevConnection);
        assert.equal(nextNode, this.blocks.statementInput1);
      });
      test('fromBlockToNextBlock', function () {
        const nextNode = this.navigator.getNextSibling(
          this.blocks.statementInput1,
        );
        assert.equal(nextNode, this.blocks.statementInput2);
      });
      test('fromNextToPrevious', function () {
        const nextConnection = this.blocks.statementInput1.nextConnection;
        const prevConnection = this.blocks.statementInput2.previousConnection;
        const nextNode = this.navigator.getNextSibling(nextConnection);
        assert.equal(nextNode, prevConnection);
      });
      test('fromInputToInput', function () {
        const input = this.blocks.doubleValueInput.inputList[0];
        const inputConnection =
          this.blocks.doubleValueInput.inputList[1].connection;
        const nextNode = this.navigator.getNextSibling(input.connection);
        assert.equal(nextNode, inputConnection);
      });
      test('fromInputToField', function () {
        const input = this.blocks.fieldAndInputs2.inputList[0];
        const field = this.blocks.fieldAndInputs2.inputList[1].fieldRow[0];
        const nextNode = this.navigator.getNextSibling(input.connection);
        assert.equal(nextNode, field);
      });
      test('fromInputToNull', function () {
        const input = this.blocks.fieldAndInputs2.inputList[2];
        const nextNode = this.navigator.getNextSibling(input.connection);
        assert.isNull(nextNode);
      });
      test('fromOutputToBlock', function () {
        const output = this.blocks.fieldWithOutput.outputConnection;
        const nextNode = this.navigator.getNextSibling(output);
        assert.equal(nextNode, this.blocks.fieldWithOutput);
      });
      test('fromFieldToNestedBlock', function () {
        const field = this.blocks.statementInput1.inputList[0].fieldRow[1];
        const inputConnection =
          this.blocks.statementInput1.inputList[0].connection;
        const nextNode = this.navigator.getNextSibling(field);
        assert.equal(nextNode, this.blocks.fieldWithOutput);
      });
      test('fromFieldToField', function () {
        const field = this.blocks.fieldAndInputs.inputList[0].fieldRow[0];
        const field2 = this.blocks.fieldAndInputs.inputList[1].fieldRow[0];
        const nextNode = this.navigator.getNextSibling(field);
        assert.equal(nextNode, field2);
      });
      test('fromFieldToNull', function () {
        const field = this.blocks.twoFields.inputList[0].fieldRow[0];
        const nextNode = this.navigator.getNextSibling(field);
        assert.isNull(nextNode);
      });
      test('skipsHiddenField', function () {
        const field = this.blocks.hiddenField.inputList[0].fieldRow[0];
        const field2 = this.blocks.hiddenField.inputList[0].fieldRow[2];
        const nextNode = this.navigator.getNextSibling(field);
        assert.equal(nextNode.name, field2.name);
      });
      test('skipsHiddenInput', function () {
        const field = this.blocks.hiddenInput.inputList[0].fieldRow[0];
        const nextNode = this.navigator.getNextSibling(field);
        assert.equal(
          nextNode,
          this.blocks.hiddenInput.inputList[2].fieldRow[0],
        );
      });
      test('from icon to icon', function () {
        this.blocks.statementInput1.setCommentText('test');
        this.blocks.statementInput1.setWarningText('test');
        const icons = this.blocks.statementInput1.getIcons();
        const nextNode = this.navigator.getNextSibling(icons[0]);
        assert.equal(nextNode, icons[1]);
      });
      test('from icon to field', function () {
        this.blocks.statementInput1.setCommentText('test');
        this.blocks.statementInput1.setWarningText('test');
        const icons = this.blocks.statementInput1.getIcons();
        const nextNode = this.navigator.getNextSibling(icons[1]);
        assert.equal(
          nextNode,
          this.blocks.statementInput1.inputList[0].fieldRow[0],
        );
      });
      test('from icon to null', function () {
        this.blocks.dummyInput.setCommentText('test');
        const icons = this.blocks.dummyInput.getIcons();
        const nextNode = this.navigator.getNextSibling(icons[0]);
        assert.isNull(nextNode);
      });
      test('fromBlockToFieldInNextInput', function () {
        const field = this.blocks.buttonBlock.getField('BUTTON2');
        const nextNode = this.navigator.getNextSibling(
          this.blocks.buttonInput1,
        );
        assert.equal(nextNode, field);
      });
      test('fromBlockToFieldSkippingInput', function () {
        const field = this.blocks.buttonBlock.getField('BUTTON3');
        const nextNode = this.navigator.getNextSibling(
          this.blocks.buttonInput2,
        );
        assert.equal(nextNode, field);
      });
      test('skipsChildrenOfCollapsedBlocks', function () {
        this.blocks.buttonBlock.setCollapsed(true);
        const nextNode = this.navigator.getNextSibling(this.blocks.buttonBlock);
        assert.equal(nextNode.id, this.blocks.buttonNext.id);
      });
      test('fromFieldSkipsHiddenInputs', function () {
        this.blocks.buttonBlock.inputList[2].setVisible(false);
        const fieldStart = this.blocks.buttonBlock.getField('BUTTON2');
        const fieldEnd = this.blocks.buttonBlock.getField('BUTTON3');
        const nextNode = this.navigator.getNextSibling(fieldStart);
        assert.equal(nextNode.name, fieldEnd.name);
      });
    });

    suite('Previous', function () {
      test('fromPreviousToNext', function () {
        const prevConnection = this.blocks.statementInput2.previousConnection;
        const prevNode = this.navigator.getPreviousSibling(prevConnection);
        const nextConnection = this.blocks.statementInput1.nextConnection;
        assert.equal(prevNode, nextConnection);
      });
      test('fromPreviousToInput', function () {
        const prevConnection = this.blocks.statementInput3.previousConnection;
        const prevNode = this.navigator.getPreviousSibling(prevConnection);
        assert.isNull(prevNode);
      });
      test('fromBlockToPrevious', function () {
        const prevNode = this.navigator.getPreviousSibling(
          this.blocks.statementInput2,
        );
        const previousBlock = this.blocks.statementInput1;
        assert.equal(prevNode, previousBlock);
      });
      test('fromOutputBlockToPreviousField', function () {
        const prevNode = this.navigator.getPreviousSibling(
          this.blocks.fieldWithOutput,
        );
        const outputConnection = this.blocks.fieldWithOutput.outputConnection;
        assert.equal(prevNode, [...this.blocks.statementInput1.getFields()][1]);
      });
      test('fromNextToBlock', function () {
        const nextConnection = this.blocks.statementInput1.nextConnection;
        const prevNode = this.navigator.getPreviousSibling(nextConnection);
        assert.equal(prevNode, this.blocks.statementInput1);
      });
      test('fromInputToField', function () {
        // Disconnect the block that was connected to the input we're testing,
        // because we only navigate to/from empty input connections (if they're
        // connected navigation targets the connected block, bypassing the
        // connection).
        this.blocks.fieldWithOutput.outputConnection.disconnect();
        const input = this.blocks.statementInput1.inputList[0];
        const prevNode = this.navigator.getPreviousSibling(input.connection);
        assert.equal(prevNode, input.fieldRow[1]);
      });
      test('fromInputToNull', function () {
        const input = this.blocks.fieldAndInputs2.inputList[0];
        const prevNode = this.navigator.getPreviousSibling(input.connection);
        assert.isNull(prevNode);
      });
      test('fromInputToInput', function () {
        const input = this.blocks.doubleValueInput.inputList[1];
        const inputConnection =
          this.blocks.doubleValueInput.inputList[0].connection;
        const prevNode = this.navigator.getPreviousSibling(input.connection);
        assert.equal(prevNode, inputConnection);
      });
      test('fromOutputToNull', function () {
        const output = this.blocks.fieldWithOutput.outputConnection;
        const prevNode = this.navigator.getPreviousSibling(output);
        assert.isNull(prevNode);
      });
      test('fromFieldToNull', function () {
        const field = this.blocks.statementInput1.inputList[0].fieldRow[0];
        const prevNode = this.navigator.getPreviousSibling(field);
        assert.isNull(prevNode);
      });
      test('fromFieldToInput', function () {
        const outputBlock = this.workspace.newBlock('field_input');
        this.blocks.fieldAndInputs2.inputList[0].connection.connect(
          outputBlock.outputConnection,
        );

        const field = this.blocks.fieldAndInputs2.inputList[1].fieldRow[0];
        const inputConnection =
          this.blocks.fieldAndInputs2.inputList[0].connection;
        const prevNode = this.navigator.getPreviousSibling(field);
        assert.equal(prevNode, outputBlock);
      });
      test('fromFieldToField', function () {
        const field = this.blocks.fieldAndInputs.inputList[1].fieldRow[0];
        const field2 = this.blocks.fieldAndInputs.inputList[0].fieldRow[0];
        const prevNode = this.navigator.getPreviousSibling(field);
        assert.equal(prevNode, field2);
      });
      test('skipsHiddenField', function () {
        const field = this.blocks.hiddenField.inputList[0].fieldRow[2];
        const field2 = this.blocks.hiddenField.inputList[0].fieldRow[0];
        const prevNode = this.navigator.getPreviousSibling(field);
        assert.equal(prevNode.name, field2.name);
      });
      test('skipsHiddenInput', function () {
        const field = this.blocks.hiddenInput.inputList[2].fieldRow[0];
        const nextNode = this.navigator.getPreviousSibling(field);
        assert.equal(
          nextNode,
          this.blocks.hiddenInput.inputList[0].fieldRow[0],
        );
      });
      test('from icon to icon', function () {
        this.blocks.statementInput1.setCommentText('test');
        this.blocks.statementInput1.setWarningText('test');
        const icons = this.blocks.statementInput1.getIcons();
        const prevNode = this.navigator.getPreviousSibling(icons[1]);
        assert.equal(prevNode, icons[0]);
      });
      test('from field to icon', function () {
        this.blocks.statementInput1.setCommentText('test');
        this.blocks.statementInput1.setWarningText('test');
        const icons = this.blocks.statementInput1.getIcons();
        const prevNode = this.navigator.getPreviousSibling(
          this.blocks.statementInput1.inputList[0].fieldRow[0],
        );
        assert.equal(prevNode, icons[1]);
      });
      test('from icon to null', function () {
        this.blocks.dummyInput.setCommentText('test');
        const icons = this.blocks.dummyInput.getIcons();
        const prevNode = this.navigator.getPreviousSibling(icons[0]);
        assert.isNull(prevNode);
      });
      test('fromBlockToFieldInSameInput', function () {
        const field = this.blocks.buttonBlock.getField('BUTTON1');
        const prevNode = this.navigator.getPreviousSibling(
          this.blocks.buttonInput1,
        );
        assert.equal(prevNode, field);
      });
      test('fromBlockToFieldInPrevInput', function () {
        const field = this.blocks.buttonBlock.getField('BUTTON2');
        const prevNode = this.navigator.getPreviousSibling(
          this.blocks.buttonInput2,
        );
        assert.equal(prevNode, field);
      });
      test('skipsChildrenOfCollapsedBlocks', function () {
        this.blocks.buttonBlock.setCollapsed(true);
        const prevNode = this.navigator.getPreviousSibling(
          this.blocks.buttonNext,
        );
        assert.equal(prevNode.id, this.blocks.buttonBlock.id);
      });
      test('fromFieldSkipsHiddenInputs', function () {
        this.blocks.buttonBlock.inputList[2].setVisible(false);
        const fieldStart = this.blocks.buttonBlock.getField('BUTTON3');
        const fieldEnd = this.blocks.buttonBlock.getField('BUTTON2');
        const nextNode = this.navigator.getPreviousSibling(fieldStart);
        assert.equal(nextNode.name, fieldEnd.name);
      });
    });

    suite('In', function () {
      setup(function () {
        this.emptyWorkspace = Blockly.inject(document.createElement('div'), {});
      });
      teardown(function () {
        workspaceTeardown.call(this, this.emptyWorkspace);
      });

      test('fromInputToOutput', function () {
        const input = this.blocks.statementInput1.inputList[0];
        const inNode = this.navigator.getFirstChild(input.connection);
        const outputConnection = this.blocks.fieldWithOutput.outputConnection;
        assert.equal(inNode, outputConnection);
      });
      test('fromInputToNull', function () {
        const input = this.blocks.statementInput2.inputList[0];
        const inNode = this.navigator.getFirstChild(input.connection);
        assert.isNull(inNode);
      });
      test('fromInputToPrevious', function () {
        const input = this.blocks.statementInput2.inputList[1];
        const previousConnection =
          this.blocks.statementInput3.previousConnection;
        const inNode = this.navigator.getFirstChild(input.connection);
        assert.equal(inNode, previousConnection);
      });
      test('fromBlockToInput', function () {
        const connection = this.blocks.valueInput.inputList[0].connection;
        const inNode = this.navigator.getFirstChild(this.blocks.valueInput);
        assert.equal(inNode, connection);
      });
      test('fromBlockToField', function () {
        const inNode = this.navigator.getFirstChild(
          this.blocks.statementInput1,
        );
        const field = this.blocks.statementInput1.inputList[0].fieldRow[0];
        assert.equal(inNode, field);
      });
      test('fromBlockToNull_DummyInput', function () {
        const inNode = this.navigator.getFirstChild(this.blocks.dummyInput);
        assert.isNull(inNode);
      });
      test('fromBlockToInput_DummyInputValue', function () {
        const inNode = this.navigator.getFirstChild(
          this.blocks.dummyInputValue,
        );
        assert.equal(
          inNode,
          this.blocks.dummyInputValue.inputList[1].connection,
        );
      });
      test('fromOuputToNull', function () {
        const output = this.blocks.fieldWithOutput.outputConnection;
        const inNode = this.navigator.getFirstChild(output);
        assert.isNull(inNode);
      });
      test('fromFieldToNull', function () {
        const field = this.blocks.statementInput1.inputList[0].fieldRow[0];
        const inNode = this.navigator.getFirstChild(field);
        assert.isNull(inNode);
      });
      test('fromWorkspaceToBlock', function () {
        const inNode = this.navigator.getFirstChild(this.workspace);
        assert.equal(inNode, this.workspace.getTopBlocks(true)[0]);
      });
      test('fromWorkspaceToNull', function () {
        const inNode = this.navigator.getFirstChild(this.emptyWorkspace);
        assert.isNull(inNode);
      });
      test('from block to icon', function () {
        this.blocks.dummyInput.setCommentText('test');
        const icons = this.blocks.dummyInput.getIcons();
        const inNode = this.navigator.getFirstChild(this.blocks.dummyInput);
        assert.equal(inNode, icons[0]);
      });
      test('from icon to null', function () {
        this.blocks.dummyInput.setCommentText('test');
        const icons = this.blocks.dummyInput.getIcons();
        const inNode = this.navigator.getFirstChild(icons[0]);
        assert.isNull(inNode);
      });
      test('skipsChildrenOfCollapsedBlocks', function () {
        this.blocks.buttonBlock.setCollapsed(true);
        const inNode = this.navigator.getFirstChild(this.blocks.buttonBlock);
        assert.isNull(inNode);
      });
    });

    suite('Out', function () {
      setup(function () {
        const secondBlock = this.blocks.secondBlock;
        const outputNextBlock = this.blocks.outputNextBlock;
        this.blocks.noPrevConnection.nextConnection.connect(
          secondBlock.previousConnection,
        );
        secondBlock.inputList[0].connection.connect(
          outputNextBlock.outputConnection,
        );
      });

      test('fromInputToBlock', function () {
        const input = this.blocks.statementInput1.inputList[0];
        const outNode = this.navigator.getParent(input.connection);
        assert.equal(outNode, this.blocks.statementInput1);
      });
      test('fromOutputToBlock', function () {
        const output = this.blocks.fieldWithOutput.outputConnection;
        const outNode = this.navigator.getParent(output);
        assert.equal(outNode, this.blocks.fieldWithOutput);
      });
      test('fromOutputToBlock', function () {
        const output = this.blocks.fieldWithOutput2.outputConnection;
        const outNode = this.navigator.getParent(output);
        assert.equal(outNode, this.blocks.fieldWithOutput2);
      });
      test('fromFieldToBlock', function () {
        const field = this.blocks.statementInput1.inputList[0].fieldRow[0];
        const outNode = this.navigator.getParent(field);
        assert.equal(outNode, this.blocks.statementInput1);
      });
      test('fromPreviousToBlock', function () {
        const previous = this.blocks.statementInput2.previousConnection;
        const outNode = this.navigator.getParent(previous);
        assert.equal(outNode, this.blocks.statementInput2);
      });
      test('fromNextToBlock', function () {
        const next = this.blocks.statementInput2.nextConnection;
        const outNode = this.navigator.getParent(next);
        assert.equal(outNode, this.blocks.statementInput2);
      });
      test('fromNextToBlock_NoPreviousConnection', function () {
        const next = this.blocks.secondBlock.nextConnection;
        const outNode = this.navigator.getParent(next);
        assert.equal(outNode, this.blocks.secondBlock);
      });
      /**
       * This is where there is a block with both an output connection and a
       * next connection attached to an input.
       */
      test('fromNextToBlock_OutputAndPreviousConnection', function () {
        const next = this.blocks.outputNextBlock.nextConnection;
        const outNode = this.navigator.getParent(next);
        assert.equal(outNode, this.blocks.outputNextBlock);
      });
      test('fromBlockToWorkspace', function () {
        const outNode = this.navigator.getParent(this.blocks.statementInput2);
        assert.equal(outNode, this.workspace);
      });
      test('fromBlockToEnclosingStatement', function () {
        const enclosingStatement = this.blocks.statementInput2;
        const outNode = this.navigator.getParent(this.blocks.statementInput3);
        assert.equal(outNode, enclosingStatement);
      });
      test('fromTopBlockToWorkspace', function () {
        const outNode = this.navigator.getParent(this.blocks.statementInput1);
        assert.equal(outNode, this.workspace);
      });
      test('fromOutputBlockToWorkspace', function () {
        const outNode = this.navigator.getParent(this.blocks.fieldWithOutput2);
        assert.equal(outNode, this.workspace);
      });
      test('fromOutputNextBlockToWorkspace', function () {
        const inputConnection = this.blocks.secondBlock;
        const outNode = this.navigator.getParent(this.blocks.outputNextBlock);
        assert.equal(outNode, inputConnection);
      });
      test('from icon to block', function () {
        this.blocks.dummyInput.setCommentText('test');
        const icons = this.blocks.dummyInput.getIcons();
        const outNode = this.navigator.getParent(icons[0]);
        assert.equal(outNode, this.blocks.dummyInput);
      });
    });
  });
});
