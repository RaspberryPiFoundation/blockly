import {loadChunk} from '../tests/scripts/load.mjs';
import './blockly.loader.mjs';

export const {
  LuaGenerator,
  Order,
  luaGenerator,
} = await loadChunk(
  'build/src/generators/lua.js',
  'dist/lua_compressed.js',
  'lua',
);
