/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import sinon from 'sinon';
import {
  defineBasicBlockWithField,
  defineMutatorBlocks,
  defineRowBlock,
  defineStackBlock,
  defineStatementBlock,
} from './test_helpers/block_definitions.js';
import {assertEventFired, assertEventNotFired} from './test_helpers/events.js';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {simulateClick} from './test_helpers/user_input.js';

suite('Trashcan', function () {
  let workspace: Blockly.WorkspaceSvg;
  let trashcan: Blockly.Trashcan;
  let eventsFireStub: sinon.SinonStub;
  let clock: sinon.SinonFakeTimers;

  function fireDeleteEvent(workspace: Blockly.WorkspaceSvg, xmlString: string) {
    let xml = Blockly.utils.xml.textToDom(
      '<xml xmlns="https://developers.google.com/blockly/xml">' +
        xmlString +
        '</xml>',
    );
    xml = xml.children[0];
    const block = Blockly.Xml.domToBlock(xml, workspace);
    const event = new Blockly.Events.BlockDelete(block);
    Blockly.Events.fire(event);
  }
  function fireNonDeleteEvent(workspace: Blockly.WorkspaceSvg) {
    const event = new Blockly.Events.BlockBase();
    event.type = 'test_field_block';
    event.workspaceId = workspace.id;

    Blockly.Events.fire(event);
  }

  function getContents() {
    const wasOpen = trashcan.contentsIsOpen();
    if (!wasOpen) {
      trashcan.openFlyout();
      clock.runAll();
    }
    const contents =
      trashcan.flyout
        ?.getContents()
        .map((item) => item.getElement())
        .filter((item) => item.canBeFocused()) ?? [];

    if (!wasOpen) {
      trashcan.closeFlyout();
    }

    return contents;
  }

  setup(function (this: Mocha.Context) {
    ({eventsFireStub, clock} = sharedTestSetup.call(this));
    defineBasicBlockWithField();
    defineRowBlock();
    defineRowBlock('row_block2');
    defineStatementBlock();
    defineStatementBlock('statement_block2');
    defineStackBlock();
    defineStackBlock('stack_block2');
    defineMutatorBlocks();
    workspace = Blockly.inject('blocklyDiv', {
      ...DEFAULT_INJECT_OPTIONS,
      'trashcan': true,
      'maxTrashcanContents': Infinity,
    });
    const trashcan_ = workspace.trashcan;
    assert.isNotNull(trashcan_);
    trashcan = trashcan_;
  });
  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
    Blockly.Extensions.unregister('xml_mutator');
    Blockly.Extensions.unregister('jso_mutator');
  });

  suite('Events', function () {
    test('Delete', function () {
      fireDeleteEvent(workspace, '<block type="test_field_block"/>');
      assert.equal(getContents().length, 1);
    });
    test('Non-Delete', function () {
      fireNonDeleteEvent(workspace);
      assert.equal(getContents().length, 0);
    });
    test('Shadow Delete', function () {
      fireDeleteEvent(workspace, '<shadow type="test_field_block"/>');
      assert.equal(getContents().length, 0);
    });
    test('Click without contents - fires workspace click', function () {
      const svgRoot = workspace.getParentSvg().querySelector('.blocklyTrash');
      assert.isNotNull(svgRoot);
      simulateClick(svgRoot);

      assertEventNotFired(eventsFireStub, Blockly.Events.TrashcanOpen, {
        type: Blockly.Events.CLICK,
      });
      assertEventFired(
        eventsFireStub,
        Blockly.Events.Click,
        {targetType: 'workspace', type: Blockly.Events.CLICK},
        workspace.id,
        undefined,
      );
    });
    test('Click with contents - fires trashcanOpen', function () {
      fireDeleteEvent(workspace, '<block type="test_field_block"/>');
      assert.equal(getContents().length, 1);
      // Stub flyout interaction.
      const flyout = trashcan.flyout;
      assert.isNotNull(flyout);
      const showFlyoutStub = sinon.stub(flyout, 'show');

      const svgRoot = workspace.getParentSvg().querySelector('.blocklyTrash');
      assert.isNotNull(svgRoot);
      simulateClick(svgRoot);

      sinon.assert.calledOnce(showFlyoutStub);

      assertEventFired(
        eventsFireStub,
        Blockly.Events.TrashcanOpen,
        {isOpen: true, type: Blockly.Events.TRASHCAN_OPEN},
        workspace.id,
      );
      assertEventNotFired(eventsFireStub, Blockly.Events.Click, {
        type: Blockly.Events.TRASHCAN_OPEN,
      });
    });
    test('Click outside trashcan - fires trashcanClose', function () {
      trashcan.flyout?.setVisible(true);

      simulateClick(workspace.svgGroup_);

      assert.isFalse(
        trashcan.flyout?.isVisible(),
        'Expected flyout to be hidden',
      );
      assertEventFired(
        eventsFireStub,
        Blockly.Events.TrashcanOpen,
        {isOpen: false, type: Blockly.Events.TRASHCAN_OPEN},
        workspace.id,
      );
      assertEventFired(
        eventsFireStub,
        Blockly.Events.Click,
        {targetType: 'workspace', type: Blockly.Events.CLICK},
        workspace.id,
        undefined,
      );
    });
  });
  suite('Unique Contents', function () {
    test('Simple', function () {
      fireDeleteEvent(workspace, '<block type="test_field_block"/>');
      fireDeleteEvent(workspace, '<block type="test_field_block"/>');
      assert.equal(getContents().length, 1);
    });
    test('Different Coords', function () {
      fireDeleteEvent(
        workspace,
        '<block type="test_field_block" x="10" y="10"/>',
      );
      fireDeleteEvent(
        workspace,
        '<block type="test_field_block" x="20" y="20"/>',
      );
      assert.equal(getContents().length, 1);
    });
    test('Different IDs', function () {
      fireDeleteEvent(workspace, '<block type="test_field_block" id="id1"/>');
      fireDeleteEvent(workspace, '<block type="test_field_block" id="id2"/>');
      assert.equal(getContents().length, 1);
    });
    test('No Disabled - Disabled True', function () {
      fireDeleteEvent(workspace, '<block type="test_field_block"/>');
      fireDeleteEvent(
        workspace,
        '<block type="test_field_block" disabled="true"/>',
      );
      // Disabled tags get removed because disabled blocks aren't allowed to
      // be dragged from flyouts. See #2239 and #3243.
      assert.equal(getContents().length, 1);
    });
    test('Different Field Values', function () {
      fireDeleteEvent(
        workspace,
        '<block type="test_field_block">' +
          '  <field name="NAME">dummy_value1</field>' +
          '</block>',
      );
      fireDeleteEvent(
        workspace,
        '<block type="test_field_block">' +
          '  <field name="NAME">dummy_value2</field>' +
          '</block>',
      );
      assert.equal(getContents().length, 2);
    });
    test('No Values - Values', function () {
      fireDeleteEvent(workspace, '<block type="row_block"/>');
      fireDeleteEvent(
        workspace,
        '<block type="row_block">' +
          '  <value name="INPUT">' +
          '    <block type="row_block"/>' +
          '  </value>' +
          '</block>',
      );
      assert.equal(getContents().length, 2);
    });
    test('Different Value Blocks', function () {
      fireDeleteEvent(
        workspace,
        '<block type="row_block">' +
          '  <value name="INPUT">' +
          '    <block type="row_block"/>' +
          '  </value>' +
          '</block>',
      );
      fireDeleteEvent(
        workspace,
        '<block type="row_block">' +
          '  <value name="INPUT">' +
          '    <block type="row_block2"/>' +
          '  </value>' +
          '</block>',
      );
      assert.equal(getContents().length, 2);
    });
    test('No Statements - Statements', function () {
      fireDeleteEvent(workspace, '<block type="statement_block"/>');
      fireDeleteEvent(
        workspace,
        '<block type="statement_block">' +
          '  <statement name="NAME">' +
          '    <block type="statement_block"/>' +
          '  </statement>' +
          '</block>',
      );
      assert.equal(getContents().length, 2);
    });
    test('Different Statement Blocks', function () {
      fireDeleteEvent(
        workspace,
        '<block type="statement_block">' +
          '  <statement name="NAME">' +
          '    <block type="statement_block"/>' +
          '  </statement>' +
          '</block>',
      );
      fireDeleteEvent(
        workspace,
        '<block type="statement_block2">' +
          '  <statement name="NAME">' +
          '    <block type="statement_block2"/>' +
          '  </statement>' +
          '</block>',
      );
      assert.equal(getContents().length, 2);
    });
    test('No Next - Next', function () {
      fireDeleteEvent(workspace, '<block type="stack_block"/>');
      fireDeleteEvent(
        workspace,
        '<block type="stack_block">' +
          '  <next>' +
          '    <block type="stack_block"/>' +
          '  </next>' +
          '</block>',
      );
      assert.equal(getContents().length, 2);
    });
    test('Different Next Blocks', function () {
      fireDeleteEvent(
        workspace,
        '<block type="stack_block">' +
          '  <next>' +
          '    <block type="stack_block"/>' +
          '  </next>' +
          '</block>',
      );
      fireDeleteEvent(
        workspace,
        '<block type="stack_block">' +
          '  <next>' +
          '    <block type="stack_block2"/>' +
          '  </next>' +
          '</block>',
      );
      assert.equal(getContents().length, 2);
    });
    test('No Comment - Comment', function () {
      fireDeleteEvent(workspace, '<block type="test_field_block"/>');
      fireDeleteEvent(
        workspace,
        '<block type="test_field_block">' +
          '  <comment>comment_text</comment>' +
          '</block>',
      );
      assert.equal(getContents().length, 2);
    });
    test('Different Comment Text', function () {
      fireDeleteEvent(
        workspace,
        '<block type="test_field_block">' +
          '  <comment>comment_text1</comment>' +
          '</block>',
      );
      fireDeleteEvent(
        workspace,
        '<block type="test_field_block">' +
          '  <comment>comment_text2</comment>' +
          '</block>',
      );
      assert.equal(getContents().length, 2);
    });
    test('Different Comment Size', function () {
      fireDeleteEvent(
        workspace,
        '<block type="test_field_block">' +
          '  <comment h="10" w="10">comment_text</comment>' +
          '</block>',
      );
      fireDeleteEvent(
        workspace,
        '<block type="test_field_block">' +
          '  <comment h="20" w="20">comment_text</comment>' +
          '</block>',
      );
      // h & w tags are removed b/c the blocks appear the same.
      assert.equal(getContents().length, 1);
    });
    test('Different Comment Pinned', function () {
      fireDeleteEvent(
        workspace,
        '<block type="test_field_block">' +
          '  <comment pinned="false">comment_text</comment>' +
          '</block>',
      );
      fireDeleteEvent(
        workspace,
        '<block type="test_field_block">' +
          '  <comment pinned="true">comment_text</comment>' +
          '</block>',
      );
      // pinned tags are removed b/c the blocks appear the same.
      assert.equal(getContents().length, 1);
    });
    test('Different Mutator', function () {
      fireDeleteEvent(
        workspace,
        '<block type="xml_block">' +
          '  <mutation hasInput="true"></mutation>' +
          '</block>',
      );
      fireDeleteEvent(
        workspace,
        '<block type="xml_block">' +
          '  <mutation hasInputt="false"></mutation>' +
          '</block>',
      );
      assert.equal(getContents().length, 2);
    });
  });
  suite('Max Contents', function () {
    test('Max 0', function () {
      workspace.options.maxTrashcanContents = 0;
      fireDeleteEvent(workspace, '<block type="test_field_block"/>');
      assert.equal(getContents().length, 0);
      workspace.options.maxTrashcanContents = Infinity;
    });
  });
  suite('delete area', function () {
    test('Keyboard drag - wouldDelete returns false', function () {
      // Create a deletable block
      const block = workspace.newBlock('test_field_block');
      block.initSvg();
      block.render();

      // Stub KeyboardMover.mover.isMoving() to return true
      const isMovingStub = sinon
        .stub(Blockly.KeyboardMover.mover, 'isMoving')
        .returns(true);

      try {
        const result = trashcan.wouldDelete(block);
        assert.isFalse(
          result,
          'wouldDelete should return false during keyboard move',
        );
      } finally {
        isMovingStub.restore();
      }
    });
  });
  suite('Focus', function () {
    test('is not claimed as a workspace focus node', function () {
      const trashElement = workspace
        .getParentSvg()
        .querySelector<HTMLElement>('.blocklyTrash');
      assert.isNotNull(trashElement);
      assert.strictEqual(trashElement.getAttribute('tabindex'), '0');
      assert.isNull(
        Blockly.FocusableTreeTraverser.findFocusableNodeFor(
          trashElement,
          workspace,
        ),
      );
    });
  });
});
