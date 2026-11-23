/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import {findMissingRequirements, getRequirements} from '../src/index';

const EMPTY_TOOLBOX = {kind: 'flyoutToolbox', contents: []};

/**
 * Builds a lesson artifact from a toolbox and top-level block states.
 * @param {object} options The artifact contents.
 * @param {object=} options.toolbox The toolbox definition.
 * @param {!Array<object>=} options.blocks Top-level block states for the
 *     initial workspace. An empty list gives an empty workspace state.
 * @returns {object} The lesson artifact.
 */
function makeArtifact({toolbox = EMPTY_TOOLBOX, blocks = []} = {}) {
  return {
    title: 'Test lesson',
    toolbox,
    initialWorkspaceState: blocks.length
      ? {blocks: {languageVersion: 0, blocks}}
      : {},
  };
}

suite('Lesson requirements', function () {
  suite('getRequirements', function () {
    suite('workspace state', function () {
      test('top-level block', function () {
        const artifact = makeArtifact({blocks: [{type: 'math_number'}]});
        assert.deepEqual(getRequirements(artifact), {
          blockTypes: ['math_number'],
        });
      });

      test('blocks nested in inputs', function () {
        const artifact = makeArtifact({
          blocks: [
            {
              type: 'controls_if',
              inputs: {
                IF0: {
                  block: {
                    type: 'logic_compare',
                    inputs: {A: {block: {type: 'math_number'}}},
                  },
                },
              },
            },
          ],
        });
        assert.deepEqual(getRequirements(artifact), {
          blockTypes: ['controls_if', 'logic_compare', 'math_number'],
        });
      });

      test('shadow blocks, including ones covered by a real block', function () {
        const artifact = makeArtifact({
          blocks: [
            {
              type: 'controls_repeat_ext',
              inputs: {
                TIMES: {
                  shadow: {type: 'math_number', fields: {NUM: 10}},
                  block: {type: 'math_random_int'},
                },
              },
            },
          ],
        });
        assert.deepEqual(getRequirements(artifact), {
          blockTypes: ['controls_repeat_ext', 'math_number', 'math_random_int'],
        });
      });

      test('next chains', function () {
        const artifact = makeArtifact({
          blocks: [
            {
              type: 'variables_set',
              next: {
                block: {
                  type: 'text_print',
                  next: {block: {type: 'controls_flow_statements'}},
                },
              },
            },
          ],
        });
        assert.deepEqual(getRequirements(artifact), {
          blockTypes: [
            'controls_flow_statements',
            'text_print',
            'variables_set',
          ],
        });
      });

      test('multiple top-level blocks', function () {
        const artifact = makeArtifact({
          blocks: [{type: 'text'}, {type: 'logic_boolean'}],
        });
        assert.deepEqual(getRequirements(artifact), {
          blockTypes: ['logic_boolean', 'text'],
        });
      });

      test('empty workspace', function () {
        const artifact = makeArtifact({
          toolbox: {
            kind: 'flyoutToolbox',
            contents: [{kind: 'block', type: 'text'}],
          },
        });
        assert.deepEqual(getRequirements(artifact), {blockTypes: ['text']});
      });
    });

    suite('toolbox', function () {
      test('flyout toolbox without categories', function () {
        const artifact = makeArtifact({
          toolbox: {
            kind: 'flyoutToolbox',
            contents: [
              {kind: 'block', type: 'text'},
              {kind: 'sep'},
              {kind: 'label', text: 'Logic'},
              {kind: 'block', type: 'logic_boolean'},
            ],
          },
        });
        assert.deepEqual(getRequirements(artifact), {
          blockTypes: ['logic_boolean', 'text'],
        });
      });

      test('nested categories', function () {
        const artifact = makeArtifact({
          toolbox: {
            kind: 'categoryToolbox',
            contents: [
              {
                kind: 'category',
                name: 'Outer',
                contents: [
                  {kind: 'block', type: 'text'},
                  {
                    kind: 'category',
                    name: 'Inner',
                    contents: [{kind: 'block', type: 'math_number'}],
                  },
                ],
              },
            ],
          },
        });
        assert.deepEqual(getRequirements(artifact), {
          blockTypes: ['math_number', 'text'],
        });
      });

      test('toolbox blocks with inputs and next', function () {
        const artifact = makeArtifact({
          toolbox: {
            kind: 'flyoutToolbox',
            contents: [
              {
                kind: 'block',
                type: 'controls_repeat_ext',
                inputs: {TIMES: {shadow: {type: 'math_number'}}},
                next: {block: {type: 'text_print'}},
              },
            ],
          },
        });
        assert.deepEqual(getRequirements(artifact), {
          blockTypes: ['controls_repeat_ext', 'math_number', 'text_print'],
        });
      });

      test('empty toolbox and empty workspace', function () {
        assert.deepEqual(getRequirements(makeArtifact()), {blockTypes: []});
      });
    });

    test('dedupes across toolbox and workspace', function () {
      const artifact = makeArtifact({
        toolbox: {
          kind: 'flyoutToolbox',
          contents: [
            {kind: 'block', type: 'text'},
            {kind: 'block', type: 'math_number'},
            {kind: 'block', type: 'controls_if'},
            {kind: 'block', type: 'text'},
          ],
        },
        blocks: [
          {
            type: 'text_print',
            inputs: {TEXT: {block: {type: 'text'}}},
            next: {block: {type: 'text_print'}},
          },
        ],
      });
      assert.deepEqual(getRequirements(artifact), {
        blockTypes: ['controls_if', 'math_number', 'text', 'text_print'],
      });
    });
  });

  suite('findMissingRequirements', function () {
    const artifact = makeArtifact({
      toolbox: {
        kind: 'flyoutToolbox',
        contents: [
          {kind: 'block', type: 'math_number'},
          {kind: 'block', type: 'controls_if'},
        ],
      },
      blocks: [{type: 'text_print', inputs: {TEXT: {block: {type: 'text'}}}}],
    });

    test('all supported', function () {
      const supported = {
        blockTypes: [
          'controls_if',
          'math_number',
          'text',
          'text_print',
          'logic_boolean',
        ],
      };
      assert.deepEqual(findMissingRequirements(artifact, supported), {
        blockTypes: [],
      });
    });

    test('some missing, sorted', function () {
      const supported = {blockTypes: ['text', 'math_number']};
      assert.deepEqual(findMissingRequirements(artifact, supported), {
        blockTypes: ['controls_if', 'text_print'],
      });
    });

    test('nothing supported', function () {
      assert.deepEqual(findMissingRequirements(artifact, {blockTypes: []}), {
        blockTypes: ['controls_if', 'math_number', 'text', 'text_print'],
      });
    });
  });
});
