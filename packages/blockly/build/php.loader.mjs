import {loadChunk} from '../tests/scripts/load.mjs';
import './blockly.loader.mjs';

export const {
  Order,
  PhpGenerator,
  phpGenerator,
} = await loadChunk(
  'build/src/generators/php.js',
  'dist/php_compressed.js',
  'php',
);
