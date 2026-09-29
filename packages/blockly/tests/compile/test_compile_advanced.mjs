import {
  appendFile,
  readFile,
  unlink,
  writeFile,
} from 'node:fs/promises';

import globStream from 'glob-stream';
import * as path from 'path';

import {posixPath} from '../../scripts/helpers.js';
import {compile} from '../../scripts/build.mjs';
import {TSC_OUTPUT_DIR_POSIX} from '../../scripts/build_constants.mjs';

/**
 * Resolve glob patterns to file paths using glob-stream
 */
function globStreamToArray(patterns) {
  return new Promise((resolve, reject) => {
    const paths = [];
    globStream(patterns)
      .on('data', (file) => paths.push(posixPath(path.relative(process.cwd(), file.path))))
      .on('error', reject)
      .on('end', () => resolve(paths));
  });
}
/**
 * This task uses Closure Compiler's ADVANCED_OPTIMIZATIONS mode to
 * compile together Blockly core, blocks and generators with a simple
 * test app; the purpose is to verify that Blockly is compatible with
 * the ADVANCED_OPTIMIZATIONS mode.
 *
 * Prerequisite: tsc.
 */
async function compileAdvancedCompilationTest() {
  const outputPath = path.join('tests', 'compile', 'main_compressed.js');
  const mapPath = `${outputPath}.map`;

  // If main_compressed.js exists (from a previous run) delete it so that
  // a later browser-based test won't check it should the compile fail.
  try {
    await unlink(outputPath);
  } catch {
    // Probably it didn't exist.
  }

  const mainPath = 'tests/compile/main.js';
  const srcs = [
    ...(await globStreamToArray(TSC_OUTPUT_DIR_POSIX + '/**/*.js')),
    mainPath,
    'tests/compile/test_blocks.js',
  ];

  const options = {
    js: srcs,
    dependency_mode: 'PRUNE',
    compilation_level: 'ADVANCED_OPTIMIZATIONS',
    entry_point: './' + mainPath,
    js_output_file: outputPath,
    create_source_map: mapPath,
  };

  await compile(options);

  const sourceMap = JSON.parse(await readFile(mapPath, 'utf8'));
  sourceMap.file = path.basename(outputPath);
  sourceMap.sourceRoot = '../../'; 
  delete sourceMap.sourcesContent;

  await writeFile(mapPath, JSON.stringify(sourceMap));
  await appendFile(
    outputPath,
    `\n//# sourceMappingURL=${path.basename(mapPath)}\n`,
  );
}

compileAdvancedCompilationTest();