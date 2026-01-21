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

suite('Rect', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.createCoord = function (x, y) {
      return new Blockly.utils.Coordinate(x, y);
    };
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });

  suite('Rect()', function () {
    test('initializes properties correctly', function () {
      const rect = new Blockly.utils.Rect(1, 2, 3, 4);

      assert.equal(rect.top, 1, 'top should be initialized');
      assert.equal(rect.bottom, 2, 'bottom should be initialized');
      assert.equal(rect.left, 3, 'left should be initialized');
      assert.equal(rect.right, 4, 'right should be initialized');
    });
  });

  suite('createFromPoint()', function () {
    test('initializes properties correctly', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );

      assert.equal(rect.top, 2, 'top should be initialized');
      assert.equal(rect.bottom, 47, 'bottom should be initialized');
      assert.equal(rect.left, 1, 'left should be initialized');
      assert.equal(rect.right, 24, 'right should be initialized');
    });
  });

  suite('clone()', function () {
    test('copies properties correctly', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );

      const clonedRect = rect.clone();

      assert.equal(clonedRect.top, rect.top, 'top should be cloned');
      assert.equal(clonedRect.bottom, rect.bottom, 'bottom should be cloned');
      assert.equal(clonedRect.left, rect.left, 'left should be cloned');
      assert.equal(clonedRect.right, rect.right, 'right should be cloned');
    });
  });

  suite('equals()', function () {
    test('same object instance should equal itself', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );

      const areEqual = Blockly.utils.Rect.equals(rect, rect);

      assert.isTrue(areEqual, 'an instance should equal itself');
    });

    test('null instances should be equal', function () {
      const areEqual = Blockly.utils.Rect.equals(null, null);

      assert.isTrue(areEqual, 'null should equal null');
    });

    test('an object and null should not be equal', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );

      const areEqual = Blockly.utils.Rect.equals(rect, null);

      assert.isFalse(areEqual, 'non-null should not equal null');
    });

    test('null and an object should not be equal', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );

      const areEqual = Blockly.utils.Rect.equals(null, rect);

      assert.isFalse(areEqual, 'null should not equal non-null');
    });

    test('object should equal its clone', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );

      const areEqual = Blockly.utils.Rect.equals(rect, rect.clone());

      assert.isTrue(areEqual, 'an instance and its clone should be equal');
    });

    test('object should equal an exact explicit copy', function () {
      const rect1 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );
      const rect2 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );

      const areEqual = Blockly.utils.Rect.equals(rect1, rect2);

      assert.isTrue(
        areEqual,
        'two objects constructed in the same way should be equal',
      );
    });

    test('object should not equal object with different x position', function () {
      const rect1 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );
      const rect2 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(3, 2),
        23,
        45,
      );

      const areEqual = Blockly.utils.Rect.equals(rect1, rect2);

      assert.isFalse(
        areEqual,
        'two objects with different x positions should not be equal',
      );
    });

    test('object should not equal object with different y position', function () {
      const rect1 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );
      const rect2 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 4),
        23,
        45,
      );

      const areEqual = Blockly.utils.Rect.equals(rect1, rect2);

      assert.isFalse(
        areEqual,
        'two objects with different y positions should not be equal',
      );
    });

    test('object should not equal object with different x and y positions', function () {
      const rect1 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );
      const rect2 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(3, 4),
        23,
        45,
      );

      const areEqual = Blockly.utils.Rect.equals(rect1, rect2);

      assert.isFalse(
        areEqual,
        'two objects with different x/y positions should not be equal',
      );
    });

    test('object should not equal object with different width', function () {
      const rect1 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );
      const rect2 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        46,
        45,
      );

      const areEqual = Blockly.utils.Rect.equals(rect1, rect2);

      assert.isFalse(
        areEqual,
        'two objects with different widths should not be equal',
      );
    });

    test('object should not equal object with different height', function () {
      const rect1 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );
      const rect2 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        89,
      );

      const areEqual = Blockly.utils.Rect.equals(rect1, rect2);

      assert.isFalse(
        areEqual,
        'two objects with different heights should not be equal',
      );
    });

    test('object should not equal object with all different properties', function () {
      const rect1 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        23,
        45,
      );
      const rect2 = Blockly.utils.Rect.createFromPoint(
        this.createCoord(3, 4),
        46,
        89,
      );

      const areEqual = Blockly.utils.Rect.equals(rect1, rect2);

      assert.isFalse(
        areEqual,
        'two objects with all different properties should not be equal',
      );
    });
  });

  suite('getHeight()', function () {
    test('computes zero height for empty rectangle', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(0, 0),
        0,
        0,
      );

      assert.equal(rect.getHeight(), 0, 'height should be 0');
    });

    test('computes height of 1 for unit square rectangle', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(0, 0),
        1,
        1,
      );

      assert.equal(rect.getHeight(), 1, 'height should be 1');
    });

    test('computes height of 1 for unit square rectangle not at origin', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        1,
        1,
      );

      assert.equal(rect.getHeight(), 1, 'height should be 1');
    });

    test('computes height of 1 for unit square rectangle with negative position', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(-1, -2),
        1,
        1,
      );

      assert.equal(rect.getHeight(), 1, 'height should be 1');
    });

    test('computes decimal height for non-square rectangle not at origin', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1.1, 2.2),
        3.3,
        4.4,
      );

      assert.approximately(rect.getHeight(), 4.4, 1e-5, 'height should be 4.4');
    });
  });

  suite('getWidth()', function () {
    test('computes zero width for empty rectangle', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(0, 0),
        0,
        0,
      );

      assert.equal(rect.getWidth(), 0, 'width should be 0');
    });

    test('computes width of 1 for unit square rectangle', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(0, 0),
        1,
        1,
      );

      assert.equal(rect.getWidth(), 1, 'width should be 1');
    });

    test('computes width of 1 for unit square rectangle not at origin', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1, 2),
        1,
        1,
      );

      assert.equal(rect.getWidth(), 1, 'width should be 1');
    });

    test('computes width of 1 for unit square rectangle with negative position', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(-1, -2),
        1,
        1,
      );

      assert.equal(rect.getWidth(), 1, 'width should be 1');
    });

    test('computes decimal width for non-square rectangle not at origin', function () {
      const rect = Blockly.utils.Rect.createFromPoint(
        this.createCoord(1.1, 2.2),
        3.3,
        4.4,
      );

      assert.approximately(rect.getWidth(), 3.3, 1e-5, 'width should be 3.3');
    });
  });

  suite('contains()', function () {
    suite('point contained within rect', function () {
      test('origin for zero-sized square', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(0, 0),
          0,
          0,
        );

        const isContained = rect.contains(0, 0);

        assert.isTrue(isContained, 'Rect contains (0, 0)');
      });

      test('whole number centroid for square at origin', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(0, 0),
          2,
          2,
        );

        const isContained = rect.contains(1, 1);

        assert.isTrue(isContained, 'Rect contains (1, 1)');
      });

      test('decimal number centroid for square at origin', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(0, 0),
          1,
          1,
        );

        const isContained = rect.contains(0.5, 0.5);

        assert.isTrue(isContained, 'Rect contains (0.5, 0.5)');
      });

      test('centroid for non-square not at origin', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(2.5, 4);

        assert.isTrue(isContained, 'Rect contains (2.5, 4)');
      });

      test('negative centroid for non-square not at origin', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(-10, -20),
          3,
          5,
        );

        const isContained = rect.contains(-8.5, -17.5);

        assert.isTrue(isContained, 'Rect contains (-8.5, -17.5)');
      });

      test('NW corner', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(1, 2);

        assert.isTrue(isContained, 'Rect contains (1, 2)');
      });

      test('NE corner', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(4, 2);

        assert.isTrue(isContained, 'Rect contains (4, 2)');
      });

      test('SW corner', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(1, 6);

        assert.isTrue(isContained, 'Rect contains (1, 6)');
      });

      test('SE corner', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(4, 6);

        assert.isTrue(isContained, 'Rect contains (4, 6)');
      });

      test('left edge midpoint', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(1, 4);

        assert.isTrue(isContained, 'Rect contains (1, 4)');
      });

      test('right edge midpoint', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(4, 4);

        assert.isTrue(isContained, 'Rect contains (4, 4)');
      });

      test('top edge midpoint', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(2.5, 2);

        assert.isTrue(isContained, 'Rect contains (2.5, 2)');
      });

      test('bottom edge midpoint', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(2.5, 6);

        assert.isTrue(isContained, 'Rect contains (2.5, 6)');
      });
    });
    suite('point not contained within rect', function () {
      test('non-origin for zero-sized square', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(0, 0),
          0,
          0,
        );

        const isContained = rect.contains(0.1, 0.1);

        assert.isFalse(isContained, 'Rect does not contain (0.1, 0.1)');
      });

      test('point at midpoint x but above unit square', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );

        const isContained = rect.contains(2, 0);

        assert.isFalse(isContained, 'Rect does not contain (2, 0)');
      });

      test('point at midpoint x but below unit square', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );

        const isContained = rect.contains(2, 4);

        assert.isFalse(isContained, 'Rect does not contain (2, 4)');
      });

      test('point at midpoint y but left of unit square', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );

        const isContained = rect.contains(0, 2);

        assert.isFalse(isContained, 'Rect does not contain (0, 2)');
      });

      test('point at midpoint y but right of unit square', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );

        const isContained = rect.contains(4, 2);

        assert.isFalse(isContained, 'Rect does not contain (4, 2)');
      });

      test('positive point far outside positive rectangle', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(45, 89);

        assert.isFalse(isContained, 'Rect does not contain (45, 89)');
      });

      test('negative point far outside positive rectangle', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(-45, -89);

        assert.isFalse(isContained, 'Rect does not contain (-45, -89)');
      });

      test('positive point far outside negative rectangle', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(-10, -20),
          3,
          5,
        );

        const isContained = rect.contains(45, 89);

        assert.isFalse(isContained, 'Rect does not contain (45, 89)');
      });

      test('negative point far outside negative rectangle', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(-10, -20),
          3,
          5,
        );

        const isContained = rect.contains(-45, -89);

        assert.isFalse(isContained, 'Rect does not contain (-45, -89)');
      });

      test('Point just outside NW corner', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(0.9, 1.9);

        assert.isFalse(isContained, 'Rect does not contain (0.9, 1.9)');
      });

      test('Point just outside NE corner', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(4.1, 1.9);

        assert.isFalse(isContained, 'Rect does not contain (4.1, 1.9)');
      });

      test('Point just outside SW corner', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(0.9, 6.1);

        assert.isFalse(isContained, 'Rect does not contain (0.9, 6.1)');
      });

      test('Point just outside SE corner', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(4.1, 6.1);

        assert.isFalse(isContained, 'Rect does not contain (4.1, 6.1)');
      });

      test('Point just outside left edge midpoint', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(0.9, 4);

        assert.isFalse(isContained, 'Rect does not contain (0.9, 4)');
      });

      test('Point just outside right edge midpoint', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(4.1, 4);

        assert.isFalse(isContained, 'Rect does not contain (4.1, 4)');
      });

      test('Point just outside top edge midpoint', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(2.5, 1.9);

        assert.isFalse(isContained, 'Rect does not contain (2.5, 1.9)');
      });

      test('Point just outside bottom edge midpoint', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          3,
          4,
        );

        const isContained = rect.contains(2.5, 6.1);

        assert.isFalse(isContained, 'Rect does not contain (2.5, 6.1)');
      });
    });
  });

  // NOTE TO DEVELOPER: For intersection tests, rects are either large (dimension size '2') or small
  // (dimension size '1'). For compactness, the comments denoting the scenario being tested try to
  // label larger rects with '2' where they can fit, but smaller rects are generally too small to
  // fit any text.
  suite('intersects()', function () {
    suite('does intersect', function () {
      test('rect and itself', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          23,
          45,
        );

        const doIntersect = rect.intersects(rect);

        assert.isTrue(doIntersect, 'a rect always intersects with itself');
      });

      test('rect and its clone', function () {
        const rect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          23,
          45,
        );

        const doIntersect = rect.intersects(rect.clone());

        assert.isTrue(doIntersect, 'a rect always intersects with its clone');
      });

      test('two rects of the same positions and dimensions', function () {
        const rect1 = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          23,
          45,
        );
        const rect2 = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          23,
          45,
        );

        const doIntersect = rect1.intersects(rect2);

        assert.isTrue(
          doIntersect,
          'two rects with the same positions and dimensions intersect',
        );
      });

      test('upper left/lower right', function () {
        // ┌───┐
        // │2┌───┐
        // └─│─┘2│
        //   └───┘
        const nwRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const seRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(2, 2),
          2,
          2,
        );

        const doIntersectOneWay = nwRect.intersects(seRect);
        const doIntersectOtherWay = seRect.intersects(nwRect);

        assert.isTrue(
          doIntersectOneWay,
          'SE corner of NW rect intersects with SE rect',
        );
        assert.isTrue(
          doIntersectOtherWay,
          'NW corner of SE rect intersects with NW rect',
        );
      });

      test('upper right/lower left', function () {
        //   ┌───┐
        // ┌───┐2│
        // │2└─│─┘
        // └───┘
        const neRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(2, 1),
          2,
          2,
        );
        const swRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          2,
          2,
        );

        const doIntersectOneWay = neRect.intersects(swRect);
        const doIntersectOtherWay = swRect.intersects(neRect);

        assert.isTrue(
          doIntersectOneWay,
          'SW corner of NE rect intersects with SW rect',
        );
        assert.isTrue(
          doIntersectOtherWay,
          'NE corner of SW rect intersects with NE rect',
        );
      });

      test('small rect overlapping left side of big rect', function () {
        //   ┌────┐
        // ┌───┐2 │
        // └───┘  │
        //   └────┘
        const bigRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const smallRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(0.5, 1.5),
          1,
          1,
        );

        const doIntersectOneWay = bigRect.intersects(smallRect);
        const doIntersectOtherWay = smallRect.intersects(bigRect);

        assert.isTrue(
          doIntersectOneWay,
          'big rect intersects top/bottom sides of small rect',
        );
        assert.isTrue(
          doIntersectOtherWay,
          'small rect intersects left side of big rect',
        );
      });

      test('small rect overlapping right side of big rect', function () {
        // ┌────┐
        // │ 2┌───┐
        // │  └───┘
        // └────┘
        const bigRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const smallRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(2.5, 1.5),
          1,
          1,
        );

        const doIntersectOneWay = bigRect.intersects(smallRect);
        const doIntersectOtherWay = smallRect.intersects(bigRect);

        assert.isTrue(
          doIntersectOneWay,
          'big rect intersects top/bottom sides of small rect',
        );
        assert.isTrue(
          doIntersectOtherWay,
          'small rect intersects right side of big rect',
        );
      });

      test('small rect overlapping top side of big rect', function () {
        //  ┌─┐
        // ┌│─│┐
        // │└─┘│
        // └───┘
        const bigRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const smallRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1.5, 0.5),
          1,
          1,
        );

        const doIntersectOneWay = bigRect.intersects(smallRect);
        const doIntersectOtherWay = smallRect.intersects(bigRect);

        assert.isTrue(
          doIntersectOneWay,
          'big rect intersects left/right sides of small rect',
        );
        assert.isTrue(
          doIntersectOtherWay,
          'small rect intersects top side of big rect',
        );
      });

      test('small rect overlapping bottom side of big rect', function () {
        // ┌───┐
        // │┌─┐│
        // └│─│┘
        //  └─┘
        const bigRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const smallRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1.5, 2.5),
          1,
          1,
        );

        const doIntersectOneWay = bigRect.intersects(smallRect);
        const doIntersectOtherWay = smallRect.intersects(bigRect);

        assert.isTrue(
          doIntersectOneWay,
          'big rect intersects left/right sides of small rect',
        );
        assert.isTrue(
          doIntersectOtherWay,
          'small rect intersects bottom side of big rect',
        );
      });

      test('edge only intersection with all corners outside each rect', function () {
        //   ┌─┐
        //   │ │
        // ┌─────┐
        // └─────┘
        //   │ │
        //   └─┘
        const tallRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(2, 1),
          1,
          2,
        );
        const wideRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          2,
          1,
        );

        const doIntersectOneWay = tallRect.intersects(wideRect);
        const doIntersectOtherWay = wideRect.intersects(tallRect);

        assert.isTrue(
          doIntersectOneWay,
          'tall rect intersects top/bottom of wide rect',
        );
        assert.isTrue(
          doIntersectOtherWay,
          'wide rect intersects left/right of tall rect',
        );
      });

      test('small rect within larger rect', function () {
        // ┌─────┐
        // │ ┌─┐ │
        // │ └─┘ │
        // └─────┘
        const bigRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const smallRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1.5, 1.5),
          1,
          1,
        );

        const doIntersectOneWay = bigRect.intersects(smallRect);
        const doIntersectOtherWay = smallRect.intersects(bigRect);

        assert.isTrue(
          doIntersectOneWay,
          'big rect intersects small rect since it is contained',
        );
        assert.isTrue(
          doIntersectOtherWay,
          'small rect intersects big rect since it is contained',
        );
      });

      test('rects overlapping on left/right sides', function () {
        // ┌──┌────┐
        // │ 2│ │2 │
        // └──└────┘
        const leftRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const rightRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(2, 1),
          2,
          2,
        );

        const doIntersectOneWay = leftRect.intersects(rightRect);
        const doIntersectOtherWay = rightRect.intersects(leftRect);

        assert.isTrue(
          doIntersectOneWay,
          "Left rect's right overlaps with right rect's left",
        );
        assert.isTrue(
          doIntersectOtherWay,
          "Right rect's left overlaps with left rect's right",
        );
      });

      test('rects overlapping on top/bottom sides', function () {
        // ┌───┐
        // ┌───┐
        // │───│
        // └───┘
        const topRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const bottomRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2),
          2,
          2,
        );

        const doIntersectOneWay = topRect.intersects(bottomRect);
        const doIntersectOtherWay = bottomRect.intersects(topRect);

        assert.isTrue(
          doIntersectOneWay,
          "Top rect's bottom overlaps with bottom rect's top",
        );
        assert.isTrue(
          doIntersectOtherWay,
          "Bottom rect's top overlaps with top rect's bottom",
        );
      });

      test('rects adjacent on left/right sides', function () {
        // ┌───┬───┐
        // │ 2 │ 2 │
        // └───┴───┘
        const leftRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const rightRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(3, 1),
          2,
          2,
        );

        const doIntersectOneWay = leftRect.intersects(rightRect);
        const doIntersectOtherWay = rightRect.intersects(leftRect);

        assert.isTrue(
          doIntersectOneWay,
          "Left rect's right intersects with right rect's left",
        );
        assert.isTrue(
          doIntersectOtherWay,
          "Right rect's left intersects with left rect's right",
        );
      });

      test('rects adjacent on top/bottom sides', function () {
        // ┌───┐
        // │ 2 │
        // ├───┤
        // │ 2 │
        // └───┘
        const topRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const bottomRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 3),
          2,
          2,
        );

        const doIntersectOneWay = topRect.intersects(bottomRect);
        const doIntersectOtherWay = bottomRect.intersects(topRect);

        assert.isTrue(
          doIntersectOneWay,
          "Top rect's bottom intersects with bottom rect's top",
        );
        assert.isTrue(
          doIntersectOtherWay,
          "Bottom rect's top intersects with top rect's bottom",
        );
      });

      test('small left rect adjacent to big right rect', function () {
        //   ┌───┐
        // ┌─┐ 2 │
        // └─┘   │
        //   └───┘
        const bigRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(2, 1),
          2,
          2,
        );
        const smallRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1.5),
          1,
          1,
        );

        const doIntersectOneWay = bigRect.intersects(smallRect);
        const doIntersectOtherWay = smallRect.intersects(bigRect);

        assert.isTrue(
          doIntersectOneWay,
          "big rect's left intersects small rect's right",
        );
        assert.isTrue(
          doIntersectOtherWay,
          "small rect's right intersects big rect's left",
        );
      });

      test('small right rect adjacent to big left rect', function () {
        // ┌───┐
        // │ 2 ┌─┐
        // │   └─┘
        // └───┘
        const bigRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const smallRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(3, 1.5),
          1,
          1,
        );

        const doIntersectOneWay = bigRect.intersects(smallRect);
        const doIntersectOtherWay = smallRect.intersects(bigRect);

        assert.isTrue(
          doIntersectOneWay,
          "big rect's right intersects small rect's left",
        );
        assert.isTrue(
          doIntersectOtherWay,
          "small rect's left intersects big rect's right",
        );
      });

      test('small top rect adjacent to big bottom rect', function () {
        //  ┌─┐
        // ┌└─┘┐
        // │ 2 │
        // └───┘
        const bigRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const smallRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1.5, 0),
          1,
          1,
        );

        const doIntersectOneWay = bigRect.intersects(smallRect);
        const doIntersectOtherWay = smallRect.intersects(bigRect);

        assert.isTrue(
          doIntersectOneWay,
          "big rect's top intersects small rect's bottom",
        );
        assert.isTrue(
          doIntersectOtherWay,
          "small rect's bottom intersects big rect's top",
        );
      });

      test('small bottom rect adjacent to big top rect', function () {
        // ┌───┐
        // │ 2 │
        // └┌─┐┘
        //  └─┘
        const bigRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const smallRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1.5, 3),
          1,
          1,
        );

        const doIntersectOneWay = bigRect.intersects(smallRect);
        const doIntersectOtherWay = smallRect.intersects(bigRect);

        assert.isTrue(
          doIntersectOneWay,
          "big rect's bottom intersects small rect's top",
        );
        assert.isTrue(
          doIntersectOtherWay,
          "small rect's top intersects big rect's bottom",
        );
      });

      test('SW rect corner-adjacent to NE rect', function () {
        //     ┌───┐
        //     │ 2 │
        // ┌───┐───┘
        // │ 2 │
        // └───┘
        const swRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 3),
          2,
          2,
        );
        const neRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(3, 1),
          2,
          2,
        );

        const doIntersectOneWay = swRect.intersects(neRect);
        const doIntersectOtherWay = neRect.intersects(swRect);

        assert.isTrue(
          doIntersectOneWay,
          'SW rect intersects with SW corner of NE rect',
        );
        assert.isTrue(
          doIntersectOtherWay,
          'NE rect intersects with NE corner of SW rect',
        );
      });

      test('NW rect corner-adjacent to SE rect', function () {
        // ┌───┐
        // │ 2 │
        // └───┘───┐
        //     │ 2 │
        //     └───┘
        const nwRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const seRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(3, 3),
          2,
          2,
        );

        const doIntersectOneWay = seRect.intersects(nwRect);
        const doIntersectOtherWay = nwRect.intersects(seRect);

        assert.isTrue(
          doIntersectOneWay,
          'SE rect intersects with SE corner of NW rect',
        );
        assert.isTrue(
          doIntersectOtherWay,
          'NW rect intersects with NW corner of SE rect',
        );
      });
    });
    suite('does not intersect', function () {
      test('Same-size rects nearly side-adjacent', function () {
        // ┌───┐ ┌───┐
        // │ 2 │ │ 2 │
        // └───┘ └───┘
        const westRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const eastRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(3.5, 1),
          2,
          2,
        );

        const doIntersectOneWay = westRect.intersects(eastRect);
        const doIntersectOtherWay = eastRect.intersects(westRect);

        assert.isFalse(
          doIntersectOneWay,
          'Western rect does not intersect with eastern rect',
        );
        assert.isFalse(
          doIntersectOtherWay,
          'Eastern rect does not intersect with western rect',
        );
      });

      test('Same-size rects nearly side-adjacent', function () {
        // ┌───┐
        // │ 2 │
        // └───┘
        // ┌───┐
        // │ 2 │
        // └───┘
        const northRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const southRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 3.5),
          2,
          2,
        );

        const doIntersectOneWay = northRect.intersects(southRect);
        const doIntersectOtherWay = southRect.intersects(northRect);

        assert.isFalse(
          doIntersectOneWay,
          'Northern rect does not intersect with southern rect',
        );
        assert.isFalse(
          doIntersectOtherWay,
          'Southern rect does not intersect with northern rect',
        );
      });

      test('Small rect left of big rect', function () {
        //    ┌───┐
        // ┌─┐│ 2 │
        // └─┘│   │
        //    └───┘
        const westRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          1,
          1,
        );
        const eastRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(2.5, 1),
          2,
          2,
        );

        const doIntersectOneWay = westRect.intersects(eastRect);
        const doIntersectOtherWay = eastRect.intersects(westRect);

        assert.isFalse(
          doIntersectOneWay,
          'Western rect does not intersect with eastern rect',
        );
        assert.isFalse(
          doIntersectOtherWay,
          'Eastern rect does not intersect with western rect',
        );
      });

      test('Small rect right of big rect', function () {
        // ┌───┐
        // │ 2 │┌─┐
        // │   │└─┘
        // └───┘
        const westRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const eastRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(3.5, 1),
          1,
          1,
        );

        const doIntersectOneWay = westRect.intersects(eastRect);
        const doIntersectOtherWay = eastRect.intersects(westRect);

        assert.isFalse(
          doIntersectOneWay,
          'Western rect does not intersect with eastern rect',
        );
        assert.isFalse(
          doIntersectOtherWay,
          'Eastern rect does not intersect with western rect',
        );
      });

      test('Small rect above big rect', function () {
        //  ┌─┐
        //  └─┘
        // ┌───┐
        // │ 2 │
        // └───┘
        const northRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          1,
          1,
        );
        const southRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2.5),
          2,
          2,
        );

        const doIntersectOneWay = northRect.intersects(southRect);
        const doIntersectOtherWay = southRect.intersects(northRect);

        assert.isFalse(
          doIntersectOneWay,
          'Northern rect does not intersect with southern rect',
        );
        assert.isFalse(
          doIntersectOtherWay,
          'Southern rect does not intersect with northern rect',
        );
      });

      test('Small rect below big rect', function () {
        // ┌───┐
        // │ 2 │
        // └───┘
        //  ┌─┐
        //  └─┘
        const northRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const southRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 3.5),
          1,
          1,
        );

        const doIntersectOneWay = northRect.intersects(southRect);
        const doIntersectOtherWay = southRect.intersects(northRect);

        assert.isFalse(
          doIntersectOneWay,
          'Northern rect does not intersect with southern rect',
        );
        assert.isFalse(
          doIntersectOtherWay,
          'Southern rect does not intersect with northern rect',
        );
      });

      test('Same-size rects diagonal (NE and SW) to each other', function () {
        //      ┌───┐
        //      │ 2 │
        //      └───┘
        // ┌───┐
        // │ 2 │
        // └───┘
        const neRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(3.5, 1),
          2,
          2,
        );
        const swRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 3.5),
          2,
          2,
        );

        const doIntersectOneWay = neRect.intersects(swRect);
        const doIntersectOtherWay = swRect.intersects(neRect);

        assert.isFalse(
          doIntersectOneWay,
          'NE rect does not intersect with SW rect',
        );
        assert.isFalse(
          doIntersectOtherWay,
          'SW rect does not intersect with NE rect',
        );
      });

      test('Same-size rects diagonal (NW and SE) to each other', function () {
        // ┌───┐
        // │ 2 │
        // └───┘
        //      ┌───┐
        //      │ 2 │
        //      └───┘
        const nwRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const seRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(3.5, 3.5),
          2,
          2,
        );

        const doIntersectOneWay = nwRect.intersects(seRect);
        const doIntersectOtherWay = seRect.intersects(nwRect);

        assert.isFalse(
          doIntersectOneWay,
          'NW rect does not intersect with SE rect',
        );
        assert.isFalse(
          doIntersectOtherWay,
          'SE rect does not intersect with NW rect',
        );
      });

      test('Small rect NE of big rect', function () {
        //      ┌─┐
        //      └─┘
        // ┌───┐
        // │ 2 │
        // └───┘
        const neRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(3.5, 1),
          1,
          1,
        );
        const swRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 2.5),
          2,
          2,
        );

        const doIntersectOneWay = neRect.intersects(swRect);
        const doIntersectOtherWay = swRect.intersects(neRect);

        assert.isFalse(
          doIntersectOneWay,
          'NE rect does not intersect with SW rect',
        );
        assert.isFalse(
          doIntersectOtherWay,
          'SW rect does not intersect with NE rect',
        );
      });

      test('Small rect NW of big rect', function () {
        // ┌─┐
        // └─┘
        //      ┌───┐
        //      │ 2 │
        //      └───┘
        const nwRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          1,
          1,
        );
        const seRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(2.5, 2.5),
          2,
          2,
        );

        const doIntersectOneWay = nwRect.intersects(seRect);
        const doIntersectOtherWay = seRect.intersects(nwRect);

        assert.isFalse(
          doIntersectOneWay,
          'NW rect does not intersect with SE rect',
        );
        assert.isFalse(
          doIntersectOtherWay,
          'SE rect does not intersect with NW rect',
        );
      });

      test('Small rect SW of big rect', function () {
        //      ┌───┐
        //      │ 2 │
        //      └───┘
        // ┌─┐
        // └─┘
        const neRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(2.5, 1),
          2,
          2,
        );
        const swRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 3.5),
          1,
          1,
        );

        const doIntersectOneWay = neRect.intersects(swRect);
        const doIntersectOtherWay = swRect.intersects(neRect);

        assert.isFalse(
          doIntersectOneWay,
          'NE rect does not intersect with SW rect',
        );
        assert.isFalse(
          doIntersectOtherWay,
          'SW rect does not intersect with NE rect',
        );
      });

      test('Small rect SE of big rect', function () {
        // ┌───┐
        // │ 2 │
        // └───┘
        //      ┌─┐
        //      └─┘
        const nwRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(1, 1),
          2,
          2,
        );
        const seRect = Blockly.utils.Rect.createFromPoint(
          this.createCoord(3.5, 3.5),
          1,
          1,
        );

        const doIntersectOneWay = nwRect.intersects(seRect);
        const doIntersectOtherWay = seRect.intersects(nwRect);

        assert.isFalse(
          doIntersectOneWay,
          'NW rect does not intersect with SE rect',
        );
        assert.isFalse(
          doIntersectOtherWay,
          'SE rect does not intersect with NW rect',
        );
      });
    });
  });
});
