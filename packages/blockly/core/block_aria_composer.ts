/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import type {BlockSvg} from './block_svg.js';
import {ConnectionType} from './connection_type.js';
import type {Input} from './inputs/input.js';
import {inputTypes} from './inputs/input_types.js';
import {
  ISelectableToolboxItem,
  isSelectableToolboxItem,
} from './interfaces/i_selectable_toolbox_item.js';
import {Msg} from './msg.js';
import {Role, setRole, setState, State, Verbosity} from './utils/aria.js';

/**
 * Returns an ARIA representation of the specified block.
 *
 * The returned label will contain a complete context of the block, including:
 * - Whether it begins a block stack or statement input stack.
 * - Its constituent editable and non-editable fields.
 * - Properties, including: disabled, collapsed, replaceable (a shadow), etc.
 * - Its parent toolbox category.
 * - Whether it has inputs.
 *
 * Beyond this, the returned label is specifically assembled with commas in
 * select locations with the intention of better 'prosody' in the screen reader
 * readouts since there's a lot of information being shared with the user. The
 * returned label also places more important information earlier in the label so
 * that the user gets the most important context as soon as possible in case
 * they wish to stop readout early.
 *
 * The returned label will be specialized based on whether the block is part of a
 * flyout.
 *
 * @internal
 * @param block The block for which an ARIA representation should be created.
 * @param verbosity How much detail to include in the description.
 * @returns The ARIA representation for the specified block.
 */
export function computeAriaLabel(
  block: BlockSvg,
  verbosity = Verbosity.STANDARD,
) {
  return [
    getBeginStackLabel(block),
    getParentInputLabel(block),
    ...getInputLabels(block),
    verbosity === Verbosity.LOQUACIOUS && getParentToolboxCategoryLabel(block),
    verbosity >= Verbosity.STANDARD && getDisabledLabel(block),
    verbosity >= Verbosity.STANDARD && getCollapsedLabel(block),
    verbosity >= Verbosity.STANDARD && getShadowBlockLabel(block),
    verbosity >= Verbosity.STANDARD && getInputCountLabel(block),
  ]
    .filter((label) => !!label)
    .join(', ');
}

/**
 * Sets the ARIA role and role description for the specified block, accounting
 * for whether the block is part of a flyout.
 *
 * @internal
 * @param block The block to set ARIA role and roledescription attributes on.
 */
export function configureAriaRole(block: BlockSvg) {
  setRole(block.getSvgRoot(), block.isInFlyout ? Role.LISTITEM : Role.FIGURE);

  let roleDescription = Msg['BLOCK_LABEL_STATEMENT'];
  if (block.statementInputCount) {
    roleDescription = Msg['BLOCK_LABEL_CONTAINER'];
  } else if (block.outputConnection) {
    roleDescription = Msg['BLOCK_LABEL_VALUE'];
  }

  setState(block.getSvgRoot(), State.ROLEDESCRIPTION, roleDescription);
}

/**
 * Returns a list of ARIA labels for the 'field row' for the specified Input.
 *
 * 'Field row' essentially means the horizontal run of readable fields that
 * precede the Input. Together, these provide the domain context for the input,
 * particularly in the context of connections. In some cases, there may not be
 * any readable fields immediately prior to the Input. In that case, if the
 * `lookback` attribute is specified, all of the fields on the row immediately
 * above the Input will be used instead.
 *
 * @internal
 * @param input The Input to compute a description/context label for.
 * @param lookback If true, will use labels for fields on the previous row if
 *     the given input's row has no fields itself.
 * @returns A list of labels for fields on the same row (or previous row, if
 *     lookback is specified) as the given input.
 */
export function computeFieldRowLabel(
  input: Input,
  lookback: boolean,
): string[] {
  const fieldRowLabel = input.fieldRow
    .filter((field) => field.isVisible())
    .map((field) => field.computeAriaLabel(true));
  if (!fieldRowLabel.length && lookback) {
    const inputs = input.getSourceBlock().inputList;
    const index = inputs.indexOf(input);
    if (index > 0) {
      return computeFieldRowLabel(inputs[index - 1], lookback);
    }
  }
  return fieldRowLabel;
}

/**
 * Returns a description of the parent statement input a block is attached to.
 * When a block is connected to a statement input, the input's field row label
 * will be prepended to the block's description to indicate that the block
 * begins a clause in its parent block.
 *
 * @internal
 * @param block The block to generate a parent input label for.
 * @returns A description of the block's parent statement input, or undefined
 *     for blocks that do not have one.
 */
function getParentInputLabel(block: BlockSvg) {
  const parentInput = (
    block.outputConnection ?? block.previousConnection
  )?.targetConnection?.getParentInput();
  const parentBlock = parentInput?.getSourceBlock();

  if (!parentBlock?.statementInputCount) return undefined;

  const firstStatementInput = parentBlock.inputList.find(
    (i) => i.type === inputTypes.STATEMENT,
  );
  // The first statement input in a block has no field row label as it would
  // be duplicative of the block's label.
  if (!parentInput || parentInput === firstStatementInput) {
    return undefined;
  }

  const parentInputLabel = computeFieldRowLabel(parentInput, true);
  return parentInput.type === inputTypes.STATEMENT
    ? Msg['BLOCK_LABEL_BEGIN_PREFIX'].replace('%1', parentInputLabel.join(' '))
    : parentInputLabel;
}

/**
 * Returns text indicating that a block is the root block of a stack.
 *
 * @internal
 * @param block The block to retrieve a label for.
 * @returns Text indicating that the block begins a stack, or undefined if it
 *     does not.
 */
function getBeginStackLabel(block: BlockSvg) {
  return !block.workspace.isFlyout && block.getRootBlock() === block
    ? Msg['BLOCK_LABEL_BEGIN_STACK']
    : undefined;
}

/**
 * Returns a list of accessibility labels for fields and inputs on a block.
 * Each entry in the returned array corresponds to one of: (a) a label for a
 * continuous run of non-interactable fields, (b) a label for an editable field,
 * (c) a label for an input. When an input contains nested blocks/fields/inputs,
 * their contents are returned as a single item in the array per top-level
 * input.
 *
 * @internal
 * @param block The block to retrieve a list of field/input labels for.
 * @returns A list of field/input labels for the given block.
 */
function getInputLabels(block: BlockSvg): string[] {
  return block.inputList
    .filter((input) => input.isVisible())
    .flatMap((input) => {
      const labels = computeFieldRowLabel(input, false);

      if (input.connection?.type === ConnectionType.INPUT_VALUE) {
        const childBlock = input.connection.targetBlock();
        if (childBlock) {
          labels.push(getInputLabels(childBlock as BlockSvg).join(' '));
        }
      }

      return labels;
    });
}

/**
 * Returns the name of the toolbox category that the given block is part of.
 * This is heuristic-based; each toolbox category's contents are enumerated, and
 * if a block with the given block's type is encountered, that category is
 * deemed to be its parent. As a fallback, a toolbox category with the same
 * colour as the block may be returned. This is not comprehensive; blocks may
 * exist on the workspace which are not part of any category, or a given block
 * type may be part of multiple categories or belong to a dynamically-generated
 * category, or there may not even be a toolbox at all. In these cases, either
 * the first matching category or undefined will be returned.
 *
 * This method exists to attempt to provide similar context as block colour
 * provides to sighted users, e.g. where a red block comes from a red category.
 * It is inherently best-effort due to the above-mentioned constraints.
 *
 * @internal
 * @param block The block to retrieve a category name for.
 * @returns A description of the given block's parent toolbox category if any,
 *     otherwise undefined.
 */
function getParentToolboxCategoryLabel(block: BlockSvg) {
  const toolbox = block.workspace.getToolbox();
  if (!toolbox) return undefined;

  let parentCategory: ISelectableToolboxItem | undefined = undefined;
  for (const category of toolbox.getToolboxItems()) {
    if (!isSelectableToolboxItem(category)) continue;

    const contents = category.getContents();
    if (
      Array.isArray(contents) &&
      contents.some(
        (item) =>
          item.kind.toLowerCase() === 'block' &&
          'type' in item &&
          item.type === block.type,
      )
    ) {
      parentCategory = category;
      break;
    }

    if (
      'getColour' in category &&
      typeof category.getColour === 'function' &&
      category.getColour() === block.getColour()
    ) {
      parentCategory = category;
    }
  }

  if (parentCategory) {
    return Msg['BLOCK_LABEL_TOOLBOX_CATEGORY'].replace(
      '%1',
      parentCategory.getName(),
    );
  }

  return undefined;
}

/**
 * Returns a label indicating that the block is disabled.
 *
 * @internal
 * @param block The block to generate a label for.
 * @returns A label indicating that the block is disabled (if it is), otherwise
 *     undefined.
 */
export function getDisabledLabel(block: BlockSvg) {
  return block.isEnabled() ? undefined : Msg['BLOCK_LABEL_DISABLED'];
}

/**
 * Returns a label indicating that the block is collapsed.
 *
 * @internal
 * @param block The block to generate a label for.
 * @returns A label indicating that the block is collapsed (if it is), otherwise
 *     undefined.
 */
function getCollapsedLabel(block: BlockSvg) {
  return block.isCollapsed() ? Msg['BLOCK_LABEL_COLLAPSED'] : undefined;
}

/**
 * Returns a label indicating that the block is a shadow block.
 *
 * @internal
 * @param block The block to generate a label for.
 * @returns A label indicating that the block is a shadow (if it is), otherwise
 *     undefined.
 */
function getShadowBlockLabel(block: BlockSvg) {
  return block.isShadow() ? Msg['BLOCK_LABEL_REPLACEABLE'] : undefined;
}

/**
 * Returns a label indicating whether the block has one or multiple inputs.
 *
 * @internal
 * @param block The block to generate a label for.
 * @returns A label indicating that the block has one or multiple inputs,
 *     otherwise undefined.
 */
function getInputCountLabel(block: BlockSvg) {
  const inputCount = block.inputList.reduce((totalSum, input) => {
    return (
      input.fieldRow.reduce((fieldCount, field) => {
        return field.EDITABLE && !field.isFullBlockField()
          ? fieldCount++
          : fieldCount;
      }, totalSum) +
      (input.connection?.type === ConnectionType.INPUT_VALUE ? 1 : 0)
    );
  }, 0);

  switch (inputCount) {
    case 0:
      return undefined;
    case 1:
      return Msg['BLOCK_LABEL_HAS_INPUT'];
    default:
      return Msg['BLOCK_LABEL_HAS_INPUTS'];
  }
}
