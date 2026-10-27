/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A 'build' script for Blockly extension packages.
 * This script compiles the src directory with tsc, twice:
 *   - as ES modules into dist/esm
 *   - as CommonJS into dist/cjs
 * TypeScript packages are built with their tsconfig.json (ESM) and
 * tsconfig.cjs.json (CommonJS). JavaScript packages have no tsconfig, so they
 * are built with equivalent command line options.
 * @author samelh@google.com (Sam El-Husseini)
 */

import {spawnSync} from 'child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'fs';
import {createRequire} from 'module';
import {join, resolve} from 'path';

import chalk from 'chalk';

const appDirectory = realpathSync(process.cwd());
const resolveApp = (relativePath) => resolve(appDirectory, relativePath);
const exists = (relativePath) => existsSync(resolveApp(relativePath));

const packageJson = JSON.parse(
  readFileSync(resolveApp('package.json'), 'utf8'),
);
console.log(`Running production build for ${packageJson.name}`);

if (!exists('src/index.js') && !exists('src/index.ts')) {
  console.log(`${chalk.red(`Configuration error.`)}
Make sure a ${chalk.red('src/index.(js|ts)')} file is included in your package.
`);
  process.exit(1);
}

const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');

/**
 * Runs tsc in the package directory, exiting the process if it fails.
 * @param {Array<string>} args The arguments to pass to tsc.
 * @param {string} label A description of the build, used in log messages.
 */
function runTsc(args, label) {
  console.log(`Compiling ${label}...`);
  const result = spawnSync(process.execPath, [tsc, ...args], {
    cwd: appDirectory,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.log(chalk.red(`Failed to compile ${label}.\n`));
    process.exit(1);
  }
}

/**
 * Lists the JavaScript files under src, for packages that have no tsconfig.
 * @returns {Array<string>} The paths of the JavaScript files.
 */
function listJavaScriptFiles() {
  return readdirSync(resolveApp('src'), {withFileTypes: true, recursive: true})
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => join(entry.parentPath, entry.name));
}

// Clean the dist folder before starting a new build
rmSync(resolveApp('dist'), {recursive: true, force: true});

if (exists('tsconfig.json')) {
  runTsc(['-p', 'tsconfig.json', '--outDir', 'dist/esm'], 'ES modules');
  if (exists('tsconfig.cjs.json')) {
    runTsc(['-p', 'tsconfig.cjs.json', '--outDir', 'dist/cjs'], 'CommonJS');
  } else {
    // Packages without a tsconfig.cjs.json get a CommonJS build from their
    // tsconfig.json with the module settings overridden.
    runTsc(
      [
        '-p',
        'tsconfig.json',
        '--module',
        'commonjs',
        '--moduleResolution',
        'bundler',
        '--outDir',
        'dist/cjs',
      ],
      'CommonJS',
    );
  }
} else {
  // Plain javascript (no tsconfig) options
  const options = [
    '--allowJs',
    '--declaration',
    '--declarationMap',
    '--sourceMap',
    '--target',
    'es2022',
    '--rootDir',
    'src',
  ];
  const files = listJavaScriptFiles();
  runTsc(
    [
      ...options,
      '--module',
      'nodenext',
      '--moduleResolution',
      'nodenext',
      '--outDir',
      'dist/esm',
      ...files,
    ],
    'ES modules',
  );
  runTsc(
    [
      ...options,
      '--module',
      'commonjs',
      '--moduleResolution',
      'bundler',
      '--outDir',
      'dist/cjs',
      ...files,
    ],
    'CommonJS',
  );
}

// The package is "type": "module", so tell Node that the .js files in
// dist/cjs are CommonJS.
mkdirSync(resolveApp('dist/cjs'), {recursive: true});
writeFileSync(
  resolveApp('dist/cjs/package.json'),
  JSON.stringify({type: 'commonjs'}, null, 2) + '\n',
);

console.log(chalk.green('Compiled successfully!'));
