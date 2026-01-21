/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Lua code generator class, including helper methods for
 * generating Lua for blocks.
 *
 * Based on Ellen Spertus's blocky-lua project.
 */

// Former goog.module ID: Blockly.Lua

import type {Block} from '../../core/block.js';
import {CodeGenerator} from '../../core/generator.js';
import {inputTypes} from '../../core/inputs/input_types.js';
import {Names} from '../../core/names.js';
import * as stringUtils from '../../core/utils/string.js';
import type {Workspace} from '../../core/workspace.js';

/**
 * Order of operation ENUMs.
 * http://www.lua.org/manual/5.3/manual.html#3.4.8
 */
// prettier-ignore
export enum Order {
  ATOMIC = 0,    // literals
  // The next level was not explicit in documentation and inferred by Ellen.
  HIGH = 1,            // Function calls, tables[]
  EXPONENTIATION = 2,  // ^
  UNARY = 3,           // not # - ~
  MULTIPLICATIVE = 4,  // * / %
  ADDITIVE = 5,        // + -
  CONCATENATION = 6,   // ..
  RELATIONAL = 7,      // < > <=  >= ~= ==
  AND = 8,             // and
  OR = 9,              // or
  NONE = 99,
}

/**
 * Lua code generator class.
 *
 * Note: Lua is not supporting zero-indexing since the language itself is
 * one-indexed, so the generator does not repoct the oneBasedIndex configuration
 * option used for lists and text.
 */
export class LuaGenerator extends CodeGenerator {
  constructor(name = 'Lua') {
    super(name);
    this.isInitialized = false;

    // Copy Order values onto instance for backwards compatibility
    // while ensuring they are not part of the publically-advertised
    // API.
    //
    // TODO(#7085): deprecate these in due course.  (Could initially
    // replace data properties with get accessors that call
    // deprecate.warn().)
    for (const key in Order) {
      // Must assign Order[key] to a temporary to get the type guard to work;
      // see https://github.com/microsoft/TypeScript/issues/10530.
      const value = Order[key];
      // Skip reverse-lookup entries in the enum.  Due to
      // https://github.com/microsoft/TypeScript/issues/55713 this (as
      // of TypeScript 5.5.2) actually narrows the type of value to
      // never - but that still allows the following assignment to
      // succeed.
      if (typeof value === 'string') continue;
      (this as unknown as Record<string, Order>)['ORDER_' + key] = value;
    }

    // List of illegal variable names.  This is not intended to be a
    // security feature.  Blockly is 100% client-side, so bypassing
    // this list is trivial.  This is intended to prevent users from
    // accidentally clobbering a built-in object or function.
    this.addReservedWords(
      // Special character
      '_,' +
        // From theoriginalbit's script:
        // https://github.com/espertus/blockly-lua/issues/6
        '__inext,assert,bit,colors,colours,coroutine,disk,dofile,error,fs,' +
        'fetfenv,getmetatable,gps,help,io,ipairs,keys,loadfile,loadstring,math,' +
        'native,next,os,paintutils,pairs,parallel,pcall,peripheral,print,' +
        'printError,rawequal,rawget,rawset,read,rednet,redstone,rs,select,' +
        'setfenv,setmetatable,sleep,string,table,term,textutils,tonumber,' +
        'tostring,turtle,type,unpack,vector,write,xpcall,_VERSION,__indext,' +
        // Not included in the script, probably because it wasn't enabled:
        'HTTP,' +
        // Keywords (http://www.lua.org/pil/1.3.html).
        'and,break,do,else,elseif,end,false,for,function,if,in,local,nil,not,' +
        'or,repeat,return,then,true,until,while,' +
        // Metamethods (http://www.lua.org/manual/5.2/manual.html).
        'add,sub,mul,div,mod,pow,unm,concat,len,eq,lt,le,index,newindex,call,' +
        // Basic functions (http://www.lua.org/manual/5.2/manual.html,
        // section 6.1).
        'assert,collectgarbage,dofile,error,_G,getmetatable,inpairs,load,' +
        'loadfile,next,pairs,pcall,print,rawequal,rawget,rawlen,rawset,select,' +
        'setmetatable,tonumber,tostring,type,_VERSION,xpcall,' +
        // Modules (http://www.lua.org/manual/5.2/manual.html, section 6.3).
        'require,package,string,table,math,bit32,io,file,os,debug',
    );
  }

  /**
   * Initialise the database of variable names.
   *
   * @param workspace Workspace to generate code from.
   */
  init(workspace: Workspace) {
    // Call Blockly.CodeGenerator's init.
    super.init(workspace);

    if (!this.nameDB_) {
      this.nameDB_ = new Names(this.RESERVED_WORDS_);
    } else {
      this.nameDB_.reset();
    }
    this.nameDB_.setVariableMap(workspace.getVariableMap());
    this.nameDB_.populateVariables(workspace);
    this.nameDB_.populateProcedures(workspace);

    this.isInitialized = true;
  }

  /**
   * Prepend the generated code with the variable definitions.
   *
   * @param code Generated code.
   * @returns Completed code.
   */
  finish(code: string): string {
    // Convert the definitions dictionary into a list.
    const definitions = Object.values(this.definitions_);
    // Call Blockly.CodeGenerator's finish.
    code = super.finish(code);
    this.isInitialized = false;

    this.nameDB_!.reset();
    return definitions.join('\n\n') + '\n\n\n' + code;
  }

  /**
   * Naked values are top-level blocks with outputs that aren't plugged into
   * anything. In Lua, an expression is not a legal statement, so we must assign
   * the value to the (conventionally ignored) _.
   * http://lua-users.org/wiki/ExpressionsAsStatements
   *
   * @param line Line of generated code.
   * @return Legal line of code.
   */
  scrubNakedValue(line: string): string {
    return 'local _ = ' + line + '\n';
  }

  /**
   * Encode a string as a properly escaped Lua string, complete with
   * quotes.
   *
   * @param string Text to encode.
   * @returns Lua string.
   */
  quote_(string: string): string {
    string = string
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\\n')
      .replace(/'/g, "\\'");
    return "'" + string + "'";
  }

  /**
   * Encode a string as a properly escaped multiline Lua string, complete with
   * quotes.
   *
   * @param string Text to encode.
   * @returns Lua string.
   */
  multiline_quote_(string: string): string {
    const lines = string.split(/\n/g).map(this.quote_);
    // Join with the following, plus a newline:
    // .. '\n' ..
    return lines.join(" .. '\\n' ..\n");
  }

  /**
   * Common tasks for generating Lua from blocks.
   * Handles comments for the specified block and any connected value blocks.
   * Calls any statements following this block.
   * @param block The current block.
   * @param code The Lua code created for this block.
   * @param thisOnly True to generate code for only this statement.
   * @returns Lua code with comments and subsequent blocks added.
   */
  scrub_(block: Block, code: string, thisOnly = false): string {
    let commentCode = '';
    // Only collect comments for blocks that aren't inline.
    if (!block.outputConnection || !block.outputConnection.targetConnection) {
      // Collect comment for this block.
      let comment = block.getCommentText();
      if (comment) {
        comment = stringUtils.wrap(comment, this.COMMENT_WRAP - 3);
        commentCode += this.prefixLines(comment, '-- ') + '\n';
      }
      // Collect comments for all value arguments.
      // Don't collect comments for nested statements.
      for (let i = 0; i < block.inputList.length; i++) {
        if (block.inputList[i].type === inputTypes.VALUE) {
          const childBlock = block.inputList[i].connection!.targetBlock();
          if (childBlock) {
            comment = this.allNestedComments(childBlock);
            if (comment) {
              commentCode += this.prefixLines(comment, '-- ');
            }
          }
        }
      }
    }
    const nextBlock =
      block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = thisOnly ? '' : this.blockToCode(nextBlock);
    return commentCode + code + nextCode;
  }
}
