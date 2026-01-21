/**
 * @license
 * Copyright 2013 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.Msg

/** A dictionary of localised messages. */
export const Msg: {[key: string]: string} = Object.create(null);

/**
 * Sets the locale (i.e. the localized messages/block-text/etc) to the given
 * locale.
 *
 * This is not useful/necessary when loading from a script tag, because the
 * messages are automatically cluged into the Blockly.Msg object. But we provide
 * it in both the script-tag and non-script-tag contexts so that the tscompiler
 * can properly create our type definition files.
 *
 * @param locale An object defining the messages for a given language.
 */
export const setLocale = function (locale: {[key: string]: string}) {
  Object.keys(locale).forEach(function (k) {
    Msg[k] = locale[k];
  });
};
