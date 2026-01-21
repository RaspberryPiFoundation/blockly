/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as chai from 'chai';
import {testFileLocations, testSetup} from './test_setup.mjs';

suite('Workspace comments', function () {
  // Setting timeout to unlimited as the webdriver takes a longer time
  // to run than most mocha test
  this.timeout(0);

  suiteSetup(async function () {
    this.browser = await testSetup(
      testFileLocations.PLAYGROUND + '?toolbox=test-blocks',
    );
  });

  teardown(async function () {
    await this.browser.execute(() => {
      Blockly.getMainWorkspace().clear();
    });
  });

  async function createComment(browser) {
    return await browser.execute(() => {
      const comment = new Blockly.comments.RenderedWorkspaceComment(
        Blockly.getMainWorkspace(),
      );
      return comment.id;
    });
  }

  async function hasClass(elem, className) {
    return (await elem.getAttribute('class')).split(' ').includes(className);
  }

  suite('Collapsing and uncollapsing', function () {
    async function isCommentCollapsed(browser, id) {
      return await browser.execute(
        (id) => Blockly.getMainWorkspace().getCommentById(id).isCollapsed(),
        id,
      );
    }

    suite('Collapsing', function () {
      test('collapsing updates the collapse value', async function () {
        const commentId = await createComment(this.browser);

        const foldout = await this.browser.$(
          '.blocklyComment .blocklyFoldoutIcon',
        );
        await foldout.click();

        chai.assert.isTrue(
          await isCommentCollapsed(this.browser, commentId),
          'Expected the comment to be collapsed',
        );
      });

      test('collapsing adds the css class', async function () {
        await createComment(this.browser);

        const foldout = await this.browser.$(
          '.blocklyComment .blocklyFoldoutIcon',
        );
        await foldout.click();

        const comment = await this.browser.$('.blocklyComment');
        chai.assert.isTrue(
          await hasClass(comment, 'blocklyCollapsed'),
          'Expected the comment to have the blocklyCollapsed class',
        );
      });
    });

    suite('Uncollapsing', function () {
      async function collapseComment(browser, id) {
        await browser.execute((id) => {
          Blockly.getMainWorkspace().getCommentById(id).setCollapsed(true);
        }, id);
      }

      test('collapsing updates the collapse value', async function () {
        const commentId = await createComment(this.browser);
        await collapseComment(this.browser, commentId);

        const foldout = await this.browser.$(
          '.blocklyComment .blocklyFoldoutIcon',
        );
        await foldout.click();

        chai.assert.isFalse(
          await isCommentCollapsed(this.browser, commentId),
          'Expected the comment to not be collapsed',
        );
      });

      test('collapsing adds the css class', async function () {
        const commentId = await createComment(this.browser);
        await collapseComment(this.browser, commentId);

        const foldout = await this.browser.$(
          '.blocklyComment .blocklyFoldoutIcon',
        );
        await foldout.click();

        const comment = await this.browser.$('.blocklyComment');
        chai.assert.isFalse(
          await hasClass(comment, 'blocklyCollapsed'),
          'Expected the comment to not have the blocklyCollapsed class',
        );
      });
    });
  });

  suite('Deleting', function () {
    async function makeDeleteVisible(browser, commentId) {
      await browser.execute((id) => {
        document.querySelector(
          '.blocklyComment .blocklyDeleteIcon',
        ).style.display = 'block';
        const comment = Blockly.getMainWorkspace().getCommentById(id);
        comment.setSize(comment.getSize());
      }, commentId);
    }

    async function commentIsDisposed(browser, commentId) {
      return await browser.execute(
        (id) => !Blockly.getMainWorkspace().getCommentById(id),
        commentId,
      );
    }

    test('deleting disposes of comment', async function () {
      const commentId = await createComment(this.browser);
      await makeDeleteVisible(this.browser, commentId);

      const deleteIcon = await this.browser.$(
        '.blocklyComment .blocklyDeleteIcon',
      );
      await deleteIcon.click();

      chai.assert.isTrue(
        await commentIsDisposed(this.browser, commentId),
        'Expected the comment model to be disposed',
      );
    });

    test('deleting disposes of DOM elements', async function () {
      const commentId = await createComment(this.browser);
      await makeDeleteVisible(this.browser, commentId);

      const deleteIcon = await this.browser.$(
        '.blocklyComment .blocklyDeleteIcon',
      );
      await deleteIcon.click();

      chai.assert.isFalse(
        await this.browser.$('.blocklyComment').isExisting(),
        'Expected the comment DOM elements to not exist',
      );
    });
  });

  suite('Typing', function () {
    async function getCommentText(browser, id) {
      return await browser.execute(
        (id) => Blockly.getMainWorkspace().getCommentById(id).getText(),
        id,
      );
    }

    test('typing updates the text value', async function () {
      const commentId = await createComment(this.browser);

      const textArea = await this.browser.$('.blocklyComment .blocklyTextarea');
      await textArea.addValue('test text');
      // Deselect text area to fire browser change event.
      await this.browser.$('.blocklyWorkspace').click();

      chai.assert.equal(
        await getCommentText(this.browser, commentId),
        'test text',
        'Expected the comment model text to match the entered text',
      );
    });
  });

  suite('Resizing', function () {
    async function getCommentSize(browser, id) {
      return await browser.execute(
        (id) => Blockly.getMainWorkspace().getCommentById(id).getSize(),
        id,
      );
    }

    test('resizing updates the size value', async function () {
      const commentId = await createComment(this.browser);
      const origSize = await getCommentSize(this.browser, commentId);
      const delta = {x: 20, y: 20};

      const resizeHandle = await this.browser.$(
        '.blocklyComment .blocklyResizeHandle',
      );
      await resizeHandle.dragAndDrop(delta);
      const newSize = await getCommentSize(this.browser, commentId);
      chai.assert.isTrue(
        Math.abs(newSize.width - (origSize.width + delta.x)) < 1,
        'Expected the comment model size to match the resized size',
      );
      chai.assert.isTrue(
        Math.abs(newSize.height - (origSize.height + delta.y)) < 1,
        'Expected the comment model size to match the resized size',
      );
    });
  });
});
