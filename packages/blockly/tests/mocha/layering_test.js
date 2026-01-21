/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Layering', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.workspace = Blockly.inject('blocklyDiv', {});
    this.layerManager = this.workspace.getLayerManager();
  });

  teardown(function () {
    sharedTestTeardown.call(this);
  });

  function createRenderedElement() {
    const g = Blockly.utils.dom.createSvgElement('g', {});
    return {
      getSvgRoot: () => g,
      getFocusableElement: () => {
        throw new Error('Unsupported.');
      },
      getFocusableTree: () => {
        throw new Error('Unsupported.');
      },
      onNodeFocus: () => {},
      onNodeBlur: () => {},
      canBeFocused: () => false,
    };
  }

  suite('appending layers', function () {
    test('layer is not appended if it already exists', function () {
      const elem1 = createRenderedElement();
      const elem2 = createRenderedElement();
      this.layerManager.append(elem1, 999);

      const layerCount = this.layerManager.layers.size;
      this.layerManager.append(elem2, 999);

      assert.equal(
        this.layerManager.layers.size,
        layerCount,
        'Expected the element to be appended to the existing layer',
      );
    });

    test('more positive layers are appended after less positive layers', function () {
      // Checks that if the element comes after all elements, its still gets
      // appended.

      const elem1 = createRenderedElement();
      const elem2 = createRenderedElement();

      this.layerManager.append(elem1, 1000);
      this.layerManager.append(elem2, 1010);

      const layer1000 = this.layerManager.layers.get(1000);
      const layer1010 = this.layerManager.layers.get(1010);
      assert.equal(
        layer1000.nextSibling,
        layer1010,
        'Expected layer 1000 to be direclty before layer 1010',
      );
    });

    test('less positive layers are appended before more positive layers', function () {
      const elem1 = createRenderedElement();
      const elem2 = createRenderedElement();

      this.layerManager.append(elem1, 1010);
      this.layerManager.append(elem2, 1000);

      const layer1010 = this.layerManager.layers.get(1010);
      const layer1000 = this.layerManager.layers.get(1000);
      assert.equal(
        layer1000.nextSibling,
        layer1010,
        'Expected layer 1000 to be direclty before layer 1010',
      );
    });
  });

  suite('dragging', function () {
    test('moving an element to the drag layer adds it to the drag group', function () {
      const elem = createRenderedElement();

      this.layerManager.moveToDragLayer(elem);

      assert.equal(
        this.layerManager.dragLayer.firstChild,
        elem.getSvgRoot(),
        'Expected the element to be the first element in the drag layer.',
      );
    });
  });
});
