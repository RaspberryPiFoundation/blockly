/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Gulp script to deploy Blockly demos on appengine.
 */

import * as gulp from 'gulp';

import * as fs from 'fs';
import * as path from 'path';
import {execSync} from 'child_process';
import * as buildTasks from './build_tasks.mjs';
import {getPackageJson} from './helper_tasks.mjs';
import * as packageTasks from './package_tasks.mjs';
import {rimraf} from 'rimraf';

const demoTmpDir = '../_deploy';
const demoStaticTmpDir = '../_deploy/static';

/**
 * Cleans and creates the tmp directory used for deploying.
 */
function prepareDeployDir(done) {
  // Clean directory if exists.
  if (fs.existsSync(demoTmpDir)) {
    rimraf.sync(demoTmpDir);
  }
  fs.mkdirSync(demoStaticTmpDir, {recursive: true});
  done();
}

/**
 * Copies all files from current git index into static deploy
 * directory.  We do this rather than just copying the working tree,
 * because the working tree is probably full of leftover editor
 * backup-save files, vesigial empty directories, etc.
 */
function copyStaticSrc(done) {
  execSync(`GIT_WORK_TREE='${demoStaticTmpDir}' git checkout-index --all`,
      { stdio: 'inherit' });
  done();
}

/**
 * Copies needed built files into the static deploy directory.
 *
 * Prerequisite: clean, build.
 */
function copyBuilt(done) {
  return gulp.src(['build/msg/*', 'dist/*_compressed.js*', 'build/*.loader.mjs'], {base: '.'})
      .pipe(gulp.dest(demoStaticTmpDir));
}

/**
 * Copies compressed files into the places they used to be used from, for the
 * benefit of our Developers site and (for now) any other websites that
 * hotlink them.  Delete this once devsite is fixed.
 *
 * Prerequisite: clean, build.
 */
function copyCompressedToOldLocation(done) {
  return gulp.src(['dist/*_compressed.js*'])
      .pipe(gulp.dest(demoStaticTmpDir));
}

/**
 * Copies messages files into the places they used to be used from, for the
 * benefit of our Developers site and (for now) any other websites that
 * hotlink them.  Delete this once devsite is fixed.
 *
 * Prerequisite: clean, build.
 */
function copyMessagesToOldLocation(done) {
  return gulp.src(['build/msg/*'])
      .pipe(gulp.dest(demoStaticTmpDir + '/msg/js'));
}

/**
 * Copies appengine files into deploy directory.
 */
function copyAppengineSrc() {
  const appengineSrc = [
      `${demoStaticTmpDir}/appengine/**/*`,
      `${demoStaticTmpDir}/appengine/.gcloudignore`,
  ];
  return gulp.src(appengineSrc).pipe(gulp.dest(demoTmpDir));
}

/**
 * Copies playground deps into deploy directory.
 */
function copyPlaygroundDeps() {
  const playgroundDeps = [
      './node_modules/@blockly/dev-tools/dist/index.js',
      './node_modules/@blockly/theme-modern/dist/index.js',
      './node_modules/@blockly/block-test/dist/index.js',
      './node_modules/@blockly/keyboard-navigation/dist/index.js',
  ];
  return gulp.src(playgroundDeps, {base: '.'}).pipe(gulp.dest(demoStaticTmpDir));
}

/**
 * Deploys files from tmp directory to appengine to version based on the version
 * passed in and then cleans the tmp directory.
 */
function deployToAndClean(demoVersion) {
  try {
    execSync(`gcloud app deploy --project blockly-demo --version ${demoVersion} --no-promote`, { stdio: 'inherit', cwd: demoTmpDir });
  } finally {
    // Clean up tmp directory.
    if (fs.existsSync(demoTmpDir)) {
      rimraf.sync(demoTmpDir);
    }
  }
}

/**
 * Constructs a demo version name based on the version specified in
 * package.json.
 */
function getDemosVersion() {
  // Replace all '.' with '-' e.g. 9-3-3-beta-2
  return getPackageJson().version.replace(/\./g, '-');
}

/**
 * Deploys files from tmp directory to appengine to version based on the version
 * specified in package.json and then cleans the tmp directory.
 */
function deployAndClean(done) {
  const demoVersion = getDemosVersion();
  deployToAndClean(demoVersion);
  done();
}

/**
 * Constructs a beta demo version name based on the current date.
 */
function getDemosBetaVersion() {
  const date = new Date();
  const mm = date.getMonth() + 1;  // Month, 0-11
  const dd = date.getDate();  // Day of the month, 1-31
  const yyyy = date.getFullYear();
  return `${yyyy}${mm < 10 ? '0' + mm : mm}${dd}-beta`;
}

/**
 * Deploys files from tmp directory to appengine to a beta version based on the
 * current date and then cleans the tmp directory.
 */
function deployBetaAndClean(done) {
  const demoVersion = getDemosBetaVersion();
  deployToAndClean(demoVersion);
  done();
}

/**
 * Prepares demos.
 *
 * Prerequisites (invoked): clean, build
 */
export const prepareDemos = gulp.series(
    prepareDeployDir,
    gulp.parallel(
        gulp.series(
            copyStaticSrc,
            copyAppengineSrc),
        gulp.series(
            gulp.parallel(buildTasks.cleanBuildDir,
                          packageTasks.cleanReleaseDir),
            buildTasks.build,
            gulp.parallel(copyBuilt,
                          copyCompressedToOldLocation,
                          copyMessagesToOldLocation)),
        copyPlaygroundDeps));

/**
 * Deploys demos.
 */
export const deployDemos = gulp.series(prepareDemos, deployAndClean);

/**
 * Deploys beta version of demos (version appended with -beta).
 */
export const deployDemosBeta = gulp.series(prepareDemos, deployBetaAndClean);
