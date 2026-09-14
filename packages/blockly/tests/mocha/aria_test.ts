/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

import {getInputLabelsSubset} from '#core/block_aria_composer.js';
import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import type sinon from 'sinon';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('ARIA', function () {
  let workspace: Blockly.WorkspaceSvg;
  let liveRegion: HTMLElement;
  let clock: sinon.SinonFakeTimers;

  setup(function (this: Mocha.Context) {
    ({clock} = sharedTestSetup.call(this));
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
    assert.isNotNull(toolbox);
    workspace = Blockly.inject('blocklyDiv', {
      ...DEFAULT_INJECT_OPTIONS,
      toolbox,
    });
    const liveRegion_ = document.getElementById('blocklyAriaAnnounce');
    assert.isNotNull(liveRegion_);
    liveRegion = liveRegion_;
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('Live Region', function () {
    test('live region is created', function () {
      assert.isNotNull(liveRegion);
    });

    test('live region has polite aria-live', function () {
      assert.equal(liveRegion.getAttribute('aria-live'), 'polite');
    });

    test('live region has atomic true', function () {
      assert.equal(liveRegion.getAttribute('aria-atomic'), 'true');
    });

    test('live region has status role by default', function () {
      assert.equal(liveRegion.getAttribute('role'), 'status');
    });

    test('live region is rendered for screen readers but visually hidden', function () {
      const style = window.getComputedStyle(liveRegion);

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
        workspace.getInjectionDiv(),
      );

      const regions = workspace
        .getInjectionDiv()
        .querySelectorAll('#blocklyAriaAnnounce');

      assert.equal(regions.length, 1);
    });

    test('announcement is delayed', function () {
      Blockly.utils.aria.announceDynamicAriaState('Hello world');

      assert.equal(liveRegion.textContent, '');

      // Advance past the delay in announceDynamicAriaState.
      clock.tick(11);
      assert.include(liveRegion.textContent, 'Hello world');
    });

    test('repeated announcements are unique', function () {
      Blockly.utils.aria.announceDynamicAriaState('Block moved');
      clock.tick(11);

      const first = liveRegion.textContent;

      Blockly.utils.aria.announceDynamicAriaState('Block moved');
      clock.tick(11);

      const second = liveRegion.textContent;

      assert.notEqual(first, second);
    });

    test('Coalesces messages when called rapidly', function () {
      Blockly.utils.aria.announceDynamicAriaState('First message');
      Blockly.utils.aria.announceDynamicAriaState('Second message');
      Blockly.utils.aria.announceDynamicAriaState('Final message');

      clock.tick(11);

      assert.include(
        liveRegion.textContent,
        'First message\nSecond message\nFinal message',
      );
    });

    test('repeated drags with unchanged state are not re-announced', function () {
      const block = workspace.newBlock('basic_block');
      block.initSvg();
      block.render();

      const startLoc = block.getRelativeToSurfaceXY();
      block.startDrag();
      clock.tick(11);
      const initialAnnouncementText = liveRegion.textContent;
      assert.equal(initialAnnouncementText, 'Moving default on workspace.');

      block.drag(new Blockly.utils.Coordinate(startLoc.x + 20, startLoc.y));
      block.drag(new Blockly.utils.Coordinate(startLoc.x + 40, startLoc.y));
      block.drag(new Blockly.utils.Coordinate(startLoc.x + 60, startLoc.y));
      clock.tick(11);

      // Subsequent announcements during a move will drop the getStackBlocksCountLabel()
      // and toggle a non-breaking space at the end. If the move candidate hasn't
      // changed, the live region shouldn't be udpated.
      assert.equal(liveRegion.textContent, initialAnnouncementText);

      block.endDrag(undefined, Blockly.DragDisposition.COMMIT);
    });

    test('Uses maximal assertiveness when coalescing', function () {
      Blockly.utils.aria.announceDynamicAriaState('First message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.OFF,
      });
      Blockly.utils.aria.announceDynamicAriaState('Second message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.ASSERTIVE,
      });
      Blockly.utils.aria.announceDynamicAriaState('Final message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
      });

      clock.tick(11);

      assert.equal(liveRegion.getAttribute('aria-live'), 'assertive');
    });

    test('assertive option sets aria-live assertive', function () {
      Blockly.utils.aria.announceDynamicAriaState('Warning', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.ASSERTIVE,
      });

      clock.tick(11);

      assert.equal(liveRegion.getAttribute('aria-live'), 'assertive');
    });

    test('role option updates role attribute', function () {
      Blockly.utils.aria.announceDynamicAriaState('Alert message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
        role: Blockly.utils.aria.Role.GROUP,
      });

      clock.tick(11);

      assert.equal(liveRegion.getAttribute('role'), 'group');
    });

    test('role and text update after delay', function () {
      // Initial announcement to establish baseline role + text.
      Blockly.utils.aria.announceDynamicAriaState('Initial message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
        role: Blockly.utils.aria.Role.STATUS,
      });
      clock.tick(11);

      assert.equal(liveRegion.getAttribute('role'), 'status');
      const initialText = liveRegion.textContent;

      // Now announce with different role.
      Blockly.utils.aria.announceDynamicAriaState('Group message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
        role: Blockly.utils.aria.Role.GROUP,
      });

      // Before delay: role and text should not have changed yet.
      clock.tick(5);
      assert.equal(liveRegion.getAttribute('role'), 'status');
      assert.equal(liveRegion.textContent, initialText);

      // After delay: both should update.
      clock.tick(6);
      assert.equal(liveRegion.getAttribute('role'), 'group');
      assert.include(liveRegion.textContent, 'Group message');
    });
    test('missing role does not clear default status role', function () {
      Blockly.utils.aria.announceDynamicAriaState('Hello world');

      clock.tick(11);

      assert.equal(liveRegion.getAttribute('role'), 'status');
    });
    test('custom role overrides default status role', function () {
      Blockly.utils.aria.announceDynamicAriaState('Group message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
        role: Blockly.utils.aria.Role.GROUP,
      });

      clock.tick(11);

      assert.equal(liveRegion.getAttribute('role'), 'group');
    });
    test('role reverts to status after custom role when role not provided', function () {
      // First: default
      Blockly.utils.aria.announceDynamicAriaState('Normal message');
      clock.tick(11);
      assert.equal(liveRegion.getAttribute('role'), 'status');

      // Second: custom role
      Blockly.utils.aria.announceDynamicAriaState('Group message', {
        assertiveness: Blockly.utils.aria.LiveRegionAssertiveness.POLITE,
        role: Blockly.utils.aria.Role.GROUP,
      });
      clock.tick(11);
      assert.equal(liveRegion.getAttribute('role'), 'group');

      // Third: no role provided should revert to default status.
      Blockly.utils.aria.announceDynamicAriaState('Back to normal');
      clock.tick(11);

      assert.equal(liveRegion.getAttribute('role'), 'status');
    });
  });
  suite('Utils', function () {
    let element: HTMLElement;

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
    function makeBlock(blockType: string) {
      const block = workspace.newBlock(blockType);
      block.initSvg();
      block.render();
      Blockly.getFocusManager().focusNode(block);
      return block;
    }

    test('Statement blocks have correct role description', function () {
      const block = makeBlock('text_print');
      const roleDescription = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.ROLEDESCRIPTION,
      );
      assert.equal(roleDescription, 'statement');
    });

    test('Value blocks have correct role description', function () {
      const block = makeBlock('logic_boolean');
      const roleDescription = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.ROLEDESCRIPTION,
      );
      assert.equal(roleDescription, 'value');
    });

    test('Container blocks have correct role description', function () {
      const block = makeBlock('controls_if');
      const roleDescription = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.ROLEDESCRIPTION,
      );
      assert.equal(roleDescription, 'container');
    });

    test('Workspace blocks have the correct role', function () {
      const block = makeBlock('text_print');
      const role = Blockly.utils.aria.getRole(block.getFocusableElement());
      assert.equal(role, Blockly.utils.aria.Role.FIGURE);
    });

    test('Flyout blocks have the correct role', function () {
      const toolboxItem = workspace.getToolbox()?.getToolboxItems()[0];
      assert.isDefined(toolboxItem);
      Blockly.getFocusManager().focusNode(toolboxItem);
      const block = workspace.getFlyout()?.getWorkspace().getTopBlocks()[0];
      assert.isDefined(block);
      const role = Blockly.utils.aria.getRole(block.getFocusableElement());
      assert.equal(role, Blockly.utils.aria.Role.OPTION);
    });

    test('Root workspace blocks indicate that in their labels', function () {
      const block = makeBlock('text_print');
      const label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.isTrue(label?.startsWith('Begin stack'));
    });

    test('Flyout blocks are not labeled as beginning a stack', function () {
      const toolboxItem = workspace.getToolbox()?.getToolboxItems()[0];
      assert.isDefined(toolboxItem);
      Blockly.getFocusManager().focusNode(toolboxItem);
      const block = workspace.getFlyout()?.getWorkspace().getTopBlocks()[0];
      assert.isDefined(block);
      const label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.notInclude(label, 'Begin stack');
    });

    test('Statement blocks in first statement input do not include their parent input in their label', function () {
      const ifBlock = makeBlock('controls_ifelse');
      const printBlock = makeBlock('text_print');
      const previousConnection = printBlock.previousConnection;
      assert.isNotNull(previousConnection);
      ifBlock.getInput('IF0')?.connection?.connect(previousConnection);
      const label = Blockly.utils.aria.getState(
        printBlock.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.isFalse(label?.startsWith('Begin do'));
    });

    test('Statement blocks in subsequent statement inputs include their parent input in their label', function () {
      const ifBlock = makeBlock('controls_ifelse');
      const printBlock = makeBlock('text_print');
      const previousConnection = printBlock.previousConnection;
      assert.isNotNull(previousConnection);
      ifBlock.getInput('ELSE')?.connection?.connect(previousConnection);
      const label = Blockly.utils.aria.getState(
        printBlock.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.isTrue(label?.startsWith('Begin else'));
    });

    test('Statement child includes labels from other inputs in the same statement section', function () {
      Blockly.Blocks['aria_parent_label_test'] = {
        init: function () {
          this.appendValueInput('IF').appendField('if');
          this.appendStatementInput('DO').appendField('do');
          this.appendDummyInput('DUMMY').appendField("here's a label");
          this.appendEndRowInput('END_ROW').appendField(
            new Blockly.FieldImage(
              'https://www.gstatic.com/codesite/ph/images/star_on.gif',
              15,
              15,
              '*',
              undefined,
              false,
            ),
          );
          this.appendStatementInput('BODY');
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        },
      };
      const block = makeBlock('aria_parent_label_test');
      const printBlock = makeBlock('text_print');
      const previousConnection = printBlock.previousConnection;
      assert.isNotNull(previousConnection);
      block.getInput('BODY')?.connection?.connect(previousConnection);
      const label = Blockly.utils.aria.getState(
        printBlock.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.isTrue(label?.startsWith("Begin here's a label, *"));
    });

    test('A custom statement input label is wrapped in the "Begin" prefix', function () {
      const ifBlock = makeBlock('controls_ifelse');
      ifBlock.getInput('ELSE')?.setAriaLabelProvider('otherwise do');
      const printBlock = makeBlock('text_print');
      const previousConnection = printBlock.previousConnection;
      assert.isNotNull(previousConnection);
      ifBlock.getInput('ELSE')?.connection?.connect(previousConnection);
      const label = Blockly.utils.aria.getState(
        printBlock.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.include(label, 'Begin otherwise do');
    });

    test('A custom label on the first statement input is prepended to its child block label', function () {
      const ifBlock = makeBlock('controls_ifelse');
      ifBlock.getInput('DO0')?.setAriaLabelProvider('then do');
      const printBlock = makeBlock('text_print');
      const previousConnection = printBlock.previousConnection;
      assert.isNotNull(previousConnection);
      ifBlock.getInput('DO0')?.connection?.connect(previousConnection);
      const label = Blockly.utils.aria.getState(
        printBlock.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.include(label, 'Begin then do');
    });

    test('A custom input label is only used for the first child block in a statement input stack', function () {
      const ifBlock = makeBlock('controls_ifelse');
      ifBlock.getInput('ELSE')?.setAriaLabelProvider('otherwise do');
      const firstPrintBlock = makeBlock('text_print');
      let previousConnection = firstPrintBlock.previousConnection;
      assert.isNotNull(previousConnection);
      ifBlock.getInput('ELSE')?.connection?.connect(previousConnection);
      const secondPrintBlock = makeBlock('text_print');
      previousConnection = secondPrintBlock.previousConnection;
      assert.isNotNull(previousConnection);
      firstPrintBlock.nextConnection?.connect(previousConnection);
      const subsequentLabel = Blockly.utils.aria.getState(
        secondPrintBlock.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.notInclude(subsequentLabel, 'otherwise do');
    });

    test('A custom input label is prepended to the child block of a value input', function () {
      const ifBlock = makeBlock('controls_ifelse');
      ifBlock.getInput('IF0')?.setAriaLabelProvider('condition');
      const boolBlock = makeBlock('logic_boolean');
      const outputConnection = boolBlock.outputConnection;
      assert.isNotNull(outputConnection);
      ifBlock.getInput('IF0')?.connection?.connect(outputConnection);
      const label = Blockly.utils.aria.getState(
        boolBlock.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.include(label, 'condition');
    });

    test('A block connected to a value input without a custom label does not include the input label', function () {
      const negateBlock = makeBlock('logic_negate');
      const boolBlock = makeBlock('logic_boolean');
      const outputConnection = boolBlock.outputConnection;
      assert.isNotNull(outputConnection);
      negateBlock.getInput('BOOL')?.connection?.connect(outputConnection);
      const label = Blockly.utils.aria.getState(
        boolBlock.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.notInclude(label, 'not');
    });

    test('Disabled blocks indicate that in their label', function () {
      const block = makeBlock('text_print');
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
      const block = makeBlock('text_print');
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

    test('Blocks without inputs are properly labeled', function () {
      const block = makeBlock('logic_null');
      const label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.notInclude(label, 'input');
    });

    test('Blocks with custom input labels are properly labeled', function () {
      const block = makeBlock('logic_negate');
      const input = block.getInput('BOOL');
      input?.setAriaLabelProvider('condition');
      const label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.include(label, 'not');
      assert.notInclude(label, 'condition');
    });

    test('Blocks with one input are properly labeled', function () {
      const block = makeBlock('logic_negate');
      const label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.isTrue(label?.replace(/,$/, '').endsWith('has input'));
    });

    test('Blocks with multiple inputs are properly labeled', function () {
      const block = makeBlock('logic_ternary');
      const label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.isTrue(label?.replace(/,$/, '').endsWith('has inputs'));
    });
    test('Blocks with multiple statement inputs are properly labeled', function () {
      const json = {
        'blocks': {
          'languageVersion': 0,
          'blocks': [
            {
              'type': 'controls_if',
              'id': 'ifBlock',
              'x': 0,
              'y': 100,
              'extraState': {
                'elseIfCount': 2,
                'hasElse': true,
              },
            },
          ],
        },
      };
      Blockly.serialization.workspaces.load(json, workspace);
      const block = workspace.getBlockById('ifBlock');
      assert.isNotNull(block);
      const label = Blockly.utils.aria.getState(
        block.getFocusableElement(),
        Blockly.utils.aria.State.LABEL,
      );
      assert.isFalse(label?.includes('else if, do'));
      assert.isFalse(label?.includes('else,'));
      assert.isTrue(label?.replace(/,$/, '').endsWith('has 4 branches'));
    });
  });

  suite('getInputLabelsSubset', function () {
    setup(function () {
      Blockly.Blocks['aria_subset_test'] = {
        init: function () {
          this.appendValueInput('IF').appendField('if');
          this.appendStatementInput('DO').appendField('do');
          this.appendDummyInput('DUMMY').appendField("here's a label");
          this.appendEndRowInput('END_ROW').appendField(
            new Blockly.FieldImage(
              'https://www.gstatic.com/codesite/ph/images/star_on.gif',
              15,
              15,
              '*',
              undefined,
              false,
            ),
          );
          this.appendStatementInput('BODY');
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        },
      };
      Blockly.Blocks['aria_subset_lone_statement'] = {
        init: function () {
          this.appendStatementInput('FIRST').appendField('first');
          this.appendStatementInput('SECOND');
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        },
      };
    });

    function renderBlock(blockType: string) {
      const block = workspace.newBlock(blockType);
      block.initSvg();
      block.render();
      return block;
    }

    test('unlabeled statement input omits numbered fallback when section has other labels', function () {
      const block = renderBlock('aria_subset_test');
      const bodyInput = block.getInput('BODY');
      assert.isNotNull(bodyInput);
      const labels = getInputLabelsSubset(block, bodyInput, false);
      assert.deepEqual(labels, ["here's a label", '*']);
      for (const label of labels) {
        assert.notInclude(label, 'input');
      }
    });

    test('unlabeled statement input uses numbered fallback when section has no other labels', function () {
      const block = renderBlock('aria_subset_lone_statement');
      const secondInput = block.getInput('SECOND');
      assert.isNotNull(secondInput);
      const labels = getInputLabelsSubset(block, secondInput, false);
      assert.deepEqual(labels, [
        Blockly.Msg.INPUT_LABEL_INDEX.replace('%1', '2'),
      ]);
    });

    test('dummy inputs in a statement section do not produce input 0 fallback', function () {
      Blockly.Blocks['makecode_if_else'] = {
        init: function () {
          this.appendValueInput('IF0').appendField('if');
          this.appendDummyInput('THEN0').appendField('then');
          this.appendStatementInput('DO0');
          this.appendDummyInput('ELSETITLE').appendField('else');
          this.appendDummyInput('ELSEBUTTONS').appendField(
            new Blockly.FieldImage(
              'https://www.gstatic.com/codesite/ph/images/star_on.gif',
              24,
              24,
              '*',
              undefined,
              false,
            ),
          );
          this.appendStatementInput('ELSE');
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        },
      };
      const block = renderBlock('makecode_if_else');
      const elseInput = block.getInput('ELSE');
      assert.isNotNull(elseInput);
      const labels = getInputLabelsSubset(block, elseInput, false);
      assert.include(labels, 'else');
      assert.notInclude(labels.join(', '), 'input 0');
    });
  });

  suite('Rendered connection highlight ARIA', function () {
    function assertHighlightAria(
      connection: Blockly.Connection | undefined | null,
      expectedRoleDescription: string,
      labelSubstring: string | string[],
      ...moreLabelSubstrings: string[]
    ) {
      assert.instanceOf(connection, Blockly.RenderedConnection);
      const labelSubstrings = [labelSubstring, ...moreLabelSubstrings].flat();
      connection.highlight();
      try {
        const el = connection.getFocusableElement();
        assert.equal(
          Blockly.utils.aria.getRole(el),
          Blockly.utils.aria.Role.FIGURE,
        );
        assert.equal(
          Blockly.utils.aria.getState(
            el,
            Blockly.utils.aria.State.ROLEDESCRIPTION,
          ),
          expectedRoleDescription,
        );
        const label = Blockly.utils.aria.getState(
          el,
          Blockly.utils.aria.State.LABEL,
        );
        for (const fragment of labelSubstrings) {
          assert.include(label, fragment);
        }
      } finally {
        connection.unhighlight();
      }
    }

    function renderBlock(blockType: string) {
      const block = workspace.newBlock(blockType);
      block.initSvg();
      block.render();
      return block;
    }

    test('value input connection uses value role description and computed label', function () {
      const negate = renderBlock('logic_negate');
      const boolInput = negate.getInput('BOOL');
      assertHighlightAria(
        boolInput?.connection,
        Blockly.Msg.INPUT_LABEL_VALUE,
        'not',
      );
    });

    test('empty statement input connection uses statement role description and end label', function () {
      const repeat = renderBlock('controls_repeat_ext');
      const doInput = repeat.getInput('DO');
      assert.isNotNull(doInput);
      assertHighlightAria(
        doInput.connection,
        Blockly.Msg.INPUT_LABEL_STATEMENT,
        ['End', ...getInputLabelsSubset(repeat, doInput, false)],
      );
    });

    test('statement input connection label does not include the placeholder "input"', function () {
      const block = renderBlock('controls_repeat_ext');
      const doInput = block.getInput('DO');
      const connection = doInput?.connection;
      assert.instanceOf(connection, Blockly.RenderedConnection);
      connection.highlight();
      try {
        const label = Blockly.utils.aria.getState(
          connection.getFocusableElement(),
          Blockly.utils.aria.State.LABEL,
        );
        assert.notInclude(label, 'input');
      } finally {
        connection.unhighlight();
      }
    });

    test('last next connection in a populated statement stack uses statement role description and end label', function () {
      const repeat = renderBlock('controls_repeat_ext');
      const printBlock = renderBlock('text_print');
      const doInput = repeat.getInput('DO');
      const previousConnection = printBlock.previousConnection;
      assert.isNotNull(previousConnection);
      assert.isNotNull(doInput);
      doInput.connection?.connect(previousConnection);

      assertHighlightAria(
        printBlock.nextConnection,
        Blockly.Msg.INPUT_LABEL_STATEMENT,
        ['End', ...getInputLabelsSubset(repeat, doInput, false)],
      );
    });

    test('value input connection with custom input label uses custom label', function () {
      const negate = renderBlock('logic_negate');
      negate.getInput('BOOL')?.setAriaLabelProvider('custom value input');
      assertHighlightAria(
        negate.getInput('BOOL')?.connection,
        Blockly.Msg.INPUT_LABEL_VALUE,
        'custom value input',
      );
    });

    test('empty statement input connection with custom input label uses end-of-statement label', function () {
      const repeat = renderBlock('controls_repeat_ext');
      repeat.getInput('DO')?.setAriaLabelProvider('custom repeat body');
      assertHighlightAria(
        repeat.getInput('DO')?.connection,
        Blockly.Msg.INPUT_LABEL_STATEMENT,
        ['End', 'custom repeat body'],
      );
    });

    test('last next connection in a populated statement stack respects custom statement input label', function () {
      const repeat = renderBlock('controls_repeat_ext');
      repeat.getInput('DO')?.setAriaLabelProvider('custom repeat body');
      const printBlock = renderBlock('text_print');
      const previousConnection = printBlock.previousConnection;
      assert.isNotNull(previousConnection);
      repeat.getInput('DO')?.connection?.connect(previousConnection);

      assertHighlightAria(
        printBlock.nextConnection,
        Blockly.Msg.INPUT_LABEL_STATEMENT,
        ['End', 'custom repeat body'],
      );
    });
  });
});
