/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {createRenderedBlock} from './test_helpers/block_definitions.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Cursor', function () {
  suite('Movement', function () {
    setup(function () {
      sharedTestSetup.call(this);
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'input_statement',
          'message0': '%1 %2 %3 %4',
          'args0': [
            {
              'type': 'field_input',
              'name': 'NAME1',
              'text': 'default',
            },
            {
              'type': 'field_input',
              'name': 'NAME2',
              'text': 'default',
            },
            {
              'type': 'input_value',
              'name': 'NAME3',
            },
            {
              'type': 'input_statement',
              'name': 'NAME4',
            },
          ],
          'previousStatement': null,
          'nextStatement': null,
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
          'type': 'multi_statement_input',
          'message0': '%1 %2',
          'args0': [
            {
              'type': 'input_statement',
              'name': 'FIRST',
            },
            {
              'type': 'input_statement',
              'name': 'SECOND',
            },
          ],
        },
        {
          'type': 'simple_statement',
          'message0': '%1',
          'args0': [
            {
              'type': 'field_input',
              'name': 'NAME',
              'text': 'default',
            },
          ],
          'previousStatement': null,
          'nextStatement': null,
        },
      ]);
      this.workspace = Blockly.inject('blocklyDiv', {});
      this.cursor = this.workspace.getCursor();
      const blockA = createRenderedBlock(this.workspace, 'input_statement');
      const blockB = createRenderedBlock(this.workspace, 'input_statement');
      const blockC = createRenderedBlock(this.workspace, 'input_statement');
      const blockD = createRenderedBlock(this.workspace, 'input_statement');
      const blockE = createRenderedBlock(this.workspace, 'field_input');

      blockA.nextConnection.connect(blockB.previousConnection);
      blockA.inputList[0].connection.connect(blockE.outputConnection);
      blockB.inputList[1].connection.connect(blockC.previousConnection);
      this.cursor.drawer = null;
      this.blocks = {
        A: blockA,
        B: blockB,
        C: blockC,
        D: blockD,
        E: blockE,
      };
    });
    teardown(function () {
      sharedTestTeardown.call(this);
    });

    test('Next - From a Previous connection go to the next block', function () {
      const prevNode = this.blocks.A.previousConnection;
      this.cursor.setCurNode(prevNode);
      this.cursor.next();
      const curNode = this.cursor.getCurNode();
      assert.equal(curNode, this.blocks.A);
    });
    test('Next - From a block go to its statement input', function () {
      const prevNode = this.blocks.B;
      this.cursor.setCurNode(prevNode);
      this.cursor.next();
      const curNode = this.cursor.getCurNode();
      assert.equal(curNode, this.blocks.C);
    });

    test('In - From field to attached input connection', function () {
      const fieldBlock = this.blocks.E;
      const fieldNode = this.blocks.A.getField('NAME2');
      this.cursor.setCurNode(fieldNode);
      this.cursor.in();
      const curNode = this.cursor.getCurNode();
      assert.equal(curNode, fieldBlock);
    });

    test('Prev - From previous connection does skip over next connection', function () {
      const prevConnection = this.blocks.B.previousConnection;
      const prevConnectionNode = prevConnection;
      this.cursor.setCurNode(prevConnectionNode);
      this.cursor.prev();
      const curNode = this.cursor.getCurNode();
      assert.equal(curNode, this.blocks.A);
    });

    test('Prev - From first block loop to last block', function () {
      const prevConnection = this.blocks.A;
      const prevConnectionNode = prevConnection;
      this.cursor.setCurNode(prevConnectionNode);
      this.cursor.prev();
      const curNode = this.cursor.getCurNode();
      assert.equal(curNode, this.blocks.D);
    });

    test('Out - From field does not skip over block node', function () {
      const field = this.blocks.E.inputList[0].fieldRow[0];
      const fieldNode = field;
      this.cursor.setCurNode(fieldNode);
      this.cursor.out();
      const curNode = this.cursor.getCurNode();
      assert.equal(curNode, this.blocks.E);
    });

    test('Out - From first connection loop to last next connection', function () {
      const prevConnection = this.blocks.A.previousConnection;
      const prevConnectionNode = prevConnection;
      this.cursor.setCurNode(prevConnectionNode);
      this.cursor.out();
      const curNode = this.cursor.getCurNode();
      assert.equal(curNode, this.blocks.D.nextConnection);
    });
  });

  suite('Multiple statement inputs', function () {
    setup(function () {
      sharedTestSetup.call(this);
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'multi_statement_input',
          'message0': '%1 %2',
          'args0': [
            {
              'type': 'input_statement',
              'name': 'FIRST',
            },
            {
              'type': 'input_statement',
              'name': 'SECOND',
            },
          ],
        },
        {
          'type': 'simple_statement',
          'message0': '%1',
          'args0': [
            {
              'type': 'field_input',
              'name': 'NAME',
              'text': 'default',
            },
          ],
          'previousStatement': null,
          'nextStatement': null,
        },
      ]);
      this.workspace = Blockly.inject('blocklyDiv', {});
      this.cursor = this.workspace.getCursor();

      this.multiStatement1 = createRenderedBlock(
        this.workspace,
        'multi_statement_input',
      );
      this.multiStatement2 = createRenderedBlock(
        this.workspace,
        'multi_statement_input',
      );
      this.firstStatement = createRenderedBlock(
        this.workspace,
        'simple_statement',
      );
      this.secondStatement = createRenderedBlock(
        this.workspace,
        'simple_statement',
      );
      this.thirdStatement = createRenderedBlock(
        this.workspace,
        'simple_statement',
      );
      this.fourthStatement = createRenderedBlock(
        this.workspace,
        'simple_statement',
      );
      this.multiStatement1
        .getInput('FIRST')
        .connection.connect(this.firstStatement.previousConnection);
      this.firstStatement.nextConnection.connect(
        this.secondStatement.previousConnection,
      );
      this.multiStatement1
        .getInput('SECOND')
        .connection.connect(this.thirdStatement.previousConnection);
      this.multiStatement2
        .getInput('FIRST')
        .connection.connect(this.fourthStatement.previousConnection);
    });

    teardown(function () {
      sharedTestTeardown.call(this);
    });

    test('In - from field in nested statement block to next nested statement block', function () {
      this.cursor.setCurNode(this.secondStatement.getField('NAME'));
      this.cursor.in();
      const curNode = this.cursor.getCurNode();
      assert.equal(curNode, this.thirdStatement);
    });
    test('In - from field in nested statement block to next stack', function () {
      this.cursor.setCurNode(this.thirdStatement.getField('NAME'));
      this.cursor.in();
      const curNode = this.cursor.getCurNode();
      assert.equal(curNode, this.multiStatement2);
    });

    test('Out - from nested statement block to last field of previous nested statement block', function () {
      this.cursor.setCurNode(this.thirdStatement);
      this.cursor.out();
      const curNode = this.cursor.getCurNode();
      assert.equal(curNode, this.secondStatement.getField('NAME'));
    });

    test('Out - from root block to last field of last nested statement block in previous stack', function () {
      this.cursor.setCurNode(this.multiStatement2);
      this.cursor.out();
      const curNode = this.cursor.getCurNode();
      assert.equal(curNode, this.thirdStatement.getField('NAME'));
    });
  });

  suite('Searching', function () {
    setup(function () {
      sharedTestSetup.call(this);
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'empty_block',
          'message0': '',
        },
        {
          'type': 'stack_block',
          'message0': '',
          'previousStatement': null,
          'nextStatement': null,
        },
        {
          'type': 'row_block',
          'message0': '%1',
          'args0': [
            {
              'type': 'input_value',
              'name': 'INPUT',
            },
          ],
          'output': null,
        },
        {
          'type': 'statement_block',
          'message0': '%1',
          'args0': [
            {
              'type': 'input_statement',
              'name': 'STATEMENT',
            },
          ],
          'previousStatement': null,
          'nextStatement': null,
        },
        {
          'type': 'c_hat_block',
          'message0': '%1',
          'args0': [
            {
              'type': 'input_statement',
              'name': 'STATEMENT',
            },
          ],
        },
      ]);
      this.workspace = Blockly.inject('blocklyDiv', {});
      this.cursor = this.workspace.getCursor();
    });
    teardown(function () {
      sharedTestTeardown.call(this);
    });
    suite('one empty block', function () {
      setup(function () {
        this.blockA = this.workspace.newBlock('empty_block');
      });
      teardown(function () {
        this.workspace.clear();
      });
      test('getFirstNode', function () {
        const node = this.cursor.getFirstNode();
        assert.equal(node, this.blockA);
      });
      test('getLastNode', function () {
        const node = this.cursor.getLastNode();
        assert.equal(node, this.blockA);
      });
    });

    suite('one stack block', function () {
      setup(function () {
        this.blockA = this.workspace.newBlock('stack_block');
      });
      teardown(function () {
        this.workspace.clear();
      });
      test('getFirstNode', function () {
        const node = this.cursor.getFirstNode();
        assert.equal(node, this.blockA);
      });
      test('getLastNode', function () {
        const node = this.cursor.getLastNode();
        assert.equal(node, this.blockA);
      });
    });

    suite('one row block', function () {
      setup(function () {
        this.blockA = this.workspace.newBlock('row_block');
      });
      teardown(function () {
        this.workspace.clear();
      });
      test('getFirstNode', function () {
        const node = this.cursor.getFirstNode();
        assert.equal(node, this.blockA);
      });
      test('getLastNode', function () {
        const node = this.cursor.getLastNode();
        assert.equal(node, this.blockA.inputList[0].connection);
      });
    });
    suite('one c-hat block', function () {
      setup(function () {
        this.blockA = this.workspace.newBlock('c_hat_block');
      });
      teardown(function () {
        this.workspace.clear();
      });
      test('getFirstNode', function () {
        const node = this.cursor.getFirstNode();
        assert.equal(node, this.blockA);
      });
      test('getLastNode', function () {
        const node = this.cursor.getLastNode();
        assert.equal(node, this.blockA);
      });
    });

    suite('multiblock stack', function () {
      setup(function () {
        const state = {
          'blocks': {
            'languageVersion': 0,
            'blocks': [
              {
                'type': 'stack_block',
                'id': 'A',
                'x': 0,
                'y': 0,
                'next': {
                  'block': {
                    'type': 'stack_block',
                    'id': 'B',
                  },
                },
              },
            ],
          },
        };
        Blockly.serialization.workspaces.load(state, this.workspace);
      });
      teardown(function () {
        this.workspace.clear();
      });
      test('getFirstNode', function () {
        const node = this.cursor.getFirstNode();
        const blockA = this.workspace.getBlockById('A');
        assert.equal(node, blockA);
      });
      test('getLastNode', function () {
        const node = this.cursor.getLastNode();
        const blockB = this.workspace.getBlockById('B');
        assert.equal(node, blockB);
      });
    });

    suite('multiblock row', function () {
      setup(function () {
        const state = {
          'blocks': {
            'languageVersion': 0,
            'blocks': [
              {
                'type': 'row_block',
                'id': 'A',
                'x': 0,
                'y': 0,
                'inputs': {
                  'INPUT': {
                    'block': {
                      'type': 'row_block',
                      'id': 'B',
                    },
                  },
                },
              },
            ],
          },
        };
        Blockly.serialization.workspaces.load(state, this.workspace);
      });
      teardown(function () {
        this.workspace.clear();
      });
      test('getFirstNode', function () {
        const node = this.cursor.getFirstNode();
        const blockA = this.workspace.getBlockById('A');
        assert.equal(node, blockA);
      });
      test('getLastNode', function () {
        const node = this.cursor.getLastNode();
        const blockB = this.workspace.getBlockById('B');
        assert.equal(node, blockB.inputList[0].connection);
      });
    });

    suite('two stacks', function () {
      setup(function () {
        const state = {
          'blocks': {
            'languageVersion': 0,
            'blocks': [
              {
                'type': 'stack_block',
                'id': 'A',
                'x': 0,
                'y': 0,
                'next': {
                  'block': {
                    'type': 'stack_block',
                    'id': 'B',
                  },
                },
              },
              {
                'type': 'stack_block',
                'id': 'C',
                'x': 100,
                'y': 100,
                'next': {
                  'block': {
                    'type': 'stack_block',
                    'id': 'D',
                  },
                },
              },
            ],
          },
        };
        Blockly.serialization.workspaces.load(state, this.workspace);
      });
      teardown(function () {
        this.workspace.clear();
      });
      test('getFirstNode', function () {
        const node = this.cursor.getFirstNode();
        const location = node;
        const blockA = this.workspace.getBlockById('A');
        assert.equal(location, blockA);
      });
      test('getLastNode', function () {
        const node = this.cursor.getLastNode();
        const location = node;
        const blockD = this.workspace.getBlockById('D');
        assert.equal(location, blockD);
      });
    });
  });
  suite('Get next node', function () {
    setup(function () {
      sharedTestSetup.call(this);
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'empty_block',
          'message0': '',
        },
        {
          'type': 'stack_block',
          'message0': '%1',
          'args0': [
            {
              'type': 'field_input',
              'name': 'FIELD',
              'text': 'default',
            },
          ],
          'previousStatement': null,
          'nextStatement': null,
        },
        {
          'type': 'row_block',
          'message0': '%1 %2',
          'args0': [
            {
              'type': 'field_input',
              'name': 'FIELD',
              'text': 'default',
            },
            {
              'type': 'input_value',
              'name': 'INPUT',
            },
          ],
          'output': null,
        },
      ]);
      this.workspace = Blockly.inject('blocklyDiv', {});
      this.cursor = this.workspace.getCursor();
      this.neverValid = () => false;
      this.alwaysValid = () => true;
      this.isBlock = (node) => {
        return node && node instanceof Blockly.BlockSvg;
      };
    });
    teardown(function () {
      sharedTestTeardown.call(this);
    });
    suite('stack', function () {
      setup(function () {
        const state = {
          'blocks': {
            'languageVersion': 0,
            'blocks': [
              {
                'type': 'stack_block',
                'id': 'A',
                'x': 0,
                'y': 0,
                'next': {
                  'block': {
                    'type': 'stack_block',
                    'id': 'B',
                    'next': {
                      'block': {
                        'type': 'stack_block',
                        'id': 'C',
                      },
                    },
                  },
                },
              },
            ],
          },
        };
        Blockly.serialization.workspaces.load(state, this.workspace);
        this.blockA = this.workspace.getBlockById('A');
        this.blockB = this.workspace.getBlockById('B');
        this.blockC = this.workspace.getBlockById('C');
      });
      teardown(function () {
        this.workspace.clear();
      });
      test('Never valid - start at top', function () {
        const startNode = this.blockA.previousConnection;
        const nextNode = this.cursor.getNextNode(
          startNode,
          this.neverValid,
          false,
        );
        assert.isNull(nextNode);
      });
      test('Never valid - start in middle', function () {
        const startNode = this.blockB;
        const nextNode = this.cursor.getNextNode(
          startNode,
          this.neverValid,
          false,
        );
        assert.isNull(nextNode);
      });
      test('Never valid - start at end', function () {
        const startNode = this.blockC.nextConnection;
        const nextNode = this.cursor.getNextNode(
          startNode,
          this.neverValid,
          false,
        );
        assert.isNull(nextNode);
      });

      test('Always valid - start at top', function () {
        const startNode = this.blockA.previousConnection;
        const nextNode = this.cursor.getNextNode(
          startNode,
          this.alwaysValid,
          false,
        );
        assert.equal(nextNode, this.blockA);
      });
      test('Always valid - start in middle', function () {
        const startNode = this.blockB;
        const nextNode = this.cursor.getNextNode(
          startNode,
          this.alwaysValid,
          false,
        );
        assert.equal(nextNode, this.blockB.getField('FIELD'));
      });
      test('Always valid - start at end', function () {
        const startNode = this.blockC.getField('FIELD');
        const nextNode = this.cursor.getNextNode(
          startNode,
          this.alwaysValid,
          false,
        );
        assert.isNull(nextNode);
      });

      test('Valid if block - start at top', function () {
        const startNode = this.blockA;
        const nextNode = this.cursor.getNextNode(
          startNode,
          this.isBlock,
          false,
        );
        assert.equal(nextNode, this.blockB);
      });
      test('Valid if block - start in middle', function () {
        const startNode = this.blockB;
        const nextNode = this.cursor.getNextNode(
          startNode,
          this.isBlock,
          false,
        );
        assert.equal(nextNode, this.blockC);
      });
      test('Valid if block - start at end', function () {
        const startNode = this.blockC.getField('FIELD');
        const nextNode = this.cursor.getNextNode(
          startNode,
          this.isBlock,
          false,
        );
        assert.isNull(nextNode);
      });
      test('Never valid - start at end - with loopback', function () {
        const startNode = this.blockC.nextConnection;
        const nextNode = this.cursor.getNextNode(
          startNode,
          this.neverValid,
          true,
        );
        assert.isNull(nextNode);
      });
      test('Always valid - start at end - with loopback', function () {
        const startNode = this.blockC.nextConnection;
        const nextNode = this.cursor.getNextNode(
          startNode,
          this.alwaysValid,
          true,
        );
        assert.equal(nextNode, this.blockA.previousConnection);
      });

      test('Valid if block - start at end - with loopback', function () {
        const startNode = this.blockC;
        const nextNode = this.cursor.getNextNode(startNode, this.isBlock, true);
        assert.equal(nextNode, this.blockA);
      });
    });
  });

  suite('Get previous node', function () {
    setup(function () {
      sharedTestSetup.call(this);
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'empty_block',
          'message0': '',
        },
        {
          'type': 'stack_block',
          'message0': '%1',
          'args0': [
            {
              'type': 'field_input',
              'name': 'FIELD',
              'text': 'default',
            },
          ],
          'previousStatement': null,
          'nextStatement': null,
        },
        {
          'type': 'row_block',
          'message0': '%1 %2',
          'args0': [
            {
              'type': 'field_input',
              'name': 'FIELD',
              'text': 'default',
            },
            {
              'type': 'input_value',
              'name': 'INPUT',
            },
          ],
          'output': null,
        },
      ]);
      this.workspace = Blockly.inject('blocklyDiv', {});
      this.cursor = this.workspace.getCursor();
      this.neverValid = () => false;
      this.alwaysValid = () => true;
      this.isBlock = (node) => {
        return node && node instanceof Blockly.BlockSvg;
      };
    });
    teardown(function () {
      sharedTestTeardown.call(this);
    });
    suite('stack', function () {
      setup(function () {
        const state = {
          'blocks': {
            'languageVersion': 0,
            'blocks': [
              {
                'type': 'stack_block',
                'id': 'A',
                'x': 0,
                'y': 0,
                'next': {
                  'block': {
                    'type': 'stack_block',
                    'id': 'B',
                    'next': {
                      'block': {
                        'type': 'stack_block',
                        'id': 'C',
                      },
                    },
                  },
                },
              },
            ],
          },
        };
        Blockly.serialization.workspaces.load(state, this.workspace);
        this.blockA = this.workspace.getBlockById('A');
        this.blockB = this.workspace.getBlockById('B');
        this.blockC = this.workspace.getBlockById('C');
      });
      teardown(function () {
        this.workspace.clear();
      });
      test('Never valid - start at top', function () {
        const startNode = this.blockA.previousConnection;
        const previousNode = this.cursor.getPreviousNode(
          startNode,
          this.neverValid,
          false,
        );
        assert.isNull(previousNode);
      });
      test('Never valid - start in middle', function () {
        const startNode = this.blockB;
        const previousNode = this.cursor.getPreviousNode(
          startNode,
          this.neverValid,
          false,
        );
        assert.isNull(previousNode);
      });
      test('Never valid - start at end', function () {
        const startNode = this.blockC.nextConnection;
        const previousNode = this.cursor.getPreviousNode(
          startNode,
          this.neverValid,
          false,
        );
        assert.isNull(previousNode);
      });

      test('Always valid - start at top', function () {
        const startNode = this.blockA;
        const previousNode = this.cursor.getPreviousNode(
          startNode,
          this.alwaysValid,
          false,
        );
        assert.isNull(previousNode);
      });
      test('Always valid - start in middle', function () {
        const startNode = this.blockB;
        const previousNode = this.cursor.getPreviousNode(
          startNode,
          this.alwaysValid,
          false,
        );
        assert.equal(previousNode, this.blockA.getField('FIELD'));
      });
      test('Always valid - start at end', function () {
        const startNode = this.blockC.nextConnection;
        const previousNode = this.cursor.getPreviousNode(
          startNode,
          this.alwaysValid,
          false,
        );
        assert.equal(previousNode, this.blockC.getField('FIELD'));
      });

      test('Valid if block - start at top', function () {
        const startNode = this.blockA;
        const previousNode = this.cursor.getPreviousNode(
          startNode,
          this.isBlock,
          false,
        );
        assert.isNull(previousNode);
      });
      test('Valid if block - start in middle', function () {
        const startNode = this.blockB;
        const previousNode = this.cursor.getPreviousNode(
          startNode,
          this.isBlock,
          false,
        );
        assert.equal(previousNode, this.blockA);
      });
      test('Valid if block - start at end', function () {
        const startNode = this.blockC;
        const previousNode = this.cursor.getPreviousNode(
          startNode,
          this.isBlock,
          false,
        );
        assert.equal(previousNode, this.blockB);
      });
      test('Never valid - start at top - with loopback', function () {
        const startNode = this.blockA.previousConnection;
        const previousNode = this.cursor.getPreviousNode(
          startNode,
          this.neverValid,
          true,
        );
        assert.isNull(previousNode);
      });
      test('Always valid - start at top - with loopback', function () {
        const startNode = this.blockA.previousConnection;
        const previousNode = this.cursor.getPreviousNode(
          startNode,
          this.alwaysValid,
          true,
        );
        assert.equal(previousNode, this.blockC.nextConnection);
      });
      test('Valid if block - start at top - with loopback', function () {
        const startNode = this.blockA;
        const previousNode = this.cursor.getPreviousNode(
          startNode,
          this.isBlock,
          true,
        );
        assert.equal(previousNode, this.blockC);
      });
    });
  });
});
