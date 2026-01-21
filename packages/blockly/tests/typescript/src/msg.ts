/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Test: Should be able to import messages and verify their type.
 * Test at least one language other than English!
 */

import * as en from 'blockly-test/msg/en';
import * as fr from 'blockly-test/msg/fr';

let msg: {[key: string]: string};
msg = fr;
msg = en;

// Satisfy eslint that msg is used.
console.log(msg['DIALOG_OK']);
