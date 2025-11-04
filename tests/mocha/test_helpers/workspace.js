/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as eventUtils from '../../../build/src/core/events/utils.js';
import {assert} from '../../../node_modules/chai/index.js';
import {workspaceTeardown} from './setup_teardown.js';
import {assertVariableValues} from './variables.js';
import {assertWarnings} from './warnings.js';

export function testAWorkspace() {
  setup(function () {
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
    this.variableMap = this.workspace.getVariableMap();
  });

  teardown(function () {
    // Clear Blockly.Event state.
    eventUtils.setGroup(false);
    while (!eventUtils.isEnabled()) {
      eventUtils.enable();
    }
    sinon.restore();
  });

  function assertBlockVarModelName(workspace, blockIndex, name) {
    const block = workspace.getTopBlocks(false)[blockIndex];
    assert.exists(block, 'Block at topBlocks[' + blockIndex + ']');
    const varModel = block.getVarModels()[0];
    assert.exists(
      varModel,
      'VariableModel for block at topBlocks[' + blockIndex + ']',
    );
    const blockVarName = varModel.name;
    assert.equal(
      blockVarName,
      name,
      'VariableModel name for block at topBlocks[' + blockIndex + ']',
    );
  }

  function createVarBlocksNoEvents(workspace, ids) {
    const blocks = [];
    // Turn off events to avoid testing XML at the same time.
    eventUtils.disable();
    for (let i = 0, id; (id = ids[i]); i++) {
      const block = new Blockly.Block(workspace, 'get_var_block');
      block.inputList[0].fieldRow[0].setValue(id);
      blocks.push(block);
    }
    eventUtils.enable();
    return blocks;
  }

  suite('clear', function () {
    test('Trivial', function () {
      sinon.stub(eventUtils.TEST_ONLY, 'setGroupInternal').returns(null);
      this.variableMap.createVariable('name1', 'type1', 'id1');
      this.variableMap.createVariable('name2', 'type2', 'id2');
      this.workspace.newBlock('');

      this.workspace.clear();
      assert.equal(this.workspace.getTopBlocks(false).length, 0);
      const varMapLength = this.variableMap.variableMap.size;
      assert.equal(varMapLength, 0);
    });

    test('No variables', function () {
      sinon.stub(eventUtils.TEST_ONLY, 'setGroupInternal').returns(null);
      this.workspace.newBlock('');

      this.workspace.clear();
      assert.equal(this.workspace.getTopBlocks(false).length, 0);
      const varMapLength = this.variableMap.variableMap.size;
      assert.equal(varMapLength, 0);
    });
  });

  suite('deleteVariable', function () {
    setup(function () {
      // Create two variables of different types.
      this.var1 = this.variableMap.createVariable('name1', 'type1', 'id1');
      this.var2 = this.variableMap.createVariable('name2', 'type2', 'id2');
      // Create blocks to refer to both of them.
      createVarBlocksNoEvents(this.workspace, ['id1', 'id1', 'id2']);
    });

    test('deleteVariableById(id2) one usage', function () {
      // Deleting variable one usage should not trigger confirm dialog.
      const stub = sinon.stub(window, 'confirm').returns(true);
      this.variableMap.deleteVariableById('id2');

      sinon.assert.notCalled(stub);
      const variable = this.variableMap.getVariableById('id2');
      assert.isNull(variable);
      assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
      assertBlockVarModelName(this.workspace, 0, 'name1');

      stub.restore();
    });

    test('deleteVariableById(id1) multiple usages confirm', function () {
      // Deleting variable with multiple usages triggers confirm dialog.
      const stub = sinon.stub(window, 'confirm').returns(true);
      this.variableMap.deleteVariableById('id1');

      sinon.assert.calledOnce(stub);
      const variable = this.variableMap.getVariableById('id1');
      assert.isNull(variable);
      assertVariableValues(this.variableMap, 'name2', 'type2', 'id2');
      assertBlockVarModelName(this.workspace, 0, 'name2');

      stub.restore();
    });

    test('deleteVariableById(id1) multiple usages cancel', function () {
      // Deleting variable with multiple usages triggers confirm dialog.
      const stub = sinon.stub(window, 'confirm').returns(false);
      this.variableMap.deleteVariableById('id1');

      sinon.assert.calledOnce(stub);
      assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
      assertVariableValues(this.variableMap, 'name2', 'type2', 'id2');
      assertBlockVarModelName(this.workspace, 0, 'name1');
      assertBlockVarModelName(this.workspace, 1, 'name1');
      assertBlockVarModelName(this.workspace, 2, 'name2');

      stub.restore();
    });
  });

  suite('renameVariableById', function () {
    setup(function () {
      this.variableMap.createVariable('name1', 'type1', 'id1');
    });

    test('No references rename to name2', function () {
      this.variableMap.renameVariableById('id1', 'name2');
      assertVariableValues(this.variableMap, 'name2', 'type1', 'id1');
      // Renaming should not have created a new variable.
      assert.equal(this.variableMap.getAllVariables().length, 1);
    });

    test('Reference exists rename to name2', function () {
      createVarBlocksNoEvents(this.workspace, ['id1']);

      this.variableMap.renameVariableById('id1', 'name2');
      assertVariableValues(this.variableMap, 'name2', 'type1', 'id1');
      // Renaming should not have created a new variable.
      assert.equal(this.variableMap.getAllVariables().length, 1);
      assertBlockVarModelName(this.workspace, 0, 'name2');
    });

    test('Reference exists different capitalization rename to Name1', function () {
      createVarBlocksNoEvents(this.workspace, ['id1']);

      this.variableMap.renameVariableById('id1', 'Name1');
      assertVariableValues(this.variableMap, 'Name1', 'type1', 'id1');
      // Renaming should not have created a new variable.
      assert.equal(this.variableMap.getAllVariables().length, 1);
      assertBlockVarModelName(this.workspace, 0, 'Name1');
    });

    suite('Two variables rename overlap', function () {
      test('Same type rename variable with id1 to name2', function () {
        this.variableMap.createVariable('name2', 'type1', 'id2');
        createVarBlocksNoEvents(this.workspace, ['id1', 'id2']);

        this.variableMap.renameVariableById('id1', 'name2');

        // The second variable should remain unchanged.
        assertVariableValues(this.workspace, 'name2', 'type1', 'id2');
        // The first variable should have been deleted.
        const variable = this.variableMap.getVariableById('id1');
        assert.isNull(variable);
        // There should only be one variable left.
        assert.equal(this.variableMap.getAllVariables().length, 1);

        // Both blocks should now reference variable with name2.
        assertBlockVarModelName(this.workspace, 0, 'name2');
        assertBlockVarModelName(this.workspace, 1, 'name2');
      });

      test('Different type rename variable with id1 to name2', function () {
        this.variableMap.createVariable('name2', 'type2', 'id2');
        createVarBlocksNoEvents(this.workspace, ['id1', 'id2']);

        this.variableMap.renameVariableById('id1', 'name2');

        // Variables with different type are allowed to have the same name.
        assertVariableValues(this.variableMap, 'name2', 'type1', 'id1');
        assertVariableValues(this.variableMap, 'name2', 'type2', 'id2');

        // Both blocks should now reference variable with name2.
        assertBlockVarModelName(this.workspace, 0, 'name2');
        assertBlockVarModelName(this.workspace, 1, 'name2');
      });

      test('Same type different capitalization rename variable with id1 to Name2', function () {
        this.variableMap.createVariable('name2', 'type1', 'id2');
        createVarBlocksNoEvents(this.workspace, ['id1', 'id2']);

        this.variableMap.renameVariableById('id1', 'Name2');

        // The second variable should be updated.
        assertVariableValues(this.variableMap, 'Name2', 'type1', 'id2');
        // The first variable should have been deleted.
        const variable = this.variableMap.getVariableById('id1');
        assert.isNull(variable);
        // There should only be one variable left.
        assert.equal(this.variableMap.getAllVariables().length, 1);

        // Both blocks should now reference variable with Name2.
        assertBlockVarModelName(this.workspace, 0, 'Name2');
        assertBlockVarModelName(this.workspace, 1, 'Name2');
      });

      test('Different type different capitalization rename variable with id1 to Name2', function () {
        this.variableMap.createVariable('name2', 'type2', 'id2');
        createVarBlocksNoEvents(this.workspace, ['id1', 'id2']);

        this.variableMap.renameVariableById('id1', 'Name2');

        // Variables with different type are allowed to have the same name.
        assertVariableValues(this.variableMap, 'Name2', 'type1', 'id1');
        // Second variable should remain unchanged.
        assertVariableValues(this.variableMap, 'name2', 'type2', 'id2');

        // Only first block should use new capitalization.
        assertBlockVarModelName(this.workspace, 0, 'Name2');
        assertBlockVarModelName(this.workspace, 1, 'name2');
      });
    });
  });

  suite('getTopBlocks(ordered=true)', function () {
    test('Empty workspace', function () {
      assert.equal(this.workspace.getTopBlocks(true).length, 0);
    });

    test('Flat workspace one block', function () {
      this.workspace.newBlock('');
      assert.equal(this.workspace.getTopBlocks(true).length, 1);
    });

    test('Flat workspace one block after dispose', function () {
      const blockA = this.workspace.newBlock('');
      this.workspace.newBlock('');
      blockA.dispose();
      assert.equal(this.workspace.getTopBlocks(true).length, 1);
    });

    test('Flat workspace two blocks', function () {
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      assert.equal(this.workspace.getTopBlocks(true).length, 2);
    });

    test('Clear', function () {
      this.workspace.clear();
      assert.equal(
        this.workspace.getTopBlocks(true).length,
        0,
        'Clear empty workspace',
      );
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.clear();
      assert.equal(this.workspace.getTopBlocks(true).length, 0);
    });
  });

  suite('getTopBlocks(ordered=false)', function () {
    test('Empty workspace', function () {
      assert.equal(this.workspace.getTopBlocks(false).length, 0);
    });

    test('Flat workspace one block', function () {
      this.workspace.newBlock('');
      assert.equal(this.workspace.getTopBlocks(false).length, 1);
    });

    test('Flat workspace one block after dispose', function () {
      const blockA = this.workspace.newBlock('');
      this.workspace.newBlock('');
      blockA.dispose();
      assert.equal(this.workspace.getTopBlocks(false).length, 1);
    });

    test('Flat workspace two blocks', function () {
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      assert.equal(this.workspace.getTopBlocks(false).length, 2);
    });

    test('Clear empty workspace', function () {
      this.workspace.clear();
      assert.equal(this.workspace.getTopBlocks(false).length, 0);
    });

    test('Clear non-empty workspace', function () {
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.clear();
      assert.equal(this.workspace.getTopBlocks(false).length, 0);
    });
  });

  suite('getAllBlocks', function () {
    test('Empty workspace', function () {
      assert.equal(this.workspace.getAllBlocks(true).length, 0);
    });

    test('Flat workspace one block', function () {
      this.workspace.newBlock('');
      assert.equal(this.workspace.getAllBlocks(true).length, 1);
    });

    test('Flat workspace one block after dispose', function () {
      const blockA = this.workspace.newBlock('');
      this.workspace.newBlock('');
      blockA.dispose();
      assert.equal(this.workspace.getAllBlocks(true).length, 1);
    });

    test('Flat workspace two blocks', function () {
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      assert.equal(this.workspace.getAllBlocks(true).length, 2);
    });

    test('Clear', function () {
      this.workspace.clear();
      assert.equal(
        this.workspace.getAllBlocks(true).length,
        0,
        'Clear empty workspace',
      );
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.clear();
      assert.equal(this.workspace.getAllBlocks(true).length, 0);
    });
  });

  suite('remainingCapacity', function () {
    setup(function () {
      this.workspace.newBlock('');
      this.workspace.newBlock('');
    });

    test('No block limit', function () {
      assert.equal(this.workspace.remainingCapacity(), Infinity);
    });

    test('Under block limit', function () {
      this.workspace.options.maxBlocks = 3;
      assert.equal(this.workspace.remainingCapacity(), 1);
      this.workspace.options.maxBlocks = 4;
      assert.equal(this.workspace.remainingCapacity(), 2);
    });

    test('At block limit', function () {
      this.workspace.options.maxBlocks = 2;
      assert.equal(this.workspace.remainingCapacity(), 0);
    });

    test('At block limit of 0 after clear', function () {
      this.workspace.options.maxBlocks = 0;
      this.workspace.clear();
      assert.equal(this.workspace.remainingCapacity(), 0);
    });

    test('Over block limit', function () {
      this.workspace.options.maxBlocks = 1;
      assert.equal(this.workspace.remainingCapacity(), -1);
    });

    test('Over block limit of 0', function () {
      this.workspace.options.maxBlocks = 0;
      assert.equal(this.workspace.remainingCapacity(), -2);
    });
  });

  suite('remainingCapacityOfType', function () {
    setup(function () {
      this.workspace.newBlock('get_var_block');
      this.workspace.newBlock('get_var_block');
      this.workspace.options.maxInstances = {};
    });

    test('No instance limit', function () {
      assert.equal(
        this.workspace.remainingCapacityOfType('get_var_block'),
        Infinity,
      );
    });

    test('Under instance limit', function () {
      this.workspace.options.maxInstances['get_var_block'] = 3;
      assert.equal(
        this.workspace.remainingCapacityOfType('get_var_block'),
        1,
        'With maxInstances limit 3',
      );
      this.workspace.options.maxInstances['get_var_block'] = 4;
      assert.equal(
        this.workspace.remainingCapacityOfType('get_var_block'),
        2,
        'With maxInstances limit 4',
      );
    });

    test('Under instance limit with multiple block types', function () {
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.options.maxInstances['get_var_block'] = 3;
      assert.equal(
        this.workspace.remainingCapacityOfType('get_var_block'),
        1,
        'With maxInstances limit 3',
      );
      this.workspace.options.maxInstances['get_var_block'] = 4;
      assert.equal(
        this.workspace.remainingCapacityOfType('get_var_block'),
        2,
        'With maxInstances limit 4',
      );
    });

    test('At instance limit', function () {
      this.workspace.options.maxInstances['get_var_block'] = 2;
      assert.equal(
        this.workspace.remainingCapacityOfType('get_var_block'),
        0,
        'With maxInstances limit 2',
      );
    });

    test('At instance limit of 0 after clear', function () {
      this.workspace.clear();
      this.workspace.options.maxInstances['get_var_block'] = 0;
      assert.equal(this.workspace.remainingCapacityOfType('get_var_block'), 0);
    });

    test('At instance limit with multiple block types', function () {
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.options.maxInstances['get_var_block'] = 2;
      assert.equal(
        this.workspace.remainingCapacityOfType('get_var_block'),
        0,
        'With maxInstances limit 2',
      );
    });

    test('At instance limit of 0 with multiple block types', function () {
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.options.maxInstances['get_var_block'] = 0;
      this.workspace.clear();
      assert.equal(this.workspace.remainingCapacityOfType('get_var_block'), 0);
    });

    test('Over instance limit', function () {
      this.workspace.options.maxInstances['get_var_block'] = 1;
      assert.equal(
        this.workspace.remainingCapacityOfType('get_var_block'),
        -1,
        'With maxInstances limit 1',
      );
    });

    test('Over instance limit of 0', function () {
      this.workspace.options.maxInstances['get_var_block'] = 0;
      assert.equal(
        this.workspace.remainingCapacityOfType('get_var_block'),
        -2,
        'With maxInstances limit 0',
      );
    });

    test('Over instance limit with multiple block types', function () {
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.options.maxInstances['get_var_block'] = 1;
      assert.equal(
        this.workspace.remainingCapacityOfType('get_var_block'),
        -1,
        'With maxInstances limit 1',
      );
    });

    test('Over instance limit of 0 with multiple block types', function () {
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.newBlock('');
      this.workspace.options.maxInstances['get_var_block'] = 0;
      assert.equal(
        this.workspace.remainingCapacityOfType('get_var_block'),
        -2,
        'With maxInstances limit 0',
      );
    });
  });

  suite('isCapacityAvailable', function () {
    setup(function () {
      this.workspace.newBlock('get_var_block');
      this.workspace.newBlock('get_var_block');
      this.workspace.options.maxInstances = {};
    });

    test('Under block limit and no instance limit', function () {
      this.workspace.options.maxBlocks = 3;
      const typeCountsMap = {'get_var_block': 1};
      assert.isTrue(this.workspace.isCapacityAvailable(typeCountsMap));
    });

    test('At block limit and no instance limit', function () {
      this.workspace.options.maxBlocks = 2;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(this.workspace.isCapacityAvailable(typeCountsMap));
    });

    test('Over block limit of 0 and no instance limit', function () {
      this.workspace.options.maxBlocks = 0;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(this.workspace.isCapacityAvailable(typeCountsMap));
    });

    test('Over block limit but under instance limit', function () {
      this.workspace.options.maxBlocks = 1;
      this.workspace.options.maxInstances['get_var_block'] = 3;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(
        this.workspace.isCapacityAvailable(typeCountsMap),
        'With maxBlocks limit 1 and maxInstances limit 3',
      );
    });

    test('Over block limit of 0 but under instance limit', function () {
      this.workspace.options.maxBlocks = 0;
      this.workspace.options.maxInstances['get_var_block'] = 3;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(
        this.workspace.isCapacityAvailable(typeCountsMap),
        'With maxBlocks limit 0 and maxInstances limit 3',
      );
    });

    test('Over block limit but at instance limit', function () {
      this.workspace.options.maxBlocks = 1;
      this.workspace.options.maxInstances['get_var_block'] = 2;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(
        this.workspace.isCapacityAvailable(typeCountsMap),
        'With maxBlocks limit 1 and maxInstances limit 2',
      );
    });

    test('Over block limit and over instance limit', function () {
      this.workspace.options.maxBlocks = 1;
      this.workspace.options.maxInstances['get_var_block'] = 1;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(
        this.workspace.isCapacityAvailable(typeCountsMap),
        'With maxBlocks limit 1 and maxInstances limit 1',
      );
    });

    test('Over block limit of 0 and over instance limit', function () {
      this.workspace.options.maxBlocks = 0;
      this.workspace.options.maxInstances['get_var_block'] = 1;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(
        this.workspace.isCapacityAvailable(typeCountsMap),
        'With maxBlocks limit 0 and maxInstances limit 1',
      );
    });

    test('Over block limit and over instance limit of 0', function () {
      this.workspace.options.maxBlocks = 1;
      this.workspace.options.maxInstances['get_var_block'] = 0;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(
        this.workspace.isCapacityAvailable(typeCountsMap),
        'With maxBlocks limit 1 and maxInstances limit 0',
      );
    });

    test('Over block limit of 0 and over instance limit of 0', function () {
      this.workspace.options.maxBlocks = 0;
      this.workspace.options.maxInstances['get_var_block'] = 0;
      const typeCountsMap = {'get_var_block': 1};
      assert.isFalse(this.workspace.isCapacityAvailable(typeCountsMap));
    });
  });

  suite('getById', function () {
    setup(function () {
      this.workspaceB = this.workspace.rendered
        ? new Blockly.WorkspaceSvg(new Blockly.Options({}))
        : new Blockly.Workspace();
    });

    teardown(function () {
      workspaceTeardown.call(this, this.workspaceB);
    });

    test('Trivial', function () {
      assert.equal(
        Blockly.Workspace.getById(this.workspace.id),
        this.workspace,
        'Find workspace',
      );
      assert.equal(
        Blockly.Workspace.getById(this.workspaceB.id),
        this.workspaceB,
        'Find workspaceB',
      );
    });

    test('Null id', function () {
      assert.isNull(Blockly.Workspace.getById(null));
    });

    test('Non-existent id', function () {
      assert.isNull(Blockly.Workspace.getById('badId'));
    });

    test('After dispose', function () {
      this.workspaceB.dispose();
      assert.isNull(Blockly.Workspace.getById(this.workspaceB.id));
    });
  });

  suite('getBlockById', function () {
    setup(function () {
      this.blockA = this.workspace.newBlock('');
      this.blockB = this.workspace.newBlock('');
      this.workspaceB = this.workspace.rendered
        ? new Blockly.WorkspaceSvg(new Blockly.Options({}))
        : new Blockly.Workspace();
    });

    teardown(function () {
      workspaceTeardown.call(this, this.workspaceB);
    });

    test('Trivial', function () {
      assert.equal(this.workspace.getBlockById(this.blockA.id), this.blockA);
      assert.equal(this.workspace.getBlockById(this.blockB.id), this.blockB);
    });

    test('Null id', function () {
      assert.isNull(this.workspace.getBlockById(null));
    });

    test('Non-existent id', function () {
      assert.isNull(this.workspace.getBlockById('badId'));
    });

    test('After dispose', function () {
      this.blockA.dispose();
      assert.isNull(this.workspace.getBlockById(this.blockA.id));
      assert.equal(this.workspace.getBlockById(this.blockB.id), this.blockB);
    });

    test('After clear', function () {
      this.workspace.clear();
      assert.isNull(this.workspace.getBlockById(this.blockA.id));
      assert.isNull(this.workspace.getBlockById(this.blockB.id));
    });
  });

  suite('Undo/Redo', function () {
    /**
     * Assert that two nodes are equal.
     * @param {!Element} actual the actual node.
     * @param {!Element} expected the expected node.
     */
    function assertNodesEqual(actual, expected) {
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

      function testUndoDelete(xmlText) {
        const xml = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.domToBlock(xml, this.workspace);
        this.workspace.getTopBlocks()[0].dispose(false);
        this.clock.runAll();
        this.workspace.undo();
        this.clock.runAll();
        const newXml = Blockly.Xml.workspaceToDom(this.workspace);
        assertNodesEqual(newXml.firstChild, xml);
      }

      test('Stack', function () {
        testUndoDelete.call(this, '<block type="stack_block" id="1"/>');
      });

      test('Row', function () {
        testUndoDelete.call(this, '<block type="row_block" id="1"/>');
      });

      test('Statement', function () {
        testUndoDelete.call(this, '<block type="statement_block" id="1"/>');
      });

      test('Stack w/ child', function () {
        testUndoDelete.call(
          this,
          '<block type="stack_block" id="1">' +
            '  <next>' +
            '    <block type="stack_block" id="2"></block>' +
            '  </next>' +
            '</block>',
        );
      });

      test('Row w/ child', function () {
        testUndoDelete.call(
          this,
          '<block type="row_block" id="1">' +
            '  <value name="INPUT">' +
            '    <block type="row_block" id="2"></block>' +
            '  </value>' +
            '</block>',
        );
      });

      test('Statement w/ child', function () {
        testUndoDelete.call(
          this,
          '<block type="statement_block" id="1">' +
            '  <statement name="STATEMENT">' +
            '    <block type="stack_block" id="2"></block>' +
            '  </statement>' +
            '</block>',
        );
      });

      test('Stack w/ shadow', function () {
        testUndoDelete.call(
          this,
          '<block type="stack_block" id="1">' +
            '  <next>' +
            '    <shadow type="stack_block" id="2"></shadow>' +
            '  </next>' +
            '</block>',
        );
      });

      test('Row w/ shadow', function () {
        testUndoDelete.call(
          this,
          '<block type="row_block" id="1">' +
            '  <value name="INPUT">' +
            '    <shadow type="row_block" id="2"></shadow>' +
            '  </value>' +
            '</block>',
        );
      });

      test('Statement w/ shadow', function () {
        testUndoDelete.call(
          this,
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

      function testUndoConnect(xmlText, parentId, childId, func) {
        const xml = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.domToWorkspace(xml, this.workspace);
        this.clock.runAll();

        const parent = this.workspace.getBlockById(parentId);
        const child = this.workspace.getBlockById(childId);
        func.call(this, parent, child);
        this.clock.runAll();
        this.workspace.undo();
        this.clock.runAll();

        const newXml = Blockly.Xml.workspaceToDom(this.workspace);
        assertNodesEqual(newXml, xml);
      }

      test('Stack', function () {
        const xml =
          '<xml>' +
          '  <block type="stack_block" id="1" x="10" y="10"></block>' +
          '  <block type="stack_block" id="2" x="50" y="50"></block>' +
          '</xml>';

        testUndoConnect.call(this, xml, '1', '2', (parent, child) => {
          parent.nextConnection.connect(child.previousConnection);
        });
      });

      test('Row', function () {
        const xml =
          '<xml>' +
          '  <block type="row_block" id="1" x="10" y="10"></block>' +
          '  <block type="row_block" id="2" x="50" y="50"></block>' +
          '</xml>';

        testUndoConnect.call(this, xml, '1', '2', (parent, child) => {
          parent.getInput('INPUT').connection.connect(child.outputConnection);
        });
      });

      test('Statement', function () {
        const xml =
          '<xml>' +
          '  <block type="statement_block" id="1" x="10" y="10"></block>' +
          '  <block type="stack_block" id="2" x="50" y="50"></block>' +
          '</xml>';

        testUndoConnect.call(this, xml, '1', '2', (parent, child) => {
          parent
            .getInput('STATEMENT')
            .connection.connect(child.previousConnection);
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

        testUndoConnect.call(this, xml, '1', '2', (parent, child) => {
          parent.nextConnection.connect(child.previousConnection);
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

        testUndoConnect.call(this, xml, '1', '2', (parent, child) => {
          parent.getInput('INPUT').connection.connect(child.outputConnection);
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

        testUndoConnect.call(this, xml, '1', '2', (parent, child) => {
          parent
            .getInput('STATEMENT')
            .connection.connect(child.previousConnection);
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

        testUndoConnect.call(this, xml, '1', '2', (parent, child) => {
          parent.nextConnection.connect(child.previousConnection);
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

        testUndoConnect.call(this, xml, '1', '2', (parent, child) => {
          parent.getInput('INPUT').connection.connect(child.outputConnection);
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

        testUndoConnect.call(this, xml, '1', '2', (parent, child) => {
          parent
            .getInput('STATEMENT')
            .connection.connect(child.previousConnection);
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

      function testUndoDisconnect(xmlText, childId) {
        const xml = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.domToWorkspace(xml, this.workspace);
        this.clock.runAll();

        const child = this.workspace.getBlockById(childId);
        if (child.outputConnection) {
          child.outputConnection.disconnect();
        } else {
          child.previousConnection.disconnect();
        }
        this.clock.runAll();
        this.workspace.undo();
        this.clock.runAll();

        const newXml = Blockly.Xml.workspaceToDom(this.workspace);
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
        testUndoDisconnect.call(this, xml, '2');
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
        testUndoDisconnect.call(this, xml, '2');
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
        testUndoDisconnect.call(this, xml, '2');
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
        testUndoDisconnect.call(this, xml, '2');
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
        testUndoDisconnect.call(this, xml, '2');
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
        testUndoDisconnect.call(this, xml, '2');
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
        testUndoDisconnect.call(this, xml, '2');
        assert.equal(
          this.workspace.getAllBlocks().length,
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
        testUndoDisconnect.call(this, xml, '2');
        assert.equal(
          this.workspace.getAllBlocks().length,
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
        testUndoDisconnect.call(this, xml, '2');
      });
    });

    suite('Variables', function () {
      function createTwoVarsDifferentTypes(workspace) {
        workspace.createVariable('name1', 'type1', 'id1');
        workspace.createVariable('name2', 'type2', 'id2');
      }

      suite('createVariable', function () {
        test('Undo only', function () {
          createTwoVarsDifferentTypes(this.workspace);
          this.clock.runAll();

          this.workspace.undo();
          this.clock.runAll();
          assertVariableValues(this.workspace, 'name1', 'type1', 'id1');
          assert.isNull(this.workspace.getVariableById('id2'));

          this.workspace.undo();
          assert.isNull(this.workspace.getVariableById('id1'));
          assert.isNull(this.workspace.getVariableById('id2'));
        });

        test('Undo and redo', function () {
          createTwoVarsDifferentTypes(this.workspace);
          this.clock.runAll();

          this.workspace.undo();
          this.clock.runAll();
          assertVariableValues(this.workspace, 'name1', 'type1', 'id1');
          assert.isNull(this.workspace.getVariableById('id2'));

          this.workspace.undo(true);

          // Expect that variable 'id2' is recreated
          assertVariableValues(this.workspace, 'name1', 'type1', 'id1');
          assertVariableValues(this.workspace, 'name2', 'type2', 'id2');

          this.workspace.undo();
          this.workspace.undo();
          assert.isNull(this.workspace.getVariableById('id1'));
          assert.isNull(this.workspace.getVariableById('id2'));
          this.workspace.undo(true);

          // Expect that variable 'id1' is recreated
          assertVariableValues(this.workspace, 'name1', 'type1', 'id1');
          assert.isNull(this.workspace.getVariableById('id2'));
        });
      });

      suite('deleteVariableById', function () {
        test('Undo only no usages', function () {
          createTwoVarsDifferentTypes(this.workspace);
          this.clock.runAll();
          this.workspace.deleteVariableById('id1');
          this.workspace.deleteVariableById('id2');
          this.clock.runAll();

          this.workspace.undo();
          this.clock.runAll();
          assert.isNull(this.workspace.getVariableById('id1'));
          assertVariableValues(this.workspace, 'name2', 'type2', 'id2');

          this.workspace.undo();
          this.clock.runAll();
          assertVariableValues(this.workspace, 'name1', 'type1', 'id1');
          assertVariableValues(this.workspace, 'name2', 'type2', 'id2');
        });

        test('Undo only with usages', function () {
          createTwoVarsDifferentTypes(this.workspace);
          // Create blocks to refer to both of them.
          createVarBlocksNoEvents(this.workspace, ['id1', 'id2']);
          this.clock.runAll();
          this.workspace.deleteVariableById('id1');
          this.workspace.deleteVariableById('id2');
          this.clock.runAll();

          this.workspace.undo();
          this.clock.runAll();
          assertBlockVarModelName(this.workspace, 0, 'name2');
          assert.isNull(this.workspace.getVariableById('id1'));
          assertVariableValues(this.workspace, 'name2', 'type2', 'id2');

          this.workspace.undo();
          this.clock.runAll();
          assertBlockVarModelName(this.workspace, 0, 'name2');
          assertBlockVarModelName(this.workspace, 1, 'name1');
          assertVariableValues(this.workspace, 'name1', 'type1', 'id1');
          assertVariableValues(this.workspace, 'name2', 'type2', 'id2');
        });

        test('Reference exists no usages', function () {
          createTwoVarsDifferentTypes(this.workspace);
          this.clock.runAll();
          this.workspace.deleteVariableById('id1');
          this.workspace.deleteVariableById('id2');
          this.clock.runAll();

          this.workspace.undo();
          this.clock.runAll();
          assert.isNull(this.workspace.getVariableById('id1'));
          assertVariableValues(this.workspace, 'name2', 'type2', 'id2');

          this.workspace.undo(true);
          this.clock.runAll();
          // Expect that both variables are deleted
          assert.isNull(this.workspace.getVariableById('id1'));
          assert.isNull(this.workspace.getVariableById('id2'));

          this.workspace.undo();
          this.clock.runAll();
          this.workspace.undo();
          this.clock.runAll();
          assertVariableValues(this.workspace, 'name1', 'type1', 'id1');
          assertVariableValues(this.workspace, 'name2', 'type2', 'id2');

          this.workspace.undo(true);
          this.clock.runAll();
          // Expect that variable 'id2' is recreated
          assert.isNull(this.workspace.getVariableById('id1'));
          assertVariableValues(this.workspace, 'name2', 'type2', 'id2');
        });

        test('Reference exists with usages', function () {
          createTwoVarsDifferentTypes(this.workspace);
          // Create blocks to refer to both of them.
          createVarBlocksNoEvents(this.workspace, ['id1', 'id2']);
          this.clock.runAll();
          this.workspace.deleteVariableById('id1');
          this.workspace.deleteVariableById('id2');
          this.clock.runAll();

          this.workspace.undo();
          this.clock.runAll();
          assertBlockVarModelName(this.workspace, 0, 'name2');
          assert.isNull(this.workspace.getVariableById('id1'));
          assertVariableValues(this.workspace, 'name2', 'type2', 'id2');

          this.workspace.undo(true);
          this.clock.runAll();
          // Expect that both variables are deleted
          assert.equal(this.workspace.getTopBlocks(false).length, 0);
          assert.isNull(this.workspace.getVariableById('id1'));
          assert.isNull(this.workspace.getVariableById('id2'));

          this.workspace.undo();
          this.clock.runAll();
          this.workspace.undo();
          this.clock.runAll();
          assertBlockVarModelName(this.workspace, 0, 'name2');
          assertBlockVarModelName(this.workspace, 1, 'name1');
          assertVariableValues(this.workspace, 'name1', 'type1', 'id1');
          assertVariableValues(this.workspace, 'name2', 'type2', 'id2');

          this.workspace.undo(true);
          this.clock.runAll();
          // Expect that variable 'id2' is recreated
          assertBlockVarModelName(this.workspace, 0, 'name2');
          assert.isNull(this.workspace.getVariableById('id1'));
          assertVariableValues(this.workspace, 'name2', 'type2', 'id2');
        });

        test('Delete same variable twice no usages', function () {
          this.workspace.createVariable('name1', 'type1', 'id1');
          this.workspace.deleteVariableById('id1');
          this.clock.runAll();
          const workspace = this.workspace;
          assertWarnings(() => {
            workspace.deleteVariableById('id1');
          }, /Can't delete/);

          // Check the undoStack only recorded one delete event.
          const undoStack = this.workspace.undoStack_;
          assert.equal(undoStack[undoStack.length - 1].type, 'var_delete');
          assert.notEqual(undoStack[undoStack.length - 2].type, 'var_delete');

          // Undo delete
          this.workspace.undo();
          this.clock.runAll();
          assertVariableValues(this.workspace, 'name1', 'type1', 'id1');

          // Redo delete
          this.workspace.undo(true);
          this.clock.runAll();
          assert.isNull(this.workspace.getVariableById('id1'));

          // Redo delete, nothing should happen
          this.workspace.undo(true);
          this.clock.runAll();
          assert.isNull(this.workspace.getVariableById('id1'));
        });

        test('Delete same variable twice with usages', function () {
          this.workspace.createVariable('name1', 'type1', 'id1');
          createVarBlocksNoEvents(this.workspace, ['id1']);
          this.clock.runAll();
          this.workspace.deleteVariableById('id1');
          this.clock.runAll();
          const workspace = this.workspace;
          assertWarnings(() => {
            workspace.deleteVariableById('id1');
          }, /Can't delete/);

          // Check the undoStack only recorded one delete event.
          const undoStack = this.workspace.undoStack_;
          assert.equal(undoStack[undoStack.length - 1].type, 'var_delete');
          assert.equal(undoStack[undoStack.length - 2].type, 'delete');
          assert.notEqual(undoStack[undoStack.length - 3].type, 'var_delete');

          // Undo delete
          this.workspace.undo();
          this.clock.runAll();
          assertBlockVarModelName(this.workspace, 0, 'name1');
          assertVariableValues(this.workspace, 'name1', 'type1', 'id1');

          // Redo delete
          this.workspace.undo(true);
          this.clock.runAll();
          assert.equal(this.workspace.getTopBlocks(false).length, 0);
          assert.isNull(this.workspace.getVariableById('id1'));

          // Redo delete, nothing should happen
          this.workspace.undo(true);
          this.clock.runAll();
          assert.equal(this.workspace.getTopBlocks(false).length, 0);
          assert.isNull(this.workspace.getVariableById('id1'));
        });
      });

      suite('renameVariableById', function () {
        setup(function () {
          this.variableMap.createVariable('name1', 'type1', 'id1');
        });

        test('Reference exists no usages rename to name2', function () {
          this.variableMap.renameVariableById('id1', 'name2');
          this.clock.runAll();

          this.workspace.undo();
          this.clock.runAll();
          assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');

          this.workspace.undo(true);
          this.clock.runAll();
          assertVariableValues(this.variableMap, 'name2', 'type1', 'id1');
        });

        test('Reference exists with usages rename to name2', function () {
          createVarBlocksNoEvents(this.workspace, ['id1']);
          this.variableMap.renameVariableById('id1', 'name2');
          this.clock.runAll();

          this.workspace.undo();
          this.clock.runAll();
          assertBlockVarModelName(this.workspace, 0, 'name1');
          assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');

          this.workspace.undo(true);
          this.clock.runAll();
          assertBlockVarModelName(this.workspace, 0, 'name2');
          assertVariableValues(this.variableMap, 'name2', 'type1', 'id1');
        });

        test('Reference exists different capitalization no usages rename to Name1', function () {
          this.variableMap.renameVariableById('id1', 'Name1');
          this.clock.runAll();

          this.workspace.undo();
          this.clock.runAll();
          assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');

          this.workspace.undo(true);
          this.clock.runAll();
          assertVariableValues(this.variableMap, 'Name1', 'type1', 'id1');
        });

        test('Reference exists different capitalization with usages rename to Name1', function () {
          createVarBlocksNoEvents(this.workspace, ['id1']);
          this.variableMap.renameVariableById('id1', 'Name1');
          this.clock.runAll();

          this.workspace.undo();
          this.clock.runAll();
          assertBlockVarModelName(this.workspace, 0, 'name1');
          assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');

          this.workspace.undo(true);
          this.clock.runAll();
          assertBlockVarModelName(this.workspace, 0, 'Name1');
          assertVariableValues(this.variableMap, 'Name1', 'type1', 'id1');
        });

        suite('Two variables rename overlap', function () {
          test('Same type no usages rename variable with id1 to name2', function () {
            this.variableMap.createVariable('name2', 'type1', 'id2');
            this.variableMap.renameVariableById('id1', 'name2');
            this.clock.runAll();

            this.workspace.undo();
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
            assertVariableValues(this.variableMap, 'name2', 'type1', 'id2');

            this.workspace.undo(true);
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'name2', 'type1', 'id2');
            assert.isNull(this.variableMap.getVariableById('id1'));
          });

          test('Same type with usages rename variable with id1 to name2', function () {
            const variable = this.variableMap.createVariable(
              'name2',
              'type1',
              'id2',
            );
            createVarBlocksNoEvents(this.workspace, ['id1', 'id2']);
            this.variableMap.renameVariableById('id1', 'name2');
            this.clock.runAll();

            this.workspace.undo();
            this.clock.runAll();
            assertBlockVarModelName(this.workspace, 0, 'name1');
            assertBlockVarModelName(this.workspace, 1, 'name2');
            assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
            assertVariableValues(this.variableMap, 'name2', 'type1', 'id2');

            this.workspace.undo(true);
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'name2', 'type1', 'id2');
            assert.isNull(this.variableMap.getVariableById('id1'));
          });

          test('Same type different capitalization no usages rename variable with id1 to Name2', function () {
            this.variableMap.createVariable('name2', 'type1', 'id2');
            this.variableMap.renameVariableById('id1', 'Name2');
            this.clock.runAll();

            this.workspace.undo();
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
            assertVariableValues(this.variableMap, 'name2', 'type1', 'id2');

            this.workspace.undo(true);
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'Name2', 'type1', 'id2');
            assert.isNull(this.variableMap.getVariable('name1'));
          });

          test('Same type different capitalization with usages rename variable with id1 to Name2', function () {
            this.workspace.createVariable('name2', 'type1', 'id2');
            createVarBlocksNoEvents(this.workspace, ['id1', 'id2']);
            this.variableMap.renameVariableById('id1', 'Name2');
            this.clock.runAll();

            this.workspace.undo();
            this.clock.runAll();
            assertBlockVarModelName(this.workspace, 0, 'name1');
            assertBlockVarModelName(this.workspace, 1, 'name2');
            assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
            assertVariableValues(this.variableMap, 'name2', 'type1', 'id2');

            this.workspace.undo(true);
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'Name2', 'type1', 'id2');
            assert.isNull(this.variableMap.getVariableById('id1'));
            assertBlockVarModelName(this.workspace, 0, 'Name2');
            assertBlockVarModelName(this.workspace, 1, 'Name2');
          });

          test('Different type no usages rename variable with id1 to name2', function () {
            this.variableMap.createVariable('name2', 'type2', 'id2');
            this.variableMap.renameVariableById('id1', 'name2');
            this.clock.runAll();

            this.workspace.undo();
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
            assertVariableValues(this.variableMap, 'name2', 'type2', 'id2');

            this.workspace.undo(true);
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'name2', 'type1', 'id1');
            assertVariableValues(this.variableMap, 'name2', 'type2', 'id2');
          });

          test('Different type with usages rename variable with id1 to name2', function () {
            this.variableMap.createVariable('name2', 'type2', 'id2');
            createVarBlocksNoEvents(this.workspace, ['id1', 'id2']);
            this.variableMap.renameVariableById('id1', 'name2');
            this.clock.runAll();

            this.workspace.undo();
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
            assertVariableValues(this.variableMap, 'name2', 'type2', 'id2');
            assertBlockVarModelName(this.workspace, 0, 'name1');
            assertBlockVarModelName(this.workspace, 1, 'name2');

            this.workspace.undo(true);
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'name2', 'type1', 'id1');
            assertVariableValues(this.variableMap, 'name2', 'type2', 'id2');
            assertBlockVarModelName(this.workspace, 0, 'name2');
            assertBlockVarModelName(this.workspace, 1, 'name2');
          });

          test('Different type different capitalization no usages rename variable with id1 to Name2', function () {
            this.variableMap.createVariable('name2', 'type2', 'id2');
            this.variableMap.renameVariableById('id1', 'Name2');
            this.clock.runAll();

            this.workspace.undo();
            this.clock.runAll();
            assertVariableValues(this.workspace, 'name1', 'type1', 'id1');
            assertVariableValues(this.workspace, 'name2', 'type2', 'id2');

            this.workspace.undo(true);
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'Name2', 'type1', 'id1');
            assertVariableValues(this.variableMap, 'name2', 'type2', 'id2');
          });

          test('Different type different capitalization with usages rename variable with id1 to Name2', function () {
            this.variableMap.createVariable('name2', 'type2', 'id2');
            createVarBlocksNoEvents(this.workspace, ['id1', 'id2']);
            this.variableMap.renameVariableById('id1', 'Name2');
            this.clock.runAll();

            this.workspace.undo();
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'name1', 'type1', 'id1');
            assertVariableValues(this.variableMap, 'name2', 'type2', 'id2');
            assertBlockVarModelName(this.workspace, 0, 'name1');
            assertBlockVarModelName(this.workspace, 1, 'name2');

            this.workspace.undo(true);
            this.clock.runAll();
            assertVariableValues(this.variableMap, 'Name2', 'type1', 'id1');
            assertVariableValues(this.variableMap, 'name2', 'type2', 'id2');
            assertBlockVarModelName(this.workspace, 0, 'Name2');
            assertBlockVarModelName(this.workspace, 1, 'name2');
          });
        });
      });
    });
  });
}
