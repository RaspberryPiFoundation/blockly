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
import {execSync} from 'child_process';
import {getPackageJson} from '../lib/package_json.mjs';
import {cleanBuildDir, cleanReleaseDir} from '../lib/fs_utils.mjs';
import {rimraf} from 'rimraf';

const demoTmpDir = '_deploy';
const demoStaticTmpDir = '_deploy/static';
const demoStaticBlocklyDir = '_deploy/static/packages/blockly';

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
 * Copies demo and media files into the static deploy directory.
 */
function copyStaticSrc(done) {
  return gulp.src(['demos/**', 'media/**'], {base: '.', encoding: false})
      .pipe(gulp.dest(demoStaticTmpDir));
}

/**
 * Copies needed built files into the static deploy directory.
 *
 * Prerequisite: clean, build.
 */
function copyBuilt(done) {
  return gulp.src([
      'build/src/**/*',
      'build/msg/*',
      'dist/*_compressed.js*',
      'build/*.loader.mjs'
    ], {base: '.'}).pipe(gulp.dest(demoStaticTmpDir));
}

/**
 * Copies appengine files into deploy directory.
 */
function copyAppengineSrc() {
  const appengineSrc = [
      `appengine/**/*`,
      `appengine/.gcloudignore`,
  ];
  return gulp.src(appengineSrc).pipe(gulp.dest(demoTmpDir));
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
 * Executes the build command.
 */
function execBuild(done) {
  execSync('npm run build', {stdio: 'inherit'});
  done()
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
            gulp.parallel(cleanBuildDir,
                          cleanReleaseDir),
            execBuild,
            copyBuilt),
        ));

/**
 * Deploys demos.
 */
export const deployDemos = gulp.series(prepareDemos, deployAndClean);

/**
 * Deploys beta version of demos (version appended with -beta).
 */
export const deployDemosBeta = gulp.series(prepareDemos, deployBetaAndClean);
