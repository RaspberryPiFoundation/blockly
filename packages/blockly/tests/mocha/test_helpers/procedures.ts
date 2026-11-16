/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';

/**
 * Asserts that the procedure definition or call block has the expected var
 * models.
 *
 * @param block The procedure definition or call block to check.
 * @param varIds An array of variable ids.
 */
function assertBlockVarModels(block: Blockly.Block, varIds: string[]) {
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
 *
 * @param callBlock The procedure definition block.
 * @param args An array of argument names.
 */
function assertCallBlockArgsStructure(
  callBlock: Blockly.Block,
  args: string[],
) {
  // inputList also contains "TOPROW"
  assert.equal(
    callBlock.inputList.length - 1,
    args.length,
    'call block has the expected number of args',
  );

  for (let i = 0; i < args.length; i++) {
    const expectedName = args[i];
    const callInput = callBlock.inputList[i + 1];
    assert.equal(callInput.type, Blockly.inputs.inputTypes.VALUE);
    assert.equal(callInput.name, 'ARG' + i);
    assert.equal(
      callInput.fieldRow[0].getValue(),
      expectedName,
      'Call block consts did not match expected.',
    );
  }
  assert.sameOrderedMembers(
    callBlock.getVarModels().map((model) => model.getName()),
    args,
  );
}

/**
 * Asserts that the procedure definition block has the expected inputs and
 *    fields.
 *
 * @param defBlock The procedure definition block.
 * @param hasReturn If we expect the procedure def to have a return input or
 *     not.
 * @param args An array of argument names.
 * @param varIds An array of variable ids.
 * @param hasStatements If we expect the procedure def to have a statement
 *     input or not.
 */
export function assertDefBlockStructure(
  defBlock: Blockly.Block,
  hasReturn = false,
  args: string[] = [],
  varIds: string[] = [],
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

  assert.sameOrderedMembers(
    defBlock.getVarModels().map((model) => model.getName()),
    args,
  );
  assertBlockVarModels(defBlock, varIds);
}

/**
 * Asserts that the procedure call block has the expected inputs and fields.
 *
 * @param callBlock The procedure call block.
 * @param args An array of argument names.
 * @param varIds An array of variable ids.
 * @param name The name we expect the caller to have.
 */
export function assertCallBlockStructure(
  callBlock: Blockly.Block,
  args: string[] = [],
  varIds: string[] = [],
  name?: string,
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
 *
 * @param workspace The Blockly workspace.
 * @param hasReturn Whether the procedure definition should have return.
 * @param args An array of argument names.
 * @param name The name of the def block (defaults to 'proc name').
 * @return The created block.
 */
export function createProcDefBlock(
  workspace: Blockly.Workspace,
  hasReturn = false,
  args: string[] = [],
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
 *
 * @param workspace The Blockly workspace.
 * @param hasReturn Whether the corresponding procedure definition has return.
 * @param name The name of the caller block (defaults to 'proc name').
 * @return The created block.
 */
export function createProcCallBlock(
  workspace: Blockly.Workspace,
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

export class MockProcedureModel implements Blockly.procedures.IProcedureModel {
  private readonly id = Blockly.utils.idGenerator.genUid();
  private name: string;
  private readonly parameters: Blockly.procedures.IParameterModel[] = [];
  private returnTypes: string[] | null = null;
  private enabled = true;
  constructor(name = '') {
    this.name = name;
  }

  static loadState(_state: object, _workspace: Blockly.Workspace) {
    return new MockProcedureModel();
  }

  saveState() {
    return {id: this.id, name: this.name, returnTypes: this.returnTypes};
  }

  setName(name: string) {
    this.name = name;
    return this;
  }

  insertParameter(
    parameterModel: Blockly.procedures.IParameterModel,
    index: number,
  ) {
    this.parameters.splice(index, 0, parameterModel);
    return this;
  }

  deleteParameter(index: number) {
    this.parameters.splice(index, 1);
    return this;
  }

  setReturnTypes(types: string[]) {
    this.returnTypes = types;
    return this;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    return this;
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  getParameter(index: number) {
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

export class MockParameterModel implements Blockly.procedures.IParameterModel {
  private readonly id = Blockly.utils.idGenerator.genUid();
  private types: string[] = [];
  private name: string;
  constructor(name: string) {
    this.name = name;
  }

  static loadState(_state: object, _workspace: Blockly.Workspace) {
    return new MockParameterModel('test');
  }

  setProcedureModel(_model: Blockly.procedures.IProcedureModel) {
    return this;
  }

  saveState() {
    return {id: this.id, name: this.name};
  }

  setName(name: string) {
    this.name = name;
    return this;
  }

  setTypes(types: string[]) {
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
  private variable: Blockly.VariableModel;

  constructor(name: string, workspace: Blockly.Workspace) {
    super(name);
    this.variable = new Blockly.VariableModel(workspace, name);
  }

  getVariableModel() {
    return this.variable;
  }
}
