/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.libraryBlocks.math

import type {Block} from '../core/block.js';
import {
  createBlockDefinitionsFromJsonArray,
  defineBlocks,
} from '../core/common.js';
import * as Extensions from '../core/extensions.js';
import '../core/field_dropdown.js';
import type {FieldDropdown} from '../core/field_dropdown.js';
import '../core/field_label.js';
import '../core/field_number.js';
import '../core/field_variable.js';
import * as xmlUtils from '../core/utils/xml.js';

/**
 * A dictionary of the block definitions provided by this module.
 */
export const blocks = createBlockDefinitionsFromJsonArray([
  // Block for numeric value.
  {
    'type': 'math_number',
    'message0': '%1',
    'args0': [
      {
        'type': 'field_number',
        'name': 'NUM',
        'value': 0,
      },
    ],
    'output': 'Number',
    'helpUrl': '%{BKY_MATH_NUMBER_HELPURL}',
    'style': 'math_blocks',
    'tooltip': '%{BKY_MATH_NUMBER_TOOLTIP}',
    'extensions': ['parent_tooltip_when_inline'],
  },

  // Block for basic arithmetic operator.
  {
    'type': 'math_arithmetic',
    'message0': '%1 %2 %3',
    'args0': [
      {
        'type': 'input_value',
        'name': 'A',
        'check': 'Number',
      },
      {
        'type': 'field_dropdown',
        'name': 'OP',
        'options': [
          ['%{BKY_MATH_ADDITION_SYMBOL}', 'ADD'],
          ['%{BKY_MATH_SUBTRACTION_SYMBOL}', 'MINUS'],
          ['%{BKY_MATH_MULTIPLICATION_SYMBOL}', 'MULTIPLY'],
          ['%{BKY_MATH_DIVISION_SYMBOL}', 'DIVIDE'],
          ['%{BKY_MATH_POWER_SYMBOL}', 'POWER'],
        ],
      },
      {
        'type': 'input_value',
        'name': 'B',
        'check': 'Number',
      },
    ],
    'inputsInline': true,
    'output': 'Number',
    'style': 'math_blocks',
    'helpUrl': '%{BKY_MATH_ARITHMETIC_HELPURL}',
    'extensions': ['math_op_tooltip'],
  },

  // Block for advanced math operators with single operand.
  {
    'type': 'math_single',
    'message0': '%1 %2',
    'args0': [
      {
        'type': 'field_dropdown',
        'name': 'OP',
        'options': [
          ['%{BKY_MATH_SINGLE_OP_ROOT}', 'ROOT'],
          ['%{BKY_MATH_SINGLE_OP_ABSOLUTE}', 'ABS'],
          ['-', 'NEG'],
          ['ln', 'LN'],
          ['log10', 'LOG10'],
          ['e^', 'EXP'],
          ['10^', 'POW10'],
        ],
      },
      {
        'type': 'input_value',
        'name': 'NUM',
        'check': 'Number',
      },
    ],
    'output': 'Number',
    'style': 'math_blocks',
    'helpUrl': '%{BKY_MATH_SINGLE_HELPURL}',
    'extensions': ['math_op_tooltip'],
  },

  // Block for trigonometry operators.
  {
    'type': 'math_trig',
    'message0': '%1 %2',
    'args0': [
      {
        'type': 'field_dropdown',
        'name': 'OP',
        'options': [
          ['%{BKY_MATH_TRIG_SIN}', 'SIN'],
          ['%{BKY_MATH_TRIG_COS}', 'COS'],
          ['%{BKY_MATH_TRIG_TAN}', 'TAN'],
          ['%{BKY_MATH_TRIG_ASIN}', 'ASIN'],
          ['%{BKY_MATH_TRIG_ACOS}', 'ACOS'],
          ['%{BKY_MATH_TRIG_ATAN}', 'ATAN'],
        ],
      },
      {
        'type': 'input_value',
        'name': 'NUM',
        'check': 'Number',
      },
    ],
    'output': 'Number',
    'style': 'math_blocks',
    'helpUrl': '%{BKY_MATH_TRIG_HELPURL}',
    'extensions': ['math_op_tooltip'],
  },

  // Block for constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  {
    'type': 'math_constant',
    'message0': '%1',
    'args0': [
      {
        'type': 'field_dropdown',
        'name': 'CONSTANT',
        'options': [
          ['\u03c0', 'PI'],
          ['e', 'E'],
          ['\u03c6', 'GOLDEN_RATIO'],
          ['sqrt(2)', 'SQRT2'],
          ['sqrt(\u00bd)', 'SQRT1_2'],
          ['\u221e', 'INFINITY'],
        ],
      },
    ],
    'output': 'Number',
    'style': 'math_blocks',
    'tooltip': '%{BKY_MATH_CONSTANT_TOOLTIP}',
    'helpUrl': '%{BKY_MATH_CONSTANT_HELPURL}',
  },

  // Block for checking if a number is even, odd, prime, whole, positive,
  // negative or if it is divisible by certain number.
  {
    'type': 'math_number_property',
    'message0': '%1 %2',
    'args0': [
      {
        'type': 'input_value',
        'name': 'NUMBER_TO_CHECK',
        'check': 'Number',
      },
      {
        'type': 'field_dropdown',
        'name': 'PROPERTY',
        'options': [
          ['%{BKY_MATH_IS_EVEN}', 'EVEN'],
          ['%{BKY_MATH_IS_ODD}', 'ODD'],
          ['%{BKY_MATH_IS_PRIME}', 'PRIME'],
          ['%{BKY_MATH_IS_WHOLE}', 'WHOLE'],
          ['%{BKY_MATH_IS_POSITIVE}', 'POSITIVE'],
          ['%{BKY_MATH_IS_NEGATIVE}', 'NEGATIVE'],
          ['%{BKY_MATH_IS_DIVISIBLE_BY}', 'DIVISIBLE_BY'],
        ],
      },
    ],
    'inputsInline': true,
    'output': 'Boolean',
    'style': 'math_blocks',
    'tooltip': '%{BKY_MATH_IS_TOOLTIP}',
    'mutator': 'math_is_divisibleby_mutator',
  },

  // Block for adding to a variable in place.
  {
    'type': 'math_change',
    'message0': '%{BKY_MATH_CHANGE_TITLE}',
    'args0': [
      {
        'type': 'field_variable',
        'name': 'VAR',
        'variable': '%{BKY_MATH_CHANGE_TITLE_ITEM}',
      },
      {
        'type': 'input_value',
        'name': 'DELTA',
        'check': 'Number',
      },
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'variable_blocks',
    'helpUrl': '%{BKY_MATH_CHANGE_HELPURL}',
    'extensions': ['math_change_tooltip'],
  },

  // Block for rounding functions.
  {
    'type': 'math_round',
    'message0': '%1 %2',
    'args0': [
      {
        'type': 'field_dropdown',
        'name': 'OP',
        'options': [
          ['%{BKY_MATH_ROUND_OPERATOR_ROUND}', 'ROUND'],
          ['%{BKY_MATH_ROUND_OPERATOR_ROUNDUP}', 'ROUNDUP'],
          ['%{BKY_MATH_ROUND_OPERATOR_ROUNDDOWN}', 'ROUNDDOWN'],
        ],
      },
      {
        'type': 'input_value',
        'name': 'NUM',
        'check': 'Number',
      },
    ],
    'output': 'Number',
    'style': 'math_blocks',
    'helpUrl': '%{BKY_MATH_ROUND_HELPURL}',
    'tooltip': '%{BKY_MATH_ROUND_TOOLTIP}',
  },

  // Block for evaluating a list of numbers to return sum, average, min, max,
  // etc.  Some functions also work on text (min, max, mode, median).
  {
    'type': 'math_on_list',
    'message0': '%1 %2',
    'args0': [
      {
        'type': 'field_dropdown',
        'name': 'OP',
        'options': [
          ['%{BKY_MATH_ONLIST_OPERATOR_SUM}', 'SUM'],
          ['%{BKY_MATH_ONLIST_OPERATOR_MIN}', 'MIN'],
          ['%{BKY_MATH_ONLIST_OPERATOR_MAX}', 'MAX'],
          ['%{BKY_MATH_ONLIST_OPERATOR_AVERAGE}', 'AVERAGE'],
          ['%{BKY_MATH_ONLIST_OPERATOR_MEDIAN}', 'MEDIAN'],
          ['%{BKY_MATH_ONLIST_OPERATOR_MODE}', 'MODE'],
          ['%{BKY_MATH_ONLIST_OPERATOR_STD_DEV}', 'STD_DEV'],
          ['%{BKY_MATH_ONLIST_OPERATOR_RANDOM}', 'RANDOM'],
        ],
      },
      {
        'type': 'input_value',
        'name': 'LIST',
        'check': 'Array',
      },
    ],
    'output': 'Number',
    'style': 'math_blocks',
    'helpUrl': '%{BKY_MATH_ONLIST_HELPURL}',
    'mutator': 'math_modes_of_list_mutator',
    'extensions': ['math_op_tooltip'],
  },

  // Block for remainder of a division.
  {
    'type': 'math_modulo',
    'message0': '%{BKY_MATH_MODULO_TITLE}',
    'args0': [
      {
        'type': 'input_value',
        'name': 'DIVIDEND',
        'check': 'Number',
      },
      {
        'type': 'input_value',
        'name': 'DIVISOR',
        'check': 'Number',
      },
    ],
    'inputsInline': true,
    'output': 'Number',
    'style': 'math_blocks',
    'tooltip': '%{BKY_MATH_MODULO_TOOLTIP}',
    'helpUrl': '%{BKY_MATH_MODULO_HELPURL}',
  },

  // Block for constraining a number between two limits.
  {
    'type': 'math_constrain',
    'message0': '%{BKY_MATH_CONSTRAIN_TITLE}',
    'args0': [
      {
        'type': 'input_value',
        'name': 'VALUE',
        'check': 'Number',
      },
      {
        'type': 'input_value',
        'name': 'LOW',
        'check': 'Number',
      },
      {
        'type': 'input_value',
        'name': 'HIGH',
        'check': 'Number',
      },
    ],
    'inputsInline': true,
    'output': 'Number',
    'style': 'math_blocks',
    'tooltip': '%{BKY_MATH_CONSTRAIN_TOOLTIP}',
    'helpUrl': '%{BKY_MATH_CONSTRAIN_HELPURL}',
  },

  // Block for random integer between [X] and [Y].
  {
    'type': 'math_random_int',
    'message0': '%{BKY_MATH_RANDOM_INT_TITLE}',
    'args0': [
      {
        'type': 'input_value',
        'name': 'FROM',
        'check': 'Number',
      },
      {
        'type': 'input_value',
        'name': 'TO',
        'check': 'Number',
      },
    ],
    'inputsInline': true,
    'output': 'Number',
    'style': 'math_blocks',
    'tooltip': '%{BKY_MATH_RANDOM_INT_TOOLTIP}',
    'helpUrl': '%{BKY_MATH_RANDOM_INT_HELPURL}',
  },

  // Block for random integer between [X] and [Y].
  {
    'type': 'math_random_float',
    'message0': '%{BKY_MATH_RANDOM_FLOAT_TITLE_RANDOM}',
    'output': 'Number',
    'style': 'math_blocks',
    'tooltip': '%{BKY_MATH_RANDOM_FLOAT_TOOLTIP}',
    'helpUrl': '%{BKY_MATH_RANDOM_FLOAT_HELPURL}',
  },

  // Block for calculating atan2 of [X] and [Y].
  {
    'type': 'math_atan2',
    'message0': '%{BKY_MATH_ATAN2_TITLE}',
    'args0': [
      {
        'type': 'input_value',
        'name': 'X',
        'check': 'Number',
      },
      {
        'type': 'input_value',
        'name': 'Y',
        'check': 'Number',
      },
    ],
    'inputsInline': true,
    'output': 'Number',
    'style': 'math_blocks',
    'tooltip': '%{BKY_MATH_ATAN2_TOOLTIP}',
    'helpUrl': '%{BKY_MATH_ATAN2_HELPURL}',
  },
]);

/**
 * Mapping of math block OP value to tooltip message for blocks
 * math_arithmetic, math_simple, math_trig, and math_on_lists.
 *
 * @see {Extensions#buildTooltipForDropdown}
 * @package
 * @readonly
 */
const TOOLTIPS_BY_OP = {
  // math_arithmetic
  'ADD': '%{BKY_MATH_ARITHMETIC_TOOLTIP_ADD}',
  'MINUS': '%{BKY_MATH_ARITHMETIC_TOOLTIP_MINUS}',
  'MULTIPLY': '%{BKY_MATH_ARITHMETIC_TOOLTIP_MULTIPLY}',
  'DIVIDE': '%{BKY_MATH_ARITHMETIC_TOOLTIP_DIVIDE}',
  'POWER': '%{BKY_MATH_ARITHMETIC_TOOLTIP_POWER}',

  // math_simple
  'ROOT': '%{BKY_MATH_SINGLE_TOOLTIP_ROOT}',
  'ABS': '%{BKY_MATH_SINGLE_TOOLTIP_ABS}',
  'NEG': '%{BKY_MATH_SINGLE_TOOLTIP_NEG}',
  'LN': '%{BKY_MATH_SINGLE_TOOLTIP_LN}',
  'LOG10': '%{BKY_MATH_SINGLE_TOOLTIP_LOG10}',
  'EXP': '%{BKY_MATH_SINGLE_TOOLTIP_EXP}',
  'POW10': '%{BKY_MATH_SINGLE_TOOLTIP_POW10}',

  // math_trig
  'SIN': '%{BKY_MATH_TRIG_TOOLTIP_SIN}',
  'COS': '%{BKY_MATH_TRIG_TOOLTIP_COS}',
  'TAN': '%{BKY_MATH_TRIG_TOOLTIP_TAN}',
  'ASIN': '%{BKY_MATH_TRIG_TOOLTIP_ASIN}',
  'ACOS': '%{BKY_MATH_TRIG_TOOLTIP_ACOS}',
  'ATAN': '%{BKY_MATH_TRIG_TOOLTIP_ATAN}',

  // math_on_lists
  'SUM': '%{BKY_MATH_ONLIST_TOOLTIP_SUM}',
  'MIN': '%{BKY_MATH_ONLIST_TOOLTIP_MIN}',
  'MAX': '%{BKY_MATH_ONLIST_TOOLTIP_MAX}',
  'AVERAGE': '%{BKY_MATH_ONLIST_TOOLTIP_AVERAGE}',
  'MEDIAN': '%{BKY_MATH_ONLIST_TOOLTIP_MEDIAN}',
  'MODE': '%{BKY_MATH_ONLIST_TOOLTIP_MODE}',
  'STD_DEV': '%{BKY_MATH_ONLIST_TOOLTIP_STD_DEV}',
  'RANDOM': '%{BKY_MATH_ONLIST_TOOLTIP_RANDOM}',
};

Extensions.register(
  'math_op_tooltip',
  Extensions.buildTooltipForDropdown('OP', TOOLTIPS_BY_OP),
);

/** Type of a block that has IS_DIVISBLEBY_MUTATOR_MIXIN */
type DivisiblebyBlock = Block & DivisiblebyMixin;
interface DivisiblebyMixin extends DivisiblebyMixinType {}
type DivisiblebyMixinType = typeof IS_DIVISIBLEBY_MUTATOR_MIXIN;

/**
 * Mixin for mutator functions in the 'math_is_divisibleby_mutator'
 * extension.
 *
 * @mixin
 * @augments Block
 * @package
 */
const IS_DIVISIBLEBY_MUTATOR_MIXIN = {
  /**
   * Create XML to represent whether the 'divisorInput' should be present.
   * Backwards compatible serialization implementation.
   *
   * @returns XML storage element.
   */
  mutationToDom: function (this: DivisiblebyBlock): Element {
    const container = xmlUtils.createElement('mutation');
    const divisorInput = this.getFieldValue('PROPERTY') === 'DIVISIBLE_BY';
    container.setAttribute('divisor_input', String(divisorInput));
    return container;
  },
  /**
   * Parse XML to restore the 'divisorInput'.
   * Backwards compatible serialization implementation.
   *
   * @param xmlElement XML storage element.
   */
  domToMutation: function (this: DivisiblebyBlock, xmlElement: Element) {
    const divisorInput = xmlElement.getAttribute('divisor_input') === 'true';
    this.updateShape_(divisorInput);
  },

  // This block does not need JSO serialization hooks (saveExtraState and
  // loadExtraState) because the state of this object is already encoded in the
  // dropdown values.
  // XML hooks are kept for backwards compatibility.

  /**
   * Modify this block to have (or not have) an input for 'is divisible by'.
   *
   * @param divisorInput True if this block has a divisor input.
   */
  updateShape_: function (this: DivisiblebyBlock, divisorInput: boolean) {
    // Add or remove a Value Input.
    const inputExists = this.getInput('DIVISOR');
    if (divisorInput) {
      if (!inputExists) {
        this.appendValueInput('DIVISOR').setCheck('Number');
      }
    } else if (inputExists) {
      this.removeInput('DIVISOR');
    }
  },
};

/**
 * 'math_is_divisibleby_mutator' extension to the 'math_property' block that
 * can update the block shape (add/remove divisor input) based on whether
 * property is "divisible by".
 */
const IS_DIVISIBLE_MUTATOR_EXTENSION = function (this: DivisiblebyBlock) {
  this.getField('PROPERTY')!.setValidator(
    /** @param option The selected dropdown option. */
    function (this: FieldDropdown, option: string) {
      const divisorInput = option === 'DIVISIBLE_BY';
      (this.getSourceBlock() as DivisiblebyBlock).updateShape_(divisorInput);
      return undefined; // FieldValidators can't be void.  Use option as-is.
    },
  );
};

Extensions.registerMutator(
  'math_is_divisibleby_mutator',
  IS_DIVISIBLEBY_MUTATOR_MIXIN,
  IS_DIVISIBLE_MUTATOR_EXTENSION,
);

// Update the tooltip of 'math_change' block to reference the variable.
Extensions.register(
  'math_change_tooltip',
  Extensions.buildTooltipWithFieldText('%{BKY_MATH_CHANGE_TOOLTIP}', 'VAR'),
);

/** Type of a block that has LIST_MODES_MUTATOR_MIXIN */
type ListModesBlock = Block & ListModesMixin;
interface ListModesMixin extends ListModesMixinType {}
type ListModesMixinType = typeof LIST_MODES_MUTATOR_MIXIN;

/**
 * Mixin with mutator methods to support alternate output based if the
 * 'math_on_list' block uses the 'MODE' operation.
 */
const LIST_MODES_MUTATOR_MIXIN = {
  /**
   * Modify this block to have the correct output type.
   *
   * @param newOp Either 'MODE' or some op than returns a number.
   */
  updateType_: function (this: ListModesBlock, newOp: string) {
    if (newOp === 'MODE') {
      this.outputConnection!.setCheck('Array');
    } else {
      this.outputConnection!.setCheck('Number');
    }
  },
  /**
   * Create XML to represent the output type.
   * Backwards compatible serialization implementation.
   *
   * @returns XML storage element.
   */
  mutationToDom: function (this: ListModesBlock): Element {
    const container = xmlUtils.createElement('mutation');
    container.setAttribute('op', this.getFieldValue('OP'));
    return container;
  },
  /**
   * Parse XML to restore the output type.
   * Backwards compatible serialization implementation.
   *
   * @param xmlElement XML storage element.
   */
  domToMutation: function (this: ListModesBlock, xmlElement: Element) {
    const op = xmlElement.getAttribute('op');
    if (op === null) throw new TypeError('xmlElement had no op attribute');
    this.updateType_(op);
  },

  // This block does not need JSO serialization hooks (saveExtraState and
  // loadExtraState) because the state of this object is already encoded in the
  // dropdown values.
  // XML hooks are kept for backwards compatibility.
};

/**
 * Extension to 'math_on_list' blocks that allows support of
 * modes operation (outputs a list of numbers).
 */
const LIST_MODES_MUTATOR_EXTENSION = function (this: ListModesBlock) {
  this.getField('OP')!.setValidator(
    function (this: ListModesBlock, newOp: string) {
      this.updateType_(newOp);
      return undefined;
    }.bind(this),
  );
};

Extensions.registerMutator(
  'math_modes_of_list_mutator',
  LIST_MODES_MUTATOR_MIXIN,
  LIST_MODES_MUTATOR_EXTENSION,
);

// Register provided blocks.
defineBlocks(blocks);
