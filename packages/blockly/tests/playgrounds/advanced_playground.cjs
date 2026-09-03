/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Dependency loader for the advanced playground
 *
 * This loads the blockly plugins used in the advanced playground. It is bundled
 * into build/tests/advanced_playground.js, which is loaded into the advanced
 * playground.
 */

const blocklyDevTools = require('@blockly/dev-tools');
const modernTheme = require('@blockly/theme-modern');

globalThis.createPlayground = blocklyDevTools.createPlayground;
globalThis.toolboxCategories = blocklyDevTools.toolboxCategories;
globalThis.toolboxSimple = blocklyDevTools.toolboxSimple;
globalThis.toolboxTestBlocks = blocklyDevTools.toolboxTestBlocks;
globalThis.modernTheme = modernTheme;
