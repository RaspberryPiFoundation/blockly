// Use Blockly's custom block JSON API to define a new block type.
Blockly.common.defineBlocksWithJsonArray([
  {
    type: 'list_range',
    message0: 'create list of numbers from %1 up to %2',
    args0: [
      {
        type: 'field_number',
        name: 'FIRST',
        value: 0,
        min: 0,
        precision: 2,
      },
      {
        type: 'field_number',
        name: 'LAST',
        value: 5,
        min: 0,
        precision: 1,
      },
    ],
    output: 'Array',
    style: 'list_blocks',
    extensions: ['list_range_validation'],
  },
]);

Blockly.Extensions.register('list_range_validation', function () {
  // Add custom validation.
  this.getField('LAST').setValidator(function (newValue) {
    // Force an odd number.
    return Math.round((newValue - 1) / 2) * 2 + 1;
  });

  // Validate the entire block whenever any part of it changes,
  // and display a warning if the block cannot be made valid.
  this.setOnChange(function (event) {
    const first = this.getFieldValue('FIRST');
    const last = this.getFieldValue('LAST');
    const valid = first < last;
    this.setWarningText(
      valid
        ? null
        : `The first number (${first}) must be smaller than the last number (${last}).`,
    );

    // Disable invalid blocks (unless it's in a toolbox flyout,
    // since you can't drag disabled blocks to your workspace).
    if (!this.isInFlyout) {
      const initialGroup = Blockly.Events.getGroup();
      // Make it so the move and the disable event get undone together.
      Blockly.Events.setGroup(event.group);
      this.setDisabledReason(!valid, 'Invalid range');
      Blockly.Events.setGroup(initialGroup);
    }
  });
});

// Define how to generate JavaScript from the custom block.
javascript.javascriptGenerator.forBlock['list_range'] = function (block) {
  const first = this.getFieldValue('FIRST');
  const last = this.getFieldValue('LAST');
  const numbers = [];
  for (let i = first; i <= last; i++) {
    numbers.push(i);
  }
  const code = '[' + numbers.join(', ') + ']';
  return [code, javascript.Order.NONE];
};

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
          type: 'list_range',
        },
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
