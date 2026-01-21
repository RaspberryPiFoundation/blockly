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
  getChildItem,
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
    defineStackBlock();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('init', function () {
    setup(function () {
      this.toolbox = getInjectedToolbox();
    });
    teardown(function () {
      this.toolbox.dispose();
    });

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
    setup(function () {
      this.toolbox = getInjectedToolbox();
    });
    teardown(function () {
      this.toolbox.dispose();
    });
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
    setup(function () {
      this.toolbox = getInjectedToolbox();
    });
    teardown(function () {
      this.toolbox.dispose();
    });

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
    setup(function () {
      this.toolbox = getInjectedToolbox();
    });
    teardown(function () {
      this.toolbox.dispose();
    });

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

  suite('onKeyDown_', function () {
    setup(function () {
      this.toolbox = getInjectedToolbox();
    });
    teardown(function () {
      this.toolbox.dispose();
    });

    function createKeyDownMock(key) {
      return {
        'key': key,
        'preventDefault': function () {},
      };
    }

    function testCorrectFunctionCalled(toolbox, key, funcName) {
      const event = createKeyDownMock(key);
      const preventDefaultEvent = sinon.stub(event, 'preventDefault');
      const selectMethodStub = sinon.stub(toolbox, funcName);
      selectMethodStub.returns(true);
      toolbox.onKeyDown_(event);
      sinon.assert.called(selectMethodStub);
      sinon.assert.called(preventDefaultEvent);
    }

    test('Down button is pushed -> Should call selectNext', function () {
      testCorrectFunctionCalled(this.toolbox, 'ArrowDown', 'selectNext', true);
    });
    test('Up button is pushed -> Should call selectPrevious', function () {
      testCorrectFunctionCalled(
        this.toolbox,
        'ArrowUp',
        'selectPrevious',
        true,
      );
    });
    test('Left button is pushed -> Should call selectParent', function () {
      testCorrectFunctionCalled(
        this.toolbox,
        'ArrowLeft',
        'selectParent',
        true,
      );
    });
    test('Right button is pushed -> Should call selectChild', function () {
      testCorrectFunctionCalled(
        this.toolbox,
        'ArrowRight',
        'selectChild',
        true,
      );
    });
    test('Enter button is pushed -> Should toggle expanded', function () {
      this.toolbox.selectedItem_ = getCollapsibleItem(this.toolbox);
      const toggleExpandedStub = sinon.stub(
        this.toolbox.selectedItem_,
        'toggleExpanded',
      );
      const event = createKeyDownMock('Enter');
      const preventDefaultEvent = sinon.stub(event, 'preventDefault');
      this.toolbox.onKeyDown_(event);
      sinon.assert.called(toggleExpandedStub);
      sinon.assert.called(preventDefaultEvent);
    });
    test('Enter button is pushed when no item is selected -> Should not call prevent default', function () {
      this.toolbox.selectedItem_ = null;
      const event = createKeyDownMock('Enter');
      const preventDefaultEvent = sinon.stub(event, 'preventDefault');
      this.toolbox.onKeyDown_(event);
      sinon.assert.notCalled(preventDefaultEvent);
    });
  });

  suite('Select Methods', function () {
    setup(function () {
      this.toolbox = getInjectedToolbox();
    });
    teardown(function () {
      this.toolbox.dispose();
    });

    suite('selectChild', function () {
      test('No item is selected -> Should not handle event', function () {
        this.toolbox.selectedItem_ = null;
        const handled = this.toolbox.selectChild();
        assert.isFalse(handled);
      });
      test('Selected item is not collapsible -> Should not handle event', function () {
        this.toolbox.selectedItem_ = getNonCollapsibleItem(this.toolbox);
        const handled = this.toolbox.selectChild();
        assert.isFalse(handled);
      });
      test('Selected item is collapsible -> Should expand', function () {
        const collapsibleItem = getCollapsibleItem(this.toolbox);
        this.toolbox.selectedItem_ = collapsibleItem;
        const handled = this.toolbox.selectChild();
        assert.isTrue(handled);
        assert.isTrue(collapsibleItem.isExpanded());
        assert.equal(this.toolbox.selectedItem_, collapsibleItem);
      });

      test('Selected item is expanded -> Should select child', function () {
        const collapsibleItem = getCollapsibleItem(this.toolbox);
        collapsibleItem.expanded_ = true;
        const selectNextStub = sinon.stub(this.toolbox, 'selectNext');
        this.toolbox.selectedItem_ = collapsibleItem;
        const handled = this.toolbox.selectChild();
        assert.isTrue(handled);
        sinon.assert.called(selectNextStub);
      });
    });

    suite('selectParent', function () {
      test('No item selected -> Should not handle event', function () {
        this.toolbox.selectedItem_ = null;
        const handled = this.toolbox.selectParent();
        assert.isFalse(handled);
      });
      test('Selected item is expanded -> Should collapse', function () {
        const collapsibleItem = getCollapsibleItem(this.toolbox);
        collapsibleItem.expanded_ = true;
        this.toolbox.selectedItem_ = collapsibleItem;
        const handled = this.toolbox.selectParent();
        assert.isTrue(handled);
        assert.isFalse(collapsibleItem.isExpanded());
        assert.equal(this.toolbox.selectedItem_, collapsibleItem);
      });
      test('Selected item is not expanded -> Should get parent', function () {
        const childItem = getChildItem(this.toolbox);
        this.toolbox.selectedItem_ = childItem;
        const handled = this.toolbox.selectParent();
        assert.isTrue(handled);
        assert.equal(this.toolbox.selectedItem_, childItem.getParent());
      });
    });

    suite('selectNext', function () {
      test('No item is selected -> Should not handle event', function () {
        this.toolbox.selectedItem_ = null;
        const handled = this.toolbox.selectNext();
        assert.isFalse(handled);
      });
      test('Next item is selectable -> Should select next item', function () {
        const items = [...this.toolbox.contents.values()];
        const item = items[0];
        this.toolbox.selectedItem_ = item;
        const handled = this.toolbox.selectNext();
        assert.isTrue(handled);
        assert.equal(this.toolbox.selectedItem_, items[1]);
      });
      test('Selected item is last item -> Should not handle event', function () {
        const items = [...this.toolbox.contents.values()];
        const item = items.at(-1);
        this.toolbox.selectedItem_ = item;
        const handled = this.toolbox.selectNext();
        assert.isFalse(handled);
        assert.equal(this.toolbox.selectedItem_, item);
      });
      test('Selected item is collapsed -> Should skip over its children', function () {
        const item = getCollapsibleItem(this.toolbox);
        const childItem = item.flyoutItems_[0];
        item.expanded_ = false;
        this.toolbox.selectedItem_ = item;
        const handled = this.toolbox.selectNext();
        assert.isTrue(handled);
        assert.notEqual(this.toolbox.selectedItem_, childItem);
      });
    });

    suite('selectPrevious', function () {
      test('No item is selected -> Should not handle event', function () {
        this.toolbox.selectedItem_ = null;
        const handled = this.toolbox.selectPrevious();
        assert.isFalse(handled);
      });
      test('Selected item is first item -> Should not handle event', function () {
        const item = [...this.toolbox.contents.values()][0];
        this.toolbox.selectedItem_ = item;
        const handled = this.toolbox.selectPrevious();
        assert.isFalse(handled);
        assert.equal(this.toolbox.selectedItem_, item);
      });
      test('Previous item is selectable -> Should select previous item', function () {
        const items = [...this.toolbox.contents.values()];
        const item = items[1];
        const prevItem = items[0];
        this.toolbox.selectedItem_ = item;
        const handled = this.toolbox.selectPrevious();
        assert.isTrue(handled);
        assert.equal(this.toolbox.selectedItem_, prevItem);
      });
      test('Previous item is collapsed -> Should skip over children of the previous item', function () {
        const childItem = getChildItem(this.toolbox);
        const parentItem = childItem.getParent();
        const items = [...this.toolbox.contents.values()];
        const parentIdx = items.indexOf(parentItem);
        // Gets the item after the parent.
        const item = items[parentIdx + 1];
        this.toolbox.selectedItem_ = item;
        const handled = this.toolbox.selectPrevious();
        assert.isTrue(handled);
        assert.notEqual(this.toolbox.selectedItem_, childItem);
      });
    });
  });

  suite('setSelectedItem', function () {
    setup(function () {
      this.toolbox = getInjectedToolbox();
    });
    teardown(function () {
      this.toolbox.dispose();
    });

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
    setup(function () {
      this.toolbox = getInjectedToolbox();
    });
    teardown(function () {
      this.toolbox.dispose();
    });

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
    setup(function () {
      this.toolbox = getInjectedToolbox();
    });
    teardown(function () {
      this.toolbox.dispose();
    });
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
