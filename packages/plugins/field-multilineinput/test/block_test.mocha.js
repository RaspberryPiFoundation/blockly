/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import * as Blockly from 'blockly/core';
import * as en from 'blockly/msg/en';
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
        type: 'text_print',
        inputs: {
          TEXT: {
            block: {
              type: 'text_multiline',
              fields: {
                TEXT: 'Picard said, "Beam me up!".\nO\'Brien made it so.',
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

suite('Multiline Text Block Generators', function () {
  suiteSetup(function () {
    Blockly.setLocale(en);
    installAllBlocks({
      javascript: javascriptGenerator,
      dart: dartGenerator,
      lua: luaGenerator,
      python: pythonGenerator,
      php: phpGenerator,
    });
  });
  setup(function () {
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
    this.workspace.dispose();
  });
});
