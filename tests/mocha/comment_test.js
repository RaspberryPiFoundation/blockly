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

      this.workspace.undo(false);

      assert.isUndefined(block.getIcon(Blockly.icons.IconType.COMMENT));
      assert.isNull(block.getCommentText());
    });

    test('Adding an empty comment can be redone', function () {
      const block = this.workspace.newBlock('empty_block');
      block.setCommentText('');
      this.workspace.undo(false);
      this.workspace.undo(true);

      assert.isNotNull(block.getIcon(Blockly.icons.IconType.COMMENT));
      assert.equal(block.getCommentText(), '');
    });

    test('Adding a non-empty comment can be undone', function () {
      const block = this.workspace.newBlock('empty_block');
      block.setCommentText('hey there');
      assert.isNotNull(block.getIcon(Blockly.icons.IconType.COMMENT));
      assert.equal(block.getCommentText(), 'hey there');

      this.workspace.undo(false);

      assert.isUndefined(block.getIcon(Blockly.icons.IconType.COMMENT));
      assert.isNull(block.getCommentText());
    });

    test('Adding a non-empty comment can be redone', function () {
      const block = this.workspace.newBlock('empty_block');
      block.setCommentText('hey there');
      this.workspace.undo(false);
      this.workspace.undo(true);

      assert.isNotNull(block.getIcon(Blockly.icons.IconType.COMMENT));
      assert.equal(block.getCommentText(), 'hey there');
    });
  });
});
