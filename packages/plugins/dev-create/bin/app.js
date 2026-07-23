const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;
const {checkAndCreateDir} = require('./common');

exports.createApp = function (name, options) {
  const root = process.cwd();
  const dir = options.dir ?? name;
  const appPath = path.join(root, dir);

  // Create the new directory for the app if needed.
  checkAndCreateDir(appPath);
  console.log(
    `Creating a new Blockly application called ${name} in ${appPath}`,
  );

  // Copy over files from sample-app directory.
  const sampleDir = options.typescript
    ? '../templates/sample-app-ts'
    : '../templates/sample-app';
  const excludes = [
    'node_modules',
    'dist',
    'package-lock.json',
    'package.json',
  ].map((file) => {
    return path.resolve(__dirname, sampleDir, file);
  });
  fs.copySync(path.resolve(__dirname, sampleDir), appPath, {
    filter(src) {
      return !excludes.includes(src);
    },
  });

  // Create package.json file for app.
  const templateJson = require(path.join(sampleDir, 'package.json'));
  const packageJson = {
    ...templateJson,
    name: name,
    author: options.author || '',
  };

  // Write the package.json to the new package.
  fs.writeFileSync(
    path.join(appPath, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  );

  // Run `npm install` to get things ready for user.
  if (!options.skipInstall) {
    console.log('Installing packages. This might take a couple of minutes.');
    execSync(`cd ${dir} && npm install`, {stdio: 'inherit'});
  }

  // Print helpful instructions.
  console.log(chalk.green('Success!'));

  console.log('You can start the development server now by typing:');
  console.log(chalk.blue(`  cd ${dir}`));
  if (options.skipInstall) {
    console.log(chalk.blue('  npm install'));
  }
  console.log(chalk.blue('  npm start'));
  console.log('See README.md for more commands and information.');
};
