/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {IParameterModel} from './i_parameter_model.js';
import type {IVariableModel, IVariableState} from './i_variable_model.js';

/** Interface for a parameter model that holds a variable model. */
export interface IVariableBackedParameterModel extends IParameterModel {
  /** Returns the variable model held by this type. */
  getVariableModel(): IVariableModel<IVariableState>;
}

/**
 * Returns whether the given object is a variable holder or not.
 */
export function isVariableBackedParameterModel(
  param: IParameterModel,
): param is IVariableBackedParameterModel {
  return (param as any).getVariableModel !== undefined;
}
