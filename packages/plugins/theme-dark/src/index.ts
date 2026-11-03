/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A Blockly dark theme.
 *
 * @packageDocumentation
 */

import * as Blockly from 'blockly/core';

/**
 * Dark theme.
 */
export default Blockly.Theme.defineTheme('dark', {
  name: 'dark',
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#1e1e1e',
    toolboxBackgroundColour: '#333',
    toolboxForegroundColour: '#fff',
    flyoutBackgroundColour: '#252526',
    flyoutForegroundColour: '#ccc',
    flyoutOpacity: 1,
    scrollbarColour: '#797979',
    insertionMarkerColour: '#fff',
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.4,
    cursorColour: '#d0d0d0',
  },
});
