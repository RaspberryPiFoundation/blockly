/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {EventType} from '../../build/src/core/events/type.js';
import {assert} from '../../node_modules/chai/index.js';
import {assertEventFired} from './test_helpers/events.js';
import {
  MockParameterModel,
  MockProcedureModel,
} from './test_helpers/procedures.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('JSO Deserialization', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.sandbox = sinon.createSandbox();
    this.workspace = new Blockly.Workspace();
  });

  teardown(function () {
    this.sandbox.restore();
    sharedTestTeardown.call(this);
  });

  suite('Events', function () {
    test('bad JSON does not leave events disabled', function () {
      const state = {
        'blocks': {
          'blocks': [
            {
              'type': 'undefined_block',
            },
          ],
        },
      };
      assert.throws(() => {
        Blockly.serialization.workspaces.load(state, this.workspace);
      });
      assert.isTrue(
        Blockly.Events.isEnabled(),
        'Expected events to be enabled',
      );
    });

    suite('Finished loading', function () {
      test('Just var', function () {
        const state = {
          'blocks': {
            'blocks': [
              {
                'type': 'controls_if',
                'id': 'testId',
                'x': 42,
                'y': 42,
              },
            ],
          },
        };
        Blockly.serialization.workspaces.load(state, this.workspace);
        assertEventFired(
          this.eventsFireStub,
          Blockly.Events.FinishedLoading,
          {type: EventType.FINISHED_LOADING},
          this.workspace.id,
        );
      });

      test('Explicit group', function () {
        const state = {
          'blocks': {
            'blocks': [
              {
                'type': 'controls_if',
                'id': 'testId',
                'x': 42,
                'y': 42,
              },
            ],
          },
        };
        Blockly.Events.setGroup('my group');
        Blockly.serialization.workspaces.load(state, this.workspace);
        assertEventFired(
          this.eventsFireStub,
          Blockly.Events.FinishedLoading,
          {'group': 'my group', 'type': EventType.FINISHED_LOADING},
          this.workspace.id,
        );
      });

      test('Automatic group', function () {
        const state = {
          'variables': [
            {
              'name': 'test',
              'id': 'testId',
            },
          ],
          'blocks': {
            'blocks': [
              {
                'type': 'variables_get',
                'id': 'blockId',
                'x': 42,
                'y': 42,
                'fields': {
                  'VAR': {
                    'id': 'testId',
                  },
                },
              },
            ],
          },
        };
        Blockly.serialization.workspaces.load(state, this.workspace);
        const calls = this.eventsFireStub.getCalls();
        const group = calls[0].args[0].group;
        assert.isTrue(calls.every((call) => call.args[0].group == group));
      });
    });

    suite('Var create', function () {
      test('Just var', function () {
        const state = {
          'variables': [
            {
              'name': 'test',
              'id': 'testId',
            },
          ],
        };
        Blockly.serialization.workspaces.load(state, this.workspace);
        assertEventFired(
          this.eventsFireStub,
          Blockly.Events.VarCreate,
          {
            'varName': 'test',
            'varId': 'testId',
            'varType': '',
            'recordUndo': false,
            'type': EventType.VAR_CREATE,
          },
          this.workspace.id,
        );
      });

      test('Record undo', function () {
        const state = {
          'variables': [
            {
              'name': 'test',
              'id': 'testId',
            },
          ],
        };
        Blockly.serialization.workspaces.load(state, this.workspace, {
          recordUndo: true,
        });
        assertEventFired(
          this.eventsFireStub,
          Blockly.Events.VarCreate,
          {
            'varName': 'test',
            'varId': 'testId',
            'varType': '',
            'recordUndo': true,
            'type': EventType.VAR_CREATE,
          },
          this.workspace.id,
        );
      });

      test('Grouping', function () {
        const state = {
          'variables': [
            {
              'name': 'test',
              'id': 'testId',
            },
          ],
        };
        Blockly.Events.setGroup('my group');
        Blockly.serialization.workspaces.load(state, this.workspace);
        assertEventFired(
          this.eventsFireStub,
          Blockly.Events.VarCreate,
          {
            'varName': 'test',
            'varId': 'testId',
            'varType': '',
            'group': 'my group',
            'type': EventType.VAR_CREATE,
          },
          this.workspace.id,
        );
      });

      test('Multiple vars grouped', function () {
        const state = {
          'variables': [
            {
              'name': 'test',
              'id': 'testId',
            },
            {
              'name': 'test2',
              'id': 'testId2',
            },
          ],
        };
        Blockly.serialization.workspaces.load(state, this.workspace);
        const calls = this.eventsFireStub.getCalls();
        const group = calls[0].args[0].group;
        assert.isTrue(calls.every((call) => call.args[0].group == group));
      });

      test('Var with block', function () {
        const state = {
          'variables': [
            {
              'name': 'test',
              'id': 'testId',
            },
          ],
          'blocks': {
            'blocks': [
              {
                'type': 'variables_get',
                'id': 'blockId',
                'x': 42,
                'y': 42,
                'fields': {
                  'VAR': {
                    'id': 'testId',
                  },
                },
              },
            ],
          },
        };
        Blockly.serialization.workspaces.load(state, this.workspace);
        const calls = this.eventsFireStub.getCalls();
        const count = calls.reduce((acc, call) => {
          if (call.args[0] instanceof Blockly.Events.VarCreate) {
            return acc + 1;
          }
          return acc;
        }, 0);
        assert.equal(count, 1);
        assertEventFired(
          this.eventsFireStub,
          Blockly.Events.VarCreate,
          {
            'varName': 'test',
            'varId': 'testId',
            'varType': '',
            'type': EventType.VAR_CREATE,
          },
          this.workspace.id,
        );
      });
    });

    suite('Block create', function () {
      suite('Top-level call', function () {
        test('No children', function () {
          const state = {
            'blocks': {
              'blocks': [
                {
                  'type': 'controls_if',
                  'id': 'testId',
                  'x': 42,
                  'y': 42,
                },
              ],
            },
          };
          Blockly.serialization.workspaces.load(state, this.workspace);
          assertEventFired(
            this.eventsFireStub,
            Blockly.Events.BlockCreate,
            {'recordUndo': false, 'type': EventType.BLOCK_CREATE},
            this.workspace.id,
            'testId',
          );
        });

        test('Record undo', function () {
          const state = {
            'blocks': {
              'blocks': [
                {
                  'type': 'controls_if',
                  'id': 'testId',
                  'x': 42,
                  'y': 42,
                },
              ],
            },
          };
          Blockly.serialization.workspaces.load(state, this.workspace, {
            'recordUndo': true,
          });
          assertEventFired(
            this.eventsFireStub,
            Blockly.Events.BlockCreate,
            {'recordUndo': true, 'type': EventType.BLOCK_CREATE},
            this.workspace.id,
            'testId',
          );
        });

        test('Grouping', function () {
          const state = {
            'blocks': {
              'blocks': [
                {
                  'type': 'controls_if',
                  'id': 'testId',
                  'x': 42,
                  'y': 42,
                },
              ],
            },
          };
          Blockly.Events.setGroup('my group');
          Blockly.serialization.workspaces.load(state, this.workspace);
          assertEventFired(
            this.eventsFireStub,
            Blockly.Events.BlockCreate,
            {'group': 'my group', 'type': EventType.BLOCK_CREATE},
            this.workspace.id,
            'testId',
          );
        });

        test('Multiple blocks grouped', function () {
          const state = {
            'blocks': {
              'blocks': [
                {
                  'type': 'controls_if',
                  'id': 'testId',
                  'x': 42,
                  'y': 42,
                },
                {
                  'type': 'controls_if',
                  'id': 'testId',
                  'x': 84,
                  'y': 84,
                },
              ],
            },
          };
          Blockly.serialization.workspaces.load(state, this.workspace);
          const calls = this.eventsFireStub.getCalls();
          const group = calls[0].args[0].group;
          assert.isTrue(calls.every((call) => call.args[0].group == group));
        });

        test('With children', function () {
          const state = {
            'blocks': {
              'blocks': [
                {
                  'type': 'controls_if',
                  'id': 'id1',
                  'x': 42,
                  'y': 42,
                  'inputs': {
                    'DO0': {
                      'block': {
                        'type': 'controls_if',
                        'id': 'id2',
                      },
                    },
                  },
                  'next': {
                    'block': {
                      'type': 'controls_if',
                      'id': 'id3',
                    },
                  },
                },
              ],
            },
          };
          Blockly.serialization.workspaces.load(state, this.workspace);
          assertEventFired(
            this.eventsFireStub,
            Blockly.Events.BlockCreate,
            {type: EventType.BLOCK_CREATE},
            this.workspace.id,
            'id1',
          );
        });
      });

      suite('Direct call', function () {
        test('No children', function () {
          const state = {
            'type': 'controls_if',
            'id': 'testId',
            'x': 42,
            'y': 42,
          };
          Blockly.serialization.blocks.append(state, this.workspace);
          assertEventFired(
            this.eventsFireStub,
            Blockly.Events.BlockCreate,
            {'recordUndo': false},
            this.workspace.id,
            'testId',
          );
        });

        test('Record undo', function () {
          const state = {
            'type': 'controls_if',
            'id': 'testId',
            'x': 42,
            'y': 42,
          };
          Blockly.serialization.blocks.append(state, this.workspace, {
            'recordUndo': true,
          });
          assertEventFired(
            this.eventsFireStub,
            Blockly.Events.BlockCreate,
            {'recordUndo': true, 'type': EventType.BLOCK_CREATE},
            this.workspace.id,
            'testId',
          );
        });

        test('Grouping', function () {
          const state = {
            'type': 'controls_if',
            'id': 'testId',
            'x': 42,
            'y': 42,
          };
          Blockly.Events.setGroup('my group');
          Blockly.serialization.blocks.append(state, this.workspace);
          assertEventFired(
            this.eventsFireStub,
            Blockly.Events.BlockCreate,
            {'group': 'my group', 'type': EventType.BLOCK_CREATE},
            this.workspace.id,
            'testId',
          );
        });
      });
    });
  });

  suite('Exceptions', function () {
    setup(function () {
      this.assertThrows = function (state, error) {
        assert.throws(() => {
          Blockly.serialization.workspaces.load(state, this.workspace);
        }, error);
      };
    });

    suite('Undefined block type', function () {
      test('Name', function () {
        const state = {
          'blocks': {
            'blocks': [
              {
                'type': 'not_a_real_block',
              },
            ],
          },
        };
        this.assertThrows(state, TypeError);
      });

      test('Casing', function () {
        const state = {
          'blocks': {
            'blocks': [
              {
                'type': 'MATH_NUMBER',
              },
            ],
          },
        };
        this.assertThrows(state, TypeError);
      });
    });

    suite('Missing connection', function () {
      test('Input name', function () {
        const state = {
          'blocks': {
            'blocks': [
              {
                'type': 'logic_compare',
                'inputs': {
                  'not_an_input': {
                    'block': {
                      'type': 'logic_boolean',
                    },
                  },
                },
              },
            ],
          },
        };
        this.assertThrows(
          state,
          Blockly.serialization.exceptions.MissingConnection,
        );
      });

      test('Input casing', function () {
        const state = {
          'blocks': {
            'blocks': [
              {
                'type': 'logic_compare',
                'inputs': {
                  'a': {
                    'block': {
                      'type': 'logic_boolean',
                    },
                  },
                },
              },
            ],
          },
        };
        this.assertThrows(
          state,
          Blockly.serialization.exceptions.MissingConnection,
        );
      });

      test('Next', function () {
        const state = {
          'blocks': {
            'blocks': [
              {
                'type': 'logic_compare',
                'next': {
                  'block': {
                    'type': 'text_print',
                  },
                },
              },
            ],
          },
        };
        this.assertThrows(
          state,
          Blockly.serialization.exceptions.MissingConnection,
        );
      });

      test('Previous', function () {
        const state = {
          'blocks': {
            'blocks': [
              {
                'type': 'text_print',
                'next': {
                  'block': {
                    'type': 'logic_compare',
                  },
                },
              },
            ],
          },
        };
        this.assertThrows(
          state,
          Blockly.serialization.exceptions.MissingConnection,
        );
      });

      test('Output', function () {
        const state = {
          'blocks': {
            'blocks': [
              {
                'type': 'logic_compare',
                'inputs': {
                  'A': {
                    'block': {
                      'type': 'text_print',
                    },
                  },
                },
              },
            ],
          },
        };
        this.assertThrows(
          state,
          Blockly.serialization.exceptions.MissingConnection,
        );
      });
    });

    suite('Bad connection check', function () {
      test('Bad checks', function () {
        const state = {
          'blocks': {
            'blocks': [
              {
                'type': 'logic_operation',
                'inputs': {
                  'A': {
                    'block': {
                      'type': 'math_number',
                    },
                  },
                },
              },
            ],
          },
        };
        this.assertThrows(
          state,
          Blockly.serialization.exceptions.BadConnectionCheck,
        );
      });
    });

    suite('Real child of shadow', function () {
      test('Input', function () {
        const state = {
          'blocks': {
            'blocks': [
              {
                'type': 'logic_compare',
                'inputs': {
                  'A': {
                    'shadow': {
                      'type': 'logic_compare',
                      'inputs': {
                        'A': {
                          'block': {
                            'type': 'logic_boolean',
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        };
        this.assertThrows(
          state,
          Blockly.serialization.exceptions.RealChildOfShadow,
        );
      });

      test('Next', function () {
        const state = {
          'blocks': {
            'blocks': [
              {
                'type': 'text_print',
                'next': {
                  'shadow': {
                    'type': 'text_print',
                    'next': {
                      'block': {
                        'type': 'text_print',
                      },
                    },
                  },
                },
              },
            ],
          },
        };
        this.assertThrows(
          state,
          Blockly.serialization.exceptions.RealChildOfShadow,
        );
      });
    });
  });

  test('Priority', function () {
    const blocksSerializer = Blockly.registry.getClass(
      Blockly.registry.Type.SERIALIZER,
      'blocks',
    );
    const variablesSerializer = Blockly.registry.getClass(
      Blockly.registry.Type.SERIALIZER,
      'variables',
    );

    Blockly.serialization.registry.unregister('blocks');
    Blockly.serialization.registry.unregister('variables');

    const calls = [];

    const first = {
      priority: 100,
      save: () => null,
      load: () => calls.push('first-load'),
      clear: () => calls.push('first-clear'),
    };
    const second = {
      priority: 0,
      save: () => null,
      load: () => calls.push('second-load'),
      clear: () => calls.push('second-clear'),
    };
    const third = {
      priority: -10,
      save: () => null,
      load: () => calls.push('third-load'),
      clear: () => calls.push('third-clear'),
    };

    Blockly.serialization.registry.register('third', third);
    Blockly.serialization.registry.register('first', first);
    Blockly.serialization.registry.register('second', second);

    Blockly.serialization.workspaces.load(
      {'first': {}, 'third': {}, 'second': {}},
      this.workspace,
    );

    Blockly.serialization.registry.unregister('first');
    Blockly.serialization.registry.unregister('second');
    Blockly.serialization.registry.unregister('third');

    Blockly.serialization.registry.register('blocks', blocksSerializer);
    Blockly.serialization.registry.register('variables', variablesSerializer);

    assert.deepEqual(calls, [
      'third-clear',
      'second-clear',
      'first-clear',
      'first-load',
      'second-load',
      'third-load',
    ]);
  });

  suite('Extra state', function () {
    // Most of this is covered by our round-trip tests. But we need one test
    // for old xml hooks.
    test('Xml hooks', function () {
      Blockly.Blocks['test_block'] = {
        init: function () {},

        mutationToDom: function () {
          const container = Blockly.utils.xml.createElement('mutation');
          container.setAttribute('value', 'some value');
          return container;
        },

        domToMutation: function (element) {
          this.someProperty = element.getAttribute('value');
        },
      };

      const block = Blockly.serialization.blocks.append(
        {
          'type': 'test_block',
          'extraState': '<mutation value="some value"></mutation>',
        },
        this.workspace,
      );

      delete Blockly.Blocks['test_block'];

      assert.equal(block.someProperty, 'some value');
    });
  });

  suite('Procedures', function () {
    setup(function () {
      this.procedureSerializer =
        new Blockly.serialization.procedures.ProcedureSerializer(
          MockProcedureModel,
          MockParameterModel,
        );
      this.procedureMap = this.workspace.getProcedureMap();
    });

    teardown(function () {
      this.procedureSerializer = null;
      this.procedureMap = null;
    });

    test('load is called for the procedure model', function () {
      const state = [
        {
          'id': 'test',
          'parameters': [],
        },
      ];
      const spy = this.sandbox.spy(MockProcedureModel, 'loadState');

      this.procedureSerializer.load(state, this.workspace);

      assert.isTrue(
        spy.calledOnce,
        'Expected the loadState method to be called',
      );
    });

    test('load is called for each parameter model', function () {
      const state = [
        {
          'id': 'test',
          'parameters': [
            {
              'id': 'test1',
            },
            {
              'id': 'test2',
            },
          ],
        },
      ];

      const spy = this.sandbox.spy(MockParameterModel, 'loadState');

      this.procedureSerializer.load(state, this.workspace);

      assert.isTrue(
        spy.calledTwice,
        'Expected the loadState method to be called once for each parameter',
      );
    });
  });
});
