/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A Blockly dropdown menu field where the options can change
 * depending on the value of another field.
 */

import * as Blockly from 'blockly/core';
import {DependentDropdownOptionsChange} from './dependent_dropdown_options_change';

/** The type of the mapping from parent value to child options. */
export interface ChildOptionMapping {
  [key: string]: Blockly.MenuOption[];
}

// This type isn't exported from Blockly so we have to derive it from the API.
type FieldConfig = Exclude<
  ConstructorParameters<typeof Blockly.Field>[2],
  undefined
>;

/** fromJson config for a dependent dropdown field. */
export interface FieldDependentDropdownFromJsonConfig extends FieldConfig {
  parentName: string;
  optionMapping: ChildOptionMapping;
  defaultOptions?: Blockly.MenuOption[];
}

/**
 * A structure for managing data needed by the menu generator of a
 * FieldDependentDropdown.
 */
interface DependencyData {
  /**
   * A reference to the parent field of an associated dependent dropdown. Absent
   * until the parent field is initialized. This field's value determines the
   * available options of the child field.
   */
  parentField?: Blockly.Field<string>;

  /**
   * The child field's currently available menu options based on the current
   * value of the parent field. Absent until the parent field is initialized.
   */
  derivedOptions?: Blockly.MenuOption[];
}

/**
 * A dropdown field that automatically updates its own options based on a
 * mapping from a parent field's value. The parent field must be attached to the
 * block before this child field.
 *
 * When this field is attached to a block, it will find the parent field and
 * attach a validator to the parent field that intercepts changes to its value
 * to update the options on this field. If the new validator is later removed\
 * or replaced, then this dependent field will no longer function.
 */
export class FieldDependentDropdown extends Blockly.FieldDropdown {
  /**
   * Contains data used by this dropdown field's menu generator.
   *
   * The menu generator cannot refer directly to this FieldDependentDropdown
   * instance, because it must be created before calling the super constructor
   * when the "this" reference is not yet valid. This helper structure is used
   * instead.
   *
   * This is public so that the DependentDropdownOptionsChangeJson event can
   * update it while undoing/redoing.
   */
  dependencyData: DependencyData;

  /** The name of the field that determines this field's options. */
  private parentName: string;

  /**
   * The mapping from the parent field's value to this field's intended
   * available options. The keys are strings representing the parent's possible
   * values, and the values are the corresponding options to use in this child
   * field.
   */
  private optionMapping: ChildOptionMapping;

  /**
   * An optional fallback set of options to use if the parent field's value does
   * not match any of the keys in optionMapping.
   */
  private defaultOptions?: Blockly.MenuOption[];

  /**
   * Constructs a new FieldDependentDropdown.
   *
   * @param parentName The name of the parent field whose value determines this
   *    field's available options.
   * @param optionMapping A mapping from the possible values of the parent field
   *    to the corresponding available options of this child field. The keys are
   *    the possible values of the parent field, and the values are the
   *    corresponding arrays of options for this child field.
   * @param defaultOptions An optional fallback set of options to use if the
   *    parent field's value does not match any of the keys in optionMapping.
   * @param validator An optional function that is called to validate changes to
   *    this field's value.
   * @param config An optional map of general options used to configure the
   *    field, such as a tooltip.
   */
  constructor(
    parentName: string,
    optionMapping: ChildOptionMapping,
    defaultOptions?: Blockly.MenuOption[],
    validator?: Blockly.FieldValidator,
    config?: FieldConfig,
  ) {
    // A menu generator needs to be passed to the super constructor, but it
    // needs to be able to reference data that hasn't been populated yet. We're
    // not allowed to refer to "this" in this constructor before calling
    // "super", so let's make separate structure to hold data relevant to the
    // menu generator and populate that later.
    const dependencyData: DependencyData = {};

    // A menu option generator function for this child field that reads the
    // derived options in the dependency data if available.
    const menuGenerator: Blockly.MenuGeneratorFunction = () => {
      // If derivedOptions has been initialized, use that.
      if (dependencyData.derivedOptions) {
        return dependencyData.derivedOptions;
      }

      // Fall back on the options corresponding to the parent field's current
      // value (which is fine when initializing but may be out of date when
      // making changes since the parent field's validator function triggers
      // this function before the parent field's value is updated).

      // If the parent field exists, and its value is a key in the provided
      // option mapping, use the corresponding options.
      if (dependencyData.parentField) {
        const value = dependencyData.parentField.getValue();
        if (value) {
          const options = optionMapping[value];
          if (options) {
            return options;
          }
        }
      }

      if (defaultOptions) {
        return defaultOptions;
      }

      // Fall back on basic default options.
      return [['', '']];
    };

    super(menuGenerator, validator, config);
    this.parentName = parentName;
    this.optionMapping = optionMapping;
    this.defaultOptions = defaultOptions;
    this.dependencyData = dependencyData;
  }

  /**
   * Constructs a FieldDependentDropdown from a JSON arg object.
   *
   * @param options A JSON object providing "parentName" and "optionMapping".
   * @returns The new field instance.
   */
  static fromJson(
    options: FieldDependentDropdownFromJsonConfig,
  ): FieldDependentDropdown {
    return new FieldDependentDropdown(
      options['parentName'],
      options['optionMapping'],
      options['defaultOptions'],
      undefined,
      options,
    );
  }

  /**
   * Attach this field to a block.
   *
   * @param block The block containing this field.
   */
  setSourceBlock(block: Blockly.Block) {
    super.setSourceBlock(block);

    const parentField: Blockly.Field<string> | null = block.getField(
      this.parentName,
    );

    if (!parentField) {
      throw new Error(
        'Could not find a parent field with the name ' +
          this.parentName +
          ' for the dependent dropdown.',
      );
    }

    this.dependencyData.parentField = parentField;

    const oldValidator = parentField.getValidator();

    // A validator function for the parent field that has the side effect of
    // updating the options of this child dropdown field based on the new value
    // of the parent field whenever it changes. The validator function is a good
    // place to do this because it is called immediately while deserializing
    // workspaces before the following fields are deserialized, so when the
    // child value is deserialized the appropriate options will already be
    // available. If the parent already had a validator function, it will be
    // composed with this one and the new value returned from it will be the
    // basis for determining the new available options.
    parentField.setValidator((newValue) => {
      if (oldValidator) {
        const validatedValue = oldValidator(newValue);
        // If a validator returns null, that means the new value is invalid and
        // the change should be canceled.
        if (validatedValue === null) {
          return null;
        }
        // If a validator returns undefined, that means no change. Otherwise,
        // use the returned value as the new value.
        if (validatedValue !== undefined) {
          newValue = validatedValue;
        }
      }
      this.updateOptionsBasedOnNewValue(newValue);
      return newValue;
    });
    this.updateOptionsBasedOnNewValue(parentField.getValue() ?? undefined);
  }

  /**
   * Updates the options of this child dropdown field based on the new value of
   * the parent field.
   *
   * @param newValue The newly assigned value.
   */
  private updateOptionsBasedOnNewValue(newValue: string | undefined): void {
    if (newValue == undefined) {
      return;
    }

    const block = this.getSourceBlock();
    if (!block) {
      throw new Error(
        'Could not validate a field that is not attached to a block: ' +
          this.name,
      );
    }

    const oldChildValue = this.getValue();
    const oldChildOptions = this.getOptions(false);
    let newChildOptions = this.optionMapping[newValue];
    if (!newChildOptions) {
      if (this.defaultOptions) {
        newChildOptions = this.defaultOptions;
      } else {
        console.warn(
          'Could not find child options for the parent value: ' + newValue,
        );
        return;
      }
    }

    // If the child field's value is still available in the new options, keep
    // it, otherwise change the field's value to the first available option.
    const newOptionsIncludeOldValue =
      newChildOptions.find((option) => option[1] == oldChildValue) != undefined;
    const newChildValue = newOptionsIncludeOldValue
      ? oldChildValue
      : newChildOptions[0][1];

    // Record the options so that the option generator can access them.
    this.dependencyData.derivedOptions = newChildOptions;

    // Re-run the option generator to update the options on the dropdown.
    this.getOptions(false);

    // Update this child field's value without broadcasting the normal change
    // event. The normal value change event can't be properly undone, because
    // the old value may not be one of the currently valid options, so a custom
    // change event will be broadcast instead that handles swapping the options
    // and the value at the same time.
    Blockly.Events.disable();
    this.setValue(newChildValue);
    Blockly.Events.enable();

    if (Blockly.Events.getRecordUndo()) {
      if (!Blockly.Events.getGroup()) {
        // Start a change group before the change event. The change event for
        // the parent field value will be created after this function returns
        // and will be part of the same group.
        Blockly.Events.setGroup(true);
        // Clear the change group later, after all related events have been
        // broadcast, but before the user performs any more actions.
        setTimeout(() => Blockly.Events.setGroup(false));
      }

      // Record that the child field's options and value have changed.
      Blockly.Events.fire(
        new DependentDropdownOptionsChange(
          block,
          this.name,
          oldChildValue ?? undefined,
          newChildValue ?? undefined,
          oldChildOptions,
          newChildOptions,
        ),
      );
    }
  }
}

Blockly.fieldRegistry.register(
  'field_dependent_dropdown',
  FieldDependentDropdown,
);
