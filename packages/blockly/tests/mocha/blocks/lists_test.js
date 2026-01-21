/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ConnectionType} from '../../../build/src/core/connection_type.js';
import {assert} from '../../../node_modules/chai/index.js';
import {defineStatementBlock} from '../test_helpers/block_definitions.js';
import {runSerializationTestSuite} from '../test_helpers/serialization.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from '../test_helpers/setup_teardown.js';

suite('Lists', function () {
  setup(function () {
    sharedTestSetup.call(this);
    defineStatementBlock();
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('ListsGetIndex', function () {
    /**
     * Test cases for serialization tests.
     * @type {Array<SerializationTestCase>}
     */
    const testCases = [
      {
        title: 'JSON not requiring mutations',
        json: {
          type: 'lists_getIndex',
          id: '1',
          fields: {MODE: 'GET', WHERE: 'FIRST'},
        },
        assertBlockStructure: (block) => {
          assert.equal(block.type, 'lists_getIndex');
          assert.exists(block.outputConnection);
        },
      },
      {
        title: 'JSON requiring mutations',
        json: {
          type: 'lists_getIndex',
          id: '1',
          extraState: {isStatement: true},
          fields: {MODE: 'REMOVE', WHERE: 'FROM_START'},
        },
        assertBlockStructure: (block) => {
          assert.equal(block.type, 'lists_getIndex');
          assert.isNotTrue(block.outputConnection);
          assert.isTrue(
            block.getInput('AT').type === ConnectionType.INPUT_VALUE,
          );
        },
      },
      {
        title:
          'JSON requiring mutations and extra state for previous connection',
        json: {
          type: 'statement_block',
          id: '1',
          next: {
            block: {
              type: 'lists_getIndex',
              id: '2',
              extraState: {isStatement: true},
              fields: {MODE: 'REMOVE', WHERE: 'FROM_START'},
            },
          },
        },
        assertBlockStructure: (block) => {},
      },
      {
        title: 'JSON requiring mutations with XML extra state',
        json: {
          type: 'statement_block',
          id: '1',
          next: {
            block: {
              type: 'lists_getIndex',
              id: '2',
              extraState: '<mutation statement="true" at="true"></mutation>',
              fields: {MODE: 'REMOVE', WHERE: 'FROM_START'},
            },
          },
        },
        expectedJson: {
          type: 'statement_block',
          id: '1',
          next: {
            block: {
              type: 'lists_getIndex',
              id: '2',
              extraState: {isStatement: true},
              fields: {MODE: 'REMOVE', WHERE: 'FROM_START'},
            },
          },
        },
        assertBlockStructure: (block) => {},
      },
    ];
    runSerializationTestSuite(testCases);
  });

  /**
   * Test cases for serialization where JSON hooks should have null
   * implementation to avoid serializing xml mutations in json.
   * @param {!Object} serializedJson basic serialized json
   * @param {!string} xmlMutation xml mutation that should be ignored/not reserialized in round trip
   * @return {Array<SerializationTestCase>} test cases
   */
  function makeTestCasesForBlockNotNeedingExtraState_(
    serializedJson,
    xmlMutation,
  ) {
    return [
      {
        title: 'JSON not requiring mutations',
        json: serializedJson,
        assertBlockStructure: (block) => {
          assert.equal(block.type, serializedJson.type);
        },
      },
      {
        title: 'JSON with XML extra state',
        json: {
          ...serializedJson,
          'extraState': xmlMutation,
        },
        expectedJson: serializedJson,
        assertBlockStructure: (block) => {},
      },
    ];
  }

  suite('ListsSetIndex', function () {
    /**
     * Test cases for serialization tests.
     * @type {Array<SerializationTestCase>}
     */
    const testCases = makeTestCasesForBlockNotNeedingExtraState_(
      {
        'type': 'lists_setIndex',
        'id': '1',
        'fields': {
          'MODE': 'SET',
          'WHERE': 'FROM_START',
        },
      },
      '<mutation at="true"></mutation>',
    );
    runSerializationTestSuite(testCases);
  });

  suite('ListsGetSubList', function () {
    /**
     * Test cases for serialization tests.
     * @type {Array<SerializationTestCase>}
     */
    const testCases = makeTestCasesForBlockNotNeedingExtraState_(
      {
        'type': 'lists_getSublist',
        'id': '1',
        'fields': {
          'WHERE1': 'FROM_START',
          'WHERE2': 'FROM_START',
        },
      },
      '<mutation at1="true" at2="true"></mutation>',
    );
    runSerializationTestSuite(testCases);
  });

  suite('ListsSplit', function () {
    /**
     * Test cases for serialization tests.
     * @type {Array<SerializationTestCase>}
     */
    const testCases = [
      {
        title: 'JSON for splitting',
        json: {
          type: 'lists_split',
          id: '1',
          extraState: {mode: 'SPLIT'},
          fields: {MODE: 'SPLIT'},
          inputs: {
            DELIM: {
              shadow: {
                type: 'text',
                id: '2',
                fields: {
                  TEXT: ',',
                },
              },
            },
          },
        },
        assertBlockStructure: (block) => {
          assert.equal(block.type, 'lists_split');
          assert.deepEqual(block.outputConnection.getCheck(), ['Array']);
          assert.isTrue(block.getField('MODE').getValue() === 'SPLIT');
        },
      },
      {
        title: 'JSON for joining',
        json: {
          type: 'lists_split',
          id: '1',
          extraState: {mode: 'JOIN'},
          fields: {MODE: 'JOIN'},
          inputs: {
            DELIM: {
              shadow: {
                type: 'text',
                id: '2',
                fields: {
                  TEXT: ',',
                },
              },
            },
          },
        },
        assertBlockStructure: (block) => {
          assert.equal(block.type, 'lists_split');
          assert.deepEqual(block.outputConnection.getCheck(), ['String']);
          assert.isTrue(block.getField('MODE').getValue() === 'JOIN');
        },
      },
    ];
    runSerializationTestSuite(testCases);
  });
});
