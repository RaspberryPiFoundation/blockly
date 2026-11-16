import {execSync} from 'child_process';

import {TSC_OUTPUT_DIR, TYPINGS_BUILD_DIR} from './build_constants.mjs';

/**
 * Builds Blockly as a JS program, by running tsc on all the files in
 * the core directory.
 */
function tsc() {
  execSync(
    `npx tsc -outDir "${TSC_OUTPUT_DIR}" -declarationDir "${TYPINGS_BUILD_DIR}"`,
    {stdio: 'inherit'},
  );
  execSync(`node scripts/tsick.js "${TSC_OUTPUT_DIR}"`, {stdio: 'inherit'});
}

tsc();
