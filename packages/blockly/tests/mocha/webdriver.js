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
 * Enable focus emulation via CDP. Wrapped in a timeout because this call
 * has been observed to hang intermittently on CI.
 * @param {!Object} browser The webdriverio browser instance.
 */
async function enableFocusEmulation(browser) {
  const timeoutMs = 30000;
  try {
    await Promise.race([
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
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Focus emulation setup timed out after ' +
              timeoutMs + 'ms'));
        }, timeoutMs);
      }),
    ]);
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
    console.log('============Blockly Mocha Load Diagnostics================');
    const loadStatus = await browser.$('#loadStatus').getAttribute('data-status');
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
  } catch (diagErr) {
    console.warn('Could not collect browser diagnostics:', diagErr.message);
  }
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
  ensureWorkspaceNodeModulesLinks();

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
  let browser;
  let numOfFailure = '1';
  try {
    browser = await webdriverio.remote(options);
    console.log('Loading URL: ' + url);
    await browser.url(url);

    // Toggle the devtools setting to emulate focus, so that the window will
    // always act as if it has focus regardless of the state of the window
    // manager or operating system. This improves the reliability of
    // FocusManager-related tests.
    await enableFocusEmulation(browser);

    await browser.waitUntil(async() => {
      const elem = await browser.$('#failureCount');
      const text = await elem.getAttribute('tests_failed');
      return text !== 'unset';
    }, {
      timeout: 200000,
      timeoutMsg: 'Timed out waiting for Mocha tests to finish. Blockly may ' +
          'have failed to load; see load diagnostics below.',
    });

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
    if (exitOnCompletion && browser) {
      try {
        await browser.deleteSession();
      } catch (deleteErr) {
        console.warn('Failed to close browser session:', deleteErr.message);
      }
    }
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
