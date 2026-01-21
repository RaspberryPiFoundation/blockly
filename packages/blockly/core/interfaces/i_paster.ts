/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Coordinate} from '../utils/coordinate.js';
import {WorkspaceSvg} from '../workspace_svg.js';
import {ICopyable, ICopyData} from './i_copyable.js';

/** An object that can paste data into a workspace. */
export interface IPaster<U extends ICopyData, T extends ICopyable<U>> {
  paste(
    copyData: U,
    workspace: WorkspaceSvg,
    coordinate?: Coordinate,
  ): T | null;
}

/** @returns True if the given object is a paster. */
export function isPaster(
  obj: any,
): obj is IPaster<ICopyData, ICopyable<ICopyData>> {
  return obj && typeof obj.paste === 'function';
}
