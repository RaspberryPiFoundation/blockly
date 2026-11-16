/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import * as Blockly from 'blockly/core';
import './blocks';

/**
 * The Serialization category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Serialization',
  contents: [
    {
      kind: 'BUTTON',
      text: 'add blocks to workspace',
      callbackkey: 'addAllBlocksToWorkspace',
    },
    {
      kind: 'SEP',
      gap: '8',
    },
    {
      kind: 'BUTTON',
      text: 'randomize text',
      callbackkey: 'randomizeText',
    },
    {
      kind: 'BLOCK',
      type: 'test_field_serialization_no_overrides',
    },
    {
      kind: 'BLOCK',
      type: 'test_field_serialization_xml',
    },
    {
      kind: 'BLOCK',
      type: 'test_field_serialization_jso',
    },
    {
      kind: 'BLOCK',
      type: 'test_field_serialization_both',
    },
    {
      kind: 'SEP',
      gap: 30,
    },
    {
      kind: 'BLOCK',
      blockxml:
        '<block type="test_extra_state_xml">' +
        '<mutation items="2"></mutation>' +
        '</block>',
    },
    {
      kind: 'BLOCK',
      type: 'test_extra_state_jso',
      extraState: {
        itemCount: 2,
      },
    },
    {
      kind: 'BLOCK',
      type: 'test_extra_state_both',
      extraState: {
        itemCount: 2,
      },
    },
    {
      kind: 'SEP',
      gap: 30,
    },
    {
      kind: 'BLOCK',
      type: 'text_print',
      inputs: {
        TEXT: {
          shadow: {
            type: 'test_field_serialization_no_overrides',
          },
        },
      },
    },
    {
      kind: 'BLOCK',
      type: 'text_print',
      inputs: {
        TEXT: {
          shadow: {
            type: 'test_field_serialization_xml',
          },
        },
      },
    },
    {
      kind: 'BLOCK',
      type: 'text_print',
      inputs: {
        TEXT: {
          shadow: {
            type: 'test_field_serialization_jso',
          },
        },
      },
    },
    {
      kind: 'BLOCK',
      type: 'text_print',
      inputs: {
        TEXT: {
          shadow: {
            type: 'test_field_serialization_both',
          },
        },
      },
    },
    {
      kind: 'SEP',
      gap: 30,
    },
    {
      kind: 'BLOCK',
      blockxml:
        '<block type="text_print">' +
        '<value name="TEXT">' +
        '<shadow type="test_extra_state_xml">' +
        '<mutation items="2"></mutation>' +
        '</shadow>' +
        '</value>' +
        '</block>',
    },
    {
      kind: 'BLOCK',
      type: 'text_print',
      inputs: {
        TEXT: {
          shadow: {
            type: 'test_extra_state_jso',
            extraState: {
              itemCount: 2,
            },
          },
        },
      },
    },
    {
      kind: 'BLOCK',
      type: 'text_print',
      inputs: {
        TEXT: {
          shadow: {
            type: 'test_extra_state_both',
            extraState: {
              itemCount: 2,
            },
          },
        },
      },
    },
  ],
};

/**
 * Initialize this toolbox category.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function onInit(workspace) {
  const randomizeText = function (button) {
    const targetWorkspace = button.getTargetWorkspace();
    const blocks = [
      ...targetWorkspace.getBlocksByType(
        'test_field_serialization_no_overrides',
      ),
      ...targetWorkspace.getBlocksByType('test_field_serialization_xml'),
      ...targetWorkspace.getBlocksByType('test_field_serialization_jso'),
      ...targetWorkspace.getBlocksByType('test_field_serialization_both'),
    ];
    const possible = 'ABCDEF';
    for (let i = 0, block; (block = blocks[i]); i++) {
      let text = '';
      for (let j = 0; j < 4; j++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      block.setFieldValue(text, 'LABEL');
    }
  };
  workspace.registerButtonCallback('randomizeText', randomizeText);
}
