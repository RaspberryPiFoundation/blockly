/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../../build/src/core/blockly.js';
import {assert} from '../../../node_modules/chai/index.js';
import {defineRowBlock} from '../test_helpers/block_definitions.js';
import {
  assertCallBlockStructure,
  assertDefBlockStructure,
  createProcCallBlock,
  createProcDefBlock,
  MockProcedureModel,
} from '../test_helpers/procedures.js';
import {runSerializationTestSuite} from '../test_helpers/serialization.js';
import {
  createGenUidStubWithReturns,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from '../test_helpers/setup_teardown.js';

suite('Procedures', function () {
  setup(function () {
    sharedTestSetup.call(this, {fireEventsNow: false});
    this.workspace = Blockly.inject('blocklyDiv', {});
    this.workspace.createVariable('preCreatedVar', '', 'preCreatedVarId');
    this.workspace.createVariable(
      'preCreatedTypedVar',
      'type',
      'preCreatedTypedVarId',
    );
    defineRowBlock();
    this.variableMap = this.workspace.getVariableMap();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('renaming procedures', function () {
    test('callers are updated to have the new name', function () {
      const defBlock = createProcDefBlock(this.workspace);
      const callBlock = createProcCallBlock(this.workspace);

      defBlock.setFieldValue('new name', 'NAME');

      assert.equal(
        callBlock.getFieldValue('NAME'),
        'new name',
        'Expected the procedure block to be renamed',
      );
    });

    test(
      'setting an illegal name results in both the ' +
        'procedure and the caller getting the legal name',
      function () {
        createProcDefBlock(this.workspace, undefined, undefined, 'procA');
        const defBlockB = createProcDefBlock(
          this.workspace,
          undefined,
          undefined,
          'procB',
        );
        const callBlockB = createProcCallBlock(
          this.workspace,
          undefined,
          'procB',
        );

        defBlockB.setFieldValue('procA', 'NAME');

        assert.notEqual(
          defBlockB.getFieldValue('NAME'),
          'procA',
          'Expected the procedure def block to have a legal name',
        );
        assert.notEqual(
          callBlockB.getFieldValue('NAME'),
          'procA',
          'Expected the procedure call block to have a legal name',
        );
      },
    );
  });

  suite('adding procedure parameters', function () {
    test('the mutator flyout updates to avoid parameter name conflicts', async function () {
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const origFlyoutParamName = mutatorWorkspace
        .getFlyout()
        .getWorkspace()
        .getTopBlocks(true)[0]
        .getFieldValue('NAME');
      Blockly.serialization.blocks.append(
        {
          'type': 'procedures_mutatorarg',
          'fields': {
            'NAME': origFlyoutParamName,
          },
        },
        mutatorWorkspace,
      );
      this.clock.runAll();

      const newFlyoutParamName = mutatorWorkspace
        .getFlyout()
        .getWorkspace()
        .getTopBlocks(true)[0]
        .getFieldValue('NAME');
      assert.notEqual(
        newFlyoutParamName,
        origFlyoutParamName,
        'Expected the flyout param to have updated to not conflict',
      );
    });

    test('adding a parameter to the procedure updates procedure defs', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();

      assert.isNotNull(
        defBlock.getField('PARAMS'),
        'Expected the params field to exist',
      );
      assert.isTrue(
        defBlock.getFieldValue('PARAMS').includes('param1'),
        'Expected the params field to contain the name of the new param',
      );
    });

    test('adding a parameter to the procedure updates procedure callers', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const callBlock = createProcCallBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();

      assert.isNotNull(
        callBlock.getInput('ARG0'),
        'Expected the param input to exist',
      );
      assert.equal(
        callBlock.getFieldValue('ARGNAME0'),
        'param1',
        'Expected the params field to match the name of the new param',
      );
    });

    test('undoing adding a procedure parameter removes it', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();

      this.workspace.undo();

      assert.isFalse(
        defBlock.getFieldValue('PARAMS').includes('param1'),
        'Expected the params field to not contain the name of the new param',
      );
    });

    test(
      'undoing and redoing adding a procedure parameter maintains ' +
        'the same state',
      async function () {
        // Create a stack of container, parameter.
        const defBlock = createProcDefBlock(this.workspace);
        const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
        await mutatorIcon.setBubbleVisible(true);
        const mutatorWorkspace = mutatorIcon.getWorkspace();
        const containerBlock = mutatorWorkspace.getTopBlocks()[0];
        const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
        paramBlock.setFieldValue('param1', 'NAME');
        containerBlock
          .getInput('STACK')
          .connection.connect(paramBlock.previousConnection);
        this.clock.runAll();

        this.workspace.undo();
        this.workspace.undo(/* redo= */ true);

        assert.isNotNull(
          defBlock.getField('PARAMS'),
          'Expected the params field to exist',
        );
        assert.isTrue(
          defBlock.getFieldValue('PARAMS').includes('param1'),
          'Expected the params field to contain the name of the new param',
        );
      },
    );
  });

  suite('deleting procedure parameters', function () {
    test('deleting a parameter from the procedure updates procedure defs', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();

      paramBlock.checkAndDelete();
      this.clock.runAll();

      assert.isFalse(
        defBlock.getFieldValue('PARAMS').includes('param1'),
        'Expected the params field to not contain the name of the new param',
      );
    });

    test('deleting a parameter from the procedure udpates procedure callers', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const callBlock = createProcCallBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();

      paramBlock.checkAndDelete();
      this.clock.runAll();

      assert.isNull(
        callBlock.getInput('ARG0'),
        'Expected the param input to not exist',
      );
    });

    test('undoing deleting a procedure parameter adds it', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();
      paramBlock.checkAndDelete();
      this.clock.runAll();

      this.workspace.undo();

      assert.isTrue(
        defBlock.getFieldValue('PARAMS').includes('param1'),
        'Expected the params field to contain the name of the new param',
      );
    });

    test(
      'undoing and redoing deleting a procedure parameter maintains ' +
        'the same state',
      async function () {
        // Create a stack of container, parameter.
        const defBlock = createProcDefBlock(this.workspace);
        const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
        await mutatorIcon.setBubbleVisible(true);
        const mutatorWorkspace = mutatorIcon.getWorkspace();
        const containerBlock = mutatorWorkspace.getTopBlocks()[0];
        const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
        paramBlock.setFieldValue('param1', 'NAME');
        containerBlock
          .getInput('STACK')
          .connection.connect(paramBlock.previousConnection);
        this.clock.runAll();
        paramBlock.checkAndDelete();
        this.clock.runAll();

        this.workspace.undo();
        this.workspace.undo(/* redo= */ true);

        assert.isFalse(
          defBlock.getFieldValue('PARAMS').includes('param1'),
          'Expected the params field to not contain the name of the new param',
        );
      },
    );
  });

  suite('renaming procedure parameters', function () {
    test('defs are updated for parameter renames', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();

      paramBlock.setFieldValue('new name', 'NAME');
      this.clock.runAll();

      assert.isNotNull(
        defBlock.getField('PARAMS'),
        'Expected the params field to exist',
      );
      assert.isTrue(
        defBlock.getFieldValue('PARAMS').includes('new name'),
        'Expected the params field to contain the new name of the param',
      );
    });

    test('defs are updated for parameter renames when two params exist', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock1 = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock1.setFieldValue('param1', 'NAME');
      const paramBlock2 = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock2.setFieldValue('param2', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock1.previousConnection);
      paramBlock1.nextConnection.connect(paramBlock2.previousConnection);
      this.clock.runAll();

      paramBlock1.setFieldValue('new name', 'NAME');
      this.clock.runAll();

      assert.isNotNull(
        defBlock.getField('PARAMS'),
        'Expected the params field to exist',
      );
      assert.isTrue(
        defBlock.getFieldValue('PARAMS').includes('new name'),
        'Expected the params field to contain the new name of the param',
      );
    });

    test('callers are updated for parameter renames', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const callBlock = createProcCallBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();

      paramBlock.setFieldValue('new name', 'NAME');
      this.clock.runAll();

      assert.isNotNull(
        callBlock.getInput('ARG0'),
        'Expected the param input to exist',
      );
      assert.equal(
        callBlock.getFieldValue('ARGNAME0'),
        'new name',
        'Expected the params field to match the name of the new param',
      );
    });

    test('variables associated with procedure parameters are not renamed', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const callBlock = createProcCallBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();

      paramBlock.setFieldValue('param2', 'NAME');
      this.clock.runAll();

      assert.isNotNull(
        this.workspace.getVariable('param1', ''),
        'Expected the old variable to continue to exist',
      );
    });

    test('renaming a variable associated with a parameter updates procedure defs', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();
      mutatorIcon.setBubbleVisible(false);

      const variable = this.workspace.getVariable('param1', '');
      this.variableMap.renameVariable(variable, 'new name');

      assert.isNotNull(
        defBlock.getField('PARAMS'),
        'Expected the params field to exist',
      );
      assert.isTrue(
        defBlock.getFieldValue('PARAMS').includes('new name'),
        'Expected the params field to contain the new name of the param',
      );
    });

    test('renaming a variable associated with a parameter updates mutator parameters', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();

      const variable = this.workspace.getVariable('param1', '');
      this.variableMap.renameVariable(variable, 'new name');

      assert.equal(
        paramBlock.getFieldValue('NAME'),
        'new name',
        'Expected the params field to contain the new name of the param',
      );
    });

    test('renaming a variable associated with a parameter updates procedure callers', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const callBlock = createProcCallBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();
      mutatorIcon.setBubbleVisible(false);

      const variable = this.workspace.getVariable('param1', '');
      this.variableMap.renameVariable(variable, 'new name');

      assert.isNotNull(
        callBlock.getInput('ARG0'),
        'Expected the param input to exist',
      );
      assert.equal(
        callBlock.getFieldValue('ARGNAME0'),
        'new name',
        'Expected the params field to match the name of the new param',
      );
    });

    test('coalescing a variable associated with a parameter updates procedure defs', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();
      mutatorIcon.setBubbleVisible(false);

      const variable = this.workspace.getVariable('param1', '');
      this.variableMap.renameVariable(variable, 'preCreatedVar');

      assert.isNotNull(
        defBlock.getField('PARAMS'),
        'Expected the params field to exist',
      );
      assert.isTrue(
        defBlock.getFieldValue('PARAMS').includes('preCreatedVar'),
        'Expected the params field to contain the new name of the param',
      );
    });

    test('coalescing a variable associated with a parameter updates mutator parameters', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();

      const variable = this.workspace.getVariable('param1', '');
      this.variableMap.renameVariable(variable, 'preCreatedVar');

      assert.equal(
        paramBlock.getFieldValue('NAME'),
        'preCreatedVar',
        'Expected the params field to contain the new name of the param',
      );
    });

    test('coalescing a variable associated with a parameter updates procedure callers', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const callBlock = createProcCallBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();
      mutatorIcon.setBubbleVisible(false);

      const variable = this.workspace.getVariable('param1', '');
      this.variableMap.renameVariable(variable, 'preCreatedVar');

      assert.isNotNull(
        callBlock.getInput('ARG0'),
        'Expected the param input to exist',
      );
      assert.equal(
        callBlock.getFieldValue('ARGNAME0'),
        'preCreatedVar',
        'Expected the params field to match the name of the new param',
      );
    });

    test.skip(
      'renaming a variable such that you get a parameter ' +
        'conflict does... something!',
      function () {},
    );

    test('undoing renaming a procedure parameter reverts the change', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();
      Blockly.Events.setGroup(true);
      paramBlock.setFieldValue('n', 'NAME');
      this.clock.runAll();
      paramBlock.setFieldValue('ne', 'NAME');
      this.clock.runAll();
      paramBlock.setFieldValue('new', 'NAME');
      this.clock.runAll();
      Blockly.Events.setGroup(false);

      this.workspace.undo();
      this.clock.runAll();

      assert.isTrue(
        defBlock.getFieldValue('PARAMS').includes('param1'),
        'Expected the params field to contain the old name of the param',
      );
    });

    test('undoing and redoing renaming a procedure maintains the same state', async function () {
      // Create a stack of container, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock.setFieldValue('param1', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock.previousConnection);
      this.clock.runAll();
      Blockly.Events.setGroup(true);
      paramBlock.setFieldValue('n', 'NAME');
      this.clock.runAll();
      paramBlock.setFieldValue('ne', 'NAME');
      this.clock.runAll();
      paramBlock.setFieldValue('new', 'NAME');
      this.clock.runAll();
      Blockly.Events.setGroup(false);

      this.workspace.undo();
      this.workspace.undo(/* redo= */ true);

      assert.isTrue(
        defBlock.getFieldValue('PARAMS').includes('new'),
        'Expected the params field to contain the new name of the param',
      );
    });
  });

  suite('reordering procedure parameters', function () {
    test('reordering procedure parameters updates procedure blocks', async function () {
      // Create a stack of container, parameter, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock1 = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock1.setFieldValue('param1', 'NAME');
      const paramBlock2 = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock2.setFieldValue('param2', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock1.previousConnection);
      paramBlock1.nextConnection.connect(paramBlock2.previousConnection);
      this.clock.runAll();

      // Reorder the parameters.
      paramBlock2.previousConnection.disconnect();
      paramBlock1.previousConnection.disconnect();
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock2.previousConnection);
      paramBlock2.nextConnection.connect(paramBlock1.previousConnection);
      this.clock.runAll();

      assert.isNotNull(
        defBlock.getField('PARAMS'),
        'Expected the params field to exist',
      );
      assert.isTrue(
        defBlock.getFieldValue('PARAMS').includes('param2, param1'),
        'Expected the params field order to match the parameter order',
      );
    });

    test('reordering procedure parameters updates caller blocks', async function () {
      // Create a stack of container, parameter, parameter.
      const defBlock = createProcDefBlock(this.workspace);
      const callBlock = createProcCallBlock(this.workspace);
      const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
      await mutatorIcon.setBubbleVisible(true);
      const mutatorWorkspace = mutatorIcon.getWorkspace();
      const containerBlock = mutatorWorkspace.getTopBlocks()[0];
      const paramBlock1 = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock1.setFieldValue('param1', 'NAME');
      const paramBlock2 = mutatorWorkspace.newBlock('procedures_mutatorarg');
      paramBlock2.setFieldValue('param2', 'NAME');
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock1.previousConnection);
      paramBlock1.nextConnection.connect(paramBlock2.previousConnection);
      this.clock.runAll();

      // Reorder the parameters.
      paramBlock2.previousConnection.disconnect();
      paramBlock1.previousConnection.disconnect();
      containerBlock
        .getInput('STACK')
        .connection.connect(paramBlock2.previousConnection);
      paramBlock2.nextConnection.connect(paramBlock1.previousConnection);
      this.clock.runAll();

      assert.isNotNull(
        callBlock.getInput('ARG0'),
        'Expected the param input to exist',
      );
      assert.equal(
        callBlock.getFieldValue('ARGNAME0'),
        'param2',
        'Expected the params field to match the name of the second param',
      );
      assert.isNotNull(
        callBlock.getInput('ARG1'),
        'Expected the param input to exist',
      );
      assert.equal(
        callBlock.getFieldValue('ARGNAME1'),
        'param1',
        'Expected the params field to match the name of the first param',
      );
    });

    test(
      'reordering procedure parameters reorders the blocks ' +
        'attached to caller inputs',
      async function () {
        // Create a stack of container, parameter, parameter.
        const defBlock = createProcDefBlock(this.workspace);
        const callBlock = createProcCallBlock(this.workspace);
        const mutatorIcon = defBlock.getIcon(Blockly.icons.MutatorIcon.TYPE);
        await mutatorIcon.setBubbleVisible(true);
        const mutatorWorkspace = mutatorIcon.getWorkspace();
        const containerBlock = mutatorWorkspace.getTopBlocks()[0];
        const paramBlock1 = mutatorWorkspace.newBlock('procedures_mutatorarg');
        paramBlock1.setFieldValue('param1', 'NAME');
        const paramBlock2 = mutatorWorkspace.newBlock('procedures_mutatorarg');
        paramBlock2.setFieldValue('param2', 'NAME');
        containerBlock
          .getInput('STACK')
          .connection.connect(paramBlock1.previousConnection);
        paramBlock1.nextConnection.connect(paramBlock2.previousConnection);
        this.clock.runAll();

        // Add args to the parameter inputs on the caller.
        const block1 = this.workspace.newBlock('text');
        const block2 = this.workspace.newBlock('text');
        callBlock.getInput('ARG0').connection.connect(block1.outputConnection);
        callBlock.getInput('ARG1').connection.connect(block2.outputConnection);

        // Reorder the parameters.
        paramBlock2.previousConnection.disconnect();
        paramBlock1.previousConnection.disconnect();
        containerBlock
          .getInput('STACK')
          .connection.connect(paramBlock2.previousConnection);
        paramBlock2.nextConnection.connect(paramBlock1.previousConnection);
        this.clock.runAll();

        assert.equal(
          callBlock.getInputTargetBlock('ARG0'),
          block2,
          'Expected the second block to be in the first slot',
        );
        assert.equal(
          callBlock.getInputTargetBlock('ARG1'),
          block1,
          'Expected the first block to be in the second slot',
        );
      },
    );
  });

  suite('enabling and disabling procedure blocks', function () {
    test(
      'if a procedure definition is disabled, the procedure caller ' +
        'is also disabled',
      function () {
        const defBlock = createProcDefBlock(this.workspace);
        const callBlock = createProcCallBlock(this.workspace);

        defBlock.setDisabledReason(true, 'MANUALLY_DISABLED');
        this.clock.runAll();

        assert.isFalse(
          callBlock.isEnabled(),
          'Expected the caller block to be disabled',
        );
      },
    );

    test(
      'if a procedure definition is invalid, the procedure caller ' +
        'is also invalid',
      function () {
        const defBlock = createProcDefBlock(this.workspace);
        const callBlock = createProcCallBlock(this.workspace);

        defBlock.setDisabledReason(true, 'test reason');
        this.clock.runAll();

        assert.isFalse(
          callBlock.isEnabled(),
          'Expected the caller block to be invalid',
        );
      },
    );

    test(
      'if a procedure definition is enabled, the procedure caller ' +
        'is also enabled',
      function () {
        const defBlock = createProcDefBlock(this.workspace);
        const callBlock = createProcCallBlock(this.workspace);
        defBlock.setDisabledReason(true, 'MANUALLY_DISABLED');
        this.clock.runAll();

        defBlock.setDisabledReason(false, 'MANUALLY_DISABLED');
        this.clock.runAll();

        assert.isTrue(
          callBlock.isEnabled(),
          'Expected the caller block to be enabled',
        );
      },
    );

    test(
      'if a procedure caller block was already disabled before ' +
        'its definition was disabled, it is not reenabled',
      function () {
        this.workspace.options.disable = true;
        const defBlock = createProcDefBlock(this.workspace);
        const callBlock = createProcCallBlock(this.workspace);
        this.clock.runAll();
        callBlock.setDisabledReason(true, 'MANUALLY_DISABLED');
        this.clock.runAll();
        defBlock.setDisabledReason(true, 'MANUALLY_DISABLED');
        this.clock.runAll();

        defBlock.setDisabledReason(false, 'MANUALLY_DISABLED');
        this.clock.runAll();

        assert.isFalse(
          callBlock.isEnabled(),
          'Expected the caller block to continue to be disabled',
        );
      },
    );
  });

  suite('procedures_ifreturn blocks', function () {
    test('ifreturn block is invalid outside of def block', function () {
      const ifreturnBlock = Blockly.serialization.blocks.append(
        {'type': 'procedures_ifreturn'},
        this.workspace,
      );
      this.clock.runAll();
      assert.isFalse(
        ifreturnBlock.isEnabled(),
        'Expected the ifreturn block to be invalid',
      );
    });

    test('ifreturn block is valid inside of def block', function () {
      const defBlock = createProcDefBlock(this.workspace);
      const ifreturnBlock = Blockly.serialization.blocks.append(
        {'type': 'procedures_ifreturn'},
        this.workspace,
      );
      defBlock
        .getInput('STACK')
        .connection.connect(ifreturnBlock.previousConnection);
      this.clock.runAll();
      assert.isTrue(
        ifreturnBlock.isEnabled(),
        'Expected the ifreturn block to be valid',
      );
    });
  });

  suite('deleting procedure blocks', function () {
    test(
      'when the procedure definition block is deleted, all of its ' +
        'associated callers are deleted as well',
      function () {
        const defBlock = createProcDefBlock(this.workspace);
        const callBlock1 = createProcCallBlock(this.workspace);
        const callBlock2 = createProcCallBlock(this.workspace);

        this.clock.runAll();
        defBlock.dispose();
        this.clock.runAll();

        assert.isTrue(
          callBlock1.disposed,
          'Expected the first caller to be disposed',
        );
        assert.isTrue(
          callBlock2.disposed,
          'Expected the second caller to be disposed',
        );
      },
    );
  });

  suite('caller blocks creating new def blocks', function () {
    setup(function () {
      this.TEST_VAR_ID = 'test-id';
      this.genUidStub = createGenUidStubWithReturns(this.TEST_VAR_ID);
    });

    suite('xml', function () {
      test('callers without defs create new defs', function () {
        const callBlock = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(`
            <block type="procedures_callreturn">
              <mutation name="do something"/>
            </block>`),
          this.workspace,
        );
        this.clock.runAll();
        assertDefBlockStructure(
          this.workspace.getBlocksByType('procedures_defreturn')[0],
          true,
        );
        assertCallBlockStructure(callBlock, [], [], 'do something');
      });

      test('callers without mutations create unnamed defs', function () {
        const callBlock = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(
            '<block type="procedures_callreturn"></block>',
          ),
          this.workspace,
        );
        this.clock.runAll();
        assertDefBlockStructure(
          this.workspace.getBlocksByType('procedures_defreturn')[0],
          true,
        );
        assertCallBlockStructure(callBlock, [], [], 'unnamed');
      });

      test('callers with missing args create new defs', function () {
        const defBlock = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(`
            <block type="procedures_defreturn">
              <field name="NAME">do something</field>
              <mutation>
                <arg name="x" varid="arg"></arg>
              </mutation>
            </block>
        `),
          this.workspace,
        );
        const callBlock = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(
            '<block type="procedures_callreturn">' +
              '  <mutation name="do something"/>' +
              '</block>',
          ),
          this.workspace,
        );
        this.clock.runAll();
        assertDefBlockStructure(defBlock, true, ['x'], ['arg']);
        assertCallBlockStructure(callBlock, [], [], 'do something2');
      });

      test('callers with mismatched args create new defs', function () {
        const defBlock = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(`
            <block type="procedures_defreturn">
              <field name="NAME">do something</field>
              <mutation>
                <arg name="x" varid="arg"></arg>
              </mutation>
            </block>
        `),
          this.workspace,
        );
        const callBlock = Blockly.Xml.domToBlock(
          Blockly.utils.xml.textToDom(`
            <block type="procedures_callreturn">
              <mutation name="do something">
                <arg name="y"></arg>
              </mutation>
            </block>
        `),
          this.workspace,
        );
        this.clock.runAll();
        assertDefBlockStructure(defBlock, true, ['x'], ['arg']);
        assertCallBlockStructure(
          callBlock,
          ['y'],
          [this.TEST_VAR_ID],
          'do something2',
        );
      });

      test.skip('callers whose defs are deserialized later do not create defs', function () {
        Blockly.Xml.domToWorkspace(
          Blockly.utils.xml.textToDom(`
                <xml>
                  <block type="procedures_callreturn">
                    <mutation name="do something">
                      <arg name="x"></arg>
                    </mutation>
                  </block>
                  <block type="procedures_defreturn">
                    <field name="NAME">do something</field>
                    <mutation>
                      <arg name="x" varid="arg"></arg>
                    </mutation>
                  </block>
                </xml>
            `),
          this.workspace,
        );
        this.clock.runAll();
        const defBlock = this.workspace.getBlocksByType(
          'procedures_defreturn',
        )[0];
        const callBlock = this.workspace.getBlocksByType(
          'procedures_callreturn',
        )[0];
        // TODO: Currently the callers are creating variables with different
        //   IDs than those serialized to XML, so these assertions fail.
        assertDefBlockStructure(defBlock, true, ['x'], ['arg']);
        assertCallBlockStructure(callBlock, ['x'], ['arg'], 'do something');
      });
    });

    suite('json', function () {
      test('callers without defs create new defs', function () {
        const callBlock = Blockly.serialization.blocks.append(
          {
            'type': 'procedures_callreturn',
            'extraState': {
              'name': 'do something',
            },
          },
          this.workspace,
          {recordUndo: true},
        );
        this.clock.runAll();
        assertDefBlockStructure(
          this.workspace.getBlocksByType('procedures_defreturn')[0],
          true,
        );
        assertCallBlockStructure(callBlock, [], [], 'do something');
      });

      test('callers without extra state create unamed defs', function () {
        // recordUndo must be true to trigger change listener.
        const callBlock = Blockly.serialization.blocks.append(
          {
            'type': 'procedures_callreturn',
          },
          this.workspace,
          {recordUndo: true},
        );
        this.clock.runAll();
        assertDefBlockStructure(
          this.workspace.getBlocksByType('procedures_defreturn')[0],
          true,
        );
        assertCallBlockStructure(callBlock, [], [], 'unnamed');
      });

      test('callers with missing args create new defs', function () {
        const defBlock = Blockly.serialization.blocks.append(
          {
            'type': 'procedures_defreturn',
            'fields': {
              'NAME': 'do something',
            },
            'extraState': {
              'params': [
                {
                  'name': 'x',
                  'id': 'arg',
                },
              ],
            },
          },
          this.workspace,
        );
        const callBlock = Blockly.serialization.blocks.append(
          {
            'type': 'procedures_callreturn',
            'extraState': {
              'name': 'do something',
            },
          },
          this.workspace,
          {recordUndo: true},
        );
        this.clock.runAll();
        assertDefBlockStructure(defBlock, true, ['x'], ['arg']);
        assertCallBlockStructure(callBlock, [], [], 'do something2');
      });

      test('callers with mismatched args create new defs', function () {
        const defBlock = Blockly.serialization.blocks.append(
          {
            'type': 'procedures_defreturn',
            'fields': {
              'NAME': 'do something',
            },
            'extraState': {
              'params': [
                {
                  'name': 'x',
                  'id': 'arg',
                },
              ],
            },
          },
          this.workspace,
        );
        const callBlock = Blockly.serialization.blocks.append(
          {
            'type': 'procedures_callreturn',
            'extraState': {
              'name': 'do something',
              'params': ['y'],
            },
          },
          this.workspace,
          {recordUndo: true},
        );
        this.clock.runAll();
        assertDefBlockStructure(defBlock, true, ['x'], ['arg']);
        assertCallBlockStructure(
          callBlock,
          ['y'],
          [this.TEST_VAR_ID],
          'do something2',
        );
      });

      test.skip('callers whose defs are deserialized later do not create defs', function () {
        Blockly.serialization.workspaces.load(
          {
            'blocks': {
              'languageVersion': 0,
              'blocks': [
                {
                  'type': 'procedures_callreturn',
                  'extraState': {
                    'params': ['x'],
                  },
                },
                {
                  'type': 'procedures_defreturn',
                  'fields': {
                    'NAME': 'do something',
                  },
                  'extraState': {
                    'params': [
                      {
                        'name': 'x',
                        'id': 'arg',
                      },
                    ],
                  },
                },
              ],
            },
          },
          this.workspace,
        );
        this.clock.runAll();
        const defBlock = this.workspace.getBlocksByType(
          'procedures_defreturn',
        )[0];
        const callBlock = this.workspace.getBlocksByType(
          'procedures_callreturn',
        )[0];
        // TODO: Currently the callers are creating variables with different
        //   IDs than those serialized to JSON, so these assertions fail.
        assertDefBlockStructure(defBlock, true, ['x'], ['arg']);
        assertCallBlockStructure(callBlock, ['x'], ['arg'], 'do something');
      });
    });
  });

  suite('definition block context menu', function () {
    test('the context menu includes an option for creating the caller', function () {
      const def = Blockly.serialization.blocks.append(
        {
          'type': 'procedures_defnoreturn',
          'fields': {
            'NAME': 'test name',
          },
        },
        this.workspace,
      );

      const options = [];
      def.customContextMenu(options);

      assert.isTrue(
        options[0].text.includes('test name'),
        'Expected the context menu to have an option to create the caller',
      );
    });

    test('the context menu includes an option for each parameter', function () {
      const def = Blockly.serialization.blocks.append(
        {
          'type': 'procedures_defnoreturn',
          'fields': {
            'NAME': 'test name',
          },
          'extraState': {
            'params': [
              {
                'name': 'testParam1',
                'id': 'varId1',
                'paramId': 'paramId1',
              },
              {
                'name': 'testParam2',
                'id': 'varId2',
                'paramId': 'paramId2',
              },
            ],
          },
        },
        this.workspace,
      );

      const options = [];
      def.customContextMenu(options);

      assert.isTrue(
        options[1].text.includes('testParam1'),
        'Expected the context menu to have an option to create the first param',
      );
      assert.isTrue(
        options[2].text.includes('testParam2'),
        'Expected the context menu to have an option to create the second param',
      );
    });
  });

  suite('allProcedures', function () {
    test('Only Procedures', function () {
      const noReturnBlock = this.workspace.newBlock('procedures_defnoreturn');
      noReturnBlock.setFieldValue('no return', 'NAME');
      const returnBlock = this.workspace.newBlock('procedures_defreturn');
      returnBlock.setFieldValue('return', 'NAME');

      const allProcedures = Blockly.Procedures.allProcedures(this.workspace);
      assert.lengthOf(allProcedures, 2);

      assert.lengthOf(allProcedures[0], 1);
      assert.equal(allProcedures[0][0][0], 'no return');

      assert.lengthOf(allProcedures[1], 1);
      assert.equal(allProcedures[1][0][0], 'return');
    });

    test('Multiple Blocks', function () {
      const noReturnBlock = this.workspace.newBlock('procedures_defnoreturn');
      noReturnBlock.setFieldValue('no return', 'NAME');
      const returnBlock = this.workspace.newBlock('procedures_defreturn');
      returnBlock.setFieldValue('return', 'NAME');
      const returnBlock2 = this.workspace.newBlock('procedures_defreturn');
      returnBlock2.setFieldValue('return2', 'NAME');
      const _ = this.workspace.newBlock('controls_if');

      const allProcedures = Blockly.Procedures.allProcedures(this.workspace);
      assert.lengthOf(allProcedures, 2);

      assert.lengthOf(allProcedures[0], 1);
      assert.equal(allProcedures[0][0][0], 'no return');

      assert.lengthOf(allProcedures[1], 2);
      assert.equal(allProcedures[1][0][0], 'return');
      assert.equal(allProcedures[1][1][0], 'return2');
    });

    test('No Procedures', function () {
      const _ = this.workspace.newBlock('controls_if');
      const allProcedures = Blockly.Procedures.allProcedures(this.workspace);
      assert.lengthOf(allProcedures, 2);
      assert.lengthOf(
        allProcedures[0],
        0,
        'No procedures_defnoreturn blocks expected',
      );
      assert.lengthOf(
        allProcedures[1],
        0,
        'No procedures_defreturn blocks expected',
      );
    });
  });

  suite('isNameUsed', function () {
    test('returns false if no blocks or models exists', function () {
      assert.isFalse(
        Blockly.Procedures.isNameUsed('proc name', this.workspace),
      );
    });

    test('returns true if an associated block exists', function () {
      createProcDefBlock(this.workspace, false, [], 'proc name');
      assert.isTrue(Blockly.Procedures.isNameUsed('proc name', this.workspace));
    });

    test('return false if an associated block does not exist', function () {
      createProcDefBlock(this.workspace, false, [], 'proc name');
      assert.isFalse(
        Blockly.Procedures.isNameUsed('other proc name', this.workspace),
      );
    });

    test('returns true if an associated procedure model exists', function () {
      this.workspace
        .getProcedureMap()
        .add(new MockProcedureModel().setName('proc name'));
      assert.isTrue(Blockly.Procedures.isNameUsed('proc name', this.workspace));
    });

    test('returns false if an associated procedure model exists', function () {
      this.workspace
        .getProcedureMap()
        .add(new MockProcedureModel().setName('proc name'));
      assert.isFalse(
        Blockly.Procedures.isNameUsed('other proc name', this.workspace),
      );
    });
  });

  suite('Multiple block serialization', function () {
    function assertDefAndCallBlocks(
      workspace,
      noReturnNames,
      returnNames,
      hasCallers,
    ) {
      const allProcedures = Blockly.Procedures.allProcedures(workspace);
      const defNoReturnBlocks = allProcedures[0];
      assert.lengthOf(
        defNoReturnBlocks,
        noReturnNames.length,
        `Expected the number of no return blocks to be ${noReturnNames.length}`,
      );
      for (let i = 0; i < noReturnNames.length; i++) {
        const expectedName = noReturnNames[i];
        assert.equal(defNoReturnBlocks[i][0], expectedName);
        if (hasCallers) {
          const callers = Blockly.Procedures.getCallers(
            expectedName,
            workspace,
          );
          assert.lengthOf(
            callers,
            1,
            `Expected there to be one caller of the ${expectedName} block`,
          );
        }
      }
      const defReturnBlocks = allProcedures[1];
      assert.lengthOf(
        defReturnBlocks,
        returnNames.length,
        `Expected the number of return blocks to be ${returnNames.length}`,
      );
      for (let i = 0; i < returnNames.length; i++) {
        const expectedName = returnNames[i];
        assert.equal(defReturnBlocks[i][0], expectedName);
        if (hasCallers) {
          const callers = Blockly.Procedures.getCallers(
            expectedName,
            workspace,
          );
          assert.lengthOf(
            callers,
            1,
            `Expected there to be one caller of the ${expectedName} block`,
          );
        }
      }

      // Expecting def and caller blocks are the only blocks on workspace
      let expectedCount = noReturnNames.length + returnNames.length;
      if (hasCallers) {
        expectedCount *= 2;
      }
      const blocks = workspace.getAllBlocks(false);
      assert.lengthOf(blocks, expectedCount);
    }

    suite('no name renamed to unnamed', function () {
      test('defnoreturn and defreturn', function () {
        const xml = Blockly.utils.xml.textToDom(`
              <xml xmlns="https://developers.google.com/blockly/xml">
                <block type="procedures_defnoreturn"/>
                <block type="procedures_defreturn"/>
              </xml>`);
        Blockly.Xml.domToWorkspace(xml, this.workspace);
        this.clock.runAll();

        assertDefAndCallBlocks(
          this.workspace,
          ['unnamed'],
          ['unnamed2'],
          false,
        );
      });

      test('defreturn and defnoreturn', function () {
        const xml = Blockly.utils.xml.textToDom(`
              <xml xmlns="https://developers.google.com/blockly/xml">
                <block type="procedures_defreturn"/>
                <block type="procedures_defnoreturn"/>
              </xml>`);
        Blockly.Xml.domToWorkspace(xml, this.workspace);
        this.clock.runAll();

        assertDefAndCallBlocks(
          this.workspace,
          ['unnamed2'],
          ['unnamed'],
          false,
        );
      });

      test('callreturn (no def in xml)', function () {
        const xml = Blockly.utils.xml.textToDom(`
              <xml xmlns="https://developers.google.com/blockly/xml">
                <block type="procedures_callreturn"/>
              </xml>`);
        Blockly.Xml.domToWorkspace(xml, this.workspace);
        this.clock.runAll();
        assertDefAndCallBlocks(this.workspace, [], ['unnamed'], true);
      });

      test('callnoreturn and callreturn (no def in xml)', function () {
        const xml = Blockly.utils.xml.textToDom(`
              <xml xmlns="https://developers.google.com/blockly/xml">
                <block type="procedures_callnoreturn" id="first"/>
                <block type="procedures_callreturn" id="second"/>
              </xml>`);
        Blockly.Xml.domToWorkspace(xml, this.workspace);
        this.clock.runAll();
        assertDefAndCallBlocks(this.workspace, ['unnamed'], ['unnamed2'], true);
      });

      test('callreturn and callnoreturn (no def in xml)', function () {
        const xml = Blockly.utils.xml.textToDom(`
              <xml xmlns="https://developers.google.com/blockly/xml">
                <block type="procedures_callreturn"/>
                <block type="procedures_callnoreturn"/>
              </xml>`);
        Blockly.Xml.domToWorkspace(xml, this.workspace);
        this.clock.runAll();
        assertDefAndCallBlocks(this.workspace, ['unnamed2'], ['unnamed'], true);
      });
    });
  });

  suite('getDefinition - Modified cases', function () {
    setup(function () {
      Blockly.Blocks['new_proc'] = {
        init: function () {},
        getProcedureDef: function () {
          return [this.name, [], false];
        },
        name: 'test',
      };

      Blockly.Blocks['nested_proc'] = {
        init: function () {
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        },
        getProcedureDef: function () {
          return [this.name, [], false];
        },
        name: 'test',
      };
    });

    teardown(function () {
      delete Blockly.Blocks['new_proc'];
      delete Blockly.Blocks['nested_proc'];
    });

    test('Custom procedure block', function () {
      // Do not require procedures to be the built-in procedures.
      const defBlock = this.workspace.newBlock('new_proc');
      const def = Blockly.Procedures.getDefinition('test', this.workspace);
      assert.equal(def, defBlock);
    });

    test('Stacked procedures', function () {
      const blockA = this.workspace.newBlock('nested_proc');
      const blockB = this.workspace.newBlock('nested_proc');
      blockA.name = 'a';
      blockB.name = 'b';
      blockA.nextConnection.connect(blockB.previousConnection);
      const def = Blockly.Procedures.getDefinition('b', this.workspace);
      assert.equal(def, blockB);
    });
  });

  const testSuites = [
    {
      title: 'procedures_defreturn',
      hasReturn: true,
      defType: 'procedures_defreturn',
      callType: 'procedures_callreturn',
    },
    {
      title: 'procedures_defnoreturn',
      hasReturn: false,
      defType: 'procedures_defnoreturn',
      callType: 'procedures_callnoreturn',
    },
  ];

  testSuites.forEach((testSuite) => {
    suite(testSuite.title, function () {
      suite('Structure', function () {
        setup(function () {
          this.defBlock = this.workspace.newBlock(testSuite.defType);
          this.defBlock.setFieldValue('proc name', 'NAME');
        });
        test('Definition block', function () {
          assertDefBlockStructure(this.defBlock, testSuite.hasReturn);
        });

        test('Call block', function () {
          this.callBlock = Blockly.serialization.blocks.append(
            {
              'type': testSuite.callType,
            },
            this.workspace,
            {recordUndo: true},
          );
          this.callBlock.setFieldValue('proc name', 'NAME');
          this.clock.runAll();
          assertCallBlockStructure(this.callBlock);
        });
      });
      suite('rename', function () {
        setup(function () {
          this.defBlock = Blockly.serialization.blocks.append(
            {
              'type': testSuite.defType,
              'fields': {
                'NAME': 'proc name',
              },
            },
            this.workspace,
          );
          this.callBlock = Blockly.serialization.blocks.append(
            {
              'type': testSuite.callType,
              'fields': {
                'NAME': 'proc name',
              },
            },
            this.workspace,
          );
          sinon.stub(this.defBlock.getField('NAME'), 'resizeEditor_');
        });
        test('Simple, Programmatic', function () {
          this.defBlock.setFieldValue(
            this.defBlock.getFieldValue('NAME') + '2',
            'NAME',
          );
          assert.equal(this.defBlock.getFieldValue('NAME'), 'proc name2');
          assert.equal(this.callBlock.getFieldValue('NAME'), 'proc name2');
        });
        test('Simple, Input', function () {
          const defInput = this.defBlock.getField('NAME');
          defInput.htmlInput_ = document.createElement('input');
          defInput.htmlInput_.setAttribute(
            'data-untyped-default-value',
            'proc name',
          );

          defInput.htmlInput_.value = 'proc name2';
          defInput.onHtmlInputChange(null);
          assert.equal(this.defBlock.getFieldValue('NAME'), 'proc name2');
          assert.equal(this.callBlock.getFieldValue('NAME'), 'proc name2');
        });
        test('lower -> CAPS', function () {
          const defInput = this.defBlock.getField('NAME');
          defInput.htmlInput_ = document.createElement('input');
          defInput.htmlInput_.setAttribute(
            'data-untyped-default-value',
            'proc name',
          );

          defInput.htmlInput_.value = 'PROC NAME';
          defInput.onHtmlInputChange(null);
          assert.equal(this.defBlock.getFieldValue('NAME'), 'PROC NAME');
          assert.equal(this.callBlock.getFieldValue('NAME'), 'PROC NAME');
        });
        test('CAPS -> lower', function () {
          this.defBlock.setFieldValue('PROC NAME', 'NAME');
          this.callBlock.setFieldValue('PROC NAME', 'NAME');
          const defInput = this.defBlock.getField('NAME');
          defInput.htmlInput_ = document.createElement('input');
          defInput.htmlInput_.setAttribute(
            'data-untyped-default-value',
            'PROC NAME',
          );

          defInput.htmlInput_.value = 'proc name';
          defInput.onHtmlInputChange(null);
          assert.equal(this.defBlock.getFieldValue('NAME'), 'proc name');
          assert.equal(this.callBlock.getFieldValue('NAME'), 'proc name');
        });
        test('Whitespace', function () {
          const defInput = this.defBlock.getField('NAME');
          defInput.htmlInput_ = document.createElement('input');
          defInput.htmlInput_.setAttribute(
            'data-untyped-default-value',
            'proc name',
          );

          defInput.htmlInput_.value = 'proc name ';
          defInput.onHtmlInputChange(null);
          assert.equal(this.defBlock.getFieldValue('NAME'), 'proc name');
          assert.equal(this.callBlock.getFieldValue('NAME'), 'proc name');
        });
        test('Whitespace then Text', function () {
          const defInput = this.defBlock.getField('NAME');
          defInput.htmlInput_ = document.createElement('input');
          defInput.htmlInput_.setAttribute(
            'data-untyped-default-value',
            'proc name',
          );

          defInput.htmlInput_.value = 'proc name ';
          defInput.onHtmlInputChange(null);
          defInput.htmlInput_.value = 'proc name 2';
          defInput.onHtmlInputChange(null);
          assert.equal(this.defBlock.getFieldValue('NAME'), 'proc name 2');
          assert.equal(this.callBlock.getFieldValue('NAME'), 'proc name 2');
        });
        test('Set Empty', function () {
          const defInput = this.defBlock.getField('NAME');
          defInput.htmlInput_ = document.createElement('input');
          defInput.htmlInput_.setAttribute(
            'data-untyped-default-value',
            'proc name',
          );

          defInput.htmlInput_.value = '';
          defInput.onHtmlInputChange(null);
          assert.equal(
            this.defBlock.getFieldValue('NAME'),
            Blockly.Msg['UNNAMED_KEY'],
          );
          assert.equal(
            this.callBlock.getFieldValue('NAME'),
            Blockly.Msg['UNNAMED_KEY'],
          );
        });
        test('Set Empty, and Create New', function () {
          const defInput = this.defBlock.getField('NAME');
          defInput.htmlInput_ = document.createElement('input');
          defInput.htmlInput_.setAttribute(
            'data-untyped-default-value',
            'proc name',
          );

          defInput.htmlInput_.value = '';
          defInput.onHtmlInputChange(null);
          const newDefBlock = this.workspace.newBlock(testSuite.defType);
          newDefBlock.setFieldValue('new name', 'NAME');
          assert.equal(
            this.defBlock.getFieldValue('NAME'),
            Blockly.Msg['UNNAMED_KEY'],
          );
          assert.equal(
            this.callBlock.getFieldValue('NAME'),
            Blockly.Msg['UNNAMED_KEY'],
          );
        });
      });
      suite('getCallers', function () {
        setup(function () {
          this.defBlock = Blockly.serialization.blocks.append(
            {
              'type': testSuite.defType,
              'fields': {
                'NAME': 'proc name',
              },
            },
            this.workspace,
          );
          this.callBlock = Blockly.serialization.blocks.append(
            {
              'type': testSuite.callType,
              'fields': {
                'NAME': 'proc name',
              },
            },
            this.workspace,
          );
        });
        test('Simple', function () {
          const callers = Blockly.Procedures.getCallers(
            'proc name',
            this.workspace,
          );
          assert.equal(callers.length, 1);
          assert.equal(callers[0], this.callBlock);
        });
        test('Multiple Callers', function () {
          const caller2 = this.workspace.newBlock(testSuite.callType);
          caller2.setFieldValue('proc name', 'NAME');
          const caller3 = this.workspace.newBlock(testSuite.callType);
          caller3.setFieldValue('proc name', 'NAME');

          const callers = Blockly.Procedures.getCallers(
            'proc name',
            this.workspace,
          );
          assert.equal(callers.length, 3);
          assert.equal(callers[0], this.callBlock);
          assert.equal(callers[1], caller2);
          assert.equal(callers[2], caller3);
        });
        test('Multiple Procedures', function () {
          const def2 = this.workspace.newBlock(testSuite.defType);
          def2.setFieldValue('proc name2', 'NAME');
          const caller2 = this.workspace.newBlock(testSuite.callType);
          caller2.setFieldValue('proc name2', 'NAME');

          const callers = Blockly.Procedures.getCallers(
            'proc name',
            this.workspace,
          );
          assert.equal(callers.length, 1);
          assert.equal(callers[0], this.callBlock);
        });
        // This can occur if you:
        //  1) Create an uppercase definition and call block.
        //  2) Delete both blocks.
        //  3) Create a lowercase definition and call block.
        //  4) Retrieve the uppercase call block from the trashcan.
        // (And vise versa for creating lowercase blocks first)
        // When converted to code all function names will be lowercase, so a
        // caller should still be returned for a differently-cased procedure.
        test('Call Different Case', function () {
          this.callBlock.setFieldValue('PROC NAME', 'NAME');
          const callers = Blockly.Procedures.getCallers(
            'proc name',
            this.workspace,
          );
          assert.equal(callers.length, 1);
          assert.equal(callers[0], this.callBlock);
        });
        test('Multiple Workspaces', function () {
          const workspace = new Blockly.Workspace();
          try {
            const def2 = workspace.newBlock(testSuite.defType);
            def2.setFieldValue('proc name', 'NAME');
            const caller2 = workspace.newBlock(testSuite.callType);
            caller2.setFieldValue('proc name', 'NAME');

            let callers = Blockly.Procedures.getCallers(
              'proc name',
              this.workspace,
            );
            assert.equal(callers.length, 1);
            assert.equal(callers[0], this.callBlock);

            callers = Blockly.Procedures.getCallers('proc name', workspace);
            assert.equal(callers.length, 1);
            assert.equal(callers[0], caller2);
          } finally {
            workspaceTeardown.call(this, workspace);
          }
        });
      });
      suite('getDefinition', function () {
        setup(function () {
          this.defBlock = Blockly.serialization.blocks.append(
            {
              'type': testSuite.defType,
              'fields': {
                'NAME': 'proc name',
              },
            },
            this.workspace,
          );
          this.callBlock = Blockly.serialization.blocks.append(
            {
              'type': testSuite.callType,
              'fields': {
                'NAME': 'proc name',
              },
            },
            this.workspace,
          );
        });
        test('Simple', function () {
          const def = Blockly.Procedures.getDefinition(
            'proc name',
            this.workspace,
          );
          assert.equal(def, this.defBlock);
        });
        test('Multiple Procedures', function () {
          const def2 = this.workspace.newBlock(testSuite.defType);
          def2.setFieldValue('proc name2', 'NAME');
          const caller2 = this.workspace.newBlock(testSuite.callType);
          caller2.setFieldValue('proc name2', 'NAME');

          const def = Blockly.Procedures.getDefinition(
            'proc name',
            this.workspace,
          );
          assert.equal(def, this.defBlock);
        });
        test('Multiple Workspaces', function () {
          const workspace = new Blockly.Workspace();
          try {
            const def2 = workspace.newBlock(testSuite.defType);
            def2.setFieldValue('proc name', 'NAME');
            const caller2 = workspace.newBlock(testSuite.callType);
            caller2.setFieldValue('proc name', 'NAME');

            let def = Blockly.Procedures.getDefinition(
              'proc name',
              this.workspace,
            );
            assert.equal(def, this.defBlock);

            def = Blockly.Procedures.getDefinition('proc name', workspace);
            assert.equal(def, def2);
          } finally {
            workspaceTeardown.call(this, workspace);
          }
        });
      });

      suite('Mutation', function () {
        setup(function () {
          this.defBlock = Blockly.serialization.blocks.append(
            {
              'type': testSuite.defType,
              'fields': {
                'NAME': 'proc name',
              },
            },
            this.workspace,
          );
          this.callBlock = Blockly.serialization.blocks.append(
            {
              'type': testSuite.callType,
              'extraState': {
                'name': 'proc name',
              },
            },
            this.workspace,
          );
        });
        suite('Composition', function () {
          suite('Statements', function () {
            function setStatementValue(mainWorkspace, defBlock, value) {
              const mutatorWorkspace = new Blockly.Workspace(
                new Blockly.Options({
                  parentWorkspace: mainWorkspace,
                }),
              );
              defBlock.decompose(mutatorWorkspace);
              const containerBlock = mutatorWorkspace.getTopBlocks()[0];
              const statementField = containerBlock.getField('STATEMENTS');
              statementField.setValue(value);
              defBlock.compose(containerBlock);
            }
            if (testSuite.defType === 'procedures_defreturn') {
              test('Has Statements', function () {
                setStatementValue(this.workspace, this.defBlock, true);
                assert.isTrue(this.defBlock.hasStatements_);
              });
              test('Has No Statements', function () {
                setStatementValue(this.workspace, this.defBlock, false);
                assert.isFalse(this.defBlock.hasStatements_);
              });
              test('Saving Statements', function () {
                const blockXml = Blockly.utils.xml.textToDom(
                  '<block type="procedures_defreturn">' +
                    '  <statement name="STACK">' +
                    '    <block type="procedures_ifreturn" id="test"></block>' +
                    '  </statement> ' +
                    '</block>',
                );
                const defBlock = Blockly.Xml.domToBlock(
                  blockXml,
                  this.workspace,
                );
                setStatementValue(this.workspace, defBlock, false);
                assert.isNull(defBlock.getInput('STACK'));
                setStatementValue(this.workspace, defBlock, true);
                assert.isNotNull(defBlock.getInput('STACK'));
                const statementBlocks = defBlock.getChildren();
                assert.equal(statementBlocks.length, 1);
                const block = statementBlocks[0];
                assert.equal(block.type, 'procedures_ifreturn');
                assert.equal(block.id, 'test');
              });
            }
          });
          suite('Untyped Arguments', function () {
            async function createMutator(argArray) {
              const mutatorIcon = this.defBlock.getIcon(
                Blockly.icons.MutatorIcon.TYPE,
              );
              await mutatorIcon.setBubbleVisible(true);
              this.mutatorWorkspace = mutatorIcon.getWorkspace();
              this.containerBlock = this.mutatorWorkspace.getTopBlocks()[0];
              this.connection =
                this.containerBlock.getInput('STACK').connection;
              for (let i = 0; i < argArray.length; i++) {
                this.argBlock = this.mutatorWorkspace.newBlock(
                  'procedures_mutatorarg',
                );
                this.argBlock.setFieldValue(argArray[i], 'NAME');
                this.connection.connect(this.argBlock.previousConnection);
                this.connection = this.argBlock.nextConnection;
              }
              this.clock.runAll();
            }
            function assertArgs(argArray) {
              assert.equal(
                this.defBlock.getVars().length,
                argArray.length,
                'Expected the def to have the right number of arguments',
              );
              for (let i = 0; i < argArray.length; i++) {
                assert.equal(this.defBlock.getVars()[i], argArray[i]);
              }
              assert.equal(
                this.callBlock.getVars().length,
                argArray.length,
                'Expected the call to have the right number of arguments',
              );
              for (let i = 0; i < argArray.length; i++) {
                assert.equal(this.callBlock.getVars()[i], argArray[i]);
              }
            }
            test('Simple Add Arg', async function () {
              const args = ['arg1'];
              await createMutator.call(this, args);
              assertArgs.call(this, args);
            });
            test('Multiple Args', async function () {
              const args = ['arg1', 'arg2', 'arg3'];
              await createMutator.call(this, args);
              assertArgs.call(this, args);
            });
            test('Simple Change Arg', async function () {
              await createMutator.call(this, ['arg1']);
              this.argBlock.setFieldValue('arg2', 'NAME');
              this.defBlock.compose(this.containerBlock);
              assertArgs.call(this, ['arg2']);
            });
            test('lower -> CAPS', async function () {
              await createMutator.call(this, ['arg']);
              this.argBlock.setFieldValue('ARG', 'NAME');
              this.defBlock.compose(this.containerBlock);
              assertArgs.call(this, ['ARG']);
            });
            test('CAPS -> lower', async function () {
              await createMutator.call(this, ['ARG']);
              this.argBlock.setFieldValue('arg', 'NAME');
              this.defBlock.compose(this.containerBlock);
              assertArgs.call(this, ['arg']);
            });
            // Test case for #1958
            test('Set Arg Empty', async function () {
              const args = ['arg1'];
              await createMutator.call(this, args);
              this.argBlock.setFieldValue('', 'NAME');
              this.defBlock.compose(this.containerBlock);
              assertArgs.call(this, args);
            });
            test('Whitespace', async function () {
              const args = ['arg1'];
              await createMutator.call(this, args);
              this.argBlock.setFieldValue(' ', 'NAME');
              this.defBlock.compose(this.containerBlock);
              assertArgs.call(this, args);
            });
            test('Whitespace and Text', async function () {
              await createMutator.call(this, ['arg1']);
              this.argBlock.setFieldValue(' text ', 'NAME');
              this.defBlock.compose(this.containerBlock);
              assertArgs.call(this, ['text']);
            });
            test('<>', async function () {
              const args = ['<>'];
              await createMutator.call(this, args);
              assertArgs.call(this, args);
            });
          });
        });
        suite('Decomposition', function () {
          suite('Statements', function () {
            if (testSuite.defType === 'procedures_defreturn') {
              test('Has Statement Input', function () {
                const mutatorWorkspace = new Blockly.Workspace(
                  new Blockly.Options({
                    parentWorkspace: this.workspace,
                  }),
                );
                this.defBlock.decompose(mutatorWorkspace);
                const statementInput = mutatorWorkspace
                  .getTopBlocks()[0]
                  .getInput('STATEMENT_INPUT');
                assert.isNotNull(statementInput);
              });
              test('Has Statements', function () {
                this.defBlock.hasStatements_ = true;
                const mutatorWorkspace = new Blockly.Workspace(
                  new Blockly.Options({
                    parentWorkspace: this.workspace,
                  }),
                );
                this.defBlock.decompose(mutatorWorkspace);
                const statementValue = mutatorWorkspace
                  .getTopBlocks()[0]
                  .getField('STATEMENTS')
                  .getValueBoolean();
                assert.isTrue(statementValue);
              });
              test('No Has Statements', function () {
                this.defBlock.hasStatements_ = false;
                const mutatorWorkspace = new Blockly.Workspace(
                  new Blockly.Options({
                    parentWorkspace: this.workspace,
                  }),
                );
                this.defBlock.decompose(mutatorWorkspace);
                const statementValue = mutatorWorkspace
                  .getTopBlocks()[0]
                  .getField('STATEMENTS')
                  .getValueBoolean();
                assert.isFalse(statementValue);
              });
            } else {
              test('Has no Statement Input', function () {
                const mutatorWorkspace = new Blockly.Workspace(
                  new Blockly.Options({
                    parentWorkspace: this.workspace,
                  }),
                );
                this.defBlock.decompose(mutatorWorkspace);
                const statementInput = mutatorWorkspace
                  .getTopBlocks()[0]
                  .getInput('STATEMENT_INPUT');
                assert.isNull(statementInput);
              });
            }
          });
        });
      });
      /**
       * Test cases for serialization tests.
       * @type {Array<SerializationTestCase>}
       */
      const testCases = [
        {
          title: 'XML - Minimal definition',
          xml: '<block type="' + testSuite.defType + '"/>',
          expectedXml:
            '<block xmlns="https://developers.google.com/blockly/xml" ' +
            'type="' +
            testSuite.defType +
            '" id="1">\n' +
            '  <field name="NAME">unnamed</field>\n' +
            '</block>',
          assertBlockStructure: (block) => {
            assertDefBlockStructure(block, testSuite.hasReturn);
          },
        },
        {
          title: 'XML - Common definition',
          xml:
            '<block type="' +
            testSuite.defType +
            '">' +
            '  <field name="NAME">do something</field>' +
            '</block>',
          expectedXml:
            '<block xmlns="https://developers.google.com/blockly/xml" ' +
            'type="' +
            testSuite.defType +
            '" id="1">\n' +
            '  <field name="NAME">do something</field>\n' +
            '</block>',
          assertBlockStructure: (block) => {
            assertDefBlockStructure(block, testSuite.hasReturn);
          },
        },
        {
          title: 'XML - With vars definition',
          xml:
            '<block type="' +
            testSuite.defType +
            '">\n' +
            '  <mutation>\n' +
            '    <arg name="x" varid="arg1"></arg>\n' +
            '    <arg name="y" varid="arg2"></arg>\n' +
            '  </mutation>\n' +
            '  <field name="NAME">do something</field>\n' +
            '</block>',
          expectedXml:
            '<block xmlns="https://developers.google.com/blockly/xml" ' +
            'type="' +
            testSuite.defType +
            '" id="1">\n' +
            '  <mutation>\n' +
            '    <arg name="x" varid="arg1"></arg>\n' +
            '    <arg name="y" varid="arg2"></arg>\n' +
            '  </mutation>\n' +
            '  <field name="NAME">do something</field>\n' +
            '</block>',
          assertBlockStructure: (block) => {
            assertDefBlockStructure(
              block,
              testSuite.hasReturn,
              ['x', 'y'],
              ['arg1', 'arg2'],
            );
          },
        },
        {
          title: 'XML - With pre-created vars definition',
          xml:
            '<block type="' +
            testSuite.defType +
            '">\n' +
            '  <mutation>\n' +
            '    <arg name="preCreatedVar" varid="preCreatedVarId"></arg>\n' +
            '  </mutation>\n' +
            '  <field name="NAME">do something</field>\n' +
            '</block>',
          expectedXml:
            '<block xmlns="https://developers.google.com/blockly/xml" ' +
            'type="' +
            testSuite.defType +
            '" id="1">\n' +
            '  <mutation>\n' +
            '    <arg name="preCreatedVar" varid="preCreatedVarId"></arg>\n' +
            '  </mutation>\n' +
            '  <field name="NAME">do something</field>\n' +
            '</block>',
          assertBlockStructure: (block) => {
            assertDefBlockStructure(
              block,
              testSuite.hasReturn,
              ['preCreatedVar'],
              ['preCreatedVarId'],
            );
          },
        },
        {
          title: 'XML - No statements definition',
          xml:
            '<block type="procedures_defreturn">\n' +
            '  <mutation statements="false"></mutation>\n' +
            '  <field name="NAME">do something</field>\n' +
            '</block>',
          expectedXml:
            '<block xmlns="https://developers.google.com/blockly/xml" ' +
            'type="procedures_defreturn" id="1">\n' +
            '  <mutation statements="false"></mutation>\n' +
            '  <field name="NAME">do something</field>\n' +
            '</block>',
          assertBlockStructure: (block) => {
            assertDefBlockStructure(block, true, [], [], false);
          },
        },
        {
          title: 'XML - Minimal caller',
          xml: '<block type="' + testSuite.callType + '"/>',
          expectedXml:
            '<block xmlns="https://developers.google.com/blockly/xml" ' +
            'type="' +
            testSuite.callType +
            '" id="1">\n' +
            '  <mutation name="unnamed"></mutation>\n' +
            '</block>',
          assertBlockStructure: (block) => {
            assertCallBlockStructure(block);
          },
        },
        {
          title: 'XML - Common caller',
          xml:
            '<block type="' +
            testSuite.callType +
            '">\n' +
            '  <mutation name="do something"/>\n' +
            '</block>',
          expectedXml:
            '<block xmlns="https://developers.google.com/blockly/xml" ' +
            'type="' +
            testSuite.callType +
            '" id="1">\n' +
            '  <mutation name="do something"></mutation>\n' +
            '</block>',
          assertBlockStructure: (block) => {
            assertCallBlockStructure(block);
          },
        },
        {
          title: 'XML - With pre-created vars caller',
          xml:
            '<block type="' +
            testSuite.callType +
            '">\n' +
            '  <mutation name="do something">\n' +
            '    <arg name="preCreatedVar"></arg>\n' +
            '  </mutation>\n' +
            '</block>',
          expectedXml:
            '<block xmlns="https://developers.google.com/blockly/xml" ' +
            'type="' +
            testSuite.callType +
            '" id="1">\n' +
            '  <mutation name="do something">\n' +
            '    <arg name="preCreatedVar"></arg>\n' +
            '  </mutation>\n' +
            '</block>',
          assertBlockStructure: (block) => {
            assertCallBlockStructure(
              block,
              ['preCreatedVar'],
              ['preCreatedVarId'],
            );
          },
        },
        {
          title: 'JSON - Minimal definition',
          json: {
            'type': testSuite.defType,
          },
          expectedJson: {
            'type': testSuite.defType,
            'id': '1',
            'fields': {
              'NAME': 'unnamed',
            },
          },
          assertBlockStructure: (block) => {
            assertDefBlockStructure(block, testSuite.hasReturn);
          },
        },
        {
          title: 'JSON - Common definition',
          json: {
            'type': testSuite.defType,
            'fields': {
              'NAME': 'do something',
            },
          },
          expectedJson: {
            'type': testSuite.defType,
            'id': '1',
            'fields': {
              'NAME': 'do something',
            },
          },
          assertBlockStructure: (block) => {
            assertDefBlockStructure(block, testSuite.hasReturn);
          },
        },
        {
          title: 'JSON - With vars definition',
          json: {
            'type': testSuite.defType,
            'fields': {
              'NAME': 'do something',
            },
            'extraState': {
              'params': [
                {
                  'name': 'x',
                  'id': 'arg1',
                },
                {
                  'name': 'y',
                  'id': 'arg2',
                },
              ],
            },
          },
          expectedJson: {
            'type': testSuite.defType,
            'id': '1',
            'fields': {
              'NAME': 'do something',
            },
            'extraState': {
              'params': [
                {
                  'name': 'x',
                  'id': 'arg1',
                },
                {
                  'name': 'y',
                  'id': 'arg2',
                },
              ],
            },
          },
          assertBlockStructure: (block) => {
            assertDefBlockStructure(
              block,
              testSuite.hasReturn,
              ['x', 'y'],
              ['arg1', 'arg2'],
            );
          },
        },
        {
          title: 'JSON - With pre-created vars definition',
          json: {
            'type': testSuite.defType,
            'extraState': {
              'params': [
                {
                  'name': 'preCreatedVar',
                  'id': 'preCreatedVarId',
                },
              ],
            },
            'fields': {
              'NAME': 'do something',
            },
          },
          expectedJson: {
            'type': testSuite.defType,
            'id': '1',
            'fields': {
              'NAME': 'do something',
            },
            'extraState': {
              'params': [
                {
                  'name': 'preCreatedVar',
                  'id': 'preCreatedVarId',
                },
              ],
            },
          },
          assertBlockStructure: (block) => {
            assertDefBlockStructure(
              block,
              testSuite.hasReturn,
              ['preCreatedVar'],
              ['preCreatedVarId'],
            );
          },
        },
        {
          title: 'JSON - No statements definition',
          json: {
            'type': 'procedures_defreturn',
            'fields': {
              'NAME': 'do something',
            },
            'extraState': {
              'hasStatements': false,
            },
          },
          expectedJson: {
            'type': 'procedures_defreturn',
            'id': '1',
            'fields': {
              'NAME': 'do something',
            },
            'extraState': {
              'hasStatements': false,
            },
          },
          assertBlockStructure: (block) => {
            assertDefBlockStructure(block, true, [], [], false);
          },
        },
        {
          title: 'JSON - Minimal caller',
          json: {
            'type': testSuite.callType,
          },
          expectedJson: {
            'type': testSuite.callType,
            'id': '1',
            'extraState': {
              'name': 'unnamed',
            },
          },
          assertBlockStructure: (block) => {
            assertCallBlockStructure(block);
          },
        },
        {
          title: 'JSON - Common caller',
          json: {
            'type': testSuite.callType,
            'extraState': {
              'name': 'do something',
            },
          },
          expectedJson: {
            'type': testSuite.callType,
            'id': '1',
            'extraState': {
              'name': 'do something',
            },
          },
          assertBlockStructure: (block) => {
            assertCallBlockStructure(block);
          },
        },
        {
          title: 'JSON - With pre-created vars caller',
          json: {
            'type': testSuite.callType,
            'extraState': {
              'name': 'do something',
              'params': ['preCreatedVar'],
            },
          },
          expectedJson: {
            'type': testSuite.callType,
            'id': '1',
            'extraState': {
              'name': 'do something',
              'params': ['preCreatedVar'],
            },
          },
          assertBlockStructure: (block) => {
            assertCallBlockStructure(
              block,
              ['preCreatedVar'],
              ['preCreatedVarId'],
            );
          },
        },
      ];
      runSerializationTestSuite(testCases);
    });
  });
});
