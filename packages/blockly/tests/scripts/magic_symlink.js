const path = require('path');
const fs = require('fs');

/**
 * Ensure playground imports that use ../../node_modules/* continue to work
 * when npm hoists dependencies to the repository root node_modules dir
 */
function ensureWorkspaceNodeModulesLinks() {
  const workspaceNodeModules = path.resolve(__dirname, '../../node_modules');
  const rootNodeModules = path.resolve(__dirname, '../../../../node_modules');
  const packages = ['@blockly/dev-tools', '@blockly/theme-modern'];

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

ensureWorkspaceNodeModulesLinks();
