/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {FieldCheckboxFromJsonConfig} from '../field_checkbox.js';
import {FieldDropdownFromJsonConfig} from '../field_dropdown';
import {FieldImageFromJsonConfig} from '../field_image';
import {FieldNumberFromJsonConfig} from '../field_number';
import {FieldTextInputFromJsonConfig} from '../field_textinput';
import {FieldVariableFromJsonConfig} from '../field_variable';

/**
 * Defines the JSON structure for a block definition in Blockly.
 *
 * @example
 * ```typescript
 * const blockDef:  JsonBlockDefinition = {
 *   type: 'custom_block',
 *   message0: 'move %1 steps',
 *   args0: [
 *     {
 *       'type': 'field_number',
 *       'name': 'INPUT',
 *     },
 *   ],
 *   previousStatement: null,
 *   nextStatement: null,
 * };
 * ```
 */
export interface JsonBlockDefinition {
  type: string;
  style?: string | null;
  colour?: string | number;
  output?: string | string[] | null;
  previousStatement?: string | string[] | null;
  nextStatement?: string | string[] | null;
  outputShape?: number;
  inputsInline?: boolean;
  tooltip?: string;
  helpUrl?: string;
  extensions?: string[];
  mutator?: string;
  enableContextMenu?: boolean;
  suppressPrefixSuffix?: boolean;

  [key: `message${number}`]: string | undefined;
  [key: `args${number}`]: BlockArg[] | undefined;
  [key: `implicitAlign${number}`]: string | undefined;
}

/** Block Arg */
export type BlockArg =
  | InputValueArg
  | InputStatementArg
  | InputDummyArg
  | InputEndRowArg
  | FieldInputArg
  | FieldNumberArg
  | FieldDropdownArg
  | FieldCheckboxArg
  | FieldImageArg
  | FieldVariableArg;

/** Input Args */
interface InputValueArg {
  type: 'input_value';
  name?: string;
  check?: string | string[];
  align?: FieldsAlign;
}
interface InputStatementArg {
  type: 'input_statement';
  name?: string;
  check?: string | string[];
}
interface InputDummyArg {
  type: 'input_dummy';
  name?: string;
}
interface InputEndRowArg {
  type: 'input_end_row';
  name?: string;
}

/** Field Args */
interface FieldInputArg extends FieldTextInputFromJsonConfig {
  type: 'field_input';
  name?: string;
}

interface FieldNumberArg extends FieldNumberFromJsonConfig {
  type: 'field_number';
  name?: string;
}

interface FieldDropdownArg extends FieldDropdownFromJsonConfig {
  type: 'field_dropdown';
  name?: string;
}

interface FieldCheckboxArg extends FieldCheckboxFromJsonConfig {
  type: 'field_checkbox';
  name?: string;
}

interface FieldImageArg extends FieldImageFromJsonConfig {
  type: 'field_image';
  name?: string;
}

interface FieldVariableArg extends FieldVariableFromJsonConfig {
  type: 'field_variable';
  name?: string;
}

export type FieldsAlign = 'LEFT' | 'RIGHT' | 'CENTRE';
