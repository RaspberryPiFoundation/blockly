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
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import * as buildTasks from './build_tasks.mjs';
import * as packageTasks from './package_tasks.mjs';

const UPSTREAM_URL = 'git@github.com:RaspberryPiFoundation/blockly.git';

// Use yargs to parse --remote argument
const argv = yargs(hideBin(process.argv)).option('remote', {
    type: 'string',
    describe: 'Remote to push gh-pages to',
    demandOption: false
}).option('upstream', {
  type: 'boolean',
  describe: 'Push to RaspberryPiFoundation/blockly instead of origin',
  demandOption: false
}).option('use-local', {
  type: 'boolean',
  describe: 'Build and push from current branch instead of syncing with main',
  demandOption: false
}).help().argv;
const remoteToUse = argv.upstream ? UPSTREAM_URL : resolveRemote(argv.remote);

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
 * If branch exists switch to branch.
 * If branch does not exist then create the branch.
 */
function checkoutBranch(branchName) {
  execSync(`git switch ${branchName} || git switch -c ${branchName}`,
      { stdio: 'inherit' });
}

/**
 * Update github pages with what is currently in main (or current branch if --use-local).
 *
 * Prerequisites (invoked): clean, build.
 *
 * Usage:
 *   gulp updateGithubPages # sync main, then use origin if exists
 *   gulp updateGithubPages --upstream # uses hardcoded upstream
 *   gulp updateGithubPages --remote <remote> # uses named remote
 *   gulp updateGithubPages --use-local # build from current branch, skip syncing main
 *
 */
export const updateGithubPages = gulp.series(
    function (done) {
        if (!remoteToUse) {
          const attemptedRemote = argv.remote || 'origin';
          const remoteLabel = argv.remote
            ? `Remote '${attemptedRemote}'`
            : "Remote 'origin' (default)";
          const errMsg = `${remoteLabel} not found in git remotes. ` +
            'Please add that remote or use --upstream.\n' +
            'Usage: gulp updateGithubPages [--remote <remote> | --upstream]';
          console.error(errMsg);
          done(new Error(errMsg));
          return;
        }
        done();
    },
    function (done) {
      if (!argv.useLocal) {
        done();
        return;
      }
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        const errMsg =
          'You cannot push the local branch with uncommitted changes. ' +
          'Please commit or stash your changes first.';
        console.error(errMsg);
        done(new Error(errMsg));
        return;
      }
      done();
    },
    function (done) {
      if (argv.useLocal) {
        done();
        return;
      }
      syncMain()(done);
    },
    function(done) {
      const sourceRef = argv.useLocal
        ? execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
        : 'main';
      execSync('git switch -C gh-pages', { stdio: 'inherit' });
      execSync(`git reset --hard ${sourceRef}`, { stdio: 'inherit' });
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
      execSync(`git push ${remoteToUse} gh-pages --force`, {stdio: 'inherit'});
      done();
    }
  );

/**
 * Resolves which remote to use for pushing gh-pages.
 * @param {string} remoteArg
 * @returns {string|undefined} The remote name, or undefined if not found.
 */
function resolveRemote(remoteArg) {
  const remoteName = remoteArg || 'origin';
  try {
    const remotes = execSync('git remote', {encoding: 'utf8'}).split(/\r?\n/).map(r => r.trim()).filter(Boolean);
    if (remotes.includes(remoteName)) {
      return remoteName;
    }
    return undefined;
  } catch (e) {
    return undefined;
  }
}
