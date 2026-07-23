/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Changes the procedure blocks to use a +/- mutator UI.
 */

import * as Blockly from 'blockly/core';
import {createMinusField} from './field_minus';
import {createPlusField} from './field_plus';

Blockly.Msg['PROCEDURE_VARIABLE'] = 'variable:';

// Delete original blocks because there's no way to unregister them:
// https://github.com/RaspberryPiFoundation/blockly-samples/issues/768#issuecomment-885663394
delete Blockly.Blocks['procedures_defnoreturn'];
delete Blockly.Blocks['procedures_defreturn'];

Blockly.defineBlocksWithJsonArray([
  {
    type: 'procedures_defnoreturn',
    message0: '%{BKY_PROCEDURES_DEFNORETURN_TITLE} %1 %2',
    message1: '%{BKY_PROCEDURES_DEFNORETURN_DO} %1',
    args0: [
      {
        type: 'field_input',
        name: 'NAME',
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
      'get_procedure_def_no_return',
      'procedure_context_menu',
      'procedure_rename',
      'procedure_vars',
    ],
    mutator: 'procedure_def_mutator',
  },
  {
    type: 'procedures_defreturn',
    message0: '%{BKY_PROCEDURES_DEFRETURN_TITLE} %1 %2',
    message1: '%{BKY_PROCEDURES_DEFRETURN_DO} %1',
    message2: '%{BKY_PROCEDURES_DEFRETURN_RETURN} %1',
    args0: [
      {
        type: 'field_input',
        name: 'NAME',
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
      'get_procedure_def_return',
      'procedure_context_menu',
      'procedure_rename',
      'procedure_vars',
    ],
    mutator: 'procedure_def_mutator',
  },
]);

/**
 * Defines the what are essentially info-getters for the procedures_defnoreturn
 * block.
 * @type {{callType_: string, getProcedureDef: (function(): Array)}}
 */
const getDefNoReturn = {
  /**
   * Returns info about this block to be used by the Blockly.Procedures.
   * @returns {Array} An array of info.
   * @this {Blockly.Block}
   */
  getProcedureDef: function () {
    const argNames = this.argData_.map((elem) => elem.model.name);
    return [this.getFieldValue('NAME'), argNames, false];
  },

  /**
   * Used by the context menu to create a caller block.
   * @type {string}
   */
  callType_: 'procedures_callnoreturn',
};

Blockly.Extensions.registerMixin('get_procedure_def_no_return', getDefNoReturn);

/**
 * Defines what are essentially info-getters for the procedures_def_return
 * block.
 * @type {{callType_: string, getProcedureDef: (function(): Array)}}
 */
const getDefReturn = {
  /**
   * Returns info about this block to be used by the Blockly.Procedures.
   * @returns {Array} An array of info.
   * @this {Blockly.Block}
   */
  getProcedureDef: function () {
    const argNames = this.argData_.map((elem) => elem.model.name);
    return [this.getFieldValue('NAME'), argNames, true];
  },
  /**
   * Used by the context menu to create a caller block.
   * @type {string}
   */
  callType_: 'procedures_callreturn',
};

Blockly.Extensions.registerMixin('get_procedure_def_return', getDefReturn);

const procedureContextMenu = {
  /**
   * Adds an option to create a caller block.
   * Adds an option to create a variable getter for each variable included in
   * the procedure definition.
   * @this {Blockly.Block}
   * @param {!Array} options The current options for the context menu.
   */
  customContextMenu: function (options) {
    if (this.isInFlyout) {
      return;
    }

    // Add option to create caller.
    const name = this.getFieldValue('NAME');
    const text = Blockly.Msg['PROCEDURES_CREATE_DO'].replace('%1', name);

    const xml = Blockly.utils.xml.createElement('block');
    xml.setAttribute('type', this.callType_);
    xml.appendChild(this.mutationToDom(true));
    const callback = Blockly.ContextMenu.callbackFactory(this, xml);

    options.push({
      enabled: true,
      text: text,
      callback: callback,
    });

    if (this.isCollapsed()) {
      return;
    }

    // Add options to create getters for each parameter.
    const varModels = this.getVarModels();
    for (const model of varModels) {
      const text = Blockly.Msg['VARIABLES_SET_CREATE_GET'].replace(
        '%1',
        model.name,
      );

      const xml = Blockly.utils.xml.createElement('block');
      xml.setAttribute('type', 'variables_get');
      xml.appendChild(Blockly.Variables.generateVariableFieldDom(model));
      const callback = Blockly.ContextMenu.callbackFactory(this, xml);

      options.push({
        enabled: true,
        text: text,
        callback: callback,
      });
    }
  },
};

Blockly.Extensions.registerMixin(
  'procedure_context_menu',
  procedureContextMenu,
);

const procedureDefMutator = {
  /**
   * Create XML to represent the argument inputs.
   * @param {boolean=} isForCaller If true include the procedure name and
   *     argument IDs. Used by Blockly.Procedures.mutateCallers for
   *     reconnection.
   * @returns {!Element} XML storage element.
   * @this {Blockly.Block}
   */
  mutationToDom: function (isForCaller = false) {
    const container = Blockly.utils.xml.createElement('mutation');
    if (isForCaller) {
      container.setAttribute('name', this.getFieldValue('NAME'));
    }
    this.argData_.forEach((element) => {
      const argument = Blockly.utils.xml.createElement('arg');
      const argModel = element.model;
      argument.setAttribute('name', argModel.name);
      argument.setAttribute('varid', argModel.getId());
      argument.setAttribute('argid', element.argId);
      if (isForCaller) {
        argument.setAttribute('paramid', element.argId);
      }
      container.appendChild(argument);
    });

    // Not used by this block, but necessary if switching back and forth
    // between this mutator UI and the default UI.
    if (!this.hasStatements_) {
      container.setAttribute('statements', 'false');
    }

    return container;
  },

  /**
   * Parse XML to restore the argument inputs.
   * @param {!Element} xmlElement XML storage element.
   * @this {Blockly.Block}
   */
  domToMutation: function (xmlElement) {
    // We have to handle this so that the user doesn't add blocks to the stack,
    // in which case it would be impossible to return to the old mutators.
    this.hasStatements_ = xmlElement.getAttribute('statements') !== 'false';
    if (!this.hasStatements_) {
      this.removeInput('STACK');
    }

    const names = [];
    const varIds = [];
    const argIds = [];
    for (const childNode of xmlElement.childNodes) {
      if (childNode.nodeName.toLowerCase() == 'arg') {
        names.push(childNode.getAttribute('name'));
        varIds.push(
          childNode.getAttribute('varid') || childNode.getAttribute('varId'),
        );
        argIds.push(childNode.getAttribute('argid'));
      }
    }
    this.updateShape_(names, varIds, argIds);
  },

  /**
   * Returns the state of this block as a JSON serializable object.
   * @returns {{params: (!Array<{name: string, id: string}>|undefined),
   *     hasStatements: (boolean|undefined)}} The state of this block, eg the
   *     parameters and statements.
   */
  saveExtraState: function () {
    if (!this.argData_.length && this.hasStatements_) {
      return null;
    }

    const state = Object.create(null);
    if (this.argData_.length) {
      state['params'] = [];
      this.argData_.forEach((arg) => {
        const model = arg.model;
        state['params'].push({
          name: model.name,
          id: model.getId(),
          argId: arg.argId,
        });
      });
    }
    if (!this.hasStatements_) {
      state['hasStatements'] = false;
    }
    return state;
  },

  /**
   * Applies the given state to this block.
   * @param {*} state The state to apply to this block, eg the parameters and
   *     statements.
   */
  loadExtraState: function (state) {
    // We have to handle this so that the user doesn't add blocks to the stack,
    // in which case it would be impossible to return to the old mutators.
    this.hasStatements_ = state['hasStatements'] !== false;
    if (!this.hasStatements_) {
      this.removeInput('STACK');
    }

    const names = [];
    const varIds = [];
    const argIds = [];
    if (state['params']) {
      for (let i = 0; i < state['params'].length; i++) {
        const param = state['params'][i];
        names.push(param['name']);
        varIds.push(param['id']);
        argIds.push(param['argId']);
      }
    }
    this.updateShape_(names, varIds, argIds);
  },

  /**
   * Adds arguments to the block until it matches the targets.
   * @param {!Array<string>} names An array of argument names to display.
   * @param {!Array<string>} varIds An array of variable IDs associated with
   *     those names.
   * @param {!Array<?string>} argIds An array of argument IDs associated with
   *     those names.
   * @this {Blockly.Block}
   * @private
   */
  updateShape_: function (names, varIds, argIds) {
    if (names.length != varIds.length) {
      throw Error('names and varIds must have the same length.');
    }
    // Usually it's more efficient to modify the block, rather than tearing it
    // down and rebuilding (less render calls), but in this case it's easier
    // to just work from scratch.

    // We need to remove args in reverse order so that it doesn't mess up
    // as removeArg_ modifies our array.
    for (let i = this.argData_.length - 1; i >= 0; i--) {
      this.removeArg_(this.argData_[i].argId);
    }
    this.argData_ = [];
    const length = varIds.length;
    for (let i = 0; i < length; i++) {
      this.addArg_(names[i], varIds[i], argIds[i]);
    }
    Blockly.Procedures.mutateCallers(this);
  },

  /**
   * Callback for the plus image. Adds an argument to the block and mutates
   * callers to match.
   */
  plus: function () {
    this.addArg_();
    Blockly.Procedures.mutateCallers(this);
  },

  /**
   * Callback for the minus image. Removes the argument associated with the
   * given argument ID and mutates the callers to match.
   * @param {string} argId The argId of the argument to remove.
   * @this {Blockly.Block}
   */
  minus: function (argId) {
    if (!this.argData_.length) {
      return;
    }
    this.removeArg_(argId);
    Blockly.Procedures.mutateCallers(this);
  },

  /**
   * Adds an argument to the block and updates the block's parallel tracking
   * arrays as appropriate.
   * @param {?string=} name An optional name for the argument.
   * @param {?string=} varId An optional variable ID for the argument.
   * @param {?string=} argId An optional argument ID for the argument
   *     (used to identify the argument across variable merges).
   * @this {Blockly.Block}
   * @private
   */
  addArg_: function (name = null, varId = null, argId = null) {
    if (!this.argData_.length) {
      const withField = new Blockly.FieldLabel(
        Blockly.Msg['PROCEDURES_BEFORE_PARAMS'],
      );
      this.getInput('TOP').appendField(withField, 'WITH');
    }

    const argNames = this.argData_.map((elem) => elem.model.name);
    name =
      name ||
      Blockly.Variables.generateUniqueNameFromOptions(
        Blockly.Procedures.DEFAULT_ARG,
        argNames,
      );
    const variable = Blockly.Variables.getOrCreateVariablePackage(
      this.workspace,
      varId,
      name,
      '',
    );
    argId = argId || Blockly.utils.idGenerator.genUid();

    this.addVarInput_(name, argId);
    if (this.getInput('STACK')) {
      this.moveInputBefore(argId, 'STACK');
    } else {
      this.moveInputBefore(argId, 'RETURN');
    }

    this.argData_.push({
      model: variable,
      argId: argId,
    });
  },

  /**
   * Removes the argument associated with the given argument ID from the block.
   * @param {string} argId An ID used to track arguments on the block.
   * @private
   */
  removeArg_: function (argId) {
    if (this.removeInput(argId, true)) {
      if (this.argData_.length == 1) {
        // Becoming argumentless.
        this.getInput('TOP').removeField('WITH');
      }
      this.argData_ = this.argData_.filter((element) => element.argId != argId);
    }
  },

  /**
   * Appends the actual inputs and fields associated with an argument to the
   * block.
   * @param {string} name The name of the argument.
   * @param {string} argId The UUID of the argument (different from var ID).
   * @this {Blockly.Block}
   * @private
   */
  addVarInput_: function (name, argId) {
    const nameField = new Blockly.FieldTextInput(name, this.validator_);
    nameField.onFinishEditing_ = this.finishEditing_.bind(nameField);
    nameField.varIdsToDelete_ = [];
    nameField.preEditVarModel_ = null;

    this.appendDummyInput(argId)
      .setAlign(Blockly.inputs.Align.RIGHT)
      .appendField(
        createMinusField(Blockly.Msg['ARIA_LABEL_REMOVE_INPUT'], argId),
      )
      .appendField(Blockly.Msg['PROCEDURE_VARIABLE']) // Untranslated!
      .appendField(nameField, argId); // The name of the field is the arg id.
  },

  /**
   * Validates text entered into the argument name field.
   * @param {string} newName The new text entered into the field.
   * @returns {?string} The field's new value.
   * @this {Blockly.FieldTextInput}
   */
  validator_: function (newName) {
    const sourceBlock = this.getSourceBlock();
    const workspace = sourceBlock.workspace;
    const argData = sourceBlock.argData_;
    const argDatum = sourceBlock.argData_.find(
      (element) => element.argId == this.name,
    );
    const currId = argDatum.model.getId();

    // Replace all whitespace with normal spaces, then trim.
    newName = newName.replace(/[\s\xa0]+/g, ' ').trim();
    const caselessName = newName.toLowerCase();

    /**
     * Returns true if the given argDatum is associated with this field, or has
     * a different caseless name than the argDatum associated with this field.
     * @param {{model: Blockly.IVariableModel, argId:string}} argDatum The
     *     argDatum we want to make sure does not conflict with the argDatum
     *     associated with this field.
     * @returns {boolean} True if the given datum does not conflict with the
     *     datum associated with this field.
     * @this {Blockly.FieldTextInput}
     */
    const hasDifName = (argDatum) => {
      // The field name (aka id) is always equal to the arg id.
      return (
        argDatum.argId == this.name ||
        caselessName != argDatum.model.name.toLowerCase()
      );
    };
    /**
     * Returns true if the variable associated with this field is only used
     * by this block, or callers of this procedure.
     * @returns {boolean} True if the variable associated with this field is
     *     only used by this block, or callers of this procedure.
     */
    const varOnlyUsedHere = () => {
      return Blockly.Variables.getVariableUsesById(workspace, currId).every(
        (block) => {
          return (
            block.id == sourceBlock.id ||
            (block.getProcedureCall &&
              block.getProcedureCall() == sourceBlock.getProcedureDef()[0])
          );
        },
      );
    };

    if (!newName || !argData.every(hasDifName)) {
      if (this.preEditVarModel_) {
        argDatum.model = this.preEditVarModel_;
        this.preEditVarModel_ = null;
      }
      Blockly.Procedures.mutateCallers(sourceBlock);
      return null;
    }

    if (!this.varIdsToDelete_.length) {
      this.preEditVarModel_ = argDatum.model;
      if (varOnlyUsedHere()) {
        this.varIdsToDelete_.push(currId);
      }
    }

    // Create new vars instead of renaming the old ones, so users can't
    // accidentally rename/coalesce vars.
    let model = workspace.getVariableMap().getVariable(newName, '');
    if (!model) {
      model = workspace.getVariableMap().createVariable(newName, '');
      this.varIdsToDelete_.push(model.getId());
    } else if (model.name != newName) {
      // Blockly is case-insensitive so we have to update the var instead of
      // creating a new one.
      const variable = workspace
        .getVariableMap()
        .getVariableById(model.getId());
      workspace.getVariableMap().renameVariable(variable, newName);
    }
    if (model.getId() != currId) {
      argDatum.model = model;
    }
    Blockly.Procedures.mutateCallers(sourceBlock);
    return newName;
  },

  /**
   * Removes any unused vars that were created as a result of editing.
   * @param {string} _finalName The final value of the field.
   * @this {Blockly.FieldTextInput}
   */
  finishEditing_: function (_finalName) {
    const source = this.getSourceBlock();
    const argDatum = source.argData_.find(
      (element) => element.argId == this.name,
    );

    const currentVarId = argDatum.model.getId();
    this.varIdsToDelete_.forEach((id) => {
      if (id != currentVarId) {
        source.workspace.deleteVariableById(id);
      }
    });
    this.varIdsToDelete_.length = 0;
    this.preEditVarModel_ = null;
  },
};

/**
 * Initializes some private variables for procedure blocks.
 * @this {Blockly.Block}
 */
const procedureDefHelper = function () {
  /**
   * An array of objects containing data about the args belonging to the
   * procedure definition.
   * @type {!Array<{
   *          model:Blockly.IVariableModel,
   *          argId: string
   *       }>}
   * @private
   */
  this.argData_ = [];
  /**
   * Does this block have a 'STACK' input for statements?
   * @type {boolean}
   * @private
   */
  this.hasStatements_ = true;

  this.getInput('TOP').insertFieldAt(
    0,
    createPlusField(Blockly.Msg['ARIA_LABEL_ADD_INPUT']),
    'PLUS',
  );
};

Blockly.Extensions.registerMutator(
  'procedure_def_mutator',
  procedureDefMutator,
  procedureDefHelper,
);

/**
 * Sets the validator for the procedure's name field.
 * @this {Blockly.Block}
 */
const procedureRename = function () {
  this.getField('NAME').setValidator(Blockly.Procedures.rename);
};

Blockly.Extensions.register('procedure_rename', procedureRename);

/**
 * Defines functions for dealing with variables and renaming variables.
 * @this {Blockly.Block}
 */
const procedureVars = function () {
  // This is a hack to get around the don't-override-builtins check.
  const mixin = {
    /**
     * Return all variables referenced by this block.
     * @returns {!Array.<string>} List of variable names.
     * @this {Blockly.Block}
     */
    getVars: function () {
      return this.argData_.map((elem) => elem.model.name);
    },

    /**
     * Return all variables referenced by this block.
     * @returns {!Array.<!Blockly.IVariableModel>} List of variable models.
     * @this {Blockly.Block}
     */
    getVarModels: function () {
      return this.argData_.map((elem) => elem.model);
    },

    /**
     * Notification that a variable was renamed to the same name as an existing
     * variable. These variables are coalescing into a single variable with the
     * ID of the variable that was already using the name.
     * @param {string} oldId The ID of the variable that was renamed.
     * @param {string} newId The ID of the variable that was already using
     *     the name.
     */
    renameVarById: function (oldId, newId) {
      const argData = this.argData_.find(
        (element) => element.model.getId() == oldId,
      );
      if (!argData) {
        return; // Not on this block.
      }

      const newVar = this.workspace.getVariableMap().getVariableById(newId);
      const newName = newVar.name;
      this.addVarInput_(newName, newId);
      this.moveInputBefore(newId, oldId);
      this.removeInput(oldId);
      argData.model = newVar;
      Blockly.Procedures.mutateCallers(this);
    },

    /**
     * Notification that a variable is renaming but keeping the same ID.  If the
     * variable is in use on this block, rerender to show the new name.
     * @param {!Blockly.IVariableModel} variable The variable being renamed.
     * @package
     * @override
     * @this {Blockly.Block}
     */
    updateVarName: function (variable) {
      const id = variable.getId();
      const argData = this.argData_.find(
        (element) => element.model.getId() == id,
      );
      if (!argData) {
        return; // Not on this block.
      }
      this.setFieldValue(variable.name, argData.argId);
      argData.model = variable;
    },
  };

  this.mixin(mixin, true);
};

Blockly.Extensions.register('procedure_vars', procedureVars);
