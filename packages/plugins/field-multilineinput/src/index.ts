/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as textMultiline from './blocks/textMultiline.js';

export * from './field_multilineinput.js';

// Re-export all parts of the block definition.
export * as textMultiline from './blocks/textMultiline.js';

// This package currently exports a single block. More may
// be added later.
export const installAllBlocks = textMultiline.installBlock;
