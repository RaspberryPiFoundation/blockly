/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import sinon from 'sinon';
import {defineStackBlock} from './test_helpers/block_definitions.js';
import {
  assertEventFired,
  assertEventNotFired,
  createChangeListenerSpy,
} from './test_helpers/events.js';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';
import {dispatchPointerEvent} from './test_helpers/user_input.js';
import {testAWorkspace} from './test_helpers/workspace.ts';

suite('WorkspaceSvg', function () {
  let workspace: Blockly.WorkspaceSvg;
  let clock: sinon.SinonFakeTimers;
  const wrapper: {
    workspace?: Blockly.WorkspaceSvg;
    clock?: sinon.SinonFakeTimers;
  } = {};

  setup(function (this: Mocha.Context) {
    ({clock} = sharedTestSetup.call(this, {fireEventsNow: false}));
    const toolbox = document.getElementById('toolbox-categories');
    assert.isNotNull(toolbox);
    workspace = Blockly.inject('blocklyDiv', {
      ...DEFAULT_INJECT_OPTIONS,
      toolbox: toolbox,
    });
    wrapper.clock = clock;
    wrapper.workspace = workspace;
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'simple_test_block',
        'message0': 'simple test block',
        'output': null,
      },
      {
        'type': 'test_val_in',
        'message0': 'test in %1',
        'args0': [
          {
            'type': 'input_value',
            'name': 'NAME',
          },
        ],
      },
    ]);
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, wrapper.workspace);
  });

  test('dispose of WorkspaceSvg without dom throws no error', function () {
    const ws = new Blockly.WorkspaceSvg(new Blockly.Options({}));
    ws.dispose();
  });

  test('appendDomToWorkspace alignment', function () {
    const dom = Blockly.utils.xml.textToDom(
      '<xml xmlns="https://developers.google.com/blockly/xml">' +
        '  <block type="math_random_float" inline="true" x="21" y="23">' +
        '  </block>' +
        '</xml>',
    );
    Blockly.Xml.appendDomToWorkspace(dom, workspace);
    assert.equal(workspace.getAllBlocks(false).length, 1, 'Block count');
    Blockly.Xml.appendDomToWorkspace(dom, workspace);
    assert.equal(workspace.getAllBlocks(false).length, 2, 'Block count');
    const blocks = workspace.getAllBlocks(false);
    assert.equal(
      blocks[0].getRelativeToSurfaceXY().x,
      21,
      'Block 1 position x',
    );
    assert.equal(
      blocks[0].getRelativeToSurfaceXY().y,
      23,
      'Block 1 position y',
    );
    assert.equal(
      blocks[1].getRelativeToSurfaceXY().x,
      21,
      'Block 2 position x',
    );
    // Y separation value defined in appendDomToWorkspace as 10
    assert.equal(
      blocks[1].getRelativeToSurfaceXY().y,
      23 + blocks[0].getHeightWidth().height + 10,
      'Block 2 position y',
    );
  });

  test('Replacing shadow disposes of old shadow', function () {
    const dom = Blockly.utils.xml.textToDom(
      '<xml xmlns="https://developers.google.com/blockly/xml">' +
        '<block type="test_val_in">' +
        '<value name="NAME">' +
        '<shadow type="simple_test_block"></shadow>' +
        '</value>' +
        '</block>' +
        '</xml>',
    );

    Blockly.Xml.appendDomToWorkspace(dom, workspace);
    const blocks = workspace.getAllBlocks(false);
    assert.equal(blocks.length, 2, 'Block count');
    const shadowBlock = blocks[1];
    assert.equal(false, shadowBlock.isDeadOrDying());

    const block = workspace.newBlock('simple_test_block');
    block.initSvg();

    const inputConnection = workspace
      .getTopBlocks()[0]
      .getInput('NAME')?.connection;
    const outputConnection = block.outputConnection;
    assert.isNotNull(outputConnection);
    inputConnection?.connect(outputConnection);
    assert.equal(false, block.isDeadOrDying());
    assert.equal(true, shadowBlock.isDeadOrDying());
  });

  test('getGesture returns null when no gesture is in progress', function () {
    const gesture = workspace.getGesture();
    assert.isNull(gesture);
  });

  test('getGesture returns the current gesture when one is in progress', function () {
    dispatchPointerEvent(workspace.getSvgGroup(), 'pointerdown');
    const gesture = workspace.getGesture();
    assert.isNotNull(gesture);
  });

  test('Announces a screenreader hint on first focus', function () {
    const liveRegion = document.getElementById('blocklyAriaAnnounce');
    assert.isNotNull(liveRegion);
    liveRegion.textContent = '';
    (Blockly.WorkspaceSvg as any).everFocused = false;
    Blockly.getFocusManager().focusNode(workspace);
    clock.runAll();
    assert.include(liveRegion.textContent, 'Use the arrow keys to navigate');
  });

  test('Nested workspaces do not announce screenreader hints', function () {
    const liveRegion = document.getElementById('blocklyAriaAnnounce');
    assert.isNotNull(liveRegion);
    liveRegion.textContent = '';
    const flyoutWorkspace = workspace.getFlyout()?.getWorkspace();
    assert.isDefined(flyoutWorkspace);
    Blockly.getFocusManager().focusNode(flyoutWorkspace);
    clock.runAll();
    assert.notInclude(liveRegion.textContent, 'Use the arrow keys to navigate');
  });

  suite('Focus Management', function () {
    test('restores focus to the workspace focus target for a non-mutator non-flyout workspace', function () {
      Blockly.getFocusManager().focusTree(workspace);
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        workspace.getWorkspaceFocusTarget(),
      );
    });

    test('restores focus to the first block for a mutator workspace', async function () {
      const block = workspace.newBlock('controls_if');
      block.initSvg();
      block.render();
      const icon = block.getIcon(Blockly.icons.MutatorIcon.TYPE);
      assert.isDefined(icon);
      await icon.setBubbleVisible(true);
      const mutatorWorkspace = icon.getWorkspace();
      assert.isDefined(mutatorWorkspace);
      const firstBlock = mutatorWorkspace.getTopBlocks(true)[0];

      assert.strictEqual(
        mutatorWorkspace.getRestoredFocusableNode(null),
        firstBlock,
      );
      Blockly.getFocusManager().focusTree(mutatorWorkspace);
      assert.strictEqual(
        Blockly.getFocusManager().getFocusedNode(),
        firstBlock,
      );
    });

    test('includes mutators in nested trees', async function () {
      const block = workspace.newBlock('controls_if');
      block.initSvg();
      block.render();
      const icon = block.getIcon(Blockly.icons.MutatorIcon.TYPE);
      assert.isDefined(icon);
      await icon.setBubbleVisible(true);
      const mutatorWorkspace = icon.getWorkspace();

      const nestedTrees = workspace.getNestedTrees();
      assert.sameMembers(nestedTrees, [mutatorWorkspace]);
    });

    test('includes flyouts in nested trees', async function (this: Mocha.Context) {
      const simpleToolbox = document.getElementById('toolbox-simple');
      assert.isNotNull(simpleToolbox);
      const workspace = Blockly.inject('blocklyDiv', {
        ...DEFAULT_INJECT_OPTIONS,
        toolbox: simpleToolbox,
      });

      const nestedTrees = workspace.getNestedTrees();
      assert.isNotNull(workspace.getFlyout());
      assert.sameMembers(nestedTrees, [workspace.getFlyout()?.getWorkspace()]);
      workspaceTeardown.call(this, workspace);
    });
  });

  suite('updateToolbox', function () {
    test('Passes in null when toolbox exists', function () {
      assert.throws(function () {
        workspace.updateToolbox(null);
      }, "Can't nullify an existing toolbox.");
    });
    test('Passes in toolbox def when current toolbox is null', function () {
      workspace.options.languageTree = null;
      assert.throws(function () {
        workspace.updateToolbox({'contents': []});
      }, "Existing toolbox is null.  Can't create new toolbox.");
    });
    test('Existing toolbox has no categories', function (this: Mocha.Context) {
      const simpleToolbox = document.getElementById('toolbox-simple');
      assert.isNotNull(simpleToolbox);
      const workspace = Blockly.inject('blocklyDiv', {
        ...DEFAULT_INJECT_OPTIONS,
        toolbox: simpleToolbox,
      });
      assert.throws(function () {
        workspace.updateToolbox({
          'contents': [{kind: 'category', name: 'Test'}],
        });
      }, "Existing toolbox has no categories.  Can't change mode.");
      workspaceTeardown.call(this, workspace);
    });
    test('Existing toolbox has categories', function () {
      assert.throws(function () {
        workspace.updateToolbox({'contents': []});
      }, "Existing toolbox has categories.  Can't change mode.");
    });
  });

  suite('Viewport change events', function () {
    function resetEventHistory(changeListenerSpy: sinon.SinonSpy) {
      changeListenerSpy.resetHistory();
    }
    function assertSpyFiredViewportEvent(
      spy: sinon.SinonSpy,
      workspace: Blockly.WorkspaceSvg,
      expectedProperties: {[key: string]: any},
    ) {
      assertEventFired(
        spy,
        Blockly.Events.ViewportChange,
        expectedProperties,
        workspace.id,
      );
    }
    function assertViewportEventFired(
      changeListenerSpy: sinon.SinonSpy,
      workspace: Blockly.WorkspaceSvg,
      expectedEventCount = 1,
    ) {
      const metrics = workspace.getMetrics();
      const expectedProperties = {
        scale: workspace.scale,
        oldScale: 1,
        viewTop: metrics.viewTop,
        viewLeft: metrics.viewLeft,
        type: Blockly.Events.VIEWPORT_CHANGE,
      };
      assertSpyFiredViewportEvent(
        changeListenerSpy,
        workspace,
        expectedProperties,
      );
      sinon.assert.callCount(changeListenerSpy, expectedEventCount);
    }
    function runViewportEventTest(
      eventTriggerFunc: () => void,
      changeListenerSpy: sinon.SinonSpy,
      workspace: Blockly.WorkspaceSvg,
      clock: sinon.SinonFakeTimers,
      expectedEventCount = 1,
    ) {
      clock.runAll();
      resetEventHistory(changeListenerSpy);
      eventTriggerFunc();
      clock.runAll();
      assertViewportEventFired(
        changeListenerSpy,
        workspace,
        expectedEventCount,
      );
    }
    let changeListenerSpy: sinon.SinonSpy;
    setup(function () {
      defineStackBlock();
      changeListenerSpy = createChangeListenerSpy(workspace);
    });
    teardown(function () {
      delete Blockly.Blocks['stack_block'];
    });

    suite('zoom', function () {
      test('setScale', function () {
        runViewportEventTest(
          () => workspace.setScale(2),
          changeListenerSpy,
          workspace,
          clock,
        );
      });
      test('zoom(50, 50, 1)', function () {
        runViewportEventTest(
          () => workspace.zoom(50, 50, 1),
          changeListenerSpy,
          workspace,
          clock,
        );
      });
      test('zoom(50, 50, -1)', function () {
        runViewportEventTest(
          () => workspace.zoom(50, 50, -1),
          changeListenerSpy,
          workspace,
          clock,
        );
      });
      test('zoomCenter(1)', function () {
        runViewportEventTest(
          () => workspace.zoomCenter(1),
          changeListenerSpy,
          workspace,
          clock,
        );
      });
      test('zoomCenter(-1)', function () {
        runViewportEventTest(
          () => workspace.zoomCenter(-1),
          changeListenerSpy,
          workspace,
          clock,
        );
      });
      test('zoomToFit', function () {
        const block = workspace.newBlock('stack_block');
        block.initSvg();
        block.render();
        runViewportEventTest(
          () => workspace.zoomToFit(),
          changeListenerSpy,
          workspace,
          clock,
        );
      });
    });
    suite('scroll', function () {
      test('centerOnBlock', function () {
        const block = workspace.newBlock('stack_block');
        block.initSvg();
        block.render();
        runViewportEventTest(
          () => workspace.centerOnBlock(block.id),
          changeListenerSpy,
          workspace,
          clock,
        );
      });
      test('scroll', function () {
        runViewportEventTest(
          () => workspace.scroll(50, 50),
          changeListenerSpy,
          workspace,
          clock,
        );
      });
      test('scrollCenter', function () {
        runViewportEventTest(
          () => workspace.scrollCenter(),
          changeListenerSpy,
          workspace,
          clock,
        );
      });
    });
    suite('Blocks triggering viewport changes', function () {
      test('block move that triggers scroll', function () {
        const block = workspace.newBlock('stack_block');
        block.initSvg();
        block.render();
        clock.runAll();
        resetEventHistory(changeListenerSpy);
        // Expect 2 events, 1 move, 1 viewport
        runViewportEventTest(
          () => {
            block.moveBy(1000, 1000);
          },
          changeListenerSpy,
          workspace,
          clock,
          2,
        );
      });
      test("domToWorkspace that doesn't trigger scroll", function () {
        // 4 blocks with space in center.
        Blockly.Xml.domToWorkspace(
          Blockly.utils.xml.textToDom(
            '<xml xmlns="https://developers.google.com/blockly/xml">' +
              '<block type="controls_if" x="88" y="88"></block>' +
              '<block type="controls_if" x="288" y="88"></block>' +
              '<block type="controls_if" x="88" y="238"></block>' +
              '<block type="controls_if" x="288" y="238"></block>' +
              '</xml>',
          ),
          workspace,
        );
        clock.runAll();
        resetEventHistory(changeListenerSpy);
        // Add block in center of other blocks, not triggering scroll.
        Blockly.Xml.domToWorkspace(
          Blockly.utils.xml.textToDom(
            '<block type="controls_if" x="188" y="163"></block>',
          ),
          workspace,
        );
        clock.runAll();
        assertEventNotFired(changeListenerSpy, Blockly.Events.ViewportChange, {
          type: Blockly.Events.VIEWPORT_CHANGE,
        });
      });
      test("domToWorkspace at 0,0 that doesn't trigger scroll", function () {
        // 4 blocks with space in center.
        Blockly.Xml.domToWorkspace(
          Blockly.utils.xml.textToDom(
            '<xml xmlns="https://developers.google.com/blockly/xml">' +
              '<block type="controls_if" x="-75" y="-72"></block>' +
              '<block type="controls_if" x="75" y="-72"></block>' +
              '<block type="controls_if" x="-75" y="75"></block>' +
              '<block type="controls_if" x="75" y="75"></block>' +
              '</xml>',
          ),
          workspace,
        );
        const xmlDom = Blockly.utils.xml.textToDom(
          '<block type="controls_if" x="0" y="0"></block>',
        );
        clock.runAll();
        resetEventHistory(changeListenerSpy);
        // Add block in center of other blocks, not triggering scroll.
        Blockly.Xml.domToWorkspace(xmlDom, workspace);
        clock.runAll();
        assertEventNotFired(changeListenerSpy, Blockly.Events.ViewportChange, {
          type: Blockly.Events.VIEWPORT_CHANGE,
        });
      });
      test('domToWorkspace multiple blocks triggers one viewport event', function () {
        const addingMultipleBlocks = () => {
          Blockly.Xml.domToWorkspace(
            Blockly.utils.xml.textToDom(
              '<xml xmlns="https://developers.google.com/blockly/xml">' +
                '<block type="controls_if" x="88" y="88"></block>' +
                '<block type="controls_if" x="288" y="88"></block>' +
                '<block type="controls_if" x="88" y="238"></block>' +
                '<block type="controls_if" x="-2088" y="238"></block>' +
                '</xml>',
            ),
            workspace,
          );
        };
        // Expect 10 events, 4 create, 4 move, 1 viewport, 1 finished loading
        runViewportEventTest(
          addingMultipleBlocks,
          changeListenerSpy,
          workspace,
          clock,
          10,
        );
      });
    });
  });

  suite('cleanUp', function () {
    function blockIsAtOrigin(actual: Blockly.BlockSvg, message?: string) {
      blockHasPosition(actual, 0, 0, message || 'block is at origin');
    }

    function blockHasPositionX(
      actual: Blockly.BlockSvg,
      expectedX: number,
      message?: string,
    ) {
      const position = actual.getRelativeToSurfaceXY();
      message = message || 'block has x value of ' + expectedX;
      assert.equal(position.x, expectedX, message);
    }

    function blockHasPositionY(
      actual: Blockly.BlockSvg,
      expectedY: number,
      message?: string,
    ) {
      const position = actual.getRelativeToSurfaceXY();
      message = message || 'block has y value of ' + expectedY;
      assert.equal(position.y, expectedY, message);
    }

    function blockHasPosition(
      actual: Blockly.BlockSvg,
      expectedX: number,
      expectedY: number,
      message?: string,
    ) {
      blockHasPositionX(actual, expectedX, message);
      blockHasPositionY(actual, expectedY, message);
    }

    function blockIsAtNotOrigin(actual: Blockly.BlockSvg, message?: string) {
      const position = actual.getRelativeToSurfaceXY();
      message = message || 'block is not at origin';
      assert.isTrue(position.x != 0 || position.y != 0, message);
    }

    function blocksDoNotIntersect(
      a: Blockly.BlockSvg,
      b: Blockly.BlockSvg,
      message?: string,
    ) {
      const rectA = a.getBoundingRectangle();
      const rectB = b.getBoundingRectangle();
      assert.isFalse(rectA.intersects(rectB), message || "a,b don't intersect");
    }

    function blockIsAbove(
      a: Blockly.BlockSvg,
      b: Blockly.BlockSvg,
      message?: string,
    ) {
      // Block a is above b iff a's bottom extreme is < b's top extreme.
      const rectA = a.getBoundingRectangle();
      const rectB = b.getBoundingRectangle();
      assert.isBelow(rectA.bottom, rectB.top, message || 'a is above b');
    }

    function blockIsBelow(
      a: Blockly.BlockSvg,
      b: Blockly.BlockSvg,
      message?: string,
    ) {
      // Block a is below b iff a's top extreme is > b's bottom extreme.
      const rectA = a.getBoundingRectangle();
      const rectB = b.getBoundingRectangle();
      assert.isAbove(rectA.top, rectB.bottom, message || 'a is below b');
    }

    test('empty workspace does not change', function () {
      workspace.cleanUp();

      const blocks = workspace.getTopBlocks(true);
      assert.equal(blocks.length, 0, 'workspace is empty');
    });

    test('single block at (0, 0) does not change', function () {
      const blockJson = {
        'type': 'math_number',
        'x': 0,
        'y': 0,
        'fields': {
          'NUM': 123,
        },
      };
      Blockly.serialization.blocks.append(blockJson, workspace);

      workspace.cleanUp();

      const blocks = workspace.getTopBlocks(true);
      assert.equal(blocks.length, 1, 'workspace has one top-level block');
      blockIsAtOrigin(blocks[0]);
    });

    test('single block at (10, 15) is moved to (0, 0)', function () {
      const blockJson = {
        'type': 'math_number',
        'x': 10,
        'y': 15,
        'fields': {
          'NUM': 123,
        },
      };
      Blockly.serialization.blocks.append(blockJson, workspace);

      workspace.cleanUp();

      const topBlocks = workspace.getTopBlocks(true);
      const allBlocks = workspace.getAllBlocks(false);
      assert.equal(topBlocks.length, 1, 'workspace has one top-level block');
      assert.equal(allBlocks.length, 1, 'workspace has one block overall');
      blockIsAtOrigin(topBlocks[0]);
    });

    test('single block at (10, 15) with child is moved as unit to (0, 0)', function () {
      const blockJson = {
        'type': 'logic_negate',
        'id': 'parent',
        'x': 10,
        'y': 15,
        'inputs': {
          'BOOL': {
            'block': {
              'type': 'logic_boolean',
              'id': 'child',
              'fields': {
                'BOOL': 'TRUE',
              },
            },
          },
        },
      };
      Blockly.serialization.blocks.append(blockJson, workspace);

      workspace.cleanUp();

      const topBlocks = workspace.getTopBlocks(true);
      const allBlocks = workspace.getAllBlocks(false);
      assert.equal(topBlocks.length, 1, 'workspace has one top-level block');
      assert.equal(allBlocks.length, 2, 'workspace has two blocks overall');
      blockIsAtOrigin(topBlocks[0]); // Parent block.
      blockIsAtNotOrigin(allBlocks[1]); // Child block.
    });

    test('two blocks first at (10, 15) second at (0, 0) do not switch places', function () {
      const blockJson1 = {
        'type': 'math_number',
        'id': 'block1',
        'x': 10,
        'y': 15,
        'fields': {
          'NUM': 123,
        },
      };
      const blockJson2 = {...blockJson1, 'id': 'block2', 'x': 0, 'y': 0};
      Blockly.serialization.blocks.append(blockJson1, workspace);
      Blockly.serialization.blocks.append(blockJson2, workspace);

      workspace.cleanUp();

      // block1 and block2 do not switch places since blocks are pre-sorted by their position before
      // being tidied up, so the order they were added to the workspace doesn't matter.
      const topBlocks = workspace.getTopBlocks(true);
      const block1 = workspace.getBlockById('block1');
      assert.isNotNull(block1);
      const block2 = workspace.getBlockById('block2');
      assert.isNotNull(block2);
      assert.equal(topBlocks.length, 2, 'workspace has two top-level blocks');
      blockIsAtOrigin(block2);
      blockIsBelow(block1, block2);
    });

    test('two overlapping blocks are moved to origin and below', function () {
      const blockJson1 = {
        'type': 'math_number',
        'id': 'block1',
        'x': 25,
        'y': 15,
        'fields': {
          'NUM': 123,
        },
      };
      const blockJson2 = {
        ...blockJson1,
        'id': 'block2',
        'x': 15.25,
        'y': 20.25,
      };
      Blockly.serialization.blocks.append(blockJson1, workspace);
      Blockly.serialization.blocks.append(blockJson2, workspace);

      workspace.cleanUp();

      const topBlocks = workspace.getTopBlocks(true);
      const block1 = workspace.getBlockById('block1');
      assert.isNotNull(block1);
      const block2 = workspace.getBlockById('block2');
      assert.isNotNull(block2);
      assert.equal(topBlocks.length, 2, 'workspace has two top-level blocks');
      blockIsAtOrigin(block1);
      blockIsBelow(block2, block1);
    });

    test('two overlapping blocks with snapping are moved to grid-aligned positions', function () {
      const blockJson1 = {
        'type': 'math_number',
        'id': 'block1',
        'x': 25,
        'y': 15,
        'fields': {
          'NUM': 123,
        },
      };
      const blockJson2 = {
        ...blockJson1,
        'id': 'block2',
        'x': 15.25,
        'y': 20.25,
      };
      Blockly.serialization.blocks.append(blockJson1, workspace);
      Blockly.serialization.blocks.append(blockJson2, workspace);
      workspace.getGrid()?.setSpacing(20);
      workspace.getGrid()?.setSnapToGrid(true);

      workspace.cleanUp();

      const topBlocks = workspace.getTopBlocks(true);
      const block1 = workspace.getBlockById('block1');
      assert.isNotNull(block1);
      const block2 = workspace.getBlockById('block2');
      assert.isNotNull(block2);
      assert.equal(topBlocks.length, 2, 'workspace has two top-level blocks');
      blockHasPosition(block1, 10, 10, 'block1 is at snapped origin');
      blockIsBelow(block2, block1);
    });

    test('two overlapping blocks are moved to origin and below including children', function () {
      const blockJson1 = {
        'type': 'logic_negate',
        'id': 'block1',
        'x': 10,
        'y': 15,
        'inputs': {
          'BOOL': {
            'block': {
              'type': 'logic_boolean',
              'fields': {
                'BOOL': 'TRUE',
              },
            },
          },
        },
      };
      const blockJson2 = {
        ...blockJson1,
        'id': 'block2',
        'x': 15.25,
        'y': 20.25,
      };
      Blockly.serialization.blocks.append(blockJson1, workspace);
      Blockly.serialization.blocks.append(blockJson2, workspace);

      workspace.cleanUp();

      const topBlocks = workspace.getTopBlocks(true);
      const allBlocks = workspace.getAllBlocks(false);
      const block1 = workspace.getBlockById('block1');
      assert.isNotNull(block1);
      const block2 = workspace.getBlockById('block2');
      assert.isNotNull(block2);
      const block1Child = block1.getChildren(false)[0];
      const block2Child = block2.getChildren(false)[0];

      // Note that the x position tests below are verifying that each block's
      // child isn't exactly aligned with it (however, they does overlap since
      // the child block has an input connection with its parent).
      assert.equal(topBlocks.length, 2, 'workspace has two top-level block2');
      assert.equal(allBlocks.length, 4, 'workspace has four blocks overall');
      blockIsAtOrigin(block1);
      blockIsBelow(block2, block1);
      assert.isAbove(
        block1.getChildren(false)[0].getRelativeToSurfaceXY().x,
        block1.getRelativeToSurfaceXY().x,
        "block1's child is right of its start",
      );
      blockIsAbove(block1Child, block2);
      assert.isAbove(
        block2.getChildren(false)[0].getRelativeToSurfaceXY().x,
        block2.getRelativeToSurfaceXY().x,
        "block2's child is right of its start",
      );
      blockIsBelow(block2Child, block1);
    });

    test('two large overlapping blocks are moved to origin and below', function () {
      const blockJson1 = {
        'type': 'controls_repeat_ext',
        'id': 'block1',
        'x': 10,
        'y': 20,
        'inputs': {
          'TIMES': {
            'shadow': {
              'type': 'math_number',
              'fields': {
                'NUM': 10,
              },
            },
          },
          'DO': {
            'block': {
              'type': 'controls_if',
              'inputs': {
                'IF0': {
                  'block': {
                    'type': 'logic_boolean',
                    'fields': {
                      'BOOL': 'TRUE',
                    },
                  },
                },
                'DO0': {
                  'block': {
                    'type': 'text_print',
                    'inputs': {
                      'TEXT': {
                        'shadow': {
                          'type': 'text',
                          'fields': {
                            'TEXT': 'abc',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
      const blockJson2 = {...blockJson1, 'id': 'block2', 'x': 20, 'y': 30};
      Blockly.serialization.blocks.append(blockJson1, workspace);
      Blockly.serialization.blocks.append(blockJson2, workspace);

      workspace.cleanUp();

      const topBlocks = workspace.getTopBlocks(true);
      const block1 = workspace.getBlockById('block1');
      assert.isNotNull(block1);
      const block2 = workspace.getBlockById('block2');
      assert.isNotNull(block2);
      assert.equal(topBlocks.length, 2, 'workspace has two top-level blocks');
      blockIsAtOrigin(block1);
      blockIsBelow(block2, block1);
    });

    test('five overlapping blocks are moved in-order as one column', function () {
      const blockJson1 = {
        'type': 'math_number',
        'id': 'block1',
        'x': 1,
        'y': 2,
        'fields': {
          'NUM': 123,
        },
      };
      const blockJson2 = {...blockJson1, 'id': 'block2', 'x': 3, 'y': 4};
      const blockJson3 = {...blockJson1, 'id': 'block3', 'x': 5, 'y': 6};
      const blockJson4 = {...blockJson1, 'id': 'block4', 'x': 7, 'y': 8};
      const blockJson5 = {...blockJson1, 'id': 'block5', 'x': 9, 'y': 10};
      Blockly.serialization.blocks.append(blockJson1, workspace);
      Blockly.serialization.blocks.append(blockJson2, workspace);
      Blockly.serialization.blocks.append(blockJson3, workspace);
      Blockly.serialization.blocks.append(blockJson4, workspace);
      Blockly.serialization.blocks.append(blockJson5, workspace);

      workspace.cleanUp();

      const topBlocks = workspace.getTopBlocks(true);
      const block1 = workspace.getBlockById('block1');
      assert.isNotNull(block1);
      const block2 = workspace.getBlockById('block2');
      assert.isNotNull(block2);
      const block3 = workspace.getBlockById('block3');
      assert.isNotNull(block3);
      const block4 = workspace.getBlockById('block4');
      assert.isNotNull(block4);
      const block5 = workspace.getBlockById('block5');
      assert.isNotNull(block5);
      assert.equal(topBlocks.length, 5, 'workspace has five top-level blocks');
      blockIsAtOrigin(block1);
      blockHasPositionX(block2, 0);
      blockHasPositionX(block3, 0);
      blockHasPositionX(block4, 0);
      blockHasPositionX(block5, 0);
      blockIsBelow(block2, block1);
      blockIsBelow(block3, block2);
      blockIsBelow(block4, block3);
      blockIsBelow(block5, block4);
    });

    test('single immovable block at (10, 15) is not moved', function () {
      const blockJson = {
        'type': 'math_number',
        'x': 10,
        'y': 15,
        'movable': false,
        'fields': {
          'NUM': 123,
        },
      };
      Blockly.serialization.blocks.append(blockJson, workspace);

      workspace.cleanUp();

      const topBlocks = workspace.getTopBlocks(true);
      const allBlocks = workspace.getAllBlocks(false);
      assert.equal(topBlocks.length, 1, 'workspace has one top-level block');
      assert.equal(allBlocks.length, 1, 'workspace has one block overall');
      blockHasPosition(topBlocks[0], 10, 15);
    });

    test('multiple block types immovable blocks are not moved', function () {
      const smallBlockJson = {
        'type': 'math_number',
        'fields': {
          'NUM': 123,
        },
      };
      const largeBlockJson = {
        'type': 'controls_repeat_ext',
        'inputs': {
          'TIMES': {
            'shadow': {
              'type': 'math_number',
              'fields': {
                'NUM': 10,
              },
            },
          },
          'DO': {
            'block': {
              'type': 'controls_if',
              'inputs': {
                'IF0': {
                  'block': {
                    'type': 'logic_boolean',
                    'fields': {
                      'BOOL': 'TRUE',
                    },
                  },
                },
                'DO0': {
                  'block': {
                    'type': 'text_print',
                    'inputs': {
                      'TEXT': {
                        'shadow': {
                          'type': 'text',
                          'fields': {
                            'TEXT': 'abc',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
      // Block 1 overlaps block 2 (immovable) from above.
      const blockJson1 = {...smallBlockJson, 'id': 'block1', 'x': 1, 'y': 2};
      const blockJson2 = {
        ...smallBlockJson,
        'id': 'block2',
        'x': 10,
        'y': 20,
        'movable': false,
      };
      // Block 3 overlaps block 2 (immovable) from below.
      const blockJson3 = {...smallBlockJson, 'id': 'block3', 'x': 2, 'y': 30};
      const blockJson4 = {...largeBlockJson, 'id': 'block4', 'x': 3, 'y': 40};
      // Block 5 (immovable) will end up overlapping with block 4 since it's large and will be
      // moved.
      const blockJson5 = {
        ...smallBlockJson,
        'id': 'block5',
        'x': 20,
        'y': 200,
        'movable': false,
      };
      Blockly.serialization.blocks.append(blockJson1, workspace);
      Blockly.serialization.blocks.append(blockJson2, workspace);
      Blockly.serialization.blocks.append(blockJson3, workspace);
      Blockly.serialization.blocks.append(blockJson4, workspace);
      Blockly.serialization.blocks.append(blockJson5, workspace);

      workspace.cleanUp();

      const topBlocks = workspace.getTopBlocks(true);
      const block1 = workspace.getBlockById('block1');
      assert.isNotNull(block1);
      const block2 = workspace.getBlockById('block2');
      assert.isNotNull(block2);
      const block3 = workspace.getBlockById('block3');
      assert.isNotNull(block3);
      const block4 = workspace.getBlockById('block4');
      assert.isNotNull(block4);
      const block5 = workspace.getBlockById('block5');
      assert.isNotNull(block5);
      assert.equal(topBlocks.length, 5, 'workspace has five top-level blocks');
      // Check that immovable blocks haven't moved.
      blockHasPosition(block2, 10, 20);
      blockHasPosition(block5, 20, 200);
      // Check that movable positions have correctly been left-aligned.
      blockHasPositionX(block1, 0);
      blockHasPositionX(block3, 0);
      blockHasPositionX(block4, 0);
      // Block order should be: 2, 1, 3, 5, 4 since 2 and 5 are immovable.
      blockIsBelow(block1, block2);
      blockIsBelow(block3, block1);
      blockIsBelow(block5, block3);
      blockIsBelow(block4, block5);
      // Ensure no blocks intersect (can check in order due to the position verification above).
      blocksDoNotIntersect(block2, block1);
      blocksDoNotIntersect(block1, block3);
      blocksDoNotIntersect(block3, block5);
      blocksDoNotIntersect(block5, block4);
    });
  });

  suite('Workspace Base class', function () {
    testAWorkspace(wrapper);
  });
});
