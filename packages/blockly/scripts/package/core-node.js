/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Blockly core module wrapper for node.js.  This module loads
 * blockly_compressed.js and jsdom, then calls
 * Blockly.utils.xml.injectDependencies to supply needed XML-handling
 * functions to Blocky.
 *
 * Note that, unlike index.js, this file does not get a UMD wrapper.
 * This is because it is only used in node.js environments and so is
 * guaranteed to be loaded as a CJS module.
 */

/* eslint-disable */
'use strict';

const Blockly = require('./blockly_compressed.js');
const {JSDOM} = require('jsdom');

// Override textToDomDocument and provide node.js alternatives to
// DOMParser and XMLSerializer.
if (typeof globalThis.document !== 'object') {
  const {window} = new JSDOM(`<!DOCTYPE html>`);
  Blockly.utils.xml.injectDependencies(window);
}

module.exports = Blockly;
