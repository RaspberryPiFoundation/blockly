/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Block} from '../core/block.js';
import * as Extensions from '../core/extensions.js';

/** ID of a block extension that prohibits duplicating the block. */
export const NON_DUPLICATABLE_EXTENSION_ID = 'non_duplicatable_extension';

/** Mixin that prohibits duplicating a block. */
export const NON_DUPLICATABLE_MIXIN = {
  isDuplicatable: function () {
    return false;
  },
};

const NON_DUPLICATABLE_EXTENSION = function (this: Block) {
  this.mixin(NON_DUPLICATABLE_MIXIN, true);
};

if (!Extensions.isRegistered(NON_DUPLICATABLE_EXTENSION_ID)) {
  Extensions.register(
    NON_DUPLICATABLE_EXTENSION_ID,
    NON_DUPLICATABLE_EXTENSION,
  );
}
