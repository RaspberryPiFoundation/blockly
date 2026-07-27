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
import {registerFieldColour} from '../field_colour';
import {Generators} from './generatorsType';

/** The name this block is registered under. */
export const BLOCK_NAME = 'colour_blend';

// Block for blending two colours together.
const jsonDefinition = {
  type: BLOCK_NAME,
  message0:
    '%{BKY_COLOUR_BLEND_TITLE} %{BKY_COLOUR_BLEND_COLOUR1} ' +
    '%1 %{BKY_COLOUR_BLEND_COLOUR2} %2 %{BKY_COLOUR_BLEND_RATIO} %3',
  args0: [
    {
      type: 'input_value',
      name: 'COLOUR1',
      check: 'Colour',
      align: 'RIGHT',
    },
    {
      type: 'input_value',
      name: 'COLOUR2',
      check: 'Colour',
      align: 'RIGHT',
    },
    {
      type: 'input_value',
      name: 'RATIO',
      check: 'Number',
      align: 'RIGHT',
    },
  ],
  output: 'Colour',
  helpUrl: '%{BKY_COLOUR_BLEND_HELPURL}',
  style: 'colour_blocks',
  tooltip: '%{BKY_COLOUR_BLEND_TOOLTIP}',
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
  // Blend two colours together.
  const colour1 =
    generator.valueToCode(block, 'COLOUR1', JavascriptOrder.NONE) ||
    "'#000000'";
  const colour2 =
    generator.valueToCode(block, 'COLOUR2', JavascriptOrder.NONE) ||
    "'#000000'";
  const ratio =
    generator.valueToCode(block, 'RATIO', JavascriptOrder.NONE) || 0.5;
  const functionName = generator.provideFunction_(
    'colourBlend',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(c1, c2, ratio) {
  ratio = Math.max(Math.min(Number(ratio), 1), 0);
  var r1 = parseInt(c1.substring(1, 3), 16);
  var g1 = parseInt(c1.substring(3, 5), 16);
  var b1 = parseInt(c1.substring(5, 7), 16);
  var r2 = parseInt(c2.substring(1, 3), 16);
  var g2 = parseInt(c2.substring(3, 5), 16);
  var b2 = parseInt(c2.substring(5, 7), 16);
  var r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  var g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  var b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  r = ('0' + (r || 0).toString(16)).slice(-2);
  g = ('0' + (g || 0).toString(16)).slice(-2);
  b = ('0' + (b || 0).toString(16)).slice(-2);
  return '#' + r + g + b;
}
`,
  );
  const code = `${functionName}(${colour1}, ${colour2}, ${ratio})`;
  return [code, JavascriptOrder.FUNCTION_CALL];
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
  // Blend two colours together.
  const colour1 =
    generator.valueToCode(block, 'COLOUR1', DartOrder.NONE) || "'#000000'";
  const colour2 =
    generator.valueToCode(block, 'COLOUR2', DartOrder.NONE) || "'#000000'";
  const ratio = generator.valueToCode(block, 'RATIO', DartOrder.NONE) || 0.5;

  // TODO(#7600): find better approach than casting to any to override
  // CodeGenerator declaring .definitions protected.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (generator as any).definitions_['import_dart_math'] =
    "import 'dart:math' as Math;";
  const functionName = generator.provideFunction_(
    'colour_blend',
    `
String ${generator.FUNCTION_NAME_PLACEHOLDER_}(String c1, String c2, num ratio) {
  ratio = Math.max(Math.min(ratio, 1), 0);
  int r1 = int.parse('0x\${c1.substring(1, 3)}');
  int g1 = int.parse('0x\${c1.substring(3, 5)}');
  int b1 = int.parse('0x\${c1.substring(5, 7)}');
  int r2 = int.parse('0x\${c2.substring(1, 3)}');
  int g2 = int.parse('0x\${c2.substring(3, 5)}');
  int b2 = int.parse('0x\${c2.substring(5, 7)}');
  num rn = (r1 * (1 - ratio) + r2 * ratio).round();
  String rs = rn.toInt().toRadixString(16);
  num gn = (g1 * (1 - ratio) + g2 * ratio).round();
  String gs = gn.toInt().toRadixString(16);
  num bn = (b1 * (1 - ratio) + b2 * ratio).round();
  String bs = bn.toInt().toRadixString(16);
  rs = '0$rs';
  rs = rs.substring(rs.length - 2);
  gs = '0$gs';
  gs = gs.substring(gs.length - 2);
  bs = '0$bs';
  bs = bs.substring(bs.length - 2);
  return '#$rs$gs$bs';
}
`,
  );
  const code = `${functionName}(${colour1}, ${colour2}, ${ratio})`;
  return [code, DartOrder.UNARY_POSTFIX];
}

/**
 * Lua generator definition.
 *
 * @param block The Block instance to generate code for.
 * @param generator The LuaGenerator calling the function.
 * @returns A tuple containing the code string and precedence.
 */
export function toLua(
  block: Block,
  generator: LuaGenerator,
): [string, LuaOrder] {
  // Blend two colours together.
  const functionName = generator.provideFunction_(
    'colour_blend',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(colour1, colour2, ratio)
  local r1 = tonumber(string.sub(colour1, 2, 3), 16)
  local r2 = tonumber(string.sub(colour2, 2, 3), 16)
  local g1 = tonumber(string.sub(colour1, 4, 5), 16)
  local g2 = tonumber(string.sub(colour2, 4, 5), 16)
  local b1 = tonumber(string.sub(colour1, 6, 7), 16)
  local b2 = tonumber(string.sub(colour2, 6, 7), 16)
  local ratio = math.min(1, math.max(0, ratio))
  local r = math.floor(r1 * (1 - ratio) + r2 * ratio + .5)
  local g = math.floor(g1 * (1 - ratio) + g2 * ratio + .5)
  local b = math.floor(b1 * (1 - ratio) + b2 * ratio + .5)
  return string.format("#%02x%02x%02x", r, g, b)
end
`,
  );
  const colour1 =
    generator.valueToCode(block, 'COLOUR1', LuaOrder.NONE) || "'#000000'";
  const colour2 =
    generator.valueToCode(block, 'COLOUR2', LuaOrder.NONE) || "'#000000'";
  const ratio = generator.valueToCode(block, 'RATIO', LuaOrder.NONE) || 0;
  const code = `${functionName}(${colour1}, ${colour2}, ${ratio})`;
  return [code, LuaOrder.HIGH];
}

/**
 * PHP generator definition.
 *
 * @param block The Block instance to generate code for.
 * @param generator The PhpGenerator calling the function.
 * @returns A tuple containing the code string and precedence.
 */
export function toPhp(
  block: Block,
  generator: PhpGenerator,
): [string, PhpOrder] {
  // Blend two colours together.
  const colour1 =
    generator.valueToCode(block, 'COLOUR1', PhpOrder.NONE) || "'#000000'";
  const colour2 =
    generator.valueToCode(block, 'COLOUR2', PhpOrder.NONE) || "'#000000'";
  const ratio = generator.valueToCode(block, 'RATIO', PhpOrder.NONE) || 0.5;
  const functionName = generator.provideFunction_(
    'colour_blend',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}($c1, $c2, $ratio) {
  $ratio = max(min($ratio, 1), 0);
  $r1 = hexdec(substr($c1, 1, 2));
  $g1 = hexdec(substr($c1, 3, 2));
  $b1 = hexdec(substr($c1, 5, 2));
  $r2 = hexdec(substr($c2, 1, 2));
  $g2 = hexdec(substr($c2, 3, 2));
  $b2 = hexdec(substr($c2, 5, 2));
  $r = round($r1 * (1 - $ratio) + $r2 * $ratio);
  $g = round($g1 * (1 - $ratio) + $g2 * $ratio);
  $b = round($b1 * (1 - $ratio) + $b2 * $ratio);
  $hex = '#';
  $hex .= str_pad(dechex($r), 2, '0', STR_PAD_LEFT);
  $hex .= str_pad(dechex($g), 2, '0', STR_PAD_LEFT);
  $hex .= str_pad(dechex($b), 2, '0', STR_PAD_LEFT);
  return $hex;
}
`,
  );
  const code = `${functionName}(${colour1}, ${colour2}, ${ratio})`;
  return [code, PhpOrder.FUNCTION_CALL];
}

/**
 * Python generator definition.
 *
 * @param block The Block instance to generate code for.
 * @param generator The PythonGenerator calling the function.
 * @returns A tuple containing the code string and precedence.
 */
export function toPython(
  block: Block,
  generator: PythonGenerator,
): [string, PythonOrder] {
  // Blend two colours together.
  const functionName = generator.provideFunction_(
    'colour_blend',
    `
def ${generator.FUNCTION_NAME_PLACEHOLDER_}(colour1, colour2, ratio):
  r1, r2 = int(colour1[1:3], 16), int(colour2[1:3], 16)
  g1, g2 = int(colour1[3:5], 16), int(colour2[3:5], 16)
  b1, b2 = int(colour1[5:7], 16), int(colour2[5:7], 16)
  ratio = min(1, max(0, ratio))
  r = round(r1 * (1 - ratio) + r2 * ratio)
  g = round(g1 * (1 - ratio) + g2 * ratio)
  b = round(b1 * (1 - ratio) + b2 * ratio)
  return '#%02x%02x%02x' % (r, g, b)
`,
  );
  const colour1 =
    generator.valueToCode(block, 'COLOUR1', PythonOrder.NONE) || "'#000000'";
  const colour2 =
    generator.valueToCode(block, 'COLOUR2', PythonOrder.NONE) || "'#000000'";
  const ratio = generator.valueToCode(block, 'RATIO', PythonOrder.NONE) || 0;
  const code = `${functionName}(${colour1}, ${colour2}, ${ratio})`;
  return [code, PythonOrder.FUNCTION_CALL];
}

const definitionsDict = BlocklyCommon.createBlockDefinitionsFromJsonArray([
  jsonDefinition,
]);

/** The colour_blend BlockDefinition. */
export const blockDefinition = definitionsDict[BLOCK_NAME];

/**
 * Install the `colour_blend` block and all of its dependencies.
 *
 * @param gens The CodeGenerators to install per-block
 *     generators on.
 */
export function installBlock(gens: Generators = {}) {
  registerFieldColour();
  BlocklyCommon.defineBlocks(definitionsDict);
  if (gens.javascript) gens.javascript.forBlock[BLOCK_NAME] = toJavascript;
  if (gens.dart) {
    gens.dart.forBlock[BLOCK_NAME] = toDart;
    gens.dart.addReservedWords('Math');
  }
  if (gens.lua) gens.lua.forBlock[BLOCK_NAME] = toLua;
  if (gens.php) gens.php.forBlock[BLOCK_NAME] = toPhp;
  if (gens.python) gens.python.forBlock[BLOCK_NAME] = toPython;
}
