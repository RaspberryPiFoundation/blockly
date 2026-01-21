/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  assertFieldValue,
  runConstructorSuiteTests,
  runFromJsonSuiteTests,
  runSetValueTests,
} from './test_helpers/fields.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Image Fields', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = Blockly.inject('blocklyDiv');
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });
  /**
   * Configuration for field tests with invalid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const invalidValueTestCases = [
    {
      title: 'Undefined Size',
      value: 'src',
      args: ['src', undefined, undefined],
    },
    {title: 'Zero Size', value: 'src', args: ['src', 0, 0]},
    {
      title: 'Non-Parsable String for Size',
      value: 'src',
      args: ['src', 'bad', 'bad'],
    },
  ];
  /**
   * Configuration for field tests with valid values.
   * @type {!Array<!FieldCreationTestCase>}
   */
  const validValueCreationTestCases = [
    {
      title: 'With Alt',
      value: 'src',
      expectedValue: 'src',
      args: ['src', 1, 1, 'alt'],
      expectedText: 'alt',
    },
    {
      title: 'Without Alt',
      value: 'src',
      expectedValue: 'src',
      args: ['src', 1, 1],
      expectedText: '',
    },
  ];
  /**
   * Adds json property to test cases based on args property.
   * @param {!Array<!FieldCreationTestCase>} testCase The test case to modify.
   */
  const addJson = function (testCase) {
    testCase.json = {
      'src': testCase.args[0],
      'width': testCase.args[1],
      'height': testCase.args[2],
    };
    if (testCase.args[3]) {
      testCase.json['alt'] = testCase.args[3];
    }
  };
  invalidValueTestCases.forEach(addJson);
  validValueCreationTestCases.forEach(addJson);

  /**
   * Asserts that the field properties are correct based on the test case.
   * @param {!Blockly.FieldImage} field The field to check.
   * @param {!FieldValueTestCase} testCase The test case.
   */
  const validTestCaseAssertField = function (field, testCase) {
    assertFieldValue(field, testCase.expectedValue, testCase.expectedText);
  };

  runConstructorSuiteTests(
    Blockly.FieldImage,
    validValueCreationTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
  );

  runFromJsonSuiteTests(
    Blockly.FieldImage,
    validValueCreationTestCases,
    invalidValueTestCases,
    validTestCaseAssertField,
  );

  /**
   * Configuration for field tests with valid values.
   * @type {!Array<!FieldValueTestCase>}
   */
  const validValueSetValueTestCases = [
    {
      title: 'Good src',
      value: 'newSrc',
      expectedValue: 'newSrc',
      expectedText: 'alt',
    },
  ];

  suite('setValue', function () {
    setup(function () {
      this.field = new Blockly.FieldImage('src', 1, 1, 'alt');
    });
    runSetValueTests(
      validValueSetValueTestCases,
      invalidValueTestCases,
      'src',
      'alt',
    );
  });

  suite('Customizations', function () {
    suite('On Click Handler', function () {
      setup(function () {
        this.onClick = function () {
          console.log('on click');
        };
      });
      test('JS Constructor', function () {
        const field = new Blockly.FieldImage('src', 10, 10, null, this.onClick);
        assert.equal(field.clickHandler, this.onClick);
      });
      test('setOnClickHandler', function () {
        const field = new Blockly.FieldImage('src', 10, 10);
        field.setOnClickHandler(this.onClick);
        assert.equal(field.clickHandler, this.onClick);
      });
      test('Remove Click Handler', function () {
        const field = new Blockly.FieldImage('src', 10, 10, null, this.onClick);
        field.setOnClickHandler(null);
        assert.isNull(field.clickHandler);
      });
    });
    suite('Alt', function () {
      test('JS Constructor', function () {
        const field = new Blockly.FieldImage('src', 10, 10, 'alt');
        assert.equal(field.getText(), 'alt');
      });
      test('JSON Definition', function () {
        const field = Blockly.FieldImage.fromJson({
          src: 'src',
          width: 10,
          height: 10,
          alt: 'alt',
        });
        assert.equal(field.getText(), 'alt');
      });
      suite('SetAlt', function () {
        setup(function () {
          this.imageField = new Blockly.FieldImage('src', 10, 10, 'alt');
        });
        test('Null', function () {
          this.imageField.setAlt(null);
          assertFieldValue(this.imageField, 'src', '');
        });
        test('Empty String', function () {
          this.imageField.setAlt('');
          assertFieldValue(this.imageField, 'src', '');
        });
        test('Good Alt', function () {
          this.imageField.setAlt('newAlt');
          assertFieldValue(this.imageField, 'src', 'newAlt');
        });
      });
      test('JS Configuration - Simple', function () {
        const field = new Blockly.FieldImage('src', 10, 10, null, null, null, {
          alt: 'alt',
        });
        assert.equal(field.getText(), 'alt');
      });
      test('JS Configuration - Ignore', function () {
        const field = new Blockly.FieldImage('src', 10, 10, 'alt', null, null, {
          alt: 'configAlt',
        });
        assert.equal(field.getText(), 'configAlt');
      });
      test("JS Configuration - Ignore - ''", function () {
        const field = new Blockly.FieldImage('src', 10, 10, '', null, null, {
          alt: 'configAlt',
        });
        assert.equal(field.getText(), 'configAlt');
      });
      test("JS Configuration - Ignore - Config ''", function () {
        const field = new Blockly.FieldImage('src', 10, 10, 'alt', null, null, {
          alt: '',
        });
        assert.equal(field.getText(), '');
      });
    });
    suite('Flip RTL', function () {
      test('JS Constructor', function () {
        const field = new Blockly.FieldImage('src', 10, 10, null, null, true);
        assert.isTrue(field.getFlipRtl());
      });
      test('JSON Definition', function () {
        const field = Blockly.FieldImage.fromJson({
          src: 'src',
          width: 10,
          height: 10,
          flipRtl: true,
        });
        assert.isTrue(field.getFlipRtl());
      });
      test('JS Configuration - Simple', function () {
        const field = new Blockly.FieldImage('src', 10, 10, null, null, null, {
          flipRtl: true,
        });
        assert.isTrue(field.getFlipRtl());
      });
      test('JS Configuration - Ignore - True', function () {
        const field = new Blockly.FieldImage('src', 10, 10, null, null, true, {
          flipRtl: false,
        });
        assert.isFalse(field.getFlipRtl());
      });
      test('JS Configuration - Ignore - False', function () {
        const field = new Blockly.FieldImage('src', 10, 10, null, null, false, {
          flipRtl: true,
        });
        assert.isTrue(field.getFlipRtl());
      });
    });
    suite('isClickable', function () {
      setup(function () {
        this.onClick = function () {
          console.log('on click');
        };
        this.setUpBlockWithFieldImages = function () {
          const blockJson = {
            'type': 'text',
            'id': 'block_id',
            'x': 0,
            'y': 0,
            'fields': {
              'TEXT': '',
            },
          };
          Blockly.serialization.blocks.append(blockJson, this.workspace);
          return this.workspace.getBlockById('block_id');
        };
        this.extractFieldImage = function (block) {
          const fields = Array.from(block.getFields());
          // Sanity check (as a precondition).
          assert.strictEqual(fields.length, 3);
          const imageField = fields[0];
          // Sanity check (as a precondition).
          assert.isTrue(imageField instanceof Blockly.FieldImage);
          return imageField;
        };
      });

      test('Unattached field without click handler returns false', function () {
        const field = new Blockly.FieldImage('src', 10, 10, null);

        const isClickable = field.isClickable();

        assert.isFalse(isClickable);
      });
      test('Unattached field with click handler returns false', function () {
        const field = new Blockly.FieldImage('src', 10, 10, this.onClick);

        const isClickable = field.isClickable();

        assert.isFalse(isClickable);
      });
      test('For attached but disabled field without click handler returns false', function () {
        const block = this.setUpBlockWithFieldImages();
        const field = this.extractFieldImage(block);
        field.setEnabled(false);

        const isClickable = field.isClickable();

        assert.isFalse(isClickable);
      });
      test('For attached but disabled field with click handler returns false', function () {
        const block = this.setUpBlockWithFieldImages();
        const field = this.extractFieldImage(block);
        field.setEnabled(false);
        field.setOnClickHandler(this.onClick);

        const isClickable = field.isClickable();

        assert.isFalse(isClickable);
      });
      test('For attached, enabled, but not editable field without click handler returns false', function () {
        const block = this.setUpBlockWithFieldImages();
        const field = this.extractFieldImage(block);
        block.setEditable(false);

        const isClickable = field.isClickable();

        assert.isFalse(isClickable);
      });
      test('For attached, enabled, but not editable field with click handler returns false', function () {
        const block = this.setUpBlockWithFieldImages();
        const field = this.extractFieldImage(block);
        block.setEditable(false);
        field.setOnClickHandler(this.onClick);

        const isClickable = field.isClickable();

        assert.isFalse(isClickable);
      });
      test('For attached, enabled, editable field without click handler returns false', function () {
        const block = this.setUpBlockWithFieldImages();
        const field = this.extractFieldImage(block);

        const isClickable = field.isClickable();

        assert.isFalse(isClickable);
      });
      test('For attached, enabled, editable field with click handler returns true', function () {
        const block = this.setUpBlockWithFieldImages();
        const field = this.extractFieldImage(block);
        field.setOnClickHandler(this.onClick);

        const isClickable = field.isClickable();

        assert.isTrue(isClickable);
      });
      test('For attached, enabled, editable field with removed click handler returns false', function () {
        const block = this.setUpBlockWithFieldImages();
        const field = this.extractFieldImage(block);
        field.setOnClickHandler(this.onClick);
        field.setOnClickHandler(null);

        const isClickable = field.isClickable();

        assert.isFalse(isClickable);
      });
    });
  });
});
