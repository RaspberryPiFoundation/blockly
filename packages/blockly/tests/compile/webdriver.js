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


/**
 * Run the generator for a given language and save the results to a file.
 * @param {Thenable} browser A Thenable managing the processing of the browser
 *     tests.
 */
async function runHealthCheckInBrowser(browser) {
  const result = await browser.execute(() => {
      return healthCheck();
  })
  if (!result) throw Error('Health check failed in advanced compilation test.');
  console.log('Health check completed successfully.');
}

/**
 * Runs the generator tests in Chrome. It uses webdriverio to
 * launch Chrome and load index.html. Outputs a summary of the test results
 * to the console and outputs files for later validation.
 * @return the Thenable managing the processing of the browser tests.
 */
async function runCompileCheckInBrowser() {
  const options = {
    capabilities: {
      browserName: 'chrome',
    },
    logLevel: 'warn',
  };
  // Run in headless mode on Github Actions.
  if (process.env.CI) {
    options.capabilities['goog:chromeOptions'] = {
      args: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    };
  } else {
    // --disable-gpu is needed to prevent Chrome from hanging on Linux with
    // NVIDIA drivers older than v295.20. See
    // https://github.com/google/blockly/issues/5345 for details.
    options.capabilities['goog:chromeOptions'] = {
      args: ['--disable-gpu']
    };
  }

  const url = 'file://' + __dirname + '/index.html';

  console.log('Starting webdriverio...');
  const browser = await webdriverio.remote(options);
  console.log('Loading url: ' + url);
  await browser.url(url);

  await runHealthCheckInBrowser(browser);

  await browser.deleteSession();
}

if (require.main === module) {
  runCompileCheckInBrowser().catch(e => {
    console.error(e);
    process.exit(1);
  }).then(function(result) {
    if (result) {
      console.log('Compile test failed');
      process.exit(1);
    } else {
      console.log('Compile test passed');
      process.exit(0);
    }
  });
}

module.exports = {runCompileCheckInBrowser};
