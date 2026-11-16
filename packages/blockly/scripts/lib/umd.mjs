/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Wrapping of scripts into Universal Module Definitions.
 */

import * as fs from 'node:fs';
import {fromRoot} from './fs_utils.mjs';

/** Path to the UMD template files, relative to the package root. */
const TEMPLATE_DIR = 'scripts/package/templates';

/** Cache of template contents, keyed by template filename. */
const templates = new Map();

/**
 * A dependency to be injected into a UMD module.
 *
 * @typedef {object} UmdDependency
 * @property {string} name Name of the dependency, used as the default
 *     for any of the other properties that are omitted.
 * @property {string=} amd Module ID to require in an AMD loader.
 * @property {string=} cjs Module ID to require in a CJS loader.
 * @property {string=} global Property of the global object (minus the
 *     leading "root.") to use in a browser.
 * @property {string=} param Name of the factory function parameter the
 *     dependency is passed as.
 */

/**
 * Wrap the given script in a Universal Module Definition, so that it
 * can be loaded by an AMD loader, by a CJS loader, or directly in a
 * browser.
 *
 * This is a replacement for the gulp-umd plugin, supporting just the
 * subset of its template syntax and options that our templates use.
 *
 * @param {string} contents The script to wrap.
 * @param {object} options Options object.
 * @param {string} options.namespace The export namespace.
 * @param {string=} options.exports The expression the factory function
 *     should return.  Defaults to the namespace.
 * @param {Array<UmdDependency>=} options.dependencies Dependencies to
 *     inject.
 * @param {string=} options.template Filename of the template to use,
 *     within TEMPLATE_DIR.
 * @returns {string} The wrapped script.
 */
export function wrapUmd(
  contents,
  {
    namespace,
    exports = namespace,
    dependencies = [],
    template = 'umd.template',
  },
) {
  const substitutions = {
    contents,
    exports,
    namespace,
    amd: `[${dependencies.map((dep) => `'${dep.amd ?? dep.name}'`).join(', ')}]`,
    cjs: dependencies
      .map((dep) => `require('${dep.cjs ?? dep.name}')`)
      .join(', '),
    global: dependencies
      .map((dep) => `root.${dep.global ?? dep.name}`)
      .join(', '),
    param: dependencies.map((dep) => dep.param ?? dep.name).join(', '),
  };

  return getTemplate(template).replace(/<%=\s*(\w+)\s*%>/g, (match, key) => {
    if (!(key in substitutions)) {
      throw new Error(`Unsupported substitution ${match} in ${template}`);
    }
    return substitutions[key];
  });
}

/**
 * Load (and cache) the contents of a template file.
 *
 * @param {string} template Filename of the template, within TEMPLATE_DIR.
 * @returns {string} The contents of the template.
 */
function getTemplate(template) {
  if (!templates.has(template)) {
    templates.set(
      template,
      fs.readFileSync(fromRoot(TEMPLATE_DIR, template), 'utf8'),
    );
  }
  return templates.get(template);
}
