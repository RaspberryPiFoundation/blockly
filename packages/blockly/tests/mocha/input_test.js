/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Inputs', function () {
  setup(function () {
    sharedTestSetup.call(this);
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'empty_block',
        'message0': '',
        'args0': [],
      },
    ]);

    this.workspace = Blockly.inject('blocklyDiv');
    this.block = Blockly.Xml.domToBlock(
      Blockly.utils.xml.textToDom('<block type="empty_block"/>'),
      this.workspace,
    );

    this.renderStub = sinon.stub(this.block, 'queueRender');

    this.dummy = this.block.appendDummyInput('DUMMY');
    this.value = this.block.appendValueInput('VALUE');
    this.statement = this.block.appendStatementInput('STATEMENT');

    this.renderStub.resetHistory();
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });
  suite('Insert Field At', function () {
    suite('Index Bounds', function () {
      test('< 0', function () {
        const field = new Blockly.FieldLabel('field');
        assert.throws(function () {
          this.dummy.insertFieldAt(-1, field);
        });
      });
      test('> length', function () {
        const field = new Blockly.FieldLabel('field');
        assert.throws(function () {
          this.dummy.insertFieldAt(1, field);
        });
      });
    });
    suite('Values', function () {
      // We're mostly just testing that it doesn't throw errors.
      test('Field', function () {
        const field = new Blockly.FieldLabel('field');
        this.dummy.insertFieldAt(0, field);
        assert.equal(this.dummy.fieldRow[0], field);
      });
      test('String', function () {
        this.dummy.insertFieldAt(0, 'field');
        assert.instanceOf(this.dummy.fieldRow[0], Blockly.FieldLabel);
      });
      test('String w/ field_label overwritten', function () {
        Blockly.fieldRegistry.unregister('field_label');
        Blockly.fieldRegistry.register('field_label', Blockly.FieldNumber);

        this.dummy.insertFieldAt(0, '1');
        assert.instanceOf(this.dummy.fieldRow[0], Blockly.FieldNumber);

        Blockly.fieldRegistry.unregister('field_label');
        Blockly.fieldRegistry.register('field_label', Blockly.FieldLabel);
      });
      test('Empty String', function () {
        this.dummy.insertFieldAt(0, '');
        assert.isEmpty(this.dummy.fieldRow);
      });
      test('Empty String W/ Name', function () {
        this.dummy.insertFieldAt(0, '', 'NAME');
        assert.instanceOf(this.dummy.fieldRow[0], Blockly.FieldLabel);
      });
      test('Null', function () {
        this.dummy.insertFieldAt(0, null);
        assert.isEmpty(this.dummy.fieldRow);
      });
      test('Undefined', function () {
        this.dummy.insertFieldAt(0, undefined);
        assert.isEmpty(this.dummy.fieldRow);
      });
    });
    suite('Prefixes and Suffixes', function () {
      test('Prefix', function () {
        const field = new Blockly.FieldLabel('field');
        const prefix = new Blockly.FieldLabel('prefix');
        field.prefixField = prefix;

        this.dummy.appendField(field);
        assert.deepEqual(this.dummy.fieldRow, [prefix, field]);
      });
      test('Suffix', function () {
        const field = new Blockly.FieldLabel('field');
        const suffix = new Blockly.FieldLabel('suffix');
        field.suffixField = suffix;

        this.dummy.appendField(field);
        assert.deepEqual(this.dummy.fieldRow, [field, suffix]);
      });
      test('Prefix and Suffix', function () {
        const field = new Blockly.FieldLabel('field');
        const prefix = new Blockly.FieldLabel('prefix');
        const suffix = new Blockly.FieldLabel('suffix');
        field.prefixField = prefix;
        field.suffixField = suffix;

        this.dummy.appendField(field);
        assert.deepEqual(this.dummy.fieldRow, [prefix, field, suffix]);
      });
      test('Dropdown - Prefix', function () {
        const field = new Blockly.FieldDropdown([
          ['prefix option1', 'OPTION1'],
          ['prefix option2', 'OPTION2'],
        ]);

        this.dummy.appendField(field);
        assert.equal(this.dummy.fieldRow.length, 2);
      });
      test('Dropdown - Suffix', function () {
        const field = new Blockly.FieldDropdown([
          ['option1 suffix', 'OPTION1'],
          ['option2 suffix', 'OPTION2'],
        ]);

        this.dummy.appendField(field);
        assert.equal(this.dummy.fieldRow.length, 2);
      });
      test('Dropdown - Prefix and Suffix', function () {
        const field = new Blockly.FieldDropdown([
          ['prefix option1 suffix', 'OPTION1'],
          ['prefix option2 suffix', 'OPTION2'],
        ]);

        this.dummy.appendField(field);
        assert.equal(this.dummy.fieldRow.length, 3);
      });
    });
    suite('Field Initialization', function () {
      test('Rendered', function () {
        const field = new Blockly.FieldLabel('field');
        const setBlockSpy = sinon.spy(field, 'setSourceBlock');
        const initSpy = sinon.spy(field, 'init');

        this.dummy.insertFieldAt(0, field);
        sinon.assert.calledOnce(setBlockSpy);
        assert.equal(setBlockSpy.getCall(0).args[0], this.block);
        sinon.assert.calledOnce(initSpy);
        sinon.assert.calledOnce(this.renderStub);

        setBlockSpy.restore();
        initSpy.restore();
      });
      // TODO: InsertFieldAt does not properly handle initialization in
      //  headless mode.
      test.skip('Headless', function () {
        const field = new Blockly.FieldLabel('field');
        const setBlockSpy = sinon.spy(field, 'setSourceBlock');
        const initModelSpy = sinon.spy(field, 'initModel');

        this.block.rendered = false;

        this.dummy.insertFieldAt(0, field);
        sinon.assert.calledOnce(setBlockSpy);
        assert.equal(setBlockSpy.getCall(0).args[0], this.block);
        sinon.assert.calledOnce(initModelSpy);
        sinon.assert.notCalled(this.renderStub);

        setBlockSpy.restore();
        initModelSpy.restore();
      });
    });
  });
  suite('Remove Field', function () {
    test('Field Not Found', function () {
      assert.throws(function () {
        this.dummy.removeField('FIELD');
      });
    });
    test('Rendered', function () {
      const field = new Blockly.FieldLabel('field');
      const disposeSpy = sinon.spy(field, 'dispose');
      this.dummy.appendField(field, 'FIELD');

      this.renderStub.resetHistory();

      this.dummy.removeField('FIELD');
      sinon.assert.calledOnce(disposeSpy);
      sinon.assert.calledOnce(this.renderStub);
    });
    test('Headless', function () {
      const field = new Blockly.FieldLabel('field');
      const disposeSpy = sinon.spy(field, 'dispose');
      this.dummy.appendField(field, 'FIELD');

      this.renderStub.resetHistory();

      this.block.rendered = false;

      this.dummy.removeField('FIELD');
      sinon.assert.calledOnce(disposeSpy);
      sinon.assert.notCalled(this.renderStub);
    });
  });
  suite('Field Ordering/Manipulation', function () {
    setup(function () {
      this.a = new Blockly.FieldLabel('a');
      this.b = new Blockly.FieldLabel('b');
      this.c = new Blockly.FieldLabel('c');
    });
    test('Append A, B, C', function () {
      this.dummy.appendField(this.a, 'A');
      this.dummy.appendField(this.b, 'B');
      this.dummy.appendField(this.c, 'C');

      assert.deepEqual(this.dummy.fieldRow, [this.a, this.b, this.c]);
    });
    test('Append B, C; Insert A at Start', function () {
      this.dummy.appendField(this.b, 'B');
      this.dummy.appendField(this.c, 'C');
      this.dummy.insertFieldAt(0, this.a, 'A');

      assert.deepEqual(this.dummy.fieldRow, [this.a, this.b, this.c]);
    });
    test('Append A, C; Insert B Between', function () {
      this.dummy.appendField(this.a, 'A');
      this.dummy.appendField(this.c, 'C');
      this.dummy.insertFieldAt(1, this.b, 'B');

      assert.deepEqual(this.dummy.fieldRow, [this.a, this.b, this.c]);
    });
    test('Append A, B; Insert C at End', function () {
      this.dummy.appendField(this.a, 'A');
      this.dummy.appendField(this.b, 'B');
      this.dummy.insertFieldAt(2, this.c, 'C');

      assert.deepEqual(this.dummy.fieldRow, [this.a, this.b, this.c]);
    });
    test('Append A, B, C; Remove A, B, C', function () {
      this.dummy.appendField(this.a, 'A');
      this.dummy.appendField(this.b, 'B');
      this.dummy.appendField(this.c, 'C');

      this.dummy.removeField('A');
      this.dummy.removeField('B');
      this.dummy.removeField('C');

      assert.isEmpty(this.dummy.fieldRow);
    });
    test('Append A, B, C; Remove A', function () {
      this.dummy.appendField(this.a, 'A');
      this.dummy.appendField(this.b, 'B');
      this.dummy.appendField(this.c, 'C');

      this.dummy.removeField('A');

      assert.deepEqual(this.dummy.fieldRow, [this.b, this.c]);
    });
    test('Append A, B, C; Remove B', function () {
      this.dummy.appendField(this.a, 'A');
      this.dummy.appendField(this.b, 'B');
      this.dummy.appendField(this.c, 'C');

      this.dummy.removeField('B');

      assert.deepEqual(this.dummy.fieldRow, [this.a, this.c]);
    });
    test('Append A, B, C; Remove C', function () {
      this.dummy.appendField(this.a, 'A');
      this.dummy.appendField(this.b, 'B');
      this.dummy.appendField(this.c, 'C');

      this.dummy.removeField('C');

      assert.deepEqual(this.dummy.fieldRow, [this.a, this.b]);
    });
    test('Append A, B; Remove A; Append C', function () {
      this.dummy.appendField(this.a, 'A');
      this.dummy.appendField(this.b, 'B');
      this.dummy.removeField('A');
      this.dummy.appendField(this.c, 'C');

      assert.deepEqual(this.dummy.fieldRow, [this.b, this.c]);
    });
  });
});
