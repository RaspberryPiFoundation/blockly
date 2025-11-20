/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { FieldCheckboxFromJsonConfig } from "../field_checkbox"
import { FieldDropdownFromJsonConfig } from "../field_dropdown"
import { FieldImageFromJsonConfig } from "../field_image"
import { FieldNumberFromJsonConfig } from "../field_number"
import { FieldTextInputFromJsonConfig } from "../field_textinput"
import { FieldVariableFromJsonConfig } from "../field_variable"

export interface JsonBlockDefinition {
  type?: string
  style?: string
  colour?: string | number
  output?: string | string[] | null
  previousStatement?: string | string[] | null
  nextStatement?: string | string[] | null
  outputShape?: number
  inputsInline?: boolean
  tooltip?: string
  helpUrl?: string
  extensions?: string[]
  mutator?: string
  enableContextMenu?: boolean
  suppressPrefixSuffix?: boolean

  [key: `message${number}`]: string | undefined
  [key: `args${number}`]: BlockArg[] | undefined
  [key: `implicitAlign${number}`]: string | undefined
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
  | FieldVariableArg

/** Input Args */
interface InputValueArg {
  name:  string
  type: 'input_value'
  check?: string | string[]
  align?: FieldsAlign
}
interface InputStatementArg {
  name: string
  type: 'input_statement'
  check?: string | string[]
}
interface InputDummyArg {
  name: string
  type: 'input_dummy'
}

/** Field Args */
interface FieldInputArg extends FieldTextInputFromJsonConfig {
  name: string
  type: 'field_input'
}

interface FieldNumberArg extends FieldNumberFromJsonConfig {
  name: string
  type: 'field_number'
}

interface FieldDropdownArg extends FieldDropdownFromJsonConfig {
  name: string
  type: 'field_dropdown'
}

interface FieldCheckboxArg extends FieldCheckboxFromJsonConfig {
  name: string
  type: 'field_checkbox'
}

interface FieldImageArg extends FieldImageFromJsonConfig {
  name: string
  type: 'field_image'
}

interface FieldVariableArg extends FieldVariableFromJsonConfig {
  name: string
  type: 'field_variable'
}

export type FieldsAlign = 'LEFT' | 'RIGHT' | 'CENTRE' 
