/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

const Blockly = require('blockly/core');
const chai = require('chai');
const assert = chai.assert;
const sinon = require('sinon');

/**
 * Creates stub for Blockly.utils.idGenerator.genUid that returns the
 * provided id or ids.
 * Recommended to also assert that the stub is called the expected number of
 * times.
 * @param {string|!Array<string>} returnIds The return values to use for the
 *    created stub. If a single value is passed, then the stub always returns
 *    that value.
 * @returns {!sinon.SinonStub} The created stub.
 */
export function createGenUidStubWithReturns(returnIds) {
  const stub = sinon.stub(Blockly.utils.idGenerator.TEST_ONLY, 'genUid');
  if (Array.isArray(returnIds)) {
    for (let i = 0; i < returnIds.length; i++) {
      stub.onCall(i).returns(returnIds[i]);
    }
  } else {
    stub.returns(returnIds);
  }
  return stub;
}

/**
 * Asserts that the procedure definition or call block has the expected var
 * models.
 * @param {!Blockly.Block} block The procedure definition or call block to
 *    check.
 * @param {!Array<string>} varIds An array of variable ids.
 */
export function assertBlockVarModels(block, varIds) {
  const expectedVarModels = [];
  for (let i = 0; i < varIds.length; i++) {
    expectedVarModels.push(
      block.workspace.getVariableMap().getVariableById(varIds[i]),
    );
  }
  assert.sameDeepOrderedMembers(block.getVarModels(), expectedVarModels);
}

/**
 * Asserts that the procedure call block has the expected arguments.
 * @param {!Blockly.Block} callBlock The procedure definition block.
 * @param {Array<string>=} args An array of argument names.
 */
export function assertCallBlockArgsStructure(callBlock, args) {
  // inputList also contains "TOPROW"
  assert.equal(
    callBlock.inputList.length - 1,
    args.length,
    'call block has the expected number of args',
  );

  for (let i = 0; i < args.length; i++) {
    const expectedName = args[i];
    const callInput = callBlock.inputList[i + 1];
    assert.equal(callInput.type, Blockly.ConnectionType.INPUT_VALUE);
    assert.equal(callInput.name, 'ARG' + i);
    assert.equal(
      callInput.fieldRow[0].getValue(),
      expectedName,
      'Call block consts did not match expected.',
    );
  }
  assert.sameOrderedMembers(callBlock.getVars(), args);
}

/**
 * Asserts that the procedure definition block has the expected inputs and
 *    fields.
 * @param {!Blockly.Block} defBlock The procedure definition block.
 * @param {boolean=} hasReturn If we expect the procedure def to have a return
 *     input or not.
 * @param {Array<string>=} args An array of argument names.
 * @param {Array<string>=} varIds An array of variable ids.
 * @param {boolean=} hasStatements If we expect the procedure def to have a
 *     statement input or not.
 */
export function assertDefBlockStructure(
  defBlock,
  hasReturn = false,
  args = [],
  varIds = [],
  hasStatements = true,
) {
  if (hasStatements) {
    assert.isNotNull(
      defBlock.getInput('STACK'),
      'Def block should have STACK input',
    );
  } else {
    assert.isNull(
      defBlock.getInput('STACK'),
      'Def block should not have STACK input',
    );
  }
  if (hasReturn) {
    assert.isNotNull(
      defBlock.getInput('RETURN'),
      'Def block should have RETURN input',
    );
  } else {
    assert.isNull(
      defBlock.getInput('RETURN'),
      'Def block should not have RETURN input',
    );
  }
  if (args.length) {
    assert.include(
      defBlock.toString(),
      'with',
      'Def block string should include "with"',
    );
  } else {
    assert.notInclude(
      defBlock.toString(),
      'with',
      'Def block string should not include "with"',
    );
  }

  assert.sameOrderedMembers(defBlock.getVars(), args);
  assertBlockVarModels(defBlock, varIds);
}

/**
 * Asserts that the procedure call block has the expected inputs and
 *    fields.
 * @param {!Blockly.Block} callBlock The procedure call block.
 * @param {Array<string>=} args An array of argument names.
 * @param {Array<string>=} varIds An array of variable ids.
 * @param {string=} name The name we expect the caller to have.
 */
export function assertCallBlockStructure(
  callBlock,
  args = [],
  varIds = [],
  name = undefined,
) {
  if (args.length) {
    assert.include(callBlock.toString(), 'with');
  } else {
    assert.notInclude(callBlock.toString(), 'with');
  }

  assertCallBlockArgsStructure(callBlock, args);
  assertBlockVarModels(callBlock, varIds);
  if (name !== undefined) {
    assert.equal(callBlock.getFieldValue('NAME'), name);
  }
}

/**
 * Creates procedure definition block using domToBlock call.
 * @param {!Blockly.Workspace} workspace The Blockly workspace.
 * @param {boolean=} hasReturn Whether the procedure definition should have
 *    return.
 * @param {Array<string>=} args An array of argument names.
 * @param {string=} name The name of the def block (defaults to 'proc name').
 * @returns {Blockly.Block} The created block.
 */
export function createProcDefBlock(
  workspace,
  hasReturn = false,
  args = [],
  name = 'proc name',
) {
  return Blockly.serialization.blocks.append(
    {
      type: hasReturn ? 'procedures_defreturn' : 'procedures_defnoreturn',
      fields: {
        NAME: name,
      },
      extraState: {
        params: args.map((a) => ({name: a})),
      },
    },
    workspace,
  );
}

/**
 * Creates procedure call block using domToBlock call.
 * @param {!Blockly.Workspace} workspace The Blockly workspace.
 * @param {boolean=} hasReturn Whether the corresponding procedure definition
 *    has return.
 * @param {string=} name The name of the caller block
 *     (defaults to 'proc name').
 * @returns {Blockly.Block} The created block.
 */
export function createProcCallBlock(
  workspace,
  hasReturn = false,
  name = 'proc name',
) {
  return Blockly.serialization.blocks.append(
    {
      type: hasReturn ? 'procedures_callreturn' : 'procedures_callnoreturn',
      extraState: {
        name: name,
      },
    },
    workspace,
  );
}
