/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import sinon from 'sinon';
import * as Blockly from 'blockly';
import {shadowBlockConversionChangeListener} from '../src/index';

suite('shadowBlockConversionChangeListener', function () {
  /**
   * Create a parent block with an unconnected value connection.
   * @param {Blockly.Workspace} workspace The workspace to use.
   * @returns {Blockly.Connection} The connection.
   */
  function makeEmptyConnection(workspace) {
    return workspace.newBlock('text_reverse').inputList[0].connection;
  }

  /**
   * Create a parent block with an unconnected connection.
   * @param {Blockly.Connection} connection The connection to use.
   * @param {Blockly.serialization.blocks.State} shadowState The state for the
   *     shadow block.
   * @returns {Blockly.BlockSvg} The newly created shadow block.
   */
  function attachShadowBlock(connection, shadowState) {
    connection.setShadowState(shadowState);
    return /** @type {Blockly.BlockSvg} */ (connection.targetBlock());
  }

  setup(function () {
    this.jsdomCleanup = require('jsdom-global')(
      '<!DOCTYPE html><div id="blocklyDiv"></div>',
      {pretendToBeVisual: true},
    );
    // See https://github.com/RaspberryPiFoundation/blockly-samples/issues/2528 for context.
    global.SVGElement = window.SVGElement;

    this.workspace = Blockly.inject('blocklyDiv');
    this.workspace.addChangeListener(shadowBlockConversionChangeListener);

    // Prevent rendering, which does not work correctly in a headless jsdom
    // environment.
    this.renderEfficientlyStub = sinon
      .stub(Blockly.BlockSvg.prototype, 'renderEfficiently')
      .callsFake(() => {});

    this.clock = sinon.useFakeTimers();
    global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  });

  teardown(function () {
    this.workspace.dispose();
    // Finish any remaining queued events then dispose the sinon environment.
    this.clock.runAll();
    this.clock.restore();
    this.renderEfficientlyStub.restore();
    this.jsdomCleanup();
  });

  test('responds to field change', function () {
    const connection = makeEmptyConnection(this.workspace);
    const shadowBlock = attachShadowBlock(connection, {type: 'text'});
    shadowBlock.getField('TEXT').setValue('new value');
    this.clock.runAll();
    assert.isFalse(connection.targetBlock().isShadow());
  });

  test('responds to block change event', function () {
    const connection = makeEmptyConnection(this.workspace);
    const shadowBlock = attachShadowBlock(connection, {type: 'text'});
    const event = new Blockly.Events.BlockChange(
      shadowBlock,
      'field',
      'TEXT',
      'old value',
      'new value',
    );
    this.workspace.fireChangeListener(event);
    assert.isFalse(connection.targetBlock().isShadow());
  });

  test('ignores block move event', function () {
    const connection = makeEmptyConnection(this.workspace);
    const shadowBlock = attachShadowBlock(connection, {type: 'text'});
    const event = new Blockly.Events.BlockMove(shadowBlock);
    this.workspace.fireChangeListener(event);
    assert.isTrue(connection.targetBlock().isShadow());
  });

  // TODO(#2535): This test requires the focus manager to work correctly
  test.skip('undo shadow change', function () {
    const connection = makeEmptyConnection(this.workspace);
    const shadowBlock = attachShadowBlock(connection, {
      type: 'text',
      fields: {TEXT: 'old value'},
    });
    shadowBlock.getField('TEXT').setValue('new value');
    // Wait for the block change event to get handled by the shadow listener.
    this.clock.runAll();
    assert.isFalse(connection.targetBlock().isShadow());
    assert.equal(
      connection.targetBlock().getField('TEXT').getValue(),
      'new value',
    );
    // Wait for the shadow change event to get fired and recorded in history.
    this.clock.runAll();
    this.workspace.undo(false);
    assert.isTrue(connection.targetBlock().isShadow());
    assert.equal(
      connection.targetBlock().getField('TEXT').getValue(),
      'old value',
    );
  });

  // TODO(#2535): This test requires the focus manager to work correctly
  test.skip('redo shadow change', function () {
    const connection = makeEmptyConnection(this.workspace);
    const shadowBlock = attachShadowBlock(connection, {
      type: 'text',
      fields: {TEXT: 'old value'},
    });
    shadowBlock.getField('TEXT').setValue('new value');
    // Wait for the block change event to get handled by the shadow listener.
    this.clock.runAll();
    // Wait for the shadow change event to get fired and recorded in history.
    this.clock.runAll();
    this.workspace.undo(false);
    assert.isTrue(connection.targetBlock().isShadow());
    assert.equal(
      connection.targetBlock().getField('TEXT').getValue(),
      'old value',
    );
    this.workspace.undo(true);
    assert.isFalse(connection.targetBlock().isShadow());
    assert.equal(
      connection.targetBlock().getField('TEXT').getValue(),
      'new value',
    );
  });

  test('preserves original shadow state after edit', function () {
    const connection = makeEmptyConnection(this.workspace);
    const shadowState = {type: 'text', id: '123', fields: {TEXT: 'abc'}};
    const shadowBlock = attachShadowBlock(connection, shadowState);
    shadowBlock.getField('TEXT').setValue('new value');
    this.clock.runAll();
    assert.deepEqual(
      connection.getShadowState(/* returnCurrent= */ false),
      shadowState,
    );
  });

  // TODO(#2535): This test requires the focus manager to work correctly
  test.skip('preserves original shadow state after undo and redo', function () {
    const connection = makeEmptyConnection(this.workspace);
    const shadowState = {type: 'text', id: '123', fields: {TEXT: 'abc'}};
    const shadowBlock = attachShadowBlock(connection, shadowState);
    shadowBlock.getField('TEXT').setValue('new value');
    // Wait for the block change event to get handled by the shadow listener.
    this.clock.runAll();
    // Wait for the shadow change event to get fired and recorded in history.
    this.clock.runAll();
    this.workspace.undo(false);
    assert.deepEqual(
      connection.getShadowState(/* returnCurrent= */ false),
      shadowState,
    );
    this.workspace.undo(true);
    assert.deepEqual(
      connection.getShadowState(/* returnCurrent= */ false),
      shadowState,
    );
  });

  test('shadow change follows output connection', function () {
    const rootConnection = makeEmptyConnection(this.workspace);
    const parentShadowBlock = attachShadowBlock(rootConnection, {
      type: 'text_reverse',
    });
    const childShadowBlock = attachShadowBlock(
      parentShadowBlock.inputList[0].connection,
      {type: 'text'},
    );
    assert.isTrue(rootConnection.targetBlock().isShadow());
    assert.isTrue(
      rootConnection
        .targetBlock()
        .inputList[0].connection.targetBlock()
        .isShadow(),
    );
    childShadowBlock.getField('TEXT').setValue('new value');
    this.clock.runAll();
    assert.isFalse(rootConnection.targetBlock().isShadow());
    assert.isFalse(
      rootConnection
        .targetBlock()
        .inputList[0].connection.targetBlock()
        .isShadow(),
    );
  });

  test('shadow change follows previous connection', function () {
    const rootConnection = this.workspace.newBlock(
      'controls_whileUntil',
    ).nextConnection;
    const parentShadowBlock = attachShadowBlock(rootConnection, {
      type: 'controls_whileUntil',
    });
    const childShadowBlock = attachShadowBlock(
      parentShadowBlock.nextConnection,
      {type: 'controls_whileUntil'},
    );
    assert.isTrue(rootConnection.targetBlock().isShadow());
    assert.isTrue(
      rootConnection.targetBlock().nextConnection.targetBlock().isShadow(),
    );
    childShadowBlock.getField('MODE').setValue('UNTIL');
    this.clock.runAll();
    assert.isFalse(rootConnection.targetBlock().isShadow());
    assert.isFalse(
      rootConnection.targetBlock().nextConnection.targetBlock().isShadow(),
    );
  });

  // TODO(#2535): These tests require the focus manager to work correctly
  suite.skip('Selection', function () {
    test('Transfers selection to new block', function () {
      const connection =
        this.workspace.newBlock('text_reverse').inputList[0].connection;
      const shadowBlock = attachShadowBlock(connection, {type: 'text'});

      // Select the shadow block.
      Blockly.common.setSelected(shadowBlock);
      assert.isTrue(
        Blockly.common.getSelected() === shadowBlock,
        'Expected original shadow block to be selected',
      );

      // Modify the shadow block, triggering its replacement.
      shadowBlock.getField('TEXT').setValue('new value');
      this.clock.runAll();
      assert.isFalse(
        connection.targetBlock().isShadow(),
        'Expected modifed block to no longer be a shadow',
      );

      // The replacement block should now be selected.
      assert.isTrue(
        Blockly.common.getSelected() === connection.targetBlock(),
        'Expected replacement block to be selected',
      );
    });
  });
});
