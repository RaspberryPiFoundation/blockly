/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Stubbed interface functions for analytics integration.
 */

var BlocklyDevTools = BlocklyDevTools || Object.create(null);
BlocklyDevTools.Analytics = BlocklyDevTools.Analytics || Object.create(null);

/**
 * Whether these stub methods should log analytics calls to the console.
 * @private
 * @const
 */
BlocklyDevTools.Analytics.LOG_TO_CONSOLE_ = false;

/**
 * An import/export type id for a library of BlockFactory's original block
 * save files (each a serialized workspace of block definition blocks).
 * @package
 * @const
 */
BlocklyDevTools.Analytics.BLOCK_FACTORY_LIBRARY = "Block Factory library";
/**
 * An import/export type id for a standard Blockly library of block
 * definitions.
 * @package
 * @const
 */
BlocklyDevTools.Analytics.BLOCK_DEFINITIONS = "Block definitions";
/**
 * An import/export type id for a code generation function, or a
 * boilerplate stub of the same.
 *
 * @package
 * @const
 */
BlocklyDevTools.Analytics.GENERATOR = "Generator";
/**
 * An import/export type id for a Blockly Toolbox.
 *
 * @package
 * @const
 */
BlocklyDevTools.Analytics.TOOLBOX = "Toolbox";
/**
 * An import/export type id for the serialized contents of a workspace.
 *
 * @package
 * @const
 */
BlocklyDevTools.Analytics.WORKSPACE_CONTENTS = "Workspace contents";

/**
 * Format id for imported/exported JavaScript resources.
 *
 * @package
 * @const
 */
BlocklyDevTools.Analytics.FORMAT_JS = "JavaScript";
/**
 * Format id for imported/exported JSON resources.
 *
 * @package
 * @const
 */
BlocklyDevTools.Analytics.FORMAT_JSON = "JSON";
/**
 * Format id for imported/exported XML resources.
 *
 * @package
 * @const
 */
BlocklyDevTools.Analytics.FORMAT_XML = "XML";

/**
 * Platform id for resources exported for use in Android projects.
 *
 * @package
 * @const
 */
BlocklyDevTools.Analytics.PLATFORM_ANDROID = "Android";
/**
 * Platform id for resources exported for use in iOS projects.
 *
 * @package
 * @const
 */
BlocklyDevTools.Analytics.PLATFORM_IOS = "iOS";
/**
 * Platform id for resources exported for use in web projects.
 *
 * @package
 * @const
 */
BlocklyDevTools.Analytics.PLATFORM_WEB = "web";

/**
 * Initializes the analytics framework, including noting that the page/app was
 * opened.
 * @package
 */
BlocklyDevTools.Analytics.init = function() {
  // stub
  this.LOG_TO_CONSOLE_ && console.log('Analytics.init');
};

/**
 * Event noting the user navigated to a specific view.
 *
 * @package
 * @param viewId {string} An identifier for the view state.
 */
BlocklyDevTools.Analytics.onNavigateTo = function(viewId) {
  // stub
  this.LOG_TO_CONSOLE_ &&
      console.log('Analytics.onNavigateTo(' + viewId + ')');
};

/**
 * Event noting a project resource was saved. In the web Block Factory, this
 * means saved to localStorage.
 *
 * @package
 * @param typeId {string} An identifying string for the saved type.
 */
BlocklyDevTools.Analytics.onSave = function(typeId) {
  // stub
  this.LOG_TO_CONSOLE_ && console.log('Analytics.onSave(' + typeId + ')');
};

/**
 * Event noting the user attempted to import a resource file.
 *
 * @package
 * @param typeId {string} An identifying string for the imported type.
 * @param optMetadata {Object} Metadata about the import, such as format and
 *                             platform.
 */
BlocklyDevTools.Analytics.onImport = function(typeId, optMetadata) {
  // stub
  this.LOG_TO_CONSOLE_ && console.log('Analytics.onImport(' + typeId +
      (optMetadata ? '): ' + JSON.stringify(optMetadata) : ')'));
};

/**
 * Event noting a project resource was saved. In the web Block Factory, this
 * means downloaded to the user's system.
 *
 * @package
 * @param typeId {string} An identifying string for the exported object type.
 * @param optMetadata {Object} Metadata about the import, such as format and
 *                             platform.
 */
BlocklyDevTools.Analytics.onExport = function(typeId, optMetadata) {
  // stub
  this.LOG_TO_CONSOLE_ && console.log('Analytics.onExport(' + typeId +
      (optMetadata ? '): ' + JSON.stringify(optMetadata) : ')'));
};

/**
 * Event noting the system encountered an error. It should attempt to send
 * immediately.
 *
 * @package
 * @param e {!Object} A value representing or describing the error.
 */
BlocklyDevTools.Analytics.onError = function(e) {
  // stub
  this.LOG_TO_CONSOLE_ && console.log('Analytics.onError("' + e + '")');
};

/**
 * Event noting the user was notified with a warning.
 *
 * @package
 * @param msg {string} The warning message, or a description thereof.
 */
BlocklyDevTools.Analytics.onWarning = function(msg) {
  // stub
  this.LOG_TO_CONSOLE_ && console.log('Analytics.onWarning("' + msg + '")');
};

/**
 * Request the analytics framework to send any queued events to the server.
 * @package
 */
BlocklyDevTools.Analytics.sendQueued = function() {
  // stub
  this.LOG_TO_CONSOLE_ && console.log('Analytics.sendQueued');
};
