/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {defineStackBlock} from './test_helpers/block_definitions.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {
  getBasicToolbox,
  getCategoryJSON,
  getCollapsibleItem,
  getDeeplyNestedJSON,
  getInjectedToolbox,
  getNonCollapsibleItem,
  getSeparator,
  getSimpleJson,
  getXmlArray,
} from './test_helpers/toolbox_definitions.js';

suite('Toolbox', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.toolbox = getInjectedToolbox();
    defineStackBlock();
  });

  teardown(function () {
    this.toolbox.dispose();
    sharedTestTeardown.call(this);
  });

  suite('init', function () {
    test('Init called -> HtmlDiv is created', function () {
      assert.isDefined(this.toolbox.HtmlDiv);
    });
    test('Init called -> HtmlDiv is inserted before parent node', function () {
      const toolboxDiv = Blockly.common.getMainWorkspace().getInjectionDiv()
        .childNodes[0];
      assert.equal(toolboxDiv.className, 'blocklyToolbox');
    });
    test('Init called -> Toolbox is subscribed to background and foreground colour', function () {
      const themeManager = this.toolbox.workspace_.getThemeManager();
      const themeManagerSpy = sinon.spy(themeManager, 'subscribe');
      const componentManager = this.toolbox.workspace_.getComponentManager();
      sinon.stub(componentManager, 'addComponent');
      this.toolbox.dispose(); // Dispose of the old toolbox so that it can be reinited.
      this.toolbox.init();
      sinon.assert.calledWith(
        themeManagerSpy,
        this.toolbox.HtmlDiv,
        'toolboxBackgroundColour',
        'background-color',
      );
      sinon.assert.calledWith(
        themeManagerSpy,
        this.toolbox.HtmlDiv,
        'toolboxForegroundColour',
        'color',
      );
    });
    test('Init called -> Render is called', function () {
      const renderSpy = sinon.spy(this.toolbox, 'render');
      const componentManager = this.toolbox.workspace_.getComponentManager();
      sinon.stub(componentManager, 'addComponent');
      this.toolbox.dispose(); // Dispose of the old toolbox so that it can be reinited.
      this.toolbox.init();
      sinon.assert.calledOnce(renderSpy);
    });
    test('Init called -> Flyout is initialized', function () {
      const componentManager = this.toolbox.workspace_.getComponentManager();
      sinon.stub(componentManager, 'addComponent');
      this.toolbox.dispose(); // Dispose of the old toolbox so that it can be reinited.
      this.toolbox.init();
      assert.isDefined(this.toolbox.getFlyout());
    });
  });

  suite('render', function () {
    test('Render called with valid toolboxDef -> Contents are created', function () {
      const positionStub = sinon.stub(this.toolbox, 'position');
      this.toolbox.render({
        'contents': [
          {'kind': 'category', 'contents': []},
          {'kind': 'category', 'contents': []},
        ],
      });
      assert.equal(this.toolbox.contents.size, 2);
      sinon.assert.called(positionStub);
    });
    // TODO: Uncomment once implemented.
    test.skip('Toolbox definition with both blocks and categories -> Should throw an error', function () {
      const toolbox = this.toolbox;
      const badToolboxDef = [
        {
          'kind': 'block',
        },
        {
          'kind': 'category',
        },
      ];
      assert.throws(function () {
        toolbox.render({'contents': badToolboxDef});
      }, 'Toolbox cannot have both blocks and categories in the root level.');
    });
    // TODO: Uncomment once implemented.
    test.skip('Expanded set to true for a non collapsible toolbox item -> Should open flyout', function () {
      this.toolbox.render(this.toolboxXml);
      const selectedNode = this.toolbox.tree_.children_[0];
      assert.isTrue(selectedNode.selected_);
    });
    test('JSON toolbox definition -> Should create toolbox with contents', function () {
      const jsonDef = {
        'contents': [
          {
            'kind': 'category',
            'contents': [
              {
                'kind': 'block',
                'blockxml':
                  '<block xmlns="http://www.w3.org/1999/xhtml" type="basic_block"><field name="TEXT">FirstCategory-FirstBlock</field></block>',
              },
              {
                'kind': 'label',
                'text': 'Input/Output:',
                'web-class': 'ioLabel',
              },
              {
                'kind': 'button',
                'text': 'insert',
                'callbackkey': 'insertConnectionStacks',
                'web-class': 'ioLabel',
              },
              {
                'kind': 'sep',
                'gap': '7',
              },
            ],
          },
        ],
      };
      this.toolbox.render(jsonDef);
      assert.equal(this.toolbox.contents.size, 1);
    });
    test('multiple icon classes can be applied', function () {
      const jsonDef = {
        'contents': [
          {
            'kind': 'category',
            'cssConfig': {
              'icon': 'customIcon customIconEvents',
            },
            'contents': [
              {
                'kind': 'block',
                'blockxml':
                  '<block xmlns="http://www.w3.org/1999/xhtml" type="basic_block"><field name="TEXT">FirstCategory-FirstBlock</field></block>',
              },
            ],
          },
        ],
      };
      assert.doesNotThrow(() => {
        this.toolbox.render(jsonDef);
      });
      assert.equal(this.toolbox.contents.size, 1);
    });
  });

  suite('focus management', function () {
    test('Losing focus hides autoclosing flyout', function () {
      // Focus the toolbox and select a category to open the flyout.
      const target = this.toolbox.HtmlDiv.querySelector(
        '.blocklyToolboxCategory',
      );
      Blockly.getFocusManager().focusNode(this.toolbox);
      target.dispatchEvent(
        new PointerEvent('pointerdown', {
          target,
          bubbles: true,
        }),
      );
      assert.isTrue(this.toolbox.getFlyout().isVisible());

      // Focus the workspace to trigger the toolbox to close the flyout.
      Blockly.getFocusManager().focusNode(this.toolbox.getWorkspace());
      assert.isFalse(this.toolbox.getFlyout().isVisible());
    });

    test('Losing focus does not hide non-autoclosing flyout', function () {
      // Make the toolbox's flyout non-autoclosing.
      this.toolbox.getFlyout().setAutoClose(false);

      // Focus the toolbox and select a category to open the flyout.
      const target = this.toolbox.HtmlDiv.querySelector(
        '.blocklyToolboxCategory',
      );
      Blockly.getFocusManager().focusNode(this.toolbox);
      target.dispatchEvent(
        new PointerEvent('pointerdown', {
          target,
          bubbles: true,
        }),
      );
      assert.isTrue(this.toolbox.getFlyout().isVisible());

      // Focus the workspace; this should *not* trigger the toolbox to close the
      // flyout, which should remain visible.
      Blockly.getFocusManager().focusNode(this.toolbox.getWorkspace());
      assert.isTrue(this.toolbox.getFlyout().isVisible());
    });
  });

  suite('onClick_', function () {
    test('Toolbox clicked -> Should close flyout', function () {
      const hideChaffStub = sinon.stub(
        Blockly.WorkspaceSvg.prototype,
        'hideChaff',
      );
      const evt = new PointerEvent('pointerdown', {});
      this.toolbox.HtmlDiv.dispatchEvent(evt);
      sinon.assert.calledOnce(hideChaffStub);
    });
    test('Category clicked -> Should select category', function () {
      const categoryXml = document.getElementsByClassName(
        'blocklyToolboxCategory',
      )[0];
      const evt = {
        'target': categoryXml,
      };
      const item = this.toolbox.contents.get(categoryXml.getAttribute('id'));
      const setSelectedSpy = sinon.spy(this.toolbox, 'setSelectedItem');
      const onClickSpy = sinon.spy(item, 'onClick');
      this.toolbox.onClick_(evt);
      sinon.assert.calledOnce(setSelectedSpy);
      sinon.assert.calledOnce(onClickSpy);
    });
  });

  suite('on key down', function () {
    test('Down arrow should select next item', function () {
      const items = this.toolbox.getToolboxItems();
      Blockly.getFocusManager().focusNode(items[0]);
      const oldIndex = items.indexOf(this.toolbox.getSelectedItem());
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.DOWN,
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      const newIndex = items.indexOf(this.toolbox.getSelectedItem());
      assert.equal(oldIndex + 1, newIndex);
    });

    test('Down arrow should skip separators', function () {
      const items = this.toolbox.getToolboxItems();
      Blockly.getFocusManager().focusNode(items[1]);
      const oldIndex = items.indexOf(this.toolbox.getSelectedItem());
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.DOWN,
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      const newIndex = items.indexOf(this.toolbox.getSelectedItem());
      // Item at index 2 is a separator, new index should have incremented by
      // 2 instead of 1 to bypass it.
      assert.equal(oldIndex + 2, newIndex);
    });

    test('Down arrow should skip children of collapsed item', function () {
      const items = this.toolbox.getToolboxItems();
      const collapsibleItem = items[4];
      Blockly.getFocusManager().focusNode(collapsibleItem);
      assert.isFalse(collapsibleItem.isExpanded());
      const oldIndex = items.indexOf(this.toolbox.getSelectedItem());
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.DOWN,
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      const newIndex = items.indexOf(this.toolbox.getSelectedItem());
      // Collapsible item is not expanded, so down should skip its child item
      // and advance to the next regular item.
      assert.equal(oldIndex + 2, newIndex);
    });

    test('Down arrow should go to first child of expanded item', function () {
      const items = this.toolbox.getToolboxItems();
      const collapsibleItem = items[4];
      Blockly.getFocusManager().focusNode(collapsibleItem);
      collapsibleItem.setExpanded(true);
      assert.isTrue(collapsibleItem.isExpanded());
      const oldIndex = items.indexOf(this.toolbox.getSelectedItem());
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.DOWN,
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      const newIndex = items.indexOf(this.toolbox.getSelectedItem());
      // Collapsible item is expanded, so down should focus its child item.
      assert.equal(oldIndex + 1, newIndex);
    });

    test('Down arrow on last item should be a no-op', function () {
      this.toolbox.getNavigator().setNavigationLoops(false);
      const items = this.toolbox.getToolboxItems();
      Blockly.getFocusManager().focusNode(items[6]);
      const oldIndex = items.indexOf(this.toolbox.getSelectedItem());
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.DOWN,
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      const newIndex = items.indexOf(this.toolbox.getSelectedItem());
      assert.equal(oldIndex, newIndex);
    });

    test('Up arrow should select previous item', function () {
      const items = this.toolbox.getToolboxItems();
      Blockly.getFocusManager().focusNode(items[1]);
      const oldIndex = items.indexOf(this.toolbox.getSelectedItem());
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.UP,
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      const newIndex = items.indexOf(this.toolbox.getSelectedItem());
      assert.equal(oldIndex - 1, newIndex);
    });

    test('Up arrow should skip separators', function () {
      const items = this.toolbox.getToolboxItems();
      Blockly.getFocusManager().focusNode(items[3]);
      const oldIndex = items.indexOf(this.toolbox.getSelectedItem());
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.UP,
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      const newIndex = items.indexOf(this.toolbox.getSelectedItem());
      // Item at index 2 is a separator, new index should have decremented by
      // 2 instead of 1 to bypass it.
      assert.equal(oldIndex - 2, newIndex);
    });

    test('Up arrow should skip children of collapsed item', function () {
      const items = this.toolbox.getToolboxItems();
      Blockly.getFocusManager().focusNode(items[6]);
      const oldIndex = items.indexOf(this.toolbox.getSelectedItem());
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.UP,
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      const newIndex = items.indexOf(this.toolbox.getSelectedItem());
      // Collapsible item is not expanded, so up should skip its child item
      // and advance to it directly.
      assert.equal(oldIndex - 2, newIndex);
    });

    test('Up arrow should go to parent from child item', function () {
      const items = this.toolbox.getToolboxItems();
      items[4].setExpanded(true);
      Blockly.getFocusManager().focusNode(items[5]);
      const oldIndex = items.indexOf(this.toolbox.getSelectedItem());
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.UP,
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      const newIndex = items.indexOf(this.toolbox.getSelectedItem());
      // Collapsible item is expanded, so up from its child should go to it.
      assert.equal(oldIndex - 1, newIndex);
    });

    test('Up arrow on first item should be a no-op', function () {
      this.toolbox.getNavigator().setNavigationLoops(false);
      const items = this.toolbox.getToolboxItems();
      Blockly.getFocusManager().focusNode(items[0]);
      const oldIndex = items.indexOf(this.toolbox.getSelectedItem());
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.UP,
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      const newIndex = items.indexOf(this.toolbox.getSelectedItem());
      assert.equal(oldIndex, newIndex);
    });

    test('Left arrow should collapse expanded item', function () {
      const items = this.toolbox.getToolboxItems();
      const collapsibleItem = items[4];
      Blockly.getFocusManager().focusNode(collapsibleItem);
      collapsibleItem.setExpanded(true);
      assert.isTrue(collapsibleItem.isExpanded());
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.LEFT,
        key: 'ArrowLeft',
      });
      this.toolbox.contentsDiv_.dispatchEvent(event);
      assert.isFalse(collapsibleItem.isExpanded());
    });

    test('Left arrow from normal item should be a no-op', function () {
      const items = this.toolbox.getToolboxItems();
      Blockly.getFocusManager().focusNode(items[0]);
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.LEFT,
        key: 'ArrowLeft',
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), items[0]);
    });

    test('Left arrow from collapsed item should be a no-op', function () {
      const items = this.toolbox.getToolboxItems();
      items[4].setExpanded(true);
      Blockly.getFocusManager().focusNode(items[4]);
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.LEFT,
        key: 'ArrowLeft',
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), items[4]);
    });

    test('Left arrow from child item should be a no-op', function () {
      const items = this.toolbox.getToolboxItems();
      items[4].setExpanded(true);
      Blockly.getFocusManager().focusNode(items[5]);
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.LEFT,
        key: 'ArrowLeft',
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), items[5]);
    });

    test('Right arrow should expand collapsed item', function () {
      const items = this.toolbox.getToolboxItems();
      const collapsibleItem = items[4];
      Blockly.getFocusManager().focusNode(collapsibleItem);
      assert.isFalse(collapsibleItem.isExpanded());
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.RIGHT,
        key: 'ArrowRight',
      });
      this.toolbox.contentsDiv_.dispatchEvent(event);
      assert.isTrue(collapsibleItem.isExpanded());
    });

    test('Right arrow from normal item should focus flyout', function () {
      const items = this.toolbox.getToolboxItems();
      Blockly.getFocusManager().focusNode(items[0]);
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.RIGHT,
        key: 'ArrowRight',
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedTree(),
        this.toolbox.getFlyout().getWorkspace(),
      );
    });

    test('Right arrow from expanded item should focus flyout', function () {
      const items = this.toolbox.getToolboxItems();
      items[4].setExpanded(true);
      Blockly.getFocusManager().focusNode(items[4]);
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.RIGHT,
        key: 'ArrowRight',
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedTree(),
        this.toolbox.getFlyout().getWorkspace(),
      );
    });

    test('Right arrow from child item should focus flyout', function () {
      const items = this.toolbox.getToolboxItems();
      items[4].setExpanded(true);
      Blockly.getFocusManager().focusNode(items[5]);
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.RIGHT,
        key: 'ArrowRight',
      });
      this.toolbox.getWorkspace().getInjectionDiv().dispatchEvent(event);
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedTree(),
        this.toolbox.getFlyout().getWorkspace(),
      );
    });
  });

  suite('setSelectedItem', function () {
    function setupSetSelected(toolbox, oldItem, newItem) {
      toolbox.selectedItem_ = oldItem;
      const newItemStub = sinon.stub(newItem, 'setSelected');
      toolbox.setSelectedItem(newItem);
      return newItemStub;
    }

    test('Selected item and new item are null -> Should not update the flyout', function () {
      this.selectedItem_ = null;
      this.toolbox.setSelectedItem(null);
      const updateFlyoutStub = sinon.stub(this.toolbox, 'updateFlyout_');
      sinon.assert.notCalled(updateFlyoutStub);
    });
    test('New item is not selectable -> Should not update the flyout', function () {
      const separator = getSeparator(this.toolbox);
      this.toolbox.setSelectedItem(separator);
      const updateFlyoutStub = sinon.stub(this.toolbox, 'updateFlyout_');
      sinon.assert.notCalled(updateFlyoutStub);
    });
    test('Select an item with no children -> Should select item', function () {
      const oldItem = getCollapsibleItem(this.toolbox);
      const oldItemStub = sinon.stub(oldItem, 'setSelected');
      const newItem = getNonCollapsibleItem(this.toolbox);
      const newItemStub = setupSetSelected(this.toolbox, oldItem, newItem);
      sinon.assert.calledWith(oldItemStub, false);
      sinon.assert.calledWith(newItemStub, true);
    });
    test('Select previously selected item with no children -> Should deselect', function () {
      const newItem = getNonCollapsibleItem(this.toolbox);
      const newItemStub = setupSetSelected(this.toolbox, newItem, newItem);
      sinon.assert.calledWith(newItemStub, false);
    });
    test('Select collapsible item -> Should select item', function () {
      const newItem = getCollapsibleItem(this.toolbox);
      const newItemStub = setupSetSelected(this.toolbox, null, newItem);
      sinon.assert.calledWith(newItemStub, true);
    });
    test('Select previously selected collapsible item -> Should not deselect', function () {
      const newItem = getCollapsibleItem(this.toolbox);
      const newItemStub = setupSetSelected(this.toolbox, newItem, newItem);
      sinon.assert.notCalled(newItemStub);
    });
  });

  suite('updateFlyout_', function () {
    function testHideFlyout(toolbox, oldItem, newItem) {
      const updateFlyoutStub = sinon.stub(toolbox.getFlyout(), 'hide');
      toolbox.updateFlyout_(oldItem, newItem);
      sinon.assert.called(updateFlyoutStub);
    }

    test('Select previously selected item -> Should close flyout', function () {
      const newItem = getNonCollapsibleItem(this.toolbox);
      testHideFlyout(this.toolbox, newItem, newItem);
    });
    test('No new item -> Should close flyout', function () {
      testHideFlyout(this.toolbox, null, null);
    });
    test('Old item but no new item -> Should close flyout', function () {
      const oldItem = getNonCollapsibleItem(this.toolbox);
      testHideFlyout(this.toolbox, oldItem, null);
    });
    test('Select collapsible item -> Should close flyout', function () {
      const newItem = getCollapsibleItem(this.toolbox);
      testHideFlyout(this.toolbox, null, newItem);
    });
    test('Select selectable item -> Should open flyout', function () {
      const showFlyoutstub = sinon.stub(this.toolbox.getFlyout(), 'show');
      const scrollToStartFlyout = sinon.stub(
        this.toolbox.getFlyout(),
        'scrollToStart',
      );
      const newItem = getNonCollapsibleItem(this.toolbox);
      this.toolbox.updateFlyout_(null, newItem);
      sinon.assert.called(showFlyoutstub);
      sinon.assert.called(scrollToStartFlyout);
    });
  });

  suite('position', function () {
    setup(function () {
      this.toolbox = getBasicToolbox();
      const metricsStub = sinon.stub(this.toolbox.workspace_, 'getMetrics');
      metricsStub.returns({});
    });

    function checkHorizontalToolbox(toolbox) {
      assert.equal(toolbox.HtmlDiv.style.left, '0px', 'Check left position');
      assert.equal(toolbox.HtmlDiv.style.height, 'auto', 'Check height');
      assert.equal(toolbox.HtmlDiv.style.width, '100%', 'Check width');
      assert.equal(
        toolbox.height_,
        toolbox.HtmlDiv.offsetHeight,
        'Check height',
      );
    }
    function checkVerticalToolbox(toolbox) {
      assert.equal(toolbox.HtmlDiv.style.height, '100%', 'Check height');
      assert.equal(toolbox.width_, toolbox.HtmlDiv.offsetWidth, 'Check width');
    }
    test('HtmlDiv is not created -> Should not resize', function () {
      const toolbox = this.toolbox;
      toolbox.HtmlDiv = null;
      toolbox.horizontalLayout = true;
      toolbox.position();
      assert.equal(toolbox.height_, 0);
    });
    test('Horizontal toolbox at top -> Should anchor horizontal toolbox to top', function () {
      const toolbox = this.toolbox;
      toolbox.toolboxPosition = Blockly.utils.toolbox.Position.TOP;
      toolbox.horizontalLayout = true;
      toolbox.position();
      checkHorizontalToolbox(toolbox);
      assert.equal(toolbox.HtmlDiv.style.top, '0px', 'Check top');
    });
    test('Horizontal toolbox at bottom -> Should anchor horizontal toolbox to bottom', function () {
      const toolbox = this.toolbox;
      toolbox.toolboxPosition = Blockly.utils.toolbox.Position.BOTTOM;
      toolbox.horizontalLayout = true;
      toolbox.position();
      checkHorizontalToolbox(toolbox);
      assert.equal(toolbox.HtmlDiv.style.bottom, '0px', 'Check bottom');
    });
    test('Vertical toolbox at right -> Should anchor to right', function () {
      const toolbox = this.toolbox;
      toolbox.toolboxPosition = Blockly.utils.toolbox.Position.RIGHT;
      toolbox.horizontalLayout = false;
      toolbox.position();
      assert.equal(toolbox.HtmlDiv.style.right, '0px', 'Check right');
      checkVerticalToolbox(toolbox);
    });
    test('Vertical toolbox at left -> Should anchor to left', function () {
      const toolbox = this.toolbox;
      toolbox.toolboxPosition = Blockly.utils.toolbox.Position.LEFT;
      toolbox.horizontalLayout = false;
      toolbox.position();
      assert.equal(toolbox.HtmlDiv.style.left, '0px', 'Check left');
      checkVerticalToolbox(toolbox);
    });
  });

  suite('parseMethods', function () {
    setup(function () {
      this.categoryToolboxJSON = getCategoryJSON();
      this.simpleToolboxJSON = getSimpleJson();
    });

    function checkValue(actual, expected, value) {
      const actualVal = actual[value];
      const expectedVal = expected[value];
      assert.equal(
        actualVal.toUpperCase(),
        expectedVal.toUpperCase(),
        'Checking value for: ' + value,
      );
    }
    function checkContents(actualContents, expectedContents) {
      assert.equal(actualContents.length, expectedContents.length);
      for (let i = 0; i < actualContents.length; i++) {
        // TODO: Check the values as well as all the keys.
        assert.containsAllKeys(
          actualContents[i],
          Object.keys(expectedContents[i]),
        );
      }
    }
    function checkCategory(actual, expected) {
      checkValue(actual, expected, 'kind');
      checkValue(actual, expected, 'name');
      assert.deepEqual(actual['cssconfig'], expected['cssconfig']);
      checkContents(actual.contents, expected.contents);
    }
    function checkCategoryToolbox(actual, expected) {
      const actualContents = actual['contents'];
      const expectedContents = expected['contents'];
      assert.equal(actualContents.length, expectedContents.length);
      for (let i = 0; i < expected.length; i++) {
        checkCategory(actualContents[i], expected[i]);
      }
    }
    function checkSimpleToolbox(actual, expected) {
      checkContents(actual['contents'], expected['contents']);
    }

    suite('parseToolbox', function () {
      test('Category Toolbox: JSON', function () {
        const toolboxDef = Blockly.utils.toolbox.convertToolboxDefToJson(
          this.categoryToolboxJSON,
        );
        assert.isNotNull(toolboxDef);
        checkCategoryToolbox(toolboxDef, this.categoryToolboxJSON);
      });
      test('Simple Toolbox: JSON', function () {
        const toolboxDef = Blockly.utils.toolbox.convertToolboxDefToJson(
          this.simpleToolboxJSON,
        );
        assert.isNotNull(toolboxDef);
        checkSimpleToolbox(toolboxDef, this.simpleToolboxJSON);
      });
      test('Category Toolbox: xml', function () {
        const toolboxXml = document.getElementById('toolbox-categories');
        const toolboxDef =
          Blockly.utils.toolbox.convertToolboxDefToJson(toolboxXml);
        assert.isNotNull(toolboxDef);
        checkCategoryToolbox(toolboxDef, this.categoryToolboxJSON);
      });
      test('Simple Toolbox: xml', function () {
        const toolboxXml = document.getElementById('toolbox-simple');
        const toolboxDef =
          Blockly.utils.toolbox.convertToolboxDefToJson(toolboxXml);
        assert.isNotNull(toolboxDef);
        checkSimpleToolbox(toolboxDef, this.simpleToolboxJSON);
      });
      test('Simple Toolbox: string', function () {
        let toolbox = '<xml>';
        toolbox += '  <block type="controls_if"></block>';
        toolbox += '  <block type="controls_whileUntil"></block>';
        toolbox += '</xml>';

        const toolboxJson = {
          'contents': [
            {
              'kind': 'block',
              'type': 'controls_if',
            },
            {
              'kind': 'block',
              'type': 'controls_if',
            },
          ],
        };

        const toolboxDef =
          Blockly.utils.toolbox.convertToolboxDefToJson(toolbox);
        assert.isNotNull(toolboxDef);
        checkSimpleToolbox(toolboxDef, toolboxJson);
      });
      test('Category Toolbox: string', function () {
        let toolbox = '<xml>';
        toolbox += '  <category name="a"></category>';
        toolbox += '  <category name="b"></category>';
        toolbox += '</xml>';

        const toolboxJson = {
          'contents': [
            {
              'kind': 'category',
              'name': 'a',
            },
            {
              'kind': 'category',
              'name': 'b',
            },
          ],
        };

        const toolboxDef =
          Blockly.utils.toolbox.convertToolboxDefToJson(toolbox);
        assert.isNotNull(toolboxDef);
        checkSimpleToolbox(toolboxDef, toolboxJson);
      });
    });
    suite('parseFlyout', function () {
      test('Array of Nodes', function () {
        const xmlList = getXmlArray();
        const flyoutDef =
          Blockly.utils.toolbox.convertFlyoutDefToJsonArray(xmlList);
        checkContents(flyoutDef, this.simpleToolboxJSON['contents']);
      });
      test('NodeList', function () {
        const nodeList = document.getElementById('toolbox-simple').childNodes;
        const flyoutDef =
          Blockly.utils.toolbox.convertFlyoutDefToJsonArray(nodeList);
        checkContents(flyoutDef, this.simpleToolboxJSON['contents']);
      });
      test('List of json', function () {
        const jsonList = this.simpleToolboxJSON['contents'];
        const flyoutDef =
          Blockly.utils.toolbox.convertFlyoutDefToJsonArray(jsonList);
        checkContents(flyoutDef, this.simpleToolboxJSON['contents']);
      });
      test('Json', function () {
        const flyoutDef = Blockly.utils.toolbox.convertFlyoutDefToJsonArray(
          this.simpleToolboxJSON,
        );
        checkContents(flyoutDef, this.simpleToolboxJSON['contents']);
      });
    });
  });
  suite('Nested Categories', function () {
    test('Child categories visible if all ancestors expanded', function () {
      this.toolbox.render(getDeeplyNestedJSON());
      const items = [...this.toolbox.contents.values()];
      const outerCategory = items[0];
      const middleCategory = items[1];
      const innerCategory = items[2];

      outerCategory.toggleExpanded();
      middleCategory.toggleExpanded();
      innerCategory.show();

      assert.isTrue(
        innerCategory.isVisible(),
        'All ancestors are expanded, so category should be visible',
      );
    });
    test('Child categories not visible if any ancestor not expanded', function () {
      this.toolbox.render(getDeeplyNestedJSON());
      const items = [...this.toolbox.contents.values()];
      const middleCategory = items[1];
      const innerCategory = items[2];

      // Don't expand the outermost category
      // Even though the direct parent of inner is expanded, it shouldn't be visible
      // because all ancestor categories need to be visible, not just parent
      middleCategory.toggleExpanded();
      innerCategory.show();

      assert.isFalse(
        innerCategory.isVisible(),
        'Not all ancestors are expanded, so category should not be visible',
      );
    });
  });
});
