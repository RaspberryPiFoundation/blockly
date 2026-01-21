/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering

import * as registry from '../../registry.js';
import type {Theme} from '../../theme.js';
import {Measurable} from '../measurables/base.js';
import {BottomRow} from '../measurables/bottom_row.js';
import {Connection} from '../measurables/connection.js';
import {ExternalValueInput} from '../measurables/external_value_input.js';
import {Field} from '../measurables/field.js';
import {Hat} from '../measurables/hat.js';
import {Icon} from '../measurables/icon.js';
import {InRowSpacer} from '../measurables/in_row_spacer.js';
import {InlineInput} from '../measurables/inline_input.js';
import {InputConnection} from '../measurables/input_connection.js';
import {InputRow} from '../measurables/input_row.js';
import {JaggedEdge} from '../measurables/jagged_edge.js';
import {NextConnection} from '../measurables/next_connection.js';
import {OutputConnection} from '../measurables/output_connection.js';
import {PreviousConnection} from '../measurables/previous_connection.js';
import {RoundCorner} from '../measurables/round_corner.js';
import {Row} from '../measurables/row.js';
import {SpacerRow} from '../measurables/spacer_row.js';
import {SquareCorner} from '../measurables/square_corner.js';
import {StatementInput} from '../measurables/statement_input.js';
import {TopRow} from '../measurables/top_row.js';
import {Types} from '../measurables/types.js';
import {Drawer} from './drawer.js';
import type {IPathObject} from './i_path_object.js';
import {RenderInfo} from './info.js';
import {PathObject} from './path_object.js';
import {Renderer} from './renderer.js';

/**
 * Registers a new renderer.
 *
 * @param name The name of the renderer.
 * @param rendererClass The new renderer class to register.
 * @throws {Error} if a renderer with the same name has already been registered.
 */
export function register(
  name: string,
  rendererClass: new (name: string) => Renderer,
) {
  registry.register(registry.Type.RENDERER, name, rendererClass);
}

/**
 * Unregisters the renderer registered with the given name.
 *
 * @param name The name of the renderer.
 */
export function unregister(name: string) {
  registry.unregister(registry.Type.RENDERER, name);
}

/**
 * Initialize anything needed for rendering (constants, etc).
 *
 * @param name Name of the renderer to initialize.
 * @param theme The workspace theme object.
 * @param opt_rendererOverrides Rendering constant overrides.
 * @returns The new instance of a renderer.
 *     Already initialized.
 * @internal
 */
export function init(
  name: string,
  theme: Theme,
  opt_rendererOverrides?: {[rendererConstant: string]: any},
): Renderer {
  const rendererClass = registry.getClass(registry.Type.RENDERER, name);
  const renderer = new rendererClass!(name);
  renderer.init(theme, opt_rendererOverrides);
  return renderer;
}
export {
  BottomRow,
  Connection,
  Drawer,
  ExternalValueInput,
  Field,
  Hat,
  Icon,
  InlineInput,
  InputConnection,
  InputRow,
  InRowSpacer,
  IPathObject,
  JaggedEdge,
  Measurable,
  NextConnection,
  OutputConnection,
  PathObject,
  PreviousConnection,
  Renderer,
  RenderInfo,
  RoundCorner,
  Row,
  SpacerRow,
  SquareCorner,
  StatementInput,
  TopRow,
  Types,
};

export {
  BaseShape,
  ConstantProvider,
  DynamicShape,
  InsideCorners,
  JaggedTeeth,
  Notch,
  OutsideCorners,
  PuzzleTab,
  StartHat,
} from './constants.js';
