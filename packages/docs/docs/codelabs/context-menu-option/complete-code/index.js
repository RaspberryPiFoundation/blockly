'use strict';

let workspace = null;

function start() {
  registerHelloWorldItem();
  registerHelpItem();
  registerDisplayItem();
  Blockly.ContextMenuRegistry.registry.unregister('workspaceDelete');
  registerSeparators();

  Blockly.ContextMenuItems.registerCommentOptions();
  // Create main workspace.
  workspace = Blockly.inject('blocklyDiv', {
    toolbox: toolboxSimple,
  });
}

function registerHelloWorldItem() {
  const helloWorldItem = {
    displayText: 'Hello World',
    preconditionFn: function (scope) {
      // Only display this option for workspaces and blocks.
      if (
        scope.focusedNode instanceof Blockly.WorkspaceSvg ||
        scope.focusedNode instanceof Blockly.BlockSvg
      ) {
        // Enable for the first 30 seconds of every minute; disable for the next 30 seconds.
        const now = new Date(Date.now());
        if (now.getSeconds() < 30) {
          return 'enabled';
        }
        return 'disabled';
      }
      return 'hidden';
    },
    callback: function (scope) {},
    id: 'hello_world',
    weight: 100,
  };
  // Register.
  Blockly.ContextMenuRegistry.registry.register(helloWorldItem);
}

function registerHelpItem() {
  const helpItem = {
    displayText: 'Help! There are no blocks',
    preconditionFn: function (scope) {
      // Only display this option on workspace context menus.
      if (!(scope.focusedNode instanceof Blockly.WorkspaceSvg)) return 'hidden';
      // Use the focused node, which is a WorkspaceSvg, to check for blocks on the workspace.
      if (!scope.focusedNode.getTopBlocks().length) {
        return 'enabled';
      }
      return 'hidden';
    },
    // Use the focused node in the callback function to add a block to the workspace.
    callback: function (scope) {
      Blockly.serialization.blocks.append(
        {
          type: 'text',
          fields: {
            TEXT: 'Now there is a block',
          },
        },
        scope.focusedNode,
      );
    },
    id: 'help_no_blocks',
    weight: 100,
  };
  Blockly.ContextMenuRegistry.registry.register(helpItem);
}

function registerDisplayItem() {
  const displayItem = {
    // Use the focused node (a BlockSvg) to set display text dynamically based on the type of the block.
    displayText: function (scope) {
      if (scope.focusedNode.type.startsWith('text')) {
        return 'Text block';
      } else if (scope.focusedNode.type.startsWith('controls')) {
        return 'Controls block';
      } else {
        return 'Some other block';
      }
    },
    preconditionFn: function (scope) {
      return scope.focusedNode instanceof Blockly.BlockSvg
        ? 'enabled'
        : 'hidden';
    },
    callback: function (scope) {},
    id: 'display_text_example',
    weight: 100,
  };
  Blockly.ContextMenuRegistry.registry.register(displayItem);
}

function registerSeparators() {
  const workspaceSeparator = {
    id: 'workspace_separator',
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    weight: 99,
    separator: true,
  };
  Blockly.ContextMenuRegistry.registry.register(workspaceSeparator);

  const blockSeparator = {
    id: 'block_separator',
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    weight: 99,
    separator: true,
  };
  Blockly.ContextMenuRegistry.registry.register(blockSeparator);
}
