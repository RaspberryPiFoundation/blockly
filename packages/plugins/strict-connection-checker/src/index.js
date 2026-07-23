/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A Blockly plugin that makes connection type checks strict.
 */

import * as Blockly from 'blockly/core';

/**
 * A connection checker that imposes stricter typing rules than the default
 * checker in Blockly, but uses the same rules for dragging and safety.
 * This checker still expects nullable arrays of string for connection
 * type checks, and still looks for intersections in the arrays. Unlike the
 * default checker, null checks arrays are only compatible with other null
 * arrays.
 * @implements {Blockly.IConnectionChecker}
 */
export class StrictConnectionChecker extends Blockly.ConnectionChecker {
  /**
   * Constructor for the connection checker.
   */
  constructor() {
    super();
  }

  /**
   * Type check arrays must either intersect or both be null.
   * @override
   */
  doTypeChecks(a, b) {
    const checkArrayOne = a.getCheck();
    const checkArrayTwo = b.getCheck();

    if (!checkArrayOne || !checkArrayTwo) {
      // Null arrays can only connect to other null arrays.
      return checkArrayOne == checkArrayTwo;
    }

    // Find any intersection in the check lists.
    for (let i = 0; i < checkArrayOne.length; i++) {
      if (checkArrayTwo.indexOf(checkArrayOne[i]) != -1) {
        return true;
      }
    }
    // No intersection.
    return false;
  }
}

export const registrationType = Blockly.registry.Type.CONNECTION_CHECKER;
export const registrationName = 'StrictConnectionChecker';

// Register the checker so that it can be used by name.
Blockly.registry.register(
  registrationType,
  registrationName,
  StrictConnectionChecker,
);

export const pluginInfo = {
  [registrationType]: registrationName,
};
