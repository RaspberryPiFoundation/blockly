/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ConnectionType} from '../../build/src/core/connection_type.js';
import {EventType} from '../../build/src/core/events/type.js';
import * as eventUtils from '../../build/src/core/events/utils.js';
import {IconType} from '../../build/src/core/icons/icon_types.js';
import {EndRowInput} from '../../build/src/core/inputs/end_row_input.js';
import {isCommentIcon} from '../../build/src/core/interfaces/i_comment_icon.js';
import {Size} from '../../build/src/core/utils/size.js';
import {assert} from '../../node_modules/chai/index.js';
import {createRenderedBlock} from './test_helpers/block_definitions.js';
import {
  createChangeListenerSpy,
  createMockEvent,
} from './test_helpers/events.js';
import {MockBubbleIcon, MockIcon} from './test_helpers/icon_mocks.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('Blocks', function () {
  setup(function () {
    this.clock = sharedTestSetup.call(this, {fireEventsNow: false}).clock;
    this.workspace = new Blockly.Workspace();
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
    ]);
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  function createTestBlocks(workspace, isRow) {
    const blockType = isRow ? 'row_block' : 'stack_block';
    const blockA = workspace.newBlock(blockType, 'a');
    const blockB = workspace.newBlock(blockType, 'b');
    const blockC = workspace.newBlock(blockType, 'c');

    if (isRow) {
      blockA.inputList[0].connection.connect(blockB.outputConnection);
      blockB.inputList[0].connection.connect(blockC.outputConnection);
    } else {
      blockA.nextConnection.connect(blockB.previousConnection);
      blockB.nextConnection.connect(blockC.previousConnection);
    }

    assert.equal(blockC.getParent(), blockB);

    return {
      A: blockA /* Parent */,
      B: blockB /* Middle */,
      C: blockC /* Child */,
    };
  }

  suite('Unplug', function () {
    function assertUnpluggedNoheal(blocks) {
      // A has nothing connected to it.
      assert.equal(blocks.A.getChildren().length, 0);
      // B and C are still connected.
      assert.equal(blocks.C.getParent(), blocks.B);
      // B is the top of its stack.
      assert.isNull(blocks.B.getParent());
    }
    function assertUnpluggedHealed(blocks) {
      // A and C are connected.
      assert.equal(blocks.A.getChildren().length, 1);
      assert.equal(blocks.C.getParent(), blocks.A);
      // B has nothing connected to it.
      assert.equal(blocks.B.getChildren().length, 0);
      // B is the top of its stack.
      assert.isNull(blocks.B.getParent());
    }
    function assertUnpluggedHealFailed(blocks) {
      // A has nothing connected to it.
      assert.equal(blocks.A.getChildren().length, 0);
      // B has nothing connected to it.
      assert.equal(blocks.B.getChildren().length, 0);
      // B is the top of its stack.
      assert.isNull(blocks.B.getParent());
      // C is the top of its stack.
      assert.isNull(blocks.C.getParent());
    }

    suite('Row', function () {
      setup(function () {
        this.blocks = createTestBlocks(this.workspace, true);
      });

      test("Don't heal", function () {
        this.blocks.B.unplug(false);
        assertUnpluggedNoheal(this.blocks);
      });
      test('Heal', function () {
        this.blocks.B.unplug(true);
        // Each block has only one input, and the types work.
        assertUnpluggedHealed(this.blocks);
      });
      test('Heal with bad checks', function () {
        const blocks = this.blocks;

        // A and C can't connect, but both can connect to B.
        blocks.A.inputList[0].connection.setCheck('type1');
        blocks.C.outputConnection.setCheck('type2');

        // Each block has only one input, but the types don't work.
        blocks.B.unplug(true);
        assertUnpluggedHealFailed(blocks);
      });
      test('Parent has multiple inputs', function () {
        const blocks = this.blocks;
        // Add extra input to parent
        blocks.A.appendValueInput('INPUT').setCheck(null);
        blocks.B.unplug(true);
        assertUnpluggedHealed(blocks);
      });
      test('Middle has multiple inputs', function () {
        const blocks = this.blocks;
        // Add extra input to middle block
        blocks.B.appendValueInput('INPUT').setCheck(null);
        blocks.B.unplug(true);
        assertUnpluggedHealed(blocks);
      });
      test('Child has multiple inputs', function () {
        const blocks = this.blocks;
        // Add extra input to child block
        blocks.C.appendValueInput('INPUT').setCheck(null);
        // Child block input count doesn't matter.
        blocks.B.unplug(true);
        assertUnpluggedHealed(blocks);
      });
      test('Child is shadow', function () {
        const blocks = this.blocks;
        blocks.C.setShadow(true);
        blocks.B.unplug(true);
        // Even though we're asking to heal, it will appear as if it has not
        // healed because shadows always stay with the parent.
        assertUnpluggedNoheal(blocks);
      });
    });
    suite('Stack', function () {
      setup(function () {
        this.blocks = createTestBlocks(this.workspace, false);
      });

      test("Don't heal", function () {
        this.blocks.B.unplug();
        assertUnpluggedNoheal(this.blocks);
      });
      test('Heal', function () {
        this.blocks.B.unplug(true);
        assertUnpluggedHealed(this.blocks);
      });
      test('Heal with bad checks', function () {
        const blocks = this.blocks;
        // A and C can't connect, but both can connect to B.
        blocks.A.nextConnection.setCheck('type1');
        blocks.C.previousConnection.setCheck('type2');

        // The types don't work.
        blocks.B.unplug(true);

        assertUnpluggedHealFailed(blocks);
      });
      test('Disconnect top of stack with immovable sibling', function () {
        this.blocks.B.setMovable(false);
        this.blocks.A.unplug(true);
        assert.equal(this.blocks.A.nextConnection.targetBlock(), this.blocks.B);
        assert.isNull(this.blocks.B.nextConnection.targetBlock());
        assert.isNull(this.blocks.C.previousConnection.targetBlock());
      });
      test('Heal with immovable sibling mid-stack', function () {
        const blockD = this.workspace.newBlock('stack_block', 'd');
        this.blocks.C.nextConnection.connect(blockD.previousConnection);
        this.blocks.C.setMovable(false);
        this.blocks.B.unplug(true);
        assert.equal(this.blocks.A.nextConnection.targetBlock(), blockD);
        assert.equal(this.blocks.B.nextConnection.targetBlock(), this.blocks.C);
        assert.isNull(this.blocks.C.nextConnection.targetBlock());
      });
      test('Heal with immovable sibling and shadow sibling mid-stack', function () {
        const blockD = this.workspace.newBlock('stack_block', 'd');
        const blockE = this.workspace.newBlock('stack_block', 'e');
        this.blocks.C.nextConnection.connect(blockD.previousConnection);
        blockD.nextConnection.connect(blockE.previousConnection);
        this.blocks.C.setMovable(false);
        blockD.setShadow(true);
        this.blocks.B.unplug(true);
        assert.equal(this.blocks.A.nextConnection.targetBlock(), blockE);
        assert.equal(this.blocks.B.nextConnection.targetBlock(), this.blocks.C);
        assert.equal(this.blocks.C.nextConnection.targetBlock(), blockD);
        assert.isNull(blockD.nextConnection.targetBlock());
      });
      test('Child is shadow', function () {
        const blocks = this.blocks;
        blocks.C.setShadow(true);
        blocks.B.unplug(true);
        // Even though we're asking to heal, it will appear as if it has not
        // healed because shadows always stay with the parent.
        assertUnpluggedNoheal(blocks);
      });
    });
  });

  suite('Disposal', function () {
    suite('calling destroy', function () {
      setup(function () {
        Blockly.Blocks['destroyable_block'] = {
          init: function () {
            this.appendStatementInput('STATEMENT');
            this.setPreviousStatement(true);
            this.setNextStatement(true);
          },
          destroy: function () {},
        };
        this.block = this.workspace.newBlock('destroyable_block');
      });

      teardown(function () {
        delete Blockly.Blocks['destroyable_block'];
      });

      test('destroy is called', function () {
        const spy = sinon.spy(this.block, 'destroy');

        this.block.dispose();

        assert.isTrue(spy.calledOnce, 'Expected destroy to be called.');
      });

      test('disposing is set before destroy', function () {
        let disposing = null;
        this.block.destroy = function () {
          disposing = this.disposing;
        };

        this.block.dispose();

        assert.isTrue(
          disposing,
          'Expected disposing to be set to true before destroy is called.',
        );
      });

      test('disposed is not set before destroy', function () {
        let disposed = null;
        this.block.destroy = function () {
          disposed = this.disposed;
        };

        this.block.dispose();

        assert.isFalse(
          disposed,
          'Expected disposed to be false when destroy is called',
        );
      });

      test('events can be fired from destroy', function () {
        const mockEvent = createMockEvent(this.workspace);
        this.block.destroy = function () {
          Blockly.Events.fire(mockEvent);
        };
        const spy = createChangeListenerSpy(this.workspace);

        this.block.dispose();
        this.clock.runAll();

        assert.isTrue(
          spy.calledWith(mockEvent),
          'Expected to be able to fire events from destroy',
        );
      });

      test('child blocks can fire events from destroy', function () {
        const mockEvent = createMockEvent(this.workspace);
        const childBlock = this.workspace.newBlock('destroyable_block');
        this.block
          .getInput('STATEMENT')
          .connection.connect(childBlock.previousConnection);
        childBlock.destroy = function () {
          Blockly.Events.fire(mockEvent);
        };
        const spy = createChangeListenerSpy(this.workspace);

        this.block.dispose();
        this.clock.runAll();

        assert.isTrue(
          spy.calledWith(mockEvent),
          'Expected to be able to fire events from destroy',
        );
      });
    });

    suite('stack/row healing', function () {
      function assertDisposedNoheal(blocks) {
        assert.isFalse(blocks.A.disposed);
        // A has nothing connected to it.
        assert.equal(blocks.A.getChildren().length, 0);
        // B is disposed.
        assert.isTrue(blocks.B.disposed);
        // And C is disposed.
        assert.isTrue(blocks.C.disposed);
      }

      function assertDisposedHealed(blocks) {
        assert.isFalse(blocks.A.disposed);
        assert.isFalse(blocks.C.disposed);
        // A and C are connected.
        assert.equal(blocks.A.getChildren().length, 1);
        assert.equal(blocks.C.getParent(), blocks.A);
        // B is disposed.
        assert.isTrue(blocks.B.disposed);
      }

      function assertDisposedHealFailed(blocks) {
        assert.isFalse(blocks.A.disposed);
        assert.isFalse(blocks.C.disposed);
        // A has nothing connected to it.
        assert.equal(blocks.A.getChildren().length, 0);
        // B is disposed.
        assert.isTrue(blocks.B.disposed);
        // C is the top of its stack.
        assert.isNull(blocks.C.getParent());
      }

      suite('Row', function () {
        setup(function () {
          this.blocks = createTestBlocks(this.workspace, true);
        });

        test("Don't heal", function () {
          this.blocks.B.dispose(false);
          assertDisposedNoheal(this.blocks);
        });

        test('Heal', function () {
          this.blocks.B.dispose(true);
          // Each block has only one input, and the types work.
          assertDisposedHealed(this.blocks);
        });

        test('Heal with bad checks', function () {
          const blocks = this.blocks;

          // A and C can't connect, but both can connect to B.
          blocks.A.inputList[0].connection.setCheck('type1');
          blocks.C.outputConnection.setCheck('type2');

          // Each block has only one input, but the types don't work.
          blocks.B.dispose(true);
          assertDisposedHealFailed(blocks);
        });

        test('Parent has multiple inputs', function () {
          const blocks = this.blocks;
          // Add extra input to parent
          blocks.A.appendValueInput('INPUT').setCheck(null);
          blocks.B.dispose(true);
          assertDisposedHealed(blocks);
        });

        test('Middle has multiple inputs', function () {
          const blocks = this.blocks;
          // Add extra input to middle block
          blocks.B.appendValueInput('INPUT').setCheck(null);
          blocks.B.dispose(true);
          assertDisposedHealed(blocks);
        });

        test('Child has multiple inputs', function () {
          const blocks = this.blocks;
          // Add extra input to child block
          blocks.C.appendValueInput('INPUT').setCheck(null);
          // Child block input count doesn't matter.
          blocks.B.dispose(true);
          assertDisposedHealed(blocks);
        });

        test('Child is shadow', function () {
          const blocks = this.blocks;
          blocks.C.dispose();
          blocks.B.inputList[0].connection.setShadowState({
            'type': 'row_block',
            'id': 'c',
          });

          blocks.B.dispose(true);

          // Even though we're asking to heal, it will appear as if it has not
          // healed because shadows always get destroyed.
          assertDisposedNoheal(blocks);
        });
      });

      suite('Stack', function () {
        setup(function () {
          this.blocks = createTestBlocks(this.workspace, false);
        });

        test("Don't heal", function () {
          this.blocks.B.dispose();
          assertDisposedNoheal(this.blocks);
        });

        test('Heal', function () {
          this.blocks.B.dispose(true);
          assertDisposedHealed(this.blocks);
        });

        test('Heal with bad checks', function () {
          const blocks = this.blocks;
          // A and C can't connect, but both can connect to B.
          blocks.A.nextConnection.setCheck('type1');
          blocks.C.previousConnection.setCheck('type2');

          // The types don't work.
          blocks.B.dispose(true);

          assertDisposedHealFailed(blocks);
        });

        test('Child is shadow', function () {
          const blocks = this.blocks;
          blocks.C.dispose();
          blocks.B.nextConnection.setShadowState({
            'type': 'stack_block',
            'id': 'c',
          });

          blocks.B.dispose(true);

          // Even though we're asking to heal, it will appear as if it has not
          // healed because shadows always get destroyed.
          assertDisposedNoheal(blocks);
        });
      });
    });

    suite('Disposing selected shadow block', function () {
      setup(function () {
        this.workspace = Blockly.inject('blocklyDiv');
        this.parentBlock = this.workspace.newBlock('row_block');
        this.parentBlock.initSvg();
        this.parentBlock.render();
        this.parentBlock.inputList[0].connection.setShadowState({
          'type': 'row_block',
          'id': 'shadow_child',
        });
        this.shadowChild =
          this.parentBlock.inputList[0].connection.targetConnection.getSourceBlock();
      });

      teardown(function () {
        workspaceTeardown.call(this, this.workspace);
      });
    });
  });

  suite('Remove Input', function () {
    setup(function () {
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'value_block',
          'message0': '%1',
          'args0': [
            {
              'type': 'input_value',
              'name': 'VALUE',
            },
          ],
        },
      ]);
    });

    suite('Value', function () {
      setup(function () {
        this.blockA = this.workspace.newBlock('value_block');
      });

      test('No Connected', function () {
        this.blockA.removeInput('VALUE');
        assert.isNull(this.blockA.getInput('VALUE'));
      });
      test('Block Connected', function () {
        const blockB = this.workspace.newBlock('row_block');
        this.blockA
          .getInput('VALUE')
          .connection.connect(blockB.outputConnection);

        this.blockA.removeInput('VALUE');
        assert.isFalse(blockB.disposed);
        assert.equal(this.blockA.getChildren().length, 0);
      });
      test('Shadow Connected', function () {
        const blockB = this.workspace.newBlock('row_block');
        blockB.setShadow(true);
        this.blockA
          .getInput('VALUE')
          .connection.connect(blockB.outputConnection);

        this.blockA.removeInput('VALUE');
        assert.isTrue(blockB.disposed);
        assert.equal(this.blockA.getChildren().length, 0);
      });
    });
    suite('Statement', function () {
      setup(function () {
        this.blockA = this.workspace.newBlock('statement_block');
      });

      test('No Connected', function () {
        this.blockA.removeInput('STATEMENT');
        assert.isNull(this.blockA.getInput('STATEMENT'));
      });
      test('Block Connected', function () {
        const blockB = this.workspace.newBlock('stack_block');
        this.blockA
          .getInput('STATEMENT')
          .connection.connect(blockB.previousConnection);

        this.blockA.removeInput('STATEMENT');
        assert.isFalse(blockB.disposed);
        assert.equal(this.blockA.getChildren().length, 0);
      });
      test('Shadow Connected', function () {
        const blockB = this.workspace.newBlock('stack_block');
        blockB.setShadow(true);
        this.blockA
          .getInput('STATEMENT')
          .connection.connect(blockB.previousConnection);

        this.blockA.removeInput('STATEMENT');
        assert.isTrue(blockB.disposed);
        assert.equal(this.blockA.getChildren().length, 0);
      });
    });
  });

  suite('Connection Tracking', function () {
    setup(function () {
      this.workspace = Blockly.inject('blocklyDiv');

      this.getInputs = function () {
        return this.workspace.connectionDBList[ConnectionType.INPUT_VALUE]
          .connections;
      };
      this.getOutputs = function () {
        return this.workspace.connectionDBList[ConnectionType.OUTPUT_VALUE]
          .connections;
      };
      this.getNext = function () {
        return this.workspace.connectionDBList[ConnectionType.NEXT_STATEMENT]
          .connections;
      };
      this.getPrevious = function () {
        return this.workspace.connectionDBList[
          ConnectionType.PREVIOUS_STATEMENT
        ].connections;
      };

      this.assertConnectionsEmpty = function () {
        assert.isEmpty(this.getInputs());
        assert.isEmpty(this.getOutputs());
        assert.isEmpty(this.getNext());
        assert.isEmpty(this.getPrevious());
      };
    });
    teardown(function () {
      workspaceTeardown.call(this, this.workspace);
    });

    suite('Deserialization', function () {
      setup(function () {
        this.deserializationHelper = function (text) {
          const dom = Blockly.utils.xml.textToDom(text);
          Blockly.Xml.appendDomToWorkspace(dom, this.workspace);
          this.assertConnectionsEmpty();
          this.clock.runAll();
        };
      });
      test('Stack', function () {
        this.deserializationHelper(
          '<xml>' + '  <block type="stack_block"/>' + '</xml>',
        );
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 1);
      });
      test('Multi-Stack', function () {
        this.deserializationHelper(
          '<xml>' +
            '  <block type="stack_block">' +
            '    <next>' +
            '      <block type="stack_block">' +
            '        <next>' +
            '          <block type="stack_block"/>' +
            '        </next>' +
            '      </block>' +
            '    </next>' +
            '  </block>' +
            '</xml>',
        );
        assert.equal(this.getPrevious().length, 3);
        assert.equal(this.getNext().length, 3);
      });
      test('Collapsed Stack', function () {
        this.deserializationHelper(
          '<xml>' + '  <block type="stack_block" collapsed="true"/>' + '</xml>',
        );
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 1);
      });
      test('Collapsed Multi-Stack', function () {
        this.deserializationHelper(
          '<xml>' +
            '  <block type="stack_block" collapsed="true">' +
            '    <next>' +
            '      <block type="stack_block" collapsed="true">' +
            '        <next>' +
            '          <block type="stack_block" collapsed="true"/>' +
            '        </next>' +
            '      </block>' +
            '    </next>' +
            '  </block>' +
            '</xml>',
        );
        assert.equal(this.getPrevious().length, 3);
        assert.equal(this.getNext().length, 3);
      });
      test('Row', function () {
        this.deserializationHelper(
          '<xml>' + '  <block type="row_block"/>' + '</xml>',
        );
        assert.equal(this.getOutputs().length, 1);
        assert.equal(this.getInputs().length, 1);
      });
      test('Multi-Row', function () {
        this.deserializationHelper(
          '<xml>' +
            '  <block type="row_block">' +
            '    <value name="INPUT">' +
            '      <block type="row_block">' +
            '        <value name="INPUT">' +
            '          <block type="row_block"/>' +
            '        </value>' +
            '      </block>' +
            '    </value>' +
            '  </block>' +
            '</xml>',
        );
        assert.equal(this.getOutputs().length, 3);
        assert.equal(this.getInputs().length, 3);
      });
      test('Collapsed Row', function () {
        this.deserializationHelper(
          '<xml>' + '  <block type="row_block" collapsed="true"/>' + '</xml>',
        );
        assert.equal(this.getOutputs().length, 1);
        assert.equal(this.getInputs().length, 0);
      });
      test('Collapsed Multi-Row', function () {
        this.deserializationHelper(
          '<xml>' +
            '  <block type="row_block" collapsed="true">' +
            '    <value name="INPUT">' +
            '      <block type="row_block">' +
            '        <value name="INPUT">' +
            '          <block type="row_block"/>' +
            '        </value>' +
            '      </block>' +
            '    </value>' +
            '  </block>' +
            '</xml>',
        );
        assert.equal(this.getOutputs().length, 1);
        assert.equal(this.getInputs().length, 0);
      });
      test('Collapsed Multi-Row Middle', function () {
        Blockly.Xml.appendDomToWorkspace(
          Blockly.utils.xml.textToDom(
            '<xml>' +
              '  <block type="row_block">' +
              '    <value name="INPUT">' +
              '      <block type="row_block" collapsed="true">' +
              '        <value name="INPUT">' +
              '          <block type="row_block"/>' +
              '        </value>' +
              '      </block>' +
              '    </value>' +
              '  </block>' +
              '</xml>',
          ),
          this.workspace,
        );
        this.assertConnectionsEmpty();
        this.clock.runAll();
        assert.equal(this.getOutputs().length, 2);
        assert.equal(this.getInputs().length, 1);
      });
      test('Statement', function () {
        this.deserializationHelper(
          '<xml>' + '  <block type="statement_block"/>' + '</xml>',
        );
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 2);
      });
      test('Multi-Statement', function () {
        this.deserializationHelper(
          '<xml>' +
            '  <block type="statement_block">' +
            '    <statement name="STATEMENT">' +
            '      <block type="statement_block">' +
            '        <statement name="STATEMENT">' +
            '          <block type="statement_block"/>' +
            '        </statement>' +
            '      </block>' +
            '    </statement>' +
            '  </block>' +
            '</xml>',
        );
        assert.equal(this.getPrevious().length, 3);
        assert.equal(this.getNext().length, 6);
      });
      test('Collapsed Statement', function () {
        this.deserializationHelper(
          '<xml>' +
            '  <block type="statement_block" collapsed="true"/>' +
            '</xml>',
        );
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 1);
      });
      test('Collapsed Multi-Statement', function () {
        this.deserializationHelper(
          '<xml>' +
            '  <block type="statement_block" collapsed="true">' +
            '    <statement name="STATEMENT">' +
            '      <block type="statement_block">' +
            '        <statement name="STATEMENT">' +
            '          <block type="statement_block"/>' +
            '        </statement>' +
            '      </block>' +
            '    </statement>' +
            '  </block>' +
            '</xml>',
        );
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 1);
      });
      test('Collapsed Multi-Statement Middle', function () {
        this.deserializationHelper(
          '<xml>' +
            '  <block type="statement_block">' +
            '    <statement name="STATEMENT">' +
            '      <block type="statement_block" collapsed="true">' +
            '        <statement name="STATEMENT">' +
            '          <block type="statement_block"/>' +
            '        </statement>' +
            '      </block>' +
            '    </statement>' +
            '  </block>' +
            '</xml>',
        );
        assert.equal(this.getPrevious().length, 2);
        assert.equal(this.getNext().length, 3);
      });
    });
    suite('Programmatic Block Creation', function () {
      test('Stack', function () {
        const block = this.workspace.newBlock('stack_block');
        this.assertConnectionsEmpty();
        block.initSvg();
        block.render();

        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 1);
      });
      test('Row', function () {
        const block = this.workspace.newBlock('row_block');
        this.assertConnectionsEmpty();
        block.initSvg();
        block.render();

        assert.equal(this.getOutputs().length, 1);
        assert.equal(this.getInputs().length, 1);
      });
      test('Statement', function () {
        const block = this.workspace.newBlock('statement_block');
        this.assertConnectionsEmpty();
        block.initSvg();
        block.render();

        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 2);
      });
    });
    suite('setCollapsed', function () {
      test('Stack', function () {
        const block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom('<block type="stack_block"/>'),
          this.workspace,
        );
        this.clock.runAll();
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 1);

        block.setCollapsed(true);
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 1);

        block.setCollapsed(false);
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 1);
      });
      test('Multi-Stack', function () {
        const block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(
            '<block type="stack_block">' +
              '  <next>' +
              '    <block type="stack_block">' +
              '      <next>' +
              '        <block type="stack_block"/>' +
              '      </next>' +
              '    </block>' +
              '  </next>' +
              '</block>',
          ),
          this.workspace,
        );
        this.assertConnectionsEmpty();
        this.clock.runAll();
        assert.equal(this.getPrevious().length, 3);
        assert.equal(this.getNext().length, 3);

        block.setCollapsed(true);
        assert.equal(this.getPrevious().length, 3);
        assert.equal(this.getNext().length, 3);

        block.setCollapsed(false);
        assert.equal(this.getPrevious().length, 3);
        assert.equal(this.getNext().length, 3);
      });
      test('Row', function () {
        const block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom('<block type="row_block"/>'),
          this.workspace,
        );
        this.clock.runAll();
        assert.equal(this.getOutputs().length, 1);
        assert.equal(this.getInputs().length, 1);

        block.setCollapsed(true);
        assert.equal(this.getOutputs().length, 1);
        assert.equal(this.getInputs().length, 0);

        block.setCollapsed(false);
        assert.equal(this.getOutputs().length, 1);
        assert.equal(this.getInputs().length, 1);
      });
      test('Multi-Row', function () {
        const block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(
            '<block type="row_block">' +
              '  <value name="INPUT">' +
              '    <block type="row_block">' +
              '      <value name="INPUT">' +
              '        <block type="row_block"/>' +
              '      </value>' +
              '    </block>' +
              '  </value>' +
              '</block>',
          ),
          this.workspace,
        );
        this.clock.runAll();
        assert.equal(this.getOutputs().length, 3);
        assert.equal(this.getInputs().length, 3);

        block.setCollapsed(true);
        assert.equal(this.getOutputs().length, 1);
        assert.equal(this.getInputs().length, 0);

        block.setCollapsed(false);
        assert.equal(this.getOutputs().length, 3);
        assert.equal(this.getInputs().length, 3);
      });
      test('Multi-Row Middle', function () {
        let block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(
            '<block type="row_block">' +
              '  <value name="INPUT">' +
              '    <block type="row_block">' +
              '      <value name="INPUT">' +
              '        <block type="row_block"/>' +
              '      </value>' +
              '    </block>' +
              '  </value>' +
              '</block>',
          ),
          this.workspace,
        );
        this.clock.runAll();
        assert.equal(this.getOutputs().length, 3);
        assert.equal(this.getInputs().length, 3);

        block = block.getInputTargetBlock('INPUT');
        block.setCollapsed(true);
        assert.equal(this.getOutputs().length, 2);
        assert.equal(this.getInputs().length, 1);

        block.setCollapsed(false);
        assert.equal(this.getOutputs().length, 3);
        assert.equal(this.getInputs().length, 3);
      });
      test('Multi-Row Double Collapse', function () {
        // Collapse middle -> Collapse top ->
        // Uncollapse top -> Uncollapse middle
        const block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(
            '<block type="row_block">' +
              '  <value name="INPUT">' +
              '    <block type="row_block">' +
              '      <value name="INPUT">' +
              '        <block type="row_block"/>' +
              '      </value>' +
              '    </block>' +
              '  </value>' +
              '</block>',
          ),
          this.workspace,
        );
        this.clock.runAll();
        assert.equal(this.getOutputs().length, 3);
        assert.equal(this.getInputs().length, 3);

        const middleBlock = block.getInputTargetBlock('INPUT');
        middleBlock.setCollapsed(true);
        assert.equal(this.getOutputs().length, 2);
        assert.equal(this.getInputs().length, 1);

        block.setCollapsed(true);
        assert.equal(this.getOutputs().length, 1);
        assert.equal(this.getInputs().length, 0);

        block.setCollapsed(false);
        assert.equal(this.getOutputs().length, 2);
        assert.equal(this.getInputs().length, 1);

        middleBlock.setCollapsed(false);
        assert.equal(this.getOutputs().length, 3);
        assert.equal(this.getInputs().length, 3);
      });
      test('Statement', function () {
        const block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom('<block type="statement_block"/>'),
          this.workspace,
        );
        this.clock.runAll();
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 2);

        block.setCollapsed(true);
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 1);

        block.setCollapsed(false);
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 2);
      });
      test('Multi-Statement', function () {
        const block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(
            '<block type="statement_block">' +
              '  <statement name="STATEMENT">' +
              '    <block type="statement_block">' +
              '      <statement name="STATEMENT">' +
              '        <block type="statement_block"/>' +
              '      </statement>' +
              '    </block>' +
              '  </statement>' +
              '</block>',
          ),
          this.workspace,
        );
        this.assertConnectionsEmpty();
        this.clock.runAll();
        assert.equal(this.getPrevious().length, 3);
        assert.equal(this.getNext().length, 6);

        block.setCollapsed(true);
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 1);

        block.setCollapsed(false);
        assert.equal(this.getPrevious().length, 3);
        assert.equal(this.getNext().length, 6);
      });
      test('Multi-Statement Middle', function () {
        let block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(
            '<block type="statement_block">' +
              '  <statement name="STATEMENT">' +
              '    <block type="statement_block">' +
              '      <statement name="STATEMENT">' +
              '        <block type="statement_block"/>' +
              '      </statement>' +
              '    </block>' +
              '  </statement>' +
              '</block>',
          ),
          this.workspace,
        );
        this.assertConnectionsEmpty();
        this.clock.runAll();
        assert.equal(this.getPrevious().length, 3);
        assert.equal(this.getNext().length, 6);

        block = block.getInputTargetBlock('STATEMENT');
        block.setCollapsed(true);
        assert.equal(this.getPrevious().length, 2);
        assert.equal(this.getNext().length, 3);

        block.setCollapsed(false);
        assert.equal(this.getPrevious().length, 3);
        assert.equal(this.getNext().length, 6);
      });
      test('Multi-Statement Double Collapse', function () {
        const block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(
            '<block type="statement_block">' +
              '  <statement name="STATEMENT">' +
              '    <block type="statement_block">' +
              '      <statement name="STATEMENT">' +
              '        <block type="statement_block"/>' +
              '      </statement>' +
              '    </block>' +
              '  </statement>' +
              '</block>',
          ),
          this.workspace,
        );
        this.assertConnectionsEmpty();
        this.clock.runAll();
        assert.equal(this.getPrevious().length, 3);
        assert.equal(this.getNext().length, 6);

        const middleBlock = block.getInputTargetBlock('STATEMENT');
        middleBlock.setCollapsed(true);
        assert.equal(this.getPrevious().length, 2);
        assert.equal(this.getNext().length, 3);

        block.setCollapsed(true);
        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 1);

        block.setCollapsed(false);
        assert.equal(this.getPrevious().length, 2);
        assert.equal(this.getNext().length, 3);

        middleBlock.setCollapsed(false);
        assert.equal(this.getPrevious().length, 3);
        assert.equal(this.getNext().length, 6);
      });
    });
    suite('Setting Parent Block', function () {
      setup(function () {
        this.printBlock = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(
            '<block type="text_print">' +
              '  <value name="TEXT">' +
              '    <block type="text_join">' +
              '      <mutation items="2"></mutation>' +
              '      <value name="ADD0">' +
              '        <block type="text">' +
              '        </block>' +
              '      </value>' +
              '    </block>' +
              '  </value>' +
              '</block>',
          ),
          this.workspace,
        );
        this.textJoinBlock = this.printBlock.getInputTargetBlock('TEXT');
        this.textBlock = this.textJoinBlock.getInputTargetBlock('ADD0');
        this.extraTopBlock = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(`
            <block type="text_print">
              <value name="TEXT">
                <block type="text">
                  <field name="TEXT">drag me</field>
                </block>
              </value>
            </block>`),
          this.workspace,
        );
        this.extraNestedBlock = this.extraTopBlock.getInputTargetBlock('TEXT');
      });

      function assertBlockIsOnlyChild(parent, child, inputName) {
        assert.equal(parent.getChildren().length, 1);
        assert.equal(parent.getInputTargetBlock(inputName), child);
        assert.equal(child.getParent(), parent);
      }
      function assertNonParentAndOrphan(nonParent, orphan, inputName) {
        assert.equal(nonParent.getChildren().length, 0);
        assert.isNull(nonParent.getInputTargetBlock('TEXT'));
        assert.isNull(orphan.getParent());
        assert.equal(
          orphan.getSvgRoot().parentElement,
          orphan.workspace.getCanvas(),
        );
      }
      function assertOriginalSetup() {
        assertBlockIsOnlyChild(this.printBlock, this.textJoinBlock, 'TEXT');
        assertBlockIsOnlyChild(this.textJoinBlock, this.textBlock, 'ADD0');
      }

      test('Setting to connected parent', function () {
        assert.doesNotThrow(
          this.textJoinBlock.setParent.bind(
            this.textJoinBlock,
            this.printBlock,
          ),
        );
        assertOriginalSetup.call(this);
      });
      test('Setting to new parent after connecting to it', function () {
        this.textJoinBlock.outputConnection.disconnect();
        this.textBlock.outputConnection.connect(
          this.printBlock.getInput('TEXT').connection,
        );
        assert.doesNotThrow(
          this.textBlock.setParent.bind(this.textBlock, this.printBlock),
        );
        assertBlockIsOnlyChild(this.printBlock, this.textBlock, 'TEXT');
      });
      test('Setting to new parent while connected to other block', function () {
        // Setting to grandparent with no available input connection.
        assert.throws(
          this.textBlock.setParent.bind(this.textBlock, this.printBlock),
        );
        this.textJoinBlock.outputConnection.disconnect();
        // Setting to block with available input connection.
        assert.throws(
          this.textBlock.setParent.bind(this.textBlock, this.printBlock),
        );
        assertNonParentAndOrphan(this.printBlock, this.textJoinBlock, 'TEXT');
        assertBlockIsOnlyChild(this.textJoinBlock, this.textBlock, 'ADD0');
      });
      test('Setting to same parent after disconnecting from it', function () {
        this.textJoinBlock.outputConnection.disconnect();
        assert.throws(
          this.textJoinBlock.setParent.bind(
            this.textJoinBlock,
            this.printBlock,
          ),
        );
        assertNonParentAndOrphan(this.printBlock, this.textJoinBlock, 'TEXT');
      });
      test('Setting to new parent when orphan', function () {
        this.textBlock.outputConnection.disconnect();
        // When new parent has no available input connection.
        assert.throws(
          this.textBlock.setParent.bind(this.textBlock, this.printBlock),
        );
        this.textJoinBlock.outputConnection.disconnect();
        // When new parent has available input connection.
        assert.throws(
          this.textBlock.setParent.bind(this.textBlock, this.printBlock),
        );

        assertNonParentAndOrphan(this.printBlock, this.textJoinBlock, 'TEXT');
        assertNonParentAndOrphan(this.printBlock, this.textBlock, 'TEXT');
        assertNonParentAndOrphan(this.textJoinBlock, this.textBlock, 'ADD0');
      });
      test('Setting parent to null after disconnecting', function () {
        this.textBlock.outputConnection.disconnect();
        assert.doesNotThrow(
          this.textBlock.setParent.bind(this.textBlock, null),
        );
        assertNonParentAndOrphan(this.textJoinBlock, this.textBlock, 'ADD0');
      });
      test('Setting parent to null with dragging block', function () {
        this.extraTopBlock.setDragging(true);
        this.textBlock.outputConnection.disconnect();
        assert.doesNotThrow(
          this.textBlock.setParent.bind(this.textBlock, null),
        );
        assertNonParentAndOrphan(this.textJoinBlock, this.textBlock, 'ADD0');
        assert.equal(
          this.textBlock.getSvgRoot().nextSibling,
          this.extraTopBlock.getSvgRoot(),
        );
      });
      test('Setting parent to null with non-top dragging block', function () {
        this.extraNestedBlock.setDragging(true);
        this.textBlock.outputConnection.disconnect();
        assert.doesNotThrow(
          this.textBlock.setParent.bind(this.textBlock, null),
        );
        assertNonParentAndOrphan(this.textJoinBlock, this.textBlock, 'ADD0');
        assert.equal(this.textBlock.getSvgRoot().nextSibling, null);
      });
      test('Setting parent to null without disconnecting', function () {
        assert.throws(this.textBlock.setParent.bind(this.textBlock, null));
        assertOriginalSetup.call(this);
      });
    });
    suite('Remove Connections Programmatically', function () {
      test('Output', function () {
        const block = createRenderedBlock(this.workspace, 'row_block');

        block.setOutput(false);

        assert.equal(this.getOutputs().length, 0);
        assert.equal(this.getInputs().length, 1);
      });
      test('Value', function () {
        const block = createRenderedBlock(this.workspace, 'row_block');

        block.removeInput('INPUT');

        assert.equal(this.getOutputs().length, 1);
        assert.equal(this.getInputs().length, 0);
      });
      test('Previous', function () {
        const block = createRenderedBlock(this.workspace, 'stack_block');

        block.setPreviousStatement(false);

        assert.equal(this.getPrevious().length, 0);
        assert.equal(this.getNext().length, 1);
      });
      test('Next', function () {
        const block = createRenderedBlock(this.workspace, 'stack_block');

        block.setNextStatement(false);

        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 0);
      });
      test('Statement', function () {
        const block = createRenderedBlock(this.workspace, 'statement_block');

        block.removeInput('STATEMENT');

        assert.equal(this.getPrevious().length, 1);
        assert.equal(this.getNext().length, 1);
      });
    });
    suite('Add Connections Programmatically', function () {
      test('Output', async function () {
        const block = createRenderedBlock(this.workspace, 'empty_block');

        block.setOutput(true);
        this.clock.runAll();

        this.clock.runAll();
        assert.equal(this.getOutputs().length, 1);
      });
      test('Value', function () {
        const block = createRenderedBlock(this.workspace, 'empty_block');

        block.appendValueInput('INPUT');

        this.clock.runAll();
        assert.equal(this.getInputs().length, 1);
      });
      test('Previous', function () {
        const block = createRenderedBlock(this.workspace, 'empty_block');

        block.setPreviousStatement(true);
        this.clock.runAll();

        this.clock.runAll();
        assert.equal(this.getPrevious().length, 1);
      });
      test('Next', function () {
        const block = createRenderedBlock(this.workspace, 'empty_block');

        block.setNextStatement(true);
        this.clock.runAll();

        this.clock.runAll();
        assert.equal(this.getNext().length, 1);
      });
      test('Statement', function () {
        const block = createRenderedBlock(this.workspace, 'empty_block');

        block.appendStatementInput('STATEMENT');

        this.clock.runAll();
        assert.equal(this.getNext().length, 1);
      });
    });
  });

  suite('Comments', function () {
    suite('Set/Get Text', function () {
      function assertCommentEvent(eventSpy, oldValue, newValue) {
        const calls = eventSpy.getCalls();
        const event = calls[calls.length - 1].args[0];
        assert.equal(event.type, EventType.BLOCK_CHANGE);
        assert.equal(
          event.element,
          'comment',
          'Expected the element to be a comment',
        );
        assert.equal(
          event.oldValue,
          oldValue,
          'Expected the old values to match',
        );
        assert.equal(
          event.newValue,
          newValue,
          'Expected the new values to match',
        );
      }
      function assertNoCommentEvent(eventSpy) {
        const calls = eventSpy.getCalls();
        const event = calls[calls.length - 1].args[0];
        assert.notEqual(event.type, EventType.BLOCK_CHANGE);
      }
      setup(function () {
        this.eventsFireSpy = sinon.spy(eventUtils.TEST_ONLY, 'fireInternal');
      });
      teardown(function () {
        this.eventsFireSpy.restore();
      });
      suite('Headless', function () {
        setup(function () {
          this.block = Blockly.Xml.domToBlock(
            Blockly.utils.xml.textToDom('<block type="empty_block"/>'),
            this.workspace,
          );
        });
        test('Text', function () {
          this.block.setCommentText('test text');
          assert.equal(this.block.getCommentText(), 'test text');
          assertCommentEvent(this.eventsFireSpy, null, 'test text');
        });
        test('Text Empty', function () {
          this.block.setCommentText('');
          assert.equal(this.block.getCommentText(), '');
          assertCommentEvent(this.eventsFireSpy, null, '');
        });
        test('Text Null', function () {
          this.block.setCommentText(null);
          assert.isNull(this.block.getCommentText());
          assertNoCommentEvent(this.eventsFireSpy);
        });
        test('Text -> Null', function () {
          this.block.setCommentText('first text');

          this.block.setCommentText(null);
          assert.isNull(this.block.getCommentText());
          assertCommentEvent(this.eventsFireSpy, 'first text', null);
        });
      });
      suite('Rendered', function () {
        setup(function () {
          this.workspace = Blockly.inject('blocklyDiv', {
            comments: true,
            scrollbars: true,
          });
          this.block = Blockly.Xml.domToBlock(
            Blockly.utils.xml.textToDom('<block type="empty_block"/>'),
            this.workspace,
          );
        });
        teardown(function () {
          workspaceTeardown.call(this, this.workspace);
        });
        test('Text', function () {
          this.block.setCommentText('test text');
          assert.equal(this.block.getCommentText(), 'test text');
          assertCommentEvent(this.eventsFireSpy, null, 'test text');
        });
        test('Text Empty', function () {
          this.block.setCommentText('');
          assert.equal(this.block.getCommentText(), '');
          assertCommentEvent(this.eventsFireSpy, null, '');
        });
        test('Text Null', function () {
          this.block.setCommentText(null);
          assert.isNull(this.block.getCommentText());
          assertNoCommentEvent(this.eventsFireSpy);
        });
        test('Text -> Null', function () {
          this.block.setCommentText('first text');

          this.block.setCommentText(null);
          assert.isNull(this.block.getCommentText());
          assertCommentEvent(this.eventsFireSpy, 'first text', null);
        });
        test('Set While Visible - Editable', function () {
          this.block.setCommentText('test1');
          const icon = this.block.getIcon(Blockly.icons.CommentIcon.TYPE);
          icon.setBubbleVisible(true);

          this.block.setCommentText('test2');
          assert.equal(this.block.getCommentText(), 'test2');
          assertCommentEvent(this.eventsFireSpy, 'test1', 'test2');
        });
        test('Set While Visible - NonEditable', function () {
          this.block.setCommentText('test1');
          // Restored up by call to sinon.restore() in sharedTestTeardown()
          sinon.stub(this.block, 'isEditable').returns(false);
          const icon = this.block.getIcon(Blockly.icons.CommentIcon.TYPE);
          icon.setBubbleVisible(true);

          this.block.setCommentText('test2');
          assert.equal(this.block.getCommentText(), 'test2');
          assertCommentEvent(this.eventsFireSpy, 'test1', 'test2');
        });
      });
    });

    suite('Constructing registered comment classes', function () {
      class MockComment extends MockBubbleIcon {
        getType() {
          return IconType.COMMENT;
        }

        setText() {}

        getText() {
          return '';
        }

        setBubbleSize() {}

        getBubbleSize() {
          return Size(0, 0);
        }

        setBubbleLocation() {}

        getBubbleLocation() {}

        saveState() {
          return {};
        }

        loadState() {}
      }

      if (!isCommentIcon(new MockComment())) {
        throw new TypeError('MockComment not an ICommentIcon');
      }

      setup(function () {
        this.workspace = Blockly.inject('blocklyDiv', {});

        this.block = this.workspace.newBlock('stack_block');
        this.block.initSvg();
        this.block.render();
      });

      teardown(function () {
        workspaceTeardown.call(this, this.workspace);

        Blockly.icons.registry.unregister(
          Blockly.icons.IconType.COMMENT.toString(),
        );
        Blockly.icons.registry.register(
          Blockly.icons.IconType.COMMENT,
          Blockly.icons.CommentIcon,
        );
      });

      test('setCommentText constructs the registered comment icon', function () {
        Blockly.icons.registry.unregister(
          Blockly.icons.IconType.COMMENT.toString(),
        );
        Blockly.icons.registry.register(
          Blockly.icons.IconType.COMMENT,
          MockComment,
        );

        this.block.setCommentText('test text');

        assert.instanceOf(
          this.block.getIcon(Blockly.icons.IconType.COMMENT),
          MockComment,
        );
      });

      test('setCommentText throws if no icon is registered', function () {
        Blockly.icons.registry.unregister(
          Blockly.icons.IconType.COMMENT.toString(),
        );

        assert.throws(() => {
          this.block.setCommentText('test text');
        }, 'No comment icon class is registered, so a comment cannot be set');
      });

      test('setCommentText throws if the icon is not an ICommentIcon', function () {
        Blockly.icons.registry.unregister(
          Blockly.icons.IconType.COMMENT.toString(),
        );
        Blockly.icons.registry.register(
          Blockly.icons.IconType.COMMENT,
          MockIcon,
        );

        assert.throws(() => {
          this.block.setCommentText('test text');
        }, 'The class registered as a comment icon does not conform to the ICommentIcon interface');
      });
    });
  });

  suite('Getting/Setting Field (Values)', function () {
    setup(function () {
      this.workspace = Blockly.inject('blocklyDiv');
      this.block = Blockly.Xml.domToBlock(
        Blockly.utils.xml.textToDom(
          '<block type="text"><field name = "TEXT">test</field></block>',
        ),
        this.workspace,
      );
    });

    teardown(function () {
      workspaceTeardown.call(this, this.workspace);
    });

    test('Getting Field', function () {
      assert.instanceOf(this.block.getField('TEXT'), Blockly.Field);
    });
    test('Getting Field without Name', function () {
      assert.throws(this.block.getField.bind(this.block), TypeError);
    });
    test('Getting Value of Field without Name', function () {
      assert.throws(this.block.getFieldValue.bind(this.block), TypeError);
    });
    test('Getting Field with Wrong Type', function () {
      const testFunction = function () {
        return 'TEXT';
      };
      const inputs = [
        1,
        null,
        testFunction,
        {toString: testFunction},
        ['TEXT'],
      ];
      for (let i = 0; i < inputs.length; i++) {
        assert.throws(
          this.block.getField.bind(this.block, inputs[i]),
          TypeError,
        );
      }
    });
    test('Getting Value of Field with Wrong Type', function () {
      const testFunction = function () {
        return 'TEXT';
      };
      const inputs = [
        1,
        null,
        testFunction,
        {toString: testFunction},
        ['TEXT'],
      ];
      for (let i = 0; i < inputs.length; i++) {
        assert.throws(
          this.block.getFieldValue.bind(this.block, inputs[i]),
          TypeError,
        );
      }
    });
    test('Getting/Setting Field Value', function () {
      assert.equal(this.block.getFieldValue('TEXT'), 'test');
      this.block.setFieldValue('abc', 'TEXT');
      assert.equal(this.block.getFieldValue('TEXT'), 'abc');
    });
    test('Setting Field without Name', function () {
      assert.throws(this.block.setFieldValue.bind(this.block, 'test'));
    });
    test('Setting Field with Wrong Type', function () {
      const testFunction = function () {
        return 'TEXT';
      };
      const inputs = [
        1,
        null,
        testFunction,
        {toString: testFunction},
        ['TEXT'],
      ];
      for (let i = 0; i < inputs.length; i++) {
        assert.throws(
          this.block.setFieldValue.bind(this.block, 'test', inputs[i]),
          TypeError,
        );
      }
    });
  });

  suite('Icon management', function () {
    class MockIconA extends MockIcon {
      getType() {
        return new Blockly.icons.IconType('A');
      }

      getWeight() {
        return 1;
      }
    }

    class MockIconB extends MockIcon {
      getType() {
        return new Blockly.icons.IconType('B');
      }

      getWeight() {
        return 2;
      }
    }

    suite('Adding icons', function () {
      setup(function () {
        this.workspace = Blockly.inject('blocklyDiv', {});

        this.block = this.workspace.newBlock('stack_block');
        this.block.initSvg();
        this.block.render();
        this.renderSpy = sinon.spy(this.block, 'queueRender');
      });

      teardown(function () {
        this.renderSpy.restore();
        workspaceTeardown.call(this, this.workspace);
      });

      test('icons get added to the block', function () {
        this.block.addIcon(new MockIconA());
        assert.isTrue(this.block.hasIcon('A'), 'Expected the icon to be added');
      });

      test('adding two icons of the same type throws', function () {
        this.block.addIcon(new MockIconA());
        assert.throws(
          () => {
            this.block.addIcon(new MockIconA());
          },
          Blockly.icons.DuplicateIconType,
          '',
          'Expected adding an icon of the same type to throw',
        );
      });

      test('adding an icon triggers a render', function () {
        this.renderSpy.resetHistory();
        this.block.addIcon(new MockIconA());
        assert.isTrue(
          this.renderSpy.calledOnce,
          'Expected adding an icon to trigger a render',
        );
      });
    });

    suite('Removing icons', function () {
      setup(function () {
        this.workspace = Blockly.inject('blocklyDiv');

        this.block = this.workspace.newBlock('stack_block');
        this.block.initSvg();
        this.block.render();
        this.renderSpy = sinon.spy(this.block, 'queueRender');
      });

      teardown(function () {
        this.renderSpy.restore();
        workspaceTeardown.call(this, this.workspace);
      });

      test('icons get removed from the block', function () {
        this.block.addIcon(new MockIconA());
        assert.isTrue(
          this.block.removeIcon(new Blockly.icons.IconType('A')),
          'Expected removeIcon to return true',
        );
        assert.isFalse(
          this.block.hasIcon('A'),
          'Expected the icon to be removed',
        );
      });

      test('removing an icon that does not exist returns false', function () {
        assert.isFalse(
          this.block.removeIcon(new Blockly.icons.IconType('B')),
          'Expected removeIcon to return false',
        );
      });

      test('removing an icon triggers a render', function () {
        this.block.addIcon(new MockIconA());
        this.renderSpy.resetHistory();
        this.block.removeIcon(new Blockly.icons.IconType('A'));
        assert.isTrue(
          this.renderSpy.calledOnce,
          'Expected removing an icon to trigger a render',
        );
      });
    });

    suite('Getting icons', function () {
      setup(function () {
        this.block = this.workspace.newBlock('stack_block');
      });

      test('all icons are returned from getIcons, in order of weight', function () {
        const iconA = new MockIconA();
        const iconB = new MockIconB();
        this.block.addIcon(iconB);
        this.block.addIcon(iconA);
        assert.sameOrderedMembers(
          this.block.getIcons(),
          [iconA, iconB],
          'Expected getIcon to return both icons in order of weight',
        );
      });

      test('if there are no icons, getIcons returns an empty array', function () {
        assert.isEmpty(
          this.block.getIcons(),
          'Expected getIcons to return an empty array ' +
            'for a block with no icons',
        );
      });

      test('if there are no icons, getIcons returns an empty array', function () {
        assert.isEmpty(
          this.block.getIcons(),
          'Expected getIcons to return an empty array ' +
            'for a block with no icons',
        );
      });

      test('specific icons are returned from getIcon', function () {
        const iconA = new MockIconA();
        const iconB = new MockIconB();
        this.block.addIcon(iconA);
        this.block.addIcon(iconB);
        assert.equal(
          this.block.getIcon('B'),
          iconB,
          'Expected getIcon to return the icon with the given type',
        );
      });

      test('if there is no matching icon, getIcon returns undefined', function () {
        this.block.addIcon(new MockIconA());
        assert.isUndefined(
          this.block.getIcon('B'),
          'Expected getIcon to return null if there is no ' +
            'icon with a matching type',
        );
      });
    });

    suite('Warning icons', function () {
      setup(function () {
        this.workspace = Blockly.inject('blocklyDiv');

        this.block = this.workspace.newBlock('stack_block');
        this.block.initSvg();
        this.block.render();
      });

      teardown(function () {
        workspaceTeardown.call(this, this.workspace);
      });

      test('Block with no warning text does not have warning icon', function () {
        const icon = this.block.getIcon(Blockly.icons.WarningIcon.TYPE);

        assert.isUndefined(
          icon,
          'Block with no warning should not have warning icon',
        );
      });

      test('Set warning text creates new icon if none existed', function () {
        const text = 'Warning Text';

        this.block.setWarningText(text);

        const icon = this.block.getIcon(Blockly.icons.WarningIcon.TYPE);
        assert.equal(
          icon.getText(),
          text,
          'Expected warning icon text to be set',
        );
      });

      test('Set warning text adds text to existing icon if needed', function () {
        const text1 = 'Warning Text 1';
        const text2 = 'Warning Text 2';

        this.block.setWarningText(text1, '1');
        this.block.setWarningText(text2, '2');

        const icon = this.block.getIcon(Blockly.icons.WarningIcon.TYPE);
        assert.equal(icon.getText(), `${text1}\n${text2}`);
      });

      test('Clearing all warning text deletes the warning icon', function () {
        const text = 'Warning Text';
        this.block.setWarningText(text);

        this.block.setWarningText(null);

        const icon = this.block.getIcon(Blockly.icons.WarningIcon.TYPE);
        assert.isUndefined(
          icon,
          'Expected warning icon to be undefined after deleting all warning text',
        );
      });

      test('Clearing specific warning does not delete the icon if other warnings present', function () {
        const text1 = 'Warning Text 1';
        const text2 = 'Warning Text 2';

        this.block.setWarningText(text1, '1');
        this.block.setWarningText(text2, '2');
        this.block.setWarningText(null, '1');

        const icon = this.block.getIcon(Blockly.icons.WarningIcon.TYPE);
        assert.equal(
          icon.getText(),
          text2,
          'Expected first warning text to be deleted',
        );
      });

      test('Clearing specific warning removes icon if it was only warning present', function () {
        const text1 = 'Warning Text 1';
        const text2 = 'Warning Text 2';

        this.block.setWarningText(text1, '1');
        this.block.setWarningText(text2, '2');
        this.block.setWarningText(null, '1');
        this.block.setWarningText(null, '2');

        const icon = this.block.getIcon(Blockly.icons.WarningIcon.TYPE);
        assert.isUndefined(
          icon,
          'Expected warning icon to be deleted after all warning text is cleared',
        );
      });
    });

    suite('Warning icons and collapsing', function () {
      setup(function () {
        this.workspace = Blockly.inject('blocklyDiv');
        this.parentBlock = Blockly.serialization.blocks.append(
          {
            'type': 'statement_block',
            'inputs': {
              'STATEMENT': {
                'block': {
                  'type': 'statement_block',
                },
              },
            },
          },
          this.workspace,
        );
        this.parentBlock.initSvg();
        this.parentBlock.render();

        this.childBlock = this.parentBlock.getInputTargetBlock('STATEMENT');
        this.childBlock.initSvg();
        this.childBlock.render();
      });

      teardown(function () {
        workspaceTeardown.call(this, this.workspace);
      });

      test('Adding a warning to a child block does not affect the parent', function () {
        const text = 'Warning Text';
        this.childBlock.setWarningText(text);
        const icon = this.parentBlock.getIcon(Blockly.icons.WarningIcon.TYPE);
        assert.isUndefined(
          icon,
          "Setting a child block's warning should not add a warning to the parent",
        );
      });

      test('Warnings are added and removed when collapsing a stack with warnings', function () {
        const text = 'Warning Text';

        this.childBlock.setWarningText(text);

        this.parentBlock.setCollapsed(true);
        let icon = this.parentBlock.getIcon(Blockly.icons.WarningIcon.TYPE);
        assert.exists(icon?.getText(), 'Expected warning icon text to be set');

        this.parentBlock.setCollapsed(false);
        icon = this.parentBlock.getIcon(Blockly.icons.WarningIcon.TYPE);
        assert.isUndefined(
          icon,
          'Warning should be removed from parent after expanding',
        );
      });
    });

    suite('Bubbles and collapsing', function () {
      setup(function () {
        this.workspace = Blockly.inject('blocklyDiv');
      });

      teardown(function () {
        workspaceTeardown.call(this, this.workspace);
      });

      test("Collapsing the block closes its contained children's bubbles", function () {
        const parentBlock = Blockly.serialization.blocks.append(
          {
            'type': 'statement_block',
            'inputs': {
              'STATEMENT': {
                'block': {
                  'type': 'statement_block',
                },
              },
            },
          },
          this.workspace,
        );
        const childBlock = parentBlock.getInputTargetBlock('STATEMENT');
        const icon = new MockBubbleIcon();
        childBlock.addIcon(icon);
        icon.setBubbleVisible(true);

        parentBlock.setCollapsed(true);

        assert.isFalse(
          icon.bubbleIsVisible(),
          "Expected collapsing the parent block to hide the child block's " +
            "icon's bubble",
        );
      });

      test("Collapsing a block does not close its following childrens' bubbles", function () {
        const parentBlock = Blockly.serialization.blocks.append(
          {
            'type': 'statement_block',
            'next': {
              'block': {
                'type': 'statement_block',
              },
            },
          },
          this.workspace,
        );
        const nextBlock = parentBlock.getNextBlock();
        const icon = new MockBubbleIcon();
        nextBlock.addIcon(icon);
        icon.setBubbleVisible(true);

        parentBlock.setCollapsed(true);

        assert.isTrue(
          icon.bubbleIsVisible(),
          'Expected collapsing the parent block to not hide the next ' +
            "block's bubble",
        );
      });
    });
  });

  suite('Collapsing and Expanding', function () {
    function assertCollapsed(block, opt_string) {
      assert.isTrue(block.isCollapsed());
      for (let i = 0, input; (input = block.inputList[i]); i++) {
        if (input.name == Blockly.Block.COLLAPSED_INPUT_NAME) {
          continue;
        }
        assert.isFalse(input.isVisible());
        for (let j = 0, field; (field = input.fieldRow[j]); j++) {
          assert.isFalse(field.isVisible());
        }
      }
      const icons = block.getIcons();
      for (let i = 0, icon; (icon = icons[i]); i++) {
        assert.isFalse(icon.bubbleIsVisible());
      }

      const input = block.getInput(Blockly.Block.COLLAPSED_INPUT_NAME);
      assert.isNotNull(input);
      assert.isTrue(input.isVisible());
      const field = block.getField(Blockly.Block.COLLAPSED_FIELD_NAME);
      assert.isNotNull(field);
      assert.isTrue(field.isVisible());

      if (opt_string) {
        assert.equal(field.getText(), opt_string);
      }
    }
    function assertNotCollapsed(block) {
      assert.isFalse(block.isCollapsed());
      for (let i = 0, input; (input = block.inputList[i]); i++) {
        assert.isTrue(input.isVisible());
        for (let j = 0, field; (field = input.fieldRow[j]); j++) {
          assert.isTrue(field.isVisible());
        }
      }

      const input = block.getInput(Blockly.Block.COLLAPSED_INPUT_NAME);
      assert.isNull(input);
      const field = block.getField(Blockly.Block.COLLAPSED_FIELD_NAME);
      assert.isNull(field);
    }
    function isBlockHidden(block) {
      let node = block.getSvgRoot();
      do {
        const visible = node.style.display != 'none';
        if (!visible) {
          return true;
        }
        node = node.parentNode;
      } while (node != document);
      return false;
    }

    setup(function () {
      eventUtils.disable();
      // We need a visible workspace.
      this.workspace = Blockly.inject('blocklyDiv', {});
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'variable_block',
          'message0': '%1',
          'args0': [
            {
              'type': 'field_variable',
              'name': 'NAME',
              'variable': 'x',
            },
          ],
        },
      ]);
      this.variableMap = this.workspace.getVariableMap();
    });
    teardown(function () {
      eventUtils.enable();
      workspaceTeardown.call(this, this.workspace);
    });
    suite('Connecting and Disconnecting', function () {
      test('Connect Block to Next', function () {
        const blockA = createRenderedBlock(this.workspace, 'stack_block');
        const blockB = createRenderedBlock(this.workspace, 'stack_block');

        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        blockA.nextConnection.connect(blockB.previousConnection);
        assertNotCollapsed(blockB);
      });
      test('Connect Block to Value Input', function () {
        const blockA = createRenderedBlock(this.workspace, 'row_block');
        const blockB = createRenderedBlock(this.workspace, 'row_block');

        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        blockA.getInput('INPUT').connection.connect(blockB.outputConnection);
        assert.isTrue(isBlockHidden(blockB));
        blockA.setCollapsed(false);
        assertNotCollapsed(blockA);
        assert.isFalse(isBlockHidden(blockB));
      });
      test('Connect Block to Statement Input', function () {
        const blockA = createRenderedBlock(this.workspace, 'statement_block');
        const blockB = createRenderedBlock(this.workspace, 'stack_block');

        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        blockA
          .getInput('STATEMENT')
          .connection.connect(blockB.previousConnection);
        assert.isTrue(isBlockHidden(blockB));
        blockA.setCollapsed(false);
        assertNotCollapsed(blockA);
        assert.isFalse(isBlockHidden(blockB));
      });
      test('Connect Block to Child of Collapsed - Input', function () {
        const blockA = createRenderedBlock(this.workspace, 'row_block');
        const blockB = createRenderedBlock(this.workspace, 'row_block');
        const blockC = createRenderedBlock(this.workspace, 'row_block');

        blockA.getInput('INPUT').connection.connect(blockB.outputConnection);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        assert.isTrue(isBlockHidden(blockB));
        blockB.getInput('INPUT').connection.connect(blockC.outputConnection);
        assert.isTrue(isBlockHidden(blockC));

        blockA.setCollapsed(false);
        assertNotCollapsed(blockA);
        assert.isFalse(isBlockHidden(blockB));
        assert.isFalse(isBlockHidden(blockC));
      });
      test('Connect Block to Child of Collapsed - Next', function () {
        const blockA = createRenderedBlock(this.workspace, 'statement_block');
        const blockB = createRenderedBlock(this.workspace, 'stack_block');
        const blockC = createRenderedBlock(this.workspace, 'stack_block');

        blockA
          .getInput('STATEMENT')
          .connection.connect(blockB.previousConnection);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        assert.isTrue(isBlockHidden(blockB));
        blockB.nextConnection.connect(blockC.previousConnection);
        assert.isTrue(isBlockHidden(blockC));

        blockA.setCollapsed(false);
        assertNotCollapsed(blockA);
        assert.isFalse(isBlockHidden(blockB));
        assert.isFalse(isBlockHidden(blockC));
      });
      test('Connect Block to Value Input Already Taken', function () {
        const blockA = createRenderedBlock(this.workspace, 'row_block');
        const blockB = createRenderedBlock(this.workspace, 'row_block');
        const blockC = createRenderedBlock(this.workspace, 'row_block');

        blockA.getInput('INPUT').connection.connect(blockB.outputConnection);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        assert.isTrue(isBlockHidden(blockB));
        blockA.getInput('INPUT').connection.connect(blockC.outputConnection);
        assert.isTrue(isBlockHidden(blockC));
        // Still hidden after C is inserted between.
        assert.isTrue(isBlockHidden(blockB));

        blockA.setCollapsed(false);
        assertNotCollapsed(blockA);
        assert.isFalse(isBlockHidden(blockB));
        assert.isFalse(isBlockHidden(blockC));
      });
      test('Connect Block to Statement Input Already Taken', function () {
        const blockA = createRenderedBlock(this.workspace, 'statement_block');
        const blockB = createRenderedBlock(this.workspace, 'stack_block');
        const blockC = createRenderedBlock(this.workspace, 'stack_block');

        blockA
          .getInput('STATEMENT')
          .connection.connect(blockB.previousConnection);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        assert.isTrue(isBlockHidden(blockB));
        blockA
          .getInput('STATEMENT')
          .connection.connect(blockC.previousConnection);
        assert.isTrue(isBlockHidden(blockC));
        // Still hidden after C is inserted between.
        assert.isTrue(isBlockHidden(blockB));

        blockA.setCollapsed(false);
        assertNotCollapsed(blockA);
        assert.isFalse(isBlockHidden(blockB));
        assert.isFalse(isBlockHidden(blockC));
      });
      test('Connect Block with Child - Input', function () {
        const blockA = createRenderedBlock(this.workspace, 'row_block');
        const blockB = createRenderedBlock(this.workspace, 'row_block');
        const blockC = createRenderedBlock(this.workspace, 'row_block');

        blockB.getInput('INPUT').connection.connect(blockC.outputConnection);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        blockA.getInput('INPUT').connection.connect(blockB.outputConnection);
        assert.isTrue(isBlockHidden(blockC));
        assert.isTrue(isBlockHidden(blockB));

        blockA.setCollapsed(false);
        assertNotCollapsed(blockA);
        assert.isFalse(isBlockHidden(blockB));
        assert.isFalse(isBlockHidden(blockC));
      });
      test('Connect Block with Child - Statement', function () {
        const blockA = createRenderedBlock(this.workspace, 'statement_block');
        const blockB = createRenderedBlock(this.workspace, 'stack_block');
        const blockC = createRenderedBlock(this.workspace, 'stack_block');

        blockB.nextConnection.connect(blockC.previousConnection);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        blockA
          .getInput('STATEMENT')
          .connection.connect(blockB.previousConnection);
        assert.isTrue(isBlockHidden(blockC));
        assert.isTrue(isBlockHidden(blockB));

        blockA.setCollapsed(false);
        assertNotCollapsed(blockA);
        assert.isFalse(isBlockHidden(blockB));
        assert.isFalse(isBlockHidden(blockC));
      });
      test('Disconnect Block from Value Input', function () {
        const blockA = createRenderedBlock(this.workspace, 'row_block');
        const blockB = createRenderedBlock(this.workspace, 'row_block');

        blockA.getInput('INPUT').connection.connect(blockB.outputConnection);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        assert.isTrue(isBlockHidden(blockB));
        blockB.outputConnection.disconnect();
        assert.isFalse(isBlockHidden(blockB));
      });
      test('Disconnect Block from Statement Input', function () {
        const blockA = createRenderedBlock(this.workspace, 'statement_block');
        const blockB = createRenderedBlock(this.workspace, 'stack_block');

        blockA
          .getInput('STATEMENT')
          .connection.connect(blockB.previousConnection);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        assert.isTrue(isBlockHidden(blockB));
        blockB.previousConnection.disconnect();
        assert.isFalse(isBlockHidden(blockB));
      });
      test('Disconnect Block from Child of Collapsed - Input', function () {
        const blockA = createRenderedBlock(this.workspace, 'row_block');
        const blockB = createRenderedBlock(this.workspace, 'row_block');
        const blockC = createRenderedBlock(this.workspace, 'row_block');

        blockA.getInput('INPUT').connection.connect(blockB.outputConnection);
        blockB.getInput('INPUT').connection.connect(blockC.outputConnection);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        assert.isTrue(isBlockHidden(blockB));
        assert.isTrue(isBlockHidden(blockC));

        blockC.outputConnection.disconnect();
        assert.isFalse(isBlockHidden(blockC));
      });
      test('Disconnect Block from Child of Collapsed - Next', function () {
        const blockA = createRenderedBlock(this.workspace, 'statement_block');
        const blockB = createRenderedBlock(this.workspace, 'stack_block');
        const blockC = createRenderedBlock(this.workspace, 'stack_block');

        blockA
          .getInput('STATEMENT')
          .connection.connect(blockB.previousConnection);
        blockB.nextConnection.connect(blockC.previousConnection);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        assert.isTrue(isBlockHidden(blockB));
        assert.isTrue(isBlockHidden(blockC));

        blockC.previousConnection.disconnect();
        assert.isFalse(isBlockHidden(blockC));
      });
      test('Disconnect Block with Child - Input', function () {
        const blockA = createRenderedBlock(this.workspace, 'row_block');
        const blockB = createRenderedBlock(this.workspace, 'row_block');
        const blockC = createRenderedBlock(this.workspace, 'row_block');

        blockB.getInput('INPUT').connection.connect(blockC.outputConnection);
        blockA.getInput('INPUT').connection.connect(blockB.outputConnection);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        assert.isTrue(isBlockHidden(blockB));
        assert.isTrue(isBlockHidden(blockC));

        blockB.outputConnection.disconnect();
        assert.isFalse(isBlockHidden(blockB));
        assert.isFalse(isBlockHidden(blockC));
      });
      test('Disconnect Block with Child - Statement', function () {
        const blockA = createRenderedBlock(this.workspace, 'statement_block');
        const blockB = createRenderedBlock(this.workspace, 'stack_block');
        const blockC = createRenderedBlock(this.workspace, 'stack_block');

        blockB.nextConnection.connect(blockC.previousConnection);
        blockA
          .getInput('STATEMENT')
          .connection.connect(blockB.previousConnection);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        assert.isTrue(isBlockHidden(blockC));
        assert.isTrue(isBlockHidden(blockB));

        blockB.previousConnection.disconnect();
        assert.isFalse(isBlockHidden(blockB));
        assert.isFalse(isBlockHidden(blockC));
      });
    });
    suite('Adding and Removing Block Parts', function () {
      test('Add Previous Connection', function () {
        const blockA = createRenderedBlock(this.workspace, 'empty_block');
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        blockA.setPreviousStatement(true);
        assertCollapsed(blockA);
        assert.isNotNull(blockA.previousConnection);
      });
      test('Add Next Connection', function () {
        const blockA = createRenderedBlock(this.workspace, 'empty_block');
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        blockA.setNextStatement(true);
        assertCollapsed(blockA);
        assert.isNotNull(blockA.nextConnection);
      });
      test('Add Input', function () {
        const blockA = createRenderedBlock(this.workspace, 'empty_block');
        blockA.setCollapsed(true);

        blockA.appendDummyInput('NAME');

        this.clock.runAll();
        assertCollapsed(blockA);
        assert.isNotNull(blockA.getInput('NAME'));
      });
      test('Add Field', function () {
        const blockA = createRenderedBlock(this.workspace, 'empty_block');
        const input = blockA.appendDummyInput('NAME');
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        input.appendField(new Blockly.FieldLabel('test'), 'FIELD');
        assertCollapsed(blockA);
        const field = blockA.getField('FIELD');
        assert.isNotNull(field);
        assert.equal(field.getText(), 'test');
      });
      test('Add Icon', function () {
        const blockA = createRenderedBlock(this.workspace, 'empty_block');
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        blockA.setCommentText('test');
        assertCollapsed(blockA);
      });
      test('Remove Previous Connection', function () {
        const blockA = createRenderedBlock(this.workspace, 'empty_block');
        blockA.setPreviousStatement(true);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        blockA.setPreviousStatement(false);
        assertCollapsed(blockA);
        assert.isNull(blockA.previousConnection);
      });
      test('Remove Next Connection', function () {
        const blockA = createRenderedBlock(this.workspace, 'empty_block');
        blockA.setNextStatement(true);
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        blockA.setNextStatement(false);
        assertCollapsed(blockA);
        assert.isNull(blockA.nextConnection);
      });
      test('Remove Input', function () {
        const blockA = createRenderedBlock(this.workspace, 'empty_block');
        blockA.appendDummyInput('NAME');
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        blockA.removeInput('NAME');
        assertCollapsed(blockA);
        assert.isNull(blockA.getInput('NAME'));
      });
      test('Remove Field', function () {
        const blockA = createRenderedBlock(this.workspace, 'empty_block');
        const input = blockA.appendDummyInput('NAME');
        input.appendField(new Blockly.FieldLabel('test'), 'FIELD');
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        input.removeField('FIELD');
        assertCollapsed(blockA);
        const field = blockA.getField('FIELD');
        assert.isNull(field);
      });
      test('Remove Icon', function () {
        const blockA = createRenderedBlock(this.workspace, 'empty_block');
        blockA.setCommentText('test');
        blockA.setCollapsed(true);
        assertCollapsed(blockA);
        blockA.setCommentText(null);
        assertCollapsed(blockA);
      });
    });

    suite('Renaming Vars', function () {
      test('Simple Rename', function () {
        const blockA = createRenderedBlock(this.workspace, 'variable_block');

        blockA.setCollapsed(true);
        const variable = this.workspace.getVariable('x', '');
        this.variableMap.renameVariable(variable, 'y');

        this.clock.runAll();
        assertCollapsed(blockA, 'y');
      });
      test('Coalesce, Different Case', function () {
        const blockA = createRenderedBlock(this.workspace, 'variable_block');

        blockA.setCollapsed(true);
        const variable = this.variableMap.createVariable('y');
        this.variableMap.renameVariable(variable, 'X');

        this.clock.runAll();
        assertCollapsed(blockA, 'X');
      });
    });
    suite('Disabled Blocks', function () {
      test('Children of Collapsed Blocks Should Enable Properly', function () {
        const blockA = createRenderedBlock(this.workspace, 'statement_block');
        const blockB = createRenderedBlock(this.workspace, 'stack_block');
        blockA
          .getInput('STATEMENT')
          .connection.connect(blockB.previousConnection);
        // Disable the block and collapse it.
        blockA.setDisabledReason(true, 'test reason');
        blockA.setCollapsed(true);

        // Enable the block before expanding it.
        blockA.setDisabledReason(false, 'test reason');
        blockA.setCollapsed(false);

        // The child blocks should be enabled.
        assert.isTrue(blockB.isEnabled());
        assert.isFalse(
          blockB.getSvgRoot().classList.contains('blocklyDisabled'),
        );
      });
      test('Disabled Children of Collapsed Blocks Should Stay Disabled', function () {
        const blockA = createRenderedBlock(this.workspace, 'statement_block');
        const blockB = createRenderedBlock(this.workspace, 'stack_block');
        blockA
          .getInput('STATEMENT')
          .connection.connect(blockB.previousConnection);

        // Disable the child block.
        blockB.setDisabledReason(true, 'test reason');

        // Collapse and disable the parent block.
        blockA.setCollapsed(false);
        blockA.setDisabledReason(true, 'test reason');

        // Enable the parent block.
        blockA.setDisabledReason(false, 'test reason');
        blockA.setCollapsed(true);

        // Child blocks should stay disabled if they have been set.
        assert.isFalse(blockB.isEnabled());
      });
      test('Disabled blocks from JSON should have proper disabled status', function () {
        // Nested c-shaped blocks, inner block is disabled
        const blockJson = {
          'type': 'controls_if',
          'inputs': {
            'DO0': {
              'block': {
                'type': 'controls_if',
                'enabled': false,
              },
            },
          },
        };
        Blockly.serialization.blocks.append(blockJson, this.workspace);
        const innerBlock = this.workspace
          .getTopBlocks(false)[0]
          .getChildren()[0];
        assert.isTrue(
          innerBlock.visuallyDisabled,
          'block should have visuallyDisabled set because it is disabled',
        );
        assert.isFalse(
          innerBlock.isEnabled(),
          'block should be marked disabled because enabled json property was set to false',
        );
      });
      test('Disabled blocks from XML should have proper disabled status', function () {
        // Nested c-shaped blocks, inner block is disabled
        const blockXml = `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="controls_if" x="63" y="87">
          <statement name="DO0">
            <block type="controls_if" disabled="true"></block>
          </statement>
        </block>
      </xml>`;
        Blockly.Xml.domToWorkspace(
          Blockly.utils.xml.textToDom(blockXml),
          this.workspace,
        );
        const innerBlock = this.workspace
          .getTopBlocks(false)[0]
          .getChildren()[0];
        assert.isTrue(
          innerBlock.visuallyDisabled,
          'block should have visuallyDisabled set because it is disabled',
        );
        assert.isFalse(
          innerBlock.isEnabled(),
          'block should be marked disabled because enabled xml property was set to false',
        );
      });
      suite('Disabling blocks with children and neighbors', function () {
        setup(function () {
          // c-shape block with a stack of 4 blocks in the input
          const blockJson = {
            'type': 'controls_if',
            'id': 'parent',
            'inputs': {
              'DO0': {
                'block': {
                  'type': 'controls_repeat_ext',
                  'id': 'child1',
                  'next': {
                    'block': {
                      'type': 'controls_for',
                      'id': 'child2',
                      'enabled': false,
                      'next': {
                        'block': {
                          'type': 'controls_whileUntil',
                          'id': 'child3',
                          'next': {
                            'block': {
                              'type': 'controls_forEach',
                              'id': 'child4',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          };
          Blockly.serialization.blocks.append(blockJson, this.workspace);
          this.parent = this.workspace.getBlockById('parent');
          this.child1 = this.workspace.getBlockById('child1');
          this.child2 = this.workspace.getBlockById('child2');
          this.child3 = this.workspace.getBlockById('child3');
          this.child4 = this.workspace.getBlockById('child4');
        });
        test('Disabling parent block visually disables all descendants', async function () {
          this.parent.setDisabledReason(true, 'test reason');
          await Blockly.renderManagement.finishQueuedRenders();
          for (const child of this.parent.getDescendants(false)) {
            assert.isTrue(
              child.visuallyDisabled,
              `block ${child.id} should be visually disabled`,
            );
          }
        });
        test('Child blocks regain original status after parent is re-enabled', async function () {
          this.parent.setDisabledReason(true, 'test reason');
          await Blockly.renderManagement.finishQueuedRenders();
          this.parent.setDisabledReason(false, 'test reason');
          await Blockly.renderManagement.finishQueuedRenders();

          // child2 is disabled, rest should be enabled
          assert.isTrue(this.child1.isEnabled(), 'child1 should be enabled');
          assert.isFalse(
            this.child1.visuallyDisabled,
            'child1 should not be visually disabled',
          );

          assert.isFalse(this.child2.isEnabled(), 'child2 should be disabled');
          assert.isTrue(
            this.child2.visuallyDisabled,
            'child2 should be visually disabled',
          );

          assert.isTrue(this.child3.isEnabled(), 'child3 should be enabled');
          assert.isFalse(
            this.child3.visuallyDisabled,
            'child3 should not be visually disabled',
          );

          assert.isTrue(this.child4.isEnabled(), 'child34 should be enabled');
          assert.isFalse(
            this.child4.visuallyDisabled,
            'child4 should not be visually disabled',
          );
        });
      });
    });
  });

  suite('Style', function () {
    suite('Headless', function () {
      setup(function () {
        this.block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom('<block type="empty_block"/>'),
          this.workspace,
        );
      });
      test('Set colour', function () {
        this.block.setColour('20');
        assert.equal(this.block.getColour(), '#a5745b');
        assert.equal(this.block.colour_, this.block.getColour());
        assert.equal(this.block.getHue(), '20');
      });
      test('Set style', function () {
        this.block.setStyle('styleOne');
        assert.equal(this.block.getStyleName(), 'styleOne');
        assert.isNull(this.block.getHue());
        // Calling setStyle does not update the colour on a headless block.
        assert.equal(this.block.getColour(), '#000000');
      });
    });
    suite('Rendered', function () {
      setup(function () {
        this.workspace = Blockly.inject('blocklyDiv', {});
        this.block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom('<block type="empty_block"/>'),
          this.workspace,
        );
        this.workspace.setTheme(
          new Blockly.Theme('test', {
            'styleOne': {
              'colourPrimary': '#000000',
              'colourSecondary': '#999999',
              'colourTertiary': '#4d4d4d',
              'hat': '',
            },
          }),
          {},
        );
      });
      teardown(function () {
        workspaceTeardown.call(this, this.workspace);
        // Clear all registered themes.
        Blockly.registry.TEST_ONLY.typeMap['theme'] = {};
      });
      test('Set colour hue', function () {
        this.block.setColour('20');
        assert.equal(this.block.getStyleName(), 'auto_#a5745b');
        assert.equal(this.block.getColour(), '#a5745b');
        assert.equal(this.block.colour_, this.block.getColour());
        assert.equal(this.block.getHue(), '20');
      });
      test('Set colour hex', function () {
        this.block.setColour('#000000');
        assert.equal(this.block.getStyleName(), 'auto_#000000');
        assert.equal(this.block.getColour(), '#000000');
        assert.equal(this.block.colour_, this.block.getColour());
        assert.isNull(this.block.getHue());
      });
      test('Set style', function () {
        this.block.setStyle('styleOne');
        assert.equal(this.block.getStyleName(), 'styleOne');
        assert.equal(this.block.getColour(), '#000000');
        assert.equal(this.block.colour_, this.block.getColour());
      });
    });
  });

  suite('toString', function () {
    const toStringTests = [
      {
        name: 'statement block',
        xml:
          '<block type="controls_repeat_ext">' +
          '<value name="TIMES">' +
          '<shadow type="math_number">' +
          '<field name="NUM">10</field>' +
          '</shadow>' +
          '</value>' +
          '</block>',
        toString: 'repeat 10 times do ?',
      },
      {
        name: 'nested statement blocks',
        xml:
          '<block type="controls_repeat_ext">' +
          '<value name="TIMES">' +
          '<shadow type="math_number">' +
          '<field name="NUM">10</field>' +
          '</shadow>' +
          '</value>' +
          '<statement name="DO">' +
          '<block type="controls_if"></block>' +
          '</statement>' +
          '</block>',
        toString: 'repeat 10 times do if ? do ?',
      },
      {
        name: 'nested Boolean output blocks',
        xml:
          '<block type="controls_if">' +
          '<value name="IF0">' +
          '<block type="logic_compare">' +
          '<field name="OP">EQ</field>' +
          '<value name="A">' +
          '<block type="logic_operation">' +
          '<field name="OP">AND</field>' +
          '</block>' +
          '</value>' +
          '</block>' +
          '</value>' +
          '</block>',
        toString: 'if ((? and ?) = ?) do ?',
      },
      {
        name: 'output block',
        xml:
          '<block type="math_single">' +
          '<field name="OP">ROOT</field>' +
          '<value name="NUM">' +
          '<shadow type="math_number">' +
          '<field name="NUM">9</field>' +
          '</shadow>' +
          '</value>' +
          '</block>',
        toString: 'square root 9',
      },
      {
        name: 'nested Number output blocks',
        xml:
          '<block type="math_arithmetic">' +
          '<field name="OP">ADD</field>' +
          '<value name="A">' +
          '<shadow type="math_number">' +
          '<field name="NUM">1</field>' +
          '</shadow>' +
          '<block type="math_arithmetic">' +
          '<field name="OP">MULTIPLY</field>' +
          '<value name="A">' +
          '<shadow type="math_number">' +
          '<field name="NUM">10</field>' +
          '</shadow>' +
          '</value>' +
          '<value name="B">' +
          '<shadow type="math_number">' +
          '<field name="NUM">5</field>' +
          '</shadow>' +
          '</value>' +
          '</block>' +
          '</value>' +
          '<value name="B">' +
          '<shadow type="math_number">' +
          '<field name="NUM">3</field>' +
          '</shadow>' +
          '</value>' +
          '</block>',
        toString: '(10 × 5) + 3',
      },
      {
        name: 'nested String output blocks',
        xml:
          '<block type="text_join">' +
          '<mutation items="2"></mutation>' +
          '<value name="ADD0">' +
          '<block type="text">' +
          '<field name="TEXT">Hello</field>' +
          '</block>' +
          '</value>' +
          '<value name="ADD1">' +
          '<block type="text">' +
          '<field name="TEXT">World</field>' +
          '</block>' +
          '</value>' +
          '</block>',
        toString: 'create text with “ Hello ” “ World ”',
      },
      {
        name: 'parentheses in string literal',
        xml:
          '<block type="text">' +
          '<field name="TEXT">foo ( bar ) baz</field>' +
          '</block>',
        toString: '“ foo ( bar ) baz ”',
      },
    ];
    // Create mocha test cases for each toString test.
    toStringTests.forEach(function (t) {
      test(t.name, function () {
        const block = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(t.xml),
          this.workspace,
        );
        assert.equal(block.toString(), t.toString);
      });
    });
  });

  suite('Initialization', function () {
    setup(function () {
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'init_test_block',
          'message0': '',
        },
      ]);
    });
    test('recordUndo is reset even if init throws', function () {
      // The test could pass if init is never called,
      // so we assert init was called to be safe.
      let initCalled = false;
      let recordUndoDuringInit;
      Blockly.Blocks['init_test_block'].init = function () {
        initCalled = true;
        recordUndoDuringInit = eventUtils.getRecordUndo();
        throw new Error();
      };
      assert.throws(
        function () {
          this.workspace.newBlock('init_test_block');
        }.bind(this),
      );
      assert.isFalse(
        recordUndoDuringInit,
        'recordUndo should be false during block init function',
      );
      assert.isTrue(
        eventUtils.getRecordUndo(),
        'recordUndo should be reset to true after init',
      );
      assert.isTrue(initCalled, 'expected init function to be called');
    });
  });

  suite('EndOfRow', function () {
    setup(function () {
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'end_row_test_block',
          'message0': 'Row1\nRow2',
          'inputsInline': true,
        },
      ]);
    });
    test('Newline is converted to an end-row input', function () {
      const block = this.workspace.newBlock('end_row_test_block');
      assert.equal(block.inputList[0].fieldRow[0].getValue(), 'Row1');
      assert.isTrue(
        block.inputList[0] instanceof EndRowInput,
        'newline should be converted to an end-row input',
      );
      assert.equal(block.inputList[1].fieldRow[0].getValue(), 'Row2');
    });
  });
});
