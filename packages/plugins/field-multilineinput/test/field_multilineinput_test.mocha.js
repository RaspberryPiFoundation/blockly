/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {testHelpers} = require('@blockly/dev-tools');
const {
  FieldMultilineInput,
  registerFieldMultilineInput,
} = require('../src/index');
const Blockly = require('blockly');
const {assert} = require('chai');
const sinon = require('sinon');

const {
  assertFieldValue,
  FieldCreationTestCase,
  FieldValueTestCase,
  runConstructorSuiteTests,
  runFromJsonSuiteTests,
  runSetValueTests,
} = testHelpers;

suite('FieldMultilineInput', function () {
  setup(function () {
    registerFieldMultilineInput();
  });
  /**
   * Configuration for field tests with invalid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const invalidValueTestCases = [
    {title: 'Undefined', value: undefined},
    {title: 'Null', value: null},
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const validValueTestCases = [
    {title: 'Empty string', value: '', expectedValue: ''},
    {title: 'String no newline', value: 'value', expectedValue: 'value'},
    {
      title: 'String with newline',
      value: 'bark bark\n bark bark bark\n bark bar bark bark\n',
      expectedValue: 'bark bark\n bark bark bark\n bark bar bark bark\n',
    },
    {title: 'Boolean true', value: true, expectedValue: 'true'},
    {title: 'Boolean false', value: false, expectedValue: 'false'},
    {title: 'Number (Truthy)', value: 1, expectedValue: '1'},
    {title: 'Number (Falsy)', value: 0, expectedValue: '0'},
    {title: 'NaN', value: NaN, expectedValue: 'NaN'},
  ];
  const addArgsAndJson = function (testCase) {
    testCase.args = [testCase.value];
    testCase.json = {text: testCase.value};
  };
  invalidValueTestCases.forEach(addArgsAndJson);
  validValueTestCases.forEach(addArgsAndJson);

  /**
   * The expected default value for the field being tested.
   * @type {*}
   */
  const defaultFieldValue = '';
  /**
   * Asserts that the field property values are set to default.
   * @param {!FieldMultilineInput} field The field to check.
   */
  const assertFieldDefault = function (field) {
    assertFieldValue(field, defaultFieldValue);
  };

  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {FieldMultilineInput} field The field to check.
   * @param {FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertFieldValue(field, testCase.expectedValue);
  };

  runConstructorSuiteTests(
    FieldMultilineInput,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  runFromJsonSuiteTests(
    FieldMultilineInput,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  suite('setValue', function () {
    suite('Empty -> New Value', function () {
      setup(function () {
        this.field = new FieldMultilineInput();
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        defaultFieldValue,
      );
    });
    suite('Value -> New Value', function () {
      const initialValue = 'oldValue';
      setup(function () {
        this.field = new FieldMultilineInput(initialValue);
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        initialValue,
      );
    });
  });

  suite('Keyboard behavior', function () {
    /**
     * Dispatches a keydown event on the editor's textarea, setting the
     * cursor/selection beforehand.
     * @param {!HTMLTextAreaElement} textarea The editor's textarea.
     * @param {!Object} options KeyboardEvent options (key, shiftKey, etc.).
     * @param {number} [selectionStart] Optional selection start to set first.
     * @param {number} [selectionEnd] Optional selection end to set first.
     */
    const pressKey = function (
      textarea,
      options,
      selectionStart,
      selectionEnd,
    ) {
      if (selectionStart !== undefined) {
        textarea.selectionStart = selectionStart;
        textarea.selectionEnd = selectionEnd ?? selectionStart;
      }
      textarea.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          ...options,
        }),
      );
    };

    setup(function () {
      this.jsdomCleanup = require('jsdom-global')(
        '<!DOCTYPE html><div id="blocklyDiv"></div>',
      );
      // See https://github.com/RaspberryPiFoundation/blockly-samples/issues/2528.
      global.SVGElement = window.SVGElement;
      // Blockly's focus handling constructs FocusEvent, which jsdom exposes on
      // window but not as a global.
      global.FocusEvent = window.FocusEvent;
      // jsdom doesn't provide requestAnimationFrame/cancelAnimationFrame, which
      // block rendering relies on. Route them through (faked) timers so they
      // exist and can be flushed deterministically in teardown.
      this.clock = sinon.useFakeTimers();
      window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
      window.cancelAnimationFrame = (id) => clearTimeout(id);
      this.workspace = Blockly.inject('blocklyDiv');

      if (!Blockly.Blocks['multiline_block']) {
        Blockly.defineBlocksWithJsonArray([
          {
            type: 'multiline_block',
            message0: '%1',
            args0: [
              {type: 'field_multilinetext', name: 'FIELD', text: 'hello'},
            ],
          },
        ]);
      }
      this.block = this.workspace.newBlock('multiline_block');
      this.block.initSvg();
      this.block.render();
      this.field = this.block.getField('FIELD');

      // Open the editor so we exercise the real <textarea> and its bound
      // event handlers rather than a fabricated stand-in.
      this.field.showEditor_();
      this.textarea = this.field.htmlInput_;

      // Stub the parent handler so we can detect when the field delegates to it
      // (i.e. commits the value). super.onHtmlInputKeyDown_ resolves to this at
      // call time, so stubbing after binding still works.
      this.superStub = sinon.stub(
        Blockly.FieldTextInput.prototype,
        'onHtmlInputKeyDown_',
      );
    });

    teardown(function () {
      Blockly.WidgetDiv.hide();
      this.workspace.dispose();
      this.clock.runAll();
      sinon.restore();
      this.jsdomCleanup();
    });

    test('Enter calls super to commit the value', function () {
      pressKey(this.textarea, {key: 'Enter'});
      assert.isTrue(this.superStub.calledOnce);
    });

    test('Shift+Enter inserts a newline without committing', function () {
      pressKey(this.textarea, {key: 'Enter', shiftKey: true}, 3);
      assert.isFalse(this.superStub.called, 'super should not be called');
      assert.equal(this.textarea.value, 'hel\nlo');
      assert.equal(this.textarea.selectionStart, 4);
    });

    test('Shift+Enter replaces a selection with a newline', function () {
      this.textarea.value = 'hello world';
      pressKey(this.textarea, {key: 'Enter', shiftKey: true}, 5, 11);
      assert.equal(this.textarea.value, 'hello\n');
      assert.equal(this.textarea.selectionStart, 6);
    });

    // IME composition is a special case where the browser is still in the process of
    // composing text, so we don't want to commit or insert a newline when Enter is pressed.
    test('Enter during IME composition does not commit or insert newline', function () {
      pressKey(this.textarea, {key: 'Enter', isComposing: true});
      assert.isFalse(this.superStub.called, 'super should not be called');
      assert.equal(this.textarea.value, 'hello', 'value should be unchanged');
    });

    test('Non-Enter keys call super', function () {
      pressKey(this.textarea, {key: 'Escape'});
      assert.isTrue(this.superStub.calledOnce);
    });

    suite('enterCommits = false (swapped mode)', function () {
      setup(function () {
        FieldMultilineInput.enterCommits = false;
      });

      teardown(function () {
        FieldMultilineInput.enterCommits = true;
      });

      test('plain Enter inserts a newline and does not call super', function () {
        pressKey(this.textarea, {key: 'Enter'}, 3);
        assert.isFalse(this.superStub.called, 'super should not be called');
        assert.equal(this.textarea.value, 'hel\nlo');
      });

      test('Shift+Enter calls super to commit and does not modify value', function () {
        pressKey(this.textarea, {key: 'Enter', shiftKey: true}, 3);
        assert.isTrue(this.superStub.calledOnce, 'super should be called');
        assert.equal(this.textarea.value, 'hello', 'value should be unchanged');
      });
    });
  });

  suite('Serialization', function () {
    setup(function () {
      this.workspace = new Blockly.Workspace();
      Blockly.defineBlocksWithJsonArray([
        {
          type: 'row_block',
          message0: '%1',
          args0: [
            {
              type: 'input_value',
              name: 'INPUT',
            },
          ],
          output: null,
        },
      ]);

      this.assertValue = (value) => {
        const block = this.workspace.newBlock('row_block');
        const field = new FieldMultilineInput(value);
        block.getInput('INPUT').appendField(field, 'MULTILINE');
        const jso = Blockly.serialization.blocks.save(block);
        assert.deepEqual(jso['fields'], {MULTILINE: value});
      };
    });

    teardown(function () {
      this.workspace.dispose();
    });

    test('Single line', function () {
      this.assertValue('this is a single line');
    });

    test('Multiple lines', function () {
      this.assertValue('this\nis\n  multiple\n    lines');
    });
  });
});
