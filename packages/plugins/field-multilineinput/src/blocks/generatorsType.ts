/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {JavascriptGenerator} from 'blockly/javascript';
import type {DartGenerator} from 'blockly/dart';
import type {LuaGenerator} from 'blockly/lua';
import type {PhpGenerator} from 'blockly/php';
import type {PythonGenerator} from 'blockly/python';

/**
 * An object containing zero or more generators. This is passed
 * to block installation functions so that they may install
 * per-block generators on any languages they support.
 */
export interface Generators {
  javascript?: JavascriptGenerator;
  dart?: DartGenerator;
  lua?: LuaGenerator;
  php?: PhpGenerator;
  python?: PythonGenerator;
}
