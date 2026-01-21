/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Align} from '../../build/src/core/inputs/align.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Block JSON initialization', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('validateTokens', function () {
    setup(function () {
      this.assertError = function (tokens, count, error) {
        const block = {
          type: 'test',
          validateTokens: Blockly.Block.prototype.validateTokens,
        };
        assert.throws(function () {
          block.validateTokens(tokens, count);
        }, error);
      };

      this.assertNoError = function (tokens, count) {
        const block = {
          type: 'test',
          validateTokens: Blockly.Block.prototype.validateTokens,
        };
        assert.doesNotThrow(function () {
          block.validateTokens(tokens, count);
        });
      };
    });

    test('0 args, 0 tokens', function () {
      this.assertNoError(['test', 'test'], 0);
    });

    test('0 args, 1 token', function () {
      this.assertError(
        ['test', 1, 'test'],
        0,
        'Block "test": Message index %1 out of range.',
      );
    });

    test('1 arg, 0 tokens', function () {
      this.assertError(
        ['test', 'test'],
        1,
        'Block "test": Message does not reference all 1 arg(s).',
      );
    });

    test('1 arg, 1 token', function () {
      this.assertNoError(['test', 1, 'test'], 1);
    });

    test('1 arg, 2 tokens', function () {
      this.assertError(
        ['test', 1, 1, 'test'],
        1,
        'Block "test": Message index %1 duplicated.',
      );
    });

    test('Token out of lower bound', function () {
      this.assertError(
        ['test', 0, 'test'],
        1,
        'Block "test": Message index %0 out of range.',
      );
    });

    test('Token out of upper bound', function () {
      this.assertError(
        ['test', 2, 'test'],
        1,
        'Block "test": Message index %2 out of range.',
      );
    });

    test('Newline tokens are valid', function () {
      this.assertNoError(['test', '\n', 'test'], 0);
    });
  });

  suite('interpolateArguments', function () {
    setup(function () {
      this.assertInterpolation = function (tokens, args, lastAlign, elements) {
        const block = {
          type: 'test',
          interpolateArguments: Blockly.Block.prototype.interpolateArguments,
          stringToFieldJson: Blockly.Block.prototype.stringToFieldJson,
          isInputKeyword: Blockly.Block.prototype.isInputKeyword,
        };
        assert.deepEqual(
          block.interpolateArguments(tokens, args, lastAlign),
          elements,
        );
      };
    });

    test('Strings to labels', function () {
      this.assertInterpolation(
        ['test1', 'test2', 'test3', {'type': 'input_dummy'}],
        [],
        undefined,
        [
          {
            'type': 'field_label',
            'text': 'test1',
          },
          {
            'type': 'field_label',
            'text': 'test2',
          },
          {
            'type': 'field_label',
            'text': 'test3',
          },
          {
            'type': 'input_dummy',
          },
        ],
      );
    });

    test('Ignore empty strings', function () {
      this.assertInterpolation(
        ['test1', '', '    ', {'type': 'input_dummy'}],
        [],
        undefined,
        [
          {
            'type': 'field_label',
            'text': 'test1',
          },
          {
            'type': 'input_dummy',
          },
        ],
      );
    });

    test('Insert args', function () {
      this.assertInterpolation(
        [1, 2, 3, {'type': 'input_dummy'}],
        [
          {
            'type': 'field_number',
            'name': 'test1',
          },
          {
            'type': 'field_number',
            'name': 'test2',
          },
          {
            'type': 'field_number',
            'name': 'test3',
          },
        ],
        undefined,
        [
          {
            'type': 'field_number',
            'name': 'test1',
          },
          {
            'type': 'field_number',
            'name': 'test2',
          },
          {
            'type': 'field_number',
            'name': 'test3',
          },
          {
            'type': 'input_dummy',
          },
        ],
      );
    });

    test('String args to labels', function () {
      this.assertInterpolation(
        [1, 2, 3, {'type': 'input_dummy'}],
        ['test1', 'test2', 'test3'],
        undefined,
        [
          {
            'type': 'field_label',
            'text': 'test1',
          },
          {
            'type': 'field_label',
            'text': 'test2',
          },
          {
            'type': 'field_label',
            'text': 'test3',
          },
          {
            'type': 'input_dummy',
          },
        ],
      );
    });

    test('Ignore empty string args', function () {
      this.assertInterpolation(
        [1, 2, 3, {'type': 'input_dummy'}],
        ['test1', '     ', '     '],
        undefined,
        [
          {
            'type': 'field_label',
            'text': 'test1',
          },
          {
            'type': 'input_dummy',
          },
        ],
      );
    });

    test('Add last dummy', function () {
      this.assertInterpolation(['test1', 'test2', 'test3'], [], undefined, [
        {
          'type': 'field_label',
          'text': 'test1',
        },
        {
          'type': 'field_label',
          'text': 'test2',
        },
        {
          'type': 'field_label',
          'text': 'test3',
        },
        {
          'type': 'input_dummy',
        },
      ]);
    });

    test('Add last dummy for no_field_prefix_field', function () {
      this.assertInterpolation(
        [
          {
            'type': 'no_field_prefix_field',
          },
        ],
        [],
        undefined,
        [
          {
            'type': 'no_field_prefix_field',
          },
          {
            'type': 'input_dummy',
          },
        ],
      );
    });

    test('Add last dummy for input_prefix_field', function () {
      this.assertInterpolation(
        [
          {
            'type': 'input_prefix_field',
          },
        ],
        [],
        undefined,
        [
          {
            'type': 'input_prefix_field',
          },
          {
            'type': 'input_dummy',
          },
        ],
      );
    });

    test('Set last dummy alignment', function () {
      this.assertInterpolation(['test1', 'test2', 'test3'], [], 'CENTER', [
        {
          'type': 'field_label',
          'text': 'test1',
        },
        {
          'type': 'field_label',
          'text': 'test2',
        },
        {
          'type': 'field_label',
          'text': 'test3',
        },
        {
          'type': 'input_dummy',
          'align': 'CENTER',
        },
      ]);
    });

    test('interpolation output includes end-row inputs', function () {
      this.assertInterpolation(
        ['test1', {'type': 'input_end_row'}, 'test2'],
        [],
        undefined,
        [
          {
            'type': 'field_label',
            'text': 'test1',
          },
          {
            'type': 'input_end_row',
          },
          {
            'type': 'field_label',
            'text': 'test2',
          },
          {
            'type': 'input_dummy',
          },
        ],
      );
    });

    test('Newline is converted to end-row input', function () {
      this.assertInterpolation(['test1', '\n', 'test2'], [], undefined, [
        {
          'type': 'field_label',
          'text': 'test1',
        },
        {
          'type': 'input_end_row',
        },
        {
          'type': 'field_label',
          'text': 'test2',
        },
        {
          'type': 'input_dummy',
        },
      ]);
    });

    test('Newline converted to end-row aligned like last dummy', function () {
      this.assertInterpolation(['test1', '\n', 'test2'], [], 'CENTER', [
        {
          'type': 'field_label',
          'text': 'test1',
        },
        {
          'type': 'input_end_row',
          'align': 'CENTER',
        },
        {
          'type': 'field_label',
          'text': 'test2',
        },
        {
          'type': 'input_dummy',
          'align': 'CENTER',
        },
      ]);
    });
  });

  suite('fieldFromJson', function () {
    setup(function () {
      this.stub = sinon
        .stub(Blockly.fieldRegistry.TEST_ONLY, 'fromJsonInternal')
        .callsFake(function (elem) {
          switch (elem['type']) {
            case 'field_label':
              return 'field_label';
            case 'field_number':
              return 'field_number';
            case 'no_field_prefix_field':
              return 'no_field_prefix_field';
            case 'input_prefix_field':
              return 'input_prefix_field';
            default:
              return null;
          }
        });

      this.assertField = function (json, expectedType) {
        const block = {
          type: 'test',
          fieldFromJson: Blockly.Block.prototype.fieldFromJson,
          stringToFieldJson: Blockly.Block.prototype.stringToFieldJson,
        };
        assert.strictEqual(block.fieldFromJson(json), expectedType);
      };
    });

    teardown(function () {
      this.stub.restore();
    });

    test('Simple field', function () {
      this.assertField(
        {
          'type': 'field_label',
          'text': 'text',
        },
        'field_label',
      );
    });

    test('Bad field', function () {
      this.assertField(
        {
          'type': 'field_bad',
        },
        null,
      );
    });

    test('no_field_prefix_field', function () {
      this.assertField(
        {
          'type': 'no_field_prefix_field',
        },
        'no_field_prefix_field',
      );
    });

    test('input_prefix_field', function () {
      this.assertField(
        {
          'type': 'input_prefix_field',
        },
        'input_prefix_field',
      );
    });

    test('Alt string', function () {
      this.assertField(
        {
          'type': 'field_undefined',
          'alt': 'alt text',
        },
        'field_label',
      );
    });

    test('input_prefix_bad w/ alt string', function () {
      this.assertField(
        {
          'type': 'input_prefix_bad',
          'alt': 'alt string',
        },
        'field_label',
      );
    });

    test('Alt other field', function () {
      this.assertField(
        {
          'type': 'field_undefined',
          'alt': {
            'type': 'field_number',
            'name': 'FIELDNAME',
          },
        },
        'field_number',
      );
    });

    test('Deep alt string', function () {
      this.assertField(
        {
          'type': 'field_undefined1',
          'alt': {
            'type': 'field_undefined2',
            'alt': {
              'type': 'field_undefined3',
              'alt': {
                'type': 'field_undefined4',
                'alt': {
                  'type': 'field_undefined5',
                  'alt': 'text',
                },
              },
            },
          },
        },
        'field_label',
      );
    });

    test('Deep alt other field', function () {
      this.assertField(
        {
          'type': 'field_undefined1',
          'alt': {
            'type': 'field_undefined2',
            'alt': {
              'type': 'field_undefined3',
              'alt': {
                'type': 'field_undefined4',
                'alt': {
                  'type': 'field_undefined5',
                  'alt': {
                    'type': 'field_number',
                    'name': 'FIELDNAME',
                  },
                },
              },
            },
          },
        },
        'field_number',
      );
    });

    test('No alt', function () {
      this.assertField(
        {
          'type': 'field_undefined',
        },
        null,
      );
    });

    test('Bad alt', function () {
      this.assertField(
        {
          'type': 'field_undefined',
          'alt': {
            'type': 'field_undefined',
          },
        },
        null,
      );
    });

    test('Spaces string alt', function () {
      this.assertField(
        {
          'type': 'field_undefined',
          'alt': '        ',
        },
        null,
      );
    });
  });

  suite('inputFromJson', function () {
    setup(function () {
      this.assertInput = function (json, type, check, align) {
        const block = this.workspace.newBlock('test_basic_empty');
        sinon.spy(block, 'appendDummyInput');
        sinon.spy(block, 'appendValueInput');
        sinon.spy(block, 'appendStatementInput');

        const input = block.inputFromJson(json);
        switch (type) {
          case 'input_dummy':
            assert.isTrue(
              block.appendDummyInput.calledOnce,
              'Expected a dummy input to be created.',
            );
            break;
          case 'input_value':
            assert.isTrue(
              block.appendValueInput.calledOnce,
              'Expected a value input to be created.',
            );
            break;
          case 'input_statement':
            assert.isTrue(
              block.appendStatementInput.calledOnce,
              'Expected a statement input to be created.',
            );
            break;
          default:
            assert.isNull(input, 'Expected input to be null');
            assert.isTrue(
              block.appendDummyInput.notCalled,
              'Expected no input to be created',
            );
            assert.isTrue(
              block.appendValueInput.notCalled,
              'Expected no input to be created',
            );
            assert.isTrue(
              block.appendStatementInput.notCalled,
              'Expected no input to be created',
            );
            return;
        }
        if (check) {
          if (Array.isArray(check)) {
            assert.deepEqual(check, input.connection.getCheck());
          } else {
            assert.deepEqual([check], input.connection.getCheck());
          }
        }
        if (align !== undefined) {
          assert.equal(align, input.align);
        }
      };
    });

    suite('input types', function () {
      test('Dummy', function () {
        this.assertInput(
          {
            'type': 'input_dummy',
          },
          'input_dummy',
        );
      });

      test('Value', function () {
        this.assertInput(
          {
            'type': 'input_value',
            'name': 'NAME',
          },
          'input_value',
        );
      });

      test('Statement', function () {
        this.assertInput(
          {
            'type': 'input_statement',
            'name': 'NAME',
          },
          'input_statement',
        );
      });

      test('Bad input type', function () {
        this.assertInput(
          {
            'type': 'input_bad',
          },
          'input_bad',
        );
      });

      test('custom input types are constructed from the registry', function () {
        class CustomInput extends Blockly.Input {}
        Blockly.registry.register(
          Blockly.registry.Type.INPUT,
          'custom',
          CustomInput,
        );
        const block = this.workspace.newBlock('test_basic_empty');
        block.inputFromJson({'type': 'custom'});
        assert.instanceOf(
          block.inputList[0],
          CustomInput,
          'Expected the registered input to be constructed',
        );
      });
    });

    suite('connection checks', function () {
      test('String Check', function () {
        this.assertInput(
          {
            'type': 'input_value',
            'name': 'NAME',
            'check': 'Integer',
          },
          'input_value',
          'Integer',
        );
      });

      test('Array check', function () {
        this.assertInput(
          {
            'type': 'input_value',
            'name': 'NAME',
            'check': ['Integer', 'Number'],
          },
          'input_value',
          ['Integer', 'Number'],
        );
      });

      test('Empty check', function () {
        this.assertInput(
          {
            'type': 'input_value',
            'name': 'NAME',
            'check': '',
          },
          'input_value',
        );
      });

      test('Null check', function () {
        this.assertInput(
          {
            'type': 'input_value',
            'name': 'NAME',
            'check': null,
          },
          'input_value',
        );
      });
    });

    suite('alignment', function () {
      test('"Left" align', function () {
        this.assertInput(
          {
            'type': 'input_dummy',
            'align': 'LEFT',
          },
          'input_dummy',
          undefined,
          Align.LEFT,
        );
      });

      test('"Right" align', function () {
        this.assertInput(
          {
            'type': 'input_dummy',
            'align': 'RIGHT',
          },
          'input_dummy',
          undefined,
          Align.RIGHT,
        );
      });

      test('"Center" align', function () {
        this.assertInput(
          {
            'type': 'input_dummy',
            'align': 'CENTER',
          },
          'input_dummy',
          undefined,
          Align.CENTRE,
        );
      });

      test('"Centre" align', function () {
        this.assertInput(
          {
            'type': 'input_dummy',
            'align': 'CENTRE',
          },
          'input_dummy',
          undefined,
          Align.CENTRE,
        );
      });
    });
  });
});
