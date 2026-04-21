/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview The toolbox label built during the custom toolbox codelab, in es6.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

class ToolboxLabel extends Blockly.ToolboxItem {
  /**
   * Constructor for a label in the toolbox.
   * @param {!Blockly.utils.toolbox.ToolboxItemInfo} toolboxItemDef The toolbox
   *    item definition. This comes directly from the toolbox definition.
   * @param {!Blockly.IToolbox} parentToolbox The toolbox that holds this
   *    toolbox item.
   * @override
   */
  constructor(toolboxItemDef, parentToolbox) {
    super(toolboxItemDef, parentToolbox);
    /**
     * The button element.
     * @type {?HTMLLabelElement}
     */
    this.label = null;
  }

  /**
   * Init method for the label.
   * @override
   */
  init() {
    // Create the label.
    this.label = document.createElement('label');
    // Set the name.
    this.label.textContent = this.toolboxItemDef_['name'];
    // Set the color.
    this.label.style.color = this.toolboxItemDef_['colour'];
    // Any attributes that begin with css- will get added to a cssconfig.
    const cssConfig = this.toolboxItemDef_['cssconfig'];
    // Add the class.
    if (cssConfig) {
      this.label.classList.add(cssConfig['label']);
    }
  }

  /**
   * Gets the div for the toolbox item.
   * @returns {HTMLLabelElement} The label element.
   * @override
   */
  getDiv() {
    return this.label;
  }
}

Blockly.registry.register(
  Blockly.registry.Type.TOOLBOX_ITEM,
  'toolboxlabel',
  ToolboxLabel,
);
