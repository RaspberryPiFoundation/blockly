/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** @fileoverview Mocha tests that test Blockly in Node. */

console.log(process.cwd());

// N.B. the file ./node_modules/blockly-test should be a symlink to
// RELEASE_DIR (i.e. dist/) so that require will load the packaged
// version of blockly as if it were an external dependency.
//
// Moreover, (as with the typescript tests) this link has to be
// called something other than "blockly", because the node module
// resolution will favour loading the nearest enclosing package
// of the same name, which means that require('blockly') will load
// based on the exports section of the package.json in the repository
// root, but this fails because (at the time of writing) those paths
// are relative to RELEASE_DIR (dist/, into which package.json is
// copied when packaged), resulting in require() looking for the
// compressed bundles in the wrong place.

import * as Blockly from 'blockly-test';
import {javascriptGenerator} from 'blockly-test/javascript';
import {assert} from 'chai';

const xmlText =
  '<xml xmlns="https://developers.google.com/blockly/xml">\n' +
  '  <block type="text_print" x="37" y="63">\n' +
  '    <value name="TEXT">\n' +
  '      <shadow type="text">\n' +
  '        <field name="TEXT">Hello from Blockly!</field>\n' +
  '      </shadow>\n' +
  '    </value>\n' +
  '  </block>\n' +
  '</xml>';

const json = {
  'blocks': {
    'languageVersion': 0,
    'blocks': [
      {
        'type': 'procedures_defnoreturn',
        'id': '0!;|f{%4H@mgQ`SIEDKV',
        'x': 38,
        'y': 163,
        'icons': {
          'comment': {
            'text': 'Describe this function...',
            'pinned': false,
            'height': 80,
            'width': 160,
          },
        },
        'fields': {
          'NAME': 'say hello',
        },
        'inputs': {
          'STACK': {
            'block': {
              'type': 'text_print',
              'id': 't^`WoL~R$t}rk]`JVFUP',
              'inputs': {
                'TEXT': {
                  'shadow': {
                    'type': 'text',
                    'id': '_PxHV1tqEy60kP^].Qhh',
                    'fields': {
                      'TEXT': 'abc',
                    },
                  },
                  'block': {
                    'type': 'text_join',
                    'id': 'K4.OZ9ql9j0f367238R@',
                    'extraState': {
                      'itemCount': 2,
                    },
                    'inputs': {
                      'ADD0': {
                        'block': {
                          'type': 'text',
                          'id': '5ElufS^j4;l:9N#|Yt$X',
                          'fields': {
                            'TEXT': 'The meaning of life is',
                          },
                        },
                      },
                      'ADD1': {
                        'block': {
                          'type': 'math_arithmetic',
                          'id': ',QfcN`h]rQ86a]6J|di1',
                          'fields': {
                            'OP': 'MINUS',
                          },
                          'inputs': {
                            'A': {
                              'shadow': {
                                'type': 'math_number',
                                'id': 'ClcKUIPYleVQ_j7ZjK]^',
                                'fields': {
                                  'NUM': 44,
                                },
                              },
                            },
                            'B': {
                              'shadow': {
                                'type': 'math_number',
                                'id': 'F_cU|uaP7oB-k(j~@X?g',
                                'fields': {
                                  'NUM': 2,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        'type': 'procedures_callnoreturn',
        'id': 'Ad^$sruQ.`6zNmQ6jPit',
        'x': 38,
        'y': 113,
        'extraState': {
          'name': 'say hello',
        },
      },
    ],
  },
};

suite('Test Node.js', function () {
  test('Import XML', function () {
    const xml = Blockly.utils.xml.textToDom(xmlText);

    // Create workspace and import the XML
    const workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(xml, workspace);
  });
  test('Roundtrip XML', function () {
    const xml = Blockly.utils.xml.textToDom(xmlText);

    const workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(xml, workspace);

    const headlessXml = Blockly.Xml.workspaceToDom(workspace, true);
    const headlessText = Blockly.Xml.domToPrettyText(headlessXml);

    assert.equal(headlessText, xmlText, 'equal');
  });
  test('Generate Code', function () {
    const xml = Blockly.utils.xml.textToDom(xmlText);

    // Create workspace and import the XML
    const workspace = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(xml, workspace);

    // Convert code
    const code = javascriptGenerator.workspaceToCode(workspace);

    // Check output
    assert.equal("window.alert('Hello from Blockly!');", code.trim(), 'equal');
  });
  test('Import JSON', function () {
    const workspace = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(json, workspace);
  });
  test('Roundtrip JSON', function () {
    const workspace = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(json, workspace);

    const jsonAfter = Blockly.serialization.workspaces.save(workspace);

    assert.deepEqual(jsonAfter, json);
  });
  test('Dropdown getText works with no HTMLElement defined', function () {
    const field = new Blockly.FieldDropdown([
      ['firstOption', '1'],
      ['secondOption', '2'],
    ]);
    assert.equal(field.getText(), 'firstOption');
  });
});
