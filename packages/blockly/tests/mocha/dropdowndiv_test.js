/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Rect} from '../../build/src/core/utils/rect.js';
import * as style from '../../build/src/core/utils/style.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('DropDownDiv', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = Blockly.inject('blocklyDiv');
    this.setUpBlockWithField = function () {
      const blockJson = {
        'type': 'text',
        'id': 'block_id',
        'x': 10,
        'y': 20,
        'fields': {
          'TEXT': '',
        },
      };
      Blockly.serialization.blocks.append(blockJson, this.workspace);
      return this.workspace.getBlockById('block_id');
    };
    // The workspace needs to be visible for focus-specific tests.
    document.getElementById('blocklyDiv').style.visibility = 'visible';
  });
  teardown(function () {
    sharedTestTeardown.call(this);
    document.getElementById('blocklyDiv').style.visibility = 'hidden';
  });

  suite('Positioning', function () {
    setup(function () {
      this.boundsStub = sinon
        .stub(Blockly.DropDownDiv.TEST_ONLY, 'getBoundsInfo')
        .returns({
          left: 0,
          right: 100,
          top: 0,
          bottom: 100,
          width: 100,
          height: 100,
        });
      this.sizeStub = sinon
        .stub(Blockly.utils.style.TEST_ONLY, 'getSizeInternal')
        .returns({
          width: 60,
          height: 60,
        });
      this.clientHeightStub = sinon
        .stub(document.documentElement, 'clientHeight')
        .get(function () {
          return 1000;
        });
      this.clientTopStub = sinon
        .stub(document.documentElement, 'clientTop')
        .get(function () {
          return 0;
        });
    });
    test('Below, in Bounds', function () {
      const metrics = Blockly.DropDownDiv.TEST_ONLY.getPositionMetrics(
        50,
        0,
        50,
        -10,
      );
      // "Above" in value actually means below in render.
      assert.isAtLeast(metrics.initialY, 0);
      assert.isAbove(metrics.finalY, 0);
      assert.isTrue(metrics.arrowVisible);
      assert.isTrue(metrics.arrowAtTop);
    });
    test('Above, in Bounds', function () {
      const metrics = Blockly.DropDownDiv.TEST_ONLY.getPositionMetrics(
        50,
        100,
        50,
        90,
      );
      // "Below" in value actually means above in render.
      assert.isAtMost(metrics.initialY, 100);
      assert.isBelow(metrics.finalY, 100);
      assert.isTrue(metrics.arrowVisible);
      assert.isFalse(metrics.arrowAtTop);
    });
    test('Below, out of Bounds', function () {
      const metrics = Blockly.DropDownDiv.TEST_ONLY.getPositionMetrics(
        50,
        60,
        50,
        50,
      );
      // "Above" in value actually means below in render.
      assert.isAtLeast(metrics.initialY, 60);
      assert.isAbove(metrics.finalY, 60);
      assert.isTrue(metrics.arrowVisible);
      assert.isTrue(metrics.arrowAtTop);
    });
    test('Above, in Bounds', function () {
      const metrics = Blockly.DropDownDiv.TEST_ONLY.getPositionMetrics(
        50,
        100,
        50,
        90,
      );
      // "Below" in value actually means above in render.
      assert.isAtMost(metrics.initialY, 100);
      assert.isBelow(metrics.finalY, 100);
      assert.isTrue(metrics.arrowVisible);
      assert.isFalse(metrics.arrowAtTop);
    });
    test('No Solution, Render At Top', function () {
      this.clientHeightStub.get(function () {
        return 100;
      });
      const metrics = Blockly.DropDownDiv.TEST_ONLY.getPositionMetrics(
        50,
        60,
        50,
        50,
      );
      // "Above" in value actually means below in render.
      assert.equal(metrics.initialY, 0);
      assert.equal(metrics.finalY, 0);
      assert.isFalse(metrics.arrowVisible);
      assert.isNotOk(metrics.arrowAtTop);
    });
  });

  suite('Keyboard Shortcuts', function () {
    setup(function () {
      this.boundsStub = sinon
        .stub(Blockly.DropDownDiv.TEST_ONLY, 'getBoundsInfo')
        .returns({
          left: 0,
          right: 100,
          top: 0,
          bottom: 100,
          width: 100,
          height: 100,
        });
      this.workspace = Blockly.inject('blocklyDiv', {});
    });
    teardown(function () {
      this.boundsStub.restore();
    });
    test('Escape dismisses DropDownDiv', function () {
      let hidden = false;
      Blockly.DropDownDiv.show(this, false, 0, 0, 0, 0, false, () => {
        hidden = true;
      });
      assert.isFalse(hidden);
      Blockly.DropDownDiv.getContentDiv().dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27, // example values.
        }),
      );
      assert.isTrue(hidden);
    });
  });

  suite('show()', function () {
    test('without bounds set throws error', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];

      const errorMsgRegex = /Cannot read properties of null.+?/;
      assert.throws(
        () => Blockly.DropDownDiv.show(field, false, 50, 60, 70, 80, false),
        errorMsgRegex,
      );
    });

    test('with bounds set positions and shows div near specified location', function () {
      Blockly.DropDownDiv.setBoundsElement(document.body);
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];

      Blockly.DropDownDiv.show(field, false, 50, 60, 70, 80, false);

      const dropDownDivElem = document.querySelector('.blocklyDropDownDiv');
      assert.strictEqual(dropDownDivElem.style.opacity, '1');
      assert.strictEqual(dropDownDivElem.style.left, '45px');
      assert.strictEqual(dropDownDivElem.style.top, '60px');
    });
  });

  suite('showPositionedByField()', function () {
    test('shows div near field', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      const fieldBounds = field.getScaledBBox();

      Blockly.DropDownDiv.showPositionedByField(field);

      // The div should show below the field and centered horizontally.
      const dropDownDivElem = document.querySelector('.blocklyDropDownDiv');
      const divWidth = style.getSize(dropDownDivElem).width;
      const expectedLeft = Math.floor(
        fieldBounds.left + fieldBounds.getWidth() / 2 - divWidth / 2,
      );
      const expectedTop = Math.floor(fieldBounds.bottom); // Should show beneath.
      assert.strictEqual(dropDownDivElem.style.opacity, '1');
      assert.strictEqual(dropDownDivElem.style.left, `${expectedLeft}px`);
      assert.strictEqual(dropDownDivElem.style.top, `${expectedTop}px`);
    });

    test('with hide callback does not call callback', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      const onHideCallback = sinon.stub();

      Blockly.DropDownDiv.showPositionedByField(field, onHideCallback);

      // Simply showing the div should never call the hide callback.
      assert.strictEqual(onHideCallback.callCount, 0);
    });

    test('without managed ephemeral focus does not change focused node', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);

      Blockly.DropDownDiv.showPositionedByField(field, null, null, false);

      // Since managing ephemeral focus is disabled the current focused node shouldn't be changed.
      const blockFocusableElem = block.getFocusableElement();
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
      assert.strictEqual(document.activeElement, blockFocusableElem);
    });

    test('with managed ephemeral focus focuses drop-down div', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);

      Blockly.DropDownDiv.showPositionedByField(field, null, null, true);

      // Managing ephemeral focus won't change getFocusedNode() but will change the actual element
      // with DOM focus.
      const dropDownDivElem = document.querySelector('.blocklyDropDownDiv');
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
      assert.strictEqual(document.activeElement, dropDownDivElem);
    });
  });

  suite('showPositionedByBlock()', function () {
    test('shows div near block', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      // Note that the offset must be computed before showing the div since otherwise it can move
      // slightly after the div is shown.
      const blockOffset = style.getPageOffset(block.getSvgRoot());

      Blockly.DropDownDiv.showPositionedByBlock(field, block);

      // The div should show below the block and centered horizontally.
      const blockLocalBounds = block.getBoundingRectangle();
      const blockBounds = Rect.createFromPoint(
        blockOffset,
        blockLocalBounds.getWidth(),
        blockLocalBounds.getHeight(),
      );
      const dropDownDivElem = document.querySelector('.blocklyDropDownDiv');
      const divWidth = style.getSize(dropDownDivElem).width;
      const expectedLeft = Math.floor(
        blockBounds.left + blockBounds.getWidth() / 2 - divWidth / 2,
      );
      const expectedTop = Math.floor(blockBounds.bottom); // Should show beneath.
      assert.strictEqual(dropDownDivElem.style.opacity, '1');
      assert.strictEqual(dropDownDivElem.style.left, `${expectedLeft}px`);
      assert.strictEqual(dropDownDivElem.style.top, `${expectedTop}px`);
    });

    test('with hide callback does not call callback', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      const onHideCallback = sinon.stub();

      Blockly.DropDownDiv.showPositionedByBlock(field, block, onHideCallback);

      // Simply showing the div should never call the hide callback.
      assert.strictEqual(onHideCallback.callCount, 0);
    });

    test('without managed ephemeral focus does not change focused node', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);

      Blockly.DropDownDiv.showPositionedByBlock(
        field,
        block,
        null,
        null,
        false,
      );

      // Since managing ephemeral focus is disabled the current focused node shouldn't be changed.
      const blockFocusableElem = block.getFocusableElement();
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
      assert.strictEqual(document.activeElement, blockFocusableElem);
    });

    test('with managed ephemeral focus focuses drop-down div', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);

      Blockly.DropDownDiv.showPositionedByBlock(field, block, null, null, true);

      // Managing ephemeral focus won't change getFocusedNode() but will change the actual element
      // with DOM focus.
      const dropDownDivElem = document.querySelector('.blocklyDropDownDiv');
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
      assert.strictEqual(document.activeElement, dropDownDivElem);
    });
  });

  suite('hideWithoutAnimation()', function () {
    test('when not showing drop-down div keeps opacity at 0', function () {
      Blockly.DropDownDiv.hideWithoutAnimation();

      const dropDownDivElem = document.querySelector('.blocklyDropDownDiv');
      assert.strictEqual(dropDownDivElem.style.opacity, '0');
    });

    suite('for div positioned by field', function () {
      test('hides div', function () {
        const block = this.setUpBlockWithField();
        const field = Array.from(block.getFields())[0];
        Blockly.DropDownDiv.showPositionedByField(field);

        Blockly.DropDownDiv.hideWithoutAnimation();

        // Technically this will trigger a CSS animation, but the property is still set to 0.
        const dropDownDivElem = document.querySelector('.blocklyDropDownDiv');
        assert.strictEqual(dropDownDivElem.style.opacity, '0');
      });

      test('hide callback calls callback', function () {
        const block = this.setUpBlockWithField();
        const field = Array.from(block.getFields())[0];
        const onHideCallback = sinon.stub();
        Blockly.DropDownDiv.showPositionedByField(field, onHideCallback);

        Blockly.DropDownDiv.hideWithoutAnimation();

        // Hiding the div should trigger the hide callback.
        assert.strictEqual(onHideCallback.callCount, 1);
      });

      test('without ephemeral focus does not change focus', function () {
        const block = this.setUpBlockWithField();
        const field = Array.from(block.getFields())[0];
        Blockly.getFocusManager().focusNode(block);
        Blockly.DropDownDiv.showPositionedByField(field, null, null, false);

        Blockly.DropDownDiv.hideWithoutAnimation();

        // Hiding the div shouldn't change what would have already been focused.
        const blockFocusableElem = block.getFocusableElement();
        assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
        assert.strictEqual(document.activeElement, blockFocusableElem);
      });

      test('with ephemeral focus restores DOM focus', function () {
        const block = this.setUpBlockWithField();
        const field = Array.from(block.getFields())[0];
        Blockly.getFocusManager().focusNode(block);
        Blockly.DropDownDiv.showPositionedByField(field, null, null, true);

        Blockly.DropDownDiv.hideWithoutAnimation();

        // Hiding the div should restore focus back to the block.
        const blockFocusableElem = block.getFocusableElement();
        assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
        assert.strictEqual(document.activeElement, blockFocusableElem);
      });
    });

    suite('for div positioned by block', function () {
      test('hides div', function () {
        const block = this.setUpBlockWithField();
        const field = Array.from(block.getFields())[0];
        Blockly.DropDownDiv.showPositionedByBlock(field, block);

        Blockly.DropDownDiv.hideWithoutAnimation();

        // Technically this will trigger a CSS animation, but the property is still set to 0.
        const dropDownDivElem = document.querySelector('.blocklyDropDownDiv');
        assert.strictEqual(dropDownDivElem.style.opacity, '0');
      });

      test('hide callback calls callback', function () {
        const block = this.setUpBlockWithField();
        const field = Array.from(block.getFields())[0];
        const onHideCallback = sinon.stub();
        Blockly.DropDownDiv.showPositionedByBlock(field, block, onHideCallback);

        Blockly.DropDownDiv.hideWithoutAnimation();

        // Hiding the div should trigger the hide callback.
        assert.strictEqual(onHideCallback.callCount, 1);
      });

      test('without ephemeral focus does not change focus', function () {
        const block = this.setUpBlockWithField();
        const field = Array.from(block.getFields())[0];
        Blockly.getFocusManager().focusNode(block);
        Blockly.DropDownDiv.showPositionedByBlock(
          field,
          block,
          null,
          null,
          false,
        );

        Blockly.DropDownDiv.hideWithoutAnimation();

        // Hiding the div shouldn't change what would have already been focused.
        const blockFocusableElem = block.getFocusableElement();
        assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
        assert.strictEqual(document.activeElement, blockFocusableElem);
      });

      test('with ephemeral focus restores DOM focus', function () {
        const block = this.setUpBlockWithField();
        const field = Array.from(block.getFields())[0];
        Blockly.getFocusManager().focusNode(block);
        Blockly.DropDownDiv.showPositionedByBlock(
          field,
          block,
          null,
          null,
          true,
        );

        Blockly.DropDownDiv.hideWithoutAnimation();

        // Hiding the div should restore focus back to the block.
        const blockFocusableElem = block.getFocusableElement();
        assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
        assert.strictEqual(document.activeElement, blockFocusableElem);
      });
    });
  });
});
