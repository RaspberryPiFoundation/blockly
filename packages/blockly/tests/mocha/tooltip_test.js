/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('Tooltip', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();

    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'test_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'field_input',
            'name': 'FIELD',
          },
        ],
      },
    ]);
  });

  teardown(function () {
    delete Blockly.Blocks['test_block'];
    sharedTestTeardown.call(this);
  });

  suite('Custom Tooltip', function () {
    setup(function () {
      this.renderedWorkspace = Blockly.inject('blocklyDiv', {});
    });

    teardown(function () {
      workspaceTeardown.call(this, this.renderedWorkspace);
    });

    test('Custom function is called', function () {
      // Custom tooltip function is registered and should be called when mouse
      // events are fired.
      let wasCalled = false;
      const customFn = function () {
        wasCalled = true;
      };
      Blockly.Tooltip.setCustomTooltip(customFn);

      this.block = this.renderedWorkspace.newBlock('test_block');
      this.block.setTooltip('Test Tooltip');

      // Fire pointer events directly on the relevant SVG.
      this.block.pathObject.svgPath.dispatchEvent(
        new PointerEvent('pointerover'),
      );
      this.block.pathObject.svgPath.dispatchEvent(
        new PointerEvent('pointermove'),
      );
      this.clock.runAll();

      assert.isTrue(
        wasCalled,
        'Expected custom tooltip function to have been called',
      );
    });
  });

  suite('set/getTooltip', function () {
    const tooltipText = 'testTooltip';

    function assertTooltip(obj) {
      assert.equal(obj.getTooltip(), tooltipText);
    }

    function setStringTooltip(obj) {
      obj.setTooltip(tooltipText);
    }

    function setFunctionTooltip(obj) {
      obj.setTooltip(() => tooltipText);
    }

    function setNestedFunctionTooltip(obj) {
      function nestFunction(fn, count) {
        if (!count) {
          return fn;
        }
        return () => nestFunction(fn, --count);
      }
      obj.setTooltip(nestFunction(() => tooltipText, 5));
    }

    function setFunctionReturningObjectTooltip(obj) {
      obj.setTooltip(() => {
        return {
          tooltip: tooltipText,
        };
      });
    }

    function setObjectTooltip(obj) {
      obj.setTooltip({tooltip: tooltipText});
    }

    suite('Headless Blocks', function () {
      setup(function () {
        this.block = this.workspace.newBlock('test_block');
      });

      test('String', function () {
        setStringTooltip(this.block);
        assertTooltip(this.block);
      });

      test('Function', function () {
        setFunctionTooltip(this.block);
        assertTooltip(this.block);
      });

      test('Nested Function', function () {
        setNestedFunctionTooltip(this.block);
        assertTooltip(this.block);
      });

      test('Function returning object', function () {
        setFunctionReturningObjectTooltip(this.block);
        assert.throws(
          this.block.getTooltip.bind(this.block),
          'Tooltip function must return a string.',
        );
      });

      test('Object', function () {
        setObjectTooltip(this.block);
        assertTooltip(this.block);
      });
    });

    suite('Rendered Blocks', function () {
      setup(function () {
        this.renderedWorkspace = Blockly.inject('blocklyDiv');
        this.block = this.renderedWorkspace.newBlock('test_block');
        this.block.initSvg();
        this.block.render();
      });

      teardown(function () {
        workspaceTeardown.call(this, this.renderedWorkspace);
      });

      test('String', function () {
        setStringTooltip(this.block);
        assertTooltip(this.block);
      });

      test('Function', function () {
        setFunctionTooltip(this.block);
        assertTooltip(this.block);
      });

      test('Nested Function', function () {
        setNestedFunctionTooltip(this.block);
        assertTooltip(this.block);
      });

      test('Function returning object', function () {
        setFunctionReturningObjectTooltip(this.block);
        assert.throws(
          this.block.getTooltip.bind(this.block),
          'Tooltip function must return a string.',
        );
      });

      test('Object', function () {
        setObjectTooltip(this.block);
        assertTooltip(this.block);
      });
    });

    suite('Headless Fields', function () {
      setup(function () {
        this.block = this.workspace.newBlock('test_block');
        this.field = this.block.getField('FIELD');
      });

      test('String', function () {
        setStringTooltip(this.field);
        assertTooltip(this.field);
      });

      test('Function', function () {
        setFunctionTooltip(this.field);
        assertTooltip(this.field);
      });

      test('Nested Function', function () {
        setNestedFunctionTooltip(this.field);
        assertTooltip(this.field);
      });

      test('Function returning object', function () {
        setFunctionReturningObjectTooltip(this.field);
        assert.throws(
          this.field.getTooltip.bind(this.field),
          'Tooltip function must return a string.',
        );
      });

      test('Object', function () {
        setObjectTooltip(this.field);
        assertTooltip(this.field);
      });

      test('Null', function () {
        setStringTooltip(this.block);
        this.field.setTooltip(null);
        assertTooltip(this.field);
      });
    });

    suite('Rendered Fields', function () {
      setup(function () {
        this.renderedWorkspace = Blockly.inject('blocklyDiv');
        this.block = this.renderedWorkspace.newBlock('test_block');
        this.block.initSvg();
        this.block.render();
        this.field = this.block.getField('FIELD');
      });

      teardown(function () {
        workspaceTeardown.call(this, this.renderedWorkspace);
      });

      test('String', function () {
        setStringTooltip(this.field);
        assertTooltip(this.field);
      });

      test('Function', function () {
        setFunctionTooltip(this.field);
        assertTooltip(this.field);
      });

      test('Nested Function', function () {
        setNestedFunctionTooltip(this.field);
        assertTooltip(this.field);
      });

      test('Function returning object', function () {
        setFunctionReturningObjectTooltip(this.field);
        assert.throws(
          this.field.getTooltip.bind(this.field),
          'Tooltip function must return a string.',
        );
      });

      test('Object', function () {
        setObjectTooltip(this.field);
        assertTooltip(this.field);
      });

      test('Null', function () {
        setStringTooltip(this.block);
        this.field.setTooltip(null);
        assertTooltip(this.field);
      });
    });
  });
});
