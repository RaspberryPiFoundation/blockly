/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Field Registry', function () {
  class CustomFieldType extends Blockly.Field {
    constructor(value) {
      super(value);
    }

    static fromJson(options) {
      return new CustomFieldType(options['value']);
    }
  }

  setup(function () {
    sharedTestSetup.call(this);
  });
  teardown(function () {
    sharedTestTeardown.call(this);
    if (Blockly.registry.TEST_ONLY.typeMap['field']['field_custom_test']) {
      delete Blockly.registry.TEST_ONLY.typeMap['field']['field_custom_test'];
    }
  });

  suite('Registration', function () {
    test('Simple', function () {
      Blockly.fieldRegistry.register('field_custom_test', CustomFieldType);
    });
    test('fromJson as Key', function () {
      assert.throws(function () {
        Blockly.fieldRegistry.register(CustomFieldType.fromJson, '');
      }, 'Invalid name');
    });
    test('No fromJson', function () {
      class IncorrectField {}
      assert.throws(function () {
        Blockly.fieldRegistry.register('field_custom_test', IncorrectField);
      }, 'must have a fromJson function');
    });
    test('fromJson not a function', function () {
      const fromJson = CustomFieldType.fromJson;
      CustomFieldType.fromJson = true;
      assert.throws(function () {
        Blockly.fieldRegistry.register('field_custom_test', CustomFieldType);
      }, 'must have a fromJson function');
      CustomFieldType.fromJson = fromJson;
    });
  });
  suite('Retrieval', function () {
    test('Simple', function () {
      Blockly.fieldRegistry.register('field_custom_test', CustomFieldType);

      const json = {
        type: 'field_custom_test',
        value: 'ok',
      };

      const field = Blockly.fieldRegistry.fromJson(json);

      assert.isNotNull(field);
      assert.equal(field.getValue(), 'ok');
    });
    test('Not Registered', function () {
      const json = {
        type: 'field_custom_test',
        value: 'ok',
      };

      const spy = sinon.stub(console, 'warn');
      const field = Blockly.fieldRegistry.fromJson(json);
      assert.isNull(field);
      assert.isTrue(spy.called);
      spy.restore();
    });
    test('Case Different', function () {
      Blockly.fieldRegistry.register('field_custom_test', CustomFieldType);

      const json = {
        type: 'FIELD_CUSTOM_TEST',
        value: 'ok',
      };

      const field = Blockly.fieldRegistry.fromJson(json);

      assert.isNotNull(field);
      assert.equal(field.getValue(), 'ok');
    });
    test('Did not override fromJson', function () {
      // This class will have a fromJson method, so it can be registered
      // but it doesn't override the abstract class's method so it throws
      class IncorrectField extends Blockly.Field {}

      Blockly.fieldRegistry.register('field_custom_test', IncorrectField);

      const json = {
        type: 'field_custom_test',
        value: 'ok',
      };

      assert.throws(function () {
        Blockly.fieldRegistry.fromJson(json);
      }, 'Attempted to instantiate a field from the registry');
    });
  });
});
