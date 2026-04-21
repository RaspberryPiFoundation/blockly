'use strict';

let workspace = null;

Blockly.Themes.Halloween = Blockly.Theme.defineTheme('halloween', {
  base: Blockly.Themes.Classic,
  categoryStyles: {
    list_category: {
      colour: '#4a148c',
    },
    logic_category: {
      colour: '#8b4513',
    },
    loop_category: {
      colour: '#85E21F',
    },
    text_category: {
      colour: '#FE9B13',
    },
  },
  blockStyles: {
    list_blocks: {
      colourPrimary: '#4a148c',
      colourSecondary: '#AD7BE9',
      colourTertiary: '#CDB6E9',
    },
    logic_blocks: {
      colourPrimary: '#8b4513',
      colourSecondary: '#ff0000',
      colourTertiary: '#C5EAFF',
    },
    loop_blocks: {
      colourPrimary: '#85E21F',
      colourSecondary: '#ff0000',
      colourTertiary: '#C5EAFF',
    },
    text_blocks: {
      colourPrimary: '#FE9B13',
      colourSecondary: '#ff0000',
      colourTertiary: '#C5EAFF',
    },
  },
  componentStyles: {
    workspaceBackgroundColour: '#ff7518',
    toolboxBackgroundColour: '#F9C10E',
    toolboxForegroundColour: '#fff',
    flyoutBackgroundColour: '#252526',
    flyoutForegroundColour: '#ccc',
    flyoutOpacity: 1,
    scrollbarColour: '#ff0000',
    insertionMarkerColour: '#fff',
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.4,
    cursorColour: '#d0d0d0',
    blackBackground: '#333',
  },
});
function start() {
  // Create main workspace.
  workspace = Blockly.inject('blocklyDiv', {
    toolbox: toolboxCategories,
    theme: Blockly.Themes.Halloween,
  });
}
