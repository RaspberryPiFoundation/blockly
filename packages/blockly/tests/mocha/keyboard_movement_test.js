/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  moveStatementTestBlocks,
  moveValueTestBlocks,
} from './test_helpers/move_test_blocks.js';
import {p5blocks} from './test_helpers/p5_blocks.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';
import {createKeyDownEvent} from './test_helpers/user_input.js';

suite('Keyboard-driven movement', function () {
  setup(function () {
    sharedTestSetup.call(this);
    const toolbox = document.getElementById('toolbox-simple');
    this.workspace = Blockly.inject('blocklyDiv', {toolbox: toolbox});
    Blockly.common.defineBlocks(p5blocks);
    Blockly.KeyboardMover.mover.setMoveDistance(20);
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  function startMove(workspace) {
    const event = createKeyDownEvent(Blockly.utils.KeyCodes.M);
    workspace.getInjectionDiv().dispatchEvent(event);
  }

  function startMoveStack(workspace) {
    const event = createKeyDownEvent(Blockly.utils.KeyCodes.M, [
      Blockly.utils.KeyCodes.SHIFT,
    ]);
    workspace.getInjectionDiv().dispatchEvent(event);
  }

  function moveUp(workspace, modifiers) {
    const event = createKeyDownEvent(Blockly.utils.KeyCodes.UP, modifiers);
    workspace.getInjectionDiv().dispatchEvent(event);
  }

  function moveDown(workspace, modifiers) {
    const event = createKeyDownEvent(Blockly.utils.KeyCodes.DOWN, modifiers);
    workspace.getInjectionDiv().dispatchEvent(event);
  }

  function moveLeft(workspace, modifiers) {
    const event = createKeyDownEvent(Blockly.utils.KeyCodes.LEFT, modifiers);
    workspace.getInjectionDiv().dispatchEvent(event);
  }

  function moveRight(workspace, modifiers) {
    const event = createKeyDownEvent(Blockly.utils.KeyCodes.RIGHT, modifiers);
    workspace.getInjectionDiv().dispatchEvent(event);
  }

  function cancelMove(workspace) {
    const event = createKeyDownEvent(Blockly.utils.KeyCodes.ESC);
    workspace.getInjectionDiv().dispatchEvent(event);
  }

  function endMove(workspace) {
    const event = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER);
    workspace.getInjectionDiv().dispatchEvent(event);
  }

  /**
   * Create a new block from serialised state (parsed JSON) and
   * optionally attach it to an existing block on the workspace.
   *
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to create the block
   *     on.
   * @param {!Blockly.serialization.blocks.State} state The JSON definition of
   *     the new block.
   * @param {?string} parentId The ID of the block to attach to. If undefined,
   *     the new block is not attached.
   * @param {?string} inputName The name of the input on the parent block to
   *     attach to. If undefined, the new block is attached to the
   *     parent's next connection.
   * @returns {!Promise<string>} A promise that resolves with the new block's
   *     ID.
   */
  function appendBlock(workspace, state, parentId, inputName) {
    const block = Blockly.serialization.blocks.append(state, workspace);
    if (!block) throw new Error('failed to create block from state');
    if (!parentId) return block.id;

    try {
      const parent = workspace.getBlockById(parentId);
      if (!parent) throw new Error(`parent block not found: ${parentId}`);

      let parentConnection;
      let childConnection;

      if (inputName) {
        parentConnection = parent.getInput(inputName)?.connection;
        if (!parentConnection) {
          throw new Error(`input ${inputName} not found on parent`);
        }
        childConnection = block.outputConnection ?? block.previousConnection;
      } else {
        parentConnection = parent.nextConnection;
        if (!parentConnection) {
          throw new Error('parent has no next connection');
        }
        childConnection = block.previousConnection;
      }
      if (!childConnection) throw new Error('new block not compatible');
      parentConnection.connect(childConnection);
      return block.id;
    } catch (e) {
      // If anything goes wrong during attachment, clean up the new block.
      block.dispose();
      throw e;
    }
  }

  /**
   * Get information about the currently-focused block's parent and
   * child blocks.
   *
   * @returns {!Promise<{parentId: string | null, parentIndex: number | null, nextId: string | null, valueId: string | null}>} A promise resolving to
   *
   *         {parentId, parentIndex, nextId, valueId}
   *
   *     where parentId, parentIndex are the ID of the parent block and
   *     the index of the connection on that block to which the
   *     currently-focused block is connected, nextId is the ID of block
   *     connected to the focused block's next connection, and valueID
   *     is the ID of a block connected to the zeroth input of the
   *     focused block (or, in each case, null if there is no such
   *     block).
   */
  async function getFocusedNeighbourInfo() {
    return Blockly.renderManagement.finishQueuedRenders().then(() => {
      const block = Blockly.getFocusManager().getFocusedNode();
      if (!block) throw new Error('nothing focused');
      if (!(block instanceof Blockly.BlockSvg)) {
        throw new TypeError('focused node is not a BlockSvg');
      }
      const parent = block?.getParent();
      return {
        parentId: parent?.id ?? null,
        parentIndex:
          parent
            ?.getConnections_(true)
            .findIndex((conn) => conn.targetBlock() === block) ?? null,
        nextId: block?.getNextBlock()?.id ?? null,
        valueId: block?.inputList[0].connection?.targetBlock()?.id ?? null,
      };
    });
  }

  /**
   * Get information about the connection candidate for the
   * currently-moving block (if any).
   *
   * @returns {!Promise<{id: string, index: number, ownIndex: number} | null>} A
   *     promise resolving to either null if there is no connection
   *     candidate, or otherwise if there is one to
   *
   *         {id, index, ownIndex}
   *
   *     where id is the block ID of the neighbour, index is the index
   *     of the candidate connection on the neighbour, and ownIndex is
   *     the index of the candidate connection on the moving block.
   */
  function getConnectionCandidate() {
    const focused = Blockly.getFocusManager().getFocusedNode();
    if (!focused) throw new Error('nothing focused');
    if (!(focused instanceof Blockly.BlockSvg)) {
      throw new TypeError('focused node is not a BlockSvg');
    }
    const block = focused; // Inferred as BlockSvg.
    const dragStrategy = block.getDragStrategy();
    if (!dragStrategy) throw new Error('no drag strategy');
    const candidate = dragStrategy.connectionCandidate;
    if (!candidate) return null;
    const neighbourBlock = candidate.neighbour.getSourceBlock();
    if (!neighbourBlock) throw new TypeError('connection has no source block');
    const neighbourConnections = neighbourBlock.getConnections_(true);
    const index = neighbourConnections.indexOf(candidate.neighbour);
    const ownConnections = block.getConnections_(true);
    const ownIndex = ownConnections.indexOf(candidate.local);
    return {id: neighbourBlock.id, index, ownIndex};
  }

  /**
   * Create a mocha test function moving a specified block in a
   * particular direction, checking that it has the the expected
   * connection candidate after each step, and that once the move
   * finishes that the moving block is reconnected to its initial
   * location.
   *
   * @param {!string} mover Block ID of the block to be moved.
   * @param {!Blockly.utils.KeyCodes} key Key to send to move one step.
   * @param {!Blockly.RenderedConnection[]} candidates Array of expected
   *     connection candidates.
   * @returns {!function} function to pass as second argument to mocha's test
   *     function.
   */
  function moveTest(mover, key, candidates) {
    return async function () {
      // Navigate to block to be moved and initiate move.
      const block = this.workspace.getBlockById(mover);
      Blockly.getFocusManager().focusNode(block);
      const initialInfo = await getFocusedNeighbourInfo();
      startMove(this.workspace);
      // Press specified key multiple times, checking connection candidates.
      for (let i = 0; i < candidates.length; i++) {
        const candidate = getConnectionCandidate();
        assert.deepEqual(candidate, candidates[i]);
        const event = createKeyDownEvent(key);
        this.workspace.getInjectionDiv().dispatchEvent(event);
      }

      // Finish move and check final location of moved block.
      endMove(this.workspace);
      const finalInfo = await getFocusedNeighbourInfo();
      assert.deepEqual(initialInfo, finalInfo);
    };
  }

  function testMovingUp() {
    test('can move them up', function () {
      Blockly.getFocusManager().focusNode(this.element);
      const originalBounds = this.element.getBoundingRectangle();
      startMove(this.workspace);
      moveUp(this.workspace, this.modifiers);
      endMove(this.workspace);
      const newBounds = this.element.getBoundingRectangle();
      assert.isBelow(newBounds.top, originalBounds.top);
      assert.equal(newBounds.left, originalBounds.left);
    });
  }

  function testMovingDown() {
    test('can move them down', function () {
      Blockly.getFocusManager().focusNode(this.element);
      const originalBounds = this.element.getBoundingRectangle();
      startMove(this.workspace);
      moveDown(this.workspace, this.modifiers);
      endMove(this.workspace);
      const newBounds = this.element.getBoundingRectangle();
      assert.isAbove(newBounds.bottom, originalBounds.bottom);
      assert.equal(newBounds.left, originalBounds.left);
    });
  }

  function testMovingLeft() {
    test('can move them left', function () {
      Blockly.getFocusManager().focusNode(this.element);
      const originalBounds = this.element.getBoundingRectangle();
      startMove(this.workspace);
      moveLeft(this.workspace, this.modifiers);
      endMove(this.workspace);
      const newBounds = this.element.getBoundingRectangle();
      assert.isBelow(newBounds.left, originalBounds.left);
      assert.equal(newBounds.top, originalBounds.top);
    });
  }

  function testMovingRight() {
    test('can move them right', function () {
      Blockly.getFocusManager().focusNode(this.element);
      const originalBounds = this.element.getBoundingRectangle();
      startMove(this.workspace);
      moveRight(this.workspace, this.modifiers);
      endMove(this.workspace);
      const newBounds = this.element.getBoundingRectangle();
      assert.isAbove(newBounds.right, originalBounds.right);
      assert.equal(newBounds.top, originalBounds.top);
    });
  }

  function testCancelingMove() {
    test('can be cancelled', function () {
      Blockly.getFocusManager().focusNode(this.element);
      const originalBounds = this.element.getBoundingRectangle();
      startMove(this.workspace);
      moveRight(this.workspace, this.modifiers);
      moveUp(this.workspace, this.modifiers);
      cancelMove(this.workspace);
      const newBounds = this.element.getBoundingRectangle();
      assert.deepEqual(newBounds, originalBounds);
    });
  }

  function testMoveIndicatorIsDisplayed() {
    test('displays an attached move indicator while moving', function () {
      Blockly.getFocusManager().focusNode(this.element);
      assert.equal(
        this.workspace
          .getInjectionDiv()
          .querySelectorAll('.blocklyMoveIndicator').length,
        0,
      );
      startMove(this.workspace);
      moveRight(this.workspace, this.modifiers);
      assert.equal(
        this.workspace
          .getInjectionDiv()
          .querySelectorAll('.blocklyMoveIndicator').length,
        1,
      );
      endMove(this.workspace);
      assert.equal(
        this.workspace
          .getInjectionDiv()
          .querySelectorAll('.blocklyMoveIndicator').length,
        0,
      );
    });
  }

  function testAdjustingMoveStepSize() {
    test('respects configured step size', function () {
      Blockly.getFocusManager().focusNode(this.element);
      startMove(this.workspace);
      const steps = [100, 20, 0, -20, -100];
      for (const step of steps) {
        Blockly.KeyboardMover.mover.setMoveDistance(step);
        const oldLeft = this.element.getBoundingRectangle().left;
        moveRight(this.workspace, this.modifiers);
        const newLeft = this.element.getBoundingRectangle().left;
        assert.equal(newLeft - oldLeft, step);
      }
      endMove(this.workspace);
    });
  }

  function testUnrelatedShortcutCommits() {
    test('is committed when unrelated shortcuts are performed', function () {
      const oldBounds = this.element.getBoundingRectangle();
      Blockly.getFocusManager().focusNode(this.element);
      startMove(this.workspace);
      assert.isTrue(Blockly.KeyboardMover.mover.isMoving());
      moveRight(this.workspace, this.modifiers);
      moveRight(this.workspace, this.modifiers);

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.C, [
        Blockly.utils.KeyCodes.CTRL_CMD,
      ]);
      this.workspace.getInjectionDiv().dispatchEvent(event);
      assert.isFalse(Blockly.KeyboardMover.mover.isMoving());

      const newBounds = this.element.getBoundingRectangle();
      oldBounds.left += 40;
      oldBounds.right += 40;
      assert.deepEqual(newBounds, oldBounds);
    });
  }

  function testExemptedShortcutsAllowed() {
    test('is not committed when allowlisted shortcuts are performed', function () {
      const hotkey = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.M,
        [Blockly.utils.KeyCodes.CTRL_CMD],
      );

      let shortcutRun = false;
      const testShortcut = {
        name: 'test_shortcut',
        preconditionFn: () => true,
        callback: () => {
          shortcutRun = true;
          return true;
        },
        keyCodes: [hotkey],
      };
      Blockly.ShortcutRegistry.registry.register(testShortcut);

      Blockly.getFocusManager().focusNode(this.element);
      startMove(this.workspace);
      assert.isTrue(Blockly.KeyboardMover.mover.isMoving());
      moveRight(this.workspace, this.modifiers);

      const event = createKeyDownEvent(Blockly.utils.KeyCodes.M, [
        Blockly.utils.KeyCodes.CTRL_CMD,
      ]);
      this.workspace.getInjectionDiv().dispatchEvent(event);
      // Move mode should still be active and the shortcut should have toggled
      // the `shortcutRun` variable.
      assert.isTrue(Blockly.KeyboardMover.mover.isMoving());
      assert.isTrue(shortcutRun);
      cancelMove(this.workspace);
      Blockly.ShortcutRegistry.registry.unregister('test_shortcut');
    });
  }

  suite('of workspace comments', function () {
    setup(function () {
      this.element = new Blockly.comments.RenderedWorkspaceComment(
        this.workspace,
      );
    });

    testMovingUp();
    testMovingDown();
    testMovingLeft();
    testMovingRight();
    testCancelingMove();
    testMoveIndicatorIsDisplayed();
    testAdjustingMoveStepSize();
    testUnrelatedShortcutCommits();
    testExemptedShortcutsAllowed();
  });

  suite('to disconnect blocks', function () {
    setup(function () {
      this.block1 = this.workspace.newBlock('draw_emoji');
      this.block1.initSvg();
      this.block1.render();

      this.block2 = this.workspace.newBlock('draw_emoji');
      this.block2.initSvg();
      this.block2.render();
      this.block1.nextConnection.connect(this.block2.previousConnection);

      this.block3 = this.workspace.newBlock('draw_emoji');
      this.block3.initSvg();
      this.block3.render();
      this.block2.nextConnection.connect(this.block3.previousConnection);
    });

    test('from top block - Detaches single block', function () {
      Blockly.getFocusManager().focusNode(this.block1);
      startMove(this.workspace);
      assert.isNull(this.block1.nextConnection.targetBlock());
      assert.equal(this.block1.isDragging(), true);
      assert.equal(this.block2.isDragging(), false);
      assert.equal(this.block3.isDragging(), false);
      cancelMove(this.workspace);
    });

    test('from middle block - Detaches single block', function () {
      Blockly.getFocusManager().focusNode(this.block2);
      startMove(this.workspace);
      assert.isNull(this.block2.previousConnection.targetBlock());
      assert.isNull(this.block2.nextConnection.targetBlock());
      assert.equal(this.block1.isDragging(), false);
      assert.equal(this.block2.isDragging(), true);
      assert.equal(this.block3.isDragging(), false);
      cancelMove(this.workspace);
    });

    test('from bottom block - Detaches single block', function () {
      Blockly.getFocusManager().focusNode(this.block3);
      startMove(this.workspace);
      assert.isNull(this.block3.previousConnection.targetBlock());
      assert.equal(this.block1.isDragging(), false);
      assert.equal(this.block2.isDragging(), false);
      assert.equal(this.block3.isDragging(), true);
      cancelMove(this.workspace);
    });

    test('from top block - Detaches entire three-block stack', function () {
      Blockly.getFocusManager().focusNode(this.block1);
      startMoveStack(this.workspace);
      assert.strictEqual(this.block1.nextConnection.targetBlock(), this.block2);
      assert.strictEqual(this.block2.nextConnection.targetBlock(), this.block3);
      assert.equal(this.block1.isDragging(), true);
      assert.equal(this.block2.isDragging(), true);
      assert.equal(this.block3.isDragging(), true);
      cancelMove(this.workspace);
    });

    test('from middle block - Detaches two-block stack from middle down', function () {
      Blockly.getFocusManager().focusNode(this.block2);
      startMoveStack(this.workspace);
      assert.isNull(this.block2.previousConnection.targetBlock());
      assert.strictEqual(this.block2.nextConnection.targetBlock(), this.block3);
      assert.equal(this.block1.isDragging(), false);
      assert.equal(this.block2.isDragging(), true);
      assert.equal(this.block3.isDragging(), true);
      cancelMove(this.workspace);
    });

    test('from bottom block - Detaches single-block stack from bottom', function () {
      Blockly.getFocusManager().focusNode(this.block3);
      startMoveStack(this.workspace);
      assert.isNull(this.block3.previousConnection.targetBlock());
      assert.equal(this.block1.isDragging(), false);
      assert.equal(this.block2.isDragging(), false);
      assert.equal(this.block3.isDragging(), true);
      cancelMove(this.workspace);
    });

    test('Cancel move restores connections', function () {
      Blockly.getFocusManager().focusNode(this.block2);
      startMove(this.workspace);
      cancelMove(this.workspace);
      // Original stack restored
      assert.strictEqual(this.block1.nextConnection.targetBlock(), this.block2);
      assert.strictEqual(this.block2.nextConnection.targetBlock(), this.block3);

      Blockly.getFocusManager().focusNode(this.block2);
      startMoveStack(this.workspace);
      cancelMove(this.workspace);
      // Original stack restored
      assert.strictEqual(this.block1.nextConnection.targetBlock(), this.block2);
      assert.strictEqual(this.block2.nextConnection.targetBlock(), this.block3);
    });
  });

  suite('of blocks', function () {
    setup(function () {
      this.element = this.workspace.newBlock('logic_boolean');
      this.element.initSvg();
      this.element.render();
      this.modifiers = [Blockly.utils.KeyCodes.CTRL_CMD];
    });

    suite('in unconstrained mode', function () {
      testMovingUp();
      testMovingDown();
      testMovingLeft();
      testMovingRight();
      testCancelingMove();
      testMoveIndicatorIsDisplayed();
      testAdjustingMoveStepSize();
      testUnrelatedShortcutCommits();
      testExemptedShortcutsAllowed();
    });

    suite('in constrained mode', function () {
      test('prompts to use unconstrained mode when no destinations are available', function () {
        const toastSpy = sinon.spy(Blockly.Toast, 'show');
        const beepSpy = sinon.spy(this.workspace.getAudioManager(), 'beep');
        Blockly.getFocusManager().focusNode(this.element);
        const originalBounds = this.element.getBoundingRectangle();
        startMove(this.workspace);
        moveUp(this.workspace);
        endMove(this.workspace);
        const newBounds = this.element.getBoundingRectangle();
        assert.deepEqual(newBounds, originalBounds);
        assert.equal(
          toastSpy.args[0][1]['message'],
          Blockly.utils.userAgent.MAC
            ? 'Hold ⌘ Command and use arrow keys to move freely, then Enter to accept the position'
            : 'Hold Ctrl and use arrow keys to move freely, then Enter to accept the position',
        );
        sinon.assert.calledOnce(beepSpy);
        beepSpy.restore();
        toastSpy.restore();
      });

      suite('Statement move tests', function () {
        // Clear the workspace and load start blocks.
        setup(function () {
          Blockly.serialization.workspaces.load(
            moveStatementTestBlocks,
            this.workspace,
          );
        });

        /** Serialized simple statement block with no statement inputs. */
        const STATEMENT_SIMPLE = {
          type: 'draw_emoji',
          id: 'simple_mover',
          fields: {emoji: '✨'},
        };
        /**
         * Expected connection candidates when moving a block with no
         * inputs, after pressing right (or down) arrow n times.
         */
        const EXPECTED_SIMPLE_RIGHT = [
          {id: 'p5_canvas', index: 1, ownIndex: 0}, // Next; starting location.
          {id: 'text_print', index: 0, ownIndex: 1}, // Previous.
          {id: 'text_print', index: 1, ownIndex: 0}, // Next.
          {id: 'controls_if', index: 3, ownIndex: 0}, // "If" statement input.
          {id: 'controls_repeat_ext', index: 3, ownIndex: 0}, // Statement input.
          {id: 'controls_repeat_ext', index: 1, ownIndex: 0}, // Next.
          {id: 'controls_if', index: 5, ownIndex: 0}, // "Else if" statement input.
          {id: 'controls_if', index: 6, ownIndex: 0}, // "Else" statement input.
          {id: 'controls_if', index: 1, ownIndex: 0}, // Next.
          {id: 'p5_draw', index: 0, ownIndex: 0}, // Statement input.
          null, // Disconnected on workspace
        ];
        /**
         * Expected connection candidates when moving STATEMENT_SIMPLE after
         * pressing left (or up) arrow n times.
         */
        const EXPECTED_SIMPLE_LEFT = EXPECTED_SIMPLE_RIGHT.slice(0, 1).concat(
          EXPECTED_SIMPLE_RIGHT.slice(1).reverse(),
        );

        suite('Constrained moves of simple statement block', function () {
          setup(function () {
            appendBlock(this.workspace, STATEMENT_SIMPLE, 'p5_canvas');
          });
          test(
            'moving right',
            moveTest(
              STATEMENT_SIMPLE.id,
              Blockly.utils.KeyCodes.RIGHT,
              EXPECTED_SIMPLE_RIGHT,
            ),
          );
          test(
            'moving left',
            moveTest(
              STATEMENT_SIMPLE.id,
              Blockly.utils.KeyCodes.LEFT,
              EXPECTED_SIMPLE_LEFT,
            ),
          );
          test(
            'moving down',
            moveTest(
              STATEMENT_SIMPLE.id,
              Blockly.utils.KeyCodes.DOWN,
              EXPECTED_SIMPLE_RIGHT,
            ),
          );
          test(
            'moving up',
            moveTest(
              STATEMENT_SIMPLE.id,
              Blockly.utils.KeyCodes.UP,
              EXPECTED_SIMPLE_LEFT,
            ),
          );
        });

        /** Serialized statement block with multiple statement inputs. */
        const STATEMENT_COMPLEX = {
          type: 'controls_if',
          id: 'complex_mover',
          extraState: {hasElse: true},
        };
        /**
         * Expected connection candidates when moving STATEMENT_COMPLEX, after
         * pressing right (or down) arrow n times.
         */
        const EXPECTED_COMPLEX_RIGHT = [
          {id: 'p5_canvas', index: 1, ownIndex: 0}, // Next; starting location again.
          {id: 'text_print', index: 0, ownIndex: 1}, // Previous to own next.
          {id: 'text_print', index: 0, ownIndex: 4}, // Previous to own else input.
          {id: 'text_print', index: 0, ownIndex: 3}, // Previous to own if input.
          {id: 'text_print', index: 1, ownIndex: 0}, // Next.
          {id: 'controls_if', index: 3, ownIndex: 0}, // "If" statement input.
          {id: 'controls_repeat_ext', index: 3, ownIndex: 0}, // Statement input.
          {id: 'controls_repeat_ext', index: 1, ownIndex: 0}, // Next.
          {id: 'controls_if', index: 5, ownIndex: 0}, // "Else if" statement input.
          {id: 'controls_if', index: 6, ownIndex: 0}, // "Else" statement input.
          {id: 'controls_if', index: 1, ownIndex: 0}, // Next.
          {id: 'p5_draw', index: 0, ownIndex: 0}, // Statement input.
          null, // Disconnected on workspace
        ];
        /**
         * Expected connection candidates when moving STATEMENT_COMPLEX after
         * pressing left or up arrow n times.
         */
        const EXPECTED_COMPLEX_LEFT = EXPECTED_COMPLEX_RIGHT.slice(0, 1).concat(
          EXPECTED_COMPLEX_RIGHT.slice(1).reverse(),
        );

        suite(
          'Constrained moves of stack block with statement inputs',
          function () {
            setup(function () {
              appendBlock(this.workspace, STATEMENT_COMPLEX, 'p5_canvas');
            });
            test(
              'moving right',
              moveTest(
                STATEMENT_COMPLEX.id,
                Blockly.utils.KeyCodes.RIGHT,
                EXPECTED_COMPLEX_RIGHT,
              ),
            );
            test(
              'moving left',
              moveTest(
                STATEMENT_COMPLEX.id,
                Blockly.utils.KeyCodes.LEFT,
                EXPECTED_COMPLEX_LEFT,
              ),
            );
            test(
              'moving down',
              moveTest(
                STATEMENT_COMPLEX.id,
                Blockly.utils.KeyCodes.DOWN,
                EXPECTED_COMPLEX_RIGHT,
              ),
            );
            test(
              'moving up',
              moveTest(
                STATEMENT_COMPLEX.id,
                Blockly.utils.KeyCodes.UP,
                EXPECTED_COMPLEX_LEFT,
              ),
            );
          },
        );

        // When a top-level block with no previous, next or output
        // connections is subject to a constrained move, it should not move.
        //
        // This includes a regression test for issue #446 (fixed in PR #599)
        // where, due to an implementation error in Mover, constrained
        // movement following unconstrained movement would result in the
        // block unexpectedly moving (unless workspace scale was === 1).
        test('Constrained move of unattachable top-level block', async function () {
          // Block ID of an unconnectable block.
          const BLOCK = Blockly.getMainWorkspace().getBlockById('p5_setup');

          // Scale workspace.
          this.workspace.setScale(0.9);

          // Navigate to unconnectable block, get initial coords and start move.
          Blockly.getFocusManager().focusNode(BLOCK);
          const startCoordinate = BLOCK.getBoundingRectangle();
          startMove(this.workspace);

          // Check constrained moves have no effect.
          for (let i = 0; i < 5; i++) {
            moveDown(this.workspace);
          }
          const coordinate = BLOCK.getBoundingRectangle();
          assert.deepEqual(
            coordinate,
            startCoordinate,
            'constrained move should have no effect',
          );
          cancelMove(this.workspace);
        });
      });

      suite(`Value expression move tests`, function () {
        /** Serialized simple reporter value block with no inputs. */
        const VALUE_SIMPLE = {
          type: 'text',
          id: 'simple_mover',
          fields: {TEXT: 'simple mover'},
        };
        /**
         * Expected connection candidates when moving VALUE_SIMPLE, after
         * pressing ArrowRight n times.
         */
        const EXPECTED_SIMPLE_RIGHT = [
          {id: 'join0', index: 1, ownIndex: 0}, // Join block ADD0 input.
          {id: 'join0', index: 2, ownIndex: 0}, // Join block ADD1 input.
          {id: 'print1', index: 2, ownIndex: 0}, // Print block with no shadow.
          {id: 'print2', index: 2, ownIndex: 0}, // Print block with shadow.
          // Skip draw_emoji block as it has no value inputs.
          {id: 'print3', index: 2, ownIndex: 0}, // Replacing  join expression.
          {id: 'join1', index: 1, ownIndex: 0}, // Join block ADD0 input.
          {id: 'join1', index: 2, ownIndex: 0}, // Join block ADD1 input.
          // Skip controls_repeat_ext block's TIMES input as it is incompatible.
          {id: 'print4', index: 2, ownIndex: 0}, // Replacing join expression.
          {id: 'join2', index: 1, ownIndex: 0}, // Join block ADD0 input.
          {id: 'join2', index: 2, ownIndex: 0}, // Join block ADD1 input.
          // Skip input of unattached join block.
          null, // Disconnected on workspace
        ];
        /**
         * Expected connection candidates when moving BLOCK_SIMPLE, after
         * pressing ArrowLeft n times.
         */
        const EXPECTED_SIMPLE_LEFT = EXPECTED_SIMPLE_RIGHT.slice(0, 1).concat(
          EXPECTED_SIMPLE_RIGHT.slice(1).reverse(),
        );

        /**
         * Serialized row of value blocks with no free inputs; should behave
         * as VALUE_SIMPLE does.
         */
        const VALUE_ROW = {
          type: 'text_changeCase',
          id: 'row_mover',
          fields: {CASE: 'TITLECASE'},
          inputs: {
            TEXT: {block: VALUE_SIMPLE},
          },
        };
        // EXPECTED_ROW_RIGHT will be same as EXPECTED_SIMPLE_RIGHT (and
        // same for ..._LEFT).

        /** Serialized value block with a single free (external) input. */
        const VALUE_UNARY = {
          type: 'text_changeCase',
          id: 'unary_mover',
          fields: {CASE: 'TITLECASE'},
        };
        /**
         * Expected connection candidates when moving VALUE_UNARY after
         * pressing ArrowRight n times.
         */
        const EXPECTED_UNARY_RIGHT = EXPECTED_SIMPLE_RIGHT.concat([
          {id: 'join0', index: 0, ownIndex: 1}, // Unattached block to own input.
        ]);
        /**
         * Expected connection candidates when moving row consisting of
         * BLOCK_UNARY on its own after pressing ArrowLEFT n times.
         */
        const EXPECTED_UNARY_LEFT = EXPECTED_UNARY_RIGHT.slice(0, 1).concat(
          EXPECTED_UNARY_RIGHT.slice(1).reverse(),
        );

        /** Serialized value block with a single free (external) input. */
        const VALUE_COMPLEX = {
          type: 'text_join',
          id: 'complex_mover',
        };
        /**
         * Expected connection candidates when moving VALUE_COMPLEX after
         * pressing ArrowRight n times.
         */
        const EXPECTED_COMPLEX_RIGHT = EXPECTED_SIMPLE_RIGHT.concat([
          {id: 'join0', index: 0, ownIndex: 2}, // Unattached block to own input.
          {id: 'join0', index: 0, ownIndex: 1}, // Unattached block to own input.
        ]);
        /**
         * Expected connection candidates when moving row consisting of
         * BLOCK_COMPLEX on its own after pressing ArrowLEFT n times.
         */
        const EXPECTED_COMPLEX_LEFT = EXPECTED_COMPLEX_RIGHT.slice(0, 1).concat(
          EXPECTED_COMPLEX_RIGHT.slice(1).reverse(),
        );

        for (const renderer of ['geras', 'thrasos', 'zelos']) {
          suite(`using ${renderer}`, function () {
            // Clear the workspace and load start blocks.
            setup(function () {
              const toolbox = document.getElementById('toolbox-simple');
              this.workspace = Blockly.inject('blocklyDiv', {
                toolbox: toolbox,
                renderer: renderer,
              });
              Blockly.serialization.workspaces.load(
                moveValueTestBlocks,
                this.workspace,
              );
            });

            suite('Constrained moves of a simple reporter block', function () {
              setup(function () {
                appendBlock(this.workspace, VALUE_SIMPLE, 'join0', 'ADD0');
              });
              test(
                'moving right',
                moveTest(
                  VALUE_SIMPLE.id,
                  Blockly.utils.KeyCodes.RIGHT,
                  EXPECTED_SIMPLE_RIGHT,
                ),
              );
              test(
                'moving left',
                moveTest(
                  VALUE_SIMPLE.id,
                  Blockly.utils.KeyCodes.LEFT,
                  EXPECTED_SIMPLE_LEFT,
                ),
              );
            });

            suite('Constrained moves of row of value blocks', function () {
              setup(function () {
                appendBlock(this.workspace, VALUE_ROW, 'join0', 'ADD0');
              });
              test(
                'moving right',
                moveTest(
                  VALUE_ROW.id,
                  Blockly.utils.KeyCodes.RIGHT,
                  EXPECTED_SIMPLE_RIGHT,
                ),
              );
              test(
                'moving left',
                moveTest(
                  VALUE_ROW.id,
                  Blockly.utils.KeyCodes.LEFT,
                  EXPECTED_SIMPLE_LEFT,
                ),
              );
            });

            suite('Constrained moves of unary expression block', function () {
              setup(function () {
                appendBlock(this.workspace, VALUE_UNARY, 'join0', 'ADD0');
              });
              test(
                'moving right',
                moveTest(
                  VALUE_UNARY.id,
                  Blockly.utils.KeyCodes.RIGHT,
                  EXPECTED_UNARY_RIGHT,
                ),
              );
              test(
                'moving left',
                moveTest(
                  VALUE_UNARY.id,
                  Blockly.utils.KeyCodes.LEFT,
                  EXPECTED_UNARY_LEFT,
                ),
              );
            });

            suite(
              'Constrained moves of a complex expression block',
              function () {
                setup(function () {
                  appendBlock(this.workspace, VALUE_COMPLEX, 'join0', 'ADD0');
                });
                test(
                  'moving right',
                  moveTest(
                    VALUE_COMPLEX.id,
                    Blockly.utils.KeyCodes.RIGHT,
                    EXPECTED_COMPLEX_RIGHT,
                  ),
                );
                test(
                  'moving left',
                  moveTest(
                    VALUE_COMPLEX.id,
                    Blockly.utils.KeyCodes.LEFT,
                    EXPECTED_COMPLEX_LEFT,
                  ),
                );
              },
            );
          });
        }
      });
    });
  });

  suite('of bubbles', function () {
    setup(async function () {
      const commentBlock = this.workspace.newBlock('logic_boolean');
      commentBlock.setCommentText('Hello world');
      const icon = commentBlock.getIcon(Blockly.icons.IconType.COMMENT);
      await icon.setBubbleVisible(true);
      this.element = icon.getBubble();
    });

    testMovingUp();
    testMovingDown();
    testMovingLeft();
    testMovingRight();
    testCancelingMove();
    testMoveIndicatorIsDisplayed();
    testAdjustingMoveStepSize();
    testUnrelatedShortcutCommits();
    testExemptedShortcutsAllowed();
  });
});
