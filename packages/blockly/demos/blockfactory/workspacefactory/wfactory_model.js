/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Stores and updates information about state and categories
 * in workspace factory. Each list element is either a separator or a category,
 * and each category stores its name, XML to load that category, colour,
 * custom tags, and a unique ID making it possible to change category names and
 * move categories easily. Keeps track of the currently selected list
 * element. Also keeps track of all the user-created shadow blocks and
 * manipulates them as necessary.
 */

/**
 * Class for a WorkspaceFactoryModel
 * @constructor
 */
WorkspaceFactoryModel = function() {
  // Ordered list of ListElement objects. Empty if there is a single flyout.
  this.toolboxList = [];
  // ListElement for blocks in a single flyout. Null if a toolbox exists.
  this.flyout = new ListElement(ListElement.TYPE_FLYOUT);
  // Array of block IDs for all user created shadow blocks.
  this.shadowBlocks = [];
  // Reference to currently selected ListElement. Stored in this.toolboxList if
  // there are categories, or in this.flyout if blocks are displayed in a single
  // flyout.
  this.selected = this.flyout;
  // Boolean for if a Variable category has been added.
  this.hasVariableCategory = false;
  // Boolean for if a Procedure category has been added.
  this.hasProcedureCategory = false;
  // XML to be pre-loaded to workspace. Empty on default;
  this.preloadXml = Blockly.utils.xml.createElement('xml');
  // Options object to be configured for Blockly inject call.
  this.options = new Object(null);
  // Block Library block types.
  this.libBlockTypes = [];
  // Imported block types.
  this.importedBlockTypes = [];
  //
};

/**
 * Given a name, determines if it is the name of a category already present.
 * Used when getting a valid category name from the user.
 * @param {string} name String name to be compared against.
 * @return {boolean} True if string is a used category name, false otherwise.
 */
WorkspaceFactoryModel.prototype.hasCategoryByName = function(name) {
  for (var i = 0; i < this.toolboxList.length; i++) {
    if (this.toolboxList[i].type === ListElement.TYPE_CATEGORY &&
        this.toolboxList[i].name === name) {
      return true;
    }
  }
  return false;
};

/**
 * Determines if a category with the 'VARIABLE' tag exists.
 * @return {boolean} True if there exists a category with the Variables tag,
 * false otherwise.
 */
WorkspaceFactoryModel.prototype.hasVariables = function() {
  return this.hasVariableCategory;
};

/**
 * Determines if a category with the 'PROCEDURE' tag exists.
 * @return {boolean} True if there exists a category with the Procedures tag,
 * false otherwise.
 */
WorkspaceFactoryModel.prototype.hasProcedures = function() {
  return this.hasProcedureCategory;
};

/**
 * Determines if the user has any elements in the toolbox. Uses the length of
 * toolboxList.
 * @return {boolean} True if elements exist, false otherwise.
 */
WorkspaceFactoryModel.prototype.hasElements = function() {
  return this.toolboxList.length > 0;
};

/**
 * Given a ListElement, adds it to the toolbox list.
 * @param {!ListElement} element The element to be added to the list.
 */
WorkspaceFactoryModel.prototype.addElementToList = function(element) {
  // Update state if the copied category has a custom tag.
  this.hasVariableCategory = element.custom === 'VARIABLE' ? true :
      this.hasVariableCategory;
  this.hasProcedureCategory = element.custom === 'PROCEDURE' ? true :
      this.hasProcedureCategory;
  // Add element to toolboxList.
  this.toolboxList.push(element);
  // Empty single flyout.
  this.flyout = null;
};

/**
 * Given an index, deletes a list element and all associated data.
 * @param {number} index The index of the list element to delete.
 */
WorkspaceFactoryModel.prototype.deleteElementFromList = function(index) {
  // Check if index is out of bounds.
  if (index < 0 || index >= this.toolboxList.length) {
    return; // No entry to delete.
  }
  // Check if need to update flags.
  this.hasVariableCategory = this.toolboxList[index].custom === 'VARIABLE' ?
      false : this.hasVariableCategory;
  this.hasProcedureCategory = this.toolboxList[index].custom === 'PROCEDURE' ?
      false : this.hasProcedureCategory;
  // Remove element.
  this.toolboxList.splice(index, 1);
};

/**
 * Sets selected to be an empty category not in toolbox list if toolbox list
 * is empty. Should be called when removing the last element from toolbox list.
 * If the toolbox list is empty, selected stores the XML for the single flyout
 * of blocks displayed.
 */
WorkspaceFactoryModel.prototype.createDefaultSelectedIfEmpty = function() {
  if (this.toolboxList.length === 0) {
    this.flyout = new ListElement(ListElement.TYPE_FLYOUT);
    this.selected = this.flyout;
  }
};

/**
 * Moves a list element to a certain position in toolboxList by removing it
 * and then inserting it at the correct index. Checks that indices are in
 * bounds (throws error if not), but assumes that oldIndex is the correct index
 * for list element.
 * @param {!ListElement} element The element to move in toolboxList.
 * @param {number} newIndex The index to insert the element at.
 * @param {number} oldIndex The index the element is currently at.
 */
WorkspaceFactoryModel.prototype.moveElementToIndex = function(element, newIndex,
    oldIndex) {
  // Check that indexes are in bounds.
  if (newIndex < 0 || newIndex >= this.toolboxList.length || oldIndex < 0 ||
      oldIndex >= this.toolboxList.length) {
    throw Error('Index out of bounds when moving element in the model.');
  }
  this.deleteElementFromList(oldIndex);
  this.toolboxList.splice(newIndex, 0, element);
};

/**
 * Returns the ID of the currently selected element. Returns null if there are
 * no categories (if selected === null).
 * @return {string} The ID of the element currently selected.
 */
WorkspaceFactoryModel.prototype.getSelectedId = function() {
  return this.selected ? this.selected.id : null;
};

/**
 * Returns the name of the currently selected category. Returns null if there
 * are no categories (if selected === null) or the selected element is not
 * a category (in which case its name is null).
 * @return {string} The name of the category currently selected.
 */
WorkspaceFactoryModel.prototype.getSelectedName = function() {
  return this.selected ? this.selected.name : null;
};

/**
 * Returns the currently selected list element object.
 * @return {ListElement} The currently selected ListElement
 */
WorkspaceFactoryModel.prototype.getSelected = function() {
  return this.selected;
};

/**
 * Sets list element currently selected by id.
 * @param {string} id ID of list element that should now be selected.
 */
WorkspaceFactoryModel.prototype.setSelectedById = function(id) {
  this.selected = this.getElementById(id);
};

/**
 * Given an ID of a list element, returns the index of that list element in
 * toolboxList. Returns -1 if ID is not present.
 * @param {string} id The ID of list element to search for.
 * @return {number} The index of the list element in toolboxList, or -1 if it
 * doesn't exist.
 */
WorkspaceFactoryModel.prototype.getIndexByElementId = function(id) {
  for (var i = 0; i < this.toolboxList.length; i++) {
    if (this.toolboxList[i].id === id) {
      return i;
    }
  }
  return -1;  // ID not present in toolboxList.
};

/**
 * Given the ID of a list element, returns that ListElement object.
 * @param {string} id The ID of element to search for.
 * @return {ListElement} Corresponding ListElement object in toolboxList, or
 *     null if that element does not exist.
 */
WorkspaceFactoryModel.prototype.getElementById = function(id) {
  for (var i = 0; i < this.toolboxList.length; i++) {
    if (this.toolboxList[i].id === id) {
      return this.toolboxList[i];
    }
  }
  return null;  // ID not present in toolboxList.
};

/**
 * Given the index of a list element in toolboxList, returns that ListElement
 * object.
 * @param {number} index The index of the element to return.
 * @return {ListElement} The corresponding ListElement object in toolboxList.
 */
WorkspaceFactoryModel.prototype.getElementByIndex = function(index) {
  if (index < 0 || index >= this.toolboxList.length) {
    return null;
  }
  return this.toolboxList[index];
};

/**
 * Returns the XML to load the selected element.
 * @return {!Element} The XML of the selected element, or null if there is
 * no selected element.
 */
WorkspaceFactoryModel.prototype.getSelectedXml = function() {
  return this.selected ? this.selected.xml : null;
};

/**
 * Return ordered list of ListElement objects.
 * @return {!Array<!ListElement>} ordered list of ListElement objects
 */
WorkspaceFactoryModel.prototype.getToolboxList = function() {
  return this.toolboxList;
};

/**
 * Gets the ID of a category given its name.
 * @param {string} name Name of category.
 * @return {number} ID of category
 */
WorkspaceFactoryModel.prototype.getCategoryIdByName = function(name) {
  for (var i = 0; i < this.toolboxList.length; i++) {
    if (this.toolboxList[i].name === name) {
      return this.toolboxList[i].id;
    }
  }
  return null;  // Name not present in toolboxList.
};

/**
 * Clears the toolbox list, deleting all ListElements.
 */
WorkspaceFactoryModel.prototype.clearToolboxList = function() {
  this.toolboxList = [];
  this.hasVariableCategory = false;
  this.hasProcedureCategory = false;
  this.shadowBlocks = [];
  this.selected.xml = Blockly.utils.xml.createElement('xml');
};

/**
 * Class for a ListElement
 * Adds a shadow block to the list of shadow blocks.
 * @param {string} blockId The unique ID of block to be added.
 */
WorkspaceFactoryModel.prototype.addShadowBlock = function(blockId) {
  this.shadowBlocks.push(blockId);
};

/**
 * Removes a shadow block ID from the list of shadow block IDs if that ID is
 * in the list.
 * @param {string} blockId The unique ID of block to be removed.
 */
WorkspaceFactoryModel.prototype.removeShadowBlock = function(blockId) {
  for (var i = 0; i < this.shadowBlocks.length; i++) {
    if (this.shadowBlocks[i] === blockId) {
      this.shadowBlocks.splice(i, 1);
      return;
    }
  }
};

/**
 * Determines if a block is a shadow block given a unique block ID.
 * @param {string} blockId The unique ID of the block to examine.
 * @return {boolean} True if the block is a user-generated shadow block, false
 *    otherwise.
 */
WorkspaceFactoryModel.prototype.isShadowBlock = function(blockId) {
  for (var i = 0; i < this.shadowBlocks.length; i++) {
    if (this.shadowBlocks[i] === blockId) {
      return true;
    }
  }
  return false;
};

/**
 * Given a set of blocks currently loaded, returns all blocks in the workspace
 * that are user generated shadow blocks.
 * @param {!<Blockly.Block>} blocks Array of blocks currently loaded.
 * @return {!<Blockly.Block>} Array of user-generated shadow blocks currently
 *   loaded.
 */
WorkspaceFactoryModel.prototype.getShadowBlocksInWorkspace =
    function(workspaceBlocks) {
  var shadowsInWorkspace = [];
  for (var i = 0; i < workspaceBlocks.length; i++) {
    if (this.isShadowBlock(workspaceBlocks[i].id)) {
      shadowsInWorkspace.push(workspaceBlocks[i]);
    }
  }
  return shadowsInWorkspace;
};

/**
 * Adds a custom tag to a category, updating state variables accordingly.
 * Only accepts 'VARIABLE' and 'PROCEDURE' tags.
 * @param {!ListElement} category The category to add the tag to.
 * @param {string} tag The custom tag to add to the category.
 */
WorkspaceFactoryModel.prototype.addCustomTag = function(category, tag) {
  // Only update list elements that are categories.
  if (category.type !== ListElement.TYPE_CATEGORY) {
    return;
  }
  // Only update the tag to be 'VARIABLE' or 'PROCEDURE'.
  if (tag === 'VARIABLE') {
    this.hasVariableCategory = true;
    category.custom = 'VARIABLE';
  } else if (tag === 'PROCEDURE') {
    this.hasProcedureCategory = true;
    category.custom = 'PROCEDURE';
  }
};

/**
 * Have basic pre-loaded workspace working
 * Saves XML as XML to be pre-loaded into the workspace.
 * @param {!Element} xml The XML to be saved.
 */
WorkspaceFactoryModel.prototype.savePreloadXml = function(xml) {
  this.preloadXml = xml;
};

/**
 * Gets the XML to be pre-loaded into the workspace.
 * @return {!Element} The XML for the workspace.
 */
WorkspaceFactoryModel.prototype.getPreloadXml = function() {
  return this.preloadXml;
};

/**
 * Sets a new options object for injecting a Blockly workspace.
 * @param {Object} options Options object for injecting a Blockly workspace.
 */
WorkspaceFactoryModel.prototype.setOptions = function(options) {
  this.options = options;
};

/**
 * Returns an array of all the block types currently being used in the toolbox
 * and the pre-loaded blocks. No duplicates.
 * TODO(evd2014): Move pushBlockTypesToList to FactoryUtils.
 * @return {!Array<string>} Array of block types currently being used.
 */
WorkspaceFactoryModel.prototype.getAllUsedBlockTypes = function() {
  var blockTypeList = [];

  // Given XML for the workspace, adds all block types included in the XML
  // to the list, not including duplicates.
  var pushBlockTypesToList = function(xml, list) {
    // Get all block XML nodes.
    var blocks = xml.getElementsByTagName('block');

    // Add block types if not already in list.
    for (var i = 0; i < blocks.length; i++) {
      var type = blocks[i].getAttribute('type');
      if (!list.includes(type)) {
        list.push(type);
      }
    }
  };

  if (this.flyout) {
    // If has a single flyout, add block types for the single flyout.
    pushBlockTypesToList(this.getSelectedXml(), blockTypeList);
  } else {
    // If has categories, add block types for each category.

    for (var i = 0, category; category = this.toolboxList[i]; i++) {
      if (category.type === ListElement.TYPE_CATEGORY) {
        pushBlockTypesToList(category.xml, blockTypeList);
      }
    }
  }

  // Add the block types from any pre-loaded blocks.
  pushBlockTypesToList(this.getPreloadXml(), blockTypeList);

  return blockTypeList;
};

/**
 * Adds new imported block types to the list of current imported block types.
 * @param {!Array<string>} blockTypes Array of block types imported.
 */
WorkspaceFactoryModel.prototype.addImportedBlockTypes = function(blockTypes) {
  this.importedBlockTypes = this.importedBlockTypes.concat(blockTypes);
};

/**
 * Updates block types in block library.
 * @param {!Array<string>} blockTypes Array of block types in block library.
 */
WorkspaceFactoryModel.prototype.updateLibBlockTypes = function(blockTypes) {
  this.libBlockTypes = blockTypes;
};

/**
 * Determines if a block type is defined as a standard block, in the block
 * library, or as an imported block.
 * @param {string} blockType Block type to check.
 * @return {boolean} True if blockType is defined, false otherwise.
 */
WorkspaceFactoryModel.prototype.isDefinedBlockType = function(blockType) {
  var isStandardBlock =
      StandardCategories.coreBlockTypes.includes(blockType);
  var isLibBlock = this.libBlockTypes.includes(blockType);
  var isImportedBlock = this.importedBlockTypes.includes(blockType);
  return (isStandardBlock || isLibBlock || isImportedBlock);
};

/**
 * Checks if any of the block types are already defined.
 * @param {!Array<string>} blockTypes Array of block types.
 * @return {boolean} True if a block type in the array is already defined,
 *    false if none of the blocks are already defined.
 */
WorkspaceFactoryModel.prototype.hasDefinedBlockTypes = function(blockTypes) {
  for (var i = 0, blockType; blockType = blockTypes[i]; i++) {
    if (this.isDefinedBlockType(blockType)) {
      return true;
    }
  }
  return false;
};

/**
 * Class for a ListElement.
 * @constructor
 */
ListElement = function(type, opt_name) {
  this.type = type;
  // XML DOM element to load the element.
  this.xml = Blockly.utils.xml.createElement('xml');
  // Name of category. Can be changed by user. Null if separator.
  this.name = opt_name ? opt_name : null;
  // Unique ID of element. Does not change.
  this.id = Blockly.utils.idGenerator.genUid();
  // Colour of category. Default is no colour. Null if separator.
  this.colour = null;
  // Stores a custom tag, if necessary. Null if no custom tag or separator.
  this.custom = null;
};

// List element types.
ListElement.TYPE_CATEGORY = 'category';
ListElement.TYPE_SEPARATOR = 'separator';
ListElement.TYPE_FLYOUT = 'flyout';

/**
 * Saves a category by updating its XML (does not save XML for
 * elements that are not categories).
 * @param {!Blockly.workspace} workspace The workspace to save category entry
 * from.
 */
ListElement.prototype.saveFromWorkspace = function(workspace) {
  // Only save XML for categories and flyouts.
  if (this.type === ListElement.TYPE_FLYOUT ||
      this.type === ListElement.TYPE_CATEGORY) {
    this.xml = Blockly.Xml.workspaceToDom(workspace);
  }
};


/**
 * Changes the name of a category object given a new name. Returns if
 * not a category.
 * @param {string} name New name of category.
 */
ListElement.prototype.changeName = function(name) {
  // Only update list elements that are categories.
  if (this.type !== ListElement.TYPE_CATEGORY) {
    return;
  }
  this.name = name;
};

/**
 * Sets the colour of a category. If tries to set the colour of something other
 * than a category, returns.
 * @param {?string} colour The colour that should be used for that category,
 *     or null if none.
 */
ListElement.prototype.changeColour = function(colour) {
  if (this.type !== ListElement.TYPE_CATEGORY) {
    return;
  }
  this.colour = colour;
};

/**
 * Makes a copy of the original element and returns it. Everything about the
 * copy is identical except for its ID.
 * @return {!ListElement} The copy of the ListElement.
 */
ListElement.prototype.copy = function() {
  copy = new ListElement(this.type);
  // Generate a unique ID for the element.
  copy.id = Blockly.utils.idGenerator.genUid();
  // Copy all attributes except ID.
  copy.name = this.name;
  copy.xml = this.xml;
  copy.colour = this.colour;
  copy.custom = this.custom;
  // Return copy.
  return copy;
};
