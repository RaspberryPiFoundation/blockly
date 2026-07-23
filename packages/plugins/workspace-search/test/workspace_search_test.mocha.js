/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Unit tests for WorkspaceSearch.
 * @author kozbial@google.com (Monica Kozbial)
 */

const assert = require('assert');
const Blockly = require('blockly');
const sinon = require('sinon');

const {WorkspaceSearch} = require('../src/index');

suite('WorkspaceSearch', function () {
  /**
   * Check if a block is currently highlighted.
   * @param {Blockly.BlockSvg} block The block to test.
   * @returns {boolean} True if the block is currently highlighted.
   */
  function isBlockHighlighted(block) {
    const path = block.pathObject.svgPath;
    const classes = path.getAttribute('class');
    return (
      (' ' + classes + ' ').indexOf(' blockly-ws-search-highlight ') !== -1
    );
  }
  /**
   * Check if a block is currently styled.
   * @param {Blockly.BlockSvg} block The block to test.
   * @returns {boolean} True if the block is currently styled.
   */
  function isBlockCurrentStyled(block) {
    const path = block.pathObject.svgPath;
    const classes = path.getAttribute('class');
    return (' ' + classes + ' ').indexOf(' blockly-ws-search-current ') !== -1;
  }
  /**
   * Assert that no extra styling is currently added to these blocks.
   * @param {Array.<Blockly.BlockSvg>} blocks The blocks to test.
   * @param {Blockly.BlockSvg=} expectedCurrent Optional, block that is
   *     expected.
   */
  function assertNoExtraCurrentStyling(blocks, expectedCurrent = undefined) {
    for (let block, i = 0; (block = blocks[i]); i++) {
      const isCurrentStyled = isBlockCurrentStyled(block);
      if (isCurrentStyled) {
        assert.equal(
          expectedCurrent,
          block,
          'Unexpected block [' + block.type + '] found styled as current.',
        );
      } else {
        assert.notEqual(
          block,
          expectedCurrent,
          'Expected block [' + block.type + '] to be styled as current.',
        );
      }
    }
  }

  setup(function () {
    this.jsdomCleanup = require('jsdom-global')(
      '<!DOCTYPE html><div id="blocklyDiv"></div>',
    );
    this.clock = sinon.useFakeTimers();
    this.workspace = Blockly.inject('blocklyDiv');
    this.workspaceSearch = new WorkspaceSearch(this.workspace);
    // See https://github.com/RaspberryPiFoundation/blockly-samples/issues/2528 for context.
    global.SVGElement = window.SVGElement;
    global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  });

  teardown(function () {
    this.workspaceSearch.dispose();
    this.workspace.dispose();
    this.clock.runAll();
    this.clock.restore();
    this.jsdomCleanup();
  });

  suite('init()', function () {
    test('CSS is injected at init()', function () {
      let searchStyle = document.getElementById('blockly-ws-search-style');
      assert.equal(!!searchStyle, false);
      this.workspaceSearch.init();
      searchStyle = document.getElementById('blockly-ws-search-style');
      assert.equal(!!searchStyle, true);
    });

    test('DOM is intialized at init()', function () {
      let dom = document.querySelector('div.blockly-ws-search');
      assert.equal(!!dom, false);
      this.workspaceSearch.init();
      dom = document.querySelector('div.blockly-ws-search');
      assert.equal(!!dom, true);
    });
  });

  suite('createBtn()', function () {
    test('Buttons have type button', function () {
      this.workspaceSearch.init();
      const nextBtn = document.querySelector(
        'button.blockly-ws-search-next-btn',
      );
      const previousBtn = document.querySelector(
        'button.blockly-ws-search-previous-btn',
      );
      const closeBtn = document.querySelector(
        'button.blockly-ws-search-close-btn',
      );
      assert.equal(nextBtn.type, 'button');
      assert.equal(previousBtn.type, 'button');
      assert.equal(closeBtn.type, 'button');
    });
  });

  suite('dispose()', function () {
    test('DOM is disposed', function () {
      this.workspaceSearch.init();
      let dom = document.querySelector('div.blockly-ws-search');
      assert.equal(!!dom, true);
      this.workspaceSearch.dispose();
      dom = document.querySelector('div.blockly-ws-search');
      assert.equal(!!dom, false);
    });
  });

  suite('searchAndHighlight()', function () {
    /**
     * Assert blocks are equal to the search group of blocks.
     * @param {Array.<Blockly.BlockSvg>} allBlocks All blocks.
     * @param {Array.<Blockly.BlockSvg>} actualGroup Search blocks group.
     * @param {*} expectedGroup Expected search block group.
     */
    function assertEqualsSearchGroup(allBlocks, actualGroup, expectedGroup) {
      assert.equal(actualGroup.length, expectedGroup.length);
      for (let block, i = 0; (block = allBlocks[i]); i++) {
        if (expectedGroup.indexOf(block) !== -1) {
          assert.equal(
            actualGroup.indexOf(block) !== -1,
            true,
            'Expected block [' + block.type + '] to be in search results',
          );
          assert.equal(
            isBlockHighlighted(block),
            true,
            'Expected block [' + block.type + '] to be highlighted.',
          );
        } else {
          assert.equal(
            actualGroup.indexOf(block) !== -1,
            false,
            'Unexpected block [' + block.type + '] in search results',
          );
          assert.equal(
            isBlockHighlighted(block),
            false,
            'Unexpected block [' + block.type + '] found highlighted.',
          );
        }
      }
    }
    setup(function () {
      Blockly.defineBlocksWithJsonArray([
        {
          type: 'test_block',
          message0: 'test block',
        },
        {
          type: 'test_statement_block',
          message0: '%test %1',
          args0: [
            {
              type: 'input_value',
              name: 'INPUT0',
              check: 'String',
            },
          ],
          message1: '%block %1',
          args1: [
            {
              type: 'input_statement',
              name: 'INPUT1',
            },
          ],
          previousStatement: null,
          nextStatement: null,
        },
        {
          type: 'test_text',
          message0: '%1',
          args0: [
            {
              type: 'field_input',
              name: 'NAME',
              text: 'test string',
            },
          ],
          output: null,
        },
      ]);
      this.testBlock = this.workspace.newBlock('test_block');
      this.testStatementBlock = this.workspace.newBlock('test_statement_block');
      this.testStatementBlockWithInput = this.workspace.newBlock(
        'test_statement_block',
      );
      this.fieldWithOutputConnected = this.workspace.newBlock('test_text');
      this.testStatementBlockWithInput.inputList[0].connection.connect(
        this.fieldWithOutputConnected.outputConnection,
      );
      this.testStatementBlockWithInputCollapsed = this.workspace.newBlock(
        'test_statement_block',
      );
      this.fieldWithOutputCollapsed = this.workspace.newBlock('test_text');
      this.testStatementBlockWithInputCollapsed.inputList[0].connection.connect(
        this.fieldWithOutputCollapsed.outputConnection,
      );
      this.testStatementBlockWithInputCollapsed.setCollapsed(true);
      this.fieldWithOutput = this.workspace.newBlock('test_text');

      this.blocks = [
        this.testBlock,
        this.testStatementBlock,
        this.testStatementBlockWithInput,
        this.testStatementBlockWithInputCollapsed,
        this.fieldWithOutputConnected,
        this.fieldWithOutputCollapsed,
        this.fieldWithOutput,
      ];

      sinon
        .stub(this.workspace, 'getAllBlocks')
        .returns(Object.values(this.blocks));
    });

    teardown(function () {
      delete Blockly.Blocks['test_block'];
      delete Blockly.Blocks['test_statement_block'];
      delete Blockly.Blocks['test_text'];
      sinon.restore();
    });

    test('Match all blocks', function () {
      this.workspaceSearch.searchAndHighlight('test', false);
      const expectedBlocks = [
        this.testBlock,
        this.testStatementBlock,
        this.testStatementBlockWithInput,
        this.testStatementBlockWithInputCollapsed,
        this.fieldWithOutputConnected,
        this.fieldWithOutput,
      ];
      assertEqualsSearchGroup(
        this.blocks,
        this.workspaceSearch.blocks,
        expectedBlocks,
      );
      assertNoExtraCurrentStyling(this.blocks, expectedBlocks[0]);
      assert.equal(
        isBlockHighlighted(this.fieldWithOutputCollapsed),
        false,
        'Expected field within a collapsed block to not be highlighted.',
      );
    });

    test('Match no blocks', function () {
      this.workspaceSearch.searchAndHighlight('none', false);
      assertEqualsSearchGroup(this.blocks, this.workspaceSearch.blocks, []);
      assertNoExtraCurrentStyling(this.blocks);
    });

    test('Match all non-fields', function () {
      this.workspaceSearch.searchAndHighlight('block', false);
      const expectedBlocks = [
        this.testBlock,
        this.testStatementBlock,
        this.testStatementBlockWithInput,
        this.testStatementBlockWithInputCollapsed,
      ];
      assertEqualsSearchGroup(
        this.blocks,
        this.workspaceSearch.blocks,
        expectedBlocks,
      );
      assertNoExtraCurrentStyling(this.blocks, expectedBlocks[0]);
    });

    test('Match all field and collapsed blocks', function () {
      this.workspaceSearch.searchAndHighlight('string', false);
      const expectedBlocks = [
        this.testStatementBlockWithInputCollapsed,
        this.fieldWithOutputConnected,
        this.fieldWithOutput,
      ];
      assertEqualsSearchGroup(
        this.blocks,
        this.workspaceSearch.blocks,
        expectedBlocks,
      );
      assertNoExtraCurrentStyling(this.blocks, expectedBlocks[0]);
    });

    test('Preserve current, in results', function () {
      this.workspaceSearch.searchAndHighlight('test');
      this.workspaceSearch.setCurrentBlock(1);
      // this.testStatementBlock should be current.
      const expectedBlocks = [
        this.testBlock,
        this.testStatementBlock,
        this.testStatementBlockWithInput,
        this.testStatementBlockWithInputCollapsed,
        this.fieldWithOutputConnected,
        this.fieldWithOutput,
      ];
      this.workspaceSearch.searchAndHighlight('test', true);
      assertEqualsSearchGroup(
        this.blocks,
        this.workspaceSearch.blocks,
        expectedBlocks,
      );
      assertNoExtraCurrentStyling(this.blocks, expectedBlocks[1]);
    });

    test('Preserve current, not in results', function () {
      this.workspaceSearch.searchAndHighlight('test');
      this.workspaceSearch.setCurrentBlock(1);
      // this.testStatementBlock should be current.
      this.workspaceSearch.searchAndHighlight('string', true);
      const expectedBlocks = [
        this.testStatementBlockWithInputCollapsed,
        this.fieldWithOutputConnected,
        this.fieldWithOutput,
      ];
      assertEqualsSearchGroup(
        this.blocks,
        this.workspaceSearch.blocks,
        expectedBlocks,
      );
      assertNoExtraCurrentStyling(this.blocks, expectedBlocks[0]);
    });
  });

  suite('next()', function () {
    setup(function () {
      Blockly.defineBlocksWithJsonArray([
        {
          type: 'test_block',
          message0: 'test block',
        },
        {
          type: 'test_statement_block',
          message0: '%test %1',
          args0: [
            {
              type: 'input_value',
              name: 'INPUT0',
              check: 'String',
            },
          ],
          message1: '%block %1',
          args1: [
            {
              type: 'input_statement',
              name: 'INPUT1',
            },
          ],
          previousStatement: null,
          nextStatement: null,
        },
      ]);
      this.testBlock = this.workspace.newBlock('test_block');
      this.testStatementBlock = this.workspace.newBlock('test_statement_block');
      this.blocks = [this.testBlock, this.testStatementBlock];
      this.workspaceSearch.blocks = this.blocks;
    });

    teardown(function () {
      delete Blockly.Blocks['test_block'];
      delete Blockly.Blocks['test_statement_block'];
      sinon.restore();
    });

    test('next() with unset current', function () {
      this.workspaceSearch.next();
      const currentIndex = this.workspaceSearch.currentBlockIndex;
      assert.equal(currentIndex, 0);
      assertNoExtraCurrentStyling(this.blocks, this.blocks[0]);
    });

    test('next() wrap around', function () {
      this.workspaceSearch.currentBlockIndex = 0;
      this.workspaceSearch.next();
      let currentIndex = this.workspaceSearch.currentBlockIndex;
      assert.equal(currentIndex, 1);
      assertNoExtraCurrentStyling(this.blocks, this.blocks[1]);
      this.workspaceSearch.next();
      currentIndex = this.workspaceSearch.currentBlockIndex;
      assert.equal(currentIndex, 0);
      assertNoExtraCurrentStyling(this.blocks, this.blocks[0]);
    });
  });

  suite('previous()', function () {
    setup(function () {
      Blockly.defineBlocksWithJsonArray([
        {
          type: 'test_block',
          message0: 'test block',
        },
        {
          type: 'test_statement_block',
          message0: '%test %1',
          args0: [
            {
              type: 'input_value',
              name: 'INPUT0',
              check: 'String',
            },
          ],
          message1: '%block %1',
          args1: [
            {
              type: 'input_statement',
              name: 'INPUT1',
            },
          ],
          previousStatement: null,
          nextStatement: null,
        },
      ]);
      this.testBlock = this.workspace.newBlock('test_block');
      this.testStatementBlock = this.workspace.newBlock('test_statement_block');
      this.blocks = [this.testBlock, this.testStatementBlock];
      this.workspaceSearch.blocks = this.blocks;
    });

    teardown(function () {
      delete Blockly.Blocks['test_block'];
      delete Blockly.Blocks['test_statement_block'];
      sinon.restore();
    });

    test('previous() with unset current', function () {
      this.workspaceSearch.previous();
      // No expected current index, but should not throw.
    });

    test('previous() wrap around', function () {
      this.workspaceSearch.currentBlockIndex = 1;
      this.workspaceSearch.previous();
      let currentIndex = this.workspaceSearch.currentBlockIndex;
      assert.equal(currentIndex, 0);
      assertNoExtraCurrentStyling(this.blocks, this.blocks[0]);
      this.workspaceSearch.previous();
      currentIndex = this.workspaceSearch.currentBlockIndex;
      assert.equal(currentIndex, 1);
      assertNoExtraCurrentStyling(this.blocks, this.blocks[1]);
    });
  });

  suite('focus', function () {
    suiteSetup(function () {
      Blockly.defineBlocksWithJsonArray([
        {
          type: 'alpha_block',
          message0: 'alpha',
        },
        {
          type: 'beta_block',
          message0: 'beta',
        },
      ]);
    });

    setup(function () {
      this.alphaBlock = this.workspace.newBlock('alpha_block');
      this.betaBlock = this.workspace.newBlock('beta_block');
      this.workspaceSearch.init();
      // Check starting position
      this.focusManager = Blockly.FocusManager.getFocusManager();
      this.focusManager.focusNode(this.alphaBlock);
      const originalBlock = /** @type {Blockly.BlockSvg} */ (
        this.focusManager.getFocusedNode()
      );
      assert.equal('alpha_block', originalBlock.type);
    });

    /**
     * @param {string} expected The expected block type.
     */
    function assertFocusedNodeType(expected) {
      const block = /** @type {Blockly.BlockSvg} */ (
        Blockly.FocusManager.getFocusManager().getFocusedNode()
      );
      assert.equal(expected, block.type);
    }

    test('close with match focuses found block', function () {
      this.workspaceSearch.searchAndHighlight('beta', false);
      this.workspaceSearch.close();

      assertFocusedNodeType('beta_block');
    });

    test('close with no match restores focus to workspace', function () {
      this.workspaceSearch.searchAndHighlight('nothingMatchesThis', false);
      this.workspaceSearch.close();

      // As of Blockly v13.1.0 the workspace is focused via a dedicated focus
      // target node (rather than the workspace itself being the focused node),
      // so focusing the workspace as a whole lands on that target.
      assert.equal(
        Blockly.getFocusManager().getFocusedNode(),
        this.workspace.getRestoredFocusableNode(),
      );
    });

    test('close with match followed by non-match still focuses last found block', function () {
      this.workspaceSearch.searchAndHighlight('beta', false);
      this.workspaceSearch.searchAndHighlight('nothingMatchesThis', false);
      this.workspaceSearch.close();

      assertFocusedNodeType('beta_block');
    });
  });
});
