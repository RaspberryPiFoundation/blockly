import {loadChunk} from '../tests/scripts/load.mjs';
import './blockly.loader.mjs';

export const {
  DartGenerator,
  Order,
  dartGenerator,
} = await loadChunk(
  'build/src/generators/dart.js',
  'dist/dart_compressed.js',
  'dart',
);
