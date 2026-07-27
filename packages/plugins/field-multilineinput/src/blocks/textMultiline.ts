/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Block, common as BlocklyCommon} from 'blockly/core';
import {
  JavascriptGenerator,
  Order as JavascriptOrder,
} from 'blockly/javascript';
import {DartGenerator, Order as DartOrder} from 'blockly/dart';
import {LuaGenerator, Order as LuaOrder} from 'blockly/lua';
import {PhpGenerator, Order as PhpOrder} from 'blockly/php';
import {PythonGenerator, Order as PythonOrder} from 'blockly/python';
import {registerFieldMultilineInput} from '../field_multilineinput';
import {Generators} from './generatorsType';

/** The name this block is registered under. */
export const BLOCK_NAME = 'text_multiline';

// Block for multiline text input.
const jsonDefinition = {
  type: BLOCK_NAME,
  message0: '%1 %2',
  args0: [
    {
      type: 'field_image',
      src:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAARCAYAAADpP' +
        'U2iAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAdhgAAHYYBXaITgQAAABh0RVh0' +
        'U29mdHdhcmUAcGFpbnQubmV0IDQuMS42/U4J6AAAAP1JREFUOE+Vks0KQUEYhjm' +
        'RIja4ABtZ2dm5A3t3Ia6AUm7CylYuQRaUhZSlLZJiQbFAyRnPN33y01HOW08z88' +
        '73zpwzM4F3GWOCruvGIE4/rLaV+Nq1hVGMBqzhqlxgCys4wJA65xnogMHsQ5luj' +
        'nYHTejBBCK2mE4abjCgMGhNxHgDFWjDSG07kdfVa2pZMf4ZyMAdWmpZMfYOsLiD' +
        'MYMjlMB+K613QISRhTnITnsYg5yUd0DETmEoMlkFOeIT/A58iyK5E18BuTBfgYX' +
        'fwNJv4P9/oEBerLylOnRhygmGdPpTTBZAPkde61lbQe4moWUvYUZYLfUNftIY4z' +
        'wA5X2Z9AYnQrEAAAAASUVORK5CYII=',
      width: 12,
      height: 17,
      alt: '\u00B6',
    },
    {
      type: 'field_multilinetext',
      name: 'TEXT',
      text: '',
    },
  ],
  output: 'String',
  style: 'text_blocks',
  helpUrl: '%{BKY_TEXT_TEXT_HELPURL}',
  tooltip: '%{BKY_TEXT_TEXT_TOOLTIP}',
  extensions: ['parent_tooltip_when_inline'],
};

/**
 * Javascript block generator function.
 *
 * @param block The Block instance to generate code for.
 * @param generator The JavascriptGenerator calling the function.
 * @returns A tuple containing the code string and precedence.
 */
export function toJavascript(
  block: Block,
  generator: JavascriptGenerator,
): [string, JavascriptOrder] {
  // Text value.
  const code = generator.multiline_quote_(block.getFieldValue('TEXT'));
  const order =
    code.indexOf('+') !== -1
      ? JavascriptOrder.ADDITION
      : JavascriptOrder.ATOMIC;
  return [code, order];
}

/**
 * Dart block generator function.
 *
 * @param block The Block instance to generate code for.
 * @param generator The DartGenerator calling the function.
 * @returns A tuple containing the code string and precedence.
 */
export function toDart(
  block: Block,
  generator: DartGenerator,
): [string, DartOrder] {
  // Text value.
  const code = generator.multiline_quote_(block.getFieldValue('TEXT'));
  const order =
    code.indexOf('+') !== -1 ? DartOrder.ADDITIVE : DartOrder.ATOMIC;
  return [code, order];
}

/**
 * Lua block generator function.
 *
 * @param block The Block instance to generate code for.
 * @param generator The LuaGenerator calling the function.
 * @returns A tuple containing the code string and precedence.
 */
export function toLua(
  block: Block,
  generator: LuaGenerator,
): [string, LuaOrder] {
  // Text value.
  const code = generator.multiline_quote_(block.getFieldValue('TEXT'));
  const order =
    code.indexOf('..') !== -1 ? LuaOrder.CONCATENATION : LuaOrder.ATOMIC;
  return [code, order];
}

/**
 * PHP block generator function.
 *
 * @param block The Block instance to generate code for.
 * @param generator The PhpGenerator calling the function.
 * @returns A tuple containing the code string and precedence.
 */
export function toPhp(
  block: Block,
  generator: PhpGenerator,
): [string, PhpOrder] {
  // Text value.
  const code = generator.multiline_quote_(block.getFieldValue('TEXT'));
  const order =
    code.indexOf('.') !== -1 ? PhpOrder.STRING_CONCAT : PhpOrder.ATOMIC;
  return [code, order];
}

/**
 * Python block generator function.
 *
 * @param block The Block instance to generate code for.
 * @param generator The PythonGenerator calling the function.
 * @returns A tuple containing the code string and precedence.
 */
export function toPython(
  block: Block,
  generator: PythonGenerator,
): [string, PythonOrder] {
  // Text value.
  const code = generator.multiline_quote_(block.getFieldValue('TEXT'));
  const order =
    code.indexOf('+') !== -1 ? PythonOrder.ADDITIVE : PythonOrder.ATOMIC;
  return [code, order];
}

const definitionsDict = BlocklyCommon.createBlockDefinitionsFromJsonArray([
  jsonDefinition,
]);

/** The text_multiline BlockDefinition. */
export const blockDefinition = definitionsDict[BLOCK_NAME];

/**
 * Install the `text_multiline` block and all of its dependencies.
 *
 * @param gens The CodeGenerators to install per-block
 *     generators on.
 */
export function installBlock(gens: Generators = {}) {
  registerFieldMultilineInput();
  BlocklyCommon.defineBlocks(definitionsDict);
  if (gens.javascript) gens.javascript.forBlock[BLOCK_NAME] = toJavascript;
  if (gens.dart) gens.dart.forBlock[BLOCK_NAME] = toDart;
  if (gens.lua) gens.lua.forBlock[BLOCK_NAME] = toLua;
  if (gens.php) gens.php.forBlock[BLOCK_NAME] = toPhp;
  if (gens.python) gens.python.forBlock[BLOCK_NAME] = toPython;
}
