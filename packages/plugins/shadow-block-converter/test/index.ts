/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Shadow block conversion test playground.
 */

import * as Blockly from 'blockly';
import {createPlayground} from '@blockly/dev-tools';
import {shadowBlockConversionChangeListener} from '../src/index';

const toolbox: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'flyoutToolbox',
  contents: [
    {
      kind: 'block',
      type: 'text_reverse',
      inputs: {
        TEXT: {
          shadow: {type: 'text', fields: {TEXT: 'abc'}},
          block: undefined,
        },
      },
    },
    {
      kind: 'block',
      type: 'text_print',
      inputs: {
        TEXT: {
          shadow: {type: 'text', fields: {TEXT: 'Example Text 1'}},
          block: undefined,
        },
      },
      next: {
        shadow: {
          type: 'text_print',
          inputs: {
            TEXT: {
              shadow: {type: 'text', fields: {TEXT: 'Example Text 2'}},
              block: undefined,
            },
          },
        },
        block: undefined,
      },
    },
    {
      kind: 'block',
      type: 'text',
    },
    {
      kind: 'block',
      type: 'controls_if',
      inputs: {
        IF0: {shadow: {type: 'logic_boolean'}, block: undefined},
        DO0: {
          shadow: {
            type: 'controls_ifelse',
            inputs: {
              IF0: {shadow: {type: 'logic_boolean'}, block: undefined},
              DO0: {shadow: {type: 'controls_if'}, block: undefined},
              ELSE: {
                shadow: {
                  type: 'controls_if',
                  inputs: {
                    IF0: {
                      shadow: {type: 'logic_boolean'},
                      block: undefined,
                    },
                  },
                },
                block: undefined,
              },
            },
            next: {
              shadow: {
                type: 'controls_if',
                inputs: {
                  IF0: {
                    shadow: {type: 'logic_boolean'},
                    block: undefined,
                  },
                },
              },
              block: undefined,
            },
          },
          block: undefined,
        },
      },
    },
    {
      kind: 'block',
      type: 'logic_boolean',
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
  workspace.addChangeListener(shadowBlockConversionChangeListener);
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
