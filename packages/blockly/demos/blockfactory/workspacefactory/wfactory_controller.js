/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Contains the controller code for workspace factory. Depends
 * on the model and view objects (created as internal variables) and interacts
 * with previewWorkspace and toolboxWorkspace (internal references stored to
 * both). Also depends on standard_categories.js for standard Blockly
 * categories. Provides the functionality for the actions the user can initiate:
 * - adding and removing categories
 * - switching between categories
 * - printing and downloading configuration xml
 * - updating the preview workspace
 * - changing a category name
 * - moving the position of a category.
 */

/**
 * Class for a WorkspaceFactoryController
 * @param {string} toolboxName Name of workspace toolbox XML.
 * @param {string} toolboxDiv Name of div to inject toolbox workspace in.
 * @param {string} previewDiv Name of div to inject preview workspace in.
 * @constructor
 */
WorkspaceFactoryController = function(toolboxName, toolboxDiv, previewDiv) {
  // Toolbox XML element for the editing workspace.
  this.toolbox = document.getElementById(toolboxName);

  // Workspace for user to drag blocks in for a certain category.
  this.toolboxWorkspace = Blockly.inject(toolboxDiv,
    {grid:
      {spacing: 25,
       length: 3,
       colour: '#ccc',
       snap: true},
       media: '../../media/',
       toolbox: this.toolbox
     });

  // Workspace for user to preview their changes.
  this.previewWorkspace = Blockly.inject(previewDiv,
    {grid:
      {spacing: 25,
       length: 3,
       colour: '#ccc',
       snap: true},
     media: '../../media/',
     toolbox: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
     zoom:
       {controls: true,
        wheel: true}
    });

  // Model to keep track of categories and blocks.
  this.model = new WorkspaceFactoryModel();
  // Updates the category tabs.
  this.view = new WorkspaceFactoryView();
  // Generates XML for categories.
  this.generator = new WorkspaceFactoryGenerator(this.model);
  // Tracks which editing mode the user is in. Toolbox mode on start.
  this.selectedMode = WorkspaceFactoryController.MODE_TOOLBOX;
  // True if key events are enabled, false otherwise.
  this.keyEventsEnabled = true;
  // True if there are unsaved changes in the toolbox, false otherwise.
  this.hasUnsavedToolboxChanges = false;
  // True if there are unsaved changes in the preloaded blocks, false otherwise.
  this.hasUnsavedPreloadChanges = false;
};

// Toolbox editing mode. Changes the user makes to the workspace updates the
// toolbox.
WorkspaceFactoryController.MODE_TOOLBOX = 'toolbox';
// Pre-loaded workspace editing mode. Changes the user makes to the workspace
// updates the pre-loaded blocks.
WorkspaceFactoryController.MODE_PRELOAD = 'preload';

/**
 * Currently prompts the user for a name, checking that it's valid (not used
 * before), and then creates a tab and switches to it.
 */
WorkspaceFactoryController.prototype.addCategory = function() {
  // Transfers the user's blocks to a flyout if it's the first category created.
  this.transferFlyoutBlocksToCategory();

  // After possibly creating a category, check again if it's the first category.
  var isFirstCategory = !this.model.hasElements();
  // Get name from user.
  var name = this.promptForNewCategoryName('Enter the name of your new category:');
  if (!name) {  // Exit if cancelled.
    return;
  }
  // Create category.
  this.createCategory(name);
  // Switch to category.
  this.switchElement(this.model.getCategoryIdByName(name));

  // Sets the default options for injecting the workspace
  // when there are categories if adding the first category.
  if (isFirstCategory) {
    this.view.setCategoryOptions(this.model.hasElements());
    this.generateNewOptions();
  }
  // Update preview.
  this.updatePreview();
};

/**
 * Helper method for addCategory. Adds a category to the view given a name, ID,
 * and a boolean for if it's the first category created. Assumes the category
 * has already been created in the model. Does not switch to category.
 * @param {string} name Name of category being added.
 * @param {string} id The ID of the category being added.
 */
WorkspaceFactoryController.prototype.createCategory = function(name) {
  // Create empty category
  var category = new ListElement(ListElement.TYPE_CATEGORY, name);
  this.model.addElementToList(category);
  // Create new category.
  var tab = this.view.addCategoryRow(name, category.id);
  this.addClickToSwitch(tab, category.id);
};

/**
 * Given a tab and a ID to be associated to that tab, adds a listener to
 * that tab so that when the user clicks on the tab, it switches to the
 * element associated with that ID.
 * @param {!Element} tab The DOM element to add the listener to.
 * @param {string} id The ID of the element to switch to when tab is clicked.
 */
WorkspaceFactoryController.prototype.addClickToSwitch = function(tab, id) {
  var self = this;
  var clickFunction = function(id) {  // Keep this in scope for switchElement.
    return function() {
      self.switchElement(id);
    };
  };
  this.view.bindClick(tab, clickFunction(id));
};

/**
 * Transfers the blocks in the user's flyout to a new category if
 * the user is creating their first category and their workspace is not
 * empty. Should be called whenever it is possible to switch from single flyout
 * to categories (not including importing).
 */
WorkspaceFactoryController.prototype.transferFlyoutBlocksToCategory =
    function() {
  // Saves the user's blocks from the flyout in a category if there is no
  // toolbox and the user has dragged in blocks.
  if (!this.model.hasElements() &&
        this.toolboxWorkspace.getAllBlocks(false).length > 0) {
    // Create the new category.
    this.createCategory('Category 1', true);
    // Set the new category as selected.
    var id = this.model.getCategoryIdByName('Category 1');
    this.model.setSelectedById(id);
    this.view.setCategoryTabSelection(id, true);
    // Allow user to use the default options for injecting with categories.
    this.view.setCategoryOptions(this.model.hasElements());
    this.generateNewOptions();
    // Update preview here in case exit early.
    this.updatePreview();
  }
};

/**
 * Attached to "-" button. Checks if the user wants to delete
 * the current element.  Removes the element and switches to another element.
 * When the last element is removed, it switches to a single flyout mode.
 */
WorkspaceFactoryController.prototype.removeElement = function() {
  // Check that there is a currently selected category to remove.
  if (!this.model.getSelected()) {
    return;
  }

  // Check if user wants to remove current category.
  var check = confirm('Are you sure you want to delete the currently selected '
        + this.model.getSelected().type + '?');
  if (!check) { // If cancelled, exit.
    return;
  }

  var selectedId = this.model.getSelectedId();
  var selectedIndex = this.model.getIndexByElementId(selectedId);
  // Delete element visually.
  this.view.deleteElementRow(selectedId, selectedIndex);
  // Delete element in model.
  this.model.deleteElementFromList(selectedIndex);

  // Find next logical element to switch to.
  var next = this.model.getElementByIndex(selectedIndex);
  if (!next && this.model.hasElements()) {
    next = this.model.getElementByIndex(selectedIndex - 1);
  }
  var nextId = next ? next.id : null;

  // Open next element.
  this.clearAndLoadElement(nextId);

  // If no element to switch to, display message, clear the workspace, and
  // set a default selected element not in toolbox list in the model.
  if (!nextId) {
    alert('You currently have no categories or separators. All your blocks' +
        ' will be displayed in a single flyout.');
    this.toolboxWorkspace.clear();
    this.toolboxWorkspace.clearUndo();
    this.model.createDefaultSelectedIfEmpty();
  }
  // Update preview.
  this.updatePreview();
};

/**
 * Gets a valid name for a new category from the user.
 * @param {string} promptString Prompt for the user to enter a name.
 * @param {string=} opt_oldName The current name.
 * @return {string?} Valid name for a new category, or null if cancelled.
 */
WorkspaceFactoryController.prototype.promptForNewCategoryName =
    function(promptString, opt_oldName) {
  var defaultName = opt_oldName;
  do {
    var name = prompt(promptString, defaultName);
    if (!name) {  // If cancelled.
      return null;
    }
    defaultName = name;
  } while (this.model.hasCategoryByName(name));
  return name;
};

/**
 * Switches to a new tab for the element given by ID. Stores XML and blocks
 * to reload later, updates selected accordingly, and clears the workspace
 * and clears undo, then loads the new element.
 * @param {string} id ID of tab to be opened, must be valid element ID.
 */
WorkspaceFactoryController.prototype.switchElement = function(id) {
  // Disables events while switching so that Blockly delete and create events
  // don't update the preview repeatedly.
  Blockly.Events.disable();
  // Caches information to reload or generate XML if switching to/from element.
  // Only saves if a category is selected.
  if (this.model.getSelectedId() !== null && id !== null) {
    this.model.getSelected().saveFromWorkspace(this.toolboxWorkspace);
  }
  // Load element.
  this.clearAndLoadElement(id);
  // Enable Blockly events again.
  Blockly.Events.enable();
};

/**
 * Switches to a new tab for the element by ID. Helper for switchElement.
 * Updates selected, clears the workspace and clears undo, loads a new element.
 * @param {string} id ID of category to load.
 */
WorkspaceFactoryController.prototype.clearAndLoadElement = function(id) {
  // Unselect current tab if switching to and from an element.
  if (this.model.getSelectedId() !== null && id !== null) {
    this.view.setCategoryTabSelection(this.model.getSelectedId(), false);
  }

  // If switching to another category, set category selection in the model and
  // view.
  if (id !== null) {
    // Set next category.
    this.model.setSelectedById(id);

    // Clears workspace and loads next category.
    this.clearAndLoadXml_(this.model.getSelectedXml());

    // Selects the next tab.
    this.view.setCategoryTabSelection(id, true);

    // Order blocks as shown in flyout.
    this.toolboxWorkspace.cleanUp();

    // Update category editing buttons.
    this.view.updateState(this.model.getIndexByElementId
        (this.model.getSelectedId()), this.model.getSelected());
  } else {
    // Update category editing buttons for no categories.
    this.view.updateState(-1, null);
  }
};

/**
 * Tied to "Export" button. Gets a file name from the user and downloads
 * the corresponding configuration XML to that file.
 * @param {string} exportMode The type of file to export
 *    (WorkspaceFactoryController.MODE_TOOLBOX for the toolbox configuration,
 *    and WorkspaceFactoryController.MODE_PRELOAD for the pre-loaded workspace
 *    configuration)
 */
WorkspaceFactoryController.prototype.exportXmlFile = function(exportMode) {
  // Get file name.
  if (exportMode === WorkspaceFactoryController.MODE_TOOLBOX) {
    var fileName = prompt('File Name for toolbox XML:', 'toolbox.xml');
  } else {
    var fileName = prompt('File Name for pre-loaded workspace XML:',
                          'workspace.xml');
  }
  if (!fileName) {  // If cancelled.
    return;
  }

  // Generate XML.
  if (exportMode === WorkspaceFactoryController.MODE_TOOLBOX) {
    // Export the toolbox XML.
    var configXml = Blockly.Xml.domToPrettyText(
        this.generator.generateToolboxXml());
    this.hasUnsavedToolboxChanges = false;
  } else if (exportMode === WorkspaceFactoryController.MODE_PRELOAD) {
    // Export the pre-loaded block XML.
    var configXml = Blockly.Xml.domToPrettyText(
        this.generator.generateWorkspaceXml());
    this.hasUnsavedPreloadChanges = false;
  } else {
    // Unknown mode. Throw error.
    var msg = 'Unknown export mode: ' + exportMode;
    BlocklyDevTools.Analytics.onError(msg);
    throw Error(msg);
  }

  // Download file.
  var data = new Blob([configXml], {type: 'text/xml'});
  this.view.createAndDownloadFile(fileName, data);

  if (exportMode === WorkspaceFactoryController.MODE_TOOLBOX) {
    BlocklyDevTools.Analytics.onExport(
        BlocklyDevTools.Analytics.TOOLBOX,
        { format: BlocklyDevTools.Analytics.FORMAT_XML });
  } else if (exportMode === WorkspaceFactoryController.MODE_PRELOAD) {
    BlocklyDevTools.Analytics.onExport(
        BlocklyDevTools.Analytics.WORKSPACE_CONTENTS,
        { format: BlocklyDevTools.Analytics.FORMAT_XML });
  }
};

/**
 * Export the options object to be used for the Blockly inject call. Gets a
 * file name from the user and downloads the options object to that file.
 */
WorkspaceFactoryController.prototype.exportInjectFile = function() {
  var fileName = prompt('File Name for starter Blockly workspace code:',
                        'workspace.js');
  if (!fileName) {  // If cancelled.
    return;
  }
  // Generate new options to remove toolbox XML from options object (if
  // necessary).
  this.generateNewOptions();
  var printableOptions = this.generator.generateInjectString()
  var data = new Blob([printableOptions], {type: 'text/javascript'});
  this.view.createAndDownloadFile(fileName, data);

  BlocklyDevTools.Analytics.onExport(
      BlocklyDevTools.Analytics.STARTER_CODE,
      {
        format: BlocklyDevTools.Analytics.FORMAT_JS,
        platform: BlocklyDevTools.Analytics.PLATFORM_WEB
      });
};

/**
 * Tied to "Print" button. Mainly used for debugging purposes. Prints
 * the configuration XML to the console.
 */
WorkspaceFactoryController.prototype.printConfig = function() {
  // Capture any changes made by user before generating XML.
  this.saveStateFromWorkspace();
  // Print XML.
  console.log(Blockly.Xml.domToPrettyText(this.generator.generateToolboxXml()));
};

/**
 * Updates the preview workspace based on the toolbox workspace. If switching
 * from no categories to categories or categories to no categories, reinjects
 * Blockly with reinjectPreview, otherwise just updates without reinjecting.
 * Called whenever a list element is created, removed, or modified and when
 * Blockly move and delete events are fired. Do not call on create events
 * or disabling will cause the user to "drop" their current blocks. Make sure
 * that no changes have been made to the workspace since updating the model
 * (if this might be the case, call saveStateFromWorkspace).
 */
WorkspaceFactoryController.prototype.updatePreview = function() {
  // Disable events to stop updatePreview from recursively calling itself
  // through event handlers.
  Blockly.Events.disable();

  // Only update the toolbox if not in read only mode.
  if (!this.model.options['readOnly']) {
    // Get toolbox XML.
    var tree = Blockly.utils.toolbox.parseToolboxTree(
        this.generator.generateToolboxXml());

    // No categories, creates a simple flyout.
    if (tree.getElementsByTagName('category').length === 0) {
      // No categories, creates a simple flyout.
      if (this.previewWorkspace.toolbox_) {
        this.reinjectPreview(tree); // Switch to simple flyout, expensive.
      } else {
        this.previewWorkspace.updateToolbox(tree);
      }
    } else {
      // Uses categories, creates a toolbox.
      if (!this.previewWorkspace.toolbox_) {
        this.reinjectPreview(tree); // Create a toolbox, expensive.
      } else {
        // Close the toolbox before updating it so that the user has to reopen
        // the flyout and see their updated toolbox (open flyout doesn't update)
        this.previewWorkspace.toolbox_.clearSelection();
        this.previewWorkspace.updateToolbox(tree);
      }
    }
  }

  // Update pre-loaded blocks in the preview workspace.
  this.previewWorkspace.clear();
  Blockly.Xml.domToWorkspace(this.generator.generateWorkspaceXml(),
      this.previewWorkspace);

  // Reenable events.
  Blockly.Events.enable();
};

/**
 * Saves the state from the workspace depending on the current mode. Should
 * be called after making changes to the workspace.
 */
WorkspaceFactoryController.prototype.saveStateFromWorkspace = function() {
  if (this.selectedMode === WorkspaceFactoryController.MODE_TOOLBOX) {
    // If currently editing the toolbox.
    // Update flags if toolbox has been changed.
    if (this.model.getSelectedXml() !==
        Blockly.Xml.workspaceToDom(this.toolboxWorkspace)) {
      this.hasUnsavedToolboxChanges = true;
    }

    this.model.getSelected().saveFromWorkspace(this.toolboxWorkspace);

  } else if (this.selectedMode === WorkspaceFactoryController.MODE_PRELOAD) {
    // If currently editing the pre-loaded workspace.
    // Update flags if preloaded blocks have been changed.
    if (this.model.getPreloadXml() !==
        Blockly.Xml.workspaceToDom(this.toolboxWorkspace)) {
      this.hasUnsavedPreloadChanges = true;
    }

    this.model.savePreloadXml(
        Blockly.Xml.workspaceToDom(this.toolboxWorkspace));
  }
};

/**
 * Used to completely reinject the preview workspace. This should be used only
 * when switching from simple flyout to categories, or categories to simple
 * flyout. More expensive than simply updating the flyout or toolbox.
 * @param {!Element} Tree of XML elements
 * @package
 */
WorkspaceFactoryController.prototype.reinjectPreview = function(tree) {
  this.previewWorkspace.dispose();
  var injectOptions = this.readOptions_();
  injectOptions['toolbox'] = Blockly.Xml.domToPrettyText(tree);
  this.previewWorkspace = Blockly.inject('preview_blocks', injectOptions);
  Blockly.Xml.domToWorkspace(this.generator.generateWorkspaceXml(),
      this.previewWorkspace);
};

/**
 * Changes the name and colour of the selected category.
 * Return if selected element is a separator.
 * @param {string} name New name for selected category.
 * @param {?string} colour New colour for selected category, or null if none.
 * Must be a valid CSS string, or '' for none.
 */
WorkspaceFactoryController.prototype.changeSelectedCategory = function(name,
    colour) {
  var selected = this.model.getSelected();
  // Return if a category is not selected.
  if (selected.type !== ListElement.TYPE_CATEGORY) {
    return;
  }
  // Change colour of selected category.
  selected.changeColour(colour);
  this.view.setBorderColour(this.model.getSelectedId(), colour);
  // Change category name.
  selected.changeName(name);
  this.view.updateCategoryName(name, this.model.getSelectedId());
  // Update preview.
  this.updatePreview();
};

/**
 * Tied to arrow up and arrow down buttons. Swaps with the element above or
 * below the currently selected element (offset categories away from the
 * current element). Updates state to enable the correct element editing
 * buttons.
 * @param {number} offset The index offset from the currently selected element
 * to swap with. Positive if the element to be swapped with is below, negative
 * if the element to be swapped with is above.
 */
WorkspaceFactoryController.prototype.moveElement = function(offset) {
  var curr = this.model.getSelected();
  if (!curr) {  // Return if no selected element.
    return;
  }
  var currIndex = this.model.getIndexByElementId(curr.id);
  var swapIndex = this.model.getIndexByElementId(curr.id) + offset;
  var swap = this.model.getElementByIndex(swapIndex);
  if (!swap) {  // Return if cannot swap in that direction.
    return;
  }
  // Move currently selected element to index of other element.
  // Indexes must be valid because confirmed that curr and swap exist.
  this.moveElementToIndex(curr, swapIndex, currIndex);
  // Update element editing buttons.
  this.view.updateState(swapIndex, this.model.getSelected());
  // Update preview.
  this.updatePreview();
};

/**
 * Moves a element to a specified index and updates the model and view
 * accordingly. Helper functions throw an error if indexes are out of bounds.
 * @param {!Element} element The element to move.
 * @param {number} newIndex The index to insert the element at.
 * @param {number} oldIndex The index the element is currently at.
 */
WorkspaceFactoryController.prototype.moveElementToIndex = function(element,
    newIndex, oldIndex) {
  this.model.moveElementToIndex(element, newIndex, oldIndex);
  this.view.moveTabToIndex(element.id, newIndex, oldIndex);
};

/**
 * Tied to the "Standard Category" dropdown option, this function prompts
 * the user for a name of a standard Blockly category (case insensitive) and
 * loads it as a new category and switches to it. Leverages StandardCategories.
 */
WorkspaceFactoryController.prototype.loadCategory = function() {
  // Prompt user for the name of the standard category to load.
  do {
    var name = prompt('Enter the name of the category you would like to import '
        + '(Logic, Loops, Math, Text, Lists, Colour, Variables, TypedVariables '
        + 'or Functions)');
    if (!name) {
      return;  // Exit if cancelled.
    }
  } while (!this.isStandardCategoryName(name));

  // Load category.
  this.loadCategoryByName(name);
};

/**
 * Loads a Standard Category by name and switches to it. Leverages
 * StandardCategories. Returns if cannot load standard category.
 * @param {string} name Name of the standard category to load.
 */
WorkspaceFactoryController.prototype.loadCategoryByName = function(name) {
  // Check if the user can load that standard category.
  if (!this.isStandardCategoryName(name)) {
    return;
  }
  if (this.model.hasVariables() && name.toLowerCase() === 'variables') {
    alert('A Variables category already exists. You cannot create multiple' +
        ' variables categories.');
    return;
  }
  if (this.model.hasProcedures() && name.toLowerCase() === 'functions') {
    alert('A Functions category already exists. You cannot create multiple' +
        ' functions categories.');
    return;
  }
  // Check if the user can create a category with that name.
  var standardCategory = StandardCategories.categoryMap[name.toLowerCase()]
  if (this.model.hasCategoryByName(standardCategory.name)) {
    alert('You already have a category with the name ' + standardCategory.name
        + '. Rename your category and try again.');
    return;
  }
  if (!standardCategory.colour && standardCategory.hue !== undefined) {
    // Calculate the hex colour based on the hue.
    standardCategory.colour = Blockly.utils.colour.hueToHex(
      standardCategory.hue);
  }
  // Transfers current flyout blocks to a category if it's the first category
  // created.
  this.transferFlyoutBlocksToCategory();

  var isFirstCategory = !this.model.hasElements();
  // Copy the standard category in the model.
  var copy = standardCategory.copy();

  // Add it to the model.
  this.model.addElementToList(copy);

  // Update the copy in the view.
  var tab = this.view.addCategoryRow(copy.name, copy.id);
  this.addClickToSwitch(tab, copy.id);
  // Colour the category tab in the view.
  if (copy.colour) {
    this.view.setBorderColour(copy.id, copy.colour);
  }
  // Switch to loaded category.
  this.switchElement(copy.id);
  // Convert actual shadow blocks to user-generated shadow blocks.
  this.convertShadowBlocks();
  // Save state from workspace before updating preview.
  this.saveStateFromWorkspace();
  if (isFirstCategory) {
    // Allow the user to use the default options for injecting the workspace
    // when there are categories.
    this.view.setCategoryOptions(this.model.hasElements());
    this.generateNewOptions();
  }
  // Update preview.
  this.updatePreview();
};

/**
 * Loads the standard Blockly toolbox into the editing space. Should only
 * be called when the mode is set to toolbox.
 */
WorkspaceFactoryController.prototype.loadStandardToolbox = function() {
  this.loadCategoryByName('Logic');
  this.loadCategoryByName('Loops');
  this.loadCategoryByName('Math');
  this.loadCategoryByName('Text');
  this.loadCategoryByName('Lists');
  this.loadCategoryByName('Colour');
  this.addSeparator();
  this.loadCategoryByName('Variables');
  this.loadCategoryByName('Functions');
};

/**
 * Given the name of a category, determines if it's the name of a standard
 * category (case insensitive).
 * @param {string} name The name of the category that should be checked if it's
 * in StandardCategories categoryMap
 * @return {boolean} True if name is a standard category name, false otherwise.
 */
WorkspaceFactoryController.prototype.isStandardCategoryName = function(name) {
  return !!StandardCategories.categoryMap[name.toLowerCase()];
};

/**
 * Connected to the "add separator" dropdown option. If categories already
 * exist, adds a separator to the model and view. Does not switch to select
 * the separator, and updates the preview.
 */
WorkspaceFactoryController.prototype.addSeparator = function() {
  // If adding the first element in the toolbox, transfers the user's blocks
  // in a flyout to a category.
  this.transferFlyoutBlocksToCategory();
  // Create the separator in the model.
  var separator = new ListElement(ListElement.TYPE_SEPARATOR);
  this.model.addElementToList(separator);
  // Create the separator in the view.
  var tab = this.view.addSeparatorTab(separator.id);
  this.addClickToSwitch(tab, separator.id);
  // Switch to the separator and update the preview.
  this.switchElement(separator.id);
  this.updatePreview();
};

/**
 * Connected to the import button. Given the file path inputted by the user
 * from file input, if the import mode is for the toolbox, this function loads
 * that toolbox XML to the workspace, creating category and separator tabs as
 * necessary. If the import mode is for pre-loaded blocks in the workspace,
 * this function loads that XML to the workspace to be edited further. This
 * function switches mode to whatever the import mode is. Catches errors from
 * file reading and prints an error message alerting the user.
 * @param {string} file The path for the file to be imported into the workspace.
 *   Should contain valid toolbox XML.
 * @param {string} importMode The mode corresponding to the type of file the
 *   user is importing (WorkspaceFactoryController.MODE_TOOLBOX or
 *   WorkspaceFactoryController.MODE_PRELOAD).
 */
WorkspaceFactoryController.prototype.importFile = function(file, importMode) {
  // Exit if cancelled.
  if (!file) {
    return;
  }

  Blockly.Events.disable();
  var controller = this;
  var reader = new FileReader();

  // To be executed when the reader has read the file.
  reader.onload = function() {
    // Try to parse XML from file and load it into toolbox editing area.
    // Print error message if fail.
    try {
      var tree = Blockly.utils.xml.textToDom(reader.result);
      if (importMode === WorkspaceFactoryController.MODE_TOOLBOX) {
        // Switch mode.
        controller.setMode(WorkspaceFactoryController.MODE_TOOLBOX);

        // Confirm that the user wants to override their current toolbox.
        var hasToolboxElements = controller.model.hasElements() ||
            controller.toolboxWorkspace.getAllBlocks(false).length > 0;
        if (hasToolboxElements) {
            var msg = 'Are you sure you want to import? You will lose your ' +
                'current toolbox.';
            BlocklyDevTools.Analytics.onWarning(msg);
            var continueAnyway = confirm();
            if (!continueAnyway) {
              return;
            }
        }
        // Import toolbox XML.
        controller.importToolboxFromTree_(tree);
        BlocklyDevTools.Analytics.onImport('Toolbox.xml');

      } else if (importMode === WorkspaceFactoryController.MODE_PRELOAD) {
        // Switch mode.
        controller.setMode(WorkspaceFactoryController.MODE_PRELOAD);

        // Confirm that the user wants to override their current blocks.
        if (controller.toolboxWorkspace.getAllBlocks(false).length > 0) {
          var msg = 'Are you sure you want to import? You will lose your ' +
            'current workspace blocks.';
          var continueAnyway = confirm(msg);
          BlocklyDevTools.Analytics.onWarning(msg);
          if (!continueAnyway) {
            return;
          }
        }

        // Import pre-loaded workspace XML.
        controller.importPreloadFromTree_(tree);
        BlocklyDevTools.Analytics.onImport('WorkspaceContents.xml');
      } else {
        // Throw error if invalid mode.
        throw Error('Unknown import mode: ' + importMode);
      }
    } catch(e) {
      var msg = 'Cannot load XML from file.';
      alert(msg);
      BlocklyDevTools.Analytics.onError(msg);
      console.log(e);
    } finally {
      Blockly.Events.enable();
    }
  }

  // Read the file asynchronously.
  reader.readAsText(file);
};

/**
 * Given a XML DOM tree, loads it into the toolbox editing area so that the
 * user can continue editing their work. Assumes that tree is in valid toolbox
 * XML format. Assumes that the mode is MODE_TOOLBOX.
 * @param {!Element} tree XML tree to be loaded to toolbox editing area.
 * @private
 */
WorkspaceFactoryController.prototype.importToolboxFromTree_ = function(tree) {
  // Clear current editing area.
  this.model.clearToolboxList();
  this.view.clearToolboxTabs();

  if (tree.getElementsByTagName('category').length === 0) {
    // No categories present.
    // Load all the blocks into a single category evenly spaced.
    Blockly.Xml.domToWorkspace(tree, this.toolboxWorkspace);
    this.toolboxWorkspace.cleanUp();

    // Convert actual shadow blocks to user-generated shadow blocks.
    this.convertShadowBlocks();

    // Add message to denote empty category.
    this.view.addEmptyCategoryMessage();

  } else {
    // Categories/separators present.
    for (var i = 0, item; item = tree.children[i]; i++) {

      if (item.tagName === 'category') {
        // If the element is a category, create a new category and switch to it.
        this.createCategory(item.getAttribute('name'), false);
        var category = this.model.getElementByIndex(i);
        this.switchElement(category.id);

        // Load all blocks in that category to the workspace to be evenly
        // spaced and saved to that category.
        for (var j = 0, blockXml; blockXml = item.children[j]; j++) {
          Blockly.Xml.domToBlock(blockXml, this.toolboxWorkspace);
        }

        // Evenly space the blocks.
        this.toolboxWorkspace.cleanUp();

        // Convert actual shadow blocks to user-generated shadow blocks.
        this.convertShadowBlocks();

        // Set category colour.
        if (item.getAttribute('colour')) {
          category.changeColour(item.getAttribute('colour'));
          this.view.setBorderColour(category.id, category.colour);
        }
        // Set any custom tags.
        if (item.getAttribute('custom')) {
          this.model.addCustomTag(category, item.getAttribute('custom'));
        }
      } else {
        // If the element is a separator, add the separator and switch to it.
        this.addSeparator();
        this.switchElement(this.model.getElementByIndex(i).id);
      }
    }
  }
  this.view.updateState(this.model.getIndexByElementId
      (this.model.getSelectedId()), this.model.getSelected());

  this.saveStateFromWorkspace();

  // Set default configuration options for a single flyout or multiple
  // categories.
  this.view.setCategoryOptions(this.model.hasElements());
  this.generateNewOptions();

  this.updatePreview();
};

/**
 * Given a XML DOM tree, loads it into the pre-loaded workspace editing area.
 * Assumes that tree is in valid XML format and that the selected mode is
 * MODE_PRELOAD.
 * @param {!Element} tree XML tree to be loaded to pre-loaded block editing
 *   area.
 */
WorkspaceFactoryController.prototype.importPreloadFromTree_ = function(tree) {
  this.clearAndLoadXml_(tree);
  this.model.savePreloadXml(tree);
  this.updatePreview();
};

/**
 * Given a XML DOM tree, loads it into the pre-loaded workspace editing area.
 * Assumes that tree is in valid XML format and that the selected mode is
 * MODE_PRELOAD.
 * @param {!Element} tree XML tree to be loaded to pre-loaded block editing
 *   area.
 */
WorkspaceFactoryController.prototype.importPreloadFromTree_ = function(tree) {
  this.clearAndLoadXml_(tree);
  this.model.savePreloadXml(tree);
  this.saveStateFromWorkspace();
  this.updatePreview();
};

/**
 * Given a XML DOM tree, loads it into the pre-loaded workspace editing area.
 * Assumes that tree is in valid XML format and that the selected mode is
 * MODE_PRELOAD.
 * @param {!Element} tree XML tree to be loaded to pre-loaded block editing
 *   area.
 */
WorkspaceFactoryController.prototype.importPreloadFromTree_ = function(tree) {
  this.clearAndLoadXml_(tree);
  this.model.savePreloadXml(tree);
  this.saveStateFromWorkspace();
  this.updatePreview();
};

/**
 * Clears the editing area completely, deleting all categories and all
 * blocks in the model and view and all pre-loaded blocks. Tied to the
 * "Clear" button.
 */
WorkspaceFactoryController.prototype.clearAll = function() {
  var msg = 'Are you sure you want to clear all of your work in Workspace' +
      ' Factory?';
  BlocklyDevTools.Analytics.onWarning(msg);
  if (!confirm(msg)) {
    return;
  }
  this.model.clearToolboxList();
  this.view.clearToolboxTabs();
  this.model.savePreloadXml(Blockly.utils.xml.createElement('xml'));
  this.view.addEmptyCategoryMessage();
  this.view.updateState(-1, null);
  this.toolboxWorkspace.clear();
  this.toolboxWorkspace.clearUndo();
  this.saveStateFromWorkspace();
  this.hasUnsavedToolboxChanges = false;
  this.hasUnsavedPreloadChanges = false;
  this.view.setCategoryOptions(this.model.hasElements());
  this.generateNewOptions();
  this.updatePreview();
};

/**
 * Makes the currently selected block a user-generated shadow block. These
 * blocks are not made into real shadow blocks, but recorded in the model
 * and visually marked as shadow blocks, allowing the user to move and edit
 * them (which would be impossible with actual shadow blocks). Updates the
 * preview when done.
 */
WorkspaceFactoryController.prototype.addShadow = function() {
  // No block selected to make a shadow block.
  if (!Blockly.common.getSelected()) {
    return;
  }
  // Clear any previous warnings on the block (would only have warnings on
  // a non-shadow block if it was nested inside another shadow block).
  Blockly.common.getSelected().setWarningText(null);
  // Set selected block and all children as shadow blocks.
  this.addShadowForBlockAndChildren_(Blockly.common.getSelected());

  // Save and update the preview.
  this.saveStateFromWorkspace();
  this.updatePreview();
};

/**
 * Sets a block and all of its children to be user-generated shadow blocks,
 * both in the model and view.
 * @param {!Blockly.Block} block The block to be converted to a user-generated
 *    shadow block.
 * @private
 */
WorkspaceFactoryController.prototype.addShadowForBlockAndChildren_ =
    function(block) {
  // Convert to shadow block.
  this.view.markShadowBlock(block);
  this.model.addShadowBlock(block.id);

  if (FactoryUtils.hasVariableField(block)) {
    block.setWarningText('Cannot make variable blocks shadow blocks.');
  }

  // Convert all children to shadow blocks recursively.
  var children = block.getChildren();
  for (var i = 0; i < children.length; i++) {
    this.addShadowForBlockAndChildren_(children[i]);
  }
};

/**
 * If the currently selected block is a user-generated shadow block, this
 * function makes it a normal block again, removing it from the list of
 * shadow blocks and loading the workspace again. Updates the preview again.
 */
WorkspaceFactoryController.prototype.removeShadow = function() {
  // No block selected to modify.
  if (!Blockly.common.getSelected()) {
    return;
  }
  this.model.removeShadowBlock(Blockly.common.getSelected().id);
  this.view.unmarkShadowBlock(Blockly.common.getSelected());

  // If turning invalid shadow block back to normal block, remove warning.
  Blockly.common.getSelected().setWarningText(null);

  this.saveStateFromWorkspace();
  this.updatePreview();
};

/**
 * Given a unique block ID, uses the model to determine if a block is a
 * user-generated shadow block.
 * @param {string} blockId The unique ID of the block to examine.
 * @return {boolean} True if the block is a user-generated shadow block, false
 *    otherwise.
 */
WorkspaceFactoryController.prototype.isUserGenShadowBlock = function(blockId) {
  return this.model.isShadowBlock(blockId);
};

/**
 * Call when importing XML containing real shadow blocks. This function turns
 * all real shadow blocks loaded in the workspace into user-generated shadow
 * blocks, meaning they are marked as shadow blocks by the model and appear as
 * shadow blocks in the view but are still editable and movable.
 */
WorkspaceFactoryController.prototype.convertShadowBlocks = function() {
  var blocks = this.toolboxWorkspace.getAllBlocks(false);
  for (var i = 0, block; block = blocks[i]; i++) {
    if (block.isShadow()) {
      block.setShadow(false);
      // Delete the shadow DOM attached to the block so that the shadow block
      // does not respawn. Dependent on implementation details.
      var parentConnection = block.outputConnection ?
          block.outputConnection.targetConnection :
          block.previousConnection.targetConnection;
      if (parentConnection) {
        parentConnection.setShadowDom(null);
      }
      this.model.addShadowBlock(block.id);
      this.view.markShadowBlock(block);
    }
  }
};

/**
 * Sets the currently selected mode that determines what the toolbox workspace
 * is being used to edit. Updates the view and then saves and loads XML
 * to and from the toolbox and updates the help text.
 * @param {string} tab The type of tab being switched to
 *    (WorkspaceFactoryController.MODE_TOOLBOX or
 *    WorkspaceFactoryController.MODE_PRELOAD).
 */
WorkspaceFactoryController.prototype.setMode = function(mode) {
  // No work to change mode that's currently set.
  if (this.selectedMode === mode) {
    return;
  }

  // No work to change mode that's currently set.
  if (this.selectedMode === mode) {
    return;
  }

  // Set tab selection and display appropriate tab.
  this.view.setModeSelection(mode);

  // Update selected tab.
  this.selectedMode = mode;

  // Update help text above workspace.
  this.view.updateHelpText(mode);

  if (mode === WorkspaceFactoryController.MODE_TOOLBOX) {
    // Open the toolbox editing space.
    this.model.savePreloadXml
        (Blockly.Xml.workspaceToDom(this.toolboxWorkspace));
    this.clearAndLoadXml_(this.model.getSelectedXml());
    this.view.disableWorkspace(this.view.shouldDisableWorkspace
        (this.model.getSelected()));
  } else {
    // Open the pre-loaded workspace editing space.
    if (this.model.getSelected()) {
      this.model.getSelected().saveFromWorkspace(this.toolboxWorkspace);
    }
    this.clearAndLoadXml_(this.model.getPreloadXml());
    this.view.disableWorkspace(false);
  }
};

/**
 * Clears the toolbox workspace and loads XML to it, marking shadow blocks
 * as necessary.
 * @private
 * @param {!Element} xml The XML to be loaded to the workspace.
 */
WorkspaceFactoryController.prototype.clearAndLoadXml_ = function(xml) {
  this.toolboxWorkspace.clear();
  this.toolboxWorkspace.clearUndo();
  Blockly.Xml.domToWorkspace(xml, this.toolboxWorkspace);
  this.view.markShadowBlocks(this.model.getShadowBlocksInWorkspace
      (this.toolboxWorkspace.getAllBlocks(false)));
  this.warnForUndefinedBlocks_();
};

/**
 * Sets the standard default options for the options object and updates
 * the preview workspace. The default values depends on if categories are
 * present.
 */
WorkspaceFactoryController.prototype.setStandardOptionsAndUpdate = function() {
  this.view.setBaseOptions();
  this.view.setCategoryOptions(this.model.hasElements());
  this.generateNewOptions();
};

/**
 * Generates a new options object for injecting a Blockly workspace based
 * on user input. Should be called every time a change has been made to
 * an input field. Updates the model and reinjects the preview workspace.
 */
WorkspaceFactoryController.prototype.generateNewOptions = function() {
  this.model.setOptions(this.readOptions_());

  this.reinjectPreview(Blockly.utils.toolbox.parseToolboxTree(
      this.generator.generateToolboxXml()));
};

/**
 * Generates a new options object for injecting a Blockly workspace based on
 * user input.
 * @return {!Object} Blockly injection options object.
 * @private
 */
WorkspaceFactoryController.prototype.readOptions_ = function() {
  var optionsObj = Object.create(null);

  // Add all standard options to the options object.
  // Use parse int to get numbers from value inputs.
  var readonly = document.getElementById('option_readOnly_checkbox').checked;
  if (readonly) {
    optionsObj['readOnly'] = true;
  } else {
    optionsObj['collapse'] =
        document.getElementById('option_collapse_checkbox').checked;
    optionsObj['comments'] =
        document.getElementById('option_comments_checkbox').checked;
    optionsObj['disable'] =
        document.getElementById('option_disable_checkbox').checked;
    if (document.getElementById('option_infiniteBlocks_checkbox').checked) {
      optionsObj['maxBlocks'] = Infinity;
    } else {
      var maxBlocksValue =
          document.getElementById('option_maxBlocks_number').value;
      optionsObj['maxBlocks'] = typeof maxBlocksValue === 'string' ?
          parseInt(maxBlocksValue) : maxBlocksValue;
    }
    optionsObj['trashcan'] =
        document.getElementById('option_trashcan_checkbox').checked;
    optionsObj['horizontalLayout'] =
        document.getElementById('option_horizontalLayout_checkbox').checked;
    optionsObj['toolboxPosition'] =
        document.getElementById('option_toolboxPosition_checkbox').checked ?
        'end' : 'start';
  }

  optionsObj['css'] = document.getElementById('option_css_checkbox').checked;
  optionsObj['media'] = document.getElementById('option_media_text').value;
  optionsObj['rtl'] = document.getElementById('option_rtl_checkbox').checked;
  optionsObj['scrollbars'] =
      document.getElementById('option_scrollbars_checkbox').checked;
  optionsObj['sounds'] =
      document.getElementById('option_sounds_checkbox').checked;
  optionsObj['oneBasedIndex'] =
      document.getElementById('option_oneBasedIndex_checkbox').checked;

  // If using a grid, add all grid options.
  if (document.getElementById('option_grid_checkbox').checked) {
    var grid = Object.create(null);
    var spacingValue =
        document.getElementById('gridOption_spacing_number').value;
    grid['spacing'] = typeof spacingValue === 'string' ?
        parseInt(spacingValue) : spacingValue;
    var lengthValue = document.getElementById('gridOption_length_number').value;
    grid['length'] = typeof lengthValue === 'string' ?
        parseInt(lengthValue) : lengthValue;
    grid['colour'] = document.getElementById('gridOption_colour_text').value;
    if (!readonly) {
      grid['snap'] =
        document.getElementById('gridOption_snap_checkbox').checked;
    }
    optionsObj['grid'] = grid;
  }

  // If using zoom, add all zoom options.
  if (document.getElementById('option_zoom_checkbox').checked) {
    var zoom = Object.create(null);
    zoom['controls'] =
        document.getElementById('zoomOption_controls_checkbox').checked;
    zoom['wheel'] =
        document.getElementById('zoomOption_wheel_checkbox').checked;
    var startScaleValue =
        document.getElementById('zoomOption_startScale_number').value;
    zoom['startScale'] = typeof startScaleValue === 'string' ?
        Number(startScaleValue) : startScaleValue;
    var maxScaleValue =
        document.getElementById('zoomOption_maxScale_number').value;
    zoom['maxScale'] = typeof maxScaleValue === 'string' ?
        Number(maxScaleValue) : maxScaleValue;
    var minScaleValue =
        document.getElementById('zoomOption_minScale_number').value;
    zoom['minScale'] = typeof minScaleValue === 'string' ?
        Number(minScaleValue) : minScaleValue;
    var scaleSpeedValue =
        document.getElementById('zoomOption_scaleSpeed_number').value;
    zoom['scaleSpeed'] = typeof scaleSpeedValue === 'string' ?
        Number(scaleSpeedValue) : scaleSpeedValue;
    optionsObj['zoom'] = zoom;
  }

  return optionsObj;
};

/**
 * Imports blocks from a file, generating a category in the toolbox workspace
 * to allow the user to use imported blocks in the toolbox and in pre-loaded
 * blocks.
 * @param {!File} file File object for the blocks to import.
 * @param {string} format The format of the file to import, either 'JSON' or
 *    'JavaScript'.
 */
WorkspaceFactoryController.prototype.importBlocks = function(file, format) {
  // Generate category name from file name.
  var categoryName = file.name;

  var controller = this;
  var reader = new FileReader();

  // To be executed when the reader has read the file.
  reader.onload = function() {
    try {
      // Define blocks using block types from file.
      var blockTypes = FactoryUtils.defineAndGetBlockTypes(reader.result,
          format);

      // If an imported block type is already defined, check if the user wants
      // to override the current block definition.
      if (controller.model.hasDefinedBlockTypes(blockTypes)) {
        var msg = 'An imported block uses the same name as a block ' +
          'already in your toolbox. Are you sure you want to override the ' +
          'currently defined block?';
        var continueAnyway = confirm(msg);
        BlocklyDevTools.Analytics.onWarning(msg);
        if (!continueAnyway) {
          return;
        }
      }

      var blocks = controller.generator.getDefinedBlocks(blockTypes);
      // Generate category XML and append to toolbox.
      var categoryXml = FactoryUtils.generateCategoryXml(blocks, categoryName);
      // Get random colour for category between 0 and 360. Gives each imported
      // category a different colour.
      var randomColor = Math.floor(Math.random() * 360);
      categoryXml.setAttribute('colour', randomColor);
      controller.toolbox.appendChild(categoryXml);
      controller.toolboxWorkspace.updateToolbox(controller.toolbox);
      // Update imported block types.
      controller.model.addImportedBlockTypes(blockTypes);
      // Reload current category to possibly reflect any newly defined blocks.
      controller.clearAndLoadXml_
          (Blockly.Xml.workspaceToDom(controller.toolboxWorkspace));

      BlocklyDevTools.Analytics.onImport('BlockDefinitions' +
          (format === 'JSON' ? '.json' : '.js'));
    } catch (e) {
      msg = 'Cannot read blocks from file.';
      alert(msg);
      BlocklyDevTools.Analytics.onError(msg);
      window.console.log(e);
    }
  }

  // Read the file asynchronously.
  reader.readAsText(file);
};

/**
 * Updates the block library category in the toolbox workspace toolbox.
 * @param {!Element} categoryXml XML for the block library category.
 * @param {!Array<string>} libBlockTypes Array of block types from the block
 *    library.
 */
WorkspaceFactoryController.prototype.setBlockLibCategory =
    function(categoryXml, libBlockTypes) {
  var blockLibCategory = document.getElementById('blockLibCategory');

  // Set category ID so that it can be easily replaced, and set a standard,
  // arbitrary block library colour.
  categoryXml.id = 'blockLibCategory';
  categoryXml.setAttribute('colour', 260);

  // Update the toolbox and toolboxWorkspace.
  this.toolbox.replaceChild(categoryXml, blockLibCategory);
  this.toolboxWorkspace.toolbox_.clearSelection();
  this.toolboxWorkspace.updateToolbox(this.toolbox);

  // Update the block library types.
  this.model.updateLibBlockTypes(libBlockTypes);

  // Reload XML on page to account for blocks now defined or undefined in block
  // library.
  this.clearAndLoadXml_(Blockly.Xml.workspaceToDom(this.toolboxWorkspace));
};

/**
 * Return the block types used in the custom toolbox and pre-loaded workspace.
 * @return {!Array<string>} Block types used in the custom toolbox and
 *    pre-loaded workspace.
 */
WorkspaceFactoryController.prototype.getAllUsedBlockTypes = function() {
  return this.model.getAllUsedBlockTypes();
};

/**
 * Determines if a block loaded in the workspace has a definition (if it
 * is a standard block, is defined in the block library, or has a definition
 * imported).
 * @param {!Blockly.Block} block The block to examine.
 */
WorkspaceFactoryController.prototype.isDefinedBlock = function(block) {
  return this.model.isDefinedBlockType(block.type);
};

/**
 * Sets a warning on blocks loaded to the workspace that are not defined.
 * @private
 */
WorkspaceFactoryController.prototype.warnForUndefinedBlocks_ = function() {
  var blocks = this.toolboxWorkspace.getAllBlocks(false);
  for (var i = 0, block; block = blocks[i]; i++) {
    if (!this.isDefinedBlock(block)) {
      block.setWarningText(block.type + ' is not defined (it is not a ' +
          'standard block,\nin your block library, or an imported block)');
    }
  }
};

/**
 * Determines if a standard variable category is in the custom toolbox.
 * @return {boolean} True if a variables category is in use, false otherwise.
 */
WorkspaceFactoryController.prototype.hasVariablesCategory = function() {
  return this.model.hasVariables();
};

/**
 * Determines if a standard procedures category is in the custom toolbox.
 * @return {boolean} True if a procedures category is in use, false otherwise.
 */
WorkspaceFactoryController.prototype.hasProceduresCategory = function() {
  return this.model.hasProcedures();
};

/**
 * Determines if there are any unsaved changes in workspace factory.
 * @return {boolean} True if there are unsaved changes, false otherwise.
 */
WorkspaceFactoryController.prototype.hasUnsavedChanges = function() {
  return this.hasUnsavedToolboxChanges || this.hasUnsavedPreloadChanges;
};
