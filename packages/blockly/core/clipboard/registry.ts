/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ICopyable, ICopyData} from '../interfaces/i_copyable.js';
import type {IPaster} from '../interfaces/i_paster.js';
import * as registry from '../registry.js';

/**
 * Registers the given paster so that it cna be used for pasting.
 *
 * @param type The type of the paster to register, e.g. 'block', 'comment', etc.
 * @param paster The paster to register.
 */
export function register<U extends ICopyData, T extends ICopyable<U>>(
  type: string,
  paster: IPaster<U, T>,
) {
  registry.register(registry.Type.PASTER, type, paster);
}

/**
 * Unregisters the paster associated with the given type.
 *
 * @param type The type of the paster to unregister.
 */
export function unregister(type: string) {
  registry.unregister(registry.Type.PASTER, type);
}
