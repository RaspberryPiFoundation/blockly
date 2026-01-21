/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Hooks to run before the first test and after the last test.
 * These create a shared chromedriver instance, so we don't have to fire up
 * a new one for every suite.
 */
import {driverSetup, driverTeardown} from './test_setup.mjs';

export const mochaHooks = {
  async beforeAll() {
    // Set a long timeout for startup.
    this.timeout(10000);
    return await driverSetup();
  },
  async afterAll() {
    return await driverTeardown();
  },
};
