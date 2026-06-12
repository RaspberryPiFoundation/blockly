/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Node.js script to check the health of the compile test in
 * Chrome, via webdriver.
 */
const webdriverio = require('webdriverio');
const {
  getWebdriverOptions,
  runBrowserTestMain,
} = require('../scripts/webdriver_helpers.js');

/**
 * Run the health check in the browser.
 * @param {Thenable} browser A Thenable managing the processing of the browser
 *     tests.
 */
async function runHealthCheckInBrowser(browser) {
  const result = await browser.execute(() => {
    return healthCheck();
  });
  if (!result) {
    throw Error('Health check failed in advanced compilation test.');
  }
  console.log('Health check completed successfully.');
}

/**
 * Runs the compile health check in Chrome.
 * @return {number} 0 on success.
 */
async function runCompileCheckInBrowser() {
  const options = getWebdriverOptions();

  const url = 'file://' + __dirname + '/index.html';

  console.log('Starting webdriverio...');
  const browser = await webdriverio.remote(options);
  try {
    console.log('Loading url: ' + url);
    await browser.url(url);
    await runHealthCheckInBrowser(browser);
  } finally {
    await browser.deleteSession();
  }
  return 0;
}

if (require.main === module) {
  runBrowserTestMain(() => runCompileCheckInBrowser());
}

module.exports = {runCompileCheckInBrowser};
