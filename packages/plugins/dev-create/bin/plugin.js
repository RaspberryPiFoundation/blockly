#!/usr/bin/env node
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A script for creating Blockly plugins based on pre-existing
 * templates.
 */

'use strict';

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;
const {checkAndCreateDir} = require('./common');

const pluginTypes = ['plugin', 'field', 'block', 'theme'];

const root = process.cwd();

exports.createPlugin = function (pluginName, options) {
  let gitRoot = '';
  let gitURL = '';
  try {
    gitRoot = execSync(`git rev-parse --show-toplevel`).toString().trim();
    gitURL = execSync(`git config --get remote.origin.url`)
      .toString()
      .trim()
      .replace(/\.git$/, '');
  } catch {
    // NOP
  }

  const isGit = !!gitURL;
  const isFirstParty =
    options.firstParty ||
    gitURL == 'https://github.com/RaspberryPiFoundation/blockly-samples';

  /**
   * Gets the name of the plugin prefixed with the type.
   * Default to the plugin name if the type=plugin, otherwise use [type]-[name].
   * @param {string} name Plugin name.
   * @param {string} type Plugin type.
   * @returns {string} Plugin name prefixed with type.
   */
  const getPrefixedName = function (name, type) {
    // Don't add 'plugin' prefix for default type
    if (type == 'plugin') return name;
    // If the name is already prefixed, just return the name.
    if (name.startsWith(`${type}-`)) return name;
    // Add the prefix if not already present.
    return `${type}-${name}`;
  };

  // Default to type=plugin.
  const pluginType = options.type || 'plugin';
  const prefixedName = getPrefixedName(pluginName, pluginType);
  const pluginDir = options.dir || prefixedName;
  const pluginPath = path.join(root, pluginDir);
  const pluginAuthor = options.author || (isFirstParty ? 'Blockly Team' : '');

  const isTypescript = options.typescript;
  const skipInstall = options.skipInstall;

  // Check plugin type.
  if (!pluginTypes.includes(pluginType)) {
    console.error(`Unknown plugin type: ${chalk.red(pluginType)}`);
    console.log(`Available types: ${chalk.green(pluginTypes.join(', '))}`);
    process.exit(1);
  }

  // Create the new directory if needed.
  checkAndCreateDir(pluginPath);

  console.log(
    `Creating a new Blockly ${chalk.green(pluginType)} with name ` +
      `${chalk.green(pluginName)} in ${chalk.green(pluginPath)}.\n`,
  );

  const templatesDir = `../templates`;
  const templateDir = `${templatesDir}/${
    isTypescript ? 'typescript-' : ''
  }${pluginType}/`;

  // Only use the @blockly scope for first party plugins.
  const pluginScope = isFirstParty ? '@blockly/' : 'blockly-';
  const pluginPackageName = `${pluginScope}${prefixedName}`;

  const gitPluginPath = path.join(path.relative(gitRoot, root), pluginDir);

  const latestBlocklyVersion = execSync('npm show blockly version')
    .toString()
    .trim();

  const packageJson = {
    name: pluginPackageName,
    version: `0.0.0`,
    description: `A Blockly ${pluginType}.`,
    scripts: {
      'audit:fix': 'blockly-scripts auditFix',
      'build': 'blockly-scripts build',
      'clean': 'blockly-scripts clean',
      'predeploy': 'blockly-scripts predeploy',
      'start': 'blockly-scripts start',
      'test': 'blockly-scripts test',
    },
    main: './dist/index.js',
    module: './src/index.js',
    unpkg: './dist/index.js',
    author: pluginAuthor,
    keywords: [
      'blockly',
      'blockly-plugin',
      pluginType != 'plugin' && `blockly-${pluginType}`,
      pluginName,
    ].filter(Boolean),
    homepage: isGit ? `${gitURL}/tree/master/${gitPluginPath}#readme` : '',
    bugs: isGit
      ? {
          url: `${gitURL}/issues`,
        }
      : {},
    repository: isGit
      ? {
          type: 'git',
          url: `${gitURL}.git`,
          directory: gitPluginPath,
        }
      : {},
    license: 'Apache-2.0',
    directories: {
      dist: 'dist',
      src: 'src',
    },
    files: ['dist', 'src'],
    devDependencies: {},
    peerDependencies: {
      blockly: `^${latestBlocklyVersion}`,
    },
    publishConfig: isFirstParty
      ? {
          access: 'public',
        }
      : {},
  };

  // Add dev dependencies.
  const devDependencies = [
    'blockly',
    '@blockly/dev-scripts',
    '@blockly/dev-tools',
  ];
  if (isTypescript) {
    devDependencies.push('typescript');
  }
  devDependencies.forEach((dep) => {
    const latestVersion = execSync(`npm show ${dep} version`).toString().trim();
    packageJson.devDependencies[dep] = `^${latestVersion}`;
  });

  // Write the README.md to the new package.
  let readme = fs.readFileSync(
    path.resolve(__dirname, templateDir, 'README.md'),
    'utf-8',
  );
  readme = readme.replace(/@blockly\/plugin/gim, `${pluginPackageName}`);
  fs.writeFileSync(path.join(pluginPath, 'README.md'), readme, 'utf-8');

  // Copy the rest of the template folder into the new package.
  fs.copySync(path.resolve(__dirname, templateDir, 'template'), pluginPath);

  // Copy third party plugin files to the new package if third-party.
  if (!isFirstParty) {
    fs.copySync(
      path.resolve(__dirname, templatesDir, 'third_party'),
      pluginPath,
    );
  }

  // Write the package.json to the new package.
  fs.writeFileSync(
    path.join(pluginPath, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  );

  // Run npm install.
  if (!skipInstall) {
    console.log('Installing packages. This might take a couple of minutes.');
    execSync(`cd ${pluginDir} && npm install`, {stdio: 'inherit'});
  }

  console.log(
    `Success! Created ${pluginType} '${pluginName}' at ${pluginPath}`,
  );
  console.log(`\n  ${chalk.blue(`  npm start`)}`);
  console.log(`    Starts the development server.\n`);
  console.log(`  ${chalk.blue(`  npm run build`)}`);
  console.log(`    Builds a production build of the plugin.\n`);
  console.log(`  ${chalk.blue(`  npm test`)}`);
  console.log(`    Runs mocha tests.\n\n`);

  console.log(`You can begin by typing:`);
  console.log(chalk.blue(`  cd ${pluginDir}`));
  if (skipInstall) {
    console.log(chalk.blue(`  npm install`));
  }
  console.log(chalk.blue(`  npm start`));
  console.log(`Search ${chalk.red(`'TODO'`)} to see remaining tasks.`);

  process.exit(1);
};
