/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Node.js script to run Mocha tests in Chrome, via webdriver.
 */
const webdriverio = require('webdriverio');
const {posixPath} = require('../../scripts/helpers');


/**
 * Runs the Mocha tests in this directory in Chrome. It uses webdriverio to
 * launch Chrome and load index.html. Outputs a summary of the test results
 * to the console.
 *
 * @param {boolean} exitOnCompletetion True if the browser should automatically
 *     quit after tests have finished running.
 * @return {number} 0 on success, 1 on failure.
 */
async function runMochaTestsInBrowser(exitOnCompletion = true) {
  const options = {
    capabilities: {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: ['--allow-file-access-from-files'],
      },
    },
    logLevel: 'warn',
  };

  // Run in headless mode on Github Actions.
  if (process.env.CI) {
    options.capabilities['goog:chromeOptions'].args.push(
        '--headless', '--no-sandbox', '--disable-dev-shm-usage',);
  } else {
    // --disable-gpu is needed to prevent Chrome from hanging on Linux with
    // NVIDIA drivers older than v295.20. See
    // https://github.com/google/blockly/issues/5345 for details.
    options.capabilities['goog:chromeOptions'].args.push('--disable-gpu');
  }

  const url = 'file://' + posixPath(__dirname) + '/index.html';
  console.log('Starting webdriverio...');
  const browser = await webdriverio.remote(options);
  console.log('Loading URL: ' + url);
  await browser.url(url);

  // Toggle the devtools setting to emulate focus, so that the window will
  // always act as if it has focus regardless of the state of the window manager
  // or operating system. This improves the reliability of FocusManager-related
  // tests.
  const puppeteer = await browser.getPuppeteer();
  await browser.call(async () => {
    const page = (await puppeteer.pages())[0];
    const session = await page.createCDPSession();
    await session.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  });

  await browser.waitUntil(async() => {
    const elem = await browser.$('#failureCount');
    const text = await elem.getAttribute('tests_failed');
    return text !== 'unset';
  }, {
    timeout: 100000,
  });

  const elem = await browser.$('#failureCount');
  const numOfFailure = await elem.getAttribute('tests_failed');

  if (numOfFailure > 0) {
    console.log('============Blockly Mocha Test Failures================');
    const failureMessagesEls = await browser.$$('#failureMessages p');
    if (!failureMessagesEls.length) {
      console.log('There is at least one test failure, but no messages reported. Mocha may be failing because no tests are being run.');
    }
    for (const el of failureMessagesEls) {
      const messageHtml = await el.getHTML();
      console.log(messageHtml.replace('<p>', '').replace('</p>', ''));
    }
  }

  console.log('============Blockly Mocha Test Summary=================');
  console.log(numOfFailure + ' tests failed');
  console.log('============Blockly Mocha Test Summary=================');
  if (parseInt(numOfFailure) !== 0) {
    return 1;
  }
  if (exitOnCompletion) await browser.deleteSession();
  return 0;
}

if (require.main === module) {
  runMochaTestsInBrowser().catch((e) => {
    console.error(e);
    process.exit(1);
  }).then(function(result) {
    if (result) {
      console.log('Mocha tests failed');
      process.exit(1);
    } else {
      console.log('Mocha tests passed');
      process.exit(0);
    }
  });
}

module.exports = {runMochaTestsInBrowser};
