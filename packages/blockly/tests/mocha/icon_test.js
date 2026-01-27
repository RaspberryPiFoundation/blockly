/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {defineEmptyBlock} from './test_helpers/block_definitions.js';
import {MockIcon, MockSerializableIcon} from './test_helpers/icon_mocks.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {simulateClick} from './test_helpers/user_input.js';

class TestIcon extends Blockly.icons.Icon {
  showContextMenu(e) {
    const menuItems = [
      {text: 'Test icon menu item', enabled: true, callback: () => {}},
    ];
    Blockly.ContextMenu.show(
      e,
      menuItems,
      false,
      this.getSourceBlock().workspace,
      this.workspaceLocation,
    );
  }

  getType() {
    new Blockly.icons.IconType('test');
  }
}

suite('Icon', function () {
  setup(function () {
    this.clock = sharedTestSetup.call(this, {fireEventsNow: false}).clock;
    defineEmptyBlock();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  class MockNonSerializableIcon extends MockIcon {
    getType() {
      return 'non-serializable icon';
    }
  }

  function createHeadlessWorkspace() {
    return new Blockly.Workspace();
  }

  function createWorkspaceSvg() {
    const workspace = new Blockly.WorkspaceSvg(new Blockly.Options({}));
    workspace.createDom();
    return workspace;
  }

  function createUninitializedBlock(workspace) {
    return workspace.newBlock('empty_block');
  }

  function createInitializedBlock(workspace) {
    const block = workspace.newBlock('empty_block');
    block.initSvg();
    block.render();
    return block;
  }

  function createHeadlessBlock(workspace) {
    return createUninitializedBlock(workspace);
  }

  suite('Hooks getting properly triggered by the block', function () {
    suite('Triggering view initialization', function () {
      test('initView is not called by headless blocks', function () {
        const workspace = createHeadlessWorkspace();
        const block = createUninitializedBlock(workspace);
        const icon = new MockIcon();
        const initViewSpy = sinon.spy(icon, 'initView');

        block.addIcon(icon);

        assert.isFalse(
          initViewSpy.called,
          'Expected initView to not be called',
        );
      });

      test(
        'initView is called by headful blocks that are currently ' +
          'rendered when the icon is added',
        function () {
          const workspace = new Blockly.WorkspaceSvg(new Blockly.Options({}));
          workspace.createDom();
          const block = createInitializedBlock(workspace);
          const icon = new MockIcon();
          const initViewSpy = sinon.spy(icon, 'initView');

          block.addIcon(icon);
          assert.isTrue(
            initViewSpy.calledOnce,
            'Expected initView to be called',
          );
        },
      );
    });

    suite('Triggering applying colors', function () {
      test('applyColour is not called by headless blocks', function () {
        const workspace = createHeadlessWorkspace();
        const block = createUninitializedBlock(workspace);
        const icon = new MockIcon();
        const applyColourSpy = sinon.spy(icon, 'applyColour');

        block.addIcon(icon);

        assert.isFalse(
          applyColourSpy.called,
          'Expected applyColour to not be called',
        );
      });

      test(
        'applyColour is called by headful blocks that are currently ' +
          'rendered when the icon is added',
        function () {
          const workspace = createWorkspaceSvg();
          const block = createInitializedBlock(workspace);
          const icon = new MockIcon();
          const applyColourSpy = sinon.spy(icon, 'applyColour');

          block.addIcon(icon);
          assert.isTrue(
            applyColourSpy.calledOnce,
            'Expected applyColour to be called',
          );
        },
      );

      test("applyColour is called when the block's color changes", function () {
        const workspace = createWorkspaceSvg();
        const block = createInitializedBlock(workspace);
        const icon = new MockIcon();
        const applyColourSpy = sinon.spy(icon, 'applyColour');

        block.addIcon(icon);
        applyColourSpy.resetHistory();
        block.setColour('#cccccc');
        assert.isTrue(
          applyColourSpy.calledOnce,
          'Expected applyColour to be called',
        );
      });

      test("applyColour is called when the block's style changes", function () {
        const workspace = createWorkspaceSvg();
        const block = createInitializedBlock(workspace);
        const icon = new MockIcon();
        const applyColourSpy = sinon.spy(icon, 'applyColour');

        block.addIcon(icon);
        applyColourSpy.resetHistory();
        block.setStyle('logic_block');
        assert.isTrue(
          applyColourSpy.calledOnce,
          'Expected applyColour to be called',
        );
      });

      test('applyColour is called when the block is disabled', function () {
        const workspace = createWorkspaceSvg();
        const block = createInitializedBlock(workspace);
        const icon = new MockIcon();
        const applyColourSpy = sinon.spy(icon, 'applyColour');

        block.addIcon(icon);
        applyColourSpy.resetHistory();
        block.setDisabledReason(true, 'test reason');
        assert.isTrue(
          applyColourSpy.calledOnce,
          'Expected applyColour to be called',
        );
      });

      test('applyColour is called when the block becomes a shadow', function () {
        const workspace = createWorkspaceSvg();
        const block = createInitializedBlock(workspace);
        const icon = new MockIcon();
        const applyColourSpy = sinon.spy(icon, 'applyColour');

        block.addIcon(icon);
        applyColourSpy.resetHistory();
        block.setShadow(true);
        assert.isTrue(
          applyColourSpy.calledOnce,
          'Expected applyColour to be called',
        );
      });
    });

    suite('Triggering updating editability', function () {
      test('updateEditable is not called by headless blocks', function () {
        const workspace = createHeadlessWorkspace();
        const block = createUninitializedBlock(workspace);
        const icon = new MockIcon();
        const updateEditableSpy = sinon.spy(icon, 'updateEditable');

        block.addIcon(icon);

        assert.isFalse(
          updateEditableSpy.called,
          'Expected updateEditable to not be called',
        );
      });

      test(
        'updateEditable is called by headful blocks that are currently ' +
          'rendered when the icon is added',
        function () {
          const workspace = createWorkspaceSvg();
          const block = createInitializedBlock(workspace);
          const icon = new MockIcon();
          const updateEditableSpy = sinon.spy(icon, 'updateEditable');

          block.addIcon(icon);
          assert.isTrue(
            updateEditableSpy.calledOnce,
            'Expected updateEditable to be called',
          );
        },
      );

      test('updateEditable is called when the block is made ineditable', function () {
        const workspace = createWorkspaceSvg();
        const block = createInitializedBlock(workspace);
        const icon = new MockIcon();
        const updateEditableSpy = sinon.spy(icon, 'updateEditable');

        block.addIcon(icon);
        updateEditableSpy.resetHistory();
        block.setEditable(false);
        assert.isTrue(
          updateEditableSpy.calledOnce,
          'Expected updateEditable to be called',
        );
      });

      test('updateEditable is called when the block is made editable', function () {
        const workspace = createWorkspaceSvg();
        const block = createInitializedBlock(workspace);
        const icon = new MockIcon();
        const updateEditableSpy = sinon.spy(icon, 'updateEditable');

        block.addIcon(icon);
        block.setEditable(false);
        updateEditableSpy.resetHistory();
        block.setEditable(true);
        assert.isTrue(
          updateEditableSpy.calledOnce,
          'Expected updateEditable to be called',
        );
      });
    });

    suite('Triggering updating collapsed-ness', function () {
      test('updateCollapsed is not called by headless blocks', function () {
        const workspace = createHeadlessWorkspace();
        const block = createUninitializedBlock(workspace);
        const icon = new MockIcon();
        const updateCollapsedSpy = sinon.spy(icon, 'updateCollapsed');

        block.addIcon(icon);
        block.setCollapsed(true);
        block.setCollapsed(false);

        assert.isFalse(
          updateCollapsedSpy.called,
          'Expected updateCollapsed to not be called',
        );
      });

      test('updateCollapsed is called when the block is collapsed', function () {
        const workspace = createWorkspaceSvg();
        const block = createInitializedBlock(workspace);
        const icon = new MockIcon();
        const updateCollapsedSpy = sinon.stub(icon, 'updateCollapsed');
        block.addIcon(icon);

        updateCollapsedSpy.resetHistory();
        block.setCollapsed(true);
        this.clock.runAll();

        assert.isTrue(
          updateCollapsedSpy.called,
          'Expected updateCollapsed to be called',
        );
      });

      test('updateCollapsed is called when the block is expanded', function () {
        const workspace = createWorkspaceSvg();
        const block = createInitializedBlock(workspace);
        const icon = new MockIcon();
        const updateCollapsedSpy = sinon.spy(icon, 'updateCollapsed');
        block.addIcon(icon);

        block.setCollapsed(true);
        block.setCollapsed(false);
        this.clock.runAll();

        assert.isTrue(
          updateCollapsedSpy.called,
          'Expected updateCollapsed to be called',
        );
      });
    });
  });

  suite('Serialization', function () {
    test('serializable icons are saved', function () {
      const block = createHeadlessBlock(createHeadlessWorkspace());
      block.addIcon(new MockSerializableIcon());
      const json = Blockly.serialization.blocks.save(block);
      assert.deepNestedInclude(
        json,
        {'icons': {'serializable icon': 'some state'}},
        'Expected the JSON to include the saved state of the ' +
          'serializable icon.',
      );
    });

    test('non-serializable icons are not saved', function () {
      const block = createHeadlessBlock(createHeadlessWorkspace());
      block.addIcon(new MockNonSerializableIcon());
      const json = Blockly.serialization.blocks.save(block);
      assert.notProperty(
        json,
        'icons',
        'Expected the JSON to not include any saved state for icons',
      );
    });
  });

  suite('Deserialization', function () {
    test('registered icons are instantiated and added to the block', function () {
      Blockly.icons.registry.register(
        'serializable icon',
        MockSerializableIcon,
      );

      const workspace = createHeadlessWorkspace();
      const json = {
        'type': 'empty_block',
        'icons': {
          'serializable icon': 'some state',
        },
      };
      const block = Blockly.serialization.blocks.append(json, workspace);
      assert.equal(
        block.getIcon('serializable icon').state,
        'some state',
        'Expected the icon to have been properly instantiated and ' +
          'deserialized',
      );

      Blockly.icons.registry.unregister('serializable icon');
    });

    test('trying to deserialize an unregistered icon throws an error', function () {
      const workspace = createHeadlessWorkspace();
      const json = {
        'type': 'empty_block',
        'icons': {
          'serializable icon': 'some state',
        },
      };
      assert.throws(
        () => {
          Blockly.serialization.blocks.append(json, workspace);
        },
        Blockly.serialization.exceptions.UnregisteredIcon,
        '',
        'Expected deserializing an unregistered icon to throw',
      );
    });
  });

  suite('Contextual menus', function () {
    setup(function () {
      this.workspace = Blockly.inject('blocklyDiv', {});
      Blockly.icons.registry.register(
        new Blockly.icons.IconType('test'),
        TestIcon,
      );

      this.block = this.workspace.newBlock('empty_block');
      this.block.initSvg();
    });

    test('are shown when icons are right clicked', function () {
      const icon = new TestIcon(this.block);
      this.block.addIcon(icon);
      simulateClick(icon.getFocusableElement(), {button: 2});

      const menu = document.querySelector('.blocklyContextMenu');
      assert.isNotNull(menu);
      assert.isTrue(menu.innerText.includes('Test icon menu item'));
    });

    test('default to the contextual menu of the parent block', function () {
      this.block.setCommentText('hello there');
      const icon = this.block.getIcon(Blockly.icons.IconType.COMMENT);
      simulateClick(icon.getFocusableElement(), {button: 2});

      const expectedItems =
        Blockly.ContextMenuRegistry.registry.getContextMenuOptions({
          block: this.block,
        });

      assert.isNotEmpty(expectedItems);
      const menu = document.querySelector('.blocklyContextMenu');
      for (const item of expectedItems) {
        if (!item.text) continue;
        assert.isTrue(menu.innerText.includes(item.text));
      }
    });
  });
});
