/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.blockRendering.ConstantProvider

import {ConnectionType} from '../../connection_type.js';
import type {RenderedConnection} from '../../rendered_connection.js';
import type {BlockStyle, Theme} from '../../theme.js';
import * as colour from '../../utils/colour.js';
import * as dom from '../../utils/dom.js';
import * as parsing from '../../utils/parsing.js';
import {Svg} from '../../utils/svg.js';
import * as svgPaths from '../../utils/svg_paths.js';

/** An object containing sizing and path information about outside corners. */
export interface OutsideCorners {
  topLeft: string;
  topRight: string;
  bottomRight: string;
  bottomLeft: string;
  rightHeight: number;
}

/** An object containing sizing and path information about inside corners. */
export interface InsideCorners {
  width: number;
  height: number;
  pathTop: string;
  pathBottom: string;
}

/** An object containing sizing and path information about a start hat. */
export interface StartHat {
  height: number;
  width: number;
  path: string;
}

/** An object containing sizing and path information about a notch. */
export interface Notch {
  type: number;
  width: number;
  height: number;
  pathLeft: string;
  pathRight: string;
}

/** An object containing sizing and path information about a puzzle tab. */
export interface PuzzleTab {
  type: number;
  width: number;
  height: number;
  pathDown: string;
  pathUp: string;
}

/**
 * An object containing sizing and path information about collapsed block
 * indicators.
 */
export interface JaggedTeeth {
  height: number;
  width: number;
  path: string;
}

export type BaseShape = {
  type: number;
  width: number;
  height: number;
};

/** An object containing sizing and type information about a dynamic shape. */
export type DynamicShape = {
  type: number;
  width: (p1: number) => number;
  height: (p1: number) => number;
  isDynamic: true;
  connectionOffsetY: (p1: number) => number;
  connectionOffsetX: (p1: number) => number;
  pathDown: (p1: number) => string;
  pathUp: (p1: number) => string;
  pathRightDown: (p1: number) => string;
  pathRightUp: (p1: number) => string;
};

/** An object containing sizing and type information about a shape. */
export type Shape = BaseShape | DynamicShape;

/**
 * Returns whether the shape is dynamic or not.
 *
 * @param shape The shape to check for dynamic-ness.
 * @returns Whether the shape is a dynamic shape or not.
 */
export function isDynamicShape(shape: Shape): shape is DynamicShape {
  return (shape as DynamicShape).isDynamic;
}

/** Returns whether the shape is a puzzle tab or not. */
export function isPuzzleTab(shape: Shape): shape is PuzzleTab {
  return (
    (shape as PuzzleTab).pathDown !== undefined &&
    (shape as PuzzleTab).pathUp !== undefined
  );
}

/** Returns whether the shape is a notch or not. */
export function isNotch(shape: Shape): shape is Notch {
  return (
    (shape as Notch).pathLeft !== undefined &&
    (shape as Notch).pathRight !== undefined
  );
}

/**
 * An object that provides constants for rendering blocks.
 */
export class ConstantProvider {
  /** The size of an empty spacer. */
  NO_PADDING = 0;

  /** The size of small padding. */
  SMALL_PADDING = 3;

  /** The size of medium padding. */
  MEDIUM_PADDING = 5;

  /** The size of medium-large padding. */
  MEDIUM_LARGE_PADDING = 8;

  /** The size of large padding. */
  LARGE_PADDING = 10;
  TALL_INPUT_FIELD_OFFSET_Y: number;

  /** The height of the puzzle tab used for input and output connections. */
  TAB_HEIGHT = 15;

  /**
   * The offset from the top of the block at which a puzzle tab is positioned.
   */
  TAB_OFFSET_FROM_TOP = 5;

  /**
   * Vertical overlap of the puzzle tab, used to make it look more like a
   * puzzle piece.
   */
  TAB_VERTICAL_OVERLAP = 2.5;

  /** The width of the puzzle tab used for input and output connections. */
  TAB_WIDTH = 8;

  /** The width of the notch used for previous and next connections. */
  NOTCH_WIDTH = 15;

  /** The height of the notch used for previous and next connections. */
  NOTCH_HEIGHT = 4;

  /** The minimum width of the block. */
  MIN_BLOCK_WIDTH = 12;
  EMPTY_BLOCK_SPACER_HEIGHT = 16;
  DUMMY_INPUT_MIN_HEIGHT: number;
  DUMMY_INPUT_SHADOW_MIN_HEIGHT: number;

  /** Rounded corner radius. */
  CORNER_RADIUS = 8;

  /**
   * Offset from the left side of a block or the inside of a statement input
   * to the left side of the notch.
   */
  NOTCH_OFFSET_LEFT = 15;
  STATEMENT_INPUT_NOTCH_OFFSET: number;

  STATEMENT_BOTTOM_SPACER = 0;
  STATEMENT_INPUT_PADDING_LEFT = 20;

  /** Vertical padding between consecutive statement inputs. */
  BETWEEN_STATEMENT_PADDING_Y = 4;
  TOP_ROW_MIN_HEIGHT: number;
  TOP_ROW_PRECEDES_STATEMENT_MIN_HEIGHT: number;
  BOTTOM_ROW_MIN_HEIGHT: number;
  BOTTOM_ROW_AFTER_STATEMENT_MIN_HEIGHT: number;

  /**
   * Whether to add a 'hat' on top of all blocks with no previous or output
   * connections. Can be overridden by 'hat' property on Theme.BlockStyle.
   */
  ADD_START_HATS = false;

  /** Height of the top hat. */
  START_HAT_HEIGHT = 15;

  /** Width of the top hat. */
  START_HAT_WIDTH = 100;

  SPACER_DEFAULT_HEIGHT = 15;

  MIN_BLOCK_HEIGHT = 24;

  EMPTY_INLINE_INPUT_PADDING = 14.5;
  EMPTY_INLINE_INPUT_HEIGHT: number;

  EXTERNAL_VALUE_INPUT_PADDING = 2;
  EMPTY_STATEMENT_INPUT_HEIGHT: number;
  START_POINT: string;

  /** Height of SVG path for jagged teeth at the end of collapsed blocks. */
  JAGGED_TEETH_HEIGHT = 12;

  /** Width of SVG path for jagged teeth at the end of collapsed blocks. */
  JAGGED_TEETH_WIDTH = 6;

  /** Point size of text. */
  FIELD_TEXT_FONTSIZE = 11;

  /** Text font weight. */
  FIELD_TEXT_FONTWEIGHT = 'normal';

  /** Text font family. */
  FIELD_TEXT_FONTFAMILY = 'sans-serif';

  /**
   * Height of text.  This constant is dynamically set in
   * `setFontConstants_` to be the height of the text based on the font
   * used.
   */
  FIELD_TEXT_HEIGHT = -1; // Dynamically set.

  /**
   * Text baseline.  This constant is dynamically set in `setFontConstants_`
   * to be the baseline of the text based on the font used.
   */
  FIELD_TEXT_BASELINE = -1; // Dynamically set.

  /** A field's border rect corner radius. */
  FIELD_BORDER_RECT_RADIUS = 4;

  /** A field's border rect default height. */
  FIELD_BORDER_RECT_HEIGHT = 16;

  /** A field's border rect X padding. */
  FIELD_BORDER_RECT_X_PADDING = 5;

  /** A field's border rect Y padding. */
  FIELD_BORDER_RECT_Y_PADDING = 3;

  /**
   * The backing colour of a field's border rect.
   */
  FIELD_BORDER_RECT_COLOUR = '#fff';
  FIELD_TEXT_BASELINE_CENTER: boolean;
  FIELD_DROPDOWN_BORDER_RECT_HEIGHT: number;

  /**
   * Whether or not a dropdown field should add a border rect when in a shadow
   * block.
   */
  FIELD_DROPDOWN_NO_BORDER_RECT_SHADOW = false;

  /**
   * Whether or not a dropdown field's div should be coloured to match the
   * block colours.
   */
  FIELD_DROPDOWN_COLOURED_DIV = false;

  /** Whether or not a dropdown field uses a text or SVG arrow. */
  FIELD_DROPDOWN_SVG_ARROW = false;
  FIELD_DROPDOWN_SVG_ARROW_PADDING: number;

  /** A dropdown field's SVG arrow size. */
  FIELD_DROPDOWN_SVG_ARROW_SIZE = 12;
  FIELD_DROPDOWN_SVG_ARROW_DATAURI: string;

  /**
   * Whether or not to show a box shadow around the widget div. This is only a
   * feature of full block fields.
   */
  FIELD_TEXTINPUT_BOX_SHADOW = false;

  /**
   * Whether or not the colour field should display its colour value on the
   * entire block.
   */
  FIELD_COLOUR_FULL_BLOCK = false;

  /** A colour field's default width. */
  FIELD_COLOUR_DEFAULT_WIDTH = 26;
  FIELD_COLOUR_DEFAULT_HEIGHT: number;
  FIELD_CHECKBOX_X_OFFSET: number;
  randomIdentifier: string;

  /**
   * The defs tag that contains all filters and patterns for this Blockly
   * instance.
   */
  private defs: SVGElement | null = null;

  /**
   * The ID of the emboss filter, or the empty string if no filter is set.
   */
  embossFilterId = '';

  /** The <filter> element to use for highlighting, or null if not set. */
  private embossFilter: SVGElement | null = null;

  /**
   * The ID of the disabled pattern, or the empty string if no pattern is set.
   */
  disabledPatternId = '';

  /**
   * The <pattern> element to use for disabled blocks, or null if not set.
   */
  private disabledPattern: SVGElement | null = null;

  /**
   * The ID of the debug filter, or the empty string if no pattern is set.
   */
  debugFilterId = '';

  /**
   * The <filter> element to use for a debug highlight, or null if not set.
   */
  private debugFilter: SVGElement | null = null;

  /** The <style> element to use for injecting renderer specific CSS. */
  private cssNode: HTMLStyleElement | null = null;

  /**
   * Cursor colour.
   */
  CURSOR_COLOUR = '#cc0a0a';

  /**
   * Immovable marker colour.
   */
  MARKER_COLOUR = '#4286f4';

  /**
   * Width of the horizontal cursor.
   */
  CURSOR_WS_WIDTH = 100;

  /**
   * Height of the horizontal cursor.
   */
  WS_CURSOR_HEIGHT = 5;

  /**
   * Padding around a stack.
   */
  CURSOR_STACK_PADDING = 10;

  /**
   * Padding around a block.
   */
  CURSOR_BLOCK_PADDING = 2;

  /**
   * Stroke of the cursor.
   */
  CURSOR_STROKE_WIDTH = 4;

  /**
   * Whether text input and colour fields fill up the entire source block.
   */
  FULL_BLOCK_FIELDS = false;

  /**
   * The main colour of insertion markers, in hex.  The block is rendered a
   * transparent grey by changing the fill opacity in CSS.
   */
  INSERTION_MARKER_COLOUR = '#000000';

  /**
   * The insertion marker opacity.
   */
  INSERTION_MARKER_OPACITY = 0.2;

  SHAPES: {[key: string]: number} = {PUZZLE: 1, NOTCH: 2};
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  JAGGED_TEETH!: JaggedTeeth;
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  NOTCH!: Notch;
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  START_HAT!: StartHat;
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  PUZZLE_TAB!: PuzzleTab;
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  INSIDE_CORNERS!: InsideCorners;
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.
  OUTSIDE_CORNERS!: OutsideCorners;
  // TODO(b/109816955): remove '!', see go/strict-prop-init-fix.

  blockStyles!: {[key: string]: BlockStyle};

  constructor() {
    /**
     * Offset from the top of the row for placing fields on inline input rows
     * and statement input rows.
     * Matches existing rendering (in 2019).
     */
    this.TALL_INPUT_FIELD_OFFSET_Y = this.MEDIUM_PADDING;

    /** The minimum height of a dummy input row. */
    this.DUMMY_INPUT_MIN_HEIGHT = this.TAB_HEIGHT;

    /** The minimum height of a dummy input row in a shadow block. */
    this.DUMMY_INPUT_SHADOW_MIN_HEIGHT = this.TAB_HEIGHT;

    /**
     * Additional offset added to the statement input's width to account for the
     * notch.
     */
    this.STATEMENT_INPUT_NOTCH_OFFSET = this.NOTCH_OFFSET_LEFT;

    /** The top row's minimum height. */
    this.TOP_ROW_MIN_HEIGHT = this.MEDIUM_PADDING;

    /** The top row's minimum height if it precedes a statement. */
    this.TOP_ROW_PRECEDES_STATEMENT_MIN_HEIGHT = this.LARGE_PADDING;

    /** The bottom row's minimum height. */
    this.BOTTOM_ROW_MIN_HEIGHT = this.MEDIUM_PADDING;

    /** The bottom row's minimum height if it follows a statement input. */
    this.BOTTOM_ROW_AFTER_STATEMENT_MIN_HEIGHT = this.LARGE_PADDING;

    /** The height of an empty inline input. */
    this.EMPTY_INLINE_INPUT_HEIGHT = this.TAB_HEIGHT + 11;

    /**
     * The height of an empty statement input.  Note that in the old rendering
     * this varies slightly depending on whether the block has external or
     * inline inputs. In the new rendering this is consistent.  It seems
     * unlikely that the old behaviour was intentional.
     */
    this.EMPTY_STATEMENT_INPUT_HEIGHT = this.MIN_BLOCK_HEIGHT;

    this.START_POINT = svgPaths.moveBy(0, 0);

    /**
     * A field's text element's dominant baseline. Pre-2022 this could be false
     * for certain browsers.
     */
    this.FIELD_TEXT_BASELINE_CENTER = true;

    /** A dropdown field's border rect height. */
    this.FIELD_DROPDOWN_BORDER_RECT_HEIGHT = this.FIELD_BORDER_RECT_HEIGHT;

    /** A dropdown field's SVG arrow padding. */
    this.FIELD_DROPDOWN_SVG_ARROW_PADDING = this.FIELD_BORDER_RECT_X_PADDING;

    /** A dropdown field's SVG arrow datauri. */
    this.FIELD_DROPDOWN_SVG_ARROW_DATAURI =
      'data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllci' +
      'AxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMi43MSIgaG' +
      'VpZ2h0PSI4Ljc5IiB2aWV3Qm94PSIwIDAgMTIuNzEgOC43OSI+PHRpdGxlPmRyb3Bkb3duLW' +
      'Fycm93PC90aXRsZT48ZyBvcGFjaXR5PSIwLjEiPjxwYXRoIGQ9Ik0xMi43MSwyLjQ0QTIuND' +
      'EsMi40MSwwLDAsMSwxMiw0LjE2TDguMDgsOC4wOGEyLjQ1LDIuNDUsMCwwLDEtMy40NSwwTD' +
      'AuNzIsNC4xNkEyLjQyLDIuNDIsMCwwLDEsMCwyLjQ0LDIuNDgsMi40OCwwLDAsMSwuNzEuNz' +
      'FDMSwwLjQ3LDEuNDMsMCw2LjM2LDBTMTEuNzUsMC40NiwxMiwuNzFBMi40NCwyLjQ0LDAsMC' +
      'wxLDEyLjcxLDIuNDRaIiBmaWxsPSIjMjMxZjIwIi8+PC9nPjxwYXRoIGQ9Ik02LjM2LDcuNz' +
      'lhMS40MywxLjQzLDAsMCwxLTEtLjQyTDEuNDIsMy40NWExLjQ0LDEuNDQsMCwwLDEsMC0yYz' +
      'AuNTYtLjU2LDkuMzEtMC41Niw5Ljg3LDBhMS40NCwxLjQ0LDAsMCwxLDAsMkw3LjM3LDcuMz' +
      'dBMS40MywxLjQzLDAsMCwxLDYuMzYsNy43OVoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=';

    /** A colour field's default height. */
    this.FIELD_COLOUR_DEFAULT_HEIGHT = this.FIELD_BORDER_RECT_HEIGHT;

    /** A checkbox field's X offset. */
    this.FIELD_CHECKBOX_X_OFFSET = this.FIELD_BORDER_RECT_X_PADDING - 3;

    /**
     * A random identifier used to ensure a unique ID is used for each
     * filter/pattern for the case of multiple Blockly instances on a page.
     */
    this.randomIdentifier = String(Math.random()).substring(2);
  }

  /**
   * Initialize shape objects based on the constants set in the constructor.
   */
  init() {
    /**
     * An object containing sizing and path information about collapsed block
     * indicators.
     */
    this.JAGGED_TEETH = this.makeJaggedTeeth();

    /** An object containing sizing and path information about notches. */
    this.NOTCH = this.makeNotch();

    /** An object containing sizing and path information about start hats */
    this.START_HAT = this.makeStartHat();

    /**
     * An object containing sizing and path information about puzzle tabs.
     */
    this.PUZZLE_TAB = this.makePuzzleTab();

    /**
     * An object containing sizing and path information about inside corners
     */
    this.INSIDE_CORNERS = this.makeInsideCorners();

    /**
     * An object containing sizing and path information about outside corners.
     */
    this.OUTSIDE_CORNERS = this.makeOutsideCorners();
  }

  /**
   * Refresh constants properties that depend on the theme.
   *
   * @param theme The current workspace theme.
   */
  setTheme(theme: Theme) {
    /** The block styles map. */
    this.blockStyles = Object.create(null);

    const blockStyles = theme.blockStyles;
    for (const key in blockStyles) {
      this.blockStyles[key] = this.validatedBlockStyle_(blockStyles[key]);
    }

    this.setDynamicProperties_(theme);
  }

  /**
   * Sets dynamic properties that depend on other values or theme properties.
   *
   * @param theme The current workspace theme.
   */
  protected setDynamicProperties_(theme: Theme) {
    this.setFontConstants_(theme);
    this.setComponentConstants_(theme);

    this.ADD_START_HATS =
      theme.startHats !== undefined ? theme.startHats : this.ADD_START_HATS;
  }

  /**
   * Set constants related to fonts.
   *
   * @param theme The current workspace theme.
   */
  protected setFontConstants_(theme: Theme) {
    if (theme.fontStyle && theme.fontStyle['family']) {
      this.FIELD_TEXT_FONTFAMILY = theme.fontStyle['family'];
    }

    if (theme.fontStyle && theme.fontStyle['weight']) {
      this.FIELD_TEXT_FONTWEIGHT = theme.fontStyle['weight'];
    }

    if (theme.fontStyle && theme.fontStyle['size']) {
      this.FIELD_TEXT_FONTSIZE = theme.fontStyle['size'];
    }

    const fontMetrics = dom.measureFontMetrics(
      'Hg',
      this.FIELD_TEXT_FONTSIZE + 'pt',
      this.FIELD_TEXT_FONTWEIGHT,
      this.FIELD_TEXT_FONTFAMILY,
    );

    this.FIELD_TEXT_HEIGHT = fontMetrics.height;
    this.FIELD_TEXT_BASELINE = fontMetrics.baseline;
  }

  /**
   * Set constants from a theme's component styles.
   *
   * @param theme The current workspace theme.
   */
  protected setComponentConstants_(theme: Theme) {
    this.CURSOR_COLOUR =
      theme.getComponentStyle('cursorColour') || this.CURSOR_COLOUR;
    this.MARKER_COLOUR =
      theme.getComponentStyle('markerColour') || this.MARKER_COLOUR;
    this.INSERTION_MARKER_COLOUR =
      theme.getComponentStyle('insertionMarkerColour') ||
      this.INSERTION_MARKER_COLOUR;
    this.INSERTION_MARKER_OPACITY =
      Number(theme.getComponentStyle('insertionMarkerOpacity')) ||
      this.INSERTION_MARKER_OPACITY;
  }

  /**
   * Get or create a block style based on a single colour value.  Generate a
   * name for the style based on the colour.
   *
   * @param colour #RRGGBB colour string.
   * @returns An object containing the style and an autogenerated name for that
   *     style.
   */
  getBlockStyleForColour(colour: string): {style: BlockStyle; name: string} {
    const name = 'auto_' + colour;
    if (!this.blockStyles[name]) {
      this.blockStyles[name] = this.createBlockStyle_(colour);
    }
    return {style: this.blockStyles[name], name};
  }

  /**
   * Gets the BlockStyle for the given block style name.
   *
   * @param blockStyleName The name of the block style.
   * @returns The named block style, or a default style if no style with the
   *     given name was found.
   */
  getBlockStyle(blockStyleName: string | null): BlockStyle {
    return (
      this.blockStyles[blockStyleName || ''] ||
      (blockStyleName && blockStyleName.startsWith('auto_')
        ? this.getBlockStyleForColour(blockStyleName.substring(5)).style
        : this.createBlockStyle_('#000000'))
    );
  }

  /**
   * Create a block style object based on the given colour.
   *
   * @param colour #RRGGBB colour string.
   * @returns A populated block style based on the given colour.
   */
  protected createBlockStyle_(colour: string): BlockStyle {
    return this.validatedBlockStyle_({'colourPrimary': colour});
  }

  /**
   * Get a full block style object based on the input style object.  Populate
   * any missing values.
   *
   * @param blockStyle A full or partial block style object.
   * @returns A full block style object, with all required properties populated.
   */
  protected validatedBlockStyle_(blockStyle: Partial<BlockStyle>): BlockStyle {
    // Make a new object with all of the same properties.
    const valid = {} as BlockStyle;
    if (blockStyle) {
      Object.assign(valid, blockStyle);
    }
    // Validate required properties.
    const parsedColour = parsing.parseBlockColour(
      valid['colourPrimary'] || '#000',
    );
    valid.colourPrimary = parsedColour.hex;
    valid.colourSecondary = valid['colourSecondary']
      ? parsing.parseBlockColour(valid['colourSecondary']).hex
      : this.generateSecondaryColour_(valid.colourPrimary);
    valid.colourTertiary = valid['colourTertiary']
      ? parsing.parseBlockColour(valid['colourTertiary']).hex
      : this.generateTertiaryColour_(valid.colourPrimary);

    valid.hat = valid['hat'] || '';
    return valid;
  }

  /**
   * Generate a secondary colour from the passed in primary colour.
   *
   * @param inputColour Primary colour.
   * @returns The generated secondary colour.
   */
  protected generateSecondaryColour_(inputColour: string): string {
    return colour.blend('#fff', inputColour, 0.6) || inputColour;
  }

  /**
   * Generate a tertiary colour from the passed in primary colour.
   *
   * @param inputColour Primary colour.
   * @returns The generated tertiary colour.
   */
  protected generateTertiaryColour_(inputColour: string): string {
    return colour.blend('#fff', inputColour, 0.3) || inputColour;
  }

  /**
   * Dispose of this constants provider.
   * Delete all DOM elements that this provider created.
   */
  dispose() {
    if (this.embossFilter) {
      dom.removeNode(this.embossFilter);
    }
    if (this.disabledPattern) {
      dom.removeNode(this.disabledPattern);
    }
    if (this.debugFilter) {
      dom.removeNode(this.debugFilter);
    }
    this.cssNode = null;
  }

  /**
   * @returns An object containing sizing and path information about collapsed
   *     block indicators.
   */
  protected makeJaggedTeeth(): JaggedTeeth {
    const height = this.JAGGED_TEETH_HEIGHT;
    const width = this.JAGGED_TEETH_WIDTH;

    const mainPath = svgPaths.line([
      svgPaths.point(width, height / 4),
      svgPaths.point(-width * 2, height / 2),
      svgPaths.point(width, height / 4),
    ]);
    return {height, width, path: mainPath};
  }

  /**
   * @returns An object containing sizing and path information about start hats.
   */
  protected makeStartHat(): StartHat {
    const height = this.START_HAT_HEIGHT;
    const width = this.START_HAT_WIDTH;

    const mainPath = svgPaths.curve('c', [
      svgPaths.point(30, -height),
      svgPaths.point(70, -height),
      svgPaths.point(width, 0),
    ]);
    // Height is actually the Y position of the control points defining the
    // curve of the hat; the hat's actual rendered height is 3/4 of the control
    // points' Y position, per https://stackoverflow.com/a/5327329
    return {height: height * 0.75, width, path: mainPath};
  }

  /**
   * @returns An object containing sizing and path information about puzzle
   *     tabs.
   */
  protected makePuzzleTab(): PuzzleTab {
    const width = this.TAB_WIDTH;
    const height = this.TAB_HEIGHT;

    /**
     * Make the main path for the puzzle tab made out of a few curves (c and s).
     * Those curves are defined with relative positions.  The 'up' and 'down'
     * versions of the paths are the same, but the Y sign flips.  Forward and
     * back are the signs to use to move the cursor in the direction that the
     * path is being drawn.
     *
     * @param up True if the path should be drawn from bottom to top, false
     *     otherwise.
     * @returns A path fragment describing a puzzle tab.
     */
    function makeMainPath(up: boolean): string {
      const forward = up ? -1 : 1;
      const back = -forward;

      const overlap = 2.5;
      const halfHeight = height / 2;
      const control1Y = halfHeight + overlap;
      const control2Y = halfHeight + 0.5;
      const control3Y = overlap; // 2.5

      const endPoint1 = svgPaths.point(-width, forward * halfHeight);
      const endPoint2 = svgPaths.point(width, forward * halfHeight);

      return (
        svgPaths.curve('c', [
          svgPaths.point(0, forward * control1Y),
          svgPaths.point(-width, back * control2Y),
          endPoint1,
        ]) +
        svgPaths.curve('s', [
          svgPaths.point(width, back * control3Y),
          endPoint2,
        ])
      );
    }

    // c 0,-10  -8,8  -8,-7.5  s 8,2.5  8,-7.5
    const pathUp = makeMainPath(true);
    // c 0,10  -8,-8  -8,7.5  s 8,-2.5  8,7.5
    const pathDown = makeMainPath(false);

    return {
      type: this.SHAPES.PUZZLE,
      width,
      height,
      pathDown,
      pathUp,
    };
  }

  /**
   * @returns An object containing sizing and path information about notches.
   */
  protected makeNotch(): Notch {
    const width = this.NOTCH_WIDTH;
    const height = this.NOTCH_HEIGHT;
    const innerWidth = 3;
    const outerWidth = (width - innerWidth) / 2;

    /**
     * Make the main path for the notch.
     *
     * @param dir Direction multiplier to apply to horizontal offsets along the
     *     path. Either 1 or -1.
     * @returns A path fragment describing a notch.
     */
    function makeMainPath(dir: number): string {
      return svgPaths.line([
        svgPaths.point(dir * outerWidth, height),
        svgPaths.point(dir * innerWidth, 0),
        svgPaths.point(dir * outerWidth, -height),
      ]);
    }
    const pathLeft = makeMainPath(1);
    const pathRight = makeMainPath(-1);

    return {
      type: this.SHAPES.NOTCH,
      width,
      height,
      pathLeft,
      pathRight,
    };
  }

  /**
   * @returns An object containing sizing and path information about inside
   *     corners.
   */
  protected makeInsideCorners(): InsideCorners {
    const radius = this.CORNER_RADIUS;

    const innerTopLeftCorner = svgPaths.arc(
      'a',
      '0 0,0',
      radius,
      svgPaths.point(-radius, radius),
    );

    const innerBottomLeftCorner = svgPaths.arc(
      'a',
      '0 0,0',
      radius,
      svgPaths.point(radius, radius),
    );

    return {
      width: radius,
      height: radius,
      pathTop: innerTopLeftCorner,
      pathBottom: innerBottomLeftCorner,
    };
  }

  /**
   * @returns An object containing sizing and path information about outside
   *     corners.
   */
  protected makeOutsideCorners(): OutsideCorners {
    const radius = this.CORNER_RADIUS;
    /** SVG path for drawing the rounded top-left corner. */
    const topLeft =
      svgPaths.moveBy(0, radius) +
      svgPaths.arc('a', '0 0,1', radius, svgPaths.point(radius, -radius));

    /** SVG path for drawing the rounded top-right corner. */
    const topRight = svgPaths.arc(
      'a',
      '0 0,1',
      radius,
      svgPaths.point(radius, radius),
    );

    /** SVG path for drawing the rounded bottom-left corner. */
    const bottomLeft = svgPaths.arc(
      'a',
      '0 0,1',
      radius,
      svgPaths.point(-radius, -radius),
    );

    /** SVG path for drawing the rounded bottom-right corner. */
    const bottomRight = svgPaths.arc(
      'a',
      '0 0,1',
      radius,
      svgPaths.point(-radius, radius),
    );

    return {
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
      rightHeight: radius,
    };
  }

  /**
   * Get an object with connection shape and sizing information based on the
   * type of the connection.
   *
   * @param connection The connection to find a shape object for
   * @returns The shape object for the connection.
   */
  shapeFor(connection: RenderedConnection): Shape {
    switch (connection.type) {
      case ConnectionType.INPUT_VALUE:
      case ConnectionType.OUTPUT_VALUE:
        return this.PUZZLE_TAB;
      case ConnectionType.PREVIOUS_STATEMENT:
      case ConnectionType.NEXT_STATEMENT:
        return this.NOTCH;
      default:
        throw Error('Unknown connection type');
    }
  }

  /**
   * Create any DOM elements that this renderer needs (filters, patterns, etc).
   *
   * @param svg The root of the workspace's SVG.
   * @param tagName The name to use for the CSS style tag.
   * @param selector The CSS selector to use.
   * @param injectionDivIfIsParent The div containing the parent workspace and
   *   all related workspaces and block containers, if this renderer is for the
   *   parent workspace. CSS variables representing SVG patterns will be scoped
   *   to this container. Child workspaces should not override the CSS variables
   *   created by the parent and thus do not need access to the injection div.
   */
  createDom(
    svg: SVGElement,
    tagName: string,
    selector: string,
    injectionDivIfIsParent?: HTMLElement,
  ) {
    this.injectCSS_(tagName, selector);

    /*
        <defs>
          ... filters go here ...
        </defs>
        */
    this.defs = dom.createSvgElement(Svg.DEFS, {}, svg);
    /*
          <filter id="blocklyEmbossFilter837493">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="1"
       specularConstant="0.5" specularExponent="10" lighting-color="white"
                                result="specOut">
              <fePointLight x="-5000" y="-10000" z="20000" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in"
                         result="specOut" />
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic"
                         k1="0" k2="1" k3="1" k4="0" />
          </filter>
        */
    const embossFilter = dom.createSvgElement(
      Svg.FILTER,
      {'id': 'blocklyEmbossFilter' + this.randomIdentifier},
      this.defs,
    );
    dom.createSvgElement(
      Svg.FEGAUSSIANBLUR,
      {'in': 'SourceAlpha', 'stdDeviation': 1, 'result': 'blur'},
      embossFilter,
    );
    const feSpecularLighting = dom.createSvgElement(
      Svg.FESPECULARLIGHTING,
      {
        'in': 'blur',
        'surfaceScale': 1,
        'specularConstant': 0.5,
        'specularExponent': 10,
        'lighting-color': 'white',
        'result': 'specOut',
      },
      embossFilter,
    );
    dom.createSvgElement(
      Svg.FEPOINTLIGHT,
      {'x': -5000, 'y': -10000, 'z': 20000},
      feSpecularLighting,
    );
    dom.createSvgElement(
      Svg.FECOMPOSITE,
      {
        'in': 'specOut',
        'in2': 'SourceAlpha',
        'operator': 'in',
        'result': 'specOut',
      },
      embossFilter,
    );
    dom.createSvgElement(
      Svg.FECOMPOSITE,
      {
        'in': 'SourceGraphic',
        'in2': 'specOut',
        'operator': 'arithmetic',
        'k1': 0,
        'k2': 1,
        'k3': 1,
        'k4': 0,
      },
      embossFilter,
    );
    this.embossFilterId = embossFilter.id;
    this.embossFilter = embossFilter;

    /*
          <pattern id="blocklyDisabledPattern837493"
       patternUnits="userSpaceOnUse" width="10" height="10"> <rect width="10"
       height="10" fill="#aaa" /> <path d="M 0 0 L 10 10 M 10 0 L 0 10"
       stroke="#cc0" />
          </pattern>
        */
    const disabledPattern = dom.createSvgElement(
      Svg.PATTERN,
      {
        'id': 'blocklyDisabledPattern' + this.randomIdentifier,
        'patternUnits': 'userSpaceOnUse',
        'width': 10,
        'height': 10,
      },
      this.defs,
    );
    dom.createSvgElement(
      Svg.RECT,
      {'width': 10, 'height': 10, 'fill': '#aaa'},
      disabledPattern,
    );
    dom.createSvgElement(
      Svg.PATH,
      {'d': 'M 0 0 L 10 10 M 10 0 L 0 10', 'stroke': '#cc0'},
      disabledPattern,
    );
    this.disabledPatternId = disabledPattern.id;
    this.disabledPattern = disabledPattern;

    this.createDebugFilter();

    if (injectionDivIfIsParent) {
      // If this renderer is for the parent workspace, add CSS variables scoped
      // to the injection div referencing the created patterns so that CSS can
      // apply the patterns to any element in the injection div.
      injectionDivIfIsParent.style.setProperty(
        '--blocklyEmbossFilter',
        `url(#${this.embossFilterId})`,
      );
      injectionDivIfIsParent.style.setProperty(
        '--blocklyDisabledPattern',
        `url(#${this.disabledPatternId})`,
      );
      injectionDivIfIsParent.style.setProperty(
        '--blocklyDebugFilter',
        `url(#${this.debugFilterId})`,
      );
    }
  }

  /**
   * Create a filter for highlighting the currently rendering block during
   * render debugging.
   */
  private createDebugFilter() {
    // Only create the debug filter once.
    if (!this.debugFilter) {
      const debugFilter = dom.createSvgElement(
        Svg.FILTER,
        {
          'id': 'blocklyDebugFilter' + this.randomIdentifier,
          'height': '160%',
          'width': '180%',
          'y': '-30%',
          'x': '-40%',
        },
        this.defs,
      );
      // Set all gaussian blur pixels to 1 opacity before applying flood
      const debugComponentTransfer = dom.createSvgElement(
        Svg.FECOMPONENTTRANSFER,
        {'result': 'outBlur'},
        debugFilter,
      );
      dom.createSvgElement(
        Svg.FEFUNCA,
        {'type': 'table', 'tableValues': '0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1'},
        debugComponentTransfer,
      );
      // Color the highlight
      dom.createSvgElement(
        Svg.FEFLOOD,
        {
          'flood-color': '#ff0000',
          'flood-opacity': 0.5,
          'result': 'outColor',
        },
        debugFilter,
      );
      dom.createSvgElement(
        Svg.FECOMPOSITE,
        {
          'in': 'outColor',
          'in2': 'outBlur',
          'operator': 'in',
          'result': 'outGlow',
        },
        debugFilter,
      );
      this.debugFilterId = debugFilter.id;
      this.debugFilter = debugFilter;
    }
  }

  /**
   * Inject renderer specific CSS into the page.
   *
   * @param tagName The name of the style tag to use.
   * @param selector The CSS selector to use.
   */
  protected injectCSS_(tagName: string, selector: string) {
    const cssArray = this.getCSS_(selector);
    const cssNodeId = 'blockly-renderer-style-' + tagName;
    this.cssNode = document.getElementById(cssNodeId) as HTMLStyleElement;
    const text = cssArray.join('\n');
    if (this.cssNode) {
      // Already injected, update if the theme changed.
      this.cssNode.firstChild!.textContent = text;
      return;
    }
    // Inject CSS tag at start of head.
    const cssNode = document.createElement('style');
    cssNode.id = cssNodeId;
    const cssTextNode = document.createTextNode(text);
    cssNode.appendChild(cssTextNode);
    document.head.insertBefore(cssNode, document.head.firstChild);
    this.cssNode = cssNode;
  }

  /**
   * Get any renderer specific CSS to inject when the renderer is initialized.
   *
   * @param selector CSS selector to use.
   * @returns Array of CSS strings.
   */
  protected getCSS_(selector: string): string[] {
    // prettier-ignore
    return [
      // Text.
      `${selector} .blocklyText, `,
      `${selector} .blocklyFlyoutLabelText {`,
        `font: ${this.FIELD_TEXT_FONTWEIGHT} ` +
            `${this.FIELD_TEXT_FONTSIZE}pt ${this.FIELD_TEXT_FONTFAMILY};`,
      `}`,

      // Fields.
      `${selector} .blocklyText {`,
        `fill: #fff;`,
      `}`,
      `${selector} .blocklyNonEditableField>rect,`,
      `${selector} .blocklyEditableField>rect {`,
        `fill: ${this.FIELD_BORDER_RECT_COLOUR};`,
        `fill-opacity: .6;`,
        `stroke: none;`,
      `}`,
      `${selector} .blocklyNonEditableField>text,`,
      `${selector} .blocklyEditableField>text {`,
        `fill: #000;`,
      `}`,

      // Flyout labels.
      `${selector} .blocklyFlyoutLabelText {`,
        `fill: #000;`,
      `}`,

      // Bubbles.
      `${selector} .blocklyText.blocklyBubbleText {`,
        `fill: #000;`,
      `}`,

      // Editable field hover.
      `${selector} .blocklyEditableField:not(.blocklyEditing):hover>rect {`,
        `stroke: #fff;`,
        `stroke-width: 2;`,
      `}`,

      // Text field input.
      `${selector} .blocklyHtmlInput {`,
        `font-family: ${this.FIELD_TEXT_FONTFAMILY};`,
        `font-weight: ${this.FIELD_TEXT_FONTWEIGHT};`,
      `}`,

      // Selection highlight.
      `${selector} .blocklySelected>.blocklyPath {`,
        `stroke: #fc3;`,
        `stroke-width: 3px;`,
      `}`,

      // Connection highlight.
      `${selector} .blocklyHighlightedConnectionPath {`,
        `stroke: #fc3;`,
      `}`,

      // Replaceable highlight.
      `${selector} .blocklyReplaceable .blocklyPath {`,
        `fill-opacity: .5;`,
      `}`,
      `${selector} .blocklyReplaceable .blocklyPathLight,`,
      `${selector} .blocklyReplaceable .blocklyPathDark {`,
        `display: none;`,
      `}`,

      // Insertion marker.
      `${selector} .blocklyInsertionMarker>.blocklyPath {`,
        `fill-opacity: ${this.INSERTION_MARKER_OPACITY};`,
        `stroke: none;`,
      `}`,
    ];
  }
}
