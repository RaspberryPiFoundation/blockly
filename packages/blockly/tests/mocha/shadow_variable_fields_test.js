/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {javascriptGenerator} from '../../build/src/generators/javascript.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  assertEventFired,
  assertEventNotFired,
  createChangeListenerSpy,
} from './test_helpers/events.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

/**
 * Tests for the patch that allows FieldVariable on shadow blocks
 * (a shadow `variables_get` under any value input).
 *
 * Quality requirements distilled from the design discussion that drove
 * this PR:
 *  - #1 No new public-API side effects (no extra VarCreate events fired
 *    automatically, no extra entries in getAllVariables) attributable to
 *    the patch itself - only application-driven calls should mutate the
 *    variable map.
 *  - #2 Shadow / non-shadow `variables_get` must behave identically modulo
 *    "being a shadow": same lookup, same dropdown, same rename / delete
 *    cascade, same code generation.
 *  - #3 Variable delete cascade must include shadow uses (no special
 *    skipping by isShadow()).
 *  - #4 Undo of deleteVariable must fully restore both the variable and
 *    the visible shadow state, with the shadow block keeping its
 *    original id.
 *  - #5 Case 2 (parent template references the deleted variable) must
 *    not crash, throw, or leave the variable map in an inconsistent
 *    state - this scenario is enabled by the patch and is therefore the
 *    patch's responsibility.
 *  - #6 deleteVariable must not throw / refuse for inputs the patch
 *    enables.
 */
suite('Shadow variable fields', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();

    // Define a parent block with a single value input. We use a fresh
    // type so that nothing in the existing tests can interfere.
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'shadow_var_parent',
        'message0': 'parent %1',
        'args0': [
          {
            'type': 'input_value',
            'name': 'VALUE',
          },
        ],
        'output': null,
      },
      // A second wrapper block, used to construct nested-shadow scenarios.
      {
        'type': 'shadow_var_wrapper',
        'message0': 'wrap %1',
        'args0': [
          {
            'type': 'input_value',
            'name': 'INNER',
          },
        ],
        'output': null,
      },
      // A block with two FieldVariable fields, used to construct mixed
      // Case 1 / Case 2 shadows.
      {
        'type': 'shadow_var_two_field',
        'message0': '%1 %2',
        'args0': [
          {'type': 'field_variable', 'name': 'VAR1', 'variable': 'item'},
          {'type': 'field_variable', 'name': 'VAR2', 'variable': 'item'},
        ],
        'output': null,
      },
    ]);
  });

  teardown(function () {
    sharedTestTeardown.call(this);
    delete Blockly.Blocks['shadow_var_parent'];
    delete Blockly.Blocks['shadow_var_wrapper'];
    delete Blockly.Blocks['shadow_var_two_field'];
  });

  /**
   * Build a parent block whose VALUE input has a shadow `variables_get`
   * referencing the given variable id and name. The shadow inherits its
   * template from the loaded JSON, mirroring how a toolbox-defined
   * shadow ends up after being dragged out.
   *
   * @param {!Blockly.Workspace} workspace The workspace to load into.
   * @param {string} varId The id of the variable the shadow should reference.
   * @param {string} varName The visible name of that variable.
   * @returns {!Blockly.Block} The newly created parent block.
   */
  function makeParentWithShadowVariable(workspace, varId, varName) {
    return Blockly.serialization.blocks.append(
      {
        'type': 'shadow_var_parent',
        'inputs': {
          'VALUE': {
            'shadow': {
              'type': 'variables_get',
              'fields': {
                'VAR': {
                  'id': varId,
                  'name': varName,
                  'type': '',
                },
              },
            },
          },
        },
      },
      workspace,
    );
  }

  /**
   * Returns the shadow `variables_get` block hanging under the given
   * parent's VALUE input.
   *
   * @param {!Blockly.Block} parent The parent block.
   * @returns {!Blockly.Block} The shadow child block.
   */
  function getShadowChild(parent) {
    const child = parent.getInputTargetBlock('VALUE');
    assert.exists(child, 'shadow child must be attached');
    assert.isTrue(child.isShadow(), 'expected child to be a shadow');
    return child;
  }

  // ---------- Setup-only sanity ----------

  suite('basic shadow attachment', function () {
    test('a shadow variables_get can be attached and renders the variable name', function () {
      this.workspace.createVariable('item', '', 'item_id');
      const parent = makeParentWithShadowVariable(
        this.workspace,
        'item_id',
        'item',
      );
      const shadow = getShadowChild(parent);
      assert.equal(shadow.type, 'variables_get');
      assert.equal(shadow.getField('VAR').getText(), 'item');
      assert.equal(shadow.getField('VAR').getValue(), 'item_id');
    });

    test('shadow and non-shadow variables_get on the same id share the same VariableModel', function () {
      // Quality #2: symmetric behavior - same lookup path.
      this.workspace.createVariable('item', '', 'item_id');
      const parent = makeParentWithShadowVariable(
        this.workspace,
        'item_id',
        'item',
      );
      const shadow = getShadowChild(parent);

      const nonShadow = this.workspace.newBlock('variables_get');
      nonShadow.getField('VAR').setValue('item_id');

      assert.strictEqual(
        shadow.getField('VAR').getVariable(),
        nonShadow.getField('VAR').getVariable(),
        'both fields should resolve to the same variable model instance',
      );
    });
  });

  // ---------- T8/T9: API side-effect freedom ----------

  suite('no spurious side effects on attachment', function () {
    test('attaching a shadow variables_get does not fire any VarCreate event', function () {
      // Quality #1: no API side effect attributable to the patch.
      // Pre-register the variable BEFORE installing the listener so the
      // initial VarCreate is excluded from the spy.
      this.workspace.createVariable('item', '', 'item_id');
      const spy = createChangeListenerSpy(this.workspace);
      makeParentWithShadowVariable(this.workspace, 'item_id', 'item');
      assertEventNotFired(spy, Blockly.Events.VarCreate, {}, this.workspace.id);
    });

    test('attaching a shadow variables_get does not change getAllVariables()', function () {
      // Quality #1: getAllVariables must reflect only application calls.
      this.workspace.createVariable('item', '', 'item_id');
      const before = this.workspace
        .getAllVariables()
        .map((v) => v.getId())
        .sort();
      makeParentWithShadowVariable(this.workspace, 'item_id', 'item');
      const after = this.workspace
        .getAllVariables()
        .map((v) => v.getId())
        .sort();
      assert.deepEqual(after, before);
    });
  });

  // ---------- T1 / T2: Case 1 delete + undo ----------

  suite('Case 1 - shadow value differs from template default', function () {
    setup(function () {
      // Toolbox-style template references "item". The user then changes the
      // shadow's field to point at "foo". The parent's stored shadowState
      // is unchanged (still "item"), because edits do not propagate.
      this.workspace.createVariable('item', '', 'item_id');
      this.workspace.createVariable('foo', '', 'foo_id');
      this.parent = makeParentWithShadowVariable(
        this.workspace,
        'item_id',
        'item',
      );
      this.shadow = getShadowChild(this.parent);
      this.originalShadowId = this.shadow.id;
      // User picks foo from the dropdown.
      this.shadow.getField('VAR').setValue('foo_id');
    });

    test('deleteVariable resets the shadow field to the template default', function () {
      // Quality #3 + #2: cascade processes the shadow.
      const foo = this.workspace.getVariableMap().getVariableById('foo_id');
      this.workspace.getVariableMap().deleteVariable(foo);

      // Variable map: foo gone.
      assert.notExists(
        this.workspace.getVariableMap().getVariableById('foo_id'),
      );
      // Shadow still attached at the same id; field reset to "item".
      const shadow = getShadowChild(this.parent);
      assert.equal(shadow.id, this.originalShadowId);
      assert.equal(shadow.getField('VAR').getValue(), 'item_id');
    });

    test('deleteVariable does not throw', function () {
      // Quality #6: API must not throw for inputs the patch enables.
      const foo = this.workspace.getVariableMap().getVariableById('foo_id');
      assert.doesNotThrow(() =>
        this.workspace.getVariableMap().deleteVariable(foo),
      );
    });

    test('undo restores foo and the shadow display, preserving block id', function () {
      // Quality #4: full undo restoration.
      const foo = this.workspace.getVariableMap().getVariableById('foo_id');
      this.workspace.getVariableMap().deleteVariable(foo);
      this.workspace.undo(false);

      const restored = this.workspace
        .getVariableMap()
        .getVariableById('foo_id');
      assert.exists(restored, 'foo variable must be restored');
      assert.equal(restored.getName(), 'foo');

      const shadow = getShadowChild(this.parent);
      assert.equal(
        shadow.id,
        this.originalShadowId,
        'shadow block id must not change across delete/undo',
      );
      assert.equal(
        shadow.getField('VAR').getValue(),
        'foo_id',
        'shadow field must be back to foo',
      );
    });

    test('redo re-applies the deletion', function () {
      const foo = this.workspace.getVariableMap().getVariableById('foo_id');
      this.workspace.getVariableMap().deleteVariable(foo);
      this.workspace.undo(false);
      this.workspace.undo(true); // redo

      assert.notExists(
        this.workspace.getVariableMap().getVariableById('foo_id'),
        'foo should be gone again after redo',
      );
      const shadow = getShadowChild(this.parent);
      assert.equal(shadow.getField('VAR').getValue(), 'item_id');
    });

    test('repeated delete-undo cycles do not accumulate variables', function () {
      // Quality #4 (#11 in the test plan): no leak across cycles.
      const initialCount = this.workspace.getAllVariables().length;
      for (let i = 0; i < 3; i++) {
        const foo = this.workspace.getVariableMap().getVariableById('foo_id');
        this.workspace.getVariableMap().deleteVariable(foo);
        this.workspace.undo(false);
      }
      assert.equal(
        this.workspace.getAllVariables().length,
        initialCount,
        'variable count should be stable across delete/undo cycles',
      );
    });
  });

  // ---------- T3 / T4: Case 2 delete (save/load round-trip) ----------

  suite(
    'Case 2 - parent template references the deleted variable',
    function () {
      setup(function () {
        // Simulate "save with foo selected, then load again". After load,
        // serializeShadow on the connection captures the live shadow state,
        // so the parent's shadowState now references foo (not the original
        // toolbox default). The most direct way to reach this state in a
        // headless test is to round-trip through the serializer.
        this.workspace.createVariable('item', '', 'item_id');
        this.workspace.createVariable('foo', '', 'foo_id');
        const original = makeParentWithShadowVariable(
          this.workspace,
          'item_id',
          'item',
        );
        // User picks foo on the original parent, then we save & reload.
        getShadowChild(original).getField('VAR').setValue('foo_id');

        const state = Blockly.serialization.workspaces.save(this.workspace);
        this.workspace.clear();
        // Re-create the application-side variables before reloading the
        // blocks, the same way an embedding application would.
        this.workspace.createVariable('item', '', 'item_id');
        this.workspace.createVariable('foo', '', 'foo_id');
        Blockly.serialization.workspaces.load(state, this.workspace);

        this.parent = this.workspace
          .getAllBlocks(false)
          .find((b) => b.type === 'shadow_var_parent');
        this.shadow = getShadowChild(this.parent);
        this.originalShadowId = this.shadow.id;

        // Sanity: parent's shadowState now references foo, confirming
        // we have actually reached Case 2.
        const shadowState = this.parent
          .getInput('VALUE')
          .connection.getShadowState();
        assert.equal(
          shadowState && shadowState.fields && shadowState.fields.VAR.id,
          'foo_id',
          'precondition: parent shadowState must reference foo (Case 2)',
        );
      });

      test('deleteVariable does not throw', function () {
        // Quality #6: even Case 2 must not throw.
        const foo = this.workspace.getVariableMap().getVariableById('foo_id');
        assert.doesNotThrow(() =>
          this.workspace.getVariableMap().deleteVariable(foo),
        );
      });

      test('foo is regenerated at the same id by the cascade', function () {
        // Quality #6: when the parent's stored shadowState references
        // the variable being deleted, the cascade replays the template
        // through getOrCreateVariablePackage, which re-creates a fresh
        // VariableModel at the same id and same name. (The user-visible
        // outcome is "the shadow keeps showing the variable name".)
        const foo = this.workspace.getVariableMap().getVariableById('foo_id');
        this.workspace.getVariableMap().deleteVariable(foo);
        const regenerated = this.workspace
          .getVariableMap()
          .getVariableById('foo_id');
        assert.exists(
          regenerated,
          'Case 2 cascade should regenerate foo at the same id',
        );
        assert.notStrictEqual(
          regenerated,
          foo,
          'regenerated VariableModel should be a fresh instance',
        );
        assert.equal(regenerated.getName(), 'foo');
      });

      test('parent block survives the cascade', function () {
        const foo = this.workspace.getVariableMap().getVariableById('foo_id');
        this.workspace.getVariableMap().deleteVariable(foo);
        assert.isFalse(
          this.parent.isDeadOrDying(),
          'parent block must not be disposed by the cascade',
        );
      });

      test('undo restores foo and parent / shadow remain alive', function () {
        // Quality #4: undo restores the variable. (B' prototype: shadow
        // continues to display foo via its cached VariableModel reference;
        // the variable map entry is the only data the user can verify.)
        const foo = this.workspace.getVariableMap().getVariableById('foo_id');
        this.workspace.getVariableMap().deleteVariable(foo);
        this.workspace.undo(false);

        assert.exists(
          this.workspace.getVariableMap().getVariableById('foo_id'),
          'foo variable must be restored on undo',
        );
        assert.isFalse(this.parent.isDeadOrDying());
        const shadow = getShadowChild(this.parent);
        assert.equal(
          shadow.id,
          this.originalShadowId,
          'shadow block id must not change across delete/undo',
        );
      });

      test('repeated delete-undo cycles leave a stable variable map', function () {
        // Quality #4 (#11): no accumulation even in Case 2.
        const initialNames = this.workspace
          .getAllVariables()
          .map((v) => v.getName())
          .sort();
        for (let i = 0; i < 3; i++) {
          const foo = this.workspace.getVariableMap().getVariableById('foo_id');
          this.workspace.getVariableMap().deleteVariable(foo);
          this.workspace.undo(false);
        }
        const finalNames = this.workspace
          .getAllVariables()
          .map((v) => v.getName())
          .sort();
        assert.deepEqual(finalNames, initialNames);
      });
    },
  );

  // ---------- T5 / T6: shared rename / cascade with non-shadow ----------

  suite('symmetric behavior with non-shadow variables_get', function () {
    setup(function () {
      this.workspace.createVariable('item', '', 'item_id');
      this.workspace.createVariable('foo', '', 'foo_id');
      this.parent = makeParentWithShadowVariable(
        this.workspace,
        'item_id',
        'item',
      );
      this.shadow = getShadowChild(this.parent);
      this.shadow.getField('VAR').setValue('foo_id');

      this.nonShadow = this.workspace.newBlock('variables_get');
      this.nonShadow.getField('VAR').setValue('foo_id');
    });

    test('rename updates both shadow and non-shadow displays', function () {
      // Quality #2: renames flow through the same path for both.
      const foo = this.workspace.getVariableMap().getVariableById('foo_id');
      this.workspace.getVariableMap().renameVariable(foo, 'foo2');
      assert.equal(this.shadow.getField('VAR').getText(), 'foo2');
      assert.equal(this.nonShadow.getField('VAR').getText(), 'foo2');
    });

    test('deleteVariable processes the non-shadow as a use', function () {
      // Quality #3: cascade also reaches non-shadow uses.
      const foo = this.workspace.getVariableMap().getVariableById('foo_id');
      this.workspace.getVariableMap().deleteVariable(foo);
      assert.isTrue(
        this.nonShadow.isDeadOrDying(),
        'non-shadow use should be disposed by cascade',
      );
    });

    test('VarDelete is fired exactly once even with mixed shadow / non-shadow uses', function () {
      // Quality #1: no spurious extra VarCreate / VarDelete from the
      // shadow path.
      const spy = createChangeListenerSpy(this.workspace);
      const foo = this.workspace.getVariableMap().getVariableById('foo_id');
      this.workspace.getVariableMap().deleteVariable(foo);

      assertEventFired(
        spy,
        Blockly.Events.VarDelete,
        {varId: 'foo_id'},
        this.workspace.id,
      );
      assertEventNotFired(spy, Blockly.Events.VarCreate, {}, this.workspace.id);
    });
  });

  // ---------- T12: Save / Load round-trip ----------

  suite('save / load round-trip', function () {
    test('a parent containing a shadow variables_get round-trips through JSON', function () {
      // Quality #2: serialization parity with non-shadow.
      this.workspace.createVariable('item', '', 'item_id');
      const parent = makeParentWithShadowVariable(
        this.workspace,
        'item_id',
        'item',
      );
      const beforeShadowId = getShadowChild(parent).getField('VAR').getValue();

      const state = Blockly.serialization.workspaces.save(this.workspace);
      this.workspace.clear();
      this.workspace.createVariable('item', '', 'item_id');
      Blockly.serialization.workspaces.load(state, this.workspace);

      const reloadedParent = this.workspace
        .getAllBlocks(false)
        .find((b) => b.type === 'shadow_var_parent');
      const reloadedShadow = getShadowChild(reloadedParent);
      assert.equal(
        reloadedShadow.getField('VAR').getValue(),
        beforeShadowId,
        'shadow field id must survive save / load',
      );
    });
  });

  // ---------- Observation #5: rename ----------

  suite('rename propagation', function () {
    test('rename updates the shadow field display via standard updateVarName', function () {
      // Quality #2: rename flows through the same path for both shadow
      // and non-shadow uses.
      this.workspace.createVariable('foo', '', 'foo_id');
      const parent = makeParentWithShadowVariable(
        this.workspace,
        'foo_id',
        'foo',
      );
      const shadow = getShadowChild(parent);

      const foo = this.workspace.getVariableMap().getVariableById('foo_id');
      this.workspace.getVariableMap().renameVariable(foo, 'foo_renamed');

      assert.equal(shadow.getField('VAR').getText(), 'foo_renamed');
    });

    test('rename undo restores the shadow field display', function () {
      // Quality #4: rename undo applies to shadow uses.
      this.workspace.createVariable('foo', '', 'foo_id');
      const parent = makeParentWithShadowVariable(
        this.workspace,
        'foo_id',
        'foo',
      );
      const shadow = getShadowChild(parent);

      const foo = this.workspace.getVariableMap().getVariableById('foo_id');
      this.workspace.getVariableMap().renameVariable(foo, 'foo_renamed');
      this.workspace.undo(false);

      assert.equal(shadow.getField('VAR').getText(), 'foo');
    });
  });

  // ---------- Observation #6: load with missing variable ----------

  suite('loading shadow with unregistered variable', function () {
    test('loading auto-creates the variable, like non-shadow variables_get', function () {
      // Quality #2: parity with non-shadow load behavior.
      // The load path goes through getOrCreateVariablePackage either way,
      // so a missing variable is created on demand.
      const state = {
        'blocks': {
          'languageVersion': 0,
          'blocks': [
            {
              'type': 'shadow_var_parent',
              'inputs': {
                'VALUE': {
                  'shadow': {
                    'type': 'variables_get',
                    'fields': {
                      'VAR': {
                        'id': 'auto_id',
                        'name': 'auto_name',
                        'type': '',
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      };
      assert.doesNotThrow(() =>
        Blockly.serialization.workspaces.load(state, this.workspace),
      );
      const created = this.workspace
        .getVariableMap()
        .getVariableById('auto_id');
      assert.exists(
        created,
        'load should auto-create the missing variable on demand',
      );
      assert.equal(created.getName(), 'auto_name');
    });
  });

  // ---------- Observation #16: flyout-drop reproduction ----------
  // Reproduction scenario from manual flyout drag testing: dragging a
  // parent block with a shadow `variables_get(item)` directly out of
  // the flyout produces a parent whose stored shadowState references
  // `item` directly (no save/load round-trip needed). Deleting `item`
  // must keep the shadow attached at the same parent input.

  suite('flyout-drop scenario', function () {
    test('parent dropped from flyout with item shadow keeps the shadow on item delete', function () {
      this.workspace.createVariable('item', '', 'item_id');
      const parent = makeParentWithShadowVariable(
        this.workspace,
        'item_id',
        'item',
      );
      const originalShadowId = getShadowChild(parent).id;

      const item = this.workspace.getVariableMap().getVariableById('item_id');
      this.workspace.getVariableMap().deleteVariable(item);

      // Shadow must still be attached at the same id (the cascade
      // regenerates a same-id same-name VariableModel for the field).
      const shadow = parent.getInputTargetBlock('VALUE');
      assert.exists(
        shadow,
        'shadow should not vanish from a freshly-dropped parent after item delete',
      );
      assert.equal(
        shadow.id,
        originalShadowId,
        'shadow block id should be preserved across the cascade',
      );
      assert.equal(shadow.getField('VAR').getValue(), 'item_id');
      // The regenerated variable should be a fresh VariableModel that
      // the field's getVariable() resolves to.
      const regenerated = this.workspace
        .getVariableMap()
        .getVariableById('item_id');
      assert.exists(regenerated);
      assert.strictEqual(shadow.getField('VAR').getVariable(), regenerated);
    });
  });

  // ---------- Observation #7: deletion of unrelated variable ----------

  suite('deletion of an unrelated variable', function () {
    test('deleting a variable the shadow does not currently reference is a no-op for the shadow', function () {
      // Quality #3: cascade only touches uses; unrelated shadows survive.
      this.workspace.createVariable('item', '', 'item_id');
      this.workspace.createVariable('foo', '', 'foo_id');
      const parent = makeParentWithShadowVariable(
        this.workspace,
        'item_id',
        'item',
      );
      // The user changes the live shadow value to foo. The parent's
      // stored shadowState still references item.
      getShadowChild(parent).getField('VAR').setValue('foo_id');

      // Delete item (the original template default), not foo.
      const item = this.workspace.getVariableMap().getVariableById('item_id');
      assert.doesNotThrow(() =>
        this.workspace.getVariableMap().deleteVariable(item),
      );

      // Shadow's live value is still foo, foo still exists.
      const shadow = getShadowChild(parent);
      assert.equal(shadow.getField('VAR').getValue(), 'foo_id');
      assert.exists(this.workspace.getVariableMap().getVariableById('foo_id'));
      assert.notExists(
        this.workspace.getVariableMap().getVariableById('item_id'),
      );
    });
  });

  // ---------- Observation #9: chained delete without undo ----------

  suite('chained delete without undo', function () {
    test('two consecutive deleteVariable calls each succeed and shadow displays settle on template defaults', function () {
      // Quality #4 / #6: cascades chain cleanly without intermediate undo.
      this.workspace.createVariable('item', '', 'item_id');
      this.workspace.createVariable('foo', '', 'foo_id');
      this.workspace.createVariable('bar', '', 'bar_id');
      const parent1 = makeParentWithShadowVariable(
        this.workspace,
        'item_id',
        'item',
      );
      const parent2 = makeParentWithShadowVariable(
        this.workspace,
        'item_id',
        'item',
      );
      // Both parents now have shadowState referencing item. Switch live
      // values to foo / bar respectively (Case 1 setup).
      getShadowChild(parent1).getField('VAR').setValue('foo_id');
      getShadowChild(parent2).getField('VAR').setValue('bar_id');

      const map = this.workspace.getVariableMap();
      map.deleteVariable(map.getVariableById('foo_id'));
      map.deleteVariable(map.getVariableById('bar_id'));

      assert.notExists(map.getVariableById('foo_id'));
      assert.notExists(map.getVariableById('bar_id'));
      assert.equal(
        getShadowChild(parent1).getField('VAR').getValue(),
        'item_id',
      );
      assert.equal(
        getShadowChild(parent2).getField('VAR').getValue(),
        'item_id',
      );
    });
  });

  // ---------- Observation #15: BlockChange event for Case 1 reset ----------

  suite('BlockChange event recording for Case 1 reset', function () {
    test('Case 1 reset fires a BlockChange event the shadow can undo', function () {
      // Quality #4: BlockChange events are correctly recorded for shadow
      // field changes triggered by the cascade.
      this.workspace.createVariable('item', '', 'item_id');
      this.workspace.createVariable('foo', '', 'foo_id');
      const parent = makeParentWithShadowVariable(
        this.workspace,
        'item_id',
        'item',
      );
      const shadow = getShadowChild(parent);
      shadow.getField('VAR').setValue('foo_id');

      const spy = createChangeListenerSpy(this.workspace);
      this.workspace
        .getVariableMap()
        .deleteVariable(
          this.workspace.getVariableMap().getVariableById('foo_id'),
        );

      assertEventFired(
        spy,
        Blockly.Events.BlockChange,
        {
          element: 'field',
          name: 'VAR',
          oldValue: 'foo_id',
          newValue: 'item_id',
        },
        this.workspace.id,
        shadow.id,
      );
    });
  });

  // ---------- Observation #4: nested cascade via change listener ----------

  suite('nested deleteVariable from a change listener', function () {
    test('a deleteVariable triggered by a VAR_DELETE listener does not corrupt suppress state', function () {
      // Quality #1: previousSuppress save/restore must allow nested cascades.
      this.workspace.createVariable('item', '', 'item_id');
      this.workspace.createVariable('foo', '', 'foo_id');
      this.workspace.createVariable('bar', '', 'bar_id');

      const parent1 = makeParentWithShadowVariable(
        this.workspace,
        'item_id',
        'item',
      );
      const parent2 = makeParentWithShadowVariable(
        this.workspace,
        'item_id',
        'item',
      );
      getShadowChild(parent1).getField('VAR').setValue('foo_id');
      getShadowChild(parent2).getField('VAR').setValue('bar_id');

      // The first VAR_DELETE triggers a nested deleteVariable call.
      const map = this.workspace.getVariableMap();
      const listener = (e) => {
        if (e.type === Blockly.Events.VAR_DELETE && e.varId === 'foo_id') {
          this.workspace.removeChangeListener(listener);
          const bar = map.getVariableById('bar_id');
          if (bar) map.deleteVariable(bar);
        }
      };
      this.workspace.addChangeListener(listener);

      assert.doesNotThrow(() =>
        map.deleteVariable(map.getVariableById('foo_id')),
      );
      assert.notExists(map.getVariableById('foo_id'));
      assert.notExists(map.getVariableById('bar_id'));
    });
  });

  // ---------- Observation #12: workspace.clear() with shadow vars ----------

  suite('workspace.clear() with shadow variables_get', function () {
    test('clear() does not throw when shadow variables_get blocks are present', function () {
      // Quality #1: dispose paths other than deleteVariable also handle
      // shadow variables_get cleanly.
      this.workspace.createVariable('foo', '', 'foo_id');
      makeParentWithShadowVariable(this.workspace, 'foo_id', 'foo');
      makeParentWithShadowVariable(this.workspace, 'foo_id', 'foo');

      assert.doesNotThrow(() => this.workspace.clear());
      assert.equal(this.workspace.getAllBlocks(false).length, 0);
      assert.equal(this.workspace.getAllVariables().length, 0);
    });
  });

  // ---------- Observation #14: non-default variable type ----------

  suite('non-default variable type', function () {
    test('shadow variables_get works end-to-end with a non-default variable type', function () {
      // Quality #2: type-tagged variables follow the same code path.
      this.workspace.createVariable('typed_item', 'TypeA', 'typed_item_id');
      this.workspace.createVariable('typed_foo', 'TypeA', 'typed_foo_id');
      const parent = Blockly.serialization.blocks.append(
        {
          'type': 'shadow_var_parent',
          'inputs': {
            'VALUE': {
              'shadow': {
                'type': 'variables_get',
                'fields': {
                  'VAR': {
                    'id': 'typed_item_id',
                    'name': 'typed_item',
                    'type': 'TypeA',
                  },
                },
              },
            },
          },
        },
        this.workspace,
      );
      const shadow = getShadowChild(parent);
      shadow.getField('VAR').setValue('typed_foo_id');

      const map = this.workspace.getVariableMap();
      assert.doesNotThrow(() =>
        map.deleteVariable(map.getVariableById('typed_foo_id')),
      );
      assert.equal(
        getShadowChild(parent).getField('VAR').getValue(),
        'typed_item_id',
      );
    });
  });

  // ---------- Observation #2: mixed Case 1 / Case 2 in one shadow ----------

  suite('mixed Case 1 / Case 2 fields in one shadow', function () {
    /**
     * Build a parent whose VALUE input contains a shadow_var_two_field
     * shadow with two variable fields. After save/load this is the only
     * way to reach a shadowState whose two fields point at different
     * variables.
     *
     * @param {!Blockly.Workspace} workspace The workspace to load into.
     * @param {string} var1Id Variable id for VAR1's template default.
     * @param {string} var2Id Variable id for VAR2's template default.
     * @returns {!Blockly.Block} The newly created parent block.
     */
    function makeParentWithTwoFieldShadow(workspace, var1Id, var2Id) {
      return Blockly.serialization.blocks.append(
        {
          'type': 'shadow_var_parent',
          'inputs': {
            'VALUE': {
              'shadow': {
                'type': 'shadow_var_two_field',
                'fields': {
                  'VAR1': {'id': var1Id, 'name': var1Id, 'type': ''},
                  'VAR2': {'id': var2Id, 'name': var2Id, 'type': ''},
                },
              },
            },
          },
        },
        workspace,
      );
    }

    test('Case 1 fields in a mixed shadow are still reset', function () {
      // The current B' implementation pushes Case 1 entries to the
      // case1Resets list even when the same shadow has a Case 2 field.
      // The trailing `if (anyCase2) continue;` only skips loop iterations,
      // it does NOT undo the case1Resets push. Pin this behavior.
      this.workspace.createVariable('item', '', 'item_id');
      this.workspace.createVariable('foo', '', 'foo_id');

      // Both fields' templates point at foo. After live editing, VAR1
      // moves to item; VAR2 stays on foo. So when foo is deleted:
      //   VAR1 has live=foo (matches deleted), template=foo (Case 2)
      //   VAR2 has live=foo (matches deleted), template=foo (Case 2)
      // Hmm, that gives Case 2 / Case 2.  To get a mix we need the
      // templates to differ.  Use save/load to lock template = live.
      const original = makeParentWithTwoFieldShadow(
        this.workspace,
        'foo_id',
        'foo_id',
      );
      // Live state matches template both ways at this point.
      // Now switch VAR1 to item so live differs from template.
      getShadowChild(original).getField('VAR1').setValue('item_id');

      // Round-trip through serializer. saveConnection captures live state,
      // so the reloaded parent's shadowState will have VAR1=item, VAR2=foo.
      const state = Blockly.serialization.workspaces.save(this.workspace);
      this.workspace.clear();
      this.workspace.createVariable('item', '', 'item_id');
      this.workspace.createVariable('foo', '', 'foo_id');
      Blockly.serialization.workspaces.load(state, this.workspace);

      const reloaded = this.workspace
        .getAllBlocks(false)
        .find((b) => b.type === 'shadow_var_parent');
      const shadow = getShadowChild(reloaded);
      // Restore the live values to the mixed state we want for the test:
      // both fields point at foo (the variable we are about to delete),
      // but the parent template now has VAR1=item / VAR2=foo.
      shadow.getField('VAR1').setValue('foo_id');
      shadow.getField('VAR2').setValue('foo_id');

      const map = this.workspace.getVariableMap();
      map.deleteVariable(map.getVariableById('foo_id'));

      // VAR1 (Case 1: template = item) should have been reset.
      assert.equal(
        shadow.getField('VAR1').getValue(),
        'item_id',
        'VAR1 should be reset to template default item',
      );
      // VAR2 (Case 2: template = foo) is left untouched. It still
      // references foo, which is now an orphan.
      assert.equal(
        shadow.getField('VAR2').getValue(),
        'foo_id',
        'VAR2 should retain its orphaned reference (Case 2 limitation)',
      );
    });
  });

  // ---------- Observation #10: nested shadow ----------

  suite('nested shadow blocks', function () {
    test('a shadow variables_get nested inside a shadow wrapper does not crash on delete', function () {
      this.workspace.createVariable('foo', '', 'foo_id');
      const parent = Blockly.serialization.blocks.append(
        {
          'type': 'shadow_var_parent',
          'inputs': {
            'VALUE': {
              'shadow': {
                'type': 'shadow_var_wrapper',
                'inputs': {
                  'INNER': {
                    'shadow': {
                      'type': 'variables_get',
                      'fields': {
                        'VAR': {'id': 'foo_id', 'name': 'foo', 'type': ''},
                      },
                    },
                  },
                },
              },
            },
          },
        },
        this.workspace,
      );

      const wrapper = parent.getInputTargetBlock('VALUE');
      assert.isTrue(wrapper.isShadow());
      const inner = wrapper.getInputTargetBlock('INNER');
      assert.isTrue(inner.isShadow());
      assert.equal(inner.type, 'variables_get');

      const map = this.workspace.getVariableMap();
      assert.doesNotThrow(() =>
        map.deleteVariable(map.getVariableById('foo_id')),
      );
      // Parent and wrapper should still exist. The Case 2 cascade
      // regenerates foo at the same id (the inner shadow's template
      // references foo directly), so the variable map still has foo
      // afterwards — the regenerated VariableModel is a fresh instance.
      assert.isFalse(parent.isDeadOrDying());
      assert.isFalse(wrapper.isDeadOrDying());
      const regenerated = map.getVariableById('foo_id');
      assert.exists(
        regenerated,
        'Case 2 cascade should regenerate foo at the same id',
      );
      assert.equal(regenerated.getName(), 'foo');
    });
  });

  // ---------- DESIRED behavior tests (acceptance criteria) ----------
  // These tests express what a correct implementation should do.
  // They are marked `test.skip` so they appear as pending in mocha
  // output; lifting the skip is the acceptance criterion for the
  // implementation work that follows this spec branch.

  suite('acceptance criteria (currently pending)', function () {
    /**
     * Build a parent whose stored shadowState references the variable
     * we are about to delete (Case 2). Reached by going through a
     * save / load round-trip, which is how a real application loads a
     * workspace whose user has previously edited the shadow.
     *
     * @param {!Blockly.Workspace} workspace The workspace to populate.
     * @param {string} varId The id of the variable to point at.
     * @param {string} varName The visible name of that variable.
     * @returns {!Blockly.Block} The reloaded parent block.
     */
    function makeCase2Parent(workspace, varId, varName) {
      makeParentWithShadowVariable(workspace, varId, varName);
      const state = Blockly.serialization.workspaces.save(workspace);
      workspace.clear();
      workspace.createVariable(varName, '', varId);
      Blockly.serialization.workspaces.load(state, workspace);
      return workspace
        .getAllBlocks(false)
        .find((b) => b.type === 'shadow_var_parent');
    }

    test('Case 2 delete + undo restores the live shadow display', function () {
      // After deleteVariable + undo, the shadow's FieldVariable should
      // resolve to the SAME VariableModel instance that the workspace
      // map currently holds, so subsequent renames / dropdowns /
      // generators all see the same identity.
      this.workspace.createVariable('foo', '', 'foo_id');
      const parent = makeCase2Parent(this.workspace, 'foo_id', 'foo');
      // Capture the shadow's pre-delete id; after delete + undo we
      // re-fetch by walking from the parent because the cascade may
      // re-create the underlying JS object (the spec contract is
      // "shadow id unchanged across delete/undo", not "JS instance
      // unchanged"). See also test 380 which uses the same pattern.
      const originalShadowId = getShadowChild(parent).id;

      const map = this.workspace.getVariableMap();
      map.deleteVariable(map.getVariableById('foo_id'));
      this.workspace.undo(false);

      const shadow = getShadowChild(parent);
      assert.equal(
        shadow.id,
        originalShadowId,
        'shadow block id must not change across delete/undo',
      );
      // The field should resolve to the SAME VariableModel instance
      // that the workspace map currently holds, so subsequent renames
      // / dropdowns / generators all see the same identity.
      const fromField = shadow.getField('VAR').getVariable();
      const fromMap = this.workspace.getVariableMap().getVariableById('foo_id');
      assert.strictEqual(
        fromField,
        fromMap,
        'shadow field must reference the live workspace VariableModel',
      );
    });

    test('Case 2 deleteVariable produces a consistent variable map / field state', function () {
      // After Case 2 deleteVariable (no undo), either:
      //   (a) the shadow has been respawned and references a fresh
      //       variable that the cascade also created, OR
      //   (b) the shadow has been disposed cleanly.
      // In either case, no FieldVariable in the workspace should be
      // pointing at a VariableModel that the workspace map does not
      // know about.
      this.workspace.createVariable('foo', '', 'foo_id');
      makeCase2Parent(this.workspace, 'foo_id', 'foo');

      const map = this.workspace.getVariableMap();
      map.deleteVariable(map.getVariableById('foo_id'));

      const allBlocks = this.workspace.getAllBlocks(false);
      for (const block of allBlocks) {
        for (const input of block.inputList) {
          for (const field of input.fieldRow) {
            if (typeof field.getVariable !== 'function') continue;
            const v = field.getVariable();
            if (!v) continue;
            const onWorkspace = this.workspace
              .getVariableMap()
              .getVariableById(v.getId());
            assert.strictEqual(
              v,
              onWorkspace,
              `field ${field.name} on block ${block.id} must reference a live VariableModel`,
            );
          }
        }
      }
    });

    test('Case 2 generator output never references an orphaned variable id', function () {
      // After Case 2 deleteVariable, the JavaScript generator should
      // not emit the deleted variable id as a fallback. Either the
      // shadow has been removed from the parent input, or it has been
      // re-bound to a live variable.
      this.workspace.createVariable('foo', '', 'foo_id');
      makeCase2Parent(this.workspace, 'foo_id', 'foo');

      const map = this.workspace.getVariableMap();
      map.deleteVariable(map.getVariableById('foo_id'));

      const previousParentHandler =
        javascriptGenerator.forBlock['shadow_var_parent'];
      javascriptGenerator.forBlock['shadow_var_parent'] = function (
        block,
        gen,
      ) {
        const value = gen.valueToCode(block, 'VALUE', 0) || "''";
        return value + ';\n';
      };
      let code;
      try {
        code = javascriptGenerator.workspaceToCode(this.workspace);
      } finally {
        if (previousParentHandler) {
          javascriptGenerator.forBlock['shadow_var_parent'] =
            previousParentHandler;
        } else {
          delete javascriptGenerator.forBlock['shadow_var_parent'];
        }
      }
      // Generator output should not contain the orphaned id.
      assert.notInclude(
        code,
        'foo_id',
        'generator must not emit orphaned variable ids',
      );
    });

    test('rename after Case 2 delete-undo updates the shadow display', function () {
      // After Case 2 delete-undo, a rename of the restored variable
      // should propagate to the shadow's display through the same
      // updateVarName path that non-shadow variables_get follows.
      this.workspace.createVariable('foo', '', 'foo_id');
      const parent = makeCase2Parent(this.workspace, 'foo_id', 'foo');

      const map = this.workspace.getVariableMap();
      map.deleteVariable(map.getVariableById('foo_id'));
      this.workspace.undo(false);

      const restored = this.workspace
        .getVariableMap()
        .getVariableById('foo_id');
      this.workspace.getVariableMap().renameVariable(restored, 'foo_renamed');

      // Re-fetch the shadow after undo (the cascade may re-create the
      // underlying JS object — see test 380 / 966 for the same pattern).
      const shadow = getShadowChild(parent);
      assert.equal(
        shadow.getField('VAR').getText(),
        'foo_renamed',
        'rename of the restored variable should reach the shadow display',
      );
    });
  });
});
