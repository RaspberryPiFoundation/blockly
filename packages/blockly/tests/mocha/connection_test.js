/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  defineRowBlock,
  defineStackBlock,
  defineStatementBlock,
} from './test_helpers/block_definitions.js';
import {
  createGenUidStubWithReturns,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('Connection', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = sinon.createStubInstance(Blockly.Workspace);
    this.workspace.connectionChecker = new Blockly.ConnectionChecker();
    this.createConnection = function (type) {
      const block = {
        workspace: this.workspace,
        isShadow: function () {
          return false;
        },
      };
      const connection = new Blockly.Connection(block, type);
      return connection;
    };
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Set Shadow', function () {
    function assertBlockMatches(block, isShadow, opt_id) {
      assert.equal(
        block.isShadow(),
        isShadow,
        `expected block ${block.id} to ${isShadow ? '' : 'not'} be a shadow`,
      );
      if (opt_id) {
        assert.equal(block.id, opt_id);
      }
    }

    function assertInputHasBlock(parent, inputName, isShadow, opt_name) {
      const block = parent.getInputTargetBlock(inputName);
      assert.exists(
        block,
        `expected block ${opt_name || ''} to be attached to ${inputName}`,
      );
      assertBlockMatches(block, isShadow, opt_name);
    }

    function assertNextHasBlock(parent, isShadow, opt_name) {
      const block = parent.getNextBlock();
      assert.exists(
        block,
        `expected block ${opt_name || ''} to be attached to next connection`,
      );
      assertBlockMatches(block, isShadow, opt_name);
    }

    function assertInputNotHasBlock(parent, inputName) {
      const block = parent.getInputTargetBlock(inputName);
      assert.notExists(
        block,
        `expected block ${
          block && block.id
        } to not be attached to ${inputName}`,
      );
    }

    function assertNextNotHasBlock(parent) {
      const block = parent.getNextBlock();
      assert.notExists(
        block,
        `expected block ${
          block && block.id
        } to not be attached to next connection`,
      );
    }

    function assertSerialization(block, jso, xmlText) {
      const actualJso = Blockly.serialization.blocks.save(block, {
        addNextBlocks: true,
      });
      const actualXml = Blockly.Xml.domToText(Blockly.Xml.blockToDom(block));
      assert.deepEqual(actualJso, jso);
      assert.equal(actualXml, xmlText);
    }

    const testSuites = [
      {
        title: 'Rendered',
        createWorkspace: () => {
          return Blockly.inject('blocklyDiv');
        },
      },
      {
        title: 'Headless',
        createWorkspace: () => {
          return new Blockly.Workspace();
        },
      },
    ];

    testSuites.forEach((testSuite) => {
      // Create a suite for each suite.
      suite(testSuite.title, function () {
        setup(function () {
          this.workspace = testSuite.createWorkspace();

          defineRowBlock();
          defineStatementBlock();
          defineStackBlock();

          createGenUidStubWithReturns(
            new Array(30).fill().map((_, i) => 'id' + i),
          );
        });

        teardown(function () {
          workspaceTeardown.call(this, this.workspace);
        });

        suite('setShadowDom', function () {
          suite('Add - No Block Connected', function () {
            // These are defined separately in each suite.
            function createRowBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="row_block" id="id0"/>',
                ),
                workspace,
              );
              return block;
            }

            function createStatementBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="statement_block" id="id0"/>',
                ),
                workspace,
              );
              return block;
            }

            function createStackBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="stack_block" id="id0"/>',
                ),
                workspace,
              );
              return block;
            }

            test('Value', function () {
              const parent = createRowBlock(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="row_block" id="id1"/>',
              );
              parent.getInput('INPUT').connection.setShadowDom(xml);
              assertInputHasBlock(parent, 'INPUT', true);
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': 'id1',
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="id1"></shadow>' +
                  '</value>' +
                  '</block>',
              );
            });

            test('Multiple Value', function () {
              const parent = createRowBlock(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="row_block" id="id1">' +
                  '  <value name="INPUT">' +
                  '    <shadow type="row_block" id="id2"/>' +
                  '  </value>' +
                  '</shadow>',
              );
              parent.getInput('INPUT').connection.setShadowDom(xml);
              assertInputHasBlock(parent, 'INPUT', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
                true,
              );
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': 'id1',
                        'inputs': {
                          'INPUT': {
                            'shadow': {
                              'type': 'row_block',
                              'id': 'id2',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="id1">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="id2"></shadow>' +
                  '</value>' +
                  '</shadow>' +
                  '</value>' +
                  '</block>',
              );
            });

            test('Statement', function () {
              const parent = createStatementBlock(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="statement_block" id="id1"/>',
              );
              parent.getInput('NAME').connection.setShadowDom(xml);
              assertInputHasBlock(parent, 'NAME', true);
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': 'id1',
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="id1"></shadow>' +
                  '</statement>' +
                  '</block>',
              );
            });

            test('Multiple Statement', function () {
              const parent = createStatementBlock(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="statement_block" id="id1">' +
                  '  <statement name="NAME">' +
                  '    <shadow type="statement_block" id="id2"/>' +
                  '  </statement>' +
                  '</shadow>',
              );
              parent.getInput('NAME').connection.setShadowDom(xml);
              assertInputHasBlock(parent, 'NAME', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
                true,
              );
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': 'id1',
                        'inputs': {
                          'NAME': {
                            'shadow': {
                              'type': 'statement_block',
                              'id': 'id2',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="id1">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="id2"></shadow>' +
                  '</statement>' +
                  '</shadow>' +
                  '</statement>' +
                  '</block>',
              );
            });

            test('Next', function () {
              const parent = createStackBlock(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="stack_block" id="id1"/>',
              );
              parent.nextConnection.setShadowDom(xml);
              assertNextHasBlock(parent, true);
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': 'id1',
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '<next>' +
                  '<shadow type="stack_block" id="id1"></shadow>' +
                  '</next>' +
                  '</block>',
              );
            });

            test('Multiple Next', function () {
              const parent = createStackBlock(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="stack_block" id="id1">' +
                  '  <next>' +
                  '    <shadow type="stack_block" id="id2"/>' +
                  '  </next>' +
                  '</shadow>',
              );
              parent.nextConnection.setShadowDom(xml);
              assertNextHasBlock(parent, true);
              assertNextHasBlock(parent.getNextBlock(), true);
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': 'id1',
                      'next': {
                        'shadow': {
                          'type': 'stack_block',
                          'id': 'id2',
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '<next>' +
                  '<shadow type="stack_block" id="id1">' +
                  '<next>' +
                  '<shadow type="stack_block" id="id2"></shadow>' +
                  '</next>' +
                  '</shadow>' +
                  '</next>' +
                  '</block>',
              );
            });
          });

          suite('Add - With Block Connected', function () {
            // These are defined separately in each suite.
            function createRowBlocks(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="row_block" id="id0">' +
                    '  <value name="INPUT">' +
                    '    <block type="row_block" id="idA"/>' +
                    '  </value>' +
                    '</block>',
                ),
                workspace,
              );
              return block;
            }

            function createStatementBlocks(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="statement_block" id="id0">' +
                    '  <statement name="NAME">' +
                    '    <block type="statement_block" id="idA"/>' +
                    '  </statement>' +
                    '</block>',
                ),
                workspace,
              );
              return block;
            }

            function createStackBlocks(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="stack_block" id="id0">' +
                    '  <next>' +
                    '    <block type="stack_block" id="idA"/>' +
                    '  </next>' +
                    '</block>',
                ),
                workspace,
              );
              return block;
            }

            test('Value', function () {
              const parent = createRowBlocks(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="row_block" id="id1"/>',
              );
              parent.getInput('INPUT').connection.setShadowDom(xml);
              assertInputHasBlock(parent, 'INPUT', false);
              parent.getInput('INPUT').connection.disconnect();
              assertInputHasBlock(parent, 'INPUT', true);
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': 'id1',
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="id1"></shadow>' +
                  '</value>' +
                  '</block>',
              );
            });

            test('Multiple Value', function () {
              const parent = createRowBlocks(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="row_block" id="id1">' +
                  '  <value name="INPUT">' +
                  '    <shadow type="row_block" id="id2"/>' +
                  '  </value>' +
                  '</shadow>',
              );
              parent.getInput('INPUT').connection.setShadowDom(xml);
              assertInputHasBlock(parent, 'INPUT', false);
              assertInputNotHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
              );
              parent.getInput('INPUT').connection.disconnect();
              assertInputHasBlock(parent, 'INPUT', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
                true,
              );
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': 'id1',
                        'inputs': {
                          'INPUT': {
                            'shadow': {
                              'type': 'row_block',
                              'id': 'id2',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="id1">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="id2"></shadow>' +
                  '</value>' +
                  '</shadow>' +
                  '</value>' +
                  '</block>',
              );
            });

            test('Statement', function () {
              const parent = createStatementBlocks(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="statement_block" id="id1"/>',
              );
              parent.getInput('NAME').connection.setShadowDom(xml);
              assertInputHasBlock(parent, 'NAME', false);
              parent.getInput('NAME').connection.disconnect();
              assertInputHasBlock(parent, 'NAME', true);
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': 'id1',
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="id1"></shadow>' +
                  '</statement>' +
                  '</block>',
              );
            });

            test('Multiple Statement', function () {
              const parent = createStatementBlocks(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="statement_block" id="id1">' +
                  '  <statement name="NAME">' +
                  '    <shadow type="statement_block" id="id2"/>' +
                  '  </statement>' +
                  '</shadow>',
              );
              parent.getInput('NAME').connection.setShadowDom(xml);
              assertInputHasBlock(parent, 'NAME', false);
              assertInputNotHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
              );
              parent.getInput('NAME').connection.disconnect();
              assertInputHasBlock(parent, 'NAME', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
                true,
              );
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': 'id1',
                        'inputs': {
                          'NAME': {
                            'shadow': {
                              'type': 'statement_block',
                              'id': 'id2',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="id1">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="id2"></shadow>' +
                  '</statement>' +
                  '</shadow>' +
                  '</statement>' +
                  '</block>',
              );
            });

            test('Next', function () {
              const parent = createStackBlocks(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="stack_block" id="id1"/>',
              );
              parent.nextConnection.setShadowDom(xml);
              assertNextHasBlock(parent, false);
              parent.nextConnection.disconnect();
              assertNextHasBlock(parent, true);
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': 'id1',
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '<next>' +
                  '<shadow type="stack_block" id="id1"></shadow>' +
                  '</next>' +
                  '</block>',
              );
            });

            test('Multiple Next', function () {
              const parent = createStackBlocks(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="stack_block" id="id1">' +
                  '  <next>' +
                  '    <shadow type="stack_block" id="id2"/>' +
                  '  </next>' +
                  '</shadow>',
              );
              parent.nextConnection.setShadowDom(xml);
              assertNextHasBlock(parent, false);
              assertNextNotHasBlock(parent.getNextBlock());
              parent.nextConnection.disconnect();
              assertNextHasBlock(parent, true);
              assertNextHasBlock(parent.getNextBlock(), true);
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': 'id1',
                      'next': {
                        'shadow': {
                          'type': 'stack_block',
                          'id': 'id2',
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '<next>' +
                  '<shadow type="stack_block" id="id1">' +
                  '<next>' +
                  '<shadow type="stack_block" id="id2"></shadow>' +
                  '</next>' +
                  '</shadow>' +
                  '</next>' +
                  '</block>',
              );
            });
          });

          suite('Add - With Shadow Connected', function () {
            // These are defined separately in each suite.
            function createRowBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="row_block" id="id0"/>',
                ),
                workspace,
              );
              return block;
            }

            function createStatementBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="statement_block" id="id0"/>',
                ),
                workspace,
              );
              return block;
            }

            function createStackBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="stack_block" id="id0"/>',
                ),
                workspace,
              );
              return block;
            }

            test('Value', function () {
              const parent = createRowBlock(this.workspace);
              const xml1 = Blockly.utils.xml.textToDom(
                '<shadow type="row_block" id="1"/>',
              );
              parent.getInput('INPUT').connection.setShadowDom(xml1);
              assertInputHasBlock(parent, 'INPUT', true, '1');
              const xml2 = Blockly.utils.xml.textToDom(
                '<shadow type="row_block" id="2"/>',
              );
              parent.getInput('INPUT').connection.setShadowDom(xml2);
              assertInputHasBlock(parent, 'INPUT', true, '2');
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': '2',
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="2"></shadow>' +
                  '</value>' +
                  '</block>',
              );
            });

            test('Multiple Value', function () {
              const parent = createRowBlock(this.workspace);
              const xml1 = Blockly.utils.xml.textToDom(
                '<shadow type="row_block" id="1">' +
                  '  <value name="INPUT">' +
                  '    <shadow type="row_block" id="a"/>' +
                  '  </value>' +
                  '</shadow>',
              );
              parent.getInput('INPUT').connection.setShadowDom(xml1);
              assertInputHasBlock(parent, 'INPUT', true, '1');
              assertInputHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
                true,
                'a',
              );
              const xml2 = Blockly.utils.xml.textToDom(
                '<shadow type="row_block" id="2">' +
                  '  <value name="INPUT">' +
                  '    <shadow type="row_block" id="b"/>' +
                  '  </value>' +
                  '</shadow>',
              );
              parent.getInput('INPUT').connection.setShadowDom(xml2);
              assertInputHasBlock(parent, 'INPUT', true, '2');
              assertInputHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
                true,
                'b',
              );
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': '2',
                        'inputs': {
                          'INPUT': {
                            'shadow': {
                              'type': 'row_block',
                              'id': 'b',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="2">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="b"></shadow>' +
                  '</value>' +
                  '</shadow>' +
                  '</value>' +
                  '</block>',
              );
            });

            test('Statement', function () {
              const parent = createStatementBlock(this.workspace);
              const xml1 = Blockly.utils.xml.textToDom(
                '<shadow type="statement_block" id="1"/>',
              );
              parent.getInput('NAME').connection.setShadowDom(xml1);
              assertInputHasBlock(parent, 'NAME', true, '1');
              const xml2 = Blockly.utils.xml.textToDom(
                '<shadow type="statement_block" id="2"/>',
              );
              parent.getInput('NAME').connection.setShadowDom(xml2);
              assertInputHasBlock(parent, 'NAME', true, '2');
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': '2',
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="2"></shadow>' +
                  '</statement>' +
                  '</block>',
              );
            });

            test('Multiple Statement', function () {
              const parent = createStatementBlock(this.workspace);
              const xml1 = Blockly.utils.xml.textToDom(
                '<shadow type="statement_block" id="1">' +
                  '  <statement name="NAME">' +
                  '    <shadow type="statement_block" id="a"/>' +
                  '  </statement>' +
                  '</shadow>',
              );
              parent.getInput('NAME').connection.setShadowDom(xml1);
              assertInputHasBlock(parent, 'NAME', true, '1');
              assertInputHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
                true,
                'a',
              );
              const xml2 = Blockly.utils.xml.textToDom(
                '<shadow type="statement_block" id="2">' +
                  '  <statement name="NAME">' +
                  '    <shadow type="statement_block" id="b"/>' +
                  '  </statement>' +
                  '</shadow>',
              );
              parent.getInput('NAME').connection.setShadowDom(xml2);
              assertInputHasBlock(parent, 'NAME', true, '2');
              assertInputHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
                true,
                'b',
              );
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': '2',
                        'inputs': {
                          'NAME': {
                            'shadow': {
                              'type': 'statement_block',
                              'id': 'b',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="2">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="b"></shadow>' +
                  '</statement>' +
                  '</shadow>' +
                  '</statement>' +
                  '</block>',
              );
            });

            test('Next', function () {
              const parent = createStackBlock(this.workspace);
              const xml1 = Blockly.utils.xml.textToDom(
                '<shadow type="stack_block" id="1"/>',
              );
              parent.nextConnection.setShadowDom(xml1);
              assertNextHasBlock(parent, true, '1');
              const xml2 = Blockly.utils.xml.textToDom(
                '<shadow type="stack_block" id="2"/>',
              );
              parent.nextConnection.setShadowDom(xml2);
              assertNextHasBlock(parent, true, '2');
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': '2',
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '<next>' +
                  '<shadow type="stack_block" id="2"></shadow>' +
                  '</next>' +
                  '</block>',
              );
            });

            test('Multiple Next', function () {
              const parent = createStackBlock(this.workspace);
              const xml1 = Blockly.utils.xml.textToDom(
                '<shadow type="stack_block" id="1">' +
                  '  <next>' +
                  '    <shadow type="stack_block" id="a"/>' +
                  '  </next>' +
                  '</shadow>',
              );
              parent.nextConnection.setShadowDom(xml1);
              assertNextHasBlock(parent, true, '1');
              assertNextHasBlock(parent.getNextBlock(), true, 'a');
              const xml2 = Blockly.utils.xml.textToDom(
                '<shadow type="stack_block" id="2">' +
                  '  <next>' +
                  '    <shadow type="stack_block" id="b"/>' +
                  '  </next>' +
                  '</shadow>',
              );
              parent.nextConnection.setShadowDom(xml2);
              assertNextHasBlock(parent, true, '2');
              assertNextHasBlock(parent.getNextBlock(), true, 'b');
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': '2',
                      'next': {
                        'shadow': {
                          'type': 'stack_block',
                          'id': 'b',
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '<next>' +
                  '<shadow type="stack_block" id="2">' +
                  '<next>' +
                  '<shadow type="stack_block" id="b"></shadow>' +
                  '</next>' +
                  '</shadow>' +
                  '</next>' +
                  '</block>',
              );
            });
          });

          suite('Remove - No Block Connected', function () {
            // These are defined separately in each suite.
            function createRowBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="row_block" id="id0">' +
                    '  <value name="INPUT">' +
                    '    <shadow type="row_block" id="idA"/>' +
                    '  </value>' +
                    '</block>',
                ),
                workspace,
              );
              return block;
            }

            function createStatementBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="statement_block" id="id0">' +
                    '  <statement name="NAME">' +
                    '    <shadow type="statement_block" id="idA"/>' +
                    '  </statement>' +
                    '</block>',
                ),
                workspace,
              );
              return block;
            }

            function createStackBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="stack_block" id="id0">' +
                    '  <next>' +
                    '    <shadow type="stack_block" id="idA"/>' +
                    '  </next>' +
                    '</block>',
                ),
                workspace,
              );
              return block;
            }

            test('Value', function () {
              const parent = createRowBlock(this.workspace);
              parent.getInput('INPUT').connection.setShadowDom(null);
              assertInputNotHasBlock(parent, 'INPUT');
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '</block>',
              );
            });

            test('Statement', function () {
              const parent = createStatementBlock(this.workspace);
              parent.getInput('NAME').connection.setShadowDom(null);
              assertInputNotHasBlock(parent, 'STATEMENT');
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '</block>',
              );
            });

            test('Next', function () {
              const parent = createStackBlock(this.workspace);
              parent.nextConnection.setShadowDom(null);
              assertNextNotHasBlock(parent);
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '</block>',
              );
            });
          });

          suite('Remove - Block Connected', function () {
            // These are defined separately in each suite.
            function createRowBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="row_block" id="id0">' +
                    '  <value name="INPUT">' +
                    '    <shadow type="row_block" id="idA"/>' +
                    '    <block type="row_block" id="idB"/>' +
                    '  </value>' +
                    '</block>',
                ),
                workspace,
              );
              return block;
            }

            function createStatementBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="statement_block" id="id0">' +
                    '  <statement name="NAME">' +
                    '    <shadow type="statement_block" id="idA"/>' +
                    '    <block type="statement_block" id="idB"/>' +
                    '  </statement>' +
                    '</block>',
                ),
                workspace,
              );
              return block;
            }

            function createStackBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom(
                  '<block type="stack_block" id="id0">' +
                    '  <next>' +
                    '    <shadow type="stack_block" id="idA"/>' +
                    '    <block type="stack_block" id="idB"/>' +
                    '  </next>' +
                    '</block>',
                ),
                workspace,
              );
              return block;
            }

            test('Value', function () {
              const parent = createRowBlock(this.workspace);
              parent.getInput('INPUT').connection.setShadowDom(null);
              assertInputHasBlock(parent, 'INPUT', false);
              parent.getInput('INPUT').connection.disconnect();
              assertInputNotHasBlock(parent, 'INPUT');
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '</block>',
              );
            });

            test('Statement', function () {
              const parent = createStatementBlock(this.workspace);
              parent.getInput('NAME').connection.setShadowDom(null);
              assertInputHasBlock(parent, 'NAME', false);
              parent.getInput('NAME').connection.disconnect();
              assertInputNotHasBlock(parent, 'NAME');
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '</block>',
              );
            });

            test('Next', function () {
              const parent = createStackBlock(this.workspace);
              parent.nextConnection.setShadowDom(null);
              assertNextHasBlock(parent, false);
              parent.nextConnection.disconnect();
              assertNextNotHasBlock(parent);
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '</block>',
              );
            });
          });

          suite('Add - Connect & Disconnect - Remove', function () {
            // These are defined separately in each suite.
            function createRowBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom('<block type="row_block"/>'),
                workspace,
              );
              return block;
            }

            function createStatementBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom('<block type="statement_block"/>'),
                workspace,
              );
              return block;
            }

            function createStackBlock(workspace) {
              const block = Blockly.Xml.domToBlock(
                Blockly.utils.xml.textToDom('<block type="stack_block"/>'),
                workspace,
              );
              return block;
            }

            test('Value', function () {
              const parent = createRowBlock(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="row_block"/>',
              );
              parent.getInput('INPUT').connection.setShadowDom(xml);
              assertInputHasBlock(parent, 'INPUT', true);
              const child = createRowBlock(this.workspace);
              parent
                .getInput('INPUT')
                .connection.connect(child.outputConnection);
              assertInputHasBlock(parent, 'INPUT', false);
              parent.getInput('INPUT').connection.disconnect();
              assertInputHasBlock(parent, 'INPUT', true);
              parent.getInput('INPUT').connection.setShadowDom(null);
              assertInputNotHasBlock(parent, 'INPUT');
            });

            test('Multiple Value', function () {
              const parent = createRowBlock(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="row_block">' +
                  '  <value name="INPUT">' +
                  '    <shadow type="row_block"/>' +
                  '  </value>' +
                  '</shadow>',
              );
              parent.getInput('INPUT').connection.setShadowDom(xml);
              assertInputHasBlock(parent, 'INPUT', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
                true,
              );
              const child = createRowBlock(this.workspace);
              parent
                .getInput('INPUT')
                .connection.connect(child.outputConnection);
              assertInputHasBlock(parent, 'INPUT', false);
              parent.getInput('INPUT').connection.disconnect();
              assertInputHasBlock(parent, 'INPUT', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
                true,
              );
              parent.getInput('INPUT').connection.setShadowDom(null);
              assertInputNotHasBlock(parent, 'INPUT');
            });

            test('Statement', function () {
              const parent = createStatementBlock(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="statement_block"/>',
              );
              parent.getInput('NAME').connection.setShadowDom(xml);
              assertInputHasBlock(parent, 'NAME', true);
              const child = createStatementBlock(this.workspace);
              parent
                .getInput('NAME')
                .connection.connect(child.previousConnection);
              assertInputHasBlock(parent, 'NAME', false);
              parent.getInput('NAME').connection.disconnect();
              assertInputHasBlock(parent, 'NAME', true);
              parent.getInput('NAME').connection.setShadowDom(null);
              assertInputNotHasBlock(parent, 'NAME');
            });

            test('Multiple Statement', function () {
              const parent = createStatementBlock(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="statement_block">' +
                  '  <statement name="NAME">' +
                  '    <shadow type="statement_block"/>' +
                  '  </statement>' +
                  '</shadow>',
              );
              parent.getInput('NAME').connection.setShadowDom(xml);
              assertInputHasBlock(parent, 'NAME', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
                true,
              );
              const child = createStatementBlock(this.workspace);
              parent
                .getInput('NAME')
                .connection.connect(child.previousConnection);
              assertInputHasBlock(parent, 'NAME', false);
              parent.getInput('NAME').connection.disconnect();
              assertInputHasBlock(parent, 'NAME', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
                true,
              );
              parent.getInput('NAME').connection.setShadowDom(null);
              assertInputNotHasBlock(parent, 'NAME');
            });

            test('Next', function () {
              const parent = createStackBlock(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="stack_block"/>',
              );
              parent.nextConnection.setShadowDom(xml);
              assertNextHasBlock(parent, true);
              const child = createStatementBlock(this.workspace);
              parent.nextConnection.connect(child.previousConnection);
              assertNextHasBlock(parent, false);
              parent.nextConnection.disconnect();
              assertNextHasBlock(parent, true);
              parent.nextConnection.setShadowDom(null);
              assertNextNotHasBlock(parent);
            });

            test('Multiple Next', function () {
              const parent = createStackBlock(this.workspace);
              const xml = Blockly.utils.xml.textToDom(
                '<shadow type="stack_block" id="parent">' +
                  '  <next>' +
                  '    <shadow type="stack_block" id="child"/>' +
                  '  </next>' +
                  '</shadow>',
              );
              parent.nextConnection.setShadowDom(xml);
              assertNextHasBlock(parent, true);
              assertNextHasBlock(parent.getNextBlock(), true);
              const child = createStatementBlock(this.workspace);
              parent.nextConnection.connect(child.previousConnection);
              assertNextHasBlock(parent, false);
              parent.nextConnection.disconnect();
              assertNextHasBlock(parent, true);
              assertNextHasBlock(parent.getNextBlock(), true);
              parent.nextConnection.setShadowDom(null);
              assertNextNotHasBlock(parent);
            });
          });

          suite('Invalid', function () {
            test('Attach to output', function () {
              const block = this.workspace.newBlock('row_block');
              assert.throws(() =>
                block.outputConnection.setShadowDom(
                  Blockly.utils.xml.textToDom('<block type="row_block">'),
                ),
              );
            });

            test('Attach to previous', function () {
              const block = this.workspace.newBlock('stack_block');
              assert.throws(() =>
                block.previousConnection.setShadowDom(
                  Blockly.utils.xml.textToDom('<block type="stack_block">'),
                ),
              );
            });

            test('Missing output', function () {
              const block = this.workspace.newBlock('row_block');
              assert.throws(() =>
                block.outputConnection.setShadowDom(
                  Blockly.utils.xml.textToDom('<block type="stack_block">'),
                ),
              );
            });

            test('Missing previous', function () {
              const block = this.workspace.newBlock('stack_block');
              assert.throws(() =>
                block.previousConnection.setShadowDom(
                  Blockly.utils.xml.textToDom('<block type="row_block">'),
                ),
              );
            });

            test('Invalid connection checks, output', function () {
              const block = this.workspace.newBlock('logic_operation');
              assert.throws(() =>
                block
                  .getInput('A')
                  .connection.setShadowDom(
                    Blockly.utils.xml.textToDom('<block type="stack_block">'),
                  ),
              );
            });

            test('Invalid connection checks, previous', function () {
              Blockly.defineBlocksWithJsonArray([
                {
                  'type': 'stack_checks_block',
                  'message0': '',
                  'previousStatement': 'check 1',
                  'nextStatement': 'check 2',
                },
              ]);
              const block = this.workspace.newBlock('stack_checks_block');
              assert.throws(() =>
                block.nextConnection.setShadowDom(
                  Blockly.utils.xml.textToDom(
                    '<block type="stack_checks_block">',
                  ),
                ),
              );
            });
          });
        });

        suite('setShadowState', function () {
          suite('Add - No Block Connected', function () {
            // These are defined separately in each suite.
            function createRowBlock(workspace) {
              return Blockly.serialization.blocks.append(
                {'type': 'row_block', 'id': 'id0'},
                workspace,
              );
            }

            function createStatementBlock(workspace) {
              return Blockly.serialization.blocks.append(
                {'type': 'statement_block', 'id': 'id0'},
                workspace,
              );
            }

            function createStackBlock(workspace) {
              return Blockly.serialization.blocks.append(
                {'type': 'stack_block', 'id': 'id0'},
                workspace,
              );
            }

            test('Value', function () {
              const parent = createRowBlock(this.workspace);
              parent
                .getInput('INPUT')
                .connection.setShadowState({'type': 'row_block', 'id': 'id1'});
              assertInputHasBlock(parent, 'INPUT', true);
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': 'id1',
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="id1"></shadow>' +
                  '</value>' +
                  '</block>',
              );
            });

            test('Multiple Value', function () {
              const parent = createRowBlock(this.workspace);
              parent.getInput('INPUT').connection.setShadowState({
                'type': 'row_block',
                'id': 'id1',
                'inputs': {
                  'INPUT': {
                    'shadow': {
                      'type': 'row_block',
                      'id': 'id2',
                    },
                  },
                },
              });
              assertInputHasBlock(parent, 'INPUT', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
                true,
              );
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': 'id1',
                        'inputs': {
                          'INPUT': {
                            'shadow': {
                              'type': 'row_block',
                              'id': 'id2',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="id1">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="id2"></shadow>' +
                  '</value>' +
                  '</shadow>' +
                  '</value>' +
                  '</block>',
              );
            });

            test('Statement', function () {
              const parent = createStatementBlock(this.workspace);
              parent.getInput('NAME').connection.setShadowState({
                'type': 'statement_block',
                'id': 'id1',
              });
              assertInputHasBlock(parent, 'NAME', true);
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': 'id1',
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="id1"></shadow>' +
                  '</statement>' +
                  '</block>',
              );
            });

            test('Multiple Statment', function () {
              const parent = createStatementBlock(this.workspace);
              parent.getInput('NAME').connection.setShadowState({
                'type': 'statement_block',
                'id': 'id1',
                'inputs': {
                  'NAME': {
                    'shadow': {
                      'type': 'statement_block',
                      'id': 'id2',
                    },
                  },
                },
              });
              assertInputHasBlock(parent, 'NAME', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
                true,
              );
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': 'id1',
                        'inputs': {
                          'NAME': {
                            'shadow': {
                              'type': 'statement_block',
                              'id': 'id2',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="id1">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="id2"></shadow>' +
                  '</statement>' +
                  '</shadow>' +
                  '</statement>' +
                  '</block>',
              );
            });

            test('Next', function () {
              const parent = createStackBlock(this.workspace);
              parent.nextConnection.setShadowState({
                'type': 'stack_block',
                'id': 'id1',
              });
              assertNextHasBlock(parent, true);
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': 'id1',
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '<next>' +
                  '<shadow type="stack_block" id="id1"></shadow>' +
                  '</next>' +
                  '</block>',
              );
            });
            test('Multiple Next', function () {
              const parent = createStackBlock(this.workspace);
              parent.nextConnection.setShadowState({
                'type': 'stack_block',
                'id': 'id1',
                'next': {
                  'shadow': {
                    'type': 'stack_block',
                    'id': 'id2',
                  },
                },
              });
              assertNextHasBlock(parent, true);
              assertNextHasBlock(parent.getNextBlock(), true);
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': 'id1',
                      'next': {
                        'shadow': {
                          'type': 'stack_block',
                          'id': 'id2',
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '<next>' +
                  '<shadow type="stack_block" id="id1">' +
                  '<next>' +
                  '<shadow type="stack_block" id="id2"></shadow>' +
                  '</next>' +
                  '</shadow>' +
                  '</next>' +
                  '</block>',
              );
            });
          });

          suite('Add - With Block Connected', function () {
            // These are defined separately in each suite.
            function createRowBlocks(workspace) {
              return Blockly.serialization.blocks.append(
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'block': {
                        'type': 'row_block',
                        'id': 'idA',
                      },
                    },
                  },
                },
                workspace,
              );
            }

            function createStatementBlocks(workspace) {
              return Blockly.serialization.blocks.append(
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'block': {
                        'type': 'statement_block',
                        'id': 'idA',
                      },
                    },
                  },
                },
                workspace,
              );
            }

            function createStackBlocks(workspace) {
              return Blockly.serialization.blocks.append(
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'block': {
                      'type': 'stack_block',
                      'id': 'idA',
                    },
                  },
                },
                workspace,
              );
            }

            test('Value', function () {
              const parent = createRowBlocks(this.workspace);
              parent
                .getInput('INPUT')
                .connection.setShadowState({'type': 'row_block', 'id': 'id1'});
              assertInputHasBlock(parent, 'INPUT', false);
              parent.getInput('INPUT').connection.disconnect();
              assertInputHasBlock(parent, 'INPUT', true);
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': 'id1',
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="id1"></shadow>' +
                  '</value>' +
                  '</block>',
              );
            });

            test('Multiple Value', function () {
              const parent = createRowBlocks(this.workspace);
              parent.getInput('INPUT').connection.setShadowState({
                'type': 'row_block',
                'id': 'id1',
                'inputs': {
                  'INPUT': {
                    'shadow': {
                      'type': 'row_block',
                      'id': 'id2',
                    },
                  },
                },
              });
              assertInputHasBlock(parent, 'INPUT', false);
              assertInputNotHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
              );
              parent.getInput('INPUT').connection.disconnect();
              assertInputHasBlock(parent, 'INPUT', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
                true,
              );
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': 'id1',
                        'inputs': {
                          'INPUT': {
                            'shadow': {
                              'type': 'row_block',
                              'id': 'id2',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="id1">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="id2"></shadow>' +
                  '</value>' +
                  '</shadow>' +
                  '</value>' +
                  '</block>',
              );
            });

            test('Statement', function () {
              const parent = createStatementBlocks(this.workspace);
              parent.getInput('NAME').connection.setShadowState({
                'type': 'statement_block',
                'id': 'id1',
              });
              assertInputHasBlock(parent, 'NAME', false);
              parent.getInput('NAME').connection.disconnect();
              assertInputHasBlock(parent, 'NAME', true);
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': 'id1',
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="id1"></shadow>' +
                  '</statement>' +
                  '</block>',
              );
            });

            test('Multiple Statement', function () {
              const parent = createStatementBlocks(this.workspace);
              parent.getInput('NAME').connection.setShadowState({
                'type': 'statement_block',
                'id': 'id1',
                'inputs': {
                  'NAME': {
                    'shadow': {
                      'type': 'statement_block',
                      'id': 'id2',
                    },
                  },
                },
              });
              assertInputHasBlock(parent, 'NAME', false);
              assertInputNotHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
              );
              parent.getInput('NAME').connection.disconnect();
              assertInputHasBlock(parent, 'NAME', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
                true,
              );
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': 'id1',
                        'inputs': {
                          'NAME': {
                            'shadow': {
                              'type': 'statement_block',
                              'id': 'id2',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="id1">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="id2"></shadow>' +
                  '</statement>' +
                  '</shadow>' +
                  '</statement>' +
                  '</block>',
              );
            });

            test('Next', function () {
              const parent = createStackBlocks(this.workspace);
              parent.nextConnection.setShadowState({
                'type': 'stack_block',
                'id': 'id1',
              });
              assertNextHasBlock(parent, false);
              parent.nextConnection.disconnect();
              assertNextHasBlock(parent, true);
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': 'id1',
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '<next>' +
                  '<shadow type="stack_block" id="id1"></shadow>' +
                  '</next>' +
                  '</block>',
              );
            });

            test('Multiple Next', function () {
              const parent = createStackBlocks(this.workspace);
              parent.nextConnection.setShadowState({
                'type': 'stack_block',
                'id': 'id1',
                'next': {
                  'shadow': {
                    'type': 'stack_block',
                    'id': 'id2',
                  },
                },
              });
              assertNextHasBlock(parent, false);
              assertNextNotHasBlock(parent.getNextBlock());
              parent.nextConnection.disconnect();
              assertNextHasBlock(parent, true);
              assertNextHasBlock(parent.getNextBlock(), true);
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': 'id1',
                      'next': {
                        'shadow': {
                          'type': 'stack_block',
                          'id': 'id2',
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '<next>' +
                  '<shadow type="stack_block" id="id1">' +
                  '<next>' +
                  '<shadow type="stack_block" id="id2"></shadow>' +
                  '</next>' +
                  '</shadow>' +
                  '</next>' +
                  '</block>',
              );
            });
          });

          suite('Add - With Shadow Connected', function () {
            // These are defined separately in each suite.
            function createRowBlock(workspace) {
              return Blockly.serialization.blocks.append(
                {'type': 'row_block', 'id': 'id0'},
                workspace,
              );
            }

            function createStatementBlock(workspace) {
              return Blockly.serialization.blocks.append(
                {'type': 'statement_block', 'id': 'id0'},
                workspace,
              );
            }

            function createStackBlock(workspace) {
              return Blockly.serialization.blocks.append(
                {'type': 'stack_block', 'id': 'id0'},
                workspace,
              );
            }

            test('Value', function () {
              const parent = createRowBlock(this.workspace);
              parent
                .getInput('INPUT')
                .connection.setShadowState({'type': 'row_block', 'id': '1'});
              assertInputHasBlock(parent, 'INPUT', true, '1');
              parent
                .getInput('INPUT')
                .connection.setShadowState({'type': 'row_block', 'id': '2'});
              assertInputHasBlock(parent, 'INPUT', true, '2');
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': '2',
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="2"></shadow>' +
                  '</value>' +
                  '</block>',
              );
            });

            test('Multiple Value', function () {
              const parent = createRowBlock(this.workspace);
              parent.getInput('INPUT').connection.setShadowState({
                'type': 'row_block',
                'id': '1',
                'inputs': {
                  'INPUT': {
                    'shadow': {
                      'type': 'row_block',
                      'id': 'a',
                    },
                  },
                },
              });
              assertInputHasBlock(parent, 'INPUT', true, '1');
              assertInputHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
                true,
                'a',
              );
              parent.getInput('INPUT').connection.setShadowState({
                'type': 'row_block',
                'id': '2',
                'inputs': {
                  'INPUT': {
                    'shadow': {
                      'type': 'row_block',
                      'id': 'b',
                    },
                  },
                },
              });
              assertInputHasBlock(parent, 'INPUT', true, '2');
              assertInputHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
                true,
                'b',
              );
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': '2',
                        'inputs': {
                          'INPUT': {
                            'shadow': {
                              'type': 'row_block',
                              'id': 'b',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="2">' +
                  '<value name="INPUT">' +
                  '<shadow type="row_block" id="b"></shadow>' +
                  '</value>' +
                  '</shadow>' +
                  '</value>' +
                  '</block>',
              );
            });

            test('Statement', function () {
              const parent = createStatementBlock(this.workspace);
              parent.getInput('NAME').connection.setShadowState({
                'type': 'statement_block',
                'id': '1',
              });
              assertInputHasBlock(parent, 'NAME', true, '1');
              parent.getInput('NAME').connection.setShadowState({
                'type': 'statement_block',
                'id': '2',
              });
              assertInputHasBlock(parent, 'NAME', true, '2');
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': '2',
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="2"></shadow>' +
                  '</statement>' +
                  '</block>',
              );
            });

            test('Multiple Statement', function () {
              const parent = createStatementBlock(this.workspace);
              parent.getInput('NAME').connection.setShadowState({
                'type': 'statement_block',
                'id': '1',
                'inputs': {
                  'NAME': {
                    'shadow': {
                      'type': 'statement_block',
                      'id': 'a',
                    },
                  },
                },
              });
              assertInputHasBlock(parent, 'NAME', true, '1');
              assertInputHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
                true,
                'a',
              );
              parent.getInput('NAME').connection.setShadowState({
                'type': 'statement_block',
                'id': '2',
                'inputs': {
                  'NAME': {
                    'shadow': {
                      'type': 'statement_block',
                      'id': 'b',
                    },
                  },
                },
              });
              assertInputHasBlock(parent, 'NAME', true, '2');
              assertInputHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
                true,
                'b',
              );
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': '2',
                        'inputs': {
                          'NAME': {
                            'shadow': {
                              'type': 'statement_block',
                              'id': 'b',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="2">' +
                  '<statement name="NAME">' +
                  '<shadow type="statement_block" id="b"></shadow>' +
                  '</statement>' +
                  '</shadow>' +
                  '</statement>' +
                  '</block>',
              );
            });

            test('Next', function () {
              const parent = createStackBlock(this.workspace);
              parent.nextConnection.setShadowState({
                'type': 'stack_block',
                'id': '1',
              });
              assertNextHasBlock(parent, true, '1');
              parent.nextConnection.setShadowState({
                'type': 'stack_block',
                'id': '2',
              });
              assertNextHasBlock(parent, true, '2');
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': '2',
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '<next>' +
                  '<shadow type="stack_block" id="2"></shadow>' +
                  '</next>' +
                  '</block>',
              );
            });

            test('Multiple Next', function () {
              const parent = createStackBlock(this.workspace);
              parent.nextConnection.setShadowState({
                'type': 'stack_block',
                'id': '1',
                'next': {
                  'shadow': {
                    'type': 'stack_block',
                    'id': 'a',
                  },
                },
              });
              assertNextHasBlock(parent, true, '1');
              assertNextHasBlock(parent.getNextBlock(), true, 'a');
              parent.nextConnection.setShadowState({
                'type': 'stack_block',
                'id': '2',
                'next': {
                  'shadow': {
                    'type': 'stack_block',
                    'id': 'b',
                  },
                },
              });
              assertNextHasBlock(parent, true, '2');
              assertNextHasBlock(parent.getNextBlock(), true, 'b');
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': '2',
                      'next': {
                        'shadow': {
                          'type': 'stack_block',
                          'id': 'b',
                        },
                      },
                    },
                  },
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '<next>' +
                  '<shadow type="stack_block" id="2">' +
                  '<next>' +
                  '<shadow type="stack_block" id="b"></shadow>' +
                  '</next>' +
                  '</shadow>' +
                  '</next>' +
                  '</block>',
              );
            });
          });

          suite('Remove - No Block Connected', function () {
            // These are defined separately in each suite.
            function createRowBlocks(workspace) {
              return Blockly.serialization.blocks.append(
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': 'id1',
                      },
                    },
                  },
                },
                workspace,
              );
            }

            function createStatementBlocks(workspace) {
              return Blockly.serialization.blocks.append(
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': 'id1',
                      },
                    },
                  },
                },
                workspace,
              );
            }

            function createStackBlocks(workspace) {
              return Blockly.serialization.blocks.append(
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': 'id1',
                    },
                  },
                },
                workspace,
              );
            }

            test('Value', function () {
              const parent = createRowBlocks(this.workspace);
              parent.getInput('INPUT').connection.setShadowState(null);
              assertInputNotHasBlock(parent, 'INPUT');
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '</block>',
              );
            });

            test('Statement', function () {
              const parent = createStatementBlocks(this.workspace);
              parent.getInput('NAME').connection.setShadowState(null);
              assertInputNotHasBlock(parent, 'NAME');
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '</block>',
              );
            });

            test('Next', function () {
              const parent = createStackBlocks(this.workspace);
              parent.nextConnection.setShadowState(null);
              assertNextNotHasBlock(parent);
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '</block>',
              );
            });
          });

          suite('Remove - Block Connected', function () {
            // These are defined separately in each suite.
            function createRowBlocks(workspace) {
              return Blockly.serialization.blocks.append(
                {
                  'type': 'row_block',
                  'id': 'id0',
                  'inputs': {
                    'INPUT': {
                      'shadow': {
                        'type': 'row_block',
                        'id': 'id1',
                      },
                      'block': {
                        'type': 'row_block',
                        'id': 'id2',
                      },
                    },
                  },
                },
                workspace,
              );
            }

            function createStatementBlocks(workspace) {
              return Blockly.serialization.blocks.append(
                {
                  'type': 'statement_block',
                  'id': 'id0',
                  'inputs': {
                    'NAME': {
                      'shadow': {
                        'type': 'statement_block',
                        'id': 'id1',
                      },
                      'block': {
                        'type': 'statement_block',
                        'id': 'id2',
                      },
                    },
                  },
                },
                workspace,
              );
            }

            function createStackBlocks(workspace) {
              return Blockly.serialization.blocks.append(
                {
                  'type': 'stack_block',
                  'id': 'id0',
                  'next': {
                    'shadow': {
                      'type': 'stack_block',
                      'id': 'id1',
                    },
                    'block': {
                      'type': 'stack_block',
                      'id': 'id2',
                    },
                  },
                },
                workspace,
              );
            }

            test('Value', function () {
              const parent = createRowBlocks(this.workspace);
              parent.getInput('INPUT').connection.setShadowState(null);
              assertInputHasBlock(parent, 'INPUT', false);
              parent.getInput('INPUT').connection.disconnect();
              assertInputNotHasBlock(parent, 'INPUT');
              assertSerialization(
                parent,
                {
                  'type': 'row_block',
                  'id': 'id0',
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="row_block" id="id0">' +
                  '</block>',
              );
            });

            test('Statement', function () {
              const parent = createStatementBlocks(this.workspace);
              parent.getInput('NAME').connection.setShadowState(null);
              assertInputHasBlock(parent, 'NAME', false);
              parent.getInput('NAME').connection.disconnect();
              assertInputNotHasBlock(parent, 'NAME');
              assertSerialization(
                parent,
                {
                  'type': 'statement_block',
                  'id': 'id0',
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="statement_block" id="id0">' +
                  '</block>',
              );
            });

            test('Next', function () {
              const parent = createStackBlocks(this.workspace);
              parent.nextConnection.setShadowState(null);
              assertNextHasBlock(parent, false);
              parent.nextConnection.disconnect();
              assertNextNotHasBlock(parent);
              assertSerialization(
                parent,
                {
                  'type': 'stack_block',
                  'id': 'id0',
                },
                '<block xmlns="https://developers.google.com/blockly/xml" ' +
                  'type="stack_block" id="id0">' +
                  '</block>',
              );
            });
          });

          suite('Add - Connect & Disconnect - Remove', function () {
            // These are defined separately in each suite.
            function createRowBlock(workspace) {
              return Blockly.serialization.blocks.append(
                {'type': 'row_block'},
                workspace,
              );
            }

            function createStatementBlock(workspace) {
              return Blockly.serialization.blocks.append(
                {'type': 'statement_block'},
                workspace,
              );
            }

            function createStackBlock(workspace) {
              return Blockly.serialization.blocks.append(
                {'type': 'stack_block'},
                workspace,
              );
            }

            test('Value', function () {
              const parent = createRowBlock(this.workspace);
              parent
                .getInput('INPUT')
                .connection.setShadowState({'type': 'row_block'});
              assertInputHasBlock(parent, 'INPUT', true);
              const child = createRowBlock(this.workspace);
              parent
                .getInput('INPUT')
                .connection.connect(child.outputConnection);
              assertInputHasBlock(parent, 'INPUT', false);
              parent.getInput('INPUT').connection.disconnect();
              assertInputHasBlock(parent, 'INPUT', true);
              parent.getInput('INPUT').connection.setShadowState(null);
              assertInputNotHasBlock(parent, 'INPUT');
            });

            test('Multiple Value', function () {
              const parent = createRowBlock(this.workspace);
              parent.getInput('INPUT').connection.setShadowState({
                'type': 'row_block',
                'inputs': {
                  'INPUT': {
                    'shadow': {
                      'type': 'row_block',
                    },
                  },
                },
              });
              assertInputHasBlock(parent, 'INPUT', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
                true,
              );
              const child = createRowBlock(this.workspace);
              parent
                .getInput('INPUT')
                .connection.connect(child.outputConnection);
              assertInputHasBlock(parent, 'INPUT', false);
              parent.getInput('INPUT').connection.disconnect();
              assertInputHasBlock(parent, 'INPUT', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('INPUT'),
                'INPUT',
                true,
              );
              parent.getInput('INPUT').connection.setShadowState(null);
              assertInputNotHasBlock(parent, 'INPUT');
            });

            test('Statement', function () {
              const parent = createStatementBlock(this.workspace);
              parent
                .getInput('NAME')
                .connection.setShadowState({'type': 'statement_block'});
              assertInputHasBlock(parent, 'NAME', true);
              const child = createStatementBlock(this.workspace);
              parent
                .getInput('NAME')
                .connection.connect(child.previousConnection);
              assertInputHasBlock(parent, 'NAME', false);
              parent.getInput('NAME').connection.disconnect();
              assertInputHasBlock(parent, 'NAME', true);
              parent.getInput('NAME').connection.setShadowState(null);
              assertInputNotHasBlock(parent, 'NAME');
            });

            test('Multiple Statement', function () {
              const parent = createStatementBlock(this.workspace);
              parent.getInput('NAME').connection.setShadowState({
                'type': 'statement_block',
                'inputs': {
                  'NAME': {
                    'shadow': {
                      'type': 'statement_block',
                    },
                  },
                },
              });
              assertInputHasBlock(parent, 'NAME', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
                true,
              );
              const child = createStatementBlock(this.workspace);
              parent
                .getInput('NAME')
                .connection.connect(child.previousConnection);
              assertInputHasBlock(parent, 'NAME', false);
              parent.getInput('NAME').connection.disconnect();
              assertInputHasBlock(parent, 'NAME', true);
              assertInputHasBlock(
                parent.getInputTargetBlock('NAME'),
                'NAME',
                true,
              );
              parent.getInput('NAME').connection.setShadowState(null);
              assertInputNotHasBlock(parent, 'NAME');
            });

            test('Next', function () {
              const parent = createStackBlock(this.workspace);
              parent.nextConnection.setShadowState({'type': 'stack_block'});
              const child = createStatementBlock(this.workspace);
              parent.nextConnection.connect(child.previousConnection);
              assertNextHasBlock(parent, false);
              parent.nextConnection.disconnect();
              assertNextHasBlock(parent, true);
              parent.nextConnection.setShadowState(null);
              assertNextNotHasBlock(parent);
            });

            test('Multiple Next', function () {
              const parent = createStackBlock(this.workspace);
              parent.nextConnection.setShadowState({
                'type': 'stack_block',
                'next': {
                  'shadow': {
                    'type': 'stack_block',
                  },
                },
              });
              assertNextHasBlock(parent, true);
              assertNextHasBlock(parent.getNextBlock(), true);
              const child = createStatementBlock(this.workspace);
              parent.nextConnection.connect(child.previousConnection);
              assertNextHasBlock(parent, false);
              parent.nextConnection.disconnect();
              assertNextHasBlock(parent, true);
              assertNextHasBlock(parent.getNextBlock(), true);
              parent.nextConnection.setShadowState(null);
              assertNextNotHasBlock(parent);
            });
          });

          suite('Invalid', function () {
            test('Attach to output', function () {
              const block = this.workspace.newBlock('row_block');
              assert.throws(() =>
                block.outputConnection.setShadowState({'type': 'row_block'}),
              );
            });

            test('Attach to previous', function () {
              const block = this.workspace.newBlock('stack_block');
              assert.throws(() =>
                block.previousConnection.setShadowState({
                  'type': 'stack_block',
                }),
              );
            });

            test('Missing output', function () {
              const block = this.workspace.newBlock('row_block');
              assert.throws(() =>
                block.outputConnection.setShadowState({'type': 'stack_block'}),
              );
            });

            test('Missing previous', function () {
              const block = this.workspace.newBlock('stack_block');
              assert.throws(() =>
                block.previousConnection.setShadowState({'type': 'row_block'}),
              );
            });

            test('Invalid connection checks, output', function () {
              const block = this.workspace.newBlock('logic_operation');
              assert.throws(() =>
                block
                  .getInput('A')
                  .connection.setShadowState({'type': 'math_number'}),
              );
            });

            test('Invalid connection checks, previous', function () {
              Blockly.defineBlocksWithJsonArray([
                {
                  'type': 'stack_checks_block',
                  'message0': '',
                  'previousStatement': 'check 1',
                  'nextStatement': 'check 2',
                },
              ]);
              const block = this.workspace.newBlock('stack_checks_block');
              assert.throws(() =>
                block.nextConnection.setShadowState({
                  'type': 'stack_checks_block',
                }),
              );
            });
          });
        });
      });
    });
  });

  suite('Connect', function () {
    setup(function () {
      this.workspace = new Blockly.Workspace();
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'stack_block',
          'message0': '%1',
          'args0': [
            {
              'type': 'field_input',
              'name': 'FIELD',
              'text': 'default',
            },
          ],
          'previousStatement': 'check1',
          'nextStatement': 'check1',
        },
        {
          'type': 'stack_block_1to2',
          'message0': '',
          'previousStatement': 'check1',
          'nextStatement': 'check2',
        },
        {
          'type': 'stack_block_2to1',
          'message0': '',
          'previousStatement': 'check2',
          'nextStatement': 'check1',
        },
        {
          'type': 'stack_block_noend',
          'message0': '',
          'previousStatement': 'check1',
        },
        {
          'type': 'row_block',
          'message0': '%1 %2',
          'args0': [
            {
              'type': 'field_input',
              'name': 'FIELD',
              'text': 'default',
            },
            {
              'type': 'input_value',
              'name': 'INPUT',
              'check': 'check1',
            },
          ],
          'output': 'check1',
        },
        {
          'type': 'row_block_1to2',
          'message0': '%1',
          'args0': [
            {
              'type': 'input_value',
              'name': 'INPUT',
              'check': 'check1',
            },
          ],
          'output': 'check2',
        },
        {
          'type': 'row_block_2to1',
          'message0': '%1',
          'args0': [
            {
              'type': 'input_value',
              'name': 'INPUT',
              'check': 'check2',
            },
          ],
          'output': 'check1',
        },
        {
          'type': 'row_block_noend',
          'message0': '',
          'output': 'check1',
        },
        {
          'type': 'row_block_multiple_inputs',
          'message0': '%1 %2',
          'args0': [
            {
              'type': 'input_value',
              'name': 'INPUT',
              'check': 'check1',
            },
            {
              'type': 'input_value',
              'name': 'INPUT2',
              'check': 'check1',
            },
          ],
          'output': 'check1',
        },
        {
          'type': 'output_to_statements',
          'message0': '%1 %2',
          'args0': [
            {
              'type': 'input_statement',
              'name': 'INPUT',
              'check': 'check1',
            },
            {
              'type': 'input_statement',
              'name': 'INPUT2',
              'check': 'check1',
            },
          ],
          'output': 'check1',
        },
        {
          'type': 'statement_block',
          'message0': '%1 %2',
          'args0': [
            {
              'type': 'field_input',
              'name': 'FIELD',
              'text': 'default',
            },
            {
              'type': 'input_statement',
              'name': 'NAME',
              'check': 'check1',
            },
          ],
          'previousStatement': 'check1',
          'nextStatement': 'check1',
        },
        {
          'type': 'statement_block_1to2',
          'message0': '%1',
          'args0': [
            {
              'type': 'input_statement',
              'name': 'NAME',
              'check': 'check1',
            },
          ],
          'previousStatement': 'check1',
          'nextStatement': 'check2',
        },
        {
          'type': 'statement_block_2to1',
          'message0': '%1',
          'args0': [
            {
              'type': 'input_statement',
              'name': 'NAME',
              'check': 'check2',
            },
          ],
          'previousStatement': 'check2',
          'nextStatement': 'check1',
        },
        {
          'type': 'statement_block_noend',
          'message0': '%1',
          'args0': [
            {
              'type': 'input_statement',
              'name': 'NAME',
              'check': 'check1',
            },
          ],
          'previousStatement': 'check1',
        },
      ]);

      // Used to make sure we don't get stray shadow blocks or anything.
      this.assertBlockCount = function (count) {
        assert.equal(this.workspace.getAllBlocks().length, count);
      };
    });

    suite('Disconnect from old parent', function () {
      test('Value', function () {
        const oldParent = this.workspace.newBlock('row_block');
        const newParent = this.workspace.newBlock('row_block');
        const child = this.workspace.newBlock('row_block');

        oldParent.getInput('INPUT').connection.connect(child.outputConnection);
        newParent.getInput('INPUT').connection.connect(child.outputConnection);

        assert.isFalse(oldParent.getInput('INPUT').connection.isConnected());
        this.assertBlockCount(3);
      });

      test('Statement', function () {
        const oldParent = this.workspace.newBlock('statement_block');
        const newParent = this.workspace.newBlock('statement_block');
        const child = this.workspace.newBlock('stack_block');

        oldParent.getInput('NAME').connection.connect(child.previousConnection);
        newParent.getInput('NAME').connection.connect(child.previousConnection);

        assert.isFalse(oldParent.getInput('NAME').connection.isConnected());
        this.assertBlockCount(3);
      });

      test('Next', function () {
        const oldParent = this.workspace.newBlock('stack_block');
        const newParent = this.workspace.newBlock('stack_block');
        const child = this.workspace.newBlock('stack_block');

        oldParent.nextConnection.connect(child.previousConnection);
        newParent.nextConnection.connect(child.previousConnection);

        assert.isFalse(oldParent.nextConnection.isConnected());
        this.assertBlockCount(3);
      });
    });

    suite('Shadow dissolves', function () {
      test('Value', function () {
        const newParent = this.workspace.newBlock('row_block');
        const child = this.workspace.newBlock('row_block');
        const xml = Blockly.utils.xml.textToDom('<shadow type="row_block"/>');
        newParent.getInput('INPUT').connection.setShadowDom(xml);
        assert.isTrue(newParent.getInputTargetBlock('INPUT').isShadow());

        newParent.getInput('INPUT').connection.connect(child.outputConnection);

        assert.isFalse(newParent.getInputTargetBlock('INPUT').isShadow());
        this.assertBlockCount(2);
      });

      test('Statement', function () {
        const newParent = this.workspace.newBlock('statement_block');
        const child = this.workspace.newBlock('stack_block');
        const xml = Blockly.utils.xml.textToDom('<shadow type="stack_block"/>');
        newParent.getInput('NAME').connection.setShadowDom(xml);
        assert.isTrue(newParent.getInputTargetBlock('NAME').isShadow());

        newParent.getInput('NAME').connection.connect(child.previousConnection);

        assert.isFalse(newParent.getInputTargetBlock('NAME').isShadow());
        this.assertBlockCount(2);
      });

      test('Next', function () {
        const newParent = this.workspace.newBlock('stack_block');
        const child = this.workspace.newBlock('stack_block');
        const xml = Blockly.utils.xml.textToDom('<shadow type="stack_block"/>');
        newParent.nextConnection.setShadowDom(xml);
        assert.isTrue(newParent.getNextBlock().isShadow());

        newParent.nextConnection.connect(child.previousConnection);

        assert.isFalse(newParent.getNextBlock().isShadow());
        this.assertBlockCount(2);
      });
    });

    suite('Saving shadow values', function () {
      test('Value', function () {
        const newParent = this.workspace.newBlock('row_block');
        const child = this.workspace.newBlock('row_block');
        const xml = Blockly.utils.xml.textToDom('<shadow type="row_block"/>');
        newParent.getInput('INPUT').connection.setShadowDom(xml);
        newParent.getInputTargetBlock('INPUT').setFieldValue('new', 'FIELD');

        newParent.getInput('INPUT').connection.connect(child.outputConnection);
        newParent.getInput('INPUT').connection.disconnect();

        const target = newParent.getInputTargetBlock('INPUT');
        assert.isTrue(target.isShadow());
        assert.equal(target.getFieldValue('FIELD'), 'new');
        this.assertBlockCount(3);
      });

      test('Statement', function () {
        const newParent = this.workspace.newBlock('statement_block');
        const child = this.workspace.newBlock('stack_block');
        const xml = Blockly.utils.xml.textToDom('<shadow type="stack_block"/>');
        newParent.getInput('NAME').connection.setShadowDom(xml);
        newParent.getInputTargetBlock('NAME').setFieldValue('new', 'FIELD');

        newParent.getInput('NAME').connection.connect(child.previousConnection);
        newParent.getInput('NAME').connection.disconnect();

        const target = newParent.getInputTargetBlock('NAME');
        assert.isTrue(target.isShadow());
        assert.equal(target.getFieldValue('FIELD'), 'new');
        this.assertBlockCount(3);
      });

      test('Next', function () {
        const newParent = this.workspace.newBlock('stack_block');
        const child = this.workspace.newBlock('stack_block');
        const xml = Blockly.utils.xml.textToDom('<shadow type="stack_block"/>');
        newParent.nextConnection.setShadowDom(xml);
        newParent.getNextBlock().setFieldValue('new', 'FIELD');

        newParent.nextConnection.connect(child.previousConnection);
        newParent.nextConnection.disconnect();

        const target = newParent.getNextBlock();
        assert.isTrue(target.isShadow());
        assert.equal(target.getFieldValue('FIELD'), 'new');
        this.assertBlockCount(3);
      });
    });

    suite('Reattach or bump orphan', function () {
      suite('Value', function () {
        suite('No available spots', function () {
          test('No connection', function () {
            const parent = this.workspace.newBlock('row_block');
            const oldChild = this.workspace.newBlock('row_block');
            const newChild = this.workspace.newBlock('row_block_noend');
            parent
              .getInput('INPUT')
              .connection.connect(oldChild.outputConnection);

            parent
              .getInput('INPUT')
              .connection.connect(newChild.outputConnection);

            assert.isTrue(parent.getInput('INPUT').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('INPUT'), newChild);
            assert.isFalse(oldChild.outputConnection.isConnected());
          });

          test('All statements', function () {
            const parent = this.workspace.newBlock('row_block');
            const oldChild = this.workspace.newBlock('row_block');
            const newChild = this.workspace.newBlock('output_to_statements');
            parent
              .getInput('INPUT')
              .connection.connect(oldChild.outputConnection);

            parent
              .getInput('INPUT')
              .connection.connect(newChild.outputConnection);

            assert.isTrue(parent.getInput('INPUT').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('INPUT'), newChild);
            assert.isFalse(oldChild.outputConnection.isConnected());
          });

          test('Bad checks', function () {
            const parent = this.workspace.newBlock('row_block');
            const oldChild = this.workspace.newBlock('row_block');
            const newChild = this.workspace.newBlock('row_block_2to1');
            parent
              .getInput('INPUT')
              .connection.connect(oldChild.outputConnection);

            parent
              .getInput('INPUT')
              .connection.connect(newChild.outputConnection);

            assert.isTrue(parent.getInput('INPUT').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('INPUT'), newChild);
            assert.isFalse(oldChild.outputConnection.isConnected());
          });

          test('Through different types', function () {
            const parent = this.workspace.newBlock('row_block');
            const oldChild = this.workspace.newBlock('row_block');
            const newChild = this.workspace.newBlock('row_block_2to1');
            const otherChild = this.workspace.newBlock('row_block_1to2');

            parent
              .getInput('INPUT')
              .connection.connect(oldChild.outputConnection);
            newChild
              .getInput('INPUT')
              .connection.connect(otherChild.outputConnection);

            parent
              .getInput('INPUT')
              .connection.connect(newChild.outputConnection);

            assert.isTrue(parent.getInput('INPUT').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('INPUT'), newChild);
            assert.isFalse(oldChild.outputConnection.isConnected());
          });
        });

        suite('Multiple available spots', function () {
          suite('No shadows', function () {
            test('Top block', function () {
              const parent = this.workspace.newBlock('row_block');
              const oldChild = this.workspace.newBlock('row_block');
              const newChild = this.workspace.newBlock(
                'row_block_multiple_inputs',
              );

              parent
                .getInput('INPUT')
                .connection.connect(oldChild.outputConnection);

              parent
                .getInput('INPUT')
                .connection.connect(newChild.outputConnection);

              assert.isTrue(parent.getInput('INPUT').connection.isConnected());
              assert.equal(parent.getInputTargetBlock('INPUT'), newChild);
              assert.isFalse(oldChild.outputConnection.isConnected());
            });

            test('Child blocks', function () {
              const parent = this.workspace.newBlock('row_block');
              const oldChild = this.workspace.newBlock('row_block');
              const newChild = this.workspace.newBlock(
                'row_block_multiple_inputs',
              );
              const childX = this.workspace.newBlock('row_block');
              const childY = this.workspace.newBlock('row_block');

              parent
                .getInput('INPUT')
                .connection.connect(oldChild.outputConnection);
              newChild
                .getInput('INPUT')
                .connection.connect(childX.outputConnection);
              newChild
                .getInput('INPUT2')
                .connection.connect(childY.outputConnection);

              parent
                .getInput('INPUT')
                .connection.connect(newChild.outputConnection);

              assert.isTrue(parent.getInput('INPUT').connection.isConnected());
              assert.equal(parent.getInputTargetBlock('INPUT'), newChild);
              assert.isFalse(oldChild.outputConnection.isConnected());
            });

            test('Spots filled', function () {
              const parent = this.workspace.newBlock('row_block');
              const oldChild = this.workspace.newBlock('row_block');
              const newChild = this.workspace.newBlock(
                'row_block_multiple_inputs',
              );
              const otherChild = this.workspace.newBlock('row_block_noend');

              parent
                .getInput('INPUT')
                .connection.connect(oldChild.outputConnection);
              newChild
                .getInput('INPUT')
                .connection.connect(otherChild.outputConnection);

              parent
                .getInput('INPUT')
                .connection.connect(newChild.outputConnection);

              assert.isTrue(parent.getInput('INPUT').connection.isConnected());
              assert.equal(parent.getInputTargetBlock('INPUT'), newChild);
              assert.isFalse(oldChild.outputConnection.isConnected());
            });
          });

          suite('Shadows', function () {
            test('Top block', function () {
              const parent = this.workspace.newBlock('row_block');
              const oldChild = this.workspace.newBlock('row_block');
              const newChild = this.workspace.newBlock(
                'row_block_multiple_inputs',
              );

              parent
                .getInput('INPUT')
                .connection.connect(oldChild.outputConnection);
              newChild
                .getInput('INPUT')
                .connection.setShadowDom(
                  Blockly.utils.xml.textToDom(
                    '<xml><shadow type="row_block"/></xml>',
                  ).firstChild,
                );
              newChild
                .getInput('INPUT2')
                .connection.setShadowDom(
                  Blockly.utils.xml.textToDom(
                    '<xml><shadow type="row_block"/></xml>',
                  ).firstChild,
                );

              parent
                .getInput('INPUT')
                .connection.connect(newChild.outputConnection);

              assert.isTrue(parent.getInput('INPUT').connection.isConnected());
              assert.equal(parent.getInputTargetBlock('INPUT'), newChild);
              assert.isFalse(oldChild.outputConnection.isConnected());
            });

            test('Child blocks', function () {
              const parent = this.workspace.newBlock('row_block');
              const oldChild = this.workspace.newBlock('row_block');
              const newChild = this.workspace.newBlock(
                'row_block_multiple_inputs',
              );
              const childX = this.workspace.newBlock('row_block');
              const childY = this.workspace.newBlock('row_block');

              parent
                .getInput('INPUT')
                .connection.connect(oldChild.outputConnection);
              newChild
                .getInput('INPUT')
                .connection.connect(childX.outputConnection);
              newChild
                .getInput('INPUT2')
                .connection.connect(childY.outputConnection);
              childX
                .getInput('INPUT')
                .connection.setShadowDom(
                  Blockly.utils.xml.textToDom(
                    '<xml><shadow type="row_block"/></xml>',
                  ).firstChild,
                );
              childY
                .getInput('INPUT')
                .connection.setShadowDom(
                  Blockly.utils.xml.textToDom(
                    '<xml><shadow type="row_block"/></xml>',
                  ).firstChild,
                );

              parent
                .getInput('INPUT')
                .connection.connect(newChild.outputConnection);

              assert.isTrue(parent.getInput('INPUT').connection.isConnected());
              assert.equal(parent.getInputTargetBlock('INPUT'), newChild);
              assert.isFalse(oldChild.outputConnection.isConnected());
            });

            test('Spots filled', function () {
              const parent = this.workspace.newBlock('row_block');
              const oldChild = this.workspace.newBlock('row_block');
              const newChild = this.workspace.newBlock(
                'row_block_multiple_inputs',
              );
              const otherChild = this.workspace.newBlock('row_block_noend');

              parent
                .getInput('INPUT')
                .connection.connect(oldChild.outputConnection);
              newChild
                .getInput('INPUT')
                .connection.connect(otherChild.outputConnection);
              newChild
                .getInput('INPUT2')
                .connection.setShadowDom(
                  Blockly.utils.xml.textToDom(
                    '<xml><shadow type="row_block"/></xml>',
                  ).firstChild,
                );

              parent
                .getInput('INPUT')
                .connection.connect(newChild.outputConnection);

              assert.isTrue(parent.getInput('INPUT').connection.isConnected());
              assert.equal(parent.getInputTargetBlock('INPUT'), newChild);
              assert.isFalse(oldChild.outputConnection.isConnected());
            });
          });
        });

        suite('Single available spot', function () {
          test('No shadows', function () {
            const parent = this.workspace.newBlock('row_block');
            const oldChild = this.workspace.newBlock('row_block');
            const newChild = this.workspace.newBlock('row_block');

            parent
              .getInput('INPUT')
              .connection.connect(oldChild.outputConnection);

            parent
              .getInput('INPUT')
              .connection.connect(newChild.outputConnection);

            assert.isTrue(parent.getInput('INPUT').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('INPUT'), newChild);
            assert.isTrue(newChild.getInput('INPUT').connection.isConnected());
            assert.equal(newChild.getInputTargetBlock('INPUT'), oldChild);
          });

          test('Shadows', function () {
            const parent = this.workspace.newBlock('row_block');
            const oldChild = this.workspace.newBlock('row_block');
            const newChild = this.workspace.newBlock('row_block');

            parent
              .getInput('INPUT')
              .connection.connect(oldChild.outputConnection);
            newChild
              .getInput('INPUT')
              .connection.setShadowDom(
                Blockly.utils.xml.textToDom(
                  '<xml><shadow type="row_block"/></xml>',
                ).firstChild,
              );

            parent
              .getInput('INPUT')
              .connection.connect(newChild.outputConnection);

            assert.isTrue(parent.getInput('INPUT').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('INPUT'), newChild);
            assert.isTrue(newChild.getInput('INPUT').connection.isConnected());
            assert.equal(newChild.getInputTargetBlock('INPUT'), oldChild);
          });
        });
      });

      suite('Statement', function () {
        suite('No shadows', function () {
          test('Simple', function () {
            const parent = this.workspace.newBlock('statement_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild = this.workspace.newBlock('stack_block');
            parent
              .getInput('NAME')
              .connection.connect(oldChild.previousConnection);

            parent
              .getInput('NAME')
              .connection.connect(newChild.previousConnection);

            assert.isTrue(parent.getInput('NAME').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('NAME'), newChild);
            assert.isTrue(newChild.nextConnection.isConnected());
            assert.equal(newChild.getNextBlock(), oldChild);
            this.assertBlockCount(3);
          });

          test('Bad check in between', function () {
            const parent = this.workspace.newBlock('statement_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild1 = this.workspace.newBlock('stack_block_1to2');
            const newChild2 = this.workspace.newBlock('stack_block_2to1');
            parent
              .getInput('NAME')
              .connection.connect(oldChild.previousConnection);
            newChild1.nextConnection.connect(newChild2.previousConnection);

            parent
              .getInput('NAME')
              .connection.connect(newChild1.previousConnection);

            assert.isTrue(parent.getInput('NAME').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('NAME'), newChild1);
            assert.isTrue(newChild2.nextConnection.isConnected());
            assert.equal(newChild2.getNextBlock(), oldChild);
            this.assertBlockCount(4);
          });

          test('Bad check at end', function () {
            const parent = this.workspace.newBlock('statement_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild = this.workspace.newBlock('stack_block_1to2');
            parent
              .getInput('NAME')
              .connection.connect(oldChild.previousConnection);
            const spy = sinon.spy(
              oldChild.previousConnection,
              'onFailedConnect',
            );

            parent
              .getInput('NAME')
              .connection.connect(newChild.previousConnection);

            assert.isTrue(parent.getInput('NAME').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('NAME'), newChild);
            assert.isFalse(newChild.nextConnection.isConnected());
            assert.isTrue(spy.calledOnce);
            this.assertBlockCount(3);
          });

          test('No end connection', function () {
            const parent = this.workspace.newBlock('statement_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild = this.workspace.newBlock('stack_block_noend');
            parent
              .getInput('NAME')
              .connection.connect(oldChild.previousConnection);
            const spy = sinon.spy(
              oldChild.previousConnection,
              'onFailedConnect',
            );

            parent
              .getInput('NAME')
              .connection.connect(newChild.previousConnection);

            assert.isTrue(parent.getInput('NAME').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('NAME'), newChild);
            assert.isTrue(spy.calledOnce);
            this.assertBlockCount(3);
          });
        });

        suite('Shadows', function () {
          test('Simple', function () {
            const parent = this.workspace.newBlock('statement_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild = this.workspace.newBlock('stack_block');
            parent
              .getInput('NAME')
              .connection.connect(oldChild.previousConnection);
            const xml = Blockly.utils.xml.textToDom(
              '<shadow type="stack_block"/>',
            );
            newChild.nextConnection.setShadowDom(xml);

            parent
              .getInput('NAME')
              .connection.connect(newChild.previousConnection);

            assert.isTrue(parent.getInput('NAME').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('NAME'), newChild);
            assert.isTrue(newChild.nextConnection.isConnected());
            assert.equal(newChild.getNextBlock(), oldChild);
            this.assertBlockCount(3);
          });

          test('Bad check in between', function () {
            const parent = this.workspace.newBlock('statement_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild1 = this.workspace.newBlock('stack_block_1to2');
            const newChild2 = this.workspace.newBlock('stack_block_2to1');
            parent
              .getInput('NAME')
              .connection.connect(oldChild.previousConnection);
            newChild1.nextConnection.connect(newChild2.previousConnection);
            const xml = Blockly.utils.xml.textToDom(
              '<shadow type="stack_block"/>',
            );
            newChild2.nextConnection.setShadowDom(xml);

            parent
              .getInput('NAME')
              .connection.connect(newChild1.previousConnection);

            assert.isTrue(parent.getInput('NAME').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('NAME'), newChild1);
            assert.isTrue(newChild2.nextConnection.isConnected());
            assert.equal(newChild2.getNextBlock(), oldChild);
            this.assertBlockCount(4);
          });

          test('Bad check at end', function () {
            const parent = this.workspace.newBlock('statement_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild = this.workspace.newBlock('stack_block_1to2');
            parent
              .getInput('NAME')
              .connection.connect(oldChild.previousConnection);
            const xml = Blockly.utils.xml.textToDom(
              '<shadow type="stack_block_2to1"/>',
            );
            newChild.nextConnection.setShadowDom(xml);
            const spy = sinon.spy(
              oldChild.previousConnection,
              'onFailedConnect',
            );

            parent
              .getInput('NAME')
              .connection.connect(newChild.previousConnection);

            assert.isTrue(parent.getInput('NAME').connection.isConnected());
            assert.equal(parent.getInputTargetBlock('NAME'), newChild);
            assert.isTrue(newChild.nextConnection.isConnected());
            assert.isTrue(newChild.getNextBlock().isShadow());
            assert.isTrue(spy.calledOnce);
            this.assertBlockCount(4);
          });
        });
      });

      suite('Next', function () {
        suite('No shadows', function () {
          test('Simple', function () {
            const parent = this.workspace.newBlock('stack_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild = this.workspace.newBlock('stack_block');
            parent.nextConnection.connect(oldChild.previousConnection);

            parent.nextConnection.connect(newChild.previousConnection);

            assert.isTrue(parent.nextConnection.isConnected());
            assert.equal(parent.getNextBlock(), newChild);
            assert.isTrue(newChild.nextConnection.isConnected());
            assert.equal(newChild.getNextBlock(), oldChild);
            this.assertBlockCount(3);
          });

          test('Bad check in between', function () {
            const parent = this.workspace.newBlock('stack_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild1 = this.workspace.newBlock('stack_block_1to2');
            const newChild2 = this.workspace.newBlock('stack_block_2to1');
            parent.nextConnection.connect(oldChild.previousConnection);
            newChild1.nextConnection.connect(newChild2.previousConnection);

            parent.nextConnection.connect(newChild1.previousConnection);

            assert.isTrue(parent.nextConnection.isConnected());
            assert.equal(parent.getNextBlock(), newChild1);
            assert.isTrue(newChild2.nextConnection.isConnected());
            assert.equal(newChild2.getNextBlock(), oldChild);
            this.assertBlockCount(4);
          });

          test('Bad check at end', function () {
            const parent = this.workspace.newBlock('stack_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild = this.workspace.newBlock('stack_block_1to2');
            parent.nextConnection.connect(oldChild.previousConnection);
            const spy = sinon.spy(
              oldChild.previousConnection,
              'onFailedConnect',
            );

            parent.nextConnection.connect(newChild.previousConnection);

            assert.isTrue(parent.nextConnection.isConnected());
            assert.equal(parent.getNextBlock(), newChild);
            assert.isFalse(newChild.nextConnection.isConnected());
            assert.isTrue(spy.calledOnce);
            this.assertBlockCount(3);
          });

          test('No end connection', function () {
            const parent = this.workspace.newBlock('stack_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild = this.workspace.newBlock('stack_block_noend');
            parent.nextConnection.connect(oldChild.previousConnection);
            const spy = sinon.spy(
              oldChild.previousConnection,
              'onFailedConnect',
            );

            parent.nextConnection.connect(newChild.previousConnection);

            assert.isTrue(parent.nextConnection.isConnected());
            assert.equal(parent.getNextBlock(), newChild);
            assert.isTrue(spy.calledOnce);
            this.assertBlockCount(3);
          });
        });

        suite('Shadows', function () {
          test('Simple', function () {
            const parent = this.workspace.newBlock('stack_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild = this.workspace.newBlock('stack_block');
            parent.nextConnection.connect(oldChild.previousConnection);
            const xml = Blockly.utils.xml.textToDom(
              '<shadow type="stack_block"/>',
            );
            newChild.nextConnection.setShadowDom(xml);

            parent.nextConnection.connect(newChild.previousConnection);

            assert.isTrue(parent.nextConnection.isConnected());
            assert.equal(parent.getNextBlock(), newChild);
            assert.isTrue(newChild.nextConnection.isConnected());
            assert.equal(newChild.getNextBlock(), oldChild);
            this.assertBlockCount(3);
          });

          test('Bad check in between', function () {
            const parent = this.workspace.newBlock('stack_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild1 = this.workspace.newBlock('stack_block_1to2');
            const newChild2 = this.workspace.newBlock('stack_block_2to1');
            parent.nextConnection.connect(oldChild.previousConnection);
            newChild1.nextConnection.connect(newChild2.previousConnection);
            const xml = Blockly.utils.xml.textToDom(
              '<shadow type="stack_block"/>',
            );
            newChild2.nextConnection.setShadowDom(xml);

            parent.nextConnection.connect(newChild1.previousConnection);

            assert.isTrue(parent.nextConnection.isConnected());
            assert.equal(parent.getNextBlock(), newChild1);
            assert.isTrue(newChild2.nextConnection.isConnected());
            assert.equal(newChild2.getNextBlock(), oldChild);
            this.assertBlockCount(4);
          });

          test('Bad check at end', function () {
            const parent = this.workspace.newBlock('stack_block');
            const oldChild = this.workspace.newBlock('stack_block');
            const newChild = this.workspace.newBlock('stack_block_1to2');
            parent.nextConnection.connect(oldChild.previousConnection);
            const xml = Blockly.utils.xml.textToDom(
              '<shadow type="stack_block_2to1"/>',
            );
            newChild.nextConnection.setShadowDom(xml);
            const spy = sinon.spy(
              oldChild.previousConnection,
              'onFailedConnect',
            );

            parent.nextConnection.connect(newChild.previousConnection);

            assert.isTrue(parent.nextConnection.isConnected());
            assert.equal(parent.getNextBlock(), newChild);
            assert.isTrue(newChild.nextConnection.isConnected());
            assert.isTrue(newChild.getNextBlock().isShadow());
            assert.isTrue(spy.calledOnce);
            this.assertBlockCount(4);
          });
        });
      });
    });
  });
});
