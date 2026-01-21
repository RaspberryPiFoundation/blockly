/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {defineStackBlock} from './test_helpers/block_definitions.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {createKeyDownEvent} from './test_helpers/user_input.js';

suite('Keyboard Shortcut Items', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = Blockly.inject('blocklyDiv', {});
    this.injectionDiv = this.workspace.getInjectionDiv();
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
    defineStackBlock();
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
    defineStackBlock();
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
    const testCases = [
      [
        'Control C',
        createKeyDownEvent(Blockly.utils.KeyCodes.C, [
          Blockly.utils.KeyCodes.CTRL,
        ]),
      ],
      [
        'Meta C',
        createKeyDownEvent(Blockly.utils.KeyCodes.C, [
          Blockly.utils.KeyCodes.META,
        ]),
      ],
    ];
    // Copy a block.
    suite('Simple', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.calledOnce(this.copySpy);
          sinon.assert.calledOnce(this.hideChaffSpy);
        });
      });
    });
    // Allow copying a block if a workspace is in readonly mode.
    suite('Called when readOnly is true', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          this.workspace.setIsReadOnly(true);
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.calledOnce(this.copySpy);
          sinon.assert.calledOnce(this.hideChaffSpy);
        });
      });
    });
    // Do not copy a block if a drag is in progress.
    suite('Drag in progress', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          sinon.stub(this.workspace, 'isDragging').returns(true);
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.notCalled(this.copySpy);
          sinon.assert.notCalled(this.hideChaffSpy);
        });
      });
    });
    // Do not copy a block if is is not deletable.
    suite('Block is not deletable', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          sinon
            .stub(Blockly.common.getSelected(), 'isOwnDeletable')
            .returns(false);
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.notCalled(this.copySpy);
          sinon.assert.notCalled(this.hideChaffSpy);
        });
      });
    });
    // Do not copy a block if it is not movable.
    suite('Block is not movable', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          sinon
            .stub(Blockly.common.getSelected(), 'isOwnMovable')
            .returns(false);
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.notCalled(this.copySpy);
          sinon.assert.notCalled(this.hideChaffSpy);
        });
      });
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
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          Blockly.getFocusManager().getFocusedNode.restore();
          this.comment = setSelectedComment(this.workspace);
          this.copySpy = sinon.spy(this.comment, 'toCopyData');

          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.calledOnce(this.copySpy);
          sinon.assert.calledOnce(this.hideChaffSpy);
        });
      });
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
    const testCases = [
      [
        'Control X',
        createKeyDownEvent(Blockly.utils.KeyCodes.X, [
          Blockly.utils.KeyCodes.CTRL,
        ]),
      ],
      [
        'Meta X',
        createKeyDownEvent(Blockly.utils.KeyCodes.X, [
          Blockly.utils.KeyCodes.META,
        ]),
      ],
    ];
    // Cut a block.
    suite('Simple', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.calledOnce(this.copySpy);
          sinon.assert.calledOnce(this.disposeSpy);
          sinon.assert.calledOnce(this.hideChaffSpy);
        });
      });
    });
    // Do not cut a block if a workspace is in readonly mode.
    suite('Not called when readOnly is true', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          this.workspace.setIsReadOnly(true);
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.notCalled(this.copySpy);
          sinon.assert.notCalled(this.disposeSpy);
          sinon.assert.notCalled(this.hideChaffSpy);
        });
      });
    });
    // Do not cut a block if a drag is in progress.
    suite('Drag in progress', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          sinon.stub(this.workspace, 'isDragging').returns(true);
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.notCalled(this.copySpy);
          sinon.assert.notCalled(this.disposeSpy);
          sinon.assert.notCalled(this.hideChaffSpy);
        });
      });
    });
    // Do not cut a block if is is not deletable.
    suite('Block is not deletable', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          sinon
            .stub(Blockly.common.getSelected(), 'isOwnDeletable')
            .returns(false);
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.notCalled(this.copySpy);
          sinon.assert.notCalled(this.disposeSpy);
          sinon.assert.notCalled(this.hideChaffSpy);
        });
      });
    });
    // Do not cut a block if it is not movable.
    suite('Block is not movable', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          sinon
            .stub(Blockly.common.getSelected(), 'isOwnMovable')
            .returns(false);
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.notCalled(this.copySpy);
          sinon.assert.notCalled(this.disposeSpy);
          sinon.assert.notCalled(this.hideChaffSpy);
        });
      });
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
    suite('Workspace comment', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          Blockly.getFocusManager().getFocusedNode.restore();
          this.comment = setSelectedComment(this.workspace);
          this.copySpy = sinon.spy(this.comment, 'toCopyData');
          this.disposeSpy = sinon.spy(this.comment, 'dispose');

          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.calledOnce(this.copySpy);
          sinon.assert.calledOnce(this.disposeSpy);
        });
      });
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
    const testCases = [
      [
        'Control Z',
        createKeyDownEvent(Blockly.utils.KeyCodes.Z, [
          Blockly.utils.KeyCodes.CTRL,
        ]),
      ],
      [
        'Meta Z',
        createKeyDownEvent(Blockly.utils.KeyCodes.Z, [
          Blockly.utils.KeyCodes.META,
        ]),
      ],
    ];
    // Undo.
    suite('Simple', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.calledOnce(this.undoSpy);
          sinon.assert.calledWith(this.undoSpy, false);
          sinon.assert.calledOnce(this.hideChaffSpy);
        });
      });
    });
    // Do not undo if a drag is in progress.
    suite('Drag in progress', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          sinon.stub(this.workspace, 'isDragging').returns(true);
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.notCalled(this.undoSpy);
          sinon.assert.notCalled(this.hideChaffSpy);
        });
      });
    });
    // Do not undo if the workspace is in readOnly mode.
    suite('Not called when readOnly is true', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        runReadOnlyTest(keyEvent, testCaseName);
      });
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
    const testCases = [
      [
        'Control Shift Z',
        createKeyDownEvent(Blockly.utils.KeyCodes.Z, [
          Blockly.utils.KeyCodes.CTRL,
          Blockly.utils.KeyCodes.SHIFT,
        ]),
      ],
      [
        'Meta Shift Z',
        createKeyDownEvent(Blockly.utils.KeyCodes.Z, [
          Blockly.utils.KeyCodes.META,
          Blockly.utils.KeyCodes.SHIFT,
        ]),
      ],
    ];
    // Undo.
    suite('Simple', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.calledOnce(this.redoSpy);
          sinon.assert.calledWith(this.redoSpy, true);
          sinon.assert.calledOnce(this.hideChaffSpy);
        });
      });
    });
    // Do not redo if a drag is in progress.
    suite('Drag in progress', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        test(testCaseName, function () {
          sinon.stub(this.workspace, 'isDragging').returns(true);
          this.injectionDiv.dispatchEvent(keyEvent);
          sinon.assert.notCalled(this.redoSpy);
          sinon.assert.notCalled(this.hideChaffSpy);
        });
      });
    });
    // Do not undo if the workspace is in readOnly mode.
    suite('Not called when readOnly is true', function () {
      testCases.forEach(function (testCase) {
        const testCaseName = testCase[0];
        const keyEvent = testCase[1];
        runReadOnlyTest(keyEvent, testCaseName);
      });
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
});
