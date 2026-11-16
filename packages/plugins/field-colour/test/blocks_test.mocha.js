/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';

import {javascriptGenerator} from 'blockly/javascript';
import {dartGenerator} from 'blockly/dart';
import {phpGenerator} from 'blockly/php';
import {pythonGenerator} from 'blockly/python';
import {luaGenerator} from 'blockly/lua';
import {installAllBlocks} from '../src/index';
import {assert} from 'chai';

const blockJson = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: 'colour_picker',
        x: 13,
        y: 13,
        fields: {
          COLOUR: '#ff0000',
        },
      },
      {
        type: 'colour_random',
        x: 13,
        y: 113,
      },
      {
        type: 'colour_rgb',
        x: 13,
        y: 263,
        inputs: {
          RED: {
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 0,
              },
            },
          },
          GREEN: {
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 1,
              },
            },
          },
          BLUE: {
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 20,
              },
            },
          },
        },
      },
      {
        type: 'colour_blend',
        x: 13,
        y: 363,
        inputs: {
          COLOUR1: {
            shadow: {
              type: 'colour_picker',
              fields: {
                COLOUR: '#ff0000',
              },
            },
          },
          COLOUR2: {
            shadow: {
              type: 'colour_picker',
              fields: {
                COLOUR: '#3333ff',
              },
            },
          },
          RATIO: {
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 0.5,
              },
            },
          },
        },
      },
      {
        type: 'colour_picker',
        x: 13,
        y: 63,
        fields: {
          COLOUR: '#3333ff',
        },
      },
      {
        type: 'colour_rgb',
        x: 13,
        y: 163,
        inputs: {
          RED: {
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 100,
              },
            },
          },
          GREEN: {
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 50,
              },
            },
          },
          BLUE: {
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 0,
              },
            },
          },
        },
      },
      {
        type: 'colour_blend',
        x: 13,
        y: 463,
        inputs: {
          COLOUR1: {
            shadow: {
              type: 'colour_picker',
              fields: {
                COLOUR: '#000000',
              },
            },
          },
          COLOUR2: {
            shadow: {
              type: 'colour_picker',
              fields: {
                COLOUR: '#ffffff',
              },
            },
          },
          RATIO: {
            shadow: {
              type: 'math_number',
              fields: {
                NUM: 0.3,
              },
            },
          },
        },
      },
    ],
  },
};

/**
 * Assert that the generated code matches the golden code for the specified
 * language.
 * @param {string} suffix The suffix of the golden file.
 * @param {string} generated The generated code to compare against the
 *     golden file.
 */
function checkResult(suffix, generated) {
  const fileName = `test/golden/golden.${suffix}`;
  const goldenContents = fs.readFileSync(fileName);
  // Normalize the line feeds.
  const normalized = goldenContents.toString().replace(/(?:\r\n|\r|\n)/g, '\n');
  assert.equal(generated, normalized);
}

suite('Colour Block Generators', function () {
  suiteSetup(function () {
    installAllBlocks({
      javascript: javascriptGenerator,
      dart: dartGenerator,
      lua: luaGenerator,
      python: pythonGenerator,
      php: phpGenerator,
    });
  });
  setup(function () {
    this.jsdomCleanup = require('jsdom-global')(
      '<!DOCTYPE html><div id="blocklyDiv"></div>',
    );
    this.workspace = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(blockJson, this.workspace);
  });
  test('JavaScript', function () {
    const generated = javascriptGenerator.workspaceToCode(this.workspace);
    checkResult('js', generated);
  });
  test('Dart', function () {
    const generated = dartGenerator.workspaceToCode(this.workspace);
    checkResult('dart', generated);
  });
  test('Lua', function () {
    const generated = luaGenerator.workspaceToCode(this.workspace);
    checkResult('lua', generated);
  });
  test('Python', function () {
    const generated = pythonGenerator.workspaceToCode(this.workspace);
    checkResult('py', generated);
  });
  test('PHP', function () {
    const generated = phpGenerator.workspaceToCode(this.workspace);
    checkResult('php', generated);
  });
  teardown(function () {
    this.jsdomCleanup();
    this.workspace.dispose();
  });
});
