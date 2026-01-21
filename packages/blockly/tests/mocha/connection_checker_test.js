/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ConnectionType} from '../../build/src/core/connection_type.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Connection checker', function () {
  setup(function () {
    sharedTestSetup.call(this);
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });
  suiteSetup(function () {
    this.checker = new Blockly.ConnectionChecker();
  });
  suite('Safety checks', function () {
    function assertReasonHelper(checker, one, two, reason) {
      assert.equal(checker.canConnectWithReason(one, two), reason);
      // Order should not matter.
      assert.equal(checker.canConnectWithReason(two, one), reason);
    }

    test('Target Null', function () {
      const connection = new Blockly.Connection(
        {id: 'test'},
        ConnectionType.INPUT_VALUE,
      );
      assertReasonHelper(
        this.checker,
        connection,
        null,
        Blockly.Connection.REASON_TARGET_NULL,
      );
    });
    test('Target Self', function () {
      const block = {id: 'test', workspace: 1};
      const connection1 = new Blockly.Connection(
        block,
        ConnectionType.INPUT_VALUE,
      );
      const connection2 = new Blockly.Connection(
        block,
        ConnectionType.OUTPUT_VALUE,
      );

      assertReasonHelper(
        this.checker,
        connection1,
        connection2,
        Blockly.Connection.REASON_SELF_CONNECTION,
      );
    });
    test('Different Workspaces', function () {
      const connection1 = new Blockly.Connection(
        {id: 'test1', workspace: 1},
        ConnectionType.INPUT_VALUE,
      );
      const connection2 = new Blockly.Connection(
        {id: 'test2', workspace: 2},
        ConnectionType.OUTPUT_VALUE,
      );

      assertReasonHelper(
        this.checker,
        connection1,
        connection2,
        Blockly.Connection.REASON_DIFFERENT_WORKSPACES,
      );
    });
    suite('Types', function () {
      setup(function () {
        // We have to declare each separately so that the connections belong
        // on different blocks.
        const prevBlock = {id: 'test1', isShadow: function () {}};
        const nextBlock = {id: 'test2', isShadow: function () {}};
        const outBlock = {id: 'test3', isShadow: function () {}};
        const inBlock = {id: 'test4', isShadow: function () {}};
        this.previous = new Blockly.Connection(
          prevBlock,
          ConnectionType.PREVIOUS_STATEMENT,
        );
        this.next = new Blockly.Connection(
          nextBlock,
          ConnectionType.NEXT_STATEMENT,
        );
        this.output = new Blockly.Connection(
          outBlock,
          ConnectionType.OUTPUT_VALUE,
        );
        this.input = new Blockly.Connection(
          inBlock,
          ConnectionType.INPUT_VALUE,
        );
      });
      test('Previous, Next', function () {
        assertReasonHelper(
          this.checker,
          this.previous,
          this.next,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Previous, Output', function () {
        assertReasonHelper(
          this.checker,
          this.previous,
          this.output,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Previous, Input', function () {
        assertReasonHelper(
          this.checker,
          this.previous,
          this.input,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Next, Previous', function () {
        assertReasonHelper(
          this.checker,
          this.next,
          this.previous,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Next, Output', function () {
        assertReasonHelper(
          this.checker,
          this.next,
          this.output,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Next, Input', function () {
        assertReasonHelper(
          this.checker,
          this.next,
          this.input,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Output, Previous', function () {
        assertReasonHelper(
          this.checker,
          this.previous,
          this.output,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Output, Next', function () {
        assertReasonHelper(
          this.checker,
          this.output,
          this.next,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Output, Input', function () {
        assertReasonHelper(
          this.checker,
          this.output,
          this.input,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Input, Previous', function () {
        assertReasonHelper(
          this.checker,
          this.previous,
          this.input,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Input, Next', function () {
        assertReasonHelper(
          this.checker,
          this.input,
          this.next,
          Blockly.Connection.REASON_WRONG_TYPE,
        );
      });
      test('Input, Output', function () {
        assertReasonHelper(
          this.checker,
          this.input,
          this.output,
          Blockly.Connection.CAN_CONNECT,
        );
      });
    });
    suite('Shadows', function () {
      test('Previous Shadow', function () {
        const prevBlock = {
          id: 'test1',
          isShadow: function () {
            return true;
          },
        };
        const nextBlock = {
          id: 'test2',
          isShadow: function () {
            return false;
          },
        };
        const prev = new Blockly.Connection(
          prevBlock,
          ConnectionType.PREVIOUS_STATEMENT,
        );
        const next = new Blockly.Connection(
          nextBlock,
          ConnectionType.NEXT_STATEMENT,
        );

        assertReasonHelper(
          this.checker,
          prev,
          next,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Next Shadow', function () {
        const prevBlock = {
          id: 'test1',
          isShadow: function () {
            return false;
          },
        };
        const nextBlock = {
          id: 'test2',
          isShadow: function () {
            return true;
          },
        };
        const prev = new Blockly.Connection(
          prevBlock,
          ConnectionType.PREVIOUS_STATEMENT,
        );
        const next = new Blockly.Connection(
          nextBlock,
          ConnectionType.NEXT_STATEMENT,
        );

        assertReasonHelper(
          this.checker,
          prev,
          next,
          Blockly.Connection.REASON_SHADOW_PARENT,
        );
      });
      test('Prev and Next Shadow', function () {
        const prevBlock = {
          id: 'test1',
          isShadow: function () {
            return true;
          },
        };
        const nextBlock = {
          id: 'test2',
          isShadow: function () {
            return true;
          },
        };
        const prev = new Blockly.Connection(
          prevBlock,
          ConnectionType.PREVIOUS_STATEMENT,
        );
        const next = new Blockly.Connection(
          nextBlock,
          ConnectionType.NEXT_STATEMENT,
        );

        assertReasonHelper(
          this.checker,
          prev,
          next,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Output Shadow', function () {
        const outBlock = {
          id: 'test1',
          isShadow: function () {
            return true;
          },
        };
        const inBlock = {
          id: 'test2',
          isShadow: function () {
            return false;
          },
        };
        const outCon = new Blockly.Connection(
          outBlock,
          ConnectionType.OUTPUT_VALUE,
        );
        const inCon = new Blockly.Connection(
          inBlock,
          ConnectionType.INPUT_VALUE,
        );

        assertReasonHelper(
          this.checker,
          outCon,
          inCon,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Input Shadow', function () {
        const outBlock = {
          id: 'test1',
          isShadow: function () {
            return false;
          },
        };
        const inBlock = {
          id: 'test2',
          isShadow: function () {
            return true;
          },
        };
        const outCon = new Blockly.Connection(
          outBlock,
          ConnectionType.OUTPUT_VALUE,
        );
        const inCon = new Blockly.Connection(
          inBlock,
          ConnectionType.INPUT_VALUE,
        );

        assertReasonHelper(
          this.checker,
          outCon,
          inCon,
          Blockly.Connection.REASON_SHADOW_PARENT,
        );
      });
      test('Output and Input Shadow', function () {
        const outBlock = {
          id: 'test1',
          isShadow: function () {
            return true;
          },
        };
        const inBlock = {
          id: 'test2',
          isShadow: function () {
            return true;
          },
        };
        const outCon = new Blockly.Connection(
          outBlock,
          ConnectionType.OUTPUT_VALUE,
        );
        const inCon = new Blockly.Connection(
          inBlock,
          ConnectionType.INPUT_VALUE,
        );

        assertReasonHelper(
          this.checker,
          outCon,
          inCon,
          Blockly.Connection.CAN_CONNECT,
        );
      });
    });
    suite('Output and Previous', function () {
      /**
       * Update two connections to target each other.
       * @param {Connection} first The first connection to update.
       * @param {Connection} second The second connection to update.
       */
      const connectReciprocally = function (first, second) {
        if (!first || !second) {
          throw Error('Cannot connect null connections.');
        }
        first.targetConnection = second;
        second.targetConnection = first;
      };
      test('Output connected, adding previous', function () {
        const outBlock = {
          id: 'test1',
          isShadow: function () {},
        };
        const inBlock = {
          id: 'test2',
          isShadow: function () {},
        };
        const outCon = new Blockly.Connection(
          outBlock,
          ConnectionType.OUTPUT_VALUE,
        );
        const inCon = new Blockly.Connection(
          inBlock,
          ConnectionType.INPUT_VALUE,
        );
        outBlock.outputConnection = outCon;
        inBlock.inputConnection = inCon;
        connectReciprocally(inCon, outCon);
        const prevCon = new Blockly.Connection(
          outBlock,
          ConnectionType.PREVIOUS_STATEMENT,
        );
        const nextBlock = {
          id: 'test3',
          isShadow: function () {},
        };
        const nextCon = new Blockly.Connection(
          nextBlock,
          ConnectionType.NEXT_STATEMENT,
        );

        assertReasonHelper(
          this.checker,
          prevCon,
          nextCon,
          Blockly.Connection.REASON_PREVIOUS_AND_OUTPUT,
        );
      });
      test('Previous connected, adding output', function () {
        const prevBlock = {
          id: 'test1',
          isShadow: function () {},
        };
        const nextBlock = {
          id: 'test2',
          isShadow: function () {},
        };
        const prevCon = new Blockly.Connection(
          prevBlock,
          ConnectionType.PREVIOUS_STATEMENT,
        );
        const nextCon = new Blockly.Connection(
          nextBlock,
          ConnectionType.NEXT_STATEMENT,
        );
        prevBlock.previousConnection = prevCon;
        nextBlock.nextConnection = nextCon;
        connectReciprocally(prevCon, nextCon);
        const outCon = new Blockly.Connection(
          prevBlock,
          ConnectionType.OUTPUT_VALUE,
        );
        const inBlock = {
          id: 'test3',
          isShadow: function () {},
        };
        const inCon = new Blockly.Connection(
          inBlock,
          ConnectionType.INPUT_VALUE,
        );

        assertReasonHelper(
          this.checker,
          outCon,
          inCon,
          Blockly.Connection.REASON_PREVIOUS_AND_OUTPUT,
        );
      });
    });
  });
  suite('Check Types', function () {
    setup(function () {
      this.con1 = new Blockly.Connection(
        {id: 'test1'},
        ConnectionType.PREVIOUS_STATEMENT,
      );
      this.con2 = new Blockly.Connection(
        {id: 'test2'},
        ConnectionType.NEXT_STATEMENT,
      );
    });
    function assertCheckTypes(checker, one, two) {
      assert.isTrue(checker.doTypeChecks(one, two));
      // Order should not matter.
      assert.isTrue(checker.doTypeChecks(one, two));
    }
    test('No Types', function () {
      assertCheckTypes(this.checker, this.con1, this.con2);
    });
    test('Same Type', function () {
      this.con1.setCheck('type1');
      this.con2.setCheck('type1');
      assertCheckTypes(this.checker, this.con1, this.con2);
    });
    test('Same Types', function () {
      this.con1.setCheck(['type1', 'type2']);
      this.con2.setCheck(['type1', 'type2']);
      assertCheckTypes(this.checker, this.con1, this.con2);
    });
    test('Single Same Type', function () {
      this.con1.setCheck(['type1', 'type2']);
      this.con2.setCheck(['type1', 'type3']);
      assertCheckTypes(this.checker, this.con1, this.con2);
    });
    test('One Typed, One Promiscuous', function () {
      this.con1.setCheck('type1');
      assertCheckTypes(this.checker, this.con1, this.con2);
    });
    test('No Compatible Types', function () {
      this.con1.setCheck('type1');
      this.con2.setCheck('type2');
      assert.isFalse(this.checker.doTypeChecks(this.con1, this.con2));
    });
  });
  suite('Dragging Checks', function () {
    suite('Stacks', function () {
      setup(function () {
        this.workspace = Blockly.inject('blocklyDiv');
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
          this.workspace,
        );
        this.blockA = this.workspace.getBlockById('A');
        this.blockB = this.workspace.getBlockById('B');
        this.blockC = this.workspace.getBlockById('C');
        this.checker = this.workspace.connectionChecker;
      });

      test('Connect a stack', function () {
        // block C is not connected to block A; both are movable.
        assert.isTrue(
          this.checker.doDragChecks(
            this.blockC.nextConnection,
            this.blockA.previousConnection,
            9000,
          ),
          'Should connect two compatible stack blocks',
        );
      });

      test('Connect to unmovable shadow block', function () {
        // Remove original test blocks.
        this.workspace.clear();

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
          this.workspace,
        );
        [this.blockA, this.blockB, this.blockC] =
          this.workspace.getAllBlocks(true);

        // Try to connect blockC into the input connection of blockA, replacing blockB.
        // This is allowed because shadow blocks can always be replaced, even though
        // they are unmovable.
        assert.isTrue(
          this.checker.doDragChecks(
            this.blockC.previousConnection,
            this.blockA.nextConnection,
            9000,
          ),
          'Should connect in place of a shadow block',
        );
      });

      test('Do not splice into unmovable stack', function () {
        // Try to connect blockC above blockB. It shouldn't work because B is not movable
        // and is already connected to A's nextConnection.
        assert.isFalse(
          this.checker.doDragChecks(
            this.blockC.previousConnection,
            this.blockA.nextConnection,
            9000,
          ),
          'Should not splice in a block above an unmovable block',
        );
      });

      test('Connect to bottom of unmovable stack', function () {
        // Try to connect blockC below blockB.
        // This is allowed even though B is not movable because it is on B's nextConnection.
        assert.isTrue(
          this.checker.doDragChecks(
            this.blockC.previousConnection,
            this.blockB.nextConnection,
            9000,
          ),
          'Should connect below an unmovable stack block',
        );
      });

      test('Connect to unconnected unmovable block', function () {
        this.blockB.previousConnection.disconnect();
        this.blockA.dispose();

        // Try to connect blockC above blockB.
        // This is allowed because we're not splicing into a stack.
        assert.isTrue(
          this.checker.doDragChecks(
            this.blockC.nextConnection,
            this.blockB.previousConnection,
            9000,
          ),
          'Should connect above an unconnected unmovable block',
        );
      });
    });
    suite('Rows', function () {
      setup(function () {
        this.workspace = Blockly.inject('blocklyDiv');
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
          this.workspace,
        );
        [this.blockA, this.blockB, this.blockC] =
          this.workspace.getAllBlocks(true);
        this.checker = this.workspace.connectionChecker;
      });

      test('Do not splice into unmovable block row', function () {
        // Try to connect C's output to A's input. Should fail because
        // A is already connected to B, which is unmovable.
        const inputConnection = this.blockA.inputList[0].connection;
        assert.isFalse(
          this.checker.doDragChecks(
            this.blockC.outputConnection,
            inputConnection,
            9000,
          ),
          'Should not splice in a block before an unmovable block',
        );
      });

      test('Connect to end of unmovable block', function () {
        // Make blockC unmovable
        this.blockC.setMovable(false);
        // Try to connect A's output to C's input. This is allowed.
        const inputConnection = this.blockC.inputList[0].connection;
        assert.isTrue(
          this.checker.doDragChecks(
            this.blockA.outputConnection,
            inputConnection,
            9000,
          ),
          'Should connect to end of unmovable block',
        );
      });

      test('Connect to unconnected unmovable block', function () {
        this.blockB.outputConnection.disconnect();
        this.blockA.dispose();

        // Try to connect C's input to B's output. Allowed because B is now unconnected.
        const inputConnection = this.blockC.inputList[0].connection;
        assert.isTrue(
          this.checker.doDragChecks(
            inputConnection,
            this.blockB.outputConnection,
            9000,
          ),
          'Should connect to unconnected unmovable block',
        );
      });
    });
  });
});
