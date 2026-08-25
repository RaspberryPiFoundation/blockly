/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Builds Blockly and force-pushes the result to the gh-pages
 * branch.
 *
 * Usage:
 *   node scripts/update_github_pages.mjs
 *       # sync main, then push to origin
 *   node scripts/update_github_pages.mjs --upstream
 *       # sync main, then push to RaspberryPiFoundation/blockly
 *   node scripts/update_github_pages.mjs --remote <remote>
 *       # sync main, then push to the named remote
 *   node scripts/update_github_pages.mjs --use-local
 *       # build the current branch instead of syncing main
 */

import {execSync} from 'node:child_process';
import {parseArgs} from 'node:util';

const UPSTREAM_URL = 'git@github.com:RaspberryPiFoundation/blockly.git';

/**
 * Extra paths to include in the gh-pages branch (beyond the normal
 * contents of main).  Passed to shell unquoted, so can include globs.
 */
const EXTRAS = ['build/msg', 'dist/*_compressed.js*', 'build/*.loader.mjs'];

const USAGE = `Usage: node scripts/update_github_pages.mjs [options]

Builds Blockly and force-pushes the result to the gh-pages branch.

Options:
  --remote <remote>  Remote to push gh-pages to (default: origin)
  --upstream         Push to RaspberryPiFoundation/blockly instead of origin
  --use-local        Build and push the current branch instead of syncing main
  --help             Show this message`;

/**
 * Runs a command, forwarding its output to this process's stdio.
 *
 * @param {string} command The command to run.
 */
function run(command) {
  execSync(command, {stdio: 'inherit'});
}

/**
 * Runs a command and returns its trimmed stdout.
 * Used when the output of a command is needed as a value.
 *
 * @param {string} command The command to run.
 * @returns {string} The command's output.
 */
function capture(command) {
  return execSync(command, {encoding: 'utf8'}).trim();
}

/**
 * Resolves which remote to use for pushing gh-pages.
 *
 * @param {string|undefined} remoteArg The remote named on the command line.
 * @returns {string|undefined} The remote name, or undefined if not found.
 */
function resolveRemote(remoteArg) {
  const remoteName = remoteArg || 'origin';
  try {
    const remotes = capture('git remote')
      .split(/\r?\n/)
      .map((remote) => remote.trim())
      .filter(Boolean);
    return remotes.includes(remoteName) ? remoteName : undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * Stashes the current state, checks out main, and pulls changes from
 * RaspberryPiFoundation/blockly.
 */
function syncMain() {
  run('git stash save -m "Stash for sync"');
  run('git switch main || git switch -c main');
  run(`git pull ${UPSTREAM_URL} main`);
}

/**
 * Updates github pages with what is currently in main (or the current branch
 * if useLocal is set).
 *
 * @param {{remote: (string|undefined), upstream: (boolean|undefined),
 *     useLocal: (boolean|undefined)}} options Command line options.
 */
function updateGithubPages({remote, upstream, useLocal}) {
  const remoteToUse = upstream ? UPSTREAM_URL : resolveRemote(remote);
  if (!remoteToUse) {
    const remoteLabel = remote
      ? `Remote '${remote}'`
      : "Remote 'origin' (default)";
    throw new Error(
      `${remoteLabel} not found in git remotes. ` +
        'Please add that remote or use --upstream.\n' +
        `${USAGE}`,
    );
  }

  if (useLocal && capture('git status --porcelain')) {
    throw new Error(
      'You cannot push the local branch with uncommitted changes. ' +
        'Please commit or stash your changes first.',
    );
  }

  let sourceRef;
  if (useLocal) {
    sourceRef = capture('git rev-parse HEAD');
  } else {
    syncMain();
    sourceRef = 'main';
  }

  run('git switch -C gh-pages');
  run(`git reset --hard ${sourceRef}`);

  run('npm run clean');
  run('npm run build');

  // Extra paths (e.g. build/, dist/ etc.) are normally gitignored,
  // so we have to force add.
  run(`git add -f ${EXTRAS.join(' ')}`);
  run('git commit -am "Rebuild"');
  run(`git push ${remoteToUse} gh-pages --force`);
}

const {values} = parseArgs({
  options: {
    'remote': {type: 'string'},
    'upstream': {type: 'boolean'},
    'use-local': {type: 'boolean'},
    'help': {type: 'boolean'},
  },
});

if (values.help) {
  console.log(USAGE);
} else {
  try {
    updateGithubPages({
      remote: values.remote,
      upstream: values.upstream,
      useLocal: values['use-local'],
    });
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
