/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.libraryBlocks.texts

import type {Block} from '../core/block.js';
import type {BlockSvg} from '../core/block_svg.js';
import {
  createBlockDefinitionsFromJsonArray,
  defineBlocks,
} from '../core/common.js';
import {Connection} from '../core/connection.js';
import * as Extensions from '../core/extensions.js';
import {FieldDropdown} from '../core/field_dropdown.js';
import {FieldImage} from '../core/field_image.js';
import * as fieldRegistry from '../core/field_registry.js';
import {FieldTextInput} from '../core/field_textinput.js';
import '../core/field_variable.js';
import {MutatorIcon} from '../core/icons/mutator_icon.js';
import {Align} from '../core/inputs/align.js';
import {ValueInput} from '../core/inputs/value_input.js';
import {Msg} from '../core/msg.js';
import * as xmlUtils from '../core/utils/xml.js';
import type {Workspace} from '../core/workspace.js';

/**
 * A dictionary of the block definitions provided by this module.
 */
export const blocks = createBlockDefinitionsFromJsonArray([
  // Block for text value
  {
    'type': 'text',
    'message0': '%1',
    'args0': [
      {
        'type': 'field_input',
        'name': 'TEXT',
        'text': '',
      },
    ],
    'output': 'String',
    'style': 'text_blocks',
    'helpUrl': '%{BKY_TEXT_TEXT_HELPURL}',
    'tooltip': '%{BKY_TEXT_TEXT_TOOLTIP}',
    'extensions': ['text_quotes', 'parent_tooltip_when_inline'],
  },
  {
    'type': 'text_join',
    'message0': '',
    'output': 'String',
    'style': 'text_blocks',
    'helpUrl': '%{BKY_TEXT_JOIN_HELPURL}',
    'tooltip': '%{BKY_TEXT_JOIN_TOOLTIP}',
    'mutator': 'text_join_mutator',
  },
  {
    'type': 'text_create_join_container',
    'message0': '%{BKY_TEXT_CREATE_JOIN_TITLE_JOIN} %1 %2',
    'args0': [
      {
        'type': 'input_dummy',
      },
      {
        'type': 'input_statement',
        'name': 'STACK',
      },
    ],
    'style': 'text_blocks',
    'tooltip': '%{BKY_TEXT_CREATE_JOIN_TOOLTIP}',
    'enableContextMenu': false,
  },
  {
    'type': 'text_create_join_item',
    'message0': '%{BKY_TEXT_CREATE_JOIN_ITEM_TITLE_ITEM}',
    'previousStatement': null,
    'nextStatement': null,
    'style': 'text_blocks',
    'tooltip': '%{BKY_TEXT_CREATE_JOIN_ITEM_TOOLTIP}',
    'enableContextMenu': false,
  },
  {
    'type': 'text_append',
    'message0': '%{BKY_TEXT_APPEND_TITLE}',
    'args0': [
      {
        'type': 'field_variable',
        'name': 'VAR',
        'variable': '%{BKY_TEXT_APPEND_VARIABLE}',
      },
      {
        'type': 'input_value',
        'name': 'TEXT',
      },
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'text_blocks',
    'extensions': ['text_append_tooltip'],
  },
  {
    'type': 'text_length',
    'message0': '%{BKY_TEXT_LENGTH_TITLE}',
    'args0': [
      {
        'type': 'input_value',
        'name': 'VALUE',
        'check': ['String', 'Array'],
      },
    ],
    'output': 'Number',
    'style': 'text_blocks',
    'tooltip': '%{BKY_TEXT_LENGTH_TOOLTIP}',
    'helpUrl': '%{BKY_TEXT_LENGTH_HELPURL}',
  },
  {
    'type': 'text_isEmpty',
    'message0': '%{BKY_TEXT_ISEMPTY_TITLE}',
    'args0': [
      {
        'type': 'input_value',
        'name': 'VALUE',
        'check': ['String', 'Array'],
      },
    ],
    'output': 'Boolean',
    'style': 'text_blocks',
    'tooltip': '%{BKY_TEXT_ISEMPTY_TOOLTIP}',
    'helpUrl': '%{BKY_TEXT_ISEMPTY_HELPURL}',
  },
  {
    'type': 'text_indexOf',
    'message0': '%{BKY_TEXT_INDEXOF_TITLE}',
    'args0': [
      {
        'type': 'input_value',
        'name': 'VALUE',
        'check': 'String',
      },
      {
        'type': 'field_dropdown',
        'name': 'END',
        'options': [
          ['%{BKY_TEXT_INDEXOF_OPERATOR_FIRST}', 'FIRST'],
          ['%{BKY_TEXT_INDEXOF_OPERATOR_LAST}', 'LAST'],
        ],
      },
      {
        'type': 'input_value',
        'name': 'FIND',
        'check': 'String',
      },
    ],
    'output': 'Number',
    'style': 'text_blocks',
    'helpUrl': '%{BKY_TEXT_INDEXOF_HELPURL}',
    'inputsInline': true,
    'extensions': ['text_indexOf_tooltip'],
  },
  {
    'type': 'text_charAt',
    'message0': '%{BKY_TEXT_CHARAT_TITLE}', // "in text %1 %2"
    'args0': [
      {
        'type': 'input_value',
        'name': 'VALUE',
        'check': 'String',
      },
      {
        'type': 'field_dropdown',
        'name': 'WHERE',
        'options': [
          ['%{BKY_TEXT_CHARAT_FROM_START}', 'FROM_START'],
          ['%{BKY_TEXT_CHARAT_FROM_END}', 'FROM_END'],
          ['%{BKY_TEXT_CHARAT_FIRST}', 'FIRST'],
          ['%{BKY_TEXT_CHARAT_LAST}', 'LAST'],
          ['%{BKY_TEXT_CHARAT_RANDOM}', 'RANDOM'],
        ],
      },
    ],
    'output': 'String',
    'style': 'text_blocks',
    'helpUrl': '%{BKY_TEXT_CHARAT_HELPURL}',
    'inputsInline': true,
    'mutator': 'text_charAt_mutator',
  },
]);

/** Type of a 'text_get_substring' block. */
type GetSubstringBlock = Block & GetSubstringMixin;
interface GetSubstringMixin extends GetSubstringType {
  WHERE_OPTIONS_1: Array<[string, string]>;
  WHERE_OPTIONS_2: Array<[string, string]>;
}
type GetSubstringType = typeof GET_SUBSTRING_BLOCK;

const GET_SUBSTRING_BLOCK = {
  /**
   * Block for getting substring.
   */
  init: function (this: GetSubstringBlock) {
    this['WHERE_OPTIONS_1'] = [
      [Msg['TEXT_GET_SUBSTRING_START_FROM_START'], 'FROM_START'],
      [Msg['TEXT_GET_SUBSTRING_START_FROM_END'], 'FROM_END'],
      [Msg['TEXT_GET_SUBSTRING_START_FIRST'], 'FIRST'],
    ];
    this['WHERE_OPTIONS_2'] = [
      [Msg['TEXT_GET_SUBSTRING_END_FROM_START'], 'FROM_START'],
      [Msg['TEXT_GET_SUBSTRING_END_FROM_END'], 'FROM_END'],
      [Msg['TEXT_GET_SUBSTRING_END_LAST'], 'LAST'],
    ];
    this.setHelpUrl(Msg['TEXT_GET_SUBSTRING_HELPURL']);
    this.setStyle('text_blocks');
    this.appendValueInput('STRING')
      .setCheck('String')
      .appendField(Msg['TEXT_GET_SUBSTRING_INPUT_IN_TEXT']);
    const createMenu = (n: 1 | 2): FieldDropdown => {
      const menu = fieldRegistry.fromJson({
        type: 'field_dropdown',
        options:
          this[('WHERE_OPTIONS_' + n) as 'WHERE_OPTIONS_1' | 'WHERE_OPTIONS_2'],
      }) as FieldDropdown;
      menu.setValidator(
        /** @param value The input value. */
        function (this: FieldDropdown, value: any): null | undefined {
          const oldValue: string | null = this.getValue();
          const oldAt = oldValue === 'FROM_START' || oldValue === 'FROM_END';
          const newAt = value === 'FROM_START' || value === 'FROM_END';
          if (newAt !== oldAt) {
            const block = this.getSourceBlock() as GetSubstringBlock;
            block.updateAt_(n, newAt);
          }
          return undefined;
        },
      );
      return menu;
    };
    this.appendDummyInput('WHERE1_INPUT').appendField(createMenu(1), 'WHERE1');
    this.appendDummyInput('AT1');
    this.appendDummyInput('WHERE2_INPUT').appendField(createMenu(2), 'WHERE2');
    this.appendDummyInput('AT2');
    if (Msg['TEXT_GET_SUBSTRING_TAIL']) {
      this.appendDummyInput('TAIL').appendField(Msg['TEXT_GET_SUBSTRING_TAIL']);
    }
    this.setInputsInline(true);
    this.setOutput(true, 'String');
    this.updateAt_(1, true);
    this.updateAt_(2, true);
    this.setTooltip(Msg['TEXT_GET_SUBSTRING_TOOLTIP']);
  },
  /**
   * Create XML to represent whether there are 'AT' inputs.
   * Backwards compatible serialization implementation.
   *
   * @returns XML storage element.
   */
  mutationToDom: function (this: GetSubstringBlock): Element {
    const container = xmlUtils.createElement('mutation');
    const isAt1 = this.getInput('AT1') instanceof ValueInput;
    container.setAttribute('at1', `${isAt1}`);
    const isAt2 = this.getInput('AT2') instanceof ValueInput;
    container.setAttribute('at2', `${isAt2}`);
    return container;
  },
  /**
   * Parse XML to restore the 'AT' inputs.
   * Backwards compatible serialization implementation.
   *
   * @param xmlElement XML storage element.
   */
  domToMutation: function (this: GetSubstringBlock, xmlElement: Element) {
    const isAt1 = xmlElement.getAttribute('at1') === 'true';
    const isAt2 = xmlElement.getAttribute('at2') === 'true';
    this.updateAt_(1, isAt1);
    this.updateAt_(2, isAt2);
  },

  // This block does not need JSO serialization hooks (saveExtraState and
  // loadExtraState) because the state of this object is already encoded in the
  // dropdown values.
  // XML hooks are kept for backwards compatibility.

  /**
   * Create or delete an input for a numeric index.
   * This block has two such inputs, independent of each other.
   *
   * @internal
   * @param n Which input to modify (either 1 or 2).
   * @param isAt True if the input includes a value connection, false otherwise.
   */
  updateAt_: function (this: GetSubstringBlock, n: 1 | 2, isAt: boolean) {
    // Create or delete an input for the numeric index.
    // Destroy old 'AT' and 'ORDINAL' inputs.
    this.removeInput('AT' + n);
    this.removeInput('ORDINAL' + n, true);
    // Create either a value 'AT' input or a dummy input.
    if (isAt) {
      this.appendValueInput('AT' + n).setCheck('Number');
      if (Msg['ORDINAL_NUMBER_SUFFIX']) {
        this.appendDummyInput('ORDINAL' + n).appendField(
          Msg['ORDINAL_NUMBER_SUFFIX'],
        );
      }
    } else {
      this.appendDummyInput('AT' + n);
    }
    // Move tail, if present, to end of block.
    if (n === 2 && Msg['TEXT_GET_SUBSTRING_TAIL']) {
      this.removeInput('TAIL', true);
      this.appendDummyInput('TAIL').appendField(Msg['TEXT_GET_SUBSTRING_TAIL']);
    }
    if (n === 1) {
      this.moveInputBefore('AT1', 'WHERE2_INPUT');
      if (this.getInput('ORDINAL1')) {
        this.moveInputBefore('ORDINAL1', 'WHERE2_INPUT');
      }
    }
  },
};

blocks['text_getSubstring'] = GET_SUBSTRING_BLOCK;

blocks['text_changeCase'] = {
  /**
   * Block for changing capitalization.
   */
  init: function (this: Block) {
    const OPERATORS = [
      [Msg['TEXT_CHANGECASE_OPERATOR_UPPERCASE'], 'UPPERCASE'],
      [Msg['TEXT_CHANGECASE_OPERATOR_LOWERCASE'], 'LOWERCASE'],
      [Msg['TEXT_CHANGECASE_OPERATOR_TITLECASE'], 'TITLECASE'],
    ];
    this.setHelpUrl(Msg['TEXT_CHANGECASE_HELPURL']);
    this.setStyle('text_blocks');
    this.appendValueInput('TEXT')
      .setCheck('String')
      .appendField(
        fieldRegistry.fromJson({
          type: 'field_dropdown',
          options: OPERATORS,
        }) as FieldDropdown,
        'CASE',
      );
    this.setOutput(true, 'String');
    this.setTooltip(Msg['TEXT_CHANGECASE_TOOLTIP']);
  },
};

blocks['text_trim'] = {
  /**
   * Block for trimming spaces.
   */
  init: function (this: Block) {
    const OPERATORS = [
      [Msg['TEXT_TRIM_OPERATOR_BOTH'], 'BOTH'],
      [Msg['TEXT_TRIM_OPERATOR_LEFT'], 'LEFT'],
      [Msg['TEXT_TRIM_OPERATOR_RIGHT'], 'RIGHT'],
    ];
    this.setHelpUrl(Msg['TEXT_TRIM_HELPURL']);
    this.setStyle('text_blocks');
    this.appendValueInput('TEXT')
      .setCheck('String')
      .appendField(
        fieldRegistry.fromJson({
          type: 'field_dropdown',
          options: OPERATORS,
        }) as FieldDropdown,
        'MODE',
      );
    this.setOutput(true, 'String');
    this.setTooltip(Msg['TEXT_TRIM_TOOLTIP']);
  },
};

blocks['text_print'] = {
  /**
   * Block for print statement.
   */
  init: function (this: Block) {
    this.jsonInit({
      'message0': Msg['TEXT_PRINT_TITLE'],
      'args0': [
        {
          'type': 'input_value',
          'name': 'TEXT',
        },
      ],
      'previousStatement': null,
      'nextStatement': null,
      'style': 'text_blocks',
      'tooltip': Msg['TEXT_PRINT_TOOLTIP'],
      'helpUrl': Msg['TEXT_PRINT_HELPURL'],
    });
  },
};

type PromptCommonBlock = Block & PromptCommonMixin;
interface PromptCommonMixin extends PromptCommonType {}
type PromptCommonType = typeof PROMPT_COMMON;

/**
 * Common properties for the text_prompt_ext and text_prompt blocks
 * definitions.
 */
const PROMPT_COMMON = {
  /**
   * Modify this block to have the correct output type.
   *
   * @internal
   * @param newOp The new output type. Should be either 'TEXT' or 'NUMBER'.
   */
  updateType_: function (this: PromptCommonBlock, newOp: string) {
    this.outputConnection!.setCheck(newOp === 'NUMBER' ? 'Number' : 'String');
  },
  /**
   * Create XML to represent the output type.
   * Backwards compatible serialization implementation.
   *
   * @returns XML storage element.
   */
  mutationToDom: function (this: PromptCommonBlock): Element {
    const container = xmlUtils.createElement('mutation');
    container.setAttribute('type', this.getFieldValue('TYPE'));
    return container;
  },
  /**
   * Parse XML to restore the output type.
   * Backwards compatible serialization implementation.
   *
   * @param xmlElement XML storage element.
   */
  domToMutation: function (this: PromptCommonBlock, xmlElement: Element) {
    this.updateType_(xmlElement.getAttribute('type')!);
  },

  // These blocks do not need JSO serialization hooks (saveExtraState
  // and loadExtraState) because the state of this object is already
  // encoded in the dropdown values.
  // XML hooks are kept for backwards compatibility.
};

blocks['text_prompt_ext'] = {
  ...PROMPT_COMMON,
  /**
   * Block for prompt function (external message).
   */
  init: function (this: PromptCommonBlock) {
    const TYPES = [
      [Msg['TEXT_PROMPT_TYPE_TEXT'], 'TEXT'],
      [Msg['TEXT_PROMPT_TYPE_NUMBER'], 'NUMBER'],
    ];
    this.setHelpUrl(Msg['TEXT_PROMPT_HELPURL']);
    this.setStyle('text_blocks');
    const dropdown = fieldRegistry.fromJson({
      type: 'field_dropdown',
      options: TYPES,
    }) as FieldDropdown;
    dropdown.setValidator((newOp: string) => {
      this.updateType_(newOp);
      return undefined; // FieldValidators can't be void.  Use option as-is.
    });
    this.appendValueInput('TEXT').appendField(dropdown, 'TYPE');
    this.setOutput(true, 'String');
    this.setTooltip(() => {
      return this.getFieldValue('TYPE') === 'TEXT'
        ? Msg['TEXT_PROMPT_TOOLTIP_TEXT']
        : Msg['TEXT_PROMPT_TOOLTIP_NUMBER'];
    });
  },
};

type PromptBlock = Block & PromptCommonMixin & QuoteImageMixin;

blocks['text_prompt'] = {
  ...PROMPT_COMMON,
  /**
   * Block for prompt function (internal message).
   * The 'text_prompt_ext' block is preferred as it is more flexible.
   */
  init: function (this: PromptBlock) {
    this.mixin(QUOTE_IMAGE_MIXIN);
    const TYPES = [
      [Msg['TEXT_PROMPT_TYPE_TEXT'], 'TEXT'],
      [Msg['TEXT_PROMPT_TYPE_NUMBER'], 'NUMBER'],
    ];

    this.setHelpUrl(Msg['TEXT_PROMPT_HELPURL']);
    this.setStyle('text_blocks');
    const dropdown = fieldRegistry.fromJson({
      type: 'field_dropdown',
      options: TYPES,
    }) as FieldDropdown;
    dropdown.setValidator((newOp: string) => {
      this.updateType_(newOp);
      return undefined; // FieldValidators can't be void.  Use option as-is.
    });
    this.appendDummyInput()
      .appendField(dropdown, 'TYPE')
      .appendField(this.newQuote_(true))
      .appendField(
        fieldRegistry.fromJson({
          type: 'field_input',
          text: '',
        }) as FieldTextInput,
        'TEXT',
      )
      .appendField(this.newQuote_(false));
    this.setOutput(true, 'String');
    this.setTooltip(() => {
      return this.getFieldValue('TYPE') === 'TEXT'
        ? Msg['TEXT_PROMPT_TOOLTIP_TEXT']
        : Msg['TEXT_PROMPT_TOOLTIP_NUMBER'];
    });
  },
};

blocks['text_count'] = {
  /**
   * Block for counting how many times one string appears within another string.
   */
  init: function (this: Block) {
    this.jsonInit({
      'message0': Msg['TEXT_COUNT_MESSAGE0'],
      'args0': [
        {
          'type': 'input_value',
          'name': 'SUB',
          'check': 'String',
        },
        {
          'type': 'input_value',
          'name': 'TEXT',
          'check': 'String',
        },
      ],
      'output': 'Number',
      'inputsInline': true,
      'style': 'text_blocks',
      'tooltip': Msg['TEXT_COUNT_TOOLTIP'],
      'helpUrl': Msg['TEXT_COUNT_HELPURL'],
    });
  },
};

blocks['text_replace'] = {
  /**
   * Block for replacing one string with another in the text.
   */
  init: function (this: Block) {
    this.jsonInit({
      'message0': Msg['TEXT_REPLACE_MESSAGE0'],
      'args0': [
        {
          'type': 'input_value',
          'name': 'FROM',
          'check': 'String',
        },
        {
          'type': 'input_value',
          'name': 'TO',
          'check': 'String',
        },
        {
          'type': 'input_value',
          'name': 'TEXT',
          'check': 'String',
        },
      ],
      'output': 'String',
      'inputsInline': true,
      'style': 'text_blocks',
      'tooltip': Msg['TEXT_REPLACE_TOOLTIP'],
      'helpUrl': Msg['TEXT_REPLACE_HELPURL'],
    });
  },
};

blocks['text_reverse'] = {
  /**
   * Block for reversing a string.
   */
  init: function (this: Block) {
    this.jsonInit({
      'message0': Msg['TEXT_REVERSE_MESSAGE0'],
      'args0': [
        {
          'type': 'input_value',
          'name': 'TEXT',
          'check': 'String',
        },
      ],
      'output': 'String',
      'inputsInline': true,
      'style': 'text_blocks',
      'tooltip': Msg['TEXT_REVERSE_TOOLTIP'],
      'helpUrl': Msg['TEXT_REVERSE_HELPURL'],
    });
  },
};

/** Type of a block that has QUOTE_IMAGE_MIXIN */
type QuoteImageBlock = Block & QuoteImageMixin;
interface QuoteImageMixin extends QuoteImageMixinType {}
type QuoteImageMixinType = typeof QUOTE_IMAGE_MIXIN;

const QUOTE_IMAGE_MIXIN = {
  /**
   * Image data URI of an LTR opening double quote (same as RTL closing double
   * quote).
   */
  QUOTE_IMAGE_LEFT_DATAURI:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAKCAQAAAAqJXdxAAAA' +
    'n0lEQVQI1z3OMa5BURSF4f/cQhAKjUQhuQmFNwGJEUi0RKN5rU7FHKhpjEH3TEMtkdBSCY' +
    '1EIv8r7nFX9e29V7EBAOvu7RPjwmWGH/VuF8CyN9/OAdvqIXYLvtRaNjx9mMTDyo+NjAN1' +
    'HNcl9ZQ5oQMM3dgDUqDo1l8DzvwmtZN7mnD+PkmLa+4mhrxVA9fRowBWmVBhFy5gYEjKMf' +
    'z9AylsaRRgGzvZAAAAAElFTkSuQmCC',
  /**
   * Image data URI of an LTR closing double quote (same as RTL opening double
   * quote).
   */
  QUOTE_IMAGE_RIGHT_DATAURI:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAKCAQAAAAqJXdxAAAA' +
    'qUlEQVQI1z3KvUpCcRiA8ef9E4JNHhI0aFEacm1o0BsI0Slx8wa8gLauoDnoBhq7DcfWhg' +
    'gONDmJJgqCPA7neJ7p934EOOKOnM8Q7PDElo/4x4lFb2DmuUjcUzS3URnGib9qaPNbuXvB' +
    'O3sGPHJDRG6fGVdMSeWDP2q99FQdFrz26Gu5Tq7dFMzUvbXy8KXeAj57cOklgA+u1B5Aos' +
    'lLtGIHQMaCVnwDnADZIFIrXsoXrgAAAABJRU5ErkJggg==',
  /**
   * Pixel width of QUOTE_IMAGE_LEFT_DATAURI and QUOTE_IMAGE_RIGHT_DATAURI.
   */
  QUOTE_IMAGE_WIDTH: 12,
  /**
   * Pixel height of QUOTE_IMAGE_LEFT_DATAURI and QUOTE_IMAGE_RIGHT_DATAURI.
   */
  QUOTE_IMAGE_HEIGHT: 12,

  /**
   * Inserts appropriate quote images before and after the named field.
   *
   * @param fieldName The name of the field to wrap with quotes.
   */
  quoteField_: function (this: QuoteImageBlock, fieldName: string) {
    for (let i = 0, input; (input = this.inputList[i]); i++) {
      for (let j = 0, field; (field = input.fieldRow[j]); j++) {
        if (fieldName === field.name) {
          input.insertFieldAt(j, this.newQuote_(true));
          input.insertFieldAt(j + 2, this.newQuote_(false));
          return;
        }
      }
    }
    console.warn(
      'field named "' + fieldName + '" not found in ' + this.toDevString(),
    );
  },

  /**
   * A helper function that generates a FieldImage of an opening or
   * closing double quote. The selected quote will be adapted for RTL blocks.
   *
   * @param open If the image should be open quote (“ in LTR).
   *     Otherwise, a closing quote is used (” in LTR).
   * @returns The new field.
   */
  newQuote_: function (this: QuoteImageBlock, open: boolean): FieldImage {
    const isLeft = this.RTL ? !open : open;
    const dataUri = isLeft
      ? this.QUOTE_IMAGE_LEFT_DATAURI
      : this.QUOTE_IMAGE_RIGHT_DATAURI;
    return fieldRegistry.fromJson({
      type: 'field_image',
      src: dataUri,
      width: this.QUOTE_IMAGE_WIDTH,
      height: this.QUOTE_IMAGE_HEIGHT,
      alt: isLeft ? '\u201C' : '\u201D',
    }) as FieldImage;
  },
};

/**
 * Wraps TEXT field with images of double quote characters.
 */
const QUOTES_EXTENSION = function (this: QuoteImageBlock) {
  this.mixin(QUOTE_IMAGE_MIXIN);
  this.quoteField_('TEXT');
};

/**
 * Type of a block that has TEXT_JOIN_MUTATOR_MIXIN
 *
 * @internal
 */
export type JoinMutatorBlock = BlockSvg & JoinMutatorMixin & QuoteImageMixin;
interface JoinMutatorMixin extends JoinMutatorMixinType {}
type JoinMutatorMixinType = typeof JOIN_MUTATOR_MIXIN;

/** Type of a item block in the text_join_mutator bubble. */
type JoinItemBlock = BlockSvg & JoinItemMixin;
interface JoinItemMixin {
  valueConnection_: Connection | null;
}

/**
 * Mixin for mutator functions in the 'text_join_mutator' extension.
 */
const JOIN_MUTATOR_MIXIN = {
  itemCount_: 0,
  /**
   * Create XML to represent number of text inputs.
   * Backwards compatible serialization implementation.
   *
   * @returns XML storage element.
   */
  mutationToDom: function (this: JoinMutatorBlock): Element {
    const container = xmlUtils.createElement('mutation');
    container.setAttribute('items', `${this.itemCount_}`);
    return container;
  },
  /**
   * Parse XML to restore the text inputs.
   * Backwards compatible serialization implementation.
   *
   * @param xmlElement XML storage element.
   */
  domToMutation: function (this: JoinMutatorBlock, xmlElement: Element) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items')!, 10);
    this.updateShape_();
  },
  /**
   * Returns the state of this block as a JSON serializable object.
   *
   * @returns The state of this block, ie the item count.
   */
  saveExtraState: function (this: JoinMutatorBlock): {itemCount: number} {
    return {
      'itemCount': this.itemCount_,
    };
  },
  /**
   * Applies the given state to this block.
   *
   * @param state The state to apply to this block, ie the item count.
   */
  loadExtraState: function (this: JoinMutatorBlock, state: {[x: string]: any}) {
    this.itemCount_ = state['itemCount'];
    this.updateShape_();
  },
  /**
   * Populate the mutator's dialog with this block's components.
   *
   * @param workspace Mutator's workspace.
   * @returns Root block in mutator.
   */
  decompose: function (this: JoinMutatorBlock, workspace: Workspace): Block {
    const containerBlock = workspace.newBlock(
      'text_create_join_container',
    ) as BlockSvg;
    containerBlock.initSvg();
    let connection = containerBlock.getInput('STACK')!.connection!;
    for (let i = 0; i < this.itemCount_; i++) {
      const itemBlock = workspace.newBlock(
        'text_create_join_item',
      ) as JoinItemBlock;
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  /**
   * Reconfigure this block based on the mutator dialog's components.
   *
   * @param containerBlock Root block in mutator.
   */
  compose: function (this: JoinMutatorBlock, containerBlock: Block) {
    let itemBlock = containerBlock.getInputTargetBlock(
      'STACK',
    ) as JoinItemBlock;
    // Count number of inputs.
    const connections = [];
    while (itemBlock) {
      if (itemBlock.isInsertionMarker()) {
        itemBlock = itemBlock.getNextBlock() as JoinItemBlock;
        continue;
      }
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.getNextBlock() as JoinItemBlock;
    }
    // Disconnect any children that don't belong.
    for (let i = 0; i < this.itemCount_; i++) {
      const connection = this.getInput('ADD' + i)!.connection!.targetConnection;
      if (connection && !connections.includes(connection)) {
        connection.disconnect();
      }
    }
    this.itemCount_ = connections.length;
    this.updateShape_();
    // Reconnect any child blocks.
    for (let i = 0; i < this.itemCount_; i++) {
      connections[i]?.reconnect(this, 'ADD' + i);
    }
  },
  /**
   * Store pointers to any connected child blocks.
   *
   * @param containerBlock Root block in mutator.
   */
  saveConnections: function (this: JoinMutatorBlock, containerBlock: Block) {
    let itemBlock = containerBlock.getInputTargetBlock('STACK');
    let i = 0;
    while (itemBlock) {
      if (itemBlock.isInsertionMarker()) {
        itemBlock = itemBlock.getNextBlock();
        continue;
      }
      const input = this.getInput('ADD' + i);
      (itemBlock as JoinItemBlock).valueConnection_ =
        input && input.connection!.targetConnection;
      itemBlock = itemBlock.getNextBlock();
      i++;
    }
  },
  /**
   * Modify this block to have the correct number of inputs.
   *
   */
  updateShape_: function (this: JoinMutatorBlock) {
    if (this.itemCount_ && this.getInput('EMPTY')) {
      this.removeInput('EMPTY');
    } else if (!this.itemCount_ && !this.getInput('EMPTY')) {
      this.appendDummyInput('EMPTY')
        .appendField(this.newQuote_(true))
        .appendField(this.newQuote_(false));
    }
    // Add new inputs.
    for (let i = 0; i < this.itemCount_; i++) {
      if (!this.getInput('ADD' + i)) {
        const input = this.appendValueInput('ADD' + i).setAlign(Align.RIGHT);
        if (i === 0) {
          input.appendField(Msg['TEXT_JOIN_TITLE_CREATEWITH']);
        }
      }
    }
    // Remove deleted inputs.
    for (let i = this.itemCount_; this.getInput('ADD' + i); i++) {
      this.removeInput('ADD' + i);
    }
  },
};

/**
 * Performs final setup of a text_join block.
 */
const JOIN_EXTENSION = function (this: JoinMutatorBlock) {
  // Add the quote mixin for the itemCount_ = 0 case.
  this.mixin(QUOTE_IMAGE_MIXIN);
  // Initialize the mutator values.
  this.itemCount_ = 2;
  this.updateShape_();
  // Configure the mutator UI.
  this.setMutator(new MutatorIcon(['text_create_join_item'], this));
};

// Update the tooltip of 'text_append' block to reference the variable.
Extensions.register(
  'text_append_tooltip',
  Extensions.buildTooltipWithFieldText('%{BKY_TEXT_APPEND_TOOLTIP}', 'VAR'),
);

/**
 * Update the tooltip of 'text_append' block to reference the variable.
 */
const INDEXOF_TOOLTIP_EXTENSION = function (this: Block) {
  this.setTooltip(() => {
    return Msg['TEXT_INDEXOF_TOOLTIP'].replace(
      '%1',
      this.workspace.options.oneBasedIndex ? '0' : '-1',
    );
  });
};

/** Type of a block that has TEXT_CHARAT_MUTATOR_MIXIN */
type CharAtBlock = Block & CharAtMixin;
interface CharAtMixin extends CharAtMixinType {}
type CharAtMixinType = typeof CHARAT_MUTATOR_MIXIN;

/**
 * Mixin for mutator functions in the 'text_charAt_mutator' extension.
 */
const CHARAT_MUTATOR_MIXIN = {
  isAt_: false,
  /**
   * Create XML to represent whether there is an 'AT' input.
   * Backwards compatible serialization implementation.
   *
   * @returns XML storage element.
   */
  mutationToDom: function (this: CharAtBlock): Element {
    const container = xmlUtils.createElement('mutation');
    container.setAttribute('at', `${this.isAt_}`);
    return container;
  },
  /**
   * Parse XML to restore the 'AT' input.
   * Backwards compatible serialization implementation.
   *
   * @param xmlElement XML storage element.
   */
  domToMutation: function (this: CharAtBlock, xmlElement: Element) {
    // Note: Until January 2013 this block did not have mutations,
    // so 'at' defaults to true.
    const isAt = xmlElement.getAttribute('at') !== 'false';
    this.updateAt_(isAt);
  },

  // This block does not need JSO serialization hooks (saveExtraState and
  // loadExtraState) because the state of this object is already encoded in the
  // dropdown values.
  // XML hooks are kept for backwards compatibility.

  /**
   * Create or delete an input for the numeric index.
   *
   * @internal
   * @param isAt True if the input should exist.
   */
  updateAt_: function (this: CharAtBlock, isAt: boolean) {
    // Destroy old 'AT' and 'ORDINAL' inputs.
    this.removeInput('AT', true);
    this.removeInput('ORDINAL', true);
    // Create either a value 'AT' input or a dummy input.
    if (isAt) {
      this.appendValueInput('AT').setCheck('Number');
      if (Msg['ORDINAL_NUMBER_SUFFIX']) {
        this.appendDummyInput('ORDINAL').appendField(
          Msg['ORDINAL_NUMBER_SUFFIX'],
        );
      }
    }
    if (Msg['TEXT_CHARAT_TAIL']) {
      this.removeInput('TAIL', true);
      this.appendDummyInput('TAIL').appendField(Msg['TEXT_CHARAT_TAIL']);
    }

    this.isAt_ = isAt;
  },
};

/**
 * Does the initial mutator update of text_charAt and adds the tooltip
 */
const CHARAT_EXTENSION = function (this: CharAtBlock) {
  const dropdown = this.getField('WHERE') as FieldDropdown;
  dropdown.setValidator(function (this: FieldDropdown, value: any) {
    const newAt = value === 'FROM_START' || value === 'FROM_END';
    const block = this.getSourceBlock() as CharAtBlock;
    if (newAt !== block.isAt_) {
      block.updateAt_(newAt);
    }
    return undefined; // FieldValidators can't be void.  Use option as-is.
  });
  this.updateAt_(true);
  this.setTooltip(() => {
    const where = this.getFieldValue('WHERE');
    let tooltip = Msg['TEXT_CHARAT_TOOLTIP'];
    if (where === 'FROM_START' || where === 'FROM_END') {
      const msg =
        where === 'FROM_START'
          ? Msg['LISTS_INDEX_FROM_START_TOOLTIP']
          : Msg['LISTS_INDEX_FROM_END_TOOLTIP'];
      if (msg) {
        tooltip +=
          '  ' +
          msg.replace('%1', this.workspace.options.oneBasedIndex ? '#1' : '#0');
      }
    }
    return tooltip;
  });
};

Extensions.register('text_indexOf_tooltip', INDEXOF_TOOLTIP_EXTENSION);

Extensions.register('text_quotes', QUOTES_EXTENSION);

Extensions.registerMixin('quote_image_mixin', QUOTE_IMAGE_MIXIN);

Extensions.registerMutator(
  'text_join_mutator',
  JOIN_MUTATOR_MIXIN,
  JOIN_EXTENSION,
);

Extensions.registerMutator(
  'text_charAt_mutator',
  CHARAT_MUTATOR_MIXIN,
  CHARAT_EXTENSION,
);

// Register provided blocks.
defineBlocks(blocks);
