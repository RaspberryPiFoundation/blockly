/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.Extensions

import type {Block} from './block.js';
import type {BlockSvg} from './block_svg.js';
import {FieldDropdown} from './field_dropdown.js';
import {MutatorIcon} from './icons/mutator_icon.js';
import * as parsing from './utils/parsing.js';

/** The set of all registered extensions, keyed by extension name/id. */
const allExtensions = Object.create(null);
export const TEST_ONLY = {allExtensions};

/**
 * Registers a new extension function. Extensions are functions that help
 * initialize blocks, usually adding dynamic behavior such as onchange
 * handlers and mutators. These are applied using Block.applyExtension(), or
 * the JSON "extensions" array attribute.
 *
 * @param name The name of this extension.
 * @param initFn The function to initialize an extended block.
 * @throws {Error} if the extension name is empty, the extension is already
 *     registered, or extensionFn is not a function.
 */
export function register<T extends Block>(
  name: string,
  initFn: (this: T) => void,
) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw Error('Error: Invalid extension name "' + name + '"');
  }
  if (allExtensions[name]) {
    throw Error('Error: Extension "' + name + '" is already registered.');
  }
  if (typeof initFn !== 'function') {
    throw Error('Error: Extension "' + name + '" must be a function');
  }
  allExtensions[name] = initFn;
}

/**
 * Registers a new extension function that adds all key/value of mixinObj.
 *
 * @param name The name of this extension.
 * @param mixinObj The values to mix in.
 * @throws {Error} if the extension name is empty or the extension is already
 *     registered.
 */
export function registerMixin(name: string, mixinObj: AnyDuringMigration) {
  if (!mixinObj || typeof mixinObj !== 'object') {
    throw Error('Error: Mixin "' + name + '" must be a object');
  }
  register(name, function (this: Block) {
    this.mixin(mixinObj);
  });
}

/**
 * Registers a new extension function that adds a mutator to the block.
 * At register time this performs some basic sanity checks on the mutator.
 * The wrapper may also add a mutator dialog to the block, if both compose and
 * decompose are defined on the mixin.
 *
 * @param name The name of this mutator extension.
 * @param mixinObj The values to mix in.
 * @param opt_helperFn An optional function to apply after mixing in the object.
 * @param opt_blockList A list of blocks to appear in the flyout of the mutator
 *     dialog.
 * @throws {Error} if the mutation is invalid or can't be applied to the block.
 */
export function registerMutator(
  name: string,
  mixinObj: AnyDuringMigration,
  opt_helperFn?: () => AnyDuringMigration,
  opt_blockList?: string[],
) {
  const errorPrefix = 'Error when registering mutator "' + name + '": ';

  checkHasMutatorProperties(errorPrefix, mixinObj);
  const hasMutatorDialog = checkMutatorDialog(mixinObj, errorPrefix);

  if (opt_helperFn && typeof opt_helperFn !== 'function') {
    throw Error(errorPrefix + 'Extension "' + name + '" is not a function');
  }

  // Sanity checks passed.
  register(name, function (this: Block) {
    if (hasMutatorDialog) {
      this.setMutator(new MutatorIcon(opt_blockList || [], this as BlockSvg));
    }
    // Mixin the object.
    this.mixin(mixinObj);

    if (opt_helperFn) {
      opt_helperFn.apply(this);
    }
  });
}

/**
 * Unregisters the extension registered with the given name.
 *
 * @param name The name of the extension to unregister.
 */
export function unregister(name: string) {
  if (isRegistered(name)) {
    delete allExtensions[name];
  } else {
    console.warn(
      'No extension mapping for name "' + name + '" found to unregister',
    );
  }
}

/**
 * Returns whether an extension is registered with the given name.
 *
 * @param name The name of the extension to check for.
 * @returns True if the extension is registered.  False if it is not registered.
 */
export function isRegistered(name: string): boolean {
  return !!allExtensions[name];
}

/**
 * Applies an extension method to a block. This should only be called during
 * block construction.
 *
 * @param name The name of the extension.
 * @param block The block to apply the named extension to.
 * @param isMutator True if this extension defines a mutator.
 * @throws {Error} if the extension is not found.
 */
export function apply(name: string, block: Block, isMutator: boolean) {
  const extensionFn = allExtensions[name];
  if (typeof extensionFn !== 'function') {
    throw Error('Error: Extension "' + name + '" not found.');
  }
  let mutatorProperties;
  if (isMutator) {
    // Fail early if the block already has mutation properties.
    checkNoMutatorProperties(name, block);
  } else {
    // Record the old properties so we can make sure they don't change after
    // applying the extension.
    mutatorProperties = getMutatorProperties(block);
  }
  extensionFn.apply(block);

  if (isMutator) {
    const errorPrefix = 'Error after applying mutator "' + name + '": ';
    checkHasMutatorProperties(errorPrefix, block);
  } else {
    if (
      !mutatorPropertiesMatch(mutatorProperties as AnyDuringMigration[], block)
    ) {
      throw Error(
        'Error when applying extension "' +
          name +
          '": ' +
          'mutation properties changed when applying a non-mutator extension.',
      );
    }
  }
}

/**
 * Check that the given block does not have any of the four mutator properties
 * defined on it.  This function should be called before applying a mutator
 * extension to a block, to make sure we are not overwriting properties.
 *
 * @param mutationName The name of the mutation to reference in error messages.
 * @param block The block to check.
 * @throws {Error} if any of the properties already exist on the block.
 */
function checkNoMutatorProperties(mutationName: string, block: Block) {
  const properties = getMutatorProperties(block);
  if (properties.length) {
    throw Error(
      'Error: tried to apply mutation "' +
        mutationName +
        '" to a block that already has mutator functions.' +
        '  Block id: ' +
        block.id,
    );
  }
}

/**
 * Checks if the given object has both the 'mutationToDom' and 'domToMutation'
 * functions.
 *
 * @param object The object to check.
 * @param errorPrefix The string to prepend to any error message.
 * @returns True if the object has both functions.  False if it has neither
 *     function.
 * @throws {Error} if the object has only one of the functions, or either is not
 *     actually a function.
 */
function checkXmlHooks(
  object: AnyDuringMigration,
  errorPrefix: string,
): boolean {
  return checkHasFunctionPair(
    object.mutationToDom,
    object.domToMutation,
    errorPrefix + ' mutationToDom/domToMutation',
  );
}
/**
 * Checks if the given object has both the 'saveExtraState' and 'loadExtraState'
 * functions.
 *
 * @param object The object to check.
 * @param errorPrefix The string to prepend to any error message.
 * @returns True if the object has both functions.  False if it has neither
 *     function.
 * @throws {Error} if the object has only one of the functions, or either is not
 *     actually a function.
 */
function checkJsonHooks(
  object: AnyDuringMigration,
  errorPrefix: string,
): boolean {
  return checkHasFunctionPair(
    object.saveExtraState,
    object.loadExtraState,
    errorPrefix + ' saveExtraState/loadExtraState',
  );
}

/**
 * Checks if the given object has both the 'compose' and 'decompose' functions.
 *
 * @param object The object to check.
 * @param errorPrefix The string to prepend to any error message.
 * @returns True if the object has both functions.  False if it has neither
 *     function.
 * @throws {Error} if the object has only one of the functions, or either is not
 *     actually a function.
 */
function checkMutatorDialog(
  object: AnyDuringMigration,
  errorPrefix: string,
): boolean {
  return checkHasFunctionPair(
    object.compose,
    object.decompose,
    errorPrefix + ' compose/decompose',
  );
}

/**
 * Checks that both or neither of the given functions exist and that they are
 * indeed functions.
 *
 * @param func1 The first function in the pair.
 * @param func2 The second function in the pair.
 * @param errorPrefix The string to prepend to any error message.
 * @returns True if the object has both functions.  False if it has neither
 *     function.
 * @throws {Error} If the object has only one of the functions, or either is not
 *     actually a function.
 */
function checkHasFunctionPair(
  func1: AnyDuringMigration,
  func2: AnyDuringMigration,
  errorPrefix: string,
): boolean {
  if (func1 && func2) {
    if (typeof func1 !== 'function' || typeof func2 !== 'function') {
      throw Error(errorPrefix + ' must be a function');
    }
    return true;
  } else if (!func1 && !func2) {
    return false;
  }
  throw Error(errorPrefix + 'Must have both or neither functions');
}

/**
 * Checks that the given object required mutator properties.
 *
 * @param errorPrefix The string to prepend to any error message.
 * @param object The object to inspect.
 */
function checkHasMutatorProperties(
  errorPrefix: string,
  object: AnyDuringMigration,
) {
  const hasXmlHooks = checkXmlHooks(object, errorPrefix);
  const hasJsonHooks = checkJsonHooks(object, errorPrefix);
  if (!hasXmlHooks && !hasJsonHooks) {
    throw Error(
      errorPrefix +
        'Mutations must contain either XML hooks, or JSON hooks, or both',
    );
  }
  // A block with a mutator isn't required to have a mutation dialog, but
  // it should still have both or neither of compose and decompose.
  checkMutatorDialog(object, errorPrefix);
}

/**
 * Get a list of values of mutator properties on the given block.
 *
 * @param block The block to inspect.
 * @returns A list with all of the defined properties, which should be
 *     functions, but may be anything other than undefined.
 */
function getMutatorProperties(block: Block): AnyDuringMigration[] {
  const result = [];
  // List each function explicitly by reference to allow for renaming
  // during compilation.
  if (block.domToMutation !== undefined) {
    result.push(block.domToMutation);
  }
  if (block.mutationToDom !== undefined) {
    result.push(block.mutationToDom);
  }
  if (block.saveExtraState !== undefined) {
    result.push(block.saveExtraState);
  }
  if (block.loadExtraState !== undefined) {
    result.push(block.loadExtraState);
  }
  if (block.compose !== undefined) {
    result.push(block.compose);
  }
  if (block.decompose !== undefined) {
    result.push(block.decompose);
  }
  return result;
}

/**
 * Check that the current mutator properties match a list of old mutator
 * properties.  This should be called after applying a non-mutator extension,
 * to verify that the extension didn't change properties it shouldn't.
 *
 * @param oldProperties The old values to compare to.
 * @param block The block to inspect for new values.
 * @returns True if the property lists match.
 */
function mutatorPropertiesMatch(
  oldProperties: AnyDuringMigration[],
  block: Block,
): boolean {
  const newProperties = getMutatorProperties(block);
  if (newProperties.length !== oldProperties.length) {
    return false;
  }
  for (let i = 0; i < newProperties.length; i++) {
    if (oldProperties[i] !== newProperties[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Calls a function after the page has loaded, possibly immediately.
 *
 * @param fn Function to run.
 * @throws Error Will throw if no global document can be found (e.g., Node.js).
 * @internal
 */
export function runAfterPageLoad(fn: () => void) {
  if (typeof document !== 'object') {
    throw Error('runAfterPageLoad() requires browser document.');
  }
  if (document.readyState === 'complete') {
    fn(); // Page has already loaded. Call immediately.
  } else {
    // Poll readyState.
    const readyStateCheckInterval = setInterval(function () {
      if (document.readyState === 'complete') {
        clearInterval(readyStateCheckInterval);
        fn();
      }
    }, 10);
  }
}

/**
 * Builds an extension function that will map a dropdown value to a tooltip
 * string.
 *
 * @param dropdownName The name of the field whose value is the key to the
 *     lookup table.
 * @param lookupTable The table of field values to tooltip text.
 * @returns The extension function.
 */
export function buildTooltipForDropdown(
  dropdownName: string,
  lookupTable: {[key: string]: string},
): (this: Block) => void {
  // List of block types already validated, to minimize duplicate warnings.
  const blockTypesChecked: string[] = [];

  return function (this: Block) {
    if (!blockTypesChecked.includes(this.type)) {
      checkDropdownOptionsInTable(this, dropdownName, lookupTable);
      blockTypesChecked.push(this.type);
    }

    this.setTooltip(
      function (this: Block) {
        const value = String(this.getFieldValue(dropdownName));
        return parsing.replaceMessageReferences(lookupTable[value]);
      }.bind(this),
    );
  };
}

/**
 * Checks all options keys are present in the provided string lookup table.
 * Emits console warnings when they are not.
 *
 * @param block The block containing the dropdown
 * @param dropdownName The name of the dropdown
 * @param lookupTable The string lookup table
 */
function checkDropdownOptionsInTable(
  block: Block,
  dropdownName: string,
  lookupTable: {[key: string]: string},
) {
  const dropdown = block.getField(dropdownName);
  if (!(dropdown instanceof FieldDropdown) || dropdown.isOptionListDynamic()) {
    return;
  }

  const options = dropdown.getOptions();
  for (const option of options) {
    if (option === FieldDropdown.SEPARATOR) continue;

    const [, key] = option;
    if (lookupTable[key] === undefined) {
      console.warn(
        `No tooltip mapping for value ${key} of field ` +
          `${dropdownName} of block type ${block.type}.`,
      );
    }
  }
}

/**
 * Builds an extension function that will install a dynamic tooltip. The
 * tooltip message should include the string '%1' and that string will be
 * replaced with the text of the named field.
 *
 * @param msgTemplate The template form to of the message text, with %1
 *     placeholder.
 * @param fieldName The field with the replacement text.
 * @returns The extension function.
 */
export function buildTooltipWithFieldText(
  msgTemplate: string,
  fieldName: string,
): (this: Block) => void {
  return function (this: Block) {
    this.setTooltip(
      function (this: Block) {
        const field = this.getField(fieldName);
        return parsing
          .replaceMessageReferences(msgTemplate)
          .replace('%1', field ? field.getText() : '');
      }.bind(this),
    );
  };
}

/**
 * Configures the tooltip to mimic the parent block when connected. Otherwise,
 * uses the tooltip text at the time this extension is initialized. This takes
 * advantage of the fact that all other values from JSON are initialized before
 * extensions.
 */
function extensionParentTooltip(this: Block) {
  const tooltipWhenNotConnected = this.tooltip;
  this.setTooltip(
    function (this: Block) {
      const parent = this.getParent();
      return (
        (parent && parent.getInputsInline() && parent.tooltip) ||
        tooltipWhenNotConnected
      );
    }.bind(this),
  );
}
register('parent_tooltip_when_inline', extensionParentTooltip);
