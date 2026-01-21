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

suite('Colour Fields', function () {
  setup(function () {
    sharedTestSetup.call(this);
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });
  /**
   * Configuration for field tests with invalid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const invalidValueTestCases = [
    {title: 'Undefined', value: undefined},
    {title: 'Null', value: null},
    {title: 'NaN', value: NaN},
    {title: 'Non-Parsable String', value: 'bad-string'},
    {title: 'Integer', value: 1},
    {title: 'Float', value: 1.5},
    {title: 'Infinity', value: Infinity, expectedValue: Infinity},
    {title: 'Negative Infinity', value: -Infinity, expectedValue: -Infinity},
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {!Array<!FieldCreationTestCase>}
   */

  const validValueTestCases = [
    {
      title: '#AAAAAA',
      value: '#AAAAAA',
      expectedValue: '#aaaaaa',
      expectedText: '#aaa',
    },
    {
      title: '#aaaaaa',
      value: '#aaaaaa',
      expectedValue: '#aaaaaa',
      expectedText: '#aaa',
    },
    {
      title: '#AAAA00',
      value: '#AAAA00',
      expectedValue: '#aaaa00',
      expectedText: '#aa0',
    },
    {
      title: '#aaaA00',
      value: '#aaaA00',
      expectedValue: '#aaaa00',
      expectedText: '#aa0',
    },
    {
      title: '#BCBCBC',
      value: '#BCBCBC',
      expectedValue: '#bcbcbc',
      expectedText: '#bcbcbc',
    },
    {
      title: '#bcbcbc',
      value: '#bcbcbc',
      expectedValue: '#bcbcbc',
      expectedText: '#bcbcbc',
    },
    {
      title: '#AA0',
      value: '#AA0',
      expectedValue: '#aaaa00',
      expectedText: '#aa0',
    },
    {
      title: '#aa0',
      value: '#aa0',
      expectedValue: '#aaaa00',
      expectedText: '#aa0',
    },
    {
      title: 'rgb(170, 170, 0)',
      value: 'rgb(170, 170, 0)',
      expectedValue: '#aaaa00',
      expectedText: '#aa0',
    },
    {
      title: 'red',
      value: 'red',
      expectedValue: '#ff0000',
      expectedText: '#f00',
    },
  ];
  const addArgsAndJson = function (testCase) {
    testCase.args = [testCase.value];
    testCase.json = {'colour': testCase.value};
  };
  invalidValueTestCases.forEach(addArgsAndJson);
  validValueTestCases.forEach(addArgsAndJson);

  /**
   * The expected default value for the field being tested.
   * @type {*}
   */
  const defaultFieldValue = Blockly.FieldColour.COLOURS[0];
  /**
   * The expected default text for the field being tested.
   * @type {*}
   */
  const defaultTextValue = (function () {
    let expectedText = defaultFieldValue;
    const m = defaultFieldValue.match(/^#(.)\1(.)\2(.)\3$/);
    if (m) {
      expectedText = '#' + m[1] + m[2] + m[3];
    }
    return expectedText;
  })();
  /**
   * Asserts that the field property values are set to default.
   * @param {FieldTemplate} field The field to check.
   */
  const assertFieldDefault = function (field) {
    assertFieldValue(field, defaultFieldValue, defaultTextValue);
  };
  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {!Blockly.FieldAngle} field The field to check.
   * @param {!FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertFieldValue(field, testCase.expectedValue, testCase.expectedText);
  };

  runConstructorSuiteTests(
    Blockly.FieldColour,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  runFromJsonSuiteTests(
    Blockly.FieldColour,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  suite('setValue', function () {
    suite('Empty -> New Value', function () {
      setup(function () {
        this.field = new Blockly.FieldColour();
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        defaultFieldValue,
        defaultTextValue,
      );
      test('With source block', function () {
        this.field.setSourceBlock(createTestBlock());
        this.field.setValue('#bcbcbc');
        assertFieldValue(this.field, '#bcbcbc', '#bcbcbc');
      });
    });
    suite('Value -> New Value', function () {
      setup(function () {
        this.field = new Blockly.FieldColour('#aaaaaa');
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        '#aaaaaa',
        '#aaa',
      );
      test('With source block', function () {
        this.field.setSourceBlock(createTestBlock());
        this.field.setValue('#bcbcbc');
        assertFieldValue(this.field, '#bcbcbc', '#bcbcbc');
      });
    });
  });
  suite('Validators', function () {
    setup(function () {
      this.field = new Blockly.FieldColour('#aaaaaa');
    });
    const testSuites = [
      {
        title: 'Null Validator',
        validator: function () {
          return null;
        },
        value: '#000000',
        expectedValue: '#aaaaaa',
        expectedText: '#aaa',
      },
      {
        title: 'Force Full Red Validator',
        validator: function (newValue) {
          return '#ff' + newValue.substr(3, 4);
        },
        value: '#000000',
        expectedValue: '#ff0000',
        expectedText: '#f00',
      },
      {
        title: 'Returns Undefined Validator',
        validator: function () {},
        value: '#000000',
        expectedValue: '#000000',
        expectedText: '#000',
      },
    ];
    testSuites.forEach(function (suiteInfo) {
      suite(suiteInfo.title, function () {
        setup(function () {
          this.field.setValidator(suiteInfo.validator);
        });
        test('New Value', function () {
          this.field.setValue(suiteInfo.value);
          assertFieldValue(
            this.field,
            suiteInfo.expectedValue,
            suiteInfo.expectedText,
          );
        });
      });
    });
  });
  suite('Customizations', function () {
    suite('Colours and Titles', function () {
      function assertColoursAndTitles(field, colours, titles) {
        field.dropdownCreate();
        let index = 0;
        let node = field.picker.firstChild.firstChild;
        while (node) {
          assert.equal(node.getAttribute('title'), titles[index]);
          assert.equal(
            Blockly.utils.colour.parse(node.style.backgroundColor),
            colours[index],
          );

          let nextNode = node.nextSibling;
          if (!nextNode) {
            nextNode = node.parentElement.nextSibling;
            if (!nextNode) {
              break;
            }
            nextNode = nextNode.firstChild;
          }
          node = nextNode;

          index++;
        }
      }
      test('Constants', function () {
        const colours = Blockly.FieldColour.COLOURS;
        const titles = Blockly.FieldColour.TITLES;
        // Note: Developers shouldn't actually do this. IMO they should
        // change the file and then recompile. But this is fine for testing.
        Blockly.FieldColour.COLOURS = ['#aaaaaa'];
        Blockly.FieldColour.TITLES = ['grey'];
        const field = new Blockly.FieldColour();

        assertColoursAndTitles(field, ['#aaaaaa'], ['grey']);

        Blockly.FieldColour.COLOURS = colours;
        Blockly.FieldColour.TITLES = titles;
      });
      test('JS Constructor', function () {
        const field = new Blockly.FieldColour('#aaaaaa', null, {
          colourOptions: ['#aaaaaa'],
          colourTitles: ['grey'],
        });
        assertColoursAndTitles(field, ['#aaaaaa'], ['grey']);
      });
      test('JSON Definition', function () {
        const field = Blockly.FieldColour.fromJson({
          colour: '#aaaaaa',
          colourOptions: ['#aaaaaa'],
          colourTitles: ['grey'],
        });
        assertColoursAndTitles(field, ['#aaaaaa'], ['grey']);
      });
      test('setColours', function () {
        const field = new Blockly.FieldColour();
        field.setColours(['#aaaaaa'], ['grey']);
        assertColoursAndTitles(field, ['#aaaaaa'], ['grey']);
      });
      test('Titles Undefined', function () {
        const field = new Blockly.FieldColour();
        field.setColours(['#aaaaaa']);
        assertColoursAndTitles(field, ['#aaaaaa'], ['#aaaaaa']);
      });
      test('Some Titles Undefined', function () {
        const field = new Blockly.FieldColour();
        field.setColours(['#aaaaaa', '#ff0000'], ['grey']);
        assertColoursAndTitles(
          field,
          ['#aaaaaa', '#ff0000'],
          ['grey', '#ff0000'],
        );
      });
      // This is kinda derpy behavior, but I wanted to document it.
      test('Overwriting Colours While Leaving Titles', function () {
        const field = new Blockly.FieldColour();
        field.setColours(['#aaaaaa'], ['grey']);
        field.setColours(['#ff0000']);
        assertColoursAndTitles(field, ['#ff0000'], ['grey']);
      });
    });
    suite('Columns', function () {
      function assertColumns(field, columns) {
        field.dropdownCreate();
        assert.equal(field.picker.firstChild.children.length, columns);
      }
      test('Constants', function () {
        const columns = Blockly.FieldColour.COLUMNS;
        // Note: Developers shouldn't actually do this. IMO they should edit
        // the file and then recompile. But this is fine for testing.
        Blockly.FieldColour.COLUMNS = 3;
        const field = new Blockly.FieldColour();

        assertColumns(field, 3);

        Blockly.FieldColour.COLUMNS = columns;
      });
      test('JS Constructor', function () {
        const field = new Blockly.FieldColour('#ffffff', null, {
          columns: 3,
        });
        assertColumns(field, 3);
      });
      test('JSON Definition', function () {
        const field = Blockly.FieldColour.fromJson({
          'colour': '#ffffff',
          'columns': 3,
        });
        assertColumns(field, 3);
      });
      test('setColumns', function () {
        const field = new Blockly.FieldColour();
        field.setColumns(3);
        assertColumns(field, 3);
      });
    });
  });

  suite('Serialization', function () {
    setup(function () {
      this.workspace = new Blockly.Workspace();
      defineRowBlock();

      this.assertValue = (value) => {
        const block = this.workspace.newBlock('row_block');
        const field = new Blockly.FieldColour(value);
        block.getInput('INPUT').appendField(field, 'COLOUR');
        const jso = Blockly.serialization.blocks.save(block);
        assert.deepEqual(jso['fields'], {'COLOUR': value});
      };
    });

    teardown(function () {
      workspaceTeardown.call(this, this.workspace);
    });

    test('Three char', function () {
      this.assertValue('#001122');
    });

    test('Six char', function () {
      this.assertValue('#012345');
    });
  });
});
