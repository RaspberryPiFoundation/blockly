/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The class representing a theme.
 *
 * @class
 */
// Former goog.module ID: Blockly.Theme

import * as registry from './registry.js';
import * as object from './utils/object.js';

export interface ITheme {
  blockStyles?: {[key: string]: Partial<BlockStyle>};
  categoryStyles?: {[key: string]: CategoryStyle};
  componentStyles?: ComponentStyle;
  fontStyle?: FontStyle;
  startHats?: boolean;
  base?: string | Theme;
  name: string;
}

/**
 * Class for a theme.
 */
export class Theme implements ITheme {
  /** @internal */
  blockStyles: {[key: string]: BlockStyle};
  /** @internal */
  categoryStyles: {[key: string]: CategoryStyle};
  /** @internal */
  componentStyles: ComponentStyle;
  /** @internal */
  fontStyle: FontStyle;

  /**
   * Whether or not to add a 'hat' on top of all blocks with no previous or
   * output connections.
   *
   * @internal
   */
  startHats?: boolean = false;

  /**
   * @param name Theme name.
   * @param opt_blockStyles A map from style names (strings) to objects with
   *     style attributes for blocks.
   * @param opt_categoryStyles A map from style names (strings) to objects with
   *     style attributes for categories.
   * @param opt_componentStyles A map of Blockly component names to style value.
   */
  constructor(
    public name: string,
    opt_blockStyles?: {[key: string]: Partial<BlockStyle>},
    opt_categoryStyles?: {[key: string]: CategoryStyle},
    opt_componentStyles?: ComponentStyle,
  ) {
    /** The block styles map. */
    this.blockStyles = opt_blockStyles || Object.create(null);

    /** The category styles map. */
    this.categoryStyles = opt_categoryStyles || Object.create(null);

    /** The UI components styles map. */
    this.componentStyles =
      opt_componentStyles || (Object.create(null) as ComponentStyle);

    /** The font style. */
    this.fontStyle = Object.create(null) as FontStyle;

    // Register the theme by name.
    registry.register(registry.Type.THEME, name, this, true);
  }

  /**
   * Gets the class name that identifies this theme.
   *
   * @returns The CSS class name.
   * @internal
   */
  getClassName(): string {
    return this.name + '-theme';
  }

  /**
   * Overrides or adds a style to the blockStyles map.
   *
   * @param blockStyleName The name of the block style.
   * @param blockStyle The block style.
   */
  setBlockStyle(blockStyleName: string, blockStyle: BlockStyle) {
    this.blockStyles[blockStyleName] = blockStyle;
  }

  /**
   * Overrides or adds a style to the categoryStyles map.
   *
   * @param categoryStyleName The name of the category style.
   * @param categoryStyle The category style.
   */
  setCategoryStyle(categoryStyleName: string, categoryStyle: CategoryStyle) {
    this.categoryStyles[categoryStyleName] = categoryStyle;
  }

  /**
   * Gets the style for a given Blockly UI component.  If the style value is a
   * string, we attempt to find the value of any named references.
   *
   * @param componentName The name of the component.
   * @returns The style value.
   */
  getComponentStyle(componentName: string): string | null {
    const style = (this.componentStyles as AnyDuringMigration)[componentName];
    if (!style) {
      return null;
    }
    if (typeof style === 'string') {
      const recursiveStyle = this.getComponentStyle(style);
      if (recursiveStyle) {
        return recursiveStyle;
      }
    }
    return `${style}`;
  }

  /**
   * Configure a specific Blockly UI component with a style value.
   *
   * @param componentName The name of the component.
   * @param styleValue The style value.
   */
  setComponentStyle(componentName: string, styleValue: AnyDuringMigration) {
    (this.componentStyles as AnyDuringMigration)[componentName] = styleValue;
  }

  /**
   * Configure a theme's font style.
   *
   * @param fontStyle The font style.
   */
  setFontStyle(fontStyle: FontStyle) {
    this.fontStyle = fontStyle;
  }

  /**
   * Configure a theme's start hats.
   *
   * @param startHats True if the theme enables start hats, false otherwise.
   */
  setStartHats(startHats: boolean) {
    this.startHats = startHats;
  }

  /**
   * Define a new Blockly theme.
   *
   * @param name The name of the theme.
   * @param themeObj An object containing theme properties.
   * @returns A new Blockly theme.
   */
  static defineTheme(name: string, themeObj: ITheme): Theme {
    name = name.toLowerCase();
    const theme = new Theme(name);
    let base = themeObj['base'];
    if (base) {
      if (typeof base === 'string') {
        base = registry.getObject(registry.Type.THEME, base) ?? undefined;
      }
      if (base instanceof Theme) {
        object.deepMerge(theme, base);
        theme.name = name;
      }
    }

    object.deepMerge(theme.blockStyles, themeObj['blockStyles']);
    object.deepMerge(theme.categoryStyles, themeObj['categoryStyles']);
    object.deepMerge(theme.componentStyles, themeObj['componentStyles']);
    object.deepMerge(theme.fontStyle, themeObj['fontStyle']);
    if (themeObj['startHats'] !== null) {
      theme.startHats = themeObj['startHats'];
    }

    return theme;
  }
}

export namespace Theme {
  export interface BlockStyle {
    colourPrimary: string;
    colourSecondary: string;
    colourTertiary: string;
    hat: string;
  }

  export interface CategoryStyle {
    colour: string;
  }

  export interface ComponentStyle {
    workspaceBackgroundColour?: string;
    toolboxBackgroundColour?: string;
    toolboxForegroundColour?: string;
    flyoutBackgroundColour?: string;
    flyoutForegroundColour?: string;
    flyoutOpacity?: number;
    scrollbarColour?: string;
    scrollbarOpacity?: number;
    insertionMarkerColour?: string;
    insertionMarkerOpacity?: number;
    markerColour?: string;
    cursorColour?: string;
    selectedGlowColour?: string;
    selectedGlowOpacity?: number;
    replacementGlowColour?: string;
    replacementGlowOpacity?: number;
  }

  export interface FontStyle {
    family?: string;
    weight?: string;
    size?: number;
  }
}

export type BlockStyle = Theme.BlockStyle;
export type CategoryStyle = Theme.CategoryStyle;
export type ComponentStyle = Theme.ComponentStyle;
export type FontStyle = Theme.FontStyle;
