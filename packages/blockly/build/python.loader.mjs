import {loadChunk} from '../tests/scripts/load.mjs';
import './blockly.loader.mjs';

export const {
  Order,
  PythonGenerator,
  pythonGenerator,
} = await loadChunk(
  'build/src/generators/python.js',
  'dist/python_compressed.js',
  'python',
);
