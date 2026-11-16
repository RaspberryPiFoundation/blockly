import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import {execSync} from 'child_process';
import {checkAndCreateDir} from './common.js';

export function createApp(name, options) {
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
    return path.resolve(import.meta.dirname, sampleDir, file);
  });
  fs.copySync(path.resolve(import.meta.dirname, sampleDir), appPath, {
    filter(src) {
      return !excludes.includes(src);
    },
  });

  // Create package.json file for app.
  const templateJson = JSON.parse(
    fs.readFileSync(
      path.resolve(import.meta.dirname, sampleDir, 'package.json'),
      'utf8',
    ),
  );
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
}
