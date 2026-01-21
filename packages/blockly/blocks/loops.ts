/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.libraryBlocks.loops

import type {Block} from '../core/block.js';
import {
  createBlockDefinitionsFromJsonArray,
  defineBlocks,
} from '../core/common.js';
import * as ContextMenu from '../core/contextmenu.js';
import type {
  ContextMenuOption,
  LegacyContextMenuOption,
} from '../core/contextmenu_registry.js';
import * as Events from '../core/events/events.js';
import type {Abstract as AbstractEvent} from '../core/events/events_abstract.js';
import * as eventUtils from '../core/events/utils.js';
import * as Extensions from '../core/extensions.js';
import '../core/field_dropdown.js';
import '../core/field_label.js';
import '../core/field_number.js';
import '../core/field_variable.js';
import {FieldVariable} from '../core/field_variable.js';
import '../core/icons/warning_icon.js';
import {Msg} from '../core/msg.js';
import {WorkspaceSvg} from '../core/workspace_svg.js';

/**
 * A dictionary of the block definitions provided by this module.
 */
export const blocks = createBlockDefinitionsFromJsonArray([
  // Block for repeat n times (external number).
  {
    'type': 'controls_repeat_ext',
    'message0': '%{BKY_CONTROLS_REPEAT_TITLE}',
    'args0': [
      {
        'type': 'input_value',
        'name': 'TIMES',
        'check': 'Number',
      },
    ],
    'message1': '%{BKY_CONTROLS_REPEAT_INPUT_DO} %1',
    'args1': [
      {
        'type': 'input_statement',
        'name': 'DO',
      },
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'loop_blocks',
    'tooltip': '%{BKY_CONTROLS_REPEAT_TOOLTIP}',
    'helpUrl': '%{BKY_CONTROLS_REPEAT_HELPURL}',
  },
  // Block for repeat n times (internal number).
  // The 'controls_repeat_ext' block is preferred as it is more flexible.
  {
    'type': 'controls_repeat',
    'message0': '%{BKY_CONTROLS_REPEAT_TITLE}',
    'args0': [
      {
        'type': 'field_number',
        'name': 'TIMES',
        'value': 10,
        'min': 0,
        'precision': 1,
      },
    ],
    'message1': '%{BKY_CONTROLS_REPEAT_INPUT_DO} %1',
    'args1': [
      {
        'type': 'input_statement',
        'name': 'DO',
      },
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'loop_blocks',
    'tooltip': '%{BKY_CONTROLS_REPEAT_TOOLTIP}',
    'helpUrl': '%{BKY_CONTROLS_REPEAT_HELPURL}',
  },
  // Block for 'do while/until' loop.
  {
    'type': 'controls_whileUntil',
    'message0': '%1 %2',
    'args0': [
      {
        'type': 'field_dropdown',
        'name': 'MODE',
        'options': [
          ['%{BKY_CONTROLS_WHILEUNTIL_OPERATOR_WHILE}', 'WHILE'],
          ['%{BKY_CONTROLS_WHILEUNTIL_OPERATOR_UNTIL}', 'UNTIL'],
        ],
      },
      {
        'type': 'input_value',
        'name': 'BOOL',
        'check': 'Boolean',
      },
    ],
    'message1': '%{BKY_CONTROLS_REPEAT_INPUT_DO} %1',
    'args1': [
      {
        'type': 'input_statement',
        'name': 'DO',
      },
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'loop_blocks',
    'helpUrl': '%{BKY_CONTROLS_WHILEUNTIL_HELPURL}',
    'extensions': ['controls_whileUntil_tooltip'],
  },
  // Block for 'for' loop.
  {
    'type': 'controls_for',
    'message0': '%{BKY_CONTROLS_FOR_TITLE}',
    'args0': [
      {
        'type': 'field_variable',
        'name': 'VAR',
        'variable': null,
      },
      {
        'type': 'input_value',
        'name': 'FROM',
        'check': 'Number',
        'align': 'RIGHT',
      },
      {
        'type': 'input_value',
        'name': 'TO',
        'check': 'Number',
        'align': 'RIGHT',
      },
      {
        'type': 'input_value',
        'name': 'BY',
        'check': 'Number',
        'align': 'RIGHT',
      },
    ],
    'message1': '%{BKY_CONTROLS_REPEAT_INPUT_DO} %1',
    'args1': [
      {
        'type': 'input_statement',
        'name': 'DO',
      },
    ],
    'inputsInline': true,
    'previousStatement': null,
    'nextStatement': null,
    'style': 'loop_blocks',
    'helpUrl': '%{BKY_CONTROLS_FOR_HELPURL}',
    'extensions': ['contextMenu_newGetVariableBlock', 'controls_for_tooltip'],
  },
  // Block for 'for each' loop.
  {
    'type': 'controls_forEach',
    'message0': '%{BKY_CONTROLS_FOREACH_TITLE}',
    'args0': [
      {
        'type': 'field_variable',
        'name': 'VAR',
        'variable': null,
      },
      {
        'type': 'input_value',
        'name': 'LIST',
        'check': 'Array',
      },
    ],
    'message1': '%{BKY_CONTROLS_REPEAT_INPUT_DO} %1',
    'args1': [
      {
        'type': 'input_statement',
        'name': 'DO',
      },
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'loop_blocks',
    'helpUrl': '%{BKY_CONTROLS_FOREACH_HELPURL}',
    'extensions': [
      'contextMenu_newGetVariableBlock',
      'controls_forEach_tooltip',
    ],
  },
  // Block for flow statements: continue, break.
  {
    'type': 'controls_flow_statements',
    'message0': '%1',
    'args0': [
      {
        'type': 'field_dropdown',
        'name': 'FLOW',
        'options': [
          ['%{BKY_CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK}', 'BREAK'],
          ['%{BKY_CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE}', 'CONTINUE'],
        ],
      },
    ],
    'previousStatement': null,
    'style': 'loop_blocks',
    'helpUrl': '%{BKY_CONTROLS_FLOW_STATEMENTS_HELPURL}',
    'suppressPrefixSuffix': true,
    'extensions': ['controls_flow_tooltip', 'controls_flow_in_loop_check'],
  },
]);

/**
 * Tooltips for the 'controls_whileUntil' block, keyed by MODE value.
 *
 * @see {Extensions#buildTooltipForDropdown}
 */
const WHILE_UNTIL_TOOLTIPS = {
  'WHILE': '%{BKY_CONTROLS_WHILEUNTIL_TOOLTIP_WHILE}',
  'UNTIL': '%{BKY_CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL}',
};

Extensions.register(
  'controls_whileUntil_tooltip',
  Extensions.buildTooltipForDropdown('MODE', WHILE_UNTIL_TOOLTIPS),
);

/**
 * Tooltips for the 'controls_flow_statements' block, keyed by FLOW value.
 *
 * @see {Extensions#buildTooltipForDropdown}
 */
const BREAK_CONTINUE_TOOLTIPS = {
  'BREAK': '%{BKY_CONTROLS_FLOW_STATEMENTS_TOOLTIP_BREAK}',
  'CONTINUE': '%{BKY_CONTROLS_FLOW_STATEMENTS_TOOLTIP_CONTINUE}',
};

Extensions.register(
  'controls_flow_tooltip',
  Extensions.buildTooltipForDropdown('FLOW', BREAK_CONTINUE_TOOLTIPS),
);

/** Type of a block that has CUSTOM_CONTEXT_MENU_CREATE_VARIABLES_GET_MIXIN */
type CustomContextMenuBlock = Block & CustomContextMenuMixin;
interface CustomContextMenuMixin extends CustomContextMenuMixinType {}
type CustomContextMenuMixinType =
  typeof CUSTOM_CONTEXT_MENU_CREATE_VARIABLES_GET_MIXIN;

/**
 * Mixin to add a context menu item to create a 'variables_get' block.
 * Used by blocks 'controls_for' and 'controls_forEach'.
 */
const CUSTOM_CONTEXT_MENU_CREATE_VARIABLES_GET_MIXIN = {
  /**
   * Add context menu option to create getter block for the loop's variable.
   * (customContextMenu support limited to web BlockSvg.)
   *
   * @param options List of menu options to add to.
   */
  customContextMenu: function (
    this: CustomContextMenuBlock,
    options: Array<ContextMenuOption | LegacyContextMenuOption>,
  ) {
    if (this.isInFlyout) {
      return;
    }
    const varField = this.getField('VAR') as FieldVariable;
    const variable = varField.getVariable()!;
    const varName = variable.getName();
    if (!this.isCollapsed() && varName !== null) {
      const getVarBlockState = {
        type: 'variables_get',
        fields: {VAR: varField.saveState(true)},
      };

      options.push({
        enabled: true,
        text: Msg['VARIABLES_SET_CREATE_GET'].replace('%1', varName),
        callback: ContextMenu.callbackFactory(this, getVarBlockState),
      });
    }
  },
};

Extensions.registerMixin(
  'contextMenu_newGetVariableBlock',
  CUSTOM_CONTEXT_MENU_CREATE_VARIABLES_GET_MIXIN,
);

Extensions.register(
  'controls_for_tooltip',
  Extensions.buildTooltipWithFieldText('%{BKY_CONTROLS_FOR_TOOLTIP}', 'VAR'),
);

Extensions.register(
  'controls_forEach_tooltip',
  Extensions.buildTooltipWithFieldText(
    '%{BKY_CONTROLS_FOREACH_TOOLTIP}',
    'VAR',
  ),
);

/**
 * List of block types that are loops and thus do not need warnings.
 * To add a new loop type add this to your code:
 *
 * // If using the Blockly npm package and es6 import syntax:
 * import {loops} from 'blockly/blocks';
 * loops.loopTypes.add('custom_loop');
 *
 * // Else if using Closure Compiler and goog.modules:
 * const {loopTypes} = goog.require('Blockly.libraryBlocks.loops');
 * loopTypes.add('custom_loop');
 *
 * // Else if using blockly_compressed + blockss_compressed.js in browser:
 * Blockly.libraryBlocks.loopTypes.add('custom_loop');
 */
export const loopTypes: Set<string> = new Set([
  'controls_repeat',
  'controls_repeat_ext',
  'controls_forEach',
  'controls_for',
  'controls_whileUntil',
]);

/**
 * Type of a block that has CONTROL_FLOW_IN_LOOP_CHECK_MIXIN
 *
 * @internal
 */
export type ControlFlowInLoopBlock = Block & ControlFlowInLoopMixin;
interface ControlFlowInLoopMixin extends ControlFlowInLoopMixinType {}
type ControlFlowInLoopMixinType = typeof CONTROL_FLOW_IN_LOOP_CHECK_MIXIN;

/**
 * The language-neutral ID for when the reason why a block is disabled is
 * because the block is only valid inside of a loop.
 */
const CONTROL_FLOW_NOT_IN_LOOP_DISABLED_REASON = 'CONTROL_FLOW_NOT_IN_LOOP';
/**
 * This mixin adds a check to make sure the 'controls_flow_statements' block
 * is contained in a loop. Otherwise a warning is added to the block.
 */
const CONTROL_FLOW_IN_LOOP_CHECK_MIXIN = {
  /**
   * Is this block enclosed (at any level) by a loop?
   *
   * @returns The nearest surrounding loop, or null if none.
   */
  getSurroundLoop: function (this: ControlFlowInLoopBlock): Block | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let block: Block | null = this;
    do {
      if (loopTypes.has(block.type)) {
        return block;
      }
      block = block.getSurroundParent();
    } while (block);
    return null;
  },

  /**
   * Called whenever anything on the workspace changes.
   * Add warning if this flow block is not nested inside a loop.
   */
  onchange: function (this: ControlFlowInLoopBlock, e: AbstractEvent) {
    const ws = this.workspace as WorkspaceSvg;
    // Don't change state if:
    //   * It's at the start of a drag.
    //   * It's not a move event.
    if (
      !ws.isDragging ||
      ws.isDragging() ||
      (e.type !== Events.BLOCK_MOVE && e.type !== Events.BLOCK_CREATE)
    ) {
      return;
    }
    const enabled = !!this.getSurroundLoop();
    this.setWarningText(
      enabled ? null : Msg['CONTROLS_FLOW_STATEMENTS_WARNING'],
    );

    if (!this.isInFlyout) {
      try {
        // There is no need to record the enable/disable change on the undo/redo
        // list since the change will be automatically recreated when replayed.
        eventUtils.setRecordUndo(false);
        this.setDisabledReason(
          !enabled,
          CONTROL_FLOW_NOT_IN_LOOP_DISABLED_REASON,
        );
      } finally {
        eventUtils.setRecordUndo(true);
      }
    }
  },
};

Extensions.registerMixin(
  'controls_flow_in_loop_check',
  CONTROL_FLOW_IN_LOOP_CHECK_MIXIN,
);

// Register provided blocks.
defineBlocks(blocks);
