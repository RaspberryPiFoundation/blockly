/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import sinon from 'sinon';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';
import {createKeyDownEvent} from './test_helpers/user_input.js';

suite('Keyboard Shortcut Registry Test', function () {
  let registry: Blockly.ShortcutRegistry;
  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    registry = Blockly.ShortcutRegistry.registry;
    registry.reset();
    Blockly.ShortcutItems.registerDefaultShortcuts();
  });
  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this);
    registry.reset();
    Blockly.ShortcutItems.registerDefaultShortcuts();
    Blockly.ShortcutItems.registerKeyboardNavigationShortcuts();
    Blockly.ShortcutItems.registerScreenReaderShortcuts();
  });

  suite('Registering', function () {
    test('Registering a shortcut', function () {
      const testShortcut = {'name': 'test_shortcut'};
      registry.register(testShortcut, true);
      const shortcut = registry.getRegistry()['test_shortcut'];
      assert.equal(shortcut.name, 'test_shortcut');
    });
    test('Registers shortcut with same name', function () {
      const testShortcut = {'name': 'test_shortcut'};

      registry.register(testShortcut);

      const shouldThrow = function () {
        registry.register(testShortcut);
      };
      assert.throws(
        shouldThrow,
        Error,
        'Shortcut named "test_shortcut" already exists.',
      );
    });
    test('Registers shortcut with same name opt_allowOverrides=true', function () {
      const testShortcut = {'name': 'test_shortcut'};
      const otherShortcut = {
        'name': 'test_shortcut',
        'callback': function () {
          return true;
        },
      };

      registry.register(testShortcut);

      const shouldNotThrow = function () {
        registry.register(otherShortcut, true);
      };
      assert.doesNotThrow(shouldNotThrow);
      assert.exists(registry.getRegistry()['test_shortcut'].callback);
    });
    test('Registering a shortcut with keycodes', function () {
      const shiftA = registry.createSerializedKey(65, [
        Blockly.utils.KeyCodes.SHIFT,
      ]);
      const testShortcut = {
        'name': 'test_shortcut',
        'keyCodes': ['65', 66, shiftA],
      };
      registry.register(testShortcut, true);
      assert.lengthOf(registry.getKeyMap()[shiftA], 1);
      assert.lengthOf(registry.getKeyMap()['65'], 1);
      assert.lengthOf(registry.getKeyMap()['66'], 1);
    });
    test('Registering a shortcut with allowCollision', function () {
      const testShortcut = {
        'name': 'test_shortcut',
        'keyCodes': ['65'],
      };
      const duplicateShortcut = {
        'name': 'duplicate_shortcut',
        'keyCodes': ['65'],
        'allowCollision': true,
      };
      registry.register(testShortcut);
      const shouldNotThrow = function () {
        registry.register(duplicateShortcut);
      };
      assert.doesNotThrow(shouldNotThrow);
    });
    test('Registering a shortcut multiple times under the same keycode is idempotent', function () {
      const testShortcut = {
        'name': 'test_shortcut',
        'keyCodes': ['65', '65', '65'],
        allowCollision: true,
      };

      registry.register(testShortcut, true);
      registry.register(testShortcut, true);
      registry.register(testShortcut, true);

      assert.lengthOf(registry.getKeyMap()['65'], 1);

      registry.unregister('test_shortcut');

      assert.isUndefined(registry.getKeyMap()['65']);
    });
  });

  suite('Unregistering', function () {
    test('Unregistering a shortcut', function () {
      const testShortcut = {'name': 'test_shortcut'};
      registry.register(testShortcut);
      assert.isOk(registry.getRegistry()['test_shortcut']);
      registry.unregister('test_shortcut');
      assert.isUndefined(registry.getRegistry()['test_shortcut']);
    });
    test('Unregistering a nonexistent shortcut', function () {
      const consoleStub = sinon.stub(console, 'warn');
      assert.isUndefined(registry.getRegistry()['test']);

      assert.isFalse(registry.unregister('test'));
      sinon.assert.calledOnceWithExactly(
        consoleStub,
        'Keyboard shortcut named "test" not found.',
      );
    });
    test('Unregistering a shortcut with key mappings', function () {
      const testShortcut = {'name': 'test_shortcut'};
      registry.register(testShortcut);
      registry.addKeyMapping('keyCode', 'test_shortcut');

      registry.unregister('test_shortcut');

      const shortcut = registry.getRegistry()['test_shortcut'];
      const keyMappings = registry.getKeyMap()['keyCode'];
      assert.isUndefined(shortcut);
      assert.isUndefined(keyMappings);
    });
    test('Unregistering a shortcut with colliding key mappings', function () {
      const testShortcut = {'name': 'test_shortcut'};
      const otherShortcut = {'name': 'other_shortcut'};
      registry.register(testShortcut);
      registry.register(otherShortcut);
      registry.addKeyMapping('keyCode', 'test_shortcut');
      registry.addKeyMapping('keyCode', 'other_shortcut', true);

      registry.unregister('test_shortcut');

      const shortcut = registry.getRegistry()['test_shortcut'];
      const keyMappings = registry.getKeyMap()['keyCode'];
      assert.lengthOf(keyMappings, 1);
      assert.isUndefined(shortcut);
    });
  });

  suite('addKeyMapping', function () {
    test('Adds a key mapping', function () {
      const testShortcut = {'name': 'test_shortcut'};
      registry.register(testShortcut);

      registry.addKeyMapping('keyCode', 'test_shortcut');

      const shortcutNames = registry.getKeyMap()['keyCode'];
      assert.lengthOf(shortcutNames, 1);
      assert.equal(shortcutNames[0], 'test_shortcut');
    });
    test('Adds a colliding key mapping - opt_allowCollision=true', function () {
      const testShortcut = {'name': 'test_shortcut'};
      const testShortcut2 = {'name': 'test_shortcut_2'};
      registry.register(testShortcut);
      registry.register(testShortcut2);
      registry.addKeyMapping('keyCode', 'test_shortcut_2');

      registry.addKeyMapping('keyCode', 'test_shortcut', true);

      const shortcutNames = registry.getKeyMap()['keyCode'];
      assert.lengthOf(shortcutNames, 2);
      assert.equal(shortcutNames[0], 'test_shortcut');
      assert.equal(shortcutNames[1], 'test_shortcut_2');
    });
    test('Adds a colliding key mapping - opt_allowCollision=false', function () {
      const testShortcut = {'name': 'test_shortcut'};
      const testShortcut2 = {'name': 'test_shortcut_2'};
      registry.register(testShortcut);
      registry.register(testShortcut2);
      registry.addKeyMapping('keyCode', 'test_shortcut_2');

      const shouldThrow = function () {
        registry.addKeyMapping('keyCode', 'test_shortcut');
      };
      assert.throws(
        shouldThrow,
        Error,
        'Shortcut named "test_shortcut" collides with shortcuts "test_shortcut_2"',
      );
    });
  });

  suite('removeKeyMapping', function () {
    test('Removes a key mapping', function () {
      const testShortcut = {'name': 'test_shortcut'};
      const testShortcut2 = {'name': 'test_shortcut_2'};
      registry.register(testShortcut);
      registry.register(testShortcut2);
      registry.addKeyMapping('keyCode', 'test_shortcut_2');
      registry.addKeyMapping('keyCode', 'test_shortcut', true);

      const isRemoved = registry.removeKeyMapping('keyCode', 'test_shortcut');

      const shortcutNames = registry.getKeyMap()['keyCode'];
      assert.lengthOf(shortcutNames, 1);
      assert.equal(shortcutNames[0], 'test_shortcut_2');
      assert.isTrue(isRemoved);
    });
    test('Removes last key mapping for a key', function () {
      const testShortcut = {'name': 'test_shortcut'};
      registry.register(testShortcut);
      registry.addKeyMapping('keyCode', 'test_shortcut');

      registry.removeKeyMapping('keyCode', 'test_shortcut');

      const shortcutNames = registry.getKeyMap()['keyCode'];
      assert.isUndefined(shortcutNames);
    });
    test('Removes a key map that does not exist opt_quiet=false', function () {
      const consoleStub = sinon.stub(console, 'warn');
      const testShortcut = {'name': 'test_shortcut_2'};
      registry.register(testShortcut);
      registry.addKeyMapping('keyCode', 'test_shortcut_2');

      const isRemoved = registry.removeKeyMapping('keyCode', 'test_shortcut');

      assert.isFalse(isRemoved);
      sinon.assert.calledOnceWithExactly(
        consoleStub,
        'No keyboard shortcut named "test_shortcut" registered with key code "keyCode"',
      );
    });
    test('Removes a key map that does not exist from empty key mapping opt_quiet=false', function () {
      const consoleStub = sinon.stub(console, 'warn');

      const isRemoved = registry.removeKeyMapping('keyCode', 'test_shortcut');

      assert.isFalse(isRemoved);
      sinon.assert.calledOnceWithExactly(
        consoleStub,
        'No keyboard shortcut named "test_shortcut" registered with key code "keyCode"',
      );
    });
  });

  suite('Setters/Getters', function () {
    test('Sets the key map', function () {
      registry.setKeyMap({'keyCode': ['test_shortcut']});
      assert.equal(Object.keys(registry.getKeyMap()).length, 1);
      assert.equal(registry.getKeyMap()['keyCode'][0], 'test_shortcut');
    });
    test('Gets a copy of the key map', function () {
      registry.setKeyMap({'keyCode': ['a']});
      const keyMapCopy = registry.getKeyMap();
      keyMapCopy['keyCode'] = ['b'];
      assert.equal(registry.getKeyMap()['keyCode'][0], 'a');
    });
    test('Gets a copy of the registry', function () {
      const shortcut = {'name': 'shortcutName', 'keyCodes': ['2', '4']};
      registry.register(shortcut);
      const registrycopy = registry.getRegistry();
      registrycopy['shortcutName']['name'] = 'shortcutName1';
      assert.equal(
        registry.getRegistry()['shortcutName']['name'],
        'shortcutName',
      );
      assert.deepEqual(
        registry.getRegistry()['shortcutName']['keyCodes'],
        shortcut['keyCodes'],
      );
    });
    test('Gets keyboard shortcuts from a key code', function () {
      registry.setKeyMap({'keyCode': ['shortcutName']});
      const shortcutNames = registry.getShortcutNamesByKeyCode('keyCode');
      assert.equal(shortcutNames?.[0], 'shortcutName');
    });
    test('Gets keycodes by shortcut name', function () {
      registry.setKeyMap({
        'keyCode': ['shortcutName'],
        'keyCode1': ['shortcutName'],
      });
      const shortcutNames = registry.getKeyCodesByShortcutName('shortcutName');
      assert.lengthOf(shortcutNames, 2);
      assert.equal(shortcutNames[0], 'keyCode');
      assert.equal(shortcutNames[1], 'keyCode1');
    });
  });

  suite('onKeyDown', function () {
    let testShortcut: Blockly.ShortcutRegistry.KeyboardShortcut;
    let callBackStub: sinon.SinonStub;
    let workspace: Blockly.WorkspaceSvg;

    function addShortcut(
      registry: Blockly.ShortcutRegistry,
      shortcut: Blockly.ShortcutRegistry.KeyboardShortcut,
      keyCode: Blockly.utils.KeyCodes,
      returns: boolean,
    ) {
      registry.register(shortcut, true);
      registry.addKeyMapping(keyCode, shortcut.name, true);
      return sinon.stub(shortcut, 'callback').returns(returns);
    }

    setup(function () {
      workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
      testShortcut = {
        'name': 'test_shortcut',
        'callback': function () {
          return true;
        },
        'preconditionFn': function () {
          return true;
        },
      };
      callBackStub = addShortcut(
        registry,
        testShortcut,
        Blockly.utils.KeyCodes.C,
        true,
      );
    });
    teardown(function (this: Mocha.Context) {
      workspaceTeardown.call(this, workspace);
    });
    test('Execute a shortcut from event', function () {
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.C);
      assert.isTrue(registry.onKeyDown(workspace, event));
      sinon.assert.calledOnce(callBackStub);
    });
    test('No shortcut executed from event', function () {
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.D);
      assert.isFalse(registry.onKeyDown(workspace, event));
    });
    test('No callback if precondition fails', function () {
      const shortcut = {
        'name': 'test_shortcut',
        'callback': function () {
          return true;
        },
        'preconditionFn': function () {
          return false;
        },
      };
      const callBackStub = addShortcut(
        registry,
        shortcut,
        Blockly.utils.KeyCodes.C,
        true,
      );
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.C);
      assert.isFalse(registry.onKeyDown(workspace, event));
      sinon.assert.notCalled(callBackStub);
    });

    test('No precondition available - execute callback', function () {
      delete testShortcut['preconditionFn'];
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.C);
      assert.isTrue(registry.onKeyDown(workspace, event));
      sinon.assert.calledOnce(callBackStub);
    });
    test('Execute all shortcuts in list', function () {
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.C);
      const testShortcut2 = {
        'name': 'test_shortcut_2',
        'callback': function () {
          return false;
        },
        'preconditionFn': function () {
          return true;
        },
      };
      const testShortcut2Stub = addShortcut(
        registry,
        testShortcut2,
        Blockly.utils.KeyCodes.C,
        false,
      );
      assert.isTrue(registry.onKeyDown(workspace, event));
      sinon.assert.calledOnce(testShortcut2Stub);
      sinon.assert.calledOnce(callBackStub);
    });
    test('Stop executing shortcut when event is handled', function () {
      const event = createKeyDownEvent(Blockly.utils.KeyCodes.C);
      const testShortcut2 = {
        'name': 'test_shortcut_2',
        'callback': function () {
          return false;
        },
        'preconditionFn': function () {
          return true;
        },
      };
      const testShortcut2Stub = addShortcut(
        registry,
        testShortcut2,
        Blockly.utils.KeyCodes.C,
        true,
      );
      assert.isTrue(registry.onKeyDown(workspace, event));
      sinon.assert.calledOnce(testShortcut2Stub);
      sinon.assert.notCalled(callBackStub);
    });
    suite('interaction with FocusManager', function () {
      let focusedBlock: Blockly.BlockSvg;
      let testShortcutWithScope: Blockly.ShortcutRegistry.KeyboardShortcut;

      setup(function () {
        testShortcutWithScope = {
          'name': 'test_shortcut',
          'callback': function () {
            return true;
          },
          'preconditionFn': function () {
            return true;
          },
        };

        focusedBlock = workspace.newBlock('controls_if');
        focusedBlock.initSvg();
        focusedBlock.render();
        Blockly.getFocusManager().focusNode(focusedBlock);
      });
      test('Callback receives the focused node', function () {
        const event = createKeyDownEvent(Blockly.utils.KeyCodes.C);
        const callbackStub = addShortcut(
          registry,
          testShortcutWithScope,
          Blockly.utils.KeyCodes.C,
          true,
        );
        registry.onKeyDown(workspace, event);

        const expectedScope = {focusedNode: focusedBlock};
        sinon.assert.calledWithExactly(
          callbackStub,
          workspace,
          event,
          testShortcutWithScope,
          expectedScope,
        );
      });
      test('Precondition receives the focused node', function () {
        const event = createKeyDownEvent(Blockly.utils.KeyCodes.C);
        addShortcut(
          registry,
          testShortcutWithScope,
          Blockly.utils.KeyCodes.C,
          true,
        );
        const preconditionStub = sinon
          .stub(testShortcutWithScope, 'preconditionFn')
          .returns(true);
        registry.onKeyDown(workspace, event);
        const expectedScope = {focusedNode: focusedBlock};
        sinon.assert.calledWithExactly(
          preconditionStub,
          workspace,
          expectedScope,
        );
      });
    });
  });

  suite('createSerializedKey', function () {
    test('Serialize key', function () {
      const serializedKey = registry.createSerializedKey(
        Blockly.utils.KeyCodes.A,
        null,
      );
      assert.equal(serializedKey, '65');
    });

    test('Serialize key code and modifier', function () {
      const serializedKey = registry.createSerializedKey(
        Blockly.utils.KeyCodes.A,
        [Blockly.utils.KeyCodes.CTRL],
      );
      assert.equal(serializedKey, 'Control+65');
    });
    test('Serialize only a modifier', function () {
      const serializedKey = registry.createSerializedKey(null as any, [
        Blockly.utils.KeyCodes.CTRL,
      ]);
      assert.equal(serializedKey, 'Control');
    });
    test('Serialize multiple modifiers', function () {
      const serializedKey = registry.createSerializedKey(
        Blockly.utils.KeyCodes.A,
        [Blockly.utils.KeyCodes.CTRL, Blockly.utils.KeyCodes.SHIFT],
      );
      assert.equal(serializedKey, 'Shift+Control+65');
    });
    test('Order of modifiers should result in same serialized key', function () {
      const serializedKey = registry.createSerializedKey(
        Blockly.utils.KeyCodes.A,
        [Blockly.utils.KeyCodes.CTRL, Blockly.utils.KeyCodes.SHIFT],
      );
      assert.equal(serializedKey, 'Shift+Control+65');
      const serializedKeyNewOrder = registry.createSerializedKey(
        Blockly.utils.KeyCodes.A,
        [Blockly.utils.KeyCodes.SHIFT, Blockly.utils.KeyCodes.CTRL],
      );
      assert.equal(serializedKeyNewOrder, 'Shift+Control+65');
    });
  });
});
