/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Returns the package name.
 * @author samelh@google.com (Sam El-Husseini)
 */

let packageName;
// Get the package name added by blockly-scripts, if set
try {
  packageName = process.env.PACKAGE_NAME;
} catch {
  // Not built by blockly-scripts; continue
}

export const id = packageName ?? 'playground';
