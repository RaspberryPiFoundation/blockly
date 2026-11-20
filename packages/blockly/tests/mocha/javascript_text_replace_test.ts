/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {javascriptGenerator} from '#generators/javascript.js';
import {assert} from 'chai';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('JavaScript text_replace generator', function () {
  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
  });
  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this);
  });

  /**
   * Generates JavaScript for a text_replace block, runs it, and returns the
   * resulting text.
   *
   * @param workspace The workspace to create the block in.
   * @param text The text to search.
   * @param from The text to look for.
   * @param to The text to replace it with.
   * @returns The text produced by the generated code.
   */
  function replace(
    workspace: Blockly.Workspace,
    text: string,
    from: string,
    to: string,
  ): string {
    Blockly.serialization.workspaces.load(
      {
        'variables': [{'name': 'result', 'id': 'result'}],
        'blocks': {
          'languageVersion': 0,
          'blocks': [
            {
              'type': 'variables_set',
              'fields': {'VAR': {'id': 'result'}},
              'inputs': {
                'VALUE': {
                  'block': {
                    'type': 'text_replace',
                    'inputs': {
                      'FROM': {
                        'block': {'type': 'text', 'fields': {'TEXT': from}},
                      },
                      'TO': {'block': {'type': 'text', 'fields': {'TEXT': to}}},
                      'TEXT': {
                        'block': {'type': 'text', 'fields': {'TEXT': text}},
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
      workspace,
    );
    const code = javascriptGenerator.workspaceToCode(workspace);
    return new Function(`${code}\nreturn result;`)();
  }

  test('replaces every occurrence', function (this: Mocha.Context) {
    assert.equal(
      replace(this.workspace, 'woolloomooloo', 'oo', '123'),
      'w123ll123m123l123',
    );
  });

  test('treats the text to find literally', function (this: Mocha.Context) {
    assert.equal(
      replace(this.workspace, 'woolloomooloo', '.oo', 'X'),
      'woolloomooloo',
    );
  });

  test('treats the replacement literally', function (this: Mocha.Context) {
    // These are special in a String.prototype.replace() replacement string.
    assert.equal(replace(this.workspace, 'a-b', '-', '$&$&'), 'a$&$&b');
    assert.equal(replace(this.workspace, 'a-b', '-', '$$'), 'a$$b');
    assert.equal(replace(this.workspace, 'a-b', '-', '$`'), 'a$`b');
    assert.equal(replace(this.workspace, 'a-b', '-', "$'"), "a$'b");
    assert.equal(replace(this.workspace, 'a-b', '-', '$1'), 'a$1b');
  });
});
