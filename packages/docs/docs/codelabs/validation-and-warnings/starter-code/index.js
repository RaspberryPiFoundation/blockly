// Define which blocks are available in the toolbox.
const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Blocks',
      categorystyle: 'list_category',
      contents: [
        {
          kind: 'block',
          type: 'controls_forEach',
        },
        {
          kind: 'block',
          type: 'math_on_list',
        },
        {
          kind: 'block',
          type: 'text_print',
        },
        {
          kind: 'block',
          type: 'controls_flow_statements',
        },
      ],
    },
    {
      kind: 'category',
      name: 'Variables',
      categorystyle: 'variable_category',
      custom: 'VARIABLE',
    },
  ],
};

let workspace = null;

/**
 * Initialize a Blockly workspace, and add a change listener to update the display of generated code.
 *
 * Called from index.html when the page initially loads.
 */
function start() {
  // Create main workspace.
  workspace = Blockly.inject('blocklyDiv', {
    toolbox: toolbox,
  });

  workspace.addChangeListener((event) => {
    const code = javascript.javascriptGenerator.workspaceToCode(workspace);
    document.getElementById('generatedCodeContainer').value = code;
  });
}

/**
 * Generate JavaScript code from the Blockly workspace, and execute it.
 *
 * Called from index.html when the execute button is clicked.
 */
function executeCode() {
  const code = javascript.javascriptGenerator.workspaceToCode(workspace);
  eval(code);
}
