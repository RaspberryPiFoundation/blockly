// Manual test data for the renamings migration.
// Run using:
//   node ./bin/migrate fix-imports --from <version> ./test/manual-test-data/fix-imports/mixed-1.txt

const Blockly = require('blockly');
import * as BlocklyDart from 'blockly/dart';
const BlocklyLua = require('blockly/lua');
import * as BlocklyPhp from 'blockly/php';
const BlocklyPython = require('blockly/python');

Blockly.JavaScript.something;
const something = Blockly.JavaScript.something;
Some.Other.identifer;

BlocklyDart.something;
const something = BlocklyDart.something;
Some.Other.identifer;

BlocklyLua.something;
const something = BlocklyLua.something;
Some.Other.identifer;

BlocklyPhp.something;
const something = BlocklyPhp.something;
Some.Other.identifer;

BlocklyPython.something;
const something = BlocklyPython.something;
Some.Other.identifer;

Blockly.libraryBlocks.something;
const something = Blockly.libraryBlocks.something;
Some.Other.identifer;

Blockly.zelos;
