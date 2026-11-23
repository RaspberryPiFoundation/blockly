/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from '#core/blockly.js';
import {assert} from 'chai';
import sinon from 'sinon';
import {
  DEFAULT_INJECT_OPTIONS,
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Workspace comment', function () {
  let workspace: Blockly.WorkspaceSvg;
  let commentView: Blockly.comments.CommentView;

  setup(function (this: Mocha.Context) {
    sharedTestSetup.call(this);
    workspace = Blockly.inject('blocklyDiv', DEFAULT_INJECT_OPTIONS);
    commentView = new Blockly.comments.CommentView(
      workspace,
      'test-comment-id',
    );
  });

  teardown(function (this: Mocha.Context) {
    sharedTestTeardown.call(this, workspace);
  });

  suite('Listeners', function () {
    suite('Text change listeners', function () {
      test('text change listeners are called when text is changed', function () {
        const spy = sinon.spy();
        commentView.addTextChangeListener(spy);

        commentView.setText('test');

        assert.isTrue(spy.calledOnce, 'Expected the spy to be called once');
        assert.isTrue(
          spy.calledWith('', 'test'),
          'Expected the spy to be called with the given args',
        );
      });

      test('text change listeners can remove themselves without skipping others', function () {
        const fake1 = sinon.fake();
        const fake2: sinon.SinonSpy = sinon.fake(() =>
          commentView.removeTextChangeListener(fake2),
        );
        const fake3 = sinon.fake();
        commentView.addTextChangeListener(fake1);
        commentView.addTextChangeListener(fake2);
        commentView.addTextChangeListener(fake3);

        commentView.setText('test');

        assert.isTrue(
          fake1.calledOnce,
          'Expected the first listener to be called',
        );
        assert.isTrue(
          fake2.calledOnce,
          'Expected the second listener to be called',
        );
        assert.isTrue(
          fake3.calledOnce,
          'Expected the third listener to be called',
        );
      });
    });

    suite('Size change listeners', function () {
      test('size change listeners are called when text is changed', function () {
        const spy = sinon.spy();
        commentView.addSizeChangeListener(spy);
        const originalSize = commentView.getSize();
        const newSize = new Blockly.utils.Size(1337, 1337);

        commentView.setSize(newSize);

        assert.isTrue(spy.calledOnce, 'Expected the spy to be called once');
        assert.isTrue(
          spy.calledWith(originalSize, newSize),
          'Expected the spy to be called with the given args',
        );
      });

      test('size change listeners can remove themselves without skipping others', function () {
        const fake1 = sinon.fake();
        const fake2: sinon.SinonSpy = sinon.fake(() =>
          commentView.removeSizeChangeListener(fake2),
        );
        const fake3 = sinon.fake();
        commentView.addSizeChangeListener(fake1);
        commentView.addSizeChangeListener(fake2);
        commentView.addSizeChangeListener(fake3);
        const newSize = new Blockly.utils.Size(1337, 1337);

        commentView.setSize(newSize);

        assert.isTrue(
          fake1.calledOnce,
          'Expected the first listener to be called',
        );
        assert.isTrue(
          fake2.calledOnce,
          'Expected the second listener to be called',
        );
        assert.isTrue(
          fake3.calledOnce,
          'Expected the third listener to be called',
        );
      });
    });

    suite('Collapse change listeners', function () {
      test('collapse change listeners are called when text is changed', function () {
        const spy = sinon.spy();
        commentView.addOnCollapseListener(spy);

        commentView.setCollapsed(true);

        assert.isTrue(spy.calledOnce, 'Expected the spy to be called once');
        assert.isTrue(
          spy.calledWith(true),
          'Expected the spy to be called with the given args',
        );
      });

      test('collapse change listeners can remove themselves without skipping others', function () {
        const fake1 = sinon.fake();
        const fake2: sinon.SinonSpy = sinon.fake(() =>
          commentView.removeOnCollapseListener(fake2),
        );
        const fake3 = sinon.fake();
        commentView.addOnCollapseListener(fake1);
        commentView.addOnCollapseListener(fake2);
        commentView.addOnCollapseListener(fake3);

        commentView.setCollapsed(true);

        assert.isTrue(
          fake1.calledOnce,
          'Expected the first listener to be called',
        );
        assert.isTrue(
          fake2.calledOnce,
          'Expected the second listener to be called',
        );
        assert.isTrue(
          fake3.calledOnce,
          'Expected the third listener to be called',
        );
      });
    });

    suite('Dispose change listeners', function () {
      test('dispose listeners are called when text is changed', function () {
        const spy = sinon.spy();
        commentView.addDisposeListener(spy);

        commentView.dispose();

        assert.isTrue(spy.calledOnce, 'Expected the spy to be called once');
      });

      test('dispose listeners can remove themselves without skipping others', function () {
        const fake1 = sinon.fake();
        const fake2: sinon.SinonSpy = sinon.fake(() =>
          commentView.removeDisposeListener(fake2),
        );
        const fake3 = sinon.fake();
        commentView.addDisposeListener(fake1);
        commentView.addDisposeListener(fake2);
        commentView.addDisposeListener(fake3);

        commentView.dispose();

        assert.isTrue(
          fake1.calledOnce,
          'Expected the first listener to be called',
        );
        assert.isTrue(
          fake2.calledOnce,
          'Expected the second listener to be called',
        );
        assert.isTrue(
          fake3.calledOnce,
          'Expected the third listener to be called',
        );
      });
    });
  });
});
