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
import {RenderedConnection} from './rendered_connection.js';
import {Role, setRole, setState, State, Verbosity} from './utils/aria.js';

/**
 * Prepositions to use when describing the relationship between two blocks based
 * on their connection types.
 */
export enum ConnectionPreposition {
  UNKNOWN,
  BEFORE,
  AFTER,
  AROUND,
  INSIDE,
  TO,
}

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
 * Custom input labels (from {@link Input.setAriaLabelProvider}) are not included
 * here; they are used only in move-mode disambiguation and parent-input context
 * via {@link Input.getAriaLabelText}.
 *
 * @internal
 * @param block The block for which an ARIA representation should be created.
 * @param verbosity How much detail to include in the description.
 * @param fullBlockFieldLabel An optional override for input labels for full-block fields
 * @returns The ARIA representation for the specified block.
 */
export function computeAriaLabel(
  block: BlockSvg,
  verbosity = Verbosity.STANDARD,
  fullBlockFieldLabel: string | undefined = undefined,
) {
  return [
    verbosity >= Verbosity.STANDARD && getBeginStackLabel(block),
    getParentInputLabel(block),
    ...getInputLabels(block, verbosity, fullBlockFieldLabel),
    verbosity === Verbosity.LOQUACIOUS && getParentToolboxCategoryLabel(block),
    verbosity >= Verbosity.STANDARD && getDisabledLabel(block),
    verbosity >= Verbosity.STANDARD && getCollapsedLabel(block),
    verbosity >= Verbosity.LOQUACIOUS && getShadowBlockLabel(block),
    verbosity >= Verbosity.STANDARD && getInputCountLabel(block),
    verbosity >= Verbosity.LOQUACIOUS && block.getAriaRoleDescription(),
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
  setRole(block.getSvgRoot(), Role.NONE);
  const focusableElement = block.getFocusableElement();
  if (!block.isInFlyout) {
    // blocks in the flyout have their role set by the Flyout's block inflater
    // don't overwrite it here
    setRole(focusableElement, Role.FIGURE);
  }

  setState(
    focusableElement,
    State.ROLEDESCRIPTION,
    block.getAriaRoleDescription(),
  );
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
 * If the input contains multiple adjacent FieldLabel fields, they will be
 * combined together into a singular label string so that screenreaders can
 * know to read them together as one piece of text.
 *
 * Empty field labels are excluded because they don't provide useful context.
 * Fields should generally have a helpful label, but there are exceptions, such
 * as when empty label fields are used to control the layout of a block.
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
  verbosity = Verbosity.STANDARD,
): string[] {
  const includeTypeInfo = verbosity >= Verbosity.LOQUACIOUS;
  let adjacentFieldLabels: Array<string> = [];
  const fieldRowLabel = input.fieldRow
    .filter((field) => field.isVisible())
    .flatMap((field, index, visibleFields) => {
      const isFieldLabel = field.isLabelField();
      if (isFieldLabel) {
        if (
          index < visibleFields.length - 1 &&
          visibleFields[index + 1].isLabelField()
        ) {
          // Both this item and the next item are FieldLabels. We want to
          // combine these, so we add this one to the list for later handling.
          adjacentFieldLabels.push(field.computeAriaLabel(includeTypeInfo));
          return [];
        } else if (adjacentFieldLabels.length >= 1) {
          // There is at least one adjacent FieldLabel before this one but none
          // after. Combine the FieldLabels into one string.
          adjacentFieldLabels.push(field.computeAriaLabel(includeTypeInfo));
          const label = adjacentFieldLabels.join(' ');
          adjacentFieldLabels = [];
          return label;
        }
      }
      return field.computeAriaLabel(includeTypeInfo);
    });

  if (!fieldRowLabel.length && lookback) {
    const inputs = input.getSourceBlock().inputList;
    const index = inputs.indexOf(input);
    if (index > 0) {
      return computeFieldRowLabel(inputs[index - 1], lookback, verbosity);
    }
  }
  if (
    input.type === inputTypes.VALUE &&
    input.connection?.targetConnection === null &&
    verbosity >= Verbosity.STANDARD
  ) {
    fieldRowLabel.push(Msg['INPUT_LABEL_EMPTY']);
  }
  return fieldRowLabel.filter((label) => !!label);
}

/**
 * Returns a description of the parent input a block is attached to.
 * When a block is connected to an input, the input's label will sometimes
 * be prepended to the block's description.
 *
 * If an input has a custom label, the custom label will be prepended
 * to the first child block connected to that input.
 *
 * If an input does not have a custom label, the input's fallback
 * label determined from the field row will be prepended to the
 * child block's label only if the following are true:
 * - the parent block has at least one statement input
 * - the child block in question is not attached to the first
 *   statement input of the parent block (in this case, the label
 *   would be redundant with the parent block's label)
 *
 * For statement inputs without their own field labels, labels from other
 * inputs in the same statement section are included (via
 * {@link getInputLabelsSubset}), consistent with move-target disambiguation.
 *
 * For statement inputs, the resolved label (whether custom or fallback) is
 * wrapped in the "Begin %1" prefix so the readout indicates that the child
 * block starts the body of the statement input.
 *
 * Labels for child blocks of inputs are excluded because they are included
 * with {@link getInputLabels} already.
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
  if (!parentInput) return undefined;

  const parentBlock = parentInput.getSourceBlock();
  if (parentBlock.isInsertionMarker()) return undefined;

  // parentInput is only non-null when this block is directly attached to the
  // input (i.e. it is the first child block in that input). A custom label
  // is always prepended for the first child; a fallback label from the field
  // row is only used in select circumstances.
  let inputLabel: string | string[];
  const customLabel = parentInput.getAriaLabelText();
  if (customLabel) {
    inputLabel = customLabel;
  } else {
    if (!parentBlock.statementInputCount) return undefined;

    const firstStatementInput = parentBlock.inputList.find(
      (i) => i.type === inputTypes.STATEMENT,
    );
    // The first statement input in a block has no field row label as it would
    // be duplicative of the block's label.
    if (parentInput === firstStatementInput) {
      return undefined;
    }

    const sectionLabels = getInputLabelsSubset(
      parentBlock as BlockSvg,
      parentInput,
      false, // Exclude labels from child blocks.
    );
    if (!sectionLabels.length) {
      return undefined;
    }
    inputLabel = sectionLabels.join(', ');
  }

  if (parentInput.type === inputTypes.STATEMENT) {
    const labelText = Array.isArray(inputLabel)
      ? inputLabel.join(' ')
      : inputLabel;
    return Msg['BLOCK_LABEL_BEGIN_PREFIX'].replace('%1', labelText);
  }
  return inputLabel;
}

/**
 * Returns text indicating that a block is the root block of a stack.
 *
 * @internal
 * @param block The block to retrieve a label for.
 * @returns Text indicating that the block begins a stack, or undefined if it
 *     does not.
 */
export function getBeginStackLabel(block: BlockSvg) {
  // Don't include the "begin stack" label for blocks that are moving
  // or blocks in the flyout
  if (block.isInFlyout || block.isDragging()) return undefined;
  return block.getRootBlock() === block
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
 * Uses derived labels only (field row text and connected block content via
 * {@link Input.getLabel}). Custom input labels are not included; see
 * {@link Input.getAriaLabelText} for move-mode and parent-input usage.
 *
 * @internal
 * @param block The block to retrieve a list of field/input labels for.
 * @param verbosity How much detail to include in each input label.
 * @param fullBlockFieldLabel An optional override for full-block fields.
 * @returns A list of field/input labels for the given block.
 */
export function getInputLabels(
  block: BlockSvg,
  verbosity = Verbosity.STANDARD,
  fullBlockFieldLabel: string | undefined = undefined,
): string[] {
  if (fullBlockFieldLabel) {
    return [fullBlockFieldLabel];
  }
  const visibleInputs = block.inputList.filter((input) => input.isVisible());
  let inputsToLabel = visibleInputs;

  // For terse and standard verbosity levels, if there are multiple statement inputs,
  // only include labels up to the first one.
  if (verbosity <= Verbosity.STANDARD) {
    const statementInputs = visibleInputs.filter(
      (input) => input.type === inputTypes.STATEMENT,
    );

    if (statementInputs.length > 1) {
      inputsToLabel = visibleInputs.slice(
        0,
        visibleInputs.indexOf(statementInputs[0]) + 1,
      );
    }
  }
  let adjacentFieldLabels: Array<string> = [];
  return inputsToLabel.flatMap((input, index, inputs) => {
    const inputLabel = input.getLabel(verbosity);
    if (
      index < inputs.length - 1 &&
      endsWithFieldLabel(input) &&
      beginsWithFieldLabel(inputs[index + 1]) &&
      !isEndOfRow(input, inputs[index + 1])
    ) {
      // This input ends with a field label and the next one begins with one.
      // They are also on the same visual row. We want to combine these, so we
      // add this one to the list for later handling. Value inputs are
      // excluded from this as the value should be separated.
      adjacentFieldLabels.push(inputLabel);
      return [];
    } else if (beginsWithFieldLabel(input) && adjacentFieldLabels.length > 0) {
      // There is at least one adjacent FieldLabel before this one but none
      // after. Combine the FieldLabels into one string.
      adjacentFieldLabels.push(inputLabel);
      const label = adjacentFieldLabels.join(' ');
      adjacentFieldLabels = [];
      return label;
    }
    return inputLabel;
  });
}

/**
 * Returns whether an input's list of visible fields begins with a FieldLabel
 *
 * @param input the input to be evaluated
 * @returns a boolean indicating whether the input's first visible field is of
 * type FieldLabel
 */
function beginsWithFieldLabel(input: Input): boolean {
  const visibleFields = input.fieldRow.filter((field) => field.isVisible());
  return visibleFields.length > 0 && visibleFields[0].isLabelField();
}

/**
 * Returns whether an input's list of visible fields ends with a FieldLabel
 *
 * @param input the input to be evaluated
 * @returns a boolean indicating whether the input's last visible field is of
 * type FieldLabel
 */
function endsWithFieldLabel(input: Input): boolean {
  // Values and statements never have a label at the end of the input.
  if (input.type === inputTypes.VALUE || input.type === inputTypes.STATEMENT) {
    return false;
  }
  const visibleFields = input.fieldRow.filter((field) => field.isVisible());
  return (
    visibleFields.length > 0 &&
    visibleFields[visibleFields.length - 1].isLabelField()
  );
}

/**
 * Returns whether the current input is the end of a visual "row"
 *
 * @param current the input of which to evaluate the end-of-row status
 * @param next the next input on the block after "current"
 * @returns a boolean representation of whether "current" is the end of a row
 */
function isEndOfRow(current: Input, next: Input): boolean {
  const precedingStatementInput =
    current.connection?.type === ConnectionType.NEXT_STATEMENT ||
    current.type === inputTypes.END_ROW;

  return (
    !current.getSourceBlock().getInputsInline() ||
    next.connection?.type === ConnectionType.NEXT_STATEMENT ||
    precedingStatementInput
  );
}

/**
 * Returns a subset of derived labels for inputs on the given block, ending at
 * the specified input. Used to disambiguate move targets and connection
 * highlights when no custom label is set.
 *
 * The subset is determined based on the input type:
 * - For non-statement inputs, only the label for the given input is returned.
 * - For statement inputs, labels are collected from the start of the current
 *   statement section up to and including the given input. A statement section
 *   begins immediately after the previous statement input, or at the start of
 *   the block if none exists.
 *
 * Label resolution (see also {@link computeMoveConnectionLabel}):
 * 1. Custom labels ({@link Input.getAriaLabelText}) are handled by callers, not here.
 * 2. Derived labels from {@link Input.getLabel} (field row + child blocks).
 * 3. Numbered fallback ({@link Msg.INPUT_LABEL_INDEX}) when tier 2 is empty.
 *    For the statement target input, the fallback is omitted if any earlier
 *    input in the subset already produced a label.
 *
 * @internal
 * @param block The block to retrieve a list of field/input labels for.
 * @param endInput The input that defines the end of the subset.
 * @param includeEndInputChildren Whether to include labels for child blocks
 *    connected to the end input.
 * @returns A list of field/input labels for the given block.
 */
export function getInputLabelsSubset(
  block: BlockSvg,
  endInput: Input,
  includeEndInputChildren: boolean,
): string[] {
  const inputIndex = block.inputList.indexOf(endInput);
  if (inputIndex === -1) {
    throw new Error(
      `Input with name "${endInput.name}" not found on block with id "${block.id}".`,
    );
  }
  const isStatementTarget = endInput.type === inputTypes.STATEMENT;

  const startIndex = isStatementTarget
    ? findStartOfStatementSection(block.inputList, inputIndex)
    : inputIndex;

  // For statement inputs, we include all visible inputs from the start
  // of the current statement section up to and including the target input.
  // For non-statement inputs, this will just be the target input itself.
  const inputsInSubset = block.inputList
    .slice(startIndex, inputIndex + 1)
    .filter((subsetInput) => subsetInput.isVisible());

  // The derived labels are based on the field row and any connected child
  // blocks. Labels for child blocks are potentially skipped if they would be
  // redundant within the overall block label.
  const derivedLabels = inputsInSubset.map((subsetInput) =>
    subsetInput.getLabel(
      Verbosity.TERSE,
      subsetInput !== endInput || includeEndInputChildren,
    ),
  );

  // For statement inputs, we only include the fallback label ("input %1")
  // for the target input if no preceding input in the subset has a label.
  // This prevents, e.g., "else" statement inputs from being read as "else, input 2".
  const precedingLabelsProvideContext =
    isStatementTarget && derivedLabels.slice(0, -1).some((label) => !!label);

  return derivedLabels
    .map((label, index) => {
      if (label) {
        return label;
      }
      const subsetInput = inputsInSubset[index];
      // Dummy and end-row inputs are not connection inputs; getIndex() is -1
      // and would produce a misleading "input 0" fallback label.
      if (
        subsetInput.type === inputTypes.DUMMY ||
        subsetInput.type === inputTypes.END_ROW
      ) {
        return undefined;
      }
      const isStatementTargetInput =
        isStatementTarget && index === derivedLabels.length - 1;
      if (isStatementTargetInput && precedingLabelsProvideContext) {
        return undefined;
      }
      return Msg['INPUT_LABEL_INDEX'].replace(
        '%1',
        (subsetInput.getIndex() + 1).toString(),
      );
    })
    .filter((label) => label !== undefined);
}

/**
 * Finds the starting index of the current statement section within a list of inputs.
 *
 * A statement section is defined as the group of inputs that follow the most
 * recent preceding statement input. If no prior statement input exists, the
 * section starts at index 0.
 *
 * @param inputs The list of inputs to search.
 * @param fromIndex The index of the current statement input.
 * @returns The index of the first input in the current statement section.
 */
function findStartOfStatementSection(
  inputs: Input[],
  fromIndex: number,
): number {
  // Find the first input after the previous statement input.
  for (let i = fromIndex - 1; i >= 0; i--) {
    if (inputs[i].type === inputTypes.STATEMENT) {
      return i + 1;
    }
  }
  return 0;
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
 * Returns the appropriate translated announcement template based on the connection type.
 *
 * @param preposition The relationship between the local and neighbour connections.
 * @returns A translated string template to use for announcing a block move.
 */
function getAnnouncementTemplate(preposition: ConnectionPreposition): string {
  switch (preposition) {
    case ConnectionPreposition.BEFORE:
      return Msg['ANNOUNCE_MOVE_BEFORE'];
    case ConnectionPreposition.AFTER:
      return Msg['ANNOUNCE_MOVE_AFTER'];
    case ConnectionPreposition.INSIDE:
      return Msg['ANNOUNCE_MOVE_INSIDE'];
    case ConnectionPreposition.AROUND:
      return Msg['ANNOUNCE_MOVE_AROUND'];
    default:
      return Msg['ANNOUNCE_MOVE_TO'];
  }
}

/**
 * Returns a label for a connection that includes either a block label, input
 * label, or both.
 *
 * Input label resolution:
 * 1. Custom label from {@link Input.getAriaLabelText} when set.
 * 2. Otherwise derived labels from {@link getInputLabelsSubset} (field row,
 *    child blocks, and numbered fallbacks as needed).
 *
 * @param conn The connection to generate a label for.
 * @param baseLabel An optional block label to include in the returned string.
 * @returns A label describing the given connection
 */
function computeMoveConnectionLabel(
  conn: RenderedConnection,
  baseLabel: string,
): string {
  const input = conn.getParentInput();
  if (!input) return baseLabel;

  let inputLabel = input.getAriaLabelText();

  if (!inputLabel) {
    const labels = getInputLabelsSubset(conn.getSourceBlock(), input, true);
    if (!labels.length) return baseLabel;

    inputLabel = labels.join(', ');
  }

  return baseLabel
    ? Msg['ANNOUNCE_MOVE_OF'].replace('%1', inputLabel).replace('%2', baseLabel)
    : inputLabel;
}

/**
 * Returns a translated string describing an in-progress move of a block to a new
 * connection, suitable for announcement on the ARIA live region. The returned string
 * will be assembled based on the types of the local and neighbour connections and
 * the presence of any readable fields on the block's inputs. If multiple potential
 * candidate connections are present, additional context will be included in the
 * returned string to help disambiguate between them.
 *
 * @param local The moving side of the candidate connection pair
 * @param neighbour The target side of the candidate connection pair
 * @param disambiguationPolicy A function that determines whether it's useful to
 *     include parent input labels for disambiguation.
 * @param isMoveStart Whether this announcement is for the start of a move. If false,
 *     skip announcing the block label since it should have already been announced.
 */
export function computeMoveLabel(
  local: RenderedConnection,
  neighbour: RenderedConnection,
  disambiguationPolicy: (forLocal: boolean) => boolean,
  isMoveStart = false,
): string {
  const preposition = getConnectionPreposition(local, neighbour);
  const template = getAnnouncementTemplate(preposition);

  const needsDisambiguation = ![
    ConnectionPreposition.BEFORE,
    ConnectionPreposition.AFTER,
  ].includes(preposition);

  const includeLocalContext = needsDisambiguation && disambiguationPolicy(true);
  const includeNeighbourContext =
    needsDisambiguation && disambiguationPolicy(false);

  let blockLabel = isMoveStart
    ? local.getSourceBlock().getStackBlocksCountLabel()
    : '';
  let neighbourLabel = neighbour.getSourceBlock().getAriaLabel(Verbosity.TERSE);

  if (includeLocalContext) {
    blockLabel = computeMoveConnectionLabel(local, blockLabel);
  }
  if (includeNeighbourContext) {
    neighbourLabel = computeMoveConnectionLabel(neighbour, neighbourLabel);
  }

  return template.replace('%1', blockLabel).replace('%2', neighbourLabel);
}

/**
 * Returns the appropriate preposition to use in the move announcement based on the
 * relationship between the local and neighbour connections.
 */
function getConnectionPreposition(
  local: RenderedConnection,
  neighbour: RenderedConnection,
): ConnectionPreposition {
  switch (local.type) {
    case ConnectionType.INPUT_VALUE:
    case ConnectionType.OUTPUT_VALUE:
      return ConnectionPreposition.TO;
    case ConnectionType.NEXT_STATEMENT:
      if (local === local.getSourceBlock().nextConnection) {
        return ConnectionPreposition.BEFORE;
      } else {
        return ConnectionPreposition.AROUND;
      }
    case ConnectionType.PREVIOUS_STATEMENT:
      if (neighbour === neighbour.getSourceBlock().nextConnection) {
        return ConnectionPreposition.AFTER;
      } else {
        return ConnectionPreposition.INSIDE;
      }
  }
  // Not normally reachable since all valid connection types are covered.
  // Satisfies the return type.
  return ConnectionPreposition.UNKNOWN;
}

/**
 * Returns a label indicating that the block is disabled.
 *
 * @internal
 * @param block The block to generate a label for.
 * @returns A label indicating that the block is disabled (if it is), otherwise
 *     undefined.
 */
function getDisabledLabel(block: BlockSvg) {
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
  const branchCount = block.inputList.filter(
    (input) => input.type === inputTypes.STATEMENT,
  ).length;

  if (branchCount > 1) {
    return Msg['BLOCK_LABEL_HAS_BRANCHES'].replace(
      '%1',
      branchCount.toString(),
    );
  }
  const valueInputCount = block.inputList.reduce((totalSum, input) => {
    return (
      input.fieldRow.reduce((fieldCount, field) => {
        return field.EDITABLE && !field.isFullBlockField()
          ? ++fieldCount
          : fieldCount;
      }, totalSum) +
      (input.connection?.type === ConnectionType.INPUT_VALUE ? 1 : 0)
    );
  }, 0);

  switch (valueInputCount) {
    case 0:
      return undefined;
    case 1:
      return Msg['BLOCK_LABEL_HAS_INPUT'];
    default:
      return Msg['BLOCK_LABEL_HAS_INPUTS'];
  }
}
