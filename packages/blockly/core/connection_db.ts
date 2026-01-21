/**
 * @license
 * Copyright 2011 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A database of all the rendered connections that could
 *    possibly be connected to (i.e. not collapsed, etc).
 *    Sorted by y coordinate.
 *
 * @class
 */
// Former goog.module ID: Blockly.ConnectionDB

import {ConnectionType} from './connection_type.js';
import type {IConnectionChecker} from './interfaces/i_connection_checker.js';
import type {RenderedConnection} from './rendered_connection.js';
import type {Coordinate} from './utils/coordinate.js';

/**
 * Database of connections.
 * Connections are stored in order of their vertical component.  This way
 * connections in an area may be looked up quickly using a binary search.
 */
export class ConnectionDB {
  /** Array of connections sorted by y position in workspace units. */
  private readonly connections: RenderedConnection[] = [];

  /**
   * @param connectionChecker The workspace's connection type checker, used to
   *     decide if connections are valid during a drag.
   */
  constructor(private readonly connectionChecker: IConnectionChecker) {}

  /**
   * Add a connection to the database. Should not already exist in the database.
   *
   * @param connection The connection to be added.
   * @param yPos The y position used to decide where to insert the connection.
   * @internal
   */
  addConnection(connection: RenderedConnection, yPos: number) {
    const index = this.calculateIndexForYPos(yPos);
    this.connections.splice(index, 0, connection);
  }

  /**
   * Finds the index of the given connection.
   *
   * Starts by doing a binary search to find the approximate location, then
   * linearly searches nearby for the exact connection.
   *
   * @param conn The connection to find.
   * @param yPos The y position used to find the index of the connection.
   * @returns The index of the connection, or -1 if the connection was not
   *     found.
   */
  private findIndexOfConnection(
    conn: RenderedConnection,
    yPos: number,
  ): number {
    if (!this.connections.length) {
      return -1;
    }

    const bestGuess = this.calculateIndexForYPos(yPos);
    if (bestGuess >= this.connections.length) {
      // Not in list
      return -1;
    }

    yPos = conn.y;
    // Walk forward and back on the y axis looking for the connection.
    let pointer = bestGuess;
    while (pointer >= 0 && this.connections[pointer].y === yPos) {
      if (this.connections[pointer] === conn) {
        return pointer;
      }
      pointer--;
    }

    pointer = bestGuess;
    while (
      pointer < this.connections.length &&
      this.connections[pointer].y === yPos
    ) {
      if (this.connections[pointer] === conn) {
        return pointer;
      }
      pointer++;
    }
    return -1;
  }

  /**
   * Finds the correct index for the given y position.
   *
   * @param yPos The y position used to decide where to insert the connection.
   * @returns The candidate index.
   */
  private calculateIndexForYPos(yPos: number): number {
    if (!this.connections.length) {
      return 0;
    }
    let pointerMin = 0;
    let pointerMax = this.connections.length;
    while (pointerMin < pointerMax) {
      const pointerMid = Math.floor((pointerMin + pointerMax) / 2);
      if (this.connections[pointerMid].y < yPos) {
        pointerMin = pointerMid + 1;
      } else if (this.connections[pointerMid].y > yPos) {
        pointerMax = pointerMid;
      } else {
        pointerMin = pointerMid;
        break;
      }
    }
    return pointerMin;
  }

  /**
   * Remove a connection from the database.  Must already exist in DB.
   *
   * @param connection The connection to be removed.
   * @param yPos The y position used to find the index of the connection.
   * @throws {Error} If the connection cannot be found in the database.
   */
  removeConnection(connection: RenderedConnection, yPos: number) {
    const index = this.findIndexOfConnection(connection, yPos);
    if (index === -1) {
      throw Error('Unable to find connection in connectionDB.');
    }
    this.connections.splice(index, 1);
  }

  /**
   * Find all nearby connections to the given connection.
   * Type checking does not apply, since this function is used for bumping.
   *
   * @param connection The connection whose neighbours should be returned.
   * @param maxRadius The maximum radius to another connection.
   * @returns List of connections.
   */
  getNeighbours(
    connection: RenderedConnection,
    maxRadius: number,
  ): RenderedConnection[] {
    const db = this.connections;
    const currentX = connection.x;
    const currentY = connection.y;

    // Binary search to find the closest y location.
    let pointerMin = 0;
    let pointerMax = db.length - 2;
    let pointerMid = pointerMax;
    while (pointerMin < pointerMid) {
      if (db[pointerMid].y < currentY) {
        pointerMin = pointerMid;
      } else {
        pointerMax = pointerMid;
      }
      pointerMid = Math.floor((pointerMin + pointerMax) / 2);
    }

    const neighbours: RenderedConnection[] = [];
    /**
     * Computes if the current connection is within the allowed radius of
     * another connection. This function is a closure and has access to outside
     * variables.
     *
     * @param yIndex The other connection's index in the database.
     * @returns True if the current connection's vertical distance from the
     *     other connection is less than the allowed radius.
     */
    function checkConnection(yIndex: number): boolean {
      const dx = currentX - db[yIndex].x;
      const dy = currentY - db[yIndex].y;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r <= maxRadius) {
        neighbours.push(db[yIndex]);
      }
      return dy < maxRadius;
    }

    // Walk forward and back on the y axis looking for the closest x,y point.
    pointerMin = pointerMid;
    pointerMax = pointerMid;
    if (db.length) {
      while (pointerMin >= 0 && checkConnection(pointerMin)) {
        pointerMin--;
      }
      do {
        pointerMax++;
      } while (pointerMax < db.length && checkConnection(pointerMax));
    }

    return neighbours;
  }

  /**
   * Is the candidate connection close to the reference connection.
   * Extremely fast; only looks at Y distance.
   *
   * @param index Index in database of candidate connection.
   * @param baseY Reference connection's Y value.
   * @param maxRadius The maximum radius to another connection.
   * @returns True if connection is in range.
   */
  private isInYRange(index: number, baseY: number, maxRadius: number): boolean {
    return Math.abs(this.connections[index].y - baseY) <= maxRadius;
  }

  /**
   * Find the closest compatible connection to this connection.
   *
   * @param conn The connection searching for a compatible mate.
   * @param maxRadius The maximum radius to another connection.
   * @param dxy Offset between this connection's location in the database and
   *     the current location (as a result of dragging).
   * @returns Contains two properties: 'connection' which is either another
   *     connection or null, and 'radius' which is the distance.
   */
  searchForClosest(
    conn: RenderedConnection,
    maxRadius: number,
    dxy: Coordinate,
  ): {connection: RenderedConnection | null; radius: number} {
    if (!this.connections.length) {
      // Don't bother.
      return {connection: null, radius: maxRadius};
    }

    // Stash the values of x and y from before the drag.
    const baseY = conn.y;
    const baseX = conn.x;

    conn.x = baseX + dxy.x;
    conn.y = baseY + dxy.y;

    // calculateIndexForYPos_ finds an index for insertion, which is always
    // after any block with the same y index.  We want to search both forward
    // and back, so search on both sides of the index.
    const closestIndex = this.calculateIndexForYPos(conn.y);

    let bestConnection = null;
    let bestRadius = maxRadius;
    let temp;

    // Walk forward and back on the y axis looking for the closest x,y point.
    let pointerMin = closestIndex - 1;
    while (pointerMin >= 0 && this.isInYRange(pointerMin, conn.y, maxRadius)) {
      temp = this.connections[pointerMin];
      if (this.connectionChecker.canConnect(conn, temp, true, bestRadius)) {
        bestConnection = temp;
        bestRadius = temp.distanceFrom(conn);
      }
      pointerMin--;
    }

    let pointerMax = closestIndex;
    while (
      pointerMax < this.connections.length &&
      this.isInYRange(pointerMax, conn.y, maxRadius)
    ) {
      temp = this.connections[pointerMax];
      if (this.connectionChecker.canConnect(conn, temp, true, bestRadius)) {
        bestConnection = temp;
        bestRadius = temp.distanceFrom(conn);
      }
      pointerMax++;
    }

    // Reset the values of x and y.
    conn.x = baseX;
    conn.y = baseY;
    // If there were no valid connections, bestConnection will be null.
    return {connection: bestConnection, radius: bestRadius};
  }

  /**
   * Initialize a set of connection DBs for a workspace.
   *
   * @param checker The workspace's connection checker, used to decide if
   *     connections are valid during a drag.
   * @returns Array of databases.
   */
  static init(checker: IConnectionChecker): ConnectionDB[] {
    // Create four databases, one for each connection type.
    const dbList = [];
    dbList[ConnectionType.INPUT_VALUE] = new ConnectionDB(checker);
    dbList[ConnectionType.OUTPUT_VALUE] = new ConnectionDB(checker);
    dbList[ConnectionType.NEXT_STATEMENT] = new ConnectionDB(checker);
    dbList[ConnectionType.PREVIOUS_STATEMENT] = new ConnectionDB(checker);
    return dbList;
  }
}
