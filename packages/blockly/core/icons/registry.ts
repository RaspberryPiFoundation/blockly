/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Block} from '../block.js';
import type {IIcon} from '../interfaces/i_icon.js';
import * as registry from '../registry.js';
import {IconType} from './icon_types.js';

/**
 * Registers the given icon so that it can be deserialized.
 *
 * @param type The type of the icon to register. This should be the same string
 *     that is returned from its `getType` method.
 * @param iconConstructor The icon class/constructor to register.
 */
export function register(
  type: IconType<IIcon>,
  iconConstructor: new (block: Block) => IIcon,
) {
  registry.register(registry.Type.ICON, type.toString(), iconConstructor);
}

/**
 * Unregisters the icon associated with the given type.
 *
 * @param type The type of the icon to unregister.
 */
export function unregister(type: string) {
  registry.unregister(registry.Type.ICON, type);
}
