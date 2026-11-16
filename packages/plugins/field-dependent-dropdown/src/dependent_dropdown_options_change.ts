/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview An event representing when a dependent dropdown field changes
 * state.
 */

import * as Blockly from 'blockly/core';
import type {FieldDependentDropdown} from './field_dependent_dropdown';

/**
 * A deep equality comparison between the two provided arrays recursively
 * comparing any child elements that are also arrays.
 *
 * @param a The first array to compare.
 * @param b The second array to compare.
 * @returns Whether the arrays are deeply equivalent.
 */
function arraysAreEquivalent<T>(a: T[], b: T[]): boolean {
  return (
    a.length === b.length &&
    a.every((aElement, index) => {
      const bElement = b[index];
      if (Array.isArray(aElement) && Array.isArray(bElement)) {
        return arraysAreEquivalent(aElement, bElement);
      }
      return aElement === bElement;
    })
  );
}

/** The structure of a serialized DependentDropdownOptionsChange. */
export interface DependentDropdownOptionsChangeJson
  extends Blockly.Events.BlockBaseJson {
  name: string;
  newValue: string;
  oldValue: string;
  oldOptions: Blockly.MenuOption[];
  newOptions: Blockly.MenuOption[];
}

/**
 * A change event representing a simultaneous change to a dropdown field's
 * options and value. The old value must be one of the old options, and the new
 * value must be one of the new options. Unlike a normal value change event,
 * it's possible for this event to change the value to something that wasn't
 * previously one of the valid options--in either direction--by also changing
 * the options at the same time.
 */
export class DependentDropdownOptionsChange extends Blockly.Events.BlockBase {
  /** The name to register with Blockly for the type of event. */

  static readonly EVENT_TYPE: string = 'dropdown_options_change';

  /** The name of the change event type for registering with Blockly. */
  readonly type = DependentDropdownOptionsChange.EVENT_TYPE;

  /** The name of the field that changed. */
  name?: string;

  /** The original value of the field. */
  oldValue?: string;

  /** The new value of the field. */
  newValue?: string;

  /** The original available options for the dropdown field. */
  oldOptions?: Blockly.MenuOption[];

  /** The new available options for the dropdown field. */
  newOptions?: Blockly.MenuOption[];

  /**
   * Construct a new DependentDropdownOptionsChange.
   *
   * @param block The changed block. Undefined for a blank event.
   * @param name Name of the field affected.
   * @param oldValue Previous value of field.
   * @param newValue New value of field.
   * @param oldOptions Previous options for the dropdown.
   * @param newOptions New options for the dropdown.
   */
  constructor(
    block?: Blockly.Block,
    name?: string,
    oldValue?: string,
    newValue?: string,
    oldOptions?: Blockly.MenuOption[],
    newOptions?: Blockly.MenuOption[],
  ) {
    super(block);

    if (
      !block ||
      !name ||
      !oldValue ||
      !newValue ||
      !oldOptions ||
      !newOptions
    ) {
      // Blank event to be populated by fromJson.
      return;
    }

    this.name = name;
    this.oldValue = oldValue;
    this.newValue = newValue;
    this.oldOptions = oldOptions;
    this.newOptions = newOptions;
  }

  /**
   * Encode the event as JSON.
   *
   * @returns JSON representation.
   */
  toJson(): DependentDropdownOptionsChangeJson {
    const json = super.toJson() as DependentDropdownOptionsChangeJson;
    if (
      !this.name ||
      !this.oldValue ||
      !this.newValue ||
      !this.oldOptions ||
      !this.newOptions
    ) {
      throw new Error(
        'The changed element is undefined. Either pass all needed ' +
          'parameters to the constructor, or call fromJson.',
      );
    }
    json['name'] = this.name;
    json['oldValue'] = this.oldValue;
    json['newValue'] = this.newValue;
    json['oldOptions'] = this.oldOptions;
    json['newOptions'] = this.newOptions;
    return json;
  }

  /**
   * Decode the JSON event.
   *
   * @param json JSON representation.
   * @param workspace
   * @param event
   * @returns The deserialized event.
   */
  static fromJson(
    json: DependentDropdownOptionsChangeJson,
    workspace: Blockly.Workspace,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    event?: any,
  ): DependentDropdownOptionsChange {
    const newEvent = super.fromJson(
      json,
      workspace,
      event,
    ) as DependentDropdownOptionsChange;
    newEvent.name = json['name'];
    newEvent.oldValue = json['oldValue'];
    newEvent.newValue = json['newValue'];
    newEvent.oldOptions = json['oldOptions'];
    newEvent.newOptions = json['newOptions'];
    return newEvent;
  }

  /**
   * Does this event leave all state as it was before?
   *
   * @returns False if something changed.
   */
  isNull(): boolean {
    const valuesAreEqual = this.oldValue === this.newValue;
    const optionsAreEquivalent =
      this.oldOptions === this.newOptions ||
      (Array.isArray(this.oldOptions) &&
        Array.isArray(this.newOptions) &&
        arraysAreEquivalent(this.oldOptions, this.newOptions));
    return valuesAreEqual && optionsAreEquivalent;
  }

  /**
   * Run a change event.
   *
   * @param forward True if run forward, false if run backward (undo).
   */
  run(forward: boolean): void {
    if (
      !this.blockId ||
      !this.name ||
      !this.oldValue ||
      !this.newValue ||
      !this.oldOptions ||
      !this.newOptions
    ) {
      console.warn("Can't run uninitialized event.");
      return;
    }
    const workspace = this.getEventWorkspace_();
    const block = workspace.getBlockById(this.blockId);
    if (!block) {
      console.warn("Can't change non-existent block: " + this.blockId);
      return;
    }

    const dropdown = block.getField(this.name) as FieldDependentDropdown;
    if (!dropdown) {
      console.warn("Can't change non-existent dropdown field: " + this.name);
      return;
    }

    const value = forward ? this.newValue : this.oldValue;
    const options = forward ? this.newOptions : this.oldOptions;

    // Record the options on the dropdown for the option generator to access.
    dropdown.dependencyData.derivedOptions = options;

    // Re-run the option generator to update the options on the dropdown.
    dropdown.getOptions(false);

    // Set the value to one of the now-available options.
    dropdown.setValue(value);
  }
}

Blockly.registry.register(
  Blockly.registry.Type.EVENT,
  DependentDropdownOptionsChange.EVENT_TYPE,
  DependentDropdownOptionsChange,
);
