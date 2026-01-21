/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.fieldRegistry

import type {Field, FieldConfig} from './field.js';
import * as registry from './registry.js';

/**
 * When constructing a field from JSON using the registry, the
 * `fromJson` method in this file is called with an options parameter
 * object consisting of the "type" which is the name of the field, and
 * other options that are part of the field's config object.
 *
 * These options are then passed to the field's static `fromJson`
 * method. That method accepts an options parameter with a type that usually
 * extends from FieldConfig, and may or may not have a "type" attribute (in
 * fact, it shouldn't, because we'd overwrite it as described above!)
 *
 * Unfortunately the registry has no way of knowing the actual Field subclass
 * that will be returned from passing in the name of the field. Therefore it
 * also has no way of knowing that the options object not only implements
 * `FieldConfig`, but it also should satisfy the Config that belongs to that
 * specific class's `fromJson` method.
 *
 * Because of this uncertainty, we just give up on type checking the properties
 * passed to the `fromJson` method, and allow arbitrary string keys with
 * unknown types.
 */
type RegistryOptions = FieldConfig & {
  // The name of the field, e.g. field_dropdown
  type: string;
  [key: string]: unknown;
};

/**
 * Represents the static methods that must be defined on any
 * field that is registered, i.e. the constructor and fromJson methods.
 *
 * Because we don't know which Field subclass will be registered, we
 * are unable to typecheck the parameters of the constructor.
 */
export interface RegistrableField {
  new (...args: any[]): Field;
  fromJson(options: FieldConfig): Field;
}

/**
 * Registers a field type.
 * fieldRegistry.fromJson uses this registry to
 * find the appropriate field type.
 *
 * @param type The field type name as used in the JSON definition.
 * @param fieldClass The field class containing a fromJson function that can
 *     construct an instance of the field.
 * @throws {Error} if the type name is empty or the fieldClass is not an object
 *     containing a fromJson function.
 */
export function register(type: string, fieldClass: RegistrableField) {
  registry.register(registry.Type.FIELD, type, fieldClass, true);
}

/**
 * Unregisters the field registered with the given type.
 *
 * @param type The field type name as used in the JSON definition.
 */
export function unregister(type: string) {
  registry.unregister(registry.Type.FIELD, type);
}

/**
 * Construct a Field from a JSON arg object.
 * Finds the appropriate registered field by the type name as registered using
 * fieldRegistry.register.
 *
 * @param options A JSON object with a type and options specific to the field
 *     type.
 * @returns The new field instance or null if a field wasn't found with the
 *     given type name
 * @internal
 */
export function fromJson<T>(options: RegistryOptions): Field<T> | null {
  return TEST_ONLY.fromJsonInternal(options);
}

/**
 * Private version of fromJson for stubbing in tests.
 *
 * @param options
 */
function fromJsonInternal<T>(options: RegistryOptions): Field<T> | null {
  const fieldObject = registry.getObject(
    registry.Type.FIELD,
    options.type,
  ) as unknown as RegistrableField;
  if (!fieldObject) {
    console.warn(
      'Blockly could not create a field of type ' +
        options['type'] +
        '. The field is probably not being registered. This could be because' +
        ' the file is not loaded, the field does not register itself (Issue' +
        ' #1584), or the registration is not being reached.',
    );
    return null;
  }
  return fieldObject.fromJson(options);
}

export const TEST_ONLY = {
  fromJsonInternal,
};
