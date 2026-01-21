/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Contains the init functions for the workspace factory tab.
 * Adds click handlers to buttons and dropdowns, adds event listeners for
 * keydown events and Blockly events, and configures the initial setup of
 * the page.
 */

/**
 * Namespace for workspace factory initialization methods.
 * @namespace
 */
WorkspaceFactoryInit = {};

/**
 * Initialization for workspace factory tab.
 * @param {!FactoryController} controller The controller for the workspace
 *    factory tab.
 */
WorkspaceFactoryInit.initWorkspaceFactory = function(controller) {
  // Disable category editing buttons until categories are created.
  document.getElementById('button_remove').disabled = true;
  document.getElementById('button_up').disabled = true;
  document.getElementById('button_down').disabled = true;
  document.getElementById('button_editCategory').disabled = true;

  this.initColourPicker_(controller);
  this.addWorkspaceFactoryEventListeners_(controller);
  this.assignWorkspaceFactoryClickHandlers_(controller);
  this.addWorkspaceFactoryOptionsListeners_(controller);

  // Check standard options and apply the changes to update the view.
  controller.setStandardOptionsAndUpdate();
};

/**
 * Initialize the colour picker in workspace factory.
 * @param {!FactoryController} controller The controller for the workspace
 *    factory tab.
 * @private
 */
WorkspaceFactoryInit.initColourPicker_ = function(controller) {
  // Array of Blockly category colours, consistent with the colour defaults.
  var colours = [20, 65, 120, 160, 210, 230, 260, 290, 330, ''];
  // Convert hue numbers to RRGGBB strings.
  for (var i = 0; i < colours.length; i++) {
    if (colours[i] !== '') {
      colours[i] = Blockly.utils.colour.hueToHex(colours[i]).substring(1);
    }
  }
  // Convert to 2D array.
  var maxCols = Math.ceil(Math.sqrt(colours.length));
  var grid = [];
  var row = [];
  for (var i = 0; i < colours.length; i++) {
    row.push(colours[i]);
    if (row.length === maxCols) {
      grid.push(row);
      row = [];
    }
  }
  if (row.length) {
    grid.push(row);
  }

  // Override the default colours.
  cp_grid = grid;
};

/**
 * Assign click handlers for workspace factory.
 * @param {!FactoryController} controller The controller for the workspace
 *    factory tab.
 * @private
 */
WorkspaceFactoryInit.assignWorkspaceFactoryClickHandlers_ =
    function(controller) {

  // Import Custom Blocks button.
  document.getElementById('button_importBlocks').addEventListener
      ('click',
      function() {
        blocklyFactory.openModal('dropdownDiv_importBlocks');
      });
  document.getElementById('input_importBlocksJson').addEventListener
      ('change',
      function() {
        controller.importBlocks(event.target.files[0], 'JSON');
      });
  document.getElementById('input_importBlocksJson').addEventListener
      ('click', function() {blocklyFactory.closeModal()});
  document.getElementById('input_importBlocksJs').addEventListener
      ('change',
      function() {
        controller.importBlocks(event.target.files[0], 'JavaScript');
      });
  document.getElementById('input_importBlocksJs').addEventListener
      ('click', function() {blocklyFactory.closeModal()});

  // Load to Edit button.
  document.getElementById('button_load').addEventListener
      ('click',
      function() {
        blocklyFactory.openModal('dropdownDiv_load');
      });
  document.getElementById('input_loadToolbox').addEventListener
      ('change',
      function() {
        controller.importFile(event.target.files[0],
            WorkspaceFactoryController.MODE_TOOLBOX);
      });
  document.getElementById('input_loadToolbox').addEventListener
      ('click', function() {blocklyFactory.closeModal()});
  document.getElementById('input_loadPreload').addEventListener
      ('change',
      function() {
        controller.importFile(event.target.files[0],
            WorkspaceFactoryController.MODE_PRELOAD);
      });
  document.getElementById('input_loadPreload').addEventListener
      ('click', function() {blocklyFactory.closeModal()});

  // Export button.
  document.getElementById('dropdown_exportOptions').addEventListener
      ('click',
      function() {
        controller.exportInjectFile();
        blocklyFactory.closeModal();
      });
  document.getElementById('dropdown_exportToolbox').addEventListener
      ('click',
      function() {
        controller.exportXmlFile(WorkspaceFactoryController.MODE_TOOLBOX);
        blocklyFactory.closeModal();
      });
  document.getElementById('dropdown_exportPreload').addEventListener
      ('click',
      function() {
        controller.exportXmlFile(WorkspaceFactoryController.MODE_PRELOAD);
        blocklyFactory.closeModal();
      });
  document.getElementById('dropdown_exportAll').addEventListener
      ('click',
      function() {
        controller.exportInjectFile();
        controller.exportXmlFile(WorkspaceFactoryController.MODE_TOOLBOX);
        controller.exportXmlFile(WorkspaceFactoryController.MODE_PRELOAD);
        blocklyFactory.closeModal();
      });
  document.getElementById('button_export').addEventListener
      ('click',
      function() {
        blocklyFactory.openModal('dropdownDiv_export');
      });

  // Clear button.
  document.getElementById('button_clear').addEventListener
      ('click',
      function() {
        controller.clearAll();
      });

  // Toolbox and Workspace tabs.
  document.getElementById('tab_toolbox').addEventListener
      ('click',
      function() {
        controller.setMode(WorkspaceFactoryController.MODE_TOOLBOX);
      });
  document.getElementById('tab_preload').addEventListener
      ('click',
      function() {
        controller.setMode(WorkspaceFactoryController.MODE_PRELOAD);
      });

  // '+' button.
  document.getElementById('button_add').addEventListener
      ('click',
      function() {
        blocklyFactory.openModal('dropdownDiv_add');
      });
  document.getElementById('dropdown_newCategory').addEventListener
      ('click',
      function() {
        controller.addCategory();
        blocklyFactory.closeModal();
      });
  document.getElementById('dropdown_loadCategory').addEventListener
      ('click',
      function() {
        controller.loadCategory();
        blocklyFactory.closeModal();
      });
  document.getElementById('dropdown_separator').addEventListener
      ('click',
      function() {
        controller.addSeparator();
        blocklyFactory.closeModal();
      });
  document.getElementById('dropdown_loadStandardToolbox').addEventListener
      ('click',
      function() {
        controller.loadStandardToolbox();
        blocklyFactory.closeModal();
      });

  // '-' button.
  document.getElementById('button_remove').addEventListener
      ('click',
      function() {
        controller.removeElement();
      });

  // Up/Down buttons.
  document.getElementById('button_up').addEventListener
      ('click',
      function() {
        controller.moveElement(-1);
      });
  document.getElementById('button_down').addEventListener
      ('click',
      function() {
        controller.moveElement(1);
      });

  // Edit Category button.
  document.getElementById('button_editCategory').addEventListener
      ('click',
      function() {
        var selected = controller.model.getSelected();
        // Return if a category is not selected.
        if (selected.type !== ListElement.TYPE_CATEGORY) {
          return;
        }
        document.getElementById('categoryName').value = selected.name;
        document.getElementById('categoryColour').value = selected.colour ?
            selected.colour.substring(1).toLowerCase() : '';
        console.log(document.getElementById('categoryColour').value);
        // Link the colour picker to the field.
        cp_init('categoryColour');
        blocklyFactory.openModal('dropdownDiv_editCategory');
      });

  document.getElementById('categorySave').addEventListener
      ('click',
      function() {
        var name = document.getElementById('categoryName').value.trim();
        var colour = document.getElementById('categoryColour').value;
        colour = colour ? '#' + colour : null;
        controller.changeSelectedCategory(name, colour);
        blocklyFactory.closeModal();
      });

  // Make/Remove Shadow buttons.
  document.getElementById('button_addShadow').addEventListener
      ('click',
      function() {
        controller.addShadow();
        WorkspaceFactoryInit.displayAddShadow_(false);
        WorkspaceFactoryInit.displayRemoveShadow_(true);
      });
  document.getElementById('button_removeShadow').addEventListener
      ('click',
      function() {
        controller.removeShadow();
        WorkspaceFactoryInit.displayAddShadow_(true);
        WorkspaceFactoryInit.displayRemoveShadow_(false);

        // Disable shadow editing button if turning invalid shadow block back
        // to normal block.
        if (!Blockly.common.getSelected().getSurroundParent()) {
          document.getElementById('button_addShadow').disabled = true;
        }
      });

  // Help button on workspace tab.
  document.getElementById('button_optionsHelp').addEventListener
      ('click', function() {
        open('https://developers.google.com/blockly/guides/get-started/web#configuration');
      });

  // Reset to Default button on workspace tab.
  document.getElementById('button_standardOptions').addEventListener
      ('click', function() {
        controller.setStandardOptionsAndUpdate();
      });
};

/**
 * Add event listeners for workspace factory.
 * @param {!FactoryController} controller The controller for the workspace
 *    factory tab.
 * @private
 */
WorkspaceFactoryInit.addWorkspaceFactoryEventListeners_ = function(controller) {
  // Use up and down arrow keys to move categories.
  window.addEventListener('keydown', function(e) {
    // Don't let arrow keys have any effect if not in Workspace Factory
    // editing the toolbox.
    if (!(controller.keyEventsEnabled && controller.selectedMode
        === WorkspaceFactoryController.MODE_TOOLBOX)) {
      return;
    }

    if (e.keyCode === 38) {
      // Arrow up.
      controller.moveElement(-1);
    } else if (e.keyCode === 40) {
      // Arrow down.
      controller.moveElement(1);
    }
  });

  // Determines if a block breaks shadow block placement rules.
  // Breaks rules if (1) a shadow block no longer has a valid
  // parent, or (2) a normal block is inside of a shadow block.
  var isInvalidBlockPlacement = function(block) {
    return ((controller.isUserGenShadowBlock(block.id) &&
        !block.getSurroundParent()) ||
        (!controller.isUserGenShadowBlock(block.id) &&
         block.getSurroundParent() &&
         controller.isUserGenShadowBlock(block.getSurroundParent().id)));
  };

  // Add change listeners for toolbox workspace in workspace factory.
  controller.toolboxWorkspace.addChangeListener(function(e) {
    // Listen for Blockly move and delete events to update preview.
    // Not listening for Blockly create events because causes the user to drop
    // blocks when dragging them into workspace. Could cause problems if ever
    // load blocks into workspace directly without calling updatePreview.
    if (e.type === Blockly.Events.BLOCK_MOVE ||
          e.type === Blockly.Events.BLOCK_DELETE ||
          e.type === Blockly.Events.BLOCK_CHANGE) {
      controller.saveStateFromWorkspace();
      controller.updatePreview();
    }

    // Listen for Blockly UI events to correctly enable the "Edit Block" button.
    // Only enable "Edit Block" when a block is selected and it has a
    // surrounding parent, meaning it is nested in another block (blocks that
    // are not nested in parents cannot be shadow blocks).
    if (e.type === Blockly.Events.BLOCK_MOVE ||
        e.type === Blockly.Events.SELECTED) {
      var selected = Blockly.common.getSelected();

      // Show shadow button if a block is selected. Show "Add Shadow" if
      // a block is not a shadow block, show "Remove Shadow" if it is a
      // shadow block.
      if (selected) {
        var isShadow = controller.isUserGenShadowBlock(selected.id);
        WorkspaceFactoryInit.displayAddShadow_(!isShadow);
        WorkspaceFactoryInit.displayRemoveShadow_(isShadow);
      } else {
        WorkspaceFactoryInit.displayAddShadow_(false);
        WorkspaceFactoryInit.displayRemoveShadow_(false);
      }

      if (selected !== null && selected.getSurroundParent() !== null &&
          !controller.isUserGenShadowBlock(selected.getSurroundParent().id)) {
        // Selected block is a valid shadow block or could be a valid shadow
        // block.

        // Enable block editing and remove warnings if the block is not a
        // variable user-generated shadow block.
        document.getElementById('button_addShadow').disabled = false;
        document.getElementById('button_removeShadow').disabled = false;

        if (!FactoryUtils.hasVariableField(selected) &&
            controller.isDefinedBlock(selected)) {
          selected.setWarningText(null);
        }
      } else {
        // Selected block cannot be a valid shadow block.

        if (selected !== null && isInvalidBlockPlacement(selected)) {
          // Selected block breaks shadow block rules.
          // Invalid shadow block if (1) a shadow block no longer has a valid
          // parent, or (2) a normal block is inside of a shadow block.

          if (!controller.isUserGenShadowBlock(selected.id)) {
            // Warn if a non-shadow block is nested inside a shadow block.
            selected.setWarningText('Only shadow blocks can be nested inside\n'
                + 'other shadow blocks.');
          } else if (!FactoryUtils.hasVariableField(selected)) {
            // Warn if a shadow block is invalid only if not replacing
            // warning for variables.
            selected.setWarningText('Shadow blocks must be nested inside other'
                + ' blocks.')
          }

          // Give editing options so that the user can make an invalid shadow
          // block a normal block.
          document.getElementById('button_removeShadow').disabled = false;
          document.getElementById('button_addShadow').disabled = true;
        } else {
          // Selected block does not break any shadow block rules, but cannot
          // be a shadow block.

          // Remove possible 'invalid shadow block placement' warning.
          if (selected !== null && controller.isDefinedBlock(selected) &&
              (!FactoryUtils.hasVariableField(selected) ||
              !controller.isUserGenShadowBlock(selected.id))) {
            selected.setWarningText(null);
          }

          // No block selected that is a shadow block or could be a valid shadow
          // block. Disable block editing.
          document.getElementById('button_addShadow').disabled = true;
          document.getElementById('button_removeShadow').disabled = true;
        }
      }
    }

    // Convert actual shadow blocks added from the toolbox to user-generated
    // shadow blocks.
    if (e.type === Blockly.Events.BLOCK_CREATE) {
      controller.convertShadowBlocks();

      // Let the user create a Variables or Functions category if they use
      // blocks from either category.

      // Get all children of a block and add them to childList.
      var getAllChildren = function(block, childList) {
        childList.push(block);
        var children = block.getChildren();
        for (var i = 0, child; child = children[i]; i++) {
          getAllChildren(child, childList);
        }
      };

      var newBaseBlock = controller.toolboxWorkspace.getBlockById(e.blockId);
      var allNewBlocks = [];
      getAllChildren(newBaseBlock, allNewBlocks);
      var variableCreated = false;
      var procedureCreated = false;

      // Check if the newly created block or any of its children are variable
      // or procedure blocks.
      for (var i = 0, block; block = allNewBlocks[i]; i++) {
        if (FactoryUtils.hasVariableField(block)) {
          variableCreated = true;
        } else if (FactoryUtils.isProcedureBlock(block)) {
          procedureCreated = true;
        }
      }

      // If any of the newly created blocks are variable or procedure blocks,
      // prompt the user to create the corresponding standard category.
      if (variableCreated && !controller.hasVariablesCategory()) {
        if (confirm('Your new block has a variables field. To use this block '
            + 'fully, you will need a Variables category. Do you want to add '
            + 'a Variables category to your custom toolbox?')) {
          controller.setMode(WorkspaceFactoryController.MODE_TOOLBOX);
          controller.loadCategoryByName('variables');
        }
      }

      if (procedureCreated && !controller.hasProceduresCategory()) {
        if (confirm('Your new block is a function block. To use this block '
            + 'fully, you will need a Functions category. Do you want to add '
            + 'a Functions category to your custom toolbox?')) {
          controller.setMode(WorkspaceFactoryController.MODE_TOOLBOX);
          controller.loadCategoryByName('functions');
        }
      }
    }
  });
};

/**
 * Display or hide the add shadow button.
 * @param {boolean} show True if the add shadow button should be shown, false
 *    otherwise.
 */
WorkspaceFactoryInit.displayAddShadow_ = function(show) {
  document.getElementById('button_addShadow').style.display =
      show ? 'inline-block' : 'none';
};

/**
 * Display or hide the remove shadow button.
 * @param {boolean} show True if the remove shadow button should be shown, false
 *    otherwise.
 */
WorkspaceFactoryInit.displayRemoveShadow_ = function(show) {
  document.getElementById('button_removeShadow').style.display =
      show ? 'inline-block' : 'none';
};

/**
 * Add listeners for workspace factory options input elements.
 * @param {!FactoryController} controller The controller for the workspace
 *    factory tab.
 * @private
 */
WorkspaceFactoryInit.addWorkspaceFactoryOptionsListeners_ =
    function(controller) {
  // Checking the grid checkbox displays grid options.
  document.getElementById('option_grid_checkbox').addEventListener('change',
      function(e) {
        document.getElementById('grid_options').style.display =
            document.getElementById('option_grid_checkbox').checked ?
            'block' : 'none';
      });

  // Checking the zoom checkbox displays zoom options.
  document.getElementById('option_zoom_checkbox').addEventListener('change',
      function(e) {
        document.getElementById('zoom_options').style.display =
            document.getElementById('option_zoom_checkbox').checked ?
            'block' : 'none';
      });

  // Checking the readonly checkbox enables/disables other options.
  document.getElementById('option_readOnly_checkbox').addEventListener('change',
    function(e) {
      var checkbox = document.getElementById('option_readOnly_checkbox');
      blocklyFactory.ifCheckedEnable(!checkbox.checked,
          ['readonly1', 'readonly2']);
    });

    document.getElementById('option_infiniteBlocks_checkbox').addEventListener('change',
    function(e) {
      document.getElementById('maxBlockNumber_option').style.display =
          document.getElementById('option_infiniteBlocks_checkbox').checked ?
            'none' : 'block';
    });

  // Generate new options every time an options input is updated.
  var div = document.getElementById('workspace_options');
  var options = div.getElementsByTagName('input');
  for (var i = 0, option; option = options[i]; i++) {
    option.addEventListener('change', function() {
      controller.generateNewOptions();
    });
  }
};
