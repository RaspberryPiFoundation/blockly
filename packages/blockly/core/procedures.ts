/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.Procedures

// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_block_change.js';

import type {Block} from './block.js';
import type {BlockSvg} from './block_svg.js';
import {Blocks} from './blocks.js';
import * as common from './common.js';
import type {Abstract} from './events/events_abstract.js';
import type {BubbleOpen} from './events/events_bubble_open.js';
import {
  isBlockChange,
  isBlockCreate,
  isBlockDelete,
  isBlockFieldIntermediateChange,
  isBubbleOpen,
} from './events/predicates.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import {Field, UnattachedFieldError} from './field.js';
import {MutatorIcon} from './icons.js';
import {
  isLegacyProcedureCallBlock,
  isLegacyProcedureDefBlock,
  ProcedureBlock,
  ProcedureTuple,
} from './interfaces/i_legacy_procedure_blocks.js';
import {IParameterModel} from './interfaces/i_parameter_model.js';
import {
  IProcedureBlock,
  isProcedureBlock,
} from './interfaces/i_procedure_block.js';
import {IProcedureMap} from './interfaces/i_procedure_map.js';
import {IProcedureModel} from './interfaces/i_procedure_model.js';
import {Msg} from './msg.js';
import {Names} from './names.js';
import {ObservableProcedureMap} from './observable_procedure_map.js';
import * as deprecation from './utils/deprecation.js';
import type {FlyoutItemInfo} from './utils/toolbox.js';
import * as utilsXml from './utils/xml.js';
import * as Variables from './variables.js';
import type {Workspace} from './workspace.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * String for use in the "custom" attribute of a category in toolbox XML.
 * This string indicates that the category should be dynamically populated with
 * procedure blocks.
 * See also Blockly.Variables.CATEGORY_NAME and
 * Blockly.VariablesDynamic.CATEGORY_NAME.
 */
export const CATEGORY_NAME = 'PROCEDURE';

/**
 * The default argument for a procedures_mutatorarg block.
 */
export const DEFAULT_ARG = 'x';

/**
 * Find all user-created procedure definitions in a workspace.
 *
 * @param root Root workspace.
 * @returns Pair of arrays, the first contains procedures without return
 *     variables, the second with. Each procedure is defined by a three-element
 *     list of name, parameter list, and return value boolean.
 */
export function allProcedures(
  root: Workspace,
): [ProcedureTuple[], ProcedureTuple[]] {
  const proceduresNoReturn: ProcedureTuple[] = root
    .getProcedureMap()
    .getProcedures()
    .filter((p) => !p.getReturnTypes())
    .map((p) => [
      p.getName(),
      p.getParameters().map((pa) => pa.getName()),
      false,
    ]);
  root.getBlocksByType('procedures_defnoreturn', false).forEach((b) => {
    if (!isProcedureBlock(b) && isLegacyProcedureDefBlock(b)) {
      proceduresNoReturn.push(b.getProcedureDef());
    }
  });

  const proceduresReturn: ProcedureTuple[] = root
    .getProcedureMap()
    .getProcedures()
    .filter((p) => !!p.getReturnTypes())
    .map((p) => [
      p.getName(),
      p.getParameters().map((pa) => pa.getName()),
      true,
    ]);
  root.getBlocksByType('procedures_defreturn', false).forEach((b) => {
    if (!isProcedureBlock(b) && isLegacyProcedureDefBlock(b)) {
      proceduresReturn.push(b.getProcedureDef());
    }
  });
  proceduresNoReturn.sort(procTupleComparator);
  proceduresReturn.sort(procTupleComparator);
  return [proceduresNoReturn, proceduresReturn];
}

/**
 * Comparison function for case-insensitive sorting of the first element of
 * a tuple.
 *
 * @param ta First tuple.
 * @param tb Second tuple.
 * @returns -1, 0, or 1 to signify greater than, equality, or less than.
 */
function procTupleComparator(ta: ProcedureTuple, tb: ProcedureTuple): number {
  return ta[0].localeCompare(tb[0], undefined, {sensitivity: 'base'});
}

/**
 * Ensure two identically-named procedures don't exist.
 * Take the proposed procedure name, and return a legal name i.e. one that
 * is not empty and doesn't collide with other procedures.
 *
 * @param name Proposed procedure name.
 * @param block Block to disambiguate.
 * @returns Non-colliding name.
 */
export function findLegalName(name: string, block: Block): string {
  if (block.isInFlyout) {
    // Flyouts can have multiple procedures called 'do something'.
    return name;
  }
  name = name || Msg['UNNAMED_KEY'] || 'unnamed';
  while (!isLegalName(name, block.workspace, block)) {
    // Collision with another procedure.
    const r = name.match(/^(.*?)(\d+)$/);
    if (!r) {
      name += '2';
    } else {
      name = r[1] + (parseInt(r[2]) + 1);
    }
  }
  return name;
}
/**
 * Does this procedure have a legal name?  Illegal names include names of
 * procedures already defined.
 *
 * @param name The questionable name.
 * @param workspace The workspace to scan for collisions.
 * @param opt_exclude Optional block to exclude from comparisons (one doesn't
 *     want to collide with oneself).
 * @returns True if the name is legal.
 */
function isLegalName(
  name: string,
  workspace: Workspace,
  opt_exclude?: Block,
): boolean {
  return !isNameUsed(name, workspace, opt_exclude);
}

/**
 * Return if the given name is already a procedure name.
 *
 * @param name The questionable name.
 * @param workspace The workspace to scan for collisions.
 * @param opt_exclude Optional block to exclude from comparisons (one doesn't
 *     want to collide with oneself).
 * @returns True if the name is used, otherwise return false.
 */
export function isNameUsed(
  name: string,
  workspace: Workspace,
  opt_exclude?: Block,
): boolean {
  for (const block of workspace.getAllBlocks(false)) {
    if (block === opt_exclude) continue;

    if (
      isLegacyProcedureDefBlock(block) &&
      Names.equals(block.getProcedureDef()[0], name)
    ) {
      return true;
    }
  }

  const excludeModel =
    opt_exclude && isProcedureBlock(opt_exclude)
      ? opt_exclude?.getProcedureModel()
      : undefined;
  for (const model of workspace.getProcedureMap().getProcedures()) {
    if (model === excludeModel) continue;
    if (Names.equals(model.getName(), name)) return true;
  }
  return false;
}

/**
 * Rename a procedure.  Called by the editable field.
 *
 * @param name The proposed new name.
 * @returns The accepted name.
 */
export function rename(this: Field, name: string): string {
  const block = this.getSourceBlock();
  if (!block) {
    throw new UnattachedFieldError();
  }

  // Strip leading and trailing whitespace.  Beyond this, all names are legal.
  name = name.trim();

  const legalName = findLegalName(name, block);
  if (isProcedureBlock(block) && !block.isInsertionMarker()) {
    block.getProcedureModel().setName(legalName);
  }
  const oldName = this.getValue();
  if (oldName !== name && oldName !== legalName) {
    // Rename any callers.
    const blocks = block.workspace.getAllBlocks(false);
    for (let i = 0; i < blocks.length; i++) {
      // Assume it is a procedure so we can check.
      const procedureBlock = blocks[i] as unknown as ProcedureBlock;
      if (procedureBlock.renameProcedure) {
        procedureBlock.renameProcedure(oldName as string, legalName);
      }
    }
  }
  return legalName;
}

/**
 * Construct the blocks required by the flyout for the procedure category.
 *
 * @param workspace The workspace containing procedures.
 * @returns Array of XML block elements.
 */
function xmlFlyoutCategory(workspace: WorkspaceSvg): Element[] {
  const xmlList = [];
  if (Blocks['procedures_defnoreturn']) {
    // <block type="procedures_defnoreturn" gap="16">
    //     <field name="NAME">do something</field>
    // </block>
    const block = utilsXml.createElement('block');
    block.setAttribute('type', 'procedures_defnoreturn');
    block.setAttribute('gap', '16');
    const nameField = utilsXml.createElement('field');
    nameField.setAttribute('name', 'NAME');
    nameField.appendChild(
      utilsXml.createTextNode(Msg['PROCEDURES_DEFNORETURN_PROCEDURE']),
    );
    block.appendChild(nameField);
    xmlList.push(block);
  }
  if (Blocks['procedures_defreturn']) {
    // <block type="procedures_defreturn" gap="16">
    //     <field name="NAME">do something</field>
    // </block>
    const block = utilsXml.createElement('block');
    block.setAttribute('type', 'procedures_defreturn');
    block.setAttribute('gap', '16');
    const nameField = utilsXml.createElement('field');
    nameField.setAttribute('name', 'NAME');
    nameField.appendChild(
      utilsXml.createTextNode(Msg['PROCEDURES_DEFRETURN_PROCEDURE']),
    );
    block.appendChild(nameField);
    xmlList.push(block);
  }
  if (Blocks['procedures_ifreturn']) {
    // <block type="procedures_ifreturn" gap="16"></block>
    const block = utilsXml.createElement('block');
    block.setAttribute('type', 'procedures_ifreturn');
    block.setAttribute('gap', '16');
    xmlList.push(block);
  }
  if (xmlList.length) {
    // Add slightly larger gap between system blocks and user calls.
    xmlList[xmlList.length - 1].setAttribute('gap', '24');
  }

  /**
   * Add items to xmlList for each listed procedure.
   *
   * @param procedureList A list of procedures, each of which is defined by a
   *     three-element list of name, parameter list, and return value boolean.
   * @param templateName The type of the block to generate.
   */
  function populateProcedures(
    procedureList: ProcedureTuple[],
    templateName: string,
  ) {
    for (let i = 0; i < procedureList.length; i++) {
      const name = procedureList[i][0];
      const args = procedureList[i][1];
      // <block type="procedures_callnoreturn" gap="16">
      //   <mutation name="do something">
      //     <arg name="x"></arg>
      //   </mutation>
      // </block>
      const block = utilsXml.createElement('block');
      block.setAttribute('type', templateName);
      block.setAttribute('gap', '16');
      const mutation = utilsXml.createElement('mutation');
      mutation.setAttribute('name', name);
      block.appendChild(mutation);
      for (let j = 0; j < args.length; j++) {
        const arg = utilsXml.createElement('arg');
        arg.setAttribute('name', args[j]);
        mutation.appendChild(arg);
      }
      xmlList.push(block);
    }
  }

  const tuple = allProcedures(workspace);
  populateProcedures(tuple[0], 'procedures_callnoreturn');
  populateProcedures(tuple[1], 'procedures_callreturn');
  return xmlList;
}

/**
 * Internal wrapper that returns the contents of the procedure category.
 *
 * @internal
 * @param workspace The workspace to populate procedure blocks for.
 */
export function internalFlyoutCategory(
  workspace: WorkspaceSvg,
): FlyoutItemInfo[] {
  return flyoutCategory(workspace, false);
}

export function flyoutCategory(
  workspace: WorkspaceSvg,
  useXml: true,
): Element[];
export function flyoutCategory(
  workspace: WorkspaceSvg,
  useXml: false,
): FlyoutItemInfo[];
/**
 * Construct the blocks required by the flyout for the procedure category.
 *
 * @param workspace The workspace containing procedures.
 * @param useXml True to return the contents as XML, false to use JSON.
 * @returns List of flyout contents as either XML or JSON.
 */
export function flyoutCategory(
  workspace: WorkspaceSvg,
  useXml = true,
): Element[] | FlyoutItemInfo[] {
  if (useXml) {
    deprecation.warn(
      'The XML return value of Blockly.Procedures.flyoutCategory()',
      'v12',
      'v13',
      'the same method, but handle a return type of FlyoutItemInfo[] (JSON) instead.',
    );
    return xmlFlyoutCategory(workspace);
  }
  const blocks = [];
  if (Blocks['procedures_defnoreturn']) {
    blocks.push({
      'kind': 'block',
      'type': 'procedures_defnoreturn',
      'gap': 16,
      'fields': {
        'NAME': Msg['PROCEDURES_DEFNORETURN_PROCEDURE'],
      },
    });
  }
  if (Blocks['procedures_defreturn']) {
    blocks.push({
      'kind': 'block',
      'type': 'procedures_defreturn',
      'gap': 16,
      'fields': {
        'NAME': Msg['PROCEDURES_DEFRETURN_PROCEDURE'],
      },
    });
  }
  if (Blocks['procedures_ifreturn']) {
    blocks.push({
      'kind': 'block',
      'type': 'procedures_ifreturn',
      'gap': 16,
    });
  }
  if (blocks.length) {
    // Add slightly larger gap between system blocks and user calls.
    blocks[blocks.length - 1]['gap'] = 24;
  }

  /**
   * Creates JSON block definitions for each of the given procedures.
   *
   * @param procedureList A list of procedures, each of which is defined by a
   *     three-element list of name, parameter list, and return value boolean.
   * @param templateName The type of the block to generate.
   */
  function populateProcedures(
    procedureList: ProcedureTuple[],
    templateName: string,
  ) {
    for (const [name, args] of procedureList) {
      blocks.push({
        'kind': 'block',
        'type': templateName,
        'gap': 16,
        'extraState': {
          'name': name,
          'params': args,
        },
      });
    }
  }

  const tuple = allProcedures(workspace);
  populateProcedures(tuple[0], 'procedures_callnoreturn');
  populateProcedures(tuple[1], 'procedures_callreturn');
  return blocks;
}

/**
 * Updates the procedure mutator's flyout so that the arg block is not a
 * duplicate of another arg.
 *
 * @param workspace The procedure mutator's workspace. This workspace's flyout
 *     is what is being updated.
 */
function updateMutatorFlyout(workspace: WorkspaceSvg) {
  const usedNames = [];
  const blocks = workspace.getBlocksByType('procedures_mutatorarg', false);
  for (let i = 0, block; (block = blocks[i]); i++) {
    usedNames.push(block.getFieldValue('NAME'));
  }

  const xmlElement = utilsXml.createElement('xml');
  const argBlock = utilsXml.createElement('block');
  argBlock.setAttribute('type', 'procedures_mutatorarg');
  const nameField = utilsXml.createElement('field');
  nameField.setAttribute('name', 'NAME');
  const argValue = Variables.generateUniqueNameFromOptions(
    DEFAULT_ARG,
    usedNames,
  );
  const fieldContent = utilsXml.createTextNode(argValue);

  nameField.appendChild(fieldContent);
  argBlock.appendChild(nameField);
  xmlElement.appendChild(argBlock);

  workspace.updateToolbox(xmlElement);
}

/**
 * Listens for when a procedure mutator is opened. Then it triggers a flyout
 * update and adds a mutator change listener to the mutator workspace.
 *
 * @param e The event that triggered this listener.
 * @internal
 */
export function mutatorOpenListener(e: Abstract) {
  if (!isBubbleOpen(e)) return;

  const bubbleEvent = e as BubbleOpen;
  if (
    !(bubbleEvent.bubbleType === 'mutator' && bubbleEvent.isOpen) ||
    !bubbleEvent.blockId
  ) {
    return;
  }
  const workspaceId = bubbleEvent.workspaceId;
  const block = common
    .getWorkspaceById(workspaceId)!
    .getBlockById(bubbleEvent.blockId) as BlockSvg;
  const type = block.type;
  if (type !== 'procedures_defnoreturn' && type !== 'procedures_defreturn') {
    return;
  }
  const workspace = (
    block.getIcon(MutatorIcon.TYPE) as MutatorIcon
  ).getWorkspace()!;
  updateMutatorFlyout(workspace);
  workspace.addChangeListener(mutatorChangeListener);
}
/**
 * Listens for changes in a procedure mutator and triggers flyout updates when
 * necessary.
 *
 * @param e The event that triggered this listener.
 */
function mutatorChangeListener(e: Abstract) {
  if (
    !isBlockCreate(e) &&
    !isBlockDelete(e) &&
    !isBlockChange(e) &&
    !isBlockFieldIntermediateChange(e)
  ) {
    return;
  }
  const workspaceId = e.workspaceId as string;
  const workspace = common.getWorkspaceById(workspaceId) as WorkspaceSvg;
  updateMutatorFlyout(workspace);
}

/**
 * Find all the callers of a named procedure.
 *
 * @param name Name of procedure.
 * @param workspace The workspace to find callers in.
 * @returns Array of caller blocks.
 */
export function getCallers(name: string, workspace: Workspace): Block[] {
  return workspace.getAllBlocks(false).filter((block) => {
    return (
      blockIsModernCallerFor(block, name) ||
      (isLegacyProcedureCallBlock(block) &&
        Names.equals(block.getProcedureCall(), name))
    );
  });
}

/**
 * @returns True if the given block is a modern-style caller block of the given
 *     procedure name.
 */
function blockIsModernCallerFor(block: Block, procName: string): boolean {
  return (
    isProcedureBlock(block) &&
    !block.isProcedureDef() &&
    block.getProcedureModel() &&
    Names.equals(block.getProcedureModel().getName(), procName)
  );
}

/**
 * When a procedure definition changes its parameters, find and edit all its
 * callers.
 *
 * @param defBlock Procedure definition block.
 */
export function mutateCallers(defBlock: Block) {
  const oldRecordUndo = eventUtils.getRecordUndo();
  const procedureBlock = defBlock as unknown as ProcedureBlock;
  const name = procedureBlock.getProcedureDef()[0];
  const xmlElement = defBlock.mutationToDom!(true);
  const callers = getCallers(name, defBlock.workspace);
  for (let i = 0, caller; (caller = callers[i]); i++) {
    const oldMutationDom = caller.mutationToDom!();
    const oldMutation = oldMutationDom && utilsXml.domToText(oldMutationDom);
    if (caller.domToMutation) {
      caller.domToMutation(xmlElement);
    }
    const newMutationDom = caller.mutationToDom!();
    const newMutation = newMutationDom && utilsXml.domToText(newMutationDom);
    if (oldMutation !== newMutation) {
      // Fire a mutation on every caller block.  But don't record this as an
      // undo action since it is deterministically tied to the procedure's
      // definition mutation.
      eventUtils.setRecordUndo(false);
      eventUtils.fire(
        new (eventUtils.get(EventType.BLOCK_CHANGE))(
          caller,
          'mutation',
          null,
          oldMutation,
          newMutation,
        ),
      );
      eventUtils.setRecordUndo(oldRecordUndo);
    }
  }
}

/**
 * Find the definition block for the named procedure.
 *
 * @param name Name of procedure.
 * @param workspace The workspace to search.
 * @returns The procedure definition block, or null not found.
 */
export function getDefinition(
  name: string,
  workspace: Workspace,
): Block | null {
  // Do not assume procedure is a top block. Some languages allow nested
  // procedures. Also do not assume it is one of the built-in blocks. Only
  // rely on isProcedureDef and getProcedureDef.
  for (const block of workspace.getAllBlocks(false)) {
    if (
      isProcedureBlock(block) &&
      block.isProcedureDef() &&
      Names.equals(block.getProcedureModel().getName(), name)
    ) {
      return block;
    }
    if (
      isLegacyProcedureDefBlock(block) &&
      Names.equals(block.getProcedureDef()[0], name)
    ) {
      return block;
    }
  }
  return null;
}

export {
  IParameterModel,
  IProcedureBlock,
  IProcedureMap,
  IProcedureModel,
  isProcedureBlock,
  ObservableProcedureMap,
  ProcedureTuple,
};
