/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as eventUtils from '../../../build/src/core/events/utils.js';
import {assert} from '../../../node_modules/chai/index.js';
import {runSerializationTestSuite} from '../test_helpers/serialization.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from '../test_helpers/setup_teardown.js';

suite('Logic ternary', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  /**
   * Asserts that the logic ternary block has the expected inputs and fields.
   * @param {!Blockly.Block} block The block to check.
   * @param {boolean=} inputsInline Whether the inputs are expected to be
   *    inline.
   */
  function assertBlockStructure(block, inputsInline = false) {
    assert.equal(block.type, 'logic_ternary');
    const inputs = block.inputList;
    assert.exists(inputs, 'Has inputList');
    assert.lengthOf(inputs, 3);
    const ifInput = block.getInput('IF');
    assert.exists(ifInput, 'Has "IF" input');
    const checkList = ifInput.connection.getCheck();
    assert.equal(checkList.length, 1);
    assert.equal(checkList[0], 'Boolean');
    assert.exists(block.onchangeWrapper, 'Has onchange handler');
    if (inputsInline) {
      assert.isTrue(block.inputsInline);
    } else {
      // inputsInline can be undefined
      assert.isNotTrue(block.inputsInline);
    }
  }

  test('Structure', function () {
    const block = this.workspace.newBlock('logic_ternary');
    assertBlockStructure(block);
  });

  /**
   * Test cases for serialization tests.
   * @type {Array<SerializationTestCase>}
   */
  const testCases = [
    {
      title: 'Empty XML',
      xml: '<block type="logic_ternary"/>',
      expectedXml:
        '<block xmlns="https://developers.google.com/blockly/xml" ' +
        'type="logic_ternary" id="1"></block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block);
      },
    },
    {
      title: 'Inputs inline',
      xml:
        '<block xmlns="https://developers.google.com/blockly/xml" ' +
        'type="logic_ternary" id="1" inline="true"></block>',
      assertBlockStructure: (block) => {
        assertBlockStructure(block, true);
      },
    },
  ];
  runSerializationTestSuite(testCases);

  suite('Connections', function () {
    function connectParentAndCheckConnections(
      block,
      parent,
      parentInputName,
      opt_thenInput,
      opt_elseInput,
    ) {
      parent
        .getInput(parentInputName)
        .connection.connect(block.outputConnection);
      eventUtils.TEST_ONLY.fireNow(); // Force synchronous onchange() call.
      assert.equal(
        block.getParent(),
        parent,
        'Successful connection to parent',
      );
      if (opt_thenInput) {
        assert.equal(
          opt_thenInput.getParent(),
          block,
          'Input THEN still connected after connecting parent',
        );
      }
      if (opt_elseInput) {
        assert.equal(
          opt_elseInput.getParent(),
          block,
          'Input ELSE still connected after connecting parent',
        );
      }
    }
    function connectThenInputAndCheckConnections(
      block,
      thenInput,
      opt_elseInput,
      opt_parent,
    ) {
      block.getInput('THEN').connection.connect(thenInput.outputConnection);
      eventUtils.TEST_ONLY.fireNow(); // Force synchronous onchange() call.
      assert.equal(thenInput.getParent(), block, 'THEN is connected');
      if (opt_parent) {
        assert.equal(
          block.getParent(),
          opt_parent,
          'Still connected to parent after connecting THEN',
        );
      }
      if (opt_elseInput) {
        assert.equal(
          opt_elseInput.getParent(),
          block,
          'Input ELSE still connected after connecting THEN',
        );
      }
    }
    function connectElseInputAndCheckConnections(
      block,
      elseInput,
      opt_thenInput,
      opt_parent,
    ) {
      block.getInput('ELSE').connection.connect(elseInput.outputConnection);
      eventUtils.TEST_ONLY.fireNow(); // Force synchronous onchange() call.
      assert.equal(elseInput.getParent(), block, 'ELSE is connected');
      if (opt_parent) {
        assert.equal(
          block.getParent(),
          opt_parent,
          'Still connected to parent after connecting ELSE',
        );
      }
      if (opt_thenInput) {
        assert.equal(
          opt_thenInput.getParent(),
          block,
          'Input THEN still connected after connecting ELSE',
        );
      }
    }
    function connectInputsAndCheckConnections(
      block,
      thenInput,
      elseInput,
      opt_parent,
    ) {
      connectThenInputAndCheckConnections(block, thenInput, null, opt_parent);
      connectElseInputAndCheckConnections(
        block,
        elseInput,
        thenInput,
        opt_parent,
      );
    }
    setup(function () {
      this.block = this.workspace.newBlock('logic_ternary');
    });
    suite('No parent', function () {
      test('Attach inputs same type', function () {
        const string1 = this.workspace.newBlock('text');
        const string2 = this.workspace.newBlock('text_charAt');

        connectInputsAndCheckConnections(this.block, string1, string2);
      });
      test('Attach inputs different types', function () {
        const string = this.workspace.newBlock('text');
        const number = this.workspace.newBlock('math_number');

        connectInputsAndCheckConnections(this.block, string, number);
      });
    });
    suite('With parent already attached', function () {
      test('Attach inputs same type with matching parent', function () {
        const parent = this.workspace.newBlock('text_trim');

        connectParentAndCheckConnections(this.block, parent, 'TEXT');

        const string1 = this.workspace.newBlock('text');
        const string2 = this.workspace.newBlock('text_charAt');

        connectInputsAndCheckConnections(this.block, string1, string2, parent);
      });
      test('Attach inputs different types with unchecked parent', function () {
        const parent = this.workspace.newBlock('text_print');

        connectParentAndCheckConnections(this.block, parent, 'TEXT');

        const string = this.workspace.newBlock('text');
        const number = this.workspace.newBlock('math_number');

        connectInputsAndCheckConnections(this.block, string, number, parent);
      });
      test('Attach inputs different types with permissive parent', function () {
        const parent = this.workspace.newBlock('text_length'); // Allows String or Array

        connectParentAndCheckConnections(this.block, parent, 'VALUE');

        const string = this.workspace.newBlock('text');
        const array = this.workspace.newBlock('lists_create_empty');

        connectInputsAndCheckConnections(this.block, string, array, parent);
      });
      test('Attach mismatch type to then causes break with parent', function () {
        const parent = this.workspace.newBlock('text_length'); // Allows String or Array

        connectParentAndCheckConnections(this.block, parent, 'VALUE');

        const string = this.workspace.newBlock('text');
        const number = this.workspace.newBlock('math_number');

        connectElseInputAndCheckConnections(this.block, string, null, parent);

        // Adding mismatching number.
        connectThenInputAndCheckConnections(this.block, number, string);
        assert.equal(
          this.block.getRootBlock(),
          this.block,
          'Disconnected from parent',
        );
      });
      test('Attach mismatch type to else causes break with parent', function () {
        const parent = this.workspace.newBlock('text_length'); // Allows String or Array

        connectParentAndCheckConnections(this.block, parent, 'VALUE');

        const string = this.workspace.newBlock('text');
        const number = this.workspace.newBlock('math_number');

        connectThenInputAndCheckConnections(this.block, string, null, parent);

        // Adding mismatching number.
        connectElseInputAndCheckConnections(this.block, number, string);
        assert.equal(
          this.block.getRootBlock(),
          this.block,
          'Disconnected from parent',
        );
      });
    });
    suite('Attaching parent after inputs', function () {
      test('Unchecked parent with inputs different types', function () {
        const string = this.workspace.newBlock('text');
        const number = this.workspace.newBlock('math_number');

        connectInputsAndCheckConnections(this.block, string, number);

        const parent = this.workspace.newBlock('text_print');
        connectParentAndCheckConnections(
          this.block,
          parent,
          'TEXT',
          string,
          number,
        );
      });
      test('Permissive parent with inputs different types', function () {
        const string = this.workspace.newBlock('text');
        const array = this.workspace.newBlock('lists_create_empty');

        connectInputsAndCheckConnections(this.block, string, array);

        const parent = this.workspace.newBlock('text_print');
        connectParentAndCheckConnections(
          this.block,
          parent,
          'TEXT',
          string,
          array,
        );
      });
      test('Mismatch with then causes break with then', function () {
        const number = this.workspace.newBlock('math_number');
        const string = this.workspace.newBlock('text');

        connectInputsAndCheckConnections(this.block, number, string);

        const parent = this.workspace.newBlock('text_trim');
        connectParentAndCheckConnections(
          this.block,
          parent,
          'TEXT',
          null,
          string,
        );
        assert.equal(number.getRootBlock(), number, 'Input THEN disconnected');
      });
      test('Mismatch with else causes break with else', function () {
        const string = this.workspace.newBlock('text');
        const number = this.workspace.newBlock('math_number');

        connectInputsAndCheckConnections(this.block, string, number);

        const parent = this.workspace.newBlock('text_trim');
        connectParentAndCheckConnections(this.block, parent, 'TEXT', string);
        assert.equal(number.getRootBlock(), number, 'Input ELSE disconnected');
      });
    });
  });
});
