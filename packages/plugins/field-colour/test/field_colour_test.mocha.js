/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const {testHelpers} = require('@blockly/dev-tools');
const {FieldColour, registerFieldColour} = require('../src/index');
const {assert} = require('chai');

const {
  assertFieldValue,
  FieldCreationTestCase,
  FieldValueTestCase,
  runConstructorSuiteTests,
  runFromJsonSuiteTests,
  runSetValueTests,
} = testHelpers;

suite('FieldColour', function () {
  setup(function () {
    registerFieldColour();
    this.jsdomCleanup = require('jsdom-global')(
      '<!DOCTYPE html><div id="blocklyDiv"></div>',
    );
  });

  teardown(function () {
    this.jsdomCleanup();
  });

  /**
   * Configuration for field tests with invalid values.
   * @type {Array<FieldCreationTestCase>}
   */
  const invalidValueTestCases = [
    {title: 'Undefined', value: undefined},
    {title: 'Null', value: null},
    {title: 'NaN', value: NaN},
    {title: 'Non-Parsable String', value: 'bad-string'},
    {title: 'Integer', value: 1},
    {title: 'Float', value: 1.5},
    {title: 'Infinity', value: Infinity},
    {title: 'Negative Infinity', value: -Infinity},
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {Array<FieldCreationTestCase>}
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
    testCase.json = {colour: testCase.value};
  };
  invalidValueTestCases.forEach(addArgsAndJson);
  validValueTestCases.forEach(addArgsAndJson);

  /**
   * The expected default value for the field being tested.
   * @type {*}
   */
  const defaultFieldValue = FieldColour.prototype.DEFAULT_VALUE;

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
   * @param {!FieldColour} field The field to check.
   */
  const assertFieldDefault = function (field) {
    assertFieldValue(field, defaultFieldValue, defaultTextValue);
  };

  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {FieldColour} field The field to check.
   * @param {FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertFieldValue(field, testCase.expectedValue, testCase.expectedText);
  };

  runConstructorSuiteTests(
    FieldColour,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  runFromJsonSuiteTests(
    FieldColour,
    validValueTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
    assertFieldDefault,
  );

  suite('setValue', function () {
    /**
     * Create a mock block that may be used as the source block for a field.
     * @returns {!Object} Mock block.
     */
    function createBlockMock() {
      return {
        id: 'test',
        rendered: false,
        workspace: {
          rendered: false,
        },
        renameVarById: Blockly.Block.prototype.renameVarById,
        updateVarName: Blockly.Block.prototype.updateVarName,
        isShadow: () => false,
        isDeadOrDying: () => false,
      };
    }

    suite('Empty -> New Value', function () {
      setup(function () {
        this.field = new FieldColour();
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        defaultFieldValue,
        defaultTextValue,
      );
      test('With source block', function () {
        this.field.setSourceBlock(createBlockMock());
        this.field.setValue('#bcbcbc');
        assertFieldValue(this.field, '#bcbcbc', '#bcbcbc');
      });
    });
    suite('Value -> New Value', function () {
      setup(function () {
        this.field = new FieldColour('#aaaaaa');
      });
      runSetValueTests(
        validValueTestCases,
        invalidValueTestCases,
        '#aaaaaa',
        '#aaa',
      );
      test('With source block', function () {
        this.field.setSourceBlock(createBlockMock());
        this.field.setValue('#bcbcbc');
        assertFieldValue(this.field, '#bcbcbc', '#bcbcbc');
      });
    });
  });

  suite('Validators', function () {
    setup(function () {
      this.field = new FieldColour('#aaaaaa');
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
      /**
       * Verify that the list of colours and titles are as expected.
       * @param {!FieldColour} field Field to test.
       * @param {!Array[string]} expectedColours Array of colour names.
       * @param {!Array[string]} expectedTitles Array of title names.
       */
      function assertColoursAndTitles(field, expectedColours, expectedTitles) {
        const options = field.getOptions();
        const actualColours = options.map((option) =>
          Blockly.utils.colour.parse(option[0].style.backgroundColor),
        );
        const actualTitles = options
          .map((option) => option[0].title)
          .filter((title) => !!title);
        assert.equal(String(actualColours), String(expectedColours));
        assert.equal(String(actualTitles), String(expectedTitles));
      }
      test('JS Constructor', function () {
        const field = new FieldColour('#aaaaaa', null, {
          colourOptions: ['#aaaaaa'],
          colourTitles: ['grey'],
        });
        assertColoursAndTitles(field, ['#aaaaaa'], ['grey']);
      });
      test('JSON Definition', function () {
        const field = FieldColour.fromJson({
          colour: '#aaaaaa',
          colourOptions: ['#aaaaaa'],
          colourTitles: ['grey'],
        });
        assertColoursAndTitles(field, ['#aaaaaa'], ['grey']);
      });
      test('setColours', function () {
        const field = new FieldColour();
        field.setColours(['#aaaaaa'], ['grey']);
        assertColoursAndTitles(field, ['#aaaaaa'], ['grey']);
      });
      test('Titles Undefined', function () {
        const field = new FieldColour();
        field.setColours(['#aaaaaa']);
        assertColoursAndTitles(field, ['#aaaaaa'], []);
      });
      test('Some Titles Undefined', function () {
        const field = new FieldColour();
        field.setColours(['#aaaaaa', '#ff0000'], ['grey']);
        assertColoursAndTitles(field, ['#aaaaaa', '#ff0000'], ['grey']);
      });
    });

    suite('Columns', function () {
      /**
       * Verify that the number of columns is as expected.
       * @param {!FieldColour} field Field to test.
       * @param {number} expectedColumns Number of columns field should have.
       */
      function assertColumns(field, expectedColumns) {
        const actualColumns = field.columns || FieldColour.COLUMNS;
        assert.equal(actualColumns, expectedColumns);
      }
      test('JS Constructor', function () {
        const field = new FieldColour('#ffffff', null, {columns: 3});
        assertColumns(field, 3);
      });
      test('JSON Definition', function () {
        const field = FieldColour.fromJson({
          colour: '#ffffff',
          columns: 3,
        });
        assertColumns(field, 3);
      });
      test('setColumns', function () {
        const field = new FieldColour();
        field.setColumns(3);
        assertColumns(field, 3);
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
        const field = new FieldColour(value);
        block.getInput('INPUT').appendField(field, 'COLOUR');
        const jso = Blockly.serialization.blocks.save(block);
        assert.deepEqual(jso['fields'], {COLOUR: value});
      };
    });

    teardown(function () {
      this.workspace.dispose();
    });

    test('Three char', function () {
      this.assertValue('#001122');
    });

    test('Six char', function () {
      this.assertValue('#012345');
    });
  });
});
