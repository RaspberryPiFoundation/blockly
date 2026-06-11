/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Node.js script to run Mocha tests in Chrome, via webdriver.
 */
const webdriverio = require('webdriverio');
const fs = require('fs');
const path = require('path');
const {posixPath} = require('../../scripts/helpers');
const {
  getWebdriverOptions,
  runBrowserTestMain,
} = require('../scripts/webdriver_helpers.js');

/** @const {number} Max time to wait for the browser test page to finish. */
const PAGE_TIMEOUT_MS = 120000;

/** @const {number} Max time to wait for browser.deleteSession(). */
const DELETE_SESSION_TIMEOUT_MS = 15000;

/**
 * Ensure browser test imports that use ../../node_modules/* continue to work
 * when npm hoists dependencies to the repository root node_modules dir
 */
function ensureWorkspaceNodeModulesLinks() {
  const workspaceNodeModules = path.resolve(__dirname, '../../node_modules');
  const rootNodeModules = path.resolve(__dirname, '../../../../node_modules');
  const packages = ['mocha', 'sinon', 'chai', '@blockly/dev-tools'];

  for (const pkg of packages) {
    const workspacePkgPath = path.join(workspaceNodeModules, pkg);
    const rootPkgPath = path.join(rootNodeModules, pkg);

    if (fs.existsSync(workspacePkgPath) || !fs.existsSync(rootPkgPath)) {
      continue;
    }

    fs.mkdirSync(path.dirname(workspacePkgPath), {recursive: true});
    fs.symlinkSync(rootPkgPath, workspacePkgPath, 'dir');
  }
}

/**
 * Run a promise with a timeout.
 * @param {!Promise} promise The promise to run.
 * @param {number} timeoutMs Timeout in milliseconds.
 * @param {string} label Description for timeout errors.
 * @return {!Promise}
 */
function withTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(label + ' timed out after ' + timeoutMs + 'ms'));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Close the browser session, with a timeout so CI cannot hang forever.
 * @param {?Object} browser The webdriverio browser instance.
 */
async function closeBrowserSession(browser) {
  if (!browser) {
    return;
  }
  try {
    await withTimeout(
        browser.deleteSession(),
        DELETE_SESSION_TIMEOUT_MS,
        'browser.deleteSession()',
    );
  } catch (e) {
    console.warn('Failed to close browser session:', e.message);
  }
}

/**
 * Enable focus emulation via CDP. Wrapped in a timeout because this call
 * has been observed to hang intermittently on CI.
 * @param {!Object} browser The webdriverio browser instance.
 */
async function enableFocusEmulation(browser) {
  const timeoutMs = 10000;
  try {
    await withTimeout(
        (async () => {
          const puppeteer = await browser.getPuppeteer();
          await browser.call(async () => {
            const page = (await puppeteer.pages())[0];
            const session = await page.createCDPSession();
            await session.send('Emulation.setFocusEmulationEnabled', {
              enabled: true,
            });
          });
        })(),
        timeoutMs,
        'Focus emulation setup',
    );
  } catch (e) {
    console.warn('Focus emulation setup failed (continuing anyway):',
        e.message);
  }
}

/**
 * Print browser-side load diagnostics when tests fail to start or finish.
 * @param {!Object} browser The webdriverio browser instance.
 */
async function printBrowserLoadDiagnostics(browser) {
  if (!browser) {
    return;
  }
  try {
    await withTimeout((async () => {
      console.log('============Blockly Mocha Load Diagnostics================');
      const loadStatus = await browser.$('#loadStatus')
          .getAttribute('data-status');
      console.log('Load status:', loadStatus ?? 'unknown');
      const loadErrors = await browser.execute(() => {
        return window.__blocklyTestLoadState?.errors ?? [];
      });
      if (loadErrors.length) {
        console.log('Captured load errors:');
        for (const error of loadErrors) {
          console.log('  ' + error);
        }
      }
      const failureMessagesEls = await browser.$$('#failureMessages p');
      for (const el of failureMessagesEls) {
        const messageHtml = await el.getHTML();
        console.log(messageHtml.replace(/<\/?p>/g, ''));
      }
      if (loadStatus === 'pending' || loadStatus === 'imports-complete') {
        console.log(
            'Blockly or test modules may not have loaded completely.');
      }
      console.log('==========================================================');
    })(), 10000, 'Load diagnostics');
  } catch (diagErr) {
    console.warn('Could not collect browser diagnostics:', diagErr.message);
  }
}

/**
 * Wait until Mocha reports results or the page reports a load failure.
 * @param {!Object} browser The webdriverio browser instance.
 */
async function waitForTestCompletion(browser) {
  await browser.waitUntil(async() => {
    const failureCount = await browser.$('#failureCount')
        .getAttribute('tests_failed');
    if (failureCount !== 'unset') {
      return true;
    }
    const loadStatus = await browser.$('#loadStatus')
        .getAttribute('data-status');
    return loadStatus === 'failed';
  }, {
    timeout: PAGE_TIMEOUT_MS,
    timeoutMsg: 'Timed out waiting for Mocha tests to finish. Blockly may ' +
        'have failed to load; see load diagnostics below.',
  });
}

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
  // Gulp may pass a done callback as the first argument.
  if (typeof exitOnCompletion === 'function') {
    exitOnCompletion = true;
  }
  return runMochaTestsInBrowserImpl(exitOnCompletion);
}

/**
 * @param {boolean} exitOnCompletion True if the browser should quit after tests.
 * @return {number} 0 on success, 1 on failure.
 */
async function runMochaTestsInBrowserImpl(exitOnCompletion) {
  ensureWorkspaceNodeModulesLinks();

  const options = getWebdriverOptions();

  const url = 'file://' + posixPath(__dirname) + '/index.html';
  console.log('Starting webdriverio...');
  let browser;
  let numOfFailure = '1';
  let pageLoaded = false;
  let testsCompleted = false;
  try {
    browser = await webdriverio.remote(options);
    console.log('Loading URL: ' + url);
    await browser.url(url);
    pageLoaded = true;

    // Focus emulation via CDP has hung on CI; skip there.
    if (!process.env.CI) {
      await enableFocusEmulation(browser);
    }

    await waitForTestCompletion(browser);
    testsCompleted = true;

    const elem = await browser.$('#failureCount');
    numOfFailure = await elem.getAttribute('tests_failed');

    if (numOfFailure > 0) {
      console.log('============Blockly Mocha Test Failures================');
      const failureMessagesEls = await browser.$$('#failureMessages p');
      if (!failureMessagesEls.length) {
        console.log('There is at least one test failure, but no messages ' +
            'reported. Mocha may be failing because no tests are being run.');
      }
      for (const el of failureMessagesEls) {
        const messageHtml = await el.getHTML();
        console.log(messageHtml.replace(/<\/?p>/g, ''));
      }
    }
  } catch (e) {
    await printBrowserLoadDiagnostics(browser);
    throw e;
  } finally {
    if (exitOnCompletion) {
      await closeBrowserSession(browser);
    }
  }

  if (!pageLoaded) {
    throw new Error(
        'Mocha browser tests did not start: Chrome failed to load the test ' +
        'page. Check chromedriver and Chrome setup.',
    );
  }
  if (!testsCompleted) {
    throw new Error(
        'Mocha browser tests did not finish: the test page never reported ' +
        'results.',
    );
  }

  console.log('============Blockly Mocha Test Summary=================');
  console.log(numOfFailure + ' tests failed');
  console.log('============Blockly Mocha Test Summary=================');
  if (parseInt(numOfFailure) !== 0) {
    return 1;
  }
  return 0;
}

if (require.main === module) {
  runBrowserTestMain(() => runMochaTestsInBrowser());
}

module.exports = {runMochaTestsInBrowser};
