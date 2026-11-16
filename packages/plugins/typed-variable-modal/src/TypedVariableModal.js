/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Class responsible for creating a modal used for creating typed
 *     variables.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

import * as Blockly from 'blockly/core';
import {Modal} from '@blockly/plugin-modal';

/**
 * Class for displaying a modal used for creating typed variables.
 */
export class TypedVariableModal extends Modal {
  /**
   * Constructor for creating a typed variable modal.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace that the modal will
   *     be registered on.
   * @param {string} btnCallbackName The name used to register the button
   *     callback.
   * @param {Array<Array<string>>} types An array holding arrays with the
   *     display name as the first value and the type as the second.
   *     Ex: [['Penguin', 'PENGUIN'], ['Giraffe', 'GIRAFFE']].
   * @param {TypedVarModalMessages} optMessages The messages for a typed
   *     variable modal.
   */
  constructor(workspace, btnCallbackName, types, optMessages) {
    const title =
      (optMessages && optMessages['TYPED_VAR_MODAL_TITLE']) ||
      'Create Typed Variable';
    super(title, workspace);

    /**
     * The id of the currently selected type.
     * @type {?string}
     * @private
     */
    this.selectedType_ = null;

    /**
     * The input div holding the name of the variable.
     * @type {HTMLInputElement}
     * @protected
     */
    this.variableNameInput_ = null;

    /**
     * The div holding the list of variable types.
     * @type {HTMLElement}
     * @protected
     */
    this.variableTypesDiv_ = null;

    /**
     * The first type input.
     * @type {HTMLInputElement}
     * @protected
     */
    this.firstTypeInput_ = null;

    /**
     * The name used to register the button callback.
     * @type {string}
     * @private
     */
    this.btnCallBackName_ = btnCallbackName;

    /**
     * An array holding arrays with the name of the type and the display name
     *     for the type. Ex: [['Penguin', 'PENGUIN'], ['Giraffe', 'GIRAFFE']].
     * @type {Array<Array<string>>}
     * @protected
     */
    this.types_ = types;

    const messages = {
      TYPED_VAR_MODAL_TITLE: 'Create Typed Variable',
      TYPED_VAR_MODAL_VARIABLE_NAME_LABEL: 'Variable Name: ',
      TYPED_VAR_MODAL_TYPES_LABEL: 'Variable Types',
      TYPED_VAR_MODAL_CONFIRM_BUTTON: 'Ok',
      TYPED_VAR_MODAL_CANCEL_BUTTON: 'Cancel',
      TYPED_VAR_MODAL_INVALID_NAME:
        'Name is not valid. Please choose a different name.',
    };

    Object.assign(messages, optMessages);

    this.setLocale(messages);

    /**
     * If true close the modal when the user clicks outside the modal.
     * Otherwise, only close when user hits the 'X' button or escape.
     * @type {boolean}
     * @override
     */
    this.shouldCloseOnOverlayClick = false;
  }

  /**
   * The messages for a typed variable modal.
   * @typedef {{
   *     TYPED_VAR_MODAL_CONFIRM_BUTTON: string,
   *     TYPED_VAR_MODAL_VARIABLE_NAME_LABEL: string,
   *     TYPED_VAR_MODAL_TYPES_LABEL: string,
   *     TYPED_VAR_MODAL_TITLE: string,
   *     TYPED_VAR_MODAL_INVALID_NAME: string,
   *     TYPED_VAR_MODAL_CANCEL_BUTTON: string
   * }} TypedVarModalMessages
   */

  /**
   * Create a typed variable modal and display it on the given button name.
   */
  init() {
    super.init();
    this.workspace_.registerButtonCallback(this.btnCallBackName_, () => {
      this.show();
    });
  }

  /**
   * Set the messages for the typed variable modal.
   * Used to change the location.
   * @param {!TypedVarModalMessages} messages The messages needed to create a
   *     typed modal.
   */
  setLocale(messages) {
    Object.keys(messages).forEach((k) => {
      Blockly.Msg[k] = messages[k];
    });
  }

  /**
   * Dispose of the typed variable modal.
   * @override
   */
  dispose() {
    super.dispose();
    this.workspace_.removeButtonCallback(this.btnCallBackName_);
  }

  /**
   * Get the selected type.
   * @returns {?string} The selected type.
   * @protected
   */
  getSelectedType_() {
    return this.selectedType_;
  }

  /**
   * Disposes of any events or dom-references belonging to the editor and resets
   * the inputs.
   * @override
   */
  widgetDispose_() {
    super.widgetDispose_();
    this.resetModalInputs_();
  }

  /**
   * Get the function to be called when the user tries to create a variable.
   * @protected
   */
  onConfirm_() {
    const text = this.getValidInput_();
    const type = this.getSelectedType_() || '';
    if (text) {
      const existing = Blockly.Variables.nameUsedWithAnyType(
        text,
        this.workspace_,
      );
      if (existing) {
        let msg;
        if (existing.type === type) {
          msg = Blockly.Msg['VARIABLE_ALREADY_EXISTS'].replace(
            '%1',
            existing.name,
          );
        } else {
          msg = Blockly.Msg['VARIABLE_ALREADY_EXISTS_FOR_ANOTHER_TYPE'];
          msg = msg
            .replace('%1', existing.name)
            .replace('%2', this.getDisplayName_(existing.type));
        }
        Blockly.dialog.alert(msg);
      } else {
        // No conflict
        this.workspace_.getVariableMap().createVariable(text, type);
        this.hide();
      }
    } else {
      Blockly.dialog.alert(Blockly.Msg['TYPED_VAR_MODAL_INVALID_NAME']);
    }
  }

  /**
   * Get the display name for the given type.
   * @param {string} type The type to get the display name for.
   * @returns {string} The display name for the type.
   * @private
   */
  getDisplayName_(type) {
    for (let i = 0; i < this.types_.length; i++) {
      const typeNames = this.types_[i];
      if (type === typeNames[1]) {
        return typeNames[0];
      }
    }
    return '';
  }

  /**
   * Get the valid variable name, or null if the name is not valid.
   * @returns {string} The valid variable name, or null if the name exists.
   * @private
   */
  getValidInput_() {
    let newVar = this.variableNameInput_.value;
    if (newVar) {
      newVar = newVar.replace(/[\s\xa0]+/g, ' ').trim();
      if (
        newVar === Blockly.Msg['RENAME_VARIABLE'] ||
        newVar === Blockly.Msg['NEW_VARIABLE']
      ) {
        // Ok, not ALL names are legal...
        newVar = null;
      }
    }
    return newVar;
  }

  /**
   * Render content for the modal content div.
   * @param {HTMLDivElement} contentContainer The modal's content div.
   * @override
   */
  renderContent_(contentContainer) {
    const varNameContainer = this.createVarNameContainer_();
    this.variableNameInput_ = varNameContainer.querySelector(
      '.typedModalVariableNameInput',
    );

    const typedVarDiv = document.createElement('div');
    typedVarDiv.className = 'typedModalTypes';
    typedVarDiv.textContent = Blockly.Msg['TYPED_VAR_MODAL_TYPES_LABEL'];

    this.variableTypesDiv_ = this.createVariableTypeContainer_(this.types_);
    this.resetModalInputs_();
    typedVarDiv.appendChild(this.variableTypesDiv_);
    contentContainer.appendChild(varNameContainer);
    contentContainer.appendChild(typedVarDiv);
  }

  /**
   * Render content for the modal footer.
   * @param {HTMLElement} footerContainer The modal's footer div.
   * @override
   */
  renderFooter_(footerContainer) {
    footerContainer.appendChild(this.createConfirmBtn_());
    footerContainer.appendChild(this.createCancelBtn_());
  }

  /**
   * Create button in charge of creating the variable.
   * @returns {!HTMLButtonElement} The button in charge of creating a variable.
   * @protected
   */
  createConfirmBtn_() {
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'blocklyModalBtn blocklyModalBtnPrimary';
    confirmBtn.textContent = Blockly.Msg['TYPED_VAR_MODAL_CONFIRM_BUTTON'];
    this.addEvent_(confirmBtn, 'click', this, this.onConfirm_);
    return confirmBtn;
  }

  /**
   * Create button in charge of cancelling.
   * @returns {!HTMLButtonElement} The button in charge of cancelling.
   * @protected
   */
  createCancelBtn_() {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'blocklyModalBtn';
    cancelBtn.textContent = Blockly.Msg['TYPED_VAR_MODAL_CANCEL_BUTTON'];
    this.addEvent_(cancelBtn, 'click', this, this.onCancel_);
    return cancelBtn;
  }

  /**
   * Check the first type in the list.
   * @protected
   */
  resetModalInputs_() {
    this.firstTypeInput_.checked = true;
    this.selectedType_ = this.firstTypeInput_.id;
    this.variableNameInput_.value = '';
  }

  /**
   * Creates an unordered list containing all the types.
   * @param {Array<Array<string>>} types An array holding arrays with the
   *     display name as the first value and the type as the second.
   *     Ex: [['Penguin', 'PENGUIN'], ['Giraffe', 'GIRAFFE']].
   * @returns {HTMLElement} The list of types.
   * @protected
   */
  createVariableTypeContainer_(types) {
    const typeList = document.createElement('ul');
    typeList.className = 'typedModalList';
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const typeDisplayName = type[0];
      const typeName = type[1];
      const typeLi = document.createElement('li');
      const typeInput = document.createElement('input');
      typeInput.className = 'typedModalTypes';
      typeInput.type = 'radio';
      typeInput.id = typeName;
      typeInput.name = 'blocklyVariableType';
      this.addEvent_(typeInput, 'click', this, (e) => {
        this.selectedType_ = e.target.id;
      });
      this.firstTypeInput_ = typeList.querySelector('.typedModalTypes');
      const typeLabel = document.createElement('label');
      typeLabel.textContent = typeDisplayName;
      typeLabel.setAttribute('for', typeName);

      typeLi.appendChild(typeInput);
      typeLi.appendChild(typeLabel);
      typeList.appendChild(typeLi);
    }
    return typeList;
  }

  /**
   * Create the div that holds the text input and label for the variable name
   * input.
   * @returns {HTMLDivElement} The div holding the text input and label for text
   *     input.
   * @protected
   */
  createVarNameContainer_() {
    const varNameContainer = document.createElement('div');
    varNameContainer.className = 'typedModalVariableInputContainer';

    const varNameLabel = document.createElement('label');
    varNameLabel.className = 'typedModalVariableLabel';
    varNameLabel.textContent =
      Blockly.Msg['TYPED_VAR_MODAL_VARIABLE_NAME_LABEL'];
    varNameLabel.setAttribute('for', 'variableInput');

    const varNameInput = document.createElement('input');
    varNameInput.className = 'typedModalVariableNameInput';
    varNameInput.type = 'text';
    varNameInput.id = 'variableInput';

    varNameContainer.appendChild(varNameLabel);
    varNameContainer.appendChild(varNameInput);
    return varNameContainer;
  }
}

Blockly.Css.register(`
.typedModalTitle {
  font-weight: bold;
  font-size: 1em;
}
.typedModalVariableInputContainer {
  margin: 1em 0 1em 0;
}
.typedModalVariableLabel{
  margin-right: 0.5em;
}
.typedModalTypes ul{
  display: flex;
  flex-wrap: wrap;
  list-style-type: none;
  padding: 0;
}
.typedModalTypes li {
  margin-right: 1em;
  display: flex;
}
`);
