/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Controls the UI elements for workspace factory, mainly the category tabs.
 * Also includes downloading files because that interacts directly with the DOM.
 * Depends on WorkspaceFactoryController (for adding mouse listeners). Tabs for
 * each category are stored in tab map, which associates a unique ID for a
 * category with a particular tab.
 */


/**
 * Class for a WorkspaceFactoryView
 * @constructor
 */
WorkspaceFactoryView = function() {
  // For each tab, maps ID of a ListElement to the td DOM element.
  this.tabMap = Object.create(null);
};

/**
 * Adds a category tab to the UI, and updates tabMap accordingly.
 * @param {string} name The name of the category being created
 * @param {string} id ID of category being created
 * @return {!Element} DOM element created for tab
 */
WorkspaceFactoryView.prototype.addCategoryRow = function(name, id) {
  var table = document.getElementById('categoryTable');
  var count = table.rows.length;

  // Delete help label and enable category buttons if it's the first category.
  if (count === 0) {
    document.getElementById('categoryHeader').textContent = 'Your categories:';
  }

  // Create tab.
  var row = table.insertRow(count);
  var nextEntry = row.insertCell(0);
  // Configure tab.
  nextEntry.id = this.createCategoryIdName(name);
  nextEntry.textContent = name;
  // Store tab.
  this.tabMap[id] = table.rows[count].cells[0];
  // Return tab.
  return nextEntry;
};

/**
 * Deletes a category tab from the UI and updates tabMap accordingly.
 * @param {string} id ID of category to be deleted.
 * @param {string} name The name of the category to be deleted.
 */
WorkspaceFactoryView.prototype.deleteElementRow = function(id, index) {
  // Delete tab entry.
  delete this.tabMap[id];
  // Delete tab row.
  var table = document.getElementById('categoryTable');
  var count = table.rows.length;
  table.deleteRow(index);

  // If last category removed, add category help text and disable category
  // buttons.
  this.addEmptyCategoryMessage();
};

/**
 * If there are no toolbox elements created, adds a help message to show
 * where categories will appear. Should be called when deleting list elements
 * in case the last element is deleted.
 */
WorkspaceFactoryView.prototype.addEmptyCategoryMessage = function() {
  var table = document.getElementById('categoryTable');
  if (!table.rows.length) {
    document.getElementById('categoryHeader').textContent =
        'You currently have no categories.';
  }
};

/**
 * Given the index of the currently selected element, updates the state of
 * the buttons that allow the user to edit the list elements. Updates the edit
 * and arrow buttons. Should be called when adding or removing elements
 * or when changing to a new element or when swapping to a different element.
 * TODO(evd2014): Switch to using CSS to add/remove styles.
 * @param {number} selectedIndex The index of the currently selected category,
 *   -1 if no categories created.
 * @param {ListElement} selected The selected ListElement.
 */
WorkspaceFactoryView.prototype.updateState = function(selectedIndex, selected) {
  // Disable/enable editing buttons as necessary.
  document.getElementById('button_editCategory').disabled = selectedIndex < 0 ||
      selected.type !== ListElement.TYPE_CATEGORY;
  document.getElementById('button_remove').disabled = selectedIndex < 0;
  document.getElementById('button_up').disabled = selectedIndex <= 0;
  var table = document.getElementById('categoryTable');
  document.getElementById('button_down').disabled = selectedIndex >=
      table.rows.length - 1 || selectedIndex < 0;
  // Disable/enable the workspace as necessary.
  this.disableWorkspace(this.shouldDisableWorkspace(selected));
};

/**
 * Determines the DOM ID for a category given its name.
 * @param {string} name Name of category
 * @return {string} ID of category tab
 */
WorkspaceFactoryView.prototype.createCategoryIdName = function(name) {
  return 'tab_' + name;
};

/**
 * Switches a tab on or off.
 * @param {string} id ID of the tab to switch on or off.
 * @param {boolean} selected True if tab should be on, false if tab should be
 * off.
 */
WorkspaceFactoryView.prototype.setCategoryTabSelection =
    function(id, selected) {
  if (!this.tabMap[id]) {
    return;  // Exit if tab does not exist.
  }
  this.tabMap[id].className = selected ? 'tabon' : 'taboff';
};

/**
 * Used to bind a click to a certain DOM element (used for category tabs).
 * Taken directly from code.js
 * @param {string|!Element} e1 Tab element or corresponding ID string.
 * @param {!Function} func Function to be executed on click.
 */
WorkspaceFactoryView.prototype.bindClick = function(el, func) {
  if (typeof el === 'string') {
    el = document.getElementById(el);
  }
  el.addEventListener('click', func, true);
  el.addEventListener('touchend', func, true);
};

/**
 * Creates a file and downloads it. In some browsers downloads, and in other
 * browsers, opens new tab with contents.
 * @param {string} filename Name of file.
 * @param {!Blob} data Blob containing contents to download.
 */
WorkspaceFactoryView.prototype.createAndDownloadFile =
    function(filename, data) {
  var clickEvent = new MouseEvent('click', {
    'view': window,
    'bubbles': true,
    'cancelable': false
  });
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(data);
  a.download = filename;
  a.textContent = 'Download file!';
  a.dispatchEvent(clickEvent);
};

/**
 * Given the ID of a certain category, updates the corresponding tab in
 * the DOM to show a new name.
 * @param {string} newName Name of string to be displayed on tab.
 * @param {string} id ID of category to be updated.
 */
WorkspaceFactoryView.prototype.updateCategoryName = function(newName, id) {
  this.tabMap[id].textContent = newName;
  this.tabMap[id].id = this.createCategoryIdName(newName);
};

/**
 * Moves a tab from one index to another. Adjusts index inserting before
 * based on if inserting before or after. Checks that the indexes are in
 * bounds, throws error if not.
 * @param {string} id The ID of the category to move.
 * @param {number} newIndex The index to move the category to.
 * @param {number} oldIndex The index the category is currently at.
 */
WorkspaceFactoryView.prototype.moveTabToIndex =
    function(id, newIndex, oldIndex) {
  var table = document.getElementById('categoryTable');
  // Check that indexes are in bounds.
  if (newIndex < 0 || newIndex >= table.rows.length || oldIndex < 0 ||
      oldIndex >= table.rows.length) {
    throw Error('Index out of bounds when moving tab in the view.');
  }

  if (newIndex < oldIndex) {
    // Inserting before.
    var row = table.insertRow(newIndex);
    row.appendChild(this.tabMap[id]);
    table.deleteRow(oldIndex + 1);
  } else {
    // Inserting after.
    var row = table.insertRow(newIndex + 1);
    row.appendChild(this.tabMap[id]);
    table.deleteRow(oldIndex);
  }
};

/**
 * Given a category ID and colour, use that colour to colour the left border of
 * the tab for that category.
 * @param {string} id The ID of the category to colour.
 * @param {?string} colour The colour for to be used for the border of the tab,
 *   or null if none.  Must be a valid CSS string.
 */
WorkspaceFactoryView.prototype.setBorderColour = function(id, colour) {
  var style = this.tabMap[id].style;
  if (colour) {
    style.borderLeftWidth = '8px';
    style.borderLeftStyle = 'solid';
    style.borderColor = colour;
  } else {
    style.borderLeftWidth = '';
    style.borderLeftStyle = '';
    style.borderColor = '';
  }
};

/**
 * Given a separator ID, creates a corresponding tab in the view, updates
 * tab map, and returns the tab.
 * @param {string} id The ID of the separator.
 * @param {!Element} The td DOM element representing the separator.
 */
WorkspaceFactoryView.prototype.addSeparatorTab = function(id) {
  var table = document.getElementById('categoryTable');
  var count = table.rows.length;

  if (count === 0) {
    document.getElementById('categoryHeader').textContent = 'Your categories:';
  }
  // Create separator.
  var row = table.insertRow(count);
  var nextEntry = row.insertCell(0);
  // Configure separator.
  nextEntry.style.height = '10px';
  // Store and return separator.
  this.tabMap[id] = table.rows[count].cells[0];
  return nextEntry;
};

/**
 * Disables or enables the workspace by putting a div over or under the
 * toolbox workspace, depending on the value of disable. Used when switching
 * to/from separators where the user shouldn't be able to drag blocks into
 * the workspace.
 * @param {boolean} disable True if the workspace should be disabled, false
 * if it should be enabled.
 */
WorkspaceFactoryView.prototype.disableWorkspace = function(disable) {
  if (disable) {
    document.getElementById('toolbox_section').className = 'disabled';
    document.getElementById('toolbox_blocks').style.pointerEvents = 'none';
  } else {
    document.getElementById('toolbox_section').className = '';
    document.getElementById('toolbox_blocks').style.pointerEvents = 'auto';
  }

};

/**
 * Determines if the workspace should be disabled. The workspace should be
 * disabled if category is a separator or has VARIABLE or PROCEDURE tags.
 * @return {boolean} True if the workspace should be disabled, false otherwise.
 */
WorkspaceFactoryView.prototype.shouldDisableWorkspace = function(category) {
  return category !== null && category.type !== ListElement.TYPE_FLYOUT &&
      (category.type === ListElement.TYPE_SEPARATOR ||
      category.custom === 'VARIABLE' || category.custom === 'PROCEDURE');
};

/**
 * Removes all categories and separators in the view. Clears the tabMap to
 * reflect this.
 */
WorkspaceFactoryView.prototype.clearToolboxTabs = function() {
  this.tabMap = [];
  var oldCategoryTable = document.getElementById('categoryTable');
  var newCategoryTable = document.createElement('table');
  newCategoryTable.id = 'categoryTable';
  newCategoryTable.style.width = 'auto';
  oldCategoryTable.parentElement.replaceChild(newCategoryTable,
      oldCategoryTable);
};

/**
 * Given a set of blocks currently loaded user-generated shadow blocks, visually
 * marks them without making them actual shadow blocks (allowing them to still
 * be editable and movable).
 * @param {!Array<!Blockly.Block>} blocks Array of user-generated shadow blocks
 * currently loaded.
 */
WorkspaceFactoryView.prototype.markShadowBlocks = function(blocks) {
  for (var i = 0; i < blocks.length; i++) {
    this.markShadowBlock(blocks[i]);
  }
};

/**
 * Visually marks a user-generated shadow block as a shadow block in the
 * workspace without making the block an actual shadow block (allowing it
 * to be moved and edited).
 * @param {!Blockly.Block} block The block that should be marked as a shadow
 *   block (must be rendered).
 */
WorkspaceFactoryView.prototype.markShadowBlock = function(block) {
  // Add Blockly CSS for user-generated shadow blocks.
  block.getSvgRoot().classList.add('shadowBlock');
  // If not a valid shadow block, add a warning message.
  if (!block.getSurroundParent()) {
      block.setWarningText('Shadow blocks must be nested inside' +
          ' other blocks to be displayed.');
  }
  if (FactoryUtils.hasVariableField(block)) {
    block.setWarningText('Cannot make variable blocks shadow blocks.');
  }
};

/**
 * Removes visual marking for a shadow block given a rendered block.
 * @param {!Blockly.Block} block The block that should be unmarked as a shadow
 *   block (must be rendered).
 */
WorkspaceFactoryView.prototype.unmarkShadowBlock = function(block) {
  // Remove Blockly CSS for user-generated shadow blocks.
  block.getSvgRoot().classList.remove('shadowBlock');
};

/**
 * Sets the tabs for modes according to which mode the user is currently
 * editing in.
 * @param {string} mode The mode being switched to
 *   (WorkspaceFactoryController.MODE_TOOLBOX or WorkspaceFactoryController.MODE_PRELOAD).
 */
WorkspaceFactoryView.prototype.setModeSelection = function(mode) {
  document.getElementById('tab_preload').className = mode ===
      WorkspaceFactoryController.MODE_PRELOAD ? 'tabon' : 'taboff';
  document.getElementById('preload_div').style.display = mode ===
      WorkspaceFactoryController.MODE_PRELOAD ? 'block' : 'none';
  document.getElementById('tab_toolbox').className = mode ===
      WorkspaceFactoryController.MODE_TOOLBOX ? 'tabon' : 'taboff';
  document.getElementById('toolbox_div').style.display = mode ===
      WorkspaceFactoryController.MODE_TOOLBOX ? 'block' : 'none';
};

/**
 * Updates the help text above the workspace depending on the selected mode.
 * @param {string} mode The selected mode (WorkspaceFactoryController.MODE_TOOLBOX or
 *   WorkspaceFactoryController.MODE_PRELOAD).
 */
WorkspaceFactoryView.prototype.updateHelpText = function(mode) {
  if (mode === WorkspaceFactoryController.MODE_TOOLBOX) {
    var helpText = 'Drag blocks into the workspace to configure the toolbox ' +
        'in your custom workspace.';
  } else {
    var helpText = 'Drag blocks into the workspace to pre-load them in your ' +
        'custom workspace.'
  }
  document.getElementById('editHelpText').textContent = helpText;
};

/**
 * Sets the basic options that are not dependent on if there are categories
 * or a single flyout of blocks. Updates checkboxes and text fields.
 */
WorkspaceFactoryView.prototype.setBaseOptions = function() {
  // Readonly mode.
  document.getElementById('option_readOnly_checkbox').checked = false;
  blocklyFactory.ifCheckedEnable(true, ['readonly1', 'readonly2']);

  // Set basic options.
  document.getElementById('option_css_checkbox').checked = true;
  document.getElementById('option_maxBlocks_number').value = 100;
  document.getElementById('option_media_text').value =
      'https://blockly-demo.appspot.com/static/media/';
  document.getElementById('option_rtl_checkbox').checked = false;
  document.getElementById('option_sounds_checkbox').checked = true;
  document.getElementById('option_oneBasedIndex_checkbox').checked = true;
  document.getElementById('option_horizontalLayout_checkbox').checked = false;
  document.getElementById('option_toolboxPosition_checkbox').checked = false;

  // Check infinite blocks and hide suboption.
  document.getElementById('option_infiniteBlocks_checkbox').checked = true;
  document.getElementById('maxBlockNumber_option').style.display = 'none';

  // Uncheck grid and zoom options and hide suboptions.
  document.getElementById('option_grid_checkbox').checked = false;
  document.getElementById('grid_options').style.display = 'none';
  document.getElementById('option_zoom_checkbox').checked = false;
  document.getElementById('zoom_options').style.display = 'none';

  // Set grid options.
  document.getElementById('gridOption_spacing_number').value = 20;
  document.getElementById('gridOption_length_number').value = 1;
  document.getElementById('gridOption_colour_text').value = '#888';
  document.getElementById('gridOption_snap_checkbox').checked = false;

  // Set zoom options.
  document.getElementById('zoomOption_controls_checkbox').checked = true;
  document.getElementById('zoomOption_wheel_checkbox').checked = true;
  document.getElementById('zoomOption_startScale_number').value = 1.0;
  document.getElementById('zoomOption_maxScale_number').value = 3;
  document.getElementById('zoomOption_minScale_number').value = 0.3;
  document.getElementById('zoomOption_scaleSpeed_number').value = 1.2;
};

/**
 * Updates category specific options depending on if there are categories
 * currently present. Updates checkboxes and text fields in the view.
 * @param {boolean} hasCategories True if categories are present, false if all
 *    blocks are displayed in a single flyout.
 */
WorkspaceFactoryView.prototype.setCategoryOptions = function(hasCategories) {
  document.getElementById('option_collapse_checkbox').checked = hasCategories;
  document.getElementById('option_comments_checkbox').checked = hasCategories;
  document.getElementById('option_disable_checkbox').checked = hasCategories;
  document.getElementById('option_scrollbars_checkbox').checked = hasCategories;
  document.getElementById('option_trashcan_checkbox').checked = hasCategories;
};
