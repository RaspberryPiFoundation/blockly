/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('WidgetDiv', function () {
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

  suite('positionWithAnchor', function () {
    function makeBBox(left, top, width, height) {
      return {
        left: left,
        right: left + width,
        top: top,
        bottom: top + height,
        width: width,
        height: height,
      };
    }

    setup(function () {
      Blockly.WidgetDiv.createDom();
      this.viewportBBox = makeBBox(0, 0, 1000, 1003);
      this.widgetSize = {
        width: 100,
        height: 102,
      };
      this.anchorSize = {
        width: 90,
        height: 91,
      };

      this.testWidgetPosition = function (
        anchorBBox,
        rtl,
        expectedX,
        expectedY,
        expectedHeight,
      ) {
        Blockly.WidgetDiv.positionWithAnchor(
          this.viewportBBox,
          anchorBBox,
          this.widgetSize,
          rtl,
        );
        const style = Blockly.WidgetDiv.getDiv().style;
        assert.equal(style.left, expectedX + 'px', 'Left');
        assert.equal(style.top, expectedY + 'px', 'Top');
        assert.equal(style.height, expectedHeight + 'px', 'Height');
      };
    });

    suite('LTR', function () {
      test('noConflict', function () {
        // Anchor placed in the middle.
        const anchorBBox = makeBBox(
          500,
          500,
          this.anchorSize.width,
          this.anchorSize.height,
        );
        // The widget div should be placed just below at the left side of the
        // anchor.
        const expectedX = anchorBBox.left;
        const expectedY = anchorBBox.top + this.anchorSize.height;
        this.testWidgetPosition(
          anchorBBox,
          false,
          expectedX,
          expectedY,
          this.widgetSize.height,
        );
      });

      test('topConflict', function () {
        // Anchor close to the top.
        const anchorBBox = makeBBox(
          500,
          50,
          this.anchorSize.width,
          this.anchorSize.height,
        );
        // The widget div should be placed just below the anchor.
        const expectedX = anchorBBox.left;
        const expectedY = anchorBBox.top + this.anchorSize.height;
        this.testWidgetPosition(
          anchorBBox,
          false,
          expectedX,
          expectedY,
          this.widgetSize.height,
        );
      });

      test('bottomConflict', function () {
        // Anchor placed close to the bottom.
        const anchorBBox = makeBBox(
          500,
          900,
          this.anchorSize.width,
          this.anchorSize.height,
        );
        // The widget div should be placed just above the anchor.
        const expectedX = anchorBBox.left;
        const expectedY = anchorBBox.top - this.widgetSize.height;
        this.testWidgetPosition(
          anchorBBox,
          false,
          expectedX,
          expectedY,
          this.widgetSize.height,
        );
      });

      test('leftConflict', function () {
        // Anchor placed close to the left side.
        const anchorBBox = makeBBox(
          50,
          500,
          this.anchorSize.width,
          this.anchorSize.height,
        );
        // The widget div should be placed at the anchor.
        const expectedX = anchorBBox.left;
        const expectedY = anchorBBox.top + this.anchorSize.height;
        this.testWidgetPosition(
          anchorBBox,
          false,
          expectedX,
          expectedY,
          this.widgetSize.height,
        );
      });

      test('rightConflict', function () {
        // Anchor placed close to the right side.
        const anchorBBox = makeBBox(
          950,
          500,
          this.anchorSize.width,
          this.anchorSize.height,
        );
        // The widget div should be placed as far right as possible--at the edge of
        // the screen.
        const expectedX = this.viewportBBox.width - this.widgetSize.width;
        const expectedY = anchorBBox.top + this.anchorSize.height;
        this.testWidgetPosition(
          anchorBBox,
          false,
          expectedX,
          expectedY,
          this.widgetSize.height,
        );
      });
    });
    suite('RTL', function () {
      test('noConflict', function () {
        // Anchor placed in the middle
        const anchorBBox = makeBBox(
          500,
          500,
          this.anchorSize.width,
          this.anchorSize.height,
        );
        // The widget div should be placed at the right side of the anchor.
        const expectedX = anchorBBox.right - this.widgetSize.width;
        const expectedY = anchorBBox.top + this.anchorSize.height;
        this.testWidgetPosition(
          anchorBBox,
          true,
          expectedX,
          expectedY,
          this.widgetSize.height,
        );
      });

      test('topConflict', function () {
        // Anchor close to the top.
        const anchorBBox = makeBBox(
          500,
          50,
          this.anchorSize.width,
          this.anchorSize.height,
        );
        // The widget div should be placed just below the anchor.
        const expectedX = anchorBBox.right - this.widgetSize.width;
        const expectedY = anchorBBox.top + this.anchorSize.height;
        this.testWidgetPosition(
          anchorBBox,
          true,
          expectedX,
          expectedY,
          this.widgetSize.height,
        );
      });

      test('bottomConflict', function () {
        // Anchor placed close to the bottom.
        const anchorBBox = makeBBox(
          500,
          900,
          this.anchorSize.width,
          this.anchorSize.height,
        );
        // The widget div should be placed just above the anchor.
        const expectedX = anchorBBox.right - this.widgetSize.width;
        const expectedY = anchorBBox.top - this.widgetSize.height;
        this.testWidgetPosition(
          anchorBBox,
          true,
          expectedX,
          expectedY,
          this.widgetSize.height,
        );
      });

      test('leftConflict', function () {
        // Anchor placed close to the left side.
        const anchorBBox = makeBBox(
          10,
          500,
          this.anchorSize.width,
          this.anchorSize.height,
        );
        // The widget div should be placed as far left as possible--at the edge of
        // the screen.
        const expectedX = 0;
        const expectedY = anchorBBox.top + this.anchorSize.height;
        this.testWidgetPosition(
          anchorBBox,
          true,
          expectedX,
          expectedY,
          this.widgetSize.height,
        );
      });

      test('rightConflict', function () {
        // Anchor placed close to the right side.
        const anchorBBox = makeBBox(
          950,
          500,
          this.anchorSize.width,
          this.anchorSize.height,
        );
        // The widget div should be placed as far right as possible--at the edge of
        // the screen.
        const expectedX = this.viewportBBox.width - this.widgetSize.width;
        const expectedY = anchorBBox.top + this.anchorSize.height;
        this.testWidgetPosition(
          anchorBBox,
          true,
          expectedX,
          expectedY,
          this.widgetSize.height,
        );
      });
    });
  });

  suite('Keyboard Shortcuts', function () {
    test('Escape dismisses WidgetDiv', function () {
      let hidden = false;
      Blockly.WidgetDiv.show(
        this,
        false,
        () => {
          hidden = true;
        },
        this.workspace,
        false,
      );
      assert.isFalse(hidden);
      Blockly.WidgetDiv.getDiv().dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27, // example values.
        }),
      );
      assert.isTrue(hidden);
    });
  });

  suite('show()', function () {
    test('shows nowhere', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];

      Blockly.WidgetDiv.show(field, false, () => {});

      // By default the div will not have a position.
      const widgetDivElem = document.querySelector('.blocklyWidgetDiv');
      assert.strictEqual(widgetDivElem.style.display, 'block');
      assert.strictEqual(widgetDivElem.style.left, '');
      assert.strictEqual(widgetDivElem.style.top, '');
    });

    test('with hide callback does not call callback', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      const onHideCallback = sinon.stub();

      Blockly.WidgetDiv.show(field, false, () => {});

      // Simply showing the div should never call the hide callback.
      assert.strictEqual(onHideCallback.callCount, 0);
    });

    test('without managed ephemeral focus does not change focused node', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);

      Blockly.WidgetDiv.show(field, false, () => {}, null, false);

      // Since managing ephemeral focus is disabled the current focused node shouldn't be changed.
      const blockFocusableElem = block.getFocusableElement();
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
      assert.strictEqual(document.activeElement, blockFocusableElem);
    });

    test('with managed ephemeral focus focuses widget div', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);

      Blockly.WidgetDiv.show(field, false, () => {}, null, true);

      // Managing ephemeral focus won't change getFocusedNode() but will change the actual element
      // with DOM focus.
      const widgetDivElem = document.querySelector('.blocklyWidgetDiv');
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
      assert.strictEqual(document.activeElement, widgetDivElem);
    });
  });

  suite('hide()', function () {
    test('initially keeps display empty', function () {
      Blockly.WidgetDiv.hide();

      // The display property starts as empty and stays that way until an owner is attached.
      const widgetDivElem = document.querySelector('.blocklyWidgetDiv');
      assert.strictEqual(widgetDivElem.style.display, '');
    });

    test('for showing div hides div', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.WidgetDiv.show(field, false, () => {});

      Blockly.WidgetDiv.hide();

      // Technically this will trigger a CSS animation, but the property is still set to 0.
      const widgetDivElem = document.querySelector('.blocklyWidgetDiv');
      assert.strictEqual(widgetDivElem.style.display, 'none');
    });

    test('for showing div and hide callback calls callback', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      const onHideCallback = sinon.stub();
      Blockly.WidgetDiv.show(field, false, onHideCallback);

      Blockly.WidgetDiv.hide();

      // Hiding the div should trigger the hide callback.
      assert.strictEqual(onHideCallback.callCount, 1);
    });

    test('for showing div without ephemeral focus does not change focus', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);
      Blockly.WidgetDiv.show(field, false, () => {}, null, false);

      Blockly.WidgetDiv.hide();

      // Hiding the div shouldn't change what would have already been focused.
      const blockFocusableElem = block.getFocusableElement();
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
      assert.strictEqual(document.activeElement, blockFocusableElem);
    });

    test('for showing div with ephemeral focus restores DOM focus', function () {
      const block = this.setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);
      Blockly.WidgetDiv.show(field, false, () => {}, null, true);

      Blockly.WidgetDiv.hide();

      // Hiding the div should restore focus back to the block.
      const blockFocusableElem = block.getFocusableElement();
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
      assert.strictEqual(document.activeElement, blockFocusableElem);
    });
  });
});
