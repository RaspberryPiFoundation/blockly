/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Typedefs and utility methods for parsing options for the
 * backpack plugin.
 * @author kozbial@google.com (Monica Kozbial)
 */

export interface BackpackContextMenuOptions {
  emptyBackpack?: boolean;
  removeFromBackpack?: boolean;
  copyToBackpack?: boolean;
  copyAllToBackpack?: boolean;
  pasteAllToBackpack?: boolean;
  disablePreconditionChecks?: boolean;
}

export interface BackpackOptions {
  allowEmptyBackpackOpen?: boolean;
  useFilledBackpackImage?: boolean;
  skipSerializerRegistration?: boolean;
  contextMenu?: BackpackContextMenuOptions;
}

/**
 * Returns a new options object with all properties set, using default values
 * if not specified in the optional options that were passed in.
 *
 * @param options The options to use.
 * @returns The created options object.
 */
export function parseOptions(options?: BackpackOptions): BackpackOptions {
  const defaults = {
    allowEmptyBackpackOpen: true,
    useFilledBackpackImage: false,
    skipSerializerRegistration: false,
    contextMenu: {
      emptyBackpack: true,
      removeFromBackpack: true,
      copyToBackpack: true,
      copyAllToBackpack: false,
      pasteAllToBackpack: false,
      disablePreconditionChecks: false,
    },
  };

  if (!options) {
    return defaults;
  }

  return {
    allowEmptyBackpackOpen:
      options.allowEmptyBackpackOpen ?? defaults.allowEmptyBackpackOpen,
    useFilledBackpackImage:
      options.useFilledBackpackImage ?? defaults.useFilledBackpackImage,
    skipSerializerRegistration:
      options.skipSerializerRegistration ?? defaults.skipSerializerRegistration,
    contextMenu: {
      ...defaults.contextMenu,
      ...options.contextMenu,
    },
  };
}
