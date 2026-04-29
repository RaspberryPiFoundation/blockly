/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  defineRowBlock,
  defineStackBlock,
} from './test_helpers/block_definitions.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {createKeyDownEvent} from './test_helpers/user_input.js';

suite('Keyboard Shortcut Items', function () {
  setup(function () {
    sharedTestSetup.call(this);
    const toolbox = document.getElementById('toolbox-test');
    // Zelos has full-block fields, which we want to exercise in tests.
    this.workspace = Blockly.inject('blocklyDiv', {toolbox, renderer: 'zelos'});
    this.injectionDiv = this.workspace.getInjectionDiv();
    Blockly.ContextMenuRegistry.registry.reset();
    Blockly.ContextMenuItems.registerDefaultOptions();
    defineStackBlock();
    defineRowBlock();
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });

  /**
   * Creates a block and sets it as Blockly.selected.
   * @param {Blockly.Workspace} workspace The workspace to create a new block on.
   * @return {Blockly.Block} The block being selected.
   */
  function setSelectedBlock(workspace) {
    const block = workspace.newBlock('stack_block');
    block.initSvg();
    block.render();
    Blockly.common.setSelected(block);
    Blockly.getFocusManager().focusNode(block);
    return block;
  }

  /**
   * Creates a block and sets its nextConnection as the focused node.
   * @param {Blockly.Workspace} workspace The workspace to create a new block on.
   */
  function setSelectedConnection(workspace) {
    const block = workspace.newBlock('stack_block');
    sinon
      .stub(Blockly.getFocusManager(), 'getFocusedNode')
      .returns(block.nextConnection);
  }

  /**
   * Creates a workspace comment and set it as the focused node.
   * @param {Blockly.Workspace} workspace The workspace to create a new comment on.
   */
  function setSelectedComment(workspace) {
    const comment = workspace.newComment();
    sinon.stub(Blockly.getFocusManager(), 'getFocusedNode').returns(comment);
    return comment;
  }

  /**
   * Creates a test for not running keyDown events when the workspace is in read only mode.
   * @param {Object} keyEvent Mocked key down event. Use createKeyDownEvent.
   * @param {string=} opt_name An optional name for the test case.
   */
  function runReadOnlyTest(keyEvent, opt_name) {
    const name = opt_name ? opt_name : 'Not called when readOnly is true';
    test(name, function () {
      this.workspace.setIsReadOnly(true);
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
  }

  suite('Escape', function () {
    setup(function () {
      this.event = createKeyDownEvent(Blockly.utils.KeyCodes.ESC);
      this.hideChaffSpy = sinon.spy(
        Blockly.WorkspaceSvg.prototype,
        'hideChaff',
      );
    });

    test('Simple', function () {
      this.injectionDiv.dispatchEvent(this.event);
      sinon.assert.calledOnce(this.hideChaffSpy);
    });

    runReadOnlyTest(createKeyDownEvent(Blockly.utils.KeyCodes.ESC));

    test('Not called when focus is on an HTML input', function () {
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ESC);
      const input = document.createElement('textarea');
      input.dispatchEvent(event);
      sinon.assert.notCalled(this.hideChaffSpy);
    });

    test('Not called on hidden workspaces', function () {
      this.workspace.visible = false;
      this.injectionDiv.dispatchEvent(this.event);
      sinon.assert.notCalled(this.hideChaffSpy);
    });

    test('Called when connection is focused', function () {
      setSelectedConnection(this.workspace);
      this.injectionDiv.dispatchEvent(this.event);
      sinon.assert.calledOnce(this.hideChaffSpy);
    });

    test('In the toolbox focuses the workspace', function () {
      Blockly.getFocusManager().focusNode(
        this.workspace.getToolbox().getToolboxItems()[0],
      );
      assert.equal(
        Blockly.getFocusManager().getFocusedTree(),
        this.workspace.getToolbox(),
      );
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.ESC,
        key: 'Escape',
      });
      this.workspace.getToolbox().contentsDiv_.dispatchEvent(event);
      assert.equal(Blockly.getFocusManager().getFocusedTree(), this.workspace);
    });

    test('In the flyout focues the workspace', function () {
      this.injectionDiv.dispatchEvent(
        createKeyDownEvent(Blockly.utils.KeyCodes.T),
      );
      this.injectionDiv.dispatchEvent(
        createKeyDownEvent(Blockly.utils.KeyCodes.RIGHT),
      );
      assert.equal(
        Blockly.getFocusManager().getFocusedTree(),
        this.workspace.getFlyout().getWorkspace(),
      );
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.ESC,
        key: 'Escape',
      });
      this.workspace.getFlyout().svgGroup_.dispatchEvent(event);
      assert.equal(Blockly.getFocusManager().getFocusedTree(), this.workspace);
    });

    test('In a mutator flyout focuses the mutator workspace', async function () {
      const block = this.workspace.newBlock('controls_if');
      block.initSvg();
      block.render();

      const mutatorIcon = block.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);

      const bubble = mutatorIcon.getBubble();
      Blockly.getFocusManager().focusTree(
        bubble.getWorkspace().getFlyout().getWorkspace(),
      );
      const event = new KeyboardEvent('keydown', {
        keyCode: Blockly.utils.KeyCodes.ESC,
        key: 'Escape',
      });
      bubble.getWorkspace().getFlyout().svgGroup_.dispatchEvent(event);
      assert.equal(
        Blockly.getFocusManager().getFocusedTree(),
        bubble.getWorkspace(),
      );
    });
  });

  suite('Delete', function () {
    setup(function () {
      this.hideChaffSpy = sinon.spy(
        Blockly.WorkspaceSvg.prototype,
        'hideChaff',
      );
      setSelectedBlock(this.workspace);
      this.deleteSpy = sinon.spy(Blockly.common.getSelected(), 'dispose');
    });
    const testCases = [
      ['Delete', createKeyDownEvent(Blockly.utils.KeyCodes.DELETE)],
      ['Backspace', createKeyDownEvent(Blockly.utils.KeyCodes.BACKSPACE)],
    ];
    // Delete a block.
    // Note that chaff is hidden when a block is deleted.
    suite('Simple', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.calledOnce(this.hideChaffSpy);
          sinon.assert.calledOnce(this.deleteSpy);
        });
      });
    });
    // Do not delete a block if workspace is in readOnly mode.
    suite('Not called when readOnly is true', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        runReadOnlyTest(keyEvent, testCaseName);
      });
    });
    // Do not delete anything if a connection is focused.
    test('Not called when connection is focused', function () {
      setSelectedConnection(this.workspace);
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.DELETE);
      this.injectionDiv.dispatchEvent(event);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
  });

  suite('Copy', function () {
    setup(function () {
      this.block = setSelectedBlock(this.workspace);
      this.copySpy = sinon.spy(this.block, 'toCopyData');
      this.hideChaffSpy = sinon.spy(
        Blockly.WorkspaceSvg.prototype,
        'hideChaff',
      );
    });
    const keyEvent = createKeyDownEvent(Blockly.utils.KeyCodes.C, [
      Blockly.utils.KeyCodes.CTRL_CMD,
    ]);
    // Copy a block.
    test('Simple', function () {
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.calledOnce(this.copySpy);
      sinon.assert.calledOnce(this.hideChaffSpy);
    });
    // Allow copying a block if a workspace is in readonly mode.
    test('Called when readOnly is true', function () {
      this.workspace.setIsReadOnly(true);
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.calledOnce(this.copySpy);
      sinon.assert.calledOnce(this.hideChaffSpy);
    });
    // Do not copy a block if a drag is in progress.
    test('Drag in progress', function () {
      sinon.stub(this.workspace, 'isDragging').returns(true);
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.notCalled(this.copySpy);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
    // Do not copy a block if is is not deletable.
    test('Block is not deletable', function () {
      sinon.stub(Blockly.common.getSelected(), 'isOwnDeletable').returns(false);
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.notCalled(this.copySpy);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
    // Do not copy a block if it is not movable.
    test('Block is not movable', function () {
      sinon.stub(Blockly.common.getSelected(), 'isOwnMovable').returns(false);
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.notCalled(this.copySpy);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
    test('Not called when connection is focused', function () {
      setSelectedConnection(this.workspace);
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.C, [
        Blockly.utils.KeyCodes.CTRL,
      ]);
      this.injectionDiv.dispatchEvent(event);
      sinon.assert.notCalled(this.copySpy);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
    // Copy a comment.
    test('Workspace comment', function () {
      this.comment = setSelectedComment(this.workspace);
      this.copySpy = sinon.spy(this.comment, 'toCopyData');

      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.calledOnce(this.copySpy);
      sinon.assert.calledOnce(this.hideChaffSpy);
    });
  });

  suite('Cut', function () {
    setup(function () {
      this.block = setSelectedBlock(this.workspace);
      this.copySpy = sinon.spy(this.block, 'toCopyData');
      this.disposeSpy = sinon.spy(this.block, 'dispose');
      this.hideChaffSpy = sinon.spy(
        Blockly.WorkspaceSvg.prototype,
        'hideChaff',
      );
    });
    const keyEvent = createKeyDownEvent(Blockly.utils.KeyCodes.X, [
      Blockly.utils.KeyCodes.CTRL_CMD,
    ]);
    // Cut a block.
    test('Simple', function () {
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.calledOnce(this.copySpy);
      sinon.assert.calledOnce(this.disposeSpy);
      sinon.assert.calledOnce(this.hideChaffSpy);
    });
    // Do not cut a block if a workspace is in readonly mode.
    test('Not called when readOnly is true', function () {
      this.workspace.setIsReadOnly(true);
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.notCalled(this.copySpy);
      sinon.assert.notCalled(this.disposeSpy);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
    // Do not cut a block if a drag is in progress.
    test('Drag in progress', function () {
      sinon.stub(this.workspace, 'isDragging').returns(true);
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.notCalled(this.copySpy);
      sinon.assert.notCalled(this.disposeSpy);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
    // Do not cut a block if is is not deletable.
    test('Block is not deletable', function () {
      sinon.stub(Blockly.common.getSelected(), 'isOwnDeletable').returns(false);
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.notCalled(this.copySpy);
      sinon.assert.notCalled(this.disposeSpy);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
    // Do not cut a block if it is not movable.
    test('Block is not movable', function () {
      sinon.stub(Blockly.common.getSelected(), 'isOwnMovable').returns(false);
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.notCalled(this.copySpy);
      sinon.assert.notCalled(this.disposeSpy);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
    test('Not called when connection is focused', function () {
      setSelectedConnection(this.workspace);
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.C, [
        Blockly.utils.KeyCodes.CTRL,
      ]);
      this.injectionDiv.dispatchEvent(event);
      sinon.assert.notCalled(this.copySpy);
      sinon.assert.notCalled(this.disposeSpy);
      sinon.assert.notCalled(this.hideChaffSpy);
    });

    // Cut a comment.
    test('Workspace comment', function () {
      this.comment = setSelectedComment(this.workspace);
      this.copySpy = sinon.spy(this.comment, 'toCopyData');
      this.disposeSpy = sinon.spy(this.comment, 'dispose');

      this.injectionDiv.dispatchEvent(keyEvent);

      const deleteEvents = this.workspace
        .getUndoStack()
        .filter((e) => e.type === 'comment_delete');
      assert(deleteEvents[0].group !== ''); // Group string is not empty
      sinon.assert.calledOnce(this.copySpy);
      sinon.assert.calledOnce(this.disposeSpy);
    });
  });

  suite('Paste', function () {
    test('Disabled when nothing has been copied', function () {
      const pasteShortcut =
        Blockly.ShortcutRegistry.registry.getRegistry()[
          Blockly.ShortcutItems.names.PASTE
        ];
      Blockly.clipboard.setLastCopiedData(undefined);

      const isPasteEnabled = pasteShortcut.preconditionFn();
      assert.isFalse(isPasteEnabled);
    });
  });

  suite('Undo', function () {
    setup(function () {
      this.undoSpy = sinon.spy(this.workspace, 'undo');
      this.hideChaffSpy = sinon.spy(
        Blockly.WorkspaceSvg.prototype,
        'hideChaff',
      );
    });
    const keyEvent = createKeyDownEvent(Blockly.utils.KeyCodes.Z, [
      Blockly.utils.KeyCodes.CTRL_CMD,
    ]);
    // Undo.
    test('Simple', function () {
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.calledOnce(this.undoSpy);
      sinon.assert.calledWith(this.undoSpy, false);
      sinon.assert.calledOnce(this.hideChaffSpy);
    });
    // Do not undo if a drag is in progress.
    test('Drag in progress', function () {
      sinon.stub(this.workspace, 'isDragging').returns(true);
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.notCalled(this.undoSpy);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
    // Do not undo if the workspace is in readOnly mode.
    test('Not called when readOnly is true', function () {
      runReadOnlyTest(keyEvent);
    });
  });

  suite('Redo', function () {
    setup(function () {
      this.redoSpy = sinon.spy(this.workspace, 'undo');
      this.hideChaffSpy = sinon.spy(
        Blockly.WorkspaceSvg.prototype,
        'hideChaff',
      );
    });
    const keyEvent = createKeyDownEvent(Blockly.utils.KeyCodes.Z, [
      Blockly.utils.KeyCodes.CTRL_CMD,
      Blockly.utils.KeyCodes.SHIFT,
    ]);
    // Undo.
    test('Simple', function () {
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.calledOnce(this.redoSpy);
      sinon.assert.calledWith(this.redoSpy, true);
      sinon.assert.calledOnce(this.hideChaffSpy);
    });
    // Do not redo if a drag is in progress.
    test('Drag in progress', function () {
      sinon.stub(this.workspace, 'isDragging').returns(true);
      this.injectionDiv.dispatchEvent(keyEvent);
      sinon.assert.notCalled(this.redoSpy);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
    // Do not undo if the workspace is in readOnly mode.
    test('Not called when readOnly is true', function () {
      runReadOnlyTest(keyEvent);
    });
  });

  suite('UndoWindows', function () {
    setup(function () {
      this.ctrlYEvent = createKeyDownEvent(Blockly.utils.KeyCodes.Y, [
        Blockly.utils.KeyCodes.CTRL,
      ]);
      this.undoSpy = sinon.spy(this.workspace, 'undo');
      this.hideChaffSpy = sinon.spy(
        Blockly.WorkspaceSvg.prototype,
        'hideChaff',
      );
    });
    test('Simple', function () {
      this.injectionDiv.dispatchEvent(this.ctrlYEvent);
      sinon.assert.calledOnce(this.undoSpy);
      sinon.assert.calledWith(this.undoSpy, true);
      sinon.assert.calledOnce(this.hideChaffSpy);
    });
    test('Not called when a drag is in progress', function () {
      sinon.stub(this.workspace, 'isDragging').returns(true);
      this.injectionDiv.dispatchEvent(this.ctrlYEvent);
      sinon.assert.notCalled(this.undoSpy);
      sinon.assert.notCalled(this.hideChaffSpy);
    });
    runReadOnlyTest(
      createKeyDownEvent(Blockly.utils.KeyCodes.Y, [
        Blockly.utils.KeyCodes.CTRL,
      ]),
    );
  });

  suite('Show context menu (Ctrl/Cmd+Enter)', function () {
    const contextMenuKeyEvent = createKeyDownEvent(
      Blockly.utils.KeyCodes.ENTER,
      [Blockly.utils.KeyCodes.CTRL_CMD],
    );

    test('Displays context menu on a block using the keyboard shortcut', function () {
      const block = setSelectedBlock(this.workspace);
      this.injectionDiv.dispatchEvent(contextMenuKeyEvent);

      const menu = Blockly.ContextMenu.getMenu();
      assert.instanceOf(menu, Blockly.Menu, 'Context menu should be shown');

      const menuOptions =
        Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
          {block, focusedNode: block},
          contextMenuKeyEvent,
        );
      for (const option of menuOptions) {
        assert.include(menu.getElement().textContent, option.text);
      }
    });

    test('Displays context menu on the workspace using the keyboard shortcut', function () {
      Blockly.getFocusManager().focusNode(this.workspace);
      this.injectionDiv.dispatchEvent(contextMenuKeyEvent);

      const menu = Blockly.ContextMenu.getMenu();
      assert.instanceOf(menu, Blockly.Menu, 'Context menu should be shown');
      const menuOptions =
        Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
          {workspace: this.workspace, focusedNode: this.workspace},
          contextMenuKeyEvent,
        );
      for (const option of menuOptions) {
        assert.include(menu.getElement().textContent, option.text);
      }
    });

    test('Displays context menu on a workspace comment using the keyboard shortcut', function () {
      Blockly.ContextMenuItems.registerCommentOptions();
      const comment = setSelectedComment(this.workspace);
      this.injectionDiv.dispatchEvent(contextMenuKeyEvent);

      const menu = Blockly.ContextMenu.getMenu();
      assert.instanceOf(menu, Blockly.Menu, 'Context menu should be shown');
      const menuOptions =
        Blockly.ContextMenuRegistry.registry.getContextMenuOptions(
          {comment, focusedNode: comment},
          contextMenuKeyEvent,
        );
      for (const option of menuOptions) {
        assert.include(menu.getElement().textContent, option.text);
      }
    });

    test('First menu item is highlighted when context menu is shown via keyboard shortcut', function () {
      setSelectedBlock(this.workspace);
      this.injectionDiv.dispatchEvent(contextMenuKeyEvent);

      const menuEl = Blockly.ContextMenu.getMenu().getElement();
      const firstMenuItem = menuEl.querySelector('.blocklyMenuItem');
      assert.isTrue(
        firstMenuItem.classList.contains('blocklyMenuItemHighlight'),
      );
    });

    test('Context menu is not shown when shortcut is invoked while a field is focused', function () {
      const block = this.workspace.newBlock('math_arithmetic');
      block.initSvg();
      const field = block.getField('OP');
      Blockly.getFocusManager().focusNode(field);
      this.injectionDiv.dispatchEvent(contextMenuKeyEvent);

      assert.isNull(
        Blockly.ContextMenu.getMenu(),
        'Context menu should not be triggered when a field is focused',
      );
    });
  });

  suite('Focus Workspace (W)', function () {
    setup(function () {
      this.testFocusChange = (startingElement) => {
        Blockly.getFocusManager().focusNode(startingElement);
        assert.strictEqual(
          Blockly.getFocusManager().getFocusedNode(),
          startingElement,
        );
        const event = createKeyDownEvent(Blockly.utils.KeyCodes.W);
        this.workspace.getInjectionDiv().dispatchEvent(event);
        assert.strictEqual(
          Blockly.getFocusManager().getFocusedNode(),
          this.workspace,
        );
      };
    });

    test('Does not change focus when workspace is already focused', function () {
      this.testFocusChange(this.workspace);
    });

    test('Focuses workspace when toolbox is focused', function () {
      this.testFocusChange(this.workspace.getToolbox());
    });

    test('Focuses workspace when flyout is focused', function () {
      this.workspace.getToolbox().getFlyout().show();
      const flyoutWorkspace = this.workspace
        .getToolbox()
        .getFlyout()
        .getWorkspace();
      this.testFocusChange(flyoutWorkspace);
    });

    test('Focuses workspace when a block is focused', function () {
      const block = this.workspace.newBlock('controls_if');
      this.testFocusChange(block);
    });

    suite('With mutator', function () {
      test('Focuses root workspace when a mutator block is focused', async function () {
        const block = this.workspace.newBlock('controls_if');
        const icon = block.getIcon(Blockly.icons.MutatorIcon.TYPE);
        await icon.setBubbleVisible(true);
        const mutatorWorkspace = icon.getWorkspace();
        this.testFocusChange(mutatorWorkspace.getAllBlocks()[0]);
      });

      test("Focuses workspace when a mutator's flyout is focused", async function () {
        const block = this.workspace.newBlock('controls_if');
        const icon = block.getIcon(Blockly.icons.MutatorIcon.TYPE);
        await icon.setBubbleVisible(true);
        const mutatorFlyoutWorkspace = icon
          .getWorkspace()
          .getFlyout()
          .getWorkspace();
        this.testFocusChange(mutatorFlyoutWorkspace);
      });
    });
  });

  suite('Workspace Information (I)', function () {
    setup(function () {
      const keyEvent = createKeyDownEvent(Blockly.utils.KeyCodes.I);
      // Helper to trigger the shortcut and assert the live region text.
      this.assertAnnouncement = (expected) => {
        this.injectionDiv.dispatchEvent(keyEvent);
        // Wait for the live region to update after the event.
        this.clock.tick(11);
        // The announcement may include an additional non-breaking space.
        assert.include(this.liveRegion.textContent, expected);
      };
      this.liveRegion = document.getElementById('blocklyAriaAnnounce');
    });

    test('Empty workspace', function () {
      // Start with empty workspace.
      Blockly.getFocusManager().focusNode(this.workspace);
      this.assertAnnouncement('No blocks in workspace.');
    });

    test('One block', function () {
      this.workspace.newBlock('stack_block');
      Blockly.getFocusManager().focusNode(this.workspace);
      this.assertAnnouncement('One stack of blocks in workspace.');
    });

    test('Two blocks', function () {
      this.workspace.newBlock('stack_block');
      this.workspace.newBlock('stack_block');
      Blockly.getFocusManager().focusNode(this.workspace);
      this.assertAnnouncement('2 stacks of blocks in workspace.');
    });

    test('One comment', function () {
      this.workspace.newComment();
      Blockly.getFocusManager().focusNode(this.workspace);
      this.assertAnnouncement('No blocks and one comment in workspace.');
    });

    test('Two comments', function () {
      this.workspace.newComment();
      this.workspace.newComment();
      Blockly.getFocusManager().focusNode(this.workspace);
      this.assertAnnouncement('No blocks and 2 comments in workspace.');
    });

    test('One block, one comment', function () {
      this.workspace.newBlock('stack_block');
      this.workspace.newComment();
      Blockly.getFocusManager().focusNode(this.workspace);
      this.assertAnnouncement(
        'One stack of blocks and one comment in workspace.',
      );
    });

    test('Two blocks, two comments', function () {
      this.workspace.newBlock('stack_block');
      this.workspace.newBlock('stack_block');
      this.workspace.newComment();
      this.workspace.newComment();
      Blockly.getFocusManager().focusNode(this.workspace);
      this.assertAnnouncement(
        '2 stacks of blocks and 2 comments in workspace.',
      );
    });

    suite('Preconditions', function () {
      test('Not called when focus is not on workspace', function () {
        this.block = this.workspace.newBlock('stack_block');
        Blockly.getFocusManager().focusNode(this.block);
        this.assertAnnouncement('');
      });
    });
  });

  suite('Focus Toolbox (T)', function () {
    test('Does not change focus when toolbox item is already focused', function () {
      const item = this.workspace.getToolbox().getToolboxItems()[1];
      Blockly.getFocusManager().focusNode(item);
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.T);
      this.workspace.getInjectionDiv().dispatchEvent(event);
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), item);
    });

    test('Focuses toolbox when workspace is focused', function () {
      Blockly.getFocusManager().focusTree(this.workspace);
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.T);
      this.workspace.getInjectionDiv().dispatchEvent(event);
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedTree(),
        this.workspace.getToolbox(),
      );
    });

    test('Focuses mutator flyout when mutator workspace is focused', async function () {
      const block = this.workspace.newBlock('controls_if');
      const icon = block.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await icon.setBubbleVisible(true);
      const mutatorWorkspace = icon.getWorkspace();
      Blockly.getFocusManager().focusTree(mutatorWorkspace);
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.T);
      this.workspace.getInjectionDiv().dispatchEvent(event);
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedTree(),
        mutatorWorkspace.getFlyout().getWorkspace(),
      );
    });
  });

  suite('Disconnect Block (X)', function () {
    setup(function () {
      this.blockA = this.workspace.newBlock('stack_block');
      this.blockB = this.workspace.newBlock('stack_block');
      this.blockC = this.workspace.newBlock('stack_block');
      this.blockD = this.workspace.newBlock('stack_block');

      this.blockB.nextConnection.connect(this.blockC.previousConnection);
      this.blockC.nextConnection.connect(this.blockD.previousConnection);

      this.blockE = this.workspace.newBlock('row_block');
      this.blockF = this.workspace.newBlock('row_block');
      this.blockG = this.workspace.newBlock('row_block');
      this.blockH = this.workspace.newBlock('row_block');
      for (const block of [
        this.blockE,
        this.blockF,
        this.blockG,
        this.blockH,
      ]) {
        block.setInputsInline(false);
      }

      this.blockF.inputList[0].connection.connect(this.blockG.outputConnection);
      this.blockG.inputList[0].connection.connect(this.blockH.outputConnection);

      for (const block of this.workspace.getAllBlocks()) {
        block.initSvg();
        block.render();
      }
    });
    test('Does nothing for single top-level stack block', function () {
      Blockly.getFocusManager().focusNode(this.blockA);
      const bounds = this.blockA.getBoundingRectangle();

      this.injectionDiv.dispatchEvent(
        createKeyDownEvent(Blockly.utils.KeyCodes.X),
      );

      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.blockA,
      );
      assert.deepEqual(bounds, this.blockA.getBoundingRectangle());
    });

    test('Does nothing for single top-level value block', function () {
      Blockly.getFocusManager().focusNode(this.blockE);
      const bounds = this.blockE.getBoundingRectangle();

      this.injectionDiv.dispatchEvent(
        createKeyDownEvent(Blockly.utils.KeyCodes.X),
      );

      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.blockE,
      );
      assert.deepEqual(bounds, this.blockE.getBoundingRectangle());
    });

    test('Disconnects child blocks when triggered on top stack block', function () {
      Blockly.getFocusManager().focusNode(this.blockB);
      assert.isTrue(this.blockB.nextConnection.isConnected());
      assert.isTrue(this.blockC.previousConnection.isConnected());

      this.injectionDiv.dispatchEvent(
        createKeyDownEvent(Blockly.utils.KeyCodes.X),
      );

      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.blockB,
      );
      // Blocks B and C should have been disconnected.
      assert.isFalse(this.blockB.nextConnection.isConnected());
      assert.isFalse(this.blockC.previousConnection.isConnected());

      // Blocks C and D should remain connected.
      assert.isTrue(this.blockC.nextConnection.isConnected());
      assert.isTrue(this.blockD.previousConnection.isConnected());
    });

    test('Disconnects and heals stack when triggered on mid-stack block', function () {
      Blockly.getFocusManager().focusNode(this.blockC);
      assert.isTrue(this.blockC.nextConnection.isConnected());
      assert.isTrue(this.blockC.previousConnection.isConnected());

      this.injectionDiv.dispatchEvent(
        createKeyDownEvent(Blockly.utils.KeyCodes.X),
      );

      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.blockC,
      );
      // Block C should be disconnected
      assert.isFalse(this.blockC.nextConnection.isConnected());
      assert.isFalse(this.blockC.previousConnection.isConnected());

      // Blocks B and D should be connected to each other due to stack healing.
      assert.isTrue(this.blockB.nextConnection.isConnected());
      assert.isTrue(this.blockD.previousConnection.isConnected());
      assert.strictEqual(this.blockB.nextConnection.targetBlock(), this.blockD);
      assert.strictEqual(
        this.blockD.previousConnection.targetBlock(),
        this.blockB,
      );
    });

    test('Disconnects and heals stack when triggered on mid-row value block', function () {
      Blockly.getFocusManager().focusNode(this.blockG);
      assert.isTrue(this.blockF.inputList[0].connection.isConnected());
      assert.isTrue(this.blockG.outputConnection.isConnected());

      this.injectionDiv.dispatchEvent(
        createKeyDownEvent(Blockly.utils.KeyCodes.X),
      );

      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.blockG,
      );
      // Block G should be disconnected
      assert.isFalse(this.blockG.outputConnection.isConnected());
      assert.isFalse(this.blockG.inputList[0].connection.isConnected());

      // Blocks F and H should be connected to each other due to stack healing.
      assert.isTrue(this.blockF.inputList[0].connection.isConnected());
      assert.isTrue(this.blockH.outputConnection.isConnected());
      assert.strictEqual(
        this.blockF.inputList[0].connection.targetBlock(),
        this.blockH,
      );
      assert.strictEqual(
        this.blockH.outputConnection.targetBlock(),
        this.blockF,
      );
    });

    test('Includes subsequent stack blocks when triggered with Shift', function () {
      Blockly.getFocusManager().focusNode(this.blockC);
      assert.isTrue(this.blockC.nextConnection.isConnected());
      assert.isTrue(this.blockC.previousConnection.isConnected());

      this.injectionDiv.dispatchEvent(
        createKeyDownEvent(Blockly.utils.KeyCodes.X, [
          Blockly.utils.KeyCodes.SHIFT,
        ]),
      );

      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.blockC,
      );
      // Block C should be disconnected from block B but still connected to
      // Block D.
      assert.isFalse(this.blockB.nextConnection.isConnected());
      assert.isFalse(this.blockC.previousConnection.isConnected());
      assert.isTrue(this.blockC.nextConnection.isConnected());
      assert.strictEqual(this.blockC.nextConnection.targetBlock(), this.blockD);
      assert.strictEqual(
        this.blockD.previousConnection.targetBlock(),
        this.blockC,
      );
    });

    test('Includes subsequent value blocks when triggered with Shift', function () {
      Blockly.getFocusManager().focusNode(this.blockG);
      assert.isTrue(this.blockF.inputList[0].connection.isConnected());
      assert.isTrue(this.blockG.outputConnection.isConnected());

      this.injectionDiv.dispatchEvent(
        createKeyDownEvent(Blockly.utils.KeyCodes.X, [
          Blockly.utils.KeyCodes.SHIFT,
        ]),
      );

      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.blockG,
      );
      // Block G should be disconnected from block F but still connected to
      // Block H.
      assert.isFalse(this.blockF.inputList[0].connection.isConnected());
      assert.isFalse(this.blockG.outputConnection.isConnected());
      assert.isTrue(this.blockG.inputList[0].connection.isConnected());
      assert.strictEqual(
        this.blockG.inputList[0].connection.targetBlock(),
        this.blockH,
      );
      assert.strictEqual(
        this.blockH.outputConnection.targetBlock(),
        this.blockG,
      );
    });
  });

  suite('Stack navigation (N / B)', function () {
    const keyNextStack = () => createKeyDownEvent(Blockly.utils.KeyCodes.N);
    const keyPrevStack = () => createKeyDownEvent(Blockly.utils.KeyCodes.B);

    setup(function () {
      this.block1 = this.workspace.newBlock('controls_if');
      this.block2 = this.workspace.newBlock('logic_compare');
      this.block3 = this.workspace.newBlock('stack_block');
      this.block2.moveBy(0, 100);
      this.block3.moveBy(0, 400);

      for (const block of [this.block1, this.block2, this.block3]) {
        block.initSvg();
        block.render();
      }

      this.comment1 = this.workspace.newComment();
      this.comment2 = this.workspace.newComment();
      this.comment1.moveBy(0, 200);
      this.comment2.moveBy(0, 300);
    });

    test('First stack navigating back is a no-op', function () {
      this.workspace.getNavigator().setNavigationLoops(false);
      Blockly.getFocusManager().focusNode(this.block1);
      this.injectionDiv.dispatchEvent(keyPrevStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block1,
      );
    });

    test('First stack navigating back loops', function () {
      this.workspace.getNavigator().setNavigationLoops(true);
      Blockly.getFocusManager().focusNode(this.block1);
      this.injectionDiv.dispatchEvent(keyPrevStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block3,
      );
    });

    test('Last stack navigating forward is a no-op', function () {
      this.workspace.getNavigator().setNavigationLoops(false);
      Blockly.getFocusManager().focusNode(this.block3);
      this.injectionDiv.dispatchEvent(keyNextStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block3,
      );
    });

    test('Last stack navigating forward loops', function () {
      this.workspace.getNavigator().setNavigationLoops(true);
      Blockly.getFocusManager().focusNode(this.block3);
      this.injectionDiv.dispatchEvent(keyNextStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block1,
      );
    });

    test('Block forward to block', function () {
      Blockly.getFocusManager().focusNode(this.block1);
      this.injectionDiv.dispatchEvent(keyNextStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block2,
      );
    });

    test('Block back to block', function () {
      Blockly.getFocusManager().focusNode(this.block2);
      this.injectionDiv.dispatchEvent(keyPrevStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block1,
      );
    });

    test('Block forward to workspace comment', function () {
      Blockly.getFocusManager().focusNode(this.block2);
      this.injectionDiv.dispatchEvent(keyNextStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.comment1,
      );
    });

    test('Block back to workspace comment', function () {
      Blockly.getFocusManager().focusNode(this.block3);
      this.injectionDiv.dispatchEvent(keyPrevStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.comment2,
      );
    });

    test('Workspace comment forward to workspace comment', function () {
      Blockly.getFocusManager().focusNode(this.comment1);
      this.injectionDiv.dispatchEvent(keyNextStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.comment2,
      );
    });

    test('Workspace comment back to workspace comment', function () {
      Blockly.getFocusManager().focusNode(this.comment2);
      this.injectionDiv.dispatchEvent(keyPrevStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.comment1,
      );
    });

    test('Workspace comment forward to block', function () {
      Blockly.getFocusManager().focusNode(this.comment2);
      this.injectionDiv.dispatchEvent(keyNextStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block3,
      );
    });

    test('Workspace comment back to block', function () {
      Blockly.getFocusManager().focusNode(this.comment1);
      this.injectionDiv.dispatchEvent(keyPrevStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block2,
      );
    });

    test('Block forward to block in mutator workspace', async function () {
      const icon = this.block1.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await icon.setBubbleVisible(true);
      this.clock.runAll();
      const mutatorWorkspace = icon.getWorkspace();
      const stack1 = mutatorWorkspace.newBlock('controls_if_elseif');
      const stack2 = mutatorWorkspace.newBlock('controls_if_elseif');
      stack1.initSvg();
      stack2.initSvg();
      stack1.render();
      stack2.render();
      stack1.moveBy(0, 100);
      stack2.moveBy(0, 200);
      Blockly.getFocusManager().focusNode(stack1);
      this.injectionDiv.dispatchEvent(keyNextStack());
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), stack2);
    });

    test('Block back to block in mutator workspace', async function () {
      const icon = this.block1.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await icon.setBubbleVisible(true);
      this.clock.runAll();
      const mutatorWorkspace = icon.getWorkspace();
      const stack1 = mutatorWorkspace.newBlock('controls_if_elseif');
      const stack2 = mutatorWorkspace.newBlock('controls_if_elseif');
      stack1.initSvg();
      stack2.initSvg();
      stack1.render();
      stack2.render();
      stack1.moveBy(0, 100);
      stack2.moveBy(0, 200);
      Blockly.getFocusManager().focusNode(stack2);
      this.injectionDiv.dispatchEvent(keyPrevStack());
      assert.strictEqual(Blockly.getFocusManager().getFocusedNode(), stack1);
    });

    test('Next stack from nested element', async function () {
      const icon = this.block1.getIcon(Blockly.icons.MutatorIcon.TYPE);
      Blockly.getFocusManager().focusNode(icon);
      this.injectionDiv.dispatchEvent(keyNextStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block2,
      );
    });

    test('Navigating forward is inhibited when widgetdiv is visible', function () {
      Blockly.getFocusManager().focusNode(this.block2);
      this.block2.showContextMenu();
      assert.isTrue(Blockly.WidgetDiv.isVisible());
      this.injectionDiv.dispatchEvent(keyNextStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block2,
      );
    });

    test('Navigating forward is inhibited when dropdowndiv is visible', function () {
      Blockly.getFocusManager().focusNode(this.block2);
      this.block2.getField('OP').showEditor();
      assert.isTrue(Blockly.DropDownDiv.isVisible());
      this.injectionDiv.dispatchEvent(keyNextStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block2,
      );
    });

    test('Navigating backward is inhibited when widgetdiv is visible', function () {
      Blockly.getFocusManager().focusNode(this.block2);
      this.block2.showContextMenu();
      assert.isTrue(Blockly.WidgetDiv.isVisible());
      this.injectionDiv.dispatchEvent(keyPrevStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block2,
      );
    });

    test('Navigating backward is inhibited when dropdowndiv is visible', function () {
      Blockly.getFocusManager().focusNode(this.block2);
      this.block2.getField('OP').showEditor();
      assert.isTrue(Blockly.DropDownDiv.isVisible());
      this.injectionDiv.dispatchEvent(keyPrevStack());
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        this.block2,
      );
    });
  });

  suite('Perform Action (Enter)', function () {
    test('Shows a toast with navigation hints on the workspace', function () {
      const toastSpy = sinon.spy(Blockly.Toast, 'show');

      Blockly.getFocusManager().focusNode(this.workspace);

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      sinon.assert.calledWith(toastSpy, this.workspace, {
        id: 'workspaceNavigationHint',
        message: Blockly.Msg['KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT'],
      });

      toastSpy.restore();
    });

    test('Inserts blocks from the flyout in move mode', function () {
      const first = this.workspace.newBlock('stack_block');
      first.initSvg();
      first.render();

      this.workspace.getToolbox().selectItemByPosition(0);
      const block = this.workspace
        .getNavigator()
        .getFirstChild(this.workspace.getFlyout().getWorkspace());
      assert.instanceOf(block, Blockly.BlockSvg);
      Blockly.getFocusManager().focusNode(block);
      first.moveTo(new Blockly.utils.Coordinate(500, 500));

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
      this.workspace.getInjectionDiv().dispatchEvent(event);
      const event2 = createKeyDownEvent(Blockly.utils.KeyCodes.UP);
      this.workspace.getInjectionDiv().dispatchEvent(event2);

      const movingBlock = Blockly.getFocusManager().getFocusedNode();
      assert.notEqual(block, movingBlock);
      assert.instanceOf(movingBlock, Blockly.BlockSvg);
      assert.isTrue(movingBlock.isDragging());
      assert.isFalse(movingBlock.workspace.isFlyout);

      const hasInsertionMarker = this.workspace
        .getTopBlocks()
        .flatMap((b) => b.getChildren())
        .some((b) => b.isInsertionMarker());
      assert.isTrue(hasInsertionMarker);

      Blockly.KeyboardMover.mover.abortMove();
    });

    test('Shows a toast with navigation hints for navigable blocks', function () {
      const toastSpy = sinon.spy(Blockly.Toast, 'show');

      const block = this.workspace.newBlock('controls_if');
      block.initSvg();
      block.render();
      Blockly.getFocusManager().focusNode(block);

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      sinon.assert.calledWith(toastSpy, this.workspace, {
        id: 'blockNavigationHint',
        message: Blockly.Msg['KEYBOARD_NAV_BLOCK_NAVIGATION_HINT'],
      });
      toastSpy.restore();
    });

    // Reenable this tests once the shortcut listing shortcut has been added.
    test.skip('Shows a toast with instructions to view help for non-navigable blocks', function () {
      const toastSpy = sinon.spy(Blockly.Toast, 'show');

      const block = this.workspace.newBlock('test_align_dummy_right');
      block.initSvg();
      block.render();
      Blockly.getFocusManager().focusNode(block);

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      sinon.assert.calledWith(toastSpy, this.workspace, {
        id: 'helpHint',
        message: Blockly.Msg['HELP_PROMPT'].replace('%1', ''),
      });
      toastSpy.restore();
    });

    test('Focuses field editor for blocks with full-block fields', function () {
      const block = this.workspace.newBlock('math_number');
      block.initSvg();
      block.render();
      Blockly.getFocusManager().focusNode(block);

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      const field = block.getField('NUM');
      assert.isTrue(Blockly.WidgetDiv.isVisible());
      assert.isTrue(field.isBeingEdited_);
    });

    test('Focuses field editor for fields', function () {
      const block = this.workspace.newBlock('logic_compare');
      block.initSvg();
      block.render();
      const field = block.getField('OP');
      Blockly.getFocusManager().focusNode(field);

      assert.isFalse(Blockly.DropDownDiv.isVisible());

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      assert.isTrue(Blockly.DropDownDiv.isVisible());
    });

    test('Expands and focuses workspace comment editors', function () {
      const comment = this.workspace.newComment();
      comment.setCollapsed(true);
      Blockly.getFocusManager().focusNode(comment);

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        comment.getEditorFocusableNode(),
      );
      assert.isFalse(comment.view.isCollapsed());
    });

    test('Focuses mutator workspace for mutator bubble', async function () {
      const block = this.workspace.newBlock('controls_if');
      block.initSvg();
      block.render();
      const icon = block.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await icon.setBubbleVisible(true);
      Blockly.getFocusManager().focusNode(icon.getBubble());

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      assert.strictEqual(
        Blockly.getFocusManager().getFocusedTree(),
        icon.getWorkspace(),
      );
    });

    test('Focuses comment editor for block comment bubble', async function () {
      const block = this.workspace.newBlock('controls_if');
      block.initSvg();
      block.render();
      block.setCommentText('Hello');
      const icon = block.getIcon(Blockly.icons.CommentIcon.TYPE);
      await icon.setBubbleVisible(true);
      Blockly.getFocusManager().focusNode(icon.getBubble());

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        icon.getBubble().getEditor(),
      );
    });

    test('Focuses bubble for icons', async function () {
      const block = this.workspace.newBlock('controls_if');
      block.initSvg();
      block.render();

      block.setCommentText('Hello world');
      block.setWarningText('Danger!');

      const iconTypes = [
        Blockly.icons.CommentIcon.TYPE,
        Blockly.icons.WarningIcon.TYPE,
        Blockly.icons.MutatorIcon.TYPE,
      ];

      for (const iconType of iconTypes) {
        const icon = block.getIcon(iconType);
        Blockly.getFocusManager().focusNode(icon);

        const bubbleShown = new Promise((resolve) => {
          this.workspace.addChangeListener((event) => {
            if (event.type === Blockly.Events.BUBBLE_OPEN) {
              resolve();
            }
          });
        });

        const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
        this.workspace.getInjectionDiv().dispatchEvent(event);

        this.clock.tick(100);

        await bubbleShown;
        assert.strictEqual(
          Blockly.getFocusManager().getFocusedNode(),
          icon.getBubble(),
        );
      }
    });

    test('Triggers flyout button actions', function () {
      const toolbox = this.workspace.getToolbox();
      toolbox.selectItemByPosition(3);
      const button = this.workspace.getFlyout().getContents()[0].getElement();
      assert.instanceOf(button, Blockly.FlyoutButton);
      Blockly.getFocusManager().focusNode(button);

      const oldCallback = this.workspace.getButtonCallback('CREATE_VARIABLE');
      let called = false;
      this.workspace.registerButtonCallback('CREATE_VARIABLE', () => {
        called = true;
      });

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      assert.isTrue(called);
      this.workspace.registerButtonCallback('CREATE_VARIABLE', oldCallback);
    });

    test('Is inhibited when dropdowndiv is visible', function () {
      const block = this.workspace.newBlock('logic_compare');
      block.initSvg();
      block.render();
      const field = block.getField('OP');
      Blockly.getFocusManager().focusNode(field);
      field.showEditor();

      assert.isTrue(Blockly.DropDownDiv.isVisible());

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      assert.isTrue(Blockly.DropDownDiv.isVisible());
    });

    test('Is inhibited when widgetdiv is visible', function () {
      const block = this.workspace.newBlock('logic_compare');
      block.initSvg();
      block.render();
      const field = block.getField('OP');
      block.showContextMenu();
      Blockly.getFocusManager().focusNode(field);

      assert.isTrue(Blockly.WidgetDiv.isVisible());

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      assert.isTrue(Blockly.WidgetDiv.isVisible());
    });
  });

  suite('Duplicate (D)', function () {
    test('Can duplicate blocks', function () {
      const block = this.workspace.newBlock('controls_if');
      Blockly.getFocusManager().focusNode(block);
      assert.equal(this.workspace.getTopBlocks().length, 1);
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.D);
      this.workspace.getInjectionDiv().dispatchEvent(event);
      const topBlocks = this.workspace.getTopBlocks(true);
      assert.equal(topBlocks.length, 2);
      assert.notEqual(topBlocks[1], block);
      assert.equal(topBlocks[1].type, block.type);
    });

    test('Can duplicate workspace comments', function () {
      const comment = this.workspace.newComment();
      comment.setText('Hello');
      Blockly.getFocusManager().focusNode(comment);
      assert.equal(this.workspace.getTopComments().length, 1);
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.D);
      this.workspace.getInjectionDiv().dispatchEvent(event);
      const topComments = this.workspace.getTopComments(true);
      assert.equal(topComments.length, 2);
      assert.notEqual(topComments[1], comment);
      assert.equal(topComments[1].getText(), comment.getText());
    });

    test('Does not duplicate blocks on a readonly workspace', function () {
      const block = this.workspace.newBlock('controls_if');
      this.workspace.setIsReadOnly(true);
      Blockly.getFocusManager().focusNode(block);
      assert.equal(this.workspace.getTopBlocks().length, 1);
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.D);
      this.workspace.getInjectionDiv().dispatchEvent(event);
      assert.equal(this.workspace.getTopBlocks().length, 1);
    });

    test('Does not duplicate blocks that are not duplicatable', function () {
      const block = this.workspace.newBlock('controls_if');
      this.workspace.options.maxBlocks = 1;
      assert.isFalse(block.isDuplicatable());
      assert.equal(this.workspace.getTopBlocks().length, 1);
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.D);
      this.workspace.getInjectionDiv().dispatchEvent(event);
      assert.equal(this.workspace.getTopBlocks().length, 1);
    });

    test('Does not duplicate workspace comments on a readonly workspace', function () {
      const comment = this.workspace.newComment();
      comment.setText('Hello');
      this.workspace.setIsReadOnly(true);
      Blockly.getFocusManager().focusNode(comment);
      assert.equal(this.workspace.getTopComments().length, 1);
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.D);
      this.workspace.getInjectionDiv().dispatchEvent(event);
      assert.equal(this.workspace.getTopComments().length, 1);
    });
  });

  suite('Clean up workspace (C)', function () {
    test('Arranges all blocks in a vertical column', function () {
      this.workspace.newBlock('controls_if');
      const block2 = this.workspace.newBlock('controls_if');
      block2.moveBy(300, 20);
      const block3 = this.workspace.newBlock('controls_if');
      block3.moveBy(-75, -60);

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.C);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      for (const block of this.workspace.getTopBlocks()) {
        assert.equal(block.relativeCoords.x, 0);
      }
    });

    test('Does nothing on a readonly workspace', function () {
      this.workspace.newBlock('controls_if');
      const block2 = this.workspace.newBlock('controls_if');
      block2.moveBy(300, 20);
      const block3 = this.workspace.newBlock('controls_if');
      block3.moveBy(-75, -60);

      this.workspace.setIsReadOnly(true);

      const oldBounds = this.workspace
        .getTopBlocks(true)
        .map((b) => b.getBoundingRectangle());

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.C);
      this.workspace.getInjectionDiv().dispatchEvent(event);

      const newBounds = this.workspace
        .getTopBlocks(true)
        .map((b) => b.getBoundingRectangle());
      assert.deepEqual(oldBounds, newBounds);
    });
  });

  suite('Show tooltip (Ctrl/Cmd+J)', function () {
    const event = createKeyDownEvent(Blockly.utils.KeyCodes.J, [
      Blockly.utils.KeyCodes.CTRL_CMD,
    ]);

    test('Displays tooltip on a block using the keyboard shortcut', function () {
      const block = this.workspace.newBlock('controls_if');
      Blockly.getFocusManager().focusNode(block);
      block.setTooltip('Tooltip Text');
      this.injectionDiv.dispatchEvent(event);

      assert.isTrue(Blockly.Tooltip.isVisible());
    });

    test('Displays new tooltip on a block using the keyboard shortcut if tooltip for another block is already displayed', function () {
      const block1 = this.workspace.newBlock('controls_if');
      const block2 = this.workspace.newBlock('logic_compare');

      block1.setTooltip('block1');
      block2.setTooltip('block2');

      // Set focus to block1 and show its tooltip
      Blockly.getFocusManager().focusNode(block1);
      this.injectionDiv.dispatchEvent(event);

      // We have block1 focused; we should see block1's tooltip
      assert.isTrue(Blockly.Tooltip.isVisible());
      assert.isTrue(Blockly.Tooltip.getDiv().innerText === 'block1');

      // Set focus to block2 and show its tooltip
      Blockly.getFocusManager().focusNode(block2);
      this.injectionDiv.dispatchEvent(event);

      // Now we have block2 focused; we should see block2's tooltip
      assert.isTrue(Blockly.Tooltip.isVisible());
      assert.isTrue(Blockly.Tooltip.getDiv().innerText === 'block2');
    });

    test('Do not show tooltip if drag in progress', function () {
      sinon.stub(this.workspace, 'isDragging').returns(true);
      this.injectionDiv.dispatchEvent(event);

      const block = this.workspace.newBlock('controls_if');
      Blockly.getFocusManager().focusNode(block);
      block.setTooltip('Tooltip Text');
      this.injectionDiv.dispatchEvent(event);

      assert.isFalse(Blockly.Tooltip.isVisible());
    });
  });
});
