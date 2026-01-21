/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ConnectionType} from '../../build/src/core/connection_type.js';
import * as idGenerator from '../../build/src/core/utils/idgenerator.js';
import {assert} from '../../node_modules/chai/index.js';
import {
  sharedTestSetup,
  sharedTestTeardown,
} from './test_helpers/setup_teardown.js';

suite('Connection Database', function () {
  setup(function () {
    sharedTestSetup.call(this);
    this.database = new Blockly.ConnectionDB(new Blockly.ConnectionChecker());

    this.assertOrder = function () {
      const length = this.database.connections.length;
      for (let i = 1; i < length; i++) {
        assert.isAtMost(
          this.database.connections[i - 1].y,
          this.database.connections[i].y,
        );
      }
    };
    this.createConnection = function (x, y, type, opt_database) {
      const workspace = {
        connectionDBList: [],
      };
      workspace.connectionDBList[type] = opt_database || this.database;
      const connection = new Blockly.RenderedConnection(
        {id: idGenerator.getNextUniqueId(), workspace: workspace},
        type,
      );
      connection.x = x;
      connection.y = y;
      return connection;
    };
    this.createSimpleTestConnections = function () {
      for (let i = 0; i < 10; i++) {
        const connection = this.createConnection(
          0,
          i,
          ConnectionType.PREVIOUS_STATEMENT,
        );
        this.database.addConnection(connection, i);
      }
    };
  });
  teardown(function () {
    sharedTestTeardown.call(this);
  });
  test('Add Connection', function () {
    const y2 = {y: 2};
    const y4 = {y: 4};
    const y1 = {y: 1};
    const y3a = {y: 3};
    const y3b = {y: 3};

    this.database.addConnection(y2, 2);
    assert.sameOrderedMembers(this.database.connections, [y2]);

    this.database.addConnection(y4, 4);
    assert.sameOrderedMembers(this.database.connections, [y2, y4]);

    this.database.addConnection(y1, 1);
    assert.sameOrderedMembers(this.database.connections, [y1, y2, y4]);

    this.database.addConnection(y3a, 3);
    assert.sameOrderedMembers(this.database.connections, [y1, y2, y3a, y4]);

    this.database.addConnection(y3b, 3);
    assert.sameOrderedMembers(this.database.connections, [
      y1,
      y2,
      y3b,
      y3a,
      y4,
    ]);
  });
  test('Remove Connection', function () {
    const y2 = {y: 2};
    const y4 = {y: 4};
    const y1 = {y: 1};
    const y3a = {y: 3};
    const y3b = {y: 3};
    const y3c = {y: 3};

    this.database.addConnection(y2, 2);
    this.database.addConnection(y4, 4);
    this.database.addConnection(y1, 1);
    this.database.addConnection(y3c, 3);
    this.database.addConnection(y3b, 3);
    this.database.addConnection(y3a, 3);

    assert.sameOrderedMembers(this.database.connections, [
      y1,
      y2,
      y3a,
      y3b,
      y3c,
      y4,
    ]);

    this.database.removeConnection(y2, 2);
    assert.sameOrderedMembers(this.database.connections, [
      y1,
      y3a,
      y3b,
      y3c,
      y4,
    ]);

    this.database.removeConnection(y4, 4);
    assert.sameOrderedMembers(this.database.connections, [y1, y3a, y3b, y3c]);

    this.database.removeConnection(y1, 1);
    assert.sameOrderedMembers(this.database.connections, [y3a, y3b, y3c]);

    this.database.removeConnection(y3a, 3);
    assert.sameOrderedMembers(this.database.connections, [y3b, y3c]);

    this.database.removeConnection(y3c, 3);
    assert.sameOrderedMembers(this.database.connections, [y3b]);

    this.database.removeConnection(y3b, 3);
    assert.isEmpty(this.database.connections);
  });
  suite('Get Neighbors', function () {
    test('Empty Database', function () {
      const connection = this.createConnection(
        0,
        0,
        ConnectionType.NEXT_STATEMENT,
        new Blockly.ConnectionDB(),
      );
      assert.isEmpty(this.database.getNeighbours(connection), 100);
    });
    test('Block At Top', function () {
      this.createSimpleTestConnections();

      const checkConnection = this.createConnection(
        0,
        0,
        ConnectionType.NEXT_STATEMENT,
        new Blockly.ConnectionDB(),
      );
      const neighbors = this.database.getNeighbours(checkConnection, 4);
      assert.sameMembers(neighbors, this.database.connections.slice(0, 5));
    });
    test('Block In Middle', function () {
      this.createSimpleTestConnections();

      const checkConnection = this.createConnection(
        0,
        4,
        ConnectionType.NEXT_STATEMENT,
        new Blockly.ConnectionDB(),
      );
      const neighbors = this.database.getNeighbours(checkConnection, 2);
      assert.sameMembers(neighbors, this.database.connections.slice(2, 7));
    });
    test('Block At End', function () {
      this.createSimpleTestConnections();

      const checkConnection = this.createConnection(
        0,
        9,
        ConnectionType.NEXT_STATEMENT,
        new Blockly.ConnectionDB(),
      );
      const neighbors = this.database.getNeighbours(checkConnection, 4);
      assert.sameMembers(neighbors, this.database.connections.slice(5, 10));
    });
    test('Out of Range X', function () {
      this.createSimpleTestConnections();

      const checkConnection = this.createConnection(
        10,
        9,
        ConnectionType.NEXT_STATEMENT,
        new Blockly.ConnectionDB(),
      );
      const neighbors = this.database.getNeighbours(checkConnection, 4);
      assert.isEmpty(neighbors);
    });
    test('Out of Range Y', function () {
      this.createSimpleTestConnections();

      const checkConnection = this.createConnection(
        0,
        19,
        ConnectionType.NEXT_STATEMENT,
        new Blockly.ConnectionDB(),
      );
      const neighbors = this.database.getNeighbours(checkConnection, 4);
      assert.isEmpty(neighbors);
    });
    test('Out of Range Diagonal', function () {
      this.createSimpleTestConnections();

      const checkConnection = this.createConnection(
        -2,
        -2,
        ConnectionType.NEXT_STATEMENT,
        new Blockly.ConnectionDB(),
      );
      const neighbors = this.database.getNeighbours(checkConnection, 2);
      assert.isEmpty(neighbors);
    });
  });
  suite('Ordering', function () {
    test('Simple', function () {
      for (let i = 0; i < 10; i++) {
        const connection = this.createConnection(
          0,
          i,
          ConnectionType.NEXT_STATEMENT,
        );
        this.database.addConnection(connection, i);
      }
      this.assertOrder();
    });
    test('Quasi-Random', function () {
      const xCoords = [
        -29, -47, -77, 2, 43, 34, -59, -52, -90, -36, -91, 38, 87, -20, 60, 4,
        -57, 65, -37, -81, 57, 58, -96, 1, 67, -79, 34, 93, -90, -99, -62, 4,
        11, -36, -51, -72, 3, -50, -24, -45, -92, -38, 37, 24, -47, -73, 79,
        -20, 99, 43, -10, -87, 19, 35, -62, -36, 49, 86, -24, -47, -89, 33, -44,
        25, -73, -91, 85, 6, 0, 89, -94, 36, -35, 84, -9, 96, -21, 52, 10, -95,
        7, -67, -70, 62, 9, -40, -95, -9, -94, 55, 57, -96, 55, 8, -48, -57,
        -87, 81, 23, 65,
      ];
      const yCoords = [
        -81, 82, 5, 47, 30, 57, -12, 28, 38, 92, -25, -20, 23, -51, 73, -90, 8,
        28, -51, -15, 81, -60, -6, -16, 77, -62, -42, -24, 35, 95, -46, -7, 61,
        -16, 14, 91, 57, -38, 27, -39, 92, 47, -98, 11, -33, -72, 64, 38, -64,
        -88, -35, -59, -76, -94, 45, -25, -100, -95, 63, -97, 45, 98, 99, 34,
        27, 52, -18, -45, 66, -32, -38, 70, -73, -23, 5, -2, -13, -9, 48, 74,
        -97, -11, 35, -79, -16, -77, 83, -57, -53, 35, -44, 100, -27, -15, 5,
        39, 33, -19, -20, -95,
      ];

      const length = xCoords.length;
      for (let i = 0; i < length; i++) {
        const connection = this.createConnection(
          xCoords[i],
          yCoords[i],
          ConnectionType.NEXT_STATEMENT,
        );
        this.database.addConnection(connection, yCoords[i]);
      }
      this.assertOrder();
    });
  });

  suite('Search For Closest', function () {
    setup(function () {
      // Ignore type checks.
      sinon.stub(this.database.connectionChecker, 'doTypeChecks').returns(true);
      // Ignore safety checks.
      sinon
        .stub(this.database.connectionChecker, 'doSafetyChecks')
        .returns(Blockly.Connection.CAN_CONNECT);
      // Skip everything but the distance checks.
      sinon
        .stub(this.database.connectionChecker, 'doDragChecks')
        .callsFake(function (a, b, distance) {
          return a.distanceFrom(b) <= distance;
        });

      this.createCheckConnection = function (x, y) {
        const checkConnection = this.createConnection(
          x,
          y,
          ConnectionType.NEXT_STATEMENT,
          new Blockly.ConnectionDB(),
        );
        return checkConnection;
      };
    });
    test('Empty Database', function () {
      const checkConnection = this.createConnection(
        0,
        0,
        ConnectionType.NEXT_STATEMENT,
        new Blockly.ConnectionDB(),
      );
      assert.isNull(
        this.database.searchForClosest(checkConnection, 100, {x: 0, y: 0})
          .connection,
      );
    });
    test('Too Far', function () {
      const connection = this.createConnection(
        0,
        100,
        ConnectionType.PREVIOUS_STATEMENT,
      );
      this.database.addConnection(connection, 100);

      const checkConnection = this.createConnection(
        0,
        0,
        ConnectionType.NEXT_STATEMENT,
        new Blockly.ConnectionDB(),
      );
      assert.isNull(
        this.database.searchForClosest(checkConnection, 50, {x: 0, y: 0})
          .connection,
      );
    });
    test('Single in Range', function () {
      this.createSimpleTestConnections();

      const checkConnection = this.createCheckConnection(0, 14);

      const last = this.database.connections[9];
      const closest = this.database.searchForClosest(checkConnection, 5, {
        x: 0,
        y: 0,
      }).connection;
      assert.equal(last, closest);
    });
    test('Many in Range', function () {
      this.createSimpleTestConnections();

      const checkConnection = this.createCheckConnection(0, 10);

      const last = this.database.connections[9];
      const closest = this.database.searchForClosest(checkConnection, 5, {
        x: 0,
        y: 0,
      }).connection;
      assert.equal(last, closest);
    });
    test('No Y-Coord Priority', function () {
      const connection1 = this.createConnection(
        6,
        6,
        ConnectionType.PREVIOUS_STATEMENT,
      );
      this.database.addConnection(connection1, 6);
      const connection2 = this.createConnection(
        5,
        5,
        ConnectionType.PREVIOUS_STATEMENT,
      );
      this.database.addConnection(connection2, 5);

      const checkConnection = this.createCheckConnection(4, 6);

      const closest = this.database.searchForClosest(checkConnection, 3, {
        x: 0,
        y: 0,
      }).connection;
      assert.equal(connection2, closest);
    });
  });
});
