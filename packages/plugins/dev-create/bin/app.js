const {styleText} = require('node:util');
const fs = require('node:fs');
const path = require('node:path');
const execSync = require('node:child_process').execSync;
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
  fs.cpSync(path.resolve(__dirname, sampleDir), appPath, {
    recursive: true,
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
  console.log(styleText('green', 'Success!'));

  console.log('You can start the development server now by typing:');
  console.log(styleText('blue', `  cd ${dir}`));
  if (options.skipInstall) {
    console.log(styleText('blue', '  npm install'));
  }
  console.log(styleText('blue', '  npm start'));
  console.log('See README.md for more commands and information.');
};
