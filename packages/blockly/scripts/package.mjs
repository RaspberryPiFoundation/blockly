/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Script to package Blockly for distribution on NPM.
 *
 * Usage:
 *   node scripts/package.mjs
 *       # build Blockly and assemble the complete npm package in the
 *       # release directory
 *   node scripts/package.mjs typings
 *       # assemble only the .d.ts files, which is all that is needed
 *       # to generate the reference documentation
 *   node scripts/package.mjs --verbose --debug
 *       # as above, but with the build's compiler checks turned up
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {parseArgs} from 'node:util';
import {
  LANG_BUILD_DIR,
  RELEASE_DIR,
  TYPINGS_BUILD_DIR,
} from './gulpfiles/config.mjs';
import {copyFiles, fromRoot, writeFile} from './lib/fs_utils.mjs';
import {getPackageJson} from './lib/package_json.mjs';
import {cleanReleaseDir} from './lib/release_dir.mjs';
import {runGulpTask} from './lib/run_gulp.mjs';
import {wrapUmd} from './lib/umd.mjs';

/** Directory containing the files to be copied into the package as-is. */
const PACKAGE_SRC_DIR = 'scripts/package';

/** Directory the localised message modules are written to. */
const RELEASE_MSG_DIR = path.join(RELEASE_DIR, 'msg');

/**
 * The submodule entrypoints that get a legacy CJS shim.  See
 * packageLegacyEntrypoints for details.
 */
const LEGACY_ENTRYPOINTS = [
  'core',
  'blocks',
  'dart',
  'javascript',
  'lua',
  'php',
  'python',
];

/**
 * Wrap scripts/package/index.js into a UMD module.
 *
 * This module is the main entrypoint for the blockly package, and
 * loads blockly/core, blockly/blocks and blockly/msg/en and then
 * calls setLocale(en).
 */
async function packageIndex() {
  const contents = await fs.readFile(
    fromRoot(PACKAGE_SRC_DIR, 'index.js'),
    'utf8',
  );
  await writeFile(
    path.join(RELEASE_DIR, 'index.js'),
    wrapUmd(contents, {
      namespace: 'Blockly',
      dependencies: [
        {
          name: 'Blockly',
          amd: 'blockly/core',
          cjs: 'blockly/core',
        },
        {
          name: 'en',
          amd: 'blockly/msg/en',
          cjs: 'blockly/msg/en',
          global: 'Blockly.Msg',
        },
        {
          name: 'blocks',
          amd: 'blockly/blocks',
          cjs: 'blockly/blocks',
          global: 'Blockly.Blocks',
        },
      ],
    }),
  );
}

/**
 * Copy scripts/package/core-node.js into the package.  This module
 * will be the 'blockly/core' entrypoint for node.js environments.
 *
 * Note that, unlike index.js, this file does not get a UMD wrapper.
 * This is because it is only used in node.js environments and so is
 * guaranteed to be loaded as a CJS module.
 */
async function packageCoreNode() {
  await copyFiles({
    from: PACKAGE_SRC_DIR,
    patterns: ['core-node.js'],
    to: RELEASE_DIR,
  });
}

/**
 * Wrap each of the files in ${BUILD_DIR}/msg/ into a UMD module.
 *
 * @example import * as En from 'blockly/msg/en';
 */
async function packageLocales() {
  await copyFiles({
    from: LANG_BUILD_DIR,
    patterns: ['*.js'],
    to: RELEASE_MSG_DIR,
    transform: (contents) =>
      wrapUmd(contents, {
        namespace: 'Blockly.Msg',
        template: 'umd-msg.template',
      }),
  });
}

/**
 * Create a UMD bundle of Blockly which includes the Blockly core
 * files, the built-in blocks, the JavaScript code generator and the
 * English localization files.
 *
 * Prerequisites: build (for the compiled chunks), packageLocales.
 *
 * @example <script src="https://unpkg.com/blockly/blockly.min.js"></script>
 */
async function packageUMDBundle() {
  const srcs = [
    path.join(RELEASE_DIR, 'blockly_compressed.js'),
    path.join(RELEASE_MSG_DIR, 'en.js'),
    path.join(RELEASE_DIR, 'blocks_compressed.js'),
    path.join(RELEASE_DIR, 'javascript_compressed.js'),
  ];
  const contents = await Promise.all(
    srcs.map((src) => fs.readFile(fromRoot(src), 'utf8')),
  );
  await writeFile(
    path.join(RELEASE_DIR, 'blockly.min.js'),
    contents.join('\n'),
  );
}

/**
 * Create shims for the submodule entrypoints, for the benefit of
 * bundlers and other build tools that do not correctly support the
 * exports declaration in package.json.  These shims just require() and
 * reexport the corresponding *_compressed.js bundle.
 *
 * This should solve issues encountered by users of bundlers that don't
 * support exports at all (e.g. browserify) as well as ones that don't
 * support it in certain circumstances (e.g., when using webpack's
 * resolve.alias configuration option to alias 'blockly' to
 * 'node_modules/blockly', as we formerly did in most plugins, which
 * causes webpack to ignore blockly's package.json entirely).
 *
 * Assumptions:
 * - Such bundlers will _completely_ ignore the exports declaration.
 * - The bundles are intended to be used in a browser—or at least not
 *   in node.js—so the core entrypoint never needs to route to
 *   core-node.js.  This is reasonable since there's little reason to
 *   bundle code for node.js, and node.js has supported the exports
 *   clause since at least v12, consideably older than any version of
 *   node.js we officially support.
 * - It suffices to provide only a CJS entrypoint (because we can only
 *   provide CJS or ESM, not both.  (We could in future switch to
 *   providing only an ESM entrypoint instead, though.)
 */
async function packageLegacyEntrypoints() {
  await Promise.all(
    LEGACY_ENTRYPOINTS.map((entrypoint) => {
      const bundle =
        (entrypoint === 'core' ? 'blockly' : entrypoint) + '_compressed.js';
      return writeFile(
        path.join(RELEASE_DIR, `${entrypoint}.js`),
        `// Shim for backwards-compatibility with bundlers that do not
// support the 'exports' clause in package.json, to allow them
// to load the blockly/${entrypoint} submodule entrypoint.
module.exports = require('./${bundle}');
`,
      );
    }),
  );
}

/**
 * Copy all the media/* files into the release directory.
 */
async function packageMedia() {
  await copyFiles({
    from: 'media',
    patterns: ['*'],
    to: path.join(RELEASE_DIR, 'media'),
  });
}

/**
 * Copy the package.json file into the release directory, with
 * modifications:
 *
 * - The scripts section is removed.
 * - The nx section is removed.
 * - The exports are rewritten to match the structure of the package.
 */
async function packageJSON() {
  const json = getPackageJson();
  // Remove unwanted entries.
  delete json['scripts'];
  delete json['nx'];
  // Update exports to match how the package will be structured.
  const exports = json['exports'];
  if (exports) {
    for (const exportKey in exports) {
      const exportObj = exports[exportKey];
      for (const pathKey in exportObj) {
        exportObj[pathKey] = exportObj[pathKey].replace('./dist', '.');
      }
    }
  }
  // Set "type": "commonjs", since that's what .js files in the
  // package root are.  This should be a no-op since that's the
  // default, but by setting it explicitly we ensure that any chage to
  // the repository top-level package.json to set "type": "module"
  // won't break the published package accidentally.
  json.type = 'commonjs';
  // Write resulting package.json file to release directory.
  await writeFile(
    path.join(RELEASE_DIR, 'package.json'),
    JSON.stringify(json, null, 2),
  );
}

/**
 * Copy the scripts/package/README.md file into the release directory.
 * This file is what developers will see at
 * https://www.npmjs.com/package/blockly .
 */
async function packageReadme() {
  await copyFiles({
    from: PACKAGE_SRC_DIR,
    patterns: ['README.md'],
    to: RELEASE_DIR,
  });
}

/**
 * Copy the generated .d.ts files in build/declarations and the
 * hand-written .d.ts files in typings/ into the release directory. The
 * main entrypoint file (index.d.ts) is referenced in package.json in
 * the types property.
 *
 * Prerequisite: tsc (for the generated declarations).
 */
async function packageDTS() {
  const transform = (contents) =>
    contents.replaceAll('AnyDuringMigration', 'any');
  // Copy the hand-written declarations first, so that any generated
  // declaration with the same name takes precedence.
  await copyFiles({
    from: 'typings',
    patterns: ['*.d.ts', 'msg/*.d.ts'],
    to: RELEASE_DIR,
    transform,
  });
  await copyFiles({
    from: TYPINGS_BUILD_DIR,
    patterns: ['**/*.d.ts'],
    ignore: ['blocks/**'],
    to: RELEASE_DIR,
    transform,
  });
}

/**
 * Clean the build and release directories, ready for a fresh build.
 *
 * TODO: Call cleanBuildDir directly once the build tasks have been
 * converted to plain node scripts.
 */
async function clean() {
  await Promise.all([cleanReleaseDir(), runGulpTask('cleanBuildDir')]);
}

/**
 * Prepare the files to be included in the NPM package by building
 * Blockly and copying the results into the release directory.
 *
 * @param {Array<string>} buildFlags Flags to pass to the build.
 */
async function pack(buildFlags) {
  await clean();
  await runGulpTask('build', buildFlags);
  await Promise.all([
    packageIndex(),
    packageCoreNode(),
    packageLegacyEntrypoints(),
    packageMedia(),
    packageLocales().then(packageUMDBundle),
    packageJSON(),
    packageReadme(),
    packageDTS(),
  ]);
}

/**
 * Assemble just the .d.ts files in the release directory.  This is all
 * that is needed in order to generate the reference documentation, and
 * is much quicker than a full pack.
 *
 * @param {Array<string>} buildFlags Flags to pass to the build.
 */
async function typings(buildFlags) {
  await clean();
  await runGulpTask('tsc', buildFlags);
  await packageDTS();
}

/** The commands this script accepts, as its first argument. */
const COMMANDS = {pack, typings};

/**
 * Options that are not handled here but passed straight through to the
 * build, which uses them to decide how strictly the Closure Compiler
 * checks the code.  See compile() in build_tasks.mjs.
 */
const BUILD_FLAGS = ['verbose', 'debug', 'strict'];

const USAGE = `Usage: node scripts/package.mjs [command] [options]

Packages Blockly for distribution on NPM.

Commands:
  pack       Build Blockly and assemble the complete package (default)
  typings    Build and assemble only the .d.ts files

Options:
  --verbose  Report all Closure Compiler warnings during the build
  --debug    Treat Closure Compiler warnings as errors
  --strict   As --debug, and also check types strictly
  --help     Show this message`;

try {
  const {positionals, values} = parseArgs({
    allowPositionals: true,
    options: {
      'help': {type: 'boolean'},
      ...Object.fromEntries(
        BUILD_FLAGS.map((flag) => [flag, {type: 'boolean'}]),
      ),
    },
  });
  if (values.help) {
    console.log(USAGE);
  } else {
    const [command = 'pack'] = positionals;
    if (!Object.hasOwn(COMMANDS, command)) {
      throw new Error(`Unknown command '${command}'.\n${USAGE}`);
    }
    // Any build flags given are not acted on here, but passed on to
    // the build.
    const buildFlags = BUILD_FLAGS.filter((flag) => values[flag]).map(
      (flag) => `--${flag}`,
    );
    await COMMANDS[command](buildFlags);
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
