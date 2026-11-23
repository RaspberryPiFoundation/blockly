/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

const BLACK = '#000000';
const WHITE = '#ffffff';
const LIGHT_GRAY = '#eeeeee';
const DARK_GRAY = '#333333';

/**
 * Block styles for the tests. Shadow blocks are painted in the secondary
 * colour, so some styles pair a light block with a dark shadow and the other
 * way around.
 */
const TEST_THEME = new Blockly.Theme('block_foreground_test', {
  'dark': {
    'colourPrimary': DARK_GRAY,
    'colourSecondary': DARK_GRAY,
    'colourTertiary': DARK_GRAY,
  },
  'light': {
    'colourPrimary': LIGHT_GRAY,
    'colourSecondary': LIGHT_GRAY,
    'colourTertiary': LIGHT_GRAY,
  },
  'light_with_dark_shadow': {
    'colourPrimary': LIGHT_GRAY,
    'colourSecondary': DARK_GRAY,
    'colourTertiary': DARK_GRAY,
  },
  'dark_with_light_shadow': {
    'colourPrimary': DARK_GRAY,
    'colourSecondary': LIGHT_GRAY,
    'colourTertiary': DARK_GRAY,
  },
});

/**
 * Creates a rendered block of the given type and style.
 *
 * @param workspace The workspace to create the block on.
 * @param type The block type.
 * @param style The name of a block style in `TEST_THEME`.
 * @returns The new block.
 */
function createBlock(
  workspace: Blockly.WorkspaceSvg,
  type: string,
  style: string,
): Blockly.BlockSvg {
  const block = workspace.newBlock(type);
  block.setStyle(style);
  block.initSvg();
  block.render();
  return block;
}

/**
 * Returns the colour a block or field's text is drawn in.
 *
 * @param owner The block or field to read.
 * @returns The value of the `--blockly-block-foreground` property on the
 *     owner's SVG root.
 */
function getForeground(
  owner: Blockly.BlockSvg | Blockly.Field,
): string | undefined {
  return owner
    .getSvgRoot()
    ?.style.getPropertyValue('--blockly-block-foreground');
}

suite('Block foreground colour', function () {
  let workspace: Blockly.WorkspaceSvg;
  const defaultConfig = {...Blockly.config};

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    // Use the WCAG minimum for large text, so that light blocks get black
    // text. Lowering the minimum for users who prefer more contrast means the
    // tests give the same results whatever the machine running them is set to.
    Blockly.config.textContrast = 3;
    Blockly.config.increasedTextContrast = 1;
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
    Object.assign(Blockly.config, defaultConfig);
  });

  suite('Thrasos', function () {
    setup(function () {
      workspace = Blockly.inject('blocklyDiv', {
        renderer: 'thrasos',
        theme: TEST_THEME,
      });
    });

    test('dark blocks get white text', function () {
      const block = createBlock(workspace, 'text_print', 'dark');
      assert.equal(getForeground(block), WHITE);
    });

    test('light blocks get black text', function () {
      const block = createBlock(workspace, 'text_print', 'light');
      assert.equal(getForeground(block), BLACK);
    });

    test('mid-tone blocks keep white text', function () {
      // The default logic block colour. White has a contrast of 4.1 on it.
      const block = createBlock(workspace, 'text_print', 'dark');
      block.setColour('#5b80a5');
      assert.equal(getForeground(block), WHITE);
    });

    test('blocks where white is below 3:1 get black text', function () {
      // The default text block colour. White has a contrast of 2.9 on it.
      const block = createBlock(workspace, 'text_print', 'dark');
      block.setColour('#5ba58c');
      assert.equal(getForeground(block), BLACK);
    });

    test('changing the colour updates the text colour', function () {
      const block = createBlock(workspace, 'text_print', 'dark');
      block.setColour(LIGHT_GRAY);
      assert.equal(getForeground(block), BLACK);
    });

    test('shadow blocks use the shadow colour', function () {
      const block = createBlock(
        workspace,
        'math_number',
        'light_with_dark_shadow',
      );
      block.setShadow(true);
      assert.equal(getForeground(block), WHITE);
    });

    test('changing the theme updates the text colour', function () {
      const block = createBlock(workspace, 'text_print', 'dark');
      // A theme that redefines the block's 'dark' style as light.
      const newTheme = new Blockly.Theme('new_theme', {
        'dark': {
          'colourPrimary': LIGHT_GRAY,
          'colourSecondary': LIGHT_GRAY,
          'colourTertiary': LIGHT_GRAY,
        },
      });
      workspace.setTheme(newTheme);
      assert.equal(getForeground(block), BLACK);
    });

    test('disabled blocks use the disabled pattern colour', function () {
      // White has a contrast of 2.3 on the disabled pattern.
      const block = createBlock(workspace, 'text_print', 'dark');
      block.setDisabledReason(true, 'test');
      assert.equal(getForeground(block), BLACK);
    });

    test('re-enabled blocks use the block colour again', function () {
      const block = createBlock(workspace, 'text_print', 'dark');
      block.setDisabledReason(true, 'test');
      block.setDisabledReason(false, 'test');
      assert.equal(getForeground(block), WHITE);
    });
  });

  suite('Zelos', function () {
    setup(function () {
      workspace = Blockly.inject('blocklyDiv', {
        renderer: 'zelos',
        theme: TEST_THEME,
      });
    });

    test('number blocks get black text, because the field paints the block white', function () {
      const block = createBlock(workspace, 'math_number', 'dark');
      assert.equal(getForeground(block), BLACK);
    });

    test('dropdown shadows use the shadow colour', function () {
      const block = createBlock(
        workspace,
        'logic_boolean',
        'dark_with_light_shadow',
      );
      block.setShadow(true);
      assert.equal(getForeground(block), BLACK);
    });

    suite('Open dropdown', function () {
      let block: Blockly.BlockSvg;
      let field: Blockly.Field;

      setup(function () {
        // The dropdown is filled with the dark tertiary colour while it's open.
        block = createBlock(
          workspace,
          'logic_boolean',
          'light_with_dark_shadow',
        );
        const boolField = block.getField('BOOL');
        assert.exists(boolField);
        field = boolField;
        field.showEditor();
      });

      test('the dropdown text uses the dropdown colour', function () {
        assert.equal(getForeground(block), BLACK);
        assert.equal(getForeground(field), WHITE);
      });

      test('closing the dropdown goes back to the block colour', function () {
        workspace.hideChaff();
        assert.equal(getForeground(field), '');
      });
    });
  });
});
