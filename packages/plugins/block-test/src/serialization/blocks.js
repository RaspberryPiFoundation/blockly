// @ts-nocheck
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

import * as Blockly from 'blockly/core';
import './fields';

Blockly.defineBlocksWithJsonArray([
  {
    type: 'test_field_serialization_no_overrides',
    message0: 'no overrides: %1',
    args0: [
      {
        type: 'field_no_overrides',
        name: 'LABEL',
        text: 'test',
      },
    ],
    colour: 0,
    output: null,
  },
  {
    type: 'test_field_serialization_xml',
    message0: 'xml: %1',
    args0: [
      {
        type: 'field_xml',
        name: 'LABEL',
        text: 'test',
      },
    ],
    colour: 30,
    output: null,
  },
  {
    type: 'test_field_serialization_jso',
    message0: 'jso: %1',
    args0: [
      {
        type: 'field_jso',
        name: 'LABEL',
        text: 'test',
      },
    ],
    colour: 90,
    output: null,
  },
  {
    type: 'test_field_serialization_both',
    message0: 'both: %1',
    args0: [
      {
        type: 'field_both',
        name: 'LABEL',
        text: 'test',
      },
    ],
    colour: 150,
    output: null,
  },
]);

Blockly.Blocks['test_extra_state_xml'] = Object.assign(
  {},
  Blockly.Blocks['lists_create_with'],
);
delete Blockly.Blocks['test_extra_state_xml'].saveExtraState;
delete Blockly.Blocks['test_extra_state_xml'].loadExtraState;
Blockly.Blocks['test_extra_state_xml'].init = function () {
  this.setColour(30);
  this.itemCount_ = 3;
  this.updateShape_();
  this.setOutput(true, 'Array');
  this.setMutator(
    new Blockly.icons.MutatorIcon(['lists_create_with_item'], this),
  );
};

Blockly.Blocks['test_extra_state_jso'] = Object.assign(
  {},
  Blockly.Blocks['lists_create_with'],
);
delete Blockly.Blocks['test_extra_state_jso'].mutationToDom;
delete Blockly.Blocks['test_extra_state_jso'].domToMutation;
Blockly.Blocks['test_extra_state_jso'].init = function () {
  this.setColour(90);
  this.itemCount_ = 3;
  this.updateShape_();
  this.setOutput(true, 'Array');
  this.setMutator(
    new Blockly.icons.MutatorIcon(['lists_create_with_item'], this),
  );
};

Blockly.Blocks['test_extra_state_both'] = Object.assign(
  {},
  Blockly.Blocks['lists_create_with'],
);
Blockly.Blocks['test_extra_state_both'].init = function () {
  this.setColour(150);
  this.itemCount_ = 3;
  this.updateShape_();
  this.setOutput(true, 'Array');
  this.setMutator(
    new Blockly.icons.MutatorIcon(['lists_create_with_item'], this),
  );
};
