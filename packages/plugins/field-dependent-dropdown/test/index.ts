/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Dependent dropdown field test playground.
 */

import * as Blockly from 'blockly';
import {createPlayground} from '@blockly/dev-tools';
import './field_dependent_dropdown_test_block';

const toolbox: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'flyoutToolbox',
  contents: [
    {
      kind: 'block',
      type: 'dependent_dropdown_test',
      fields: {
        /* eslint-disable @typescript-eslint/naming-convention */
        PARENT_FIELD: 'b',
        CHILD_FIELD: 'b2',
        GRANDCHILD_FIELD: 'b21',
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    },
    {
      kind: 'block',
      type: 'dependent_dropdown_default_options_test',
    },
    {
      kind: 'block',
      type: 'dependent_dropdown_validation_test',
    },
  ],
};

/**
 * Create a workspace.
 *
 * @param blocklyDiv The blockly container div.
 * @param options The Blockly options.
 * @returns The created workspace.
 */
function createWorkspace(
  blocklyDiv: HTMLElement,
  options: Blockly.BlocklyOptions,
): Blockly.WorkspaceSvg {
  const workspace = Blockly.inject(blocklyDiv, options);
  return workspace;
}

document.addEventListener('DOMContentLoaded', function () {
  const defaultOptions: Blockly.BlocklyOptions = {
    toolbox,
  };
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createPlayground(rootElement, createWorkspace, defaultOptions);
  }
});
