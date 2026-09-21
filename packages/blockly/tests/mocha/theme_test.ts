/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import sinon from 'sinon';
import {assertEventFired} from './test_helpers/events.js';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('Theme', function () {
  let eventsFireStub: sinon.SinonStub;

  setup(function (this: Mocha.Context) {
    ({eventsFireStub} = sharedTestSetup.call(this));
  });
  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this);
    // Clear all registered themes.
    const themes = Blockly.registry.getAllItems(Blockly.registry.Type.THEME);
    if (!themes) return;
    for (const theme of Object.keys(themes)) {
      Blockly.registry.unregister(Blockly.registry.Type.THEME, theme);
    }
  });

  function defineThemeTestBlocks() {
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'stack_block',
        'message0': '',
        'previousStatement': null,
        'nextStatement': null,
      },
      {
        'type': 'row_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'input_value',
            'name': 'INPUT',
          },
        ],
        'output': null,
      },
    ]);
  }

  function createBlockStyles(): {[key: string]: Blockly.Theme.BlockStyle} {
    return {
      'styleOne': {
        'colourPrimary': '#aaaaaa',
        'colourSecondary': '#bbbbbb',
        'colourTertiary': '#cccccc',
        'hat': 'cap',
      },
    };
  }

  function createMultipleBlockStyles(): {
    [key: string]: Blockly.Theme.BlockStyle;
  } {
    return {
      'styleOne': {
        'colourPrimary': '#aaaaaa',
        'colourSecondary': '#bbbbbb',
        'colourTertiary': '#cccccc',
        'hat': 'cap',
      },
      'styleTwo': {
        'colourPrimary': '#000000',
        'colourSecondary': '#999999',
        'colourTertiary': '#4d4d4d',
        'hat': '',
      },
    };
  }

  function stringifyAndCompare(val1: object, val2: object) {
    const stringVal1 = JSON.stringify(val1);
    const stringVal2 = JSON.stringify(val2);
    assert.equal(stringVal1, stringVal2);
  }

  test('Set All BlockStyles', function () {
    const theme = new Blockly.Theme('test', createBlockStyles());
    stringifyAndCompare(createBlockStyles(), theme.blockStyles);
    const blockStyles = createMultipleBlockStyles();
    for (const key in blockStyles) {
      theme.blockStyles[key] = blockStyles[key];
    }
    stringifyAndCompare(createMultipleBlockStyles(), theme.blockStyles);
  });

  test('Get All BlockStyles', function () {
    const theme = new Blockly.Theme('test', createMultipleBlockStyles());
    const allBlocks = theme.blockStyles;
    stringifyAndCompare(createMultipleBlockStyles(), allBlocks);
  });

  test('Get BlockStyles', function () {
    const theme = new Blockly.Theme('test', createBlockStyles());
    const blockStyle = theme.blockStyles['styleOne'];

    stringifyAndCompare(blockStyle, createBlockStyles().styleOne);
  });

  test('Set BlockStyle Update', function () {
    const theme = new Blockly.Theme('test', createBlockStyles());
    const blockStyle = createBlockStyles();
    blockStyle.styleOne.colourPrimary = '#00ff00';

    theme.blockStyles['styleOne'] = blockStyle.styleOne;

    stringifyAndCompare(theme.blockStyles, blockStyle);
  });

  test('Set BlockStyle Add', function () {
    const theme = new Blockly.Theme('test', createBlockStyles());
    const blockStyle = createMultipleBlockStyles();

    theme.blockStyles['styleTwo'] = blockStyle.styleTwo;

    stringifyAndCompare(theme.blockStyles, blockStyle);
  });

  test('Set Theme', function (this: Mocha.Context) {
    defineThemeTestBlocks();

    const blockStyles = createBlockStyles();
    const theme = new Blockly.Theme('themeName', blockStyles);
    const workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
    const blockA = workspace.newBlock('stack_block');

    blockA.setStyle = function () {
      this.styleName_ = 'styleTwo';
    };
    const refreshToolboxSelectionStub = sinon.stub(
      workspace,
      'refreshToolboxSelection',
    );
    blockA.setStyle('styleOne');

    workspace.setTheme(theme);

    // Checks that the theme was set correctly on Blockly namespace
    stringifyAndCompare(workspace.getTheme(), theme);

    // Checks that the setTheme function was called on the block
    assert.equal(blockA.getStyleName(), 'styleTwo');

    // Checks that the toolbox refreshed method was called
    sinon.assert.calledOnce(refreshToolboxSelectionStub);

    assertEventFired(
      eventsFireStub,
      Blockly.Events.ThemeChange,
      {themeName: 'themeName', type: Blockly.Events.THEME_CHANGE},
      workspace.id,
    );

    workspaceTeardown.call(this, workspace);
  });

  suite('Validate block styles', function () {
    let constants: Blockly.blockRendering.ConstantProvider;
    setup(function () {
      constants = new Blockly.blockRendering.ConstantProvider();
    });

    test('Null', function () {
      const expectedOutput = {
        'colourPrimary': '#000000',
        'colourSecondary': '#999999',
        'colourTertiary': '#4d4d4d',
        'hat': '',
      };
      const theme = new Blockly.Theme('test');
      constants.setTheme(theme);
      stringifyAndCompare(constants.getBlockStyle('test'), expectedOutput);
    });

    test('Empty', function () {
      const inputStyle = {};
      const expectedOutput = {
        'colourPrimary': '#000000',
        'colourSecondary': '#999999',
        'colourTertiary': '#4d4d4d',
        'hat': '',
      };
      const theme = new Blockly.Theme('test', {test: inputStyle});
      constants.setTheme(theme);
      stringifyAndCompare(constants.getBlockStyle('test'), expectedOutput);
    });

    test('Incomplete hex', function () {
      const inputStyle = {
        'colourPrimary': '#012345',
      };
      const expectedOutput = {
        'colourPrimary': '#012345',
        'colourSecondary': '#99a7b5',
        'colourTertiary': '#4d657d',
        'hat': '',
      };
      const theme = new Blockly.Theme('test', {test: inputStyle});
      constants.setTheme(theme);
      stringifyAndCompare(constants.getBlockStyle('test'), expectedOutput);
    });

    test('Complete hex', function () {
      const inputStyle = {
        'colourPrimary': '#aaaaaa',
        'colourSecondary': '#bbbbbb',
        'colourTertiary': '#cccccc',
        'hat': 'cap',
      };
      const expectedOutput = {
        'colourPrimary': '#aaaaaa',
        'colourSecondary': '#bbbbbb',
        'colourTertiary': '#cccccc',
        'hat': 'cap',
      };
      const theme = new Blockly.Theme('test', {test: inputStyle});
      constants.setTheme(theme);
      stringifyAndCompare(constants.getBlockStyle('test'), expectedOutput);
    });

    test('Complete hue', function () {
      const inputStyle = {
        'colourPrimary': '20',
        'colourSecondary': '40',
        'colourTertiary': '60',
      };
      const expectedOutput = {
        'colourPrimary': '#a5745b',
        'colourSecondary': '#a58c5b',
        'colourTertiary': '#a5a55b',
        'hat': '',
      };
      const theme = new Blockly.Theme('test', {test: inputStyle});
      constants.setTheme(theme);
      stringifyAndCompare(constants.getBlockStyle('test'), expectedOutput);
    });

    test('Incomplete hue', function () {
      const inputStyle = {
        'colourPrimary': '20',
      };
      const expectedOutput = {
        'colourPrimary': '#a5745b',
        'colourSecondary': '#dbc7bd',
        'colourTertiary': '#c09e8c',
        'hat': '',
      };
      const theme = new Blockly.Theme('test', {test: inputStyle});
      constants.setTheme(theme);
      stringifyAndCompare(constants.getBlockStyle('test'), expectedOutput);
    });

    test('Complete css colour name', function () {
      const inputStyle = {
        'colourPrimary': 'red',
        'colourSecondary': 'white',
        'colourTertiary': 'blue',
      };
      const expectedOutput = {
        'colourPrimary': '#ff0000',
        'colourSecondary': '#ffffff',
        'colourTertiary': '#0000ff',
        'hat': '',
      };
      const theme = new Blockly.Theme('test', {test: inputStyle});
      constants.setTheme(theme);
      stringifyAndCompare(constants.getBlockStyle('test'), expectedOutput);
    });

    test('Incomplete css colour name', function () {
      const inputStyle = {
        'colourPrimary': 'black',
      };
      const expectedOutput = {
        'colourPrimary': '#000000',
        'colourSecondary': '#999999',
        'colourTertiary': '#4d4d4d',
        'hat': '',
      };
      const theme = new Blockly.Theme('test', {test: inputStyle});
      constants.setTheme(theme);
      stringifyAndCompare(constants.getBlockStyle('test'), expectedOutput);
    });
  });

  suite('defineTheme', function () {
    test('Normalizes to lowercase', function () {
      const theme = Blockly.Theme.defineTheme('TEST', {name: 'TEST'});
      assert.equal(theme.name, 'test');
    });
  });
});
