import {loadChunk} from '../tests/scripts/load.mjs';
import './blockly.loader.mjs';

export const {
  JavascriptGenerator,
  Order,
  javascriptGenerator,
} = await loadChunk(
  'build/src/generators/javascript.js',
  'dist/javascript_compressed.js',
  'javascript',
);
