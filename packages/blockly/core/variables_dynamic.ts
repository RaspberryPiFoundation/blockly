/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.VariablesDynamic

import {Blocks} from './blocks.js';
import type {FlyoutButton} from './flyout_button.js';
import {Msg} from './msg.js';
import type {FlyoutItemInfo} from './utils/toolbox.js';
import * as xml from './utils/xml.js';
import * as Variables from './variables.js';
import type {Workspace} from './workspace.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * String for use in the "custom" attribute of a category in toolbox XML.
 * This string indicates that the category should be dynamically populated with
 * variable blocks.
 * See also Blockly.Variables.CATEGORY_NAME and
 * Blockly.Procedures.CATEGORY_NAME.
 */
export const CATEGORY_NAME = 'VARIABLE_DYNAMIC';

/**
 * Click handler for a button that creates String variables.
 *
 * @param button
 */
function stringButtonClickHandler(button: FlyoutButton) {
  Variables.createVariableButtonHandler(
    button.getTargetWorkspace(),
    undefined,
    'String',
  );
}
// eslint-disable-next-line camelcase
export const onCreateVariableButtonClick_String = stringButtonClickHandler;

/**
 * Click handler for a button that creates Number variables.
 *
 * @param button
 */
function numberButtonClickHandler(button: FlyoutButton) {
  Variables.createVariableButtonHandler(
    button.getTargetWorkspace(),
    undefined,
    'Number',
  );
}
// eslint-disable-next-line camelcase
export const onCreateVariableButtonClick_Number = numberButtonClickHandler;

/**
 * Click handler for a button that creates Colour variables.
 *
 * @param button
 */
function colourButtonClickHandler(button: FlyoutButton) {
  Variables.createVariableButtonHandler(
    button.getTargetWorkspace(),
    undefined,
    'Colour',
  );
}
// eslint-disable-next-line camelcase
export const onCreateVariableButtonClick_Colour = colourButtonClickHandler;

/**
 * Construct the elements (blocks and button) required by the flyout for the
 * dynamic variables category.
 *
 * @returns List of flyout contents as JSON.
 */
export function flyoutCategory(workspace: WorkspaceSvg): FlyoutItemInfo[] {
  if (!Blocks['variables_set_dynamic'] && !Blocks['variables_get_dynamic']) {
    console.warn(
      'There are no dynamic variable blocks, but there is a dynamic variable category.',
    );
  }

  workspace.registerButtonCallback(
    'CREATE_VARIABLE_STRING',
    stringButtonClickHandler,
  );
  workspace.registerButtonCallback(
    'CREATE_VARIABLE_NUMBER',
    numberButtonClickHandler,
  );
  workspace.registerButtonCallback(
    'CREATE_VARIABLE_COLOUR',
    colourButtonClickHandler,
  );

  return [
    {
      'kind': 'button',
      'text': Msg['NEW_STRING_VARIABLE'],
      'callbackkey': 'CREATE_VARIABLE_STRING',
    },
    {
      'kind': 'button',
      'text': Msg['NEW_NUMBER_VARIABLE'],
      'callbackkey': 'CREATE_VARIABLE_NUMBER',
    },
    {
      'kind': 'button',
      'text': Msg['NEW_COLOUR_VARIABLE'],
      'callbackkey': 'CREATE_VARIABLE_COLOUR',
    },
    ...Variables.jsonFlyoutCategoryBlocks(
      workspace,
      workspace.getVariableMap().getAllVariables(),
      false,
      'variables_get_dynamic',
      'variables_set_dynamic',
    ),
  ];
}

/**
 * Construct the blocks required by the flyout for the variable category.
 *
 * @param workspace The workspace containing variables.
 * @returns Array of XML block elements.
 */
export function flyoutCategoryBlocks(workspace: Workspace): Element[] {
  const variableModelList = workspace.getVariableMap().getAllVariables();

  const xmlList = [];
  if (variableModelList.length > 0) {
    if (Blocks['variables_set_dynamic']) {
      const firstVariable = variableModelList[variableModelList.length - 1];
      const block = xml.createElement('block');
      block.setAttribute('type', 'variables_set_dynamic');
      block.setAttribute('gap', '24');
      block.appendChild(Variables.generateVariableFieldDom(firstVariable));
      xmlList.push(block);
    }
    if (Blocks['variables_get_dynamic']) {
      variableModelList.sort(Variables.compareByName);
      for (let i = 0, variable; (variable = variableModelList[i]); i++) {
        const block = xml.createElement('block');
        block.setAttribute('type', 'variables_get_dynamic');
        block.setAttribute('gap', '8');
        block.appendChild(Variables.generateVariableFieldDom(variable));
        xmlList.push(block);
      }
    }
  }
  return xmlList;
}
