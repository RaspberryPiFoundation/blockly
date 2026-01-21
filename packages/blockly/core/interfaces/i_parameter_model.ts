/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ParameterState} from '../serialization/procedures';
import {IProcedureModel} from './i_procedure_model';

/**
 * A data model for a procedure.
 */
export interface IParameterModel {
  /**
   * Sets the name of this parameter to the given name.
   */
  setName(name: string): this;

  /**
   * Sets the types of this parameter to the given type.
   */
  setTypes(types: string[]): this;

  /**
   * Returns the name of this parameter.
   */
  getName(): string;

  /**
   * Return the types of this parameter.
   */
  getTypes(): string[];

  /**
   * Returns the unique language-neutral ID for the parameter.
   *
   * This represents the identify of the variable model which does not change
   * over time.
   */
  getId(): string;

  /** Sets the procedure model this parameter is associated with. */
  setProcedureModel(model: IProcedureModel): this;

  /**
   * Serializes the state of the parameter to JSON.
   *
   * @returns JSON serializable state of the parameter.
   */
  saveState(): ParameterState;
}
