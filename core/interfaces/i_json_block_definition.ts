/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface JsonBlockDefinition {
  type?: string;
  style?: string;
  colour?: string | number;
  output: string | string[] | null;
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
  | FieldInputArg
  | FieldNumberArg
  | FieldDropdownArg
  | FieldCheckboxArg
  | FieldImageArg
  | FieldVariableArg;

/** Common Arg  */
interface CommonArg {
  name?: string;
}

/** Input Args */
interface InputValueArg extends CommonArg {
  type: 'input_value';
  check?: string | string[];
  align?: FieldsAlign
}
interface InputStatementArg extends CommonArg {
  type: 'input_statement';
  check?: string | string[];
}
interface InputDummyArg extends CommonArg {
  type: 'input_dummy';
}

/** Field Args */
interface FieldInputArg extends CommonArg{
  type: 'field_input'
  text: string
}

interface FieldNumberArg extends CommonArg {
  type: 'field_number';
  value?: number;
  min?: number;
  max?: number;
  precision?: number;
}

interface FieldDropdownArg extends CommonArg {
  type: 'field_dropdown';
  options: [string, string][];
}

interface FieldCheckboxArg extends CommonArg {
  type: 'field_checkbox';
  checked?: boolean | 'TRUE' | 'FALSE';
}

interface FieldImageArg {
  type: 'field_image';
  src: string;
  width: number;
  height: number;
  alt?: string;
  flipRtl?: boolean | 'TRUE' | 'FALSE';
}

interface FieldVariableArg extends CommonArg {
  type: 'field_variable'
  variable: string | null
}

export type FieldsAlign = 'LEFT' | 'RIGHT' | 'CENTRE' 
