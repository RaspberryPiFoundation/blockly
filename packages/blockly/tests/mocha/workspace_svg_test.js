/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {EventType} from '../../build/src/core/events/type.js';
import {assert} from '../../node_modules/chai/index.js';
import {defineStackBlock} from './test_helpers/block_definitions.js';
import {
  assertEventFired,
  assertEventNotFired,
  createChangeListenerSpy,
} from './test_helpers/events.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {testAWorkspace} from './test_helpers/workspace.js';

suite('WorkspaceSvg', function () {
  setup(function () {
    this.clock = sharedTestSetup.call(this, {fireEventsNow: false}).clock;
    const toolbox = document.getElementById('toolbox-categories');
    this.workspace = Blockly.inject('blocklyDiv', {toolbox: toolbox});
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

  teardown(function () {
    sharedTestTeardown.call(this);
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
    Blockly.Xml.appendDomToWorkspace(dom, this.workspace);
    assert.equal(this.workspace.getAllBlocks(false).length, 1, 'Block count');
    Blockly.Xml.appendDomToWorkspace(dom, this.workspace);
    assert.equal(this.workspace.getAllBlocks(false).length, 2, 'Block count');
    const blocks = this.workspace.getAllBlocks(false);
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

    Blockly.Xml.appendDomToWorkspace(dom, this.workspace);
    const blocks = this.workspace.getAllBlocks(false);
    assert.equal(blocks.length, 2, 'Block count');
    const shadowBlock = blocks[1];
    assert.equal(false, shadowBlock.isDeadOrDying());

    const block = this.workspace.newBlock('simple_test_block');
    block.initSvg();

    const inputConnection = this.workspace
      .getTopBlocks()[0]
      .getInput('NAME').connection;
    inputConnection.connect(block.outputConnection);
    assert.equal(false, block.isDeadOrDying());
    assert.equal(true, shadowBlock.isDeadOrDying());
  });

  suite('updateToolbox', function () {
    test('Passes in null when toolbox exists', function () {
      assert.throws(
        function () {
          this.workspace.updateToolbox(null);
        }.bind(this),
        "Can't nullify an existing toolbox.",
      );
    });
    test('Passes in toolbox def when current toolbox is null', function () {
      this.workspace.options.languageTree = null;
      assert.throws(
        function () {
          this.workspace.updateToolbox({'contents': []});
        }.bind(this),
        "Existing toolbox is null.  Can't create new toolbox.",
      );
    });
    test('Existing toolbox has no categories', function () {
      sinon
        .stub(Blockly.utils.toolbox.TEST_ONLY, 'hasCategoriesInternal')
        .returns(true);
      this.workspace.toolbox = null;
      assert.throws(
        function () {
          this.workspace.updateToolbox({'contents': []});
        }.bind(this),
        "Existing toolbox has no categories.  Can't change mode.",
      );
    });
    test('Existing toolbox has categories', function () {
      sinon
        .stub(Blockly.utils.toolbox.TEST_ONLY, 'hasCategoriesInternal')
        .returns(false);
      this.workspace.flyout_ = null;
      assert.throws(
        function () {
          this.workspace.updateToolbox({'contents': []});
        }.bind(this),
        "Existing toolbox has categories.  Can't change mode.",
      );
    });
  });

  suite('Viewport change events', function () {
    function resetEventHistory(changeListenerSpy) {
      changeListenerSpy.resetHistory();
    }
    function assertSpyFiredViewportEvent(spy, workspace, expectedProperties) {
      assertEventFired(
        spy,
        Blockly.Events.ViewportChange,
        expectedProperties,
        workspace.id,
      );
      assertEventFired(
        spy,
        Blockly.Events.ViewportChange,
        expectedProperties,
        workspace.id,
      );
    }
    function assertViewportEventFired(
      changeListenerSpy,
      workspace,
      expectedEventCount = 1,
    ) {
      const metrics = workspace.getMetrics();
      const expectedProperties = {
        scale: workspace.scale,
        oldScale: 1,
        viewTop: metrics.viewTop,
        viewLeft: metrics.viewLeft,
        type: EventType.VIEWPORT_CHANGE,
      };
      assertSpyFiredViewportEvent(
        changeListenerSpy,
        workspace,
        expectedProperties,
      );
      sinon.assert.callCount(changeListenerSpy, expectedEventCount);
    }
    function runViewportEventTest(
      eventTriggerFunc,
      changeListenerSpy,
      workspace,
      clock,
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
    setup(function () {
      defineStackBlock();
      this.changeListenerSpy = createChangeListenerSpy(this.workspace);
    });
    teardown(function () {
      delete Blockly.Blocks['stack_block'];
    });

    suite('zoom', function () {
      test('setScale', function () {
        runViewportEventTest(
          () => this.workspace.setScale(2),
          this.changeListenerSpy,
          this.workspace,
          this.clock,
        );
      });
      test('zoom(50, 50, 1)', function () {
        runViewportEventTest(
          () => this.workspace.zoom(50, 50, 1),
          this.changeListenerSpy,
          this.workspace,
          this.clock,
        );
      });
      test('zoom(50, 50, -1)', function () {
        runViewportEventTest(
          () => this.workspace.zoom(50, 50, -1),
          this.changeListenerSpy,
          this.workspace,
          this.clock,
        );
      });
      test('zoomCenter(1)', function () {
        runViewportEventTest(
          () => this.workspace.zoomCenter(1),
          this.changeListenerSpy,
          this.workspace,
          this.clock,
        );
      });
      test('zoomCenter(-1)', function () {
        runViewportEventTest(
          () => this.workspace.zoomCenter(-1),
          this.changeListenerSpy,
          this.workspace,
          this.clock,
        );
      });
      test('zoomToFit', function () {
        const block = this.workspace.newBlock('stack_block');
        block.initSvg();
        block.render();
        runViewportEventTest(
          () => this.workspace.zoomToFit(),
          this.changeListenerSpy,
          this.workspace,
          this.clock,
        );
      });
    });
    suite('scroll', function () {
      test('centerOnBlock', function () {
        const block = this.workspace.newBlock('stack_block');
        block.initSvg();
        block.render();
        runViewportEventTest(
          () => this.workspace.centerOnBlock(block.id),
          this.changeListenerSpy,
          this.workspace,
          this.clock,
        );
      });
      test('scroll', function () {
        runViewportEventTest(
          () => this.workspace.scroll(50, 50),
          this.changeListenerSpy,
          this.workspace,
          this.clock,
        );
      });
      test('scrollCenter', function () {
        runViewportEventTest(
          () => this.workspace.scrollCenter(),
          this.changeListenerSpy,
          this.workspace,
          this.clock,
        );
      });
    });
    suite('Blocks triggering viewport changes', function () {
      test('block move that triggers scroll', function () {
        const block = this.workspace.newBlock('stack_block');
        block.initSvg();
        block.render();
        this.clock.runAll();
        resetEventHistory(this.changeListenerSpy);
        // Expect 2 events, 1 move, 1 viewport
        runViewportEventTest(
          () => {
            block.moveBy(1000, 1000);
          },
          this.changeListenerSpy,
          this.workspace,
          this.clock,
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
          this.workspace,
        );
        const xmlDom = Blockly.utils.xml.textToDom(
          '<block type="controls_if" x="188" y="163"></block>',
        );
        this.clock.runAll();
        resetEventHistory(this.changeListenerSpy);
        // Add block in center of other blocks, not triggering scroll.
        Blockly.Xml.domToWorkspace(
          Blockly.utils.xml.textToDom(
            '<block type="controls_if" x="188" y="163"></block>',
          ),
          this.workspace,
        );
        this.clock.runAll();
        assertEventNotFired(
          this.changeListenerSpy,
          Blockly.Events.ViewportChange,
          {type: EventType.VIEWPORT_CHANGE},
        );
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
          this.workspace,
        );
        const xmlDom = Blockly.utils.xml.textToDom(
          '<block type="controls_if" x="0" y="0"></block>',
        );
        this.clock.runAll();
        resetEventHistory(this.changeListenerSpy);
        // Add block in center of other blocks, not triggering scroll.
        Blockly.Xml.domToWorkspace(xmlDom, this.workspace);
        this.clock.runAll();
        assertEventNotFired(
          this.changeListenerSpy,
          Blockly.Events.ViewportChange,
          {type: EventType.VIEWPORT_CHANGE},
        );
      });
      test.skip('domToWorkspace multiple blocks triggers one viewport event', function () {
        // TODO: Un-skip after adding filtering for consecutive viewport events.
        const addingMultipleBlocks = () => {
          Blockly.Xml.domToWorkspace(
            Blockly.utils.xml.textToDom(
              '<xml xmlns="https://developers.google.com/blockly/xml">' +
                '<block type="controls_if" x="88" y="88"></block>' +
                '<block type="controls_if" x="288" y="88"></block>' +
                '<block type="controls_if" x="88" y="238"></block>' +
                '<block type="controls_if" x="288" y="238"></block>' +
                '</xml>',
            ),
            this.workspace,
          );
        };
        // Expect 10 events, 4 create, 4 move, 1 viewport, 1 finished loading
        runViewportEventTest(
          addingMultipleBlocks,
          this.changeListenerSpy,
          this.workspace,
          this.clock,
          10,
        );
      });
    });
  });

  suite('cleanUp', function () {
    assert.blockIsAtOrigin = function (actual, message) {
      assert.blockHasPosition(actual, 0, 0, message || 'block is at origin');
    };

    assert.blockHasPositionX = function (actual, expectedX, message) {
      const position = actual.getRelativeToSurfaceXY();
      message = message || 'block has x value of ' + expectedX;
      assert.equal(position.x, expectedX, message);
    };

    assert.blockHasPositionY = function (actual, expectedY, message) {
      const position = actual.getRelativeToSurfaceXY();
      message = message || 'block has y value of ' + expectedY;
      assert.equal(position.y, expectedY, message);
    };

    assert.blockHasPosition = function (actual, expectedX, expectedY, message) {
      assert.blockHasPositionX(actual, expectedX, message);
      assert.blockHasPositionY(actual, expectedY, message);
    };

    assert.blockIsAtNotOrigin = function (actual, message) {
      const position = actual.getRelativeToSurfaceXY();
      message = message || 'block is not at origin';
      assert.isTrue(position.x != 0 || position.y != 0, message);
    };

    assert.blocksDoNotIntersect = function (a, b, message) {
      const rectA = a.getBoundingRectangle();
      const rectB = b.getBoundingRectangle();
      assert.isFalse(rectA.intersects(rectB), message || "a,b don't intersect");
    };

    assert.blockIsAbove = function (a, b, message) {
      // Block a is above b iff a's bottom extreme is < b's top extreme.
      const rectA = a.getBoundingRectangle();
      const rectB = b.getBoundingRectangle();
      assert.isBelow(rectA.bottom, rectB.top, message || 'a is above b');
    };

    assert.blockIsBelow = function (a, b, message) {
      // Block a is below b iff a's top extreme is > b's bottom extreme.
      const rectA = a.getBoundingRectangle();
      const rectB = b.getBoundingRectangle();
      assert.isAbove(rectA.top, rectB.bottom, message || 'a is below b');
    };

    test('empty workspace does not change', function () {
      this.workspace.cleanUp();

      const blocks = this.workspace.getTopBlocks(true);
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
      Blockly.serialization.blocks.append(blockJson, this.workspace);

      this.workspace.cleanUp();

      const blocks = this.workspace.getTopBlocks(true);
      assert.equal(blocks.length, 1, 'workspace has one top-level block');
      assert.blockIsAtOrigin(blocks[0]);
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
      Blockly.serialization.blocks.append(blockJson, this.workspace);

      this.workspace.cleanUp();

      const topBlocks = this.workspace.getTopBlocks(true);
      const allBlocks = this.workspace.getAllBlocks(false);
      assert.equal(topBlocks.length, 1, 'workspace has one top-level block');
      assert.equal(allBlocks.length, 1, 'workspace has one block overall');
      assert.blockIsAtOrigin(topBlocks[0]);
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
      Blockly.serialization.blocks.append(blockJson, this.workspace);

      this.workspace.cleanUp();

      const topBlocks = this.workspace.getTopBlocks(true);
      const allBlocks = this.workspace.getAllBlocks(false);
      assert.equal(topBlocks.length, 1, 'workspace has one top-level block');
      assert.equal(allBlocks.length, 2, 'workspace has two blocks overall');
      assert.blockIsAtOrigin(topBlocks[0]); // Parent block.
      assert.blockIsAtNotOrigin(allBlocks[1]); // Child block.
    });

    // TODO(#8676): Reenable once test passes reliably.
    test.skip('two blocks first at (10, 15) second at (0, 0) do not switch places', function () {
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
      Blockly.serialization.blocks.append(blockJson1, this.workspace);
      Blockly.serialization.blocks.append(blockJson2, this.workspace);

      this.workspace.cleanUp();

      // block1 and block2 do not switch places since blocks are pre-sorted by their position before
      // being tidied up, so the order they were added to the workspace doesn't matter.
      const topBlocks = this.workspace.getTopBlocks(true);
      const block1 = this.workspace.getBlockById('block1');
      const block2 = this.workspace.getBlockById('block2');
      assert.equal(topBlocks.length, 2, 'workspace has two top-level blocks');
      assert.blockIsAtOrigin(block2);
      assert.blockIsBelow(block1, block2);
    });

    // TODO(#8676): Reenable once test passes reliably.
    test.skip('two overlapping blocks are moved to origin and below', function () {
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
      Blockly.serialization.blocks.append(blockJson1, this.workspace);
      Blockly.serialization.blocks.append(blockJson2, this.workspace);

      this.workspace.cleanUp();

      const topBlocks = this.workspace.getTopBlocks(true);
      const block1 = this.workspace.getBlockById('block1');
      const block2 = this.workspace.getBlockById('block2');
      assert.equal(topBlocks.length, 2, 'workspace has two top-level blocks');
      assert.blockIsAtOrigin(block1);
      assert.blockIsBelow(block2, block1);
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
      Blockly.serialization.blocks.append(blockJson1, this.workspace);
      Blockly.serialization.blocks.append(blockJson2, this.workspace);
      this.workspace.getGrid().setSpacing(20);
      this.workspace.getGrid().setSnapToGrid(true);

      this.workspace.cleanUp();

      const topBlocks = this.workspace.getTopBlocks(true);
      const block1 = this.workspace.getBlockById('block1');
      const block2 = this.workspace.getBlockById('block2');
      assert.equal(topBlocks.length, 2, 'workspace has two top-level blocks');
      assert.blockHasPosition(block1, 10, 10, 'block1 is at snapped origin');
      assert.blockIsBelow(block2, block1);
    });

    // TODO(#8676): Reenable once test passes reliably.
    test.skip('two overlapping blocks are moved to origin and below including children', function () {
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
      Blockly.serialization.blocks.append(blockJson1, this.workspace);
      Blockly.serialization.blocks.append(blockJson2, this.workspace);

      this.workspace.cleanUp();

      const topBlocks = this.workspace.getTopBlocks(true);
      const allBlocks = this.workspace.getAllBlocks(false);
      const block1 = this.workspace.getBlockById('block1');
      const block2 = this.workspace.getBlockById('block2');
      const block1Child = block1.getChildren()[0];
      const block2Child = block2.getChildren()[0];

      // Note that the x position tests below are verifying that each block's
      // child isn't exactly aligned with it (however, they does overlap since
      // the child block has an input connection with its parent).
      assert.equal(topBlocks.length, 2, 'workspace has two top-level block2');
      assert.equal(allBlocks.length, 4, 'workspace has four blocks overall');
      assert.blockIsAtOrigin(block1);
      assert.blockIsBelow(block2, block1);
      assert.isAbove(
        block1.getChildren()[0].getRelativeToSurfaceXY().x,
        block1.getRelativeToSurfaceXY().x,
        "block1's child is right of its start",
      );
      assert.blockIsAbove(block1Child, block2);
      assert.isAbove(
        block2.getChildren()[0].getRelativeToSurfaceXY().x,
        block2.getRelativeToSurfaceXY().x,
        "block2's child is right of its start",
      );
      assert.blockIsBelow(block2Child, block1);
    });

    // TODO(#8676): Reenable once test passes reliably.
    test.skip('two large overlapping blocks are moved to origin and below', function () {
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
      Blockly.serialization.blocks.append(blockJson1, this.workspace);
      Blockly.serialization.blocks.append(blockJson2, this.workspace);

      this.workspace.cleanUp();

      const topBlocks = this.workspace.getTopBlocks(true);
      const block1 = this.workspace.getBlockById('block1');
      const block2 = this.workspace.getBlockById('block2');
      assert.equal(topBlocks.length, 2, 'workspace has two top-level blocks');
      assert.blockIsAtOrigin(block1);
      assert.blockIsBelow(block2, block1);
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
      Blockly.serialization.blocks.append(blockJson1, this.workspace);
      Blockly.serialization.blocks.append(blockJson2, this.workspace);
      Blockly.serialization.blocks.append(blockJson3, this.workspace);
      Blockly.serialization.blocks.append(blockJson4, this.workspace);
      Blockly.serialization.blocks.append(blockJson5, this.workspace);

      this.workspace.cleanUp();

      const topBlocks = this.workspace.getTopBlocks(true);
      const block1 = this.workspace.getBlockById('block1');
      const block2 = this.workspace.getBlockById('block2');
      const block3 = this.workspace.getBlockById('block3');
      const block4 = this.workspace.getBlockById('block4');
      const block5 = this.workspace.getBlockById('block5');
      assert.equal(topBlocks.length, 5, 'workspace has five top-level blocks');
      assert.blockIsAtOrigin(block1);
      assert.blockHasPositionX(block2, 0);
      assert.blockHasPositionX(block3, 0);
      assert.blockHasPositionX(block4, 0);
      assert.blockHasPositionX(block5, 0);
      assert.blockIsBelow(block2, block1);
      assert.blockIsBelow(block3, block2);
      assert.blockIsBelow(block4, block3);
      assert.blockIsBelow(block5, block4);
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
      Blockly.serialization.blocks.append(blockJson, this.workspace);

      this.workspace.cleanUp();

      const topBlocks = this.workspace.getTopBlocks(true);
      const allBlocks = this.workspace.getAllBlocks(false);
      assert.equal(topBlocks.length, 1, 'workspace has one top-level block');
      assert.equal(allBlocks.length, 1, 'workspace has one block overall');
      assert.blockHasPosition(topBlocks[0], 10, 15);
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
      Blockly.serialization.blocks.append(blockJson1, this.workspace);
      Blockly.serialization.blocks.append(blockJson2, this.workspace);
      Blockly.serialization.blocks.append(blockJson3, this.workspace);
      Blockly.serialization.blocks.append(blockJson4, this.workspace);
      Blockly.serialization.blocks.append(blockJson5, this.workspace);

      this.workspace.cleanUp();

      const topBlocks = this.workspace.getTopBlocks(true);
      const block1 = this.workspace.getBlockById('block1');
      const block2 = this.workspace.getBlockById('block2');
      const block3 = this.workspace.getBlockById('block3');
      const block4 = this.workspace.getBlockById('block4');
      const block5 = this.workspace.getBlockById('block5');
      assert.equal(topBlocks.length, 5, 'workspace has five top-level blocks');
      // Check that immovable blocks haven't moved.
      assert.blockHasPosition(block2, 10, 20);
      assert.blockHasPosition(block5, 20, 200);
      // Check that movable positions have correctly been left-aligned.
      assert.blockHasPositionX(block1, 0);
      assert.blockHasPositionX(block3, 0);
      assert.blockHasPositionX(block4, 0);
      // Block order should be: 2, 1, 3, 5, 4 since 2 and 5 are immovable.
      assert.blockIsBelow(block1, block2);
      assert.blockIsBelow(block3, block1);
      assert.blockIsBelow(block5, block3);
      assert.blockIsBelow(block4, block5);
      // Ensure no blocks intersect (can check in order due to the position verification above).
      assert.blocksDoNotIntersect(block2, block1);
      assert.blocksDoNotIntersect(block1, block3);
      assert.blocksDoNotIntersect(block3, block5);
      assert.blocksDoNotIntersect(block5, block4);
    });
  });

  suite('Workspace Base class', function () {
    testAWorkspace();
  });
});
