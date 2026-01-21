/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Object that controls settings for the workspace.
 *
 * @class
 */
// Former goog.module ID: Blockly.Options

import type {BlocklyOptions} from './blockly_options.js';
import * as registry from './registry.js';
import {Theme} from './theme.js';
import {Classic} from './theme/classic.js';
import * as idGenerator from './utils/idgenerator.js';
import type {Metrics} from './utils/metrics.js';
import * as toolbox from './utils/toolbox.js';
import type {WorkspaceSvg} from './workspace_svg.js';

/**
 * Parse the user-specified options, using reasonable defaults where behaviour
 * is unspecified.
 */
export class Options {
  RTL: boolean;
  oneBasedIndex: boolean;
  collapse: boolean;
  comments: boolean;
  disable: boolean;
  readOnly: boolean;
  maxBlocks: number;
  maxInstances: {[key: string]: number} | null;
  modalInputs: boolean;
  pathToMedia: string;
  hasCategories: boolean;
  moveOptions: MoveOptions;
  /** @deprecated  January 2019 */
  hasScrollbars: boolean;
  hasTrashcan: boolean;
  maxTrashcanContents: number;
  hasSounds: boolean;
  hasCss: boolean;
  horizontalLayout: boolean;
  languageTree: toolbox.ToolboxInfo | null;
  gridOptions: GridOptions;
  zoomOptions: ZoomOptions;
  toolboxPosition: toolbox.Position;
  theme: Theme;
  renderer: string;
  rendererOverrides: {[rendererConstant: string]: any} | null;

  /**
   * The SVG element for the grid pattern.
   * Created during injection.
   */
  gridPattern: SVGElement | null = null;
  parentWorkspace: WorkspaceSvg | null;
  plugins: {[key: string]: (new (...p1: any[]) => any) | string};

  /**
   * If set, sets the translation of the workspace to match the scrollbars.
   * A function that
   *     sets the translation of the workspace to match the scrollbars. The
   *     argument Contains an x and/or y property which is a float between 0
   *     and 1 specifying the degree of scrolling.
   */
  setMetrics?: (p1: {x?: number; y?: number}) => void = undefined;

  /**
   * A function that returns a metrics
   *     object that describes the current workspace.
   */
  getMetrics?: () => Metrics = undefined;

  /**
   * @param options Dictionary of options.
   *     Specification:
   * https://developers.google.com/blockly/guides/get-started/web#configuration
   */
  constructor(options: BlocklyOptions) {
    let toolboxJsonDef = null;
    let hasCategories = false;
    let hasTrashcan = false;
    let hasCollapse = false;
    let hasComments = false;
    let hasDisable = false;
    let hasSounds = false;
    const readOnly = !!options['readOnly'];
    if (!readOnly) {
      toolboxJsonDef = toolbox.convertToolboxDefToJson(
        options['toolbox'] ?? null,
      );
      hasCategories = toolbox.hasCategories(toolboxJsonDef);
      const rawHasTrashcan = options['trashcan'];
      hasTrashcan =
        rawHasTrashcan === undefined ? hasCategories : rawHasTrashcan;
      const rawHasCollapse = options['collapse'];
      hasCollapse =
        rawHasCollapse === undefined ? hasCategories : rawHasCollapse;
      const rawHasComments = options['comments'];
      hasComments =
        rawHasComments === undefined ? hasCategories : rawHasComments;
      const rawHasDisable = options['disable'];
      hasDisable = rawHasDisable === undefined ? hasCategories : rawHasDisable;
      const rawHasSounds = options['sounds'];
      hasSounds = rawHasSounds === undefined ? true : rawHasSounds;
    }

    let maxTrashcanContents = options['maxTrashcanContents'];
    if (hasTrashcan) {
      if (maxTrashcanContents === undefined) {
        maxTrashcanContents = 32;
      }
    } else {
      maxTrashcanContents = 0;
    }
    const rtl = !!options['rtl'];
    let horizontalLayout = options['horizontalLayout'];
    if (horizontalLayout === undefined) {
      horizontalLayout = false;
    }
    const toolboxAtStart = options['toolboxPosition'] !== 'end';

    let toolboxPosition: toolbox.Position;
    if (horizontalLayout) {
      toolboxPosition = toolboxAtStart
        ? toolbox.Position.TOP
        : toolbox.Position.BOTTOM;
    } else {
      toolboxPosition =
        toolboxAtStart === rtl ? toolbox.Position.RIGHT : toolbox.Position.LEFT;
    }

    let hasCss = options['css'];
    if (hasCss === undefined) {
      hasCss = true;
    }
    let pathToMedia = 'https://blockly-demo.appspot.com/static/media/';
    if (options['media']) {
      pathToMedia = options['media'].endsWith('/')
        ? options['media']
        : options['media'] + '/';
    }
    const rawOneBasedIndex = options['oneBasedIndex'];
    const oneBasedIndex =
      rawOneBasedIndex === undefined ? true : rawOneBasedIndex;
    const renderer = options['renderer'] || 'geras';

    const plugins = options['plugins'] || {};

    let modalInputs = options['modalInputs'];
    if (modalInputs === undefined) {
      modalInputs = true;
    }

    this.RTL = rtl;
    this.oneBasedIndex = oneBasedIndex;
    this.collapse = hasCollapse;
    this.comments = hasComments;
    this.disable = hasDisable;
    this.readOnly = readOnly;
    this.maxBlocks = options['maxBlocks'] || Infinity;
    this.maxInstances = options['maxInstances'] ?? null;
    this.modalInputs = modalInputs;
    this.pathToMedia = pathToMedia;
    this.hasCategories = hasCategories;
    this.moveOptions = Options.parseMoveOptions(options, hasCategories);
    this.hasScrollbars = !!this.moveOptions.scrollbars;
    this.hasTrashcan = hasTrashcan;
    this.maxTrashcanContents = maxTrashcanContents;
    this.hasSounds = hasSounds;
    this.hasCss = hasCss;
    this.horizontalLayout = horizontalLayout;
    this.languageTree = toolboxJsonDef;
    this.gridOptions = Options.parseGridOptions(options);
    this.zoomOptions = Options.parseZoomOptions(options);
    this.toolboxPosition = toolboxPosition;
    this.theme = Options.parseThemeOptions(options);
    this.renderer = renderer;
    this.rendererOverrides = options['rendererOverrides'] ?? null;

    /**
     * The parent of the current workspace, or null if there is no parent
     * workspace.  We can assert that this is of type WorkspaceSvg as opposed to
     * Workspace as this is only used in a rendered workspace.
     */
    this.parentWorkspace = options['parentWorkspace'] ?? null;

    /** Map of plugin type to name of registered plugin or plugin class. */
    this.plugins = plugins;
  }

  /**
   * Parse the user-specified move options, using reasonable defaults where
   *    behaviour is unspecified.
   *
   * @param options Dictionary of options.
   * @param hasCategories Whether the workspace has categories or not.
   * @returns Normalized move options.
   */
  private static parseMoveOptions(
    options: BlocklyOptions,
    hasCategories: boolean,
  ): MoveOptions {
    const move = options['move'] || {};
    const moveOptions = {} as MoveOptions;
    if (
      move['scrollbars'] === undefined &&
      options['scrollbars'] === undefined
    ) {
      moveOptions.scrollbars = hasCategories;
    } else if (typeof move['scrollbars'] === 'object') {
      moveOptions.scrollbars = {
        'horizontal': !!move['scrollbars']['horizontal'],
        'vertical': !!move['scrollbars']['vertical'],
      };
      // Convert scrollbars object to boolean if they have the same value.
      // This allows us to easily check for whether any scrollbars exist using
      // !!moveOptions.scrollbars.
      if (
        moveOptions.scrollbars.horizontal &&
        moveOptions.scrollbars.vertical
      ) {
        moveOptions.scrollbars = true;
      } else if (
        !moveOptions.scrollbars.horizontal &&
        !moveOptions.scrollbars.vertical
      ) {
        moveOptions.scrollbars = false;
      }
    } else {
      moveOptions.scrollbars = !!move['scrollbars'] || !!options['scrollbars'];
    }

    if (!moveOptions.scrollbars || move['wheel'] === undefined) {
      // Defaults to true if single-direction scroll is enabled.
      moveOptions.wheel = typeof moveOptions.scrollbars === 'object';
    } else {
      moveOptions.wheel = !!move['wheel'];
    }
    if (!moveOptions.scrollbars) {
      moveOptions.drag = false;
    } else if (move['drag'] === undefined) {
      // Defaults to true if scrollbars is true.
      moveOptions.drag = true;
    } else {
      moveOptions.drag = !!move['drag'];
    }
    return moveOptions;
  }

  /**
   * Parse the user-specified zoom options, using reasonable defaults where
   * behaviour is unspecified.  See zoom documentation:
   *   https://developers.google.com/blockly/guides/configure/web/zoom
   *
   * @param options Dictionary of options.
   * @returns Normalized zoom options.
   */
  private static parseZoomOptions(options: BlocklyOptions): ZoomOptions {
    const zoom = options['zoom'] || {};
    const zoomOptions = {} as ZoomOptions;
    if (zoom['controls'] === undefined) {
      zoomOptions.controls = false;
    } else {
      zoomOptions.controls = !!zoom['controls'];
    }
    if (zoom['wheel'] === undefined) {
      zoomOptions.wheel = false;
    } else {
      zoomOptions.wheel = !!zoom['wheel'];
    }
    if (zoom['startScale'] === undefined) {
      zoomOptions.startScale = 1;
    } else {
      zoomOptions.startScale = Number(zoom['startScale']);
    }
    if (zoom['maxScale'] === undefined) {
      zoomOptions.maxScale = 3;
    } else {
      zoomOptions.maxScale = Number(zoom['maxScale']);
    }
    if (zoom['minScale'] === undefined) {
      zoomOptions.minScale = 0.3;
    } else {
      zoomOptions.minScale = Number(zoom['minScale']);
    }
    if (zoom['scaleSpeed'] === undefined) {
      zoomOptions.scaleSpeed = 1.2;
    } else {
      zoomOptions.scaleSpeed = Number(zoom['scaleSpeed']);
    }
    if (zoom['pinch'] === undefined) {
      zoomOptions.pinch = zoomOptions.wheel || zoomOptions.controls;
    } else {
      zoomOptions.pinch = !!zoom['pinch'];
    }
    return zoomOptions;
  }

  /**
   * Parse the user-specified grid options, using reasonable defaults where
   * behaviour is unspecified. See grid documentation:
   *   https://developers.google.com/blockly/guides/configure/web/grid
   *
   * @param options Dictionary of options.
   * @returns Normalized grid options.
   */
  private static parseGridOptions(options: BlocklyOptions): GridOptions {
    const grid = options['grid'] || {};
    const gridOptions = {} as GridOptions;
    gridOptions.spacing = Number(grid['spacing']) || 0;
    gridOptions.colour = grid['colour'] || '#888';
    gridOptions.length =
      grid['length'] === undefined ? 1 : Number(grid['length']);
    gridOptions.snap = gridOptions.spacing > 0 && !!grid['snap'];
    return gridOptions;
  }

  /**
   * Parse the user-specified theme options, using the classic theme as a
   * default. https://developers.google.com/blockly/guides/configure/web/themes
   *
   * @param options Dictionary of options.
   * @returns A Blockly Theme.
   */
  private static parseThemeOptions(options: BlocklyOptions): Theme {
    const theme = options['theme'] || Classic;
    if (typeof theme === 'string') {
      return registry.getObject(registry.Type.THEME, theme) as Theme;
    } else if (theme instanceof Theme) {
      return theme;
    }
    return Theme.defineTheme(
      theme.name || 'builtin' + idGenerator.getNextUniqueId(),
      theme,
    );
  }
}

export namespace Options {
  export interface GridOptions {
    colour: string;
    length: number;
    snap: boolean;
    spacing: number;
  }

  export interface MoveOptions {
    drag: boolean;
    scrollbars: boolean | ScrollbarOptions;
    wheel: boolean;
  }

  export interface ScrollbarOptions {
    horizontal: boolean;
    vertical: boolean;
  }

  export interface ZoomOptions {
    controls: boolean;
    maxScale: number;
    minScale: number;
    pinch: boolean;
    scaleSpeed: number;
    startScale: number;
    wheel: boolean;
  }
}

export type GridOptions = Options.GridOptions;
export type MoveOptions = Options.MoveOptions;
export type ScrollbarOptions = Options.ScrollbarOptions;
export type ZoomOptions = Options.ZoomOptions;
