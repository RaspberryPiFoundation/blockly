/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import * as eventUtils from '../../build/src/core/events/utils.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  assertEventEquals,
  assertNthCallEventArgEquals,
  createChangeListenerSpy,
} from './test_helpers/events.js';
import {
  createGenUidStubWithReturns,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';
import {assertVariableValues} from './test_helpers/variables.js';

suite('Events', function () {
  setup(function () {
    sharedTestSetup.call(this, {fireEventsNow: false});
    this.eventsFireSpy = sinon.spy(eventUtils.TEST_ONLY, 'fireInternal');
    this.workspace = new Blockly.Workspace();
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'field_variable_test_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'field_variable',
            'name': 'VAR',
            'variable': 'item',
          },
        ],
      },
      {
        'type': 'simple_test_block',
        'message0': 'simple test block',
      },
      {
        'type': 'inputs_test_block',
        'message0': 'first %1 second %2',
        'args0': [
          {
            'type': 'input_statement',
            'name': 'STATEMENT1',
          },
          {
            'type': 'input_statement',
            'name': 'STATEMENT2',
          },
        ],
      },
      {
        'type': 'statement_test_block',
        'message0': '',
        'previousStatement': null,
        'nextStatement': null,
      },
    ]);
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  function createSimpleTestBlock(workspace) {
    // Disable events while constructing the block: this is a test of the
    // Blockly.Event constructors, not the block constructors.
    // Set the group id to avoid an extra call to genUid.
    eventUtils.disable();
    let block;
    try {
      eventUtils.setGroup('unused');
      block = new Blockly.Block(workspace, 'simple_test_block');
    } finally {
      eventUtils.setGroup(false);
    }
    eventUtils.enable();
    return block;
  }

  suite('Constructors', function () {
    test('Abstract', function () {
      const event = new Blockly.Events.Abstract();
      assertEventEquals(event, '', undefined, undefined, {
        'recordUndo': true,
        'group': '',
      });
    });

    test('UI event without block', function () {
      const event = new Blockly.Events.UiBase(this.workspace.id);
      assertEventEquals(
        event,
        '',
        this.workspace.id,
        undefined,
        {
          'recordUndo': false,
          'group': '',
        },
        true,
      );
    });

    test('Click without block', function () {
      const event = new Blockly.Events.Click(
        null,
        this.workspace.id,
        'workspace',
      );
      assertEventEquals(
        event,
        Blockly.Events.CLICK,
        this.workspace.id,
        null,
        {
          'targetType': 'workspace',
          'recordUndo': false,
          'group': '',
        },
        true,
      );
    });

    suite('With simple blocks', function () {
      setup(function () {
        this.TEST_BLOCK_ID = 'test_block_id';
        this.TEST_PARENT_ID = 'parent';
        // genUid is expected to be called either once or twice in this suite.
        this.genUidStub = createGenUidStubWithReturns([
          this.TEST_BLOCK_ID,
          this.TEST_PARENT_ID,
        ]);
        this.block = createSimpleTestBlock(this.workspace);
      });

      test('Block base', function () {
        const event = new Blockly.Events.BlockBase(this.block);
        sinon.assert.calledOnce(this.genUidStub);
        assertEventEquals(event, '', this.workspace.id, this.TEST_BLOCK_ID, {
          'recordUndo': true,
          'group': '',
        });
      });

      test('Block create', function () {
        const event = new Blockly.Events.BlockCreate(this.block);
        sinon.assert.calledOnce(this.genUidStub);
        assertEventEquals(
          event,
          Blockly.Events.BLOCK_CREATE,
          this.workspace.id,
          this.TEST_BLOCK_ID,
          {
            'recordUndo': true,
            'group': '',
          },
        );
      });

      test('Block delete', function () {
        const event = new Blockly.Events.BlockDelete(this.block);
        sinon.assert.calledOnce(this.genUidStub);
        assertEventEquals(
          event,
          Blockly.Events.BLOCK_DELETE,
          this.workspace.id,
          this.TEST_BLOCK_ID,
          {
            'recordUndo': true,
            'group': '',
          },
        );
      });

      test('Click with block', function () {
        const TEST_GROUP_ID = 'testGroup';
        eventUtils.setGroup(TEST_GROUP_ID);
        const event = new Blockly.Events.Click(this.block, null, 'block');
        assertEventEquals(
          event,
          Blockly.Events.CLICK,
          this.workspace.id,
          this.TEST_BLOCK_ID,
          {
            'targetType': 'block',
            'recordUndo': false,
            'group': TEST_GROUP_ID,
          },
          true,
        );
      });

      suite('Block Move', function () {
        test('by coordinate', function () {
          const coordinate = new Blockly.utils.Coordinate(3, 4);
          this.block.xy = coordinate;

          const event = new Blockly.Events.BlockMove(this.block);
          sinon.assert.calledOnce(this.genUidStub);
          assertEventEquals(
            event,
            Blockly.Events.BLOCK_MOVE,
            this.workspace.id,
            this.TEST_BLOCK_ID,
            {
              'oldParentId': undefined,
              'oldInputName': undefined,
              'oldCoordinate': coordinate,
              'recordUndo': true,
              'group': '',
            },
          );
        });

        test('by parent', function () {
          try {
            this.parentBlock = createSimpleTestBlock(this.workspace);
            this.block.parentBlock_ = this.parentBlock;
            this.block.xy = new Blockly.utils.Coordinate(3, 4);
            const event = new Blockly.Events.BlockMove(this.block);
            sinon.assert.calledTwice(this.genUidStub);
            assertEventEquals(
              event,
              Blockly.Events.BLOCK_MOVE,
              this.workspace.id,
              this.TEST_BLOCK_ID,
              {
                'oldParentId': this.TEST_PARENT_ID,
                'oldInputName': undefined,
                'oldCoordinate': undefined,
                'recordUndo': true,
                'group': '',
              },
            );
          } finally {
            // This needs to be cleared, otherwise workspace.dispose will fail.
            this.block.parentBlock_ = null;
          }
        });
      });
    });

    suite('With shadow blocks', function () {
      setup(function () {
        this.TEST_BLOCK_ID = 'test_block_id';
        this.TEST_PARENT_ID = 'parent';
        // genUid is expected to be called either once or twice in this suite.
        this.genUidStub = createGenUidStubWithReturns([
          this.TEST_BLOCK_ID,
          this.TEST_PARENT_ID,
        ]);
        this.block = createSimpleTestBlock(this.workspace);
        this.block.setShadow(true);
      });

      test('Block base', function () {
        const event = new Blockly.Events.BlockBase(this.block);
        sinon.assert.calledOnce(this.genUidStub);
        assertEventEquals(event, '', this.workspace.id, this.TEST_BLOCK_ID, {
          'varId': undefined,
          'recordUndo': true,
          'group': '',
        });
      });

      test('Block change', function () {
        const event = new Blockly.Events.BlockChange(
          this.block,
          'field',
          'FIELD_NAME',
          'old',
          'new',
        );
        sinon.assert.calledOnce(this.genUidStub);
        assertEventEquals(
          event,
          Blockly.Events.BLOCK_CHANGE,
          this.workspace.id,
          this.TEST_BLOCK_ID,
          {
            'varId': undefined,
            'element': 'field',
            'name': 'FIELD_NAME',
            'oldValue': 'old',
            'newValue': 'new',
            'recordUndo': true,
            'group': '',
          },
        );
      });

      test('Block create', function () {
        const event = new Blockly.Events.BlockCreate(this.block);
        sinon.assert.calledOnce(this.genUidStub);
        assertEventEquals(
          event,
          Blockly.Events.BLOCK_CREATE,
          this.workspace.id,
          this.TEST_BLOCK_ID,
          {
            'recordUndo': false,
            'group': '',
          },
        );
      });

      test('Block delete', function () {
        const event = new Blockly.Events.BlockDelete(this.block);
        sinon.assert.calledOnce(this.genUidStub);
        assertEventEquals(
          event,
          Blockly.Events.BLOCK_DELETE,
          this.workspace.id,
          this.TEST_BLOCK_ID,
          {
            'recordUndo': false,
            'group': '',
          },
        );
      });

      test('Block move', function () {
        try {
          this.parentBlock = createSimpleTestBlock(this.workspace);
          this.block.parentBlock_ = this.parentBlock;
          this.block.xy = new Blockly.utils.Coordinate(3, 4);
          const event = new Blockly.Events.BlockMove(this.block);
          sinon.assert.calledTwice(this.genUidStub);
          assertEventEquals(
            event,
            Blockly.Events.BLOCK_MOVE,
            this.workspace.id,
            this.TEST_BLOCK_ID,
            {
              'oldParentId': this.TEST_PARENT_ID,
              'oldInputName': undefined,
              'oldCoordinate': undefined,
              'recordUndo': false,
              'group': '',
            },
          );
        } finally {
          // This needs to be cleared, otherwise workspace.dispose will fail.
          this.block.parentBlock_ = null;
        }
      });
    });

    suite('With variable getter blocks', function () {
      setup(function () {
        this.TEST_BLOCK_ID = 'test_block_id';
        this.genUidStub = createGenUidStubWithReturns([
          this.TEST_BLOCK_ID,
          'test_var_id',
          'test_group_id',
        ]);
        // Disabling events when creating a block with variable can cause issues
        // at workspace dispose.
        this.block = new Blockly.Block(
          this.workspace,
          'field_variable_test_block',
        );
      });

      test('Block change', function () {
        const event = new Blockly.Events.BlockChange(
          this.block,
          'field',
          'VAR',
          'id1',
          'id2',
        );
        assertEventEquals(
          event,
          Blockly.Events.BLOCK_CHANGE,
          this.workspace.id,
          this.TEST_BLOCK_ID,
          {
            'element': 'field',
            'name': 'VAR',
            'oldValue': 'id1',
            'newValue': 'id2',
            'recordUndo': true,
            'group': '',
          },
        );
      });
    });
  });

  suite('Serialization', function () {
    const safeStringify = (json) => {
      const cache = [];
      return JSON.stringify(json, (key, value) => {
        if (typeof value == 'object' && value != null) {
          if (cache.includes(value)) {
            // Discard duplicate reference.
            return undefined;
          }
          cache.push(value);
          return value;
        }
        return value;
      });
    };
    const variableEventTestCases = [
      {
        title: 'Var create',
        class: Blockly.Events.VarCreate,
        getArgs: (thisObj) => [thisObj.variable],
        getExpectedJson: () => ({
          type: 'var_create',
          group: '',
          varId: 'id1',
          varType: 'type1',
          varName: 'name1',
        }),
      },
      {
        title: 'Var delete',
        class: Blockly.Events.VarDelete,
        getArgs: (thisObj) => [thisObj.variable],
        getExpectedJson: () => ({
          type: 'var_delete',
          group: '',
          varId: 'id1',
          varType: 'type1',
          varName: 'name1',
        }),
      },
      {
        title: 'Var rename',
        class: Blockly.Events.VarRename,
        getArgs: (thisObj) => [thisObj.variable, 'name2'],
        getExpectedJson: () => ({
          type: 'var_rename',
          group: '',
          varId: 'id1',
          oldName: 'name1',
          newName: 'name2',
        }),
      },
    ];
    const uiEventTestCases = [
      {
        title: 'Bubble open',
        class: Blockly.Events.BubbleOpen,
        getArgs: (thisObj) => [thisObj.block, true, 'mutator'],
        getExpectedJson: (thisObj) => ({
          type: 'bubble_open',
          group: '',
          isOpen: true,
          bubbleType: 'mutator',
          blockId: thisObj.block.id,
        }),
      },
      {
        title: 'Block click',
        class: Blockly.Events.Click,
        getArgs: (thisObj) => [thisObj.block, null, 'block'],
        getExpectedJson: (thisObj) => ({
          type: 'click',
          group: '',
          targetType: 'block',
          blockId: thisObj.block.id,
        }),
      },
      {
        title: 'Workspace click',
        class: Blockly.Events.Click,
        getArgs: (thisObj) => [null, thisObj.workspace.id, 'workspace'],
        getExpectedJson: (thisObj) => ({
          type: 'click',
          group: '',
          targetType: 'workspace',
        }),
      },
      {
        title: 'Drag start',
        class: Blockly.Events.BlockDrag,
        getArgs: (thisObj) => [thisObj.block, true, [thisObj.block]],
        getExpectedJson: (thisObj) => ({
          type: 'drag',
          group: '',
          isStart: true,
          blockId: thisObj.block.id,
          blocks: [thisObj.block],
        }),
      },
      {
        title: 'Drag end',
        class: Blockly.Events.BlockDrag,
        getArgs: (thisObj) => [thisObj.block, false, [thisObj.block]],
        getExpectedJson: (thisObj) => ({
          type: 'drag',
          group: '',
          isStart: false,
          blockId: thisObj.block.id,
          blocks: [thisObj.block],
        }),
      },
      {
        title: 'Field Edit Intermediate Change',
        class: Blockly.Events.BlockFieldIntermediateChange,
        getArgs: (thisObj) => [thisObj.block, 'test', 'old value', 'new value'],
        getExpectedJson: (thisObj) => ({
          type: 'block_field_intermediate_change',
          group: '',
          blockId: thisObj.block.id,
          name: 'test',
          oldValue: 'old value',
          newValue: 'new value',
        }),
      },
      {
        title: 'Selected',
        class: Blockly.Events.Selected,
        getArgs: (thisObj) => [null, thisObj.block.id, thisObj.workspace.id],
        getExpectedJson: (thisObj) => ({
          type: 'selected',
          group: '',
          newElementId: thisObj.block.id,
        }),
      },
      {
        title: 'Selected (deselect)',
        class: Blockly.Events.Selected,
        getArgs: (thisObj) => [thisObj.block.id, null, thisObj.workspace.id],
        getExpectedJson: (thisObj) => ({
          type: 'selected',
          group: '',
          oldElementId: thisObj.block.id,
        }),
      },
      {
        title: 'Theme Change',
        class: Blockly.Events.ThemeChange,
        getArgs: (thisObj) => ['classic', thisObj.workspace.id],
        getExpectedJson: () => ({
          type: 'theme_change',
          group: '',
          themeName: 'classic',
        }),
      },
      {
        title: 'Toolbox item select',
        class: Blockly.Events.ToolboxItemSelect,
        getArgs: (thisObj) => ['Math', 'Loops', thisObj.workspace.id],
        getExpectedJson: () => ({
          type: 'toolbox_item_select',
          group: '',
          oldItem: 'Math',
          newItem: 'Loops',
        }),
      },
      {
        title: 'Toolbox item select (no previous)',
        class: Blockly.Events.ToolboxItemSelect,
        getArgs: (thisObj) => [null, 'Loops', thisObj.workspace.id],
        getExpectedJson: () => ({
          type: 'toolbox_item_select',
          group: '',
          newItem: 'Loops',
        }),
      },
      {
        title: 'Toolbox item select (deselect)',
        class: Blockly.Events.ToolboxItemSelect,
        getArgs: (thisObj) => ['Math', null, thisObj.workspace.id],
        getExpectedJson: () => ({
          type: 'toolbox_item_select',
          group: '',
          oldItem: 'Math',
        }),
      },
      {
        title: 'Trashcan open',
        class: Blockly.Events.TrashcanOpen,
        getArgs: (thisObj) => [true, thisObj.workspace.id],
        getExpectedJson: () => ({
          type: 'trashcan_open',
          group: '',
          isOpen: true,
        }),
      },
      {
        title: 'Viewport change',
        class: Blockly.Events.ViewportChange,
        getArgs: (thisObj) => [2.666, 1.333, 1.2, thisObj.workspace.id, 1],
        getExpectedJson: () => ({
          type: 'viewport_change',
          group: '',
          viewTop: 2.666,
          viewLeft: 1.333,
          scale: 1.2,
          oldScale: 1,
        }),
      },
      {
        title: 'Viewport change (0,0)',
        class: Blockly.Events.ViewportChange,
        getArgs: (thisObj) => [0, 0, 1.2, thisObj.workspace.id, 1],
        getExpectedJson: () => ({
          type: 'viewport_change',
          group: '',
          viewTop: 0,
          viewLeft: 0,
          scale: 1.2,
          oldScale: 1,
        }),
      },
    ];
    const blockEventTestCases = [
      {
        title: 'Block change',
        class: Blockly.Events.BlockChange,
        getArgs: (thisObj) => [thisObj.block, 'collapsed', null, false, true],
        getExpectedJson: (thisObj) => ({
          type: 'change',
          group: '',
          blockId: thisObj.block.id,
          element: 'collapsed',
          oldValue: false,
          newValue: true,
        }),
      },
      {
        title: 'Block create',
        class: Blockly.Events.BlockCreate,
        getArgs: (thisObj) => [thisObj.block],
        getExpectedJson: (thisObj) => ({
          type: 'create',
          group: '',
          blockId: thisObj.block.id,
          xml:
            '<block xmlns="https://developers.google.com/blockly/xml"' +
            ' type="simple_test_block" id="testBlockId1" x="0" y="0">' +
            '</block>',
          ids: [thisObj.block.id],
          json: {
            'type': 'simple_test_block',
            'id': 'testBlockId1',
            'x': 0,
            'y': 0,
          },
        }),
      },
      {
        title: 'Block create (shadow)',
        class: Blockly.Events.BlockCreate,
        getArgs: (thisObj) => [thisObj.shadowBlock],
        getExpectedJson: (thisObj) => ({
          type: 'create',
          group: '',
          blockId: thisObj.shadowBlock.id,
          xml:
            '<shadow xmlns="https://developers.google.com/blockly/xml"' +
            ' type="simple_test_block" id="testBlockId2" x="0" y="0">' +
            '</shadow>',
          ids: [thisObj.shadowBlock.id],
          json: {
            'type': 'simple_test_block',
            'id': 'testBlockId2',
            'x': 0,
            'y': 0,
          },
          recordUndo: false,
        }),
      },
      {
        title: 'Block delete',
        class: Blockly.Events.BlockDelete,
        getArgs: (thisObj) => [thisObj.block],
        getExpectedJson: (thisObj) => ({
          type: 'delete',
          group: '',
          blockId: thisObj.block.id,
          oldXml:
            '<block xmlns="https://developers.google.com/blockly/xml"' +
            ' type="simple_test_block" id="testBlockId1" x="0" y="0">' +
            '</block>',
          ids: [thisObj.block.id],
          wasShadow: false,
          oldJson: {
            'type': 'simple_test_block',
            'id': 'testBlockId1',
            'x': 0,
            'y': 0,
          },
        }),
      },
      {
        title: 'Block delete (shadow)',
        class: Blockly.Events.BlockDelete,
        getArgs: (thisObj) => [thisObj.shadowBlock],
        getExpectedJson: (thisObj) => ({
          type: 'delete',
          group: '',
          blockId: thisObj.shadowBlock.id,
          oldXml:
            '<shadow xmlns="https://developers.google.com/blockly/xml"' +
            ' type="simple_test_block" id="testBlockId2" x="0" y="0">' +
            '</shadow>',
          ids: [thisObj.shadowBlock.id],
          wasShadow: true,
          oldJson: {
            'type': 'simple_test_block',
            'id': 'testBlockId2',
            'x': 0,
            'y': 0,
          },
          recordUndo: false,
        }),
      },
      // TODO(#4577) Test serialization of move event coordinate properties.
      {
        title: 'Block move',
        class: Blockly.Events.BlockMove,
        getArgs: (thisObj) => [thisObj.block],
        getExpectedJson: (thisObj) => ({
          type: 'move',
          group: '',
          blockId: thisObj.block.id,
          oldCoordinate: '0, 0',
        }),
      },
      {
        title: 'Block move (shadow)',
        class: Blockly.Events.BlockMove,
        getArgs: (thisObj) => [thisObj.shadowBlock],
        getExpectedJson: (thisObj) => ({
          type: 'move',
          group: '',
          blockId: thisObj.shadowBlock.id,
          oldCoordinate: '0, 0',
          recordUndo: false,
        }),
      },
    ];
    const workspaceCommentEventTestCases = [
      {
        title: 'Comment change',
        class: Blockly.Events.CommentChange,
        getArgs: (thisObj) => [thisObj.comment, 'bar', 'foo'],
        getExpectedJson: (thisObj) => ({
          type: 'comment_change',
          group: '',
          commentId: thisObj.comment.id,
          oldContents: 'bar',
          newContents: 'foo',
        }),
      },
      {
        title: 'Comment create',
        class: Blockly.Events.CommentCreate,
        getArgs: (thisObj) => [thisObj.comment],
        getExpectedJson: (thisObj) => ({
          type: 'comment_create',
          group: '',
          commentId: thisObj.comment.id,
          // TODO: Before merging, is this a dumb change detector?
          xml: Blockly.Xml.domToText(
            Blockly.Xml.saveWorkspaceComment(thisObj.comment),
            {addCoordinates: true},
          ),
          json: {
            height: 100,
            width: 120,
            id: 'comment id',
            x: 0,
            y: 0,
            text: 'test text',
          },
        }),
      },
      {
        title: 'Comment delete',
        class: Blockly.Events.CommentDelete,
        getArgs: (thisObj) => [thisObj.comment],
        getExpectedJson: (thisObj) => ({
          type: 'comment_delete',
          group: '',
          commentId: thisObj.comment.id,
          // TODO: Before merging, is this a dumb change detector?
          xml: Blockly.Xml.domToText(
            Blockly.Xml.saveWorkspaceComment(thisObj.comment),
            {addCoordinates: true},
          ),
          json: {
            height: 100,
            width: 120,
            id: 'comment id',
            x: 0,
            y: 0,
            text: 'test text',
          },
        }),
      },
      {
        title: 'Comment drag start',
        class: Blockly.Events.CommentDrag,
        getArgs: (thisObj) => [thisObj.comment, true],
        getExpectedJson: (thisObj) => ({
          type: 'comment_drag',
          group: '',
          isStart: true,
          commentId: thisObj.comment.id,
        }),
      },
      {
        title: 'Comment drag end',
        class: Blockly.Events.CommentDrag,
        getArgs: (thisObj) => [thisObj.comment, false],
        getExpectedJson: (thisObj) => ({
          type: 'comment_drag',
          group: '',
          isStart: false,
          commentId: thisObj.comment.id,
        }),
      },
      // TODO(#4577) Test serialization of move event coordinate properties.
      // TODO(#4577) Test serialization of comment resize event properties.
    ];
    const testSuites = [
      {
        title: 'Variable events',
        testCases: variableEventTestCases,
        setup: (thisObj) => {
          thisObj.variable = thisObj.workspace.createVariable(
            'name1',
            'type1',
            'id1',
          );
        },
      },
      {
        title: 'UI events',
        testCases: uiEventTestCases,
        setup: (thisObj) => {
          thisObj.block = createSimpleTestBlock(thisObj.workspace);
        },
      },
      {
        title: 'Block events',
        testCases: blockEventTestCases,
        setup: (thisObj) => {
          createGenUidStubWithReturns(['testBlockId1', 'testBlockId2']);
          thisObj.block = createSimpleTestBlock(thisObj.workspace);
          thisObj.shadowBlock = createSimpleTestBlock(thisObj.workspace);
          thisObj.shadowBlock.setShadow(true);
        },
      },
      {
        title: 'WorkspaceComment events',
        testCases: workspaceCommentEventTestCases,
        setup: (thisObj) => {
          thisObj.comment = new Blockly.comments.WorkspaceComment(
            thisObj.workspace,
            'comment id',
          );
          thisObj.comment.setText('test text');
        },
      },
    ];
    testSuites.forEach((testSuite) => {
      suite(testSuite.title, function () {
        setup(function () {
          testSuite.setup(this);
        });
        suite('fromJson', function () {
          testSuite.testCases.forEach((testCase) => {
            test(testCase.title, function () {
              const event = new testCase.class(...testCase.getArgs(this));
              const json = event.toJson();
              const event2 = Blockly.Events.fromJson(json, this.workspace);

              assert.equal(safeStringify(event2.toJson()), safeStringify(json));
            });
          });
        });
        suite('toJson', function () {
          testSuite.testCases.forEach((testCase) => {
            if (testCase.getExpectedJson) {
              test(testCase.title, function () {
                const event = new testCase.class(...testCase.getArgs(this));
                const json = event.toJson();
                const expectedJson = testCase.getExpectedJson(this);

                assert.equal(safeStringify(json), safeStringify(expectedJson));
              });
            }
          });
        });
      });
    });
  });

  suite('Variable events', function () {
    setup(function () {
      this.variableMap = this.workspace.getVariableMap();
      this.variable = this.variableMap.createVariable('name1', 'type1', 'id1');
    });

    /**
     * Check if a variable with the given values exists.
     * @param {Blockly.VariableMap} variableMap The variableMap
     *     the checked variable belongs to.
     * @param {!string} name The expected name of the variable.
     * @param {!string} type The expected type of the variable.
     * @param {!string} id The expected id of the variable.
     */
    function checkVariableValues(variableMap, name, type, id) {
      const variable = variableMap.getVariableById(id);
      assert.isDefined(variable);
      assert.equal(name, variable.name);
      assert.equal(type, variable.type);
      assert.equal(id, variable.getId());
    }

    suite('Constructors', function () {
      test('Var base', function () {
        const event = new Blockly.Events.VarBase(this.variable);
        assertEventEquals(event, '', this.workspace.id, undefined, {
          'varId': 'id1',
          'recordUndo': true,
          'group': '',
        });
      });

      test('Var create', function () {
        const event = new Blockly.Events.VarCreate(this.variable);
        assertEventEquals(
          event,
          Blockly.Events.VAR_CREATE,
          this.workspace.id,
          undefined,
          {
            'varId': 'id1',
            'varType': 'type1',
            'varName': 'name1',
            'recordUndo': true,
            'group': '',
          },
        );
      });

      test('Var delete', function () {
        const event = new Blockly.Events.VarDelete(this.variable);
        assertEventEquals(
          event,
          Blockly.Events.VAR_DELETE,
          this.workspace.id,
          undefined,
          {
            'varId': 'id1',
            'varType': 'type1',
            'varName': 'name1',
            'recordUndo': true,
            'group': '',
          },
        );
      });

      test('Var rename', function () {
        const event = new Blockly.Events.VarRename(this.variable, 'name2');
        assertEventEquals(
          event,
          Blockly.Events.VAR_RENAME,
          this.workspace.id,
          undefined,
          {
            'varId': 'id1',
            'oldName': 'name1',
            'newName': 'name2',
            'recordUndo': true,
            'group': '',
          },
        );
      });
    });

    suite('Run Forward', function () {
      test('Var create', function () {
        const json = {
          type: 'var_create',
          varId: 'id2',
          varType: 'type2',
          varName: 'name2',
        };
        const event = eventUtils.fromJson(json, this.workspace);
        const x = this.variableMap.getVariableById('id2');
        assert.isNull(x);
        event.run(true);
        assertVariableValues(this.workspace, 'name2', 'type2', 'id2');
      });

      test('Var delete', function () {
        const event = new Blockly.Events.VarDelete(this.variable);
        assert.isNotNull(this.variableMap.getVariableById('id1'));
        event.run(true);
        assert.isNull(this.variableMap.getVariableById('id1'));
      });

      test('Var rename', function () {
        const event = new Blockly.Events.VarRename(this.variable, 'name2');
        event.run(true);
        assert.isNull(this.variableMap.getVariable('name1'));
        checkVariableValues(this.variableMap, 'name2', 'type1', 'id1');
      });
    });
    suite('Run Backward', function () {
      test('Var create', function () {
        const event = new Blockly.Events.VarCreate(this.variable);
        assert.isNotNull(this.variableMap.getVariableById('id1'));
        event.run(false);
      });

      test('Var delete', function () {
        const json = {
          type: 'var_delete',
          varId: 'id2',
          varType: 'type2',
          varName: 'name2',
        };
        const event = eventUtils.fromJson(json, this.workspace);
        assert.isNull(this.variableMap.getVariableById('id2'));
        event.run(false);
        assertVariableValues(this.variableMap, 'name2', 'type2', 'id2');
      });

      test('Var rename', function () {
        const event = new Blockly.Events.VarRename(this.variable, 'name2');
        event.run(false);
        assert.isNull(this.variableMap.getVariable('name2'));
        checkVariableValues(this.variableMap, 'name1', 'type1', 'id1');
      });
    });
  });

  suite('enqueueEvent', function () {
    const {FIRE_QUEUE, enqueueEvent} = eventUtils.TEST_ONLY;

    function newDisconnectEvent(parent, child, inputName, workspaceId) {
      const event = new Blockly.Events.BlockMove(child);
      event.workspaceId = workspaceId;
      event.oldParentId = parent.id;
      event.oldInputName = inputName;
      event.oldCoordinate = undefined;
      event.newParentId = undefined;
      event.newInputName = undefined;
      event.newCoordinate = new Blockly.utils.Coordinate(0, 0);
      return event;
    }

    function newConnectEvent(parent, child, inputName, workspaceId) {
      const event = new Blockly.Events.BlockMove(child);
      event.workspaceId = workspaceId;
      event.oldParentId = undefined;
      event.oldInputName = undefined;
      event.oldCoordinate = new Blockly.utils.Coordinate(0, 0);
      event.newParentId = parent.id;
      event.newInputName = inputName;
      event.newCoordinate = undefined;
      return event;
    }

    function newMutationEvent(block, workspaceId) {
      const event = new Blockly.Events.BlockChange(block);
      event.workspaceId = workspaceId;
      event.element = 'mutation';
      return event;
    }

    test('Events are enqueued', function () {
      // Disable events during block creation to avoid firing BlockCreate
      // events.
      eventUtils.disable();
      const block = this.workspace.newBlock('simple_test_block', '1');
      eventUtils.enable();

      try {
        assert.equal(FIRE_QUEUE.length, 0);
        const events = [
          new Blockly.Events.BlockCreate(block),
          new Blockly.Events.BlockMove(block),
          new Blockly.Events.Click(block),
        ];
        events.map((e) => enqueueEvent(e));
        assert.equal(FIRE_QUEUE.length, events.length, 'FIRE_QUEUE.length');
        for (let i = 0; i < events.length; i++) {
          assert.equal(FIRE_QUEUE[i], events[i], `FIRE_QUEUE[${i}]`);
        }
      } finally {
        FIRE_QUEUE.length = 0;
      }
    });

    test('BlockChange event reordered', function () {
      eventUtils.disable();
      const parent = this.workspace.newBlock('inputs_test_block', 'parent');
      const child1 = this.workspace.newBlock('statement_test_block', 'child1');
      const child2 = this.workspace.newBlock('statement_test_block', 'child2');
      eventUtils.enable();

      try {
        assert.equal(FIRE_QUEUE.length, 0);
        const events = [
          newDisconnectEvent(parent, child1, 'STATEMENT1'),
          newDisconnectEvent(parent, child2, 'STATEMENT2'),
          newConnectEvent(parent, child1, 'STATEMENT1'),
          newConnectEvent(parent, child2, 'STATEMENT2'),
          newMutationEvent(parent),
        ];
        events.map((e) => enqueueEvent(e));
        assert.equal(FIRE_QUEUE.length, events.length, 'FIRE_QUEUE.length');
        assert.equal(FIRE_QUEUE[0], events[0], 'FIRE_QUEUE[0]');
        assert.equal(FIRE_QUEUE[1], events[1], 'FIRE_QUEUE[1]');
        assert.equal(FIRE_QUEUE[2], events[4], 'FIRE_QUEUE[2]');
        assert.equal(FIRE_QUEUE[3], events[2], 'FIRE_QUEUE[3]');
        assert.equal(FIRE_QUEUE[4], events[3], 'FIRE_QUEUE[4]');
      } finally {
        FIRE_QUEUE.length = 0;
      }
    });

    test('BlockChange event for other workspace not reordered', function () {
      eventUtils.disable();
      const parent = this.workspace.newBlock('inputs_test_block', 'parent');
      const child = this.workspace.newBlock('statement_test_block', 'child');
      eventUtils.enable();

      try {
        assert.equal(FIRE_QUEUE.length, 0);
        const events = [
          newDisconnectEvent(parent, child, 'STATEMENT1', 'ws1'),
          newConnectEvent(parent, child, 'STATEMENT1', 'ws1'),
          newMutationEvent(parent, 'ws2'),
        ];
        events.map((e) => enqueueEvent(e));
        assert.equal(FIRE_QUEUE.length, events.length, 'FIRE_QUEUE.length');
        for (let i = 0; i < events.length; i++) {
          assert.equal(FIRE_QUEUE[i], events[i], `FIRE_QUEUE[${i}]`);
        }
      } finally {
        FIRE_QUEUE.length = 0;
      }
    });

    test('BlockChange event for other group not reordered', function () {
      eventUtils.disable();
      const parent = this.workspace.newBlock('inputs_test_block', 'parent');
      const child = this.workspace.newBlock('statement_test_block', 'child');
      eventUtils.enable();

      try {
        assert.equal(FIRE_QUEUE.length, 0);
        const events = [];
        eventUtils.setGroup('group1');
        events.push(newDisconnectEvent(parent, child, 'STATEMENT1'));
        events.push(newConnectEvent(parent, child, 'STATEMENT1'));
        eventUtils.setGroup('group2');
        events.push(newMutationEvent(parent, 'ws2'));
        events.map((e) => enqueueEvent(e));
        assert.equal(FIRE_QUEUE.length, events.length, 'FIRE_QUEUE.length');
        for (let i = 0; i < events.length; i++) {
          assert.equal(FIRE_QUEUE[i], events[i], `FIRE_QUEUE[${i}]`);
        }
      } finally {
        FIRE_QUEUE.length = 0;
        eventUtils.setGroup(false);
      }
    });

    test('BlockChange event for other parent not reordered', function () {
      eventUtils.disable();
      const parent1 = this.workspace.newBlock('inputs_test_block', 'parent1');
      const parent2 = this.workspace.newBlock('inputs_test_block', 'parent2');
      const child = this.workspace.newBlock('statement_test_block', 'child');
      eventUtils.enable();

      try {
        assert.equal(FIRE_QUEUE.length, 0);
        const events = [
          newDisconnectEvent(parent1, child, 'STATEMENT1', 'ws1'),
          newConnectEvent(parent1, child, 'STATEMENT1', 'ws1'),
          newMutationEvent(parent2, 'ws2'),
        ];
        events.map((e) => enqueueEvent(e));
        assert.equal(FIRE_QUEUE.length, events.length, 'FIRE_QUEUE.length');
        for (let i = 0; i < events.length; i++) {
          assert.equal(FIRE_QUEUE[i], events[i], `FIRE_QUEUE[${i}]`);
        }
      } finally {
        FIRE_QUEUE.length = 0;
      }
    });
  });

  suite('Filters', function () {
    function addMoveEvent(events, block, newX, newY) {
      events.push(new Blockly.Events.BlockMove(block));
      block.xy = new Blockly.utils.Coordinate(newX, newY);
      events[events.length - 1].recordNew();
    }

    function addMoveEventParent(events, block, parent) {
      events.push(new Blockly.Events.BlockMove(block));
      block.setParent(parent);
      events[events.length - 1].recordNew();
    }

    test('No removed, order unchanged', function () {
      const block = this.workspace.newBlock('field_variable_test_block', '1');
      const events = [
        new Blockly.Events.BlockCreate(block),
        new Blockly.Events.BlockMove(block),
        new Blockly.Events.BlockChange(block, 'field', 'VAR', 'id1', 'id2'),
        new Blockly.Events.Click(block),
      ];
      const filteredEvents = eventUtils.filter(events);
      assert.equal(filteredEvents.length, 4); // no event should have been removed.
      // test that the order hasn't changed
      assert.isTrue(filteredEvents[0] instanceof Blockly.Events.BlockCreate);
      assert.isTrue(filteredEvents[1] instanceof Blockly.Events.BlockMove);
      assert.isTrue(filteredEvents[2] instanceof Blockly.Events.BlockChange);
      assert.isTrue(filteredEvents[3] instanceof Blockly.Events.Click);
    });

    test('Different blocks no removed', function () {
      const block1 = this.workspace.newBlock('field_variable_test_block', '1');
      const block2 = this.workspace.newBlock('field_variable_test_block', '2');
      const events = [
        new Blockly.Events.BlockCreate(block1),
        new Blockly.Events.BlockMove(block1),
        new Blockly.Events.BlockCreate(block2),
        new Blockly.Events.BlockMove(block2),
      ];
      const filteredEvents = eventUtils.filter(events);
      assert.equal(filteredEvents.length, 4); // no event should have been removed.
    });

    test('Forward', function () {
      const block = this.workspace.newBlock('field_variable_test_block', '1');
      const events = [new Blockly.Events.BlockCreate(block)];
      addMoveEvent(events, block, 1, 1);
      addMoveEvent(events, block, 2, 2);
      addMoveEvent(events, block, 3, 3);
      const filteredEvents = eventUtils.filter(events);
      assert.equal(filteredEvents.length, 2); // duplicate moves should have been removed.
      // test that the order hasn't changed
      assert.isTrue(filteredEvents[0] instanceof Blockly.Events.BlockCreate);
      assert.isTrue(filteredEvents[1] instanceof Blockly.Events.BlockMove);
      assert.equal(filteredEvents[1].newCoordinate.x, 3);
      assert.equal(filteredEvents[1].newCoordinate.y, 3);
    });

    test('Merge block move events', function () {
      const block = this.workspace.newBlock('field_variable_test_block', '1');
      const events = [];
      addMoveEvent(events, block, 0, 0);
      addMoveEvent(events, block, 1, 1);
      const filteredEvents = eventUtils.filter(events);
      assert.equal(filteredEvents.length, 1); // second move event merged into first
      assert.equal(filteredEvents[0].newCoordinate.x, 1);
      assert.equal(filteredEvents[0].newCoordinate.y, 1);
    });

    test('Merge block change events', function () {
      const block1 = this.workspace.newBlock('field_variable_test_block', '1');
      const events = [
        new Blockly.Events.BlockChange(block1, 'field', 'VAR', 'item', 'item1'),
        new Blockly.Events.BlockChange(
          block1,
          'field',
          'VAR',
          'item1',
          'item2',
        ),
      ];
      const filteredEvents = eventUtils.filter(events);
      assert.equal(filteredEvents.length, 1); // second change event merged into first
      assert.equal(filteredEvents[0].oldValue, 'item');
      assert.equal(filteredEvents[0].newValue, 'item2');
    });

    test('Merge viewport change events', function () {
      const events = [
        new Blockly.Events.ViewportChange(1, 2, 3, this.workspace, 4),
        new Blockly.Events.ViewportChange(5, 6, 7, this.workspace, 8),
      ];
      const filteredEvents = eventUtils.filter(events);
      assert.equal(filteredEvents.length, 1); // second change event merged into first
      assert.equal(filteredEvents[0].viewTop, 5);
      assert.equal(filteredEvents[0].viewLeft, 6);
      assert.equal(filteredEvents[0].scale, 7);
      assert.equal(filteredEvents[0].oldScale, 8);
    });

    test('Merge ui events', function () {
      const block1 = this.workspace.newBlock('field_variable_test_block', '1');
      const block2 = this.workspace.newBlock('field_variable_test_block', '2');
      const block3 = this.workspace.newBlock('field_variable_test_block', '3');
      const events = [
        new Blockly.Events.BubbleOpen(block1, true, 'comment'),
        new Blockly.Events.Click(block1),
        new Blockly.Events.BubbleOpen(block2, true, 'mutator'),
        new Blockly.Events.Click(block2),
        new Blockly.Events.BubbleOpen(block3, true, 'warning'),
        new Blockly.Events.Click(block3),
      ];
      const filteredEvents = eventUtils.filter(events);
      // click event merged into corresponding *Open event
      assert.equal(filteredEvents.length, 3);
      assert.isTrue(filteredEvents[0] instanceof Blockly.Events.BubbleOpen);
      assert.isTrue(filteredEvents[1] instanceof Blockly.Events.BubbleOpen);
      assert.isTrue(filteredEvents[2] instanceof Blockly.Events.BubbleOpen);
      assert.equal(filteredEvents[0].bubbleType, 'comment');
      assert.equal(filteredEvents[1].bubbleType, 'mutator');
      assert.equal(filteredEvents[2].bubbleType, 'warning');
    });

    test('Colliding events not dropped', function () {
      // Tests that events that collide on a (event, block, workspace) tuple
      // but cannot be merged do not get dropped during filtering.
      const block = this.workspace.newBlock('field_variable_test_block', '1');
      const events = [
        new Blockly.Events.Click(block),
        new Blockly.Events.BlockDrag(block, true),
      ];
      const filteredEvents = eventUtils.filter(events);
      // click and stackclick should both exist
      assert.equal(filteredEvents.length, 2);
      assert.isTrue(filteredEvents[0] instanceof Blockly.Events.Click);
      assert.equal(filteredEvents[1].isStart, true);
    });

    test('Merging null operations dropped', function () {
      // Mutator composition could result in move events for blocks
      // connected to the mutated block that were null operations. This
      // leads to events in the undo/redo queue that do nothing, requiring
      // an extra undo/redo to proceed to the next event. This test ensures
      // that two move events that do get merged (disconnecting and
      // reconnecting a block in response to a mutator change) are filtered
      // from the queue.
      const block = this.workspace.newBlock('field_variable_test_block', '1');
      block.setParent(null);
      const events = [];
      addMoveEventParent(events, block, null);
      addMoveEventParent(events, block, null);
      const filteredEvents = eventUtils.filter(events);
      // The two events should be merged, but because nothing has changed
      // they will be filtered out.
      assert.equal(filteredEvents.length, 0);
    });

    test('Move events different blocks not merged', function () {
      // Move events should only merge if they refer to the same block and are
      // consecutive.
      // See github.com/google/blockly/pull/1892 for a worked example showing
      // how merging non-consecutive events can fail when replacing a shadow
      // block.
      const block1 = createSimpleTestBlock(this.workspace);
      const block2 = createSimpleTestBlock(this.workspace);

      const events = [];
      addMoveEvent(events, block1, 1, 1);
      addMoveEvent(events, block2, 1, 1);
      events.push(new Blockly.Events.BlockDelete(block2));
      addMoveEvent(events, block1, 2, 2);

      const filteredEvents = eventUtils.filter(events);
      // Nothing should have merged.
      assert.equal(filteredEvents.length, 4);
      // test that the order hasn't changed
      assert.isTrue(filteredEvents[0] instanceof Blockly.Events.BlockMove);
      assert.isTrue(filteredEvents[1] instanceof Blockly.Events.BlockMove);
      assert.isTrue(filteredEvents[2] instanceof Blockly.Events.BlockDelete);
      assert.isTrue(filteredEvents[3] instanceof Blockly.Events.BlockMove);
    });
  });

  suite('Firing', function () {
    setup(function () {
      this.changeListenerSpy = createChangeListenerSpy(this.workspace);
    });

    test('Block dispose triggers Delete', function () {
      let workspaceSvg;
      try {
        const toolbox = document.getElementById('toolbox-categories');
        workspaceSvg = Blockly.inject('blocklyDiv', {toolbox: toolbox});
        const TEST_BLOCK_ID = 'test_block_id';
        const genUidStub = createGenUidStubWithReturns([
          TEST_BLOCK_ID,
          'test_group_id',
        ]);

        const block = workspaceSvg.newBlock('');
        block.initSvg();
        block.setCommentText('test comment');
        const expectedOldXml = Blockly.Xml.blockToDomWithXY(block);
        const expectedId = block.id;

        // Run all queued events.
        this.clock.runAll();

        this.eventsFireSpy.resetHistory();
        const changeListenerSpy = createChangeListenerSpy(workspaceSvg);
        block.dispose();

        // Run all queued events.
        this.clock.runAll();

        // Expect two calls to genUid: one to set the block's ID, and one for
        // the event group's ID for creating block.
        sinon.assert.calledTwice(genUidStub);

        assertNthCallEventArgEquals(
          this.eventsFireSpy,
          0,
          Blockly.Events.BlockDelete,
          {oldXml: expectedOldXml, group: ''},
          workspaceSvg.id,
          expectedId,
        );

        // Expect the workspace to not have a variable with ID 'test_block_id'.
        assert.isNull(
          this.workspace.getVariableMap().getVariableById(TEST_BLOCK_ID),
        );
      } finally {
        workspaceTeardown.call(this, workspaceSvg);
      }
    });

    test('New block new var', function () {
      const TEST_BLOCK_ID = 'test_block_id';
      const TEST_GROUP_ID = 'test_group_id';
      const TEST_VAR_ID = 'test_var_id';
      const genUidStub = createGenUidStubWithReturns([
        TEST_BLOCK_ID,
        TEST_GROUP_ID,
        TEST_VAR_ID,
      ]);
      const _ = this.workspace.newBlock('field_variable_test_block');
      const TEST_VAR_NAME = 'item'; //  As defined in block's json.

      // Run all queued events.
      this.clock.runAll();

      // Expect three calls to genUid: one to set the block's ID, one for the event
      // group's ID, and one for the variable's ID.
      sinon.assert.calledThrice(genUidStub);

      // Expect two events fired: varCreate and block create.
      sinon.assert.calledTwice(this.eventsFireSpy);
      // Expect both events to trigger change listener.
      sinon.assert.calledTwice(this.changeListenerSpy);
      // Both events should be on undo stack
      assert.equal(this.workspace.undoStack_.length, 2, 'Undo stack length');

      assertNthCallEventArgEquals(
        this.changeListenerSpy,
        0,
        Blockly.Events.VarCreate,
        {group: TEST_GROUP_ID, varId: TEST_VAR_ID, varName: TEST_VAR_NAME},
        this.workspace.id,
        undefined,
      );
      assertNthCallEventArgEquals(
        this.changeListenerSpy,
        1,
        Blockly.Events.BlockCreate,
        {group: TEST_GROUP_ID},
        this.workspace.id,
        TEST_BLOCK_ID,
      );

      // Expect the workspace to have a variable with ID 'test_var_id'.
      assert.isNotNull(
        this.workspace.getVariableMap().getVariableById(TEST_VAR_ID),
      );
    });

    test('New block new var xml', function () {
      const TEST_GROUP_ID = 'test_group_id';
      const genUidStub = createGenUidStubWithReturns(TEST_GROUP_ID);
      const dom = Blockly.utils.xml.textToDom(
        '<xml xmlns="https://developers.google.com/blockly/xml">' +
          '  <block type="field_variable_test_block" id="test_block_id">' +
          '    <field name="VAR" id="test_var_id">name1</field>' +
          '  </block>' +
          '</xml>',
      );
      Blockly.Xml.domToWorkspace(dom, this.workspace);
      const TEST_BLOCK_ID = 'test_block_id';
      const TEST_VAR_ID = 'test_var_id';
      const TEST_VAR_NAME = 'name1';

      // Run all queued events.
      this.clock.runAll();

      // Expect one call to genUid: for the event group's id
      sinon.assert.calledOnce(genUidStub);

      // When block is created using domToWorkspace, 5 events are fired:
      // 1. varCreate (events disabled)
      // 2. varCreate
      // 3. block create
      // 4. move (no-op, is filtered out)
      // 5. finished loading
      sinon.assert.callCount(this.eventsFireSpy, 5);
      // The first varCreate and move event should have been ignored.
      sinon.assert.callCount(this.changeListenerSpy, 3);
      // Expect two events on undo stack: varCreate and block create.
      assert.equal(this.workspace.undoStack_.length, 2, 'Undo stack length');

      assertNthCallEventArgEquals(
        this.changeListenerSpy,
        0,
        Blockly.Events.VarCreate,
        {group: TEST_GROUP_ID, varId: TEST_VAR_ID, varName: TEST_VAR_NAME},
        this.workspace.id,
        undefined,
      );
      assertNthCallEventArgEquals(
        this.changeListenerSpy,
        1,
        Blockly.Events.BlockCreate,
        {group: TEST_GROUP_ID},
        this.workspace.id,
        TEST_BLOCK_ID,
      );

      // Finished loading event should not be part of event group.
      assertNthCallEventArgEquals(
        this.changeListenerSpy,
        2,
        Blockly.Events.FinishedLoading,
        {group: ''},
        this.workspace.id,
        undefined,
      );

      // Expect the workspace to have a variable with ID 'test_var_id'.
      assert.isNotNull(this.workspace.getVariableById(TEST_VAR_ID));
    });
  });
  suite('Disable orphans', function () {
    setup(function () {
      // disableOrphans needs a WorkspaceSVG
      const toolbox = document.getElementById('toolbox-categories');
      this.workspace = Blockly.inject('blocklyDiv', {toolbox: toolbox});
    });
    teardown(function () {
      workspaceTeardown.call(this, this.workspace);
    });
    test('Created orphan block is disabled', function () {
      this.workspace.addChangeListener(eventUtils.disableOrphans);
      const block = this.workspace.newBlock('controls_for');
      block.initSvg();
      block.render();

      // Fire all events
      this.clock.runAll();

      assert.isFalse(
        block.isEnabled(),
        'Expected orphan block to be disabled after creation',
      );
    });
    test('Created procedure block is enabled', function () {
      this.workspace.addChangeListener(eventUtils.disableOrphans);

      // Procedure block is never an orphan
      const functionBlock = this.workspace.newBlock('procedures_defnoreturn');
      functionBlock.initSvg();
      functionBlock.render();

      // Fire all events
      this.clock.runAll();

      assert.isTrue(
        functionBlock.isEnabled(),
        'Expected top-level procedure block to be enabled',
      );
    });
    test('Moving a block to top-level disables it', function () {
      this.workspace.addChangeListener(eventUtils.disableOrphans);
      const functionBlock = this.workspace.newBlock('procedures_defnoreturn');
      functionBlock.initSvg();
      functionBlock.render();

      const block = this.workspace.newBlock('controls_for');
      block.initSvg();
      block.render();

      // Connect the block to the function block input stack
      functionBlock.inputList[1].connection.connect(block.previousConnection);

      // Disconnect it again
      block.unplug(false);

      // Fire all events
      this.clock.runAll();

      assert.isFalse(
        block.isEnabled(),
        'Expected disconnected block to be disabled',
      );
    });
    test('Giving block a parent enables it', function () {
      this.workspace.addChangeListener(eventUtils.disableOrphans);
      const functionBlock = this.workspace.newBlock('procedures_defnoreturn');
      functionBlock.initSvg();
      functionBlock.render();

      const block = this.workspace.newBlock('controls_for');
      block.initSvg();
      block.render();

      // Connect the block to the function block input stack
      functionBlock.inputList[1].connection.connect(block.previousConnection);

      // Fire all events
      this.clock.runAll();

      assert.isTrue(
        block.isEnabled(),
        'Expected block to be enabled after connecting to parent',
      );
    });
    test('disableOrphans events are not undoable', function () {
      this.workspace.addChangeListener(eventUtils.disableOrphans);
      const functionBlock = this.workspace.newBlock('procedures_defnoreturn');
      functionBlock.initSvg();
      functionBlock.render();

      const block = this.workspace.newBlock('controls_for');
      block.initSvg();
      block.render();

      // Connect the block to the function block input stack
      functionBlock.inputList[1].connection.connect(block.previousConnection);

      // Disconnect it again
      block.unplug(false);

      // Fire all events
      this.clock.runAll();

      const disabledEvents = this.workspace
        .getUndoStack()
        .filter((e) => e.element === 'disabled');
      assert.isEmpty(
        disabledEvents,
        'Undo stack should not contain any disabled events',
      );
    });
  });
});
