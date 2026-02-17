/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Git-related gulp tasks for Blockly.
 */

import * as gulp from 'gulp';
import {execSync} from 'child_process';

import * as buildTasks from './build_tasks.mjs';
import * as packageTasks from './package_tasks.mjs';

const UPSTREAM_URL = 'git@github.com:RaspberryPiFoundation/blockly.git';

/**
 * Extra paths to include in the gh_pages branch (beyond the normal
 * contents of main).  Passed to shell unquoted, so can
 * include globs.
 */
const EXTRAS = [
  'build/msg',
  'dist/*_compressed.js*',
  'node_modules/@blockly',
  'build/*.loader.mjs',
];

/**
 * Stash current state, check out the named branch, and pull
 * changes from RaspberryPiFoundation/blockly.
 */
function syncBranch(branchName) {
  return function(done) {
    execSync('git stash save -m "Stash for sync"', { stdio: 'inherit' });
    checkoutBranch(branchName);
    execSync(`git pull ${UPSTREAM_URL} ${branchName}`, { stdio: 'inherit' });
    done();
  };
}

/**
 * Stash current state, check out main, and sync with
 * RaspberryPiFoundation/blockly.
 */
export function syncMain() {
  return syncBranch('main');
};

/**
 * If branch does not exist then create the branch.
 * If branch exists switch to branch.
 */
function checkoutBranch(branchName) {
  execSync(`git switch -c ${branchName}`,
      { stdio: 'inherit' });
}

/**
 * Update github pages with what is currently in main.
 *
 * Prerequisites (invoked): clean, build.
 */
export const updateGithubPages = gulp.series(
  syncMain,
  function(done) {
    execSync('git switch -C gh-pages', { stdio: 'inherit' });
    execSync(`git reset --hard main`, { stdio: 'inherit' });
    done();
  },
  buildTasks.cleanBuildDir,
  packageTasks.cleanReleaseDir,
  buildTasks.build,
  function(done) {
    // Extra paths (e.g. build/, dist/ etc.) are normally gitignored,
    // so we have to force add.
    execSync(`git add -f ${EXTRAS.join(' ')}`, {stdio: 'inherit'});
    execSync('git commit -am "Rebuild"', {stdio: 'inherit'});
    execSync(`git push ${UPSTREAM_URL} gh-pages --force`, {stdio: 'inherit'});
    done();
  }
);
