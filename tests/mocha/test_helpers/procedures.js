/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ConnectionType} from '../../../build/src/core/connection_type.js';
import {VariableModel} from '../../../build/src/core/variable_model.js';
import {assert} from '../../../node_modules/chai/index.js';

/**
 * Asserts that the procedure definition or call block has the expected var
 * models.
 * @param {!Blockly.Block} block The procedure definition or call block to
 *    check.
 * @param {!Array<string>} varIds An array of variable ids.
 */
function assertBlockVarModels(block, varIds) {
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
function assertCallBlockArgsStructure(callBlock, args) {
  // inputList also contains "TOPROW"
  assert.equal(
    callBlock.inputList.length - 1,
    args.length,
    'call block has the expected number of args',
  );

  for (let i = 0; i < args.length; i++) {
    const expectedName = args[i];
    const callInput = callBlock.inputList[i + 1];
    assert.equal(callInput.type, ConnectionType.INPUT_VALUE);
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
 * @return {Blockly.Block} The created block.
 */
export function createProcDefBlock(
  workspace,
  hasReturn = false,
  args = [],
  name = 'proc name',
) {
  const type = hasReturn ? 'procedures_defreturn' : 'procedures_defnoreturn';
  let xml = `<block type="${type}">`;
  for (let i = 0; i < args.length; i++) {
    xml += `    <mutation><arg name="${args[i]}"></arg></mutation>\n`;
  }
  xml += `  <field name="NAME">${name}</field>` + '</block>';
  return Blockly.Xml.domToBlock(Blockly.utils.xml.textToDom(xml), workspace);
}

/**
 * Creates procedure call block using domToBlock call.
 * @param {!Blockly.Workspace} workspace The Blockly workspace.
 * @param {boolean=} hasReturn Whether the corresponding procedure definition
 *    has return.
 * @param {string=} name The name of the caller block (defaults to 'proc name').
 * @return {Blockly.Block} The created block.
 */
export function createProcCallBlock(
  workspace,
  hasReturn = false,
  name = 'proc name',
) {
  const type = hasReturn ? 'procedures_callreturn' : 'procedures_callnoreturn';
  return Blockly.Xml.domToBlock(
    Blockly.utils.xml.textToDom(
      `<block type="${type}">` + `  <mutation name="${name}"/>` + `</block>`,
    ),
    workspace,
  );
}

export class MockProcedureModel {
  constructor(name = '') {
    this.id = Blockly.utils.idGenerator.genUid();
    this.name = name;
    this.parameters = [];
    this.returnTypes = null;
    this.enabled = true;
  }

  static loadState(state, workspace) {
    return new MockProcedureModel();
  }

  saveState() {
    return {};
  }

  setName(name) {
    this.name = name;
    return this;
  }

  insertParameter(parameterModel, index) {
    this.parameters.splice(index, 0, parameterModel);
    return this;
  }

  deleteParameter(index) {
    this.parameters.splice(index, 1);
    return this;
  }

  setReturnTypes(types) {
    this.returnTypes = types;
    return this;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    return this;
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  getParameter(index) {
    return this.parameters[index];
  }

  getParameters() {
    return [...this.parameters];
  }

  getReturnTypes() {
    return this.returnTypes;
  }

  getEnabled() {
    return this.enabled;
  }

  startPublishing() {}

  stopPublishing() {}
}

export class MockParameterModel {
  constructor(name) {
    this.id = Blockly.utils.idGenerator.genUid();
    this.name = name;
    this.types = [];
  }

  static loadState(state, workspace) {
    return new MockParameterModel('test');
  }

  saveState() {
    return {};
  }

  setName(name) {
    this.name = name;
    return this;
  }

  setTypes(types) {
    this.types = types;
    return this;
  }

  getName() {
    return this.name;
  }

  getTypes() {
    return this.types;
  }

  getId() {
    return this.id;
  }
}

export class MockParameterModelWithVar extends MockParameterModel {
  constructor(name, workspace) {
    super(name);
    this.variable = new VariableModel(workspace, name);
  }

  getVariableModel() {
    return this.variable;
  }
}
