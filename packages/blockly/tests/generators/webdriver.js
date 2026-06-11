/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Node.js script to run generator tests in Chrome, via webdriver.
 */
const webdriverio = require('webdriverio');
const fs = require('fs');
const path = require('path');
const {
  getWebdriverOptions,
  runBrowserTestMain,
} = require('../scripts/webdriver_helpers.js');

/**
 * Run the generator for a given language and save the results to a file.
 * @param {Thenable} browser A Thenable managing the processing of the browser
 *     tests.
 * @param {string} filename Where to write the output file.
 * @param {Function} codegenFn The function to run for code generation for this
 *     language.
 */
async function runLangGeneratorInBrowser(browser, filename, codegenFn) {
  await browser.execute(codegenFn);
  const elem = await browser.$('#importExport');
  const result = await elem.getValue();
  fs.writeFileSync(filename, result, function(err) {
    if (err) {
      return console.log(err);
    }
  });
}

/**
 * Runs the generator tests in Chrome. It uses webdriverio to
 * launch Chrome and load index.html. Outputs a summary of the test results
 * to the console and outputs files for later validation.
 * @param {string} outputDir Output directory.
 * @return {number} 0 on success.
 */
async function runGeneratorsInBrowser(outputDir) {
  const options = getWebdriverOptions();

  const url = 'file://' + __dirname + '/index.html';
  const prefix = path.join(outputDir, 'generated');

  console.log('Starting webdriverio...');
  const browser = await webdriverio.remote(options);

  try {
    // Increase the script timeouts to 2 minutes to allow generators to finish.
    await browser.setTimeout({'script': 120000});

    console.log('Loading url: ' + url);
    await browser.url(url);

    await browser
        .$('.blocklySvg .blocklyWorkspace > .blocklyBlockCanvas')
        .waitForExist({timeout: 2000});

    await browser.execute(function() {
      checkAll();
      return loadSelected();
    });

    await runLangGeneratorInBrowser(browser, prefix + '.js',
        function() {
          toJavaScript();
        });
    await runLangGeneratorInBrowser(browser, prefix + '.py',
        function() {
          toPython();
        });
    await runLangGeneratorInBrowser(browser, prefix + '.dart',
        function() {
          toDart();
        });
    await runLangGeneratorInBrowser(browser, prefix + '.lua',
        function() {
          toLua();
        });
    await runLangGeneratorInBrowser(browser, prefix + '.php',
        function() {
          toPhp();
        });
  } finally {
    await browser.deleteSession();
  }

  console.log('Generator browser tests completed.');
  return 0;
}

if (require.main === module) {
  const outputDir = process.argv[2] || 'tests/generators/tmp';
  runBrowserTestMain(() => runGeneratorsInBrowser(outputDir));
}

module.exports = {runGeneratorsInBrowser};
