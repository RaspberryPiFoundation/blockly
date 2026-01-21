/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Workspace comment', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = new Blockly.inject('blocklyDiv', {});
    this.commentView = new Blockly.comments.CommentView(this.workspace);
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Listeners', function () {
    suite('Text change listeners', function () {
      test('text change listeners are called when text is changed', function () {
        const spy = sinon.spy();
        this.commentView.addTextChangeListener(spy);

        this.commentView.setText('test');

        assert.isTrue(spy.calledOnce, 'Expected the spy to be called once');
        assert.isTrue(
          spy.calledWith('', 'test'),
          'Expected the spy to be called with the given args',
        );
      });

      test('text change listeners can remove themselves without skipping others', function () {
        const fake1 = sinon.fake();
        const fake2 = sinon.fake(() =>
          this.commentView.removeTextChangeListener(fake2),
        );
        const fake3 = sinon.fake();
        this.commentView.addTextChangeListener(fake1);
        this.commentView.addTextChangeListener(fake2);
        this.commentView.addTextChangeListener(fake3);

        this.commentView.setText('test');

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
        this.commentView.addSizeChangeListener(spy);
        const originalSize = this.commentView.getSize();
        const newSize = new Blockly.utils.Size(1337, 1337);

        this.commentView.setSize(newSize);

        assert.isTrue(spy.calledOnce, 'Expected the spy to be called once');
        assert.isTrue(
          spy.calledWith(originalSize, newSize),
          'Expected the spy to be called with the given args',
        );
      });

      test('size change listeners can remove themselves without skipping others', function () {
        const fake1 = sinon.fake();
        const fake2 = sinon.fake(() =>
          this.commentView.removeSizeChangeListener(fake2),
        );
        const fake3 = sinon.fake();
        this.commentView.addSizeChangeListener(fake1);
        this.commentView.addSizeChangeListener(fake2);
        this.commentView.addSizeChangeListener(fake3);
        const newSize = new Blockly.utils.Size(1337, 1337);

        this.commentView.setSize(newSize);

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
        this.commentView.addOnCollapseListener(spy);

        this.commentView.setCollapsed(true);

        assert.isTrue(spy.calledOnce, 'Expected the spy to be called once');
        assert.isTrue(
          spy.calledWith(true),
          'Expected the spy to be called with the given args',
        );
      });

      test('collapse change listeners can remove themselves without skipping others', function () {
        const fake1 = sinon.fake();
        const fake2 = sinon.fake(() =>
          this.commentView.removeOnCollapseListener(fake2),
        );
        const fake3 = sinon.fake();
        this.commentView.addOnCollapseListener(fake1);
        this.commentView.addOnCollapseListener(fake2);
        this.commentView.addOnCollapseListener(fake3);

        this.commentView.setCollapsed(true);

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
        this.commentView.addDisposeListener(spy);

        this.commentView.dispose();

        assert.isTrue(spy.calledOnce, 'Expected the spy to be called once');
      });

      test('dispose listeners can remove themselves without skipping others', function () {
        const fake1 = sinon.fake();
        const fake2 = sinon.fake(() =>
          this.commentView.removeDisposeListener(fake2),
        );
        const fake3 = sinon.fake();
        this.commentView.addDisposeListener(fake1);
        this.commentView.addDisposeListener(fake2);
        this.commentView.addDisposeListener(fake3);

        this.commentView.dispose();

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
