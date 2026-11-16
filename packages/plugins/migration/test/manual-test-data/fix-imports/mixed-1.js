// Manual test data for the renamings migration.
// Run using:
//   node ./bin/migrate fix-imports --from <version> ./test/manual-test-data/fix-imports/mixed-1.txt

import Blockly from 'blockly';
const BlocklyDart = require('blockly/dart');
import * as BlocklyLua from 'blockly/lua';
const BlocklyPhp = require('blockly/php');
import * as BlocklyPython from 'blockly/python';

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
