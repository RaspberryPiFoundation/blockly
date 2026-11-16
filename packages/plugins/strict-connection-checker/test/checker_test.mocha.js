/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Unit tests for a strict connection checker that extends
 * Blockly.ConnectionChecker. Based on blockly's connection_checker_tests.js.
 * @author fenichel@google.com (Rachel Fenichel)
 */

const chai = require('chai');
const Blockly = require('blockly');

const StrictConnectionChecker =
  require('../src/index.js').StrictConnectionChecker;

suite('StrictConnectionChecker', function () {
  suiteSetup(function () {
    this.checker = new StrictConnectionChecker();
  });
  /**
   * Make a block stub that implements only `isShadow` and returns the given
   * value.
   * @param {boolean} isShadow Whether `isShadow` should return true or false.
   * @returns {!Object} A block stub.
   * @package
   */
  function makeBlock(isShadow) {
    return {
      isShadow: function () {
        return isShadow;
      },
      id: '123',
    };
  }
  suite('Safety checks', function () {
    /**
     * Assert that the given connections pass or fail safety checks for the
     * given reason, and in both orders.
     * @param {!Blockly.IConnectionChecker} checker The connection checker
     *     object under test.
     * @param {!Blockly.Connection} one The first connection.
     * @param {!Blockly.Connection} two The second connection.
     * @param {number} reason The expected return value of
     *     `canConnectWithReason`.
     */
    function assertReasonHelper(checker, one, two, reason) {
      chai.assert.equal(checker.canConnectWithReason(one, two), reason);
      // Order should not matter.
      chai.assert.equal(checker.canConnectWithReason(two, one), reason);
    }

    test('Target Null', function () {
      const connection = new Blockly.Connection(
        {id: '123'},
        Blockly.INPUT_VALUE,
      );
      assertReasonHelper(
        this.checker,
        connection,
        null,
        Blockly.Connection.REASON_TARGET_NULL,
      );
    });
    test('Target Self', function () {
      const block = {workspace: 1, id: '123'};
      const connection1 = new Blockly.Connection(block, Blockly.INPUT_VALUE);
      const connection2 = new Blockly.Connection(block, Blockly.OUTPUT_VALUE);

      assertReasonHelper(
        this.checker,
        connection1,
        connection2,
        Blockly.Connection.REASON_SELF_CONNECTION,
      );
    });
    test('Different Workspaces', function () {
      const connection1 = new Blockly.Connection(
        {workspace: 1, id: '123'},
        Blockly.INPUT_VALUE,
      );
      const connection2 = new Blockly.Connection(
        {workspace: 2, id: '123'},
        Blockly.OUTPUT_VALUE,
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
        const prevBlock = makeBlock(false);
        const nextBlock = makeBlock(false);
        const outBlock = makeBlock(false);
        const inBlock = makeBlock(false);
        this.previous = new Blockly.Connection(
          prevBlock,
          Blockly.PREVIOUS_STATEMENT,
        );
        this.next = new Blockly.Connection(nextBlock, Blockly.NEXT_STATEMENT);
        this.output = new Blockly.Connection(outBlock, Blockly.OUTPUT_VALUE);
        this.input = new Blockly.Connection(inBlock, Blockly.INPUT_VALUE);
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
        const prevBlock = makeBlock(true);
        const nextBlock = makeBlock(false);
        const prev = new Blockly.Connection(
          prevBlock,
          Blockly.PREVIOUS_STATEMENT,
        );
        const next = new Blockly.Connection(nextBlock, Blockly.NEXT_STATEMENT);

        assertReasonHelper(
          this.checker,
          prev,
          next,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Next Shadow', function () {
        const prevBlock = makeBlock(false);
        const nextBlock = makeBlock(true);
        const prev = new Blockly.Connection(
          prevBlock,
          Blockly.PREVIOUS_STATEMENT,
        );
        const next = new Blockly.Connection(nextBlock, Blockly.NEXT_STATEMENT);

        assertReasonHelper(
          this.checker,
          prev,
          next,
          Blockly.Connection.REASON_SHADOW_PARENT,
        );
      });
      test('Prev and Next Shadow', function () {
        const prevBlock = makeBlock(true);
        const nextBlock = makeBlock(true);
        const prev = new Blockly.Connection(
          prevBlock,
          Blockly.PREVIOUS_STATEMENT,
        );
        const next = new Blockly.Connection(nextBlock, Blockly.NEXT_STATEMENT);

        assertReasonHelper(
          this.checker,
          prev,
          next,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Output Shadow', function () {
        const outBlock = makeBlock(true);
        const inBlock = makeBlock(false);
        const outCon = new Blockly.Connection(outBlock, Blockly.OUTPUT_VALUE);
        const inCon = new Blockly.Connection(inBlock, Blockly.INPUT_VALUE);

        assertReasonHelper(
          this.checker,
          outCon,
          inCon,
          Blockly.Connection.CAN_CONNECT,
        );
      });
      test('Input Shadow', function () {
        const outBlock = makeBlock(false);
        const inBlock = makeBlock(true);
        const outCon = new Blockly.Connection(outBlock, Blockly.OUTPUT_VALUE);
        const inCon = new Blockly.Connection(inBlock, Blockly.INPUT_VALUE);

        assertReasonHelper(
          this.checker,
          outCon,
          inCon,
          Blockly.Connection.REASON_SHADOW_PARENT,
        );
      });
      test('Output and Input Shadow', function () {
        const outBlock = makeBlock(true);
        const inBlock = makeBlock(true);
        const outCon = new Blockly.Connection(outBlock, Blockly.OUTPUT_VALUE);
        const inCon = new Blockly.Connection(inBlock, Blockly.INPUT_VALUE);

        assertReasonHelper(
          this.checker,
          outCon,
          inCon,
          Blockly.Connection.CAN_CONNECT,
        );
      });
    });
  });
  suite('Check Types', function () {
    setup(function () {
      this.con1 = new Blockly.Connection(
        {id: '123'},
        Blockly.PREVIOUS_STATEMENT,
      );
      this.con2 = new Blockly.Connection({id: '123'}, Blockly.NEXT_STATEMENT);
    });
    /**
     * Assert that the type checks pass for the given connections in either
     * order.
     * @param {!Blockly.IConnectionChecker} checker The connection checker
     *     object.
     * @param {!Blockly.Connection} one The first connection.
     * @param {!Blockly.Connection} two The second connection.
     */
    function assertCheckTypes(checker, one, two) {
      chai.assert.isTrue(checker.doTypeChecks(one, two));
      // Order should not matter.
      chai.assert.isTrue(checker.doTypeChecks(one, two));
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
    test('One Typed, One Null', function () {
      this.con1.setCheck('type1');
      // This is the only difference between this and the base checker.
      chai.assert.isFalse(this.checker.doTypeChecks(this.con1, this.con2));
    });
    test('No Compatible Types', function () {
      this.con1.setCheck('type1');
      this.con2.setCheck('type2');
      chai.assert.isFalse(this.checker.doTypeChecks(this.con1, this.con2));
    });
  });
});
