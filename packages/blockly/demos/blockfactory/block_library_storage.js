/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Javascript for Block Library's Storage Class.
 * Depends on Block Library for its namespace.
 */

'use strict';

/**
 * Represents a block library's storage.
 * @param {string} blockLibraryName Desired name of Block Library, also used
 *    to create the key for where it's stored in local storage.
 * @param {!Object=} opt_blocks Object mapping block type to XML.
 * @constructor
 */
function BlockLibraryStorage(blockLibraryName, opt_blocks) {
  // Add prefix to this.name to avoid collisions in local storage.
  this.name = 'BlockLibraryStorage.' + blockLibraryName;
  if (!opt_blocks) {
    // Initialize this.blocks by loading from local storage.
    this.loadFromLocalStorage();
    if (this.blocks === null) {
      this.blocks = Object.create(null);
      // The line above is equivalent of {} except that this object is TRULY
      // empty. It doesn't have built-in attributes/functions such as length or
      // toString.
      this.saveToLocalStorage();
    }
  } else {
    this.blocks = opt_blocks;
    this.saveToLocalStorage();
  }
};

/**
 * Reads the named block library from local storage and saves it in this.blocks.
 */
BlockLibraryStorage.prototype.loadFromLocalStorage = function() {
  var object = localStorage[this.name];
  this.blocks = object ? JSON.parse(object) : null;
};

/**
 * Writes the current block library (this.blocks) to local storage.
 */
BlockLibraryStorage.prototype.saveToLocalStorage = function() {
  localStorage[this.name] = JSON.stringify(this.blocks);
};

/**
 * Clears the current block library.
 */
BlockLibraryStorage.prototype.clear = function() {
  this.blocks = Object.create(null);
  // The line above is equivalent of {} except that this object is TRULY
  // empty. It doesn't have built-in attributes/functions such as length or
  // toString.
};

/**
 * Saves block to block library.
 * @param {string} blockType Type of block.
 * @param {Element} blockXML The block's XML pulled from workspace.
 */
BlockLibraryStorage.prototype.addBlock = function(blockType, blockXML) {
  var prettyXml = Blockly.Xml.domToPrettyText(blockXML);
  this.blocks[blockType] = prettyXml;
};

/**
 * Removes block from current block library (this.blocks).
 * @param {string} blockType Type of block.
 */
BlockLibraryStorage.prototype.removeBlock = function(blockType) {
  delete this.blocks[blockType];
};

/**
 * Returns the XML of given block type stored in current block library
 * (this.blocks).
 * @param {string} blockType Type of block.
 * @return {Element} The XML that represents the block type or null.
 */
BlockLibraryStorage.prototype.getBlockXml = function(blockType) {
  var xml = this.blocks[blockType] || null;
  if (xml) {
    var xml = Blockly.utils.xml.textToDom(xml);
  }
  return xml;
};


/**
 * Returns map of each block type to its corresponding XML stored in current
 * block library (this.blocks).
 * @param {!Array<string>} blockTypes Types of blocks.
 * @return {!Object} Map of block type to corresponding XML.
 */
BlockLibraryStorage.prototype.getBlockXmlMap = function(blockTypes) {
  var blockXmlMap = Object.create(null);
  for (var i = 0; i < blockTypes.length; i++) {
    var blockType = blockTypes[i];
    var xml = this.getBlockXml(blockType);
    blockXmlMap[blockType] = xml;
  }
  return blockXmlMap;
};

/**
 * Returns array of all block types stored in current block library.
 * @return {!Array<string>} Array of block types stored in library.
 */
BlockLibraryStorage.prototype.getBlockTypes = function() {
  return Object.keys(this.blocks);
};

/**
 * Checks to see if block library is empty.
 * @return {boolean} True if empty, false otherwise.
 */
BlockLibraryStorage.prototype.isEmpty = function() {
  for (var blockType in this.blocks) {
    return false;
  }
  return true;
};

/**
 * Returns array of all block types stored in current block library.
 * @return {!Array<string>} Map of block type to corresponding XML text.
 */
BlockLibraryStorage.prototype.getBlockXmlTextMap = function() {
  return this.blocks;
};

/**
 * Returns boolean of whether or not a given blockType is stored in block
 * library.
 * @param {string} blockType Type of block.
 * @return {boolean} Whether or not blockType is stored in block library.
 */
BlockLibraryStorage.prototype.has = function(blockType) {
  return !!this.blocks[blockType];
};
