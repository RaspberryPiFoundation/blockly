import fs from 'fs-extra';

/**
 * Create package directory if it doesn't exist yet.
 * Throws if the directory exists and isn't the current directory.
 * @param {string} path Path at which to create directory.
 */
export function checkAndCreateDir(path) {
  const root = process.cwd();
  // If we're already in the desired directory, don't need to create it.
  if (path == root) {
    return;
  }
  if (fs.existsSync(path)) {
    console.error(
      `Package directory ${path} already exists. Delete it and try again.`,
    );
    process.exit(1);
  } else {
    // Create the directory.
    fs.mkdirSync(path);
  }
}
