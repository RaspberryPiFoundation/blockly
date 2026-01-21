/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Node.js script to run generator tests in Chrome, via webdriver.
 */
var webdriverio = require('webdriverio');
var fs = require('fs');
var path = require('path');


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
  var elem = await browser.$("#importExport");
  var result = await elem.getValue();
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
 * @return The Thenable managing the processing of the browser tests.
 */
async function runGeneratorsInBrowser(outputDir) {
  var options = {
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

  var url = 'file://' + __dirname + '/index.html';
  var prefix = path.join(outputDir, 'generated');

  console.log('Starting webdriverio...');
  const browser = await webdriverio.remote(options);

  // Increase the script timeouts to 2 minutes to allow the generators to finish.
  await browser.setTimeout({ 'script': 120000 })

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

  await browser.deleteSession();
}

if (require.main === module) {
  runGeneratorsInBrowser('tests/generators/tmp').catch(e => {
    console.error(e);
    process.exit(1);
  }).then(function(result) {
    if (result) {
      console.log('Generator tests failed');
      process.exit(1);
    } else {
      console.log('Generator tests passed');
      process.exit(0);
    }
  });
}

module.exports = {runGeneratorsInBrowser};
