/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Metrics', function () {
  const SCROLL_X = 10;
  const SCROLL_Y = 10;
  function assertDimensionsMatch(toCheck, left, top, width, height) {
    assert.equal(top, toCheck.top, 'Top did not match.');
    assert.equal(left, toCheck.left, 'Left did not match.');
    assert.equal(width, toCheck.width, 'Width did not match.');
    assert.equal(height, toCheck.height, 'Height did not match.');
  }

  // Make a mock workspace object with two properties:
  // getBlocksBoundingBox and scale.
  function makeMockWs(scale, x, y, width, height) {
    return {
      getBlocksBoundingBox: function () {
        return {top: y, bottom: y + height, left: x, right: x + width};
      },
      getToolbox: function () {},
      getFlyout: function () {},
      scale: scale,
      scrollX: SCROLL_X,
      scrollY: SCROLL_Y,
      isMovableHorizontally: function () {
        return true;
      },
      isMovableVertically: function () {
        return true;
      },
    };
  }

  setup(function () {
    sharedTestSetup.call(this);
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('getAbsoluteMetrics', function () {
    setup(function () {
      this.ws = makeMockWs(1, 0, 0, 0, 0);
      this.metricsManager = new Blockly.MetricsManager(this.ws);
      this.toolboxMetricsStub = sinon.stub(
        this.metricsManager,
        'getToolboxMetrics',
      );
      this.flyoutMetricsStub = sinon.stub(
        this.metricsManager,
        'getFlyoutMetrics',
      );
      this.getToolboxStub = sinon.stub(
        this.metricsManager.workspace_,
        'getToolbox',
      );
      this.getFlyoutStub = sinon.stub(
        this.metricsManager.workspace_,
        'getFlyout',
      );
    });

    test('left toolboxes with always open flyouts have both offsets', function () {
      this.toolboxMetricsStub.returns({width: 50, height: 0, position: 2});
      this.flyoutMetricsStub.returns({width: 100, height: 0, position: 2});
      this.getToolboxStub.returns(true);
      this.getFlyoutStub.returns({autoClose: false});

      const absoluteMetrics = this.metricsManager.getAbsoluteMetrics();

      assertDimensionsMatch(absoluteMetrics, 150, 0);
    });

    test('top toolboxes with always open flyouts have both offsets', function () {
      this.toolboxMetricsStub.returns({width: 0, height: 50, position: 0});
      this.flyoutMetricsStub.returns({width: 0, height: 100, position: 0});
      this.getToolboxStub.returns(true);
      this.getFlyoutStub.returns({autoClose: false});

      const absoluteMetrics = this.metricsManager.getAbsoluteMetrics();

      assertDimensionsMatch(absoluteMetrics, 0, 150);
    });

    test('left toolboxes with autoclosing flyouts only have a toolbox offset', function () {
      this.toolboxMetricsStub.returns({width: 50, height: 0, position: 2});
      this.flyoutMetricsStub.returns({width: 100, height: 0, position: 2});
      this.getToolboxStub.returns(true);
      this.getFlyoutStub.returns({autoClose: true});

      const absoluteMetrics = this.metricsManager.getAbsoluteMetrics();

      assertDimensionsMatch(absoluteMetrics, 50, 0);
    });

    test('top toolboxes with autoclosing flyouts only have a toolbox offset', function () {
      this.toolboxMetricsStub.returns({width: 0, height: 50, position: 0});
      this.flyoutMetricsStub.returns({width: 0, height: 100, position: 0});
      this.getToolboxStub.returns(true);
      this.getFlyoutStub.returns({autoClose: true});

      const absoluteMetrics = this.metricsManager.getAbsoluteMetrics();

      assertDimensionsMatch(absoluteMetrics, 0, 50);
    });

    test('left always open flyouts have a flyout offset', function () {
      this.toolboxMetricsStub.returns({width: 50, height: 0, position: 2});
      this.flyoutMetricsStub.returns({width: 100, height: 0, position: 2});
      this.getToolboxStub.returns(false);
      this.getFlyoutStub.returns({autoClose: false});

      const absoluteMetrics = this.metricsManager.getAbsoluteMetrics();

      assertDimensionsMatch(absoluteMetrics, 100, 0);
    });

    test('top always open flyouts have a flyout offset', function () {
      this.toolboxMetricsStub.returns({width: 0, height: 50, position: 0});
      this.flyoutMetricsStub.returns({width: 0, height: 100, position: 0});
      this.getToolboxStub.returns(false);
      this.getFlyoutStub.returns({autoClose: false});

      const absoluteMetrics = this.metricsManager.getAbsoluteMetrics();

      assertDimensionsMatch(absoluteMetrics, 0, 100);
    });

    test('left autoclosing flyouts have no offset', function () {
      this.toolboxMetricsStub.returns({width: 50, height: 0, position: 2});
      this.flyoutMetricsStub.returns({width: 100, height: 0, position: 2});
      this.getToolboxStub.returns(false);
      this.getFlyoutStub.returns({autoClose: true});

      const absoluteMetrics = this.metricsManager.getAbsoluteMetrics();

      assertDimensionsMatch(absoluteMetrics, 0, 0);
    });

    test('top autoclosing flyouts have no offset', function () {
      this.toolboxMetricsStub.returns({width: 0, height: 50, position: 0});
      this.flyoutMetricsStub.returns({width: 0, height: 100, position: 0});
      this.getToolboxStub.returns(false);
      this.getFlyoutStub.returns({autoClose: true});

      const absoluteMetrics = this.metricsManager.getAbsoluteMetrics();

      assertDimensionsMatch(absoluteMetrics, 0, 0);
    });
  });

  suite('getViewMetrics', function () {
    setup(function () {
      this.ws = makeMockWs(1, 0, 0, 0, 0);
      this.metricsManager = new Blockly.MetricsManager(this.ws);
      this.toolboxMetricsStub = sinon.stub(
        this.metricsManager,
        'getToolboxMetrics',
      );
      this.flyoutMetricsStub = sinon.stub(
        this.metricsManager,
        'getFlyoutMetrics',
      );
      this.getToolboxStub = sinon.stub(
        this.metricsManager.workspace_,
        'getToolbox',
      );
      this.getFlyoutStub = sinon.stub(
        this.metricsManager.workspace_,
        'getFlyout',
      );
      this.svgMetricsStub = sinon.stub(this.metricsManager, 'getSvgMetrics');
    });

    test('left toolboxes with always open flyouts have both offsets', function () {
      this.toolboxMetricsStub.returns({width: 50, height: 0, position: 2});
      this.flyoutMetricsStub.returns({width: 100, height: 0, position: 2});
      this.svgMetricsStub.returns({width: 500, height: 500});
      this.getToolboxStub.returns(true);
      this.getFlyoutStub.returns({autoClose: false});

      const viewMetrics = this.metricsManager.getViewMetrics();

      assertDimensionsMatch(viewMetrics, -SCROLL_X, -SCROLL_Y, 350, 500);
    });

    test('top toolboxes with always open flyouts have both offsets', function () {
      this.toolboxMetricsStub.returns({width: 0, height: 50, position: 0});
      this.flyoutMetricsStub.returns({width: 0, height: 100, position: 0});
      this.svgMetricsStub.returns({width: 500, height: 500});
      this.getToolboxStub.returns(true);
      this.getFlyoutStub.returns({autoClose: false});

      const viewMetrics = this.metricsManager.getViewMetrics();

      assertDimensionsMatch(viewMetrics, -SCROLL_X, -SCROLL_Y, 500, 350);
    });

    test('left toolboxes with autoclosing flyouts only have a toolbox offset', function () {
      this.toolboxMetricsStub.returns({width: 50, height: 0, position: 2});
      this.flyoutMetricsStub.returns({width: 100, height: 0, position: 2});
      this.svgMetricsStub.returns({width: 500, height: 500});
      this.getToolboxStub.returns(true);
      this.getFlyoutStub.returns({autoClose: true});

      const viewMetrics = this.metricsManager.getViewMetrics();

      assertDimensionsMatch(viewMetrics, -SCROLL_X, -SCROLL_Y, 450, 500);
    });

    test('top toolboxes with autoclosing flyouts only have a toolbox offset', function () {
      this.toolboxMetricsStub.returns({width: 0, height: 50, position: 0});
      this.flyoutMetricsStub.returns({width: 0, height: 100, position: 0});
      this.svgMetricsStub.returns({width: 500, height: 500});
      this.getToolboxStub.returns(true);
      this.getFlyoutStub.returns({autoClose: true});

      const viewMetrics = this.metricsManager.getViewMetrics();

      assertDimensionsMatch(viewMetrics, -SCROLL_X, -SCROLL_Y, 500, 450);
    });

    test('left always open flyouts have a flyout offset', function () {
      this.toolboxMetricsStub.returns({width: 50, height: 0, position: 2});
      this.flyoutMetricsStub.returns({width: 100, height: 0, position: 2});
      this.svgMetricsStub.returns({width: 500, height: 500});
      this.getToolboxStub.returns(false);
      this.getFlyoutStub.returns({autoClose: false});

      const viewMetrics = this.metricsManager.getViewMetrics();

      assertDimensionsMatch(viewMetrics, -SCROLL_X, -SCROLL_Y, 400, 500);
    });

    test('top always open flyouts have a flyout offset', function () {
      this.toolboxMetricsStub.returns({width: 0, height: 50, position: 0});
      this.flyoutMetricsStub.returns({width: 0, height: 100, position: 0});
      this.svgMetricsStub.returns({width: 500, height: 500});
      this.getToolboxStub.returns(false);
      this.getFlyoutStub.returns({autoClose: false});

      const viewMetrics = this.metricsManager.getViewMetrics();

      assertDimensionsMatch(viewMetrics, -SCROLL_X, -SCROLL_Y, 500, 400);
    });

    test('left autoclosing flyouts have no offset', function () {
      this.toolboxMetricsStub.returns({width: 50, height: 0, position: 2});
      this.flyoutMetricsStub.returns({width: 100, height: 0, position: 2});
      this.svgMetricsStub.returns({width: 500, height: 500});
      this.getToolboxStub.returns(false);
      this.getFlyoutStub.returns({autoClose: true});

      const viewMetrics = this.metricsManager.getViewMetrics();

      assertDimensionsMatch(viewMetrics, -SCROLL_X, -SCROLL_Y, 500, 500);
    });

    test('top autoclosing flyouts have no offset', function () {
      this.toolboxMetricsStub.returns({width: 0, height: 50, position: 0});
      this.flyoutMetricsStub.returns({width: 0, height: 100, position: 0});
      this.svgMetricsStub.returns({width: 500, height: 500});
      this.getToolboxStub.returns(false);
      this.getFlyoutStub.returns({autoClose: true});

      const viewMetrics = this.metricsManager.getViewMetrics();

      assertDimensionsMatch(viewMetrics, -SCROLL_X, -SCROLL_Y, 500, 500);
    });

    test('Get view metrics in workspace coordinates ', function () {
      const scale = 2;
      const getWorkspaceCoordinates = true;

      this.ws.scale = scale;
      this.toolboxMetricsStub.returns({});
      this.flyoutMetricsStub.returns({width: 0, height: 107, position: 0});
      this.svgMetricsStub.returns({width: 500, height: 500});
      this.getToolboxStub.returns(false);
      this.getFlyoutStub.returns(true);

      const viewMetrics = this.metricsManager.getViewMetrics(
        getWorkspaceCoordinates,
      );

      assertDimensionsMatch(
        viewMetrics,
        -SCROLL_X / scale,
        -SCROLL_Y / scale,
        500 / scale,
        393 / scale,
      );
    });
  });

  suite('getContentMetrics', function () {
    test('Empty in ws coordinates', function () {
      const ws = makeMockWs(1, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(true);
      assertDimensionsMatch(contentMetrics, 0, 0, 0, 0);
    });
    test('Empty zoom-in in ws coordinates', function () {
      const ws = makeMockWs(2, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(true);
      assertDimensionsMatch(contentMetrics, 0, 0, 0, 0);
    });
    test('Empty zoom-out in ws coordinates', function () {
      const ws = makeMockWs(0.5, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(true);
      assertDimensionsMatch(contentMetrics, 0, 0, 0, 0);
    });
    test('Non empty at origin ws coordinates', function () {
      const ws = makeMockWs(1, 0, 0, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(true);
      assertDimensionsMatch(contentMetrics, 0, 0, 100, 100);
    });
    test('Non empty at origin zoom-in ws coordinates', function () {
      const ws = makeMockWs(2, 0, 0, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(true);
      assertDimensionsMatch(contentMetrics, 0, 0, 100, 100);
    });
    test('Non empty at origin zoom-out ws coordinates', function () {
      const ws = makeMockWs(0.5, 0, 0, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(true);
      assertDimensionsMatch(contentMetrics, 0, 0, 100, 100);
    });
    test('Non empty positive origin ws coordinates', function () {
      const ws = makeMockWs(1, 10, 10, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(true);
      assertDimensionsMatch(contentMetrics, 10, 10, 100, 100);
    });
    test('Non empty positive origin zoom-in ws coordinates', function () {
      const ws = makeMockWs(2, 10, 10, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(true);
      // 1 ws unit = 2 pixels at this zoom level.
      assertDimensionsMatch(contentMetrics, 10, 10, 100, 100);
    });
    test('Non empty positive origin zoom-out ws coordinates', function () {
      const ws = makeMockWs(0.5, 10, 10, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(true);
      // 1 ws unit = 0.5 pixels at this zoom level.
      assertDimensionsMatch(contentMetrics, 10, 10, 100, 100);
    });
    test('Non empty negative origin ws coordinates', function () {
      const ws = makeMockWs(1, -10, -10, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(true);
      // Pixel and ws units are the same at default zoom.
      assertDimensionsMatch(contentMetrics, -10, -10, 100, 100);
    });
    test('Non empty negative origin zoom-in ws coordinates', function () {
      const ws = makeMockWs(2, -10, -10, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(true);
      assertDimensionsMatch(contentMetrics, -10, -10, 100, 100);
    });
    test('Non empty negative origin zoom-out ws coordinates', function () {
      const ws = makeMockWs(0.5, -10, -10, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(true);
      assertDimensionsMatch(contentMetrics, -10, -10, 100, 100);
    });
    test('Empty in pixel coordinates', function () {
      const ws = makeMockWs(1, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(false);
      assertDimensionsMatch(contentMetrics, 0, 0, 0, 0);
    });
    test('Empty zoom-in in pixel coordinates', function () {
      const ws = makeMockWs(2, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(false);
      assertDimensionsMatch(contentMetrics, 0, 0, 0, 0);
    });
    test('Empty zoom-out in pixel coordinates', function () {
      const ws = makeMockWs(0.5, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(false);
      assertDimensionsMatch(contentMetrics, 0, 0, 0, 0);
    });
    test('Non empty at origin pixel coordinates', function () {
      const ws = makeMockWs(1, 0, 0, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(false);
      // Pixel and ws units are the same at default zoom.
      assertDimensionsMatch(contentMetrics, 0, 0, 100, 100);
    });
    test('Non empty at origin zoom-in pixel coordinates', function () {
      const ws = makeMockWs(2, 0, 0, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(false);
      // 1 ws unit = 2 pixels at this zoom level.
      assertDimensionsMatch(contentMetrics, 0, 0, 200, 200);
    });
    test('Non empty at origin zoom-out pixel coordinates', function () {
      const ws = makeMockWs(0.5, 0, 0, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(false);
      // 1 ws unit = 0.5 pixels at this zoom level.
      assertDimensionsMatch(contentMetrics, 0, 0, 50, 50);
    });
    test('Non empty positive origin pixel coordinates', function () {
      const ws = makeMockWs(1, 10, 10, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(false);
      // Pixel and ws units are the same at default zoom.
      assertDimensionsMatch(contentMetrics, 10, 10, 100, 100);
    });
    test('Non empty positive origin zoom-in pixel coordinates', function () {
      const ws = makeMockWs(2, 10, 10, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(false);
      // 1 ws unit = 2 pixels at this zoom level.
      assertDimensionsMatch(contentMetrics, 20, 20, 200, 200);
    });
    test('Non empty positive origin zoom-out pixel coordinates', function () {
      const ws = makeMockWs(0.5, 10, 10, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(false);
      // 1 ws unit = 0.5 pixels at this zoom level.
      assertDimensionsMatch(contentMetrics, 5, 5, 50, 50);
    });
    test('Non empty negative origin pixel coordinates', function () {
      const ws = makeMockWs(1, -10, -10, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(false);
      // Pixel and ws units are the same at default zoom.
      assertDimensionsMatch(contentMetrics, -10, -10, 100, 100);
    });
    test('Non empty negative origin zoom-in pixel coordinates', function () {
      const ws = makeMockWs(2, -10, -10, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(false);
      // 1 ws unit = 2 pixels at this zoom level.
      assertDimensionsMatch(contentMetrics, -20, -20, 200, 200);
    });
    test('Non empty negative origin zoom-out pixel coordinates', function () {
      const ws = makeMockWs(0.5, -10, -10, 100, 100);
      const metricsManager = new Blockly.MetricsManager(ws);
      const contentMetrics = metricsManager.getContentMetrics(false);
      // 1 ws unit = 0.5 pixels at this zoom level.
      assertDimensionsMatch(contentMetrics, -5, -5, 50, 50);
    });
  });

  suite('getScrollMetrics', function () {
    test('Empty workspace in ws coordinates', function () {
      const ws = makeMockWs(1, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      // The location of the viewport.
      const mockViewMetrics = {top: 0, left: 0, width: 200, height: 200};
      // The bounding box around the blocks on the screen.
      const mockContentMetrics = {top: 0, left: 0, width: 0, height: 0};

      const contentMetrics = metricsManager.getScrollMetrics(
        true,
        mockViewMetrics,
        mockContentMetrics,
      );

      // Should add half the view width to all sides.
      assertDimensionsMatch(contentMetrics, -200, -200, 400, 400);
    });
    test('Empty workspace zoom-in in ws coordinates', function () {
      const ws = makeMockWs(2, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      // The location of the viewport.
      const mockViewMetrics = {top: 0, left: 0, width: 200, height: 200};
      // The bounding box around the blocks on the screen.
      const mockContentMetrics = {top: 0, left: 0, width: 0, height: 0};

      const contentMetrics = metricsManager.getScrollMetrics(
        true,
        mockViewMetrics,
        mockContentMetrics,
      );

      // Should add half the view width to all sides.
      assertDimensionsMatch(contentMetrics, -100, -100, 200, 200);
    });
    test('Empty workspace zoom-out in ws coordinates', function () {
      const ws = makeMockWs(0.5, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      // The location of the viewport.
      const mockViewMetrics = {top: 0, left: 0, width: 200, height: 200};
      // The bounding box around the blocks on the screen.
      const mockContentMetrics = {top: 0, left: 0, width: 0, height: 0};

      const contentMetrics = metricsManager.getScrollMetrics(
        true,
        mockViewMetrics,
        mockContentMetrics,
      );

      // Should add half the view width to all sides.
      assertDimensionsMatch(contentMetrics, -400, -400, 800, 800);
    });
    test('Non empty workspace in ws coordinates', function () {
      const ws = makeMockWs(1, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      // The location of the viewport.
      const mockViewMetrics = {top: 0, left: 0, width: 200, height: 200};
      // The bounding box around the blocks on the screen.
      const mockContentMetrics = {top: 100, left: 100, width: 50, height: 50};

      const contentMetrics = metricsManager.getScrollMetrics(
        true,
        mockViewMetrics,
        mockContentMetrics,
      );

      // Should add half of the view width to all sides.
      assertDimensionsMatch(contentMetrics, -50, -50, 350, 350);
    });
    test('Non empty workspace zoom-in in ws coordinates', function () {
      const ws = makeMockWs(2, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      // The location of the viewport.
      const mockViewMetrics = {top: 0, left: 0, width: 200, height: 200};
      // The bounding box around the blocks on the screen.
      const mockContentMetrics = {top: 100, left: 100, width: 50, height: 50};

      const contentMetrics = metricsManager.getScrollMetrics(
        true,
        mockViewMetrics,
        mockContentMetrics,
      );

      // Should add half of the view width to all sides.
      assertDimensionsMatch(contentMetrics, -25, -25, 175, 175);
    });
    test('Non empty workspace zoom-out in ws coordinates', function () {
      const ws = makeMockWs(0.5, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      // The location of the viewport.
      const mockViewMetrics = {top: 0, left: 0, width: 200, height: 200};
      // The bounding box around the blocks on the screen.
      const mockContentMetrics = {top: 100, left: 100, width: 50, height: 50};

      const contentMetrics = metricsManager.getScrollMetrics(
        true,
        mockViewMetrics,
        mockContentMetrics,
      );

      // Should add half of the view width to all sides.
      assertDimensionsMatch(contentMetrics, -100, -100, 700, 700);
    });
    test('Empty workspace in pixel coordinates', function () {
      const ws = makeMockWs(1, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      // The location of the viewport.
      const mockViewMetrics = {top: 0, left: 0, width: 200, height: 200};
      // The bounding box around the blocks on the screen.
      const mockContentMetrics = {top: 0, left: 0, width: 0, height: 0};

      const contentMetrics = metricsManager.getScrollMetrics(
        false,
        mockViewMetrics,
        mockContentMetrics,
      );

      // Should add half the view width to all sides.
      assertDimensionsMatch(contentMetrics, -200, -200, 400, 400);
    });
    test('Empty workspace zoom-in in pixel coordinates', function () {
      const ws = makeMockWs(2, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      // The location of the viewport.
      const mockViewMetrics = {top: 0, left: 0, width: 200, height: 200};
      // The bounding box around the blocks on the screen.
      const mockContentMetrics = {top: 0, left: 0, width: 0, height: 0};

      const contentMetrics = metricsManager.getScrollMetrics(
        false,
        mockViewMetrics,
        mockContentMetrics,
      );

      // Should add half the view width to all sides.
      assertDimensionsMatch(contentMetrics, -200, -200, 400, 400);
    });
    test('Empty workspace zoom-out in pixel coordinates', function () {
      const ws = makeMockWs(0.5, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      // The location of the viewport.
      const mockViewMetrics = {top: 0, left: 0, width: 200, height: 200};
      // The bounding box around the blocks on the screen.
      const mockContentMetrics = {top: 0, left: 0, width: 0, height: 0};

      const contentMetrics = metricsManager.getScrollMetrics(
        false,
        mockViewMetrics,
        mockContentMetrics,
      );

      // Should add half the view width to all sides.
      assertDimensionsMatch(contentMetrics, -200, -200, 400, 400);
    });
    test('Non empty workspace in pixel coordinates', function () {
      const ws = makeMockWs(1, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      // The location of the viewport.
      const mockViewMetrics = {top: 0, left: 0, width: 200, height: 200};
      // The bounding box around the blocks on the screen.
      const mockContentMetrics = {top: 100, left: 100, width: 50, height: 50};

      const contentMetrics = metricsManager.getScrollMetrics(
        false,
        mockViewMetrics,
        mockContentMetrics,
      );

      // Should add half of the view width to all sides.
      assertDimensionsMatch(contentMetrics, -50, -50, 350, 350);
    });
    test('Non empty workspace zoom-in in pixel coordinates', function () {
      const ws = makeMockWs(2, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      // The location of the viewport.
      const mockViewMetrics = {top: 0, left: 0, width: 200, height: 200};
      // The bounding box around the blocks on the screen.
      const mockContentMetrics = {top: 100, left: 100, width: 50, height: 50};

      const contentMetrics = metricsManager.getScrollMetrics(
        false,
        mockViewMetrics,
        mockContentMetrics,
      );

      // Should add half of the view width to all sides.
      assertDimensionsMatch(contentMetrics, -50, -50, 350, 350);
    });
    test('Non empty workspace zoom-out in pixel coordinates', function () {
      const ws = makeMockWs(0.5, 0, 0, 0, 0);
      const metricsManager = new Blockly.MetricsManager(ws);
      // The location of the viewport.
      const mockViewMetrics = {top: 0, left: 0, width: 200, height: 200};
      // The bounding box around the blocks on the screen.
      const mockContentMetrics = {top: 100, left: 100, width: 50, height: 50};

      const contentMetrics = metricsManager.getScrollMetrics(
        false,
        mockViewMetrics,
        mockContentMetrics,
      );

      // Should add half of the view width to all sides.
      assertDimensionsMatch(contentMetrics, -50, -50, 350, 350);
    });
  });
});
