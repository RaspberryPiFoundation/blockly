/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import sinon from 'sinon';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('WidgetDiv', function () {
  let workspace: Blockly.WorkspaceSvg;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    const container = document.firstElementChild;
    assert.isNotNull(container);
    Blockly.common.setParentContainer(container);
    workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
    // The workspace needs to be visible for focus-specific tests.
    const injectionDiv = document.getElementById('blocklyDiv');
    assert.isNotNull(injectionDiv);
    injectionDiv.style.visibility = 'visible';
  });
  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
    const injectionDiv = document.getElementById('blocklyDiv');
    assert.isNotNull(injectionDiv);
    injectionDiv.style.visibility = 'hidden';
    Blockly.common.setParentContainer(null as any);
  });

  function setUpBlockWithField() {
    const blockJson = {
      'type': 'text',
      'id': 'block_id',
      'x': 10,
      'y': 20,
      'fields': {
        'TEXT': '',
      },
    };
    Blockly.serialization.blocks.append(blockJson, workspace);
    const block = workspace.getBlockById('block_id');
    assert.isNotNull(block);
    return block;
  }

  suite('positionWithAnchor', function () {
    let anchorSize: Blockly.utils.Size;
    let widgetSize: Blockly.utils.Size;
    let viewportBBox: Blockly.utils.Rect;

    function makeBBox(
      left: number,
      top: number,
      width: number,
      height: number,
    ) {
      return new Blockly.utils.Rect(top, top + height, left, left + width);
    }

    function testWidgetPosition(
      anchorBBox: Blockly.utils.Rect,
      rtl: boolean,
      expectedX: number,
      expectedY: number,
      expectedHeight: number,
    ) {
      Blockly.WidgetDiv.positionWithAnchor(
        viewportBBox,
        anchorBBox,
        widgetSize,
        rtl,
      );
      const style = Blockly.WidgetDiv.getDiv()?.style;
      assert.equal(style?.left, expectedX + 'px', 'Left');
      assert.equal(style?.top, expectedY + 'px', 'Top');
      assert.equal(style?.height, expectedHeight + 'px', 'Height');
    }

    setup(function () {
      Blockly.WidgetDiv.createDom();
      viewportBBox = makeBBox(0, 0, 1000, 1003);
      widgetSize = new Blockly.utils.Size(100, 102);
      anchorSize = new Blockly.utils.Size(90, 91);
    });

    suite('LTR', function () {
      test('noConflict', function () {
        // Anchor placed in the middle.
        const anchorBBox = makeBBox(
          500,
          500,
          anchorSize.width,
          anchorSize.height,
        );
        // The widget div should be placed just below at the left side of the
        // anchor.
        const expectedX = anchorBBox.left;
        const expectedY = anchorBBox.top + anchorSize.height;
        testWidgetPosition(
          anchorBBox,
          false,
          expectedX,
          expectedY,
          widgetSize.height,
        );
      });

      test('topConflict', function () {
        // Anchor close to the top.
        const anchorBBox = makeBBox(
          500,
          50,
          anchorSize.width,
          anchorSize.height,
        );
        // The widget div should be placed just below the anchor.
        const expectedX = anchorBBox.left;
        const expectedY = anchorBBox.top + anchorSize.height;
        testWidgetPosition(
          anchorBBox,
          false,
          expectedX,
          expectedY,
          widgetSize.height,
        );
      });

      test('bottomConflict', function () {
        // Anchor placed close to the bottom.
        const anchorBBox = makeBBox(
          500,
          900,
          anchorSize.width,
          anchorSize.height,
        );
        // The widget div should be placed just above the anchor.
        const expectedX = anchorBBox.left;
        const expectedY = anchorBBox.top - widgetSize.height;
        testWidgetPosition(
          anchorBBox,
          false,
          expectedX,
          expectedY,
          widgetSize.height,
        );
      });

      test('leftConflict', function () {
        // Anchor placed close to the left side.
        const anchorBBox = makeBBox(
          50,
          500,
          anchorSize.width,
          anchorSize.height,
        );
        // The widget div should be placed at the anchor.
        const expectedX = anchorBBox.left;
        const expectedY = anchorBBox.top + anchorSize.height;
        testWidgetPosition(
          anchorBBox,
          false,
          expectedX,
          expectedY,
          widgetSize.height,
        );
      });

      test('rightConflict', function () {
        // Anchor placed close to the right side.
        const anchorBBox = makeBBox(
          950,
          500,
          anchorSize.width,
          anchorSize.height,
        );
        // The widget div should be placed as far right as possible--at the edge of
        // the screen.
        const expectedX = viewportBBox.getWidth() - widgetSize.width;
        const expectedY = anchorBBox.top + anchorSize.height;
        testWidgetPosition(
          anchorBBox,
          false,
          expectedX,
          expectedY,
          widgetSize.height,
        );
      });
    });
    suite('RTL', function () {
      test('noConflict', function () {
        // Anchor placed in the middle
        const anchorBBox = makeBBox(
          500,
          500,
          anchorSize.width,
          anchorSize.height,
        );
        // The widget div should be placed at the right side of the anchor.
        const expectedX = anchorBBox.right - widgetSize.width;
        const expectedY = anchorBBox.top + anchorSize.height;
        testWidgetPosition(
          anchorBBox,
          true,
          expectedX,
          expectedY,
          widgetSize.height,
        );
      });

      test('topConflict', function () {
        // Anchor close to the top.
        const anchorBBox = makeBBox(
          500,
          50,
          anchorSize.width,
          anchorSize.height,
        );
        // The widget div should be placed just below the anchor.
        const expectedX = anchorBBox.right - widgetSize.width;
        const expectedY = anchorBBox.top + anchorSize.height;
        testWidgetPosition(
          anchorBBox,
          true,
          expectedX,
          expectedY,
          widgetSize.height,
        );
      });

      test('bottomConflict', function () {
        // Anchor placed close to the bottom.
        const anchorBBox = makeBBox(
          500,
          900,
          anchorSize.width,
          anchorSize.height,
        );
        // The widget div should be placed just above the anchor.
        const expectedX = anchorBBox.right - widgetSize.width;
        const expectedY = anchorBBox.top - widgetSize.height;
        testWidgetPosition(
          anchorBBox,
          true,
          expectedX,
          expectedY,
          widgetSize.height,
        );
      });

      test('leftConflict', function () {
        // Anchor placed close to the left side.
        const anchorBBox = makeBBox(
          10,
          500,
          anchorSize.width,
          anchorSize.height,
        );
        // The widget div should be placed as far left as possible--at the edge of
        // the screen.
        const expectedX = 0;
        const expectedY = anchorBBox.top + anchorSize.height;
        testWidgetPosition(
          anchorBBox,
          true,
          expectedX,
          expectedY,
          widgetSize.height,
        );
      });

      test('rightConflict', function () {
        // Anchor placed close to the right side.
        const anchorBBox = makeBBox(
          950,
          500,
          anchorSize.width,
          anchorSize.height,
        );
        // The widget div should be placed as far right as possible--at the edge of
        // the screen.
        const expectedX = viewportBBox.getWidth() - widgetSize.width;
        const expectedY = anchorBBox.top + anchorSize.height;
        testWidgetPosition(
          anchorBBox,
          true,
          expectedX,
          expectedY,
          widgetSize.height,
        );
      });
    });
  });

  suite('Keyboard Shortcuts', function () {
    test('Escape dismisses WidgetDiv', function (this: Mocha.Context) {
      let hidden = false;
      Blockly.WidgetDiv.show(
        this,
        false,
        () => {
          hidden = true;
        },
        workspace,
        false,
      );
      assert.isFalse(hidden);
      Blockly.WidgetDiv.getDiv()?.dispatchEvent(
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
      const block = setUpBlockWithField();
      const field = Array.from(block.getFields())[0];

      Blockly.WidgetDiv.show(field, false, () => {});

      // By default the div will not have a position.
      const widgetDivElem = Blockly.WidgetDiv.getDiv();
      assert.strictEqual(widgetDivElem?.style.display, 'block');
      assert.strictEqual(widgetDivElem?.style.left, '');
      assert.strictEqual(widgetDivElem?.style.top, '');
    });

    test('with hide callback does not call callback', function () {
      const block = setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      const onHideCallback = sinon.stub();

      Blockly.WidgetDiv.show(field, false, () => {});

      // Simply showing the div should never call the hide callback.
      assert.strictEqual(onHideCallback.callCount, 0);
    });

    test('without managed ephemeral focus does not change focused node', function () {
      const block = setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);

      Blockly.WidgetDiv.show(field, false, () => {}, null, false);

      // Since managing ephemeral focus is disabled the current focused node shouldn't be changed.
      const blockFocusableElem = block.getFocusableElement();
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
      assert.strictEqual(document.activeElement, blockFocusableElem);
    });

    test('with managed ephemeral focus focuses widget div', function () {
      const block = setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);

      Blockly.WidgetDiv.show(field, false, () => {}, null, true);

      // Managing ephemeral focus won't change getFocusedNode() but will change the actual element
      // with DOM focus.
      const widgetDivElem = Blockly.WidgetDiv.getDiv();
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
      assert.strictEqual(document.activeElement, widgetDivElem);
    });

    test('makes the widget div owned by the workspace', function () {
      const block = setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);

      Blockly.WidgetDiv.show(field, false, () => {}, null, true);
      assert.equal(
        Blockly.utils.aria.getState(
          workspace.getFocusableElement(),
          Blockly.utils.aria.State.OWNS,
        ),
        Blockly.WidgetDiv.getDiv()?.id,
      );
      assert.isTrue(
        workspace
          .getFocusableElement()
          .classList.contains('blocklyShowingWidgetDiv'),
      );
    });
  });

  suite('hide()', function () {
    test('initially keeps display empty', function () {
      Blockly.WidgetDiv.hide();

      // The display property starts as empty and stays that way until an owner is attached.
      const widgetDivElem = Blockly.WidgetDiv.getDiv();
      assert.strictEqual(widgetDivElem?.style.display, '');
    });

    test('for showing div hides div', function () {
      const block = setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.WidgetDiv.show(field, false, () => {});

      Blockly.WidgetDiv.hide();

      // Technically this will trigger a CSS animation, but the property is still set to 0.
      const widgetDivElem = Blockly.WidgetDiv.getDiv();
      assert.strictEqual(widgetDivElem?.style.display, 'none');
    });

    test('for showing div and hide callback calls callback', function () {
      const block = setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      const onHideCallback = sinon.stub();
      Blockly.WidgetDiv.show(field, false, onHideCallback);

      Blockly.WidgetDiv.hide();

      // Hiding the div should trigger the hide callback.
      assert.strictEqual(onHideCallback.callCount, 1);
    });

    test('for showing div without ephemeral focus does not change focus', function () {
      const block = setUpBlockWithField();
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
      const block = setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);
      Blockly.WidgetDiv.show(field, false, () => {}, null, true);

      Blockly.WidgetDiv.hide();

      // Hiding the div should restore focus back to the block.
      const blockFocusableElem = block.getFocusableElement();
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), block);
      assert.strictEqual(document.activeElement, blockFocusableElem);
    });

    test('clears ownership of the widget div by the workspace', function () {
      const block = setUpBlockWithField();
      const field = Array.from(block.getFields())[0];
      Blockly.getFocusManager().focusNode(block);
      Blockly.WidgetDiv.show(field, false, () => {}, null, true);

      Blockly.WidgetDiv.hide();

      assert.isNull(
        Blockly.utils.aria.getState(
          workspace.getFocusableElement(),
          Blockly.utils.aria.State.OWNS,
        ),
      );
      assert.isFalse(
        workspace
          .getFocusableElement()
          .classList.contains('blocklyShowingWidgetDiv'),
      );
    });
  });
});
