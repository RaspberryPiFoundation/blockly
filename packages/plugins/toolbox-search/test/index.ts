/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import * as Blockly from 'blockly';
import {createPlayground} from '@blockly/dev-tools';
import '../src/toolbox_search';

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
  workspace.getVariableMap().createVariable('alpha');
  workspace.getVariableMap().createVariable('beta');
  return workspace;
}

const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Logic',
      categorystyle: 'logic_category',
      contents: [
        {kind: 'block', type: 'controls_if'},
        {kind: 'block', type: 'logic_compare', fields: {OP: 'EQ'}},
        {kind: 'block', type: 'logic_operation', fields: {OP: 'AND'}},
        {kind: 'block', type: 'logic_negate'},
        {kind: 'block', type: 'logic_boolean', fields: {BOOL: 'TRUE'}},
      ],
    },
    {
      kind: 'category',
      name: 'Loops',
      categorystyle: 'loop_category',
      contents: [
        {
          kind: 'block',
          type: 'controls_repeat_ext',
          inputs: {TIMES: {shadow: {type: 'math_number', fields: {NUM: 250}}}},
        },
        {kind: 'block', type: 'controls_whileUntil', fields: {MODE: 'WHILE'}},
        {kind: 'block', type: 'controls_forEach'},
        {
          kind: 'block',
          type: 'controls_flow_statements',
          fields: {FLOW: 'BREAK'},
        },
      ],
    },
    {
      kind: 'category',
      name: 'Math',
      categorystyle: 'math_category',
      contents: [
        {kind: 'block', type: 'math_number', fields: {NUM: 42}},
        {
          kind: 'block',
          type: 'math_arithmetic',
          fields: {OP: 'ADD'},
          inputs: {
            A: {shadow: {type: 'math_number', fields: {NUM: 1}}},
            B: {shadow: {type: 'math_number', fields: {NUM: 1}}},
          },
        },
        {
          kind: 'block',
          type: 'math_round',
          fields: {OP: 'ROUND'},
          inputs: {NUM: {shadow: {type: 'math_number', fields: {NUM: 3.1}}}},
        },
        {
          kind: 'block',
          type: 'math_modulo',
          inputs: {
            DIVIDEND: {shadow: {type: 'math_number', fields: {NUM: 64}}},
            DIVISOR: {shadow: {type: 'math_number', fields: {NUM: 10}}},
          },
        },
      ],
    },
    {
      kind: 'category',
      name: 'Text',
      categorystyle: 'text_category',
      contents: [
        {kind: 'block', type: 'text', fields: {TEXT: 'abracadabra'}},
        {
          kind: 'block',
          type: 'text_print',
          inputs: {
            TEXT: {shadow: {type: 'text', fields: {TEXT: 'hello world'}}},
          },
        },
        {kind: 'block', type: 'text_join'},
        {
          kind: 'block',
          type: 'text_length',
          inputs: {VALUE: {shadow: {type: 'text', fields: {TEXT: 'abc'}}}},
        },
        {
          kind: 'block',
          type: 'text_changeCase',
          fields: {CASE: 'UPPERCASE'},
          inputs: {TEXT: {shadow: {type: 'text', fields: {TEXT: 'abc'}}}},
        },
        {
          kind: 'block',
          type: 'text_append',
          inputs: {TEXT: {shadow: {type: 'text', fields: {TEXT: '!'}}}},
        },
      ],
    },
    {
      kind: 'category',
      name: 'Lists',
      categorystyle: 'list_category',
      contents: [
        {kind: 'block', type: 'lists_create_with'},
        {
          kind: 'block',
          type: 'lists_sort',
          fields: {TYPE: 'NUMERIC', DIRECTION: '1'},
        },
        {
          kind: 'block',
          type: 'lists_split',
          fields: {MODE: 'SPLIT'},
          inputs: {DELIM: {shadow: {type: 'text', fields: {TEXT: ','}}}},
        },
        {
          kind: 'block',
          type: 'lists_getIndex',
          fields: {MODE: 'GET', WHERE: 'FROM_START'},
        },
        {
          kind: 'block',
          type: 'lists_getSublist',
          fields: {WHERE1: 'FROM_START', WHERE2: 'FROM_START'},
        },
      ],
    },
    {kind: 'sep'},
    {
      kind: 'category',
      name: 'Variables',
      categorystyle: 'variable_category',
      custom: 'VARIABLE',
    },
    {
      kind: 'category',
      name: 'Functions',
      categorystyle: 'procedure_category',
      custom: 'PROCEDURE',
    },
    {kind: 'sep'},
    {
      kind: 'category',
      name: 'Snippets',
      categorystyle: 'logic_category',
      contents: [
        {
          kind: 'block',
          type: 'text_print',
          inputs: {TEXT: {block: {type: 'variables_get'}}},
        },
        {
          kind: 'block',
          type: 'controls_if',
          inputs: {
            IF0: {
              block: {
                type: 'logic_compare',
                fields: {OP: 'GT'},
                inputs: {
                  A: {block: {type: 'variables_get'}},
                  B: {shadow: {type: 'math_number', fields: {NUM: 100}}},
                },
              },
            },
          },
        },
      ],
    },
    {kind: 'search', name: 'Search', contents: []},
  ],
};

document.addEventListener('DOMContentLoaded', function () {
  const defaultOptions: Blockly.BlocklyOptions = {
    toolbox,
  };

  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element is missing');
  }

  createPlayground(root, createWorkspace, defaultOptions);
});
