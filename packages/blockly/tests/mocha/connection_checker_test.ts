/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('Connection checker', function () {
  let workspace: Blockly.Workspace;
  let checker: Blockly.IConnectionChecker;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = new Blockly.Workspace();
  });
  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });
  suiteSetup(function () {
    checker = new Blockly.ConnectionChecker();
  });
  suite('Safety checks', function () {
    function assertReasonHelper(
      checker: Blockly.IConnectionChecker,
      one: Blockly.Connection | null,
      two: Blockly.Connection | null,
      reason: number,
    ) {
      assert.equal(checker.canConnectWithReason(one, two, false), reason);
      // Order should not matter.
      assert.equal(checker.canConnectWithReason(two, one, false), reason);
    }

    test('Target Null', function () {
      const block = workspace.newBlock('logic_negate');
      block.initModel();

      const inputConnection = block.getInput('BOOL')?.connection;
      assert.exists(inputConnection);

      assertReasonHelper(
        checker,
        inputConnection,
        null,
        Blockly.Connection.REASON_TARGET_NULL,
      );
    });
    test('Target Self', function () {
      const block = workspace.newBlock('logic_negate');
      block.initModel();

      const inputConnection = block.getInput('BOOL')?.connection;
      assert.exists(inputConnection);

      assertReasonHelper(
        checker,
        inputConnection,
        block.outputConnection,
        Blockly.Connection.REASON_SELF_CONNECTION,
      );
    });
    test('Different Workspaces', function () {
      const workspace2 = new Blockly.Workspace();
      const block1 = workspace.newBlock('logic_negate');
      const block2 = workspace2.newBlock('logic_negate');
      block1.initModel();
      block2.initModel();

      const connection1 = block1.getInput('BOOL')?.connection;
      assert.exists(connection1);
      const connection2 = block2.outputConnection;

      assertReasonHelper(
        checker,
        connection1,
        connection2,
        Blockly.Connection.REASON_DIFFERENT_WORKSPACES,
      );
    });
    suite('Types', function () {
      let previous: Blockly.Connection;
      let next: Blockly.Connection;
      let output: Blockly.Connection;
      let input: Blockly.Connection;

      setup(function () {
        // We have to declare each separately so that the connections belong
        // on different blocks.
        const prevBlock = workspace.newBlock('text_print');
        const nextBlock = workspace.newBlock('text_print');
        const outBlock = workspace.newBlock('logic_negate');
        const inBlock = workspace.newBlock('logic_negate');

        prevBlock.initModel();
        nextBlock.initModel();
        outBlock.initModel();
        inBlock.initModel();

        const previousConnection = prevBlock.previousConnection;
        assert.exists(previousConnection);
        previous = previousConnection;

        const nextConnection = nextBlock.nextConnection;
        assert.exists(nextConnection);
        next = nextConnection;

        const outputConnection = outBlock.outputConnection;
        assert.exists(outputConnection);
        output = outputConnection;

        const inputConnection = inBlock.getInput('BOOL')?.connection;
        assert.exists(inputConnection);
        input = inputConnection;
      });
      test('Previous, Next', function () {
        assertReasonHelper(
          checker,
          previous,
          next,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Previous, Output', function () {
        assertReasonHelper(
          checker,
          previous,
          output,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Previous, Input', function () {
        assertReasonHelper(
          checker,
          previous,
          input,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Next, Previous', function () {
        assertReasonHelper(
          checker,
          next,
          previous,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Next, Output', function () {
        assertReasonHelper(
          checker,
          next,
          output,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Next, Input', function () {
        assertReasonHelper(
          checker,
          next,
          input,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Output, Previous', function () {
        assertReasonHelper(
          checker,
          previous,
          output,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Output, Next', function () {
        assertReasonHelper(
          checker,
          output,
          next,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Output, Input', function () {
        assertReasonHelper(
          checker,
          output,
          input,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Input, Previous', function () {
        assertReasonHelper(
          checker,
          previous,
          input,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Input, Next', function () {
        assertReasonHelper(
          checker,
          input,
          next,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Input, Output', function () {
        assertReasonHelper(
          checker,
          input,
          output,
          Blockly.Connection.CAN_CONNECT,
        );
      });
    });
    suite('Shadows', function () {
      test('Previous Shadow', function () {
        const prevBlock = workspace.newBlock('text_print');
        prevBlock.initModel();
        prevBlock.setShadow(true);
        const nextBlock = workspace.newBlock('text_print');
        nextBlock.initModel();

        const prev = prevBlock.previousConnection;
        const next = nextBlock.nextConnection;

        assertReasonHelper(checker, prev, next, Blockly.Connection.CAN_CONNECT);
      });
      test('Next Shadow', function () {
        const prevBlock = workspace.newBlock('text_print');
        prevBlock.initModel();
        const nextBlock = workspace.newBlock('text_print');
        nextBlock.initModel();
        nextBlock.setShadow(true);

        const prev = prevBlock.previousConnection;
        const next = nextBlock.nextConnection;

        assertReasonHelper(
          checker,
          prev,
          next,
          Blockly.Connection.REASON_SHADOW_PARENT,
        );
      });
      test('Prev and Next Shadow', function () {
        const prevBlock = workspace.newBlock('text_print');
        prevBlock.initModel();
        prevBlock.setShadow(true);
        const nextBlock = workspace.newBlock('text_print');
        nextBlock.initModel();
        nextBlock.setShadow(true);

        const prev = prevBlock.previousConnection;
        const next = nextBlock.nextConnection;

        assertReasonHelper(checker, prev, next, Blockly.Connection.CAN_CONNECT);
      });
      test('Output Shadow', function () {
        const outBlock = workspace.newBlock('logic_negate');
        outBlock.initModel();
        outBlock.setShadow(true);
        const inBlock = workspace.newBlock('logic_negate');
        inBlock.initModel();

        const outCon = outBlock.outputConnection;
        const inCon = inBlock.getInput('BOOL')?.connection;
        assert.exists(inCon);

        assertReasonHelper(
          checker,
          outCon,
          inCon,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Input Shadow', function () {
        const outBlock = workspace.newBlock('logic_negate');
        outBlock.initModel();
        const inBlock = workspace.newBlock('logic_negate');
        inBlock.initModel();
        inBlock.setShadow(true);

        const outCon = outBlock.outputConnection;
        const inCon = inBlock.getInput('BOOL')?.connection;
        assert.exists(inCon);

        assertReasonHelper(
          checker,
          outCon,
          inCon,
          Blockly.Connection.REASON_SHADOW_PARENT,
        );
      });
      test('Output and Input Shadow', function () {
        const outBlock = workspace.newBlock('logic_negate');
        outBlock.initModel();
        outBlock.setShadow(true);
        const inBlock = workspace.newBlock('logic_negate');
        inBlock.initModel();
        inBlock.setShadow(true);

        const outCon = outBlock.outputConnection;
        const inCon = inBlock.getInput('BOOL')?.connection;
        assert.exists(inCon);

        assertReasonHelper(
          checker,
          outCon,
          inCon,
          Blockly.Connection.CAN_CONNECT,
        );
      });
    });
    suite('Output and Previous', function () {
      /**
       * Update two connections to target each other.
       *
       * @param first The first connection to update.
       * @param second The second connection to update.
       */
      const connectReciprocally = function (
        first: Blockly.Connection | null,
        second: Blockly.Connection | null,
      ) {
        if (!first || !second) {
          throw Error('Cannot connect null connections.');
        }
        first.targetConnection = second;
        second.targetConnection = first;
      };
      test('Output connected, adding previous', function () {
        const outBlock = workspace.newBlock('logic_negate');
        outBlock.initModel();
        const inBlock = workspace.newBlock('logic_negate');
        inBlock.initModel();

        const inCon = inBlock.getInput('BOOL')?.connection;
        assert.exists(inCon);
        const outCon = outBlock.outputConnection;

        connectReciprocally(inCon, outCon);

        const prevCon = new Blockly.Connection(
          outBlock,
          Blockly.ConnectionType.PREVIOUS_STATEMENT,
        );
        const nextBlock = workspace.newBlock('text_print');
        nextBlock.initModel();
        const nextCon = nextBlock.nextConnection;

        assertReasonHelper(
          checker,
          prevCon,
          nextCon,
          Blockly.Connection.REASON_PREVIOUS_AND_OUTPUT,
        );
      });
      test('Previous connected, adding output', function () {
        const prevBlock = workspace.newBlock('text_print');
        prevBlock.initModel();
        const nextBlock = workspace.newBlock('text_print');
        nextBlock.initModel();

        const prevCon = prevBlock.previousConnection;
        const nextCon = nextBlock.nextConnection;
        connectReciprocally(prevCon, nextCon);

        const outCon = new Blockly.Connection(
          prevBlock,
          Blockly.ConnectionType.OUTPUT_VALUE,
        );
        const inBlock = workspace.newBlock('text_length');
        inBlock.initModel();
        const inCon = inBlock.getInput('VALUE')?.connection;
        assert.exists(inCon);

        assertReasonHelper(
          checker,
          outCon,
          inCon,
          Blockly.Connection.REASON_PREVIOUS_AND_OUTPUT,
        );
      });
    });
  });
  suite('Check Types', function () {
    let con1: Blockly.Connection;
    let con2: Blockly.Connection;

    setup(function () {
      const prevBlock = workspace.newBlock('text_print');
      prevBlock.initModel();

      const nextBlock = workspace.newBlock('text_print');
      nextBlock.initModel();

      con1 = new Blockly.Connection(
        prevBlock,
        Blockly.ConnectionType.PREVIOUS_STATEMENT,
      );
      con2 = new Blockly.Connection(
        nextBlock,
        Blockly.ConnectionType.NEXT_STATEMENT,
      );
    });
    function assertCheckTypes(
      checker: Blockly.IConnectionChecker,
      one: Blockly.Connection,
      two: Blockly.Connection,
    ) {
      assert.isTrue(checker.doTypeChecks(one, two));
      // Order should not matter.
      assert.isTrue(checker.doTypeChecks(one, two));
    }
    test('No Types', function () {
      assertCheckTypes(checker, con1, con2);
    });
    test('Same Type', function () {
      con1.setCheck('type1');
      con2.setCheck('type1');
      assertCheckTypes(checker, con1, con2);
    });
    test('Same Types', function () {
      con1.setCheck(['type1', 'type2']);
      con2.setCheck(['type1', 'type2']);
      assertCheckTypes(checker, con1, con2);
    });
    test('Single Same Type', function () {
      con1.setCheck(['type1', 'type2']);
      con2.setCheck(['type1', 'type3']);
      assertCheckTypes(checker, con1, con2);
    });
    test('One Typed, One Promiscuous', function () {
      con1.setCheck('type1');
      assertCheckTypes(checker, con1, con2);
    });
    test('No Compatible Types', function () {
      con1.setCheck('type1');
      con2.setCheck('type2');
      assert.isFalse(checker.doTypeChecks(con1, con2));
    });
  });
  suite('Dragging Checks', function () {
    let workspace: Blockly.WorkspaceSvg;
    let blockA: Blockly.BlockSvg;
    let blockB: Blockly.BlockSvg;
    let blockC: Blockly.BlockSvg;

    setup(function () {
      workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
    });

    teardown(function (this: Mocha.Context) {
      workspaceTeardown.call(this, workspace);
    });

    suite('Stacks', function () {
      setup(function () {
        // Load in three blocks: A and B are connected (next/prev); B is unmovable.
        Blockly.Xml.domToWorkspace(
          Blockly.utils.xml
            .textToDom(`<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="text_print" id="A" x="-76" y="-112">
          <next>
            <block type="text_print" id="B" movable="false">
            </block>
          </next>
        </block>
        <block type="text_print" id="C" x="47" y="-118"/>
      </xml>`),
          workspace,
        );
        const blockA_ = workspace.getBlockById('A');
        assert.exists(blockA_);
        blockA = blockA_;
        const blockB_ = workspace.getBlockById('B');
        assert.exists(blockB_);
        blockB = blockB_;
        const blockC_ = workspace.getBlockById('C');
        assert.exists(blockC_);
        blockC = blockC_;
        checker = workspace.connectionChecker;
      });

      test('Connect a stack', function () {
        // block C is not connected to block A; both are movable.
        const nextConnection = blockC.nextConnection;
        assert.exists(nextConnection);
        const previousConnection = blockA.previousConnection;
        assert.exists(previousConnection);
        assert.isTrue(
          checker.doDragChecks(nextConnection, previousConnection, 9000),
          'Should connect two compatible stack blocks',
        );
      });

      test('Connect to unmovable shadow block', function () {
        // Remove original test blocks.
        workspace.clear();

        // Add the same test blocks, but this time block B is a shadow block.
        Blockly.Xml.domToWorkspace(
          Blockly.utils.xml
            .textToDom(`<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="text_print" id="A" x="-76" y="-112">
          <next>
            <shadow type="text_print" id="B" movable="false">
            </shadow>
          </next>
        </block>
        <block type="text_print" id="C" x="47" y="-118"/>
      </xml>`),
          workspace,
        );
        [blockA, blockB, blockC] = workspace.getAllBlocks(true);

        const nextConnection = blockA.nextConnection;
        assert.exists(nextConnection);
        const previousConnection = blockC.previousConnection;
        assert.exists(previousConnection);

        // Try to connect blockC into the input connection of blockA, replacing blockB.
        // This is allowed because shadow blocks can always be replaced, even though
        // they are unmovable.
        assert.isTrue(
          checker.doDragChecks(previousConnection, nextConnection, 9000),
          'Should connect in place of a shadow block',
        );
      });

      test('Do not splice into unmovable stack', function () {
        const nextConnection = blockA.nextConnection;
        assert.exists(nextConnection);
        const previousConnection = blockC.previousConnection;
        assert.exists(previousConnection);

        // Try to connect blockC above blockB. It shouldn't work because B is not movable
        // and is already connected to A's nextConnection.
        assert.isFalse(
          checker.doDragChecks(previousConnection, nextConnection, 9000),
          'Should not splice in a block above an unmovable block',
        );
      });

      test('Connect to bottom of unmovable stack', function () {
        const nextConnection = blockB.nextConnection;
        assert.exists(nextConnection);
        const previousConnection = blockC.previousConnection;
        assert.exists(previousConnection);

        // Try to connect blockC below blockB.
        // This is allowed even though B is not movable because it is on B's nextConnection.
        assert.isTrue(
          checker.doDragChecks(previousConnection, nextConnection, 9000),
          'Should connect below an unmovable stack block',
        );
      });

      test('Connect to unconnected unmovable block', function () {
        blockB.previousConnection?.disconnect();
        blockA.dispose();

        const nextConnection = blockC.nextConnection;
        assert.exists(nextConnection);
        const previousConnection = blockB.previousConnection;
        assert.exists(previousConnection);

        // Try to connect blockC above blockB.
        // This is allowed because we're not splicing into a stack.
        assert.isTrue(
          checker.doDragChecks(nextConnection, previousConnection, 9000),
          'Should connect above an unconnected unmovable block',
        );
      });
    });
    suite('Rows', function () {
      setup(function () {
        // Load 3 blocks: A and B are connected (input/output); B is unmovable.
        Blockly.Xml.domToWorkspace(
          Blockly.utils.xml
            .textToDom(`<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="test_basic_row" id="A" x="38" y="37">
          <value name="INPUT">
            <block type="test_basic_row" id="B" movable="false"></block>
          </value>
        </block>
        <block type="test_basic_row" id="C" x="38" y="87"></block>
      </xml>`),
          workspace,
        );
        [blockA, blockB, blockC] = workspace.getAllBlocks(true);
        checker = workspace.connectionChecker;
      });

      test('Do not splice into unmovable block row', function () {
        // Try to connect C's output to A's input. Should fail because
        // A is already connected to B, which is unmovable.
        const inputConnection = blockA.inputList[0].connection;
        assert.instanceOf(inputConnection, Blockly.RenderedConnection);
        const outputConnection = blockC.outputConnection;
        assert.exists(outputConnection);
        assert.isFalse(
          checker.doDragChecks(outputConnection, inputConnection, 9000),
          'Should not splice in a block before an unmovable block',
        );
      });

      test('Connect to end of unmovable block', function () {
        // Make blockC unmovable
        blockC.setMovable(false);
        // Try to connect A's output to C's input. This is allowed.
        const inputConnection = blockC.inputList[0].connection;
        assert.instanceOf(inputConnection, Blockly.RenderedConnection);
        const outputConnection = blockA.outputConnection;
        assert.exists(outputConnection);
        assert.isTrue(
          checker.doDragChecks(outputConnection, inputConnection, 9000),
          'Should connect to end of unmovable block',
        );
      });

      test('Connect to unconnected unmovable block', function () {
        blockB.outputConnection?.disconnect();
        blockA.dispose();

        // Try to connect C's input to B's output. Allowed because B is now unconnected.
        const inputConnection = blockC.inputList[0].connection;
        assert.instanceOf(inputConnection, Blockly.RenderedConnection);
        const outputConnection = blockB.outputConnection;
        assert.exists(outputConnection);
        assert.isTrue(
          checker.doDragChecks(inputConnection, outputConnection, 9000),
          'Should connect to unconnected unmovable block',
        );
      });
    });
  });
});
