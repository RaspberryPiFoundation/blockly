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
    const toolbox = document.getElementById('toolbox-categories');
    this.workspace = Blockly.inject('blocklyDiv', {toolbox});
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
    Blockly.common.setSelected(block);
    sinon.stub(Blockly.getFocusManager(), 'getFocusedNode').returns(block);
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
      // Restore the stub behavior called during setup
      Blockly.getFocusManager().getFocusedNode.restore();

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
      // Restore the stub behavior called during setup
      Blockly.getFocusManager().getFocusedNode.restore();

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
      Blockly.getFocusManager().getFocusedNode.restore();
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
      // Restore the stub behavior called during setup
      Blockly.getFocusManager().getFocusedNode.restore();

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
      Blockly.getFocusManager().getFocusedNode.restore();
      this.comment = setSelectedComment(this.workspace);
      this.copySpy = sinon.spy(this.comment, 'toCopyData');
      this.disposeSpy = sinon.spy(this.comment, 'dispose');

      this.injectionDiv.dispatchEvent(keyEvent);
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
        assert.include(menu.getElement().innerText, option.text);
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
        assert.include(menu.getElement().innerText, option.text);
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
        assert.include(menu.getElement().innerText, option.text);
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

  suite('Focus Toolbox (T)', function () {
    setup(function () {
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'basic_block',
          'message0': '%1',
          'args0': [
            {
              'type': 'field_input',
              'name': 'TEXT',
              'text': 'default',
            },
          ],
        },
      ]);
    });

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
});
