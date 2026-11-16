/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ICommentIcon} from '../interfaces/i_comment_icon.js';
import type {IIcon} from '../interfaces/i_icon.js';
import type {MutatorIcon} from './mutator_icon.js';
import type {WarningIcon} from './warning_icon.js';

/**
 * Defines the type of an icon, so that it can be retrieved from block.getIcon
 */
export class IconType<_T extends IIcon> {
  /** @param name The name of the registry type. */
  constructor(private readonly name: string) {}

  /** @returns the name of the type. */
  toString(): string {
    return this.name;
  }

  /** @returns true if this icon type is equivalent to the given icon type. */
  equals(type: IconType<IIcon>): boolean {
    return this.name === type.toString();
  }

  static MUTATOR = new IconType<MutatorIcon>('mutator');
  static WARNING = new IconType<WarningIcon>('warning');
  static COMMENT = new IconType<ICommentIcon>('comment');
}
