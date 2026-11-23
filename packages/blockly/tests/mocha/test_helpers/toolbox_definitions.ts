/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from '#core/blockly.js';
import {DEFAULT_INJECT_OPTIONS} from './setup_teardown.js';

/**
 * Get JSON for a toolbox that contains categories.
 *
 * @return The array holding information for a toolbox.
 */
export function getCategoryJSON() {
  return {
    'contents': [
      {
        'kind': 'CATEGORY',
        'cssconfig': {
          'container': 'something',
        },
        'contents': [
          {
            'kind': 'BLOCK',
            'blockxml':
              '<block type="basic_block"><field name="TEXT">FirstCategory-FirstBlock</field></block>',
          },
          {
            'kind': 'BLOCK',
            'blockxml':
              '<block type="basic_block"><field name="TEXT">FirstCategory-SecondBlock</field></block>',
          },
        ],
        'name': 'First',
      },
      {
        'kind': 'CATEGORY',
        'contents': [
          {
            'kind': 'BLOCK',
            'blockxml':
              '<block type="basic_block"><field name="TEXT">SecondCategory-FirstBlock</field></block>',
          },
        ],
        'name': 'Second',
      },
    ],
  };
}

/**
 * Get JSON for a simple toolbox that uses a `blockxml` field in the JSON.
 *
 * @return The array holding information for a simple toolbox.
 */
export function getSimpleJson() {
  return {
    'contents': [
      {
        'kind': 'BLOCK',
        'blockxml': `<block type="logic_compare">
          <field name="OP">NEQ</field>
          <value name="A">
            <shadow type="math_number">
              <field name="NUM">1</field>
            </shadow>
          </value>
          <value name="B">
            <block type="math_number">
              <field name="NUM">2</field>
            </block>
          </value>
        </block>`,
      },
      {
        'kind': 'SEP',
        'gap': '20',
      },
      {
        'kind': 'BUTTON',
        'text': 'insert',
        'callbackkey': 'insertConnectionRows',
      },
      {
        'kind': 'LABEL',
        'text': 'tooltips',
      },
    ],
  };
}

/**
 * Get JSON for a simple toolbox using a pure-JSON definition.
 *
 * @return A toolbox definition.
 */
export function getProperSimpleJson() {
  return {
    'contents': [
      {
        'kind': 'BLOCK',
        'type': 'logic_compare',
        'fields': {
          'OP': 'NEQ',
        },
        'inputs': {
          'A': {
            'shadow': {
              'type': 'math_number',
              'fields': {
                'NUM': 1,
              },
            },
          },
          'B': {
            'block': {
              'type': 'math_number',
              'fields': {
                'NUM': 2,
              },
            },
          },
        },
      },
      {
        'kind': 'SEP',
        'gap': '20',
      },
      {
        'kind': 'BUTTON',
        'text': 'insert',
        'callbackkey': 'insertConnectionRows',
      },
      {
        'kind': 'LABEL',
        'text': 'tooltips',
      },
    ],
  };
}

/**
 * Get JSON for a toolbox that contains categories that contain categories.
 *
 * @return The array holding information for a toolbox.
 */
export function getDeeplyNestedJSON() {
  return {
    'contents': [
      {
        'kind': 'CATEGORY',
        'cssconfig': {
          'container': 'something',
        },
        'contents': [
          {
            'kind': 'CATEGORY',
            'contents': [
              {
                'kind': 'CATEGORY',
                'contents': [
                  {
                    'kind': 'BLOCK',
                    'blockxml':
                      '<block type="basic_block"><field name="TEXT">NestedCategory-FirstBlock</field></block>',
                  },
                  {
                    'kind': 'BLOCK',
                    'blockxml':
                      '<block type="basic_block"><field name="TEXT">NestedCategory-SecondBlock</field></block>',
                  },
                ],
                'name': 'NestedCategoryInner',
              },
            ],
            'name': 'NestedCategoryMiddle',
          },
        ],
        'name': 'NestedCategoryOuter',
      },
      {
        'kind': 'CATEGORY',
        'contents': [
          {
            'kind': 'BLOCK',
            'blockxml':
              '<block type="basic_block"><field name="TEXT">SecondCategory-FirstBlock</field></block>',
          },
        ],
        'name': 'Second',
      },
    ],
  };
}

/**
 * Get an array filled with xml elements.
 *
 * @return Array holding xml elements for a toolbox.
 */
export function getXmlArray() {
  const block = Blockly.utils.xml.textToDom(
    `<block type="logic_compare">
        <field name="OP">NEQ</field>
        <value name="A">
          <shadow type="math_number">
            <field name="NUM">1</field>
          </shadow>
        </value>
        <value name="B">
          <block type="math_number">
            <field name="NUM">2</field>
          </block>
        </value>
      </block>`,
  );
  const separator = Blockly.utils.xml.textToDom('<sep gap="20"></sep>');
  const button = Blockly.utils.xml.textToDom(
    '<button text="insert" callbackkey="insertConnectionRows"></button>',
  );
  const label = Blockly.utils.xml.textToDom('<label text="tooltips"></label>');
  return [block, separator, button, label];
}

/**
 * Injects a Blockly workspace and returns its toolbox.
 */
export function getInjectedToolbox() {
  /**
   * Category: First
   *   sep
   *   basic_block
   *   basic_block
   * Category: second
   *   basic_block
   * Category: Variables
   *   custom: VARIABLE
   * Category: NestedCategory
   *   Category: NestedItemOne
   */
  const toolboxXml = document.getElementById('toolbox-test') ?? undefined;
  const workspace = Blockly.inject('blocklyDiv', {
    ...DEFAULT_INJECT_OPTIONS,
    toolbox: toolboxXml,
  });
  return workspace.getToolbox();
}

/**
 * Returns a jankily-constructed toolbox. New tests should not use this.
 */
export function getBasicToolbox() {
  const workspace = new Blockly.WorkspaceSvg(new Blockly.Options({}));
  const toolbox = new Blockly.Toolbox(workspace);
  toolbox.HtmlDiv = document.createElement('div');
  return toolbox;
}

/**
 * Returns the first collapsible item of the given toolbox.
 */
export function getCollapsibleItem(toolbox: Blockly.Toolbox) {
  const contents = toolbox.getToolboxItems();
  for (const item of contents) {
    if (item.isCollapsible()) {
      return item;
    }
  }
}

/**
 * Returns the first non-collapsible item of the given toolbox.
 */
export function getNonCollapsibleItem(toolbox: Blockly.Toolbox) {
  const contents = toolbox.getToolboxItems();
  for (const item of contents) {
    if (!item.isCollapsible()) {
      return item;
    }
  }
}

/**
 * Returns the toolbox item with ID `nestedCategory` of the given toolbox.
 */
export function getChildItem(toolbox: Blockly.Toolbox) {
  return toolbox.getToolboxItemById('nestedCategory');
}

/**
 * Returns the toolbox item with ID `separator` of the given toolbox.
 */
export function getSeparator(toolbox: Blockly.Toolbox) {
  return toolbox.getToolboxItemById('separator');
}
