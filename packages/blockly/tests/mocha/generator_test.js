/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {DartGenerator} from '../../build/src/generators/dart/dart_generator.js';
import {JavascriptGenerator} from '../../build/src/generators/javascript/javascript_generator.js';
import {LuaGenerator} from '../../build/src/generators/lua/lua_generator.js';
import {PhpGenerator} from '../../build/src/generators/php/php_generator.js';
import {PythonGenerator} from '../../build/src/generators/python/python_generator.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Generator', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('prefix', function () {
    setup(function () {
      this.generator = new Blockly.CodeGenerator('INTERCAL');
    });

    test('Nothing', function () {
      assert.equal(this.generator.prefixLines('', ''), '');
    });

    test('One word', function () {
      assert.equal(this.generator.prefixLines('Hello', '@'), '@Hello');
    });

    test('One line', function () {
      assert.equal(this.generator.prefixLines('Hello\n', '12'), '12Hello\n');
    });

    test('Two lines', function () {
      assert.equal(
        this.generator.prefixLines('Hello\nWorld\n', '***'),
        '***Hello\n***World\n',
      );
    });
  });

  suite('blockToCode', function () {
    setup(function () {
      Blockly.defineBlocksWithJsonArray([
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
          'nextStatement': null,
        },
      ]);
      const rowBlock = this.workspace.newBlock('row_block');
      const stackBlock = this.workspace.newBlock('stack_block');

      this.blockToCodeTest = function (
        generator,
        blockDisabled,
        opt_thisOnly,
        expectedCode,
        opt_message,
      ) {
        generator.forBlock['row_block'] = function (_) {
          return 'row_block';
        };
        generator.forBlock['stack_block'] = function (_) {
          return 'stack_block';
        };
        rowBlock.nextConnection.connect(stackBlock.previousConnection);
        rowBlock.setDisabledReason(blockDisabled, 'test reason');

        const code = generator.blockToCode(rowBlock, opt_thisOnly);
        delete generator.forBlock['stack_block'];
        delete generator.forBlock['row_block'];
        assert.equal(code, expectedCode, opt_message);
      };
    });

    const testCase = [
      [new DartGenerator(), 'Dart'],
      [new JavascriptGenerator(), 'JavaScript'],
      [new LuaGenerator(), 'Lua'],
      [new PhpGenerator(), 'PHP'],
      [new PythonGenerator(), 'Python'],
    ];

    suite('Trivial', function () {
      testCase.forEach(function (testCase) {
        const generator = testCase[0];
        const name = testCase[1];
        test(name, function () {
          generator.init(this.workspace);
          this.blockToCodeTest(
            generator,
            /* blockDisabled = */ false,
            /* opt_thisOnly = */ true,
            'row_block',
          );
          this.blockToCodeTest(
            generator,
            /* blockDisabled = */ false,
            /* opt_thisOnly = */ false,
            'row_blockstack_block',
            'thisOnly=false',
          );
        });
      });
    });

    suite('Disabled block', function () {
      testCase.forEach(function (testCase) {
        const generator = testCase[0];
        const name = testCase[1];
        test(name, function () {
          this.blockToCodeTest(
            generator,
            /* blockDisabled = */ true,
            /* opt_thisOnly = */ true,
            '',
          );
          this.blockToCodeTest(
            generator,
            /* blockDisabled = */ true,
            /* opt_thisOnly = */ false,
            'stack_block',
            'thisOnly=false',
          );
        });
      });
    });

    suite('Nested block', function () {
      setup(function () {
        Blockly.defineBlocksWithJsonArray([
          {
            'type': 'test_loop_block',
            'message0': 'Repeat Loop',
            'message1': '%1',
            'args1': [
              {
                'type': 'input_statement',
                'name': 'DO',
              },
            ],
            'previousStatement': null,
            'nextStatement': null,
          },
        ]);
        const blockA = this.workspace.newBlock('test_loop_block');
        const blockB = this.workspace.newBlock('test_loop_block');
        const blockC = this.workspace.newBlock('test_loop_block');
        this.loopTest = function (
          generator,
          opt_thisOnly,
          expectedCode,
          opt_message,
        ) {
          generator.forBlock['test_loop_block'] = function (block) {
            return '{' + generator.statementToCode(block, 'DO') + '}';
          };
          blockA.getInput('DO').connection.connect(blockB.previousConnection);
          blockA.nextConnection.connect(blockC.previousConnection);

          const code = generator.blockToCode(blockA, opt_thisOnly);
          assert.equal(code, expectedCode, opt_message);
        };
      });

      testCase.forEach(function (testCase) {
        const generator = testCase[0];
        const name = testCase[1];
        test(name, function () {
          this.loopTest(generator, true, '{  {}}');
          this.loopTest(generator, false, '{  {}}{}', 'thisOnly=false');
        });
      });
    });

    suite('Names', function () {
      setup(function () {
        class TestGenerator extends Blockly.CodeGenerator {
          init() {
            super.init();
            this.nameDB_ = sinon.createStubInstance(Blockly.Names, {
              getName: 'foo',
            });
          }
        }
        this.generator = new TestGenerator();
      });
      test('No nameDB_ initialized', function () {
        assert.throws(() => {
          this.generator.getVariableName('foo');
        });
      });

      test('Get variable name', function () {
        this.generator.init();

        assert.equal(this.generator.getVariableName('foo'), 'foo');
      });

      test('Get procedure name', function () {
        this.generator.init();

        assert.equal(this.generator.getProcedureName('foo'), 'foo');
      });
    });
  });
});
