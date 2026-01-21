/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('Context Menu Items', function () {
  setup(function () {
    sharedTestSetup.call(this);

    // Creates a WorkspaceSVG
    const toolbox = document.getElementById('toolbox-categories');
    this.workspace = Blockly.inject('blocklyDiv', {toolbox: toolbox});

    this.registry = Blockly.ContextMenuRegistry.registry;
    this.registry.reset();
    Blockly.ContextMenuItems.registerDefaultOptions();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Workspace Items', function () {
    setup(function () {
      this.scope = {workspace: this.workspace};
    });

    suite('undo', function () {
      setup(function () {
        this.undoOption = this.registry.getItem('undoWorkspace');
      });

      test('Disabled when nothing to undo', function () {
        const precondition = this.undoOption.preconditionFn(this.scope);
        assert.equal(
          precondition,
          'disabled',
          'Should be disabled when there is nothing to undo',
        );
      });

      test('Enabled when something to undo', function () {
        // Create a new block, which should be undoable.
        this.workspace.newBlock('text');
        const precondition = this.undoOption.preconditionFn(this.scope);
        assert.equal(
          precondition,
          'enabled',
          'Should be enabled when there are actions to undo',
        );
      });

      test('Undoes adding a new block', function () {
        this.workspace.newBlock('text');
        assert.equal(this.workspace.getTopBlocks(false).length, 1);
        this.undoOption.callback(this.scope);
        assert.equal(
          this.workspace.getTopBlocks(false).length,
          0,
          'Should be no blocks after undo',
        );
      });

      test('Has correct label', function () {
        assert.equal(this.undoOption.displayText(), 'Undo');
      });
    });

    suite('Redo', function () {
      setup(function () {
        this.redoOption = this.registry.getItem('redoWorkspace');
      });

      test('Disabled when nothing to redo', function () {
        // Create a new block. There should be something to undo, but not redo.
        this.workspace.newBlock('text');
        const precondition = this.redoOption.preconditionFn(this.scope);
        assert.equal(
          precondition,
          'disabled',
          'Should be disabled when there is nothing to redo',
        );
      });

      test('Enabled when something to redo', function () {
        // Create a new block, then undo it, which means there is something to redo.
        this.workspace.newBlock('text');
        this.workspace.undo(false);
        const precondition = this.redoOption.preconditionFn(this.scope);
        assert.equal(
          precondition,
          'enabled',
          'Should be enabled when there are actions to redo',
        );
      });

      test('Redoes adding new block', function () {
        // Add a new block, then undo it, then redo it.
        this.workspace.newBlock('text');
        this.workspace.undo(false);
        assert.equal(this.workspace.getTopBlocks(false).length, 0);
        this.redoOption.callback(this.scope);
        assert.equal(
          this.workspace.getTopBlocks(false).length,
          1,
          'Should be 1 block after redo',
        );
      });

      test('Has correct label', function () {
        assert.equal(this.redoOption.displayText(), 'Redo');
      });
    });

    suite('Cleanup', function () {
      setup(function () {
        this.cleanupOption = this.registry.getItem('cleanWorkspace');
        this.cleanUpStub = sinon.stub(this.workspace, 'cleanUp');
      });

      test('Enabled when multiple blocks', function () {
        this.workspace.newBlock('text');
        this.workspace.newBlock('text');
        assert.equal(
          this.cleanupOption.preconditionFn(this.scope),
          'enabled',
          'Should be enabled if there are multiple blocks',
        );
      });

      test('Disabled when no blocks', function () {
        assert.equal(
          this.cleanupOption.preconditionFn(this.scope),
          'disabled',
          'Should be disabled if there are no blocks',
        );
      });

      test('Hidden when not movable', function () {
        sinon.stub(this.workspace, 'isMovable').returns(false);
        assert.equal(
          this.cleanupOption.preconditionFn(this.scope),
          'hidden',
          'Should be hidden if the workspace is not movable',
        );
      });

      test('Calls workspace cleanUp', function () {
        this.cleanupOption.callback(this.scope);
        sinon.assert.calledOnce(this.cleanUpStub);
      });

      test('Has correct label', function () {
        assert.equal(this.cleanupOption.displayText(), 'Clean up Blocks');
      });
    });

    suite('Collapse', function () {
      setup(function () {
        this.collapseOption = this.registry.getItem('collapseWorkspace');
      });

      test('Enabled when uncollapsed blocks', function () {
        this.workspace.newBlock('text');
        const block2 = this.workspace.newBlock('text');
        block2.setCollapsed(true);
        assert.equal(
          this.collapseOption.preconditionFn(this.scope),
          'enabled',
          'Should be enabled when any blocks are expanded',
        );
      });

      test('Disabled when all blocks collapsed', function () {
        this.workspace.newBlock('text').setCollapsed(true);
        assert.equal(
          this.collapseOption.preconditionFn(this.scope),
          'disabled',
          'Should be disabled when no blocks are expanded',
        );
      });

      test('Hidden when no collapse option', function () {
        const workspaceWithOptions = new Blockly.Workspace(
          new Blockly.Options({collapse: false}),
        );
        this.scope.workspace = workspaceWithOptions;

        try {
          assert.equal(
            this.collapseOption.preconditionFn(this.scope),
            'hidden',
            'Should be hidden if collapse is disabled in options',
          );
        } finally {
          workspaceTeardown.call(this, workspaceWithOptions);
        }
      });

      test('Collapses all blocks', function () {
        // All blocks should be collapsed, even if some already were.
        const block1 = this.workspace.newBlock('text');
        const block2 = this.workspace.newBlock('text');
        // Need to render block to properly collapse it.
        block1.initSvg();
        block1.render();
        block1.setCollapsed(true);

        this.collapseOption.callback(this.scope);
        this.clock.runAll();

        assert.isTrue(
          block1.isCollapsed(),
          'Previously collapsed block should still be collapsed',
        );
        assert.isTrue(
          block2.isCollapsed(),
          'Previously expanded block should now be collapsed',
        );
      });

      test('Has correct label', function () {
        assert.equal(this.collapseOption.displayText(), 'Collapse Blocks');
      });
    });

    suite('Expand', function () {
      setup(function () {
        this.expandOption = this.registry.getItem('expandWorkspace');
      });

      test('Enabled when collapsed blocks', function () {
        this.workspace.newBlock('text');
        const block2 = this.workspace.newBlock('text');
        block2.setCollapsed(true);

        assert.equal(
          this.expandOption.preconditionFn(this.scope),
          'enabled',
          'Should be enabled when any blocks are collapsed',
        );
      });

      test('Disabled when no collapsed blocks', function () {
        this.workspace.newBlock('text');
        assert.equal(
          this.expandOption.preconditionFn(this.scope),
          'disabled',
          'Should be disabled when no blocks are collapsed',
        );
      });

      test('Hidden when no collapse option', function () {
        const workspaceWithOptions = new Blockly.Workspace(
          new Blockly.Options({collapse: false}),
        );
        this.scope.workspace = workspaceWithOptions;

        try {
          assert.equal(
            this.expandOption.preconditionFn(this.scope),
            'hidden',
            'Should be hidden if collapse is disabled in options',
          );
        } finally {
          workspaceTeardown.call(this, workspaceWithOptions);
        }
      });

      test('Expands all blocks', function () {
        // All blocks should be expanded, even if some already were.
        const block1 = this.workspace.newBlock('text');
        const block2 = this.workspace.newBlock('text');
        // Need to render block to properly collapse it.
        block2.initSvg();
        block2.render();
        block2.setCollapsed(true);

        this.expandOption.callback(this.scope);
        this.clock.runAll();

        assert.isFalse(
          block1.isCollapsed(),
          'Previously expanded block should still be expanded',
        );
        assert.isFalse(
          block2.isCollapsed(),
          'Previously collapsed block should now be expanded',
        );
      });

      test('Has correct label', function () {
        assert.equal(this.expandOption.displayText(), 'Expand Blocks');
      });
    });

    suite('Delete', function () {
      setup(function () {
        this.deleteOption = this.registry.getItem('workspaceDelete');
      });

      test('Enabled when blocks to delete', function () {
        this.workspace.newBlock('text');
        assert.equal(this.deleteOption.preconditionFn(this.scope), 'enabled');
      });

      test('Disabled when no blocks to delete', function () {
        assert.equal(this.deleteOption.preconditionFn(this.scope), 'disabled');
      });

      test('Deletes all blocks after confirming', function () {
        // Mocks the confirmation dialog and calls the callback with 'true' simulating ok.
        const confirmStub = sinon.stub(window, 'confirm').returns(true);

        this.workspace.newBlock('text');
        this.workspace.newBlock('text');
        this.deleteOption.callback(this.scope);
        this.clock.runAll();
        sinon.assert.calledOnce(confirmStub);
        assert.equal(this.workspace.getTopBlocks(false).length, 0);

        confirmStub.restore();
      });

      test('Does not delete blocks if not confirmed', function () {
        // Mocks the confirmation dialog and calls the callback with 'false' simulating cancel.
        const confirmStub = sinon.stub(window, 'confirm').returns(false);

        this.workspace.newBlock('text');
        this.workspace.newBlock('text');
        this.deleteOption.callback(this.scope);
        this.clock.runAll();
        sinon.assert.calledOnce(confirmStub);
        assert.equal(this.workspace.getTopBlocks(false).length, 2);

        confirmStub.restore();
      });

      test('No dialog for single block', function () {
        const confirmStub = sinon.stub(window, 'confirm');
        this.workspace.newBlock('text');
        this.deleteOption.callback(this.scope);
        this.clock.runAll();

        sinon.assert.notCalled(confirmStub);
        assert.equal(this.workspace.getTopBlocks(false).length, 0);

        confirmStub.restore();
      });

      test('Has correct label for multiple blocks', function () {
        this.workspace.newBlock('text');
        this.workspace.newBlock('text');

        assert.equal(
          this.deleteOption.displayText(this.scope),
          'Delete 2 Blocks',
        );
      });

      test('Has correct label for single block', function () {
        this.workspace.newBlock('text');
        assert.equal(this.deleteOption.displayText(this.scope), 'Delete Block');
      });
    });

    suite('Separators', function () {
      setup(function () {
        this.registry.reset();
        this.registry.register({
          weight: 0,
          id: 'a',
          preconditionFn: () => {},
          displayText: 'a',
          callback: () => {},
        });
        this.registry.register({
          weight: 2,
          id: 'b',
          preconditionFn: () => {},
          displayText: 'b',
          callback: () => {},
        });
      });

      test('are hidden when precondition returns hidden', function () {
        this.registry.register({
          weight: 1,
          id: 'separator',
          preconditionFn: () => 'hidden',
          separator: true,
        });

        const items = this.registry.getContextMenuOptions(
          this.scope,
          new Event('pointerdown'),
        );
        assert.equal(items.length, 2);
        assert.isTrue(items.every((item) => !('separator' in item)));
      });

      test('are included when precondition returns enabled', function () {
        this.registry.register({
          weight: 1,
          id: 'separator',
          preconditionFn: () => 'enabled',
          separator: true,
        });

        const items = this.registry.getContextMenuOptions(
          this.scope,
          new Event('pointerdown'),
        );
        assert.equal(items.length, 3);
        assert.isTrue('separator' in items[1]);
      });

      test('are included when precondition returns disabled', function () {
        this.registry.register({
          weight: 1,
          id: 'separator',
          preconditionFn: () => 'disabled',
          separator: true,
        });

        const items = this.registry.getContextMenuOptions(
          this.scope,
          new Event('pointerdown'),
        );
        assert.equal(items.length, 3);
        assert.isTrue('separator' in items[1]);
      });

      test('are included when there is no precondition', function () {
        this.registry.register({
          weight: 1,
          id: 'separator',
          separator: true,
        });

        const items = this.registry.getContextMenuOptions(
          this.scope,
          new Event('pointerdown'),
        );
        assert.equal(items.length, 3);
        assert.isTrue('separator' in items[1]);
      });
    });
  });

  suite('Block Items', function () {
    setup(function () {
      this.block = this.workspace.newBlock('text');
      this.scope = {block: this.block};
    });

    suite('Duplicate', function () {
      setup(function () {
        this.duplicateOption = this.registry.getItem('blockDuplicate');
      });

      test('Enabled when block is duplicatable', function () {
        // Block is duplicatable by default
        assert.equal(
          this.duplicateOption.preconditionFn(this.scope),
          'enabled',
        );
      });

      test('Disabled when block is not dupicatable', function () {
        sinon.stub(this.block, 'isDuplicatable').returns(false);
        assert.equal(
          this.duplicateOption.preconditionFn(this.scope),
          'disabled',
        );
      });

      test('Hidden when in flyout', function () {
        this.block.isInFlyout = true;
        assert.equal(this.duplicateOption.preconditionFn(this.scope), 'hidden');
      });

      test('the block is duplicated', function () {
        this.duplicateOption.callback(this.scope);
        assert.equal(
          this.workspace.getTopBlocks(false).length,
          2,
          'Expected a second block',
        );
      });

      test('Has correct label', function () {
        assert.equal(this.duplicateOption.displayText(), 'Duplicate');
      });
    });

    suite('Comment', function () {
      setup(function () {
        this.commentOption = this.registry.getItem('blockComment');
      });

      test('Enabled for normal block', function () {
        assert.equal(this.commentOption.preconditionFn(this.scope), 'enabled');
      });

      test('Hidden for collapsed block', function () {
        // Must render block to collapse it properly.
        this.block.initSvg();
        this.block.render();
        this.block.setCollapsed(true);

        assert.equal(this.commentOption.preconditionFn(this.scope), 'hidden');
      });

      test('Creates comment if one did not exist', function () {
        assert.isUndefined(
          this.block.getIcon(Blockly.icons.CommentIcon.TYPE),
          'New block should not have a comment',
        );
        this.commentOption.callback(this.scope);
        assert.exists(this.block.getIcon(Blockly.icons.CommentIcon.TYPE));
        assert.isEmpty(
          this.block.getCommentText(),
          'Block should have empty comment text',
        );
      });

      test('Removes comment if block had one', function () {
        this.block.setCommentText('Test comment');
        this.commentOption.callback(this.scope);
        assert.isNull(
          this.block.getCommentText(),
          'Block should not have comment after removal',
        );
      });

      test('Has correct label for add comment', function () {
        assert.equal(this.commentOption.displayText(this.scope), 'Add Comment');
      });

      test('Has correct label for remove comment', function () {
        this.block.setCommentText('Test comment');
        assert.equal(
          this.commentOption.displayText(this.scope),
          'Remove Comment',
        );
      });
    });

    suite('Inline Variables', function () {
      setup(function () {
        this.inlineOption = this.registry.getItem('blockInline');
      });

      test('Enabled when inputs to inline', function () {
        this.block.appendValueInput('test1');
        this.block.appendValueInput('test2');
        assert.equal(this.inlineOption.preconditionFn(this.scope), 'enabled');
      });
    });

    suite('Separators', function () {
      setup(function () {
        this.registry.reset();
        this.registry.register({
          weight: 0,
          id: 'a',
          preconditionFn: () => {},
          displayText: 'a',
          callback: () => {},
        });
        this.registry.register({
          weight: 2,
          id: 'b',
          preconditionFn: () => {},
          displayText: 'b',
          callback: () => {},
        });
      });

      test('are hidden when precondition returns hidden', function () {
        this.registry.register({
          weight: 1,
          id: 'separator',
          preconditionFn: () => 'hidden',
          separator: true,
        });

        const items = this.registry.getContextMenuOptions(
          this.scope,
          new Event('pointerdown'),
        );
        assert.equal(items.length, 2);
        assert.isTrue(items.every((item) => !('separator' in item)));
      });

      test('are included when precondition returns enabled', function () {
        this.registry.register({
          weight: 1,
          id: 'separator',
          preconditionFn: () => 'enabled',
          separator: true,
        });

        const items = this.registry.getContextMenuOptions(
          this.scope,
          new Event('pointerdown'),
        );
        assert.equal(items.length, 3);
        assert.isTrue('separator' in items[1]);
      });

      test('are included when precondition returns disabled', function () {
        this.registry.register({
          weight: 1,
          id: 'separator',
          preconditionFn: () => 'disabled',
          separator: true,
        });

        const items = this.registry.getContextMenuOptions(
          this.scope,
          new Event('pointerdown'),
        );
        assert.equal(items.length, 3);
        assert.isTrue('separator' in items[1]);
      });

      test('are included when there is no precondition', function () {
        this.registry.register({
          weight: 1,
          id: 'separator',
          separator: true,
        });

        const items = this.registry.getContextMenuOptions(
          this.scope,
          new Event('pointerdown'),
        );
        assert.equal(items.length, 3);
        assert.isTrue('separator' in items[1]);
      });
    });
  });
});
