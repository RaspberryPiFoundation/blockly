/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import type sinon from 'sinon';
import {workspaceTeardown} from './setup_teardown.js';
import {assertVariableValues} from './variables.ts';

/**
 * Function that runs a suite of tests against a given workspace.
 */
export function testAWorkspace(wrapper: {
  workspace?: Blockly.Workspace;
  clock?: sinon.SinonFakeTimers;
}) {
  let workspace: Blockly.Workspace;
  let clock: sinon.SinonFakeTimers;

  setup(function () {
    assert.isDefined(wrapper.workspace);
    assert.isDefined(wrapper.clock);
    workspace = wrapper.workspace;
    clock = wrapper.clock;
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'get_var_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'field_variable',
            'name': 'VAR',
            'variableTypes': ['', 'type1', 'type2'],
          },
        ],
      },
    ]);
  });

  teardown(function () {
    // Clear Blockly.Event state.
    Blockly.Events.setGroup(false);
    while (!Blockly.Events.isEnabled()) {
      Blockly.Events.enable();
    }
  });

  function assertBlockVarModelName(
    workspace: Blockly.Workspace,
    blockIndex: number,
    name: string,
  ) {
    const block = workspace.getTopBlocks(false)[blockIndex];
    assert.exists(block, 'Block at topBlocks[' + blockIndex + ']');
    const varModel = block.getVarModels()[0];
    assert.exists(
      varModel,
      'VariableModel for block at topBlocks[' + blockIndex + ']',
    );
    const blockVarName = varModel.getName();
    assert.equal(
      blockVarName,
      name,
      'VariableModel name for block at topBlocks[' + blockIndex + ']',
    );
  }

  function createVarBlocksNoEvents(
    workspace: Blockly.Workspace,
    ids: string[],
  ) {
    const blocks = [];
    // Turn off events to avoid testing XML at the same time.
    Blockly.Events.disable();
    for (let i = 0, id; (id = ids[i]); i++) {
      const block = new Blockly.Block(workspace, 'get_var_block');
      block.inputList[0].fieldRow[0].setValue(id);
      blocks.push(block);
    }
    Blockly.Events.enable();
    return blocks;
  }

  suite('clear', function () {
    test('Trivial', function () {
      workspace.getVariableMap().createVariable('name1', 'type1', 'id1');
      workspace.getVariableMap().createVariable('name2', 'type2', 'id2');
      workspace.newBlock('controls_if');

      workspace.clear();
      assert.equal(workspace.getTopBlocks(false).length, 0);
      const varMapLength = workspace.getVariableMap().getAllVariables().length;
      assert.equal(varMapLength, 0);
    });

    test('No variables', function () {
      workspace.newBlock('controls_if');

      workspace.clear();
      assert.equal(workspace.getTopBlocks(false).length, 0);
      const varMapLength = workspace.getVariableMap().getAllVariables().length;
      assert.equal(varMapLength, 0);
    });
  });

  suite('deleteVariable', function () {
    setup(function () {
      // Create two variables of different types.
      workspace.getVariableMap().createVariable('name1', 'type1', 'id1');
      workspace.getVariableMap().createVariable('name2', 'type2', 'id2');
      // Create blocks to refer to both of them.
      createVarBlocksNoEvents(workspace, ['id1', 'id1', 'id2']);
    });

    test('deleteVariableById(id2) one usage', function () {
      // Deleting variable one usage should not trigger confirm dialog.
      let callCount = 0;
      Blockly.dialog.setConfirm((_message, callback) => {
        callCount++;
        callback(true);
      });
      const id2 = workspace.getVariableMap().getVariableById('id2');
      assert.isNotNull(id2);
      Blockly.Variables.deleteVariable(workspace, id2);

      assert.equal(callCount, 0);
      const variable = workspace.getVariableMap().getVariableById('id2');
      assert.isNull(variable);
      assertVariableValues(workspace.getVariableMap(), 'name1', 'type1', 'id1');
      assertBlockVarModelName(workspace, 0, 'name1');

      Blockly.dialog.setConfirm();
    });

    test('deleteVariableById(id1) multiple usages confirm', function () {
      // Deleting variable with multiple usages triggers confirm dialog.
      let callCount = 0;
      Blockly.dialog.setConfirm((_message, callback) => {
        callCount++;
        callback(true);
      });
      const id1 = workspace.getVariableMap().getVariableById('id1');
      assert.isNotNull(id1);
      Blockly.Variables.deleteVariable(workspace, id1);

      assert.equal(callCount, 1);
      const variable = workspace.getVariableMap().getVariableById('id1');
      assert.isNull(variable);
      assertVariableValues(workspace.getVariableMap(), 'name2', 'type2', 'id2');
      assertBlockVarModelName(workspace, 0, 'name2');

      Blockly.dialog.setConfirm();
    });

    test('deleteVariableById(id1) multiple usages cancel', function () {
      // Deleting variable with multiple usages triggers confirm dialog.
      let callCount = 0;
      Blockly.dialog.setConfirm((_message, callback) => {
        callCount++;
        callback(false);
      });
      const id1 = workspace.getVariableMap().getVariableById('id1');
      assert.isNotNull(id1);
      Blockly.Variables.deleteVariable(workspace, id1);

      assert.equal(callCount, 1);
      assertVariableValues(workspace.getVariableMap(), 'name1', 'type1', 'id1');
      assertVariableValues(workspace.getVariableMap(), 'name2', 'type2', 'id2');
      assertBlockVarModelName(workspace, 0, 'name1');
      assertBlockVarModelName(workspace, 1, 'name1');
      assertBlockVarModelName(workspace, 2, 'name2');

      Blockly.dialog.setConfirm();
    });
  });

  suite('renameVariable', function () {
    setup(function () {
      workspace.getVariableMap().createVariable('name1', 'type1', 'id1');
    });

    test('No references rename to name2', function () {
      const id1 = workspace.getVariableMap().getVariableById('id1');
      assert.isNotNull(id1);
      workspace.getVariableMap().renameVariable(id1, 'name2');
      assertVariableValues(workspace.getVariableMap(), 'name2', 'type1', 'id1');
      // Renaming should not have created a new variable.
      assert.equal(workspace.getVariableMap().getAllVariables().length, 1);
    });

    test('Reference exists rename to name2', function () {
      createVarBlocksNoEvents(workspace, ['id1']);

      const id1 = workspace.getVariableMap().getVariableById('id1');
      assert.isNotNull(id1);
      workspace.getVariableMap().renameVariable(id1, 'name2');
      assertVariableValues(workspace.getVariableMap(), 'name2', 'type1', 'id1');
      // Renaming should not have created a new variable.
      assert.equal(workspace.getVariableMap().getAllVariables().length, 1);
      assertBlockVarModelName(workspace, 0, 'name2');
    });

    test('Reference exists different capitalization rename to Name1', function () {
      createVarBlocksNoEvents(workspace, ['id1']);

      const id1 = workspace.getVariableMap().getVariableById('id1');
      assert.isNotNull(id1);
      workspace.getVariableMap().renameVariable(id1, 'Name1');
      assertVariableValues(workspace.getVariableMap(), 'Name1', 'type1', 'id1');
      // Renaming should not have created a new variable.
      assert.equal(workspace.getVariableMap().getAllVariables().length, 1);
      assertBlockVarModelName(workspace, 0, 'Name1');
    });

    suite('Two variables rename overlap', function () {
      test('Same type rename variable with id1 to name2', function () {
        workspace.getVariableMap().createVariable('name2', 'type1', 'id2');
        createVarBlocksNoEvents(workspace, ['id1', 'id2']);

        const id1 = workspace.getVariableMap().getVariableById('id1');
        assert.isNotNull(id1);
        workspace.getVariableMap().renameVariable(id1, 'name2');

        // The second variable should remain unchanged.
        assertVariableValues(workspace, 'name2', 'type1', 'id2');
        // The first variable should have been deleted.
        const variable = workspace.getVariableMap().getVariableById('id1');
        assert.isNull(variable);
        // There should only be one variable left.
        assert.equal(workspace.getVariableMap().getAllVariables().length, 1);

        // Both blocks should now reference variable with name2.
        assertBlockVarModelName(workspace, 0, 'name2');
        assertBlockVarModelName(workspace, 1, 'name2');
      });

      test('Different type rename variable with id1 to name2', function () {
        workspace.getVariableMap().createVariable('name2', 'type2', 'id2');
        createVarBlocksNoEvents(workspace, ['id1', 'id2']);

        const id1 = workspace.getVariableMap().getVariableById('id1');
        assert.isNotNull(id1);
        workspace.getVariableMap().renameVariable(id1, 'name2');

        // Variables with different type are allowed to have the same name.
        assertVariableValues(
          workspace.getVariableMap(),
          'name2',
          'type1',
          'id1',
        );
        assertVariableValues(
          workspace.getVariableMap(),
          'name2',
          'type2',
          'id2',
        );

        // Both blocks should now reference variable with name2.
        assertBlockVarModelName(workspace, 0, 'name2');
        assertBlockVarModelName(workspace, 1, 'name2');
      });

      test('Same type different capitalization rename variable with id1 to Name2', function () {
        workspace.getVariableMap().createVariable('name2', 'type1', 'id2');
        createVarBlocksNoEvents(workspace, ['id1', 'id2']);

        const id1 = workspace.getVariableMap().getVariableById('id1');
        assert.isNotNull(id1);
        workspace.getVariableMap().renameVariable(id1, 'Name2');

        // The second variable should be updated.
        assertVariableValues(
          workspace.getVariableMap(),
          'Name2',
          'type1',
          'id2',
        );
        // The first variable should have been deleted.
        const variable = workspace.getVariableMap().getVariableById('id1');
        assert.isNull(variable);
        // There should only be one variable left.
        assert.equal(workspace.getVariableMap().getAllVariables().length, 1);

        // Both blocks should now reference variable with Name2.
        assertBlockVarModelName(workspace, 0, 'Name2');
        assertBlockVarModelName(workspace, 1, 'Name2');
      });

      test('Different type different capitalization rename variable with id1 to Name2', function () {
        workspace.getVariableMap().createVariable('name2', 'type2', 'id2');
        createVarBlocksNoEvents(workspace, ['id1', 'id2']);

        const id1 = workspace.getVariableMap().getVariableById('id1');
        assert.isNotNull(id1);
        workspace.getVariableMap().renameVariable(id1, 'Name2');

        // Variables with different type are allowed to have the same name.
        assertVariableValues(
          workspace.getVariableMap(),
          'Name2',
          'type1',
          'id1',
        );
        // Second variable should remain unchanged.
        assertVariableValues(
          workspace.getVariableMap(),
          'name2',
          'type2',
          'id2',
        );

        // Only first block should use new capitalization.
        assertBlockVarModelName(workspace, 0, 'Name2');
        assertBlockVarModelName(workspace, 1, 'name2');
      });
    });
  });

  suite('getTopBlocks(ordered=true)', function () {
    test('Empty workspace', function () {
      assert.equal(workspace.getTopBlocks(true).length, 0);
    });

    test('Flat workspace one block', function () {
      workspace.newBlock('');
      assert.equal(workspace.getTopBlocks(true).length, 1);
    });

    test('Flat workspace one block after dispose', function () {
      const blockA = workspace.newBlock('');
      workspace.newBlock('');
      blockA.dispose();
      assert.equal(workspace.getTopBlocks(true).length, 1);
    });

    test('Flat workspace two blocks', function () {
      workspace.newBlock('');
      workspace.newBlock('');
      assert.equal(workspace.getTopBlocks(true).length, 2);
    });

    test('Clear', function () {
      workspace.clear();
      assert.equal(
        workspace.getTopBlocks(true).length,
        0,
        'Clear empty workspace',
      );
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.clear();
      assert.equal(workspace.getTopBlocks(true).length, 0);
    });
  });

  suite('getTopBlocks(ordered=false)', function () {
    test('Empty workspace', function () {
      assert.equal(workspace.getTopBlocks(false).length, 0);
    });

    test('Flat workspace one block', function () {
      workspace.newBlock('');
      assert.equal(workspace.getTopBlocks(false).length, 1);
    });

    test('Flat workspace one block after dispose', function () {
      const blockA = workspace.newBlock('');
      workspace.newBlock('');
      blockA.dispose();
      assert.equal(workspace.getTopBlocks(false).length, 1);
    });

    test('Flat workspace two blocks', function () {
      workspace.newBlock('');
      workspace.newBlock('');
      assert.equal(workspace.getTopBlocks(false).length, 2);
    });

    test('Clear empty workspace', function () {
      workspace.clear();
      assert.equal(workspace.getTopBlocks(false).length, 0);
    });

    test('Clear non-empty workspace', function () {
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.clear();
      assert.equal(workspace.getTopBlocks(false).length, 0);
    });
  });

  suite('getAllBlocks', function () {
    test('Empty workspace', function () {
      assert.equal(workspace.getAllBlocks(true).length, 0);
    });

    test('Flat workspace one block', function () {
      workspace.newBlock('');
      assert.equal(workspace.getAllBlocks(true).length, 1);
    });

    test('Flat workspace one block after dispose', function () {
      const blockA = workspace.newBlock('');
      workspace.newBlock('');
      blockA.dispose();
      assert.equal(workspace.getAllBlocks(true).length, 1);
    });

    test('Flat workspace two blocks', function () {
      workspace.newBlock('');
      workspace.newBlock('');
      assert.equal(workspace.getAllBlocks(true).length, 2);
    });

    test('Clear', function () {
      workspace.clear();
      assert.equal(
        workspace.getAllBlocks(true).length,
        0,
        'Clear empty workspace',
      );
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.clear();
      assert.equal(workspace.getAllBlocks(true).length, 0);
    });
  });

  suite('remainingCapacity', function () {
    setup(function () {
      workspace.newBlock('');
      workspace.newBlock('');
    });

    test('No block limit', function () {
      assert.equal(workspace.remainingCapacity(), Infinity);
    });

    test('Under block limit', function () {
      workspace.options.maxBlocks = 3;
      assert.equal(workspace.remainingCapacity(), 1);
      workspace.options.maxBlocks = 4;
      assert.equal(workspace.remainingCapacity(), 2);
    });

    test('At block limit', function () {
      workspace.options.maxBlocks = 2;
      assert.equal(workspace.remainingCapacity(), 0);
    });

    test('At block limit of 0 after clear', function () {
      workspace.options.maxBlocks = 0;
      workspace.clear();
      assert.equal(workspace.remainingCapacity(), 0);
    });

    test('Over block limit', function () {
      workspace.options.maxBlocks = 1;
      assert.equal(workspace.remainingCapacity(), -1);
    });

    test('Over block limit of 0', function () {
      workspace.options.maxBlocks = 0;
      assert.equal(workspace.remainingCapacity(), -2);
    });
  });

  suite('remainingCapacityOfType', function () {
    setup(function () {
      workspace.newBlock('get_var_block');
      workspace.newBlock('get_var_block');
      workspace.options.maxInstances! = {};
    });

    test('No instance limit', function () {
      assert.equal(
        workspace.remainingCapacityOfType('get_var_block'),
        Infinity,
      );
    });

    test('Under instance limit', function () {
      workspace.options.maxInstances!['get_var_block'] = 3;
      assert.equal(
        workspace.remainingCapacityOfType('get_var_block'),
        1,
        'With maxInstances limit 3',
      );
      workspace.options.maxInstances!['get_var_block'] = 4;
      assert.equal(
        workspace.remainingCapacityOfType('get_var_block'),
        2,
        'With maxInstances limit 4',
      );
    });

    test('Under instance limit with multiple block types', function () {
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.options.maxInstances!['get_var_block'] = 3;
      assert.equal(
        workspace.remainingCapacityOfType('get_var_block'),
        1,
        'With maxInstances limit 3',
      );
      workspace.options.maxInstances!['get_var_block'] = 4;
      assert.equal(
        workspace.remainingCapacityOfType('get_var_block'),
        2,
        'With maxInstances limit 4',
      );
    });

    test('At instance limit', function () {
      workspace.options.maxInstances!['get_var_block'] = 2;
      assert.equal(
        workspace.remainingCapacityOfType('get_var_block'),
        0,
        'With maxInstances limit 2',
      );
    });

    test('At instance limit of 0 after clear', function () {
      workspace.clear();
      workspace.options.maxInstances!['get_var_block'] = 0;
      assert.equal(workspace.remainingCapacityOfType('get_var_block'), 0);
    });

    test('At instance limit with multiple block types', function () {
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.options.maxInstances!['get_var_block'] = 2;
      assert.equal(
        workspace.remainingCapacityOfType('get_var_block'),
        0,
        'With maxInstances limit 2',
      );
    });

    test('At instance limit of 0 with multiple block types', function () {
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.options.maxInstances!['get_var_block'] = 0;
      workspace.clear();
      assert.equal(workspace.remainingCapacityOfType('get_var_block'), 0);
    });

    test('Over instance limit', function () {
      workspace.options.maxInstances!['get_var_block'] = 1;
      assert.equal(
        workspace.remainingCapacityOfType('get_var_block'),
        -1,
        'With maxInstances limit 1',
      );
    });

    test('Over instance limit of 0', function () {
      workspace.options.maxInstances!['get_var_block'] = 0;
      assert.equal(
        workspace.remainingCapacityOfType('get_var_block'),
        -2,
        'With maxInstances limit 0',
      );
    });

    test('Over instance limit with multiple block types', function () {
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.options.maxInstances!['get_var_block'] = 1;
      assert.equal(
        workspace.remainingCapacityOfType('get_var_block'),
        -1,
        'With maxInstances limit 1',
      );
    });

    test('Over instance limit of 0 with multiple block types', function () {
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.newBlock('');
      workspace.options.maxInstances!['get_var_block'] = 0;
      assert.equal(
        workspace.remainingCapacityOfType('get_var_block'),
        -2,
        'With maxInstances limit 0',
      );
    });
  });

  suite('isCapacityAvailable', function () {
    setup(function () {
      workspace.newBlock('get_var_block');
      workspace.newBlock('get_var_block');
      workspace.options.maxInstances! = {};
    });

    test('Under block limit and no instance limit', function () {
      workspace.options.maxBlocks = 3;
      const typeCountsMap = {'get_var_block': 1};
      assert.isTrue(workspace.isCapacityAvailable(typeCountsMap));
    });

    test('At block limit and no instance limit', function () {
      workspace.options.maxBlocks = 2;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(workspace.isCapacityAvailable(typeCountsMap));
    });

    test('Over block limit of 0 and no instance limit', function () {
      workspace.options.maxBlocks = 0;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(workspace.isCapacityAvailable(typeCountsMap));
    });

    test('Over block limit but under instance limit', function () {
      workspace.options.maxBlocks = 1;
      workspace.options.maxInstances!['get_var_block'] = 3;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(
        workspace.isCapacityAvailable(typeCountsMap),
        'With maxBlocks limit 1 and maxInstances limit 3',
      );
    });

    test('Over block limit of 0 but under instance limit', function () {
      workspace.options.maxBlocks = 0;
      workspace.options.maxInstances!['get_var_block'] = 3;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(
        workspace.isCapacityAvailable(typeCountsMap),
        'With maxBlocks limit 0 and maxInstances limit 3',
      );
    });

    test('Over block limit but at instance limit', function () {
      workspace.options.maxBlocks = 1;
      workspace.options.maxInstances!['get_var_block'] = 2;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(
        workspace.isCapacityAvailable(typeCountsMap),
        'With maxBlocks limit 1 and maxInstances limit 2',
      );
    });

    test('Over block limit and over instance limit', function () {
      workspace.options.maxBlocks = 1;
      workspace.options.maxInstances!['get_var_block'] = 1;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(
        workspace.isCapacityAvailable(typeCountsMap),
        'With maxBlocks limit 1 and maxInstances limit 1',
      );
    });

    test('Over block limit of 0 and over instance limit', function () {
      workspace.options.maxBlocks = 0;
      workspace.options.maxInstances!['get_var_block'] = 1;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(
        workspace.isCapacityAvailable(typeCountsMap),
        'With maxBlocks limit 0 and maxInstances limit 1',
      );
    });

    test('Over block limit and over instance limit of 0', function () {
      workspace.options.maxBlocks = 1;
      workspace.options.maxInstances!['get_var_block'] = 0;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(
        workspace.isCapacityAvailable(typeCountsMap),
        'With maxBlocks limit 1 and maxInstances limit 0',
      );
    });

    test('Over block limit of 0 and over instance limit of 0', function () {
      workspace.options.maxBlocks = 0;
      workspace.options.maxInstances!['get_var_block'] = 0;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(workspace.isCapacityAvailable(typeCountsMap));
    });
  });

  suite('getById', function () {
    let workspaceB: Blockly.Workspace | undefined;
    setup(function () {
      workspaceB = workspace.rendered
        ? new Blockly.WorkspaceSvg(new Blockly.Options({}))
        : new Blockly.Workspace();
    });

    teardown(function (this: Mocha.Context) {
      if (workspaceB) {
        workspaceTeardown.call(this, workspaceB);
      }
    });

    test('Trivial', function () {
      assert.equal(
        Blockly.Workspace.getById(workspace.id),
        workspace,
        'Find workspace',
      );
      assert.isDefined(workspaceB);
      assert.equal(
        Blockly.Workspace.getById(workspaceB.id),
        workspaceB,
        'Find workspaceB',
      );
    });

    test('Empty ID', function () {
      assert.isNull(Blockly.Workspace.getById(''));
    });

    test('Non-existent id', function () {
      assert.isNull(Blockly.Workspace.getById('badId'));
    });

    test('After dispose', function () {
      assert.isDefined(workspaceB);
      workspaceB.dispose();
      assert.isNull(Blockly.Workspace.getById(workspaceB.id));
      workspaceB = undefined;
    });
  });

  suite('getBlockById', function () {
    let blockA: Blockly.Block;
    let blockB: Blockly.Block;
    let workspaceB: Blockly.Workspace;

    setup(function () {
      blockA = workspace.newBlock('');
      blockB = workspace.newBlock('');
      workspaceB = workspace.rendered
        ? new Blockly.WorkspaceSvg(new Blockly.Options({}))
        : new Blockly.Workspace();
    });

    teardown(function (this: Mocha.Context) {
      workspaceTeardown.call(this, workspaceB);
    });

    test('Trivial', function () {
      assert.equal(workspace.getBlockById(blockA.id), blockA);
      assert.equal(workspace.getBlockById(blockB.id), blockB);
    });

    test('Empty id', function () {
      assert.isNull(workspace.getBlockById(''));
    });

    test('Non-existent id', function () {
      assert.isNull(workspace.getBlockById('badId'));
    });

    test('After dispose', function () {
      blockA.dispose();
      assert.isNull(workspace.getBlockById(blockA.id));
      assert.equal(workspace.getBlockById(blockB.id), blockB);
    });

    test('After clear', function () {
      workspace.clear();
      assert.isNull(workspace.getBlockById(blockA.id));
      assert.isNull(workspace.getBlockById(blockB.id));
    });
  });

  suite('Undo/Redo', function () {
    /**
     * Assert that two nodes are equal.
     *
     * @param actual the actual node.
     * @param expected the expected node.
     */
    function assertNodesEqual(actual: Element, expected: Element) {
      const actualString = '\n' + Blockly.Xml.domToPrettyText(actual) + '\n';
      const expectedString =
        '\n' + Blockly.Xml.domToPrettyText(expected) + '\n';

      assert.equal(actual.tagName, expected.tagName);
      for (let i = 0, attr; (attr = expected.attributes[i]); i++) {
        assert.equal(
          actual.getAttribute(attr.name),
          attr.value,
          `expected attribute ${attr.name} on ${actualString} to match ` +
            `${expectedString}`,
        );
      }
      assert.equal(
        actual.childElementCount,
        expected.childElementCount,
        `expected node ${actualString} to have the same children as node ` +
          `${expectedString}`,
      );
      for (let i = 0; i < expected.childElementCount; i++) {
        assertNodesEqual(actual.children[i], expected.children[i]);
      }
    }

    suite('Undo Delete', function () {
      setup(function () {
        Blockly.defineBlocksWithJsonArray([
          {
            'type': 'stack_block',
            'message0': '',
            'previousStatement': null,
            'nextStatement': null,
          },
          {
            'type': 'row_block',
            'message0': '%1',
            'args0': [
              {
                'type': 'input_value',
                'name': 'INPUT',
              },
            ],
            'output': null,
          },
          {
            'type': 'statement_block',
            'message0': '%1',
            'args0': [
              {
                'type': 'input_statement',
                'name': 'STATEMENT',
              },
            ],
            'previousStatement': null,
            'nextStatement': null,
          },
        ]);
      });

      teardown(function () {
        delete Blockly.Blocks['stack_block'];
        delete Blockly.Blocks['row_block'];
        delete Blockly.Blocks['statement_block'];
      });

      function testUndoDelete(xmlText: string) {
        const xml = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.domToBlock(xml, workspace);
        workspace.getTopBlocks()[0].dispose(false);
        clock.runAll();
        workspace.undo();
        clock.runAll();
        const newXml = Blockly.Xml.workspaceToDom(workspace);
        const child = newXml.firstElementChild;
        assert.isNotNull(child);
        assertNodesEqual(child, xml);
      }

      test('Stack', function () {
        testUndoDelete('<block type="stack_block" id="1"/>');
      });

      test('Row', function () {
        testUndoDelete('<block type="row_block" id="1"/>');
      });

      test('Statement', function () {
        testUndoDelete('<block type="statement_block" id="1"/>');
      });

      test('Stack w/ child', function () {
        testUndoDelete(
          '<block type="stack_block" id="1">' +
            '  <next>' +
            '    <block type="stack_block" id="2"></block>' +
            '  </next>' +
            '</block>',
        );
      });

      test('Row w/ child', function () {
        testUndoDelete(
          '<block type="row_block" id="1">' +
            '  <value name="INPUT">' +
            '    <block type="row_block" id="2"></block>' +
            '  </value>' +
            '</block>',
        );
      });

      test('Statement w/ child', function () {
        testUndoDelete(
          '<block type="statement_block" id="1">' +
            '  <statement name="STATEMENT">' +
            '    <block type="stack_block" id="2"></block>' +
            '  </statement>' +
            '</block>',
        );
      });

      test('Stack w/ shadow', function () {
        testUndoDelete(
          '<block type="stack_block" id="1">' +
            '  <next>' +
            '    <shadow type="stack_block" id="2"></shadow>' +
            '  </next>' +
            '</block>',
        );
      });

      test('Row w/ shadow', function () {
        testUndoDelete(
          '<block type="row_block" id="1">' +
            '  <value name="INPUT">' +
            '    <shadow type="row_block" id="2"></shadow>' +
            '  </value>' +
            '</block>',
        );
      });

      test('Statement w/ shadow', function () {
        testUndoDelete(
          '<block type="statement_block" id="1">' +
            '  <statement name="STATEMENT">' +
            '    <shadow type="stack_block" id="2"></shadow>' +
            '  </statement>' +
            '</block>',
        );
      });
    });

    suite('Undo Connect', function () {
      setup(function () {
        Blockly.defineBlocksWithJsonArray([
          {
            'type': 'stack_block',
            'message0': '',
            'previousStatement': null,
            'nextStatement': null,
          },
          {
            'type': 'row_block',
            'message0': '%1',
            'args0': [
              {
                'type': 'input_value',
                'name': 'INPUT',
              },
            ],
            'output': null,
          },
          {
            'type': 'statement_block',
            'message0': '%1',
            'args0': [
              {
                'type': 'input_statement',
                'name': 'STATEMENT',
              },
            ],
            'previousStatement': null,
            'nextStatement': null,
          },
        ]);
      });

      teardown(function () {
        delete Blockly.Blocks['stack_block'];
        delete Blockly.Blocks['row_block'];
        delete Blockly.Blocks['statement_block'];
      });

      function testUndoConnect(
        xmlText: string,
        parentId: string,
        childId: string,
        func: (parent: Blockly.Block, child: Blockly.Block) => void,
      ) {
        const xml = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.domToWorkspace(xml, workspace);
        clock.runAll();

        const parent = workspace.getBlockById(parentId);
        assert.isNotNull(parent);
        const child = workspace.getBlockById(childId);
        assert.isNotNull(child);
        func(parent, child);
        clock.runAll();
        workspace.undo();
        clock.runAll();

        const newXml = Blockly.Xml.workspaceToDom(workspace);
        assertNodesEqual(newXml, xml);
      }

      test('Stack', function () {
        const xml =
          '<xml>' +
          '  <block type="stack_block" id="1" x="10" y="10"></block>' +
          '  <block type="stack_block" id="2" x="50" y="50"></block>' +
          '</xml>';

        testUndoConnect(xml, '1', '2', (parent, child) => {
          const targetConnection = child.previousConnection;
          assert.isNotNull(targetConnection);
          parent.nextConnection?.connect(targetConnection);
        });
      });

      test('Row', function () {
        const xml =
          '<xml>' +
          '  <block type="row_block" id="1" x="10" y="10"></block>' +
          '  <block type="row_block" id="2" x="50" y="50"></block>' +
          '</xml>';

        testUndoConnect(xml, '1', '2', (parent, child) => {
          const targetConnection = child.outputConnection;
          assert.isNotNull(targetConnection);
          parent.getInput('INPUT')?.connection?.connect(targetConnection);
        });
      });

      test('Statement', function () {
        const xml =
          '<xml>' +
          '  <block type="statement_block" id="1" x="10" y="10"></block>' +
          '  <block type="stack_block" id="2" x="50" y="50"></block>' +
          '</xml>';

        testUndoConnect(xml, '1', '2', (parent, child) => {
          const targetConnection = child.previousConnection;
          assert.isNotNull(targetConnection);
          parent.getInput('STATEMENT')?.connection?.connect(targetConnection);
        });
      });

      test('Stack w/ child', function () {
        const xml =
          '<xml>' +
          '  <block type="stack_block" id="1" x="10" y="10">' +
          '    <next>' +
          '      <block type="stack_block" id="3"></block>' +
          '    </next>' +
          '  </block>' +
          '  <block type="stack_block" id="2" x="50" y="50"></block>' +
          '</xml>';

        testUndoConnect(xml, '1', '2', (parent, child) => {
          const targetConnection = child.previousConnection;
          assert.isNotNull(targetConnection);
          parent.nextConnection?.connect(targetConnection);
        });
      });

      test('Row w/ child', function () {
        const xml =
          '<xml>' +
          '  <block type="row_block" id="1" x="10" y="10">' +
          '    <value name="INPUT">' +
          '      <block type="row_block" id="3"></block>' +
          '    </value>' +
          '  </block>' +
          '  <block type="row_block" id="2" x="50" y="50"></block>' +
          '</xml>';

        testUndoConnect(xml, '1', '2', (parent, child) => {
          const targetConnection = child.outputConnection;
          assert.isNotNull(targetConnection);
          parent.getInput('INPUT')?.connection?.connect(targetConnection);
        });
      });

      test('Statement w/ child', function () {
        const xml =
          '<xml>' +
          '  <block type="statement_block" id="1" x="10" y="10">' +
          '    <statement name="STATEMENT">' +
          '      <block type="stack_block" id="3"></block>' +
          '    </statement>' +
          '  </block>' +
          '  <block type="stack_block" id="2" x="100" y="100"></block>' +
          '</xml>';

        testUndoConnect(xml, '1', '2', (parent, child) => {
          const targetConnection = child.previousConnection;
          assert.isNotNull(targetConnection);
          parent.getInput('STATEMENT')?.connection?.connect(targetConnection);
        });
      });

      test('Stack w/ shadow', function () {
        const xml =
          '<xml>' +
          '  <block type="stack_block" id="1" x="10" y="10">' +
          '    <next>' +
          '      <shadow type="stack_block" id="3"></shadow>' +
          '    </next>' +
          '  </block>' +
          '  <block type="stack_block" id="2" x="50" y="50"></block>' +
          '</xml>';

        testUndoConnect(xml, '1', '2', (parent, child) => {
          const targetConnection = child.previousConnection;
          assert.isNotNull(targetConnection);
          parent.nextConnection?.connect(targetConnection);
        });
      });

      test('Row w/ shadow', function () {
        const xml =
          '<xml>' +
          '  <block type="row_block" id="1" x="10" y="10">' +
          '    <value name="INPUT">' +
          '      <shadow type="row_block" id="3"></shadow>' +
          '    </value>' +
          '  </block>' +
          '  <block type="row_block" id="2" x="50" y="50"></block>' +
          '</xml>';

        testUndoConnect(xml, '1', '2', (parent, child) => {
          const targetConnection = child.outputConnection;
          assert.isNotNull(targetConnection);
          parent.getInput('INPUT')?.connection?.connect(targetConnection);
        });
      });

      test('Statement w/ shadow', function () {
        const xml =
          '<xml>' +
          '  <block type="statement_block" id="1" x="10" y="10">' +
          '    <statement name="STATEMENT">' +
          '      <shadow type="stack_block" id="3"></shadow>' +
          '    </statement>' +
          '  </block>' +
          '  <block type="stack_block" id="2" x="100" y="100"></block>' +
          '</xml>';

        testUndoConnect(xml, '1', '2', (parent, child) => {
          const targetConnection = child.previousConnection;
          assert.isNotNull(targetConnection);
          parent.getInput('STATEMENT')?.connection?.connect(targetConnection);
        });
      });
    });

    suite('Undo Disconnect', function () {
      setup(function () {
        Blockly.defineBlocksWithJsonArray([
          {
            'type': 'stack_block',
            'message0': '',
            'previousStatement': null,
            'nextStatement': null,
          },
          {
            'type': 'row_block',
            'message0': '%1',
            'args0': [
              {
                'type': 'input_value',
                'name': 'INPUT',
              },
            ],
            'output': null,
          },
          {
            'type': 'statement_block',
            'message0': '%1',
            'args0': [
              {
                'type': 'input_statement',
                'name': 'STATEMENT',
              },
            ],
            'previousStatement': null,
            'nextStatement': null,
          },
        ]);
      });

      teardown(function () {
        delete Blockly.Blocks['stack_block'];
        delete Blockly.Blocks['row_block'];
        delete Blockly.Blocks['statement_block'];
      });

      function testUndoDisconnect(xmlText: string, childId: string) {
        const xml = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.domToWorkspace(xml, workspace);
        clock.runAll();

        const child = workspace.getBlockById(childId);
        if (child?.outputConnection) {
          child.outputConnection.disconnect();
        } else {
          child?.previousConnection?.disconnect();
        }
        clock.runAll();
        workspace.undo();
        clock.runAll();

        const newXml = Blockly.Xml.workspaceToDom(workspace);
        assertNodesEqual(newXml, xml);
      }

      test('Stack', function () {
        const xml =
          '<xml>' +
          '  <block type="stack_block" id="1">' +
          '    <next>' +
          '      <block type="stack_block" id="2"></block>' +
          '    </next>' +
          '  </block>' +
          '</xml>';
        testUndoDisconnect(xml, '2');
      });

      test('Row', function () {
        const xml =
          '<xml>' +
          '  <block type="row_block" id="1">' +
          '    <value name="INPUT">' +
          '      <block type="row_block" id="2"></block>' +
          '    </value>' +
          '  </block>' +
          '</xml>';
        testUndoDisconnect(xml, '2');
      });

      test('Statement', function () {
        const xml =
          '<xml>' +
          '  <block type="statement_block" id="1">' +
          '    <statement name="STATEMENT">' +
          '      <block type="stack_block" id="2"></block>' +
          '    </statement>' +
          '  </block>' +
          '</xml>';
        testUndoDisconnect(xml, '2');
      });

      test('Stack w/ child', function () {
        const xml =
          '<xml>' +
          '  <block type="stack_block" id="1">' +
          '    <next>' +
          '      <block type="stack_block" id="2">' +
          '        <next>' +
          '          <block type="stack_block" id="3"></block>' +
          '        </next>' +
          '      </block>' +
          '    </next>' +
          '  </block>' +
          '</xml>';
        testUndoDisconnect(xml, '2');
      });

      test('Row w/ child', function () {
        const xml =
          '<xml>' +
          '  <block type="row_block" id="1">' +
          '    <value name="INPUT">' +
          '      <block type="row_block" id="2">' +
          '        <value name="INPUT">' +
          '          <block type="row_block" id="3"></block>' +
          '        </value>' +
          '      </block>' +
          '    </value>' +
          '  </block>' +
          '</xml>';
        testUndoDisconnect(xml, '2');
      });

      test('Statement w/ child', function () {
        const xml =
          '<xml>' +
          '  <block type="statement_block" id="1">' +
          '    <statement name="STATEMENT">' +
          '      <block type="statement_block" id="2">' +
          '        <statement name="STATEMENT">' +
          '          <block type="stack_block" id="3"></block>' +
          '        </statement>' +
          '      </block>' +
          '    </statement>' +
          '  </block>' +
          '</xml>';
        testUndoDisconnect(xml, '2');
      });

      test('Stack w/ shadow', function () {
        // TODO: For some reason on next connections shadows are
        //   serialized second.
        const xml =
          '<xml>' +
          '  <block type="stack_block" id="1">' +
          '    <next>' +
          '      <block type="stack_block" id="2"></block>' +
          '      <shadow type="stack_block" id="3"></shadow>' +
          '    </next>' +
          '  </block>' +
          '</xml>';
        testUndoDisconnect(xml, '2');
        assert.equal(
          workspace.getAllBlocks().length,
          2,
          'expected there to only be 2 blocks on the workspace ' +
            '(check for shadows)',
        );
      });

      test('Row w/ shadow', function () {
        const xml =
          '<xml>' +
          '  <block type="row_block" id="1">' +
          '    <value name="INPUT">' +
          '      <shadow type="row_block" id="3"></shadow>' +
          '      <block type="row_block" id="2"></block>' +
          '    </value>' +
          '  </block>' +
          '</xml>';
        testUndoDisconnect(xml, '2');
        assert.equal(
          workspace.getAllBlocks().length,
          2,
          'expected there to only be 2 blocks on the workspace ' +
            '(check for shadows)',
        );
      });

      test('Statement w/ shadow', function () {
        const xml =
          '<xml>' +
          '  <block type="statement_block" id="1">' +
          '    <statement name="STATEMENT">' +
          '      <shadow type="stack_block" id="3"></shadow>' +
          '      <block type="stack_block" id="2"></block>' +
          '    </statement>' +
          '  </block>' +
          '</xml>';
        testUndoDisconnect(xml, '2');
      });
    });

    suite('Variables', function () {
      function createTwoVarsDifferentTypes(workspace: Blockly.Workspace) {
        workspace.getVariableMap().createVariable('name1', 'type1', 'id1');
        workspace.getVariableMap().createVariable('name2', 'type2', 'id2');
      }

      suite('createVariable', function () {
        test('Undo only', function () {
          createTwoVarsDifferentTypes(workspace);
          clock.runAll();

          workspace.undo();
          clock.runAll();
          assertVariableValues(workspace, 'name1', 'type1', 'id1');
          assert.isNull(workspace.getVariableMap().getVariableById('id2'));

          workspace.undo();
          assert.isNull(workspace.getVariableMap().getVariableById('id1'));
          assert.isNull(workspace.getVariableMap().getVariableById('id2'));
        });

        test('Undo and redo', function () {
          createTwoVarsDifferentTypes(workspace);
          clock.runAll();

          workspace.undo();
          clock.runAll();
          assertVariableValues(workspace, 'name1', 'type1', 'id1');
          assert.isNull(workspace.getVariableMap().getVariableById('id2'));

          workspace.redo();

          // Expect that variable 'id2' is recreated
          assertVariableValues(workspace, 'name1', 'type1', 'id1');
          assertVariableValues(workspace, 'name2', 'type2', 'id2');

          workspace.undo();
          workspace.undo();

          assert.isNull(workspace.getVariableMap().getVariableById('id1'));
          assert.isNull(workspace.getVariableMap().getVariableById('id2'));
          workspace.redo();

          // Expect that variable 'id1' is recreated
          assertVariableValues(workspace, 'name1', 'type1', 'id1');
          assert.isNull(workspace.getVariableMap().getVariableById('id2'));
        });
      });

      suite('deleteVariableById', function () {
        test('Undo only no usages', function () {
          createTwoVarsDifferentTypes(workspace);
          clock.runAll();
          const id1 = workspace.getVariableMap().getVariableById('id1');
          assert.isNotNull(id1);
          Blockly.Variables.deleteVariable(workspace, id1);
          const id2 = workspace.getVariableMap().getVariableById('id2');
          assert.isNotNull(id2);
          Blockly.Variables.deleteVariable(workspace, id2);
          clock.runAll();

          workspace.undo();
          clock.runAll();
          assert.isNull(workspace.getVariableMap().getVariableById('id1'));
          assertVariableValues(workspace, 'name2', 'type2', 'id2');

          workspace.undo();
          clock.runAll();
          assertVariableValues(workspace, 'name1', 'type1', 'id1');
          assertVariableValues(workspace, 'name2', 'type2', 'id2');
        });

        test('Undo only with usages', function () {
          createTwoVarsDifferentTypes(workspace);
          // Create blocks to refer to both of them.
          createVarBlocksNoEvents(workspace, ['id1', 'id2']);
          clock.runAll();
          const id1 = workspace.getVariableMap().getVariableById('id1');
          assert.isNotNull(id1);
          Blockly.Variables.deleteVariable(workspace, id1);
          const id2 = workspace.getVariableMap().getVariableById('id2');
          assert.isNotNull(id2);
          Blockly.Variables.deleteVariable(workspace, id2);
          clock.runAll();

          workspace.undo();
          clock.runAll();
          assertBlockVarModelName(workspace, 0, 'name2');
          assert.isNull(workspace.getVariableMap().getVariableById('id1'));
          assertVariableValues(workspace, 'name2', 'type2', 'id2');

          workspace.undo();
          clock.runAll();
          assertBlockVarModelName(workspace, 0, 'name2');
          assertBlockVarModelName(workspace, 1, 'name1');
          assertVariableValues(workspace, 'name1', 'type1', 'id1');
          assertVariableValues(workspace, 'name2', 'type2', 'id2');
        });

        test('Reference exists no usages', function () {
          createTwoVarsDifferentTypes(workspace);
          clock.runAll();
          const id1 = workspace.getVariableMap().getVariableById('id1');
          assert.isNotNull(id1);
          Blockly.Variables.deleteVariable(workspace, id1);
          const id2 = workspace.getVariableMap().getVariableById('id2');
          assert.isNotNull(id2);
          Blockly.Variables.deleteVariable(workspace, id2);
          clock.runAll();

          workspace.undo();
          clock.runAll();
          assert.isNull(workspace.getVariableMap().getVariableById('id1'));
          assertVariableValues(workspace, 'name2', 'type2', 'id2');

          workspace.redo();
          clock.runAll();
          // Expect that both variables are deleted
          assert.isNull(workspace.getVariableMap().getVariableById('id1'));
          assert.isNull(workspace.getVariableMap().getVariableById('id2'));

          workspace.undo();
          clock.runAll();
          workspace.undo();
          clock.runAll();
          assertVariableValues(workspace, 'name1', 'type1', 'id1');
          assertVariableValues(workspace, 'name2', 'type2', 'id2');

          workspace.redo();
          clock.runAll();
          // Expect that variable 'id2' is recreated
          assert.isNull(workspace.getVariableMap().getVariableById('id1'));
          assertVariableValues(workspace, 'name2', 'type2', 'id2');
        });

        test('Reference exists with usages', function () {
          createTwoVarsDifferentTypes(workspace);
          // Create blocks to refer to both of them.
          createVarBlocksNoEvents(workspace, ['id1', 'id2']);
          clock.runAll();
          const id1 = workspace.getVariableMap().getVariableById('id1');
          assert.isNotNull(id1);
          Blockly.Variables.deleteVariable(workspace, id1);
          const id2 = workspace.getVariableMap().getVariableById('id2');
          assert.isNotNull(id2);
          Blockly.Variables.deleteVariable(workspace, id2);
          clock.runAll();

          workspace.undo();
          clock.runAll();
          assertBlockVarModelName(workspace, 0, 'name2');
          assert.isNull(workspace.getVariableMap().getVariableById('id1'));
          assertVariableValues(workspace, 'name2', 'type2', 'id2');

          workspace.redo();
          clock.runAll();
          // Expect that both variables are deleted
          assert.equal(workspace.getTopBlocks(false).length, 0);
          assert.isNull(workspace.getVariableMap().getVariableById('id1'));
          assert.isNull(workspace.getVariableMap().getVariableById('id2'));

          workspace.undo();
          clock.runAll();
          workspace.undo();
          clock.runAll();
          assertBlockVarModelName(workspace, 0, 'name2');
          assertBlockVarModelName(workspace, 1, 'name1');
          assertVariableValues(workspace, 'name1', 'type1', 'id1');
          assertVariableValues(workspace, 'name2', 'type2', 'id2');

          workspace.redo();
          clock.runAll();
          // Expect that variable 'id2' is recreated
          assertBlockVarModelName(workspace, 0, 'name2');
          assert.isNull(workspace.getVariableMap().getVariableById('id1'));
          assertVariableValues(workspace, 'name2', 'type2', 'id2');
        });
      });

      suite('renameVariable', function () {
        setup(function () {
          workspace.getVariableMap().createVariable('name1', 'type1', 'id1');
        });

        test('Reference exists no usages rename to name2', function () {
          const id1 = workspace.getVariableMap().getVariableById('id1');
          assert.isNotNull(id1);
          workspace.getVariableMap().renameVariable(id1, 'name2');
          clock.runAll();

          workspace.undo();
          clock.runAll();
          assertVariableValues(
            workspace.getVariableMap(),
            'name1',
            'type1',
            'id1',
          );

          workspace.redo();
          clock.runAll();
          assertVariableValues(
            workspace.getVariableMap(),
            'name2',
            'type1',
            'id1',
          );
        });

        test('Reference exists with usages rename to name2', function () {
          createVarBlocksNoEvents(workspace, ['id1']);
          const id1 = workspace.getVariableMap().getVariableById('id1');
          assert.isNotNull(id1);
          workspace.getVariableMap().renameVariable(id1, 'name2');
          clock.runAll();

          workspace.undo();
          clock.runAll();
          assertBlockVarModelName(workspace, 0, 'name1');
          assertVariableValues(
            workspace.getVariableMap(),
            'name1',
            'type1',
            'id1',
          );

          workspace.redo();
          clock.runAll();
          assertBlockVarModelName(workspace, 0, 'name2');
          assertVariableValues(
            workspace.getVariableMap(),
            'name2',
            'type1',
            'id1',
          );
        });

        test('Reference exists different capitalization no usages rename to Name1', function () {
          const id1 = workspace.getVariableMap().getVariableById('id1');
          assert.isNotNull(id1);
          workspace.getVariableMap().renameVariable(id1, 'Name1');
          clock.runAll();

          workspace.undo();
          clock.runAll();
          assertVariableValues(
            workspace.getVariableMap(),
            'name1',
            'type1',
            'id1',
          );

          workspace.redo();
          clock.runAll();
          assertVariableValues(
            workspace.getVariableMap(),
            'Name1',
            'type1',
            'id1',
          );
        });

        test('Reference exists different capitalization with usages rename to Name1', function () {
          createVarBlocksNoEvents(workspace, ['id1']);
          const id1 = workspace.getVariableMap().getVariableById('id1');
          assert.isNotNull(id1);
          workspace.getVariableMap().renameVariable(id1, 'Name1');
          clock.runAll();

          workspace.undo();
          clock.runAll();
          assertBlockVarModelName(workspace, 0, 'name1');
          assertVariableValues(
            workspace.getVariableMap(),
            'name1',
            'type1',
            'id1',
          );

          workspace.redo();
          clock.runAll();
          assertBlockVarModelName(workspace, 0, 'Name1');
          assertVariableValues(
            workspace.getVariableMap(),
            'Name1',
            'type1',
            'id1',
          );
        });

        suite('Two variables rename overlap', function () {
          test('Same type no usages rename variable with id1 to name2', function () {
            workspace.getVariableMap().createVariable('name2', 'type1', 'id2');
            const id1 = workspace.getVariableMap().getVariableById('id1');
            assert.isNotNull(id1);
            workspace.getVariableMap().renameVariable(id1, 'name2');
            clock.runAll();

            workspace.undo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'name1',
              'type1',
              'id1',
            );
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type1',
              'id2',
            );

            workspace.redo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type1',
              'id2',
            );
            assert.isNull(workspace.getVariableMap().getVariableById('id1'));
          });

          test('Same type with usages rename variable with id1 to name2', function () {
            workspace.getVariableMap().createVariable('name2', 'type1', 'id2');
            createVarBlocksNoEvents(workspace, ['id1', 'id2']);
            const id1 = workspace.getVariableMap().getVariableById('id1');
            assert.isNotNull(id1);
            workspace.getVariableMap().renameVariable(id1, 'name2');
            clock.runAll();

            workspace.undo();
            clock.runAll();
            assertBlockVarModelName(workspace, 0, 'name1');
            assertBlockVarModelName(workspace, 1, 'name2');
            assertVariableValues(
              workspace.getVariableMap(),
              'name1',
              'type1',
              'id1',
            );
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type1',
              'id2',
            );

            workspace.redo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type1',
              'id2',
            );
            assert.isNull(workspace.getVariableMap().getVariableById('id1'));
          });

          test('Same type different capitalization no usages rename variable with id1 to Name2', function () {
            workspace.getVariableMap().createVariable('name2', 'type1', 'id2');
            const id1 = workspace.getVariableMap().getVariableById('id1');
            assert.isNotNull(id1);
            workspace.getVariableMap().renameVariable(id1, 'Name2');
            clock.runAll();

            workspace.undo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'name1',
              'type1',
              'id1',
            );
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type1',
              'id2',
            );

            workspace.redo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'Name2',
              'type1',
              'id2',
            );
            assert.isNull(workspace.getVariableMap().getVariable('name1'));
          });

          test('Same type different capitalization with usages rename variable with id1 to Name2', function () {
            workspace.getVariableMap().createVariable('name2', 'type1', 'id2');
            createVarBlocksNoEvents(workspace, ['id1', 'id2']);
            const id1 = workspace.getVariableMap().getVariableById('id1');
            assert.isNotNull(id1);
            workspace.getVariableMap().renameVariable(id1, 'Name2');
            clock.runAll();

            workspace.undo();
            clock.runAll();
            assertBlockVarModelName(workspace, 0, 'name1');
            assertBlockVarModelName(workspace, 1, 'name2');
            assertVariableValues(
              workspace.getVariableMap(),
              'name1',
              'type1',
              'id1',
            );
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type1',
              'id2',
            );

            workspace.redo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'Name2',
              'type1',
              'id2',
            );
            assert.isNull(workspace.getVariableMap().getVariableById('id1'));
            assertBlockVarModelName(workspace, 0, 'Name2');
            assertBlockVarModelName(workspace, 1, 'Name2');
          });

          test('Different type no usages rename variable with id1 to name2', function () {
            workspace.getVariableMap().createVariable('name2', 'type2', 'id2');
            const id1 = workspace.getVariableMap().getVariableById('id1');
            assert.isNotNull(id1);
            workspace.getVariableMap().renameVariable(id1, 'name2');
            clock.runAll();

            workspace.undo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'name1',
              'type1',
              'id1',
            );
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type2',
              'id2',
            );

            workspace.redo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type1',
              'id1',
            );
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type2',
              'id2',
            );
          });

          test('Different type with usages rename variable with id1 to name2', function () {
            workspace.getVariableMap().createVariable('name2', 'type2', 'id2');
            createVarBlocksNoEvents(workspace, ['id1', 'id2']);
            const id1 = workspace.getVariableMap().getVariableById('id1');
            assert.isNotNull(id1);
            workspace.getVariableMap().renameVariable(id1, 'name2');
            clock.runAll();

            workspace.undo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'name1',
              'type1',
              'id1',
            );
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type2',
              'id2',
            );
            assertBlockVarModelName(workspace, 0, 'name1');
            assertBlockVarModelName(workspace, 1, 'name2');

            workspace.redo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type1',
              'id1',
            );
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type2',
              'id2',
            );
            assertBlockVarModelName(workspace, 0, 'name2');
            assertBlockVarModelName(workspace, 1, 'name2');
          });

          test('Different type different capitalization no usages rename variable with id1 to Name2', function () {
            workspace.getVariableMap().createVariable('name2', 'type2', 'id2');
            const id1 = workspace.getVariableMap().getVariableById('id1');
            assert.isNotNull(id1);
            workspace.getVariableMap().renameVariable(id1, 'Name2');
            clock.runAll();

            workspace.undo();
            clock.runAll();
            assertVariableValues(workspace, 'name1', 'type1', 'id1');
            assertVariableValues(workspace, 'name2', 'type2', 'id2');

            workspace.redo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'Name2',
              'type1',
              'id1',
            );
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type2',
              'id2',
            );
          });

          test('Different type different capitalization with usages rename variable with id1 to Name2', function () {
            workspace.getVariableMap().createVariable('name2', 'type2', 'id2');
            createVarBlocksNoEvents(workspace, ['id1', 'id2']);
            const id1 = workspace.getVariableMap().getVariableById('id1');
            assert.isNotNull(id1);
            workspace.getVariableMap().renameVariable(id1, 'Name2');
            clock.runAll();

            workspace.undo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'name1',
              'type1',
              'id1',
            );
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type2',
              'id2',
            );
            assertBlockVarModelName(workspace, 0, 'name1');
            assertBlockVarModelName(workspace, 1, 'name2');

            workspace.redo();
            clock.runAll();
            assertVariableValues(
              workspace.getVariableMap(),
              'Name2',
              'type1',
              'id1',
            );
            assertVariableValues(
              workspace.getVariableMap(),
              'name2',
              'type2',
              'id2',
            );
            assertBlockVarModelName(workspace, 0, 'Name2');
            assertBlockVarModelName(workspace, 1, 'name2');
          });
        });
      });
    });
  });
}
