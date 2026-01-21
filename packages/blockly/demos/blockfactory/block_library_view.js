/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Javascript for BlockLibraryView class. It manages the display
 * of the Block Library dropdown, save, and delete buttons.
 */

'use strict';

/**
 * BlockLibraryView Class
 * @constructor
 */
var BlockLibraryView = function() {
  // Div element to contain the block types to choose from.
  this.dropdown = document.getElementById('dropdownDiv_blockLib');
  // Map of block type to corresponding 'a' element that is the option in the
  // dropdown. Used to quickly and easily get a specific option.
  this.optionMap = Object.create(null);
  // Save and delete buttons.
  this.saveButton = document.getElementById('saveToBlockLibraryButton');
  this.deleteButton = document.getElementById('removeBlockFromLibraryButton');
  // Initially, user should not be able to delete a block. They must save a
  // block or select a stored block first.
  this.deleteButton.disabled = true;
};

/**
 * Creates a node of a given element type and appends to the node with given ID.
 * @param {string} blockType Type of block.
 * @param {boolean} selected Whether or not the option should be selected on
 *    the dropdown.
 */
BlockLibraryView.prototype.addOption = function(blockType, selected) {
  // Create option.
  var option = document.createElement('a');
  option.id ='dropdown_' + blockType;
  option.classList.add('blockLibOpt');
  option.textContent = blockType;

  // Add option to dropdown.
  this.dropdown.appendChild(option);
  this.optionMap[blockType] = option;

  // Select the block.
  if (selected) {
    this.setSelectedBlockType(blockType);
  }
};

/**
 * Sets a given block type to selected and all other blocks to deselected.
 * If null, deselects all blocks.
 * @param {string} blockTypeToSelect Type of block to select or null.
 */
BlockLibraryView.prototype.setSelectedBlockType = function(blockTypeToSelect) {
  // Select given block type and deselect all others. Will deselect all blocks
  // if null or invalid block type selected.
  for (var blockType in this.optionMap) {
    var option = this.optionMap[blockType];
    if (blockType === blockTypeToSelect) {
      this.selectOption_(option);
    } else {
      this.deselectOption_(option);
    }
  }
};

/**
 * Selects a given option.
 * @param {!Element} option HTML 'a' element in the dropdown that represents
 *    a particular block type.
 * @private
 */
BlockLibraryView.prototype.selectOption_ = function(option) {
  option.classList.add('dropdown-content-selected');
};

/**
 * Deselects a given option.
 * @param {!Element} option HTML 'a' element in the dropdown that represents
 *    a particular block type.
 * @private
 */
BlockLibraryView.prototype.deselectOption_ = function(option) {
  option.classList.remove('dropdown-content-selected');
};

/**
 * Updates the save and delete buttons to represent how the current block will
 * be saved by including the block type in the button text as well as indicating
 * whether the block is being saved or updated.
 * @param {string} blockType The type of block being edited.
 * @param {boolean} isInLibrary Whether the block type is in the library.
 * @param {boolean} savedChanges Whether changes to block have been saved.
 */
BlockLibraryView.prototype.updateButtons =
    function(blockType, isInLibrary, savedChanges) {
  if (blockType) {
    // User is editing a block.

    if (!isInLibrary) {
      // Block type has not been saved to the library yet.
      // Disable the delete button.
      this.saveButton.textContent = 'Save "' + blockType + '"';
      this.deleteButton.disabled = true;
    } else {
      // A version of the block type has already been saved.
      // Enable the delete button.
      this.saveButton.textContent = 'Update "' + blockType + '"';
      this.deleteButton.disabled = false;
    }
    this.deleteButton.textContent = 'Delete "' + blockType + '"';

    this.saveButton.classList.remove('button_alert', 'button_warn');
    if (!savedChanges) {
      var buttonFormatClass;

      var isReserved = reservedBlockFactoryBlocks.has(blockType);
      if (isReserved || blockType === 'block_type') {
        // Make button red to alert user that the block type can't be saved.
        buttonFormatClass = 'button_alert';
      } else {
        // Block type has not been saved to library yet or has unsaved changes.
        // Make the button green to encourage the user to save the block.
        buttonFormatClass = 'button_warn';
      }
      this.saveButton.classList.add(buttonFormatClass);
      this.saveButton.disabled = false;

    } else {
      // No changes to save.
      this.saveButton.disabled = true;
    }

  }
};

/**
 * Removes option currently selected in dropdown from dropdown menu.
 */
BlockLibraryView.prototype.removeSelectedOption = function() {
  var selectedOption = this.getSelectedOption();
  this.dropdown.removeNode(selectedOption);
};

/**
 * Returns block type of selected block.
 * @return {string} Type of block selected.
 */
BlockLibraryView.prototype.getSelectedBlockType = function() {
  var selectedOption = this.getSelectedOption();
  var blockType = selectedOption.textContent;
  return blockType;
};

/**
 * Returns selected option.
 * @return {!Element} HTML 'a' element that is the option for a block type.
 */
BlockLibraryView.prototype.getSelectedOption = function() {
  return this.dropdown.getElementsByClassName('dropdown-content-selected')[0];
};

/**
 * Removes all options from dropdown.
 */
BlockLibraryView.prototype.clearOptions = function() {
  var blockOpts = this.dropdown.getElementsByClassName('blockLibOpt');
  var option;
  while ((option = blockOpts[0])) {
    option.parentNode.removeChild(option);
  }
};
