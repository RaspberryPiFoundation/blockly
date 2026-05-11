/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {EventType} from '../../build/src/core/events/type.js';
import {assert} from '../../node_modules/chai/index.js';
import {assertEventFired} from './test_helpers/events.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Comments', function () {
  setup(function () {
    sharedTestSetup.call(this);
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'empty_block',
        'message0': '',
        'args0': [],
      },
    ]);
    this.workspace = Blockly.inject('blocklyDiv', {
      comments: true,
      scrollbars: true,
    });
    this.block = Blockly.Xml.domToBlock(
      Blockly.utils.xml.textToDom('<block type="empty_block"/>'),
      this.workspace,
    );
    this.comment = new Blockly.icons.CommentIcon(this.block);
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });
  suite('Visibility and Editability', function () {
    setup(function () {
      this.block.setCommentText('test text');
    });

    function assertEditable(comment) {
      assert.isOk(comment.textInputBubble);
      assert.isTrue(comment.textInputBubble.isEditable());
    }
    function assertNotEditable(comment) {
      assert.isOk(comment.textInputBubble);
      assert.isFalse(comment.textInputBubble.isEditable());
    }
    test('Editable', async function () {
      await this.comment.setBubbleVisible(true);
      assert.isTrue(this.comment.bubbleIsVisible());
      assertEditable(this.comment);
      assertEventFired(
        this.eventsFireStub,
        Blockly.Events.BubbleOpen,
        {bubbleType: 'comment', isOpen: true, type: EventType.BUBBLE_OPEN},
        this.workspace.id,
        this.block.id,
      );
    });
    test('Not Editable', async function () {
      sinon.stub(this.block, 'isEditable').returns(false);

      await this.comment.setBubbleVisible(true);

      assert.isTrue(this.comment.bubbleIsVisible());
      assertNotEditable(this.comment);
      assertEventFired(
        this.eventsFireStub,
        Blockly.Events.BubbleOpen,
        {bubbleType: 'comment', isOpen: true, type: EventType.BUBBLE_OPEN},
        this.workspace.id,
        this.block.id,
      );
    });
    test('Editable -> Not Editable', async function () {
      await this.comment.setBubbleVisible(true);
      sinon.stub(this.block, 'isEditable').returns(false);

      await this.comment.updateEditable();

      assert.isTrue(this.comment.bubbleIsVisible());
      assertNotEditable(this.comment);
      assertEventFired(
        this.eventsFireStub,
        Blockly.Events.BubbleOpen,
        {bubbleType: 'comment', isOpen: true, type: EventType.BUBBLE_OPEN},
        this.workspace.id,
        this.block.id,
      );
    });
    test('Not Editable -> Editable', async function () {
      const editableStub = sinon.stub(this.block, 'isEditable').returns(false);

      await this.comment.setBubbleVisible(true);

      editableStub.returns(true);

      await this.comment.updateEditable();
      assert.isTrue(this.comment.bubbleIsVisible());
      assertEditable(this.comment);
      assertEventFired(
        this.eventsFireStub,
        Blockly.Events.BubbleOpen,
        {bubbleType: 'comment', isOpen: true, type: EventType.BUBBLE_OPEN},
        this.workspace.id,
        this.block.id,
      );
    });
  });
  suite('Set/Get Bubble Size', function () {
    teardown(function () {
      sinon.restore();
    });
    function assertBubbleSize(comment, height, width) {
      const size = comment.getBubbleSize();
      assert.equal(size.height, height);
      assert.equal(size.width, width);
    }
    function assertBubbleSizeDefault(comment) {
      assertBubbleSize(comment, 80, 160);
    }
    test('Set Size While Visible', function () {
      this.comment.setBubbleVisible(true);

      assertBubbleSizeDefault(this.comment);
      this.comment.setBubbleSize(new Blockly.utils.Size(100, 100));
      assertBubbleSize(this.comment, 100, 100);

      this.comment.setBubbleVisible(false);
      assertBubbleSize(this.comment, 100, 100);
    });
    test('Set Size While Invisible', function () {
      assertBubbleSizeDefault(this.comment);
      this.comment.setBubbleSize(new Blockly.utils.Size(100, 100));
      assertBubbleSize(this.comment, 100, 100);

      this.comment.setBubbleVisible(true);
      assertBubbleSize(this.comment, 100, 100);
    });
  });
  suite('Set/Get Bubble Location', function () {
    teardown(function () {
      sinon.restore();
    });
    function assertBubbleLocation(comment, x, y) {
      const location = comment.getBubbleLocation();
      assert.equal(location.x, x);
      assert.equal(location.y, y);
    }
    test('Set Location While Visible', function () {
      this.comment.setBubbleVisible(true);

      this.comment.setBubbleLocation(new Blockly.utils.Coordinate(100, 100));
      assertBubbleLocation(this.comment, 100, 100);

      this.comment.setBubbleVisible(false);
      assertBubbleLocation(this.comment, 100, 100);
    });
    test('Set Location While Invisible', function () {
      this.comment.setBubbleLocation(new Blockly.utils.Coordinate(100, 100));
      assertBubbleLocation(this.comment, 100, 100);

      this.comment.setBubbleVisible(true);
      assertBubbleLocation(this.comment, 100, 100);
    });
  });
  suite('Undo/Redo', function () {
    test('Adding an empty comment can be undone', function () {
      const block = this.workspace.newBlock('empty_block');
      block.setCommentText('');
      assert.isNotNull(block.getIcon(Blockly.icons.IconType.COMMENT));
      assert.equal(block.getCommentText(), '');

      this.workspace.undo();

      assert.isUndefined(block.getIcon(Blockly.icons.IconType.COMMENT));
      assert.isNull(block.getCommentText());
    });

    test('Adding an empty comment can be redone', function () {
      const block = this.workspace.newBlock('empty_block');
      block.setCommentText('');
      this.workspace.undo();
      this.workspace.redo();

      assert.isNotNull(block.getIcon(Blockly.icons.IconType.COMMENT));
      assert.equal(block.getCommentText(), '');
    });

    test('Adding a non-empty comment can be undone', function () {
      const block = this.workspace.newBlock('empty_block');
      block.setCommentText('hey there');
      assert.isNotNull(block.getIcon(Blockly.icons.IconType.COMMENT));
      assert.equal(block.getCommentText(), 'hey there');

      this.workspace.undo();

      assert.isUndefined(block.getIcon(Blockly.icons.IconType.COMMENT));
      assert.isNull(block.getCommentText());
    });

    test('Adding a non-empty comment can be redone', function () {
      const block = this.workspace.newBlock('empty_block');
      block.setCommentText('hey there');
      this.workspace.undo();
      this.workspace.redo();

      assert.isNotNull(block.getIcon(Blockly.icons.IconType.COMMENT));
      assert.equal(block.getCommentText(), 'hey there');
    });
  });
  suite('ARIA', function () {
    setup(async function () {
      const block = this.workspace.newBlock('empty_block');
      block.setCommentText('test text');
      this.icon = block.getIcon(Blockly.icons.IconType.COMMENT);
      await this.icon.setBubbleVisible(true);
      this.bubble = this.icon.getBubble();
    });
    function getFocusableAriaLabel(iFocusable) {
      return iFocusable.getFocusableElement().getAttribute('aria-label');
    }
    function getFocusableAriaRole(iFocusable) {
      return iFocusable.getFocusableElement().getAttribute('role');
    }
    function getFocusableAriaDescription(iFocusable) {
      return iFocusable
        .getFocusableElement()
        .getAttribute('aria-roledescription');
    }
    test('Bubble has ARIA label', function () {
      assert.isTrue(this.bubble.focusableElement.hasAttribute('aria-label'));
    });
    test('Bubble has working ARIA label provider', function () {
      const label = getFocusableAriaLabel(this.bubble);
      assert.include(label, 'Comment');
      assert.include(label, 'test text');
    });
    test('Bubble has ARIA role of group', function () {
      assert.equal(this.bubble.focusableElement.getAttribute('role'), 'group');
    });
    test('Bubble can use AriaLabelProvider function', function () {
      this.bubble.setAriaLabelProvider(() => 'comment aria label');
      this.bubble.recomputeAriaContext();
      assert.equal(getFocusableAriaLabel(this.bubble), 'comment aria label');
    });
    test('Bubble can use AriaLabelProvider string', function () {
      this.bubble.setAriaLabelProvider('comment aria label');
      this.bubble.recomputeAriaContext();
      assert.equal(getFocusableAriaLabel(this.bubble), 'comment aria label');
    });
    test('Icon label changes when bubble is opened', async function () {
      const openLabel = getFocusableAriaLabel(this.icon);
      assert.equal(openLabel, 'Close Comment');
      await this.icon.setBubbleVisible(false);

      const closedLabel = getFocusableAriaLabel(this.icon);
      assert.equal(closedLabel, 'Open Comment');
    });
    test('Bubble uses default ARIA label when no provider is set', function () {
      this.bubble.setAriaLabelProvider(null);
      const label = getFocusableAriaLabel(this.bubble);
      assert.equal(label, 'Bubble');
    });
    test('Bubble ARIA label updates when comment text changes', function () {
      const initialLabel = getFocusableAriaLabel(this.bubble);
      assert.include(initialLabel, 'test text');

      this.bubble.editor.setText('updated text');
      const updatedLabel = getFocusableAriaLabel(this.bubble);
      assert.include(updatedLabel, 'updated text');
    });
    suite('Comment Editor', function () {
      test('Has ARIA role textbox', function () {
        const editor = this.bubble.editor;
        assert.equal(
          editor.getFocusableElement().getAttribute('role'),
          'textbox',
        );
      });
      test('Parent is initialized', function () {
        const editor = this.bubble.getEditor();
        assert.exists(editor.getParent());
      });
    });
    suite('Comment View', function () {
      setup(function () {
        // Create workspace comment to test comment view ARIA attributes, since block comments use bubbles.
        this.workspaceComment = this.workspace.newComment();
        this.workspaceComment.setText('workspace comment');
      });
      test('Has ARIA role button', function () {
        const view = this.workspaceComment.view;
        assert.equal(view.svgRoot.getAttribute('role'), 'button');
      });
      test('Has ARIA roledescription of comment', function () {
        const view = this.workspaceComment.view;
        assert.equal(
          view.svgRoot.getAttribute('aria-roledescription'),
          'Comment',
        );
      });
      test('Comment view is labelled by comment editor', function () {
        const view = this.workspaceComment.view;
        const ownerId = view.commentEditor.getFocusableElement().id;
        assert.equal(view.svgRoot.getAttribute('aria-labelledby'), ownerId);
      });
    });
    suite('Comment Bar Buttons', function () {
      setup(function () {
        this.comment = this.workspace.newComment();
        this.comment.setText('test comment');

        this.view = this.comment.view;
      });
      function getButtonLabel(button) {
        return button.getFocusableElement().getAttribute('aria-label');
      }
      test('Buttons have ARIA role button', function () {
        for (const button of this.view.getCommentBarButtons()) {
          assert.equal(
            button.getFocusableElement().getAttribute('role'),
            'button',
          );
        }
      });
      test('Delete button has correct ARIA label', function () {
        assert.equal(getButtonLabel(this.view.deleteButton), 'Remove Comment');
      });
      test('Collapse button has initial ARIA label', function () {
        assert.include(
          getButtonLabel(this.view.foldoutButton),
          'Collapse Comment',
        );
      });
      test('Collapse button updates ARIA label when toggled', function () {
        const initial = getButtonLabel(this.view.foldoutButton);
        assert.include(initial, 'Collapse Comment');

        this.view.foldoutButton.performAction();

        const updated = getButtonLabel(this.view.foldoutButton);
        assert.include(updated, 'Expand Comment');
      });
      test('Buttons recompute ARIA context after creation', function () {
        for (const button of this.view.getCommentBarButtons()) {
          assert.isNotNull(
            button.getFocusableElement().getAttribute('aria-label'),
          );
        }
      });
    });
  });
});
