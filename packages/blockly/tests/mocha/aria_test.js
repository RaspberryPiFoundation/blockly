/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('ARIA', function () {
  setup(function () {
    sharedTestSetup.call(this);
    Blockly.defineBlocksWithJsonArray([
      {
        type: 'basic_block',
        message0: '%1',
        args0: [
          {
            type: 'field_input',
            name: 'TEXT',
            text: 'default',
          },
        ],
      },
    ]);
    const toolbox = document.getElementById('toolbox-categories');
    this.workspace = Blockly.inject('blocklyDiv', {toolbox});
    this.liveRegion = document.getElementById('blocklyAriaAnnounce');
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Live Region', function () {
    test('live region is created', function () {
      assert.isNotNull(this.liveRegion);
    });

    test('live region has polite aria-live', function () {
      assert.equal(this.liveRegion.getAttribute('aria-live'), 'polite');
    });

    test('live region has atomic true', function () {
      assert.equal(this.liveRegion.getAttribute('aria-atomic'), 'true');
    });

    test('live region has status role by default', function () {
      assert.equal(this.liveRegion.getAttribute('role'), 'status');
    });

    test('live region is rendered for screen readers but visually hidden', function () {
      const style = window.getComputedStyle(this.liveRegion);

      // Still rendered for screen readers
      assert.notEqual(style.display, 'none');

      // Visually hidden via hiddenForAria class
      assert.equal(style.position, 'absolute');
      assert.equal(style.left, '-9999px');
      assert.equal(style.width, '1px');
      assert.equal(style.height, '1px');
      assert.equal(style.overflow, 'hidden');
    });

    test('createLiveRegion only creates one region (singleton)', function () {
      // Calling again should not create a duplicate.
      Blockly.utils.aria.initializeGlobalAriaLiveRegion(
        this.workspace.getInjectionDiv(),
      );

      const regions = this.workspace
        .getInjectionDiv()
        .querySelectorAll('#blocklyAriaAnnounce');

      assert.equal(regions.length, 1);
    });

    test('announcement is delayed', function () {
      Blockly.utils.aria.announceDynamicAriaState('Hello world');

      assert.equal(this.liveRegion.textContent, '');

      // Advance past the delay in announceDynamicAriaState.
      this.clock.tick(11);
      assert.include(this.liveRegion.textContent, 'Hello world');
    });

    test('repeated announcements are unique', function () {
      Blockly.utils.aria.announceDynamicAriaState('Block moved');
      this.clock.tick(11);

      const first = this.liveRegion.textContent;

      Blockly.utils.aria.announceDynamicAriaState('Block moved');
      this.clock.tick(11);

      const second = this.liveRegion.textContent;

      assert.notEqual(first, second);
    });

    test('last write wins when called rapidly', function () {
      Blockly.utils.aria.announceDynamicAriaState('First message');
      Blockly.utils.aria.announceDynamicAriaState('Second message');
      Blockly.utils.aria.announceDynamicAriaState('Final message');

      this.clock.tick(11);

      assert.include(this.liveRegion.textContent, 'Final message');
    });

    test('assertive option sets aria-live assertive', function () {
      Blockly.utils.aria.announceDynamicAriaState('Warning', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.ASSERTIVE,
        role: null,
      });

      this.clock.tick(11);

      assert.equal(this.liveRegion.getAttribute('aria-live'), 'assertive');
    });

    test('role option updates role attribute', function () {
      Blockly.utils.aria.announceDynamicAriaState('Alert message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
        role: Blockly.utils.aria.Role.GROUP,
      });

      this.clock.tick(11);

      assert.equal(this.liveRegion.getAttribute('role'), 'group');
    });

    test('role and text update after delay', function () {
      // Initial announcement to establish baseline role + text.
      Blockly.utils.aria.announceDynamicAriaState('Initial message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
        role: Blockly.utils.aria.Role.STATUS,
      });
      this.clock.tick(11);

      assert.equal(this.liveRegion.getAttribute('role'), 'status');
      const initialText = this.liveRegion.textContent;

      // Now announce with different role.
      Blockly.utils.aria.announceDynamicAriaState('Group message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
        role: Blockly.utils.aria.Role.GROUP,
      });

      // Before delay: role and text should not have changed yet.
      this.clock.tick(5);
      assert.equal(this.liveRegion.getAttribute('role'), 'status');
      assert.equal(this.liveRegion.textContent, initialText);

      // After delay: both should update.
      this.clock.tick(6);
      assert.equal(this.liveRegion.getAttribute('role'), 'group');
      assert.include(this.liveRegion.textContent, 'Group message');
    });
    test('missing role does not clear default status role', function () {
      Blockly.utils.aria.announceDynamicAriaState('Hello world');

      this.clock.tick(11);

      assert.equal(this.liveRegion.getAttribute('role'), 'status');
    });
    test('custom role overrides default status role', function () {
      Blockly.utils.aria.announceDynamicAriaState('Group message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
        role: Blockly.utils.aria.Role.GROUP,
      });

      this.clock.tick(11);

      assert.equal(this.liveRegion.getAttribute('role'), 'group');
    });
    test('role reverts to status after custom role when role not provided', function () {
      // First: default
      Blockly.utils.aria.announceDynamicAriaState('Normal message');
      this.clock.tick(11);
      assert.equal(this.liveRegion.getAttribute('role'), 'status');

      // Second: custom role
      Blockly.utils.aria.announceDynamicAriaState('Group message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
        role: Blockly.utils.aria.Role.GROUP,
      });
      this.clock.tick(11);
      assert.equal(this.liveRegion.getAttribute('role'), 'group');

      // Third: no role provided should revert to default status.
      Blockly.utils.aria.announceDynamicAriaState('Back to normal');
      this.clock.tick(11);

      assert.equal(this.liveRegion.getAttribute('role'), 'status');
    });
  });
  suite('Utils', function () {
    let element;

    setup(function () {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    teardown(function () {
      element.remove();
    });

    test('getRole returns null for element with no role', function () {
      assert.isNull(Blockly.utils.aria.getRole(element));
    });

    test('getRole returns correct role if set', function () {
      element.setAttribute('role', 'button');
      assert.equal(
        Blockly.utils.aria.getRole(element),
        Blockly.utils.aria.Role.BUTTON,
      );
    });

    test('getRole returns null for unknown role', function () {
      element.setAttribute('role', 'foobar');
      assert.isNull(Blockly.utils.aria.getRole(element));
    });

    test('setState sets aria state as attribute', function () {
      Blockly.utils.aria.setState(
        element,
        Blockly.utils.aria.State.DISABLED,
        true,
      );
      assert.equal(element.getAttribute('aria-disabled'), 'true');
    });

    test('getState retrieves previously set state', function () {
      Blockly.utils.aria.setState(
        element,
        Blockly.utils.aria.State.HIDDEN,
        false,
      );
      assert.equal(
        Blockly.utils.aria.getState(element, Blockly.utils.aria.State.HIDDEN),
        'false',
      );
    });

    test('getState returns null for state not set', function () {
      assert.isNull(
        Blockly.utils.aria.getState(element, Blockly.utils.aria.State.SELECTED),
      );
    });

    test('clearState removes previously set attribute', function () {
      Blockly.utils.aria.setState(
        element,
        Blockly.utils.aria.State.CHECKED,
        true,
      );
      assert.equal(element.getAttribute('aria-checked'), 'true');

      Blockly.utils.aria.clearState(element, Blockly.utils.aria.State.CHECKED);
      assert.isNull(element.getAttribute('aria-checked'));
    });

    test('setState handles array values correctly', function () {
      Blockly.utils.aria.setState(element, Blockly.utils.aria.State.LABEL, [
        'one',
        'two',
        'three',
      ]);
      assert.equal(element.getAttribute('aria-label'), 'one two three');
    });
  });

  suite('Blocks', function () {
    setup(function () {
      this.makeBlock = (blockType) => {
        const block = this.workspace.newBlock(blockType);
        block.initSvg();
        block.render();
        Blockly.getFocusManager().focusNode(block);
        return block;
      };
    });

    test('Statement blocks have correct role description', function () {
      const block = this.makeBlock('text_print');
      const roleDescription = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.ROLEDESCRIPTION,
      );
      assert.equal(roleDescription, 'statement');
    });

    test('Value blocks have correct role description', function () {
      const block = this.makeBlock('logic_boolean');
      const roleDescription = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.ROLEDESCRIPTION,
      );
      assert.equal(roleDescription, 'value');
    });

    test('Container blocks have correct role description', function () {
      const block = this.makeBlock('controls_if');
      const roleDescription = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.ROLEDESCRIPTION,
      );
      assert.equal(roleDescription, 'container');
    });

    test('Workspace blocks have the correct role', function () {
      const block = this.makeBlock('text_print');
      const role = Blockly.utils.aria.getRole(block.getFocusableElement());
      assert.equal(role, Blockly.utils.aria.Role.FIGURE);
    });

    test('Flyout blocks have the correct role', function () {
      Blockly.getFocusManager().focusNode(
        this.workspace.getToolbox().getToolboxItems()[0],
      );
      const block = this.workspace.getFlyout().getWorkspace().getTopBlocks()[0];
      const role = Blockly.utils.aria.getRole(block.getFocusableElement());
      assert.equal(role, Blockly.utils.aria.Role.LISTITEM);
    });

    test('Root workspace blocks indicate that in their labels', function () {
      const block = this.makeBlock('text_print');
      const label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.isTrue(label.startsWith('Begin stack'));
    });

    test('Flyout blocks are not labeled as beginning a stack', function () {
      Blockly.getFocusManager().focusNode(
        this.workspace.getToolbox().getToolboxItems()[0],
      );
      const block = this.workspace.getFlyout().getWorkspace().getTopBlocks()[0];
      const label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.notInclude(label, 'Begin stack');
    });

    test('Nested statement blocks in first statement input do not include their parent input in their label', function () {
      const ifBlock = this.makeBlock('controls_ifelse');
      const printBlock = this.makeBlock('text_print');
      ifBlock.getInput('IF0').connection.connect(printBlock.previousConnection);
      const label = Blockly.utils.aria.getState(
        printBlock.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.isFalse(label.startsWith('Begin do'));
    });

    test('Nested statement blocks in subsequent statement inputs include their parent input in their label', function () {
      const ifBlock = this.makeBlock('controls_ifelse');
      const printBlock = this.makeBlock('text_print');
      ifBlock
        .getInput('ELSE')
        .connection.connect(printBlock.previousConnection);
      const label = Blockly.utils.aria.getState(
        printBlock.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.isTrue(label.startsWith('Begin else'));
    });

    test('Disabled blocks indicate that in their label', function () {
      const block = this.makeBlock('text_print');
      let label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.notInclude(label, 'disabled');
      block.setDisabledReason(true, 'testing');
      label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.include(label, 'disabled');
    });

    test('Collapsed blocks indicate that in their label', function () {
      const block = this.makeBlock('text_print');
      let label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.notInclude(label, 'collapsed');
      block.setCollapsed(true);
      label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.include(label, 'collapsed');
    });

    test('Shadow blocks indicate that in their label', function () {
      const block = this.makeBlock('text_print');
      const text = this.makeBlock('text');
      text.outputConnection.connect(block.inputList[0].connection);
      let label = Blockly.utils.aria.getState(
        text.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.notInclude(label, 'replaceable');
      text.setShadow(true);
      label = Blockly.utils.aria.getState(
        text.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.include(label, 'replaceable');
    });

    test('Blocks without inputs are properly labeled', function () {
      const block = this.makeBlock('math_random_float');
      const label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.notInclude(label, 'input');
    });

    test('Blocks with one input are properly labeled', function () {
      const block = this.makeBlock('logic_negate');
      const label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.isTrue(label.endsWith('has input'));
    });

    test('Blocks with multiple inputs are properly labeled', function () {
      const block = this.makeBlock('logic_ternary');
      const label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.isTrue(label.endsWith('has inputs'));
    });
  });
});
