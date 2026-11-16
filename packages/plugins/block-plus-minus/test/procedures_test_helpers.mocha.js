/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const chai = require('chai');
const Blockly = require('blockly');

require('../src/index');
const assert = chai.assert;

/**
 * Asserts that the procedure definition block has the expected inputs and
 *    fields.
 * @param {!Blockly.Block} defBlock The procedure definition block.
 * @param {boolean=} hasReturn If we expect the procedure def to have a return
 *     input or not.
 * @param {Array<string>=} args An array of argument names.
 * @param {boolean=} hasStatements If we expect the procedure def to have a
 *     statement input or not.
 */
function assertDefBlockStructure(
  defBlock,
  hasReturn = false,
  args = [],
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

  assertDefBlockArgsStructure_(defBlock, hasReturn, args, hasStatements);
}

/**
 * Asserts that the procedure definition block has the expected inputs and
 *    fields.
 * @param {!Blockly.Block} callBlock The procedure call block.
 * @param {Array<string>=} args An array of argument names.
 */
function assertCallBlockStructure(callBlock, args = []) {
  if (args.length) {
    assert.include(callBlock.toString(), 'with');
  } else {
    assert.notInclude(callBlock.toString(), 'with');
  }

  assertCallBlockArgsStructure_(callBlock, args);
}

/**
 * Asserts that the procedure definition block has the expected arguments.
 * @param {!Blockly.Block} defBlock The procedure definition block.
 * @param {boolean=} hasReturn If we expect the procedure def to have a return
 *     input or not.
 * @param {Array<string>=} args An array of argument names.
 * @param {boolean=} hasStatements If we expect the procedure def to have
 *     a statement input or not.
 * @private
 */
function assertDefBlockArgsStructure_(
  defBlock,
  hasReturn,
  args,
  hasStatements,
) {
  // inputList also contains "TOP" input and optionally "RETURN" and "STACK"
  let defArgCount = defBlock.inputList.length - 1;
  if (hasReturn) {
    defArgCount--;
  }
  if (hasStatements) {
    defArgCount--;
  }

  assert.equal(
    defArgCount,
    args.length,
    'def block has the expected number of args',
  );

  assert.sameOrderedMembers(defBlock.getVars(), args);

  if (!args.length) {
    return;
  }

  const argIds = defBlock.argData_.map((element) => element.argId);
  for (let i = 0; i < args.length; i++) {
    const expectedName = args[i];
    const defInput = defBlock.inputList[i + 1];
    assert.equal(defInput.type, Blockly.inputs.inputTypes.DUMMY);
    assert.equal(defInput.name, argIds[i]);
    assert.equal(
      defInput.fieldRow[2].getValue(),
      expectedName,
      'def block consts did not match expected',
    );
  }

  // Assert the last input is not a dummy. Sometimes
  // arg inputs don't get moved which is bad.
  const lastInput = defBlock.inputList[defBlock.inputList.length - 1];
  assert.notEqual(
    lastInput.type,
    Blockly.inputs.inputTypes.DUMMY,
    'last input is not a dummy',
  );
}

/**
 * Asserts that the procedure call block has the expected arguments.
 * @param {!Blockly.Block} callBlock The procedure definition block.
 * @param {Array<string>=} args An array of argument names.
 * @private
 */
function assertCallBlockArgsStructure_(callBlock, args) {
  // inputList also contains "TOPROW"
  assert.equal(
    callBlock.inputList.length - 1,
    args.length,
    'call block has the expected number of args',
  );

  for (let i = 0; i < args.length; i++) {
    const expectedName = args[i];
    const callInput = callBlock.inputList[i + 1];
    assert.equal(callInput.type, Blockly.INPUT_VALUE);
    assert.equal(callInput.name, 'ARG' + i);
    assert.equal(
      callInput.fieldRow[0].getValue(),
      expectedName,
      'Call block consts did not match expected.',
    );
  }
}

/**
 * Asserts that the procedure definition and call blocks have the expected
 *    inputs and fields.
 * @param {!Blockly.Block} def The procedure definition block.
 * @param {!Blockly.Block} call The procedure call block.
 * @param {boolean=} hasReturn If we expect the procedure def to have a return
 *     input or not.
 * @param {Array<string>=} args An array of argument names.
 * @param {boolean=} hasStatements If we expect the procedure def to have
 *     a statement input or not.
 */
function assertProcBlocksStructure(
  def,
  call,
  hasReturn = false,
  args = [],
  hasStatements = true,
) {
  assertDefBlockStructure(def, hasReturn, args, hasStatements);
  assertCallBlockStructure(call, args);
}

/**
 * Creates procedure definition block using domToBlock call.
 * @param {!Blockly.Workspace} workspace The Blockly workspace.
 * @param {boolean=} hasReturn Whether the procedure definition should have
 *    return.
 * @param {string=} nameId The procedure name.
 * @param {boolean=} hasStatements Whether the block has statements (STACK).
 * @returns {Blockly.Block} The created block.
 */
function createProcDefBlock(
  workspace,
  hasReturn = false,
  nameId = 'proc name',
  hasStatements = true,
) {
  const type = hasReturn ? 'procedures_defreturn' : 'procedures_defnoreturn';
  return Blockly.Xml.domToBlock(
    Blockly.utils.xml.textToDom(
      '<block type="' +
        type +
        '">' +
        (hasStatements
          ? ''
          : '    <mutation statements="false"></mutation>\n') +
        '  <field name="NAME">' +
        nameId +
        '</field>' +
        '</block>',
    ),
    workspace,
  );
}

/**
 * Creates procedure call block using domToBlock call.
 * @param {!Blockly.Workspace} workspace The Blockly workspace.
 * @param {boolean=} hasReturn Whether the corresponding procedure definition
 *    has return.
 * @param {string=} nameId The procedure name.
 * @returns {Blockly.Block} The created block.
 */
function createProcCallBlock(
  workspace,
  hasReturn = false,
  nameId = 'proc name',
) {
  const type = hasReturn ? 'procedures_callreturn' : 'procedures_callnoreturn';
  return Blockly.Xml.domToBlock(
    Blockly.utils.xml.textToDom(
      '<block type="' +
        type +
        '">' +
        '  <mutation name="' +
        nameId +
        '"/>' +
        '</block>',
    ),
    workspace,
  );
}

module.exports = {
  assertDefBlockStructure,
  assertCallBlockStructure,
  assertProcBlocksStructure,
  createProcDefBlock,
  createProcCallBlock,
};
