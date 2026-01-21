/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generates the configuration XML used to update the preview
 * workspace or print to the console or download to a file. Leverages
 * Blockly.Xml and depends on information in the model (holds a reference).
 * Depends on a hidden workspace created in the generator to load saved XML in
 * order to generate toolbox XML.
 */


/**
 * Class for a WorkspaceFactoryGenerator
 * @constructor
 */
WorkspaceFactoryGenerator = function(model) {
  // Model to share information about categories and shadow blocks.
  this.model = model;
  // Create hidden workspace to load saved XML to generate toolbox XML.
  var hiddenBlocks = document.createElement('div');
  // Generate a globally unique ID for the hidden div element to avoid
  // collisions.
  var hiddenBlocksId = Blockly.utils.idGenerator.genUid();
  hiddenBlocks.id = hiddenBlocksId;
  hiddenBlocks.style.display = 'none';
  document.body.appendChild(hiddenBlocks);
  this.hiddenWorkspace = Blockly.inject(hiddenBlocksId);
};

/**
 * Generates the XML for the toolbox or flyout with information from
 * toolboxWorkspace and the model. Uses the hiddenWorkspace to generate XML.
 * Save state of workspace in model (saveFromWorkspace) before calling if
 * changes might have been made to the selected category.
 * @param {!Blockly.workspace} toolboxWorkspace Toolbox editing workspace where
 * blocks are added by user to be part of the toolbox.
 * @return {!Element} XML element representing toolbox or flyout corresponding
 * to toolbox workspace.
 */
WorkspaceFactoryGenerator.prototype.generateToolboxXml = function() {
  // Create DOM for XML.
  var xmlDom = Blockly.utils.xml.createElement('xml');
  xmlDom.id = 'toolbox';
  xmlDom.setAttribute('style', 'display: none');

  if (!this.model.hasElements()) {
    // Toolbox has no categories. Use XML directly from workspace.
    this.loadToHiddenWorkspace_(this.model.getSelectedXml());
    this.appendHiddenWorkspaceToDom_(xmlDom);
  } else {
    // Toolbox has categories.
    // Assert that selected !== null
    if (!this.model.getSelected()) {
      throw Error('Selected is null when the toolbox is empty.');
    }

    var xml = this.model.getSelectedXml();
    var toolboxList = this.model.getToolboxList();

    // Iterate through each category to generate XML for each using the
    // hidden workspace. Load each category to the hidden workspace to make sure
    // that all the blocks that are not top blocks are also captured as block
    // groups in the flyout.
    for (var i = 0; i < toolboxList.length; i++) {
      var element = toolboxList[i];
      if (element.type === ListElement.TYPE_SEPARATOR) {
        // If the next element is a separator.
        var nextElement = Blockly.utils.xml.createElement('sep');
      } else if (element.type === ListElement.TYPE_CATEGORY) {
        // If the next element is a category.
        var nextElement = Blockly.utils.xml.createElement('category');
        nextElement.setAttribute('name', element.name);
        // Add a colour attribute if one exists.
        if (element.colour !== null) {
          nextElement.setAttribute('colour', element.colour);
        }
        // Add a custom attribute if one exists.
        if (element.custom !== null) {
          nextElement.setAttribute('custom', element.custom);
        }
        // Load that category to hidden workspace, setting user-generated shadow
        // blocks as real shadow blocks.
        this.loadToHiddenWorkspace_(element.xml);
        this.appendHiddenWorkspaceToDom_(nextElement);
      }
      xmlDom.appendChild(nextElement);
    }
  }
  return xmlDom;
 };


 /**
  * Generates XML for the workspace (different from generateConfigXml in that
  * it includes XY and ID attributes). Uses a workspace and converts user
  * generated shadow blocks to actual shadow blocks.
  * @return {!Element} XML element representing toolbox or flyout corresponding
  * to toolbox workspace.
  */
WorkspaceFactoryGenerator.prototype.generateWorkspaceXml = function() {
  // Load workspace XML to hidden workspace with user-generated shadow blocks
  // as actual shadow blocks.
  this.hiddenWorkspace.clear();
  Blockly.Xml.domToWorkspace(this.model.getPreloadXml(), this.hiddenWorkspace);
  this.setShadowBlocksInHiddenWorkspace_();

  // Generate XML and set attributes.
  var xmlDom = Blockly.Xml.workspaceToDom(this.hiddenWorkspace);
  xmlDom.id = 'workspaceBlocks';
  xmlDom.setAttribute('style', 'display: none');
  return xmlDom;
};

/**
 * Generates a string representation of the options object for injecting the
 * workspace and starter code.
 * @return {string} String representation of starter code for injecting.
 */
WorkspaceFactoryGenerator.prototype.generateInjectString = function() {
  var addAttributes = function(obj, tabChar) {
    if (!obj) {
      return '{}\n';
    }
    var str = '';
    for (var key in obj) {
      if (key === 'grid' || key === 'zoom') {
        var temp = tabChar + key + ' : {\n' + addAttributes(obj[key],
            tabChar + '\t') + tabChar + '}, \n';
      } else if (typeof obj[key] === 'string') {
        var temp = tabChar + key + ' : \'' + obj[key] + '\', \n';
      } else {
        var temp = tabChar + key + ' : ' + obj[key] + ', \n';
      }
      str += temp;
    }
    var lastCommaIndex = str.lastIndexOf(',');
    str = str.slice(0, lastCommaIndex) + '\n';
    return str;
  };

  var attributes = addAttributes(this.model.options, '\t');
  if (!this.model.options['readOnly']) {
    attributes = '\ttoolbox : toolbox, \n' +
      attributes;
  }
  var finalStr = '/* TODO: Change toolbox XML ID if necessary. Can export ' +
      'toolbox XML from Workspace Factory. */\n' +
      'var toolbox = document.getElementById("toolbox");\n\n';
  finalStr += 'var options = { \n' + attributes + '};';
  finalStr += '\n\n/* Inject your workspace */ \nvar workspace = Blockly.' +
      'inject(/* TODO: Add ID of div to inject Blockly into */, options);';
  finalStr += '\n\n/* Load Workspace Blocks from XML to workspace. ' +
      'Remove all code below if no blocks to load */\n\n' +
      '/* TODO: Change workspace blocks XML ID if necessary. Can export' +
      ' workspace blocks XML from Workspace Factory. */\n' +
      'var workspaceBlocks = document.getElementById("workspaceBlocks"); \n\n' +
      '/* Load blocks to workspace. */\n' +
      'Blockly.Xml.domToWorkspace(workspaceBlocks, workspace);';
  return finalStr;
};

/**
 * Loads the given XML to the hidden workspace and sets any user-generated
 * shadow blocks to be actual shadow blocks.
 * @param {!Element} xml The XML to be loaded to the hidden workspace.
 * @private
 */
WorkspaceFactoryGenerator.prototype.loadToHiddenWorkspace_ = function(xml) {
  this.hiddenWorkspace.clear();
  Blockly.Xml.domToWorkspace(xml, this.hiddenWorkspace);
  this.setShadowBlocksInHiddenWorkspace_();
};

/**
 * Encodes blocks in the hidden workspace in a XML DOM element. Very
 * similar to workspaceToDom, but doesn't capture IDs. Uses the top-level
 * blocks loaded in hiddenWorkspace.
 * @private
 * @param {!Element} xmlDom Tree of XML elements to be appended to.
 */
WorkspaceFactoryGenerator.prototype.appendHiddenWorkspaceToDom_ =
    function(xmlDom) {
  var blocks = this.hiddenWorkspace.getTopBlocks();
  for (var i = 0, block; block = blocks[i]; i++) {
    var blockChild = Blockly.Xml.blockToDom(block, /* opt_noId */ true);
    xmlDom.appendChild(blockChild);
  }
};

/**
 * Sets the user-generated shadow blocks loaded into hiddenWorkspace to be
 * actual shadow blocks. This is done so that blockToDom records them as
 * shadow blocks instead of regular blocks.
 * @private
 */
WorkspaceFactoryGenerator.prototype.setShadowBlocksInHiddenWorkspace_ =
    function() {
  var blocks = this.hiddenWorkspace.getAllBlocks(false);
  for (var i = 0; i < blocks.length; i++) {
    if (this.model.isShadowBlock(blocks[i].id)) {
      blocks[i].setShadow(true);
    }
  }
};

/**
 * Given a set of block types, gets the Blockly.Block objects for each block
 * type.
 * @param {!Array<!Element>} blockTypes Array of blocks that have been defined.
 * @return {!Array<!Blockly.Block>} Array of Blockly.Block objects corresponding
 *    to the array of blockTypes.
 */
WorkspaceFactoryGenerator.prototype.getDefinedBlocks = function(blockTypes) {
  var blocks = [];
  for (var i = 0; i < blockTypes.length ; i++) {
    blocks.push(FactoryUtils.getDefinedBlock(blockTypes[i],
        this.hiddenWorkspace));
  }
  return blocks;
};
