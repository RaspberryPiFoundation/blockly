/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';


/**
 * A theme with classic colours but enables start hats.
 */
const TestHatsTheme = Blockly.Theme.defineTheme('testhats', {
  'base': Blockly.Themes.Classic
});
TestHatsTheme.setStartHats(true);

/**
 * A theme with classic colours but a different font.
 */
const TestFontTheme = Blockly.Theme.defineTheme('testfont', {
  'base': Blockly.Themes.Classic
});
TestFontTheme.setFontStyle({
  'family': '"Times New Roman", Times, serif',
  'weight': null, // Use default font-weight
  'size': 16
});

/**
 * Holds the test theme name to Theme instance mapping.
 * @type {!Object<string, Blockly.Theme>}
 * @private
 */
const testThemes_ = {
  'Test Hats': TestHatsTheme,
  'Test Font': TestFontTheme
};

/**
 * Get a test theme by name.
 * @param {string} value The theme name.
 * @return {Blockly.Theme} A theme object or undefined if one doesn't exist.
 * @package
 */
function getTestTheme(value) {
  return testThemes_[value];
}

/**
 * Populate the theme changer dropdown to list the set of test themes.
 * @package
 */
function populateTestThemes() {
  var themeChanger = document.getElementById('themeChanger');
  var keys = Object.keys(testThemes_);
  for (var i = 0, key; (key = keys[i]); i++) {
    var option = document.createElement('option');
    option.setAttribute('value', key);
    option.textContent = key;
    themeChanger.appendChild(option);
  }
}
