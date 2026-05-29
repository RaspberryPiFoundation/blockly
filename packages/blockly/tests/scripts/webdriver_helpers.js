/**
 * @license
 * Copyright 2026 Raspberry Pi Foundation
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Shared helpers for browser-based webdriver test runners.
 */

const {execFileSync} = require('child_process');
const fs = require('fs');

/**
 * Resolve the chromedriver binary for CI, preferring a system install.
 * @return {string|undefined}
 */
function resolveChromedriverPath() {
  if (process.env.CHROMEDRIVER_PATH) {
    return process.env.CHROMEDRIVER_PATH;
  }
  try {
    return execFileSync('which', ['chromedriver'], {encoding: 'utf8'}).trim();
  } catch {
    return undefined;
  }
}

/**
 * Resolve the Chrome/Chromium binary for CI.
 * @return {string|undefined}
 */
function resolveChromeBinary() {
  if (process.env.CHROME_BIN) {
    return process.env.CHROME_BIN;
  }
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Build webdriverio options with CI-friendly Chrome/chromedriver settings.
 * @param {!Object=} extraCapabilities Additional capability fields to merge in.
 * @return {!Object}
 */
function getWebdriverOptions(extraCapabilities = {}) {
  const chromeArgs = ['--allow-file-access-from-files'];
  const googChromeOptions = {args: chromeArgs};

  if (process.env.CI) {
    chromeArgs.push('--headless', '--no-sandbox', '--disable-dev-shm-usage');
  } else {
    // --disable-gpu is needed to prevent Chrome from hanging on Linux with
    // NVIDIA drivers older than v295.20. See
    // https://github.com/google/blockly/issues/5345 for details.
    chromeArgs.push('--disable-gpu');
  }

  const chromeBinary = resolveChromeBinary();
  if (chromeBinary) {
    googChromeOptions.binary = chromeBinary;
  }

  const chromedriverPath = resolveChromedriverPath();
  const capabilities = {
    browserName: 'chrome',
    'goog:chromeOptions': googChromeOptions,
    ...extraCapabilities,
  };
  if (chromedriverPath) {
    capabilities['wdio:chromedriverOptions'] = {binary: chromedriverPath};
  }

  const options = {
    capabilities,
    logLevel: 'warn',
  };

  if (chromedriverPath) {
    // Use the system chromedriver; do not download into /tmp.
    process.env.CHROMEDRIVER_PATH = chromedriverPath;
  }

  return options;
}

/**
 * Run a browser test script as the main module with reliable exit codes.
 * @param {function(): Promise<number|void>} runTests Function that returns 0 on
 *     success or a non-zero number on test failure. May throw on setup errors.
 */
function runBrowserTestMain(runTests) {
  runTests()
    .then((result) => {
      if (result) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  getWebdriverOptions,
  resolveChromeBinary,
  resolveChromedriverPath,
  runBrowserTestMain,
};
