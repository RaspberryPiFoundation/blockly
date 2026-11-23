/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import * as Blockly from 'blockly';
import sinon from 'sinon';
import {
  registerLessonAuthoringContextMenuOptions,
  unregisterLessonAuthoringContextMenuOptions,
} from '../src/index';
import {setBlockState} from '../src/block_state_change';

/**
 * Gets a registered context menu item.
 * @param {string} id The item's ID.
 * @returns {!Blockly.ContextMenuRegistry.RegistryItem} The item.
 */
function getItem(id) {
  return Blockly.ContextMenuRegistry.registry.getItem(id);
}

/**
 * Gets an item's precondition result for a block.
 * @param {string} id The item's ID.
 * @param {!Blockly.Block} block The block the menu is opened on.
 * @returns {string} 'enabled', 'disabled' or 'hidden'.
 */
function precondition(id, block) {
  return getItem(id).preconditionFn({block});
}

// Event listeners and the undo stack are updated on a timer, so the tests run
// timers before reading events or undoing.
suite('Lesson authoring context menu', function () {
  setup(function () {
    this.clock = sinon.useFakeTimers();
    registerLessonAuthoringContextMenuOptions();
    this.workspace = new Blockly.Workspace();
    /**
     * Runs an item's callback, then lets the events it fired reach the undo
     * stack.
     * @param {string} id The item's ID.
     * @param {!Blockly.ContextMenuRegistry.Scope} scope The menu's scope.
     */
    this.runItem = (id, scope) => {
      getItem(id).callback(scope);
      this.clock.runAll();
    };
    /**
     * Loads a top-level block from its state.
     * @param {!Object} state The block's state.
     * @returns {!Blockly.Block} The block.
     */
    this.append = (state) => {
      const block = Blockly.serialization.blocks.append(state, this.workspace);
      this.clock.runAll();
      // Loading isn't something to undo.
      this.workspace.clearUndo();
      return block;
    };
  });

  teardown(function () {
    this.workspace.dispose();
    unregisterLessonAuthoringContextMenuOptions();
    this.clock.runAll();
    this.clock.restore();
  });

  suite('block toggles', function () {
    const toggles = [
      ['lessonBlockDeletable', 'isOwnDeletable'],
      ['lessonBlockEditable', 'isOwnEditable'],
      ['lessonBlockMovable', 'isOwnMovable'],
    ];
    for (const [id, getter] of toggles) {
      test(`${id} toggles the state and can be undone`, function () {
        const block = this.append({type: 'math_number'});
        this.runItem(id, {block});
        assert.isFalse(block[getter]());

        this.workspace.undo(false);
        assert.isTrue(block[getter]());
      });
    }

    test('labels describe what the toggle will do', function () {
      const block = this.append({type: 'math_number'});
      const item = getItem('lessonBlockMovable');
      assert.equal(item.displayText({block}), 'Make block immovable');
      this.runItem('lessonBlockMovable', {block});
      assert.equal(item.displayText({block}), 'Make block movable');
    });

    test('editable cascades into shadow children', function () {
      const block = this.append({
        type: 'text_print',
        inputs: {TEXT: {shadow: {type: 'text'}}},
      });
      const shadow = block.getInputTargetBlock('TEXT');
      this.runItem('lessonBlockEditable', {block});
      assert.isFalse(block.isOwnEditable());
      assert.isFalse(shadow.isOwnEditable());

      // The block and its shadow undo together.
      this.workspace.undo(false);
      assert.isTrue(block.isOwnEditable());
      assert.isTrue(shadow.isOwnEditable());
    });

    test('movable and deletable are hidden in a flyout, editable is not', function () {
      const block = this.append({type: 'math_number'});
      block.isInFlyout = true;
      assert.equal(precondition('lessonBlockMovable', block), 'hidden');
      assert.equal(precondition('lessonBlockDeletable', block), 'hidden');
      assert.equal(precondition('lessonBlockEditable', block), 'enabled');
    });
  });

  suite('workspace toggles', function () {
    setup(function () {
      this.first = this.append({type: 'math_number'});
      this.second = this.append({
        type: 'text_print',
        inputs: {TEXT: {shadow: {type: 'text'}}},
      });
      this.shadow = this.second.getInputTargetBlock('TEXT');
      this.scope = {workspace: this.workspace};
    });

    test('locks every block when any is unlocked, as one undo step', function () {
      setBlockState(this.first, 'movable', false);
      this.clock.runAll();
      this.workspace.clearUndo();

      const item = getItem('lessonAllBlocksMovable');
      assert.equal(item.displayText(this.scope), 'Make ALL blocks immovable');
      this.runItem('lessonAllBlocksMovable', this.scope);
      assert.isFalse(this.first.isOwnMovable());
      assert.isFalse(this.second.isOwnMovable());

      this.workspace.undo(false);
      assert.isFalse(this.first.isOwnMovable(), 'was already locked');
      assert.isTrue(this.second.isOwnMovable());
    });

    test('unlocks every block when all are locked', function () {
      this.runItem('lessonAllBlocksDeletable', this.scope);
      const item = getItem('lessonAllBlocksDeletable');
      assert.equal(item.displayText(this.scope), 'Make ALL blocks deletable');

      this.runItem('lessonAllBlocksDeletable', this.scope);
      assert.isTrue(this.first.isOwnDeletable());
      assert.isTrue(this.second.isOwnDeletable());
    });

    test('movable and deletable skip shadows, editable includes them', function () {
      this.runItem('lessonAllBlocksMovable', this.scope);
      this.runItem('lessonAllBlocksDeletable', this.scope);
      assert.isTrue(this.shadow.isOwnMovable());
      assert.isTrue(this.shadow.isOwnDeletable());

      this.runItem('lessonAllBlocksEditable', this.scope);
      assert.isFalse(this.shadow.isOwnEditable());
    });
  });

  suite('make shadow', function () {
    test('is hidden for blocks that cannot be shadows', function () {
      const topLevel = this.append({type: 'math_number'});
      const withRealChild = this.append({
        type: 'text_print',
        inputs: {
          TEXT: {
            block: {
              type: 'text_length',
              inputs: {VALUE: {block: {type: 'text'}}},
            },
          },
        },
      }).getInputTargetBlock('TEXT');
      const withVariable = this.append({
        type: 'text_print',
        inputs: {
          TEXT: {block: {type: 'variables_get', fields: {VAR: {name: 'x'}}}},
        },
      }).getInputTargetBlock('TEXT');

      assert.equal(precondition('lessonMakeShadow', topLevel), 'hidden');
      assert.equal(precondition('lessonMakeShadow', withRealChild), 'hidden');
      assert.equal(precondition('lessonMakeShadow', withVariable), 'hidden');
    });

    test('turns a connected block into a shadow, and can be undone', function () {
      const parent = this.append({
        type: 'text_print',
        inputs: {TEXT: {block: {type: 'text', fields: {TEXT: 'hi'}}}},
      });
      const block = parent.getInputTargetBlock('TEXT');
      assert.equal(precondition('lessonMakeShadow', block), 'enabled');

      this.runItem('lessonMakeShadow', {block});
      const shadow = parent.getInputTargetBlock('TEXT');
      assert.isTrue(shadow.isShadow());
      assert.equal(shadow.getFieldValue('TEXT'), 'hi');

      this.workspace.undo(false);
      const restored = parent.getInputTargetBlock('TEXT');
      assert.isFalse(restored.isShadow());
      assert.equal(restored.getFieldValue('TEXT'), 'hi');
      assert.isNull(parent.getInput('TEXT').connection.getShadowState());

      this.workspace.undo(true);
      assert.isTrue(parent.getInputTargetBlock('TEXT').isShadow());
    });
  });

  suite('make shadows real', function () {
    test('replaces a visible shadow with a real block', function () {
      const block = this.append({
        type: 'text_print',
        inputs: {TEXT: {shadow: {type: 'text', fields: {TEXT: 'hi'}}}},
      });
      assert.equal(
        getItem('lessonMakeShadowsReal').displayText({block}),
        'Make 1 shadow block real',
      );

      this.runItem('lessonMakeShadowsReal', {block});
      const child = block.getInputTargetBlock('TEXT');
      assert.isFalse(child.isShadow());
      assert.equal(child.getFieldValue('TEXT'), 'hi');
      assert.isNull(block.getInput('TEXT').connection.getShadowState());

      this.workspace.undo(false);
      assert.isTrue(block.getInputTargetBlock('TEXT').isShadow());
    });

    test('unplugs a block covering the shadow', function () {
      const block = this.append({
        type: 'text_print',
        inputs: {
          TEXT: {
            shadow: {type: 'text', fields: {TEXT: 'hi'}},
            block: {type: 'text_length'},
          },
        },
      });
      const covering = block.getInputTargetBlock('TEXT');

      this.runItem('lessonMakeShadowsReal', {block});
      assert.isNull(covering.getParent());
      const child = block.getInputTargetBlock('TEXT');
      assert.equal(child.type, 'text');
      assert.isFalse(child.isShadow());
    });
  });

  suite('remove shadows', function () {
    test('removes a visible shadow, and can be undone', function () {
      const block = this.append({
        type: 'text_print',
        inputs: {TEXT: {shadow: {type: 'text'}}},
      });

      this.runItem('lessonRemoveShadows', {block});
      assert.isNull(block.getInputTargetBlock('TEXT'));
      assert.isNull(block.getInput('TEXT').connection.getShadowState());

      this.workspace.undo(false);
      assert.isTrue(block.getInputTargetBlock('TEXT').isShadow());
    });

    test('forgets a covered shadow but keeps the covering block', function () {
      const block = this.append({
        type: 'text_print',
        inputs: {
          TEXT: {shadow: {type: 'text'}, block: {type: 'text_length'}},
        },
      });

      this.runItem('lessonRemoveShadows', {block});
      assert.equal(block.getInputTargetBlock('TEXT').type, 'text_length');
      assert.isNull(block.getInput('TEXT').connection.getShadowState());
    });
  });

  suite('events', function () {
    setup(function () {
      this.events = [];
      this.workspace.addChangeListener((event) => this.events.push(event));
    });

    test('block state changes survive a JSON round trip', function () {
      const block = this.append({type: 'math_number'});
      setBlockState(block, 'movable', false);
      this.clock.runAll();
      const event = this.events.find(
        (e) => e.type === 'lesson_block_state_change',
      );
      assert.isFalse(event.isNull());

      const copy = Blockly.Events.fromJson(event.toJson(), this.workspace);
      assert.equal(copy.blockId, block.id);
      assert.equal(copy.element, 'movable');
      assert.isTrue(copy.oldValue);
      assert.isFalse(copy.newValue);
    });

    test('shadow state changes survive a JSON round trip', function () {
      const block = this.append({
        type: 'text_print',
        inputs: {TEXT: {shadow: {type: 'text', fields: {TEXT: 'hi'}}}},
      });
      this.runItem('lessonRemoveShadows', {block});
      const event = this.events.find(
        (e) => e.type === 'lesson_shadow_state_change',
      );
      assert.isFalse(event.isNull());

      const copy = Blockly.Events.fromJson(event.toJson(), this.workspace);
      assert.equal(copy.blockId, block.id);
      assert.equal(copy.inputName, 'TEXT');
      assert.equal(copy.oldState.fields.TEXT, 'hi');
      assert.isNull(copy.newState);
    });

    // Listeners such as autosave learn about undo and redo from the events
    // that running the undone event fires.
    test('undoing notifies listeners', function () {
      const block = this.append({
        type: 'text_print',
        inputs: {
          TEXT: {shadow: {type: 'text'}, block: {type: 'text_length'}},
        },
      });
      this.runItem('lessonBlockMovable', {block});
      // The shadow is covered, so removing it creates and deletes no blocks.
      this.runItem('lessonRemoveShadows', {block});
      this.events.length = 0;

      this.workspace.undo(false);
      this.workspace.undo(false);
      this.clock.runAll();
      const types = this.events.map((e) => e.type);
      assert.include(types, 'lesson_shadow_state_change');
      assert.include(types, 'lesson_block_state_change');
    });
  });
});
