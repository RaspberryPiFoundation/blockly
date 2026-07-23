/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Unit tests for TypedVariableModal.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

const assert = require('assert');
const Blockly = require('blockly');
const sinon = require('sinon');

const {TypedVariableModal} = require('../src/index.js');

suite('TypedVariableModal', function () {
  /**
   * Set up the workspace to test with typed variable modal.
   * @param {string} toolbox The toolbox.
   * @param {Array.<Array.<string>>} types An array holding arrays with the
   *     display name as the first value and the type as the second.
   * @returns {Blockly.WorkspaceSvg} The workspace to use for testing.
   */
  function workspaceSetup(toolbox, types) {
    const options = {};
    const createFlyout = function (workspace) {
      let xmlList = [];
      const button = document.createElement('button');
      button.setAttribute('text', 'Create Typed Variable');
      button.setAttribute('callbackKey', 'CREATE_TYPED_VARIABLE');

      xmlList.push(button);

      const blockList =
        Blockly.VariablesDynamic.flyoutCategoryBlocks(workspace);
      xmlList = xmlList.concat(blockList);
      return xmlList;
    };
    options.toolbox = toolbox;

    const ws = Blockly.inject('blocklyDiv', options);
    ws.registerToolboxCategoryCallback('CREATE_TYPED_VARIABLE', createFlyout);
    return ws;
  }
  /**
   * Create a toolbox to test with.
   * @returns {string} The toolbox.
   */
  function getTestToolbox() {
    const toolbox = `
      <xml>
        <category name="Typed Variables" categorystyle="variable_category"
        custom="CREATE_TYPED_VARIABLE"></category>
      </xml>
    `;
    return toolbox;
  }

  setup(function () {
    this.jsdomCleanup = require('jsdom-global')(
      '<!DOCTYPE html><div id="blocklyDiv"></div>',
    );
    const types = [
      ['Penguin', 'PENGUIN'],
      ['Giraffe', 'GIRAFFE'],
    ];
    this.workspace = workspaceSetup(getTestToolbox(), types);
    this.typedVarModal = new TypedVariableModal(
      this.workspace,
      'CREATE_TYPED_VARIABLE',
      types,
    );
  });

  teardown(function () {
    this.jsdomCleanup();
    sinon.restore();
  });

  suite('init()', function () {
    test('Registers button', function () {
      this.workspace.registerButtonCallback = sinon.fake();
      this.typedVarModal.init();
      sinon.assert.calledOnce(this.workspace.registerButtonCallback);
    });
  });

  suite('show()', function () {
    // TODO(google/blockly#7764): Reenable this unit test once this
    // plugin has been made part of our proposed workspace-based
    // monorepo.
    //
    // This test is failing due to the modal and typed-variable-modal
    // plugins each getting separate copies of Blockly due to updates
    // to dev-tool's webpack.config.js in RaspberryPiFoundation/blockly-samples#2228
    // to support having an exports stanza in Blockly's package.json.
    test.skip('Elements focused', function () {
      this.typedVarModal.init();
      this.typedVarModal.show();
      assert.equal(
        this.typedVarModal.firstFocusableEl_.className,
        'blocklyModalBtn blocklyModalBtnClose',
      );
      assert.equal(
        this.typedVarModal.lastFocusableEl_.className,
        'blocklyModalBtn',
      );
    });
  });

  suite('setLocale()', function () {
    test('Messages added', function () {
      this.typedVarModal.init();
      const messages = {
        TYPED_VAR_MODAL_CONFIRM_BUTTON: 'confirm_test',
        TYPED_VAR_MODAL_VARIABLE_NAME_LABEL: 'variable_label',
      };
      this.typedVarModal.setLocale(messages);

      assert.equal(
        Blockly.Msg['TYPED_VAR_MODAL_CONFIRM_BUTTON'],
        'confirm_test',
      );
    });
  });

  suite('onConfirm_()', function () {
    setup(function () {
      this.alertStub = sinon.stub(Blockly.dialog, 'alert');
      this.typedVarModal.init();
      this.typedVarModal.getSelectedType_ = sinon.fake.returns('Giraffe');
      this.typedVarModal.getDisplayName_ = sinon.fake.returns('Giraffe');
    });
    test('No text', function () {
      this.typedVarModal.getValidInput_ = sinon.fake.returns(null);
      this.typedVarModal.onConfirm_();
      assert(
        this.alertStub.calledWith(
          'Name is not valid. Please choose a different name.',
        ),
      );
    });
    test('Valid name', function () {
      this.typedVarModal.getValidInput_ = sinon.fake.returns('varName');
      this.workspace.getVariableMap().createVariable = sinon.fake();
      this.typedVarModal.onConfirm_();
      assert(this.workspace.getVariableMap().createVariable.calledOnce);
    });
    test('Variable with different type already exists', function () {
      Blockly.Variables.nameUsedWithAnyType = sinon.fake.returns({
        type: 'Penguin',
        name: 'varName',
      });
      this.typedVarModal.getValidInput_ = sinon.fake.returns('varName');
      this.typedVarModal.onConfirm_();
      assert(
        this.alertStub.calledWith(
          "A variable named 'varName' already " +
            "exists for another type: 'Giraffe'.",
        ),
      );
    });
    test('Variable with same type already exits', function () {
      Blockly.Variables.nameUsedWithAnyType = sinon.fake.returns({
        type: 'Giraffe',
        name: 'varName',
      });
      this.typedVarModal.getValidInput_ = sinon.fake.returns('varName');
      this.typedVarModal.onConfirm_();
      assert(
        this.alertStub.calledWith(
          "A variable named 'varName' already " + 'exists.',
        ),
      );
    });
  });

  suite('getDisplayName_()', function () {
    test('Get display name', function () {
      assert.equal(this.typedVarModal.getDisplayName_('GIRAFFE'), 'Giraffe');
    });
    test('No display name', function () {
      assert.equal(this.typedVarModal.getDisplayName_('SOMETHING'), '');
    });
  });

  suite('getValidInput_()', function () {
    setup(function () {
      this.typedVarModal.init();
    });
    test('Using rename variable name', function () {
      this.typedVarModal.variableNameInput_.value =
        Blockly.Msg['RENAME_VARIABLE'];
      assert.equal(this.typedVarModal.getValidInput_(), null);
    });
    test('Using new variable name', function () {
      this.typedVarModal.variableNameInput_.value = 'Create variable...';
      assert.equal(this.typedVarModal.getValidInput_(), null);
    });
    test('Valid variable name', function () {
      this.typedVarModal.variableNameInput_.value = 'varName';
      assert.equal(this.typedVarModal.getValidInput_(), 'varName');
    });
  });

  suite('render', function () {
    setup(function () {
      this.typedVarModal.render();
    });
    test('renderContent_()', function () {
      const htmlDiv = this.typedVarModal.htmlDiv_;
      const modalContent = htmlDiv.querySelector('.blocklyModalContent');
      assert(modalContent.querySelector('.typedModalVariableNameInput'));
      assert(modalContent.querySelector('.typedModalTypes'));
    });
    test('renderFooter_()', function () {
      const htmlDiv = this.typedVarModal.htmlDiv_;
      const modalFooter = htmlDiv.querySelector('.blocklyModalFooter');
      const allBtns = modalFooter.querySelectorAll('.blocklyModalBtn');
      assert(allBtns.length, 2);
    });
  });

  suite('create', function () {
    test('createConfirmBtn_()', function () {
      const btn = this.typedVarModal.createConfirmBtn_();
      assert.equal(btn.className, 'blocklyModalBtn blocklyModalBtnPrimary');
    });
    test('createCancelBtn_()', function () {
      const btn = this.typedVarModal.createCancelBtn_();
      assert.equal(btn.className, 'blocklyModalBtn');
    });
    test('createVariableTypeContainer_()', function () {
      const types = this.typedVarModal.types_;
      const typeList = this.typedVarModal.createVariableTypeContainer_(types);
      assert.equal(
        typeList.querySelectorAll('.typedModalTypes').length,
        types.length,
      );
    });
    test('createVarNameContainer_()', function () {
      const container = this.typedVarModal.createVarNameContainer_();
      const varNameInput = container.querySelector(
        '.typedModalVariableNameInput',
      );
      const varNameLabel = container.querySelector('.typedModalVariableLabel');
      assert.equal(varNameLabel.getAttribute('for'), 'variableInput');
      assert.equal(varNameInput.id, 'variableInput');
    });
  });
});
