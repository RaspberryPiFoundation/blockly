/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Contains the code for Block Library Controller, which
 * depends on Block Library Storage and Block Library UI. Provides the
 * interfaces for the user to
 *  - save their blocks to the browser
 *  - re-open and edit saved blocks
 *  - delete blocks
 *  - clear their block library
 * Depends on BlockFactory functions defined in factory.js.
 */
'use strict';

/**
 * Block Library Controller Class
 * @param {string} blockLibraryName Desired name of Block Library, also used
 *    to create the key for where it's stored in local storage.
 * @param {!BlockLibraryStorage=} opt_blockLibraryStorage Optional storage
 *    object that allows user to import a block library.
 * @constructor
 */
function BlockLibraryController(blockLibraryName, opt_blockLibraryStorage) {
  this.name = blockLibraryName;
  // Create a new, empty Block Library Storage object, or load existing one.
  this.storage = opt_blockLibraryStorage || new BlockLibraryStorage(this.name);
  // The BlockLibraryView object handles the proper updating and formatting of
  // the block library dropdown.
  this.view = new BlockLibraryView();
};

/**
 * Returns the block type of the block the user is building.
 * @return {string} The current block's type.
 * @private
 */
BlockLibraryController.prototype.getCurrentBlockType = function() {
  var rootBlock = FactoryUtils.getRootBlock(BlockFactory.mainWorkspace);
  var blockType = rootBlock.getFieldValue('NAME').trim().toLowerCase();
  // Replace invalid characters.
  return FactoryUtils.cleanBlockType(blockType);
};

/**
 * Removes current block from Block Library and updates the save and delete
 * buttons so that user may save block to library and but not delete.
 * @param {string} blockType Type of block.
 */
BlockLibraryController.prototype.removeFromBlockLibrary = function() {
  var blockType = this.getCurrentBlockType();
  this.storage.removeBlock(blockType);
  this.storage.saveToLocalStorage();
  this.populateBlockLibrary();
  this.view.updateButtons(blockType, false, false);
};

/**
 * Updates the workspace to show the block user selected from library
 * @param {string} blockType Block to edit on block factory.
 */
BlockLibraryController.prototype.openBlock = function(blockType) {
  if (blockType) {
    var xml = this.storage.getBlockXml(blockType);
    BlockFactory.mainWorkspace.clear();
    Blockly.Xml.domToWorkspace(xml, BlockFactory.mainWorkspace);
    BlockFactory.mainWorkspace.clearUndo();
  } else {
    BlockFactory.showStarterBlock();
    this.view.setSelectedBlockType(null);
  }
};

/**
 * Returns type of block selected from library.
 * @return {string} Type of block selected.
 */
BlockLibraryController.prototype.getSelectedBlockType = function() {
  return this.view.getSelectedBlockType();
};

/**
 * Confirms with user before clearing the block library in local storage and
 * updating the dropdown and displaying the starter block (factory_base).
 */
BlockLibraryController.prototype.clearBlockLibrary = function() {
  var msg = 'Delete all blocks from library?';
  BlocklyDevTools.Analytics.onWarning(msg);
  if (confirm(msg)) {
    // Clear Block Library Storage.
    this.storage.clear();
    this.storage.saveToLocalStorage();
    // Update dropdown.
    this.view.clearOptions();
    // Show default block.
    BlockFactory.showStarterBlock();
    // User may not save the starter block, but will get explicit instructions
    // upon clicking the red save button.
    this.view.updateButtons(null);
  }
};

/**
 * Saves current block to local storage and updates dropdown.
 */
BlockLibraryController.prototype.saveToBlockLibrary = function() {
  var blockType = this.getCurrentBlockType();
  // If user has not changed the name of the starter block.
  if (reservedBlockFactoryBlocks.has(blockType) || blockType === 'block_type') {
    // Do not save block if it has the default type, 'block_type'.
    var msg = `You cannot save a block under the name "${blockType}". Try ` +
        'changing the name before saving. Then, click on the "Block Library"' +
        ' button to view your saved blocks.';
    alert(msg);
    BlocklyDevTools.Analytics.onWarning(msg);
    return;
  }

  // Create block XML.
  var xmlElement = Blockly.utils.xml.createElement('xml');
  var block = FactoryUtils.getRootBlock(BlockFactory.mainWorkspace);
  xmlElement.appendChild(Blockly.Xml.blockToDomWithXY(block));

  // Do not add option again if block type is already in library.
  if (!this.has(blockType)) {
    this.view.addOption(blockType, true, true);
  }

  // Save block.
  this.storage.addBlock(blockType, xmlElement);
  this.storage.saveToLocalStorage();

  // Show saved block without other stray blocks sitting in Block Factory's
  // main workspace.
  this.openBlock(blockType);

  // Add select handler to the new option.
  this.addOptionSelectHandler(blockType);
  BlocklyDevTools.Analytics.onSave('Block');
};

/**
 * Checks to see if the given blockType is already in Block Library
 * @param {string} blockType Type of block.
 * @return {boolean} Boolean indicating whether or not block is in the library.
 */
BlockLibraryController.prototype.has = function(blockType) {
  var blockLibrary = this.storage.blocks;
  return (blockType in blockLibrary && blockLibrary[blockType] !== null);
};

/**
 * Populates the dropdown menu.
 */
BlockLibraryController.prototype.populateBlockLibrary = function() {
  this.view.clearOptions();
  // Add an unselected option for each saved block.
  var blockLibrary = this.storage.blocks;
  for (var blockType in blockLibrary) {
    this.view.addOption(blockType, false);
  }
  this.addOptionSelectHandlers();
};

/**
 * Return block library mapping block type to XML.
 * @return {Object} Object mapping block type to XML text.
 */
BlockLibraryController.prototype.getBlockLibrary = function() {
  return this.storage.getBlockXmlTextMap();
};

/**
 * @return {Object[]} Array of JSON data, where each item is the data for one block type.
 */
BlockLibraryController.prototype.getBlockLibraryAsJson = function() {
  const xmlBlocks = this.storage.getBlockXmlMap(this.storage.getBlockTypes());
  const jsonBlocks = [];
  const headlessWorkspace = new Blockly.Workspace();

  for (const blockName in xmlBlocks) {
    // Load the block XML into a workspace so we can save it as JSON
    headlessWorkspace.clear();
    const blockXml = xmlBlocks[blockName];
    Blockly.Xml.domToWorkspace(blockXml, headlessWorkspace);
    const block = headlessWorkspace.getBlocksByType('factory_base', false)[0];

    if (!block) continue;

    const json = Blockly.serialization.blocks.save(block, {addCoordinates: false, saveIds: false});
    jsonBlocks.push(json);
  }
  return jsonBlocks;
}

/**
 * Return stored XML of a given block type.
 * @param {string} blockType The type of block.
 * @return {!Element} XML element of a given block type or null.
 */
BlockLibraryController.prototype.getBlockXml = function(blockType) {
  return this.storage.getBlockXml(blockType);
};

/**
 * Set the block library storage object from which exporter exports.
 * @param {!BlockLibraryStorage} blockLibStorage Block Library Storage object.
 */
BlockLibraryController.prototype.setBlockLibraryStorage
    = function(blockLibStorage) {
  this.storage = blockLibStorage;
};

/**
 * Get the block library storage object from which exporter exports.
 * @return {!BlockLibraryStorage} blockLibStorage Block Library Storage object
 *    that stores the blocks.
 */
BlockLibraryController.prototype.getBlockLibraryStorage = function() {
  return this.blockLibStorage;
};

/**
 * Get the block library storage object from which exporter exports.
 * @return {boolean} True if the Block Library is empty, false otherwise.
 */
BlockLibraryController.prototype.hasEmptyBlockLibrary = function() {
  return this.storage.isEmpty();
};

/**
 * Get all block types stored in block library.
 * @return {!Array<string>} Array of block types.
 */
BlockLibraryController.prototype.getStoredBlockTypes = function() {
  return this.storage.getBlockTypes();
};

/**
 * Sets the currently selected block option to none.
 */
BlockLibraryController.prototype.setNoneSelected = function() {
  this.view.setSelectedBlockType(null);
};

/**
 * If there are unsaved changes to the block in open in Block Factory
 * and the block is not the starter block, check if user wants to proceed,
 * knowing that it will cause them to lose their changes.
 * @return {boolean} Whether or not to proceed.
 */
BlockLibraryController.prototype.warnIfUnsavedChanges = function() {
  if (!FactoryUtils.savedBlockChanges(this)) {
    return confirm('You have unsaved changes. By proceeding without saving ' +
        ' your block first, you will lose these changes.');
  }
  return true;
};

/**
 * Add select handler for an option of a given block type. The handler will to
 * update the view and the selected block accordingly.
 * @param {string} blockType The type of block represented by the option is for.
 */
BlockLibraryController.prototype.addOptionSelectHandler = function(blockType) {
  var self = this;

  // Click handler for a block option. Sets the block option as the selected
  // option and opens the block for edit in Block Factory.
  var setSelectedAndOpen_ = function(blockOption) {
    var blockType = blockOption.textContent;
    self.view.setSelectedBlockType(blockType);
    self.openBlock(blockType);
    // The block is saved in the block library and all changes have been saved
    // when the user opens a block from the block library dropdown.
    // Thus, the buttons show up as a disabled update button and an enabled
    // delete.
    self.view.updateButtons(blockType, true, true);
    blocklyFactory.closeModal();
  };

  // Returns a block option select handler.
  var makeOptionSelectHandler_ = function(blockOption) {
    return function() {
      // If there are unsaved changes warn user, check if they'd like to
      // proceed with unsaved changes, and act accordingly.
      var proceedWithUnsavedChanges = self.warnIfUnsavedChanges();
      if (!proceedWithUnsavedChanges) {
        return;
      }
      setSelectedAndOpen_(blockOption);
    };
  };

  // Assign a click handler to the block option.
  var blockOption = this.view.optionMap[blockType];
  // Use an additional closure to correctly assign the tab callback.
  blockOption.addEventListener(
      'click', makeOptionSelectHandler_(blockOption));
};

/**
 * Add select handlers to each option to update the view and the selected
 * blocks accordingly.
 */
BlockLibraryController.prototype.addOptionSelectHandlers = function() {
  // Assign a click handler to each block option.
  for (var blockType in this.view.optionMap) {
    this.addOptionSelectHandler(blockType);
  }
};

/**
 * Update the save and delete buttons based on the current block type of the
 * block the user is currently editing.
 * @param {boolean} Whether changes to the block have been saved.
 */
BlockLibraryController.prototype.updateButtons = function(savedChanges) {
  var blockType = this.getCurrentBlockType();
  var isInLibrary = this.has(blockType);
  this.view.updateButtons(blockType, isInLibrary, savedChanges);
};
