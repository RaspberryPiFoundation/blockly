/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export function defineEmptyBlock(name = 'empty_block') {
  Blockly.defineBlocksWithJsonArray([
    {
      'type': name,
      'message0': '',
    },
  ]);
}

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

    mutationToDom: function () {
      const mutation = Blockly.utils.xml.createElement('mutation');
      mutation.setAttribute('hasInput', this.hasInput);
      return mutation;
    },

    domToMutation: function (mutation) {
      this.hasInput = mutation.getAttribute('hasInput') == 'true';
      this.updateShape();
    },

    decompose: function (workspace) {
      const topBlock = workspace.newBlock('checkbox_block', 'check_block');
      topBlock.initSvg();
      topBlock.render();
      return topBlock;
    },

    compose: function (topBlock) {
      this.hasInput = topBlock.getFieldValue('CHECK') == 'TRUE';
      this.updateShape();
    },

    updateShape: function () {
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

    loadExtraState: function (state) {
      this.hasInput = state.hasInput || false;
      this.updateShape();
    },

    decompose: function (workspace) {
      const topBlock = workspace.newBlock('checkbox_block', 'check_block');
      topBlock.initSvg();
      topBlock.render();
      return topBlock;
    },

    compose: function (topBlock) {
      this.hasInput = topBlock.getFieldValue('CHECK') == 'TRUE';
      this.updateShape();
    },

    updateShape: function () {
      if (this.hasInput && !this.getInput('INPUT')) {
        this.appendValueInput('INPUT');
      } else if (!this.hasInput && this.getInput('INPUT')) {
        this.removeInput('INPUT');
      }
    },
  };
  Blockly.Extensions.registerMutator('jso_mutator', jsoMutator);
}

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

export function createRenderedBlock(workspaceSvg, type) {
  const block = workspaceSvg.newBlock(type);
  block.initSvg();
  block.render();
  return block;
}
