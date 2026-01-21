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

const UPSTREAM_URL = 'https://github.com/google/blockly.git';

/**
 * Extra paths to include in the gh_pages branch (beyond the normal
 * contents of master / develop).  Passed to shell unquoted, so can
 * include globs.
 */
const EXTRAS = [
  'build/msg',
  'dist/*_compressed.js*',
  'node_modules/@blockly',
  'build/*.loader.mjs',
];

let upstream = null;

/**
 * Get name of git remote for upstream (typically 'upstream', but this
 * is just convention and can be changed.)
 */
function getUpstream() {
  if (upstream) return upstream;
  for (const line of String(execSync('git remote -v')).split('\n')) {
    if (line.includes('google/blockly')) {
      upstream = line.split('\t')[0];
      return upstream;
    }
  }
  throw new Error('Unable to determine upstream URL');
}

/**
 * Stash current state, check out the named branch, and sync with
 * google/blockly.
 */
function syncBranch(branchName) {
  return function(done) {
    execSync('git stash save -m "Stash for sync"', { stdio: 'inherit' });
    checkoutBranch(branchName);
    execSync(`git pull ${UPSTREAM_URL} ${branchName}`, { stdio: 'inherit' });
    execSync(`git push origin ${branchName}`, { stdio: 'inherit' });
    done();
  };
}

/**
 * Stash current state, check out develop, and sync with
 * google/blockly.
 */
export function syncDevelop() {
  return syncBranch('develop');
};

/**
 * Stash current state, check out master, and sync with
 * google/blockly.
 */
export function syncMaster() {
  return syncBranch('master');
};

/**
 * Helper function: get a name for a rebuild branch. Format:
 * rebuild_mm_dd_yyyy.
 */
function getRebuildBranchName() {
  const date = new Date();
  const mm = date.getMonth() + 1;  // Month, 0-11
  const dd = date.getDate();  // Day of the month, 1-31
  const yyyy = date.getFullYear();
  return `rebuild_${mm}_${dd}_${yyyy}`;
};

/**
 * Helper function: get a name for a rebuild branch. Format:
 * rebuild_yyyy_mm.
 */
function getRCBranchName() {
  const date = new Date();
  const mm = date.getMonth() + 1;  // Month, 0-11
  const yyyy = date.getFullYear();
  return `rc_${yyyy}_${mm}`;
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
 * Create and push an RC branch.
 * Note that this pushes to google/blockly.
 */
export const createRC = gulp.series(
  syncDevelop(),
  function(done) {
    const branchName = getRCBranchName();
    execSync(`git switch -C ${branchName}`, { stdio: 'inherit' });
    execSync(`git push ${UPSTREAM_URL} ${branchName}`, { stdio: 'inherit' });
    done();
  }
);

/** Create the rebuild branch. */
export function createRebuildBranch(done) {
  const branchName = getRebuildBranchName();
  console.log(`make-rebuild-branch: creating branch ${branchName}`);
  execSync(`git switch -C ${branchName}`, { stdio: 'inherit' });
  done();
}

/** Push the rebuild branch to origin. */
export function pushRebuildBranch(done) {
  console.log('push-rebuild-branch: committing rebuild');
  execSync('git commit -am "Rebuild"', { stdio: 'inherit' });
  const branchName = getRebuildBranchName();
  execSync(`git push origin ${branchName}`, { stdio: 'inherit' });
  console.log(`Branch ${branchName} pushed to GitHub.`);
  console.log('Next step: create a pull request against develop.');
  done();
}

/**
 * Update github pages with what is currently in develop.
 *
 * Prerequisites (invoked): clean, build.
 */
export const updateGithubPages = gulp.series(
  function(done) {
    execSync('git stash save -m "Stash for sync"', { stdio: 'inherit' });
    execSync('git switch -C gh-pages', { stdio: 'inherit' });
    execSync(`git fetch ${getUpstream()}`, { stdio: 'inherit' });
    execSync(`git reset --hard ${getUpstream()}/develop`, { stdio: 'inherit' });
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
