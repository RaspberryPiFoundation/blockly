/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

/**
 * @fileoverview Connection test blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

import {category as rowCategory, onInit as initRow} from './row';
import {category as stackCategory, onInit as initStack} from './stack';
import {
  category as statementCategory,
  onInit as initStatement,
} from './statement';

/**
 * The Connections category.
 */
export const category = {
  kind: 'CATEGORY',
  name: 'Connections',
  expanded: 'true',
  contents: [rowCategory, stackCategory, statementCategory],
};

/**
 * Initialize this toolbox category.
 * @param {!Blockly.WorkspaceSvg} workspace The Blockly workspace.
 */
export function onInit(workspace) {
  initRow(workspace);
  initStack(workspace);
  initStatement(workspace);
}
