/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Node.js script to run Automated tests in Chrome, via webdriver.
 */

import * as chai from 'chai';
import {
  connect,
  contextMenuSelect,
  dragBlockTypeFromFlyout,
  dragNthBlockFromFlyout,
  PAUSE_TIME,
  testFileLocations,
  testSetup,
} from './test_setup.mjs';

async function getIsCollapsed(browser, blockId) {
  return await browser.execute((blockId) => {
    return Blockly.getMainWorkspace().getBlockById(blockId).isCollapsed();
  }, blockId);
}

async function getIsDisabled(browser, blockId) {
  return await browser.execute((blockId) => {
    const block = Blockly.getMainWorkspace().getBlockById(blockId);
    return !block.isEnabled() || block.getInheritedDisabled();
  }, blockId);
}

async function getCommentText(browser, blockId) {
  return await browser.execute((blockId) => {
    return Blockly.getMainWorkspace().getBlockById(blockId).getCommentText();
  }, blockId);
}

suite('Testing Connecting Blocks', function () {
  // Setting timeout to unlimited as the webdriver takes a longer time to run than most mocha test
  this.timeout(0);

  // Setup Selenium for all of the tests
  suiteSetup(async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
  });

  test('dragging a block from the flyout results in a block on the workspace', async function () {
    await dragBlockTypeFromFlyout(this.browser, 'Logic', 'controls_if', 20, 20);
    const blockCount = await this.browser.execute(() => {
      return Blockly.getMainWorkspace().getAllBlocks(false).length;
    });

    chai.assert.equal(blockCount, 1);
  });
});

/**
 * These tests have to run together. Each test acts on the state left by the
 * previous test, and each test has a single assertion.
 */
suite('Right Clicking on Blocks', function () {
  // Setting timeout to unlimited as the webdriver takes a longer time to run than most mocha test
  this.timeout(0);

  // Setup Selenium for all of the tests
  suiteSetup(async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
    this.block = await dragNthBlockFromFlyout(this.browser, 'Loops', 0, 20, 20);
  });

  test('clicking the collapse option collapses the block', async function () {
    await contextMenuSelect(this.browser, this.block, 'Collapse Block');
    chai.assert.isTrue(await getIsCollapsed(this.browser, this.block.id));
  });

  // Assumes that
  test('clicking the expand option expands the block', async function () {
    await contextMenuSelect(this.browser, this.block, 'Expand Block');
    chai.assert.isFalse(await getIsCollapsed(this.browser, this.block.id));
  });

  test('clicking the disable option disables the block', async function () {
    await contextMenuSelect(this.browser, this.block, 'Disable Block');
    chai.assert.isTrue(await getIsDisabled(this.browser, this.block.id));
  });

  test('clicking the enable option enables the block', async function () {
    await contextMenuSelect(this.browser, this.block, 'Enable Block');
    chai.assert.isFalse(await getIsDisabled(this.browser, this.block.id));
  });

  test('clicking the add comment option adds a comment to the block', async function () {
    await contextMenuSelect(this.browser, this.block, 'Add Comment');
    chai.assert.equal(await getCommentText(this.browser, this.block.id), '');
  });

  test('clicking the remove comment option removes a comment from the block', async function () {
    await contextMenuSelect(this.browser, this.block, 'Remove Comment');
    chai.assert.isNull(await getCommentText(this.browser, this.block.id));
  });

  test('does not scroll the page when node is ephemerally focused', async function () {
    const initialScroll = await this.browser.execute(() => {
      return window.scrollY;
    });
    // This left-right-left sequence was necessary to reproduce unintended
    // scrolling; regardless of the number of clicks/context menu activations,
    // the page should not scroll.
    this.block.click({button: 2});
    this.block.click({button: 0});
    this.block.click({button: 2});
    await this.browser.pause(250);
    const finalScroll = await this.browser.execute(() => {
      return window.scrollY;
    });

    chai.assert.equal(initialScroll, finalScroll);
  });

  test('does not scroll the page when node is actively focused', async function () {
    await this.browser.setWindowSize(500, 300);
    await this.browser.setViewport({width: 500, height: 300});
    const initialScroll = await this.browser.execute((blockId) => {
      window.scrollTo(0, document.body.scrollHeight);
      return window.scrollY;
    }, this.block.id);
    await this.browser.execute(() => {
      Blockly.getFocusManager().focusNode(
        Blockly.getMainWorkspace().getToolbox(),
      );
    });
    const finalScroll = await this.browser.execute(() => {
      return window.scrollY;
    });

    chai.assert.equal(initialScroll, finalScroll);
    await this.browser.setWindowSize(800, 600);
    await this.browser.setViewport({width: 800, height: 600});
  });
});

suite('Disabling', function () {
  // Setting timeout to unlimited as the webdriver takes a longer
  // time to run than most mocha tests.
  this.timeout(0);

  suiteSetup(async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
  });

  setup(async function () {
    await this.browser.refresh();
    // Pause to allow refresh time to work.
    await this.browser.pause(PAUSE_TIME + 150);
  });

  test(
    'children connected to value inputs are disabled when the ' +
      'parent is disabled',
    async function () {
      const parent = await dragBlockTypeFromFlyout(
        this.browser,
        'Logic',
        'controls_if',
        15,
        0,
      );
      const child = await dragBlockTypeFromFlyout(
        this.browser,
        'Logic',
        'logic_boolean',
        100,
        0,
      );
      await connect(this.browser, child, 'OUTPUT', parent, 'IF0');
      await this.browser.pause(PAUSE_TIME);
      await contextMenuSelect(this.browser, parent, 'Disable Block');

      chai.assert.isTrue(await getIsDisabled(this.browser, child.id));
    },
  );

  test(
    'children connected to statement inputs are disabled when the ' +
      'parent is disabled',
    async function () {
      const parent = await dragBlockTypeFromFlyout(
        this.browser,
        'Logic',
        'controls_if',
        15,
        0,
      );
      const child = await dragBlockTypeFromFlyout(
        this.browser,
        'Logic',
        'controls_if',
        100,
        0,
      );
      await this.browser.pause(PAUSE_TIME);
      await connect(this.browser, child, 'PREVIOUS', parent, 'DO0');

      await this.browser.pause(PAUSE_TIME);
      await contextMenuSelect(this.browser, parent, 'Disable Block');

      chai.assert.isTrue(await getIsDisabled(this.browser, child.id));
    },
  );

  test(
    'children connected to next connections are not disabled when the ' +
      'parent is disabled',
    async function () {
      const parent = await dragBlockTypeFromFlyout(
        this.browser,
        'Logic',
        'controls_if',
        15,
        0,
      );
      const child = await dragBlockTypeFromFlyout(
        this.browser,
        'Logic',
        'controls_if',
        100,
        0,
      );

      await connect(this.browser, child, 'PREVIOUS', parent, 'NEXT');

      await contextMenuSelect(this.browser, parent, 'Disable Block');

      chai.assert.isFalse(await getIsDisabled(this.browser, child.id));
    },
  );
});

suite('Focused nodes are scrolled into bounds', function () {
  // Setting timeout to unlimited as the webdriver takes a longer time to run
  // than most mocha tests.
  this.timeout(0);

  // Setup Selenium for all of the tests
  suiteSetup(async function () {
    this.browser = await testSetup(testFileLocations.PLAYGROUND);
    await this.browser.execute(() => {
      window.focusScrollTest = async (testcase) => {
        const workspace = Blockly.getMainWorkspace();
        const metrics = workspace.getMetricsManager();
        const initialViewport = metrics.getViewMetrics(true);
        const elementBounds = await testcase(workspace);
        await Blockly.renderManagement.finishQueuedRenders();
        const scrolledViewport = metrics.getViewMetrics(true);
        const workspaceBounds = new Blockly.utils.Rect(
          scrolledViewport.top,
          scrolledViewport.top + scrolledViewport.height,
          scrolledViewport.left,
          scrolledViewport.left + scrolledViewport.width,
        );
        return {
          changed:
            JSON.stringify(initialViewport) !==
            JSON.stringify(scrolledViewport),
          intersects: elementBounds.intersects(workspaceBounds),
          contains: workspaceBounds.contains(
            elementBounds.getOrigin().x,
            elementBounds.getOrigin().y,
          ),
          elementBounds,
          workspaceBounds,
        };
      };
    });
  });

  setup(async function () {
    await this.browser.execute(() => {
      Blockly.serialization.blocks.append(
        {
          'type': 'text',
          'x': -500,
          'y': -500,
        },
        Blockly.getMainWorkspace(),
      );
      Blockly.serialization.blocks.append(
        {
          'type': 'controls_if',
          'x': 500,
          'y': 500,
        },
        Blockly.getMainWorkspace(),
      );
      Blockly.getMainWorkspace().zoomCenter(1);
    });
  });

  test('Focused blocks scroll into bounds', async function () {
    const result = await this.browser.execute(async () => {
      return await window.focusScrollTest(async (workspace) => {
        const block = workspace.getTopBlocks()[0];
        Blockly.getFocusManager().focusNode(block);
        return block.getBoundingRectangleWithoutChildren();
      });
    });
    chai.assert.isTrue(result.intersects);
    chai.assert.isTrue(result.contains);
    chai.assert.isTrue(result.changed);
  });

  test('Focused bubbles scroll into bounds', async function () {
    const result = await this.browser.execute(async () => {
      return await window.focusScrollTest(async (workspace) => {
        const block = workspace.getTopBlocks()[0];
        block.setCommentText('hello world');
        const icon = block.getIcon(Blockly.icons.IconType.COMMENT);
        icon.setBubbleVisible(true);
        await Blockly.renderManagement.finishQueuedRenders();
        icon.setBubbleLocation(new Blockly.utils.Coordinate(-510, -510));
        Blockly.getFocusManager().focusNode(icon.getBubble());
        const xy = icon.getBubble().getRelativeToSurfaceXY();
        const size = icon.getBubble().getSize();
        return new Blockly.utils.Rect(
          xy.y,
          xy.y + size.height,
          xy.x,
          xy.x + size.width,
        );
      });
    });

    chai.assert.isTrue(result.intersects);
    chai.assert.isTrue(result.contains);
    chai.assert.isTrue(result.changed);
  });

  test('Comment bar buttons scroll into bounds', async function () {
    const result = await this.browser.execute(async () => {
      return await window.focusScrollTest(async (workspace) => {
        const comment = new Blockly.comments.RenderedWorkspaceComment(
          workspace,
        );
        comment.moveTo(new Blockly.utils.Coordinate(-300, 500));
        const commentBarButton = comment.view.getCommentBarButtons()[0];
        Blockly.getFocusManager().focusNode(commentBarButton);
        const xy = comment.view.getRelativeToSurfaceXY();
        const size = comment.view.getSize();
        // Comment bar buttons scroll their parent comment view into view.
        return new Blockly.utils.Rect(
          xy.y,
          xy.y + size.height,
          xy.x,
          xy.x + size.width,
        );
      });
    });

    chai.assert.isTrue(result.intersects);
    chai.assert.isTrue(result.contains);
    chai.assert.isTrue(result.changed);
  });

  test('Comment editors scroll into bounds', async function () {
    const result = await this.browser.execute(async () => {
      return await window.focusScrollTest(async (workspace) => {
        const comment = new Blockly.comments.RenderedWorkspaceComment(
          workspace,
        );
        comment.moveTo(new Blockly.utils.Coordinate(-300, 500));
        const commentEditor = comment.view.getEditorFocusableNode();
        Blockly.getFocusManager().focusNode(commentEditor);
        // Comment editor bounds can't be calculated externally since they
        // depend on private properties, but the comment view is a reasonable
        // proxy.
        const xy = comment.view.getRelativeToSurfaceXY();
        const size = comment.view.getSize();
        return new Blockly.utils.Rect(
          xy.y,
          xy.y + size.height,
          xy.x,
          xy.x + size.width,
        );
      });
    });

    chai.assert.isTrue(result.intersects);
    chai.assert.isTrue(result.contains);
    chai.assert.isTrue(result.changed);
  });

  test('Workspace comments scroll into bounds', async function () {
    const result = await this.browser.execute(async () => {
      return await window.focusScrollTest(async (workspace) => {
        const comment = new Blockly.comments.RenderedWorkspaceComment(
          workspace,
        );
        comment.moveTo(new Blockly.utils.Coordinate(-500, 500));
        Blockly.getFocusManager().focusNode(comment);
        return comment.getBoundingRectangle();
      });
    });

    chai.assert.isTrue(result.intersects);
    chai.assert.isTrue(result.contains);
    chai.assert.isTrue(result.changed);
  });

  test('Icons scroll into bounds', async function () {
    const result = await this.browser.execute(async () => {
      return await window.focusScrollTest(async (workspace) => {
        const block = workspace.getTopBlocks()[0];
        block.setWarningText('this is bad');
        const icon = block.getIcon(Blockly.icons.IconType.WARNING);
        Blockly.getFocusManager().focusNode(icon);
        // Icon bounds can't be calculated externally since they depend on
        // protected properties, but the parent block is a reasonable proxy.
        return block.getBoundingRectangleWithoutChildren();
      });
    });

    chai.assert.isTrue(result.intersects);
    chai.assert.isTrue(result.contains);
    chai.assert.isTrue(result.changed);
  });

  test('Fields scroll into bounds', async function () {
    const result = await this.browser.execute(async () => {
      return await window.focusScrollTest(async (workspace) => {
        const block = workspace.getTopBlocks()[0];
        const field = block.getField('TEXT');
        Blockly.getFocusManager().focusNode(field);
        // Fields scroll their source block into view.
        return block.getBoundingRectangleWithoutChildren();
      });
    });

    chai.assert.isTrue(result.intersects);
    chai.assert.isTrue(result.contains);
    chai.assert.isTrue(result.changed);
  });

  test('Connections scroll into bounds', async function () {
    const result = await this.browser.execute(async () => {
      return await window.focusScrollTest(async (workspace) => {
        const block = workspace.getBlocksByType('controls_if')[0];
        Blockly.getFocusManager().focusNode(block.nextConnection);
        // Connection bounds can't be calculated externally since they depend on
        // protected properties, but the parent block is a reasonable proxy.
        return block.getBoundingRectangleWithoutChildren();
      });
    });

    chai.assert.isTrue(result.intersects);
    chai.assert.isTrue(result.contains);
    chai.assert.isTrue(result.changed);
  });
});
