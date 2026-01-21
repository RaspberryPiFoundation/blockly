/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Gulp scripts for releasing Blockly.
 */

import {execSync} from 'child_process';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as readlineSync from 'readline-sync';

import * as gitTasks from './git_tasks.mjs';
import * as packageTasks from './package_tasks.mjs';
import {getPackageJson} from './helper_tasks.mjs';
import {RELEASE_DIR} from './config.mjs';


// Gets the current major version.
function getMajorVersion() {
  const { version } = getPackageJson();
  const re = new RegExp(/^(\d)./);
  const match = re.exec(version);
  if (!match[0]) {
    return null;
  }
  console.log(match[0]);
  return parseInt(match[0]);
}

// Updates the version depending on user input.
function updateVersion(done, updateType) {
  const majorVersion = getMajorVersion();
  if (!majorVersion) {
    done(new Error('Something went wrong when getting the major version number.'));
  } else if (!updateType) {
    // User selected to cancel.
    done(new Error('Cancelling process.'));
  }

  switch (updateType.toLowerCase()) {
    case 'major':
      majorVersion++;
      execSync(`npm --no-git-tag-version version ${majorVersion}.$(date +'%Y%m%d').0`, {stdio: 'inherit'});
      done();
      break;
    case 'minor':
      execSync(`npm --no-git-tag-version version ${majorVersion}.$(date +'%Y%m%d').0`, {stdio: 'inherit'});
      done();
      break;
    case 'patch':
      execSync(`npm --no-git-tag-version version patch`, {stdio: 'inherit'});
      done();
      break;
    default:
      done(new Error('Unexpected update type was chosen.'))
  }
}

// Prompt the user to figure out what kind of version update we should do.
function updateVersionPrompt(done) {
  const releaseTypes = ['Major', 'Minor', 'Patch'];
  const index = readlineSync.keyInSelect(releaseTypes, 'Which version type?');
  updateVersion(done, releaseTypes[index]);
}

// Checks with the user that they are on the correct git branch.
function checkBranch(done) {
  const gitBranchName = execSync('git rev-parse --abbrev-ref HEAD').toString();
  if (readlineSync.keyInYN(`You are on '${gitBranchName.trim()}'. Is this the correct branch?`)) {
    done();
  } else {
    done(new Error('Not on correct branch'));
  }
}


// Sanity check that the RELASE_DIR directory exists, and that certain
// files are in it.
function checkReleaseDir(done) {
  const sanityFiles = ['blockly_compressed.js', 'blocks_compressed.js'];
  // Check that directory exists.
  if (fs.existsSync(RELEASE_DIR)) {
    // Sanity check that certain files exist in RELASE_DIR.
    sanityFiles.forEach((fileName) => {
      if (!fs.existsSync(`${RELEASE_DIR}/${fileName}`)) {
        done(new Error(
            `Your ${RELEASE_DIR} directory does not contain ${fileName}`));
        return;
      }
    });
    done();
  } else {
    done(new Error(`The ${RELEASE_DIR} directory does not exist.  ` +
        'Has packageTasks.package been run?'));
  }
}

// Check with the user that the version number is correct, then login and publish to npm.
function loginAndPublish_(done, isBeta) {
  const { version } = getPackageJson();
  if (readlineSync.keyInYN(`You are about to publish blockly with the version number:${version}. Do you want to continue?`)) {
    execSync(`npm login --registry https://wombat-dressing-room.appspot.com`, {stdio: 'inherit'});
    execSync(`npm publish --registry https://wombat-dressing-room.appspot.com ${isBeta ? '--tag beta' : ''}`, {cwd: RELEASE_DIR, stdio: 'inherit'});
    done();
  } else {
    done(new Error('User quit due to the version number not being correct.'));
  }
}

// Login and publish.
function loginAndPublish(done) {
  return loginAndPublish_(done, false);
}

// Login and publish the beta version.
function loginAndPublishBeta(done) {
  return loginAndPublish_(done, true);
}

// Repeatedly prompts the user for a beta version number until a valid one is given.
// A valid version number must have '-beta.x' and can not have already been used to publish to npm.
function updateBetaVersion(done) {
  let isValid = false;
  let newVersion = null;
  const blocklyVersions = JSON.parse(execSync('npm view blockly versions --json').toString());
  const re = new RegExp(/-beta\.(\d)/);
  const latestBetaVersion = execSync('npm show blockly version --tag beta').toString().trim();
  while (!isValid) {
    newVersion = readlineSync.question(`What is the new beta version? (latest beta version: ${latestBetaVersion})`);
    const existsOnNpm = blocklyVersions.includes(newVersion);
    const isFormatted = newVersion.search(re) > -1;
    if (!existsOnNpm && isFormatted) {
      isValid = true;
    } else if (existsOnNpm) {
      console.log("This version already exists. Please enter a new version.");
    } else if (!isFormatted) {
      console.log("To publish a beta version you must have -beta.x in the version.");
    }
  }
  // Allow the same version here, since we already check the version does not exist on npm.
  execSync(`npm --no-git-tag-version --allow-same-version version ${newVersion}`, {stdio: 'inherit'});
  done();
}

// Rebuild, package and publish to npm.
export const publish = gulp.series(
  packageTasks.pack,  // Does clean + build.
  checkBranch,
  checkReleaseDir,
  loginAndPublish
);

// Rebuild, package and publish a beta version of Blockly.
export const publishBeta = gulp.series(
  updateBetaVersion,
  packageTasks.pack,  // Does clean + build.
  checkBranch,
  checkReleaseDir,
  loginAndPublishBeta
);

// Switch to a new branch, update the version number, build Blockly
// and check in the resulting built files.
export const recompile = gulp.series(
  gitTasks.syncDevelop(),
  gitTasks.createRebuildBranch,
  updateVersionPrompt,
  packageTasks.pack,  // Does clean + build.
  gitTasks.pushRebuildBranch
  );
