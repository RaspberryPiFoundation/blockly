/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

import * as Blockly from 'blockly/core';
import {ObservableProcedureModel} from './observable_procedure_model';
import {ObservableParameterModel} from './observable_parameter_model';
import {IProcedureBlock} from './i_procedure_block';
import {ProcedureCreate} from './events_procedure_create';

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * A dictionary of the block definitions provided by this module.
 *
 * @type {!Object<string, Object>}
 */
export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  {
    type: 'procedures_defnoreturn',
    message0: '%{BKY_PROCEDURES_DEFNORETURN_TITLE} %1 %2 %3',
    message1: '%{BKY_PROCEDURES_DEFNORETURN_DO} %1',
    args0: [
      {
        type: 'field_input',
        name: 'NAME',
        text: '',
        spellcheck: false,
      },
      {
        type: 'field_label',
        name: 'PARAMS',
        text: '',
      },
      {
        type: 'input_dummy',
        name: 'TOP',
      },
    ],
    args1: [
      {
        type: 'input_statement',
        name: 'STACK',
      },
    ],
    style: 'procedure_blocks',
    helpUrl: '%{BKY_PROCEDURES_DEFNORETURN_HELPURL}',
    tooltip: '%{BKY_PROCEDURES_DEFNORETURN_TOOLTIP}',
    extensions: [
      'procedure_def_get_def_mixin',
      'procedure_def_var_mixin',
      'procedure_def_update_shape_mixin',
      'procedure_def_context_menu_mixin',
      'procedure_def_onchange_mixin',
      'procedure_def_validator_helper',
      'procedure_defnoreturn_get_caller_block_mixin',
      'procedure_defnoreturn_set_comment_helper',
      'procedure_def_set_no_return_helper',
    ],
    mutator: 'procedure_def_mutator',
  },
  {
    type: 'procedures_callnoreturn',
    message0: '%1 %2',
    args0: [
      {type: 'field_label', name: 'NAME', text: '%{BKY_UNNAMED_KEY}'},
      {
        type: 'input_dummy',
        name: 'TOPROW',
      },
    ],
    nextStatement: null,
    previousStatement: null,
    style: 'procedure_blocks',
    helpUrl: '%{BKY_PROCEDURES_CALLNORETURN_HELPURL}',
    extensions: [
      'procedure_caller_get_def_mixin',
      'procedure_caller_var_mixin',
      'procedure_caller_update_shape_mixin',
      'procedure_caller_context_menu_mixin',
      'procedure_caller_onchange_mixin',
      'procedure_callernoreturn_get_def_block_mixin',
    ],
    mutator: 'procedure_caller_mutator',
  },
  {
    type: 'procedures_defreturn',
    message0: '%{BKY_PROCEDURES_DEFRETURN_TITLE} %1 %2 %3',
    message1: '%{BKY_PROCEDURES_DEFRETURN_DO} %1',
    message2: '%{BKY_PROCEDURES_DEFRETURN_RETURN} %1',
    args0: [
      {
        type: 'field_input',
        name: 'NAME',
        text: '',
        spellcheck: false,
      },
      {
        type: 'field_label',
        name: 'PARAMS',
        text: '',
      },
      {
        type: 'input_dummy',
        name: 'TOP',
      },
    ],
    args1: [
      {
        type: 'input_statement',
        name: 'STACK',
      },
    ],
    args2: [
      {
        type: 'input_value',
        align: 'right',
        name: 'RETURN',
      },
    ],
    style: 'procedure_blocks',
    helpUrl: '%{BKY_PROCEDURES_DEFRETURN_HELPURL}',
    tooltip: '%{BKY_PROCEDURES_DEFRETURN_TOOLTIP}',
    extensions: [
      'procedure_def_get_def_mixin',
      'procedure_def_var_mixin',
      'procedure_def_update_shape_mixin',
      'procedure_def_context_menu_mixin',
      'procedure_def_onchange_mixin',
      'procedure_def_validator_helper',
      'procedure_defreturn_get_caller_block_mixin',
      'procedure_defreturn_set_comment_helper',
      'procedure_def_set_return_helper',
    ],
    mutator: 'procedure_def_mutator',
  },
  {
    type: 'procedures_callreturn',
    message0: '%1 %2',
    args0: [
      {type: 'field_label', name: 'NAME', text: '%{BKY_UNNAMED_KEY}'},
      {
        type: 'input_dummy',
        name: 'TOPROW',
      },
    ],
    output: null,
    style: 'procedure_blocks',
    helpUrl: '%{BKY_PROCEDURES_CALLRETURN_HELPURL}',
    extensions: [
      'procedure_caller_get_def_mixin',
      'procedure_caller_var_mixin',
      'procedure_caller_update_shape_mixin',
      'procedure_caller_context_menu_mixin',
      'procedure_caller_onchange_mixin',
      'procedure_callerreturn_get_def_block_mixin',
    ],
    mutator: 'procedure_caller_mutator',
  },
]);

const procedureDefGetDefMixin = function () {
  const mixin = {
    model_: null,

    /**
     * Returns the data model for this procedure block.
     *
     * @returns The data model for this procedure
     *     block.
     */
    getProcedureModel() {
      return this.model_;
    },

    /**
     * True if this is a procedure definition block, false otherwise (i.e.
     * it is a caller).
     *
     * @returns True because this is a procedure definition block.
     */
    isProcedureDef() {
      return true;
    },

    /**
     * Return all variables referenced by this block.
     *
     * @returns List of variable names.
     * @this {Blockly.Block}
     */
    getVars: function () {
      return this.getProcedureModel()
        .getParameters()
        .map((p) => p.getVariableModel().name);
    },

    /**
     * Return all variables referenced by this block.
     *
     * @returns List of variable models.
     * @this {Blockly.Block}
     */
    getVarModels: function () {
      return this.getProcedureModel()
        .getParameters()
        .map((p) => p.getVariableModel());
    },

    /**
     * Disposes of the data model for this procedure block when the block is
     * disposed.
     */
    destroy: function () {
      if (!this.isInsertionMarker()) {
        this.workspace
          .getProcedureMap()
          .delete(this.getProcedureModel().getId());
      }
    },
  };

  mixin.model_ = new ObservableProcedureModel(
    this.workspace,
    Blockly.Procedures.findLegalName(this.getFieldValue('NAME'), this),
  );

  // Events cannot be fired from instantiation when deserializing or dragging
  // from the flyout. So make this consistent and never fire from instantiation.
  Blockly.Events.disable();
  this.workspace.getProcedureMap().add(mixin.getProcedureModel());
  Blockly.Events.enable();

  this.mixin(mixin, true);
};
// Using register instead of registerMixin to avoid triggering warnings about
// overriding built-ins.
Blockly.Extensions.register(
  'procedure_def_get_def_mixin',
  procedureDefGetDefMixin,
);

const procedureDefVarMixin = function () {
  const mixin = {
    /**
     * Notification that a variable is renaming.
     * If the ID matches one of this block's variables, rename it.
     *
     * @param oldId ID of variable to rename.
     * @param newId ID of new variable.  May be the same as oldId, but
     *     with an updated name.  Guaranteed to be the same type as the old
     *     variable.
     * @override
     * @this {Blockly.Block}
     */
    renameVarById: function (oldId, newId) {
      const oldVar = this.workspace.getVariableMap().getVariableById(oldId);
      const model = this.getProcedureModel();
      const index = model
        .getParameters()
        .findIndex((p) => p.getVariableModel() === oldVar);
      if (index === -1) return; // Not found.
      const newVar = this.workspace.getVariableMap().getVariableById(newId);
      const oldParam = model.getParameter(index);
      oldParam.setName(newVar.name);
    },

    /**
     * Notification that a variable is renaming but keeping the same ID.  If the
     * variable is in use on this block, rerender to show the new name.
     *
     * @param variable The variable being renamed.
     * @package
     * @override
     * @this {Blockly.Block}
     */
    updateVarName: function (variable) {
      const containsVar = this.getProcedureModel()
        .getParameters()
        .some((p) => p.getVariableModel() === variable);
      if (containsVar) {
        this.doProcedureUpdate(); // Rerender.
      }
    },
  };

  this.mixin(mixin, true);
};
// Using register instead of registerMixin to avoid triggering warnings about
// overriding built-ins.
Blockly.Extensions.register('procedure_def_var_mixin', procedureDefVarMixin);

const procedureDefUpdateShapeMixin = {
  /**
   * Updates the block to reflect the state of the procedure model.
   */
  doProcedureUpdate: function () {
    this.setFieldValue(this.getProcedureModel().getName(), 'NAME');
    this.setDisabledReason(!this.getProcedureModel().getEnabled());
    this.updateParameters_();
    this.updateMutator_();
  },

  /**
   * Updates the parameters field to reflect the parameters in the procedure
   * model.
   */
  updateParameters_: function () {
    const params = this.getProcedureModel()
      .getParameters()
      .map((p) => p.getName());
    const paramString = params.length
      ? `${Blockly.Msg['PROCEDURES_BEFORE_PARAMS']} ${params.join(', ')}`
      : '';

    // The field is deterministic based on other events, no need to fire.
    Blockly.Events.disable();
    try {
      this.setFieldValue(paramString, 'PARAMS');
    } finally {
      Blockly.Events.enable();
    }
  },

  /**
   * Updates the parameter blocks in the mutator (if it is open) to reflect
   * the state of the procedure model.
   */
  updateMutator_: function () {
    const mutator = this.getIcon(Blockly.icons.MutatorIcon.TYPE);
    if (!mutator?.bubbleIsVisible()) return;

    const mutatorWorkspace = this.mutator.getWorkspace();
    for (const p of this.getProcedureModel().getParameters()) {
      const block = mutatorWorkspace.getBlockById(p.getId());
      if (!block) continue; // Should not happen.
      if (block.getFieldValue('NAME') !== p.getName()) {
        block.setFieldValue(p.getName(), 'NAME');
      }
    }
  },

  /**
   * Add or remove the statement block from this function definition.
   *
   * @param hasStatements True if a statement block is needed.
   * @this {Blockly.Block}
   */
  setStatements_: function (hasStatements) {
    if (this.hasStatements_ === hasStatements) {
      return;
    }
    if (hasStatements) {
      this.appendStatementInput('STACK').appendField(
        Blockly.Msg['PROCEDURES_DEFNORETURN_DO'],
      );
      if (this.getInput('RETURN')) {
        this.moveInputBefore('STACK', 'RETURN');
      }
      // Restore the stack, if one was saved.
      this.statementConnection_?.reconnect(this, 'STACK');
      this.statementConnection_ = null;
    } else {
      // Save the stack, then disconnect it.
      const stackConnection = this.getInput('STACK').connection;
      this.statementConnection_ = stackConnection.targetConnection;
      if (this.statementConnection_) {
        const stackBlock = stackConnection.targetBlock();
        stackBlock.unplug();
        stackBlock.bumpNeighbours();
      }
      this.removeInput('STACK', true);
    }
    this.hasStatements_ = hasStatements;
  },
};
Blockly.Extensions.registerMixin(
  'procedure_def_update_shape_mixin',
  procedureDefUpdateShapeMixin,
);

const procedureDefValidatorHelper = function () {
  const nameField = this.getField('NAME');
  nameField.setValue(Blockly.Procedures.findLegalName('', this));
  nameField.setValidator(Blockly.Procedures.rename);
};
Blockly.Extensions.register(
  'procedure_def_validator_helper',
  procedureDefValidatorHelper,
);

const procedureDefMutator = {
  hasStatements_: true,

  /**
   * Create XML to represent the argument inputs.
   * Backwards compatible serialization implementation.
   *
   * @returns XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement('mutation');
    const params = this.getProcedureModel().getParameters();
    for (let i = 0; i < params.length; i++) {
      const parameter = Blockly.utils.xml.createElement('arg');
      const varModel = params[i].getVariableModel();
      parameter.setAttribute('name', varModel.name);
      parameter.setAttribute('varid', varModel.getId());
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
   * @this {Blockly.Block}
   */
  domToMutation: function (xmlElement) {
    for (let i = 0; i < xmlElement.childNodes.length; i++) {
      const node = xmlElement.childNodes[i];
      if (node.nodeName.toLowerCase() !== 'arg') continue;
      const varId = node.getAttribute('varid');
      this.getProcedureModel().insertParameter(
        new ObservableParameterModel(
          this.workspace,
          node.getAttribute('name'),
          undefined,
          varId,
        ),
        i,
      );
    }
    this.setStatements_(xmlElement.getAttribute('statements') !== 'false');
  },

  /**
   * Returns the state of this block as a JSON serializable object.
   *
   * @param doFullSerialization Tells the block if it should serialize
   *     its entire state (including data stored in the backing procedure
   *     model). Used for copy-paste.
   * @returns The state of this block, eg the parameters and statements.
   */
  saveExtraState: function (doFullSerialization) {
    const state = Object.create(null);
    state['procedureId'] = this.getProcedureModel().getId();

    if (doFullSerialization) {
      state['fullSerialization'] = true;
      const params = this.getProcedureModel().getParameters();
      if (params.length) {
        state['params'] = params.map((p) => {
          return {
            name: p.getName(),
            id: p.getVariableModel().getId(),
            // Ideally this would be id, and the other would be varId,
            // but backwards compatibility :/
            paramId: p.getId(),
          };
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
   * @param state The state to apply to this block, eg the parameters and
   *     statements.
   */
  loadExtraState: function (state) {
    const map = this.workspace.getProcedureMap();

    const procedureId = state['procedureId'];
    if (map.has(procedureId) && !state['fullSerialization']) {
      if (map.has(this.model_.getId())) {
        map.delete(this.model_.getId());
      }
      this.model_ = map.get(procedureId);
    }

    const model = this.getProcedureModel();
    const newParams = state['params'] ?? [];
    const newIds = new Set(newParams.map((p) => p.id));
    const currParams = model.getParameters();
    if (state['fullSerialization']) {
      for (let i = currParams.length - 1; i >= 0; i--) {
        if (!newIds.has(currParams[i].getId)) {
          model.deleteParameter(i);
        }
      }
    }
    for (let i = 0; i < newParams.length; i++) {
      const {name, id, paramId} = state['params'][i];
      this.getProcedureModel().insertParameter(
        new ObservableParameterModel(this.workspace, name, paramId, id),
        i,
      );
    }

    this.doProcedureUpdate();
    this.setStatements_(state['hasStatements'] === false ? false : true);
  },

  /**
   * Populate the mutator's dialog with this block's components.
   *
   * @param workspace Blockly.Mutator's workspace.
   * @returns Root block in mutator.
   * @this {Blockly.Block}
   */
  decompose: function (workspace) {
    const containerBlockDef = {
      type: 'procedures_mutatorcontainer',
      inputs: {
        STACK: {},
      },
    };

    let connDef = containerBlockDef['inputs']['STACK'];
    for (const param of this.getProcedureModel().getParameters()) {
      connDef['block'] = {
        type: 'procedures_mutatorarg',
        id: param.getId(),
        fields: {
          NAME: param.getName(),
        },
        next: {},
      };
      connDef = connDef['block']['next'];
    }

    const containerBlock = Blockly.serialization.blocks.append(
      containerBlockDef as unknown as Blockly.serialization.blocks.State,
      workspace,
      {recordUndo: false},
    );

    if (this.type === 'procedures_defreturn') {
      containerBlock.setFieldValue(this.hasStatements_, 'STATEMENTS');
    } else {
      containerBlock.removeInput('STATEMENT_INPUT');
    }

    return containerBlock;
  },

  /**
   * Reconfigure this block based on the mutator dialog's components.
   *
   * @param containerBlock Root block in mutator.
   * @this {Blockly.Block}
   */
  compose: function (containerBlock) {
    // Note that only one of these four things can actually occur for any given
    // composition, because the user can only drag blocks around so quickly.
    // So we can use that when making assumptions inside the definitions of
    // these sub procedures.
    this.deleteParamsFromModel_(containerBlock);
    this.renameParamsInModel_(containerBlock);
    this.addParamsToModel_(containerBlock);

    const hasStatements = containerBlock.getFieldValue('STATEMENTS');
    if (hasStatements !== null) {
      this.setStatements_(hasStatements === 'TRUE');
    }
  },

  /**
   * Deletes any parameters from the procedure model that do not have associated
   * parameter blocks in the mutator.
   *
   * @param containerBlock Root block in the mutator.
   */
  deleteParamsFromModel_: function (containerBlock) {
    const ids = new Set(containerBlock.getDescendants().map((b) => b.id));
    const model = this.getProcedureModel();
    const count = model.getParameters().length;
    for (let i = count - 1; i >= 0; i--) {
      if (!ids.has(model.getParameter(i).getId())) {
        model.deleteParameter(i);
      }
    }
  },

  /**
   * Renames any parameters in the procedure model whose associated parameter
   * blocks have been renamed.
   *
   * @param containerBlock Root block in the mutator.
   */
  renameParamsInModel_: function (containerBlock) {
    const model = this.getProcedureModel();

    let i = 0;
    let paramBlock = containerBlock.getInputTargetBlock('STACK');
    while (paramBlock && !paramBlock.isInsertionMarker()) {
      const param = model.getParameter(i);
      if (
        param &&
        param.getId() === paramBlock.id &&
        param.getName() !== paramBlock.getFieldValue('NAME')
      ) {
        param.setName(paramBlock.getFieldValue('NAME'));
      }
      paramBlock =
        paramBlock.nextConnection && paramBlock.nextConnection.targetBlock();
      i++;
    }
  },

  /**
   * Adds new parameters to the procedure model for any new procedure parameter
   * blocks.
   *
   * @param containerBlock Root block in the mutator.
   */
  addParamsToModel_: function (containerBlock) {
    const model = this.getProcedureModel();

    let i = 0;
    let paramBlock = containerBlock.getInputTargetBlock('STACK');
    while (paramBlock && !paramBlock.isInsertionMarker()) {
      if (
        !model.getParameter(i) ||
        model.getParameter(i).getId() !== paramBlock.id
      ) {
        model.insertParameter(
          new ObservableParameterModel(
            this.workspace,
            paramBlock.getFieldValue('NAME'),
            paramBlock.id,
          ),
          i,
        );
      }
      paramBlock =
        paramBlock.nextConnection && paramBlock.nextConnection.targetBlock();
      i++;
    }
  },
};
Blockly.Extensions.registerMutator(
  'procedure_def_mutator',
  procedureDefMutator,
  undefined,
  ['procedures_mutatorarg'],
);

const procedureDefContextMenuMixin = {
  /**
   * Add custom menu options to this block's context menu.
   *
   * @param options List of menu options to add to.
   * @this {Blockly.Block}
   */
  customContextMenu: function (
    options: Array<
      | Blockly.ContextMenuRegistry.ContextMenuOption
      | Blockly.ContextMenuRegistry.LegacyContextMenuOption
    >,
  ) {
    if (this.isInFlyout) {
      return;
    }

    const xmlMutation = Blockly.utils.xml.createElement('mutation');
    xmlMutation.setAttribute('name', this.getFieldValue('NAME'));
    const params = this.getProcedureModel().getParameters();
    for (const param of params) {
      const xmlArg = Blockly.utils.xml.createElement('arg');
      xmlArg.setAttribute('name', param.getName());
      xmlMutation.appendChild(xmlArg);
    }
    const xmlBlock = Blockly.utils.xml.createElement('block');
    xmlBlock.setAttribute('type', this.callType_);
    xmlBlock.appendChild(xmlMutation);

    // Add option to create caller.
    options.push({
      enabled: true,
      text: Blockly.Msg['PROCEDURES_CREATE_DO'].replace(
        '%1',
        this.getFieldValue('NAME'),
      ),
      callback: Blockly.ContextMenu.callbackFactory(
        this,
        xmlBlock,
      ) as () => void,
    });

    // Add options to create getters for each parameter.
    if (this.isCollapsed()) return;

    for (const param of params) {
      const argVar = param.getVariableModel();
      const argXmlField = Blockly.Variables.generateVariableFieldDom(argVar);
      const argXmlBlock = Blockly.utils.xml.createElement('block');
      argXmlBlock.setAttribute('type', 'variables_get');
      argXmlBlock.appendChild(argXmlField);
      options.push({
        enabled: true,
        text: Blockly.Msg['VARIABLES_SET_CREATE_GET'].replace(
          '%1',
          argVar.name,
        ),
        callback: Blockly.ContextMenu.callbackFactory(
          this,
          argXmlBlock,
        ) as () => void,
      });
    }
  },
};
Blockly.Extensions.registerMixin(
  'procedure_def_context_menu_mixin',
  procedureDefContextMenuMixin,
);

const procedureDefOnChangeMixin = {
  onchange: function (e) {
    if (e.type === Blockly.Events.BLOCK_CREATE && e.blockId === this.id) {
      Blockly.Events.fire(
        new ProcedureCreate(this.workspace, this.getProcedureModel()),
      );
    }
    if (
      e.type === Blockly.Events.BLOCK_CHANGE &&
      e.blockId === this.id &&
      e.element === 'disabled'
    ) {
      this.getProcedureModel().setEnabled(this.isEnabled());
    }
  },
};
Blockly.Extensions.registerMixin(
  'procedure_def_onchange_mixin',
  procedureDefOnChangeMixin,
);

const procedureDefNoReturnSetCommentHelper = function () {
  if (
    (this.workspace.options.comments ||
      (this.workspace.options.parentWorkspace &&
        this.workspace.options.parentWorkspace.options.comments)) &&
    Blockly.Msg['PROCEDURES_DEFNORETURN_COMMENT']
  ) {
    this.setCommentText(Blockly.Msg['PROCEDURES_DEFNORETURN_COMMENT']);
  }
};
Blockly.Extensions.register(
  'procedure_defnoreturn_set_comment_helper',
  procedureDefNoReturnSetCommentHelper,
);

const procedureDefReturnSetCommentHelper = function () {
  if (
    (this.workspace.options.comments ||
      (this.workspace.options.parentWorkspace &&
        this.workspace.options.parentWorkspace.options.comments)) &&
    Blockly.Msg['PROCEDURES_DEFRETURN_COMMENT']
  ) {
    this.setCommentText(Blockly.Msg['PROCEDURES_DEFRETURN_COMMENT']);
  }
};
Blockly.Extensions.register(
  'procedure_defreturn_set_comment_helper',
  procedureDefReturnSetCommentHelper,
);

const procedureDefNoReturnGetCallerBlockMixin = {
  callType_: 'procedures_callnoreturn',
};
Blockly.Extensions.registerMixin(
  'procedure_defnoreturn_get_caller_block_mixin',
  procedureDefNoReturnGetCallerBlockMixin,
);

const procedureDefReturnGetCallerBlockMixin = {
  callType_: 'procedures_callreturn',
};
Blockly.Extensions.registerMixin(
  'procedure_defreturn_get_caller_block_mixin',
  procedureDefReturnGetCallerBlockMixin,
);

const procedureDefSetNoReturnHelper = function () {
  this.getProcedureModel().setReturnTypes(null);
};
Blockly.Extensions.register(
  'procedure_def_set_no_return_helper',
  procedureDefSetNoReturnHelper,
);

const procedureDefSetReturnHelper = function () {
  this.getProcedureModel().setReturnTypes([]);
};
Blockly.Extensions.register(
  'procedure_def_set_return_helper',
  procedureDefSetReturnHelper,
);

const procedureCallerGetDefMixin = function () {
  const mixin = {
    model_: null,

    prevParams_: [],

    argsMap_: new Map(),

    /**
     * Returns the procedure model associated with this block.
     *
     * @returns The procedure model associated with this block.
     */
    getProcedureModel() {
      return this.model_;
    },

    /**
     * Returns the procedure model tha was found.
     *
     * @param name The name of the procedure model to find.
     * @param params The param names of the procedure model
     *     to find.
     * @returns The procedure model that was found.
     */
    findProcedureModel_(name, params = []) {
      const workspace = this.getTargetWorkspace_();
      const model = workspace
        .getProcedureMap()
        .getProcedures()
        .find((proc) => proc.getName() === name);
      if (!model) return null;

      const returnTypes = model.getReturnTypes();
      const hasMatchingReturn = this.hasReturn_ ? returnTypes : !returnTypes;
      if (!hasMatchingReturn) return null;

      const hasMatchingParams = model
        .getParameters()
        .every((p, i) => p.getName() === params[i]);
      if (!hasMatchingParams) return null;

      return model;
    },

    /**
     * Returns the main workspace (i.e. not the flyout workspace) associated
     * with this block.
     *
     * @returns The main workspace (i.e. not the flyout workspace) associated
     *     with this block.
     */
    getTargetWorkspace_() {
      return this.workspace.isFlyout
        ? this.workspace.targetWorkspace
        : this.workspace;
    },

    /**
     * True if this is a procedure definition block, false otherwise (i.e.
     * it is a caller).
     *
     * @returns False because this is not a procedure definition block.
     */
    isProcedureDef() {
      return false;
    },

    /**
     * Return all variables referenced by this block.
     *
     * @returns List of variable names.
     * @this {Blockly.Block}
     */
    getVars: function () {
      return this.getProcedureModel()
        .getParameters()
        .map((p) => p.getVariableModel().name);
    },

    /**
     * Return all variables referenced by this block.
     *
     * @returns List of variable models.
     * @this {Blockly.Block}
     */
    getVarModels: function () {
      return this.getProcedureModel()
        .getParameters()
        .map((p) => p.getVariableModel());
    },
  };

  this.mixin(mixin, true);
};
// Using register instead of registerMixin to avoid triggering warnings about
// overriding built-ins.
Blockly.Extensions.register(
  'procedure_caller_get_def_mixin',
  procedureCallerGetDefMixin,
);

const procedureCallerVarMixin = function () {
  const mixin = {
    /**
     * Notification that a variable is renaming but keeping the same ID.  If the
     * variable is in use on this block, rerender to show the new name.
     *
     * @param variable The variable being renamed.
     * @package
     * @override
     * @this {Blockly.Block}
     */
    updateVarName: function (variable) {
      const containsVar = this.getProcedureModel()
        .getParameters()
        .some((p) => p.getVariableModel() === variable);
      if (containsVar) {
        this.doProcedureUpdate(); // Rerender.
      }
    },
  };

  this.mixin(mixin, true);
};
// Using register instead of registerMixin to avoid triggering warnings about
// overriding built-ins.
Blockly.Extensions.register(
  'procedure_caller_var_mixin',
  procedureCallerVarMixin,
);

const procedureCallerMutator = {
  paramsFromSerializedState_: [],

  /**
   * Create XML to represent the (non-editable) name and arguments.
   * Backwards compatible serialization implementation.
   *
   * @returns XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement('mutation');
    const model = this.getProcedureModel();
    if (!model) return container;

    container.setAttribute('name', model.getName());
    for (const param of model.getParameters()) {
      const arg = Blockly.utils.xml.createElement('arg');
      arg.setAttribute('name', param.getName());
      container.appendChild(arg);
    }
    return container;
  },

  /**
   * Parse XML to restore the (non-editable) name and parameters.
   * Backwards compatible serialization implementation.
   *
   * @param xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function (xmlElement) {
    const name = xmlElement.getAttribute('name');
    const params = [];
    for (const n of xmlElement.childNodes) {
      if (n.nodeName.toLowerCase() === 'arg') {
        params.push(n.getAttribute('name'));
      }
    }
    this.deserialize_(name, params);
  },

  /**
   * Returns the state of this block as a JSON serializable object.
   *
   * @returns The state of
   *     this block, ie the params and procedure name.
   */
  saveExtraState: function () {
    const state = Object.create(null);
    const model = this.getProcedureModel();
    if (!model) {
      // We reached here because we've deserialized a caller into a workspace
      // where its model did not already exist (no procedures array in the json,
      // and deserialized before any definition block), and are reserializing
      // it before the event delay has elapsed and change listeners have run.
      // (If they had run, we would have found or created a model).
      // Just reserialize any deserialized state. Nothing should have happened
      // in-between to change it.
      state['name'] = this.getFieldValue('NAME');
      state['params'] = this.paramsFromSerializedState_;
      return state;
    }
    state['name'] = model.getName();
    if (model.getParameters().length) {
      state['params'] = model.getParameters().map((p) => p.getName());
    }
    return state;
  },

  /**
   * Applies the given state to this block.
   *
   * @param state The state to apply to this block, ie the params and
   *     procedure name.
   */
  loadExtraState: function (state) {
    this.deserialize_(state['name'], state['params'] || []);
  },

  /**
   * Applies the given name and params from the serialized state to the block.
   *
   * @param name The name to apply to the block.
   * @param params The parameters to apply to the block.
   */
  deserialize_: function (name, params) {
    this.setFieldValue(name, 'NAME');
    if (!this.model_) this.model_ = this.findProcedureModel_(name, params);
    if (this.getProcedureModel()) {
      this.initBlockWithProcedureModel_();
    } else {
      // Create inputs based on the mutation so that children can be connected.
      this.createArgInputs_(params);
    }
    this.paramsFromSerializedState_ = params;
  },
};
Blockly.Extensions.registerMutator(
  'procedure_caller_mutator',
  procedureCallerMutator,
);

const PROCEDURE_MODEL_DISABLED_REASON = 'PROCEDURE_MODEL_DISABLED';

const procedureCallerUpdateShapeMixin = {
  /**
   * Renders the block for the first time based on the procedure model.
   */
  initBlockWithProcedureModel_() {
    this.prevParams_ = [...this.getProcedureModel().getParameters()];
    this.doProcedureUpdate();
  },

  /**
   * Updates the shape of this block to reflect the state of the data model.
   */
  doProcedureUpdate: function () {
    if (!this.getProcedureModel() || this.isDeadOrDying()) return;
    const id = this.getProcedureModel().getId();
    if (
      !this.getTargetWorkspace_().getProcedureMap().has(id) &&
      !this.isInFlyout
    ) {
      this.dispose(true);
      return;
    }
    this.updateName_();
    this.updateEnabled_();
    this.updateParameters_();
  },

  /**
   * Updates the name field of this block to match the state of the data model.
   */
  updateName_: function () {
    const name = this.getProcedureModel().getName();
    this.setFieldValue(name, 'NAME');
    const baseMsg = this.outputConnection
      ? Blockly.Msg['PROCEDURES_CALLRETURN_TOOLTIP']
      : Blockly.Msg['PROCEDURES_CALLNORETURN_TOOLTIP'];
    this.setTooltip(baseMsg.replace('%1', name));
  },

  /**
   * Updates the enabled state of this block to match the state of the data
   *     model.
   */
  updateEnabled_: function () {
    this.setDisabledReason(
      !this.getProcedureModel().getEnabled(),
      PROCEDURE_MODEL_DISABLED_REASON,
    );
  },

  /**
   * Updates the parameter fields/inputs of this block to match the state of the
   * data model.
   */
  updateParameters_: function () {
    this.syncArgsMap_();
    this.deleteAllArgInputs_();
    this.addParametersLabel__();
    this.createArgInputs_();
    this.reattachBlocks_();
    this.prevParams_ = [...this.getProcedureModel().getParameters()];
  },

  /**
   * Makes sure that if we are updating the parameters before any move events
   * have happened, the args map records the current state of the block. Does
   * not remove entries from the array, since blocks can be disconnected
   * temporarily during mutation (which triggers this method).
   */
  syncArgsMap_: function () {
    // We look at the prevParams array because the current state of the block
    // matches the old params, not the new params state.
    for (const [i, p] of this.prevParams_.entries()) {
      const target = this.getInputTargetBlock(`ARG${i}`);
      if (target) this.argsMap_.set(p.getId(), target);
    }
  },

  /**
   * Saves a map of parameter IDs to target blocks attached to the inputs
   * of this caller block.
   */
  updateArgsMap_: function () {
    for (const [i, p] of this.getProcedureModel().getParameters().entries()) {
      const target = this.getInputTargetBlock(`ARG${i}`);
      if (target) {
        this.argsMap_.set(p.getId(), target);
      } else {
        this.argsMap_.delete(p.getId());
      }
    }
  },

  /**
   * Deletes all the parameter inputs on this block.
   */
  deleteAllArgInputs_: function () {
    let i = 0;
    while (this.getInput(`ARG${i}`)) {
      this.removeInput(`ARG${i}`);
      i++;
    }
  },

  /**
   * Adds or removes the parameter label to match the state of the data model.
   */
  addParametersLabel__: function () {
    const topRow = this.getInput('TOPROW');
    if (this.getProcedureModel().getParameters().length) {
      if (!this.getField('WITH')) {
        topRow.appendField(
          Blockly.Msg['PROCEDURES_CALL_BEFORE_PARAMS'],
          'WITH',
        );
        topRow.init();
      }
    } else if (this.getField('WITH')) {
      topRow.removeField('WITH');
    }
  },

  /**
   * Creates all of the parameter inputs to match the state of the data model.
   *
   * @param params The params to add to the block, or null to
   *     use the params defined in the procedure model.
   */
  createArgInputs_: function (params = null) {
    if (!params) {
      params = this.getProcedureModel()
        .getParameters()
        .map((p) => p.getName());
    }
    for (const [i, p] of params.entries()) {
      this.appendValueInput(`ARG${i}`)
        .appendField(new Blockly.FieldLabel(p), `ARGNAME${i}`)
        .setAlign(Blockly.inputs.Align.RIGHT);
    }
  },

  /**
   * Reattaches blocks to this blocks' inputs based on the data saved in the
   * argsMap_.
   */
  reattachBlocks_: function () {
    const params = this.getProcedureModel().getParameters();
    for (const [i, p] of params.entries()) {
      if (!this.argsMap_.has(p.getId())) continue;
      this.getInput(`ARG${i}`).connection.connect(
        this.argsMap_.get(p.getId()).outputConnection,
      );
    }
  },

  /**
   * Notification that a procedure is renaming.
   * If the name matches this block's procedure, rename it.
   *
   * @param oldName Previous name of procedure.
   * @param newName Renamed procedure.
   * @this {Blockly.Block}
   */
  renameProcedure: function (oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('NAME'))) {
      this.setFieldValue(newName, 'NAME');
      const baseMsg = this.outputConnection
        ? Blockly.Msg['PROCEDURES_CALLRETURN_TOOLTIP']
        : Blockly.Msg['PROCEDURES_CALLNORETURN_TOOLTIP'];
      this.setTooltip(baseMsg.replace('%1', newName));
    }
  },
};
Blockly.Extensions.registerMixin(
  'procedure_caller_update_shape_mixin',
  procedureCallerUpdateShapeMixin,
);

const procedureCallerOnChangeMixin = {
  /**
   * Procedure calls cannot exist without the corresponding procedure
   * definition.  Enforce this link whenever an event is fired.
   *
   * @param event Change event.
   * @this {Blockly.Block}
   */
  onchange: function (event) {
    if (this.disposed || this.workspace.isFlyout) return;
    if (event.type === Blockly.Events.BLOCK_MOVE) this.updateArgsMap_(true);
    if (
      event.type !== Blockly.Events.FINISHED_LOADING &&
      !this.eventIsCreatingThisBlockDuringPaste_(event)
    )
      return;

    // We already found our model, which means we don't need to create a block.
    if (this.getProcedureModel()) return;

    // Look for the case where a procedure call was created (usually through
    // paste) and there is no matching definition.  In this case, create
    // an empty definition block with the correct signature.
    const name = this.getFieldValue('NAME');
    let def = Blockly.Procedures.getDefinition(name, this.workspace);
    if (!this.defMatches_(def)) def = null;
    if (!def) {
      // We have no def nor procedure model.
      Blockly.Events.setGroup(event.group);
      this.model_ = this.createDef_(
        this.getFieldValue('NAME'),
        this.paramsFromSerializedState_,
      );
      Blockly.Events.setGroup(false);
    }
    if (!this.getProcedureModel()) {
      // We have a def, but no reference to its model.
      this.model_ = this.findProcedureModel_(
        this.getFieldValue('NAME'),
        this.paramsFromSerializedState_,
      );
    }
    this.initBlockWithProcedureModel_();
  },

  /**
   * @param event The event to check.
   * @returns True if the given event is a paste event for this block.
   */
  eventIsCreatingThisBlockDuringPaste_(event) {
    return (
      event.type === Blockly.Events.BLOCK_CREATE &&
      (event.blockId === this.id || event.ids.indexOf(this.id) !== -1) &&
      // Record undo makes sure this is during paste.
      event.recordUndo
    );
  },

  /**
   * Returns true if the given def block matches the definition of this caller
   * block.
   *
   * @param defBlock The definition block to check against.
   * @returns Whether the def block matches or not.
   */
  defMatches_(defBlock) {
    return (
      defBlock &&
      defBlock.type === this.defType_ &&
      JSON.stringify(defBlock.getVars()) ===
        JSON.stringify(this.paramsFromSerializedState_)
    );
  },

  /**
   * Creates a procedure definition block with the given name and params,
   * and returns the procedure model associated with it.
   *
   * @param name The name of the procedure to create.
   * @param params The names of the parameters to create.
   * @returns The procedure model associated with the new
   *     procedure definition block.
   */
  createDef_(name, params = []) {
    const xy = this.getRelativeToSurfaceXY();
    const newName = Blockly.Procedures.findLegalName(name, this);
    this.renameProcedure(name, newName);

    const blockDef = {
      type: this.defType_,
      x: xy.x + Blockly.config.snapRadius * (this.RTL ? -1 : 1),
      y: xy.y + Blockly.config.snapRadius * 2,
      extraState: {
        params: params.map((p) => ({name: p})),
      },
      fields: {NAME: newName},
    };
    const block = Blockly.serialization.blocks.append(
      blockDef,
      this.getTargetWorkspace_(),
      {recordUndo: true},
    );
    return (block as unknown as IProcedureBlock).getProcedureModel();
  },
};
Blockly.Extensions.registerMixin(
  'procedure_caller_onchange_mixin',
  procedureCallerOnChangeMixin,
);

const procedureCallerContextMenuMixin = {
  /**
   * Add menu option to find the definition block for this call.
   *
   * @param options List of menu options to add to.
   * @this {Blockly.Block}
   */
  customContextMenu: function (options) {
    if (!this.workspace.isMovable()) {
      // If we center on the block and the workspace isn't movable we could
      // lose blocks at the edges of the workspace.
      return;
    }

    const name = this.getFieldValue('NAME');
    const workspace = this.workspace;
    const callback = function () {
      const def = Blockly.Procedures.getDefinition(name, workspace);
      if (def && def instanceof Blockly.BlockSvg) {
        workspace.centerOnBlock(def.id);
        def.select();
      }
    };
    options.push({
      enabled: true,
      text: Blockly.Msg['PROCEDURES_HIGHLIGHT_DEF'],
      callback: callback,
    });
  },
};
Blockly.Extensions.registerMixin(
  'procedure_caller_context_menu_mixin',
  procedureCallerContextMenuMixin,
);

const procedureCallerNoReturnGetDefBlockMixin = {
  hasReturn_: false,
  defType_: 'procedures_defnoreturn',
};
Blockly.Extensions.registerMixin(
  'procedure_callernoreturn_get_def_block_mixin',
  procedureCallerNoReturnGetDefBlockMixin,
);

const procedureCallerReturnGetDefBlockMixin = {
  hasReturn_: true,
  defType_: 'procedures_defreturn',
};
Blockly.Extensions.registerMixin(
  'procedure_callerreturn_get_def_block_mixin',
  procedureCallerReturnGetDefBlockMixin,
);
