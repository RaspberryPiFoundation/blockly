/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '../../build/src/core/blockly.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  defineRowBlock,
  defineStackBlock,
  defineStatementBlock,
} from './test_helpers/block_definitions.js';
import {
  MockParameterModel,
  MockProcedureModel,
} from './test_helpers/procedures.js';
import {
  createGenUidStubWithReturns,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';

suite('JSO Serialization', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
    this.sandbox = sinon.createSandbox();

    defineStackBlock();
    defineRowBlock();
    defineStatementBlock();

    createGenUidStubWithReturns(new Array(10).fill().map((_, i) => 'id' + i));
    this.variableMap = this.workspace.getVariableMap();
  });

  teardown(function () {
    this.sandbox.restore();
    workspaceTeardown.call(this, this.workspace);
    sharedTestTeardown.call(this);
  });

  function assertProperty(obj, property, value) {
    assert.deepEqual(obj[property], value);
  }

  function assertNoProperty(obj, property) {
    assertProperty(obj, property, undefined);
  }

  suite('Blocks', function () {
    test('Null on insertionMarkers', function () {
      const block = this.workspace.newBlock('row_block');
      block.setInsertionMarker(true);
      const jso = Blockly.serialization.blocks.save(block);
      assert.isNull(jso);
    });

    test('Basic', function () {
      const block = this.workspace.newBlock('row_block');
      const jso = Blockly.serialization.blocks.save(block);
      assertProperty(jso, 'type', 'row_block');
      assertProperty(jso, 'id', 'id0');
    });

    test('saveId false', function () {
      const block = this.workspace.newBlock('row_block');
      const jso = Blockly.serialization.blocks.save(block, {saveIds: false});
      assertProperty(jso, 'id', undefined);
    });

    suite('Attributes', function () {
      suite('Collapsed', function () {
        test('True', function () {
          const block = this.workspace.newBlock('row_block');
          block.setCollapsed(true);
          const jso = Blockly.serialization.blocks.save(block);
          assertProperty(jso, 'collapsed', true);
        });

        test('False', function () {
          const block = this.workspace.newBlock('row_block');
          block.setCollapsed(false);
          const jso = Blockly.serialization.blocks.save(block);
          assertNoProperty(jso, 'collapsed');
        });
      });

      suite('DisabledReasons', function () {
        test('One reason', function () {
          const block = this.workspace.newBlock('row_block');
          block.setDisabledReason(true, 'test reason');
          const jso = Blockly.serialization.blocks.save(block);
          assertProperty(jso, 'disabledReasons', ['test reason']);
        });

        test('Zero reasons', function () {
          const block = this.workspace.newBlock('row_block');
          block.setDisabledReason(false, 'test reason');
          const jso = Blockly.serialization.blocks.save(block);
          assertNoProperty(jso, 'disabledReasons');
        });

        test('Multiple reasons', function () {
          const block = this.workspace.newBlock('row_block');
          block.setDisabledReason(true, 'test reason 1');
          block.setDisabledReason(true, 'test reason 2');
          const jso = Blockly.serialization.blocks.save(block);
          assertProperty(jso, 'disabledReasons', [
            'test reason 1',
            'test reason 2',
          ]);
        });
      });

      suite('Inline', function () {
        test('True', function () {
          const block = this.workspace.newBlock('statement_block');
          block.setInputsInline(true);
          const jso = Blockly.serialization.blocks.save(block);
          assertProperty(jso, 'inline', true);
        });

        test('False', function () {
          const block = this.workspace.newBlock('statement_block');
          block.setInputsInline(false);
          const jso = Blockly.serialization.blocks.save(block);
          assertProperty(jso, 'inline', false);
        });

        test('undefined', function () {
          const block = this.workspace.newBlock('statement_block');
          const jso = Blockly.serialization.blocks.save(block);
          assertNoProperty(jso, 'inline');
        });

        test('True, matching default', function () {
          const block = this.workspace.newBlock('statement_block');
          block.setInputsInline(true);
          block.inputsInlineDefault = true;
          const jso = Blockly.serialization.blocks.save(block);
          assertNoProperty(jso, 'inline');
        });

        test('False, matching default', function () {
          const block = this.workspace.newBlock('statement_block');
          block.setInputsInline(false);
          block.inputsInlineDefault = false;
          const jso = Blockly.serialization.blocks.save(block);
          assertNoProperty(jso, 'inline');
        });
      });

      suite('Data', function () {
        test('No data', function () {
          const block = this.workspace.newBlock('row_block');
          const jso = Blockly.serialization.blocks.save(block);
          assertNoProperty(jso, 'data');
        });

        test('With data', function () {
          const block = this.workspace.newBlock('row_block');
          block.data = 'some data';
          const jso = Blockly.serialization.blocks.save(block);
          assertProperty(jso, 'data', 'some data');
        });
      });
    });

    suite('Coords', function () {
      test('No coordinates', function () {
        const block = this.workspace.newBlock('row_block');
        const jso = Blockly.serialization.blocks.save(block);
        assertNoProperty(jso, 'x');
        assertNoProperty(jso, 'y');
      });

      test('Simple', function () {
        const block = this.workspace.newBlock('row_block');
        block.moveBy(42, 42);
        const jso = Blockly.serialization.blocks.save(block, {
          addCoordinates: true,
        });
        assertProperty(jso, 'x', 42);
        assertProperty(jso, 'y', 42);
      });

      test('Negative', function () {
        const block = this.workspace.newBlock('row_block');
        block.moveBy(-42, -42);
        const jso = Blockly.serialization.blocks.save(block, {
          addCoordinates: true,
        });
        assertProperty(jso, 'x', -42);
        assertProperty(jso, 'y', -42);
      });

      test('Zero', function () {
        const block = this.workspace.newBlock('row_block');
        const jso = Blockly.serialization.blocks.save(block, {
          addCoordinates: true,
        });
        assertProperty(jso, 'x', 0);
        assertProperty(jso, 'y', 0);
      });
    });

    // Mutators.
    suite('Extra state', function () {
      test('Simple value', function () {
        const block = this.workspace.newBlock('row_block');
        block.saveExtraState = function () {
          return 'some extra state';
        };
        const jso = Blockly.serialization.blocks.save(block);
        assertProperty(jso, 'extraState', 'some extra state');
      });

      test('Object', function () {
        const block = this.workspace.newBlock('row_block');
        block.saveExtraState = function () {
          return {
            'extra1': 'state1',
            'extra2': 42,
            'extra3': true,
          };
        };
        const jso = Blockly.serialization.blocks.save(block);
        assertProperty(jso, 'extraState', {
          'extra1': 'state1',
          'extra2': 42,
          'extra3': true,
        });
      });

      test('Array', function () {
        const block = this.workspace.newBlock('row_block');
        block.saveExtraState = function () {
          return ['state1', 42, true];
        };
        const jso = Blockly.serialization.blocks.save(block);
        assertProperty(jso, 'extraState', ['state1', 42, true]);
      });

      test('Xml hooks', function () {
        const block = this.workspace.newBlock('row_block');
        block.mutationToDom = function () {
          const container = Blockly.utils.xml.createElement('mutation');
          container.setAttribute('value', 'some value');
          return container;
        };
        const jso = Blockly.serialization.blocks.save(block);
        assertProperty(
          jso,
          'extraState',
          '<mutation value="some value"></mutation>',
        );
      });
    });

    suite('Icons', function () {
      suite('Comment', function () {
        test('Basic', function () {
          const block = this.workspace.newBlock('row_block');
          block.setCommentText('test');
          const jso = Blockly.serialization.blocks.save(block);
          assertProperty(jso, 'icons', {
            'comment': {
              'text': 'test',
              'pinned': false,
              'height': 80,
              'width': 160,
            },
          });
        });

        test('Pinned', function () {
          const block = this.workspace.newBlock('row_block');
          block.setCommentText('test');
          block.getIcon(Blockly.icons.CommentIcon.TYPE).setBubbleVisible(true);
          const jso = Blockly.serialization.blocks.save(block);
          assertProperty(jso, 'icons', {
            'comment': {
              'text': 'test',
              'pinned': true,
              'height': 80,
              'width': 160,
            },
          });
        });

        test('Size', function () {
          const block = this.workspace.newBlock('row_block');
          block.setCommentText('test');
          block
            .getIcon(Blockly.icons.CommentIcon.TYPE)
            .setBubbleSize(new Blockly.utils.Size(320, 40));
          const jso = Blockly.serialization.blocks.save(block);
          assertProperty(jso, 'icons', {
            'comment': {
              'text': 'test',
              'pinned': false,
              'height': 40,
              'width': 320,
            },
          });
        });
      });
    });

    suite('Fields', function () {
      class StringStateField extends Blockly.Field {
        constructor(value, validator = undefined, config = undefined) {
          super(value, validator, config);
          this.SERIALIZABLE = true;
        }

        saveState() {
          return 'some state';
        }
      }

      class ObjectStateField extends Blockly.Field {
        constructor(value, validator = undefined, config = undefined) {
          super(value, validator, config);
          this.SERIALIZABLE = true;
        }

        saveState() {
          return {
            'prop1': 'state1',
            'prop2': 42,
            'prop3': true,
          };
        }
      }

      class ArrayStateField extends Blockly.Field {
        constructor(value, validator = undefined, config = undefined) {
          super(value, validator, config);
          this.SERIALIZABLE = true;
        }

        saveState() {
          return ['state1', 42, true];
        }
      }

      class XmlStateField extends Blockly.Field {
        constructor(value, validator = undefined, config = undefined) {
          super(value, validator, config);
          this.SERIALIZABLE = true;
        }
      }

      test('Simple value', function () {
        const block = this.workspace.newBlock('row_block');
        block.getInput('INPUT').appendField(new StringStateField(''), 'FIELD');
        const jso = Blockly.serialization.blocks.save(block);
        assertProperty(jso, 'fields', {'FIELD': 'some state'});
      });

      test('Object', function () {
        const block = this.workspace.newBlock('row_block');
        block.getInput('INPUT').appendField(new ObjectStateField(''), 'FIELD');
        const jso = Blockly.serialization.blocks.save(block);
        assertProperty(jso, 'fields', {
          'FIELD': {
            'prop1': 'state1',
            'prop2': 42,
            'prop3': true,
          },
        });
      });

      test('Array', function () {
        const block = this.workspace.newBlock('row_block');
        block.getInput('INPUT').appendField(new ArrayStateField(''), 'FIELD');
        const jso = Blockly.serialization.blocks.save(block);
        assertProperty(jso, 'fields', {'FIELD': ['state1', 42, true]});
      });
    });

    suite('Connected blocks', function () {
      setup(function () {
        this.assertInput = function (jso, name, value) {
          assert.deepInclude(jso['inputs'][name], value);
        };

        this.createBlockWithChild = function (blockType, inputName) {
          const block = this.workspace.newBlock(blockType);
          const childBlock = this.workspace.newBlock(blockType);
          block
            .getInput(inputName)
            .connection.connect(
              childBlock.outputConnection || childBlock.previousConnection,
            );
          return block;
        };

        this.createBlockWithShadow = function (blockType, inputName) {
          const block = this.workspace.newBlock(blockType);
          block
            .getInput(inputName)
            .connection.setShadowDom(
              Blockly.utils.xml.textToDom(
                '<shadow type="' + blockType + '" id="test"></shadow>',
              ),
            );
          return block;
        };

        this.createBlockWithShadowAndChild = function (blockType, inputName) {
          const block = this.workspace.newBlock(blockType);
          const childBlock = this.workspace.newBlock(blockType);
          block
            .getInput(inputName)
            .connection.connect(
              childBlock.outputConnection || childBlock.previousConnection,
            );
          block
            .getInput(inputName)
            .connection.setShadowDom(
              Blockly.utils.xml.textToDom(
                '<shadow type="' + blockType + '" id="test"></shadow>',
              ),
            );
          return block;
        };

        this.assertChild = function (blockType, inputName) {
          const block = this.createBlockWithChild(blockType, inputName);
          const jso = Blockly.serialization.blocks.save(block);
          this.assertInput(jso, inputName, {
            'block': {'type': blockType, 'id': 'id2'},
          });
        };

        this.assertShadow = function (blockType, inputName) {
          const block = this.createBlockWithShadow(blockType, inputName);
          const jso = Blockly.serialization.blocks.save(block);
          this.assertInput(jso, inputName, {
            'shadow': {'type': blockType, 'id': 'test'},
          });
        };

        this.assertOverwrittenShadow = function (blockType, inputName) {
          const block = this.createBlockWithShadowAndChild(
            blockType,
            inputName,
          );
          const jso = Blockly.serialization.blocks.save(block);
          this.assertInput(jso, inputName, {
            'block': {
              'type': blockType,
              'id': 'id2',
            },
            'shadow': {
              'type': blockType,
              'id': 'test',
            },
          });
        };

        this.assertNoChild = function (blockType, inputName) {
          const block = this.createBlockWithChild(blockType, inputName);
          const jso = Blockly.serialization.blocks.save(block, {
            addInputBlocks: false,
          });
          assert.isUndefined(jso['inputs']);
        };

        this.assertNoShadow = function (blockType, inputName) {
          const block = this.createBlockWithShadow(blockType, inputName);
          const jso = Blockly.serialization.blocks.save(block, {
            addInputBlocks: false,
          });
          assert.isUndefined(jso['inputs']);
        };

        this.assertNoOverwrittenShadow = function (blockType, inputName) {
          const block = this.createBlockWithShadowAndChild(
            blockType,
            inputName,
          );
          const jso = Blockly.serialization.blocks.save(block, {
            addInputBlocks: false,
          });
          assert.isUndefined(jso['inputs']);
        };
      });

      suite('Editing shadow value', function () {
        test('Not overwritten', function () {
          const block = this.workspace.newBlock('text_print');
          block.getInput('TEXT').connection.setShadowState({
            'type': 'text',
            'id': 'id',
          });
          block.getInputTargetBlock('TEXT').setFieldValue('new value', 'TEXT');
          const jso = Blockly.serialization.blocks.save(block);
          this.assertInput(jso, 'TEXT', {
            'shadow': {
              'type': 'text',
              'id': 'id',
              'fields': {
                'TEXT': 'new value',
              },
            },
          });
        });

        test('Overwritten', function () {
          const block = this.workspace.newBlock('text_print');
          block.getInput('TEXT').connection.setShadowState({
            'type': 'text',
            'id': 'id',
          });
          block.getInputTargetBlock('TEXT').setFieldValue('new value', 'TEXT');
          const childBlock = this.workspace.newBlock('text');
          block
            .getInput('TEXT')
            .connection.connect(childBlock.outputConnection);
          const jso = Blockly.serialization.blocks.save(block);
          this.assertInput(jso, 'TEXT', {
            'shadow': {
              'type': 'text',
              'id': 'id',
              'fields': {
                'TEXT': 'new value',
              },
            },
            'block': {
              'type': 'text',
              'id': 'id4',
              'fields': {
                'TEXT': '',
              },
            },
          });
        });
      });

      suite('Value', function () {
        suite('With serialization', function () {
          test('Child', function () {
            this.assertChild('row_block', 'INPUT');
          });

          test('Shadow', function () {
            this.assertShadow('row_block', 'INPUT');
          });

          test('Overwritten shadow', function () {
            this.assertOverwrittenShadow('row_block', 'INPUT');
          });
        });

        suite('Without serialization', function () {
          test('Child', function () {
            this.assertNoChild('row_block', 'INPUT');
          });

          test('Shadow', function () {
            this.assertNoShadow('row_block', 'INPUT');
          });

          test('Overwritten shadow', function () {
            this.assertNoOverwrittenShadow('row_block', 'INPUT');
          });
        });
      });

      suite('Statement', function () {
        suite('With serialization', function () {
          test('Child', function () {
            this.assertChild('statement_block', 'NAME');
          });

          test('Shadow', function () {
            this.assertShadow('statement_block', 'NAME');
          });

          test('Overwritten shadow', function () {
            this.assertOverwrittenShadow('statement_block', 'NAME');
          });

          test('Child with next blocks', function () {
            const block = this.workspace.newBlock('statement_block');
            const childBlock = this.workspace.newBlock('stack_block');
            const grandChildBlock = this.workspace.newBlock('stack_block');
            block
              .getInput('NAME')
              .connection.connect(childBlock.previousConnection);
            childBlock.nextConnection.connect(
              grandChildBlock.previousConnection,
            );
            const jso = Blockly.serialization.blocks.save(block);
            this.assertInput(jso, 'NAME', {
              'block': {
                'type': 'stack_block',
                'id': 'id2',
                'next': {
                  'block': {
                    'type': 'stack_block',
                    'id': 'id4',
                  },
                },
              },
            });
          });
        });

        suite('Without serialization', function () {
          test('Child', function () {
            this.assertNoChild('statement_block', 'NAME');
          });

          test('Shadow', function () {
            this.assertNoShadow('statement_block', 'NAME');
          });

          test('Overwritten shadow', function () {
            this.assertNoOverwrittenShadow('statement_block', 'NAME');
          });
        });
      });

      suite('Next', function () {
        setup(function () {
          this.createNextWithChild = function () {
            const block = this.workspace.newBlock('stack_block');
            const childBlock = this.workspace.newBlock('stack_block');
            block.nextConnection.connect(childBlock.previousConnection);
            return block;
          };

          this.createNextWithShadow = function () {
            const block = this.workspace.newBlock('stack_block');
            block.nextConnection.setShadowDom(
              Blockly.utils.xml.textToDom(
                '<shadow type="stack_block" id="test"></shadow>',
              ),
            );
            return block;
          };

          this.createNextWithShadowAndChild = function () {
            const block = this.workspace.newBlock('stack_block');
            const childBlock = this.workspace.newBlock('stack_block');
            block.nextConnection.connect(childBlock.previousConnection);
            block.nextConnection.setShadowDom(
              Blockly.utils.xml.textToDom(
                '<shadow type="stack_block" id="test"></shadow>',
              ),
            );
            return block;
          };
        });

        suite('With serialization', function () {
          test('Child', function () {
            const block = this.createNextWithChild();
            const jso = Blockly.serialization.blocks.save(block);
            assert.deepInclude(jso['next'], {
              'block': {'type': 'stack_block', 'id': 'id2'},
            });
          });

          test('Shadow', function () {
            const block = this.createNextWithShadow();
            const jso = Blockly.serialization.blocks.save(block);
            assert.deepInclude(jso['next'], {
              'shadow': {'type': 'stack_block', 'id': 'test'},
            });
          });

          test('Overwritten shadow', function () {
            const block = this.createNextWithShadowAndChild();
            const jso = Blockly.serialization.blocks.save(block);
            assert.deepInclude(jso['next'], {
              'block': {
                'type': 'stack_block',
                'id': 'id2',
              },
              'shadow': {
                'type': 'stack_block',
                'id': 'test',
              },
            });
          });

          test('Next block with inputs', function () {
            const block = this.workspace.newBlock('stack_block');
            const childBlock = this.workspace.newBlock('statement_block');
            const grandChildBlock = this.workspace.newBlock('stack_block');
            block.nextConnection.connect(childBlock.previousConnection);
            childBlock
              .getInput('NAME')
              .connection.connect(grandChildBlock.previousConnection);
            const jso = Blockly.serialization.blocks.save(block);
            assert.deepInclude(jso['next'], {
              'block': {
                'type': 'statement_block',
                'id': 'id2',
                'inputs': {
                  'NAME': {
                    'block': {
                      'type': 'stack_block',
                      'id': 'id4',
                    },
                  },
                },
              },
            });
          });
        });

        suite('Without serialization', function () {
          test('Child', function () {
            const block = this.createNextWithChild();
            const jso = Blockly.serialization.blocks.save(block, {
              addNextBlocks: false,
            });
            assert.isUndefined(jso['next']);
          });

          test('Shadow', function () {
            const block = this.createNextWithShadow();
            const jso = Blockly.serialization.blocks.save(block, {
              addNextBlocks: false,
            });
            assert.isUndefined(jso['next']);
          });

          test('Overwritten shadow', function () {
            const block = this.createNextWithShadowAndChild();
            const jso = Blockly.serialization.blocks.save(block, {
              addNextBlocks: false,
            });
            assert.isUndefined(jso['next']);
          });
        });
      });
    });

    suite('Do full serialization', function () {
      suite('True', function () {
        test('Single block', function () {
          const block = this.workspace.newBlock('variables_get');
          const jso = Blockly.serialization.blocks.save(block);
          assert.deepEqual(jso['fields']['VAR'], {
            'id': 'id2',
            'name': 'item',
            'type': '',
          });
        });

        test('Input block', function () {
          const block = this.workspace.newBlock('row_block');
          const childBlock = this.workspace.newBlock('variables_get');
          block
            .getInput('INPUT')
            .connection.connect(childBlock.outputConnection);
          const jso = Blockly.serialization.blocks.save(block);
          assert.deepEqual(jso['inputs']['INPUT']['block']['fields']['VAR'], {
            'id': 'id4',
            'name': 'item',
            'type': '',
          });
        });

        test('Next block', function () {
          const block = this.workspace.newBlock('stack_block');
          const childBlock = this.workspace.newBlock('variables_set');
          block.nextConnection.connect(childBlock.previousConnection);
          const jso = Blockly.serialization.blocks.save(block);
          assert.deepEqual(jso['next']['block']['fields']['VAR'], {
            'id': 'id4',
            'name': 'item',
            'type': '',
          });
        });
      });

      suite('False', function () {
        test('Single block', function () {
          const block = this.workspace.newBlock('variables_get');
          const jso = Blockly.serialization.blocks.save(block, {
            doFullSerialization: false,
          });
          assert.deepEqual(jso['fields']['VAR'], {'id': 'id2'});
          assert.isUndefined(jso['fields']['VAR']['name']);
          assert.isUndefined(jso['fields']['VAR']['type']);
        });

        test('Input block', function () {
          const block = this.workspace.newBlock('row_block');
          const childBlock = this.workspace.newBlock('variables_get');
          block
            .getInput('INPUT')
            .connection.connect(childBlock.outputConnection);
          const jso = Blockly.serialization.blocks.save(block, {
            doFullSerialization: false,
          });
          assert.deepEqual(jso['inputs']['INPUT']['block']['fields']['VAR'], {
            'id': 'id4',
          });
          assert.isUndefined(
            jso['inputs']['INPUT']['block']['fields']['VAR']['name'],
          );
          assert.isUndefined(
            jso['inputs']['INPUT']['block']['fields']['VAR']['type'],
          );
        });

        test('Next block', function () {
          const block = this.workspace.newBlock('stack_block');
          const childBlock = this.workspace.newBlock('variables_set');
          block.nextConnection.connect(childBlock.previousConnection);
          const jso = Blockly.serialization.blocks.save(block, {
            doFullSerialization: false,
          });
          assert.deepEqual(jso['next']['block']['fields']['VAR'], {
            'id': 'id4',
          });
          assert.isUndefined(jso['next']['block']['fields']['VAR']['name']);
          assert.isUndefined(jso['next']['block']['fields']['VAR']['type']);
        });
      });
    });
  });

  suite('Variables', function () {
    test('Without type', function () {
      this.variableMap.createVariable('testVar', '', 'testId');
      const jso = Blockly.serialization.workspaces.save(this.workspace);
      const variable = jso['variables'][0];
      assertProperty(variable, 'name', 'testVar');
      assertProperty(variable, 'id', 'testId');
      assertNoProperty(variable, 'type');
    });

    test('With type', function () {
      this.variableMap.createVariable('testVar', 'testType', 'testId');
      const jso = Blockly.serialization.workspaces.save(this.workspace);
      const variable = jso['variables'][0];
      assertProperty(variable, 'name', 'testVar');
      assertProperty(variable, 'id', 'testId');
      assertProperty(variable, 'type', 'testType');
    });
  });

  suite('Procedures', function () {
    setup(function () {
      this.procedureMap = this.workspace.getProcedureMap();
      this.serializer =
        new Blockly.serialization.procedures.ProcedureSerializer(
          MockProcedureModel,
          MockParameterModel,
        );
    });

    teardown(function () {
      this.procedureMap = null;
      this.serializer = null;
    });

    test('save is called on the procedure model', function () {
      const proc = new MockProcedureModel();
      this.workspace.getProcedureMap().set('test', proc);
      const spy = this.sandbox.spy(proc, 'saveState');

      this.serializer.save(this.workspace);

      assert.isTrue(
        spy.calledOnce,
        'Expected the saveState method to be called on the procedure model',
      );
    });

    test('save is called on each parameter model', function () {
      const proc = new MockProcedureModel();
      const param1 = new MockParameterModel();
      const param2 = new MockParameterModel();
      proc.insertParameter(param1, 0);
      proc.insertParameter(param2, 1);
      this.workspace.getProcedureMap().set('test', proc);
      const spy1 = this.sandbox.spy(param1, 'saveState');
      const spy2 = this.sandbox.spy(param2, 'saveState');

      this.serializer.save(this.workspace);

      assert.isTrue(
        spy1.calledOnce,
        'Expected the saveState method to be called on the first parameter model',
      );
      assert.isTrue(
        spy2.calledOnce,
        'Expected the saveState method to be called on the first parameter model',
      );
    });
  });

  suite('Workspace comments', function () {
    suite('IDs', function () {
      test('IDs are saved by default', function () {
        const comment = new Blockly.comments.WorkspaceComment(
          this.workspace,
          'testID',
        );

        const json = Blockly.serialization.workspaceComments.save(comment);

        assertProperty(json, 'id', 'testID');
      });

      test('saving IDs can be disabled', function () {
        const comment = new Blockly.comments.WorkspaceComment(
          this.workspace,
          'testID',
        );

        const json = Blockly.serialization.workspaceComments.save(comment, {
          saveIds: false,
        });

        assertNoProperty(json, 'id');
      });
    });

    suite('Coordinates', function () {
      test('coordinates are not saved by default', function () {
        const comment = new Blockly.comments.WorkspaceComment(this.workspace);
        comment.moveTo(new Blockly.utils.Coordinate(42, 1337));

        const json = Blockly.serialization.workspaceComments.save(comment);

        assertNoProperty(json, 'x');
        assertNoProperty(json, 'y');
      });

      test('saving coordinates can be enabled', function () {
        const comment = new Blockly.comments.WorkspaceComment(this.workspace);
        comment.moveTo(new Blockly.utils.Coordinate(42, 1337));

        const json = Blockly.serialization.workspaceComments.save(comment, {
          addCoordinates: true,
        });

        assertProperty(json, 'x', 42);
        assertProperty(json, 'y', 1337);
      });
    });

    suite('Text', function () {
      test('the empty string is not saved', function () {
        const comment = new Blockly.comments.WorkspaceComment(this.workspace);
        comment.setText('');

        const json = Blockly.serialization.workspaceComments.save(comment);

        assertNoProperty(json, 'text');
      });

      test('text is saved', function () {
        const comment = new Blockly.comments.WorkspaceComment(this.workspace);
        comment.setText('test text');

        const json = Blockly.serialization.workspaceComments.save(comment);

        assertProperty(json, 'text', 'test text');
      });
    });

    test('size is saved', function () {
      const comment = new Blockly.comments.WorkspaceComment(this.workspace);
      comment.setSize(new Blockly.utils.Size(42, 1337));

      const json = Blockly.serialization.workspaceComments.save(comment);

      assertProperty(json, 'width', 42);
      assertProperty(json, 'height', 1337);
    });

    suite('Collapsed', function () {
      test('collapsed is not saved if false', function () {
        const comment = new Blockly.comments.WorkspaceComment(this.workspace);
        comment.setCollapsed(false);

        const json = Blockly.serialization.workspaceComments.save(comment);

        assertNoProperty(json, 'collapsed');
      });

      test('collapsed is saved if true', function () {
        const comment = new Blockly.comments.WorkspaceComment(this.workspace);
        comment.setCollapsed(true);

        const json = Blockly.serialization.workspaceComments.save(comment);

        assertProperty(json, 'collapsed', true);
      });
    });

    suite('Editable', function () {
      test('editable is not saved if true', function () {
        const comment = new Blockly.comments.WorkspaceComment(this.workspace);
        comment.setEditable(true);

        const json = Blockly.serialization.workspaceComments.save(comment);

        assertNoProperty(json, 'editable');
      });

      test('editable is saved if false', function () {
        const comment = new Blockly.comments.WorkspaceComment(this.workspace);
        comment.setEditable(false);

        const json = Blockly.serialization.workspaceComments.save(comment);

        assertProperty(json, 'editable', false);
      });
    });

    suite('Movable', function () {
      test('movable is not saved if true', function () {
        const comment = new Blockly.comments.WorkspaceComment(this.workspace);
        comment.setMovable(true);

        const json = Blockly.serialization.workspaceComments.save(comment);

        assertNoProperty(json, 'movable');
      });

      test('movable is saved if false', function () {
        const comment = new Blockly.comments.WorkspaceComment(this.workspace);
        comment.setMovable(false);

        const json = Blockly.serialization.workspaceComments.save(comment);

        assertProperty(json, 'movable', false);
      });
    });

    suite('Deletable', function () {
      test('deletable is not saved if true', function () {
        const comment = new Blockly.comments.WorkspaceComment(this.workspace);
        comment.setDeletable(true);

        const json = Blockly.serialization.workspaceComments.save(comment);

        assertNoProperty(json, 'deletable');
      });

      test('deletable is saved if false', function () {
        const comment = new Blockly.comments.WorkspaceComment(this.workspace);
        comment.setDeletable(false);

        const json = Blockly.serialization.workspaceComments.save(comment);

        assertProperty(json, 'deletable', false);
      });
    });
  });
});
