/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import type sinon from 'sinon';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

type Tooltipable = Blockly.Block | Blockly.Field;

suite('Tooltip', function () {
  let workspace: Blockly.Workspace;
  let clock: sinon.SinonFakeTimers;

  setup(function (this: Mocha.Context) {
    ({clock} = sharedTestSetup.call(this));
    workspace = new Blockly.Workspace();

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

  teardown(function (this: Mocha.Context) {
    delete Blockly.Blocks['test_block'];
    sharedTestTeardown.call(this, workspace);
  });

  suite('Custom Tooltip', function () {
    let renderedWorkspace: Blockly.WorkspaceSvg;

    setup(function () {
      renderedWorkspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
    });

    teardown(function (this: Mocha.Context) {
      workspaceTeardown.call(this, renderedWorkspace);
    });

    test('Custom function is called', function () {
      // Custom tooltip function is registered and should be called when mouse
      // events are fired.
      let wasCalled = false;
      const customFn = function () {
        wasCalled = true;
      };
      Blockly.Tooltip.setCustomTooltip(customFn);

      const block = renderedWorkspace.newBlock('test_block');
      block.setTooltip('Test Tooltip');

      // Fire pointer events directly on the relevant SVG.
      block.pathObject.svgPath.dispatchEvent(new PointerEvent('pointerover'));
      block.pathObject.svgPath.dispatchEvent(new PointerEvent('pointermove'));
      clock.runAll();

      assert.isTrue(
        wasCalled,
        'Expected custom tooltip function to have been called',
      );
    });
  });

  suite('set/getTooltip', function () {
    const tooltipText = 'testTooltip';

    function assertTooltip(obj: Tooltipable) {
      assert.equal(obj.getTooltip(), tooltipText);
    }

    function setStringTooltip(obj: Tooltipable) {
      obj.setTooltip(tooltipText);
    }

    function setFunctionTooltip(obj: Tooltipable) {
      obj.setTooltip(() => tooltipText);
    }

    function setNestedFunctionTooltip(obj: Tooltipable) {
      function nestFunction(
        fn: () => string,
        count: number,
      ): Blockly.Tooltip.TipInfo {
        if (!count) {
          return fn;
        }
        return () => nestFunction(fn, --count);
      }
      obj.setTooltip(nestFunction(() => tooltipText, 5));
    }

    function setFunctionReturningObjectTooltip(obj: Tooltipable) {
      obj.setTooltip(() => {
        return {
          tooltip: tooltipText,
        };
      });
    }

    function setObjectTooltip(obj: Tooltipable) {
      obj.setTooltip({tooltip: tooltipText});
    }

    suite('Headless Blocks', function () {
      let block: Blockly.Block;

      setup(function () {
        block = workspace.newBlock('test_block');
      });

      test('String', function () {
        setStringTooltip(block);
        assertTooltip(block);
      });

      test('Function', function () {
        setFunctionTooltip(block);
        assertTooltip(block);
      });

      test('Nested Function', function () {
        setNestedFunctionTooltip(block);
        assertTooltip(block);
      });

      test('Function returning object', function () {
        setFunctionReturningObjectTooltip(block);
        assert.throws(
          block.getTooltip.bind(block),
          'Tooltip function must return a string.',
        );
      });

      test('Object', function () {
        setObjectTooltip(block);
        assertTooltip(block);
      });
    });

    suite('Rendered Blocks', function () {
      let renderedWorkspace: Blockly.WorkspaceSvg;
      let block: Blockly.BlockSvg;

      setup(function () {
        renderedWorkspace = Blockly.inject(
          'blocklyDiv',
          DEFAULT_INJECT_OPTIONS,
        );
        block = renderedWorkspace.newBlock('test_block');
        block.initSvg();
        block.render();
      });

      teardown(function (this: Mocha.Context) {
        workspaceTeardown.call(this, renderedWorkspace);
      });

      test('String', function () {
        setStringTooltip(block);
        assertTooltip(block);
      });

      test('Function', function () {
        setFunctionTooltip(block);
        assertTooltip(block);
      });

      test('Nested Function', function () {
        setNestedFunctionTooltip(block);
        assertTooltip(block);
      });

      test('Function returning object', function () {
        setFunctionReturningObjectTooltip(block);
        assert.throws(
          block.getTooltip.bind(block),
          'Tooltip function must return a string.',
        );
      });

      test('Object', function () {
        setObjectTooltip(block);
        assertTooltip(block);
      });
    });

    suite('Headless Fields', function () {
      let block: Blockly.Block;
      let field: Blockly.Field<any>;

      setup(function () {
        block = workspace.newBlock('test_block');
        const field_ = block.getField('FIELD');
        assert.isNotNull(field_);
        field = field_;
      });

      test('String', function () {
        setStringTooltip(field);
        assertTooltip(field);
      });

      test('Function', function () {
        setFunctionTooltip(field);
        assertTooltip(field);
      });

      test('Nested Function', function () {
        setNestedFunctionTooltip(field);
        assertTooltip(field);
      });

      test('Function returning object', function () {
        setFunctionReturningObjectTooltip(field);
        assert.throws(
          field.getTooltip.bind(field),
          'Tooltip function must return a string.',
        );
      });

      test('Object', function () {
        setObjectTooltip(field);
        assertTooltip(field);
      });

      test('Null', function () {
        setStringTooltip(block);
        field.setTooltip(null);
        assertTooltip(field);
      });
    });

    suite('Rendered Fields', function () {
      let renderedWorkspace: Blockly.WorkspaceSvg;
      let block: Blockly.BlockSvg;
      let field: Blockly.Field<any>;

      setup(function () {
        renderedWorkspace = Blockly.inject(
          'blocklyDiv',
          DEFAULT_INJECT_OPTIONS,
        );
        block = renderedWorkspace.newBlock('test_block');
        block.initSvg();
        block.render();
        const field_ = block.getField('FIELD');
        assert.isNotNull(field_);
        field = field_;
      });

      teardown(function (this: Mocha.Context) {
        workspaceTeardown.call(this, renderedWorkspace);
      });

      test('String', function () {
        setStringTooltip(field);
        assertTooltip(field);
      });

      test('Function', function () {
        setFunctionTooltip(field);
        assertTooltip(field);
      });

      test('Nested Function', function () {
        setNestedFunctionTooltip(field);
        assertTooltip(field);
      });

      test('Function returning object', function () {
        setFunctionReturningObjectTooltip(field);
        assert.throws(
          field.getTooltip.bind(field),
          'Tooltip function must return a string.',
        );
      });

      test('Object', function () {
        setObjectTooltip(field);
        assertTooltip(field);
      });

      test('Null', function () {
        setStringTooltip(block);
        field.setTooltip(null);
        assertTooltip(field);
      });
    });
  });
});
