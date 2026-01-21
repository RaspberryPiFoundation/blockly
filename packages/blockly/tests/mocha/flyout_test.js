/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
  workspaceTeardown,
} from './test_helpers/setup_teardown.js';
import {
  getProperSimpleJson,
  getSimpleJson,
  getXmlArray,
} from './test_helpers/toolbox_definitions.js';

suite('Flyout', function () {
  setup(function () {
    this.clock = sharedTestSetup.call(this, {fireEventsNow: false}).clock;
    Blockly.defineBlocksWithJsonArray([
      {
        'type': 'basic_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'field_input',
            'name': 'TEXT',
            'text': 'default',
          },
        ],
      },
    ]);
    this.toolboxXml = document.getElementById('toolbox-simple');
    this.workspace = Blockly.inject('blocklyDiv', {
      toolbox: this.toolboxXml,
    });
  });

  teardown(function () {
    this.clock.runAll();
    sharedTestTeardown.call(this);
  });

  suite('workspace change listeners', function () {
    test('are triggered when a child block changes', function () {
      let listenerTriggered = false;
      const listener = (e) => {
        if (e.type === Blockly.Events.BLOCK_CHANGE) {
          listenerTriggered = true;
        }
      };
      this.workspace.getFlyout().getWorkspace().addChangeListener(listener);
      const boolBlock = this.workspace
        .getFlyout()
        .getWorkspace()
        .getBlocksByType('logic_compare')[0];
      boolBlock.getField('OP').setValue('LTE');
      this.clock.tick(1000);
      assert.isTrue(listenerTriggered);
      this.workspace.getFlyout().getWorkspace().removeChangeListener(listener);
    });
  });

  suite('position', function () {
    suite('vertical flyout', function () {
      suite('simple flyout', function () {
        setup(function () {
          this.flyout = this.workspace.getFlyout();
          this.targetMetricsManager =
            this.flyout.targetWorkspace.getMetricsManager();
        });
        test('y is always 0', function () {
          assert.equal(
            this.flyout.getY(),
            0,
            'y coordinate in vertical flyout should be 0',
          );
        });
        test('x is right of workspace if flyout at right', function () {
          sinon.stub(this.targetMetricsManager, 'getViewMetrics').returns({
            width: 100,
          });
          this.flyout.targetWorkspace.toolboxPosition =
            Blockly.utils.toolbox.Position.RIGHT;
          this.flyout.toolboxPosition_ = Blockly.utils.toolbox.Position.RIGHT;
          assert.equal(
            this.flyout.getX(),
            100,
            'x should be right of workspace',
          );
        });
        test('x is 0 if flyout at left', function () {
          this.flyout.targetWorkspace.toolboxPosition =
            Blockly.utils.toolbox.Position.LEFT;
          this.flyout.toolboxPosition_ = Blockly.utils.toolbox.Position.LEFT;
          assert.equal(
            this.flyout.getX(),
            0,
            'x should be 0 if the flyout is on the left',
          );
        });
      });
      suite('toolbox flyout', function () {
        setup(function () {
          const toolbox = document.getElementById('toolbox-categories');
          this.workspace = Blockly.inject('blocklyDiv', {
            toolbox: toolbox,
          });
          this.flyout = this.workspace.getToolbox().getFlyout();
          this.targetMetricsManager =
            this.flyout.targetWorkspace.getMetricsManager();
        });
        teardown(function () {
          workspaceTeardown.call(this, this.workspace);
        });
        test('x is aligned with toolbox at left', function () {
          sinon.stub(this.targetMetricsManager, 'getToolboxMetrics').returns({
            width: 20,
          });
          this.flyout.setVisible(true);
          this.flyout.targetWorkspace.toolboxPosition =
            Blockly.utils.toolbox.Position.LEFT;
          this.flyout.toolboxPosition_ = Blockly.utils.toolbox.Position.LEFT;
          assert.equal(
            this.flyout.getX(),
            20,
            'x should be aligned with toolbox',
          );
        });
        test('x is aligned with toolbox at right', function () {
          sinon.stub(this.targetMetricsManager, 'getToolboxMetrics').returns({
            width: 20,
          });
          sinon.stub(this.targetMetricsManager, 'getViewMetrics').returns({
            width: 100,
          });
          this.flyout.width_ = 10;
          this.flyout.setVisible(true);
          this.flyout.targetWorkspace.toolboxPosition =
            Blockly.utils.toolbox.Position.RIGHT;
          this.flyout.toolboxPosition_ = Blockly.utils.toolbox.Position.RIGHT;
          assert.equal(
            this.flyout.getX(),
            90,
            'x + width should be aligned with toolbox',
          );
        });
      });
      // These tests simulate a trashcan flyout, i.e. the flyout under test is on the
      // opposite side of the workspace toolbox setting.
      suite('trashcan flyout', function () {
        setup(function () {
          this.flyout = this.workspace.getFlyout();
          this.targetMetricsManager =
            this.flyout.targetWorkspace.getMetricsManager();
        });
        test('x is 0 if trashcan on left', function () {
          sinon.stub(this.flyout.targetWorkspace, 'getMetrics').returns({
            viewWidth: 100,
          });
          this.flyout.targetWorkspace.toolboxPosition =
            Blockly.utils.toolbox.Position.RIGHT;
          this.flyout.toolboxPosition_ = Blockly.utils.toolbox.Position.LEFT;
          assert.equal(
            this.flyout.getX(),
            0,
            'x should be aligned with left edge',
          );
        });
        test('trashcan on right covers right edge of workspace', function () {
          this.flyout.width_ = 20;
          sinon.stub(this.targetMetricsManager, 'getAbsoluteMetrics').returns({
            left: 10,
          });
          sinon.stub(this.targetMetricsManager, 'getViewMetrics').returns({
            width: 100,
          });

          this.flyout.setVisible(true);
          this.flyout.targetWorkspace.toolboxPosition =
            Blockly.utils.toolbox.Position.LEFT;
          this.flyout.toolboxPosition_ = Blockly.utils.toolbox.Position.RIGHT;
          assert.equal(
            this.flyout.getX(),
            90,
            'x + width should be aligned with right edge',
          );
        });
      });
    });

    suite('horizontal flyout', function () {
      setup(function () {
        this.workspace = Blockly.inject('blocklyDiv', {
          toolbox: this.toolboxXml,
          horizontalLayout: true,
        });
      });
      teardown(function () {
        workspaceTeardown.call(this, this.workspace);
      });
      suite('simple flyout', function () {
        setup(function () {
          this.flyout = this.workspace.getFlyout();
          this.targetMetricsManager =
            this.flyout.targetWorkspace.getMetricsManager();
        });
        test('x is always 0', function () {
          assert.equal(
            this.flyout.getX(),
            0,
            'x coordinate in horizontal flyout should be 0',
          );
        });
        test('y is 0 if flyout at top', function () {
          this.flyout.targetWorkspace.toolboxPosition =
            Blockly.utils.toolbox.Position.TOP;
          this.flyout.toolboxPosition_ = Blockly.utils.toolbox.Position.TOP;
          assert.equal(
            this.flyout.getY(),
            0,
            'y should be 0 if flyout is at the top',
          );
        });
        test('y is below workspace if flyout at bottom', function () {
          this.flyout.targetWorkspace.toolboxPosition =
            Blockly.utils.toolbox.Position.BOTTOM;
          this.flyout.toolboxPosition_ = Blockly.utils.toolbox.Position.BOTTOM;
          sinon.stub(this.targetMetricsManager, 'getViewMetrics').returns({
            height: 50,
          });
          assert.equal(
            this.flyout.getY(),
            50,
            'y should be below the workspace',
          );
        });
      });
      suite('toolbox flyout', function () {
        setup(function () {
          const toolbox = document.getElementById('toolbox-categories');
          this.workspace = Blockly.inject('blocklyDiv', {
            toolbox: toolbox,
            horizontalLayout: true,
          });
          this.flyout = this.workspace.getToolbox().getFlyout();
          this.targetMetricsManager =
            this.flyout.targetWorkspace.getMetricsManager();
        });
        teardown(function () {
          workspaceTeardown.call(this, this.workspace);
        });
        test('y is aligned with toolbox at top', function () {
          sinon.stub(this.targetMetricsManager, 'getToolboxMetrics').returns({
            height: 20,
          });
          this.flyout.setVisible(true);
          this.flyout.targetWorkspace.toolboxPosition =
            Blockly.utils.toolbox.Position.TOP;
          this.flyout.toolboxPosition_ = Blockly.utils.toolbox.Position.TOP;
          assert.equal(
            this.flyout.getY(),
            20,
            'y should be aligned with toolbox',
          );
        });
        test('y is aligned with toolbox at bottom', function () {
          sinon.stub(this.targetMetricsManager, 'getToolboxMetrics').returns({
            height: 20,
          });
          sinon.stub(this.targetMetricsManager, 'getViewMetrics').returns({
            height: 100,
          });
          this.flyout.height_ = 30;
          this.flyout.setVisible(true);
          this.flyout.targetWorkspace.toolboxPosition =
            Blockly.utils.toolbox.Position.BOTTOM;
          this.flyout.toolboxPosition_ = Blockly.utils.toolbox.Position.BOTTOM;
          assert.equal(
            this.flyout.getY(),
            70,
            'y + height should be aligned with toolbox',
          );
        });
      });
      // These tests simulate a trashcan flyout, i.e. the flyout under test is on the
      // opposite side of the workspace toolbox setting.
      suite('trashcan flyout', function () {
        setup(function () {
          this.flyout = this.workspace.getFlyout();
          this.targetMetricsManager =
            this.flyout.targetWorkspace.getMetricsManager();
        });
        test('y is 0 if trashcan at top', function () {
          this.flyout.targetWorkspace.toolboxPosition =
            Blockly.utils.toolbox.Position.BOTTOM;
          this.flyout.toolboxPosition_ = Blockly.utils.toolbox.Position.TOP;
          assert.equal(this.flyout.getY(), 0, 'y should be aligned with top');
        });
        test('trashcan on bottom covers bottom of workspace', function () {
          this.flyout.targetWorkspace.toolboxPosition =
            Blockly.utils.toolbox.Position.TOP;
          this.flyout.toolboxPosition_ = Blockly.utils.toolbox.Position.BOTTOM;
          sinon.stub(this.targetMetricsManager, 'getAbsoluteMetrics').returns({
            top: 10,
          });
          sinon.stub(this.targetMetricsManager, 'getViewMetrics').returns({
            height: 50,
          });
          this.flyout.setVisible(true);
          this.flyout.height_ = 20;
          assert.equal(
            this.flyout.getY(),
            40,
            'y + height should be aligned with bottom',
          );
        });
      });
    });
  });

  suite('createFlyoutInfo', function () {
    setup(function () {
      this.flyout = this.workspace.getFlyout();
      this.createFlyoutSpy = sinon.spy(this.flyout, 'createFlyoutInfo');
    });

    function checkFlyoutInfo(flyoutSpy) {
      const flyoutInfo = flyoutSpy.returnValues[0];
      const contents = flyoutInfo;

      assert.equal(contents.length, 6, 'Contents');

      assert.equal(contents[0].type, 'block', 'Contents');
      const block = contents[0]['element'];
      assert.instanceOf(block, Blockly.BlockSvg);
      assert.equal(block.getFieldValue('OP'), 'NEQ');
      const childA = block.getInputTargetBlock('A');
      const childB = block.getInputTargetBlock('B');
      assert.isTrue(childA.isShadow());
      assert.isFalse(childB.isShadow());
      assert.equal(childA.getFieldValue('NUM'), 1);
      assert.equal(childB.getFieldValue('NUM'), 2);

      assert.equal(contents[1].type, 'sep');
      assert.equal(contents[1].element.getBoundingRectangle().getHeight(), 20);

      assert.equal(contents[2].type, 'button', 'Contents');
      assert.instanceOf(contents[2]['element'], Blockly.FlyoutButton);

      assert.equal(contents[3].type, 'sep');
      assert.equal(contents[3].element.getBoundingRectangle().getHeight(), 24);

      assert.equal(contents[4].type, 'label', 'Contents');
      assert.instanceOf(contents[4]['element'], Blockly.FlyoutButton);

      assert.equal(contents[5].type, 'sep');
      assert.equal(contents[5].element.getBoundingRectangle().getHeight(), 24);
    }

    suite('Direct show', function () {
      test('Node', function () {
        this.flyout.show(this.toolboxXml);
        checkFlyoutInfo(this.createFlyoutSpy);
      });

      test('NodeList', function () {
        const nodeList = document.getElementById('toolbox-simple').childNodes;
        this.flyout.show(nodeList);
        checkFlyoutInfo(this.createFlyoutSpy);
      });

      test('Array of JSON', function () {
        this.flyout.show(getSimpleJson());
        checkFlyoutInfo(this.createFlyoutSpy);
      });

      test('Array of Proper JSON', function () {
        this.flyout.show(getProperSimpleJson());
        checkFlyoutInfo(this.createFlyoutSpy);
      });

      test('Array of XML', function () {
        this.flyout.show(getXmlArray());
        checkFlyoutInfo(this.createFlyoutSpy);
      });
    });

    suite('Dynamic category', function () {
      setup(function () {
        this.stubAndAssert = function (val) {
          sinon
            .stub(
              this.flyout.workspace_.targetWorkspace,
              'getToolboxCategoryCallback',
            )
            .returns(function () {
              return val;
            });
          this.flyout.show('someString');
          checkFlyoutInfo(this.createFlyoutSpy);
        };
      });

      test('No category available', function () {
        assert.throws(
          function () {
            this.flyout.show('someString');
          }.bind(this),
          "Couldn't find a callback function when opening " +
            'a toolbox category.',
        );
      });

      test('Node', function () {
        this.stubAndAssert(this.toolboxXml);
      });

      test('NodeList', function () {
        this.stubAndAssert(
          document.getElementById('toolbox-simple').childNodes,
        );
      });

      test('Array of JSON', function () {
        this.stubAndAssert(getSimpleJson());
      });

      test('Array of Proper JSON', function () {
        this.stubAndAssert(getProperSimpleJson());
      });

      test('Array of XML', function () {
        this.stubAndAssert(getXmlArray());
      });
    });
  });

  suite('Creating blocks', function () {
    suite('Enabled/Disabled', function () {
      setup(function () {
        this.flyout = this.workspace.getFlyout();

        this.assertDisabled = function (disabled) {
          const block = this.flyout.getWorkspace().getTopBlocks(false)[0];
          assert.equal(!block.isEnabled(), disabled);
        };
      });

      suite('XML', function () {
        test('True string', function () {
          const xml = Blockly.utils.xml.textToDom(
            '<xml>' +
              '<block type="text_print" disabled="true"></block>' +
              '</xml>',
          );
          this.flyout.show(xml);
          this.assertDisabled(true);
        });

        test('False string', function () {
          const xml = Blockly.utils.xml.textToDom(
            '<xml>' +
              '<block type="text_print" disabled="false"></block>' +
              '</xml>',
          );
          this.flyout.show(xml);
          this.assertDisabled(false);
        });

        test('Disabled string', function () {
          // The XML system supports this for some reason!?
          const xml = Blockly.utils.xml.textToDom(
            '<xml>' +
              '<block type="text_print" disabled="disabled"></block>' +
              '</xml>',
          );
          this.flyout.show(xml);
          this.assertDisabled(true);
        });

        test('Different string', function () {
          const xml = Blockly.utils.xml.textToDom(
            '<xml>' +
              '<block type="text_print" disabled="random"></block>' +
              '</xml>',
          );
          this.flyout.show(xml);
          this.assertDisabled(false);
        });
      });

      suite('JSON', function () {
        test('All undefined', function () {
          const json = [
            {
              'kind': 'block',
              'type': 'text_print',
            },
          ];
          this.flyout.show(json);
          this.assertDisabled(false);
        });

        test('Enabled true', function () {
          const json = [
            {
              'kind': 'block',
              'type': 'text_print',
              'enabled': true,
            },
          ];
          this.flyout.show(json);
          this.assertDisabled(false);
        });

        test('Enabled false', function () {
          const json = [
            {
              'kind': 'block',
              'type': 'text_print',
              'enabled': false,
            },
          ];
          this.flyout.show(json);
          this.assertDisabled(true);
        });

        test('Disabled true string', function () {
          const json = [
            {
              'kind': 'block',
              'type': 'text_print',
              'disabled': 'true',
            },
          ];
          this.flyout.show(json);
          this.assertDisabled(true);
        });

        test('Disabled false string', function () {
          const json = [
            {
              'kind': 'block',
              'type': 'text_print',
              'disabled': 'false',
            },
          ];
          this.flyout.show(json);
          this.assertDisabled(false);
        });

        test('Disabled string', function () {
          const json = [
            {
              'kind': 'block',
              'type': 'text_print',
              'disabled': 'disabled', // This is not respected by the JSON!
            },
          ];
          this.flyout.show(json);
          this.assertDisabled(false);
        });

        test('Disabled true value', function () {
          const json = [
            {
              'kind': 'block',
              'type': 'text_print',
              'disabled': true,
            },
          ];
          this.flyout.show(json);
          this.assertDisabled(true);
        });

        test('Disabled false value', function () {
          const json = [
            {
              'kind': 'block',
              'type': 'text_print',
              'disabled': false,
            },
          ];
          this.flyout.show(json);
          this.assertDisabled(false);
        });

        test('Disabled different string', function () {
          const json = [
            {
              'kind': 'block',
              'type': 'text_print',
              'disabled': 'random',
            },
          ];
          this.flyout.show(json);
          this.assertDisabled(false);
        });

        test('Disabled empty string', function () {
          const json = [
            {
              'kind': 'block',
              'type': 'text_print',
              'disabled': '',
            },
          ];
          this.flyout.show(json);
          this.assertDisabled(false);
        });
      });
    });
  });

  suite('Recycling', function () {
    setup(function () {
      this.flyout = this.workspace.getFlyout();
    });

    test('Recycling disabled', function () {
      this.flyout.show({
        'contents': [
          {
            'kind': 'BLOCK',
            'type': 'math_number',
            'fields': {
              'NUM': 123,
            },
          },
        ],
      });
      this.flyout.show({
        'contents': [
          {
            'kind': 'BLOCK',
            'type': 'math_number',
            'fields': {
              'NUM': 321,
            },
          },
        ],
      });
      const block = this.flyout.workspace_.getAllBlocks()[0];
      assert.equal(block.getFieldValue('NUM'), 321);
    });
  });
});
