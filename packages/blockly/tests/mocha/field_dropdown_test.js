/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  createTestBlock,
  defineRowBlock,
} from './test_helpers/block_definitions.js';
import {
  assertFieldValue,
  runConstructorSuiteTests,
  runFromJsonSuiteTests,
  runSetValueTests,
} from './test_helpers/fields.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('Dropdown Fields', function () {
  setup(function () {
    sharedTestSetup.call(this);

    // Invalid value test are expected to log errors.
    const nativeConsoleError = console.error;
    this.nativeConsoleError = nativeConsoleError;
    console.error = function (msg) {
      if (!msg.includes('Each FieldDropdown option')) {
        nativeConsoleError.call(this, ...arguments);
      }
    };
  });
  teardown(function () {
    console.error = this.nativeConsoleError;
    sharedTestTeardown.call(this);
  });
  /**
   * Configuration for field tests with invalid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const invalidValueCreationTestCases = [
    {title: 'Undefined', args: [undefined]},
    {title: 'Array Items not Arrays', args: [undefined]},
    {
      title: 'Array Items with Invalid IDs',
      args: [
        [
          ['1', 1],
          ['2', 2],
          ['3', 3],
        ],
      ],
    },
    {
      title: 'Array Items with Invalid Content',
      args: [
        [
          [1, '1'],
          [2, '2'],
          [3, '3'],
        ],
      ],
    },
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const validValueCreationTestCases = [
    {
      title: 'Text Dropdown',
      value: 'A',
      expectedValue: 'A',
      expectedText: 'a',
      args: [
        [
          ['a', 'A'],
          ['b', 'B'],
          ['c', 'C'],
        ],
      ],
    },
    {
      title: 'Image Dropdown',
      value: 'A',
      expectedValue: 'A',
      expectedText: 'a',
      args: [
        [
          [{src: 'scrA', alt: 'a', width: 10, height: 10}, 'A'],
          [{src: 'scrB', alt: 'b', width: 10, height: 10}, 'B'],
          [{src: 'scrC', alt: 'c', width: 10, height: 10}, 'C'],
        ],
      ],
    },
    {
      title: 'Dynamic Text Dropdown',
      value: 'A',
      expectedValue: 'A',
      expectedText: 'a',
      args: [
        () => {
          return [
            ['a', 'A'],
            ['b', 'B'],
            ['c', 'C'],
          ];
        },
      ],
    },
    {
      title: 'Dynamic Image Dropdown',
      value: 'A',
      expectedValue: 'A',
      expectedText: 'a',
      args: [
        () => {
          return [
            [{src: 'scrA', alt: 'a', width: 10, height: 10}, 'A'],
            [{src: 'scrB', alt: 'b', width: 10, height: 10}, 'B'],
            [{src: 'scrC', alt: 'c', width: 10, height: 10}, 'C'],
          ];
        },
      ],
    },
  ];
  const addJson = function (testCase) {
    testCase.json = {'options': testCase.args[0]};
  };
  invalidValueCreationTestCases.forEach(addJson);
  validValueCreationTestCases.forEach(addJson);

  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {!Blockly.FieldDropdown} field The field to check.
   * @param {!FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertFieldValue(field, testCase.expectedValue, testCase.expectedText);
  };

  runConstructorSuiteTests(
    Blockly.FieldDropdown,
    validValueCreationTestCases,
    invalidValueCreationTestCases,
    validTestCaseAssertField,
  );

  runFromJsonSuiteTests(
    Blockly.FieldDropdown,
    validValueCreationTestCases,
    invalidValueCreationTestCases,
    validTestCaseAssertField,
  );

  /**
   * Configuration for field tests with invalid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const invalidValueSetValueTestCases = [
    {title: 'Null', value: null},
    {title: 'Undefined', value: undefined},
    {title: 'Invalid ID', value: 'bad'},
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {!Array<!FieldValueTestCase>}
   */
  const validValueSetValueTestCases = [
    {title: 'Valid ID', value: 'B', expectedValue: 'B', expectedText: 'b'},
  ];

  suite('setValue', function () {
    setup(function () {
      this.field = new Blockly.FieldDropdown([
        ['a', 'A'],
        ['b', 'B'],
        ['c', 'C'],
      ]);
    });
    runSetValueTests(
      validValueSetValueTestCases,
      invalidValueSetValueTestCases,
      'A',
      'a',
    );
    test('With source block', function () {
      this.field.setSourceBlock(createTestBlock());
      this.field.setValue('B');
      assertFieldValue(this.field, 'B', 'b');
    });
  });
  suite('setOptions', function () {
    setup(function () {
      this.field = new Blockly.FieldDropdown([
        ['a', 'A'],
        ['b', 'B'],
        ['c', 'C'],
      ]);
    });
    test('With array updates options', function () {
      this.field.setOptions([
        ['d', 'D'],
        ['e', 'E'],
        ['f', 'F'],
      ]);
      assertFieldValue(this.field, 'D', 'd');
    });
    test('With generator updates options', function () {
      this.field.setOptions(function () {
        return [
          ['d', 'D'],
          ['e', 'E'],
          ['f', 'F'],
        ];
      });
      assertFieldValue(this.field, 'D', 'd');
    });
    test('With trimmable options gets trimmed', function () {
      this.field.setOptions([
        ['a d b', 'D'],
        ['a e b', 'E'],
        ['a f b', 'F'],
      ]);
      assert.deepEqual(this.field.prefixField, 'a');
      assert.deepEqual(this.field.suffixField, 'b');
      assert.deepEqual(this.field.getOptions(), [
        ['d', 'D'],
        ['e', 'E'],
        ['f', 'F'],
      ]);
    });
    test('With an empty array of options throws', function () {
      assert.throws(function () {
        this.field.setOptions([]);
      });
    });
  });

  suite('Validators', function () {
    setup(function () {
      this.dropdownField = new Blockly.FieldDropdown([
        ['1a', '1A'],
        ['1b', '1B'],
        ['1c', '1C'],
        ['2a', '2A'],
        ['2b', '2B'],
        ['2c', '2C'],
      ]);
    });
    teardown(function () {
      this.dropdownField.setValidator(null);
    });
    suite('Null Validator', function () {
      setup(function () {
        this.dropdownField.setValidator(function () {
          return null;
        });
      });
      test('New Value', function () {
        this.dropdownField.setValue('1B');
        assertFieldValue(this.dropdownField, '1A', '1a');
      });
    });
    suite('Force 1s Validator', function () {
      setup(function () {
        this.dropdownField.setValidator(function (newValue) {
          return '1' + newValue.charAt(1);
        });
      });
      test('New Value', function () {
        this.dropdownField.setValue('2B');
        assertFieldValue(this.dropdownField, '1B', '1b');
      });
    });
    suite('Returns Undefined Validator', function () {
      setup(function () {
        this.dropdownField.setValidator(function () {});
      });
      test('New Value', function () {
        this.dropdownField.setValue('1B');
        assertFieldValue(this.dropdownField, '1B', '1b');
      });
    });
  });

  suite('Serialization', function () {
    setup(function () {
      this.workspace = new Blockly.Workspace();
      defineRowBlock();

      this.assertValue = (value, field) => {
        const block = this.workspace.newBlock('row_block');
        field.setValue(value);
        block.getInput('INPUT').appendField(field, 'DROPDOWN');
        const jso = Blockly.serialization.blocks.save(block);
        assert.deepEqual(jso['fields'], {'DROPDOWN': value});
      };
    });

    teardown(function () {
      workspaceTeardown.call(this, this.workspace);
    });

    test('Simple', function () {
      const field = new Blockly.FieldDropdown([
        ['apple', 'A'],
        ['ball', 'B'],
        ['carrot', 'C'],
      ]);
      this.assertValue('C', field);
    });

    test('Dynamic', function () {
      const field = new Blockly.FieldDropdown(() => [
        ['apple', 'A'],
        ['ball', 'B'],
        ['carrot', 'C'],
      ]);
      this.assertValue('C', field);
    });
  });

  suite('ARIA', function () {
    setup(function () {
      this.workspace = Blockly.inject('blocklyDiv', {
        renderer: 'geras',
      });
    });
    suite('Simple Dropdown', function () {
      setup(function () {
        this.block = this.workspace.newBlock('logic_boolean');
        this.field = this.block.getField('BOOL');
        this.block.initSvg();
        this.block.render();

        this.focusableElement = this.field.getFocusableElement();
      });
      test('Block has field type name in ARIA label', function () {
        const blockLabel = this.block.getAriaLabel();
        assert.include(blockLabel, 'dropdown:');
      });
      test('Field has field type name in ARIA label', function () {
        const fieldLabel = this.focusableElement.getAttribute('aria-label');
        assert.include(fieldLabel, 'dropdown:');
      });
      test('Focusable element has role of button', function () {
        const role = this.focusableElement.getAttribute('role');
        assert.equal(role, 'button');
      });
      test('Hidden when in a flyout', function () {
        this.block.isInFlyout = true;
        // Force recompute of ARIA label.
        this.field.setValue(this.field.getValue());
        const ariaHidden = this.focusableElement.getAttribute('aria-hidden');
        assert.equal(ariaHidden, 'true');
      });
      test('Does not have aria-expanded when dropdown is closed', function () {
        const ariaExpanded =
          this.focusableElement.getAttribute('aria-expanded');
        assert.equal(ariaExpanded, 'false');
      });
      test('Has aria-expanded when dropdown is open', function () {
        this.field.showEditor_();
        const ariaExpanded =
          this.focusableElement.getAttribute('aria-expanded');
        assert.equal(ariaExpanded, 'true');
        this.workspace.hideChaff();
      });
      test('Has aria-haspopup of listbox', function () {
        const ariaHasPopup =
          this.focusableElement.getAttribute('aria-haspopup');
        assert.equal(ariaHasPopup, 'listbox');
      });
      test('Has aria-controls that matches the ID of the dropdown menu', function () {
        this.field.showEditor_();
        const ariaControls =
          this.focusableElement.getAttribute('aria-controls');
        const menuId = this.field.menu_.id;
        assert.equal(ariaControls, menuId);
        this.workspace.hideChaff();
      });
      test('Has placeholder ARIA label by default', function () {
        const label = this.focusableElement.getAttribute('aria-label');
        assert.include(label, 'true');
      });
      test('setValue updates ARIA label', function () {
        const initialLabel = this.focusableElement.getAttribute('aria-label');
        assert.include(initialLabel, 'true');
        this.field.setValue('FALSE');
        const updatedLabel = this.focusableElement.getAttribute('aria-label');
        assert.include(updatedLabel, 'false');
      });
    });
    suite('Dropdown with Option ARIA labels', function () {
      setup(function () {
        Blockly.defineBlocksWithJsonArray([
          {
            'type': 'math_op',
            'message0': '%1',
            'args0': [
              {
                'type': 'field_dropdown',
                'name': 'OP',
                'options': [
                  ['%{BKY_MATH_ADDITION_SYMBOL}', 'ADD', 'Plus'],
                  ['%{BKY_MATH_SUBTRACTION_SYMBOL}', 'MINUS', 'Minus'],
                  ['%{BKY_MATH_MULTIPLICATION_SYMBOL}', 'MULTIPLY', 'Times'],
                  ['%{BKY_MATH_DIVISION_SYMBOL}', 'DIVIDE', 'Divided by'],
                  ['%{BKY_MATH_POWER_SYMBOL}', 'POWER', 'To the power of'],
                ],
              },
            ],
          },
        ]);
        const block = this.workspace.newBlock('math_op');
        block.initSvg();
        block.render();
        this.field = block.getField('OP');
      });
      test('Option ARIA labels are included in field ARIA label', function () {
        const label = this.field
          .getFocusableElement()
          .getAttribute('aria-label');
        assert.include(label, 'Plus');
      });
      test('Option ARIA labels are included in field ARIA label when value is changed', function () {
        this.field.setValue('DIVIDE');
        const label = this.field
          .getFocusableElement()
          .getAttribute('aria-label');
        assert.include(label, 'Divided by');
      });
    });
    suite('Dropdown with image options', function () {
      setup(function () {
        Blockly.defineBlocksWithJsonArray([
          {
            'type': 'image_dropdown_test',
            'message0': '%1',
            'args0': [
              {
                'type': 'field_dropdown',
                'name': 'IMG',
                'options': [
                  [
                    {
                      'src':
                        'https://blockly-demo.appspot.com/static/tests/media/a.png',
                      'width': 32,
                      'height': 32,
                      'alt': 'A',
                    },
                    'A',
                  ],
                  [
                    {
                      'src':
                        'https://blockly-demo.appspot.com/static/tests/media/b.png',
                      'width': 32,
                      'height': 32,
                      'alt': 'B',
                      'ariaLabel': 'Letter B',
                    },
                    'B',
                  ],
                ],
              },
            ],
          },
        ]);
        const block = this.workspace.newBlock('image_dropdown_test');
        block.initSvg();
        block.render();
        this.field = block.getField('IMG');
      });
      test('Image alt text is included in ARIA label', function () {
        const label = this.field
          .getFocusableElement()
          .getAttribute('aria-label');
        assert.include(label, 'A');
      });
      test('Image ARIA label is prioritized over alt text', function () {
        this.field.dropdownCreate();
        this.field.setValue('B');
        const label = this.field
          .getFocusableElement()
          .getAttribute('aria-label');
        assert.include(label, 'Letter B');
      });
    });
    suite('Dropdown with HTMLElement options', function () {
      setup(function () {
        function makeElementOption({ariaLabel, title, innerText}) {
          const element = document.createElement('div');
          if (ariaLabel) element.ariaLabel = ariaLabel;
          if (title) element.title = title;
          if (innerText) element.innerText = innerText;
          return element;
        }
        const options = [
          [
            makeElementOption({
              ariaLabel: 'Ignored',
              title: 'Ignored',
              innerText: 'Ignored',
            }),
            'A',
            'Explicit A label',
          ],
          [
            makeElementOption({
              ariaLabel: 'Element ARIA',
              title: 'Ignored',
              innerText: 'Ignored',
            }),
            'B',
          ],
          [
            makeElementOption({
              title: 'Title text',
              innerText: 'Ignored',
            }),
            'C',
          ],
          [makeElementOption({innerText: 'Inner text'}), 'D'],
          [makeElementOption({}), 'E'],
        ];

        Blockly.Blocks['aria_dropdown_test'] = {
          init: function () {
            this.appendDummyInput().appendField(
              new Blockly.FieldDropdown(options),
              'OP',
            );

            this.setOutput(true, null);
            this.setColour(230);
          },
        };
        const block = this.workspace.newBlock('aria_dropdown_test');
        block.initSvg();
        block.render();
        this.field = block.getField('OP');
      });
      test('Explicit ARIA label overrides all other label sources', function () {
        this.field.setValue('A');
        const label = this.field
          .getFocusableElement()
          .getAttribute('aria-label');
        assert.include(label, 'Explicit A label');
      });
      test('HTMLElement ariaLabel prioritized over other properties', function () {
        this.field.setValue('B');
        const label = this.field
          .getFocusableElement()
          .getAttribute('aria-label');
        assert.include(label, 'Element ARIA');
      });
      test('HTMLElement title is used when ariaLabel is missing', function () {
        this.field.setValue('C');
        const label = this.field
          .getFocusableElement()
          .getAttribute('aria-label');
        assert.include(label, 'Title text');
      });
      test('HTMLElement innerText is used as final fallback', function () {
        this.field.setValue('D');
        const label = this.field
          .getFocusableElement()
          .getAttribute('aria-label');
        assert.include(label, 'Inner text');
      });
      test('Empty label falls back to option index', function () {
        this.field.setValue('E');
        const label = this.field
          .getFocusableElement()
          .getAttribute('aria-label');
        assert.include(label, 'Option 5');
      });
    });
  });
});
