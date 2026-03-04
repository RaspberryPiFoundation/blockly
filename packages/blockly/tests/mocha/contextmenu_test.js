/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {callbackFactory} from '../../build/src/core/contextmenu.js';
import * as xmlUtils from '../../build/src/core/utils/xml.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Context Menu', function () {
  setup(function () {
    sharedTestSetup.call(this);

    // Creates a WorkspaceSVG
    const toolbox = document.getElementById('toolbox-categories');
    this.workspace = Blockly.inject('blocklyDiv', {toolbox: toolbox});
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Callback Factory', function () {
    setup(function () {
      this.forLoopBlock = this.workspace.newBlock('controls_for');
    });

    test('callback with xml state creates block', function () {
      const variable = this.forLoopBlock.getField('VAR').getVariable();
      const xmlField = document.createElement('field');
      xmlField.setAttribute('name', 'VAR');
      xmlField.setAttribute('id', variable.getId());
      xmlField.setAttribute('variabletype', variable.getType());
      xmlField.textContent = variable.getName();

      const xmlBlock = xmlUtils.createElement('block');
      xmlBlock.setAttribute('type', 'variables_get');
      xmlBlock.appendChild(xmlField);

      const callback = callbackFactory(this.forLoopBlock, xmlBlock);
      const getVarBlock = callback();

      assert.equal(getVarBlock.type, 'variables_get');
      assert.equal(getVarBlock.workspace, this.forLoopBlock.workspace);
      assert.equal(
        getVarBlock.getField('VAR').getVariable().getId(),
        this.forLoopBlock.getField('VAR').getVariable().getId(),
      );
    });

    test('callback with json state creates block', function () {
      const jsonState = {
        type: 'variables_get',
        fields: {VAR: this.forLoopBlock.getField('VAR').saveState(true)},
      };

      const callback = callbackFactory(this.forLoopBlock, jsonState);
      const getVarBlock = callback();

      assert.equal(getVarBlock.type, 'variables_get');
      assert.equal(getVarBlock.workspace, this.forLoopBlock.workspace);
      assert.equal(
        getVarBlock.getField('VAR').getVariable().getId(),
        this.forLoopBlock.getField('VAR').getVariable().getId(),
      );
    });
  });

  suite('getMenu', function () {
    test('returns null when context menu is not shown', function () {
      assert.isNull(Blockly.ContextMenu.getMenu());
    });

    test('returns Menu instance when context menu is shown', function () {
      const e = new PointerEvent('pointerdown', {clientX: 10, clientY: 10});
      const menuOptions = [
        {text: 'Test option', enabled: true, callback: function () {}},
      ];
      Blockly.ContextMenu.show(e, menuOptions, false, this.workspace);

      const menu = Blockly.ContextMenu.getMenu();
      assert.instanceOf(menu, Blockly.Menu, 'getMenu() should return a Menu');
      assert.include(menu.getElement().textContent, 'Test option');

      Blockly.ContextMenu.hide();
      assert.isNull(Blockly.ContextMenu.getMenu());
    });
  });
});
