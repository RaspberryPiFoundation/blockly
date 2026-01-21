/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Javascript for the Block Exporter Controller class. Allows
 * users to export block definitions and generator stubs of their saved blocks
 * easily using a visual interface. Depends on Block Exporter View and Block
 * Exporter Tools classes. Interacts with Export Settings in the index.html.
 */

'use strict';

/**
 * BlockExporter Controller Class
 * @param {!BlockLibrary.Storage} blockLibStorage Block Library Storage.
 * @constructor
 */
function BlockExporterController(blockLibStorage) {
  // BlockLibrary.Storage object containing user's saved blocks.
  this.blockLibStorage = blockLibStorage;
  // Utils for generating code to export.
  this.tools = new BlockExporterTools();
  // The ID of the block selector, a div element that will be populated with the
  // block options.
  this.selectorID = 'blockSelector';
  // Map of block types stored in block library to their corresponding Block
  // Option objects.
  this.blockOptions = this.tools.createBlockSelectorFromLib(
      this.blockLibStorage, this.selectorID);
  // View provides the block selector and export settings UI.
  this.view = new BlockExporterView(this.blockOptions);
};

/**
 * Set the block library storage object from which exporter exports.
 * @param {!BlockLibraryStorage} blockLibStorage Block Library Storage object
 *    that stores the blocks.
 */
BlockExporterController.prototype.setBlockLibraryStorage =
    function(blockLibStorage) {
  this.blockLibStorage = blockLibStorage;
};

/**
 * Get the block library storage object from which exporter exports.
 * @return {!BlockLibraryStorage} blockLibStorage Block Library Storage object
 *    that stores the blocks.
 */
BlockExporterController.prototype.getBlockLibraryStorage =
    function(blockLibStorage) {
  return this.blockLibStorage;
};

/**
 * Get selected blocks from block selector, pulls info from the Export
 * Settings form in Block Exporter, and downloads code accordingly.
 */
BlockExporterController.prototype.export = function() {
  // Get selected blocks' information.
  var blockTypes = this.view.getSelectedBlockTypes();
  var blockXmlMap = this.blockLibStorage.getBlockXmlMap(blockTypes);

  // Pull block definition(s) settings from the Export Settings form.
  var wantBlockDef = document.getElementById('blockDefCheck').checked;
  var definitionFormat = document.getElementById('exportFormat').value;
  var blockDef_filename = document.getElementById('blockDef_filename').value;

  // Pull block generator stub(s) settings from the Export Settings form.
  var wantGenStub = document.getElementById('genStubCheck').checked;
  var language = document.getElementById('exportLanguage').value;
  var generatorStub_filename = document.getElementById(
      'generatorStub_filename').value;

  if (wantBlockDef) {
    // User wants to export selected blocks' definitions.
    if (!blockDef_filename) {
      // User needs to enter filename.
      var msg = 'Please enter a filename for your block definition(s) download.';
      BlocklyDevTools.Analytics.onWarning(msg);
      alert(msg);
    } else {
      // Get block definition code in the selected format for the blocks.
      var blockDefs = this.tools.getBlockDefinitions(blockXmlMap,
          definitionFormat);
      // Download the file, using .js file ending for JSON or Javascript.
      FactoryUtils.createAndDownloadFile(
          blockDefs, blockDef_filename, 'javascript');
      BlocklyDevTools.Analytics.onExport(
          BlocklyDevTools.Analytics.BLOCK_DEFINITIONS,
          {
            format: (definitionFormat === 'JSON' ?
                BlocklyDevTools.Analytics.FORMAT_JSON :
                BlocklyDevTools.Analytics.FORMAT_JS)
          });
    }
  }

  if (wantGenStub) {
    // User wants to export selected blocks' generator stubs.
    if (!generatorStub_filename) {
      // User needs to enter filename.
      var msg = 'Please enter a filename for your generator stub(s) download.';
      BlocklyDevTools.Analytics.onWarning(msg);
      alert(msg);
    } else {

      // Get generator stub code in the selected language for the blocks.
      var genStubs = this.tools.getGeneratorCode(blockXmlMap,
          language);

      // Download the file.
      FactoryUtils.createAndDownloadFile(
          genStubs, generatorStub_filename + '.js', 'javascript');
      BlocklyDevTools.Analytics.onExport(
          BlocklyDevTools.Analytics.GENERATOR, { format: BlocklyDevTools.Analytics.FORMAT_JS });
    }
  }

};

/**
 * Update the Exporter's block selector with block options generated from blocks
 * stored in block library.
 */
BlockExporterController.prototype.updateSelector = function() {
  // Get previously selected block types.
  var oldSelectedTypes = this.view.getSelectedBlockTypes();

  // Generate options from block library and assign to view.
  this.blockOptions = this.tools.createBlockSelectorFromLib(
      this.blockLibStorage, this.selectorID);
  this.addBlockOptionSelectHandlers();
  this.view.setBlockOptions(this.blockOptions);

  // Select all previously selected blocks.
  for (var i = 0, blockType; blockType = oldSelectedTypes[i]; i++) {
    if (this.blockOptions[blockType]) {
      this.view.select(blockType);
    }
  }

  this.view.listSelectedBlocks();
};

/**
 * Tied to the 'Clear Selected Blocks' button in the Block Exporter.
 * Deselects all blocks in the selector and updates text accordingly.
 */
BlockExporterController.prototype.clearSelectedBlocks = function() {
  this.view.deselectAllBlocks();
  this.view.listSelectedBlocks();
};

/**
 * Tied to the 'All Stored' button in the Block Exporter 'Select' dropdown.
 * Selects all blocks stored in block library for export.
 */
BlockExporterController.prototype.selectAllBlocks = function() {
  var allBlockTypes = this.blockLibStorage.getBlockTypes();
  for (var i = 0, blockType; blockType = allBlockTypes[i]; i++) {
    this.view.select(blockType);
  }
  this.view.listSelectedBlocks();
};

/**
 * Returns the category XML containing all blocks in the block library.
 * @return {Element} XML for a category to be used in toolbox.
 */
BlockExporterController.prototype.getBlockLibraryCategory = function() {
  return this.tools.generateCategoryFromBlockLib(this.blockLibStorage);
};

/**
 * Add select handlers to each block option to update the view and the selected
 * blocks accordingly.
 */
BlockExporterController.prototype.addBlockOptionSelectHandlers = function() {
  var self = this;

  // Click handler for a block option. Toggles whether or not it's selected and
  // updates helper text accordingly.
  var updateSelectedBlockTypes_ = function(blockOption) {
    // Toggle selected.
    blockOption.setSelected(!blockOption.isSelected());

    // Show currently selected blocks in helper text.
    self.view.listSelectedBlocks();
  };

  // Returns a block option select handler.
  var makeBlockOptionSelectHandler_ = function(blockOption) {
    return function() {
      updateSelectedBlockTypes_(blockOption);
      self.updatePreview();
    };
  };

  // Assign a click handler to each block option.
  for (var blockType in this.blockOptions) {
    var blockOption = this.blockOptions[blockType];
    // Use an additional closure to correctly assign the tab callback.
    blockOption.dom.addEventListener(
        'click', makeBlockOptionSelectHandler_(blockOption));
  }
};

/**
 * Tied to the 'All Used' button in the Block Exporter's 'Select' button.
 * Selects all blocks stored in block library and used in workspace factory.
 */
BlockExporterController.prototype.selectUsedBlocks = function() {
  // Deselect all blocks.
  this.view.deselectAllBlocks();

  // Get list of block types that are in block library and used in workspace
  // factory.
  var storedBlockTypes = this.blockLibStorage.getBlockTypes();
  var sharedBlockTypes = [];
  // Keep list of custom block types used but not in library.
  var unstoredCustomBlockTypes = [];

  for (var i = 0, blockType; blockType = this.usedBlockTypes[i]; i++) {
    if (storedBlockTypes.includes(blockType)) {
      sharedBlockTypes.push(blockType);
    } else if (!StandardCategories.coreBlockTypes.includes(blockType)) {
      unstoredCustomBlockTypes.push(blockType);
    }
  }

  // Select each shared block type.
  for (var i = 0, blockType; blockType = sharedBlockTypes[i]; i++) {
    this.view.select(blockType);
  }
  this.view.listSelectedBlocks();

  if (unstoredCustomBlockTypes.length > 0) {
    // Warn user to import block definitions and generator code for blocks
    // not in their Block Library nor Blockly's standard library.
    var blockTypesText = unstoredCustomBlockTypes.join(', ');
    var customWarning = 'Custom blocks used in workspace factory but not ' +
        'stored in block library:\n ' + blockTypesText +
        '\n\nDon\'t forget to include block definitions and generator code ' +
        'for these blocks.';
    alert(customWarning);
  }
};

/**
 * Set the array that holds the block types used in workspace factory.
 * @param {!Array<string>} usedBlockTypes Block types used in
 */
BlockExporterController.prototype.setUsedBlockTypes =
    function(usedBlockTypes) {
  this.usedBlockTypes = usedBlockTypes;
};

/**
 * Updates preview code (block definitions and generator stubs) in the exporter
 * preview to reflect selected blocks.
 */
BlockExporterController.prototype.updatePreview = function() {
  // Generate preview code for selected blocks.
  var blockDefs = this.getBlockDefinitionsOfSelected();
  var genStubs = this.getGeneratorStubsOfSelected();

  // Update the text areas containing the code.
  FactoryUtils.injectCode(blockDefs, 'blockDefs_textArea');
  FactoryUtils.injectCode(genStubs, 'genStubs_textArea');
};

/**
 * Returns a map of each selected block's type to its corresponding XML.
 * @return {!Object} A map of each selected block's type (a string) to its
 * corresponding XML element.
 */
BlockExporterController.prototype.getSelectedBlockXmlMap = function() {
  var blockTypes = this.view.getSelectedBlockTypes();
  return this.blockLibStorage.getBlockXmlMap(blockTypes);
};

/**
 * Get block definition code in the selected format for selected blocks.
 * @return {string} The concatenation of each selected block's language code
 * in the format specified in export settings.
 */
BlockExporterController.prototype.getBlockDefinitionsOfSelected = function() {
  // Get selected blocks' information.
  var blockXmlMap = this.getSelectedBlockXmlMap();

  // Get block definition code in the selected format for the blocks.
  var definitionFormat = document.getElementById('exportFormat').value;
  return this.tools.getBlockDefinitions(blockXmlMap, definitionFormat);
};

/**
 * Get generator stubs in the selected language for selected blocks.
 * @return {string} The concatenation of each selected block's generator stub
 * in the language specified in export settings.
 */
BlockExporterController.prototype.getGeneratorStubsOfSelected = function() {
  // Get selected blocks' information.
  var blockXmlMap = this.getSelectedBlockXmlMap();

  // Get generator stub code in the selected language for the blocks.
  var language = document.getElementById('exportLanguage').value;
  return this.tools.getGeneratorCode(blockXmlMap, language);
};
