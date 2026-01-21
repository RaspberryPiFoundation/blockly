/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Extensions', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.Workspace();
    this.extensionsCleanup_ = [];
  });
  teardown(function () {
    sharedTestTeardown.call(this);
    for (let i = 0; i < this.extensionsCleanup_.length; i++) {
      const extension = this.extensionsCleanup_[i];
      delete Blockly.Extensions.TEST_ONLY.allExtensions[extension];
    }
  });

  test('Definition before and after block type', function () {
    this.extensionsCleanup_.push('extensions_test_before');
    this.extensionsCleanup_.push('extensions_test_after');

    assert.isUndefined(
      Blockly.Extensions.TEST_ONLY.allExtensions['extensions_test_before'],
    );
    const beforeCallback = sinon.spy();
    // Extension defined before the block type is defined.
    Blockly.Extensions.register('extensions_test_before', beforeCallback);

    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'extension_test_block',
        'message0': 'extension_test_block',
        'extensions': ['extensions_test_before', 'extensions_test_after'],
      },
    ]);

    assert.isUndefined(
      Blockly.Extensions.TEST_ONLY.allExtensions['extensions_test_after'],
    );
    const afterCallback = sinon.spy();
    // Extension defined after the block type (but before instantiation).
    Blockly.Extensions.register('extensions_test_after', afterCallback);

    assert.typeOf(
      Blockly.Extensions.TEST_ONLY.allExtensions['extensions_test_before'],
      'function',
    );
    assert.typeOf(
      Blockly.Extensions.TEST_ONLY.allExtensions['extensions_test_after'],
      'function',
    );
    sinon.assert.notCalled(beforeCallback);
    sinon.assert.notCalled(afterCallback);

    const block = new Blockly.Block(this.workspace, 'extension_test_block');

    sinon.assert.calledOnce(beforeCallback);
    sinon.assert.calledOnce(afterCallback);
    sinon.assert.calledOn(beforeCallback, block);
    sinon.assert.calledOn(afterCallback, block);
  });

  test('Parent tooltip when inline', function () {
    const defaultTooltip = 'defaultTooltip';
    const parentTooltip = 'parentTooltip';
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'test_parent_tooltip_when_inline',
        'message0': 'test_parent_tooltip_when_inline',
        'output': true,
        'tooltip': defaultTooltip,
        'extensions': ['parent_tooltip_when_inline'],
      },
      {
        'type': 'test_parent',
        'message0': '%1',
        'args0': [
          {
            'type': 'input_value',
            'name': 'INPUT',
          },
        ],
        'tooltip': parentTooltip,
      },
    ]);

    const block = new Blockly.Block(
      this.workspace,
      'test_parent_tooltip_when_inline',
    );

    // Tooltip is dynamic after extension initialization.
    assert.typeOf(block.tooltip, 'function');
    assert.equal(block.tooltip(), defaultTooltip);

    // Tooltip is normal before connected to parent.
    const parent = new Blockly.Block(this.workspace, 'test_parent');
    assert.equal(parent.tooltip, parentTooltip);
    assert.notExists(parent.inputsInline);

    // Tooltip is normal when parent is not inline.
    parent.getInput('INPUT').connection.connect(block.outputConnection);
    assert.equal(block.getParent(), parent);
    assert.equal(block.tooltip(), defaultTooltip);

    // Tooltip is parent's when parent is inline.
    parent.setInputsInline(true);
    assert.equal(block.tooltip(), parentTooltip);

    // Tooltip revert when disconnected.
    parent.getInput('INPUT').connection.disconnect();
    assert.notExists(block.getParent());
    assert.equal(block.tooltip(), defaultTooltip);
  });

  suite('Mixin', function () {
    test('Basic', function () {
      this.extensionsCleanup_.push('mixin_test');

      const testMixin = {
        field: 'FIELD',
        method: function () {
          console.log('TEXT_MIXIN method()');
        },
      };

      assert.isUndefined(
        Blockly.Extensions.TEST_ONLY.allExtensions['mixin_test'],
      );
      // Extension defined before the block type is defined.
      Blockly.Extensions.registerMixin('mixin_test', testMixin);

      assert.typeOf(
        Blockly.Extensions.TEST_ONLY.allExtensions['mixin_test'],
        'function',
      );

      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'test_block_mixin',
          'message0': 'test_block_mixin',
          'extensions': ['mixin_test'],
        },
      ]);

      const block = new Blockly.Block(this.workspace, 'test_block_mixin');

      assert.equal(testMixin.field, block.field);
      assert.equal(testMixin.method, block.method);
    });

    suite('Mutator', function () {
      test('Basic', function () {
        this.extensionsCleanup_.push('mutator_test');

        Blockly.defineBlocksWithJsonArray([
          {
            'type': 'mutator_test_block',
            'message0': 'mutator_test_block',
            'mutator': 'mutator_test',
          },
        ]);

        // Events code calls mutationToDom and expects it to give back a meaningful
        // value.
        Blockly.Events.disable();
        Blockly.Extensions.registerMutator('mutator_test', {
          domToMutation: function () {
            return 'domToMutationFn';
          },
          mutationToDom: function () {
            return 'mutationToDomFn';
          },
          compose: function () {
            return 'composeFn';
          },
          decompose: function () {
            return 'decomposeFn';
          },
        });

        const block = new Blockly.Block(this.workspace, 'mutator_test_block');

        // Make sure all of the functions were installed correctly.
        assert.equal(block.domToMutation(), 'domToMutationFn');
        assert.equal(block.mutationToDom(), 'mutationToDomFn');
        assert.equal(block.compose(), 'composeFn');
        assert.equal(block.decompose(), 'decomposeFn');
      });

      test('With helper function', function () {
        this.extensionsCleanup_.push('extensions_test');

        Blockly.defineBlocksWithJsonArray([
          {
            'type': 'mutator_test_block',
            'message0': 'mutator_test_block',
            'mutator': ['extensions_test'],
          },
        ]);

        // Events code calls mutationToDom and expects it to give back a
        // meaningful value.
        Blockly.Events.disable();
        assert.isUndefined(
          Blockly.Extensions.TEST_ONLY.allExtensions['extensions_test'],
        );
        const helperFunctionSpy = sinon.spy();
        Blockly.Extensions.registerMutator(
          'extensions_test',
          {
            domToMutation: function () {
              return 'domToMutationFn';
            },
            mutationToDom: function () {
              return 'mutationToDomFn';
            },
          },
          helperFunctionSpy,
        );

        const _ = new Blockly.Block(this.workspace, 'mutator_test_block');

        sinon.assert.calledOnce(helperFunctionSpy);
      });

      test('No dialog', function () {
        this.extensionsCleanup_.push('mutator_test');

        Blockly.defineBlocksWithJsonArray([
          {
            'type': 'mutator_test_block',
            'message0': 'mutator_test_block',
            'mutator': 'mutator_test',
          },
        ]);

        // Events code calls mutationToDom and expects it to give back a
        // meaningful value.
        Blockly.Events.disable();
        assert.isUndefined(
          Blockly.Extensions.TEST_ONLY.allExtensions['mutator_test'],
        );
        Blockly.Extensions.registerMutator('mutator_test', {
          domToMutation: function () {
            return 'domToMutationFn';
          },
          mutationToDom: function () {
            return 'mutationToDomFn';
          },
        });

        const block = new Blockly.Block(this.workspace, 'mutator_test_block');

        // Make sure all of the functions were installed correctly.
        assert.equal(block.domToMutation(), 'domToMutationFn');
        assert.equal(block.mutationToDom(), 'mutationToDomFn');
        assert.isUndefined(block['compose']);
        assert.isUndefined(block['decompose']);
      });
    });
  });

  suite('Error cases', function () {
    test('Missing extension', function () {
      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'missing_extension_block',
          'message0': 'missing_extension_block',
          'extensions': ['missing_extension'],
        },
      ]);

      assert.isUndefined(
        Blockly.Extensions.TEST_ONLY.allExtensions['missing_extension'],
      );
      const workspace = this.workspace;
      assert.throws(function () {
        const _ = new Blockly.Block(workspace, 'missing_extension_block');
      });
    });

    test('Mixin overwrites local value', function () {
      this.extensionsCleanup_.push('mixin_bad_inputList');

      const TEST_MIXIN_BAD_INPUTLIST = {
        inputList: 'bad inputList', // Defined in constructor
      };

      assert.isUndefined(
        Blockly.Extensions.TEST_ONLY.allExtensions['mixin_bad_inputList'],
      );
      // Extension defined before the block type is defined.
      Blockly.Extensions.registerMixin(
        'mixin_bad_inputList',
        TEST_MIXIN_BAD_INPUTLIST,
      );
      assert.typeOf(
        Blockly.Extensions.TEST_ONLY.allExtensions['mixin_bad_inputList'],
        'function',
      );

      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'test_block_bad_inputList',
          'message0': 'test_block_bad_inputList',
          'extensions': ['mixin_bad_inputList'],
        },
      ]);

      const workspace = this.workspace;
      assert.throws(function () {
        const _ = new Blockly.Block(workspace, 'test_block_bad_inputList');
      }, /inputList/);
    });

    test('Mixin overwrites prototype', function () {
      this.extensionsCleanup_.push('mixin_bad_colour_');

      const TEST_MIXIN_BAD_COLOUR = {
        colour_: 'bad colour_', // Defined on prototype
      };

      assert.isUndefined(
        Blockly.Extensions.TEST_ONLY.allExtensions['mixin_bad_colour_'],
      );
      // Extension defined before the block type is defined.
      Blockly.Extensions.registerMixin(
        'mixin_bad_colour_',
        TEST_MIXIN_BAD_COLOUR,
      );
      assert.typeOf(
        Blockly.Extensions.TEST_ONLY.allExtensions['mixin_bad_colour_'],
        'function',
      );

      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'test_block_bad_colour',
          'message0': 'test_block_bad_colour',
          'extensions': ['mixin_bad_colour_'],
        },
      ]);

      const workspace = this.workspace;
      assert.throws(function () {
        const _ = new Blockly.Block(workspace, 'test_block_bad_colour');
      }, /colour_/);
    });

    test('Use mutator as extension', function () {
      this.extensionsCleanup_.push('mutator_test');

      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'mutator_test_block',
          'message0': 'mutator_test_block',
          'extensions': ['mutator_test'],
        },
      ]);

      // Events code calls mutationToDom and expects it to give back a
      // meaningful value.
      Blockly.Events.disable();
      assert.isUndefined(
        Blockly.Extensions.TEST_ONLY.allExtensions['mutator_test'],
      );
      Blockly.Extensions.registerMutator('mutator_test', {
        domToMutation: function () {
          return 'domToMutationFn';
        },
        mutationToDom: function () {
          return 'mutationToDomFn';
        },
      });

      const workspace = this.workspace;
      assert.throws(function () {
        const _ = new Blockly.Block(workspace, 'mutator_test_block');
      });
      // Should have failed on apply, not on register.
      assert.isNotNull(
        Blockly.Extensions.TEST_ONLY.allExtensions['mutator_test'],
      );
    });

    test('Use mutator mixin as extension', function () {
      this.extensionsCleanup_.push('mutator_test');

      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'mutator_test_block',
          'message0': 'mutator_test_block',
          'extensions': ['mutator_test'],
        },
      ]);

      // Events code calls mutationToDom and expects it to give back a
      // meaningful value.
      Blockly.Events.disable();
      assert.isUndefined(
        Blockly.Extensions.TEST_ONLY.allExtensions['mutator_test'],
      );
      Blockly.Extensions.registerMixin('mutator_test', {
        domToMutation: function () {
          return 'domToMutationFn';
        },
        mutationToDom: function () {
          return 'mutationToDomFn';
        },
      });

      const workspace = this.workspace;
      assert.throws(function () {
        const _ = new Blockly.Block(workspace, 'mutator_test_block');
      });
      // Should have failed on apply, not on register.
      assert.isNotNull(
        Blockly.Extensions.TEST_ONLY.allExtensions['mutator_test'],
      );
    });

    test('Use extension as mutator', function () {
      this.extensionsCleanup_.push('extensions_test');

      Blockly.defineBlocksWithJsonArray([
        {
          'type': 'mutator_test_block',
          'message0': 'mutator_test_block',
          'mutator': ['extensions_test'],
        },
      ]);

      // Events code calls mutationToDom and expects it to give back a
      // meaningful value.
      Blockly.Events.disable();
      assert.isUndefined(
        Blockly.Extensions.TEST_ONLY.allExtensions['extensions_test'],
      );
      Blockly.Extensions.register('extensions_test', function () {
        return 'extensions_test_fn';
      });

      const workspace = this.workspace;
      assert.throws(function () {
        const _ = new Blockly.Block(workspace, 'mutator_test_block');
      });
      // Should have failed on apply, not on register.
      assert.isNotNull(
        Blockly.Extensions.TEST_ONLY.allExtensions['extensions_test'],
      );
    });

    suite('register', function () {
      test('Just a string', function () {
        this.extensionsCleanup_.push('extension_just_a_string');
        assert.isUndefined(
          Blockly.Extensions.TEST_ONLY.allExtensions['extension_just_a_string'],
        );
        assert.throws(function () {
          Blockly.Extensions.register('extension_just_a_string', null);
        });
      });

      test('Null', function () {
        this.extensionsCleanup_.push('extension_is_null');
        assert.isUndefined(
          Blockly.Extensions.TEST_ONLY.allExtensions['extension_is_null'],
        );
        assert.throws(function () {
          Blockly.Extensions.register('extension_is_null', null);
        });
      });

      test('Undefined', function () {
        this.extensionsCleanup_.push('extension_is_undefined');
        assert.isUndefined(
          Blockly.Extensions.TEST_ONLY.allExtensions['extension_is_undefined'],
        );
        assert.throws(function () {
          Blockly.Extensions.register('extension_is_undefined', null);
        });
      });
    });

    suite('registerMutator', function () {
      test('No domToMutation', function () {
        this.extensionsCleanup_.push('mutator_test');
        assert.throws(function () {
          Blockly.Extensions.registerMutator('mutator_test', {
            mutationToDom: function () {
              return 'mutationToDomFn';
            },
            compose: function () {
              return 'composeFn';
            },
            decompose: function () {
              return 'decomposeFn';
            },
          });
        }, /domToMutation/);
      });

      test('No mutationToDom', function () {
        this.extensionsCleanup_.push('mutator_test');
        assert.throws(function () {
          Blockly.Extensions.registerMutator('mutator_test', {
            domToMutation: function () {
              return 'domToMutationFn';
            },
            compose: function () {
              return 'composeFn';
            },
            decompose: function () {
              return 'decomposeFn';
            },
          });
        }, /mutationToDom/);
      });

      test('No saveExtraState', function () {
        this.extensionsCleanup_.push('mutator_test');
        assert.throws(function () {
          Blockly.Extensions.registerMutator('mutator_test', {
            loadExtraState: function () {
              return 'loadExtraState';
            },
            compose: function () {
              return 'composeFn';
            },
            decompose: function () {
              return 'decomposeFn';
            },
          });
        }, /saveExtraState/);
      });

      test('No loadExtraState', function () {
        this.extensionsCleanup_.push('mutator_test');
        assert.throws(function () {
          Blockly.Extensions.registerMutator('mutator_test', {
            saveExtraState: function () {
              return 'saveExtraState';
            },
            compose: function () {
              return 'composeFn';
            },
            decompose: function () {
              return 'decomposeFn';
            },
          });
        }, /loadExtraState/);
      });

      test('No serialization hooks', function () {
        this.extensionsCleanup_.push('mutator_test');
        assert.throws(function () {
          Blockly.Extensions.registerMutator('mutator_test', {
            compose: function () {
              return 'composeFn';
            },
            decompose: function () {
              return 'decomposeFn';
            },
          });
        }, 'Mutations must contain either XML hooks, or JSON hooks, or both');
      });

      test('Has decompose but no compose', function () {
        this.extensionsCleanup_.push('mutator_test');
        assert.throws(function () {
          Blockly.Extensions.registerMutator('mutator_test', {
            domToMutation: function () {
              return 'domToMutationFn';
            },
            mutationToDom: function () {
              return 'mutationToDomFn';
            },
            decompose: function () {
              return 'decomposeFn';
            },
          });
        }, /compose/);
      });

      test('Has compose but no decompose', function () {
        this.extensionsCleanup_.push('mutator_test');
        assert.throws(function () {
          Blockly.Extensions.registerMutator('mutator_test', {
            domToMutation: function () {
              return 'domToMutationFn';
            },
            mutationToDom: function () {
              return 'mutationToDomFn';
            },
            compose: function () {
              return 'composeFn';
            },
          });
        }, /decompose/);
      });
    });
  });
});
