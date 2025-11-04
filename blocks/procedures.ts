/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.libraryBlocks.procedures

import type {Block} from '../core/block.js';
import type {BlockSvg} from '../core/block_svg.js';
import type {BlockDefinition} from '../core/blocks.js';
import {defineBlocks} from '../core/common.js';
import {config} from '../core/config.js';
import type {Connection} from '../core/connection.js';
import * as ContextMenu from '../core/contextmenu.js';
import type {
  ContextMenuOption,
  LegacyContextMenuOption,
} from '../core/contextmenu_registry.js';
import * as Events from '../core/events/events.js';
import type {Abstract as AbstractEvent} from '../core/events/events_abstract.js';
import type {BlockChange} from '../core/events/events_block_change.js';
import type {BlockCreate} from '../core/events/events_block_create.js';
import * as eventUtils from '../core/events/utils.js';
import {FieldCheckbox} from '../core/field_checkbox.js';
import {FieldLabel} from '../core/field_label.js';
import * as fieldRegistry from '../core/field_registry.js';
import {FieldTextInput} from '../core/field_textinput.js';
import {getFocusManager} from '../core/focus_manager.js';
import '../core/icons/comment_icon.js';
import {MutatorIcon as Mutator} from '../core/icons/mutator_icon.js';
import '../core/icons/warning_icon.js';
import {Align} from '../core/inputs/align.js';
import type {
  IVariableModel,
  IVariableState,
} from '../core/interfaces/i_variable_model.js';
import {Msg} from '../core/msg.js';
import {Names} from '../core/names.js';
import * as Procedures from '../core/procedures.js';
import * as xmlUtils from '../core/utils/xml.js';
import * as Variables from '../core/variables.js';
import type {Workspace} from '../core/workspace.js';
import type {WorkspaceSvg} from '../core/workspace_svg.js';
import * as Xml from '../core/xml.js';

/** A dictionary of the block definitions provided by this module. */
export const blocks: {[key: string]: BlockDefinition} = {};

/** Type of a block using the PROCEDURE_DEF_COMMON mixin. */
type ProcedureBlock = Block & ProcedureMixin;
interface ProcedureMixin extends ProcedureMixinType {
  arguments_: string[];
  argumentVarModels_: IVariableModel<IVariableState>[];
  callType_: string;
  paramIds_: string[];
  hasStatements_: boolean;
  statementConnection_: Connection | null;
}
type ProcedureMixinType = typeof PROCEDURE_DEF_COMMON;

/** Extra state for serialising procedure blocks. */
type ProcedureExtraState = {
  params?: Array<{name: string; id: string}>;
  hasStatements: boolean;
};

/**
 * Common properties for the procedure_defnoreturn and
 * procedure_defreturn blocks.
 */
const PROCEDURE_DEF_COMMON = {
  /**
   * Add or remove the statement block from this function definition.
   *
   * @param hasStatements True if a statement block is needed.
   */
  setStatements_: function (this: ProcedureBlock, hasStatements: boolean) {
    if (this.hasStatements_ === hasStatements) {
      return;
    }
    if (hasStatements) {
      this.appendStatementInput('STACK').appendField(
        Msg['PROCEDURES_DEFNORETURN_DO'],
      );
      if (this.getInput('RETURN')) {
        this.moveInputBefore('STACK', 'RETURN');
      }
    } else {
      this.removeInput('STACK', true);
    }
    this.hasStatements_ = hasStatements;
  },
  /**
   * Update the display of parameters for this procedure definition block.
   *
   * @internal
   */
  updateParams_: function (this: ProcedureBlock) {
    // Merge the arguments into a human-readable list.
    let paramString = '';
    if (this.arguments_.length) {
      paramString =
        Msg['PROCEDURES_BEFORE_PARAMS'] + ' ' + this.arguments_.join(', ');
    }
    // The params field is deterministic based on the mutation,
    // no need to fire a change event.
    Events.disable();
    try {
      this.setFieldValue(paramString, 'PARAMS');
    } finally {
      Events.enable();
    }
  },
  /**
   * Create XML to represent the argument inputs.
   * Backwards compatible serialization implementation.
   *
   * @param opt_paramIds If true include the IDs of the parameter
   *     quarks.  Used by Procedures.mutateCallers for reconnection.
   * @returns  XML storage element.
   */
  mutationToDom: function (
    this: ProcedureBlock,
    opt_paramIds: boolean,
  ): Element {
    const container = xmlUtils.createElement('mutation');
    if (opt_paramIds) {
      container.setAttribute('name', this.getFieldValue('NAME'));
    }
    for (let i = 0; i < this.argumentVarModels_.length; i++) {
      const parameter = xmlUtils.createElement('arg');
      const argModel = this.argumentVarModels_[i];
      parameter.setAttribute('name', argModel.getName());
      parameter.setAttribute('varid', argModel.getId());
      if (opt_paramIds && this.paramIds_) {
        parameter.setAttribute('paramId', this.paramIds_[i]);
      }
      container.appendChild(parameter);
    }

    // Save whether the statement input is visible.
    if (!this.hasStatements_) {
      container.setAttribute('statements', 'false');
    }
    return container;
  },
  /**
   * Parse XML to restore the argument inputs.
   * Backwards compatible serialization implementation.
   *
   * @param xmlElement XML storage element.
   */
  domToMutation: function (this: ProcedureBlock, xmlElement: Element) {
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
      if (childNode.nodeName.toLowerCase() === 'arg') {
        const childElement = childNode as Element;
        const varName = childElement.getAttribute('name')!;
        const varId =
          childElement.getAttribute('varid') ||
          childElement.getAttribute('varId');
        this.arguments_.push(varName);
        const variable = Variables.getOrCreateVariablePackage(
          this.workspace,
          varId,
          varName,
          '',
        );
        if (variable !== null) {
          this.argumentVarModels_.push(variable);
        } else {
          console.log(
            `Failed to create a variable named "${varName}", ignoring.`,
          );
        }
      }
    }
    this.updateParams_();
    Procedures.mutateCallers(this);

    // Show or hide the statement input.
    this.setStatements_(xmlElement.getAttribute('statements') !== 'false');
  },
  /**
   * Returns the state of this block as a JSON serializable object.
   *
   * @returns The state of this block, eg the parameters and statements.
   */
  saveExtraState: function (this: ProcedureBlock): ProcedureExtraState | null {
    if (!this.argumentVarModels_.length && this.hasStatements_) {
      return null;
    }
    const state = Object.create(null);
    if (this.argumentVarModels_.length) {
      state['params'] = [];
      for (let i = 0; i < this.argumentVarModels_.length; i++) {
        state['params'].push({
          // We don't need to serialize the name, but just in case we decide
          // to separate params from variables.
          'name': this.argumentVarModels_[i].getName(),
          'id': this.argumentVarModels_[i].getId(),
        });
      }
    }
    if (!this.hasStatements_) {
      state['hasStatements'] = false;
    }
    return state;
  },
  /**
   * Applies the given state to this block.
   *
   * @param state The state to apply to this block, eg the parameters
   *     and statements.
   */
  loadExtraState: function (this: ProcedureBlock, state: ProcedureExtraState) {
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    if (state['params']) {
      for (let i = 0; i < state['params'].length; i++) {
        const param = state['params'][i];
        const variable = Variables.getOrCreateVariablePackage(
          this.workspace,
          param['id'],
          param['name'],
          '',
        );
        this.arguments_.push(variable.getName());
        this.argumentVarModels_.push(variable);
      }
    }
    this.updateParams_();
    Procedures.mutateCallers(this);
    this.setStatements_(state['hasStatements'] === false ? false : true);
  },
  /**
   * Populate the mutator's dialog with this block's components.
   *
   * @param  workspace Mutator's workspace.
   * @returns Root block in mutator.
   */
  decompose: function (
    this: ProcedureBlock,
    workspace: Workspace,
  ): ContainerBlock {
    /*
     * Creates the following XML:
     * <block type="procedures_mutatorcontainer">
     *   <statement name="STACK">
     *     <block type="procedures_mutatorarg">
     *       <field name="NAME">arg1_name</field>
     *       <next>etc...</next>
     *     </block>
     *   </statement>
     * </block>
     */

    const containerBlockNode = xmlUtils.createElement('block');
    containerBlockNode.setAttribute('type', 'procedures_mutatorcontainer');
    const statementNode = xmlUtils.createElement('statement');
    statementNode.setAttribute('name', 'STACK');
    containerBlockNode.appendChild(statementNode);

    let node = statementNode;
    for (let i = 0; i < this.arguments_.length; i++) {
      const argBlockNode = xmlUtils.createElement('block');
      argBlockNode.setAttribute('type', 'procedures_mutatorarg');
      const fieldNode = xmlUtils.createElement('field');
      fieldNode.setAttribute('name', 'NAME');
      const argumentName = xmlUtils.createTextNode(this.arguments_[i]);
      fieldNode.appendChild(argumentName);
      argBlockNode.appendChild(fieldNode);
      const nextNode = xmlUtils.createElement('next');
      argBlockNode.appendChild(nextNode);

      node.appendChild(argBlockNode);
      node = nextNode;
    }

    const containerBlock = Xml.domToBlock(
      containerBlockNode,
      workspace,
    ) as ContainerBlock;

    if (this.type === 'procedures_defreturn') {
      containerBlock.setFieldValue(this.hasStatements_, 'STATEMENTS');
    } else {
      containerBlock.removeInput('STATEMENT_INPUT');
    }

    // Initialize procedure's callers with blank IDs.
    Procedures.mutateCallers(this);
    return containerBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   *
   * @param containerBlock Root block in mutator.
   */
  compose: function (this: ProcedureBlock, containerBlock: ContainerBlock) {
    // Parameter list.
    this.arguments_ = [];
    this.paramIds_ = [];
    this.argumentVarModels_ = [];
    let paramBlock = containerBlock.getInputTargetBlock('STACK');
    while (paramBlock && !paramBlock.isInsertionMarker()) {
      const varName = paramBlock.getFieldValue('NAME');
      this.arguments_.push(varName);
      const variable = this.workspace.getVariable(varName, '')!;
      this.argumentVarModels_.push(variable);

      this.paramIds_.push(paramBlock.id);
      paramBlock =
        paramBlock.nextConnection && paramBlock.nextConnection.targetBlock();
    }
    this.updateParams_();
    Procedures.mutateCallers(this);

    // Show/hide the statement input.
    let hasStatements = containerBlock.getFieldValue('STATEMENTS');
    if (hasStatements !== null) {
      hasStatements = hasStatements === 'TRUE';
      if (this.hasStatements_ !== hasStatements) {
        if (hasStatements) {
          this.setStatements_(true);
          // Restore the stack, if one was saved.
          this.statementConnection_?.reconnect(this, 'STACK');
          this.statementConnection_ = null;
        } else {
          // Save the stack, then disconnect it.
          const stackConnection = this.getInput('STACK')!.connection;
          this.statementConnection_ = stackConnection!.targetConnection;
          if (this.statementConnection_) {
            const stackBlock = stackConnection!.targetBlock()!;
            stackBlock.unplug();
            stackBlock.bumpNeighbours();
          }
          this.setStatements_(false);
        }
      }
    }
  },
  /**
   * Return all variables referenced by this block.
   *
   * @returns List of variable names.
   */
  getVars: function (this: ProcedureBlock): string[] {
    return this.arguments_;
  },
  /**
   * Return all variables referenced by this block.
   *
   * @returns List of variable models.
   */
  getVarModels: function (
    this: ProcedureBlock,
  ): IVariableModel<IVariableState>[] {
    return this.argumentVarModels_;
  },
  /**
   * Notification that a variable is renaming.
   * If the ID matches one of this block's variables, rename it.
   *
   * @param oldId ID of variable to rename.
   * @param newId ID of new variable.  May be the same as oldId, but
   *     with an updated name.  Guaranteed to be the same type as the
   *     old variable.
   */
  renameVarById: function (
    this: ProcedureBlock & BlockSvg,
    oldId: string,
    newId: string,
  ) {
    const oldVariable = this.workspace.getVariableById(oldId)!;
    if (oldVariable.getType() !== '') {
      // Procedure arguments always have the empty type.
      return;
    }
    const oldName = oldVariable.getName();
    const newVar = this.workspace.getVariableById(newId)!;

    let change = false;
    for (let i = 0; i < this.argumentVarModels_.length; i++) {
      if (this.argumentVarModels_[i].getId() === oldId) {
        this.arguments_[i] = newVar.getName();
        this.argumentVarModels_[i] = newVar;
        change = true;
      }
    }
    if (change) {
      this.displayRenamedVar_(oldName, newVar.getName());
      Procedures.mutateCallers(this);
    }
  },
  /**
   * Notification that a variable is renaming but keeping the same ID.  If the
   * variable is in use on this block, rerender to show the new name.
   *
   * @param variable The variable being renamed.
   */
  updateVarName: function (
    this: ProcedureBlock & BlockSvg,
    variable: IVariableModel<IVariableState>,
  ) {
    const newName = variable.getName();
    let change = false;
    let oldName;
    for (let i = 0; i < this.argumentVarModels_.length; i++) {
      if (this.argumentVarModels_[i].getId() === variable.getId()) {
        oldName = this.arguments_[i];
        this.arguments_[i] = newName;
        change = true;
      }
    }
    if (change) {
      this.displayRenamedVar_(oldName as string, newName);
      Procedures.mutateCallers(this);
    }
  },
  /**
   * Update the display to reflect a newly renamed argument.
   *
   * @internal
   * @param oldName The old display name of the argument.
   * @param newName The new display name of the argument.
   */
  displayRenamedVar_: function (
    this: ProcedureBlock & BlockSvg,
    oldName: string,
    newName: string,
  ) {
    this.updateParams_();
    // Update the mutator's variables if the mutator is open.
    const mutator = this.getIcon(Mutator.TYPE);
    if (mutator && mutator.bubbleIsVisible()) {
      const blocks = mutator.getWorkspace()!.getAllBlocks(false);
      for (let i = 0, block; (block = blocks[i]); i++) {
        if (
          block.type === 'procedures_mutatorarg' &&
          Names.equals(oldName, block.getFieldValue('NAME'))
        ) {
          block.setFieldValue(newName, 'NAME');
        }
      }
    }
  },
  /**
   * Add custom menu options to this block's context menu.
   *
   * @param options List of menu options to add to.
   */
  customContextMenu: function (
    this: ProcedureBlock,
    options: Array<ContextMenuOption | LegacyContextMenuOption>,
  ) {
    if (this.isInFlyout) {
      return;
    }
    // Add option to create caller.
    const name = this.getFieldValue('NAME');
    const callProcedureBlockState = {
      type: (this as AnyDuringMigration).callType_,
      extraState: {name: name, params: this.arguments_},
    };
    options.push({
      enabled: true,
      text: Msg['PROCEDURES_CREATE_DO'].replace('%1', name),
      callback: ContextMenu.callbackFactory(this, callProcedureBlockState),
    });

    // Add options to create getters for each parameter.
    if (!this.isCollapsed()) {
      for (let i = 0; i < this.argumentVarModels_.length; i++) {
        const argVar = this.argumentVarModels_[i];
        const getVarBlockState = {
          type: 'variables_get',
          fields: {
            VAR: {
              name: argVar.getName(),
              id: argVar.getId(),
              type: argVar.getType(),
            },
          },
        };
        options.push({
          enabled: true,
          text: Msg['VARIABLES_SET_CREATE_GET'].replace('%1', argVar.getName()),
          callback: ContextMenu.callbackFactory(this, getVarBlockState),
        });
      }
    }
  },
};

blocks['procedures_defnoreturn'] = {
  ...PROCEDURE_DEF_COMMON,
  /**
   * Block for defining a procedure with no return value.
   */
  init: function (this: ProcedureBlock & BlockSvg) {
    const initName = Procedures.findLegalName('', this);
    const nameField = fieldRegistry.fromJson({
      type: 'field_input',
      text: initName,
    }) as FieldTextInput;
    nameField!.setValidator(Procedures.rename);
    nameField.setSpellcheck(false);
    this.appendDummyInput()
      .appendField(Msg['PROCEDURES_DEFNORETURN_TITLE'])
      .appendField(nameField, 'NAME')
      .appendField('', 'PARAMS');
    this.setMutator(new Mutator(['procedures_mutatorarg'], this));
    if (
      (this.workspace.options.comments ||
        (this.workspace.options.parentWorkspace &&
          this.workspace.options.parentWorkspace.options.comments)) &&
      Msg['PROCEDURES_DEFNORETURN_COMMENT']
    ) {
      this.setCommentText(Msg['PROCEDURES_DEFNORETURN_COMMENT']);
    }
    this.setStyle('procedure_blocks');
    this.setTooltip(Msg['PROCEDURES_DEFNORETURN_TOOLTIP']);
    this.setHelpUrl(Msg['PROCEDURES_DEFNORETURN_HELPURL']);
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    this.setStatements_(true);
    this.statementConnection_ = null;
  },
  /**
   * Return the signature of this procedure definition.
   *
   * @returns Tuple containing three elements:
   *     - the name of the defined procedure,
   *     - a list of all its arguments,
   *     - that it DOES NOT have a return value.
   */
  getProcedureDef: function (this: ProcedureBlock): [string, string[], false] {
    return [this.getFieldValue('NAME'), this.arguments_, false];
  },
  callType_: 'procedures_callnoreturn',
};

blocks['procedures_defreturn'] = {
  ...PROCEDURE_DEF_COMMON,
  /**
   * Block for defining a procedure with a return value.
   */
  init: function (this: ProcedureBlock & BlockSvg) {
    const initName = Procedures.findLegalName('', this);
    const nameField = fieldRegistry.fromJson({
      type: 'field_input',
      text: initName,
    }) as FieldTextInput;
    nameField.setValidator(Procedures.rename);
    nameField.setSpellcheck(false);
    this.appendDummyInput()
      .appendField(Msg['PROCEDURES_DEFRETURN_TITLE'])
      .appendField(nameField, 'NAME')
      .appendField('', 'PARAMS');
    this.appendValueInput('RETURN')
      .setAlign(Align.RIGHT)
      .appendField(Msg['PROCEDURES_DEFRETURN_RETURN']);
    this.setMutator(new Mutator(['procedures_mutatorarg'], this));
    if (
      (this.workspace.options.comments ||
        (this.workspace.options.parentWorkspace &&
          this.workspace.options.parentWorkspace.options.comments)) &&
      Msg['PROCEDURES_DEFRETURN_COMMENT']
    ) {
      this.setCommentText(Msg['PROCEDURES_DEFRETURN_COMMENT']);
    }
    this.setStyle('procedure_blocks');
    this.setTooltip(Msg['PROCEDURES_DEFRETURN_TOOLTIP']);
    this.setHelpUrl(Msg['PROCEDURES_DEFRETURN_HELPURL']);
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    this.setStatements_(true);
    this.statementConnection_ = null;
  },
  /**
   * Return the signature of this procedure definition.
   *
   * @returns Tuple containing three elements:
   *     - the name of the defined procedure,
   *     - a list of all its arguments,
   *     - that it DOES have a return value.
   */
  getProcedureDef: function (this: ProcedureBlock): [string, string[], true] {
    return [this.getFieldValue('NAME'), this.arguments_, true];
  },
  callType_: 'procedures_callreturn',
};

/** Type of a procedures_mutatorcontainer block. */
type ContainerBlock = Block & ContainerMixin;
interface ContainerMixin extends ContainerMixinType {}
type ContainerMixinType = typeof PROCEDURES_MUTATORCONTAINER;

const PROCEDURES_MUTATORCONTAINER = {
  /**
   * Mutator block for procedure container.
   */
  init: function (this: ContainerBlock) {
    this.appendDummyInput().appendField(
      Msg['PROCEDURES_MUTATORCONTAINER_TITLE'],
    );
    this.appendStatementInput('STACK');
    this.appendDummyInput('STATEMENT_INPUT')
      .appendField(Msg['PROCEDURES_ALLOW_STATEMENTS'])
      .appendField(
        fieldRegistry.fromJson({
          type: 'field_checkbox',
          checked: true,
        }) as FieldCheckbox,
        'STATEMENTS',
      );
    this.setStyle('procedure_blocks');
    this.setTooltip(Msg['PROCEDURES_MUTATORCONTAINER_TOOLTIP']);
    this.contextMenu = false;
  },
};
blocks['procedures_mutatorcontainer'] = PROCEDURES_MUTATORCONTAINER;

/** Type of a procedures_mutatorarg block. */
type ArgumentBlock = Block & ArgumentMixin;
interface ArgumentMixin extends ArgumentMixinType {}
type ArgumentMixinType = typeof PROCEDURES_MUTATORARGUMENT;

/**
 * Field responsible for editing procedure argument names.
 */
class ProcedureArgumentField extends FieldTextInput {
  /**
   * Whether or not this field is currently being edited interactively.
   */
  editingInteractively = false;

  /**
   * The procedure argument variable whose name is being interactively edited.
   */
  editingVariable?: IVariableModel<IVariableState>;

  /**
   * Displays the field editor.
   *
   * @param e The event that triggered display of the field editor.
   */
  protected override showEditor_(e?: Event) {
    super.showEditor_(e);
    this.editingInteractively = true;
    this.editingVariable = undefined;
  }

  /**
   * Handles cleanup when the field editor is dismissed.
   */
  override onFinishEditing_(value: string) {
    super.onFinishEditing_(value);
    this.editingInteractively = false;
  }
}

const PROCEDURES_MUTATORARGUMENT = {
  /**
   * Mutator block for procedure argument.
   */
  init: function (this: ArgumentBlock) {
    const field = new ProcedureArgumentField(
      Procedures.DEFAULT_ARG,
      this.validator_,
    );

    this.appendDummyInput()
      .appendField(Msg['PROCEDURES_MUTATORARG_TITLE'])
      .appendField(field, 'NAME');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle('procedure_blocks');
    this.setTooltip(Msg['PROCEDURES_MUTATORARG_TOOLTIP']);
    this.contextMenu = false;
  },

  /**
   * Obtain a valid name for the procedure argument. Create a variable if
   * necessary.
   * Merge runs of whitespace.  Strip leading and trailing whitespace.
   * Beyond this, all names are legal.
   *
   * @internal
   * @param varName User-supplied name.
   * @returns Valid name, or null if a name was not specified.
   */
  validator_: function (
    this: ProcedureArgumentField,
    varName: string,
  ): string | null {
    const sourceBlock = this.getSourceBlock()!;
    const outerWs = sourceBlock.workspace.getRootWorkspace()!;
    varName = varName.replace(/[\s\xa0]+/g, ' ').replace(/^ | $/g, '');
    if (!varName) {
      return null;
    }

    // Prevents duplicate parameter names in functions
    const workspace =
      (sourceBlock.workspace as WorkspaceSvg).targetWorkspace ||
      sourceBlock.workspace;
    const blocks = workspace.getAllBlocks(false);
    const caselessName = varName.toLowerCase();
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].id === this.getSourceBlock()!.id) {
        continue;
      }
      // Other blocks values may not be set yet when this is loaded.
      const otherVar = blocks[i].getFieldValue('NAME');
      if (otherVar && otherVar.toLowerCase() === caselessName) {
        return null;
      }
    }

    // Don't create variables for arg blocks that
    // only exist in the mutator's flyout.
    if (sourceBlock.isInFlyout) {
      return varName;
    }
    const variableMap = outerWs.getVariableMap();
    const model = variableMap.getVariable(varName, '');
    if (model && model.getName() !== varName) {
      // Rename the variable (case change)
      variableMap.renameVariable(model, varName);
    }
    if (!model) {
      if (this.editingInteractively) {
        if (!this.editingVariable) {
          this.editingVariable = variableMap.createVariable(varName, '');
        } else {
          variableMap.renameVariable(this.editingVariable, varName);
        }
      } else {
        variableMap.createVariable(varName, '');
      }
    }
    return varName;
  },
};
blocks['procedures_mutatorarg'] = PROCEDURES_MUTATORARGUMENT;

/** Type of a block using the PROCEDURE_CALL_COMMON mixin. */
type CallBlock = Block & CallMixin;
interface CallMixin extends CallMixinType {
  argumentVarModels_: IVariableModel<IVariableState>[];
  arguments_: string[];
  defType_: string;
  quarkIds_: string[] | null;
  quarkConnections_: {[id: string]: Connection};
}
type CallMixinType = typeof PROCEDURE_CALL_COMMON;

/** Extra state for serialising call blocks. */
type CallExtraState = {
  name: string;
  params?: string[];
};

/**
 * The language-neutral ID for when the reason why a block is disabled is
 * because the block's corresponding procedure definition is disabled.
 */
const DISABLED_PROCEDURE_DEFINITION_DISABLED_REASON =
  'DISABLED_PROCEDURE_DEFINITION';

/**
 * Common properties for the procedure_callnoreturn and
 * procedure_callreturn blocks.
 */
const PROCEDURE_CALL_COMMON = {
  /**
   * Returns the name of the procedure this block calls.
   *
   * @returns Procedure name.
   */
  getProcedureCall: function (this: CallBlock): string {
    // The NAME field is guaranteed to exist, null will never be returned.
    return this.getFieldValue('NAME');
  },
  /**
   * Notification that a procedure is renaming.
   * If the name matches this block's procedure, rename it.
   *
   * @param oldName Previous name of procedure.
   * @param newName Renamed procedure.
   */
  renameProcedure: function (
    this: CallBlock,
    oldName: string,
    newName: string,
  ) {
    if (Names.equals(oldName, this.getProcedureCall())) {
      this.setFieldValue(newName, 'NAME');
      const baseMsg = this.outputConnection
        ? Msg['PROCEDURES_CALLRETURN_TOOLTIP']
        : Msg['PROCEDURES_CALLNORETURN_TOOLTIP'];
      this.setTooltip(baseMsg.replace('%1', newName));
    }
  },
  /**
   * Notification that the procedure's parameters have changed.
   *
   * @internal
   * @param paramNames New param names, e.g. ['x', 'y', 'z'].
   * @param paramIds IDs of params (consistent for each parameter
   *     through the life of a mutator, regardless of param renaming),
   *     e.g. ['piua', 'f8b_', 'oi.o'].
   */
  setProcedureParameters_: function (
    this: CallBlock,
    paramNames: string[],
    paramIds: string[],
  ) {
    // Data structures:
    // this.arguments = ['x', 'y']
    //     Existing param names.
    // this.quarkConnections_ {piua: null, f8b_: Connection}
    //     Look-up of paramIds to connections plugged into the call block.
    // this.quarkIds_ = ['piua', 'f8b_']
    //     Existing param IDs.
    // Note that quarkConnections_ may include IDs that no longer exist, but
    // which might reappear if a param is reattached in the mutator.
    const defBlock = Procedures.getDefinition(
      this.getProcedureCall(),
      this.workspace,
    );
    const mutatorIcon = defBlock && defBlock.getIcon(Mutator.TYPE);
    const mutatorOpen = mutatorIcon && mutatorIcon.bubbleIsVisible();
    if (!mutatorOpen) {
      this.quarkConnections_ = {};
      this.quarkIds_ = null;
    } else {
      // fix #6091 - this call could cause an error when outside if-else
      // expanding block while mutating prevents another error (ancient fix)
      this.setCollapsed(false);
    }
    // Test arguments (arrays of strings) for changes. '\n' is not a valid
    // argument name character, so it is a valid delimiter here.
    if (paramNames.join('\n') === this.arguments_.join('\n')) {
      // No change.
      this.quarkIds_ = paramIds;
      return;
    }
    if (paramIds.length !== paramNames.length) {
      throw RangeError('paramNames and paramIds must be the same length.');
    }
    if (!this.quarkIds_) {
      // Initialize tracking for this block.
      this.quarkConnections_ = {};
      this.quarkIds_ = [];
    }
    // Update the quarkConnections_ with existing connections.
    for (let i = 0; i < this.arguments_.length; i++) {
      const input = this.getInput('ARG' + i);
      if (input) {
        const connection = input.connection!.targetConnection!;
        this.quarkConnections_[this.quarkIds_[i]] = connection;
        if (
          mutatorOpen &&
          connection &&
          !paramIds.includes(this.quarkIds_[i])
        ) {
          // This connection should no longer be attached to this block.
          connection.disconnect();
          connection.getSourceBlock().bumpNeighbours();
        }
      }
    }
    // Rebuild the block's arguments.
    this.arguments_ = ([] as string[]).concat(paramNames);
    // And rebuild the argument model list.
    this.argumentVarModels_ = [];
    for (let i = 0; i < this.arguments_.length; i++) {
      const variable = Variables.getOrCreateVariablePackage(
        this.workspace,
        null,
        this.arguments_[i],
        '',
      );
      this.argumentVarModels_.push(variable);
    }

    this.updateShape_();
    this.quarkIds_ = paramIds;
    // Reconnect any child blocks.
    if (this.quarkIds_) {
      for (let i = 0; i < this.arguments_.length; i++) {
        const quarkId: string = this.quarkIds_[i]; // TODO(#6920)
        if (quarkId in this.quarkConnections_) {
          // TODO(#6920): investigate claimed circular initialisers.
          const connection: Connection = this.quarkConnections_[quarkId];
          if (!connection?.reconnect(this, 'ARG' + i)) {
            // Block no longer exists or has been attached elsewhere.
            delete this.quarkConnections_[quarkId];
          }
        }
      }
    }
  },
  /**
   * Modify this block to have the correct number of arguments.
   *
   * @internal
   */
  updateShape_: function (this: CallBlock) {
    for (let i = 0; i < this.arguments_.length; i++) {
      const argField = this.getField('ARGNAME' + i);
      if (argField) {
        // Ensure argument name is up to date.
        // The argument name field is deterministic based on the mutation,
        // no need to fire a change event.
        Events.disable();
        try {
          argField.setValue(this.arguments_[i]);
        } finally {
          Events.enable();
        }
      } else {
        // Add new input.
        const newField = fieldRegistry.fromJson({
          type: 'field_label',
          text: this.arguments_[i],
        }) as FieldLabel;
        this.appendValueInput('ARG' + i)
          .setAlign(Align.RIGHT)
          .appendField(newField, 'ARGNAME' + i);
      }
    }
    // Remove deleted inputs.
    for (let i = this.arguments_.length; this.getInput('ARG' + i); i++) {
      this.removeInput('ARG' + i);
    }
    // Add 'with:' if there are parameters, remove otherwise.
    const topRow = this.getInput('TOPROW');
    if (topRow) {
      if (this.arguments_.length) {
        if (!this.getField('WITH')) {
          topRow.appendField(Msg['PROCEDURES_CALL_BEFORE_PARAMS'], 'WITH');
        }
      } else {
        if (this.getField('WITH')) {
          topRow.removeField('WITH');
        }
      }
    }
  },
  /**
   * Create XML to represent the (non-editable) name and arguments.
   * Backwards compatible serialization implementation.
   *
   * @returns XML storage element.
   */
  mutationToDom: function (this: CallBlock): Element {
    const container = xmlUtils.createElement('mutation');
    container.setAttribute('name', this.getProcedureCall());
    for (let i = 0; i < this.arguments_.length; i++) {
      const parameter = xmlUtils.createElement('arg');
      parameter.setAttribute('name', this.arguments_[i]);
      container.appendChild(parameter);
    }
    return container;
  },
  /**
   * Parse XML to restore the (non-editable) name and parameters.
   * Backwards compatible serialization implementation.
   *
   * @param xmlElement XML storage element.
   */
  domToMutation: function (this: CallBlock, xmlElement: Element) {
    const name = xmlElement.getAttribute('name')!;
    this.renameProcedure(this.getProcedureCall(), name);
    const args: string[] = [];
    const paramIds = [];
    for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
      if (childNode.nodeName.toLowerCase() === 'arg') {
        args.push((childNode as Element).getAttribute('name')!);
        paramIds.push((childNode as Element).getAttribute('paramId')!);
      }
    }
    this.setProcedureParameters_(args, paramIds);
  },
  /**
   * Returns the state of this block as a JSON serializable object.
   *
   * @returns The state of this block, ie the params and procedure name.
   */
  saveExtraState: function (this: CallBlock): CallExtraState {
    const state = Object.create(null);
    state['name'] = this.getProcedureCall();
    if (this.arguments_.length) {
      state['params'] = this.arguments_;
    }
    return state;
  },
  /**
   * Applies the given state to this block.
   *
   * @param state The state to apply to this block, ie the params and
   *     procedure name.
   */
  loadExtraState: function (this: CallBlock, state: CallExtraState) {
    this.renameProcedure(this.getProcedureCall(), state['name']);
    const params = state['params'];
    if (params) {
      const ids: string[] = [];
      ids.length = params.length;
      ids.fill(null as unknown as string); // TODO(#6920)
      this.setProcedureParameters_(params, ids);
    }
  },
  /**
   * Return all variables referenced by this block.
   *
   * @returns List of variable names.
   */
  getVars: function (this: CallBlock): string[] {
    return this.arguments_;
  },
  /**
   * Return all variables referenced by this block.
   *
   * @returns List of variable models.
   */
  getVarModels: function (this: CallBlock): IVariableModel<IVariableState>[] {
    return this.argumentVarModels_;
  },
  /**
   * Procedure calls cannot exist without the corresponding procedure
   * definition.  Enforce this link whenever an event is fired.
   *
   * @param event Change event.
   */
  onchange: function (this: CallBlock, event: AbstractEvent) {
    if (!this.workspace || this.workspace.isFlyout) {
      // Block is deleted or is in a flyout.
      return;
    }
    if (!event.recordUndo) {
      // Events not generated by user. Skip handling.
      return;
    }
    if (
      event.type === Events.BLOCK_CREATE &&
      (event as BlockCreate).ids!.includes(this.id)
    ) {
      // Look for the case where a procedure call was created (usually through
      // paste) and there is no matching definition.  In this case, create
      // an empty definition block with the correct signature.
      const name = this.getProcedureCall();
      let def = Procedures.getDefinition(name, this.workspace);
      if (
        def &&
        (def.type !== this.defType_ ||
          JSON.stringify(def.getVars()) !== JSON.stringify(this.arguments_))
      ) {
        // The signatures don't match.
        def = null;
      }
      if (!def) {
        Events.setGroup(event.group);
        /**
         * Create matching definition block.
         * <xml xmlns="https://developers.google.com/blockly/xml">
         *   <block type="procedures_defreturn" x="10" y="20">
         *     <mutation name="test">
         *       <arg name="x"></arg>
         *     </mutation>
         *     <field name="NAME">test</field>
         *   </block>
         * </xml>
         */
        const xml = xmlUtils.createElement('xml');
        const block = xmlUtils.createElement('block');
        block.setAttribute('type', this.defType_);
        const xy = this.getRelativeToSurfaceXY();
        const x = xy.x + config.snapRadius * (this.RTL ? -1 : 1);
        const y = xy.y + config.snapRadius * 2;
        block.setAttribute('x', `${x}`);
        block.setAttribute('y', `${y}`);
        const mutation = this.mutationToDom();
        block.appendChild(mutation);
        const field = xmlUtils.createElement('field');
        field.setAttribute('name', 'NAME');
        const callName = this.getProcedureCall();
        const newName = Procedures.findLegalName(callName, this);
        if (callName !== newName) {
          this.renameProcedure(callName, newName);
        }
        field.appendChild(xmlUtils.createTextNode(callName));
        block.appendChild(field);
        xml.appendChild(block);
        Xml.domToWorkspace(xml, this.workspace);
        Events.setGroup(false);
      } else if (!def.isEnabled()) {
        this.setDisabledReason(
          true,
          DISABLED_PROCEDURE_DEFINITION_DISABLED_REASON,
        );
        this.setWarningText(
          Msg['PROCEDURES_CALL_DISABLED_DEF_WARNING'].replace('%1', name),
        );
      }
    } else if (event.type === Events.BLOCK_DELETE) {
      // Look for the case where a procedure definition has been deleted,
      // leaving this block (a procedure call) orphaned.  In this case, delete
      // the orphan.
      const name = this.getProcedureCall();
      const def = Procedures.getDefinition(name, this.workspace);
      if (!def) {
        Events.setGroup(event.group);
        this.dispose(true);
        Events.setGroup(false);
      }
    } else if (
      event.type === Events.BLOCK_CHANGE &&
      (event as BlockChange).element === 'disabled'
    ) {
      const blockChangeEvent = event as BlockChange;
      const name = this.getProcedureCall();
      const def = Procedures.getDefinition(name, this.workspace);
      if (def && def.id === blockChangeEvent.blockId) {
        // in most cases the old group should be ''
        const oldGroup = Events.getGroup();
        if (oldGroup) {
          // This should only be possible programmatically and may indicate a
          // problem with event grouping. If you see this message please
          // investigate. If the use ends up being valid we may need to reorder
          // events in the undo stack.
          console.log(
            'Saw an existing group while responding to a definition change',
          );
        }
        Events.setGroup(event.group);
        const valid = def.isEnabled();
        this.setDisabledReason(
          !valid,
          DISABLED_PROCEDURE_DEFINITION_DISABLED_REASON,
        );
        this.setWarningText(
          valid
            ? null
            : Msg['PROCEDURES_CALL_DISABLED_DEF_WARNING'].replace('%1', name),
        );
        Events.setGroup(oldGroup);
      }
    }
  },
  /**
   * Add menu option to find the definition block for this call.
   *
   * @param options List of menu options to add to.
   */
  customContextMenu: function (
    this: CallBlock,
    options: Array<ContextMenuOption | LegacyContextMenuOption>,
  ) {
    if (!(this.workspace as WorkspaceSvg).isMovable()) {
      // If we center on the block and the workspace isn't movable we could
      // loose blocks at the edges of the workspace.
      return;
    }

    const name = this.getProcedureCall();
    const workspace = this.workspace;
    options.push({
      enabled: true,
      text: Msg['PROCEDURES_HIGHLIGHT_DEF'],
      callback: function () {
        const def = Procedures.getDefinition(name, workspace);
        if (def) {
          (workspace as WorkspaceSvg).centerOnBlock(def.id);
          getFocusManager().focusNode(def as BlockSvg);
        }
      },
    });
  },
};

blocks['procedures_callnoreturn'] = {
  ...PROCEDURE_CALL_COMMON,
  /**
   * Block for calling a procedure with no return value.
   */
  init: function (this: CallBlock) {
    this.appendDummyInput('TOPROW').appendField('', 'NAME');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle('procedure_blocks');
    // Tooltip is set in renameProcedure.
    this.setHelpUrl(Msg['PROCEDURES_CALLNORETURN_HELPURL']);
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    this.quarkConnections_ = {};
    this.quarkIds_ = null;
  },

  defType_: 'procedures_defnoreturn',
};

blocks['procedures_callreturn'] = {
  ...PROCEDURE_CALL_COMMON,
  /**
   * Block for calling a procedure with a return value.
   */
  init: function (this: CallBlock) {
    this.appendDummyInput('TOPROW').appendField('', 'NAME');
    this.setOutput(true);
    this.setStyle('procedure_blocks');
    // Tooltip is set in renameProcedure.
    this.setHelpUrl(Msg['PROCEDURES_CALLRETURN_HELPURL']);
    this.arguments_ = [];
    this.argumentVarModels_ = [];
    this.quarkConnections_ = {};
    this.quarkIds_ = null;
  },

  defType_: 'procedures_defreturn',
};

/**
 * Type of a procedures_ifreturn block.
 *
 * @internal
 */
export type IfReturnBlock = Block & IfReturnMixin;
interface IfReturnMixin extends IfReturnMixinType {
  hasReturnValue_: boolean;
}
type IfReturnMixinType = typeof PROCEDURES_IFRETURN;

/**
 * The language-neutral ID for when the reason why a block is disabled is
 * because the block is only valid inside of a procedure body.
 */
const UNPARENTED_IFRETURN_DISABLED_REASON = 'UNPARENTED_IFRETURN';

const PROCEDURES_IFRETURN = {
  /**
   * Block for conditionally returning a value from a procedure.
   */
  init: function (this: IfReturnBlock) {
    this.appendValueInput('CONDITION')
      .setCheck('Boolean')
      .appendField(Msg['CONTROLS_IF_MSG_IF']);
    this.appendValueInput('VALUE').appendField(
      Msg['PROCEDURES_DEFRETURN_RETURN'],
    );
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle('procedure_blocks');
    this.setTooltip(Msg['PROCEDURES_IFRETURN_TOOLTIP']);
    this.setHelpUrl(Msg['PROCEDURES_IFRETURN_HELPURL']);
    this.hasReturnValue_ = true;
  },
  /**
   * Create XML to represent whether this block has a return value.
   *
   * @returns XML storage element.
   */
  mutationToDom: function (this: IfReturnBlock): Element {
    const container = xmlUtils.createElement('mutation');
    container.setAttribute('value', String(Number(this.hasReturnValue_)));
    return container;
  },
  /**
   * Parse XML to restore whether this block has a return value.
   *
   * @param xmlElement XML storage element.
   */
  domToMutation: function (this: IfReturnBlock, xmlElement: Element) {
    const value = xmlElement.getAttribute('value');
    this.hasReturnValue_ = value === '1';
    if (!this.hasReturnValue_) {
      this.removeInput('VALUE');
      this.appendDummyInput('VALUE').appendField(
        Msg['PROCEDURES_DEFRETURN_RETURN'],
      );
    }
  },

  // This block does not need JSO serialization hooks (saveExtraState and
  // loadExtraState) because the state of this block is already encoded in the
  // block's position in the workspace.
  // XML hooks are kept for backwards compatibility.

  /**
   * Called whenever anything on the workspace changes.
   * Add warning if this flow block is not nested inside a loop.
   *
   * @param e Move event.
   */
  onchange: function (this: IfReturnBlock, e: AbstractEvent) {
    if (
      ((this.workspace as WorkspaceSvg).isDragging &&
        (this.workspace as WorkspaceSvg).isDragging()) ||
      (e.type !== Events.BLOCK_MOVE && e.type !== Events.BLOCK_CREATE)
    ) {
      return; // Don't change state at the start of a drag.
    }
    let legal = false;
    // Is the block nested in a procedure?
    let block = this; // eslint-disable-line @typescript-eslint/no-this-alias
    do {
      if (this.FUNCTION_TYPES.includes(block.type)) {
        legal = true;
        break;
      }
      block = block.getSurroundParent()!;
    } while (block);
    if (legal) {
      // If needed, toggle whether this block has a return value.
      if (block.type === 'procedures_defnoreturn' && this.hasReturnValue_) {
        this.removeInput('VALUE');
        this.appendDummyInput('VALUE').appendField(
          Msg['PROCEDURES_DEFRETURN_RETURN'],
        );
        this.hasReturnValue_ = false;
      } else if (
        block.type === 'procedures_defreturn' &&
        !this.hasReturnValue_
      ) {
        this.removeInput('VALUE');
        this.appendValueInput('VALUE').appendField(
          Msg['PROCEDURES_DEFRETURN_RETURN'],
        );
        this.hasReturnValue_ = true;
      }
      this.setWarningText(null);
    } else {
      this.setWarningText(Msg['PROCEDURES_IFRETURN_WARNING']);
    }

    if (!this.isInFlyout) {
      try {
        // There is no need to record the enable/disable change on the undo/redo
        // list since the change will be automatically recreated when replayed.
        eventUtils.setRecordUndo(false);
        this.setDisabledReason(!legal, UNPARENTED_IFRETURN_DISABLED_REASON);
      } finally {
        eventUtils.setRecordUndo(true);
      }
    }
  },
  /**
   * List of block types that are functions and thus do not need warnings.
   * To add a new function type add this to your code:
   * Blocks['procedures_ifreturn'].FUNCTION_TYPES.push('custom_func');
   */
  FUNCTION_TYPES: ['procedures_defnoreturn', 'procedures_defreturn'],
};
blocks['procedures_ifreturn'] = PROCEDURES_IFRETURN;

// Register provided blocks.
defineBlocks(blocks);
