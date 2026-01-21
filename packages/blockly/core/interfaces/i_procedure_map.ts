/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {IProcedureModel} from './i_procedure_model.js';

export interface IProcedureMap extends Map<string, IProcedureModel> {
  /**
   * Adds the given ProcedureModel to the map of procedure models, so that
   * blocks can find it.
   */
  add(proc: IProcedureModel): this;

  /** Returns all of the procedures stored in this map. */
  getProcedures(): IProcedureModel[];
}
