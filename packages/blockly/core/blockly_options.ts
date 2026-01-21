/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.BlocklyOptions

import type {ITheme, Theme} from './theme.js';
import type {ToolboxDefinition} from './utils/toolbox.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Blockly options.
 */
export interface BlocklyOptions {
  collapse?: boolean;
  comments?: boolean;
  css?: boolean;
  disable?: boolean;
  grid?: GridOptions;
  horizontalLayout?: boolean;
  maxBlocks?: number;
  maxInstances?: {[blockType: string]: number};
  media?: string;
  modalInputs?: boolean;
  move?: MoveOptions;
  oneBasedIndex?: boolean;
  readOnly?: boolean;
  renderer?: string;
  rendererOverrides?: {[rendererConstant: string]: any};
  rtl?: boolean;
  scrollbars?: ScrollbarOptions | boolean;
  sounds?: boolean;
  theme?: Theme | string | ITheme;
  toolbox?: string | ToolboxDefinition | Element;
  toolboxPosition?: string;
  trashcan?: boolean;
  maxTrashcanContents?: number;
  plugins?: {[key: string]: (new (...p1: any[]) => any) | string};
  zoom?: ZoomOptions;
  parentWorkspace?: WorkspaceSvg;
}

export interface GridOptions {
  colour?: string;
  length?: number;
  snap?: boolean;
  spacing?: number;
}

export interface MoveOptions {
  drag?: boolean;
  scrollbars?: boolean | ScrollbarOptions;
  wheel?: boolean;
}

export interface ScrollbarOptions {
  horizontal?: boolean;
  vertical?: boolean;
}

export interface ZoomOptions {
  controls?: boolean;
  maxScale?: number;
  minScale?: number;
  pinch?: boolean;
  scaleSpeed?: number;
  startScale?: number;
  wheel?: boolean;
}
