/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from '#core/blockly.js';

/**
 * Registers a block with no content.
 */
export function defineEmptyBlock(name = 'empty_block') {
  Blockly.defineBlocksWithJsonArray([
    {
      'type': name,
      'message0': '',
    },
  ]);
}

/**
 * Registers an empty block with previous and next connections.
 */
export function defineStackBlock(name = 'stack_block') {
  Blockly.defineBlocksWithJsonArray([
    {
      'type': name,
      'message0': '',
      'previousStatement': null,
      'nextStatement': null,
    },
  ]);
}

/**
 * Registers a block with one input and an output connection.
 */
export function defineRowBlock(name = 'row_block') {
  Blockly.defineBlocksWithJsonArray([
    {
      'type': name,
      'message0': '%1',
      'args0': [
        {
          'type': 'input_value',
          'name': 'INPUT',
        },
      ],
      'output': null,
    },
  ]);
}

/**
 * Registers a block with an output connection and a next connection.
 */
export function defineRowToStackBlock(name = 'row_to_stack_block') {
  Blockly.defineBlocksWithJsonArray([
    {
      'type': name,
      'message0': '',
      'output': null,
      'nextStatement': null,
    },
  ]);
}

/**
 * Registers a block with a next, previous and statement input connections.
 */
export function defineStatementBlock(name = 'statement_block') {
  Blockly.defineBlocksWithJsonArray([
    {
      'type': name,
      'message0': '%1',
      'args0': [
        {
          'type': 'input_statement',
          'name': 'NAME',
        },
      ],
      'previousStatement': null,
      'nextStatement': null,
      'colour': 230,
      'tooltip': '',
      'helpUrl': '',
    },
  ]);
}

/**
 * Registers a value block with a field and output connection.
 */
export function defineBasicBlockWithField(name = 'test_field_block') {
  Blockly.defineBlocksWithJsonArray([
    {
      'type': name,
      'message0': '%1',
      'args0': [
        {
          'type': 'field_input',
          'name': 'NAME',
        },
      ],
      'output': null,
    },
  ]);
}

type MutatorBlock = Blockly.Block & {
  hasInput: boolean;
  updateShape: () => void;
};

/**
 * Registers blocks that support mutations.
 */
export function defineMutatorBlocks() {
  Blockly.defineBlocksWithJsonArray([
    {
      'type': 'xml_block',
      'mutator': 'xml_mutator',
    },
    {
      'type': 'jso_block',
      'mutator': 'jso_mutator',
    },
    {
      'type': 'checkbox_block',
      'message0': '%1',
      'args0': [
        {
          'type': 'field_checkbox',
          'name': 'CHECK',
        },
      ],
    },
  ]);

  const xmlMutator = {
    hasInput: false,

    mutationToDom: function (this: MutatorBlock) {
      const mutation = Blockly.utils.xml.createElement('mutation');
      mutation.setAttribute('hasInput', `${this.hasInput}`);
      return mutation;
    },

    domToMutation: function (this: MutatorBlock, mutation: Element) {
      this.hasInput = mutation.getAttribute('hasInput') == 'true';
      this.updateShape();
    },

    decompose: function (workspace: Blockly.WorkspaceSvg) {
      const topBlock = workspace.newBlock('checkbox_block', 'check_block');
      topBlock.initSvg();
      topBlock.render();
      return topBlock;
    },

    compose: function (this: MutatorBlock, topBlock: Blockly.Block) {
      this.hasInput = topBlock.getFieldValue('CHECK') == 'TRUE';
      this.updateShape();
    },

    updateShape: function (this: MutatorBlock) {
      if (this.hasInput && !this.getInput('INPUT')) {
        this.appendValueInput('INPUT');
      } else if (!this.hasInput && this.getInput('INPUT')) {
        this.removeInput('INPUT');
      }
    },
  };
  Blockly.Extensions.registerMutator('xml_mutator', xmlMutator);

  const jsoMutator = {
    hasInput: false,

    saveExtraState: function () {
      return {hasInput: this.hasInput};
    },

    loadExtraState: function (this: MutatorBlock, state: {hasInput?: boolean}) {
      this.hasInput = state.hasInput || false;
      this.updateShape();
    },

    decompose: function (workspace: Blockly.WorkspaceSvg) {
      const topBlock = workspace.newBlock('checkbox_block', 'check_block');
      topBlock.initSvg();
      topBlock.render();
      return topBlock;
    },

    compose: function (this: MutatorBlock, topBlock: Blockly.Block) {
      this.hasInput = topBlock.getFieldValue('CHECK') == 'TRUE';
      this.updateShape();
    },

    updateShape: function (this: MutatorBlock) {
      if (this.hasInput && !this.getInput('INPUT')) {
        this.appendValueInput('INPUT');
      } else if (!this.hasInput && this.getInput('INPUT')) {
        this.removeInput('INPUT');
      }
    },
  };
  Blockly.Extensions.registerMutator('jso_mutator', jsoMutator);
}

/**
 * Creates a mock of a block. New code should use real blocks instead.
 */
export function createTestBlock() {
  return {
    'id': 'test',
    'rendered': false,
    'workspace': {
      'rendered': false,
    },
    'isShadow': function () {
      return false;
    },
    'renameVarById': Blockly.Block.prototype.renameVarById,
    'updateVarName': Blockly.Block.prototype.updateVarName,
    'isDeadOrDying': () => false,
  };
}

/**
 * Initializes and renders a block of the given type on the given workspace.
 *
 * @param workspaceSvg The workspace to create the block on.
 * @param type The type of block to create.
 * @returns The newly created block.
 */
export function createRenderedBlock(
  workspaceSvg: Blockly.WorkspaceSvg,
  type: string,
) {
  const block = workspaceSvg.newBlock(type) as Blockly.BlockSvg;
  block.initSvg();
  block.render();
  return block;
}
